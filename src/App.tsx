import { useState } from 'react';
import type { Student, Assignment, Grade, PointContributor } from './types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from './utils';
import { StudentManager } from './components/StudentManager';
import { AssignmentManager } from './components/AssignmentManager';
import { GradeEntry } from './components/GradeEntry';
import { Statistics } from './components/Statistics';
import './App.css';

function App() {
  const [students, setStudents] = useLocalStorage<Student[]>('students', []);
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('assignments', []);
  const [grades, setGrades] = useLocalStorage<Grade[]>('grades', []);
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'grades' | 'statistics'>('students');

  const handleAddStudent = (name: string) => {
    const newStudent: Student = {
      id: generateId(),
      name
    };
    setStudents([...students, newStudent]);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
    setGrades(grades.filter((g) => g.studentId !== id));
  };

  const handleAddAssignment = (name: string, pointContributors: PointContributor[]) => {
    const newAssignment: Assignment = {
      id: generateId(),
      name,
      pointContributors
    };
    setAssignments([...assignments, newAssignment]);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    setGrades(grades.filter((g) => g.assignmentId !== id));
  };

  const handleUpdateGrade = (studentId: string, assignmentId: string, pointContributorId: string, points: number) => {
    const existingGradeIndex = grades.findIndex(
      (g) => g.studentId === studentId && g.assignmentId === assignmentId
    );

    if (existingGradeIndex >= 0) {
      const updatedGrades = [...grades];
      updatedGrades[existingGradeIndex] = {
        ...updatedGrades[existingGradeIndex],
        pointContributorGrades: {
          ...updatedGrades[existingGradeIndex].pointContributorGrades,
          [pointContributorId]: points
        }
      };
      setGrades(updatedGrades);
    } else {
      const newGrade: Grade = {
        studentId,
        assignmentId,
        pointContributorGrades: {
          [pointContributorId]: points
        }
      };
      setGrades([...grades, newGrade]);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Grading Calculator</h1>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'students' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button
          className={activeTab === 'assignments' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button
          className={activeTab === 'grades' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('grades')}
        >
          Enter Grades
        </button>
        <button
          className={activeTab === 'statistics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </nav>

      <main className="main">
        {activeTab === 'students' && (
          <StudentManager
            students={students}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentManager
            assignments={assignments}
            onAddAssignment={handleAddAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {activeTab === 'grades' && (
          <GradeEntry
            students={students}
            assignments={assignments}
            grades={grades}
            onUpdateGrade={handleUpdateGrade}
          />
        )}

        {activeTab === 'statistics' && (
          <Statistics students={students} assignments={assignments} grades={grades} />
        )}
      </main>
    </div>
  );
}

export default App;
