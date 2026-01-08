import { useState } from 'react';
import { StudentManager } from './StudentManager';
import { LetterGradeSettings } from './LetterGradeSettings';
import type { Student, LetterGrade } from '../types';

interface SettingsProps {
  students: Student[];
  letterGrades: LetterGrade[];
  onAddStudent: (name: string) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateLetterGrades: (letterGrades: LetterGrade[]) => void;
  onExportData: () => void;
  onClose: () => void;
}

export function Settings({ students, letterGrades, onAddStudent, onDeleteStudent, onUpdateLetterGrades, onExportData, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'letterGrades' | 'export'>('students');

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
              <button onClick={onExportData} className="primary-btn">
                Generate Export Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
