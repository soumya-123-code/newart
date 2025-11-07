'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.scss';
import SearchBar from '@/components/common/SearchBar/SearchBar';
import Pagination from '@/components/common/Pagination/Pagination';
import AllReconciliationTable from '@/components/Admin/ReconciliationTable/AllReconciliationTable';
import { getReconciliationControl, exportReport, updateOverdue } from '@/services/admin/admin.service';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

const norm = (v: unknown) => String(v ?? '').toLowerCase().trim();
const includes = (a: string, b: string) => a.indexOf(b) !== -1;

type SortField =
  | 'reconciliationId'
  | 'reconciliationName'
  | 'active'
  | 'accountType'
  | 'frequency'
  | 'riskRating'
  | 'preparer'
  | 'reviewer';
type SortOrder = 'asc' | 'desc';

type FilterType = {
  active: string[];
  accountType: string[];
  frequency: string[];
  riskLevel: string[];
};

type PopupPos = { top: number; left: number };

const transformReconciliationData = (items: any[]) => {
  return items.map((item) => ({
    id: item.id,
    reconciliationId: item.reconciliationId,
    reconciliationName: item.reconciliation?.reconciliationName || '—',
    disabled: item.reconciliation?.disabled ?? true,
    recType: item.reconciliation?.recType || 'Standard',
    frequency: item.reconciliation?.frequency || '—',
    riskRating: item.reconciliation?.riskRating || '—',
    performerName: item.performerName || item.reconciliation?.performer?.fullName || '—',
    tier1Reviewer: item.reconciliation?.tier1Reviewer || '—',
    status: item.status,
    division: item.reconciliation?.division || '—',
    currentPeriod: item.currentPeriod,
    deadlineStatus: item.deadlineStatus,
    deadlineDate: item.reconciliation?.deadlineDate || '—',
    createDate: item.createDate,
    locked: item.locked,
  }));
};

