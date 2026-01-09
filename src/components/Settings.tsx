import { useState } from 'react';
import { LetterGradeSettings } from './LetterGradeSettings';
import type { LetterGrade } from '../types';
import { CURRENT_VERSION } from '../migrations';

interface SettingsProps {
  classes: any[]; // All classes for export
  letterGrades: LetterGrade[];
  version: number;
  onUpdateLetterGrades: (letterGrades: LetterGrade[]) => void;
  onImportData: (data: any) => void;
  onClose: () => void;
}

export function Settings({ classes, letterGrades, version, onUpdateLetterGrades, onImportData, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'letterGrades' | 'export'>('letterGrades');
  const [exportUrl, setExportUrl] = useState<string>('');

  const handleGenerateExportLink = () => {
    const exportData = {
      version: CURRENT_VERSION,
      classes,
      letterGrades
    };

    const json = JSON.stringify(exportData);
    const encoded = btoa(json);
    const url = `${window.location.origin}${window.location.pathname}?import=${encoded}`;
    setExportUrl(url);
  };

  const handleExportJSON = () => {
    const exportData = {
      version: CURRENT_VERSION,
      classes,
      letterGrades
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grading-calc-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);

        // Basic validation - migrations will handle version updates
        if (!data || typeof data !== 'object') {
          alert('Invalid JSON file format.');
          return;
        }

        if (confirm('This will replace all current data. Are you sure you want to continue?')) {
          onImportData(data);
          alert('Data imported successfully!');
        }
      } catch (error) {
        alert('Error parsing JSON file. Please ensure it is a valid JSON file.');
        console.error(error);
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
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
          {activeTab === 'letterGrades' && (
            <LetterGradeSettings
              letterGrades={letterGrades}
              onUpdateLetterGrades={onUpdateLetterGrades}
            />
          )}

          {activeTab === 'export' && (
            <div className="section">
              <h2>Export Data</h2>
              <p className="hint" style={{ marginBottom: '1.5rem' }}>
                Current data version: {version}
              </p>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>Export as JSON File</h3>
                <p className="hint">
                  Download all your data as a JSON file that you can save and import later.
                </p>
                <button onClick={handleExportJSON} className="primary-btn">
                  Download JSON File
                </button>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>Import from JSON File</h3>
                <p className="hint">
                  Upload a previously exported JSON file to restore your data. This will replace all current data.
                </p>
                <label className="primary-btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  Choose JSON File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>Export as Shareable Link</h3>
                <p className="hint">
                  Generate a URL that contains all your data. You can use this link to import your data into another browser or share it with others.
                </p>
                <button onClick={handleGenerateExportLink} className="secondary-btn">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
