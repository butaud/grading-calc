import { useState } from 'react';
import type { Student, Assignment, Grade, GradeItem } from './types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from './utils';
import { AssignmentList } from './components/AssignmentList';
import { AssignmentDetail } from './components/AssignmentDetail';
import { Settings } from './components/Settings';
import { AddAssignmentModal } from './components/AddAssignmentModal';
import './App.css';

function App() {
  const [students, setStudents] = useLocalStorage<Student[]>('students', []);
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('assignments', []);
  const [grades, setGrades] = useLocalStorage<Grade[]>('grades', []);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

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

  const handleAddAssignment = (name: string, items: GradeItem[]) => {
    const newAssignment: Assignment = {
      id: generateId(),
      name,
      items
    };
    setAssignments([...assignments, newAssignment]);
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Are you sure you want to delete this assignment? All grades for this assignment will be lost.')) {
      setAssignments(assignments.filter((a) => a.id !== id));
      setGrades(grades.filter((g) => g.assignmentId !== id));
      if (selectedAssignmentId === id) {
        setSelectedAssignmentId(null);
      }
    }
  };

  const handleUpdateGrade = (studentId: string, assignmentId: string, itemId: string, points: number) => {
    const existingGradeIndex = grades.findIndex(
      (g) => g.studentId === studentId && g.assignmentId === assignmentId
    );

    if (existingGradeIndex >= 0) {
      const updatedGrades = [...grades];
      updatedGrades[existingGradeIndex] = {
        ...updatedGrades[existingGradeIndex],
        itemGrades: {
          ...updatedGrades[existingGradeIndex].itemGrades,
          [itemId]: points
        }
      };
      setGrades(updatedGrades);
    } else {
      const newGrade: Grade = {
        studentId,
        assignmentId,
        itemGrades: {
          [itemId]: points
        }
      };
      setGrades([...grades, newGrade]);
    }
  };

  const selectedAssignment = selectedAssignmentId
    ? assignments.find((a) => a.id === selectedAssignmentId)
    : null;

  return (
    <div className="app">
      <header className="header">
        <h1>Grading Calculator</h1>
        <button onClick={() => setShowSettings(true)} className="settings-btn">
          ⚙ Students
        </button>
      </header>

      <main className="main">
        {selectedAssignment ? (
          <AssignmentDetail
            assignment={selectedAssignment}
            students={students}
            grades={grades}
            onUpdateGrade={handleUpdateGrade}
            onBack={() => setSelectedAssignmentId(null)}
            onDelete={() => handleDeleteAssignment(selectedAssignment.id)}
          />
        ) : (
          <AssignmentList
            assignments={assignments}
            onSelectAssignment={setSelectedAssignmentId}
            onAddAssignment={() => setShowAddAssignment(true)}
          />
        )}
      </main>

      {showSettings && (
        <Settings
          students={students}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteStudent}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAddAssignment && (
        <AddAssignmentModal
          onAddAssignment={handleAddAssignment}
          onClose={() => setShowAddAssignment(false)}
        />
      )}
    </div>
  );
}

export default App;
