// src/components/Admin/UserManagement/GroupList.tsx
'use client';

import React from 'react';
import styles from './GroupList.module.scss';

type Group = { id: string; name: string; role: string; memberCount: number };

type Props = {
  groups: Group[];
  selectedGroup: string;
  onGroupSelect: (groupId: string) => void;
  totalUsers: number;
};

export default function GroupList({ groups, selectedGroup, onGroupSelect, totalUsers }: Props) {
  return (
    <div className={styles.container}>

      <div className={styles.list} role="list">
        <button
          className={`${styles.item} ${selectedGroup === 'all' ? styles.active : ''}`}
          role="listitem"
          onClick={() => onGroupSelect('all')}
        >
          <span className={styles.name}>All users</span>
          <span className={styles.count}>{totalUsers}</span>
        </button>
        {groups.map(g => (
          <button
            key={g.id}
            className={`${styles.item} ${selectedGroup === g.id ? styles.active : ''}`}
            role="listitem"
            onClick={() => onGroupSelect(g.id)}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className={styles.name}>{g.name}</span>
              <span className={styles.meta}>{g.role}</span>
            </div>
            <span className={styles.count}>{g.memberCount}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
