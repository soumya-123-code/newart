'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.scss';
import SearchBar from '@/components/common/SearchBar/SearchBar';
import Button from '@/components/common/Button/Button';
import Modal from '@/components/common/Modal/Modal';
import Pagination from '@/components/common/Pagination/Pagination';
import UserTable from '@/components/Admin/UserManagement/UserTable';
import UserFormModal from '@/components/Admin/UserManagement/UserFormModal';
import AddToGroupModal from '@/components/Admin/UserManagement/AddToGroupModal';
import CreateGroupModal from '@/components/Admin/UserManagement/CreateGroupModal';
import GroupList from '@/components/Admin/UserManagement/GroupList';
import {
  getUserGroups,
  getAllUserGroups,
  updateGroupMembers,
  addGroup,
} from '@/services/admin/admin.service';
import { useMessageStore } from '@/stores/messageStore';
import { useLoaderStore } from '@/stores/loaderStore';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  groupId?: string;
  groupName?: string;
}

interface Group {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

const UserManagementPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showError, showSuccess, showWarning } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (!user?.userUuid) return;
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userUuid]);

  useEffect(() => {
    if (!user?.userUuid) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userUuid, currentPage, itemsPerPage, selectedGroup]);

  const fetchGroups = async () => {
    if (!user?.userUuid) return;
    const uid = toStr(user.userUuid);

    try {
      showLoader('Loading groups...');
      const response = await getAllUserGroups(uid);
      const list = response?.recGroups ?? response?.items ?? [];
      const formatted: Group[] = list.map((g: any) => ({
        id: toStr(g?.id),
        name: g?.name ?? `Group ${g?.id}`,
        role: g?.groupType ?? g?.role ?? 'Not assigned',
        memberCount: Array.isArray(g?.recUserGroupItems)
          ? g.recUserGroupItems.length
          : g?.memberCount ?? 0,
      }));
      setGroups(formatted);
    } catch (e) {
      console.error(e);
      showError('Failed to load user groups');
    } finally {
      hideLoader();
    }
  };

  const fetchUsers = async () => {
    if (!user?.userUuid) return;
    const uid = toStr(user.userUuid);

    try {
      showLoader('Loading users...');
      const response = await getUserGroups(currentPage, itemsPerPage, uid);

      const fromItems: User[] = (response?.items ?? []).flatMap((g: any) =>
        (g?.recUserGroupItems ?? []).map((it: any) => {
          const uu = it?.user ?? {};
          const full = uu?.fullName || [uu?.firstName, uu?.lastName].filter(Boolean).join(' ');
          return {
            id: toStr(uu?.userUuid),
            name: full || 'Unknown',
            email: uu?.email ?? '',
            role: uu?.roles ?? '',
            groupId: toStr(g?.id),
            groupName: g?.name ?? `Group ${g?.id}`,
          } as User;
        })
      );

      const fromUsers: User[] = (response?.users ?? []).map((u: any) => ({
        id: toStr(u?.id ?? u?.userId ?? u?.userUuid),
        name: u?.name ?? u?.userName ?? u?.fullName ?? 'Unknown',
        email: u?.email ?? u?.userEmail ?? '',
        role: u?.role ?? u?.roles ?? '',
        groupId: toStr(u?.groupId),
        groupName: u?.groupName,
      }));

      const merged = fromUsers.length ? fromUsers : fromItems;
      setUsers(merged);
      setTotalItems(response?.total ?? response?.totalCount ?? merged.length);
    } catch (e) {
      console.error(e);
      showError('Failed to load users');
    } finally {
      hideLoader();
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const inSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const inGroup = selectedGroup === 'all' || toStr(u.groupId) === selectedGroup;
    return inSearch && inGroup;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? filteredUsers.map((u) => u.id) : []);
  };

