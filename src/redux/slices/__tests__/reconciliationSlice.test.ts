import { configureStore } from '@reduxjs/toolkit';
import reconciliationReducer, {
  fetchReconciliations,
  setFilterOptions,
  setCurrentPage,
} from '../reconciliationSlice';

describe('reconciliationSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        reconciliation: reconciliationReducer,
        auth: () => ({
          isAuthenticated: true,
          user: {
            userUuid: 1024,
            currentRole: 'ADMIN',
          },
        }),
      },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().reconciliation;
      expect(state.reconciliations).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(10);
      expect(state.totalRecords).toBe(0);
    });
  });

  describe('setCurrentPage', () => {
    it('should update current page', () => {
      store.dispatch(setCurrentPage(3));
      const state = store.getState().reconciliation;
      expect(state.currentPage).toBe(3);
    });
  });

  describe('setFilterOptions', () => {
    it('should update filter options and reset page to 1', () => {
      store.dispatch(setCurrentPage(5));
      store.dispatch(setFilterOptions({ priority: ['High'], currency: ['USD'] }));

      const state = store.getState().reconciliation;
      expect(state.filterOptions.priority).toEqual(['High']);
      expect(state.filterOptions.currency).toEqual(['USD']);
      expect(state.currentPage).toBe(1);
    });
  });

  describe('fetchReconciliations', () => {
    it('should set loading to true when pending', () => {
      store.dispatch(fetchReconciliations.pending('', undefined));
      const state = store.getState().reconciliation;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set reconciliations when fulfilled', () => {
      const mockData = {
        items: [
          { id: '1', status: 'Completed', priority: 'High' },
          { id: '2', status: 'Pending', priority: 'Low' },
        ],
        totalCount: 2,
      };

      store.dispatch(fetchReconciliations.fulfilled(mockData, '', undefined));
      const state = store.getState().reconciliation;

      expect(state.loading).toBe(false);
      expect(state.reconciliations).toEqual(mockData.items);
      expect(state.totalRecords).toBe(2);
      expect(state.error).toBe(null);
    });

    it('should set error when rejected', () => {
      const errorPayload = {
        message: 'Failed to fetch reconciliations',
        data: { items: [], totalCount: 0 },
      };

      store.dispatch(fetchReconciliations.rejected(null, '', undefined, errorPayload));
      const state = store.getState().reconciliation;

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch reconciliations');
      expect(state.reconciliations).toEqual([]);
    });
  });
});
