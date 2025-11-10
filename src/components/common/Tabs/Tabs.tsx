// src/components/common/Tabs/Tabs.tsx
'use client';

import React from 'react';
import styles from './Tabs.module.scss';

export interface Tab {
  id: any;
  label: any;
  count?: any;
}

interface TabsProps {
  tabs: any;
  activeTab: any;
  onTabChange: any;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={styles.count} aria-hidden="true">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
