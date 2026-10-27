import { useState } from 'react';
import type { Student, Assignment, Grade, GradeItem, LetterGrade, Penalty } from '../types';
import { generateId, getLetterGrade, getLetterGradeColor, getLetterGradeColorWithAlpha, getPenaltyPoints } from '../utils';
import { generateAssignmentPDF, type StudentPDFData } from '../utils/pdfExport';
import { GradeInput } from './GradeInput';

interface AssignmentDetailProps {
  assignment: Assignment;
  students: Student[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onUpdateGrade: (studentId: string, assignmentId: string, itemId: string, points: number | null) => void;
  onUpdateNote: (studentId: string, assignmentId: string, note: string) => void;
  onUpdatePenalty: (studentId: string, assignmentId: string, penalty: Penalty | undefined) => void;
  onUpdateAssignment: (assignment: Assignment, deletedItemIds: string[]) => void;
  onBack: () => void;
  onDelete: () => void;
  onGradeFocus?: () => void;
  onGradeBlur?: () => void;
}

export function AssignmentDetail({
  assignment,
  students,
  grades,
  letterGrades,
  onUpdateGrade,
  onUpdateNote,
  onUpdatePenalty,
  onUpdateAssignment,
  onBack,
  onDelete,
  onGradeFocus,
  onGradeBlur,
}: AssignmentDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [penaltyStudentId, setPenaltyStudentId] = useState<string | null>(null);
  const [penaltyType, setPenaltyType] = useState<Penalty['type']>('percent');
  const [penaltyValue, setPenaltyValue] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [editedName, setEditedName] = useState(assignment.name);
  const [editedDate, setEditedDate] = useState(assignment.date);
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
    setEditedDate(assignment.date);
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

    const validItems = editedItems.filter(item => item.name.trim() && !Number.isNaN(item.maxPoints) && item.maxPoints >= 0);
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
      date: editedDate,
      items: validItems
    };

