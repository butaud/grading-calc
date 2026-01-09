import { useState } from 'react';
import type { Student, Assignment, Grade, GradeItem, LetterGrade } from '../types';
import { generateId, getLetterGrade, getLetterGradeColor } from '../utils';

interface AssignmentDetailProps {
  assignment: Assignment;
  students: Student[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onUpdateGrade: (studentId: string, assignmentId: string, itemId: string, points: number | null) => void;
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
  const [sortColumn, setSortColumn] = useState<'name' | 'score'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (column: 'name' | 'score') => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection(column === 'name' ? 'asc' : 'desc');
    }
  };

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

  const getGrade = (studentId: string, itemId: string): number | undefined => {
    const grade = grades.find((g) => g.studentId === studentId && g.assignmentId === assignment.id);
    return grade?.itemGrades[itemId];
  };

  const handleGradeChange = (studentId: string, itemId: string, value: string) => {
    if (value === '') {
      onUpdateGrade(studentId, assignment.id, itemId, null);
    } else {
      const points = Number(value);
      if (!isNaN(points)) {
        onUpdateGrade(studentId, assignment.id, itemId, points);
      }
    }
  };

  const calculateAverage = (itemId?: string): number => {
    if (students.length === 0) return 0;

    let total = 0;
    let count = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);

      if (itemId) {
        const points = grade?.itemGrades[itemId];
        if (points != null) {
          total += points;
          count++;
        }
      } else {
        let studentTotal = 0;
        let studentMax = 0;
        assignment.items.forEach((item) => {
          const points = grade?.itemGrades[item.id];
          if (points != null) {
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

  const calculateMedian = (itemId?: string): number => {
    if (students.length === 0) return 0;

    const values: number[] = [];

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);

      if (itemId) {
        const points = grade?.itemGrades[itemId];
        if (points != null) {
          values.push(points);
        }
      } else {
        let studentTotal = 0;
        let studentMax = 0;
        assignment.items.forEach((item) => {
          const points = grade?.itemGrades[item.id];
          if (points != null) {
            studentTotal += points;
            studentMax += item.maxPoints;
          }
        });
        if (studentMax > 0) {
          values.push(studentTotal);
        }
      }
    });

    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    } else {
      return values[mid];
    }
  };

  const calculateMedianPercentage = (itemId?: string): number => {
    const median = calculateMedian(itemId);

    if (itemId) {
      const item = assignment.items.find((item) => item.id === itemId);
      return item && item.maxPoints > 0 ? (median / item.maxPoints) * 100 : 0;
    } else {
      // For overall median, calculate based on students who have grades
      const percentages: number[] = [];

      students.forEach((student) => {
        const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
        let studentTotal = 0;
        let studentMax = 0;

        assignment.items.forEach((item) => {
          const points = grade?.itemGrades[item.id];
          if (points != null) {
            studentTotal += points;
            studentMax += item.maxPoints;
          }
        });

        if (studentMax > 0) {
          percentages.push((studentTotal / studentMax) * 100);
        }
      });

      if (percentages.length === 0) return 0;

      percentages.sort((a, b) => a - b);
      const mid = Math.floor(percentages.length / 2);

      if (percentages.length % 2 === 0) {
        return (percentages[mid - 1] + percentages[mid]) / 2;
      } else {
        return percentages[mid];
      }
    }
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
          const points = grade?.itemGrades[item.id];
          if (points != null) {
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

  const getSortedStudents = () => {
    const studentsWithScores = students.map((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
      let total = 0;
      let studentMax = 0;

      assignment.items.forEach((item) => {
        const points = grade?.itemGrades[item.id];
        if (points != null) {
          total += points;
          studentMax += item.maxPoints;
        }
      });

      const percentage = studentMax > 0 ? (total / studentMax) * 100 : 0;

      return { student, percentage };
    });

    if (sortColumn === 'name') {
      const sorted = studentsWithScores.sort((a, b) => a.student.name.localeCompare(b.student.name));
      return sortDirection === 'asc' ? sorted.map(s => s.student) : sorted.reverse().map(s => s.student);
    } else {
      const sorted = studentsWithScores.sort((a, b) => a.percentage - b.percentage);
      return sortDirection === 'asc' ? sorted.map(s => s.student) : sorted.reverse().map(s => s.student);
    }
  };

  const sortedStudents = getSortedStudents();

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
                  <th
                    onClick={() => handleHeaderClick('name')}
                    className="sortable-header"
                    style={{ cursor: 'pointer' }}
                  >
                    Student {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {assignment.items.map((item) => (
                    <th key={item.id}>
                      {item.name} ({item.maxPoints})
                    </th>
                  ))}
                  <th
                    onClick={() => handleHeaderClick('score')}
                    className="sortable-header"
                    style={{ cursor: 'pointer' }}
                  >
                    Total {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => {
                  let total = 0;
                  let studentMax = 0;

                  assignment.items.forEach((item) => {
                    const grade = getGrade(student.id, item.id);
                    if (grade != null) {
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
                            value={getGrade(student.id, item.id) ?? ''}
                            onChange={(e) => handleGradeChange(student.id, item.id, e.target.value)}
                            className="grade-input"
                            min="0"
                            max={item.maxPoints}
                            step="0.01"
                          />
                        </td>
                      ))}
                      <td className="total-cell">
                        {studentMax > 0 ? (
                          <>
                            {total.toFixed(2)} / {studentMax} ({percentage.toFixed(1)}%{letterGrade && (
                              <span style={{ color: getLetterGradeColor(letterGrade, letterGrades) || undefined }}>
                                {' '}{letterGrade}
                              </span>
                            )})
                          </>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic' }}>No grades</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="stats-row">
                  <td className="stats-label">Class Average</td>
                  {assignment.items.map((item) => {
                    const itemAverage = calculateAverage(item.id);
                    const itemPercentage = calculatePercentage(item.id);
                    return (
                      <td key={item.id} className="stats-cell">
                        {itemAverage.toFixed(2)}<br />
                        <span className="stats-percentage">({itemPercentage.toFixed(1)}%)</span>
                      </td>
                    );
                  })}
                  <td className="stats-cell stats-overall">
                    {calculatePercentage().toFixed(1)}%
                    {letterGrades.length > 0 && (() => {
                      const overallPercentage = calculatePercentage();
                      const letterGrade = getLetterGrade(overallPercentage, letterGrades);
                      return letterGrade ? (
                        <span style={{ color: getLetterGradeColor(letterGrade, letterGrades) || undefined }}>
                          {' '}({letterGrade})
                        </span>
                      ) : '';
                    })()}
                  </td>
                </tr>
                <tr className="stats-row">
                  <td className="stats-label">Class Median</td>
                  {assignment.items.map((item) => {
                    const itemMedian = calculateMedian(item.id);
                    const itemMedianPercentage = calculateMedianPercentage(item.id);
                    return (
                      <td key={item.id} className="stats-cell">
                        {itemMedian.toFixed(2)}<br />
                        <span className="stats-percentage">({itemMedianPercentage.toFixed(1)}%)</span>
                      </td>
                    );
                  })}
                  <td className="stats-cell stats-overall">
                    {calculateMedianPercentage().toFixed(1)}%
                    {letterGrades.length > 0 && (() => {
                      const overallMedianPercentage = calculateMedianPercentage();
                      const letterGrade = getLetterGrade(overallMedianPercentage, letterGrades);
                      return letterGrade ? (
                        <span style={{ color: getLetterGradeColor(letterGrade, letterGrades) || undefined }}>
                          {' '}({letterGrade})
                        </span>
                      ) : '';
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>}
    </div>
  );
}
