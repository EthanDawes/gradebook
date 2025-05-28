// Mock data
import type { GradeScale } from "$lib/types";

export const mockGradeScales: GradeScale[] = [
  {
    name: "ABCDF +/-",
    scale: [
      "A+",
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D+",
      "D",
      "D-",
      "F",
    ],
    average: "B-",
  },
  {
    name: "ABCDF",
    scale: ["A", "B", "C", "D", "F"],
    average: "C",
  },
];
