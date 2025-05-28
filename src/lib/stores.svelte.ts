import type {Category, Course, Grade, Semester, Storage} from './types.js';
import {mockGradeScales, mockSemesters} from "$lib/mocks";

function loadFromStorage(): Storage {
    const stored = localStorage.getItem('grade-tracker-data');
    if (stored) {
        return JSON.parse(stored);
    }

    return { gradeScales: mockGradeScales, semesters: mockSemesters };
}

function saveToStorage(data: Storage) {
    localStorage.setItem('grade-tracker-data', JSON.stringify(data));
}

class GradeStore {
    private storage = $state<Storage>(loadFromStorage());
    currentSemester = $state<Semester>(this.storage.semesters[0]);
    selectedCourse = $state<Course | null>(null);

    get semesters() {
        return this.storage.semesters;
    }

    get gradeScales() {
        return this.storage.gradeScales;
    }

    private save() {
        saveToStorage(this.storage);
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
                if (grade.pointsEarned !== undefined && grade.pointsPossible !== undefined && grade.pointsPossible > 0) {
                    return sum + (grade.pointsEarned / grade.pointsPossible);
                }
                return sum;
            }, 0);
            const validGrades = category.grades.filter(grade => 
                grade.pointsEarned !== undefined && grade.pointsPossible !== undefined && grade.pointsPossible > 0
            );
            const categoryAverage = validGrades.length > 0 ? categoryTotal / validGrades.length : 0;

            totalWeightedPoints += categoryAverage * category.weight;
            totalWeight += category.weight;
        }

        return totalWeight > 0 ? (totalWeightedPoints / totalWeight) * 100 : 0;
    }

    getLetterGrade(percentage: number, gradeCutoffs: Record<string, number>): string {
        const sortedGrades = Object.entries(gradeCutoffs)
            .sort(([,a], [,b]) => b - a);

        for (const [letter, cutoff] of sortedGrades) {
            if (percentage >= cutoff) {
                return letter;
            }
        }
        return 'F';
    }

    calculateCategorySum(category: Category): number {
        if (category.grades.length === 0) return 0;
        
        const validGrades = category.grades.filter(grade => 
            grade.pointsEarned !== undefined && grade.pointsPossible !== undefined && grade.pointsPossible > 0
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

        const validGrades = category.grades.filter(grade => 
            grade.pointsEarned !== undefined && grade.pointsPossible !== undefined && grade.pointsPossible > 0
        );

        if (validGrades.length === 0) return 0;

        const total = validGrades.reduce((sum, grade) =>
            sum + (grade.pointsEarned! / grade.pointsPossible!), 0
        );

        return (total / validGrades.length) * 100;
    }

    updateGrade(categoryIndex: number, gradeIndex: number, field: keyof Grade, value: any) {
        if (!this.selectedCourse) return;

        const grade = this.selectedCourse.categories[categoryIndex].grades[gradeIndex];
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
            source: 'New Assignment',
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
            name: 'New Category',
            weight: 0.1,
            grades: []
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
        const scale = this.gradeScales.find(s => s.name === newGradeScale);
        if (scale) {
            // Preserve existing cutoffs if they exist, otherwise use defaults
            const existingCutoffs = { ...this.selectedCourse.gradeCutoffs };
            this.selectedCourse.gradeCutoffs = {};
            
            // Set default cutoffs based on common grading scale
            const defaultCutoffs: Record<string, number> = {
                'A+': 97, 'A': 93, 'A-': 90,
                'B+': 87, 'B': 83, 'B-': 80,
                'C+': 77, 'C': 73, 'C-': 70,
                'D+': 67, 'D': 63, 'D-': 60,
                'F': 0
            };
            
            for (const grade of scale.scale) {
                this.selectedCourse.gradeCutoffs[grade] = existingCutoffs[grade] ?? defaultCutoffs[grade] ?? 0;
            }
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

        this.selectedCourse.curve = curve;
        this.save();
    }
}

export const gradeStore = new GradeStore();