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

            const categoryTotal = category.grades.reduce((sum, grade) =>
                sum + (grade.pointsEarned / grade.pointsPossible), 0
            );
            const categoryAverage = categoryTotal / category.grades.length;

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
            pointsEarned: 0,
            pointsPossible: 100,
            classAverage: 0.85
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
}

export const gradeStore = new GradeStore();