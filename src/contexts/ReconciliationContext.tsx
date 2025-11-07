'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import * as reconService from '@/services/reconciliation/ReconClientApiService';
import { useAuth } from './AuthContext';

interface FilterOptions {
  priority: string[];
  currency: string[];
  startDate: string;
  endDate: string;
  searchQuery: string;
}

interface ReconciliationContextType {
  reconciliations: any[];
  filteredReconciliations: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalRecords: number;
  filterOptions: FilterOptions;
  fetchReconciliations: (params: {
    status?: string;
    selectedPeriod?: string;
    defaultPeriod?: string;
  }) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  resetFilters: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  clearError: () => void;
  statusUpdateApi: (data: any) => Promise<void>;
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined);

const getPriorityFromDeadline = (deadline: string): string => {
  if (!deadline) return 'Low';
  return deadline === 'WD15' ? 'High' : 'Low';
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('-');
    const [hours, minutes, seconds] = timePart ? timePart.split(':') : ['0', '0', '0'];

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours || '0'),
      parseInt(minutes || '0'),
      parseInt(seconds || '0')
    );
  } catch (error) {
    return null;
  }
};

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isDateInRange = (dateStr: string, startDate?: string, endDate?: string): boolean => {
  const checkDate = parseDate(dateStr);
  if (!checkDate) return false;

  const normalizedCheck = normalizeDate(checkDate);

  if (startDate) {
    const start = new Date(startDate);
    const normalizedStart = normalizeDate(start);
    if (normalizedCheck < normalizedStart) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    const normalizedEnd = normalizeDate(end);
    if (normalizedCheck > normalizedEnd) return false;
  }

  return true;
};

const applyClientFilters = (allData: any[], filters: FilterOptions): any[] => {
  let filtered = [...allData];

  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(item => {
      const itemPriority = getPriorityFromDeadline(item.deadline);
      return filters.priority.includes(itemPriority);
    });
  }

  if (filters.currency && filters.currency.length > 0) {
    filtered = filtered.filter(item => {
      const itemCurrency = item.ccy || item.accountCurrency;
      if (!itemCurrency) return false;
      return filters.currency.includes(itemCurrency);
    });
  }

  if (filters.startDate || filters.endDate) {
    filtered = filtered.filter(item => {
      const dateField = item.reconDate || item.date || item.createdAt;
      if (!dateField) return true;
      return isDateInRange(dateField, filters.startDate, filters.endDate);
    });
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const searchableFields = [
        item.reconciliationId,
        item.reconSetId,
        item.accountCurrency,
        item.currency,
        item.bankName,
        item.accountName,
        item.reconEntityName,
        item.reconEntityType,
        item.description,
        item.reconDescription,
        item.accountNumber,
        item.accountId,
        item.entityName,
        item.bankAccountNumber,
      ].map(field => String(field || '').toLowerCase());

      return searchableFields.some(field => field.includes(query));
    });
  }

  return filtered;
};

const paginateData = (data: any[], page: number, pageSize: number): any[] => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
};

const calculateTotalPages = (totalCount: number, itemsPerPage: number): number => {
  if (totalCount === 0 || itemsPerPage === 0) return 1;
  return Math.ceil(totalCount / itemsPerPage);
};