    onUpdateAssignment(updatedAssignment, deletedItemIds);
    setIsEditing(false);
  };

  const handleExportPDF = () => {
    if (students.length === 0) {
      alert('No students to export. Please add students first.');
      return;
    }

    try {
      // Prepare student data for PDF export
      const studentDataForExport: StudentPDFData[] = students.map(student => {
        const grade = grades.find(g =>
          g.studentId === student.id &&
          g.assignmentId === assignment.id
        );

        let total = 0;
        let maxPossible = 0;

        // Filter items to only those with entered values
        const itemsWithGrades = assignment.items
          .map(item => {
            const points = grade?.itemGrades[item.id];
            if (points != null) {
              total += points;
              maxPossible += item.maxPoints;
              return {
                name: item.name,
                score: points,
                maxPoints: item.maxPoints
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        const penalty = getPenalty(student.id);
        const { penaltyPoints, finalTotal, percentage } = getPenalizedResult(student.id, total, maxPossible);
        const letterGrade = getLetterGrade(percentage, letterGrades);

        return {
          studentName: student.name,
          items: itemsWithGrades,
          total,
          maxPossible,
          penalty: penaltyPoints > 0 ? { points: penaltyPoints, reason: penalty?.reason } : undefined,
          finalTotal,
          percentage,
          letterGrade,
          note: getNote(student.id) || undefined,
        };
      });

      generateAssignmentPDF(
        assignment.name,
        assignment.date,
        studentDataForExport,
        letterGrades
      );
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleAddItem = () => {
    setEditedItems([...editedItems, { id: generateId(), name: '', maxPoints: NaN }]);
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

  const getNote = (studentId: string): string =>
    grades.find((g) => g.studentId === studentId && g.assignmentId === assignment.id)?.note ?? '';

  const openNoteDialog = (studentId: string) => {
    setNoteText(getNote(studentId));
    setNoteStudentId(studentId);
  };

  const saveNote = () => {
    if (noteStudentId !== null) onUpdateNote(noteStudentId, assignment.id, noteText);
    setNoteStudentId(null);
  };

  const getPenalty = (studentId: string): Penalty | undefined =>
    grades.find((g) => g.studentId === studentId && g.assignmentId === assignment.id)?.penalty;

  const hasPenalties = students.some((s) => (getPenalty(s.id)?.value ?? 0) > 0);

  // Total after penalty for a student (never below 0)
  const getPenalizedResult = (studentId: string, total: number, studentMax: number) => {
    const penaltyPoints = Math.min(getPenaltyPoints(getPenalty(studentId), studentMax, total), total);
    const finalTotal = total - penaltyPoints;
    const percentage = studentMax > 0 ? (finalTotal / studentMax) * 100 : 0;
    return { penaltyPoints, finalTotal, percentage };
  };

  const getStudentTotals = (studentId: string) => {
    let total = 0;
    let studentMax = 0;
    assignment.items.forEach((item) => {
      const points = getGrade(studentId, item.id);
      if (points != null) {
        total += points;
        studentMax += item.maxPoints;
      }
    });
    return { total, studentMax };
  };

  const openPenaltyDialog = (studentId: string) => {
    const existing = getPenalty(studentId);
    setPenaltyType(existing?.type ?? 'percent');
    setPenaltyValue(existing ? String(existing.value) : '');
    setPenaltyReason(existing?.reason ?? '');
    setPenaltyStudentId(studentId);
  };

  const savePenalty = () => {
    if (penaltyStudentId === null) return;
    const value = Number(penaltyValue);
    const valid = penaltyValue.trim() !== '' && Number.isFinite(value) && value > 0;
    onUpdatePenalty(
      penaltyStudentId,
      assignment.id,
      valid ? { type: penaltyType, value, reason: penaltyReason.trim() || undefined } : undefined
    );
    setPenaltyStudentId(null);
  };

  const removePenalty = () => {
    if (penaltyStudentId !== null) onUpdatePenalty(penaltyStudentId, assignment.id, undefined);
    setPenaltyStudentId(null);
  };

  const renderPenalizedStat = (mode: 'avg' | 'median') => {
    if (!hasPenalties) return null;
    const percentages = students
      .map((st) => {
        const t = getStudentTotals(st.id);
        return t.studentMax > 0 ? getPenalizedResult(st.id, t.total, t.studentMax).percentage : null;
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const mid = Math.floor(percentages.length / 2);
    let value = 0;
    if (percentages.length > 0) {
      if (mode === 'avg') value = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      else value = percentages.length % 2 === 0 ? (percentages[mid - 1] + percentages[mid]) / 2 : percentages[mid];
    }
    const letter = getLetterGrade(value, letterGrades);
    return (
      <td className="stats-cell stats-overall sticky-total-col">
        {value.toFixed(1)}%
        {letter && (
          <span style={{ color: getLetterGradeColor(letter, letterGrades) || undefined }}>
            {' '}({letter})
          </span>
        )}
      </td>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, studentIndex: number, itemIndex: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      return;
    }

    e.preventDefault();

    let nextStudentIndex = studentIndex;
    let nextItemIndex = itemIndex;

    switch (e.key) {
      case 'ArrowLeft':
        nextItemIndex = itemIndex - 1;
        break;
      case 'ArrowRight':
        nextItemIndex = itemIndex + 1;
        break;
      case 'ArrowUp':
        nextStudentIndex = studentIndex - 1;
        break;
      case 'ArrowDown':
        nextStudentIndex = studentIndex + 1;
        break;
    }

    // Bounds check
    if (nextItemIndex < 0 || nextItemIndex >= assignment.items.length) {
      return;
    }
    if (nextStudentIndex < 0 || nextStudentIndex >= sortedStudents.length) {
      return;
    }

    // Focus the next cell
    const nextInput = document.querySelector(
      `input[data-student-index="${nextStudentIndex}"][data-item-index="${nextItemIndex}"]`
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
      nextInput.select();
      (nextInput.closest('td') ?? nextInput).scrollIntoView({ block: 'nearest', inline: 'nearest' });
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

      const { percentage } = getPenalizedResult(student.id, total, studentMax);

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
        <p className="empty">Please add students first (use the Students tab)</p>
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
              <button onClick={handleExportPDF} className="secondary-btn">
                Export PDF
              </button>
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
            <label>Date</label>
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
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
                    value={Number.isNaN(item.maxPoints) ? '' : item.maxPoints}
                    onChange={(e) => handleItemChange(index, 'maxPoints', e.target.value)}
                    placeholder="Max points"
                    className="input small"
                    min="0"
                    step="1"
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

      {noteStudentId !== null && (
        <div className="note-overlay" onClick={() => setNoteStudentId(null)}>
          <div className="note-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="note-dialog-header">
              <h3>Note — {students.find((s) => s.id === noteStudentId)?.name}</h3>
              <button className="note-close-btn" onClick={() => setNoteStudentId(null)}>✕</button>
            </div>
            <textarea
              className="note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this student's performance…"
              rows={6}
              autoFocus
            />
            <div className="note-dialog-actions">
              <button className="primary-btn" onClick={saveNote}>Save</button>
              <button className="secondary-btn" onClick={() => setNoteStudentId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {penaltyStudentId !== null && (
        <div className="note-overlay" onClick={() => setPenaltyStudentId(null)}>
          <div className="note-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="note-dialog-header">
              <h3>Penalty — {students.find((s) => s.id === penaltyStudentId)?.name}</h3>
              <button className="note-close-btn" onClick={() => setPenaltyStudentId(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="number"
                className="input small"
                value={penaltyValue}
                onChange={(e) => setPenaltyValue(e.target.value)}
                placeholder="Amount"
                min="0"
                step="any"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') savePenalty(); }}
              />
              <select
                className="input"
                value={penaltyType}
                onChange={(e) => setPenaltyType(e.target.value as Penalty['type'])}
              >
                <option value="percent">% of possible points</option>
                <option value="percent-earned">% of earned points</option>
                <option value="points">points</option>
              </select>
            </div>
            <input
              type="text"
              className="input"
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
              placeholder="Reason (e.g. late submission)"
              style={{ marginBottom: '0.75rem' }}
              onKeyDown={(e) => { if (e.key === 'Enter') savePenalty(); }}
            />
            <div className="note-dialog-actions">
              <button className="primary-btn" onClick={savePenalty}>Save</button>
              <button className="secondary-btn" onClick={() => setPenaltyStudentId(null)}>Cancel</button>
              {getPenalty(penaltyStudentId) && (
                <button className="delete-btn" onClick={removePenalty}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isEditing && <div className="detail-sections">
        <section className="grades-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
            <h3 style={{ margin: 0 }}>Student Grades</h3>
            {letterGrades.length > 0 && (() => {
              // Calculate grade distribution
              const distribution = new Map<string, number>();

              students.forEach((student) => {
                let total = 0;
                let studentMax = 0;

                assignment.items.forEach((item) => {
                  const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id)?.itemGrades[item.id];
                  if (grade != null) {
                    total += grade;
                    studentMax += item.maxPoints;
                  }
                });

                if (studentMax > 0) {
                  const percentage = (total / studentMax) * 100;
                  const letterGrade = getLetterGrade(percentage, letterGrades);
                  if (letterGrade) {
                    distribution.set(letterGrade, (distribution.get(letterGrade) || 0) + 1);
                  }
                }
              });

              // Sort by letter grade thresholds (highest first)
              const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);

              return (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {sorted.map((lg) => {
                    const count = distribution.get(lg.letter);
                    if (!count) return null;

                    const color = getLetterGradeColor(lg.letter, letterGrades);

                    const bgColor = getLetterGradeColorWithAlpha(lg.letter, letterGrades, 0.15);

                    return (
                      <div
                        key={lg.letter}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          backgroundColor: bgColor || '#333',
                          border: `1px solid ${color || '#555'}`,
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        <span style={{ color: color || undefined }}>{lg.letter}</span>
                        <span style={{ color: '#888' }}>×{count}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <div className="grades-table">
            <table>
              <thead>
                <tr>
                  <th
                    onClick={() => handleHeaderClick('name')}
                    className="sortable-header sticky-name-col"
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
                    className={`sortable-header${hasPenalties ? '' : ' sticky-total-col'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    Total {!hasPenalties && sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {hasPenalties && (
                    <th
                      onClick={() => handleHeaderClick('score')}
                      className="sortable-header sticky-total-col"
                      style={{ cursor: 'pointer' }}
                    >
                      Total (with penalty) {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, studentIndex) => {
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
                  const penalty = getPenalty(student.id);
                  const penalized = getPenalizedResult(student.id, total, studentMax);
                  const penalizedLetter = getLetterGrade(penalized.percentage, letterGrades);

                  return (
                    <tr key={student.id}>
                      <td className="sticky-name-col">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{student.name}</span>
                          <button
                            className="note-btn"
                            onClick={() => openNoteDialog(student.id)}
                            title={getNote(student.id) ? 'Edit note' : 'Add note'}
                            style={{ opacity: getNote(student.id) ? 1 : 0.6 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1.5" y="0.5" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                              <line x1="4" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              <line x1="4" y1="6.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              <line x1="4" y1="9" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button
                            className="note-btn"
                            onClick={() => openPenaltyDialog(student.id)}
                            title={penalty ? `Edit penalty${penalty.reason ? ` (${penalty.reason})` : ''}` : 'Add penalty'}
                            style={{ opacity: penalty ? 1 : 0.6, color: penalty ? '#e5534b' : undefined }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="7" cy="7" r="5.8" stroke="currentColor" strokeWidth="1.2"/>
                              <line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                      {assignment.items.map((item, itemIndex) => {
                        const grade = getGrade(student.id, item.id);
                        const itemPercentage = grade != null && item.maxPoints > 0 ? (grade / item.maxPoints) * 100 : null;
                        const itemLetterGrade = itemPercentage != null ? getLetterGrade(itemPercentage, letterGrades) : null;
                        const bgColor = itemLetterGrade ? getLetterGradeColorWithAlpha(itemLetterGrade, letterGrades, 0.08) : null;

                        return (
                          <td
                            key={item.id}
                            style={{
                              backgroundColor: bgColor || undefined
                            }}
                          >
                            <GradeInput
                              value={grade}
                              onChange={(points) => onUpdateGrade(student.id, assignment.id, item.id, points)}
                              onKeyDown={(e) => handleKeyDown(e, studentIndex, itemIndex)}
                              onFocus={onGradeFocus}
                              onBlur={onGradeBlur}
                              data-student-index={studentIndex}
                              data-item-index={itemIndex}
                              className="grade-input"
                            />
                          </td>
                        );
                      })}
                      <td className={`total-cell${hasPenalties ? '' : ' sticky-total-col'}`}>
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
                      {hasPenalties && (
                        <td className="total-cell sticky-total-col">
                          {studentMax > 0 ? (
                            <>
                              {penalized.finalTotal.toFixed(2)} / {studentMax} ({penalized.percentage.toFixed(1)}%{penalizedLetter && (
                                <span style={{ color: getLetterGradeColor(penalizedLetter, letterGrades) || undefined }}>
                                  {' '}{penalizedLetter}
                                </span>
                              )})
                              {penalized.penaltyPoints > 0 && (
                                <div style={{ color: '#e5534b', fontSize: '0.8rem' }} title={penalty?.reason}>
                                  −{Number(penalized.penaltyPoints.toFixed(2))} pts{penalty?.reason ? ` · ${penalty.reason}` : ''}
                                </div>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#888', fontStyle: 'italic' }}>No grades</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="stats-row">
                  <td className="stats-label sticky-name-col">Class Average</td>
                  {assignment.items.map((item) => {
                    const itemAverage = calculateAverage(item.id);
                    const itemPercentage = calculatePercentage(item.id);
                    const itemLetterGrade = getLetterGrade(itemPercentage, letterGrades);
                    const bgColor = itemLetterGrade ? getLetterGradeColorWithAlpha(itemLetterGrade, letterGrades, 0.08) : null;
                    return (
                      <td
                        key={item.id}
                        className="stats-cell"
                        style={{
                          backgroundColor: bgColor || undefined
                        }}
                      >
                        {itemAverage.toFixed(2)}<br />
                        <span className="stats-percentage">({itemPercentage.toFixed(1)}%)</span>
                      </td>
                    );
                  })}
                  <td className={`stats-cell stats-overall${hasPenalties ? '' : ' sticky-total-col'}`}>
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
                  {renderPenalizedStat('avg')}
                </tr>
                <tr className="stats-row">
                  <td className="stats-label sticky-name-col">Class Median</td>
                  {assignment.items.map((item) => {
                    const itemMedian = calculateMedian(item.id);
                    const itemMedianPercentage = calculateMedianPercentage(item.id);
                    const itemLetterGrade = getLetterGrade(itemMedianPercentage, letterGrades);
                    const bgColor = itemLetterGrade ? getLetterGradeColorWithAlpha(itemLetterGrade, letterGrades, 0.08) : null;
                    return (
                      <td
                        key={item.id}
                        className="stats-cell"
                        style={{
                          backgroundColor: bgColor || undefined
                        }}
                      >
                        {itemMedian.toFixed(2)}<br />
                        <span className="stats-percentage">({itemMedianPercentage.toFixed(1)}%)</span>
                      </td>
                    );
                  })}
                  <td className={`stats-cell stats-overall${hasPenalties ? '' : ' sticky-total-col'}`}>
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
                  {renderPenalizedStat('median')}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>}
    </div>
  );
}
