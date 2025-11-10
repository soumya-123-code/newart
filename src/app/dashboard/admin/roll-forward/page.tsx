"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./page.module.scss";
import Pagination from "@/components/common/Pagination/Pagination";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import RollForwardTable, {
  IRollForwardTable,
  ILogRow,
} from "@/components/common/RollForwadTable/RollForwadTable";

import {
  getRollForwardProcessLog,
  getRollForwardBalanceSheets,
  rollforward,
  rollForwordAllDownloads,
  getCurrentRecPeriod,
} from "@/services/admin/admin.service";

import { useMessageStore } from "@/redux/messageStore/messageStore";
import { useLoaderStore } from "@/redux/loaderStore/loaderStore";
import DatePicker from "@/components/common/DatePicker/DatePicker";
import SearchBar from "@/components/common/SearchBar/SearchBar";
import SidePanel from "@/components/common/SidePanel/SidePanel";
import StatusBadge from "@/components/common/StatusBadge/StatusBadge";

// -------- Types from API --------
type BalanceSheetItemAPI = {
  id: number;
  reconciliationId: string;
  currentPeriod: string;
  status: string;
  preparedBy: string;
  tier1Reviewer: string;
  recBalance: string;
  deadline: string;
  ccy: string;
  createDate: string;
};
type BalanceSheetResponseAPI = { items: BalanceSheetItemAPI[]; totalCount: number };

type LogItemAPI = {
  id: number;
  reconciliationId: string;
  currentPeriod: string;
  status: string;
  createDate: string;
  messageResponse?: {
    operation?: string;
    status?: string;
    payload?: {
      reconciliationId?: string | number;
      userId?: number;
      currentPeriod?: string;
      status?: string;
      createDate?: string;
    };
  };
  logType?: string;
};
type ProcessLogResponseAPI = { items: LogItemAPI[]; totalCount: number } | LogItemAPI[];

function convertPeriodFormat(apiPeriod: string): string {
  try {
    // Handle already formatted periods like "Aug 2025"
    if (apiPeriod.includes(' ') && apiPeriod.split(' ').length === 2) {
      const parts = apiPeriod.split(' ');
      if (parts[1].length === 4) {
        return apiPeriod;
      }
    }

    // Parse "01-Aug-25" format
    const parts = apiPeriod.split('-');
    if (parts.length !== 3) {
      return apiPeriod;
    }

    const day = parts[0];
    const month = parts[1]; // "Aug"
    const year = parts[2];  // "25"

    if (!month || month.length !== 3 || !year || year.length !== 2) {
      return apiPeriod;
    }

    const fullYear = `20${year}`;
    return `${month} ${fullYear}`;
  } catch {
    return apiPeriod;
  }
}

function humanizeStatus(s: any): string {
  const raw = String(s || "").toLowerCase();
  if (raw.includes("success")) return "Success";
  if (raw.includes("progress") || raw.includes("in progress")) return "In progress";
  if (raw.includes("fail") || raw.includes("error")) return "Failed";
  return s || "Unknown";
}

function mapBS(item: BalanceSheetItemAPI): IRollForwardTable {
  return {
    id: String(item.id),
    reconciliationId: item.reconciliationId ?? "",
    priority: item.deadline ?? "",
    status: item.status ?? "",
    preparer: item.preparedBy ?? "",
    reviewer: item.tier1Reviewer ?? "",
    deadline: convertPeriodFormat(item.currentPeriod ?? ""),
    frequency: "Monthly",
    locked: false,
    overdue: false,
  };
}

