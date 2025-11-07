'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './FilterBar.module.scss';
import SearchBar from '@/components/common/SearchBar/SearchBar';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: string[];
    priority: string[];
    frequency: string[];
  };
  onFilterChange: (filters: any) => void;
  onSendReminder?: () => void;
  onDownloadReport?: () => void;
  isSaving?: boolean;
  selectedCount?: number;
}

type FilterCategory = 'priority' | 'frequency' | 'status';

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onSendReminder,
  onDownloadReport,
  isSaving = false,
  selectedCount = 0
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({...filters});
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('priority');
  const filterModalRef = useRef<HTMLDivElement>(null);

  // Initialize with empty arrays if filters prop is empty
  useEffect(() => {
    if (!filters.status) filters.status = [];
    if (!filters.priority) filters.priority = [];
    if (!filters.frequency) filters.frequency = [];
    
    setTempFilters({...filters});
  }, [filters]);

  // Close filter modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
        setShowFilterModal(false);
      }
    };

    if (showFilterModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterModal]);

  const toggleFilterItem = (category: FilterCategory, value: string) => {
    setTempFilters(prev => {
      const newFilters = {...prev};
      
      if (!newFilters[category]) newFilters[category] = [];
      
      if (newFilters[category].includes(value)) {
        newFilters[category] = newFilters[category].filter(item => item !== value);
      } else {
        newFilters[category] = [...newFilters[category], value];
      }
      
      return newFilters;
    });
  };

  const toggleSelectAll = (category: FilterCategory, allValues: string[]) => {
    setTempFilters(prev => {
      const newFilters = {...prev};
      
      if (!newFilters[category]) newFilters[category] = [];
      
      // If all items are selected, deselect all. Otherwise, select all.
      if (newFilters[category].length === allValues.length) {
        newFilters[category] = [];
      } else {
        newFilters[category] = [...allValues];
      }
      
      return newFilters;
    });
  };

  const applyFilters = () => {
    onFilterChange(tempFilters);
    setShowFilterModal(false);
  };

  const cancelFilters = () => {
    setTempFilters({...filters});
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      status: [],
      priority: [],
      frequency: []
    };
    
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onSearchChange('');
    setShowFilterModal(false);
  };

  // Define all possible values for each category
  const allPriorityValues = ['High', 'Low'];
  const allFrequencyValues = ['Monthly', 'Quarterly', 'Annual'];
  const allStatusValues = ['Prepare', 'Review', 'Completed', 'Rejected'];

  const hasActiveFilters = filters.status?.length > 0 || filters.priority?.length > 0 || filters.frequency?.length > 0;
  const totalActiveFilters = (filters.status?.length || 0) + (filters.priority?.length || 0) + (filters.frequency?.length || 0);

  // Get active values based on current category
  const getActiveValues = () => {
    switch (activeCategory) {
      case 'priority':
        return allPriorityValues;
      case 'frequency':
        return allFrequencyValues;
      case 'status':
        return allStatusValues;
      default:
        return [];
    }
  };

  // Render options for the active category
  const renderFilterOptions = () => {
    const activeValues = getActiveValues();
    
    return (
      <div className={styles.filterOptions}>
        <label className={styles.filterCheckbox}>
          <input 
            type="checkbox"
            checked={tempFilters[activeCategory]?.length === activeValues.length}
            onChange={() => toggleSelectAll(activeCategory, activeValues)}
          />
          <span>Select all</span>
        </label>
        
        {activeValues.map(value => (
          <label key={value} className={styles.filterCheckbox}>
            <input 
              type="checkbox"
              checked={tempFilters[activeCategory]?.includes(value)}
              onChange={() => toggleFilterItem(activeCategory, value)}
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.tableHeader}>
      <h2 className={styles.tableTitle}>Reconciliations</h2>
      
      <div className={styles.rightSection}>
        {/* Filter Button */}
        
        <div className={styles.filterContainer} style={{ position: 'relative' }}>
          <button 
            className={`${styles.filterBtn} ${hasActiveFilters ? styles.active : ''}`}
            onClick={() => setShowFilterModal(!showFilterModal)}
            title="Click to show/hide filters"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2H2L6.66667 7.44667V11.3333L9.33333 12.6667V7.44667L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filter
            {hasActiveFilters && <span className={styles.badge}>{totalActiveFilters}</span>}
          </button>

          {/* Filter Modal */}
          {showFilterModal && (
            <div className={styles.filterModalBackdrop}>
              <div className={styles.filterModal} ref={filterModalRef}>
                <div className={styles.filterModalHeader}>
                  <h3>Filter</h3>
                  <button 
                    className={styles.closeButton} 
                    onClick={() => setShowFilterModal(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className={styles.filterContent}>
                  <div className={styles.filterSidebar}>
                    <div 
                      className={`${styles.filterCategoryItem} ${activeCategory === 'priority' ? styles.active : ''}`}
                      onClick={() => setActiveCategory('priority')}
                    >
                      Priority
                      {tempFilters.priority?.length > 0 && (
                        <span className={styles.filterCategoryBadge}>{tempFilters.priority.length}</span>
                      )}
                    </div>
                    <div 
                      className={`${styles.filterCategoryItem} ${activeCategory === 'frequency' ? styles.active : ''}`}
                      onClick={() => setActiveCategory('frequency')}
                    >
                      Frequency
                      {tempFilters.frequency?.length > 0 && (
                        <span className={styles.filterCategoryBadge}>{tempFilters.frequency.length}</span>
                      )}
                    </div>
                    <div 
                      className={`${styles.filterCategoryItem} ${activeCategory === 'status' ? styles.active : ''}`}
                      onClick={() => setActiveCategory('status')}
                    >
                      Status
                      {tempFilters.status?.length > 0 && (
                        <span className={styles.filterCategoryBadge}>{tempFilters.status.length}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.filterOptionsContainer}>
                    {renderFilterOptions()}
                  </div>
                </div>
                
                <div className={styles.filterActions}>
                  <button className={styles.resetBtn} onClick={resetFilters}>
                    Reset filters
                  </button>
                  <div className={styles.actionButtons}>
                    <button className={styles.cancelBtn} onClick={cancelFilters}>
                      Cancel
                    </button>
                    <button className={styles.applyBtn} onClick={applyFilters}>
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Box */}
        <div className={styles.searchBox}>

                    <SearchBar
            value={searchTerm|| ''}
            onChange={(e: { target: { value: string; }; }) => onSearchChange(e.target.value)}
            placeholder="Search"
          />
      
        </div>

        {/* Send Reminder Button */}
        <button 
          className={`${styles.actionBtn} ${styles.reminderBtn}`}
          onClick={onSendReminder}
          disabled={isSaving}
          title={selectedCount > 0 ? `Send reminder to ${selectedCount} selected items` : 'Select items to send reminders'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 5.33333V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Send reminder
          {selectedCount > 0 && <span className={styles.countBadge}>{selectedCount}</span>}
        </button>

        {/* Download Report Button */}
        <button 
          className={`${styles.actionBtn} ${styles.downloadBtn}`}
          onClick={onDownloadReport}
          disabled={isSaving}
          title="Download reconciliation report"
        >
          {isSaving ? (
            <>
              <span className={styles.spinner}></span>
              Downloading...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.66667 6.66667L8 10L11.3333 6.66667M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FilterBar;