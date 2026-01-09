import { useState } from 'react';
import type { Student, Assignment, Grade } from '../types';

interface GradeEntryProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
  onUpdateGrade: (studentId: string, assignmentId: string, itemId: string, points: number) => void;
}

export function GradeEntry({ students, assignments, grades, onUpdateGrade }: GradeEntryProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  const getGrade = (studentId: string, assignmentId: string, itemId: string): number => {
    const grade = grades.find((g) => g.studentId === studentId && g.assignmentId === assignmentId);
    return grade?.itemGrades[itemId] ?? 0;
  };

  const handleGradeChange = (studentId: string, assignmentId: string, itemId: string, value: string) => {
    const points = value === '' ? 0 : Number(value);
    if (!isNaN(points)) {
      onUpdateGrade(studentId, assignmentId, itemId, points);
    }
  };

  const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);

  if (students.length === 0) {
    return (
      <div className="section">
        <h2>Enter Grades</h2>
        <p className="empty">Please add students first (use the Students tab)</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="section">
        <h2>Enter Grades</h2>
        <p className="empty">Please create assignments first</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Enter Grades</h2>
      <div className="form">
        <select
          value={selectedAssignment}
          onChange={(e) => setSelectedAssignment(e.target.value)}
          className="select"
        >
          <option value="">Select an assignment</option>
          {assignments.map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.name}
            </option>
          ))}
        </select>
      </div>

      {selectedAssignmentData && (
        <div className="grades-table">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                {selectedAssignmentData.items.map((item) => (
                  <th key={item.id}>
                    {item.name} ({item.maxPoints})
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                let total = 0;
                let maxTotal = 0;

                selectedAssignmentData.items.forEach((item) => {
                  const grade = getGrade(student.id, selectedAssignmentData.id, item.id);
                  if (grade > 0) {
                    total += grade;
                    maxTotal += item.maxPoints;
                  }
                });

                const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    {selectedAssignmentData.items.map((item) => (
                      <td key={item.id}>
                        <input
                          type="number"
                          value={getGrade(student.id, selectedAssignmentData.id, item.id) || ''}
                          onChange={(e) =>
                            handleGradeChange(student.id, selectedAssignmentData.id, item.id, e.target.value)
                          }
                          className="grade-input"
                          min="0"
                          max={item.maxPoints}
                          step="0.01"
                        />
                      </td>
                    ))}
                    <td className="total-cell">
                      {total.toFixed(2)} / {maxTotal} ({percentage.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
