'use client';

import React, { useState } from 'react';
import styles from './Calendar.module.scss';

interface CalendarProps {
  selectedDate?: string;
  onSelectDate: (date: string) => void;
  mode?: 'date' | 'month';
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  mode = 'date'
}) => {
  // Initialize currentDate, handling potential parsing issues
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      if (selectedDate) {
        // Try to parse the selected date
        const parsedDate = new Date(selectedDate);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
        
        // Handle "Month YYYY" format
        const monthYearMatch = selectedDate.match(/([A-Za-z]+)\s+(\d{4})/);
        if (monthYearMatch) {
          const monthName = monthYearMatch[1];
          const year = parseInt(monthYearMatch[2]);
          const monthIndex = monthNames.findIndex(m => 
            m.toLowerCase() === monthName.toLowerCase());
          
          if (monthIndex !== -1) {
            return new Date(year, monthIndex);
          }
        }
      }
      return new Date();
    } catch (error) {
      return new Date();
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = startingDayOfWeek;

    const days: Array<{ day: number; isCurrentMonth: boolean; isNextMonth: boolean }> = [];

    // Add previous month's trailing days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({ 
        day: prevMonthLastDay - i, 
        isCurrentMonth: false,
        isNextMonth: false
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ 
        day, 
        isCurrentMonth: true,
        isNextMonth: false
      });
    }

    // Add next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ 
        day, 
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format as YYYY-MM-DD
    const dateString = selected.toISOString().split('T')[0];
    onSelectDate(dateString);
  };

  const handleMonthClick = () => {
    // Return consistent format that can be easily parsed later
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Instead of returning "Month YYYY", return a date string of the first day of the month
    // This makes parsing more consistent
    const firstOfMonth = new Date(year, month, 1);
    const monthString = firstOfMonth.toISOString().split('T')[0].substring(0, 7); // Get YYYY-MM
    
    // Also include the formatted month name for display
    const displayMonth = `${monthNames[month]} ${year}`;
    
    // Return both formats as a JSON string that can be parsed later
    const returnValue = JSON.stringify({
      value: monthString,
      display: displayMonth
    });
    
    onSelectDate(returnValue);
  };

  const isToday = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number, isCurrentMonth: boolean) => {
    if (!selectedDate || !isCurrentMonth) return false;
    
    try {
      // Try to parse as ISO date first
      let selected = new Date(selectedDate);
      
      // If that fails, check if it might be our JSON format
      if (isNaN(selected.getTime()) && selectedDate.startsWith('{')) {
        try {
          const parsedObj = JSON.parse(selectedDate);
          selected = new Date(parsedObj.value);
        } catch (e) {
          return false;
        }
      }
      
      // If still invalid, try as a Month Year string
      if (isNaN(selected.getTime())) {
        const monthYearMatch = selectedDate.match(/([A-Za-z]+)\s+(\d{4})/);
        if (monthYearMatch) {
          const monthName = monthYearMatch[1];
          const year = parseInt(monthYearMatch[2]);
          const monthIndex = monthNames.findIndex(m => 
            m.toLowerCase() === monthName.toLowerCase());
          
          if (monthIndex !== -1) {
            selected = new Date(year, monthIndex, 1);
          }
        }
      }
      
      // If we have a valid date now, check if it matches
      if (!isNaN(selected.getTime())) {
        return (
          day === selected.getDate() &&
          currentDate.getMonth() === selected.getMonth() &&
          currentDate.getFullYear() === selected.getFullYear()
        );
      }
      
      return false;
    } catch (e) {
      return false;
    }
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={handlePrevMonth}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        
        <button className={styles.navButton} onClick={handleNextMonth}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {mode === 'date' && (
        <>
          <div className={styles.dayNames}>
            {dayNames.map((day) => (
              <div key={day} className={styles.dayName}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {days.map((dayObj, index) => (
              <div
                key={index}
                className={`${styles.day} ${
                  !dayObj.isCurrentMonth ? styles.otherMonth : ''
                } ${isToday(dayObj.day, dayObj.isCurrentMonth) ? styles.today : ''} ${
                  isSelected(dayObj.day, dayObj.isCurrentMonth) ? styles.selected : ''
                }`}
                onClick={() => dayObj.isCurrentMonth && handleDateClick(dayObj.day)}
              >
                {dayObj.day}
              </div>
            ))}
          </div>
        </>
      )}

      {mode === 'month' && (
        <div className={styles.monthSelect}>
          <p className={styles.monthSelectText}>
            Click to select {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
          <button className={styles.selectButton} onClick={handleMonthClick}>
            Select Month
          </button>
        </div>
      )}
    </div>
  );
};

export default Calendar;