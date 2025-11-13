import {
  defaultStorage,
  loadFromStorage,
  saveToStorage,
} from "~/assets/storage.js";
import type {
  Category,
  Course,
  Grade,
  Semester,
  Storage,
} from "~/assets/types.js";

class GradeStore {
  private storage = $state(defaultStorage);
  private backupStorage = $state<Storage>();

  public readonly semesters = $derived(this.storage.semesters);
  public readonly gradeScales = $derived(this.storage.gradeScales);
  public readonly ready: Promise<void>;
  currentSemester = $state<Semester>();
  selectedCourse = $state<Course>();
  whatIfMode = $state<boolean>(false);

  constructor() {
    this.ready = loadFromStorage().then((data) => {
      this.storage = data;
      this.currentSemester = this.storage.semesters.at(-1);
    });
  }

  private save() {
    if (!this.whatIfMode) {
      saveToStorage($state.snapshot(this.storage));
    }
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
      this.backupStorage = undefined;
      this.whatIfMode = false;

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
        this.selectedCourse = restoredCourse;
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

  isGradeInputDisabled(
    courseName: string,
    categoryIndex: number,
    gradeIndex: number,
  ): boolean {
    if (!this.whatIfMode || !this.backupStorage) {
      return false;
    }

    // Find the original grade in backup storage
    const backupSemester = this.backupStorage.semesters.find(
      (s) => s.name === this.currentSemester?.name,
    );
    const backupCourse = backupSemester?.courses.find(
      (c) => c.name === courseName,
    );
    const originalGrade =
      backupCourse?.categories[categoryIndex]?.grades[gradeIndex];

    // Disable if the grade had values in the original data
    return !!(
      originalGrade &&
      originalGrade.pointsEarned &&
      originalGrade.pointsPossible
    );
  }

  setSemester(semester: Semester | undefined) {
    this.currentSemester = semester;
    this.selectedCourse = undefined;
  }

  setSelectedCourse(courseItem: Course | undefined) {
    // Avoid unnecessary updates if selecting the same course
    if (this.selectedCourse?.name === courseItem?.name) return;
    this.selectedCourse = courseItem;
  }

  calculateCourseGrade(courseItem: Course): number {
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
              const curveAdjustment = (curveCutoff - grade.classAverage) / 100;
              gradePercentage = Math.min(1, gradePercentage + curveAdjustment);
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

      if (validGrades.length > 0) {
        const categoryAverage = categoryTotal / validGrades.length;
        totalWeightedPoints += categoryAverage * category.weight;
        totalWeight += category.weight;
      }
    }

    return totalWeight > 0 ? (totalWeightedPoints / totalWeight) * 100 : 0;
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

  calculateRawPoints(category: Category): number {
    if (category.grades.length === 0) return 0;

    return category.grades.reduce(
      (sum, grade) => sum + (grade.pointsEarned || 0),
      0,
    );
  }

  calculateRawPointsPossible(category: Category): number {
    if (category.grades.length === 0) return 0;

    return category.grades.reduce(
      (sum, grade) =>
        // Only include points possible if has points earned
        sum +
        (grade.pointsEarned !== undefined ? grade.pointsPossible || 0 : 0),
      0,
    );
  }

  calculateRawPointsPossibleEver(category: Category): number {
    if (category.grades.length === 0) return 0;

    return category.grades.reduce(
      (sum, grade) =>
        // Contrary to `calculateRawPointsPossible`, this includes assignments with no recorded earned score
        sum + (grade.pointsPossible || 0),
      0,
    );
  }

  calculateCategorySum(category: Category): number {
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
  }

  calculateCategoryAverage(category: Category): number {
    return (
      (gradeStore.calculateRawPoints(category) /
        gradeStore.calculateRawPointsPossible(category)) *
      100
    );
  }

  updateGrade<T extends keyof Grade>(
    categoryIndex: number,
    gradeIndex: number,
    field: T,
    value: Grade[T],
  ) {
    if (!this.selectedCourse) return;

    const grade =
      this.selectedCourse.categories[categoryIndex].grades[gradeIndex];
    grade[field] = value;

    this.save();
  }

  updateCategory(categoryIndex: number, field: keyof Category, value: any) {
    if (!this.selectedCourse) return;

    const category = this.selectedCourse.categories[categoryIndex];
    (category as any)[field] = value;

    this.save();
  }

  addGrade(
    categoryIndex: number,
    grade: Grade = {
      title: "New Assignment",
    },
  ) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.push(grade);

    this.save();
  }