const handleAddToGroup = async (groupIds: string[]) => {
  if (selectedUsers.length === 0) {
    showWarning('Please select users to add to group');
    return;
  }
  if (!groupIds || groupIds.length === 0) return;
  if (!user?.userUuid) return;

  const uid = toStr(user.userUuid);

  // helper to ensure uniqueness and optional numeric cast
  const toUnique = (arr: (string | number)[]) => Array.from(new Set(arr));
  const maybeNumber = (v: string) => (Number.isNaN(Number(v)) ? v : Number(v));

  try {
    showLoader('Adding users to group...');

    // Send Vue-compatible payload: { id: groupId, userIds: [...] }
    await Promise.all(
      groupIds.map(async (gid) => {
        const userIds = toUnique(selectedUsers.map(maybeNumber));
        return updateGroupMembers({ id: gid, userIds }, uid);
      })
    );

    showSuccess('Users added to selected groups');
    setIsAddToGroupModalOpen(false);
    setSelectedUsers([]);

    // Single refresh after all updates
    await Promise.all([fetchUsers(), fetchGroups()]);
  } catch (e) {
    console.error(e);
    showError('Failed to add users to group(s)');
  } finally {
    hideLoader();
  }
};


  const handleCreateGroup = async (formData: { name: string; role: string }) => {
    if (!user?.userUuid) return;
    const uid = toStr(user.userUuid);

    // Map UI role label to API enum value (Preparer -> PREPARER)
    const payload = {
      name: formData.name.trim(),
      groupType: formData.role.toUpperCase(),
      recUserGroupItems: [],
    };

    try {
      showLoader('Creating group...');
      await addGroup(payload, uid);
      showSuccess('Group created successfully');
      setIsCreateGroupModalOpen(false);
      await fetchGroups();
    } catch (e) {
      console.error(e);
      showError('Failed to create group');
    } finally {
      hideLoader();
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      showLoader('Deleting user...');
      // TODO: replace with real delete endpoint when available
      await new Promise((r) => setTimeout(r, 400));
      showSuccess('User deleted successfully');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (e) {
      console.error(e);
      showError('Failed to delete user');
    } finally {
      hideLoader();
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className={styles.userManagementContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>User management</h1>
        <div className={styles.headerActions}>
          <div className={styles.addToGroupAnchor}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddToGroupModalOpen(true)}
              disabled={selectedUsers.length === 0}
            >
              <span>Add to group</span>
              <span className={`rightIcon ${styles.rightIcon ?? ''}`}>
                <svg className={styles.chevronDown} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </Button>

            <AddToGroupModal
              isOpen={isAddToGroupModalOpen}
              onClose={() => setIsAddToGroupModalOpen(false)}
              groups={groups}
              onAddToGroup={handleAddToGroup}
              selectedCount={selectedUsers.length}
            />
          </div>

          <Button variant="outline" onClick={() => setIsCreateGroupModalOpen(true)}>
            <span className="leftIcon">
              <svg className={styles.plusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>Create group</span>
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <GroupList
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupSelect={(g) => {
              setSelectedGroup(g);
              setSelectedUsers([]);
              setCurrentPage(1);
            }}
            totalUsers={totalItems}
          />
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.tableHeader}>
            <SearchBar
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
            />
          </div>

          <UserTable
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onUserSelect={(id) =>
              setSelectedUsers((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onSelectAll={handleSelectAll}
            onEdit={(user) => {
              setUserToEdit(user);
              setIsEditUserModalOpen(true);
            }}
            onDelete={(user) => {
              setUserToDelete(user);
              setIsDeleteModalOpen(true);
            }}
          />

          <div className={styles.footer}>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </main>
      </div>

      {isAddUserModalOpen && (
        <UserFormModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSave={async () => {
            setIsAddUserModalOpen(false);
            await fetchUsers();
          }}
          title="Add New User"
        />
      )}

      {isEditUserModalOpen && (
        <UserFormModal
          isOpen={isEditUserModalOpen}
          onClose={() => {
            setIsEditUserModalOpen(false);
            setUserToEdit(null);
          }}
          onSave={async () => {
            setIsEditUserModalOpen(false);
            setUserToEdit(null);
            await fetchUsers();
          }}
          user={userToEdit}
          title="Edit User"
        />
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete User"
          onClose={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
        >
          <div className={styles.deleteModal}>
            <p>Are you sure you want to delete {userToDelete?.name}?</p>
            <p className={styles.warning}>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default UserManagementPage;
