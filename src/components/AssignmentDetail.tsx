import { useState } from 'react';
import type { Student, Assignment, Grade, GradeItem, LetterGrade } from '../types';
import { generateId, getLetterGrade } from '../utils';

interface AssignmentDetailProps {
  assignment: Assignment;
  students: Student[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onUpdateGrade: (studentId: string, assignmentId: string, itemId: string, points: number) => void;
  onUpdateAssignment: (assignment: Assignment, deletedItemIds: string[]) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function AssignmentDetail({
  assignment,
  students,
  grades,
  letterGrades,
  onUpdateGrade,
  onUpdateAssignment,
  onBack,
  onDelete,
}: AssignmentDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(assignment.name);
  const [editedItems, setEditedItems] = useState<GradeItem[]>(assignment.items);

  const handleStartEdit = () => {
    setEditedName(assignment.name);
    setEditedItems([...assignment.items]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!editedName.trim()) {
      alert('Assignment name cannot be empty');
      return;
    }

    const validItems = editedItems.filter(item => item.name.trim() && item.maxPoints > 0);
    if (validItems.length === 0) {
      alert('Assignment must have at least one valid item');
      return;
    }

    const newItemIds = new Set(validItems.map(item => item.id));
    const deletedItemIds = assignment.items
      .filter(item => !newItemIds.has(item.id))
      .map(item => item.id);

    const updatedAssignment: Assignment = {
      ...assignment,
      name: editedName.trim(),
      items: validItems
    };

    onUpdateAssignment(updatedAssignment, deletedItemIds);
    setIsEditing(false);
  };

  const handleAddItem = () => {
    setEditedItems([...editedItems, { id: generateId(), name: '', maxPoints: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length === 1) {
      alert('Assignment must have at least one item');
      return;
    }
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'maxPoints', value: string | number) => {
    const updated = [...editedItems];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].maxPoints = typeof value === 'string' ? Number(value) : value;
    }
    setEditedItems(updated);
  };

  const handleMoveItemUp = (index: number) => {
    if (index === 0) return;
    const updated = [...editedItems];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setEditedItems(updated);
  };

  const handleMoveItemDown = (index: number) => {
    if (index === editedItems.length - 1) return;
    const updated = [...editedItems];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setEditedItems(updated);
  };

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
        <div className="header-actions">
          {!isEditing && (
            <>
              <button onClick={handleStartEdit} className="secondary-btn">
                Edit Assignment
              </button>
              <button onClick={onDelete} className="delete-btn">
                Delete
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button onClick={handleSaveEdit} className="primary-btn">
                Save Changes
              </button>
              <button onClick={handleCancelEdit} className="secondary-btn">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="edit-section">
          <h3>Edit Assignment</h3>
          <div className="form-group">
            <label>Assignment Name</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Items</label>
            <div className="edit-items-list">
              {editedItems.map((item, index) => (
                <div key={item.id} className="edit-item-row">
                  <div className="reorder-buttons">
                    <button
                      type="button"
                      onClick={() => handleMoveItemUp(index)}
                      disabled={index === 0}
                      className="reorder-btn"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItemDown(index)}
                      disabled={index === editedItems.length - 1}
                      className="reorder-btn"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder="Item name"
                    className="input"
                  />
                  <input
                    type="number"
                    value={item.maxPoints || ''}
                    onChange={(e) => handleItemChange(index, 'maxPoints', e.target.value)}
                    placeholder="Max points"
                    className="input small"
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="delete-btn small"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddItem} className="secondary-btn">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEditing && <div className="detail-sections">
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
                  const letterGrade = getLetterGrade(percentage, letterGrades);

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
                        {total.toFixed(2)} / {studentMax > 0 ? studentMax : maxTotal} ({percentage.toFixed(1)}%{letterGrade ? `, ${letterGrade}` : ''})
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
              <div className="stat-value">
                {calculatePercentage().toFixed(1)}%
                {letterGrades.length > 0 && (() => {
                  const overallPercentage = calculatePercentage();
                  const letterGrade = getLetterGrade(overallPercentage, letterGrades);
                  return letterGrade ? ` (${letterGrade})` : '';
                })()}
              </div>
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
      </div>}
    </div>
  );
}
