// src/hooks/usePreparer.ts


import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import {
  fetchReconciliations,
  
  clearError,
  setCurrentPage,
  setItemsPerPage,
  setFilterOptions,
  setSearchQuery,      // ✅ NEW: for text search
  setDateRange,        // ✅ NEW: for date filtering
  resetFilters,        // ✅ NEW: to clear filters
  invalidateCache,
  invalidateAllCache,
} from '@/redux/slices/reconciliationSlice';

// ================================
// Main Hook: usePreparer
// ================================

export const usePreparer = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Select state from Redux
  const {
    filteredReconciliations,
    loading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    totalRecords,
    filterOptions,
  } = useSelector((state: RootState) => state.reconciliation);

  // ================================
  // Data Fetching
  // ================================

  /**
   * ✅ Fetch reconciliations from API
   * Only needed when status or period changes
   */
  const fetchData = useCallback((status: string, period: string) => {
    return dispatch(fetchReconciliations({
      status,
      selectedPeriod: period,
    }));
  }, [dispatch]);

  // ================================
  // Client-Side Filtering Actions
  // ================================

  /**
   * ✅ Apply text search filter (instant, no API call)
   */
  const applySearch = useCallback((searchQuery: string) => {
    dispatch(setSearchQuery(searchQuery));
  }, [dispatch]);

  /**
   * ✅ Apply priority and/or currency filters (instant, no API call)
   */
  const applyFilters = useCallback((filters: {
    priority?: string[];
    currency?: string[];
  }) => {
    dispatch(setFilterOptions({
      priority: filters.priority || filterOptions.priority,
      currency: filters.currency || filterOptions.currency,
    }));
  }, [dispatch, filterOptions.priority, filterOptions.currency]);

  /**
   * ✅ Apply date range filter (instant, no API call)
   */
  const applyDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch(setDateRange({ startDate, endDate }));
  }, [dispatch]);

  /**
   * ✅ Clear all filters except status (instant, no API call)
   */
  const clearFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  // ================================
  // Pagination Actions
  // ================================

  /**
   * ✅ Change current page (instant, no API call)
   */
  const changePage = useCallback((page: number) => {
    dispatch(setCurrentPage(page));
  }, [dispatch]);

  /**
   * ✅ Change items per page (instant, no API call)
   */
  const changeItemsPerPage = useCallback((items: number) => {
    dispatch(setItemsPerPage(items));
  }, [dispatch]);

  // ================================
  // Cache & Error Management
  // ================================

  /**
   * ✅ Invalidate cache to force fresh data on next fetch
   */
  const refreshData = useCallback(() => {
    dispatch(invalidateAllCache());
  }, [dispatch]);

  /**
   * ✅ Clear error message
   */
  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ================================
  // Return Hook API
  // ================================

  return {
    // State
    reconciliations: filteredReconciliations,
    loading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    totalRecords,
    filterOptions,
    
    // Data fetching
    fetchData,
    
    // Client-side filtering (instant, no API calls)
    applySearch,
    applyFilters,
    applyDateRange,
    clearFilters,
    
    // Pagination (instant, no API calls)
    changePage,
    changeItemsPerPage,
    
    // Utilities
    refreshData,
    clearErrorMessage,
  };
};

// ================================
// Usage Example
// ================================

/*
import { usePreparer } from '@/hooks/usePreparer';

const MyComponent = () => {
  const {
    reconciliations,
    loading,
    totalRecords,
    currentPage,
    totalPages,
    fetchData,
    applySearch,
    applyFilters,
    applyDateRange,
    changePage,
  } = usePreparer();

  // Initial data fetch
  useEffect(() => {
    fetchData('All', 'Aug 2025');
  }, []);

  // Search handler (instant filtering)
  const handleSearch = (e) => {
    applySearch(e.target.value);
  };

  // Filter handler (instant filtering)
  const handleFilterApply = () => {
    applyFilters({
      priority: ['High'],
      currency: ['GBP', 'EUR'],
    });
  };

  // Date range handler (instant filtering)
  const handleDateChange = (start, end) => {
    applyDateRange(start, end);
  };

  // Pagination handler (instant)
  const handlePageChange = (page) => {
    changePage(page);
  };

  return (
    <div>
      <input onChange={handleSearch} placeholder="Search..." />
      <button onClick={handleFilterApply}>Apply Filters</button>
      <p>Showing {reconciliations.length} of {totalRecords}</p>
      <button onClick={() => handlePageChange(currentPage + 1)}>
        Next Page
      </button>
    </div>
  );
};
*/

export default usePreparer;