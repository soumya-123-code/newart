'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './FilterModal.module.scss';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: any;
  onFilterChange: (filters: { priority: string[]; currency: string[] }) => void;
  onApply: any;
  onReset: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filterOptions,
  onFilterChange,
  onApply,
  onReset,
}) => {
  const [activeTab, setActiveTab] = React.useState('Priority');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('Priority'); // Default to Priority tab
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  // Handler functions
  const handlePriorityChange = (value: string) => {
    const newPriority = filterOptions.priority.includes(value)
      ? filterOptions.priority.filter((v: string) => v !== value)
      : [...filterOptions.priority, value];
    onFilterChange({ ...filterOptions, priority: newPriority });
  };

  const handleCurrencyChange = (value: string) => {
    const newCurrency = filterOptions.currency.includes(value)
      ? filterOptions.currency.filter((v: string) => v !== value)
      : [...filterOptions.currency, value];
    onFilterChange({ ...filterOptions, currency: newCurrency });
  };

  // Select all handlers
  const handlePrioritySelectAll = (checked: boolean) => {
    onFilterChange({
      ...filterOptions,
      priority: checked ? ['High', 'Low'] : [],
    });
  };

  const handleCurrencySelectAll = (checked: boolean) => {
    onFilterChange({
      ...filterOptions,
      currency: checked ? ['GBP', 'EUR', 'CHF', 'SEK', 'CAD', 'AUD'] : [],
    });
  };

  // Check if all selected
  const allPrioritiesSelected = filterOptions.priority.length === 2;
  const allCurrenciesSelected = filterOptions.currency.length === 6;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div className={styles.filterOverlay} onClick={handleOverlayClick}>
      <div className={styles.filterPanel} role="dialog" aria-modal="true">
        {/* Header */}
        <header className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Filter</h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close filter"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        {/* Body with Sidebar and Content */}
        <div className={styles.panelMain}>
          {/* Left Sidebar Navigation */}
          <nav className={styles.navSidebar}>
            <button
              type="button"
              className={`${styles.navBtn} ${activeTab === 'Priority' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('Priority')}
            >
              Priority
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${activeTab === 'Currency' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('Currency')}
            >
              Currency
            </button>
          </nav>

          {/* Right Content Area */}
          <div className={styles.contentArea}>
            {/* Priority Tab */}
            {activeTab === 'Priority' && (
              <div className={styles.optionsList}>
                <label className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={allPrioritiesSelected}
                    onChange={(e) => handlePrioritySelectAll(e.target.checked)}
                  />
                  <span>Select all</span>
                </label>
                <label className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filterOptions.priority.includes('Low')}
                    onChange={() => handlePriorityChange('Low')}
                  />
                  <span>Low</span>
                </label>
                <label className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filterOptions.priority.includes('High')}
                    onChange={() => handlePriorityChange('High')}
                  />
                  <span>High</span>
                </label>
              </div>
            )}

            {/* Currency Tab */}
            {activeTab === 'Currency' && (
              <div className={styles.optionsList}>
                <label className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={allCurrenciesSelected}
                    onChange={(e) => handleCurrencySelectAll(e.target.checked)}
                  />
                  <span>Select all</span>
                </label>
                {['GBP', 'EUR', 'CHF', 'SEK', 'CAD', 'AUD'].map((currency) => (
                  <label key={currency} className={styles.optionItem}>
                    <input
                      type="checkbox"
                      checked={filterOptions.currency.includes(currency)}
                      onChange={() => handleCurrencyChange(currency)}
                    />
                    <span>{currency}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.panelFooter}>
          <button 
            type="button"
            className={styles.resetLink} 
            onClick={onReset}
          >
            Reset filters
          </button>
          <div className={styles.actionGroup}>
            <button 
              type="button"
              className={styles.btnCancel} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button"
              className={styles.btnApply} 
              onClick={onApply}
            >
              Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default FilterModal;