'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import StatusBadge from '../StatusBadge/StatusBadge';
import Pagination from '../Pagination/Pagination';
import styles from './ReconciliationTable.module.scss';

interface Reconciliation {
  id: string;
  priority: 'High' | 'Low';
  status: 'Draft' | 'Submitted' | 'Approved' | 'In Review' | 'Rejected';
  preparer: string;
  reviewer: string;
  deadline: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annually';
  locked: boolean;
  overdue: boolean;
}

interface ReconciliationTableProps {
  data: Reconciliation[];
  onRefresh: () => void;
}

// Dummy data for demonstration
const DUMMY_DATA: Reconciliation[] = [
  {
    id: 'REC-001',
    priority: 'High',
    status: 'Submitted',
    preparer: 'John Doe',
    reviewer: 'Jane Smith',
    deadline: '2025-07-15',
    frequency: 'Monthly',
    locked: false,
    overdue: false,
  },
  {
    id: 'REC-002',
    priority: 'Low',
    status: 'Draft',
    preparer: 'Alice Johnson',
    reviewer: 'Bob Williams',
    deadline: '2025-07-20',
    frequency: 'Quarterly',
    locked: false,
    overdue: true,
  },
  {
    id: 'REC-003',
    priority: 'High',
    status: 'Approved',
    preparer: 'Mike Brown',
    reviewer: 'Sarah Davis',
    deadline: '2025-07-10',
    frequency: 'Monthly',
    locked: true,
    overdue: false,
  },
  {
    id: 'REC-004',
    priority: 'Low',
    status: 'In Review',
    preparer: 'Emily Wilson',
    reviewer: 'David Miller',
    deadline: '2025-07-25',
    frequency: 'Annually',
    locked: false,
    overdue: false,
  },
  {
    id: 'REC-005',
    priority: 'High',
    status: 'Rejected',
    preparer: 'Chris Martinez',
    reviewer: 'Lisa Anderson',
    deadline: '2025-07-12',
    frequency: 'Monthly',
    locked: false,
    overdue: true,
  },
  // Add more dummy data...
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `REC-${String(i + 6).padStart(3, '0')}`,
    priority: i % 2 === 0 ? 'High' : 'Low' as 'High' | 'Low',
    status: ['Draft', 'Submitted', 'Approved', 'In Review', 'Rejected'][i % 5] as any,
    preparer: `Preparer ${i + 6}`,
    reviewer: `Reviewer ${i + 6}`,
    deadline: `2025-07-${String((i % 28) + 1).padStart(2, '0')}`,
    frequency: ['Monthly', 'Quarterly', 'Annually'][i % 3] as any,
    locked: i % 3 === 0,
    overdue: i % 4 === 0,
  })),
];

type SortField = 'id' | 'priority' | 'status' | 'deadline' | 'frequency';
type SortOrder = 'asc' | 'desc';

const ReconciliationTable: React.FC<ReconciliationTableProps> = ({ data, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use dummy data if no data provided
  const tableData = data.length > 0 ? data : DUMMY_DATA;

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preparer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reviewer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'deadline') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tableData, searchTerm, statusFilter, priorityFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.tableContainer}>
      {/* Filters Section */}
      <div className={styles.filtersSection}>
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
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className={styles.sortable}>
                ID
                <Image
                  src="/assets/admin/sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th onClick={() => handleSort('priority')} className={styles.sortable}>
                Priority
                <Image
                  src="/assets/admin/sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th onClick={() => handleSort('status')} className={styles.sortable}>
                Status
                <Image
                  src="/assets/admin/sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th>Preparer</th>
              <th>Reviewer</th>
              <th onClick={() => handleSort('deadline')} className={styles.sortable}>
                Deadline
                <Image
                  src="/assets/admin/sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th onClick={() => handleSort('frequency')} className={styles.sortable}>
                Frequency
                <Image
                  src="/assets/admin/sort.svg"
                  alt="Sort"
                  width={12}
                  height={12}
                  className={styles.sortIcon}
                />
              </th>
              <th>Locked</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id}>
                <td className={styles.idCell}>{item.id}</td>
                <td>
                  <span className={`${styles.priorityBadge} ${styles[item.priority.toLowerCase()]}`}>
                    {item.priority}
                  </span>
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>{item.preparer}</td>
                <td>{item.reviewer}</td>
                <td>{formatDate(item.deadline)}</td>
                <td>{item.frequency}</td>
                <td>
                  {item.locked ? (
                    <Image
                      src="/assets/admin/lock-closed.svg"
                      alt="Locked"
                      width={16}
                      height={16}
                    />
                  ) : (
                    <Image
                      src="/assets/admin/lock-open.svg"
                      alt="Unlocked"
                      width={16}
                      height={16}
                    />
                  )}
                </td>
                <td>
                  {item.overdue && (
                    <span className={styles.overdueBadge}>Overdue</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.paginationWrapper}>
        <div className={styles.resultInfo}>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ReconciliationTable;