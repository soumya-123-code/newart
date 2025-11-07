// components/common/RollForwadTable/RollForwadTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./RollForwadTable.module.scss";
import { getPriorityColorCode, getPriorityIcon } from "@/app/utils/utils";

export interface IRollForwardTable {
  id: string;
  reconciliationId: string;
  priority: string;      // e.g., WD15 / WD5 -> rendered as High/Low
  status: string;        // e.g., Approved/Completed/Rejected
  preparer: string;
  reviewer: string;
  deadline: string;      // API currentPeriod string
  frequency: string;
  locked: boolean;
  overdue: boolean;
}

export interface ILogRow {
  id: string;
  reconciliationId: string;
  status: string;        // e.g., Success / In progress / Failed
  period: string;        // e.g., July 2025 or 01-Aug-25
  executedOn: string;    // date-time/string
  createdOn: string;     // date-time/string
  message: string;       // error/comment text
}

type SortOrder = "asc" | "desc";

type RollForwardTableProps =
  | {
      variant: "balancesheets";
      data: IRollForwardTable[];
      onRowClick?: (row: IRollForwardTable) => void;
    }
  | {
      variant: "logs";
      data: ILogRow[];
      onRowClick?: (row: ILogRow) => void;
    };

function safeDate(s: string) {
  // Attempt to format; fall back to raw if parse fails
  const d = new Date(s);
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const RollForwardTable: React.FC<RollForwardTableProps> = (props) => {
  const [sortKey, setSortKey] = useState<string>("reconciliationId");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const isBS = props.variant === "balancesheets";
  const rows = props.data as any[];

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av = (a as any)?.[sortKey];
      let bv = (b as any)?.[sortKey];
      // Date-like keys
      const dateKeys = isBS ? ["deadline"] : ["period", "executedOn", "createdOn"];
      if (dateKeys.includes(sortKey)) {
        const ad = new Date(av).getTime();
        const bd = new Date(bv).getTime();
        if (!isNaN(ad) && !isNaN(bd)) {
          return sortOrder === "asc" ? ad - bd : bd - ad;
        }
      }
      // String compare fallback
      av = String(av ?? "");
      bv = String(bv ?? "");
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortOrder, isBS]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!isBS) return;
    if (checked) setSelectedRows((props.data as IRollForwardTable[]).map((r) => r.reconciliationId));
    else setSelectedRows([]);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (!isBS) return;
    if (checked) setSelectedRows((prev) => (prev.includes(id) ? prev : [...prev, id]));
    else setSelectedRows((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {isBS && (
                <th className={styles.checkboxColumn}>
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length > 0 &&
                      selectedRows.length === (props.data as IRollForwardTable[]).length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}

              <th onClick={() => handleSort("reconciliationId")} className={styles.sortable}>
                Reconciliation ID
                <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
              </th>

              {isBS ? (
                <>
                  <th onClick={() => handleSort("priority")} className={styles.sortable}>
                    Priority
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th onClick={() => handleSort("status")} className={styles.sortable}>
                    Status
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th>Preparer</th>
                  <th>Reviewer</th>
                  <th onClick={() => handleSort("deadline")} className={styles.sortable}>
                    Deadline
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th onClick={() => handleSort("frequency")} className={styles.sortable}>
                    Frequency
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th>Locked</th>
                </>
              ) : (
                <>
                  <th onClick={() => handleSort("status")} className={styles.sortable}>
                    Status
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th onClick={() => handleSort("period")} className={styles.sortable}>
                    Period
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                 
                  <th onClick={() => handleSort("createdOn")} className={styles.sortable}>
                    Created on
                    <Image src="/Sort.svg" alt="Sort" width={12} height={12} className={styles.sortIcon} />
                  </th>
                  <th>Error info</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={isBS ? 9 : 6} className={styles.emptyCell}>
                  No records found
                </td>
              </tr>
            )}

            {sorted.map((row: any) =>
              isBS ? (
                <tr
                  key={row.id}
                  onClick={() => props.onRowClick?.(row)}
                  className={styles.row}
                >
                  <td
                    className={styles.checkboxColumn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.reconciliationId)}
                      onChange={(e) => handleRowSelect(row.reconciliationId, e.target.checked)}
                    />
                  </td>
                  <td className={styles.idCell}>{row.reconciliationId}</td>
                  <td>
                    <div className={styles.priority}>
                      <span
                        className={`text-capitalize text-${getPriorityColorCode(
                          row?.priority === "WD15" ? "High" : "Low"
                        )}`}
                      >
                        {getPriorityIcon(
                          row?.priority || "",
                          getPriorityColorCode(row?.priority === "WD15" ? "High" : "Low")
                        )}
                        {row?.priority === "WD15" ? "High" : "Low"}
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.preparer}</td>
                  <td>{row.reviewer}</td>
                  <td>{safeDate(row.deadline)}</td>
                  <td>{row.frequency}</td>
                  <td>{row.locked ? "True" : "False"}</td>
                </tr>
              ) : (
                <tr
                  key={row.id}
                  onClick={() => props.onRowClick?.(row)}
                  className={styles.row}
                >
                  <td className={styles.idCell}>{row.reconciliationId}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.period}</td>
                 
                  <td>{safeDate(row.createdOn)}</td>
                  <td className={styles.clampedMessage} title={row.message}>
                    {row.message || "-"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RollForwardTable;
