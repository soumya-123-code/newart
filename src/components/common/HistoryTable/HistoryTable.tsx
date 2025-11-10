"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import StatusBadge from "../StatusBadge/StatusBadge";
import Pagination from "../Pagination/Pagination";
import styles from "./HistoryTable.module.scss";

export interface IHistoryTable {
  id: string;
  reconciliationId: string;
  preparer: string;
  period: string;
  trialBalance: number;
  createdOn: string;
}

interface HistoryTableProps {
  data: IHistoryTable[];
}

// Dummy data for demonstration
const DUMMY_DATA: IHistoryTable[] = [
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
 
];

type SortField =
  | "id"
  | "reconciliationId"
  | "preparer"
  | "period"
  | "trialBalance"
  | "createdOn";
type SortOrder = "asc" | "desc";

const HistoryTable: React.FC<HistoryTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Use dummy data if no data provided
  const tableData = data.length > 0 ? data : DUMMY_DATA;

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  // Handle checkbox head
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(data.map((r: any) => r.reconciliationId));
    } else {
      setSelectedRows([]);
    }
  };
  // Handle checkbox data
  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter((item) => {
      const matchesSearch =
        item.reconciliationId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.preparer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.period.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "createdOn") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    tableData,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortField,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.tableContainer}>
      {/* Filters Section */}
      {/* <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Image
            src="/assets/admin/search.svg"
            alt="Search"
            width={16}
            height={16}
            className={styles.searchIcon}
          />
          <input
            type="text"
            placeholder="Search by ID, Preparer, or Reviewer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="In Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div> */}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
           
            <tr>
                 <th className={styles.checkboxColumn}>
              <input
                type="checkbox"
                checked={
                  selectedRows.length === data?.length && data.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
              <th
                onClick={() => handleSort("reconciliationId")}
                className={styles.sortable}
              >
                Reconciliation ID
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th
                onClick={() => handleSort("preparer")}
                className={styles.sortable}
              >
                Prerparer
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th
                onClick={() => handleSort("period")}
                className={styles.sortable}
              >
                Period
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th>
                Trial Balance
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>

              <th
                onClick={() => handleSort("createdOn")}
                className={styles.sortable}
              >
                Created on
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id}>
                <td
                  className={styles.checkboxColumn}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(item?.reconciliationId)}
                    onChange={(e) =>
                      handleRowSelect(item?.reconciliationId, e.target.checked)
                    }
                  />
                </td>
                <td className={styles.idCell}>{item.reconciliationId}</td>

                <td>{item.preparer}</td>
                <td>{formatDate(item.period)}</td>
                <td>{item.trialBalance}</td>

                <td>{formatDate(item.createdOn)}</td>
                <Image
                  src="/Download.svg"
                  alt="Download"
                  width={16}
                  height={16}
                  className={styles.sortIcon}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {/* <div className={styles.paginationWrapper}>
        <div className={styles.resultInfo}>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div> */}
    </div>
  );
};

export default HistoryTable;
