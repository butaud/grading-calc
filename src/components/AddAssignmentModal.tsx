import { useState } from 'react';
import type { PointContributor } from '../types';
import { generateId } from '../utils';

interface AddAssignmentModalProps {
  onAddAssignment: (name: string, pointContributors: PointContributor[]) => void;
  onClose: () => void;
}

export function AddAssignmentModal({ onAddAssignment, onClose }: AddAssignmentModalProps) {
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
    if (!assignmentName.trim()) {
      alert('Please enter an assignment name');
      return;
    }

    const validContributors = pointContributors.filter(
      (pc) => pc.name.trim() && pc.maxPoints.trim() && !isNaN(Number(pc.maxPoints))
    );

    if (validContributors.length === 0) {
      alert('Please add at least one valid point contributor');
      return;
    }

    const contributors: PointContributor[] = validContributors.map((pc) => ({
      id: generateId(),
      name: pc.name.trim(),
      maxPoints: Number(pc.maxPoints)
    }));

    onAddAssignment(assignmentName.trim(), contributors);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Assignment</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label>Assignment Name</label>
            <input
              type="text"
              value={assignmentName}
              onChange={(e) => setAssignmentName(e.target.value)}
              placeholder="e.g., Midterm Exam, Homework 1"
              className="input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Point Contributors</label>
            <div className="point-contributors-modal">
              {pointContributors.map((pc, index) => (
                <div key={index} className="point-contributor-row">
                  <input
                    type="text"
                    value={pc.name}
                    onChange={(e) => handlePointContributorChange(index, 'name', e.target.value)}
                    placeholder="Contributor name (e.g., Written, Multiple Choice)"
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
                    <button type="button" onClick={() => handleRemovePointContributor(index)} className="delete-btn small">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAddPointContributor} className="secondary-btn">
                Add Point Contributor
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
