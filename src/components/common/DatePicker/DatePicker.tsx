'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './DatePicker.module.scss';
import Image from 'next/image';

interface DatePickerProps {
  selectedMonth: string;
  defaultPeriod?: string;
  isOpen: boolean;
  onToggle: () => void;
  onMonthChange: (month: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  className?: string;
  popoverClassName?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedMonth,
  defaultPeriod,
  isOpen,
  onToggle,
  onMonthChange,
  onDateRangeChange,
  className,
  popoverClassName,
}) => {
  const [year, setYear] = useState<number>(() => {
    if (selectedMonth) {
      const parts = selectedMonth.split(' ');
      const y = Number(parts[parts.length - 1]);
      return Number.isFinite(y) && y > 0 ? y : 2025;
    }
    return 2025;
  });

  // ✅ NEW: Local state for selected month (UI state, not committed)
  const [tempSelectedMonth, setTempSelectedMonth] = useState<string>(selectedMonth || '');
  const [tempYear, setTempYear] = useState<number>(year);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ✅ FIX 1: Stop propagation on year navigation
  const handleYearChange = (direction: 'prev' | 'next') => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setTempYear(prev => (direction === 'prev' ? prev - 1 : prev + 1));
    };
  };

  // ✅ FIX 2: Just update temp selection, don't close popover
  const handleMonthSelect = (month: string) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      const monthStr = `${month} ${tempYear}`;
      setTempSelectedMonth(monthStr);
    };
  };

  // ✅ FIX 3: Reset to previous state
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const resetPeriod = defaultPeriod || new Date().toLocaleString('default', { 
      month: 'short', 
      year: 'numeric' 
    });
    
    setTempSelectedMonth(resetPeriod);
    
    const parts = resetPeriod.split(' ');
    const y = Number(parts[parts.length - 1]);
    if (Number.isFinite(y) && y > 0) {
      setTempYear(y);
    }
  };

  // ✅ FIX 4: Cancel - discard changes and close
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Reset temp state to original
    setTempSelectedMonth(selectedMonth || '');
    const parts = (selectedMonth || '').split(' ');
    const y = Number(parts[parts.length - 1]);
    if (Number.isFinite(y) && y > 0) {
      setTempYear(y);
    }
    onToggle();
  };

  // ✅ FIX 5: Apply - commit changes and close
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    
    // Commit the temp selection
    onMonthChange(tempSelectedMonth);
    
    // Calculate and send date range
    if (onDateRangeChange && tempSelectedMonth) {
      const parts = tempSelectedMonth.split(' ');
      const monthName = parts[0];
      const monthIndex = months.findIndex(m => m === monthName);
      
      if (monthIndex !== -1) {
        const startDate = new Date(tempYear, monthIndex, 1);
        const endDate = new Date(tempYear, monthIndex + 1, 0);
        
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        onDateRangeChange(formatDate(startDate), formatDate(endDate));
      }
    }
    
    // Close popover
    onToggle();
  };

  // ✅ FIX 6: Stop propagation on popover content
  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!isOpen) return;
      if (popoverRef.current?.contains(target)) return;
      if (containerRef.current?.contains(target)) return;
      onToggle();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onToggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ✅ Initialize temp state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedMonth(selectedMonth || '');
      const parts = (selectedMonth || '').split(' ');
      const y = Number(parts[parts.length - 1]);
      if (Number.isFinite(y) && y > 0) {
        setTempYear(y);
      }
    }
  }, [isOpen, selectedMonth]);

  // ✅ Check if month is selected in temp state
  const isActive = useCallback(
    (m: string) => {
      if (!tempSelectedMonth) return false;
      return tempSelectedMonth.toLowerCase().includes(m.toLowerCase());
    },
    [tempSelectedMonth]
  );

  const displayMonth = selectedMonth || defaultPeriod || 'Jul 2025';

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={`${styles.datePicker} ${className ?? ''}`} 
        onClick={onToggle} 
        aria-haspopup="dialog" 
        aria-expanded={isOpen}
      >
        <Image
          src="/assets/preparer/calendar.svg"
          alt="Calendar"
          width={16}
          height={16}
          className={styles.sortIcon}
        />
        <span>{displayMonth}</span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${popoverClassName ?? ''}`}
          role="dialog"
          aria-label="Pick month"
          onClick={handlePopoverClick}
        >
          <div className={styles.header}>
            <button 
              className={styles.navBtn} 
              onClick={handleYearChange('prev')} 
              aria-label="Previous year"
              type="button"
            >
              ‹
            </button>
            <span className={styles.year}>{tempYear}</span>
            <button 
              className={styles.navBtn} 
              onClick={handleYearChange('next')} 
              aria-label="Next year"
              type="button"
            >
              ›
            </button>
          </div>

          <div className={styles.monthGrid}>
            {months.map((month) => (
              <button
                key={month}
                type="button"
                className={`${styles.monthButton} ${isActive(month) ? styles.active : ''}`}
                onClick={handleMonthSelect(month)}
              >
                {month.toUpperCase()}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button 
              type="button"
              className={styles.resetButton} 
              onClick={handleReset}
            >
              Reset
            </button>
            <div className={styles.actionButtons}>
              <button 
                type="button"
                className={styles.cancelButton} 
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                type="button"
                className={styles.applyButton} 
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;