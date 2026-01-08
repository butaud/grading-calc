import type { LetterGrade } from './types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getLetterGrade(percentage: number, letterGrades: LetterGrade[]): string | null {
  if (letterGrades.length === 0) return null;

  // Sort by threshold descending to find the highest threshold the percentage meets
  const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);

  for (const grade of sorted) {
    if (percentage >= grade.threshold) {
      return grade.letter;
    }
  }

  return null;
}
