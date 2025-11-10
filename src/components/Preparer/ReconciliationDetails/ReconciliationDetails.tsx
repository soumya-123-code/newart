'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { formatDisplayDate } from '@/redux/slices/reconciliationSlice';
import {
  addCommentary,
  deleteCommentary,
  exportspecificRowReport,
  getCommentary,
  uploadReconciliationFile,
  processRecFile,
  publishRecFile,
} from '@/services/reconciliation/ReconClientApiService';
import SidePanel from '@/components/common/SidePanel/SidePanel';
import ChatUI from '@/components/common/ChatUI/ChatUI';
import styles from './ReconciliationDetails.module.scss';
import Image from 'next/image';
import { formatNumber, getPriorityColorCode, getPriorityIcon } from '@/app/utils/utils';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';
import { useMessageStore } from '@/redux/messageStore/messageStore';
import StatusBadge from '@/components/common/StatusBadge/StatusBadge';

interface ReconciliationDetailsProps {
  reconciliationId: string;
  isOpen: boolean;
  onClose: () => void;
  reconsolationRowIdWiseData: any;
  refetchTableData: any;
}

const ReconciliationDetails: React.FC<ReconciliationDetailsProps> = ({
  reconciliationId,
  isOpen,
  onClose,
  reconsolationRowIdWiseData,
  refetchTableData
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = user?.userUuid || '';

  //  USE ONLY THESE TWO STORES
  const { showError, showSuccess, showInfo, showWarning } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ============ UI STATE ============
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [showMore, setShowMore] = useState(false);
  const [apicomments, setApicomments] = useState<any>([]);

  // ============ FILE UPLOAD STATE ============
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [businessErrors, setBusinessErrors] = useState<any[]>([]);
  const [missingSheets, setMissingSheets] = useState<any[]>([]);
  const [fileUploaded, setFileUploaded] = useState(false);

  //  COMMENT OPERATION STATE
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reconciliationComments = apicomments?.commentary || reconsolationRowIdWiseData?.commentary?.commentary || [];
  const dbId = reconsolationRowIdWiseData?.recLiveId;

  //  Extract error message and validation/business errors from response
  const extractErrorData = (error: any) => {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'An error occurred';

    const validationErrors = error?.response?.data?.payload?.validationErrors || [];
    const businessErrors = error?.response?.data?.payload?.businessErrors || [];
    const missingSheets = error?.response?.data?.payload?.missingSheets || [];

    return { errorMessage, validationErrors, businessErrors, missingSheets };
  };

  // ============ COMMENTARY HANDLERS ============

  const handleFetchCommentary = async (): Promise<void> => {
    if (!userId || !dbId) return;
    try {
      const response = await getCommentary(dbId, userId);
      setApicomments(response);
    } catch (err) {
    }
  };

  //  DELETE COMMENT
  const handleDeleteComment = async (commentId: string): Promise<void> => {
    if (!userId) return;

    setIsDeletingComment(true);
    try {
      showInfo('⏳ Deleting comment...');
      const response = await deleteCommentary(dbId, commentId, userId);
      setApicomments(response);
      showSuccess(' Comment deleted successfully');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete comment';
      showError(` ${errorMsg}`);
    } finally {
      setIsDeletingComment(false);
    }
  };

  //  ADD COMMENT
  const handleAddComment = async (text: any): Promise<void> => {
    if (!userId) {
      showError(' User authentication required');
      return;
    }

    if (!text || text.trim() === '') {
      showWarning('⚠️ Please enter a comment');
      return;
    }

    setIsAddingComment(true);
    try {
      showInfo('⏳ Adding comment...');
      await addCommentary(dbId, text, userId);
      await handleFetchCommentary();
      showSuccess(' Comment added successfully');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to add comment';
      showError(` ${errorMsg}`);
      throw err;
    } finally {
      setIsAddingComment(false);
    }
  };

  // ============ FILE UPLOAD - THREE STEP SEQUENTIAL CHAIN ============

  const resetHiddenFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  //  COMPLETE UPLOAD CHAIN (Upload → Process → Publish)
  const handleFileUploadChain = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file: File = event.target.files[0];

    const isExcelFile = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

    if (!isExcelFile) {
      const errorMsg = 'Please upload a valid Excel file (.xls or .xlsx)';
      showError(` ${errorMsg}`);
      resetHiddenFileInput();
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage('');
      setValidationErrors([]);
      setBusinessErrors([]);
      setMissingSheets([])
      setFileUploaded(false);

      //  SHOW LOADER AT START
      showLoader('Uploading file...');


      //  STEP 1: Upload
      setUploadMessage('Uploading');
      showInfo(' Uploading file...');

      const uploadResponse = await uploadReconciliationFile(
        reconciliationId,
        file,
        userId
      );

      if (!uploadResponse?.data) {
        throw new Error('No upload response data');
      }

      showSuccess(' File uploaded successfully');

      //  STEP 2: Process
      setUploadMessage('Validating document');
      showInfo(' Processing file...');

      const processResponse = await processRecFile(uploadResponse.data);

      if (!processResponse?.data) {
        throw new Error('No process response data');
      }

      showSuccess(' File processed successfully');

      //  STEP 3: Publish
      setUploadMessage('Publishing');
      showInfo('🚀 Publishing file...');

      const publishResponse = await publishRecFile(processResponse.data);

      showSuccess(' File published successfully');

      //  SUCCESS: All steps completed
      setFileUploaded(true);
      setUploadMessage('');
      setValidationErrors([]);
      setBusinessErrors([]);
      setMissingSheets([])

      showSuccess(' File uploaded, processed, and published successfully');
      hideLoader();

      //  REFRESH DATA IMMEDIATELY
      if (refetchTableData) {
        await refetchTableData();
      }

      //  CLOSE MODAL AFTER 2 SECONDS
      // setTimeout(() => {
      //   console.log('👋 Closing modal...');
      //   onClose();
      // }, 2000);

    } catch (error: any) {

      const { errorMessage, validationErrors: valErrors, businessErrors: busErrors, missingSheets } = extractErrorData(error);

      setValidationErrors(valErrors);
      setBusinessErrors(busErrors);
      setMissingSheets(missingSheets)
      setUploadMessage('');
      setFileUploaded(false);

      hideLoader();
      showError(` ${errorMessage}`);

    } finally {
      setIsUploading(false);
      resetHiddenFileInput();
      event.target.value = '';
    }
  };

  const onUploadButtonClick = () => {
    resetHiddenFileInput();
    document.getElementById(`upload-input-${reconciliationId}`)?.click();
  };

  // ============ DOWNLOAD HANDLER ============

  //  DOWNLOAD FILE
  const handleDownload = async (e: React.MouseEvent, reconciliation: any) => {
    e.stopPropagation();

    setIsDownloading(true);
    try {
      const period = reconciliation?.currentPeriod;
      if (!period) {
        showError(' Invalid date format');
        setIsDownloading(false);
        return;
      }

      showInfo(' Starting download...');

      await exportspecificRowReport(reconciliation?.reconciliationId, period);

      showSuccess(' Report downloaded successfully');

    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to download reconciliation. Please try again.';
      showError(` ${errorMsg}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // ============ STATUS HELPERS ============





  const checklistItems = [
    'Balance checks to zero',
    'Aging balance equates to balance sheet amount',
    "Commentary added for section A item if there's a balance",
    "Commentary added for section B item if there's a balance",
    'Description of balance has been entered',
    'Periodic commentary has been added if the movement is greater than the threshold',
    'Description of ageing has been added if there are any balances greater than 180 days'
  ];

  // ============ RESET STATES ON PANEL OPEN ============

  useEffect(() => {
    if (isOpen && reconciliationId) {
      setActiveTab('details');
      setShowMore(false);
      setUploadMessage('');
      setValidationErrors([]);
      setBusinessErrors([]);
      setMissingSheets([])
      setFileUploaded(false);
      setIsAddingComment(false);
      setIsDeletingComment(false);
      setIsDownloading(false);
      handleFetchCommentary();
    }
  }, [isOpen, reconciliationId]);

  // ============ LOADING STATE ============

  if (!reconsolationRowIdWiseData) {
    return (
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title="Reconciliation Details"
      >
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading reconciliation details...</p>
        </div>
      </SidePanel>
    );
  }

  // ============ RENDER ============

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Reconciliation Details"
    >
      {/* ============ TABS ============ */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
          disabled={isUploading || isAddingComment || isDeletingComment || isDownloading}
        >
          Details
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
          disabled={isUploading || isAddingComment || isDeletingComment || isDownloading}
        >
          Comments {reconciliationComments.length > 0 && `(${reconciliationComments.length})`}
        </button>
      </div>

      {/* ============ DETAILS TAB ============ */}
      {activeTab === 'details' ? (
        <div className={styles.detailsContent}>
          {/* ============ DETAILS CARD ============ */}
          <div className={styles.detailsCard}>
            <div className={styles.detailsGrid}>
              {/* Reconciliation ID */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Reconciliation ID</span>
                <span className={styles.value}>{reconsolationRowIdWiseData?.reconciliationId}</span>
              </div>

              {/* Created On */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Created on</span>
                <span className={styles.value}>{formatDisplayDate(reconsolationRowIdWiseData?.createDate)}</span>
              </div>

              {/* Reconciliation Balance */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Reconciliation balance</span>
                <span className={styles.value}>
                  {formatNumber(reconsolationRowIdWiseData?.recBalance)} {reconsolationRowIdWiseData.ccy}
                </span>
              </div>

              {/* Status */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Status</span>
                <span
                  style={{ width: 120 }}

                >
                  <StatusBadge status={reconsolationRowIdWiseData?.status} />
                </span>
              </div>

              {/* Priority */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Priority</span>
                <div className={styles.priorityValue}>
                  <span className={`text-capitalize text-${getPriorityColorCode(reconsolationRowIdWiseData?.deadlinePriority)}`}>
                    {getPriorityIcon(reconsolationRowIdWiseData?.deadlinePriority || "", getPriorityColorCode(reconsolationRowIdWiseData?.deadlinePriority))}
                    {reconsolationRowIdWiseData?.deadlinePriority}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className={styles.detailItem}>
                <span className={styles.label}>Deadline</span>
                <span className={styles.value}>{reconsolationRowIdWiseData?.deadline}</span>
              </div>

              {/* Additional Details (Show More) */}
              {showMore && (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Description:</span>
                    <span className={styles.value}>{reconsolationRowIdWiseData?.description}</span>
                  </div>
                  {reconsolationRowIdWiseData?.divisionalSplit && (
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Divisional Split:</span>
                      <span className={styles.value}>{reconsolationRowIdWiseData?.divisionalSplit}</span>
                    </div>
                  )}
                  {reconsolationRowIdWiseData?.Category && (
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Category</span>
                      <span className={styles.value}>{reconsolationRowIdWiseData?.Category}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Show More Button - ALWAYS VISIBLE */}
            <div className={styles.showMoreContainer}>
              <button
                className={styles.showMoreButton}
                onClick={() => setShowMore(!showMore)}
                style={{ marginBottom: (fileUploaded || validationErrors.length > 0 || businessErrors.length > 0 || missingSheets?.length > 0) && showMore ? "100px" : "0px" }}
              >
                <span>Show {showMore ? 'less' : 'more'}</span>
                <Image
                  src={'/assets/common/chevrondown.png'}
                  width={14}
                  height={14}
                  alt="error"
                  style={{ flexShrink: 0 }}
                />
              </button>
            </div>
          </div>

          {/* ============ FILE SECTION ============ */}
          <div className={styles.fileSection}>
            {/*  Download Existing File */}
            {reconsolationRowIdWiseData?.status !== 'NOT_STARTED' && (
              <div className={styles.fileRow}>
                <div className={styles.fileInfo}>
                  <Image
                    src={'/Excel.svg'}
                    width={22}
                    height={22}
                    alt="excel"
                    style={{ borderRadius: 0 }}
                  />
                  <div className={styles.fileDetails}>
                    <span className={styles.fileName}>{reconsolationRowIdWiseData?.reconciliationId}</span>
                    <span className={styles.fileStatus}>File available</span>
                  </div>
                </div>

                <button
                  className={styles.downloadButton}
                  onClick={(e) => handleDownload(e, reconsolationRowIdWiseData)}
                  disabled={isDownloading}
                  title="Download reconciliation file"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.66699 6.66667L8.00033 10L11.3337 6.66667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 10V2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
            )}

            {/*  Upload New File */}
            <div className={styles.fileRow}>
              <div className={styles.fileInfo}>
                <Image
                  src={'/Excel.svg'}
                  width={22}
                  height={22}
                  alt="excel"
                  style={{ borderRadius: 0 }}
                />
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{reconsolationRowIdWiseData?.reconciliationId}</span>
                  {isUploading && (
                    <span className={styles.fileStatus}>{uploadMessage || 'Processing...'}</span>
                  )}
                </div>
              </div>

              <input
                type="file"
                style={{ display: 'none' }}
                id={`upload-input-${reconciliationId}`}
                ref={fileInputRef}
                onChange={handleFileUploadChain}
                accept=".xls,.xlsx"
                disabled={isUploading}
              />
              <button
                className={styles.uploadButton}
                onClick={onUploadButtonClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Uploading...</span>
                    </div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11.334 5.66667L8.00065 2.33333L4.66732 5.66667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 2.33333V10.3333"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Upload
                  </>
                )}
              </button>
            </div>

            {(validationErrors?.length > 0 || businessErrors?.length > 0 || missingSheets?.length > 0) && (
              <div style={{ marginTop: '1rem' }}>
                {/* Error Message - Simple Text */}
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#ec221f',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  Upload unsuccessful due to validation issue. Review the file and try again.
                </div>

                {/* Missing Sheets Group */}
                {missingSheets?.length > 0 && (
                  <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#2c2c2c',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Image
                        src={'/assets/common/error.svg'}
                        width={16}
                        height={16}
                        alt="error"
                        style={{ flexShrink: 0 }}
                      />
                      <span>Missing Sheets</span>
                    </div>
                    <div style={{ marginLeft: '2rem' }}>
                      {missingSheets.map((sheet: string, idx: number) => (
                        <div key={`missing-${idx}`} style={{
                          fontSize: '0.8rem',
                          color: '#555',
                          marginBottom: idx < missingSheets.length - 1 ? '0.5rem' : '0'
                        }}>
                          • {sheet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Errors Group */}
                {validationErrors?.filter((e: any) => e.missing?.length > 0).map((error: any, errorIdx: number) => (
                  <div key={`validation-${errorIdx}`} style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#2c2c2c',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Image
                        src={'/assets/common/error.svg'}
                        width={16}
                        height={16}
                        alt="error"
                        style={{ flexShrink: 0 }}
                      />
                      <span>{error.sheet} - Missing Columns</span>
                    </div>
                    <div style={{ marginLeft: '2rem' }}>
                      {error.missing.map((item: string, idx: number) => (
                        <div key={`item-${idx}`} style={{
                          fontSize: '0.8rem',
                          color: '#555',
                          marginBottom: idx < error.missing.length - 1 ? '0.5rem' : '0'
                        }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Business Errors Group */}
                {businessErrors?.map((error: any, index: number) => (
                  <div key={`business-${index}`} style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#2c2c2c',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Image
                        src={'/assets/common/error.svg'}
                        width={16}
                        height={16}
                        alt="error"
                        style={{ flexShrink: 0 }}
                      />
                      <span>Error: {error.error}</span>
                    </div>

                    <div style={{ marginLeft: '2rem', fontSize: '0.8rem', color: '#666', lineHeight: '1.6' }}>
                      {error.sheet && <div>• Sheet: <strong>{error.sheet}</strong></div>}
                      {error.cell && <div>• Cell: <strong>{error.cell}</strong></div>}
                      {error.value && <div>• Value: <strong>{error.value}</strong></div>}
                      {error.action && <div>• Action: <strong>{error.action}</strong></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Success State */}
            {validationErrors?.length === 0 && businessErrors?.length === 0 && (!missingSheets || missingSheets.length === 0) && fileUploaded && checklistItems?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#22c55e',
                  marginBottom: '1rem'
                }}>
                  ✓ Upload Successful
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px'
                }}>
                  {checklistItems.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginBottom: index < checklistItems.length - 1 ? '0.5rem' : '0',
                      fontSize: '0.8rem',
                      color: '#555'
                    }}>
                      <Image
                        src={'/check.svg'}
                        width={14}
                        height={14}
                        alt="check"
                        style={{ flexShrink: 0, marginTop: '2px' }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}



          </div>
        </div>
      ) : (
        /* ============ COMMENTS TAB ============ */
        <div className={styles.commentsContent}>
          <ChatUI
            messages={reconciliationComments}
            onAddMessage={handleAddComment}
            onDeleteMessage={handleDeleteComment}
            placeholder="Add your comment"
            emptyStateMessage="No comments yet. Be the first to comment!"
            isLoading={isAddingComment || isDeletingComment}
          />
        </div>
      )}
    </SidePanel>
  );
};

export default ReconciliationDetails;