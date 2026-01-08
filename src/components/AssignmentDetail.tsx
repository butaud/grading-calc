import type { Student, Assignment, Grade } from '../types';

interface AssignmentDetailProps {
  assignment: Assignment;
  students: Student[];
  grades: Grade[];
  onUpdateGrade: (studentId: string, assignmentId: string, itemId: string, points: number) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function AssignmentDetail({
  assignment,
  students,
  grades,
  onUpdateGrade,
  onBack,
  onDelete,
}: AssignmentDetailProps) {
  const getGrade = (studentId: string, itemId: string): number => {
    const grade = grades.find((g) => g.studentId === studentId && g.assignmentId === assignment.id);
    return grade?.itemGrades[itemId] ?? 0;
  };

  const handleGradeChange = (studentId: string, itemId: string, value: string) => {
    const points = value === '' ? 0 : Number(value);
    if (!isNaN(points)) {
      onUpdateGrade(studentId, assignment.id, itemId, points);
    }
  };

  const calculateAverage = (itemId?: string): number => {
    if (students.length === 0) return 0;

    let total = 0;
    let count = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);

      if (itemId) {
        const points = grade?.itemGrades[itemId] ?? 0;
        if (points > 0) {
          total += points;
          count++;
        }
      } else {
        let studentTotal = 0;
        let studentMax = 0;
        assignment.items.forEach((item) => {
          const points = grade?.itemGrades[item.id] ?? 0;
          if (points > 0) {
            studentTotal += points;
            studentMax += item.maxPoints;
          }
        });
        if (studentMax > 0) {
          total += studentTotal;
          count++;
        }
      }
    });

    return count > 0 ? total / count : 0;
  };

  const calculatePercentage = (itemId?: string): number => {
    const average = calculateAverage(itemId);

    if (itemId) {
      const item = assignment.items.find((item) => item.id === itemId);
      return item && item.maxPoints > 0 ? (average / item.maxPoints) * 100 : 0;
    } else {
      // For overall average, calculate based on students who have grades
      let totalPercentage = 0;
      let count = 0;

      students.forEach((student) => {
        const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
        let studentTotal = 0;
        let studentMax = 0;

        assignment.items.forEach((item) => {
          const points = grade?.itemGrades[item.id] ?? 0;
          if (points > 0) {
            studentTotal += points;
            studentMax += item.maxPoints;
          }
        });

        if (studentMax > 0) {
          totalPercentage += (studentTotal / studentMax) * 100;
          count++;
        }
      });

      return count > 0 ? totalPercentage / count : 0;
    }
  };

  if (students.length === 0) {
    return (
      <div className="assignment-detail-view">
        <div className="view-header">
          <button onClick={onBack} className="back-btn">
            ← Back to Assignments
          </button>
          <h2>{assignment.name}</h2>
        </div>
        <p className="empty">Please add students first (use the settings menu)</p>
      </div>
    );
  }

  const maxTotal = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);

  return (
    <div className="assignment-detail-view">
      <div className="view-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Assignments
        </button>
        <h2>{assignment.name}</h2>
        <button onClick={onDelete} className="delete-btn">
          Delete Assignment
        </button>
      </div>

      <div className="detail-sections">
        <section className="grades-section">
          <h3>Student Grades</h3>
          <div className="grades-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  {assignment.items.map((item) => (
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
                  let studentMax = 0;

                  assignment.items.forEach((item) => {
                    const grade = getGrade(student.id, item.id);
                    if (grade > 0) {
                      total += grade;
                      studentMax += item.maxPoints;
                    }
                  });

                  const percentage = studentMax > 0 ? (total / studentMax) * 100 : 0;

                  return (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      {assignment.items.map((item) => (
                        <td key={item.id}>
                          <input
                            type="number"
                            value={getGrade(student.id, item.id) || ''}
                            onChange={(e) => handleGradeChange(student.id, item.id, e.target.value)}
                            className="grade-input"
                            min="0"
                            max={item.maxPoints}
                            step="0.01"
                          />
                        </td>
                      ))}
                      <td className="total-cell">
                        {total.toFixed(2)} / {studentMax > 0 ? studentMax : maxTotal} ({percentage.toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stats-section">
          <h3>Class Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card overall">
              <div className="stat-label">Overall Average</div>
              <div className="stat-value">{calculatePercentage().toFixed(1)}%</div>
            </div>

            {assignment.items.map((item) => {
              const itemAverage = calculateAverage(item.id);
              const itemPercentage = calculatePercentage(item.id);

              return (
                <div key={item.id} className="stat-card">
                  <div className="stat-label">{item.name}</div>
                  <div className="stat-value">
                    {itemAverage.toFixed(2)} / {item.maxPoints}
                  </div>
                  <div className="stat-percentage">{itemPercentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
