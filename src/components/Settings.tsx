import { StudentManager } from './StudentManager';
import type { Student } from '../types';

interface SettingsProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onDeleteStudent: (id: string) => void;
  onClose: () => void;
}

export function Settings({ students, onAddStudent, onDeleteStudent, onClose }: SettingsProps) {
  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>
        <div className="settings-content">
          <StudentManager
            students={students}
            onAddStudent={onAddStudent}
            onDeleteStudent={onDeleteStudent}
          />
        </div>
      </div>
    </div>
  );
}
