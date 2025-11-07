'use client';

import React, { useState } from 'react';
import styles from './ReconciliationControlTable.module.scss';

interface Reconciliation {
  id: string;
  name: string;
  active: 'Yes' | 'Disabled';
  accountType: 'Standard' | 'Rollup parent';
  frequency: 'Monthly' | 'Quarterly' | 'Quaterly';
  risk: 'High' | 'Low';
  preparer: string;
  reviewer: string;
}

interface TableProps {
  reconciliations: Reconciliation[];
}

type SortField = 'id' | 'name' | 'active' | 'accountType' | 'frequency' | 'risk' | 'preparer' | 'reviewer';
type SortOrder = 'asc' | 'desc';

const Table: React.FC<TableProps> = ({ reconciliations }) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = [...reconciliations].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.sortIcon}>
          <path d="M8 4L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5 7L8 4L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 9L8 12L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.sortIconActive}>
        <path d="M8 12V4M8 4L5 7M8 4L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.sortIconActive}>
        <path d="M8 4V12M8 12L11 9M8 12L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>
              <div className={styles.thContent}>
                Reconciliation ID
                {renderSortIcon('id')}
              </div>
            </th>
            <th onClick={() => handleSort('name')}>
              <div className={styles.thContent}>
                Name
                {renderSortIcon('name')}
              </div>
            </th>
            <th onClick={() => handleSort('active')}>
              <div className={styles.thContent}>
                Active
                {renderSortIcon('active')}
              </div>
            </th>
            <th onClick={() => handleSort('accountType')}>
              <div className={styles.thContent}>
                Account type
                {renderSortIcon('accountType')}
              </div>
            </th>
            <th onClick={() => handleSort('frequency')}>
              <div className={styles.thContent}>
                Frequency
                {renderSortIcon('frequency')}
              </div>
            </th>
            <th onClick={() => handleSort('risk')}>
              <div className={styles.thContent}>
                Risk
                {renderSortIcon('risk')}
              </div>
            </th>
            <th onClick={() => handleSort('preparer')}>
              <div className={styles.thContent}>
                Preparer
                {renderSortIcon('preparer')}
              </div>
            </th>
            <th onClick={() => handleSort('reviewer')}>
              <div className={styles.thContent}>
                Reviewer
                {renderSortIcon('reviewer')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={8} className={styles.noData}>
                No reconciliations found
              </td>
            </tr>
          ) : (
            sortedData.map((rec) => (
              <tr key={rec.id} className={styles.tableRow}>
                <td className={styles.idCell}>{rec.id}</td>
                <td className={styles.nameCell}>{rec.name}</td>
                <td>
                  <span className={`${styles.statusBadge} ${rec.active === 'Disabled' ? styles.disabled : styles.active}`}>
                    {rec.active}
                  </span>
                </td>
                <td>{rec.accountType}</td>
                <td>{rec.frequency}</td>
                <td>
                  <span className={`${styles.riskBadge} ${rec.risk === 'High' ? styles.high : styles.low}`}>
                    {rec.risk === 'High' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 4V6M6 8H6.005M11 6C11 8.7614 8.7614 11 6 11C3.2386 11 1 8.7614 1 6C1 3.2386 3.2386 1 6 1C8.7614 1 11 3.2386 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {rec.risk === 'Low' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 8V6M6 4H6.005M11 6C11 8.7614 8.7614 11 6 11C3.2386 11 1 8.7614 1 6C1 3.2386 3.2386 1 6 1C8.7614 1 11 3.2386 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {rec.risk}
                  </span>
                </td>
                <td>{rec.preparer}</td>
                <td>{rec.reviewer}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;