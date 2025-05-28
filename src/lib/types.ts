interface Semester {
    // Example: Spring 2025
    name: string,
    // Date
    start: number,
    // Date
    end: number,
    classes: Class[],
}

interface Class {
    name: string,
    categories: Category[],
    // List of URLs where class grades are posted
    associations: string[],
    // grade scale name
    gradeScale: string,
    // Letter grade to decimal percentage
    gradeCuttofs: Record<string, number>,
    // grade from gradeScale that represents the grade the average will be curved to
    curve?: string,
}

interface Category {
    name: string,
    // Decimal percentage
    weight: number,
    grades: Grade[],
}

interface Grade {
    // URL
    source: string,
    // Date
    due?: number,
    // Date
    released?: number,
    pointsEarned: number,
    pointsPossible: number,
    // Decimal percentage
    classAverage?: number,
}

interface GradeScale {
    name: string,
    scale: string[],
    average: string,
}

// Don't sync b/c 8kb is not enough for even 1 semester (see data mocks)
interface Storage {
    gradeScales: GradeScale[],
    semesters: Semester[],
}
