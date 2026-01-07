export interface Student {
  id: string;
  name: string;
}

export interface PointContributor {
  id: string;
  name: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  name: string;
  pointContributors: PointContributor[];
}

export interface Grade {
  studentId: string;
  assignmentId: string;
  pointContributorGrades: Record<string, number>;
}

export interface AppData {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
}
