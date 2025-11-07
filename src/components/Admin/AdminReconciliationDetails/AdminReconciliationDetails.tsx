'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AdminReconciliationDetails.module.scss';
import SidePanel from '@/components/common/SidePanel/SidePanel';
import Calendar from '@/components/common/Calendar/Calendar';
import { updatePeriod } from '@/services/admin/admin.service';

interface AdminReconciliationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodData: {
    id: string;
    workingPeriod: string;
    reconciliationPeriod: string;
    highPriorityDeadline: string;
    lowPriorityDeadline: string;
    locked?: boolean;
  } | null;
  onUpdatePeriod: (data: {
    workingPeriod: string;
    reconciliationPeriod: string;
    highPriorityDeadline: string;
    lowPriorityDeadline: string;
  }) => Promise<void>;
  isSaving?: any;
  userId: any;
}

const AdminReconciliationDetails: React.FC<AdminReconciliationDetailsProps> = ({
  isOpen,
  onClose,
  currentPeriodData,
  onUpdatePeriod,
  isSaving = false,
  userId
}) => {
  // ===== STATE =====
  const [workingPeriod, setWorkingPeriod] = useState('');
  const [reconciliationPeriod, setReconciliationPeriod] = useState('');
  const [highPriorityDeadline, setHighPriorityDeadline] = useState('');
  const [lowPriorityDeadline, setLowPriorityDeadline] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeCalendar, setActiveCalendar] = useState<'working' | 'reconciliation' | 'highPriority' | 'lowPriority' | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  // ===== INITIALIZE FROM currentPeriodData =====
  useEffect(() => {
    if (currentPeriodData && isOpen) {
      setWorkingPeriod(currentPeriodData.workingPeriod || '');
      setReconciliationPeriod(currentPeriodData.reconciliationPeriod || '');
      setHighPriorityDeadline(currentPeriodData.highPriorityDeadline || '');
      setLowPriorityDeadline(currentPeriodData.lowPriorityDeadline || '');
      setErrorMessage('');
    }
  }, [currentPeriodData, isOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setActiveCalendar(null);
      }
    };

    if (activeCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeCalendar]);

  // ===== HELPERS =====
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      
      if (dateString.includes(' ') && !dateString.includes('-') && !dateString.includes('/')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatDateForAPI = (dateString: string) => {
    try {
      if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // ===== HANDLERS =====
  const handleUpdate = async () => {
    if (!userId) {
      setErrorMessage('User ID is required to update period');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage('');
      
      // Format dates consistently before sending to backend
      const highPriorityDate = formatDateForAPI(highPriorityDeadline);
      const lowPriorityDate = formatDateForAPI(lowPriorityDeadline);
      
      const periodRequest = {
        workingPeriod: workingPeriod.trim(),
        reconciliationPeriod: reconciliationPeriod.trim(),
        highPriorityDeadline: highPriorityDate,
        lowPriorityDeadline: lowPriorityDate
      };
      
      // Direct API call using updatePeriod function
      const updated = await updatePeriod(periodRequest, userId);
      
      if (updated) {
        // Notify parent component about the update to refresh data
        await onUpdatePeriod(periodRequest);
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating period:', error);
      setErrorMessage(error?.response?.data?.message || 'Failed to update period');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateSelect = (date: string, field: 'working' | 'reconciliation' | 'highPriority' | 'lowPriority') => {
    try {
      // Check if this is our JSON format for month selection
      if (date.startsWith('{') && date.endsWith('}')) {
        const parsedData = JSON.parse(date);
        
        switch (field) {
          case 'working':
            setWorkingPeriod(parsedData.display);
            break;
          case 'reconciliation':
            setReconciliationPeriod(parsedData.display);
            break;
          default:
            console.error('Unexpected month format for date field');
            break;
        }
      } else {
        // Handle regular date selection (already in ISO format)
        switch (field) {
          case 'working':
            setWorkingPeriod(date);
            break;
          case 'reconciliation':
            setReconciliationPeriod(date);
            break;
          case 'highPriority':
          case 'lowPriority':
            const fieldSetter = field === 'highPriority' ? setHighPriorityDeadline : setLowPriorityDeadline;
            fieldSetter(date);
            break;
        }
      }
      setActiveCalendar(null);
    } catch (error) {
      console.error(`Error handling ${field} date selection:`, error);
      // Fallback to setting the original string
      switch (field) {
        case 'working':
          setWorkingPeriod(date);
          break;
        case 'reconciliation':
          setReconciliationPeriod(date);
          break;
        case 'highPriority':
          setHighPriorityDeadline(date);
          break;
        case 'lowPriority':
          setLowPriorityDeadline(date);
          break;
      }
      setActiveCalendar(null);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Edit period"
      width="600px"
    >
      <div className={styles.detailsContainer}>
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}
        <div className={styles.contentArea}>
          <div className={styles.editPeriodSection}>
            {/* Working Period & Reconciliation Period Row */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Working period</label>
                <div 
                  className={styles.inputWrapper}
                  onClick={() => setActiveCalendar(activeCalendar === 'working' ? null : 'working')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.calendarIcon}>
                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type="text" 
                    value={workingPeriod}
                    readOnly
                    placeholder="July 2025"
                    disabled={isSaving || isUpdating}
                  />
                </div>
                {activeCalendar === 'working' && (
                  <div className={styles.calendarDropdown} ref={calendarRef}>
                    <Calendar
                      selectedDate={workingPeriod}
                      onSelectDate={(date) => handleDateSelect(date, 'working')}
                      mode="month"
                    />
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Reconciliation period</label>
                <div 
                  className={styles.inputWrapper}
                  onClick={() => setActiveCalendar(activeCalendar === 'reconciliation' ? null : 'reconciliation')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.calendarIcon}>
                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type="text" 
                    value={reconciliationPeriod}
                    readOnly
                    placeholder="June 2025"
                    disabled={isSaving || isUpdating}
                  />
                </div>
                {activeCalendar === 'reconciliation' && (
                  <div className={styles.calendarDropdown} ref={calendarRef}>
                    <Calendar
                      selectedDate={reconciliationPeriod}
                      onSelectDate={(date) => handleDateSelect(date, 'reconciliation')}
                      mode="month"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* High Priority & Low Priority Deadline Row */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label>High priority deadline</label>
                <div 
                  className={`${styles.inputWrapper} ${activeCalendar === 'highPriority' ? styles.focused : ''}`}
                  onClick={() => setActiveCalendar(activeCalendar === 'highPriority' ? null : 'highPriority')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.calendarIcon}>
                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type="text" 
                    value={formatDate(highPriorityDeadline)}
                    readOnly
                    placeholder="6 July 2025"
                    disabled={isSaving || isUpdating}
                  />
                </div>
                {activeCalendar === 'highPriority' && (
                  <div className={styles.calendarDropdown} ref={calendarRef}>
                    <Calendar
                      selectedDate={highPriorityDeadline}
                      onSelectDate={(date) => handleDateSelect(date, 'highPriority')}
                      mode="date"
                    />
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Low priority deadline</label>
                <div 
                  className={`${styles.inputWrapper} ${activeCalendar === 'lowPriority' ? styles.focused : ''}`}
                  onClick={() => setActiveCalendar(activeCalendar === 'lowPriority' ? null : 'lowPriority')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.calendarIcon}>
                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type="text" 
                    value={formatDate(lowPriorityDeadline)}
                    readOnly
                    placeholder="16 July 2025"
                    disabled={isSaving || isUpdating}
                  />
                </div>
                {activeCalendar === 'lowPriority' && (
                  <div className={styles.calendarDropdown} ref={calendarRef}>
                    <Calendar
                      selectedDate={lowPriorityDeadline}
                      onSelectDate={(date) => handleDateSelect(date, 'lowPriority')}
                      mode="date"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className={styles.footer}>
          <button 
            className={styles.updateButton}
            onClick={handleUpdate}
            disabled={isSaving || isUpdating}
          >
            {isSaving || isUpdating ? 'Saving...' : 'Update'}
          </button>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSaving || isUpdating}
          >
            Cancel
          </button>
        </div>
      </div>
    </SidePanel>
  );
};

export default AdminReconciliationDetails;