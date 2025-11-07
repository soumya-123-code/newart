"use client";

import React, { useState, useMemo } from "react";
import styles from "./page.module.scss";
import Image from "next/image";
import Pagination from "@/components/common/Pagination/Pagination";
import RecManagementTable, {
  IRecManagementTable,
} from "@/components/common/RecManagementTable/RecManagementTable";


const RecManagement = () => {
  const [activeTab, setActiveTab] = useState<
    "Bulk upload" | "Update reconciliations"
  >("Bulk upload");
   const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [q, setQ] = useState("");

  const mockRows: IRecManagementTable[] = useMemo(
    () => [
      {
        id: "1",
        reconciliationId: "REC-001",
        status: "Approved",
        updateType: "Add",
        documentRefreshStatus: "In progress",
        createdOn: "2025-07-20",
        errorInfo: "External error",
      },
      {
        id: "2",
        reconciliationId: "REC-002",
        status: "Rejected",
        updateType: "Amend",
        documentRefreshStatus: "In progress",
        createdOn: "2025-10-20",
        errorInfo: "External error",
      },
      {
        id: "3",
        reconciliationId: "REC-003",
        status: "Approved",
        updateType: "Enable",
        documentRefreshStatus: "In progress",
        createdOn: "2025-07-23",
        errorInfo: "External error",
      },
      {
        id: "4",
        reconciliationId: "REC-004",
        status: "Rejected",
        updateType: "Disable",
        documentRefreshStatus: "In progress",
        createdOn: "2025-07-23",
        errorInfo: "External error",
      },
    ],
    []
  );
  console.log(mockRows, "mockRows");
  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return mockRows.filter(
      (r) =>
        !qq ||
        String(r.id).toLowerCase().includes(qq) ||
        (r.reconciliationId && r.reconciliationId.toLowerCase().includes(qq)) ||
        (r.createdOn && r.createdOn.toLowerCase().includes(qq)) ||
        (r.status && r.status.toLowerCase().includes(qq))
    );
  }, [q, mockRows]);

  const start = (page - 1) * size;
  const end = Math.min(start + size, filtered.length);
  const rows = filtered.slice(start, end);

  return (
    <div className={styles.container}>
      {/* Tab Button */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "Bulk upload" ? styles.active : ""}`}
          onClick={() => setActiveTab("Bulk upload")}
        >
          Bulk upload
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Update reconciliations" ? styles.active : ""}`}
          onClick={() => setActiveTab("Update reconciliations")}
        >
          Update reconciliations
        </button>
      </div>
      {/* Section Heading */}
      <div className={styles.sectionHead}>
        <h2>Bulk Upload status</h2>
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            onClick={() => {}}
            aria-label="Refresh"
          >
            <Image
              src="/RefreshReset.svg"
              alt="Refresh & Reset"
              width={16}
              height={16}
            />
            <span className={styles.btnText}>Refresh & Reset</span>
          </button>
          <button
            className={styles.ghostSmall}
            onClick={() => {}}
            disabled={false}
          >
            <Image src="/Upload.svg" alt="Upload" width={16} height={16} />
            <span>Upload</span>
          </button>
        </div>
      </div>
      {/* Table */}
      <div>
        <RecManagementTable data={mockRows} />
      </div>
      {/*Pagination*/}
      <div className={styles.footerBar}>
        <span className={styles.range}>
          {filtered.length
            ? `${start + 1}-${end} of ${filtered.length}`
            : "0-0 of 0"}
        </span>

        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / size))}
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

export default RecManagement;
