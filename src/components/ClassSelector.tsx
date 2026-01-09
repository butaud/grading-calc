import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import type { Class } from '../types';
import './ClassSelector.css';

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onRenameClass: (classId: string) => void;
  onDeleteClass: (classId: string) => void;
  onAddClass: () => void;
}

export function ClassSelector({
  classes,
  selectedClassId,
  onSelectClass,
  onRenameClass,
  onDeleteClass,
  onAddClass
}: ClassSelectorProps) {
  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <Listbox value={selectedClassId} onChange={onSelectClass}>
      <div className="class-selector">
        <Listbox.Button className="class-selector-button">
          <span className="class-selector-name">{selectedClass?.name || 'Select a class'}</span>
          <span className="class-selector-chevron">▼</span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="class-selector-options">
            {classes.map((cls) => (
              <Listbox.Option
                key={cls.id}
                value={cls.id}
                className={({ active }) =>
                  `class-selector-option ${active ? 'active' : ''}`
                }
              >
                {({ selected }) => (
                  <div className="class-option-content">
                    <span className={`class-option-name ${selected ? 'selected' : ''}`}>
                      {cls.name}
                    </span>
                    <div className="class-option-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameClass(cls.id);
                        }}
                        className="class-option-btn"
                        title="Rename class"
                      >
                        ✎
                      </button>
                      {classes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClass(cls.id);
                          }}
                          className="class-option-btn delete"
                          title="Delete class"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Listbox.Option>
            ))}

            <div className="class-selector-divider" />

            <button
              onClick={(e) => {
                e.preventDefault();
                onAddClass();
              }}
              className="class-selector-add"
            >
              <span>+ Add new class</span>
            </button>
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
