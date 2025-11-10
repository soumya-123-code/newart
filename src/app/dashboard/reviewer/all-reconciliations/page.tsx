'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  fetchReconciliations,
  clearError,
  setFilterOptions,
  setSearchQuery,
  setDateRange,
  resetFilters as reduceResetFilters,
  setCurrentPage,
  setItemsPerPage,
} from '@/redux/slices/reconciliationSlice';
import { 
  getAllDownloads, 
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
import ReconciliationDetails from '@/components/Reviewer/ReconciliationDetails/ReconciliationDetails';
import FilterModal from '@/components/common/FilterModal/FilterModal';
import { useMessageStore } from '@/redux/messageStore/messageStore';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';

const MyReconciliationsPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { user, isAuthenticated, loading: authLoading, isRoleSwitching } = useSelector(
    (state: RootState) => state.auth
  );
  // ✅ Reconciliation state from Redux (client-side filtering)
  const {
    filteredReconciliations,
    loading: reconLoading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    filterOptions,
    totalRecords,
  } = useSelector((state: RootState) => state.reconciliation);

  const loading = authLoading || reconLoading;

  const { showError, showSuccess, showInfo, showWarning,hideMessage } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  // Local UI state
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string | null>(null);
  const [isReconciliationDetailsOpen, setIsReconciliationDetailsOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [defaultPeriod, setDefaultPeriod] = useState<string>('');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isPeriodLoaded, setIsPeriodLoaded] = useState(false);
  const [localFilterOptions, setLocalFilterOptions] = useState<FilterOptions>({
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [holdingRcData, setHoldingRcData] = useState<any>(null);
  const [priorityGraph, setPriorityGraph] = useState({ high: 0, low: 0 });
  const [totalReconciliations, setTotalReconciliations] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({
  });

  // Show error from Redux state
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const convertPeriodFormat = (apiPeriod: string): string => {
    try {

      if (apiPeriod.includes(' ') && apiPeriod.split(' ').length === 2) {
        const parts = apiPeriod.split(' ');
        if (parts[1].length === 4) {
          return apiPeriod;
        }
      }

      // Parse format: 01-Aug-25
      const parts = apiPeriod.split('-');
      if (parts.length !== 3) {
        return apiPeriod;
      }

      const day = parts[0];
      const month = parts[1]; // Aug
      const year = parts[2]; // 25

      if (!month || month.length !== 3) {
        return apiPeriod;
      }

      if (!year || year.length !== 2) {
        return apiPeriod;
      }

      const fullYear = `20${year}`;
      const result = `${month} ${fullYear}`; // "Aug 2025"
      return result;
    } catch (error) {
      showError('Failed to convert period format');
      return apiPeriod;
    }
  };

  /**
   * ✅ Fetch default period from API
   */
  useEffect(() => {
    const fetchDefaultPeriod = async () => {
      if (!user || !user.userUuid) {
        return;
      }

      try {
        
        const userId = String(user.userUuid);

        const response: any = await currentPeriods(userId);

        if (response) {
          const convertedPeriod = convertPeriodFormat(response);
          setDefaultPeriod(convertedPeriod);
          setSelectedMonth(convertedPeriod);
          setIsPeriodLoaded(true);
          showInfo('Period loaded successfully');
          hideMessage()
        } else {
          const fallback = new Date().toLocaleString('default', {
          });
          setDefaultPeriod(fallback);
          setSelectedMonth(fallback);
          setIsPeriodLoaded(true);
          showWarning('Using current month as default');
        }
      } catch (err) {
        const fallback = new Date().toLocaleString('default', {
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
  }, [isAuthenticated, user, showLoader, hideLoader, showInfo, showWarning, showError, isRoleSwitching]);

  /**
   * ✅ Fetch graphical data for charts
   */
  const graphData = async () => {
    if (!user || !user.userUuid) {
      return;
    }

    try {
      const userId = String(user.userUuid);
      const userRole = user.currentRole;


      const response: any = await getGraphicalRepresentData(
        userId,
        userRole,
        selectedMonth,
        defaultPeriod
      );

      if (!response || !response.low || !response.high) {
              setPriorityGraph({
      });
      setStatusCounts({
      });
      setTotalReconciliations(0);
      return;
      }

      const lowTotal = response.low.reduce((sum: number, item: any) => sum + item.count, 0);
      const highTotal = response.high.reduce((sum: number, item: any) => sum + item.count, 0);

      setPriorityGraph({
      });

      const combined = [...(response.low || []), ...(response.high || [])];

      const counts = {
        priority: [],
        currency: [],
        startDate: "",
        endDate: "",
        searchQuery: ""
      };

      combined.forEach((item: any) => {
        const { recLiveStatus, count } = item;

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

    } catch (err) {
      showError('Failed to fetch graph data');
    }
  };

  useEffect(() => {
    setLocalFilterOptions({
    });
  }, [filterOptions]);

  const fetchData = async () => {
    try {

      // Fetch graph data
      await graphData();

      // Fetch reconciliations (will be filtered client-side)
      await dispatch(
        fetchReconciliations({
        })
      ).unwrap();

    } catch (err: any) {
      showError(err?.message || 'Failed to fetch reconciliation data');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    if (!user || !user.userUuid) {
      return;
    }

    if (!isPeriodLoaded || !selectedMonth) {
      return;
    }

    fetchData();
  }, [
    isAuthenticated,
    authLoading,
    user,
    isPeriodLoaded,
    selectedMonth,
    selectedFilter,
    dispatch,
  ]);

  // Calculate display range
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
  const displayReconciliations = filteredReconciliations || [];

    isAuthenticated,
    user: user?.fullName,
    currentPage,
    totalPages,
    totalRecords,
    displayReconciliations: displayReconciliations.length,
    itemsPerPage,
    selectedFilter,
    selectedMonth,
    filterOptions,
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
    dispatch(setCurrentPage(1));
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setIsMonthPickerOpen(false);
    dispatch(setCurrentPage(1));
  };

  const handleFilterModalOpen = () => {
    setIsFilterModalOpen(true);
  };

  // ✅ Filter apply - dispatches Redux action which filters client-side
  const handleFilterApply = () => {
    dispatch(setFilterOptions(localFilterOptions));
    setIsFilterModalOpen(false);
    dispatch(setCurrentPage(1));
    showSuccess('Filters applied successfully');
  };

  // ✅ Filter reset - dispatches Redux action which clears filters
  const handleFilterReset = () => {
    const resetFilters = {
        priority: [],
        currency: [],
        startDate: "",
        endDate: "",
        searchQuery: ""
      };
    setLocalFilterOptions(resetFilters);
    dispatch(reduceResetFilters());
    dispatch(setCurrentPage(1));
    showInfo('Filters reset');
  };

  const handleRowClick = (data: any) => {
    setSelectedReconciliationId(data?.reconciliationId || data?.id);
    setIsReconciliationDetailsOpen(true);
    setHoldingRcData(data);
  };

  const handleCloseReconciliationDetails = () => {
    setIsReconciliationDetailsOpen(false);
    setSelectedReconciliationId(null);
    setHoldingRcData(null);
  };

  // ✅ Date range change - dispatches Redux action which filters client-side
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    dispatch(setDateRange({ startDate, endDate }));
    dispatch(setCurrentPage(1));
  };

  // ✅ Search change - dispatches Redux action which filters client-side
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    dispatch(setSearchQuery(searchValue));
    dispatch(setCurrentPage(1));
  };

  // ✅ Page change - updates Redux which paginates client-side
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  // ✅ Items per page change - updates Redux which re-paginates client-side
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = Number(e.target.value);
    dispatch(setItemsPerPage(newItemsPerPage));
    dispatch(setCurrentPage(1));
  };

  const handleDownload = async () => {
    if (!user || !user.userUuid) {
      showError('User data not available. Please wait for authentication to complete.');
      return;
    }

    setIsDownloading(true);
    showLoader("DownLoading ......");

    try {
      const userId = String(user.userUuid);

      const response: any = await getAllDownloads(
        currentPage,
        itemsPerPage,
        userId
      );

      if (!response || !response.data) {
        throw new Error('No data received from download');
      }

      const blob = new Blob([JSON.stringify(response.data)], {
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reconciliations_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Report downloaded successfully');
    } catch (error) {
      showError('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
      hideLoader();
    }
  };



  const activeFilterCount =
    (localFilterOptions.priority?.length || 0) +
    (localFilterOptions.currency?.length || 0);

  // Show loading if not authenticated
  if (!isAuthenticated || authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  // Show error if user data is missing
  if (!user || !user.userUuid) {
    return (
      <div className={styles.emptyState}>
        <p>Unable to load user data. Please refresh the page.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  // Show loading while fetching period
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
                // { label: 'Completed', value: statusCounts.Completed, color: '#c6b9e8' },
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
          {/* <button
            className={styles.downloadButton}
            onClick={handleDownload}
            disabled={isDownloading || !user}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.66699 6.66667L8.00033 10L11.3337 6.66667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 10V2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button> */}
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

export default MyReconciliationsPage;

