"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.scss";
import Pagination from "@/components/common/Pagination/Pagination";
import MasterRecsTable, { IMasterRecsTable } from "@/components/common/MasterRecsTable/MasterRecsTable";

import {
  getLiveMasterReconciliations,
} from "@/services/admin/admin.service";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

const MasterRecsPage = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<IMasterRecsTable[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const userId = useMemo(
    () => (user?.userUuid ? String(user.userUuid) : null),
    [user?.userUuid]
  );

  const mockRows: IMasterRecsTable[] = useMemo(
    () => [
      {
        id: "1",
        name: "Service Margin Revenue Accruals",
        reconciliationId: "REC-001",
        priority: "WD15",
        status: "Active",
        preparer: "John Doe",
        reviewer: "Erana Mondal",
        deadline: "2025-07-16",
        frequency: "Monthly",
        accountType: "Rollup parent",
        overdue: false,
      },
      {
        id: "2",
        name: "Short term freestyle deferred revenue",
        reconciliationId: "REC-001",
        priority: "WD5",
        status: "Active",
        preparer: "John Doe",
        reviewer: "Dheeraj Arora",
        deadline: "2024-07-15",
        frequency: "Monthly",
        accountType: "Standard",
        overdue: false,
      },
      {
        id: "3",
        name: "Accrual_manual_M&S",
        reconciliationId: "REC-001",
        priority: "WD15",
        status: "Active",
        preparer: "John Doe",
        reviewer: "Soumya Nayak",
        deadline: "2025-02-10",
        frequency: "Monthly",
        accountType: "Rollup parent",
        overdue: false,
      },
    ],
    []
  );

  

  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return tableData.filter(r =>
      !qq ||
      String(r.id).toLowerCase().includes(qq) ||
      (r.reconciliationId?.toLowerCase().includes(qq)) ||
      (r.deadline?.toLowerCase().includes(qq)) ||
      (r.status?.toLowerCase().includes(qq))
    );
  }, [q, tableData]);

  const start = (page - 1) * size;
  const end = Math.min(start + size, filtered.length);
  const rows = filtered.slice(start, end);

  // Fetch data from API
  const fetchMasterReconciliations = async () => {
    if (!userId) {
      console.error("User ID is required");
      return;
    }

    setLoading(true);
    try {
      const response = await getLiveMasterReconciliations(page, size, userId);
      
      // Transform API response to match IMasterRecsTable interface
      const transformedData: IMasterRecsTable[] = response.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.reconciliationName,
        reconciliationId: item.reconciliationId,
        priority: item.deadline || "N/A",
        status: item.status,
        preparer: item.performerName || "N/A",
        reviewer: item.tier1Reviewer || "N/A",
        deadline: item.deadlineDate || item.deadline || "N/A",
        frequency: "Monthly", // Default, can be mapped if available
        accountType: item.division || "Standard", // Using division as account type
        overdue: item.ragRating !== "Green" || false,
        // Additional fields if needed by the table
        description: item.description,
        riskRating: item.riskRating,
        monthlyBalance: item.monthlyBalance,
        sectionABalance: item.sectionABalance,
      }));

      setTableData(transformedData);
      setTotalCount(response.totalCount || transformedData.length);
    } catch (error) {
      console.error("Error fetching master reconciliations:", error);
      // Fallback to mock data on error
      setTableData(mockRows);
      setTotalCount(mockRows.length);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when page/size changes
  useEffect(() => {
    fetchMasterReconciliations(); // Uses page, size
  }, [page, size, userId]);

  // Handle refresh button
  const handleRefresh = () => {
    setPage(1);
    setQ("");
    fetchMasterReconciliations();
  };

  // Handle download
  const handleDownload = async () => {
    if (!userId) {
      console.error("User ID is required for download");
      return;
    }

    setLoading(true);
    try {
      // Download using the provided endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_RECON_API || 'http://localhost:3000'}/newapi/v1/export/MASTER-REC?userid=${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN || ''}`,
            'user-id': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `master-reconciliations-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Section Heading */}
      

      {/* Table */}
      <div>
        <MasterRecsTable 
        handleRefresh={handleRefresh}
        handleDownload={handleDownload}
        data={tableData} 
        loading={loading}
      />
      </div>

      {/* Pagination */}
      <div className={styles.footerBar}>
        <span className={styles.range}>
          {filtered.length
            ? `${start + 1}-${end} of ${totalCount}`
            : "0-0 of 0"}
        </span>

       <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalCount / size)}
        onPageChange={setPage}
      />

        <div className={styles.itemsPerPage}>
          <span>Items per page</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MasterRecsPage;
