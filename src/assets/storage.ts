import { mockGradeScales } from "@/entrypoints/options/mocks";
import type { Storage } from "./types";


export function loadFromStorage(): Storage {
  const stored = localStorage.getItem("grade-tracker-data");
  if (stored) {
    return JSON.parse(stored);
  }

  return { gradeScales: mockGradeScales, semesters: [] };
}
export function saveToStorage(data: Storage) {
  localStorage.setItem("grade-tracker-data", JSON.stringify(data));
}
