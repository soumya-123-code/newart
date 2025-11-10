"use client";

import React, { useState, useMemo } from "react";
import styles from "./page.module.scss";
import Image from "next/image";
import Pagination from "@/components/common/Pagination/Pagination";
import HistoryTable, {
  IHistoryTable,
} from "@/components/common/HistoryTable/HistoryTable";

const History = () => {
     const [page, setPage] = useState(1);
      const [size, setSize] = useState(10);
      const [q, setQ] = useState("");
    
      const mockRows: IHistoryTable[] = useMemo(
        () => [
          {
    id: "1",
    reconciliationId: "REC-001",
    preparer: "Erana Mondal",
    period: "2025-07-24",
    trialBalance: 12345.56,
    createdOn: "2025-07-20",
  },
  {
    id: "2",
    reconciliationId: "REC-002",
    preparer: "Soumya Nayak",
    period: "2024-07-24",
    trialBalance: 76548.09,
    createdOn: "2025-10-20",
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
            (r.preparer && r.preparer.toLowerCase().includes(qq))
        );
      }, [q, mockRows]);
    
      const start = (page - 1) * size;
      const end = Math.min(start + size, filtered.length);
      const rows = filtered.slice(start, end);
  return (
    <div className={styles.container}>
      {/* Section Heading */}
      <div className={styles.sectionHead}>
        <h2>History</h2>
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            onClick={() => {}}
            aria-label="Filter"
          >
            <Image
              src="/Filter.svg"
              alt="Refresh document"
              width={16}
              height={16}
            />
            <span className={styles.btnText}>Filter</span>
          </button>
          <button
            className={styles.ghostSmall}
            onClick={() => {}}
            disabled={false}
          >
            <Image src="/Refresh.svg" alt="Refresh" width={16} height={16} />
            <span>Refresh</span>
          </button>
          <button
            className={styles.ghostSmall}
            onClick={() => {}}
            disabled={true}
          >
            <Image src="/Download.svg" alt="Download" width={16} height={16} />
            <span>Download</span>
          </button>
        </div>
      </div>
      {/* Table */}
      <div>
        <HistoryTable data={mockRows} />
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
  )
}

export default History
