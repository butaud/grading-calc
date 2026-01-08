import type { Assignment } from '../types';

interface AssignmentListProps {
  assignments: Assignment[];
  onSelectAssignment: (assignmentId: string) => void;
  onAddAssignment: () => void;
}

export function AssignmentList({ assignments, onSelectAssignment, onAddAssignment }: AssignmentListProps) {
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
            const totalPoints = assignment.pointContributors.reduce((sum, pc) => sum + pc.maxPoints, 0);
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
                    {assignment.pointContributors.length} contributor{assignment.pointContributors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="assignment-card-contributors">
                  {assignment.pointContributors.map((pc) => (
                    <span key={pc.id} className="contributor-chip">
                      {pc.name}: {pc.maxPoints}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
