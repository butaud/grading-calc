export interface Student {
  id: string;
  name: string;
}

export interface LetterGrade {
  letter: string;
  threshold: number;
}

export interface GradeItem {
  id: string;
  name: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  name: string;
  date: string; // ISO date string
  items: GradeItem[];
}

export interface Penalty {
  type: 'points' | 'percent' | 'percent-earned'; // percent: of possible points; percent-earned: of the student's earned points
  value: number;
  reason?: string;
}

export interface Grade {
  studentId: string;
  assignmentId: string;
  itemGrades: Record<string, number>;
  note?: string;
  penalty?: Penalty;
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
}
