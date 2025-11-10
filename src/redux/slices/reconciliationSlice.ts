// redux/slices/reconciliationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as reconService from '@/services/reconciliation/ReconClientApiService';

// ============================================================================
// UTILITY FUNCTIONS - Date and Priority Handling
// ============================================================================

export const formatDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
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

const getPriorityFromDeadline = (deadline: string): string => {
  if (!deadline) return 'Low';
  return deadline === 'WD15' ? 'High' : 'Low';
};

const isDateInRange = (
  dateStr: string,
  startDate?: string,
  endDate?: string
): boolean => {
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

export const monthToRange = (label: string): { startDate: string; endDate: string } => {
  const map: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const parts = label.trim().split(/\s+/);
  const mKey = (parts[0] || '').toLowerCase();
  const y = Number(parts[1]);
  const year = Number.isFinite(y) ? y : new Date().getFullYear();
  const month = Number.isFinite(map[mKey]) ? map[mKey] : new Date().getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  return { startDate: toISO(start), endDate: toISO(end) };
};

// ============================================================================
// CLIENT-SIDE FILTERING LOGIC
// ============================================================================

const applyClientFilters = (
  allData: any[],
  filters: {
    priority: string[];
    currency: string[];
    startDate: string;
    endDate: string;
    searchQuery: string;
  }
): any[] => {
  let filtered = [...allData];


  if (filtered.length > 0) {
      reconciliationId: filtered[0]?.reconciliationId,
      currency: filtered[0]?.currency,
      accountCurrency: filtered[0]?.accountCurrency,
      deadline: filtered[0]?.deadline,
      description: filtered[0]?.description,
      reconDescription: filtered[0]?.reconDescription,
      availableFields: Object.keys(filtered[0] || {}).join(', ')
    });

    const allCurrencies = [...new Set(
      filtered.map(item => item.ccy || item.accountCurrency).filter(Boolean)
    )];
  }

  // Filter by priority
  if (filters.priority && filters.priority.length > 0) {
    const beforeCount = filtered.length;

    filtered = filtered.filter(item => {
      const itemPriority = getPriorityFromDeadline(item.deadline);
      return filters.priority.includes(itemPriority);
    });
  }

  // Filter by currency
  if (filters.currency && filters.currency.length > 0) {
    const beforeCount = filtered.length;

    filtered.slice(0, 5).forEach((item, idx) => {
        reconciliationId: item.reconciliationId,
        currency: item.currency,
        accountCurrency: item.accountCurrency,
        'currency || accountCurrency': item.ccy || item.accountCurrency
      });
    });

    filtered = filtered.filter(item => {
      const itemCurrency = item.ccy || item.accountCurrency;

      if (!itemCurrency) {
        return false;
      }

      const match = filters.currency.includes(itemCurrency);

      if (!match && beforeCount - filtered.length < 5) {
      }

      return match;
    });

    if (filtered.length > 0 && filtered.length <= 5) {
        id: item.reconciliationId,
        currency: item.ccy || item.accountCurrency
      })));
    }
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    const beforeCount = filtered.length;

    filtered = filtered.filter(item => {
      const dateField = item.reconDate || item.date || item.createdAt;
      if (!dateField) return true;
      return isDateInRange(dateField, filters.startDate, filters.endDate);
    });
  }

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase().trim();
    const beforeCount = filtered.length;

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

      const isMatch = searchableFields.some(field => field.includes(query));

      if (beforeCount - filtered.length < 3) {
        if (isMatch) {
        } else {
        }
      }

      return isMatch;
    });
  }

  return filtered;
};

// ============================================================================
// STATE INTERFACES
// ============================================================================

interface CacheState {
  timestamp: number | null;
  data: any;
}

interface ReconciliationState {
  reconciliations: any[];
  filteredReconciliations: any[];
  allFilteredData: any[];
  currentReconciliation: any | null;
  comments: Record<string, any[]>;
  summary: any | null;
  loading: boolean;
  searching: boolean;
  error: any | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  totalRecords: number;
  filterOptions: {
    priority: string[];
    currency: string[];
    startDate: string;
    endDate: string;
    searchQuery: string;
  };
  cache: {
    reconciliations: CacheState;
    summary: CacheState;
    details: Record<string, CacheState>;
  };
}

const CACHE_DURATION = 5 * 60 * 1000;

