// src/components/Admin/UserManagement/UserFormModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import styles from './UserFormModal.module.scss';
import SidePanel from '@/components/common/SidePanel/SidePanel';

type User = { id?: string; name: string; email: string; role?: string; groupId?: string };
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: User) => void;
  user?: any;
  title: string;
};

export default function UserFormModal({ isOpen, onClose, onSave, user, title }: Props) {
  const [form, setForm] = useState<User>({ name: '', email: '', role: '', groupId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setForm({ id: user.id, name: user.name, email: user.email, role: user.role, groupId: user.groupId });
    else setForm({ name: '', email: '', role: '', groupId: '' });
    setErrors({});
  }, [user, isOpen]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) onSave(form);
  }

  if (!isOpen) return null;

  return (
    <SidePanel title={title} onClose={onClose} isOpen>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Name <span className={styles.required}>*</span></label>
          <input
            id="name"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter user name"
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email <span className={styles.required}>*</span></label>
          <input
            id="email"
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter email address"
          />
          {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.label}>Role</label>
          <select
            id="role"
            className={styles.select}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="">Select role</option>
            <option value="Preparer">Preparer</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Admin">Admin</option>
            <option value="Director">Director</option>
          </select>
        </div>

        <div className={styles.formActions}>
          <Button variant="outline" type="submit">{user ? 'Update' : 'Add User'}</Button>
        </div>
      </form>
    </SidePanel>
  );
}
