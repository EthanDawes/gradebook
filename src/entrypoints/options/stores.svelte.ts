import { defaultStorage, loadFromStorage, saveToStorage } from "~/assets/storage.js";
import type { Category, Course, Grade, Semester, Storage } from "~/assets/types.js";

// Memoization cache for expensive calculations
class CalculationCache {
  private courseGradeCache = new Map<
    string,
    { data: string; result: number }
  >();
  private categoryCache = new Map<string, { data: string; result: number }>();

  private getCourseKey(course: Course): string {
    return `${course.name}-${JSON.stringify(course.categories)}`;
  }

  private getCategoryKey(category: Category, type: "sum" | "average"): string {
    return `${category.name}-${type}-${JSON.stringify(category.grades)}-${category.weight}`;
  }

  getCourseGrade(course: Course, calculator: () => number): number {
    const key = this.getCourseKey(course);
    const cached = this.courseGradeCache.get(key);

    if (cached && cached.data === key) {
      return cached.result;
    }

    const result = calculator();
    this.courseGradeCache.set(key, { data: key, result });
    return result;
  }

  getCategoryCalculation(
    category: Category,
    type: "sum" | "average",
    calculator: () => number,
  ): number {
    const key = this.getCategoryKey(category, type);
    const cached = this.categoryCache.get(key);

    if (cached && cached.data === key) {
      return cached.result;
    }

    const result = calculator();
    this.categoryCache.set(key, { data: key, result });
    return result;
  }

  clear() {
    this.courseGradeCache.clear();
    this.categoryCache.clear();
  }

  clearCourse(course: Course) {
    const key = this.getCourseKey(course);
    this.courseGradeCache.delete(key);

    // Clear category caches for this course
    for (const category of course.categories) {
      const sumKey = this.getCategoryKey(category, "sum");
      const avgKey = this.getCategoryKey(category, "average");
      this.categoryCache.delete(sumKey);
      this.categoryCache.delete(avgKey);
    }
  }
}

class GradeStore {
  private storage = $state(defaultStorage);
  private backupStorage = $state<Storage | null>(null);
  private cache = new CalculationCache();

  currentSemester = $state<Semester | undefined>(this.storage.semesters.at(-1));
  selectedCourse = $state<Course | null>(null);
  whatIfMode = $state<boolean>(false);

  constructor() {
    loadFromStorage().then(data => this.storage = data);
  }

  get semesters() {
    return this.storage.semesters;
  }

  get gradeScales() {
    return this.storage.gradeScales;
  }

  private save() {
    if (!this.whatIfMode) {
      saveToStorage(this.storage);
    }
  }

  private invalidateCache() {
    this.cache.clear();
  }

  private invalidateCourseCache(course: Course) {
    this.cache.clearCourse(course);
  }

  enableWhatIfMode() {
    if (!this.whatIfMode) {
      // Create a deep copy of the current storage as backup
      this.backupStorage = JSON.parse(JSON.stringify(this.storage));
      this.whatIfMode = true;
    }
  }

  disableWhatIfMode() {
    if (this.whatIfMode && this.backupStorage) {
      // Restore from backup
      this.storage = this.backupStorage;
      this.backupStorage = null;
      this.whatIfMode = false;
      this.invalidateCache();

      // Update current references to point to restored data
      this.currentSemester =
        this.storage.semesters.find(
          (s) => s.name === this.currentSemester?.name,
        ) || this.storage.semesters[0];

      if (this.selectedCourse) {
        // Find the restored version of the selected course
        const restoredCourse = this.currentSemester?.courses.find(
          (c) => c.name === this.selectedCourse!.name,
        );
        this.selectedCourse = restoredCourse || null;
      }
    }
  }

  toggleWhatIfMode() {
    if (this.whatIfMode) {
      this.disableWhatIfMode();
    } else {
      this.enableWhatIfMode();
    }
  }

  setSemester(semester: Semester) {
    this.currentSemester = semester;
    this.selectedCourse = null;
  }

  setSelectedCourse(courseItem: Course) {
    // Avoid unnecessary updates if selecting the same course
    if (this.selectedCourse === courseItem) return;
    this.selectedCourse = courseItem;
  }