export function ReconciliationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [allFilteredData, setAllFilteredData] = useState<any[]>([]);
  const [filteredReconciliations, setFilteredReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOptions, setFilterOptionsState] = useState<FilterOptions>({
    priority: [],
    currency: [],
    startDate: '',
    endDate: '',
    searchQuery: '',
  });

  const applyFiltersAndPagination = useCallback((data: any[], filters: FilterOptions, page: number, pageSize: number) => {
    const filtered = applyClientFilters(data, filters);
    setAllFilteredData(filtered);
    setTotalRecords(filtered.length);
    const pages = calculateTotalPages(filtered.length, pageSize);
    setTotalPages(pages);
    const paginated = paginateData(filtered, page, pageSize);
    setFilteredReconciliations(paginated);
  }, []);

  const fetchReconciliations = useCallback(async (params: {
    status?: string;
    selectedPeriod?: string;
    defaultPeriod?: string;
  }) => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = String(user.userUuid);
      const userRole = user.currentRole;
      const status = params.status || 'All';

      const parsePeriodToDate = (period: any): Date | null => {
        if (!period) return null;
        const [monthName, year] = period.split(' ');
        if (!monthName || !year) return null;
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        return new Date(Number(year), monthIndex, 1);
      };

      const selectedDate = parsePeriodToDate(params.selectedPeriod);
      const defaultDate = parsePeriodToDate(params.defaultPeriod);

      if (selectedDate && defaultDate && defaultDate < selectedDate) {
        setError('There is no available data for this period');
        setReconciliations([]);
        setAllFilteredData([]);
        setFilteredReconciliations([]);
        setTotalRecords(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      const response: any = await reconService.listLiveReconciliations(
        1,
        999999,
        userId,
        userRole,
        status,
        params.selectedPeriod,
        params.defaultPeriod
      );

      const items = response?.items || [];
      setReconciliations(items);
      applyFiltersAndPagination(items, filterOptions, currentPage, itemsPerPage);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch reconciliations');
      setReconciliations([]);
      setAllFilteredData([]);
      setFilteredReconciliations([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, filterOptions, currentPage, itemsPerPage, applyFiltersAndPagination]);

  const setFilterOptions = useCallback((options: Partial<FilterOptions>) => {
    const newFilters = { ...filterOptions, ...options };
    setFilterOptionsState(newFilters);
    setCurrentPageState(1);
    applyFiltersAndPagination(reconciliations, newFilters, 1, itemsPerPage);
  }, [filterOptions, reconciliations, itemsPerPage, applyFiltersAndPagination]);

  const setSearchQuery = useCallback((query: string) => {
    const newFilters = { ...filterOptions, searchQuery: query };
    setFilterOptionsState(newFilters);
    setCurrentPageState(1);
    applyFiltersAndPagination(reconciliations, newFilters, 1, itemsPerPage);
  }, [filterOptions, reconciliations, itemsPerPage, applyFiltersAndPagination]);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    const newFilters = { ...filterOptions, startDate, endDate };
    setFilterOptionsState(newFilters);
    setCurrentPageState(1);
    applyFiltersAndPagination(reconciliations, newFilters, 1, itemsPerPage);
  }, [filterOptions, reconciliations, itemsPerPage, applyFiltersAndPagination]);

  const resetFilters = useCallback(() => {
    const newFilters: FilterOptions = {
      priority: [],
      currency: [],
      startDate: '',
      endDate: '',
      searchQuery: '',
    };
    setFilterOptionsState(newFilters);
    setCurrentPageState(1);
    applyFiltersAndPagination(reconciliations, newFilters, 1, itemsPerPage);
  }, [reconciliations, itemsPerPage, applyFiltersAndPagination]);

  const setCurrentPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPageState(page);
      const paginated = paginateData(allFilteredData, page, itemsPerPage);
      setFilteredReconciliations(paginated);
    }
  }, [totalPages, allFilteredData, itemsPerPage]);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPageState(1);
    const pages = calculateTotalPages(totalRecords, items);
    setTotalPages(pages);
    const paginated = paginateData(allFilteredData, 1, items);
    setFilteredReconciliations(paginated);
  }, [totalRecords, allFilteredData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const statusUpdateApi = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      if (data?.commentryPayload?.statusComment?.trim()) {
        await reconService.addCommentary(
          data?.commentryPayload?.reconciliationId,
          data?.commentryPayload?.statusComment,
          data?.commentryPayload?.userId
        );
      }

      await reconService.statusUpdateApi(data?.statusPayload);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    reconciliations,
    filteredReconciliations,
    loading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,
    totalRecords,
    filterOptions,
    fetchReconciliations,
    setFilterOptions,
    setSearchQuery,
    setDateRange,
    resetFilters,
    setCurrentPage,
    setItemsPerPage,
    clearError,
    statusUpdateApi,
  };

  return <ReconciliationContext.Provider value={value}>{children}</ReconciliationContext.Provider>;
}

export function useReconciliation() {
  const context = useContext(ReconciliationContext);
  if (context === undefined) {
    throw new Error('useReconciliation must be used within a ReconciliationProvider');
  }
  return context;
}
