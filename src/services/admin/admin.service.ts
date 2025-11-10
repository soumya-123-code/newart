import axios, { AxiosError, AxiosResponse } from "axios";

const IMPORTER_API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const RECON_API = process.env.NEXT_PUBLIC_RECON_API || 'http://localhost:3000';
const RECON_LEDGER_API = process.env.NEXT_PUBLIC_RECON_LEDGER_API || 'http://localhost:3002';
const API_PATH = process.env.NEXT_PUBLIC_API_BASE_URL_PATH || 'newapi';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || '';




// Setup axios interceptor for 401 handling
let interceptorInitialized = false;

if (!interceptorInitialized && typeof window !== 'undefined') {
  // Response Interceptor for handling 401 errors
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      // If response is successful, just return it
      return response;
    },
    (error: AxiosError) => {
      console.error('API Error:', error);

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        console.warn('🔒 401 Unauthorized - Redirecting to unauthorized page');
        
        // Clear all authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
        sessionStorage.clear();

        // Redirect to unauthorized page
        if (typeof window !== 'undefined') {
          window.location.href = '/unauthorized';
        }
      }

      // Handle 403 Forbidden errors (optional)
      if (error.response?.status === 403) {
        console.warn('🚫 403 Forbidden - Redirecting to unauthorized page');
        window.location.href = '/unauthorized';
      }

      // Always propagate the error to be handled by the caller
      return Promise.reject(error);
    }
  );

  interceptorInitialized = true;
  console.log('✅ Axios interceptors initialized');
}

/**
 * Make an API request using axios
 * @param baseApi The base API URL (IMPORTER_API, RECON_API, or RECON_LEDGER_API)
 * @param endpoint The API endpoint path
 * @param options Request options (method, body, etc.)
 * @param userId The user ID for the request headers
 * @returns Promise with the API response data
 * @throws Will throw an error if the request fails
 */
async function request(
  baseApi: any, 
  endpoint: any, 
  options?: any, 
  userId?: any
): Promise<any> {
  if (!endpoint) {
    throw new Error('Endpoint is required for API request');
  }
  
  const url = `${baseApi}/${API_PATH}${endpoint}`;
  console.log('🌐 Admin API Request:', url, 'Method:', options?.method || 'GET');

  const axiosConfig: any = {
    method: options?.method || 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN || ''}`,
    },
    // Add timeout to prevent hanging requests
    timeout: 30000,
    responseType: options?.responseType || 'json',
  };

  // Add user-id header if provided
  if (userId) {
    axiosConfig.headers['user-id'] = userId;
  }

  if (options?.body) {
    try {
      axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      console.log('Request payload:', JSON.stringify(axiosConfig.data).substring(0, 200) + '...');
    } catch (error) {
      console.error('Error parsing request body:', error);
      axiosConfig.data = options.body;
    }
  }

  try {
    console.log('Sending request to:', url);
    const res = await axios(axiosConfig);
    console.log('Response received:', res.status);

    if (res.status < 200 || res.status >= 300) {
      console.error(`Request failed with status ${res.status}`, res.data);
      throw new Error(`Request failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }

    return res.data;
  } catch (error: any) {
    console.error('Request failed:', error.message, error.response?.data);
    
    // Enhanced error object with more details
    const enhancedError: any = new Error(
      `API Error: ${error.message} - ${error.response?.data?.message || 'Unknown error'}`
    );
    
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    enhancedError.url = url;
    enhancedError.method = options?.method || 'GET';
    
    // Make sure we're throwing the error properly
    throw enhancedError;
  }
}

/**
 * Validate that userId is provided
 * @param userId The user ID to validate
 */
function validateUserId(userId: any): void {
  if (!userId) {
    throw new Error('User ID is required for this operation');
  }
}

/**
 * Helper to get userId from localStorage
 * @returns The user ID from localStorage, or undefined if not found
 */
function getUserIdFromLocalStorage(): any | undefined {
  try {
    const token = JSON.parse(localStorage.getItem('token') || '{}');
    return token.userId;
  } catch (error) {
    console.error('Error getting userId from localStorage:', error);
    return undefined;
  }
}

// ===== DOCUMENT MANAGEMENT (ADMIN) =====

