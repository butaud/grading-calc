import type { LetterGrade, Class } from './types';
import { generateId } from './utils';

export const CURRENT_VERSION = 2;

export interface AppData {
  version: number;
  classes: Class[];
  letterGrades: LetterGrade[];
}

type Migration = (data: any) => any;

// Migration 0 -> 1: Add version number if it doesn't exist
const migration0to1: Migration = (data: any) => {
  // If data already has a version, it doesn't need this migration
  if (data.version !== undefined) {
    return data;
  }

  // Add version number to data that doesn't have one
  return {
    version: 1,
    students: data.students || [],
    assignments: data.assignments || [],
    grades: data.grades || [],
    letterGrades: data.letterGrades || []
  };
};

// Migration 1 -> 2: Move students, assignments, and grades into classes
const migration1to2: Migration = (data: any) => {
  // If data already has classes, it's already migrated
  if (data.classes !== undefined) {
    return data;
  }

  // Create a default class with existing data
  const defaultClass: Class = {
    id: generateId(),
    name: 'My first class',
    students: data.students || [],
    assignments: data.assignments || [],
    grades: data.grades || []
  };

  return {
    version: 2,
    classes: [defaultClass],
    letterGrades: data.letterGrades || []
  };
};

// Array of migrations in order
const migrations: Migration[] = [
  migration0to1,
  migration1to2
];

/**
 * Runs all necessary migrations to bring data up to the current version
 */
export function runMigrations(data: any): AppData {
  let currentData = data;
  const startVersion = currentData.version ?? 0;

  // Run each migration starting from the current version
  for (let i = startVersion; i < CURRENT_VERSION; i++) {
    if (migrations[i]) {
      currentData = migrations[i](currentData);
    }
  }

  return currentData;
}

/**
 * Validates that data has the correct structure for the current version
 */
export function validateData(data: any): data is AppData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.version === 'number' &&
    Array.isArray(data.classes) &&
    Array.isArray(data.letterGrades)
  );
}
