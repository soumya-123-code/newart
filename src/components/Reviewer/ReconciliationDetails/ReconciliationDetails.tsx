'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  formatDisplayDate,
  statusUpdateApi,
} from '@/redux/slices/reconciliationSlice';
import SidePanel from '@/components/common/SidePanel/SidePanel';
import ChatUI from '@/components/common/ChatUI/ChatUI';
import styles from './ReconciliationDetails.module.scss';
import Image from 'next/image';
import { usePreparer } from '@/hooks/usePreparer';
import { formatNumber, getPriorityColorCode } from '@/app/utils/utils';
import { getPriorityIcon } from '@/app/utils/utils';
import {
  addCommentary,
  deleteCommentary,
  exportspecificRowReport,
  getCommentary
} from '@/services/reconciliation/ReconClientApiService';
//  IMPORT YOUR STORES
import { useMessageStore } from '@/redux/messageStore/messageStore';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';
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
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.userUuid || '';
  const { reconciliations } = usePreparer();
  const dispatch = useDispatch<any>();

  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [showMore, setShowMore] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);
  const [apicomments, setApicomments] = useState<any>([]);
  const [statusUpdateValue, setStatusUpdateValue] = useState('');
  const [statusComment, setStatusComment] = useState('');

  //  USE YOUR STORES
  const { showError, showSuccess } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  const currentIndex = reconciliations?.findIndex((r: { id: string }) => r.id === reconciliationId);
  const totalReconciliations = reconciliations?.length;
  const reconciliationComments = apicomments?.commentary || reconsolationRowIdWiseData?.commentary?.commentary || [];
  const dbId = reconsolationRowIdWiseData?.recLiveId;

  useEffect(() => {
    if (isOpen && reconciliationId) {
      setActiveTab('details');
      setShowMore(false);
      setStatusChangeError(null);
      handleFetchCommentary();
    }
  }, [isOpen, reconciliationId]);

  const handleFetchCommentary = async (): Promise<void> => {
    if (!userId || !dbId) return;
    try {
      const response = await getCommentary(dbId, userId);
      setApicomments(response);
    } catch (err) {
    }
  };

  const handleDeleteComment = async (dbId: any, commentId: string): Promise<void> => {
    if (!reconciliationComments || !userId) return;

    try {
      const response = await deleteCommentary(dbId, commentId, userId);
      setApicomments(response);
    } catch (err) {
    }
  };

  const handleAddComment = async (reconciliationId: any, text: any): Promise<void> => {
    if (!userId) {
      return;
    }
    try {
      await addCommentary(reconciliationId, text, userId);
      handleFetchCommentary();
    } catch (err) {
      throw err;
    }
  };



  const handleDownload = (e: React.MouseEvent, reconciliation: any) => {
    e.stopPropagation();
    try {
      const period = reconciliation?.currentPeriod;
      if (!period) {
        alert('Invalid date format');
        return;
      }
      exportspecificRowReport(reconciliation?.reconciliationId, period)
        .catch(error => {
          alert(error.message || 'Failed to download reconciliation. Please try again.');
        });
    } catch (error) {
      alert('Failed to download reconciliation. Please try again.');
    }
  };

  //  FIXED: statusUpdate with proper flow
  const statusUpdate = async (e: React.MouseEvent, data: any) => {
    e.stopPropagation();

    if (!userId) {
      showError(' User ID not found');
      return;
    }

    // Validation
    if (!statusUpdateValue) {
      showError(' Please select Approve or Reject');
      return;
    }

    if (statusUpdateValue === 'REJECTED' && !statusComment.trim()) {
      showError(' Please provide a comment for rejection');
      return;
    }

    try {
      showLoader('Processing your submission...');

      const payload = {
        statusPayload: {
          statusUpdates: [{
            userId: userId,
            reconciliation_id: data?.reconciliationId,
            status: statusUpdateValue,
            current_period: data?.currentPeriod
          }]
        },
        commentryPayload: {
          reconciliationId: data.reconciliationId,
          statusComment: statusComment,
          userId: userId,
        }
      };

      //  Dispatch thunk (commentary first, then status - handled in thunk)
      const result = await dispatch(statusUpdateApi(payload)).unwrap();

      //  Refresh data
      if (refetchTableData) {
        await refetchTableData();
      }
      await handleFetchCommentary();

      hideLoader();

      //  Show success
      const actionText = statusUpdateValue === 'REJECTED' ? 'Rejected' : 'Approved';
      showSuccess(` Reconciliation ${actionText} successfully`);

      //  Clear form
      setStatusUpdateValue('');
      setStatusComment('');
      setStatusChangeError(null);

      //  Close panel
      onClose();

    } catch (error: any) {
      hideLoader();

      let errorMessage = 'Failed to update status. Please try again.';

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.payload) {
        errorMessage = error.payload;
      }

      showError(` ${errorMessage}`);
      setStatusChangeError(errorMessage);
    }
  };




  const navigationActions = (
    <div className={styles.navigation}>
      {/* Navigation buttons commented out */}
    </div>
  );

  if (!reconsolationRowIdWiseData) {
    return (
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title="Reconciliation Details"
        headerActions={navigationActions}
      >
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading reconciliation details...</p>
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Reconciliation Details"
      headerActions={navigationActions}
    >
      {statusChangeError && (
        <div className={styles.errorBanner}>
          <span>{statusChangeError}</span>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments {reconciliationComments.length > 0 && `(${reconciliationComments.length})`}
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className={styles.detailsContent}>
          <div className={styles.detailsCard}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.label}>Reconciliation ID</span>
                <span className={styles.value}>{reconsolationRowIdWiseData?.reconciliationId}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Created on</span>
                <span className={styles.value}>{formatDisplayDate(reconsolationRowIdWiseData?.createDate)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Reconciliation balance</span>
                <span className={styles.value}>
                  {formatNumber(reconsolationRowIdWiseData?.recBalance)} {reconsolationRowIdWiseData.ccy}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Status</span>
                <span
                  style={{ width: 120 }}

                >
                  <StatusBadge status={reconsolationRowIdWiseData?.status} />
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Priority</span>
                <div className={styles.priorityValue}>
                  <span className={`text-capitalize text-${getPriorityColorCode(reconsolationRowIdWiseData?.deadlinePriority)}`}>
                    {getPriorityIcon(reconsolationRowIdWiseData?.deadlinePriority || "", getPriorityColorCode(reconsolationRowIdWiseData?.deadlinePriority))}
                    {reconsolationRowIdWiseData?.deadlinePriority}
                  </span>
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Deadline</span>
                <span className={styles.value}>{reconsolationRowIdWiseData?.deadline}</span>
              </div>

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

            <div className={styles.showMoreContainer}>
              <button
                className={styles.showMoreButton}
                onClick={() => setShowMore(!showMore)}
              >
                <span>Show {showMore ? 'less' : 'more'}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: showMore ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {reconsolationRowIdWiseData?.status !== 'NOT_STARTED' && (
            <div className={styles.fileSection}>
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
                  </div>
                </div>
                <button
                  className={styles.downloadButton}
                  onClick={(e) => handleDownload(e, reconsolationRowIdWiseData)}
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
                  Download
                </button>
              </div>
            </div>
          )}

          {reconsolationRowIdWiseData?.status !== 'NOT_STARTED' &&
            reconsolationRowIdWiseData?.status !== 'APPROVED' &&
            reconsolationRowIdWiseData?.status !== 'REJECTED' &&
            reconsolationRowIdWiseData?.status !== 'COMPLETED' && (
              <div className="row my-3">
                <div className="col-12">
                  <h5 className="mb-3">Review reconciliation</h5>
                </div>
                <div className="col-3">
                  <div className="custom-form-check mb-3">
                    <input
                      className="custom-form-check-input"
                      type="radio"
                      name="radioDefault"
                      id="radioDefault1"
                      value="REJECTED"
                      onChange={(e) => setStatusUpdateValue(e.target.value)}
                    />
                    <label className="custom-form-check-label" htmlFor="radioDefault1">
                      Reject
                    </label>
                  </div>
                </div>
                <div className="col-3">
                  <div className="custom-form-check mb-3">
                    <input
                      className="custom-form-check-input"
                      type="radio"
                      name="radioDefault"
                      id="radioDefault2"
                      value="APPROVED"
                      onChange={(e) => setStatusUpdateValue(e.target.value)}
                    />
                    <label className="custom-form-check-label" htmlFor="radioDefault2">
                      Approve
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group">
                    <label htmlFor="comment-box">Comment</label>
                    <textarea
                      className="form-control"
                      id="comment-box"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 text-end">
                  <button
                    type="button"
                    disabled={statusUpdateValue === '' || (statusUpdateValue === 'REJECTED' && !statusComment.trim())}
                    className="btn btn-primary mt-3"
                    onClick={(e) => statusUpdate(e, reconsolationRowIdWiseData)}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className={styles.commentsContent}>
          <ChatUI
            messages={reconciliationComments}
            onAddMessage={(text) => handleAddComment(reconciliationId, text)}
            onDeleteMessage={(commentId) => handleDeleteComment(dbId, commentId)}
            placeholder="Add your comment"
            emptyStateMessage="No comments yet. Be the first to comment!"
            inputDisabled={reconsolationRowIdWiseData?.status?.toUpperCase() === 'NOT_STARTED' || reconsolationRowIdWiseData?.status?.toUpperCase() === 'COMPLETED'}
          />
        </div>
      )}
    </SidePanel>
  );
};

export default ReconciliationDetails;