  calculateCourseGrade(courseItem: Course): number {
    return this.cache.getCourseGrade(courseItem, () => {
      let totalWeightedPoints = 0;
      let totalWeight = 0;

      for (const category of courseItem.categories) {
        if (category.grades.length === 0) continue;

        const categoryTotal = category.grades.reduce((sum, grade) => {
          if (
            grade.pointsEarned !== undefined &&
            grade.pointsPossible !== undefined &&
            grade.pointsPossible > 0
          ) {
            let gradePercentage = grade.pointsEarned / grade.pointsPossible;

            // Apply curve if both course curve and grade class average are set
            if (
              courseItem.curve &&
              courseItem.curve !== "" &&
              grade.classAverage !== undefined
            ) {
              const curveCutoff = courseItem.gradeCutoffs[courseItem.curve];
              if (curveCutoff !== undefined) {
                const curveAdjustment =
                  (curveCutoff - grade.classAverage) / 100;
                gradePercentage = Math.min(
                  1,
                  gradePercentage + curveAdjustment,
                );
              }
            }

            return sum + gradePercentage;
          }
          return sum;
        }, 0);

        const validGrades = category.grades.filter(
          (grade) =>
            grade.pointsEarned !== undefined &&
            grade.pointsPossible !== undefined &&
            grade.pointsPossible > 0,
        );

        const categoryAverage =
          validGrades.length > 0 ? categoryTotal / validGrades.length : 0;

        totalWeightedPoints += categoryAverage * category.weight;
        totalWeight += category.weight;
      }

      return totalWeight > 0 ? (totalWeightedPoints / totalWeight) * 100 : 0;
    });
  }

  getLetterGrade(
    percentage: number,
    gradeCutoffs: Record<string, number>,
  ): string {
    const sortedGrades = Object.entries(gradeCutoffs).sort(
      ([, a], [, b]) => b - a,
    );

    for (const [letter, cutoff] of sortedGrades) {
      if (percentage >= cutoff) {
        return letter;
      }
    }
    return "F";
  }

  calculateCategorySum(category: Category): number {
    return this.cache.getCategoryCalculation(category, "sum", () => {
      if (category.grades.length === 0) return 0;

      const validGrades = category.grades.filter(
        (grade) =>
          grade.pointsEarned !== undefined &&
          grade.pointsPossible !== undefined &&
          grade.pointsPossible > 0,
      );

      if (validGrades.length === 0) return 0;

      const weightPerAssignment = category.weight / validGrades.length;
      let totalWeightEarned = 0;

      for (const grade of validGrades) {
        const gradePercentage = grade.pointsEarned! / grade.pointsPossible!;
        totalWeightEarned += gradePercentage * weightPerAssignment;
      }

      return totalWeightEarned * 100;
    });
  }

  calculateCategoryAverage(category: Category): number {
    return this.cache.getCategoryCalculation(category, "average", () => {
      if (category.grades.length === 0) return 0;

      const validGrades = category.grades.filter(
        (grade) =>
          grade.pointsEarned !== undefined &&
          grade.pointsPossible !== undefined &&
          grade.pointsPossible > 0,
      );

      if (validGrades.length === 0) return 0;

      const total = validGrades.reduce(
        (sum, grade) => sum + grade.pointsEarned! / grade.pointsPossible!,
        0,
      );

      return (total / validGrades.length) * 100;
    });
  }