/**
 * Upload and assign document to a user (Admin only)
 */
export async function uploadAndAssign(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<any> {
  const userId = getUserIdFromLocalStorage();
  validateUserId(userId);
  
  const formData = new FormData();
  formData.append("file", file);

  console.log("userId for uploadAndAssign:", userId);
  
  try {
    const response = await axios.post(
      `${IMPORTER_API}/${API_PATH}/v1/document/import/admin`, 
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "user-id": userId,
        },
        onUploadProgress,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upload and assign error:', error);
    throw error;
  }
}

/**
 * Upload reconciliation update (Admin only)
 */
export async function uploadRecUpdate(file: File, onUploadProgress?: (progressEvent: any) => void, userId?: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${RECON_API}/${API_PATH}/v1/rec/admin/management/rec`, 
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "user-id": userId,
        },
        onUploadProgress,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upload rec update error:', error);
    throw error;
  }
}

// ===== RECONCILIATION ADMINISTRATION =====

/**
 * Get reconciliation control data
 */
export async function getReconciliationControl(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API, 
    `/v1/rec/admin/control?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Get all imported data
 */
export async function getAllImported(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    IMPORTER_API,
    `/v1/document/imports?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Get all latest imported data
 */
export async function getAllLatestImported(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    IMPORTER_API,
    `/v1/document/imports/latest?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Get all downloads
 */
export async function getAllDownloads(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);

  return request(
    IMPORTER_API,
    `/v1/export/REC-CONTROL?userid=${userId}`,
    {
      method: 'GET',
      responseType: 'blob', // ✅ Required for Excel/ZIP file
    },
    userId
  );
}




/**
 * Get live master reconciliations
 */
export async function getLiveMasterReconciliations(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/live/master?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Create new reconciliation 
 */
export async function createRec(createRecRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/management/rec`,
    {
      method: 'POST',
      body: JSON.stringify(createRecRequest),
    },
    userId
  );
}

/**
 * Update existing reconciliation
 */
export async function updateRec(updateRecRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/management/rec`,
    {
      method: 'PUT',
      body: JSON.stringify(updateRecRequest),
    },
    userId
  );
}

/**
 * Get roll forward process logs
 */
export async function getRollForwardProcessLog(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/rollforward/log?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

// https://art.appuat.libertyblume.com/api/v1/rec/op/rollforward/610608

export async function rollforward(reconciliationId:any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  

  return request(
    RECON_API,
    `v1/rec/op/rollforward/${reconciliationId}`,
    undefined,
    userId
  );
}

export async function getRollForwardBalanceSheets(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  

  return request(
    RECON_API,
    `/v1/rec/process/live/rollforward?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}
// https://art.appuat.libertyblume.com/api/v1/export/ROLLFORWARD?userid=1000

export async function rollForwordAllDownloads( userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);

  return request(
    IMPORTER_API,
    `/v1/export/ROLLFORWARD?userid=${userId}`,
    {
      method: 'GET',
      responseType: 'blob', // ✅ Required for Excel/ZIP file
    },
    userId
  );
}


/**
 * Update overdue reconciliations
 */
export async function updateOverdue(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/overdue`,
    {
      method: 'PUT',
    },
    userId
  );
}

/**
 * Get current reconciliation period
 */

export async function currentPeriods(userId: any) {
  const url = `${RECON_API}/v1/rec/admin/period`;
  return request(url, undefined, userId);
}



export async function getCurrentRecPeriod(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period`,
    undefined,
    userId
  );
}

/**
 * Update reconciliation period
 */
export async function updatePeriod(periodRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/currentPeriod`,
    {
      method: 'POST',
      body: periodRequest,
    },
    userId
  );
}

// Add these new API functions to your existing apiService.ts

/**
 * Get all reconciliations (paginated)
 */
export async function getAllReconciliations(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/reconciliation?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Get user groups
 */


/**
 * Get risk ratings
 */
export async function getRiskRatings(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/reconciliation/riskrating`,
    undefined,
    userId
  );
}

/**
 * Get all users
 */
export async function getUsers(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/user`,
    undefined,
    userId
  );
}

/**
 * Get reconciliation status updates from bulk upload
 */
export async function getBulkUploadStatus(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/management/status?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Disable reconciliation
 */
export async function disableRec(reconciliationId: string, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/management/rec/disable/${reconciliationId}`,
    {
      method: 'PUT',
    },
    userId
  );
}

/**
 * Enable reconciliation
 */
export async function enableRec(reconciliationId: string, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/management/rec/enable/${reconciliationId}`,
    {
      method: 'PUT',
    },
    userId
  );
}

/**
 * Reset period and refresh data
 */
export async function refreshAndResetPeriod(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period/reset`,
    {
      method: 'PUT',
    },
    userId
  );
}


/**
 * Reset reconciliation period
 */
export async function resetPeriod(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period/reset`,
    {
      method: 'PUT',
    },
    userId
  );
}

/**
 * Start reconciliation period
 */
export async function startPeriod(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period/start`,
    {
      method: 'PUT',
    },
    userId
  );
}

/**
 * Close reconciliation period
 */
export async function closePeriod(priority: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period/close/${priority}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Open reconciliation period
 */
export async function openPeriod(priority: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/period/open/${priority}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Get all job statuses
 */
export async function getAllJobStatus(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/jobs`,
    undefined,
    userId
  );
}

