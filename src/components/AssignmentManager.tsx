import { useState } from 'react';
import type { Assignment, GradeItem } from '../types';
import { generateId } from '../utils';

interface AssignmentManagerProps {
  assignments: Assignment[];
  onAddAssignment: (name: string, items: GradeItem[]) => void;
  onDeleteAssignment: (id: string) => void;
}

export function AssignmentManager({ assignments, onAddAssignment, onDeleteAssignment }: AssignmentManagerProps) {
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
    if (!assignmentName.trim()) return;

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
    setAssignmentName('');
    setItems([{ name: '', maxPoints: '' }]);
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
          <h3>Items</h3>
          {items.map((item, index) => (
            <div key={index} className="point-contributor-row">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                placeholder="Item name (e.g., Question 1, Essay)"
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
                <button type="button" onClick={() => handleRemoveItem(index)} className="delete-btn">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddItem} className="secondary-btn">
            Add Item
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
                  {assignment.items.map((item) => (
                    <span key={item.id} className="contributor-tag">
                      {item.name}: {item.maxPoints} pts
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
