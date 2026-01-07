import { useState } from 'react';
import type { Student } from '../types';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onDeleteStudent: (id: string) => void;
}

export function StudentManager({ students, onAddStudent, onDeleteStudent }: StudentManagerProps) {
  const [newStudentName, setNewStudentName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      onAddStudent(newStudentName.trim());
      setNewStudentName('');
    }
  };

  return (
    <div className="section">
      <h2>Students</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          placeholder="Student name"
          className="input"
        />
        <button type="submit">Add Student</button>
      </form>
      <div className="list">
        {students.length === 0 ? (
          <p className="empty">No students added yet</p>
        ) : (
          students.map((student) => (
            <div key={student.id} className="list-item">
              <span>{student.name}</span>
              <button onClick={() => onDeleteStudent(student.id)} className="delete-btn">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
