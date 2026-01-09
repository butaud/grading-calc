import { useState, useEffect } from 'react';
import type { Student, Assignment, Grade, LetterGrade } from './types';
import { runMigrations, CURRENT_VERSION, type AppData } from './migrations';

const APP_DATA_KEY = 'grading-calc-data';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = window.localStorage.getItem(APP_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Run migrations on stored data
        const migrated = runMigrations(parsed);
        return migrated;
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }

    // Return initial empty data with current version
    return {
      version: CURRENT_VERSION,
      students: [],
      assignments: [],
      grades: [],
      letterGrades: []
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [data]);

  const setStudents = (students: Student[]) => {
    setData(prev => ({ ...prev, students }));
  };

  const setAssignments = (assignments: Assignment[]) => {
    setData(prev => ({ ...prev, assignments }));
  };

  const setGrades = (grades: Grade[]) => {
    setData(prev => ({ ...prev, grades }));
  };

  const setLetterGrades = (letterGrades: LetterGrade[]) => {
    setData(prev => ({ ...prev, letterGrades }));
  };

  const importData = (importedData: any) => {
    // Run migrations on imported data
    const migrated = runMigrations(importedData);
    setData(migrated);
  };

  return {
    students: data.students,
    assignments: data.assignments,
    grades: data.grades,
    letterGrades: data.letterGrades,
    version: data.version,
    setStudents,
    setAssignments,
    setGrades,
    setLetterGrades,
    importData
  };
}
