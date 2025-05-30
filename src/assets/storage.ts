import { mockGradeScales } from "./mocks";
import type { Storage } from "./types";

export const defaultStorage: Storage = {
  gradeScales: mockGradeScales,
  semesters: [],
};

export async function loadFromStorage(): Promise<Storage> {
  const stored = (await browser.storage.local.get("storage")).storage;
  return stored || Promise.resolve(defaultStorage);
}

window.loadFromStorage = loadFromStorage;

// MUSTN'T be passed a proxy (will convert arrays to objects)
export function saveToStorage(data: Storage) {
  browser.storage.local.set({ storage: data });
}