  removeGrade(categoryIndex: number, gradeIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.splice(gradeIndex, 1);

    this.save();
  }

  addCategory(name?: string) {
    if (!this.selectedCourse || !name) return;

    this.selectedCourse.categories.push({
      name,
      weight: 0.1,
      grades: [],
    });

    this.save();
  }

  removeCategory(categoryIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories.splice(categoryIndex, 1);

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

    this.save();
  }

  updateGradeCutoff(grade: string, cutoff: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.gradeCutoffs[grade] = cutoff;
    this.save();
  }

  updateCourseCurve(curve: string) {
    if (!this.selectedCourse) return;

    this.selectedCourse.curve = curve || undefined;
    this.save();
  }

  addCourseAssociation(url: string) {
    if (!this.selectedCourse) return;

    this.selectedCourse.associations.push(url);
    this.save();
  }

  removeCourseAssociation(url: string) {
    if (!this.selectedCourse) return;

    this.selectedCourse.associations.splice(
      this.selectedCourse.associations.indexOf(url),
      1,
    );
    this.save();
  }

  addCourse() {
    if (!this.currentSemester && !this.addSemester()) return; // User canceled

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

    const name = prompt("Enter Course Name");
    if (!name) return;
    const newCourse: Course = {
      name,
      categories: [],
      associations: [],
      gradeScale: defaultGradeScale.name,
      gradeCutoffs: {},
    };

    // Set grade cutoffs based on the default grade scale
    for (const grade of defaultGradeScale.scale) {
      newCourse.gradeCutoffs[grade] = defaultCutoffs[grade] ?? 0;
    }

    this.currentSemester!.courses.push(newCourse);
    // Must get from currentSemester instead of simply `newCourse` to ensure the reference is correct
    this.selectedCourse = this.currentSemester!.courses.at(-1);
    this.save();
  }

  addSemester() {
    const semesterName = prompt("Enter Semester Name (e.g., Spring 2025)");
    if (!semesterName) return false; // User cancelled

    // Check if semester name already exists
    if (this.storage.semesters.some((s) => s.name === semesterName)) {
      alert("A semester with this name already exists.");
      return false;
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
    if (!startDateStr) return false; // User cancelled

    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      alert("Invalid start date format. Please use YYYY-MM-DD format.");
      return false;
    }

    // Calculate suggested end date based on start date
    const calculatedEnd = new Date(startDate);
    calculatedEnd.setMonth(calculatedEnd.getMonth() + 4);

    // Prompt for end date
    const endDateStr = prompt(
      `Enter end date (YYYY-MM-DD)\nSuggested: ${formatDate(calculatedEnd)}`,
      formatDate(calculatedEnd),
    );
    if (!endDateStr) return false; // User cancelled

    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      alert("Invalid end date format. Please use YYYY-MM-DD format.");
      return false;
    }

    if (endDate <= startDate) {
      alert("End date must be after start date.");
      return false;
    }

    const newSemester: Semester = {
      name: semesterName,
      start: startDate.getTime(),
      end: endDate.getTime(),
      courses: [],
    };

    this.storage.semesters.push(newSemester);
    this.currentSemester = this.storage.semesters.at(-1);
    this.selectedCourse = undefined;
    this.save();
    return true;
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

    const index = this.storage.semesters.findIndex(
      (s) => s.name === semester.name,
    );
    if (index === -1) return;

    this.storage.semesters.splice(index, 1);

    // If we deleted the current semester, switch to the first available one
    if (this.currentSemester?.name === semester.name) {
      this.currentSemester = this.storage.semesters.at(-1);
      this.selectedCourse = undefined;
    }

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
