// Mock data
import type {GradeScale, Semester} from "$lib/types";

export const mockGradeScales: GradeScale[] = [
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
export const mockSemesters: Semester[] = [
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