'use client';

import React, { useEffect } from 'react';
import styles from './GlobalMessage.module.scss';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';


interface GlobalMessageProps {
  isVisible: any;
  message: any;
  type?: any;
  onClose?: any;
}

const GlobalMessage: React.FC<GlobalMessageProps> = ({
  isVisible,
  message,
  type = 'error',
  onClose,
}) => {
  useEffect(() => {
    if (isVisible) {
      const duration = type === 'success' || type === 'info' ? 3000 : 5000;
      const timer = setTimeout(() => onClose?.(), duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, type]);

  if (!isVisible) return null;

const getIcon = () => {
  switch (type) {
    case 'error':
      return <FiXCircle />;
    case 'success':
      return <FiCheckCircle />;
    case 'warning':
      return <FiAlertTriangle />;
    case 'info':
      return <FiInfo />;
    default:
      return <FiXCircle />;
  }
};


  return (
    <div className={`${styles.globalMessage} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{getIcon()}</span>
        <span className={styles.text}>{message}</span>
      </div>

      {onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
      )}
    </div>
  );
};

export default GlobalMessage;