const initialState: ReconciliationState = {
  reconciliations: [],
  filteredReconciliations: [],
  allFilteredData: [],
  currentReconciliation: null,
  comments: {},
  summary: null,
  loading: false,
  searching: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalRecords: 0,
  filterOptions: {
    priority: [],
    currency: [],
    startDate: '',
    endDate: '',
    searchQuery: '',
  },
  cache: {
    reconciliations: { timestamp: null, data: null },
    summary: { timestamp: null, data: null },
    details: {},
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isCacheValid = (cacheState: CacheState): boolean => {
  if (!cacheState.timestamp) return false;
  return Date.now() - cacheState.timestamp < CACHE_DURATION;
};

const updateCache = (cacheState: CacheState, data: any): CacheState => {
  return {
    timestamp: Date.now(),
    data,
  };
};

const calculateTotalPages = (totalCount: number, itemsPerPage: number): number => {
  if (totalCount === 0 || itemsPerPage === 0) return 1;
  return Math.ceil(totalCount / itemsPerPage);
};

const paginateData = (data: any[], page: number, pageSize: number): any[] => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchReconciliations = createAsyncThunk<
  any,
  {
    page?: number;
    pageSize?: number;
    useCache?: boolean;
    status?: string;
    selectedPeriod?: string;
    defaultPeriod?: any;
  } | undefined,
  { rejectValue: { message: string; data: any }; state: any }
>(
  'reconciliation/fetchReconciliations',
  async (params, { rejectWithValue, getState }) => {
    try {
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 100;
      const status = params?.status ?? 'All';
      const useCache = params?.useCache ?? false;
      const selectedPeriod = params?.selectedPeriod;
      const defaultPeriod = params?.defaultPeriod;
      const state = getState();

      if (!state.auth.isAuthenticated) {
        return rejectWithValue({
          message: 'User not authenticated',
          data: { items: [], totalCount: 0 },
        });
      }

      const user = state.auth.user;
      if (!user || !user.userUuid) {
        return rejectWithValue({
          message: 'User data not available',
          data: { items: [], totalCount: 0 },
        });
      }

      const userId = String(user.userUuid);
      const userRole = user.currentRole;

      const parsePeriodToDate = (period: any): Date | null => {
        if (!period) return null;
        const [monthName, year] = period.split(' ');
        if (!monthName || !year) return null;
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        return new Date(Number(year), monthIndex, 1);
      };

      const selectedDate = parsePeriodToDate(selectedPeriod);
      const defaultDate = parsePeriodToDate(defaultPeriod);

      if (selectedDate && defaultDate && defaultDate < selectedDate) {
        return rejectWithValue({
          message: 'There is no available data for this period',
          data: { items: [], totalCount: 0 },
        });
      }

      if (useCache && isCacheValid(state.reconciliation.cache.reconciliations)) {
        return state.reconciliation.cache.reconciliations.data;
      }

      // Use proper pagination instead of fetching all records
      const response: any = await reconService.listLiveReconciliations(
        page,
        pageSize,
        userId,
        userRole,
        status,
        selectedPeriod,
        defaultPeriod
      );

        totalCount: response.totalCount,
        itemsLength: response.items?.length,
      });

      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || error?.message || 'Failed to fetch reconciliations',
        data: { items: [], totalCount: 0 },
      });
    }
  }
);


export const statusUpdateApi = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>(
  'reconciliation/statusUpdateApi',
  async (data, { rejectWithValue }) => {
    try {

      //  STEP 1: ADD COMMENTARY FIRST (using old status - this is fine)
      if (data?.commentryPayload?.statusComment?.trim()) {
        try {
          await reconService.addCommentary(
            data?.commentryPayload?.reconciliationId,
            data?.commentryPayload?.statusComment,
            data?.commentryPayload?.userId
          );
        } catch (commentErr: any) {
          // Don't throw - continue with status update even if comment fails
        }
      }

      //  STEP 2: THEN UPDATE STATUS (after commentary is added)
      const response = await reconService.statusUpdateApi(data?.statusPayload);

      //  RETURN ONLY SERIALIZABLE DATA (NOT the full axios response)
      // Remove non-serializable properties like headers, config, request, etc
      return {
        success: true,
        data: response?.data, // Only get the data property
        status: response?.status,
        statusText: response?.statusText
      };
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to update status'
      );
    }
  }
);