  updateGrade(
    categoryIndex: number,
    gradeIndex: number,
    field: keyof Grade,
    value: any,
  ) {
    if (!this.selectedCourse) return;

    const grade =
      this.selectedCourse.categories[categoryIndex].grades[gradeIndex];
    (grade as any)[field] = value;

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  updateCategory(categoryIndex: number, field: keyof Category, value: any) {
    if (!this.selectedCourse) return;

    const category = this.selectedCourse.categories[categoryIndex];
    (category as any)[field] = value;

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  addGrade(categoryIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.push({
      source: "New Assignment",
    });

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  removeGrade(categoryIndex: number, gradeIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.splice(gradeIndex, 1);

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  addCategory() {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories.push({
      name: "New Category",
      weight: 0.1,
      grades: [],
    });

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  removeCategory(categoryIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories.splice(categoryIndex, 1);

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  updateCourseGradeScale(newGradeScale: string) {
    if (!this.selectedCourse) return;

    this.selectedCourse.gradeScale = newGradeScale;

    // Reset grade cutoffs when scale changes
    const scale = this.gradeScales.find((s) => s.name === newGradeScale);
    if (scale) {
      // Preserve existing cutoffs if they exist, otherwise use defaults
      const existingCutoffs = { ...this.selectedCourse.gradeCutoffs };
      this.selectedCourse.gradeCutoffs = {};

      // Set default cutoffs based on common grading scale
      const defaultCutoffs: Record<string, number> = {
        "A+": 97,
        A: 93,
        "A-": 90,
        "B+": 87,
        B: 83,
        "B-": 80,
        "C+": 77,
        C: 73,
        "C-": 70,
        "D+": 67,
        D: 63,
        "D-": 60,
        F: 0,
      };

      for (const grade of scale.scale) {
        this.selectedCourse.gradeCutoffs[grade] =
          existingCutoffs[grade] ?? defaultCutoffs[grade] ?? 0;
      }

      // Curve is disabled by default
      this.selectedCourse.curve = undefined;
    }

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  updateGradeCutoff(grade: string, cutoff: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.gradeCutoffs[grade] = cutoff;

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  updateCourseCurve(curve: string) {
    if (!this.selectedCourse) return;

    this.selectedCourse.curve = curve || undefined;

    // Invalidate cache for this course since data changed
    this.invalidateCourseCache(this.selectedCourse);
    this.save();
  }

  addCourse() {
    const defaultGradeScale = this.gradeScales[0];
    const defaultCutoffs: Record<string, number> = {
      "A+": 97,
      A: 93,
      "A-": 90,
      "B+": 87,
      B: 83,
      "B-": 80,
      "C+": 77,
      C: 73,
      "C-": 70,
      "D+": 67,
      D: 63,
      "D-": 60,
      F: 0,
    };

    const newCourse: Course = {
      name: prompt("Enter Course Name") ?? "New Course",
      categories: [],
      associations: [],
      gradeScale: defaultGradeScale.name,
      gradeCutoffs: {},
    };

    // Set grade cutoffs based on the default grade scale
    for (const grade of defaultGradeScale.scale) {
      newCourse.gradeCutoffs[grade] = defaultCutoffs[grade] ?? 0;
    }

    this.currentSemester?.courses.push(newCourse);
    this.selectedCourse = newCourse;
    this.save();
  }

  addSemester() {
    const semesterName = prompt("Enter Semester Name (e.g., Spring 2025)");
    if (!semesterName) return; // User cancelled

    // Check if semester name already exists
    if (this.storage.semesters.some((s) => s.name === semesterName)) {
      alert("A semester with this name already exists.");
      return;
    }

    // Generate suggested dates
    const suggestedStart = new Date();
    suggestedStart.setUTCDate(1);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    // Prompt for start date
    const startDateStr = prompt(
      `Enter start date (YYYY-MM-DD)\nSuggested: ${formatDate(suggestedStart)}`,
      formatDate(suggestedStart),
    );
    if (!startDateStr) return; // User cancelled

    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      alert("Invalid start date format. Please use YYYY-MM-DD format.");
      return;
    }

    // Calculate suggested end date based on start date
    const calculatedEnd = new Date(startDate);
    calculatedEnd.setMonth(calculatedEnd.getMonth() + 4);

    // Prompt for end date
    const endDateStr = prompt(
      `Enter end date (YYYY-MM-DD)\nSuggested: ${formatDate(calculatedEnd)}`,
      formatDate(calculatedEnd),
    );
    if (!endDateStr) return; // User cancelled

    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      alert("Invalid end date format. Please use YYYY-MM-DD format.");
      return;
    }

    if (endDate <= startDate) {
      alert("End date must be after start date.");
      return;
    }

    const newSemester: Semester = {
      name: semesterName,
      start: startDate.getTime(),
      end: endDate.getTime(),
      courses: [],
    };

    this.storage.semesters.push(newSemester);
    this.currentSemester = newSemester;
    this.selectedCourse = null;
    this.save();
  }

  removeSemester(semester: Semester) {
    if (this.storage.semesters.length <= 1) {
      alert("Cannot delete the last semester");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${semester.name}"? This will permanently delete all courses and grades in this semester.`,
    );
    if (!confirmed) return;

    const index = this.storage.semesters.indexOf(semester);
    if (index === -1) return;

    this.storage.semesters.splice(index, 1);

    // If we deleted the current semester, switch to the first available one
    if (this.currentSemester === semester) {
      this.currentSemester = this.storage.semesters[0];
      this.selectedCourse = null;
    }

    this.invalidateCache();
    this.save();
  }

  initializeCourseDefaults(course: Course) {
    // Set curve to grade scale's average if not already set
    if (!course.curve) {
      const gradeScale = this.gradeScales.find(
        (scale) => scale.name === course.gradeScale,
      );
      if (gradeScale) {
        //course.curve = gradeScale.average;
        this.save();
      }
    }
  }
}

export const gradeStore = new GradeStore();
