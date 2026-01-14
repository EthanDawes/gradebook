export interface Semester {
  // Example: Spring 2025
  name: string;
  // Date
  start: number;
  // Date
  end: number;
  courses: Course[];
}

export interface Course {
  name: string;
  categories: Category[];
  // List of URLs where class grades are posted
  associations: string[];
  // grade scale name
  gradeScale: string;
  // Letter grade to decimal percentage
  gradeCutoffs: Record<string, number>;
  // grade from gradeScale that represents the grade the average will be curved to
  curve?: string;
}

export interface Category {
  name: string;
  // Decimal percentage
  weight: number;
  grades: Grade[];
  // Number of assignments in the category that will be dropped
  drops?: number;
}

export interface Grade {
  title: string;
  // URL
  source?: string;
  // Date
  due?: number;
  // Date score made available
  released?: number;
  pointsEarned?: number;
  pointsPossible?: number;
  // Decimal percentage
  classAverage?: number;
}

export interface GradeScale {
  name: string;
  scale: string[];
  average: string;
}

// Don't sync b/c 8kb is not enough for even 1 semester (see data mocks)
export interface Storage {
  gradeScales: GradeScale[];
  semesters: Semester[];
}
