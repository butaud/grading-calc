import { useState } from 'react';
import type { Student, Assignment, Grade } from '../types';

interface GradeEntryProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
  onUpdateGrade: (studentId: string, assignmentId: string, pointContributorId: string, points: number) => void;
}

export function GradeEntry({ students, assignments, grades, onUpdateGrade }: GradeEntryProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  const getGrade = (studentId: string, assignmentId: string, pointContributorId: string): number => {
    const grade = grades.find((g) => g.studentId === studentId && g.assignmentId === assignmentId);
    return grade?.pointContributorGrades[pointContributorId] ?? 0;
  };

  const handleGradeChange = (studentId: string, assignmentId: string, pointContributorId: string, value: string) => {
    const points = value === '' ? 0 : Number(value);
    if (!isNaN(points)) {
      onUpdateGrade(studentId, assignmentId, pointContributorId, points);
    }
  };

  const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);

  if (students.length === 0) {
    return (
      <div className="section">
        <h2>Enter Grades</h2>
        <p className="empty">Please add students first</p>
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
                {selectedAssignmentData.pointContributors.map((pc) => (
                  <th key={pc.id}>
                    {pc.name} ({pc.maxPoints})
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                let total = 0;
                let maxTotal = 0;

                selectedAssignmentData.pointContributors.forEach((pc) => {
                  const grade = getGrade(student.id, selectedAssignmentData.id, pc.id);
                  if (grade > 0) {
                    total += grade;
                    maxTotal += pc.maxPoints;
                  }
                });

                const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    {selectedAssignmentData.pointContributors.map((pc) => (
                      <td key={pc.id}>
                        <input
                          type="number"
                          value={getGrade(student.id, selectedAssignmentData.id, pc.id) || ''}
                          onChange={(e) =>
                            handleGradeChange(student.id, selectedAssignmentData.id, pc.id, e.target.value)
                          }
                          className="grade-input"
                          min="0"
                          max={pc.maxPoints}
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
