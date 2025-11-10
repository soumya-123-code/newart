'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './Table.module.scss';
import StatusBadge from '../StatusBadge/StatusBadge';
import { formatNumber, getPriorityColorCode, getPriorityIcon } from '@/app/utils/utils';
import '@/app/style/components/_ControlledTable.scss';
import { exportspecificRowReport } from '@/services/reconciliation/ReconClientApiService';
import { formatDisplayDate } from '@/redux/slices/reconciliationSlice';
import { useMessageStore } from '@/redux/messageStore/messageStore';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';

interface ReconciliationTableProps {
  reconciliations: any[];
  onRowClick?: any;
  // ✅ NEW: Multi-select support
  selectedRows?: string[];
  onRowSelect?: (reconciliationId: string, isChecked: boolean) => void;
  onSelectAll?: (isChecked: boolean) => void;
}

const parseDateForSort = (dateStr: string): number => {
  if (!dateStr) return 0;
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('-');
    const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['0', '0', '0'];

    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours || '0'),
      parseInt(minutes || '0'),
      parseInt(seconds || '0')
    );

    return date.getTime();
  } catch {
    return 0;
  }
};

const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  reconciliations,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  onSelectAll,
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

   const { showError, showSuccess, showInfo, showWarning } = useMessageStore();
    const { showLoader, hideLoader } = useLoaderStore();

  const sortedReconciliations = useMemo(() => {
    if (!sortField) return reconciliations;

    const sorted = [...reconciliations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'id':
          aValue = a.reconciliationId || '';
          bValue = b.reconciliationId || '';
          break;
        case 'name':
          aValue = a.reconciliationName || a.description || '';
          bValue = b.reconciliationName || b.description || '';
          break;
        case 'priority':
          aValue = a.deadline === 'WD15' ? 'High' : 'Low';
          bValue = b.deadline === 'WD15' ? 'High' : 'Low';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'balance':
          aValue = parseFloat(a.recBalance) || 0;
          bValue = parseFloat(b.recBalance) || 0;
          break;
        case 'currency':
          aValue = a.ccy || '';
          bValue = b.ccy || '';
          break;
        case 'createdAt':
          aValue = parseDateForSort(a.createDate);
          bValue = parseDateForSort(b.createDate);
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [reconciliations, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (data: any) => {
    if (onRowClick) {
      onRowClick(data);
    }
  };

  
  const handleRowSelect = (id: string, checked: boolean) => {
    if (onRowSelect) {
      onRowSelect(id, checked);
    }
  };

  // ✅ Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };



const handleDownload = async (e: React.MouseEvent, reconciliation: any) => {
  e.stopPropagation();
  
  showLoader('Downloading file...');
  
  try {
    const period = reconciliation?.currentPeriod;
    if (!period) {
      showError('Invalid date format');
      hideLoader();
      return;
    }
    
    showInfo('Starting download...');
    
    // ✅ FIXED: Await the promise properly
    await exportspecificRowReport(reconciliation?.reconciliationId, period);
    
    hideLoader();
    showSuccess('Report downloaded successfully');
    console.log('Download completed:', reconciliation?.reconciliationId);
    
  } catch (error: any) {
    hideLoader();
    console.error('Download failed:', error);
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to download reconciliation. Please try again.';
    showError(`${errorMsg}`);
  }
};


  const getSortIcon = (field: string) => {
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
    }

    if (sortDirection === 'asc') {
      return (
       <Image
          src="/assets/preparer/sort.svg"
          alt="Sort"
          width={16}
          height={16}
          className={styles.sortIcon}
        />
      );
    }

    return (
     <Image
          src="/assets/preparer/sort.svg"
          alt="Sort"
          width={16}
          height={16}
          className={styles.sortIcon}
        />
    );
  };




  return (
    <div className={`controlled-table ${styles.tableWrapper}`}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
         
            {/* <th className={styles.checkboxColumn}>
              <input
                type="checkbox"
                checked={selectedRows.length === reconciliations?.length && reconciliations.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all reconciliations"
              />
            </th> */}

            <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Rec ID</span>
                {getSortIcon('id')}
              </div>
            </th>

            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Description</span>
                {getSortIcon('name')}
              </div>
            </th>

            <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Priority</span>
                {getSortIcon('priority')}
              </div>
            </th>

            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Status</span>
                {getSortIcon('status')}
              </div>
            </th>

            <th onClick={() => handleSort('balance')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Reconciliation balance</span>
                {getSortIcon('balance')}
              </div>
            </th>

            <th onClick={() => handleSort('currency')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Currency</span>
                {getSortIcon('currency')}
              </div>
            </th>

            <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
              <div className={styles.columnHeader}>
                <span>Created on</span>
                {getSortIcon('createdAt')}
              </div>
            </th>

            <th className={styles.actionsColumn}></th>
          </tr>
        </thead>
        <tbody>
          {sortedReconciliations?.map((reconciliation: any) => (
            <tr
              key={reconciliation?.reconciliationId}
              className={`${styles.tableRow} ${selectedRows.includes(reconciliation?.reconciliationId) ? styles.selected : ''}`}
              onClick={() => handleRowClick(reconciliation)}
            >
              {/* ✅ Checkbox cell */}
              {/* <td className={styles.checkboxColumn} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(reconciliation?.reconciliationId)}
                  onChange={(e) => handleRowSelect(reconciliation?.reconciliationId, e.target.checked)}
                  aria-label={`Select ${reconciliation?.reconciliationId}`}
                />
              </td> */}

              <td>{reconciliation?.reconciliationId}</td>

              <td>
                <span className="text-start ps-2 d-inline-block ellipsis">
                  {reconciliation?.reconciliationName || reconciliation?.description}
                </span>
              </td>

              <td>
                <div className={styles.priority}>
                  <span className={`text-capitalize text-${getPriorityColorCode(reconciliation?.deadlinePriority)}`}>
                    {getPriorityIcon(reconciliation?.deadlinePriority || "", getPriorityColorCode(reconciliation?.deadlinePriority))}
                    {reconciliation?.deadlinePriority}
                  </span>
                </div>
              </td>

              <td>
                <StatusBadge status={reconciliation.status} />
              </td>

              <td className={`text-center pe-5 ${styles.amount}`}>
                {formatNumber(reconciliation?.recBalance)}
              </td>

              <td>{reconciliation?.ccy}</td>

              <td>{formatDisplayDate(reconciliation?.createDate)}</td>

              <td className={`text-end ${styles.actionsColumn}`} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`text-primary ${styles.downloadButton}`}
                  onClick={(e) => handleDownload(e, reconciliation)}
                  aria-label={`Download ${reconciliation?.reconciliationId}`}
                >
                  <Image
                    src="/assets/preparer/download.png"
                    alt="Download"
                    width={16}
                    height={16}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReconciliationTable;