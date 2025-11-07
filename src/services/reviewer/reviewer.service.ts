import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const RECON_API = process.env.NEXT_PUBLIC_RECON_API || 'http://localhost:3000';
const RECON_API_PATH = process.env.NEXT_PUBLIC_API_BASE_URL_PATH || 'newapi';
const RECON_API_IMPORT = process.env.NEXT_PUBLIC_API_BASE_URL_IMPORT || 'newapi';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || '';

// Get Approvals List
export async function getApprovals(page: number = 1, pageSize: number = 10) {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary/approval/`, {
      params: { page, pageSize }
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch approvals');
  }
}

// Update Reconciliation Status

// Add Comment to Reconciliation
export async function addComment(reconciliationId: string, comment: string) {
  try {
    const { data } = await axios.post(`${RECON_API}/${RECON_API_PATH}/v1/rec/process/commentary`, {
      reconciliationId,
      comment
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add comment');
  }
}

// Get Trial Balance Differences
export async function getTrialBalanceDifferences(reviewerId: string) {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/ledger/trialbalance/diff/reviewer/${reviewerId}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch trial balance differences');
  }
}

// Export Reviewer Report
export async function exportReviewerReport(format: string = 'excel') {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/export/`, {
      params: { format },
      responseType: 'blob'
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to export report');
  }
}

// Get All Reconciliations
export async function getAllReconciliations() {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/reconciliation`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch reconciliations');
  }
}

// Search History
export async function searchHistory(filters: any) {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/rechistory/search`, {
      params: filters
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to search history');
  }
}

// Get History Users
export async function getHistoryUsers() {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/user/users`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
}

// Get Reconciliation IDs for History
export async function getReconciliationIds() {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/rechistory/recids`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch reconciliation IDs');
  }
}

// Get Periods for History
export async function getHistoryPeriods() {
  try {
    const { data } = await axios.get(`${RECON_API}/${RECON_API_PATH}/v1/rechistory/periods`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch periods');
  }
}

// Get Processed Documents by Reconciliation and Period
export async function getProcessedByRecAndPeriod(reconciliationId: string, period: string) {
  try {
    const { data } = await axios.get(
      `${RECON_API}/${RECON_API_PATH}/v1/document/processed/${reconciliationId}/period/${period}`
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch processed documents');
  }
}
