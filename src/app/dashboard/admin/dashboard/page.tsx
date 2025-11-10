'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCurrentRecPeriod as getCurrentPeriod,
  updatePeriod,  // Use a single import with the original name
  startPeriod as startNewPeriod,
  updateOverdue as setOverdueReconciliations,
  getLiveMasterReconciliations as getAllSummarisedLiveRecs,
  sendReminders as sendOverdueReminders,
  getAllDownloads
} from '@/services/admin/admin.service';
import styles from './page.module.scss';
import RecControlHeader from '@/components/Admin/RecControlHeader/RecControlHeader';
import ReconciliationTable from '@/components/Admin/ReconciliationTable/ReconciliationControlTable';
import FilterBar from '@/components/Admin/FilterBar/FilterBar';
import AdminReconciliationDetails from '@/components/Admin/AdminReconciliationDetails/AdminReconciliationDetails';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useMessageStore } from '@/redux/messageStore/messageStore';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';

interface FilterState {
  status: string[];
  priority: string[];
  frequency: string[];
}

interface PeriodData {
  id: string;
  workingPeriod: string;
  reconciliationPeriod: string;
  highPriorityDeadline: string;
  lowPriorityDeadline: string;
  locked: boolean;
}

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
}

// Moved constant maps outside the component
const STATUS_MAP: Record<string, string> = {
  'NOT_STARTED': 'Prepare',
  'IN_PROGRESS': 'Prepare',
  'READY': 'Review',
  'APPROVED': 'Completed',
  'REJECTED': 'Rejected'
};

const FREQUENCY_MAP: Record<string, string> = {
  'MONTHLY': 'Monthly',
  'QUARTERLY': 'Quarterly',
  'ANNUAL': 'Annual'
};

// Moved utility functions outside component to prevent recreation
const mapRiskRatingToPriority = (riskRating: string): string => {
  if (!riskRating) return 'Low';
  if (riskRating.includes('High')) return 'High';
  if (riskRating.includes('Medium')) return 'Medium';
  return 'Low';
};

const isOverdue = (deadlineDate: string): boolean => {
  if (!deadlineDate) return false;
  try {
    return new Date(deadlineDate) < new Date();
  } catch {
    return false;
  }
};

