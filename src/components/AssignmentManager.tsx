import { useState } from 'react';
import type { Assignment, PointContributor } from '../types';

interface AssignmentManagerProps {
  assignments: Assignment[];
  onAddAssignment: (name: string, pointContributors: PointContributor[]) => void;
  onDeleteAssignment: (id: string) => void;
}

export function AssignmentManager({ assignments, onAddAssignment, onDeleteAssignment }: AssignmentManagerProps) {
  const [assignmentName, setAssignmentName] = useState('');
  const [pointContributors, setPointContributors] = useState<Array<{ name: string; maxPoints: string }>>([
    { name: '', maxPoints: '' }
  ]);

  const handleAddPointContributor = () => {
    setPointContributors([...pointContributors, { name: '', maxPoints: '' }]);
  };

  const handleRemovePointContributor = (index: number) => {
    setPointContributors(pointContributors.filter((_, i) => i !== index));
  };

  const handlePointContributorChange = (index: number, field: 'name' | 'maxPoints', value: string) => {
    const updated = [...pointContributors];
    updated[index][field] = value;
    setPointContributors(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentName.trim()) return;

    const validContributors = pointContributors.filter(
      (pc) => pc.name.trim() && pc.maxPoints.trim() && !isNaN(Number(pc.maxPoints))
    );

    if (validContributors.length === 0) {
      alert('Please add at least one valid point contributor');
      return;
    }

    const contributors: PointContributor[] = validContributors.map((pc) => ({
      id: crypto.randomUUID(),
      name: pc.name.trim(),
      maxPoints: Number(pc.maxPoints)
    }));

    onAddAssignment(assignmentName.trim(), contributors);
    setAssignmentName('');
    setPointContributors([{ name: '', maxPoints: '' }]);
  };

  return (
    <div className="section">
      <h2>Assignments</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
          placeholder="Assignment name"
          className="input"
        />

        <div className="point-contributors">
          <h3>Point Contributors</h3>
          {pointContributors.map((pc, index) => (
            <div key={index} className="point-contributor-row">
              <input
                type="text"
                value={pc.name}
                onChange={(e) => handlePointContributorChange(index, 'name', e.target.value)}
                placeholder="Contributor name (e.g., Homework, Quiz)"
                className="input"
              />
              <input
                type="number"
                value={pc.maxPoints}
                onChange={(e) => handlePointContributorChange(index, 'maxPoints', e.target.value)}
                placeholder="Max points"
                className="input small"
                min="0"
                step="0.01"
              />
              {pointContributors.length > 1 && (
                <button type="button" onClick={() => handleRemovePointContributor(index)} className="delete-btn">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddPointContributor} className="secondary-btn">
            Add Point Contributor
          </button>
        </div>

        <button type="submit">Create Assignment</button>
      </form>

      <div className="list">
        {assignments.length === 0 ? (
          <p className="empty">No assignments created yet</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="list-item assignment-item">
              <div>
                <strong>{assignment.name}</strong>
                <div className="point-contributors-list">
                  {assignment.pointContributors.map((pc) => (
                    <span key={pc.id} className="contributor-tag">
                      {pc.name}: {pc.maxPoints} pts
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => onDeleteAssignment(assignment.id)} className="delete-btn">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
