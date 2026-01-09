import { useState, useEffect } from 'react';
import type { Student, Assignment, Grade, GradeItem, LetterGrade } from './types';
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
  const [letterGrades, setLetterGrades] = useLocalStorage<LetterGrade[]>('letterGrades', []);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(() => {
    // Initialize with hash if present
    const hash = window.location.hash.slice(1);
    return hash || null;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  // Handle import on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');

    if (importData) {
      try {
        const decoded = atob(importData);
        const data = JSON.parse(decoded);

        // Check if there's existing local data
        const hasExistingData = students.length > 0 || assignments.length > 0 || grades.length > 0 || letterGrades.length > 0;

        if (hasExistingData) {
          if (confirm('You have existing data. Do you want to overwrite it with the imported data? This cannot be undone.')) {
            importAllData(data);
          }
        } else {
          importAllData(data);
        }

        // Remove import parameter from URL
        params.delete('import');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      } catch (e) {
        alert('Failed to import data. The import link may be invalid or corrupted.');
        console.error('Import error:', e);
      }
    }
  }, []); // Only run once on mount

  const importAllData = (data: any) => {
    if (data.students) setStudents(data.students);
    if (data.assignments) setAssignments(data.assignments);
    if (data.grades) setGrades(data.grades);
    if (data.letterGrades) setLetterGrades(data.letterGrades);
  };

  // Validate hash on initial load and clear if invalid
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && !assignments.find(a => a.id === hash)) {
      // Hash exists but assignment doesn't - clear it
      setSelectedAssignmentId(null);
    }
  }, [assignments]);

  // Update hash when selected assignment changes
  useEffect(() => {
    if (selectedAssignmentId) {
      window.location.hash = selectedAssignmentId;
    } else {
      window.location.hash = '';
    }
  }, [selectedAssignmentId]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && assignments.find(a => a.id === hash)) {
        setSelectedAssignmentId(hash);
      } else {
        setSelectedAssignmentId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [assignments]);

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

  const handleUpdateGrade = (studentId: string, assignmentId: string, itemId: string, points: number | null) => {
    const existingGradeIndex = grades.findIndex(
      (g) => g.studentId === studentId && g.assignmentId === assignmentId
    );

    if (existingGradeIndex >= 0) {
      const updatedGrades = [...grades];
      const updatedItemGrades = { ...updatedGrades[existingGradeIndex].itemGrades };

      if (points === null) {
        // Delete the item grade if points is null
        delete updatedItemGrades[itemId];
      } else {
        updatedItemGrades[itemId] = points;
      }

      updatedGrades[existingGradeIndex] = {
        ...updatedGrades[existingGradeIndex],
        itemGrades: updatedItemGrades
      };
      setGrades(updatedGrades);
    } else if (points !== null) {
      // Only create new grade if points is not null
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

  const handleUpdateAssignment = (updatedAssignment: Assignment, deletedItemIds: string[]) => {
    setAssignments(assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));

    if (deletedItemIds.length > 0) {
      setGrades(grades.map(grade => {
        if (grade.assignmentId === updatedAssignment.id) {
          const updatedItemGrades = { ...grade.itemGrades };
          deletedItemIds.forEach(itemId => {
            delete updatedItemGrades[itemId];
          });
          return { ...grade, itemGrades: updatedItemGrades };
        }
        return grade;
      }));
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
          ⚙ Settings
        </button>
      </header>

      <main className="main">
        {selectedAssignment ? (
          <AssignmentDetail
            assignment={selectedAssignment}
            students={students}
            grades={grades}
            letterGrades={letterGrades}
            onUpdateGrade={handleUpdateGrade}
            onUpdateAssignment={handleUpdateAssignment}
            onBack={() => setSelectedAssignmentId(null)}
            onDelete={() => handleDeleteAssignment(selectedAssignment.id)}
          />
        ) : (
          <AssignmentList
            assignments={assignments}
            students={students}
            grades={grades}
            letterGrades={letterGrades}
            onSelectAssignment={setSelectedAssignmentId}
            onAddAssignment={() => setShowAddAssignment(true)}
          />
        )}
      </main>

      {showSettings && (
        <Settings
          students={students}
          assignments={assignments}
          grades={grades}
          letterGrades={letterGrades}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteStudent}
          onUpdateLetterGrades={setLetterGrades}
          onImportData={importAllData}
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