export default function AdminAllReconciliations() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [userId, setUserId] = useState<string | null>(null);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<'active'|'account'|'frequency'|'risk'>('active');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<FilterType>({
    active: [],
    accountType: [],
    frequency: [],
    riskLevel: [],
  });
  const [sortField, setSortField] = useState<SortField>('reconciliationId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<PopupPos | null>(null);

  useEffect(() => {
    if (user?.userUuid) {
      const userIdStr = String(user.userUuid);
      setUserId(userIdStr);
    }
  }, [user?.userUuid]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getReconciliationControl(1, 1000, userId);
        if (res?.items && Array.isArray(res.items)) {
          const transformedData = transformReconciliationData(res.items);
          setAllData(transformedData);
        } else {
          setError('Invalid data format received from API');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load reconciliations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const computePopupPosition = () => {
    if (!filterBtnRef.current) return;
    const btnRect = filterBtnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const desiredWidth = Math.min(520, vw - 16);
    const desiredHeight = Math.min(480, vh - 16);
    let top = btnRect.bottom + 8;
    let left = btnRect.left;
    if (top + desiredHeight > vh) {
      const tryTop = btnRect.top - 8 - desiredHeight;
      if (tryTop >= 8) {
        top = tryTop;
      } else {
        top = Math.max(8, Math.min(top, vh - desiredHeight - 8));
      }
    }
    if (left + desiredWidth > vw - 8) {
      left = vw - desiredWidth - 8;
    }
    left = Math.max(8, left);
    setPopupPos({ top, left });
  };

  useEffect(() => {
    if (!showFilters) return;
    const onChange = () => {
      if (!showFilters) return;
      requestAnimationFrame(computePopupPosition);
    };
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    const id = setTimeout(onChange, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [showFilters]);

  const toggleFilters = () => {
    setShowFilters((v) => {
      const next = !v;
      if (next) {
        computePopupPosition();
      } else {
        setPopupPos(null);
      }
      return next;
    });
  };

  const filterOptions = useMemo(() => {
    const activeOptions = new Set<string>();
    const accountTypes = new Set<string>();
    const frequencies = new Set<string>();
    const riskLevels = new Set<string>();
    allData.forEach((r) => {
      activeOptions.add(r.disabled === false ? 'Active' : 'Disabled');
      if (r.recType) accountTypes.add(r.recType);
      if (r.frequency) frequencies.add(r.frequency);
      if (r.riskRating) {
        const rating = norm(r.riskRating);
        if (rating.includes('high risk') || rating.includes('high impact')) riskLevels.add('High');
        else if (rating.includes('medium risk') || rating.includes('medium impact')) riskLevels.add('Medium');
        else riskLevels.add('Low');
      }
    });
    return {
      activeOptions: Array.from(activeOptions).sort(),
      accountTypes: Array.from(accountTypes).sort(),
      frequencies: Array.from(frequencies).sort(),
      riskLevels: Array.from(riskLevels).sort(),
    };
  }, [allData]);

  const visible = useMemo(() => {
    let data = [...allData];
    const s = norm(debouncedQ);
    if (s) {
      data = data.filter((r) => {
        const hay = [
          r.reconciliationId,
          r.reconciliationName,
          r.performerName,
          r.tier1Reviewer,
          r.recType,
          r.frequency,
        ].map(norm).join(' | ');
        return includes(hay, s);
      });
    }
    if (filters.active.length > 0) {
      data = data.filter((r) => {
        const isActive = r.disabled === false;
        return filters.active.includes(isActive ? 'Active' : 'Disabled');
      });
    }
    if (filters.accountType.length > 0) {
      data = data.filter((r) => filters.accountType.includes(r.recType));
    }
    if (filters.frequency.length > 0) {
      data = data.filter((r) => filters.frequency.includes(r.frequency));
    }
    if (filters.riskLevel.length > 0) {
      data = data.filter((r) => {
        const x = norm(r.riskRating);
        return filters.riskLevel.some((level) => {
          if (level === 'High') return x.includes('high risk') || x.includes('high impact');
          if (level === 'Medium') return x.includes('medium risk') || x.includes('medium impact');
          if (level === 'Low') return x.includes('low risk') || x.includes('low impact');
          return false;
        });
      });
    }
    const getVal = (r: any, f: SortField) => {
      if (f === 'active') {
        return r.disabled === false ? 1 : 0;
      }
      if (f === 'riskRating') {
        const match = String(r.riskRating).match(/^(\d+)\./);
        return match ? parseInt(match[1]) : 999;
      }
      if (f === 'preparer') return norm(r.performerName);
      if (f === 'reviewer') return norm(r.tier1Reviewer);
      if (f === 'accountType') return norm(r.recType);
      return norm((r as any)[f]);
    };
    data.sort((a, b) => {
      const av = getVal(a, sortField);
      const bv = getVal(b, sortField);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [allData, debouncedQ, filters, sortField, sortOrder]);

  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (page - 1) * size;
  const end = Math.min(start + size, total);
  const pageData = useMemo(() => visible.slice(start, end), [visible, start, end]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters]);

  const onRefresh = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await updateOverdue(userId);
      const res = await getReconciliationControl(1, 1000, userId);
      const transformedData = transformReconciliationData(res.items || []);
      setAllData(transformedData);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const blobRes = await exportReport('excel', {}, userId);
      const blob = (blobRes as any).blob ? await (blobRes as Response).blob() : (blobRes as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliations-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const onHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleFilter = (type: keyof FilterType, value: string) => {
    setFilters((prev) => {
      const current = prev[type];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({ active: [], accountType: [], frequency: [], riskLevel: [] });
  };

  const hasActiveFilters =
    filters.active.length > 0 ||
    filters.accountType.length > 0 ||
    filters.frequency.length > 0 ||
    filters.riskLevel.length > 0;

  const fixedStyle: React.CSSProperties =
    showFilters && popupPos ? { position: 'fixed', top: popupPos.top, left: popupPos.left } : { display: 'none' };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1>All reconciliations</h1>
        <div className={styles.tools}>
          <div className={styles.searchWrap}>
            <SearchBar
              className={styles.search}
              value={q}
              onChange={(e: any) => setQ(e.target.value)}
              placeholder="Search"
            />
          </div>
          <button
            ref={filterBtnRef}
            className={`${styles.toolBtn} ${hasActiveFilters ? styles.active : ''}`}
            onClick={toggleFilters}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className={styles.btnText}>Filter</span>
            {hasActiveFilters && (
              <span className={styles.filterBadge}>
                {filters.active.length + filters.accountType.length + filters.frequency.length + filters.riskLevel.length}
              </span>
            )}
          </button>
          <button className={styles.toolBtn} onClick={onRefresh} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8a5 5 0 0 1 8.66-3.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M11 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 8a5 5 0 0 1-8.66 3.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5 14v-3H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className={styles.btnText}>Refresh</span>
          </button>
          <button
            className={`${styles.toolBtn} ${styles.primary}`}
            onClick={onDownload}
            disabled={loading || !visible.length}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 10v2.667c0 .354-.14.693-.39.943-.25.25-.589.39-.943.39H3.333a1.333 1.333 0 0 1-1.333-1.333V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.667 6.667L8 10l3.333-3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.btnText}>Download report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
        </div>
      )}

      {showFilters && (
        <>
          <div className={styles.filterBackdrop} onClick={() => setShowFilters(false)} />
          <div className={styles.filterPopup} style={fixedStyle} role="dialog" aria-modal="true">
            <div className={styles.filterPopupHeader}>
              <div>Filter</div>
              <button className={styles.filterClose} onClick={() => setShowFilters(false)} aria-label="Close">×</button>
            </div>
            <div className={styles.filterPopupBody} role="group" aria-label="Filters">
              <aside className={styles.filterNav}>
                <button
                  className={`${styles.filterNavItem} ${activeCat === 'active' ? styles.active : ''}`}
                  onClick={() => setActiveCat('active')}
                >
                  Active Status
                </button>
                <button
                  className={`${styles.filterNavItem} ${activeCat === 'account' ? styles.active : ''}`}
                  onClick={() => setActiveCat('account')}
                >
                  Account Type
                </button>
                <button
                  className={`${styles.filterNavItem} ${activeCat === 'frequency' ? styles.active : ''}`}
                  onClick={() => setActiveCat('frequency')}
                >
                  Frequency
                </button>
                <button
                  className={`${styles.filterNavItem} ${activeCat === 'risk' ? styles.active : ''}`}
                  onClick={() => setActiveCat('risk')}
                >
                  Risk Level
                </button>
              </aside>
              <section className={styles.filterPanelScroll}>
                <div className={styles.filterHeaderInline}>
                  <h3>
                    {activeCat === 'active' && 'Active Status'}
                    {activeCat === 'account' && 'Account Type'}
                    {activeCat === 'frequency' && 'Frequency'}
                    {activeCat === 'risk' && 'Risk Level'}
                  </h3>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className={styles.clearAll}>
                      Clear all
                    </button>
                  )}
                </div>
                {activeCat === 'active' && (
                  <div className={styles.filterGroup}>
                    <div className={styles.filterOptions}>
                      {filterOptions.activeOptions.map((option) => (
                        <label key={option} className={styles.filterOption}>
                          <input
                            type="checkbox"
                            checked={filters.active.includes(option)}
                            onChange={() => toggleFilter('active', option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {activeCat === 'account' && (
                  <div className={styles.filterGroup}>
                    <div className={styles.filterOptions}>
                      {filterOptions.accountTypes.map((type) => (
                        <label key={type} className={styles.filterOption}>
                          <input
                            type="checkbox"
                            checked={filters.accountType.includes(type)}
                            onChange={() => toggleFilter('accountType', type)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {activeCat === 'frequency' && (
                  <div className={styles.filterGroup}>
                    <div className={styles.filterOptions}>
                      {filterOptions.frequencies.map((freq) => (
                        <label key={freq} className={styles.filterOption}>
                          <input
                            type="checkbox"
                            checked={filters.frequency.includes(freq)}
                            onChange={() => toggleFilter('frequency', freq)}
                          />
                          <span>{freq}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {activeCat === 'risk' && (
                  <div className={styles.filterGroup}>
                    <div className={styles.filterOptions}>
                      {filterOptions.riskLevels.map((level) => (
                        <label key={level} className={styles.filterOption}>
                          <input
                            type="checkbox"
                            checked={filters.riskLevel.includes(level)}
                            onChange={() => toggleFilter('riskLevel', level)}
                          />
                          <span>{level} Risk</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
            <div className={styles.filterPopupFooter}>
              <button className={styles.filterLink} onClick={clearAllFilters}>Reset filters</button>
              <div className={styles.filterActions}>
                <button className={styles.filterSecondary} onClick={() => setShowFilters(false)}>Cancel</button>
                <button className={styles.filterPrimary} onClick={() => setShowFilters(false)}>Apply</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <AllReconciliationTable
            reconciliations={pageData}
            onSort={onHeaderSort}
            currentSort={{ field: sortField, order: sortOrder }}
            loading={loading}
            userId={userId}
          />
        </div>
      </div>

      <div className={styles.footerBar}>
        <span className={styles.range}>
          {total ? `${start + 1}-${end} of ${total}` : '0-0 of 0'}
        </span>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        <div className={styles.itemsPerPage}>
          <span>Items per page</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
