'use client';

import React, { ReactNode } from 'react';
import styles from './SidePanel.module.scss';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
  width?: string;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  width = '700px'
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.visible : ''}`} onClick={onClose}>
        <button 
          className={styles.closeButtonOutside} 
          onClick={onClose} 
          aria-label="Close panel"
          style={{ '--panel-width': width } as React.CSSProperties}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div 
          className={styles.panel} 
          onClick={(e) => e.stopPropagation()}
          style={{ '--panel-width': width } as React.CSSProperties}
        >
          <div className={styles.header}>
            <h2>{title}</h2>
            {headerActions && (
              <div className={styles.headerActions}>
                {headerActions}
              </div>
            )}
          </div>
          
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
