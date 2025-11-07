'use client';

import React, { useEffect, useRef, useState } from 'react';
import Button from '@/components/common/Button/Button';
import styles from './AddToGroupModal.module.scss';

type Group = { id: string; name: string; role: string; memberCount: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  // multi-select to match checkbox UI
  onAddToGroup: (groupIds: string[]) => void;
  selectedCount: number;
};

export default function AddToGroupModal({
  isOpen,
  onClose,
  groups,
  onAddToGroup,
  selectedCount,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // reset selection when closed
  useEffect(() => {
    if (!isOpen) setSelectedIds([]);
  }, [isOpen]);

  // outside click closes popover
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!isOpen) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isOpen, onClose]);

  // Esc closes popover
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function save() {
    if (selectedIds.length === 0) return;
    onAddToGroup(selectedIds); // parent closes on success
  }

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={styles.dropdownWrapper}
      role="menu"
      aria-label="Add selected users to groups"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.groupList}>
        {groups.map((g) => {
          const checked = selectedIds.includes(g.id);
          return (
            <div
              key={g.id}
              className={styles.groupOption}
              role="menuitemcheckbox"
              aria-checked={checked}
              onClick={() => toggle(g.id)}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checked}
                onChange={() => toggle(g.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={g.name}
              />
              <span className={styles.groupName}>{g.name}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.footerRow}>
        <span className={styles.selectionHint}>
          {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
        </span>
 
      </div>

      <div className={styles.actions}>
         <button
          type="button"
          className={styles.saveLink}
          onClick={save}
          disabled={selectedIds.length === 0}
          aria-disabled={selectedIds.length === 0}
        >
          Save
        </button>
      </div>
    </div>
  );
}
