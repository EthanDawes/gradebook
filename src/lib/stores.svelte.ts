import type { Category, Course, Grade, Semester, Storage } from "./types.js";
import { mockGradeScales, mockSemesters } from "$lib/mocks";

function loadFromStorage(): Storage {
  const stored = localStorage.getItem("grade-tracker-data");
  if (stored) {
    return JSON.parse(stored);
  }

  return { gradeScales: mockGradeScales, semesters: mockSemesters };
}

function saveToStorage(data: Storage) {
  localStorage.setItem("grade-tracker-data", JSON.stringify(data));
}

class GradeStore {
  private storage = $state<Storage>(loadFromStorage());
  private backupStorage = $state<Storage | null>(null);
  currentSemester = $state<Semester>(this.storage.semesters[0]);
  selectedCourse = $state<Course | null>(null);
  whatIfMode = $state<boolean>(false);

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

      // Update current references to point to restored data
      this.currentSemester =
        this.storage.semesters.find(
          (s) => s.name === this.currentSemester.name,
        ) || this.storage.semesters[0];

      if (this.selectedCourse) {
        // Find the restored version of the selected course
        const restoredCourse = this.currentSemester.courses.find(
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
          return sum + grade.pointsEarned / grade.pointsPossible;
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
    this.save();
  }

  updateCategory(categoryIndex: number, field: keyof Category, value: any) {
    if (!this.selectedCourse) return;

    const category = this.selectedCourse.categories[categoryIndex];
    (category as any)[field] = value;
    this.save();
  }

  addGrade(categoryIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.push({
      source: "New Assignment",
    });
    this.save();
  }

  removeGrade(categoryIndex: number, gradeIndex: number) {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories[categoryIndex].grades.splice(gradeIndex, 1);
    this.save();
  }

  addCategory() {
    if (!this.selectedCourse) return;

    this.selectedCourse.categories.push({
      name: "New Category",
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

    this.currentSemester.courses.push(newCourse);
    this.selectedCourse = newCourse;
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
