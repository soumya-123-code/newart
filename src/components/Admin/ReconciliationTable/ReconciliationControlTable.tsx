'use client';

import React, { useState, useMemo } from 'react';
import styles from './ReconciliationControlTable.module.scss';
import StatusBadge from '@/components/common/StatusBadge/StatusBadge';
import Pagination from '@/components/common/Pagination/Pagination';
import { getStatusColorCode, getPriorityColorCode, getPriorityIcon } from '@/app/utils/utils';
import Image from 'next/image';

interface Reconciliation {
  id: string;
  priority: string;
  status: string;
  preparer: string;
  reviewer: string;
  deadline: string;
  frequency: string;
  locked: boolean;
  overdue: boolean;
  account: string;
  entity: string;
  periodId?: string;
}

interface ReconciliationTableProps {
  reconciliations: Reconciliation[];
  loading: boolean;
  isSaving?: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  totalRecords: number;
}

type SortField = 'id' | 'priority' | 'status' | 'preparer' | 'reviewer' | 'deadline' | 'frequency';
type SortOrder = 'asc' | 'desc';

const ReconciliationControlTable: React.FC<ReconciliationTableProps> = ({
  reconciliations,
  loading,
  isSaving = false,
  selectedIds,
  onSelectionChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalRecords
}) => {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // ===== SORTING =====
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon based on current sort field and order
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <Image
          src="/assets/preparer/sort.svg"
          alt="Sort"
          width={16}
          height={16}
          className={styles.sortIcon}
        />
      );
    } else {
      return (
        <Image
          src={`/assets/preparer/sort.svg`}
          alt={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          width={16}
          height={16}
          className={styles.sortIcon}
        />
      );
    }
  };

  // ===== SELECTION =====
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(reconciliations.map(rec => rec.id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  };

  // ===== FILTERING & SORTING =====
  const sortedData = useMemo(() => {
    return [...reconciliations].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'deadline') {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [reconciliations, sortField, sortOrder]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const paginatedData = sortedData.slice(0, itemsPerPage);

  // ===== HELPERS =====
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Check if all or some items are selected for indeterminate checkbox state
  const isAllSelected = reconciliations.length > 0 && 
    reconciliations.every(rec => selectedIds.has(rec.id));
  
  const isSomeSelected = reconciliations.some(rec => selectedIds.has(rec.id)) && !isAllSelected;

  // Render loading state
  if (loading) {
    return (
      <div className={`${styles.loadingContainer} text-center py-5`}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={styles.tableContainer}>
      <table className={`table table-hover ${styles.table}`}>
        <thead className="table-light">
          <tr>
            <th className={styles.checkboxCell} style={{ width: '40px' }}>
              <input
                type="checkbox"
                className="form-check-input"
                onChange={handleSelectAll}
                checked={isAllSelected}
                ref={input => {
                  if (input) {
                    input.indeterminate = isSomeSelected;
                  }
                }}
              />
            </th>
            <th 
              onClick={() => handleSort('id')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
               Rec ID 
                {getSortIcon('id')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('priority')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Priority
                {getSortIcon('priority')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('status')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Status
                {getSortIcon('status')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('preparer')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Preparer
                {getSortIcon('preparer')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('reviewer')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Reviewer
                {getSortIcon('reviewer')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('deadline')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Deadline
                {getSortIcon('deadline')}
              </span>
            </th>
            <th 
              onClick={() => handleSort('frequency')} 
              style={{ cursor: 'pointer' }}
              className={styles.sortableHeader}
            >
              <span className="d-flex align-items-center gap-2">
                Frequency
                {getSortIcon('frequency')}
              </span>
            </th>
            <th style={{ width: '80px' }}>Locked</th>
            <th style={{ width: '80px' }}>Overdue</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-muted py-4">
                No reconciliations found
              </td>
            </tr>
          ) : (
            paginatedData.map((rec) => (
              <tr 
                key={rec.id} 
                className={selectedIds.has(rec.id) ? `table-active ${styles.selected}` : ''}
              >
                <td  onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.has(rec.id)}
                    onChange={(e) => handleSelectRow(rec.id, e)}
                  />
                </td>
                <td>
                  {rec.id}
                </td>
                <td>
                  <div >
                    <span className={`text-capitalize text-${getPriorityColorCode(rec.priority)}`}>
                      {getPriorityIcon(rec.priority, `var(--bs-${getPriorityColorCode(rec.priority)})`)}
                      {rec.priority}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={rec.status} />
                </td>
                <td>{rec.preparer}</td>
                <td>{rec.reviewer}</td>
                <td>{formatDate(rec.deadline)}</td>
                <td>{rec.frequency}</td>
                <td>
                  <span >
                    {rec.locked ? 'True' : 'False'}
                  </span>
                </td>
                <td>
                  <span >
                    {rec.overdue ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
     
    </div>
 <div className={`${styles.paginationFooter} d-flex justify-content-between align-items-center py-3`}>
        <div className="text-muted small">
          {totalRecords > 0 
            ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalRecords)} of ${totalRecords}`
            : 'No records'
          }
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />

        <div className="d-flex gap-2 align-items-center">
          <label htmlFor="itemsPerPage" className="small mb-0">Items per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default ReconciliationControlTable;