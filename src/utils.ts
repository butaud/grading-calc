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

export function getLetterGradeColor(letterGrade: string | null, letterGrades: LetterGrade[]): string | null {
  if (!letterGrade || letterGrades.length === 0) return null;

  // Sort by threshold descending (highest grade first)
  const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);

  // Find the index of this letter grade
  const index = sorted.findIndex(g => g.letter === letterGrade);
  if (index === -1) return null;

  // Map index to color gradient: red (0°) -> yellow (60°) -> green (120°)
  // Higher grades (lower index) should be greener
  const position = index / Math.max(sorted.length - 1, 1); // 0 = highest grade, 1 = lowest grade
  const hue = 120 - (position * 120); // 120 (green) at top, 0 (red) at bottom

  return `hsl(${hue}, 70%, 50%)`;
}

export function getLetterGradeColorWithAlpha(letterGrade: string | null, letterGrades: LetterGrade[], alpha: number): string | null {
  if (!letterGrade || letterGrades.length === 0) return null;

  // Sort by threshold descending (highest grade first)
  const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);

  // Find the index of this letter grade
  const index = sorted.findIndex(g => g.letter === letterGrade);
  if (index === -1) return null;

  // Map index to color gradient: red (0°) -> yellow (60°) -> green (120°)
  // Higher grades (lower index) should be greener
  const position = index / Math.max(sorted.length - 1, 1); // 0 = highest grade, 1 = lowest grade
  const hue = 120 - (position * 120); // 120 (green) at top, 0 (red) at bottom

  return `hsla(${hue}, 70%, 50%, ${alpha})`;
}
