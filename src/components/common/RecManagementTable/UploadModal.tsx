"use client";

import React, { useState, useRef } from "react";
import styles from "./UploadModal.module.scss";
import Image from "next/image";
import Modal from "@/components/common/Modal/Modal";
import { uploadRecUpdate, getBulkUploadStatus } from "@/services/admin/admin.service";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  userId?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  userId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(""); // success or error
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validate file type
      if (
        !selectedFile.name.endsWith(".csv") &&
        !selectedFile.name.endsWith(".xls") &&
        !selectedFile.name.endsWith(".xlsx")
      ) {
        setMessageType("error");
        setMessage("Please select a valid CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setMessage("");
      setMessageType("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessageType("error");
      setMessage("Please select a file first");
      return;
    }

    if (!userId) {
      setMessageType("error");
      setMessage("Authentication required");
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");
    setMessageType("");

    try {
      // STEP 1: Upload the file
      console.log("Step 1: Uploading file...", file.name);

      await uploadRecUpdate(
        file,
        (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
        userId
      );

      console.log("Step 1: File uploaded successfully!");
      setProgress(100);

      // STEP 2: Wait for server to process and then fetch bulk upload status
      console.log("Step 2: Waiting for server to process...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      console.log("Step 2: Fetching bulk upload status...");
      const statusResponse = await getBulkUploadStatus(1, 10, userId);

      console.log("Step 2: Bulk upload status fetched:", statusResponse);

      setMessageType("success");
      setMessage("File uploaded successfully!");

      setUploading(false);

      // Wait a bit before closing and refreshing
      setTimeout(() => {
        onUploadSuccess(); // This will refresh the bulk upload table
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error("Upload error:", error);
      setMessageType("error");
      setMessage(
        `Upload failed: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`
      );
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setMessage("");
    setMessageType("");
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setMessage("");
    setMessageType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Upload Reconciliation Updates" onClose={handleClose}>
      <div className={styles.uploadModal}>
        <div className={styles.dropZone}>
          <Image
            src="/CloudUpload.svg"
            alt="Upload"
            width={80}
            height={80}
            className={styles.uploadIcon}
          />
          <p className={styles.dropText}>
            Drag & drop files or{" "}
            <label htmlFor="fileInput" className={styles.browseLink}>
              Browse
            </label>
          </p>
          <p className={styles.supportedFormats}>
            Supported formats: XLS and CSV
          </p>
          <input
            id="fileInput"
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
        </div>

        {file && (
          <div className={styles.uploadingSection}>
            <h3 className={styles.sectionTitle}>Uploading - 1/1 files</h3>
            <div className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  onClick={handleRemoveFile}
                  className={styles.removeButton}
                  disabled={uploading}
                >
                  <Image src="/Close.svg" alt="Remove" width={20} height={20} />
                </button>
              </div>
              {uploading && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                  <span className={styles.progressText}>{progress}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {message && (
          <div
            className={`${styles.message} ${
              messageType === "success" ? styles.success : styles.error
            }`}
          >
            {message}
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className={styles.uploadButton}
            disabled={!file || uploading}
          >
            {uploading ? `Uploading ${progress}%` : "Upload"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
