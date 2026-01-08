import type { Student, Assignment, Grade } from '../types';

interface StatisticsProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
}

export function Statistics({ students, assignments, grades }: StatisticsProps) {
  const calculateAverage = (assignmentId: string, itemId?: string): number => {
    if (students.length === 0) return 0;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return 0;

    let total = 0;
    let count = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignmentId);

      if (itemId) {
        const points = grade?.itemGrades[itemId] ?? 0;
        total += points;
        count++;
      } else {
        const assignmentTotal = assignment.items.reduce(
          (sum, item) => sum + (grade?.itemGrades[item.id] ?? 0),
          0
        );
        total += assignmentTotal;
        count++;
      }
    });

    return count > 0 ? total / count : 0;
  };

  const calculatePercentage = (assignmentId: string, itemId?: string): number => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return 0;

    const average = calculateAverage(assignmentId, itemId);

    if (itemId) {
      const item = assignment.items.find((item) => item.id === itemId);
      return item && item.maxPoints > 0 ? (average / item.maxPoints) * 100 : 0;
    } else {
      const maxTotal = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);
      return maxTotal > 0 ? (average / maxTotal) * 100 : 0;
    }
  };

  if (students.length === 0 || assignments.length === 0) {
    return (
      <div className="section">
        <h2>Class Averages</h2>
        <p className="empty">Add students and assignments to see statistics</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Class Averages</h2>
      <div className="statistics">
        {assignments.map((assignment) => {
          const maxTotal = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);
          const assignmentAverage = calculateAverage(assignment.id);
          const assignmentPercentage = calculatePercentage(assignment.id);

          return (
            <div key={assignment.id} className="assignment-stats">
              <h3>{assignment.name}</h3>
              <div className="stats-row overall">
                <span className="stats-label">Overall Average:</span>
                <span className="stats-value">
                  {assignmentAverage.toFixed(2)} / {maxTotal} ({assignmentPercentage.toFixed(1)}%)
                </span>
              </div>

              <div className="contributor-stats">
                {assignment.items.map((item) => {
                  const itemAverage = calculateAverage(assignment.id, item.id);
                  const itemPercentage = calculatePercentage(assignment.id, item.id);

                  return (
                    <div key={item.id} className="stats-row">
                      <span className="stats-label">{item.name}:</span>
                      <span className="stats-value">
                        {itemAverage.toFixed(2)} / {item.maxPoints} ({itemPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
