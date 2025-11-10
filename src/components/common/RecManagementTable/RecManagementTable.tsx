"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./RecManagementTable.module.scss";

export interface IRecManagementTable {
  id: string;
  reconciliationId: string;
  status?: string;
  updateType?: string;
  documentRefreshStatus?: string;
  createdOn?: string;
  errorInfo?: string;
  // For Update reconciliations tab
  name?: string;
  active?: boolean;
  accountType?: string;
  frequency?: string;
  risk?: string;
  preparer?: string;
  reviewer?: string;
}

interface RecManagementTableProps {
  data: IRecManagementTable[];
  tableType: "bulk" | "reconciliations"; // Determines which columns to show
  onEdit?: (item: IRecManagementTable) => void;
  onDisable?: (item: IRecManagementTable) => void;
  onEnable?: (item: IRecManagementTable) => void;
  onDownload?: (item: IRecManagementTable) => void;
}

type SortField = keyof IRecManagementTable;
type SortOrder = "asc" | "desc";

const RecManagementTable: React.FC<RecManagementTableProps> = ({
  data,
  tableType,
  onEdit,
  onDisable,
  onEnable,
  onDownload,
}) => {
  const [sortField, setSortField] = useState<SortField>("reconciliationId");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "createdOn") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortField, sortOrder]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // BULK UPLOAD TABLE
  if (tableType === "bulk") {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("reconciliationId")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Reconciliation ID
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Status
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("updateType")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Update type
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("documentRefreshStatus")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Document refresh status
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("createdOn")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Created on
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("errorInfo")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Error info
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((item, index) => (
                  <tr key={`${item.id}-${index}`}>
                    <td className={styles.idCell}>
                      <span className={styles.idBadge}>
                        {item.reconciliationId}
                      </span>
                    </td>
                    <td className={styles.statusCell}>
                      <StatusBadge status={item.status || ""} />
                    </td>
                    <td className={styles.typeCell}>{item.updateType || "-"}</td>
                    <td className={styles.refreshStatusCell}>
                      <span className={styles.refreshBadge}>
                        {item.documentRefreshStatus || "-"}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(item.createdOn)}
                    </td>
                    <td className={styles.errorCell}>
                      <span
                        className={styles.errorText}
                        title={item.errorInfo || ""}
                      >
                        {item.errorInfo || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    No bulk upload records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // UPDATE RECONCILIATIONS TABLE
  if (tableType === "reconciliations") {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("reconciliationId")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Reconciliation ID
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th onClick={() => handleSort("name")} className={styles.sortable}>
                  <div className={styles.headerContent}>
                    Name
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("active")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Active
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("accountType")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Account type
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("frequency")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Frequency
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("risk")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Risk
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("preparer")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Preparer
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("reviewer")}
                  className={styles.sortable}
                >
                  <div className={styles.headerContent}>
                    Reviewer
                    <Image
                      src="/Sort.svg"
                      alt="Sort"
                      width={12}
                      height={12}
                      className={styles.sortIcon}
                    />
                  </div>
                </th>
                <th className={styles.actionsHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((item, index) => (
                  <tr key={`${item.id}-${index}`}>
                    <td className={styles.idCell}>
                      <span className={styles.idBadge}>
                        {item.reconciliationId}
                      </span>
                    </td>
                    <td className={styles.nameCell}>
                      <span title={item.name}>{item.name || "-"}</span>
                    </td>
                    <td className={styles.activeCell}>
                      <span
                        className={
                          item.active
                            ? styles.activeBadge
                            : styles.disabledBadge
                        }
                      >
                        {item.active ? "Yes" : "Disabled"}
                      </span>
                    </td>
                    <td className={styles.typeCell}>
                      {item.accountType || "-"}
                    </td>
                    <td className={styles.frequencyCell}>
                      {item.frequency || "-"}
                    </td>
                    <td className={styles.riskCell}>
                      <span
                        className={
                          item.risk?.includes("High")
                            ? styles.highRisk
                            : styles.lowRisk
                        }
                      >
                        {item.risk?.includes("High") ? "▲" : "▼"}{" "}
                        {item.risk || "-"}
                      </span>
                    </td>
                    <td className={styles.preparerCell}>
                      {item.preparer || "-"}
                    </td>
                    <td className={styles.reviewerCell}>
                      {item.reviewer || "-"}
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtons}>
                        {onDownload && (
                          <button
                            onClick={() => onDownload(item)}
                            className={styles.downloadBtn}
                            title="Download"
                            aria-label="Download"
                          >
                            <Image
                              src="/Download.svg"
                              alt="Download"
                              width={16}
                              height={16}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className={styles.emptyRow}>
                    No reconciliations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

export default RecManagementTable;