function mapLog(item: LogItemAPI, idx: number): ILogRow {
  const uiPeriod = convertPeriodFormat(String(item.currentPeriod || ""));
  
  const formatCreatedDate = (dateStr: string): string => {
    try {
      if (!dateStr || dateStr === "-") return "-";
      
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('-');
      const timeParts = timePart ? timePart.split(':') : ['0', '0', '0'];
      const [hour, minute] = [parseInt(timeParts[0] || '0'), parseInt(timeParts[1] || '0')];
      
      const date = new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day), hour, minute);
      
      const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
      
      const formattedDate = `${parseInt(day)} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${formattedDate}, ${hours}:${minutes} ${ampm}`;
    } catch (error) {
      return dateStr || "-";
    }
  };
  
  const createdOn = formatCreatedDate(item.createDate || "");
  
  const buildMessage = (): string => {
    const mr:any = item.messageResponse;
    
    if (!mr) {
      return "Roll forward operation initiated";
    }
    
    const payload = mr.payload;
    
    if (mr.status === "SUCCESS" && payload) {
      return `Roll forward completed successfully. New period: ${convertPeriodFormat(String(payload.currentPeriod || ""))} | Status: ${payload.status || ""} | Created: ${payload.createDate || ""}`;
    }
    
    if (mr.status === "FAILED" || item.status === "FAILED") {
      const operation = mr.operation || 'Roll forward';
      const details:any = mr.payload?.message || 'Please check the reconciliation and try again.';
      return `${operation} failed: ${details}`;
    }
    
    return `Operation: ${mr.operation || "Unknown"} | Status: ${mr.status || "Unknown"}`;
  };
  
  const message = buildMessage();
  
  return {
    id: String(item.id ?? idx),
    reconciliationId: String(item.reconciliationId ?? "-"),
    status: humanizeStatus(item.status),
    period: uiPeriod,
    executedOn: createdOn,
    createdOn: createdOn,
    message,
  };
}

