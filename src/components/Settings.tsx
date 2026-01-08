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
  onClose: () => void;
}

export function Settings({ students, letterGrades, onAddStudent, onDeleteStudent, onUpdateLetterGrades, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'letterGrades'>('students');

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
        </div>
      </div>
    </div>
  );
}
