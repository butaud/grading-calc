import { useState } from 'react';
import type { LetterGrade } from '../types';
import { getLetterGradeColor } from '../utils';

interface LetterGradeSettingsProps {
  letterGrades: LetterGrade[];
  onUpdateLetterGrades: (letterGrades: LetterGrade[]) => void;
}

export function LetterGradeSettings({ letterGrades, onUpdateLetterGrades }: LetterGradeSettingsProps) {
  const [editedGrades, setEditedGrades] = useState<Array<{ letter: string; threshold: string }>>(
    letterGrades.length > 0
      ? letterGrades.map(lg => ({ letter: lg.letter, threshold: lg.threshold.toString() }))
      : [{ letter: '', threshold: '' }]
  );

  const handleAddGrade = () => {
    setEditedGrades([...editedGrades, { letter: '', threshold: '' }]);
  };

  const handleRemoveGrade = (index: number) => {
    setEditedGrades(editedGrades.filter((_, i) => i !== index));
  };

  const handleGradeChange = (index: number, field: 'letter' | 'threshold', value: string) => {
    const updated = [...editedGrades];
    if (field === 'letter') {
      // Validate letter grade format: capital letter + optional +/-
      const sanitized = value.toUpperCase().slice(0, 2);
      const valid = /^[A-Z][\+\-]?$/.test(sanitized) || sanitized === '';
      if (valid || value === '') {
        updated[index][field] = sanitized;
      }
    } else {
      updated[index][field] = value;
    }
    setEditedGrades(updated);
  };

  const handleSave = () => {
    const validGrades = editedGrades.filter(
      (g) => g.letter.trim() && g.threshold.trim() && !isNaN(Number(g.threshold))
    );

    const letterGradeObjects: LetterGrade[] = validGrades.map((g) => ({
      letter: g.letter.trim(),
      threshold: Number(g.threshold)
    }));

    // Sort by threshold descending
    letterGradeObjects.sort((a, b) => b.threshold - a.threshold);

    onUpdateLetterGrades(letterGradeObjects);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all letter grades?')) {
      setEditedGrades([{ letter: '', threshold: '' }]);
      onUpdateLetterGrades([]);
    }
  };

  return (
    <div className="section">
      <h2>Letter Grades</h2>
      <p className="hint">Define letter grades and their minimum percentage thresholds.</p>

      <div className="letter-grades-list">
        {editedGrades.map((grade, index) => {
          // Create a preview of what colors would be if saved
          const validGrades = editedGrades.filter(
            (g) => g.letter.trim() && g.threshold.trim() && !isNaN(Number(g.threshold))
          );
          const previewGrades: LetterGrade[] = validGrades.map((g) => ({
            letter: g.letter.trim(),
            threshold: Number(g.threshold)
          }));
          previewGrades.sort((a, b) => b.threshold - a.threshold);

          const color = grade.letter.trim() && previewGrades.find(lg => lg.letter === grade.letter)
            ? getLetterGradeColor(grade.letter, previewGrades)
            : null;

          return (
            <div key={index} className="letter-grade-row">
              <div
                className="grade-color-preview"
                style={{
                  backgroundColor: color || 'transparent',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  border: color ? 'none' : '1px dashed #444'
                }}
                title={color ? `Color for ${grade.letter}` : 'Color preview (enter valid grade)'}
              />
              <input
                type="text"
                value={grade.letter}
                onChange={(e) => handleGradeChange(index, 'letter', e.target.value)}
                placeholder="A+"
                className="input letter-input"
                maxLength={2}
              />
              <span className="threshold-label">≥</span>
              <input
                type="number"
                value={grade.threshold}
                onChange={(e) => handleGradeChange(index, 'threshold', e.target.value)}
                placeholder="90"
                className="input threshold-input"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="threshold-label">%</span>
              {editedGrades.length > 1 && (
                <button onClick={() => handleRemoveGrade(index)} className="delete-btn small">
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="button-group">
        <button onClick={handleAddGrade} className="secondary-btn">
          Add Letter Grade
        </button>
        <button onClick={handleSave} className="primary-btn">
          Save Letter Grades
        </button>
        {letterGrades.length > 0 && (
          <button onClick={handleClear} className="delete-btn">
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