const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState,
  reducers: {
    clearCurrentReconciliation: (state) => {
      state.currentReconciliation = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    setFilterOptions: (state, action: PayloadAction<any>) => {
      state.filterOptions = { ...state.filterOptions, ...action.payload };
      state.currentPage = 1;

      state.allFilteredData = applyClientFilters(state.reconciliations, state.filterOptions);
      state.totalRecords = state.allFilteredData.length;
      state.totalItems = state.allFilteredData.length;
      state.totalPages = calculateTotalPages(state.totalRecords, state.itemsPerPage);

      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

        filters: state.filterOptions,
        totalFiltered: state.totalRecords,
        displayedItems: state.filteredReconciliations.length,
      });
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filterOptions.searchQuery = action.payload;
      state.currentPage = 1;

      state.allFilteredData = applyClientFilters(state.reconciliations, state.filterOptions);
      state.totalRecords = state.allFilteredData.length;
      state.totalItems = state.allFilteredData.length;
      state.totalPages = calculateTotalPages(state.totalRecords, state.itemsPerPage);

      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

        query: action.payload,
        resultsCount: state.totalRecords,
      });
    },

    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.filterOptions.startDate = action.payload.startDate;
      state.filterOptions.endDate = action.payload.endDate;
      state.currentPage = 1;

      state.allFilteredData = applyClientFilters(state.reconciliations, state.filterOptions);
      state.totalRecords = state.allFilteredData.length;
      state.totalItems = state.allFilteredData.length;
      state.totalPages = calculateTotalPages(state.totalRecords, state.itemsPerPage);

      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        resultsCount: state.totalRecords,
      });
    },

    resetFilters: (state) => {
      state.filterOptions = {
        priority: [],
        currency: [],
        startDate: '',
        endDate: '',
        searchQuery: '',
      };
      state.currentPage = 1;

      state.allFilteredData = applyClientFilters(state.reconciliations, state.filterOptions);
      state.totalRecords = state.allFilteredData.length;
      state.totalItems = state.allFilteredData.length;
      state.totalPages = calculateTotalPages(state.totalRecords, state.itemsPerPage);

      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= state.totalPages) {
        state.currentPage = action.payload;

        state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

      }
    },

    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
      state.currentPage = 1;
      state.totalPages = calculateTotalPages(state.totalRecords, action.payload);

      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);

        itemsPerPage: action.payload,
        totalPages: state.totalPages,
      });
    },

    invalidateCache: (state, action: PayloadAction<keyof typeof state.cache>) => {
      if (action.payload === 'reconciliations') {
        state.cache.reconciliations.timestamp = null;
      } else if (action.payload === 'summary') {
        state.cache.summary.timestamp = null;
      }
    },

    invalidateAllCache: (state) => {
      state.cache.reconciliations.timestamp = null;
      state.cache.summary.timestamp = null;
      state.cache.details = {};
    },
  },

extraReducers: (builder) => {
  builder
    .addCase(fetchReconciliations.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchReconciliations.fulfilled, (state, action) => {
      state.loading = false;
      state.reconciliations = action.payload?.items || [];
      state.allFilteredData = applyClientFilters(state.reconciliations, state.filterOptions);
      state.totalRecords = state.allFilteredData.length;
      state.totalItems = state.allFilteredData.length;
      state.totalPages = calculateTotalPages(state.totalRecords, state.itemsPerPage);
      state.filteredReconciliations = paginateData(state.allFilteredData, state.currentPage, state.itemsPerPage);
      state.cache.reconciliations = updateCache(
        state.cache.reconciliations,
        action.payload
      );
        totalRaw: state.reconciliations.length,
        totalFiltered: state.totalRecords,
        currentPage: state.currentPage,
        displayedItems: state.filteredReconciliations.length,
      });
    })
    .addCase(fetchReconciliations.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload?.message || action.payload || 'Failed to fetch reconciliations';
      state.reconciliations = action.payload?.data?.items || [];
      state.allFilteredData = [];
      state.totalRecords = action.payload?.data?.totalCount || 0;
      state.totalItems = action.payload?.data?.totalCount || 0;
      state.totalPages = 0;
      state.filteredReconciliations = [];
      state.currentPage = 1;
    })
    .addCase(statusUpdateApi.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(statusUpdateApi.fulfilled, (state) => {
      state.loading = false;
      state.cache.reconciliations.timestamp = null;
    })
    .addCase(statusUpdateApi.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
}
});

// ============================================================================
// EXPORTED ACTIONS
// ============================================================================

export const {
  clearCurrentReconciliation,
  clearError,
  setFilterOptions,
  setSearchQuery,
  setDateRange,
  resetFilters,
  setCurrentPage,
  setItemsPerPage,
  invalidateCache,
  invalidateAllCache,
} = reconciliationSlice.actions;

export default reconciliationSlice.reducer;
