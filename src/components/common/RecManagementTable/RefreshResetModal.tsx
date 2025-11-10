"use client";

import React, { useState } from "react";
import styles from "./RefreshResetModal.module.scss";
import Modal from "@/components/common/Modal/Modal";
import { refreshAndResetPeriod } from "@/services/admin/admin.service";

interface RefreshResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

const RefreshResetModal: React.FC<RefreshResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!userId) {
      alert("Authentication required");
      return;
    }

    setLoading(true);
    try {
      console.log("Refreshing and resetting period with userId:", userId);
      await refreshAndResetPeriod(userId);
      console.log("Period refreshed and reset successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to refresh and reset:", error);
      alert(
        `Failed to refresh and reset period: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Refresh & reset" onClose={onClose}>
      <div className={styles.modalContent}>
        <p className={styles.description}>
          Reset current period by backing up any current period reconciliations
          and clearing down. Any preparers assigned to reconciliations are also
          refreshed for validation purposes.
        </p>
        <div className={styles.warning}>
          <p>
            Use with caution as this will clear down received imported data and
            reset the reconciliations as not started
          </p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={loading}
          >
            {loading ? "Processing..." : "Refresh & reset"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RefreshResetModal;
