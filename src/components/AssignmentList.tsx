import type { Assignment, Student, Grade, LetterGrade } from '../types';
import { getLetterGrade, getLetterGradeColor } from '../utils';

interface AssignmentListProps {
  assignments: Assignment[];
  students: Student[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onSelectAssignment: (assignmentId: string) => void;
  onAddAssignment: () => void;
}

export function AssignmentList({ assignments, students, grades, letterGrades, onSelectAssignment, onAddAssignment }: AssignmentListProps) {
  const calculateStats = (assignment: Assignment) => {
    if (students.length === 0) {
      return { mean: 0, median: 0, completion: 0, meanLetterGrade: null, medianLetterGrade: null };
    }

    const percentages: number[] = [];
    let totalPossibleGrades = 0;
    let filledGrades = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
      let studentTotal = 0;
      let studentMax = 0;

      assignment.items.forEach((item) => {
        totalPossibleGrades++;
        const points = grade?.itemGrades[item.id];
        if (points != null) {
          filledGrades++;
          studentTotal += points;
          studentMax += item.maxPoints;
        }
      });

      if (studentMax > 0) {
        percentages.push((studentTotal / studentMax) * 100);
      }
    });

    if (percentages.length === 0) {
      return { mean: 0, median: 0, completion: totalPossibleGrades > 0 ? 0 : 100, meanLetterGrade: null, medianLetterGrade: null };
    }

    // Calculate mean
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

    // Calculate median
    const sorted = [...percentages].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Calculate completion percentage
    const completion = totalPossibleGrades > 0 ? (filledGrades / totalPossibleGrades) * 100 : 0;

    const meanLetterGrade = getLetterGrade(mean, letterGrades);
    const medianLetterGrade = getLetterGrade(median, letterGrades);

    return { mean, median, completion, meanLetterGrade, medianLetterGrade };
  };
  return (
    <div className="assignment-list-view">
      <div className="view-header">
        <h2>Assignments</h2>
        <button onClick={onAddAssignment} className="primary-btn">
          Add Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>No assignments yet</p>
          <p className="empty-hint">Click "Add Assignment" to create your first assignment</p>
        </div>
      ) : (
        <div className="assignment-cards">
          {assignments.map((assignment) => {
            const totalPoints = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);
            const stats = calculateStats(assignment);
            return (
              <div
                key={assignment.id}
                className="assignment-card"
                onClick={() => onSelectAssignment(assignment.id)}
              >
                <h3>{assignment.name}</h3>
                <div className="assignment-card-meta">
                  <span className="point-count">{totalPoints} points total</span>
                  <span className="contributor-count">
                    {assignment.items.length} item{assignment.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {students.length > 0 && (
                  <div className="assignment-card-stats">
                    <div className="stat-row">
                      <span className="stat-label">Mean:</span>
                      <span className="stat-value">
                        {stats.mean.toFixed(1)}%{stats.meanLetterGrade && (
                          <span style={{ color: getLetterGradeColor(stats.meanLetterGrade, letterGrades) || undefined }}>
                            {' '}({stats.meanLetterGrade})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Median:</span>
                      <span className="stat-value">
                        {stats.median.toFixed(1)}%{stats.medianLetterGrade && (
                          <span style={{ color: getLetterGradeColor(stats.medianLetterGrade, letterGrades) || undefined }}>
                            {' '}({stats.medianLetterGrade})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Completion:</span>
                      <span className="stat-value">{stats.completion.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
