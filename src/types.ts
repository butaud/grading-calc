export interface Student {
  id: string;
  name: string;
}

export interface GradeItem {
  id: string;
  name: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  name: string;
  items: GradeItem[];
}

export interface Grade {
  studentId: string;
  assignmentId: string;
  itemGrades: Record<string, number>;
}

export interface AppData {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
}
