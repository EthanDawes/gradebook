import type {Semester, GradeScale, Course, Storage, Grade, Category} from './types.js';
import { browser } from '$app/environment';

// Mock data
const mockGradeScales: GradeScale[] = [
    {
        name: 'ABCDF +/-',
        scale: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
        average: 'B-'
    },
    {
        name: 'ABCDF',
        scale: ['A', 'B', 'C', 'D', 'F'],
        average: 'B'
    }
];

const mockSemesters: Semester[] = [
    {
        name: 'Spring 2025',
        start: Date.now() - 86400000 * 60,
        end: Date.now() + 86400000 * 60,
        courses: [
            {
                name: 'CS 307 Software Engineering',
                gradeScale: 'ABCDF +/-',
                gradeCutoffs: {
                    'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
                    'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 0
                },
                associations: [],
                categories: [
                    {
                        name: 'Quizzes',
                        weight: 0.10,
                        grades: [
                            {
                                source: 'Poetry Terms',
                                pointsEarned: 9,
                                pointsPossible: 10,
                                classAverage: 0.85
                            }
                        ]
                    },
                    {
                        name: 'Bonus Quiz (Bonus)',
                        weight: 0,
                        grades: [
                            {
                                source: 'Extra Credit',
                                pointsEarned: 0,
                                pointsPossible: 2,
                                classAverage: 0.60
                            }
                        ]
                    },
                    {
                        name: 'Discussions',
                        weight: 0.15,
                        grades: []
                    },
                    {
                        name: 'Peer Review',
                        weight: 0.10,
                        grades: [
                            {
                                source: 'Poem Draft',
                                pointsEarned: 0,
                                pointsPossible: 10,
                                classAverage: 0.75
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: 'Fall 2024',
        start: Date.now() - 86400000 * 150,
        end: Date.now() - 86400000 * 30,
        courses: [
            {
                name: 'Math 201 Calculus II',
                gradeScale: 'ABCDF +/-',
                gradeCutoffs: {
                    'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
                    'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 0
                },
                associations: [],
                categories: [
                    {
                        name: 'Exams',
                        weight: 0.60,
                        grades: [
                            {
                                source: 'Midterm 1',
                                pointsEarned: 85,
                                pointsPossible: 100,
                                classAverage: 0.78
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

function loadFromStorage(): Storage {
    if (!browser) return { gradeScales: mockGradeScales, semesters: mockSemesters };

    try {
        const stored = localStorage.getItem('grade-tracker-data');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }

    return { gradeScales: mockGradeScales, semesters: mockSemesters };
}

function saveToStorage(data: Storage) {
    if (!browser) return;

    try {
        localStorage.setItem('grade-tracker-data', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

class GradeStore {
    private storage = $state<Storage>(loadFromStorage());
    currentSemester = $state<Semester>(this.storage.semesters[0]);
    selectedClass = $state<Course | null>(null);

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
        this.selectedClass = null;
    }

    setSelectedClass(classItem: Course) {
        this.selectedClass = classItem;
    }

    calculateClassGrade(classItem: Course): number {
        let totalWeightedPoints = 0;
        let totalWeight = 0;

        for (const category of classItem.categories) {
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
        if (!this.selectedClass) return;

        const grade = this.selectedClass.categories[categoryIndex].grades[gradeIndex];
        (grade as any)[field] = value;
        this.save();
    }

    updateCategory(categoryIndex: number, field: keyof Category, value: any) {
        if (!this.selectedClass) return;

        const category = this.selectedClass.categories[categoryIndex];
        (category as any)[field] = value;
        this.save();
    }

    addGrade(categoryIndex: number) {
        if (!this.selectedClass) return;

        this.selectedClass.categories[categoryIndex].grades.push({
            source: 'New Assignment',
            pointsEarned: 0,
            pointsPossible: 100,
            classAverage: 0.85
        });
        this.save();
    }

    removeGrade(categoryIndex: number, gradeIndex: number) {
        if (!this.selectedClass) return;

        this.selectedClass.categories[categoryIndex].grades.splice(gradeIndex, 1);
        this.save();
    }

    addCategory() {
        if (!this.selectedClass) return;

        this.selectedClass.categories.push({
            name: 'New Category',
            weight: 0.1,
            grades: []
        });
        this.save();
    }
}

export const gradeStore = new GradeStore();