// ===== ENTITY MANAGEMENT =====

/**
 * Get all entities
 */
export async function getAllEntities(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/entity`,
    undefined,
    userId
  );
}

/**
 * Add entity
 */
export async function addEntity(createEntityRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/entity`,
    {
      method: 'POST',
      body: JSON.stringify(createEntityRequest),
    },
    userId
  );
}

/**
 * Update entities
 */
export async function updateEntities(updateEntityRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/admin/entity/update`,
    {
      method: 'POST',
      body: JSON.stringify(updateEntityRequest),
    },
    userId
  );
}

// ===== NOTIFICATION MANAGEMENT =====

/**
 * Send reminders to users
 */
export async function sendReminders(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/mail/reminder`,
       {
      method: 'GET'
    },
    userId
  );
}

// ===== USER GROUP MANAGEMENT =====

/**
 * Get user groups (paginated)
 */
export async function getUserGroups(page: number, itemsPerPage: number, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/group/groups/page?page=${page}&pagesize=${itemsPerPage}`,
    undefined,
    userId
  );
}

/**
 * Get all user groups
 */
export async function getAllUserGroups(userId?: any): Promise<any> {
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/group/groups`,
    undefined,
    userId
  );
}

/**
 * Update group members
 */
export async function updateGroupMembers(groupItemsRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/group/user`,
    {
      method: 'POST',
      body: JSON.stringify(groupItemsRequest),
    },
    userId
  );
}

/**
 * Add group
 */
export async function addGroup(group: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/group`,
    {
      method: 'POST',
      body: JSON.stringify(group),
    },
    userId
  );
}

// ===== ROLL FORWARD OPERATIONS =====

/**
 * Bulk roll forward
 */
export async function bulkRollForward(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/op/rollforward/bulk`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Cancel bulk roll forward
 */
export async function cancelBulkRollForward(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/op/rollforward/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Get all approved reconciliations for roll forward
 */
export async function getAllApproved(rfRequest: any, userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_API,
    `/v1/rec/op/rollforward/list`,
    {
      method: 'POST',
      body: JSON.stringify(rfRequest),
    },
    userId
  );
}

// ===== TRIAL BALANCE & TRANSACTION OPERATIONS =====

/**
 * Refresh trial balance
 */
export async function refreshTrialBalance(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_LEDGER_API,
    `/v1/trialbalance/refresh`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Cancel trial balance refresh
 */
export async function cancelTrialBalanceRefresh(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_LEDGER_API,
    `/v1/trialbalance/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}

/**
 * Refresh transactions
 */
export async function refreshTransactions(userId?: any): Promise<any> {
  userId = userId || getUserIdFromLocalStorage();
  validateUserId(userId);
  
  return request(
    RECON_LEDGER_API,
    `/v1/transaction/refresh`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    userId
  );
}


export async function exportReport(
  type: 'excel' ,
  filters: any,
  userId: any
) {
  const params = new URLSearchParams(filters as Record<string, string>);
  const url = `${RECON_API}/${API_PATH}/v1/export/${type}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'User-id': userId,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res;
}

