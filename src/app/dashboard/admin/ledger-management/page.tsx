"use client";

import React, { useState, useMemo } from "react";
import styles from "./page.module.scss";
import Image from "next/image";
import Pagination from "@/components/common/Pagination/Pagination";
import LedgerTable, {
  ILedgerTable,
} from "@/components/common/LedgerTable/LedgerTable";

const LedgerManagement = () => {
  const [activeTab, setActiveTab] = useState<
    "Import" | "Entities" | "Trial balance"
  >("Import");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState("");

  const mockRows: ILedgerTable[] = useMemo(
    () => [
      {
        id: "1",
        fileName: "REC-001",
        status: "Rejected",
        ledgerType: "",
        objectId: 12345,
        createdOn: "2025-07-20",
        error: "External error",
      },
      {
        id: "2",
        fileName: "REC-002",
        status: "Approved",
        ledgerType: "",
        objectId: 76548,
        createdOn: "2025-10-20",
        error: "External error",
      },
      {
        id: "3",
        fileName: "REC-003",
        status: "Approved",
        ledgerType: "",
        objectId: 86548,
        createdOn: "2025-07-23",
        error: "External error",
      },
      {
        id: "4",
        fileName: "REC-003",
        status: "Approved",
        ledgerType: "",
        objectId: 987654,
        createdOn: "2025-07-23",
        error: "External error",
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
        (r.fileName && r.fileName.toLowerCase().includes(qq)) ||
        (r.createdOn && r.createdOn.toLowerCase().includes(qq)) ||
        (r.status && r.status.toLowerCase().includes(qq))
    );
  }, [q, mockRows]);

  const start = (page - 1) * size;
  const end = Math.min(start + size, filtered.length);
  const rows = filtered.slice(start, end);

  const handleTab = (tab: "Import" | "Entities" | "Trial balance") => {
    setActiveTab(tab);
  };
  return (
    <div className={styles.container}>
      {/* Tab Button */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "Import" ? styles.active : ""}`}
          onClick={() => setActiveTab("Import")}
        >
          Import
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Entities" ? styles.active : ""}`}
          onClick={() => setActiveTab("Entities")}
        >
          Entities
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Trial balance" ? styles.active : ""}`}
          onClick={() => setActiveTab("Trial balance")}
        >
          Trial balance
        </button>
      </div>
      {/* Section Heading */}
      <div className={styles.sectionHead}>
        <h2>Import status</h2>
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            onClick={() => {}}
            aria-label="Refresh document"
          >
            <Image
              src="/RefreshReset.svg"
              alt="Refresh document"
              width={16}
              height={16}
            />
            <span className={styles.btnText}>Refresh document</span>
          </button>
          <button
            className={styles.ghostSmall}
            onClick={() => {}}
            disabled={false}
          >
            <Image src="/Upload.svg" alt="Upload" width={16} height={16} />
            <span>Import trial balance</span>
          </button>
          <button
            className={styles.ghostSmall}
            onClick={() => {}}
            disabled={false}
          >
            <Image src="/Upload.svg" alt="Upload" width={16} height={16} />
            <span>Import transactions</span>
          </button>
        </div>
      </div>
      {/* Table */}
      <div>
        <LedgerTable data={mockRows} />
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

export default LedgerManagement;
