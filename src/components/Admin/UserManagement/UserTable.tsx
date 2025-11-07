// src/components/Admin/UserManagement/UserTable.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import styles from './UserTable.module.scss';
import Image from 'next/image';
import { FiEdit2 } from 'react-icons/fi';

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  groupId?: string;
  groupName?: string;
};

type Props = {
  users: User[];
  selectedUsers: string[];
  onUserSelect: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;     // selects only current page rows (handled by parent)
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
};

export default function UserTable({
  users,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: Props) {
  // compute selection state for header checkbox (page‑scoped)
  const allSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedUsers.includes(u.id)),
    [users, selectedUsers]
  );
  const someSelected = useMemo(
    () => users.some((u) => selectedUsers.includes(u.id)) && !allSelected,
    [users, selectedUsers, allSelected]
  );

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} role="table">
        <thead>
          <tr>
            <th className={styles.checkboxColumn}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={() => onSelectAll(!allSelected)}
                className={styles.checkbox}
                aria-label="Select all users on this page"
              />
            </th>
            <th className={styles.nameColumn}>
              <div className={styles.headerCell}>Name</div>
            </th>
            <th className={styles.emailColumn}>
              <div className={styles.headerCell}>Email</div>
            </th>
            <th className={styles.actionsColumn} />
          </tr>
        </thead>

        <tbody>
          {users.length === 0 && (
            <tr>
              <td className={styles.emptyState} colSpan={4}>
                No users found
              </td>
            </tr>
          )}

          {users.map((u) => (
            <tr key={u.id} className={styles.tableRow}>
              <td className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.id)}
                  onChange={() => onUserSelect(u.id)}
                  className={styles.checkbox}
                  aria-label={`Select ${u.name}`}
                />
              </td>

              {/* Stacked name + email inside the name cell for dense look */}
              <td className={styles.nameColumn}>
                <div className={styles.nameEmail}>
                  <span className={styles.userName}>{u.name}</span>
                  <span className={styles.userEmailMuted}>{u.email}</span>
                </div>
              </td>

              {/* Email column remains for wide screens */}
              <td className={styles.emailColumn}>
                <span className={styles.userEmail}>{u.email}</span>
              </td>

              <td className={styles.actionsColumn}>
                <div className={styles.actions}>
                  {onEdit && (
                    <FiEdit2 onClick={() => onEdit(u)} style={{ cursor: 'pointer' }} />
                  )}
                  {onDelete && (
                    <Image
                      style={{ cursor: 'pointer' }}
                      onClick={() => onDelete(u)}
                      src="/assets/common/minus.png"
                      alt="Remove"
                      width={16}
                      height={16}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card list */}
      <div className={styles.cardList} role="list">
        {users.map((u) => (
          <div key={u.id} className={styles.card} role="listitem">
            <div className={styles.cardHeader}>
              <input
                type="checkbox"
                checked={selectedUsers.includes(u.id)}
                onChange={() => onUserSelect(u.id)}
                className={styles.checkbox}
                aria-label={`Select ${u.name}`}
              />
              <div className={styles.cardTitle}>{u.name}</div>
            </div>
            <div className={styles.cardMeta}>{u.email}</div>
            <div className={styles.cardActions}>
              {onEdit && (
                <button className={styles.textButton} onClick={() => onEdit(u)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  className={`${styles.textButton} ${styles.textDanger}`}
                  onClick={() => onDelete(u)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
