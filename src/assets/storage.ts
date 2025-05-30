import { mockGradeScales } from "./mocks";
import type { Storage } from "./types";

export const defaultStorage: Storage = {
  gradeScales: mockGradeScales,
  semesters: [],
};

export async function loadFromStorage(): Promise<Storage> {
  const stored = (await browser.storage.local.get("storage")).storage;
  return stored ? JSON.parse(stored) : Promise.resolve(defaultStorage);
}

window.loadFromStorage = loadFromStorage;

export function saveToStorage(data: Storage) {
  // Even though chrome storage can handle raw objects, it converts arrays to objects, no good.
  browser.storage.local.set({ storage: JSON.stringify(data) });
}
