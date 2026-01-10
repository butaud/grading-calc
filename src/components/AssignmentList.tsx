import { useState } from 'react';
import type { Assignment, Student, Grade, LetterGrade } from '../types';
import { getLetterGrade, getLetterGradeColor, getLetterGradeColorWithAlpha } from '../utils';

interface AssignmentListProps {
  assignments: Assignment[];
  students: Student[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onSelectAssignment: (assignmentId: string) => void;
  onAddAssignment: () => void;
}

export function AssignmentList({ assignments, students, grades, letterGrades, onSelectAssignment, onAddAssignment }: AssignmentListProps) {
  const [filterText, setFilterText] = useState('');
  const [sortAscending, setSortAscending] = useState(false); // false = descending (newest first)
  const [filterExpanded, setFilterExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateStats = (assignment: Assignment) => {
    if (students.length === 0) {
      return { mean: 0, median: 0, completion: 0, meanLetterGrade: null, medianLetterGrade: null };
    }

    const percentages: number[] = [];
    let totalPossibleGrades = 0;
    let filledGrades = 0;

    students.forEach((student) => {
      const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
      let studentTotal = 0;
      let studentMax = 0;

      assignment.items.forEach((item) => {
        totalPossibleGrades++;
        const points = grade?.itemGrades[item.id];
        if (points != null) {
          filledGrades++;
          studentTotal += points;
          studentMax += item.maxPoints;
        }
      });

      if (studentMax > 0) {
        percentages.push((studentTotal / studentMax) * 100);
      }
    });

    if (percentages.length === 0) {
      return { mean: 0, median: 0, completion: totalPossibleGrades > 0 ? 0 : 100, meanLetterGrade: null, medianLetterGrade: null };
    }

    // Calculate mean
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

    // Calculate median
    const sorted = [...percentages].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Calculate completion percentage
    const completion = totalPossibleGrades > 0 ? (filledGrades / totalPossibleGrades) * 100 : 0;

    const meanLetterGrade = getLetterGrade(mean, letterGrades);
    const medianLetterGrade = getLetterGrade(median, letterGrades);

    return { mean, median, completion, meanLetterGrade, medianLetterGrade };
  };

  const filteredAssignments = assignments
    .filter(assignment => assignment.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortAscending ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="assignment-list-view">
      <div className="view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2>Assignments</h2>
          {assignments.length > 0 && (
            <>
              <button
                onClick={() => setSortAscending(!sortAscending)}
                className="sort-arrow-btn"
                title={sortAscending ? 'Oldest first (click for newest first)' : 'Newest first (click for oldest first)'}
              >
                {sortAscending ? '↑' : '↓'}
              </button>
              {filterExpanded || filterText ? (
                <input
                  type="text"
                  placeholder="Filter..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  onBlur={() => {
                    if (!filterText) {
                      setFilterExpanded(false);
                    }
                  }}
                  className="filter-input-inline"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setFilterExpanded(true)}
                  className="sort-arrow-btn"
                  title="Filter assignments"
                >
                  🔍
                </button>
              )}
            </>
          )}
        </div>
        <button onClick={onAddAssignment} className="primary-btn">
          Add Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>No assignments yet</p>
          <p className="empty-hint">Click "Add Assignment" to create your first assignment</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="empty-state">
          <p>No assignments match "{filterText}"</p>
          <p className="empty-hint">Try a different search term</p>
        </div>
      ) : (
        <div className="assignment-cards">
          {filteredAssignments.map((assignment) => {
            const totalPoints = assignment.items.reduce((sum, item) => sum + item.maxPoints, 0);
            const stats = calculateStats(assignment);

            // Calculate grade distribution
            const distribution = new Map<string, number>();
            if (letterGrades.length > 0 && students.length > 0) {
              students.forEach((student) => {
                let total = 0;
                let studentMax = 0;

                assignment.items.forEach((item) => {
                  const grade = grades.find((g) => g.studentId === student.id && g.assignmentId === assignment.id);
                  const points = grade?.itemGrades[item.id];
                  if (points != null) {
                    total += points;
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
            }

            const sorted = [...letterGrades].sort((a, b) => b.threshold - a.threshold);

            return (
              <div
                key={assignment.id}
                className="assignment-card"
                onClick={() => onSelectAssignment(assignment.id)}
                style={{ position: 'relative', paddingBottom: distribution.size > 0 ? '2rem' : undefined }}
              >
                <h3>{assignment.name}</h3>
                <div className="assignment-card-meta">
                  <span className="assignment-date">{formatDate(assignment.date)}</span>
                  <span className="point-count">{totalPoints} points total</span>
                  <span className="contributor-count">
                    {assignment.items.length} item{assignment.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {students.length > 0 && (
                  <div className="assignment-card-stats">
                    <div className="stat-row">
                      <span className="stat-label">Mean:</span>
                      <span className="stat-value">
                        {stats.mean.toFixed(1)}%{stats.meanLetterGrade && (
                          <span style={{ color: getLetterGradeColor(stats.meanLetterGrade, letterGrades) || undefined }}>
                            {' '}({stats.meanLetterGrade})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Median:</span>
                      <span className="stat-value">
                        {stats.median.toFixed(1)}%{stats.medianLetterGrade && (
                          <span style={{ color: getLetterGradeColor(stats.medianLetterGrade, letterGrades) || undefined }}>
                            {' '}({stats.medianLetterGrade})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Completion:</span>
                      <span className="stat-value">{stats.completion.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {distribution.size > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '1rem',
                    right: '1rem',
                    display: 'flex',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    pointerEvents: 'none'
                  }}>
                    {(() => {
                      const gradesWithCounts = sorted.filter(lg => distribution.get(lg.letter));
                      const maxDisplay = 5;
                      const showEllipsis = gradesWithCounts.length > maxDisplay + 1;
                      const displayGrades = showEllipsis ? gradesWithCounts.slice(0, maxDisplay) : gradesWithCounts;

                      return (
                        <>
                          {displayGrades.map((lg) => {
                            const count = distribution.get(lg.letter);
                            const color = getLetterGradeColor(lg.letter, letterGrades);
                            const bgColor = getLetterGradeColorWithAlpha(lg.letter, letterGrades, 0.15);

                            return (
                              <div
                                key={lg.letter}
                                className="grade-pill"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '10px',
                                  backgroundImage: bgColor ? `linear-gradient(${bgColor}, ${bgColor})` : undefined,
                                  border: `1px solid ${color || '#555'}`,
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span style={{ color: color || undefined }}>{lg.letter}</span>
                                <span style={{ color: '#888' }}>×{count}</span>
                              </div>
                            );
                          })}
                          {showEllipsis && (
                            <div
                              className="grade-pill-overflow"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '10px',
                                border: '1px solid #555',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                color: '#888'
                              }}
                            >
                              +{gradesWithCounts.length - maxDisplay}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
