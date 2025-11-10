"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import StatusBadge from "../StatusBadge/StatusBadge";
import Pagination from "../Pagination/Pagination";
import styles from "./UserManagementTable.module.scss";

export interface IUserManagementTable {
  id: any;
  name: any;
  email: any;
}

interface UserManagementTableProps {
  data: any;
}

// Dummy data for demonstration
const DUMMY_DATA: IUserManagementTable[] = [
  {
    id: "1",
    name: "Erana Mondal",
    email: "erana@xyz.com",
  },
  {
    id: "2",
    name: "Soumya Nayak",
    email: "soumya@xyz.com",
  },
 
];

type SortField = "id" | "name" | "email";
type SortOrder = "asc" | "desc";

const UserManagementTable: React.FC<UserManagementTableProps> = ({ data }) => {
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
      const matchesStatus =
        statusFilter === "All" || item.name === statusFilter;

      return matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

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
                onClick={() => handleSort("name")}
                className={styles.sortable}
              >
                Name
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th
                onClick={() => handleSort("email")}
                className={styles.sortable}
              >
                Email
                <Image
                  src="/Sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
               <th></th>
                <th></th>
                 <th></th>
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
                    checked={selectedRows.includes(item?.name)}
                    onChange={(e) =>
                      handleRowSelect(item?.name, e.target.checked)
                    }
                  />
                </td>
                <td className={styles.idCell}>{item.name}</td>

                <td>{item.email}</td>
                <td></td>
                <td></td>
                <td>asdfghj</td>
                <td>{' '}</td>
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

export default UserManagementTable;
