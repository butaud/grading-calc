import { useState } from 'react';
import type { Student, Assignment, Grade, LetterGrade } from '../types';
import './StudentList.css';

interface StudentListProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onAddStudent: (name: string) => void;
  onDeleteStudent: (id: string) => void;
  onRenameStudent: (id: string, newName: string) => void;
  onSelectAssignment: (assignmentId: string) => void;
}

export function StudentList({
  students,
  assignments,
  grades,
  letterGrades,
  onAddStudent,
  onDeleteStudent,
  onRenameStudent,
  onSelectAssignment
}: StudentListProps) {
  const [newStudentName, setNewStudentName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      onAddStudent(newStudentName.trim());
      setNewStudentName('');
    }
  };

  const startEditing = (student: Student) => {
    setEditingStudentId(student.id);
    setEditingName(student.name);
  };

  const saveEdit = (studentId: string) => {
    if (editingName.trim() && editingName !== students.find(s => s.id === studentId)?.name) {
      onRenameStudent(studentId, editingName.trim());
    }
    setEditingStudentId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setEditingName('');
  };

  const getStudentGradeStatus = (studentId: string, assignmentId: string): { hasGrade: boolean; percentage: number | null } => {
    const grade = grades.find(g => g.studentId === studentId && g.assignmentId === assignmentId);
    if (!grade) return { hasGrade: false, percentage: null };

    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return { hasGrade: false, percentage: null };

    const totalPoints = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);
    if (totalPoints === 0) return { hasGrade: false, percentage: null };

    const earnedPoints = assignment.items.reduce((sum, item) => {
      const itemGrade = grade.itemGrades[item.id];
      return sum + (itemGrade ?? 0);
    }, 0);

    return { hasGrade: true, percentage: (earnedPoints / totalPoints) * 100 };
  };

  const getLetterGrade = (percentage: number): string | null => {
    if (letterGrades.length === 0) return null;
    const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);
    for (const lg of sorted) {
      if (percentage >= lg.threshold) {
        return lg.letter;
      }
    }
    return sorted[sorted.length - 1]?.letter || null;
  };

  const getGridCellColor = (hasGrade: boolean, percentage: number | null): string => {
    if (!hasGrade) return 'no-grade';
    if (percentage === null) return 'no-grade';

    // If no letter grades configured, use blue
    if (letterGrades.length === 0) return 'blue-grade';

    const letter = getLetterGrade(percentage);
    if (!letter) return 'no-grade';

    // Map letter grades to colors (spectrum from red to green)
    // You can customize this mapping based on your letter grade scale
    if (letter === 'A' || letter === 'A+' || letter === 'A-') return 'grade-a';
    if (letter === 'B' || letter === 'B+' || letter === 'B-') return 'grade-b';
    if (letter === 'C' || letter === 'C+' || letter === 'C-') return 'grade-c';
    if (letter === 'D' || letter === 'D+' || letter === 'D-') return 'grade-d';
    return 'grade-f';
  };

  return (
    <div className="student-list-view">
      <div className="view-header">
        <h2>Students</h2>
        <div className="header-actions">
          <form onSubmit={handleSubmit} className="add-student-form">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Student name"
              className="input"
            />
            <button type="submit" className="primary-btn">
              Add Student
            </button>
          </form>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <p>No students yet</p>
          <p className="empty-hint">Add a student to get started</p>
        </div>
      ) : (
        <div className="student-cards">
          {students.map(student => {
            const gradedAssignments = assignments.filter(a => {
              const status = getStudentGradeStatus(student.id, a.id);
              return status.hasGrade;
            }).length;

            return (
              <div key={student.id} className="student-card">
                <div className="student-card-header">
                  {editingStudentId === student.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveEdit(student.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit(student.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      className="student-name-input"
                      autoFocus
                    />
                  ) : (
                    <h3 onClick={() => startEditing(student)} className="student-name-editable">
                      {student.name}
                    </h3>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${student.name}? All grades for this student will be lost.`)) {
                        onDeleteStudent(student.id);
                      }
                    }}
                    className="delete-btn small"
                  >
                    Delete
                  </button>
                </div>

                <div className="student-card-stats">
                  <span className="stat-label">Graded assignments:</span>
                  <span className="stat-value">{gradedAssignments} / {assignments.length}</span>
                </div>

                <div className="student-grade-grid">
                  {assignments.length === 0 ? (
                    <p className="grid-empty">No assignments yet</p>
                  ) : (
                    <div className="grade-grid">
                      {assignments.map(assignment => {
                        const status = getStudentGradeStatus(student.id, assignment.id);
                        const colorClass = getGridCellColor(status.hasGrade, status.percentage);
                        return (
                          <div
                            key={assignment.id}
                            className={`grade-grid-cell ${colorClass}`}
                            title={`${assignment.name}: ${status.hasGrade ? `${status.percentage?.toFixed(1)}%` : 'No grade'}`}
                            onClick={() => onSelectAssignment(assignment.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