const getMonthKey = (date: string): string => {
  try {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated, isRoleSwitching } = useSelector(
    (state: RootState) => state.auth
  );

  const { showError, showSuccess } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const [currentPeriodData, setCurrentPeriodData] = useState<PeriodData | null>(null);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    frequency: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [defaultPeriod, setDefaultPeriod] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Extract userId from user when it changes
  useEffect(() => {
    if (user?.userUuid) {
      setUserId(String(user.userUuid));
    }
  }, [user?.userUuid]);

  // Optimized with proper dependency array
  const fetchPeriodData = useCallback(async (userIdParam: string) => {
    try {
      showLoader('Loading period data');
      const response = await getCurrentPeriod(userIdParam);

      if (response) {
        const periodData = {
          id: 'current-period',
          workingPeriod: response.monthly?.workingPeriod || 'July 2025',
          reconciliationPeriod: response.monthly?.currentPeriod || 'June 2025',
          highPriorityDeadline: response.monthly?.highDeadlineDate || '6 July 2025',
          lowPriorityDeadline: response.monthly?.lowDeadlineDate || '16 July 2025',
          locked: response.monthly?.highDeadlineLocked || false
        };
        setCurrentPeriodData(periodData);
        setDefaultPeriod(periodData.reconciliationPeriod);
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to fetch period data');
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader, showError]);

  // Fetch period data when authenticated user is available
  useEffect(() => {
    if (isAuthenticated && user && !isRoleSwitching) {
      fetchPeriodData(String(user.userUuid));
    }
  }, [isAuthenticated, user, isRoleSwitching, fetchPeriodData]);

  // Optimized initializeData to prevent unnecessary fetches
  const initializeData = useCallback(async (userIdParam: string) => {
    if (!userIdParam) return;

    try {
      setLoading(true);
      const recsResponse = await getAllSummarisedLiveRecs(
        currentPage,
        itemsPerPage,
        userIdParam
      );

      if (!recsResponse?.items) {
        throw new Error('No reconciliation data received from API');
      }

      const formattedRecs = recsResponse.items.map((item: any) => ({
        id: item.reconciliationId || '',
        priority: mapRiskRatingToPriority(item.riskRating || ''),
        status: STATUS_MAP[item.status || 'NOT_STARTED'] || item.status,
        preparer: item.performerName || '',
        reviewer: item.tier1Reviewer || '',
        deadline: item.deadlineDate || '',
        frequency: FREQUENCY_MAP[item.frequency || 'MONTHLY'] || item.frequency,
        locked: item.locked || false,
        overdue: isOverdue(item.deadlineDate || ''),
        account: item.reconciliationName || '',
        entity: item.division || ''
      }));

      setReconciliations(formattedRecs);
      setSelectedIds(new Set());
   
    } catch (error: any) {
      showError(error?.response?.data?.message || error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, showSuccess, showError]);

  // Load data when userId changes or pagination changes
  useEffect(() => {
    if (userId) {
      initializeData(userId);
    }
  }, [userId, currentPage, itemsPerPage, initializeData]);

  // Optimized filtering with useMemo
  const filteredReconciliations = useMemo(() => {
    let filtered = reconciliations;

    // Only filter if there are actual filters applied
    const hasSearchTerm = !!searchTerm;
    const hasStatusFilter = filters.status.length > 0;
    const hasPriorityFilter = filters.priority.length > 0;
    const hasFrequencyFilter = filters.frequency.length > 0;
    const hasMonthFilter = !!selectedMonth;
    const hasDateRangeFilter = !!(dateRangeStart && dateRangeEnd);

    // Early return if no filters applied
    if (!hasSearchTerm && !hasStatusFilter && !hasPriorityFilter &&
      !hasFrequencyFilter && !hasMonthFilter && !hasDateRangeFilter) {
      return filtered;
    }

    if (hasSearchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rec =>
        rec.id.toLowerCase().includes(searchLower) ||
        rec.preparer.toLowerCase().includes(searchLower) ||
        rec.reviewer.toLowerCase().includes(searchLower) ||
        rec.account.toLowerCase().includes(searchLower)
      );
    }

    if (hasStatusFilter) {
      filtered = filtered.filter(rec => filters.status.includes(rec.status));
    }

    if (hasPriorityFilter) {
      filtered = filtered.filter(rec => filters.priority.includes(rec.priority));
    }

    if (hasFrequencyFilter) {
      filtered = filtered.filter(rec => filters.frequency.includes(rec.frequency));
    }

    if (hasMonthFilter) {
      filtered = filtered.filter(rec => getMonthKey(rec.deadline) === selectedMonth);
    }

    if (hasDateRangeFilter) {
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      filtered = filtered.filter(rec => {
        try {
          const recDate = new Date(rec.deadline);
          return recDate >= startDate && recDate <= endDate;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [reconciliations, searchTerm, filters, selectedMonth, dateRangeStart, dateRangeEnd]);

  // Memoize handler functions to prevent recreation on every render
  const handleEditPeriod = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const handleUpdatePeriod = useCallback(async (updatedData: Partial<PeriodData>) => {
    if (!currentPeriodData || !userId) return;

    try {
      setIsSaving(true);
      // Call the updatePeriod function with the proper parameters
      const updated = await updatePeriod(updatedData, userId);

      if (updated) {
        setCurrentPeriodData(updated);
        setIsPanelOpen(false);
        showSuccess('Period updated successfully');
        await initializeData(userId);
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update period');
    } finally {
      setIsSaving(false);
    }
  }, [currentPeriodData, userId, showSuccess, showError, initializeData]);

  const handleStartNewPeriod = useCallback(async () => {
    if (!window.confirm('Are you sure you want to start a new period? This action cannot be undone.')) {
      return;
    }

    if (!userId) return;

    try {
      setLoading(true);
      const newPeriod = await startNewPeriod(userId);
      if (newPeriod) {
        setCurrentPeriodData(newPeriod);
        await initializeData(userId);
        showSuccess('New period started successfully');
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to start new period');
    } finally {
      setLoading(false);
    }
  }, [userId, showSuccess, showError, initializeData]);

  const handleSetOverdue = useCallback(async () => {
    if (!window.confirm('Mark all pending reconciliations as overdue?')) {
      return;
    }

    if (!userId) return;

    try {
      setLoading(true);
      await setOverdueReconciliations(userId);
      await initializeData(userId);
      showSuccess('Overdue reconciliations marked successfully');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to set overdue');
    } finally {
      setLoading(false);
    }
  }, [userId, showSuccess, showError, initializeData]);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    setDateRangeStart('');
    setDateRangeEnd('');
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
    setSelectedMonth('');
    setCurrentPage(1);
  }, []);

  const handleSendReminders = useCallback(async () => {
    if (selectedIds.size === 0) {
      showError('Please select at least one reconciliation');
      return;
    }

    if (!userId) return;

    try {
      setIsSaving(true);
      const result = await sendOverdueReminders(userId);
      showSuccess(result?.message || `Reminders sent to ${selectedIds.size} selected item(s)`);
      setSelectedIds(new Set());
      await initializeData(userId);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to send reminders');
    } finally {
      setIsSaving(false);
    }
  }, [selectedIds, userId, showSuccess, showError, initializeData]);

const handleDownloadReport = useCallback(async () => { 
  if (!userId) {
    showError('User data not available');
    return;
  }

  setIsDownloading(true);

  try {
    const response = await getAllDownloads(currentPage, itemsPerPage, userId);
    console.log("Response object:", response);

    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
    console.error("Download failed:", error);
    showError('Failed to download report');
  } finally {
    setIsDownloading(false);
  }
}, [userId, currentPage, itemsPerPage, showError, showSuccess]);


  const handleSelectionChange = useCallback((newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds);
  }, []);

  // Loading state when userId is not available
  if (userId === null) {
    return (
      <div className={`${styles.adminDashboard} d-flex align-items-center justify-content-center`} style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      <RecControlHeader
        currentPeriodData={currentPeriodData}
        loading={loading}
        locked={currentPeriodData?.locked || false}
        onEditPeriod={handleEditPeriod}
        onStartNewPeriod={handleStartNewPeriod}
        onSetOverdue={handleSetOverdue}
        selectedMonth={selectedMonth}
        defaultPeriod={defaultPeriod}
        onMonthChange={handleMonthChange}
        onDateRangeChange={handleDateRangeChange}
      />

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSendReminder={handleSendReminders}
        onDownloadReport={handleDownloadReport}
        isSaving={isSaving || isDownloading}
        selectedCount={selectedIds.size}
      />

      <ReconciliationTable
        reconciliations={filteredReconciliations}
        loading={loading}
        isSaving={isSaving}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        totalRecords={reconciliations.length}
      />
<AdminReconciliationDetails
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
  currentPeriodData={currentPeriodData}
  onUpdatePeriod={handleUpdatePeriod}
  isSaving={isSaving}
  userId={userId} 
/>
    </div>
  );
};

export default AdminDashboardPage;