'use client';

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReconciliation } from '@/contexts/ReconciliationContext';
import {
  getGraphicalRepresentData,
  currentPeriods
} from '@/services/reconciliation/ReconClientApiService';
import type { FilterOptions } from '@/types/ui.types';
import styles from './page.module.scss';

import DonutChart from '@/components/Charts/DonutChart/DonutChart';
import ReconciliationTable from '@/components/common/Table/Table';
import DatePicker from '@/components/common/DatePicker/DatePicker';
import Pagination from '@/components/common/Pagination/Pagination';
import SearchBar from '@/components/common/SearchBar/SearchBar';
import ReconciliationDetails from '@/components/Preparer/ReconciliationDetails/ReconciliationDetails';
import FilterModal from '@/components/common/FilterModal/FilterModal';
import { useMessageStore } from '@/stores/messageStore';
import { useLoaderStore } from '@/stores/loaderStore';

const MyReconciliationsPage = () => {
  const { user, isAuthenticated, loading: authLoading, isRoleSwitching } = useAuth();
  const {
    filteredReconciliations,
    loading: reconLoading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    filterOptions,
    totalRecords,
    fetchReconciliations,
    setFilterOptions,
    setSearchQuery,
    setDateRange,
    resetFilters,
    setCurrentPage,
    setItemsPerPage,
    clearError,
  } = useReconciliation();

  const loading = authLoading || reconLoading;

  const { showError, showSuccess, showInfo, hideMessage } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string | null>(null);
  const [isReconciliationDetailsOpen, setIsReconciliationDetailsOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isPeriodLoaded, setIsPeriodLoaded] = useState(false);
  const [localFilterOptions, setLocalFilterOptions] = useState<FilterOptions>({
    priority: [],
    currency: [],
  });
  const [priorityGraph, setPriorityGraph] = useState({ high: 0, low: 0 });
  const [totalReconciliations, setTotalReconciliations] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({
    Prepare: 0,
    Review: 0,
    Completed: 0,
    Rejected: 0,
    Approved: 0,
  });

  const convertPeriodFormat = useCallback((apiPeriod: string): string => {
    try {
      if (apiPeriod.includes(' ') && apiPeriod.split(' ').length === 2) {
        const parts = apiPeriod.split(' ');
        if (parts[1].length === 4) {
          return apiPeriod;
        }
      }

      const parts = apiPeriod.split('-');
      if (parts.length !== 3) {
        return apiPeriod;
      }

      const month = parts[1];
      const year = parts[2];

      if (!month || month.length !== 3 || !year || year.length !== 2) {
        return apiPeriod;
      }

      const fullYear = `20${year}`;
      return `${month} ${fullYear}`;
    } catch {
      showError('Failed to convert period format');
      return apiPeriod;
    }
  }, [showError]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  useEffect(() => {
    const fetchDefaultPeriod = async () => {
      if (!user?.userUuid) return;

      try {
        const userId = String(user.userUuid);
        const response: any = await currentPeriods(userId);

        if (response) {
          const convertedPeriod = convertPeriodFormat(response);
          setDefaultPeriod(convertedPeriod);
          setSelectedMonth(convertedPeriod);
          setIsPeriodLoaded(true);
          hideMessage();
        } else {
          const fallback = new Date().toLocaleString('default', {
            month: 'short',
            year: 'numeric',
          });
          setDefaultPeriod(fallback);
          setSelectedMonth(fallback);
          setIsPeriodLoaded(true);
        }
      } catch {
        const fallback = new Date().toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
        setDefaultPeriod(fallback);
        setSelectedMonth(fallback);
        setIsPeriodLoaded(true);
        showError('Failed to fetch period data. Using current month.');
      } finally {
        hideLoader();
      }
    };

    if (isAuthenticated && user && !isRoleSwitching) {
      fetchDefaultPeriod();
    }
  }, [isAuthenticated, user, showError, hideMessage, convertPeriodFormat, isRoleSwitching, hideLoader]);

  const graphData = useCallback(async () => {
    if (!user?.userUuid) return;

    try {
      const userId = String(user.userUuid);
      const userRole = user.currentRole;

      const response: any = await getGraphicalRepresentData(
        userId,
        userRole,
        selectedMonth,
        defaultPeriod
      );

      const defaultState = {
        low: 0,
        high: 0,
      };

      const defaultCounts = {
        Prepare: 0,
        Review: 0,
        Completed: 0,
        Rejected: 0,
        Approved: 0,
      };

      if (!response) {
        setPriorityGraph(defaultState);
        setStatusCounts(defaultCounts);
        setTotalReconciliations(0);
        return;
      }

      if (response.hasOwnProperty('totalCount') && response.totalCount === 0) {
        setPriorityGraph(defaultState);
        setStatusCounts(defaultCounts);
        setTotalReconciliations(0);
        return;
      }

      if (Array.isArray(response.items) && response.items.length === 0) {
        setPriorityGraph(defaultState);
        setStatusCounts(defaultCounts);
        setTotalReconciliations(0);
        return;
      }

      if (!response?.low && !response?.high) {
        setPriorityGraph(defaultState);
        setStatusCounts(defaultCounts);
        setTotalReconciliations(0);
        return;
      }

      const lowTotal = (response.low || []).reduce((sum: number, item: any) => sum + (item.count || 0), 0);
      const highTotal = (response.high || []).reduce((sum: number, item: any) => sum + (item.count || 0), 0);

      if (lowTotal === 0 && highTotal === 0) {
        setPriorityGraph(defaultState);
        setStatusCounts(defaultCounts);
        setTotalReconciliations(0);
        return;
      }

      setPriorityGraph({
        low: lowTotal,
        high: highTotal,
      });

      const combined = [...(response.low || []), ...(response.high || [])];
      const counts = { ...defaultCounts };

      combined.forEach((item: any) => {
        const { recLiveStatus, count } = item;

        if (!count || count === 0) return;

        switch (recLiveStatus) {
          case 'NOT_STARTED':
            counts.Prepare += count;
            break;
          case 'READY':
            counts.Review += count;
            break;
          case 'APPROVED':
            counts.Approved += count;
            break;
          case 'REJECTED':
            counts.Rejected += count;
            break;
          case 'COMPLETED':
            counts.Completed += count;
            break;
          default:
            break;
        }
      });

      setStatusCounts(counts);
      setTotalReconciliations(
        counts.Prepare + counts.Review + counts.Completed + counts.Rejected + counts.Approved
      );
    } catch (error) {
      showError('Failed to fetch graph data');
    }
  }, [user, selectedMonth, defaultPeriod, showError]);

  useEffect(() => {
    setLocalFilterOptions({
      priority: filterOptions.priority || [],
      currency: filterOptions.currency || [],
    });
  }, [filterOptions]);

  const fetchData = useCallback(async () => {
    try {
      await graphData();

      await fetchReconciliations({
        status: selectedFilter,
        selectedPeriod: selectedMonth,
        defaultPeriod: defaultPeriod,
      });
    } catch (err: any) {
      showError(err?.message || 'Failed to fetch reconciliation data');
    }
  }, [graphData, selectedFilter, selectedMonth, defaultPeriod, showError, fetchReconciliations]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || !user?.userUuid || !isPeriodLoaded || !selectedMonth) {
      return;
    }

    fetchData();
  }, [isAuthenticated, authLoading, user, isPeriodLoaded, selectedMonth, selectedFilter, fetchData]);

  const holdingRcData = useMemo(() => {
    if (selectedReconciliationId && filteredReconciliations.length > 0) {
      return filteredReconciliations.find(
        item => item.reconciliationId === selectedReconciliationId
      ) || null;
    }
    return null;
  }, [filteredReconciliations, selectedReconciliationId]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
  const displayReconciliations = filteredReconciliations || [];

  const handleFilterClick = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    setIsMonthPickerOpen(false);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const handleFilterModalOpen = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const handleFilterApply = useCallback(() => {
    setFilterOptions(localFilterOptions);
    setIsFilterModalOpen(false);
    setCurrentPage(1);
    showSuccess('Filters applied successfully');
  }, [localFilterOptions, showSuccess, setFilterOptions, setCurrentPage]);

  const handleFilterReset = useCallback(() => {
    const resetFiltersOptions = {
      priority: [],
      currency: [],
    };
    setLocalFilterOptions(resetFiltersOptions);
    resetFilters();
    setCurrentPage(1);
    showInfo('Filters reset');
  }, [showInfo, resetFilters, setCurrentPage]);

  const handleRowClick = useCallback((data: any) => {
    setSelectedReconciliationId(data?.reconciliationId || data?.id);
    setIsReconciliationDetailsOpen(true);
  }, []);

  const handleCloseReconciliationDetails = useCallback(() => {
    setIsReconciliationDetailsOpen(false);
    setSelectedReconciliationId(null);
  }, []);

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setDateRange(startDate, endDate);
    setCurrentPage(1);
  }, [setDateRange, setCurrentPage]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
    setCurrentPage(1);
  }, [setSearchQuery, setCurrentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, [setItemsPerPage, setCurrentPage]);

  const activeFilterCount = useMemo(() =>
    (localFilterOptions.priority?.length || 0) + (localFilterOptions.currency?.length || 0),
    [localFilterOptions]
  );

  if (!isAuthenticated || authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  if (!user?.userUuid) {
    return (
      <div className={styles.emptyState}>
        <p>Unable to load user data. Please refresh the page.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  if (!isPeriodLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading period data...</p>
      </div>
    );
  }

  return (
    <div className="position-relative">
      <div className={`mt-3 ${styles.header}`}>
        <h1>My reconciliations</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="pe-2">Reconciliation period:</span>
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

      <div className={styles.chartCard}>
        <div className={styles.chartSection}>
          <div>
            <DonutChart
              title="Reconciliation status"
              total={totalReconciliations}
              data={[
                { label: 'Prepare', value: statusCounts.Prepare, color: '#5b3fbe' },
                { label: 'Review', value: statusCounts.Review, color: '#8d77d1' },
                { label: 'Rejected', value: statusCounts.Rejected, color: '#e9e5f5' },
                { label: 'Approved', value: statusCounts.Approved, color: '#ddd5f5' },
              ]}
            />
          </div>
          <div />
          <div>
            <DonutChart
              title="Priority"
              total={totalReconciliations}
              data={[
                { label: 'High', value: priorityGraph?.high, color: '#5b3fbe' },
                { label: 'Low', value: priorityGraph?.low, color: '#c6b9e8' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <ul className="nav nav-pills">
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'All' ? 'active' : ''}`}
              onClick={() => handleFilterClick('All')}
            >
              All
            </button>
          </li>
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'not_started' ? 'active' : ''}`}
              onClick={() => handleFilterClick('not_started')}
            >
              Prepare
            </button>
          </li>
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'ready' ? 'active' : ''}`}
              onClick={() => handleFilterClick('ready')}
            >
              Review
            </button>
          </li>
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => handleFilterClick('rejected')}
            >
              Rejected
            </button>
          </li>
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'Completed' ? 'active' : ''}`}
              onClick={() => handleFilterClick('Completed')}
            >
              Completed
            </button>
          </li>
          <li className="nav-item me-2">
            <button
              className={`nav-link rounded-5 ${selectedFilter === 'approved' ? 'active' : ''}`}
              onClick={() => handleFilterClick('approved')}
            >
              Approved
            </button>
          </li>
        </ul>
        <div className={styles.filterControls}>
          <button className={styles.filterButton} onClick={handleFilterModalOpen}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14.5 2H1.5L6.5 8.4V12.5L9.5 14V8.4L14.5 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Filter
            {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
          </button>
          <SearchBar
            value={filterOptions.searchQuery || ''}
            onChange={handleSearchChange}
            placeholder="Search"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
        </div>
      ) : displayReconciliations.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="32" fill="#F5F5F5" />
            <path
              d="M32 24V32M32 40H32.02M44 32C44 38.6274 38.6274 44 32 44C25.3726 44 20 38.6274 20 32C20 25.3726 25.3726 20 32 20C38.6274 20 44 25.3726 44 32Z"
              stroke="#A0A0A0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No reconciliations found</p>
        </div>
      ) : (
        <>
          <ReconciliationTable
            reconciliations={displayReconciliations}
            onRowClick={handleRowClick}
          />

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {totalRecords > 0 ? `${startIndex}-${endIndex} of ${totalRecords}` : '0-0 of 0'}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            <div className={styles.itemsPerPage}>
              <span>Items per page</span>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </>
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterOptions={localFilterOptions}
        onFilterChange={setLocalFilterOptions}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />

      {selectedReconciliationId && (
        <ReconciliationDetails
          reconciliationId={selectedReconciliationId}
          isOpen={isReconciliationDetailsOpen}
          onClose={handleCloseReconciliationDetails}
          reconsolationRowIdWiseData={holdingRcData}
          refetchTableData={fetchData}
        />
      )}
    </div>
  );
};

export default memo(MyReconciliationsPage);
