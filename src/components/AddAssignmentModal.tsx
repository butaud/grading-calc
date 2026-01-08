import { useState } from 'react';
import type { GradeItem } from '../types';
import { generateId } from '../utils';

interface AddAssignmentModalProps {
  onAddAssignment: (name: string, items: GradeItem[]) => void;
  onClose: () => void;
}

export function AddAssignmentModal({ onAddAssignment, onClose }: AddAssignmentModalProps) {
  const [assignmentName, setAssignmentName] = useState('');
  const [items, setItems] = useState<Array<{ name: string; maxPoints: string }>>([
    { name: '', maxPoints: '' }
  ]);

  const handleAddItem = () => {
    setItems([...items, { name: '', maxPoints: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'maxPoints', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentName.trim()) {
      alert('Please enter an assignment name');
      return;
    }

    const validItems = items.filter(
      (item) => item.name.trim() && item.maxPoints.trim() && !isNaN(Number(item.maxPoints))
    );

    if (validItems.length === 0) {
      alert('Please add at least one valid item');
      return;
    }

    const gradeItems: GradeItem[] = validItems.map((item) => ({
      id: generateId(),
      name: item.name.trim(),
      maxPoints: Number(item.maxPoints)
    }));

    onAddAssignment(assignmentName.trim(), gradeItems);
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
            <label>Items</label>
            <div className="point-contributors-modal">
              {items.map((item, index) => (
                <div key={index} className="point-contributor-row">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder="Item name (e.g., Question 1, Essay, Rubric)"
                    className="input"
                  />
                  <input
                    type="number"
                    value={item.maxPoints}
                    onChange={(e) => handleItemChange(index, 'maxPoints', e.target.value)}
                    placeholder="Max points"
                    className="input small"
                    min="0"
                    step="0.01"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} className="delete-btn small">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAddItem} className="secondary-btn">
                Add Item
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
