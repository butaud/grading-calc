import type { Student, Assignment, Grade } from '../types';

interface StatisticsProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
}

export function Statistics({ students, assignments, grades }: StatisticsProps) {
  const calculateAverage = (assignmentId: string, pointContributorId?: string): number => {
    if (students.length === 0) return 0;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return 0;

    let total = 0;
    let count = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignmentId);

      if (pointContributorId) {
        const points = grade?.pointContributorGrades[pointContributorId] ?? 0;
        total += points;
        count++;
      } else {
        const assignmentTotal = assignment.pointContributors.reduce(
          (sum, pc) => sum + (grade?.pointContributorGrades[pc.id] ?? 0),
          0
        );
        total += assignmentTotal;
        count++;
      }
    });

    return count > 0 ? total / count : 0;
  };

  const calculatePercentage = (assignmentId: string, pointContributorId?: string): number => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return 0;

    const average = calculateAverage(assignmentId, pointContributorId);

    if (pointContributorId) {
      const contributor = assignment.pointContributors.find((pc) => pc.id === pointContributorId);
      return contributor && contributor.maxPoints > 0 ? (average / contributor.maxPoints) * 100 : 0;
    } else {
      const maxTotal = assignment.pointContributors.reduce((sum, pc) => sum + pc.maxPoints, 0);
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
          const maxTotal = assignment.pointContributors.reduce((sum, pc) => sum + pc.maxPoints, 0);
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
                {assignment.pointContributors.map((pc) => {
                  const pcAverage = calculateAverage(assignment.id, pc.id);
                  const pcPercentage = calculatePercentage(assignment.id, pc.id);

                  return (
                    <div key={pc.id} className="stats-row">
                      <span className="stats-label">{pc.name}:</span>
                      <span className="stats-value">
                        {pcAverage.toFixed(2)} / {pc.maxPoints} ({pcPercentage.toFixed(1)}%)
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