export default function RollForwardPage() {
  const { user } = useSelector((s: RootState) => s.auth);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(user?.userUuid ? String(user.userUuid) : null);
  }, [user?.userUuid]);

  const { showError, showSuccess } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const [activeTab, setActiveTab] = useState<"Balance sheets" | "Roll forward logs">("Balance sheets");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<IRollForwardTable[]>([]);
  const [logRows, setLogRows] = useState<ILogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
  });
  
  const [defaultPeriod, setDefaultPeriod] = useState<string>(() => {
    return new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
  });
  
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [openLog, setOpenLog] = useState<ILogRow | null>(null);

  useEffect(() => setPage(1), [userId]);

  useEffect(() => {
    if (activeTab !== "Roll forward logs") return;
    if (!userId) return;

    let isMounted = true;

    const fetchCurrentPeriod = async () => {
      try {
        showLoader("Loading period");
        const response = await getCurrentRecPeriod(userId);
        
        if (!isMounted) return;
        
        if (response && typeof response === 'string') {
          const convertedPeriod = convertPeriodFormat(response);
          setDefaultPeriod(convertedPeriod);
          setSelectedMonth(convertedPeriod);
          showSuccess(`Period loaded: ${convertedPeriod}`);
        }
      } catch (error) {
        if (isMounted) {
        }
      } finally {
        if (isMounted) {
          hideLoader();
        }
      }
    };

    fetchCurrentPeriod();
    return () => {
      isMounted = false;
    };
  }, [activeTab, userId, showLoader, hideLoader, showSuccess]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!userId) {
        if (!ignore) {
          setRows([]);
          setLogRows([]);
          setTotalCount(0);
          setLoading(false);
        }
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === "Balance sheets") {
          const resp = (await getRollForwardBalanceSheets(page, size, userId)) as BalanceSheetResponseAPI;
          const items = resp?.items ?? [];
          const mapped = items.map(mapBS);
          if (!ignore) {
            setRows(mapped);
            setTotalCount(Number(resp?.totalCount ?? mapped.length));
          }
        } else {
          const resp = (await getRollForwardProcessLog(page, size, userId)) as ProcessLogResponseAPI;
          const items = Array.isArray(resp) ? resp : Array.isArray((resp as any)?.items) ? (resp as any).items : [];
          const mapped = items.map((it: LogItemAPI, idx: number) => mapLog(it, idx));
          if (!ignore) {
            setLogRows(mapped);
            setTotalCount(Number((Array.isArray(resp) ? mapped.length : (resp as any)?.totalCount) ?? mapped.length));
          }
        }
      } catch (e: any) {
        if (!ignore) {
          setError(e?.message || "Failed to load data");
          showError(e?.message || "Failed to load data");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, page, size, refreshTick, userId, showError]);

  const filteredRows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter(
      (r) =>
        String(r.id).toLowerCase().includes(qq) ||
        r.reconciliationId?.toLowerCase().includes(qq) ||
        r.deadline?.toLowerCase().includes(qq) ||
        r.status?.toLowerCase().includes(qq)
    );
  }, [q, rows]);

  const filteredLogs = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = logRows;
    if (selectedMonth) {
      arr = arr.filter((r) => (r.period || "").toLowerCase().includes(selectedMonth.toLowerCase()));
    }
    if (!qq) return arr;
    return arr.filter(
      (r) =>
        r.reconciliationId?.toLowerCase().includes(qq) ||
        r.period?.toLowerCase().includes(qq) ||
        r.status?.toLowerCase().includes(qq) ||
        r.message?.toLowerCase().includes(qq)
    );
  }, [q, logRows, selectedMonth]);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * size + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(page * size, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  function refresh() {
    setRefreshTick((t) => t + 1);
  }

  async function handleRollForwardAllVisible() {
    if (activeTab !== "Balance sheets" || !filteredRows.length || !userId) return;
    try {
      setLoading(true);
      showLoader("Processing roll forward for all visible items...");
      
      for (const r of filteredRows) {
        await rollforward(r.reconciliationId, userId);
      }
      
      refresh();
      showSuccess(`Roll forward completed successfully for ${filteredRows.length} item(s)`);
    } catch (e: any) {
      const errorMsg = e?.message || "An error occurred";
      setError(`Roll forward failed: ${errorMsg}`);
      showError(`Roll forward failed: ${errorMsg}`);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }

  const handleDownloadReport = useCallback(async () => {
    if (!userId) {
      showError("User data not available");
      return;
    }
    
    showLoader("Generating download report...");
    try {
      const response = await rollForwordAllDownloads(userId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rollforward-reconciliations_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess("Report downloaded successfully");
    } catch (err: any) {
      showError("Failed to download report: " + (err?.message || "Unknown error"));
    } finally {
      hideLoader();
    }
  }, [userId, showError, showSuccess, showLoader, hideLoader]);

  const handleMonthChange = useCallback((monthFromPicker: string) => {
    setSelectedMonth(monthFromPicker);
    try {
      const [mon, y] = monthFromPicker.split(" ");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const mi = months.indexOf(mon);
      const yi = parseInt(y, 10);
      
      if (mi >= 0 && !Number.isNaN(yi)) {
        const start = new Date(yi, mi, 1);
        const end = new Date(yi, mi + 1, 0);
        setDateRange({
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        });
      }
    } catch (e) {
    }
    
    setIsMonthPickerOpen(false);
    setPage(1);
  }, []);

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    setPage(1);
  }, []);

  const handleCloseLogPanel = useCallback(() => {
    setOpenLog(null);
  }, []);

  const handleRowClick = useCallback((row: ILogRow) => {
    setOpenLog(row);
  }, []);

  // Log panel content
  const LogPanelContent = useMemo(() => {
    if (!openLog) return null;
    
    return (
      <div className={styles.logPanelContent}>
        <div className={styles.sidePanelHeader}>
          <h3>Roll Forward Log Details</h3>
          <button 
            className={styles.closeBtn} 
            onClick={handleCloseLogPanel} 
            aria-label="Close log details"
          >
            ×
          </button>
        </div>
        
        <div className={styles.sidePanelBody}>
          <div className={styles.kv}>
            <span>Reconciliation ID</span>
            <strong>{openLog.reconciliationId || '-'}</strong>
          </div>
          
          <div className={styles.kv}>
            <span>Status</span>
            <StatusBadge status={openLog.status}  />
          </div>
          
          <div className={styles.kv}>
            <span>Period</span>
            <strong>{openLog.period || '-'}</strong>
          </div>
          
          <div className={styles.kv}>
            <span>Executed On</span>
            <strong>{openLog.executedOn || '-'}</strong>
          </div>
          
          <div className={styles.kv}>
            <span>Created On</span>
            <strong>{openLog.createdOn || '-'}</strong>
          </div>
          
          <div className={styles.block}>
            <span>Message Details</span>
            <pre className={styles.logText}>{openLog.message || 'No message available'}</pre>
          </div>
        </div>
      </div>
    );
  }, [openLog, handleCloseLogPanel]);

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "Balance sheets" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("Balance sheets");
            setPage(1);
            setQ("");
            setOpenLog(null);
          }}
          aria-selected={activeTab === "Balance sheets"}
        >
          Balance Sheets
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Roll forward logs" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("Roll forward logs");
            setPage(1);
            setQ("");
            setOpenLog(null);
          }}
          aria-selected={activeTab === "Roll forward logs"}
        >
          Roll Forward Logs
        </button>
      </div>

      {/* Header */}
      <div className={styles.sectionHead}>
        <h2>
          {activeTab === "Balance sheets" 
            ? "Roll Forward Balance Sheets" 
            : "Roll Forward Logs"
          }
        </h2>

        <div className={styles.toolbar}>
          {activeTab === "Balance sheets" ? (
            <>
              <SearchBar
                placeholder="Search by ID, reconciliation ID, status, or period"
                value={q}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className={styles.searchInput}
                aria-label="Search balance sheets"
              />
              
              <button 
                className={styles.toolBtn} 
                onClick={refresh} 
                disabled={loading}
                aria-label="Refresh balance sheets data"
              >
                <Image src="/icons/refresh.svg" alt="Refresh" width={16} height={16} />
                <span className={styles.btnText}>Refresh</span>
              </button>
              
              <button
                className={styles.ghostSmall}
                onClick={handleDownloadReport}
                disabled={loading}
                aria-label="Download reconciliation report"
              >
                <Image src="/icons/download.svg" alt="Download" width={14} height={14} />
                <span>Download</span>
              </button>
              
              <button
                className={styles.ghostSmall}
                onClick={handleRollForwardAllVisible}
                disabled={loading || filteredRows.length === 0 || !userId}
                aria-label="Roll forward all visible balance sheets"
              >
                <Image src="/icons/fast-forward.svg" alt="Roll forward" width={14} height={14} />
                <span>Roll Forward</span>
              </button>
            </>
          ) : (
            <div className={styles.datePickerContainer}>
              <DatePicker
                selectedMonth={selectedMonth}
                defaultPeriod={defaultPeriod}
                isOpen={isMonthPickerOpen}
                onToggle={() => setIsMonthPickerOpen(prev => !prev)}
                onMonthChange={handleMonthChange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className={styles.error} role="alert">
          <strong>Error:</strong> {error}
        </div>
      ) : loading ? (
        <div className={styles.loading} role="status" aria-live="polite">
          <div>Loading {activeTab.toLowerCase()} data...</div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          {activeTab === "Balance sheets" ? (
            <RollForwardTable 
              variant="balancesheets" 
              data={filteredRows} 
            />
          ) : (
            <RollForwardTable 
              variant="logs" 
              data={filteredLogs} 
              onRowClick={handleRowClick}
            />
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className={styles.footerBar}>
          <span className={styles.range} aria-live="polite">
            Showing {startIndex}-{endIndex} of {totalCount} {activeTab.toLowerCase().replace('sheets', ' items')}
          </span>
          
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
          
          <div className={styles.itemsPerPage}>
            <span>Show</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Side Panel */}
      <SidePanel 
        isOpen={!!openLog} 
        onClose={handleCloseLogPanel}
        title="Roll Forward Log Details"
      >
        {LogPanelContent}
      </SidePanel>
    </div>
  );
}
