'use client';

import React from 'react';
import styles from './ReconciliationControlTable.module.scss';
import { getPriorityColorCode, getPriorityIcon } from '@/app/utils/utils';

type SortField =
  | 'reconciliationId'
  | 'reconciliationName'
  | 'active'
  | 'accountType'
  | 'frequency'
  | 'riskRating'
  | 'preparer'
  | 'reviewer';
type SortOrder = 'asc' | 'desc';

interface TableProps {
  reconciliations: any[];
  onSort?: (field: SortField) => void;
  currentSort?: { field: SortField; order: SortOrder };
  loading?: boolean;
  userId?: string | null;
}

const AllReconciliationTable: React.FC<TableProps> = ({
  reconciliations,
  onSort,
  currentSort,
  loading = false,
}) => {
  const getRiskBadgeClass = (riskRating: string) => {
    if (!riskRating) return styles.priorityLow; // maps to .priorityLow colors
    const x = riskRating.toLowerCase();
    if (x.includes('high risk') || x.includes('high impact')) return styles.priorityHigh; // maps to .priorityHigh
    if (x.includes('medium risk') || x.includes('medium impact')) return styles.statusInReview; // orange-like
    return styles.priorityLow;
  };

  const formatRiskRating = (riskRating: string) => {
    if (!riskRating) return 'Low';
    const x = riskRating.toLowerCase();
    if (x.includes('high risk') || x.includes('high impact')) return 'High';
    if (x.includes('medium risk') || x.includes('medium impact')) return 'Medium';
    return 'Low';
  };

  const renderSortIcon = (field: SortField) => {
    if (!currentSort || currentSort.field !== field) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={styles.sortIcon}>
          <path d="M8 4L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5 7L8 4L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 9L8 12L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return currentSort.order === 'asc' ? (
      <svg width="16" height="16" viewBox="0 0 16 16" className={styles.sortIcon}>
        <path d="M8 12V4M8 4L5 7M8 4L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 16 16" className={styles.sortIcon}>
        <path d="M8 4V12M8 12L11 9M8 12L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const SortableTh: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      onClick={() => onSort?.(field)} 
      role="button" 
      aria-label={`Sort by ${field}`}
      className="sortableHeader"
    >
      <span>
        {children}
        {renderSortIcon(field)}
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.noData}>
          <div>
            <div className={styles.sortIcon} aria-hidden />
            <p>Loading reconciliations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={`table table-hover ${styles.table}`}>
        <thead className="table-light">
            <tr>
              <SortableTh field="reconciliationId">Rec ID</SortableTh>
              <SortableTh field="reconciliationName">Name</SortableTh>
              <SortableTh field="active">Active</SortableTh>
              <SortableTh field="accountType">Account type</SortableTh>
              <SortableTh field="frequency">Frequency</SortableTh>
              <SortableTh field="riskRating">Risk</SortableTh>
              <SortableTh field="preparer">Preparer</SortableTh>
              <SortableTh field="reviewer">Reviewer</SortableTh>
            </tr>
          </thead>
          <tbody>
            {reconciliations.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  <div>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 16V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 32H24.02" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No reconciliations found</p>
                    <span>Try adjusting your search or filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              reconciliations.map((rec) => (
                <tr key={rec.id}>
                  <td className="idCell" data-label="Reconciliation ID">{rec.reconciliationId || '—'}</td>
                  <td className="nameCell" title={rec.reconciliationName} data-label="Name">
                    {rec.reconciliationName || '—'}
                  </td>
                  <td data-label="Active">
                    {rec.disabled === false ? (
                      <span className="yesText">Yes</span>
                    ) : (
                      <span className="overdueYes">Disabled</span>
                    )}
                  </td>
                  <td data-label="Account type">{rec.recType || 'Standard'}</td>
                  <td data-label="Frequency">{rec.frequency || '—'}</td>
                  <td data-label="Risk">
                       <span className={`text-capitalize `}>
                                          {getPriorityIcon(formatRiskRating(rec.riskRating), `var(--bs-${getPriorityColorCode(formatRiskRating(rec.riskRating))})`)}
                                          {formatRiskRating(rec.riskRating)}
                                        </span>
                
                  </td>
                  <td data-label="Preparer">{rec.performerName || '—'}</td>
                  <td data-label="Reviewer">{rec.tier1Reviewer || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    
  );
};

export default AllReconciliationTable;
