'use client';

import React, { useState } from 'react';
import styles from './RecControlHeader.module.scss';
import DatePicker from '@/components/common/DatePicker/DatePicker';

interface RecControlHeaderProps {
  currentPeriodData: any;
  loading: boolean;
  locked: boolean;
  onEditPeriod: () => void;
  onStartNewPeriod: () => void;
  onSetOverdue: any;
  selectedMonth: string;
  defaultPeriod: string;
  onMonthChange: (month: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const RecControlHeader: React.FC<RecControlHeaderProps> = ({
  currentPeriodData,
  loading,
  locked,
  onEditPeriod,
  onSetOverdue,
  onStartNewPeriod,
  selectedMonth,
  defaultPeriod,
  onMonthChange,
  onDateRangeChange
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Handle month change locally and pass to parent
  const handleMonthChange = (month: string) => {
    if (onMonthChange) {
      onMonthChange(month);
    }
    setIsMonthPickerOpen(false);
  };

  // Handle date range change locally and pass to parent
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  };

  if (loading) {
    return (
      <div className={styles.headerContainer}>
        <div className="text-center py-4">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Title and Action Buttons Row */}
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>Reconciliation control</h1>
        <div className={styles.actionButtons}>
          <button className={styles.btnOutline} onClick={onEditPeriod}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit period
          </button>
          <button className={styles.btnOutline} onClick={onSetOverdue}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12.6667 7.33337H3.33333C2.59695 7.33337 2 7.93033 2 8.66671V13.3334C2 14.0698 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0698 14 13.3334V8.66671C14 7.93033 13.403 7.33337 12.6667 7.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.66667 7.33337V4.66671C4.66667 3.78265 5.01786 2.9348 5.64298 2.30968C6.2681 1.68456 7.11595 1.33337 8 1.33337C8.88406 1.33337 9.7319 1.68456 10.357 2.30968C10.9821 2.9348 11.3333 3.78265 11.3333 4.66671V7.33337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Set Overdue
          </button>
          <button className={styles.btnPrimary} onClick={onStartNewPeriod}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.33337V14.6667M1.33333 8H14.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Start new period
          </button>
          <DatePicker
            selectedMonth={selectedMonth}
            defaultPeriod={defaultPeriod}
            isOpen={isMonthPickerOpen}
            onToggle={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            onMonthChange={handleMonthChange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Info Cards Section - 4 cards in one row */}
      <div className={styles.periodInfo}>
        <div className={styles.infoItem}>
          <div className={styles.label}>Working period</div>
          <div className={styles.value}>
            {currentPeriodData?.workingPeriod || selectedMonth || defaultPeriod }
          </div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.label}>Reconciliation period</div>
          <div className={styles.value}>
            {currentPeriodData?.reconciliationPeriod || 'June 2025'}
          </div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.label}>High priority deadline</div>
          <div className={styles.value}>
            {currentPeriodData?.highPriorityDeadline || '6 July 2025'}
          </div>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.label}>Low priority deadline</div>
          <div className={styles.value}>
            {currentPeriodData?.lowPriorityDeadline || '16 July 2025'}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecControlHeader;