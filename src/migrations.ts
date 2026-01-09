import type { Student, Assignment, Grade, LetterGrade } from './types';

export const CURRENT_VERSION = 1;

export interface AppData {
  version: number;
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
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

// Array of migrations in order
const migrations: Migration[] = [
  migration0to1
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
    Array.isArray(data.students) &&
    Array.isArray(data.assignments) &&
    Array.isArray(data.grades) &&
    Array.isArray(data.letterGrades)
  );
}
