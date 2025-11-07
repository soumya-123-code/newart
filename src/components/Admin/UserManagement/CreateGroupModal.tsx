'use client';
import React, { useState } from 'react';
import Button from '@/components/common/Button/Button';
import styles from './CreateGroupModal.module.scss';
import SidePanel from '@/components/common/SidePanel/SidePanel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: { name: string; role: string }) => void;
};

const ROLES = ['Preparer', 'Reviewer', 'Admin', 'Director'];

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup }: Props) {
  const [form, setForm] = useState({ name: '', role: '' });
  const [errors, setErrors] = useState<{ name?: string; role?: string }>({});

  function validate() {
    const e: { name?: string; role?: string } = {};
    if (!form.name.trim()) {
      e.name = 'You must enter a group name';
    }
    if (!form.role) {
      e.role = 'Role is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onCreateGroup({
      name: form.name.trim(),
      role: form.role,
    });
    resetForm();
  }

  function resetForm() {
    setForm({ name: '', role: '' });
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <SidePanel title="Create Group" onClose={onClose} isOpen>
      <form className={styles.form} onSubmit={submit}>
        {/* Group Name Field */}
        <div className={styles.formGroup}>
          <label htmlFor="groupName" className={styles.label}>
            Group name <span className={styles.required}>*</span>
          </label>
          <input
            id="groupName"
            type="text"
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={form.name}
            onChange={e => {
              setForm({ ...form, name: e.target.value });
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder="Enter group name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'groupName-error' : undefined}
          />
          {errors.name && (
            <span id="groupName-error" className={styles.errorMessage}>
              {errors.name}
            </span>
          )}
        </div>

        {/* Role Selection Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Type <span className={styles.required}>*</span>
          </label>
          <fieldset className={styles.radioGroup} aria-invalid={!!errors.role}>
            <legend className={styles.legend}>Select a role</legend>
            <div className={styles.radioOptions}>
              {ROLES.map(role => (
                <label key={role} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={form.role === role}
                    onChange={e => {
                      setForm({ ...form, role: e.target.value });
                      if (errors.role) {
                        setErrors({ ...errors, role: undefined });
                      }
                    }}
                    className={styles.radio}
                  />
                  <span className={styles.radioText}>{role}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {errors.role && (
            <span className={styles.errorMessage}>{errors.role}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Button variant="primary" type="submit">
            Create
          </Button>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </SidePanel>
  );
}
