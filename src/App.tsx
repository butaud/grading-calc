import { useState, useEffect, useRef } from 'react';
import type { Student, Assignment, Grade, GradeItem } from './types';
import { useAppData } from './useAppData';
import { generateId } from './utils';
import { runMigrations } from './migrations';
import { AssignmentList } from './components/AssignmentList';
import { AssignmentDetail } from './components/AssignmentDetail';
import { StudentList } from './components/StudentList';
import { Settings } from './components/Settings';
import { AddAssignmentModal } from './components/AddAssignmentModal';
import { ClassSelector } from './components/ClassSelector';
import './App.css';

function App() {
  const {
    data,
    classes,
    letterGrades,
    version,
    setClasses,
    updateClass,
    setLetterGrades,
    importData,
    pushHistory,
    undo,
    redo,
  } = useAppData();

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return classes[0]?.id || '';
  });

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(() => {
    // Initialize with hash if present
    const hash = window.location.hash.slice(1);
    return hash || null;
  });
  const [currentView, setCurrentView] = useState<'students' | 'assignments'>('assignments');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  // Get current class data
  const currentClass = classes.find(c => c.id === selectedClassId);
  const students = currentClass?.students || [];
  const assignments = currentClass?.assignments || [];
  const grades = currentClass?.grades || [];

  // Helper to update current class
  const updateCurrentClass = (updates: Partial<typeof currentClass>) => {
    if (!currentClass) return;
    updateClass(selectedClassId, { ...currentClass, ...updates });
  };

  // Ensure selectedClassId always points to a valid class
  useEffect(() => {
    if (classes.length > 0 && !classes.find(c => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Handle import on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importParam = params.get('import');

    if (importParam) {
      try {
        const decoded = atob(importParam);
        const data = JSON.parse(decoded);

        // Check if there's existing local data
        const hasExistingData = classes.some(c => c.students.length > 0 || c.assignments.length > 0 || c.grades.length > 0) || letterGrades.length > 0;

        if (hasExistingData) {
          if (confirm('You have existing data. Do you want to overwrite it with the imported data? This cannot be undone.')) {
            importData(data);
            // Set selected class to first class after import
            const migrated = runMigrations(data);
            if (migrated.classes && migrated.classes.length > 0) {
              setSelectedClassId(migrated.classes[0].id);
            }
          }
        } else {
          importData(data);
          // Set selected class to first class after import
          const migrated = runMigrations(data);
          if (migrated.classes && migrated.classes.length > 0) {
            setSelectedClassId(migrated.classes[0].id);
          }
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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Grade field undo: snapshot on focus, push to history on blur if changed
  const gradeSnapshotRef = useRef<typeof data | null>(null);

  const handleGradeFocus = () => {
    gradeSnapshotRef.current = data;
  };

  const handleGradeBlur = () => {
    if (gradeSnapshotRef.current !== null && gradeSnapshotRef.current !== data) {
      pushHistory(gradeSnapshotRef.current);
    }
    gradeSnapshotRef.current = null;
  };

  const handleAddStudent = (name: string) => {
    pushHistory();
    const newStudent: Student = {
      id: generateId(),
      name
    };
    updateCurrentClass({ students: [...students, newStudent] });
  };

  const handleDeleteStudent = (id: string) => {
    pushHistory();
    updateCurrentClass({
      students: students.filter((s) => s.id !== id),
      grades: grades.filter((g) => g.studentId !== id)
    });
  };

  const handleRenameStudent = (id: string, newName: string) => {
    pushHistory();
    updateCurrentClass({
      students: students.map(s => s.id === id ? { ...s, name: newName } : s)
    });
  };

  const handleAddAssignment = (name: string, date: string, items: GradeItem[]) => {
    pushHistory();
    const newAssignment: Assignment = {
      id: generateId(),
      name,
      date,
      items
    };
    updateCurrentClass({ assignments: [...assignments, newAssignment] });
    setSelectedAssignmentId(newAssignment.id);
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Are you sure you want to delete this assignment? All grades for this assignment will be lost.')) {
      pushHistory();
      updateCurrentClass({
        assignments: assignments.filter((a) => a.id !== id),
        grades: grades.filter((g) => g.assignmentId !== id)
      });
      if (selectedAssignmentId === id) {
        setSelectedAssignmentId(null);
      }
    }
  };

  const handleUpdateGrade = (studentId: string, assignmentId: string, itemId: string, points: number | null) => {
    const existingGradeIndex = grades.findIndex(
      (g) => g.studentId === studentId && g.assignmentId === assignmentId
    );

    let updatedGrades: Grade[];

    if (existingGradeIndex >= 0) {
      updatedGrades = [...grades];
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
    } else if (points !== null) {
      // Only create new grade if points is not null
      const newGrade: Grade = {
        studentId,
        assignmentId,
        itemGrades: {
          [itemId]: points
        }
      };
      updatedGrades = [...grades, newGrade];
    } else {
      return; // Nothing to do
    }

    updateCurrentClass({ grades: updatedGrades });
  };

  const handleUpdateAssignment = (updatedAssignment: Assignment, deletedItemIds: string[]) => {
    pushHistory();
    const updatedAssignments = assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a);

    if (deletedItemIds.length > 0) {
      const updatedGrades = grades.map(grade => {
        if (grade.assignmentId === updatedAssignment.id) {
          const updatedItemGrades = { ...grade.itemGrades };
          deletedItemIds.forEach(itemId => {
            delete updatedItemGrades[itemId];
          });
          return { ...grade, itemGrades: updatedItemGrades };
        }
        return grade;
      });
      updateCurrentClass({ assignments: updatedAssignments, grades: updatedGrades });
    } else {
      updateCurrentClass({ assignments: updatedAssignments });
    }
  };

  const handleAddClass = () => {
    const name = prompt('Enter a name for the new class:');
    if (name && name.trim()) {
      pushHistory();
      const newClass = {
        id: generateId(),
        name: name.trim(),
        students: [],
        assignments: [],
        grades: []
      };
      setClasses([...classes, newClass]);
      setSelectedClassId(newClass.id);
    }
  };

  const handleRenameClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    const newName = prompt('Enter a new name for this class:', cls.name);
    if (newName && newName.trim() && newName !== cls.name) {
      pushHistory();
      updateClass(classId, { ...cls, name: newName.trim() });
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length === 1) {
      alert('You cannot delete the last class.');
      return;
    }

    if (confirm('Are you sure you want to delete this class? All students, assignments, and grades in this class will be lost.')) {
      pushHistory();
      const updatedClasses = classes.filter(c => c.id !== classId);
      setClasses(updatedClasses);

      // If we're deleting the selected class, select another one
      if (selectedClassId === classId) {
        setSelectedClassId(updatedClasses[0].id);
      }
    }
  };

  const handleImportData = (importedData: any) => {
    pushHistory();
    importData(importedData);
    // After import, select the first class from the imported data
    // Need to run migrations to get the actual classes
    const migrated = runMigrations(importedData);
    if (migrated.classes && migrated.classes.length > 0) {
      setSelectedClassId(migrated.classes[0].id);
    }
  };

  const selectedAssignment = selectedAssignmentId
    ? assignments.find((a) => a.id === selectedAssignmentId)
    : null;

  return (
    <div className="app">
      <header className="header">
        <h1>Grading Calculator</h1>
        <div className="header-right">
          <ClassSelector
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onRenameClass={handleRenameClass}
            onDeleteClass={handleDeleteClass}
            onAddClass={handleAddClass}
          />
          <button onClick={() => setShowSettings(true)} className="settings-btn">
            ⚙ Settings
          </button>
        </div>
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
            onGradeFocus={handleGradeFocus}
            onGradeBlur={handleGradeBlur}
          />
        ) : (
          <>
            <nav className="main-tabs">
              <button
                className={`main-tab ${currentView === 'assignments' ? 'active' : ''}`}
                onClick={() => setCurrentView('assignments')}
              >
                Assignments
              </button>
              <button
                className={`main-tab ${currentView === 'students' ? 'active' : ''}`}
                onClick={() => setCurrentView('students')}
              >
                Students
              </button>
            </nav>

            {currentView === 'assignments' ? (
              <AssignmentList
                assignments={assignments}
                students={students}
                grades={grades}
                letterGrades={letterGrades}
                onSelectAssignment={setSelectedAssignmentId}
                onAddAssignment={() => setShowAddAssignment(true)}
              />
            ) : (
              <StudentList
                students={students}
                assignments={assignments}
                grades={grades}
                letterGrades={letterGrades}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onRenameStudent={handleRenameStudent}
                onSelectAssignment={setSelectedAssignmentId}
              />
            )}
          </>
        )}
      </main>

      {showSettings && (
        <Settings
          classes={classes}
          letterGrades={letterGrades}
          version={version}
          onUpdateLetterGrades={(lg) => { pushHistory(); setLetterGrades(lg); }}
          onImportData={handleImportData}
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
