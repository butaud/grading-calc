import { useState } from 'react';
import { StudentManager } from './StudentManager';
import { LetterGradeSettings } from './LetterGradeSettings';
import type { Student, LetterGrade, Assignment, Grade } from '../types';

interface SettingsProps {
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
  letterGrades: LetterGrade[];
  onAddStudent: (name: string) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateLetterGrades: (letterGrades: LetterGrade[]) => void;
  onClose: () => void;
}

export function Settings({ students, assignments, grades, letterGrades, onAddStudent, onDeleteStudent, onUpdateLetterGrades, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'letterGrades' | 'export'>('students');
  const [exportUrl, setExportUrl] = useState<string>('');

  const handleGenerateExportLink = () => {
    const exportData = {
      students,
      assignments,
      grades,
      letterGrades
    };

    const json = JSON.stringify(exportData);
    const encoded = btoa(json);
    const url = `${window.location.origin}${window.location.pathname}?import=${encoded}`;
    setExportUrl(url);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <nav className="settings-tabs">
          <button
            className={activeTab === 'students' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
          <button
            className={activeTab === 'letterGrades' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('letterGrades')}
          >
            Letter Grades
          </button>
          <button
            className={activeTab === 'export' ? 'settings-tab active' : 'settings-tab'}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </nav>

        <div className="settings-content">
          {activeTab === 'students' && (
            <StudentManager
              students={students}
              onAddStudent={onAddStudent}
              onDeleteStudent={onDeleteStudent}
            />
          )}

          {activeTab === 'letterGrades' && (
            <LetterGradeSettings
              letterGrades={letterGrades}
              onUpdateLetterGrades={onUpdateLetterGrades}
            />
          )}

          {activeTab === 'export' && (
            <div className="section">
              <h2>Export Data</h2>
              <p className="hint">
                Export all your data (students, assignments, grades, and letter grades) as a shareable link.
                You can use this link to import your data into another browser or share it with others.
              </p>
              <button onClick={handleGenerateExportLink} className="primary-btn">
                Generate Export Link
              </button>
              {exportUrl && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontWeight: 500 }}>
                    Export Link (tap and hold to select all):
                  </label>
                  <textarea
                    readOnly
                    value={exportUrl}
                    onClick={(e) => e.currentTarget.select()}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #646cff',
                      borderRadius: '4px',
                      backgroundColor: '#1a1a1a',
                      color: '#646cff',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      minHeight: '100px',
                      resize: 'vertical',
                      wordBreak: 'break-all'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
