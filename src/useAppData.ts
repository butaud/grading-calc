import { useState, useEffect, useRef } from 'react';
import type { Class, LetterGrade } from './types';
import { runMigrations, CURRENT_VERSION, type AppData } from './migrations';
import { generateId } from './utils';

const APP_DATA_KEY = 'grading-calc-data';
const MAX_HISTORY = 50;

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      // First, check if there's data in the new unified key
      const stored = window.localStorage.getItem(APP_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Run migrations on stored data
        const migrated = runMigrations(parsed);
        return migrated;
      }

      // If no data in new key, check for old individual keys
      const oldStudents = window.localStorage.getItem('students');
      const oldAssignments = window.localStorage.getItem('assignments');
      const oldGrades = window.localStorage.getItem('grades');
      const oldLetterGrades = window.localStorage.getItem('letterGrades');

      // If any old data exists, migrate it
      if (oldStudents || oldAssignments || oldGrades || oldLetterGrades) {
        const oldData = {
          students: oldStudents ? JSON.parse(oldStudents) : [],
          assignments: oldAssignments ? JSON.parse(oldAssignments) : [],
          grades: oldGrades ? JSON.parse(oldGrades) : [],
          letterGrades: oldLetterGrades ? JSON.parse(oldLetterGrades) : []
        };

        // Run migrations to convert old format to new format
        const migrated = runMigrations(oldData);

        // Clean up old keys
        window.localStorage.removeItem('students');
        window.localStorage.removeItem('assignments');
        window.localStorage.removeItem('grades');
        window.localStorage.removeItem('letterGrades');

        return migrated;
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }

    // Return initial empty data with current version and a default class
    const defaultClass: Class = {
      id: generateId(),
      name: 'My first class',
      students: [],
      assignments: [],
      grades: []
    };

    return {
      version: CURRENT_VERSION,
      classes: [defaultClass],
      letterGrades: []
    };
  });

  const pastRef = useRef<AppData[]>([]);
  const futureRef = useRef<AppData[]>([]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [data]);

  const pushHistory = (snapshot?: AppData) => {
    const stateToSave = snapshot ?? data;
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), stateToSave];
    futureRef.current = [];
  };

  const undo = () => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current[pastRef.current.length - 1];
    futureRef.current = [...futureRef.current, data];
    pastRef.current = pastRef.current.slice(0, -1);
    setData(prev);
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    pastRef.current = [...pastRef.current, data];
    futureRef.current = futureRef.current.slice(0, -1);
    setData(next);
  };

  const setClasses = (classes: Class[]) => {
    setData(prev => ({ ...prev, classes }));
  };

  const updateClass = (classId: string, updatedClass: Class) => {
    setData(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === classId ? updatedClass : c)
    }));
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
    data,
    classes: data.classes,
    letterGrades: data.letterGrades,
    version: data.version,
    setClasses,
    updateClass,
    setLetterGrades,
    importData,
    pushHistory,
    undo,
    redo,
  };
}
