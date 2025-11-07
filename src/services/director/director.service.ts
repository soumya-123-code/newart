import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Get Dashboard Summary for Director
export async function getDirectorDashboard() {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/v1/analytics/summary`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard summary');
  }
}

// Get Trend Analysis
export async function getTrendAnalysis(filters?: any) {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/v1/analytics/trends`, {
      params: filters
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch trend analysis');
  }
}

// Get Performance Report
export async function getPerformanceReport(filters?: any) {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/v1/analytics/performance`, {
      params: filters
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch performance report');
  }
}

// Get Escalations
export async function getEscalations() {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/v1/reconciliation/escalations`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch escalations');
  }
}

// Final Approval
export async function approveFinal(reconciliationId: string, comments?: string) {
  try {
    const { data } = await axios.post(`${BASE_URL}/api/v1/reconciliation/final-approval`, {
      reconciliationId,
      comments
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to approve reconciliation');
  }
}
