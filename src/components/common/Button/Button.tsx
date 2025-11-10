'use client';

import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps {
  children: any;
  variant?: any;
  size?: any;
  fullWidth?: any;
  disabled?: any;
  onClick?: any;
  type?: any;
  icon?: any;
}

const Button: React.FC<ButtonProps> = React.memo(({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  icon,
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;