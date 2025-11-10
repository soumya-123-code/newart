import axios, { AxiosError, AxiosResponse } from "axios";

const RECON_API = process.env.NEXT_PUBLIC_RECON_API || 'http://localhost:3000';
const RECON_API_PATH = process.env.NEXT_PUBLIC_API_BASE_URL_PATH || 'api';
const RECON_API_IMPORT = process.env.NEXT_PUBLIC_API_BASE_URL_IMPORT || 'importer';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || '';

async function request(url: string, options?: RequestInit, userId?: any): Promise<any> {

  const axiosConfig: any = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'User-id': userId || '',
    },
  };

  if (options?.body) {
    try {
      axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      axiosConfig.data = options.body;
    }
  }

  try {
    const res = await axios(axiosConfig);

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return res.data;
  } catch (error) {
    // Error will be handled by interceptor
    throw error;
  }
}

export async function listLiveReconciliations(
  status: string = 'All',
  selectedPeriod?: string,
  defaultPeriod?: string
) {
  const baseUrl = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary`;

  const selectedPeriodStr = selectedPeriod ? String(selectedPeriod) : '';
  const defaultPeriodStr = defaultPeriod ? String(defaultPeriod) : '';

    userId,
    userRole,
    defaultPeriod: defaultPeriodStr,
    status,
  });

  const rolePath =
    userRole === 'REVIEWER'
      ? 'reviewer'
      : userRole === 'DIRECTOR'
      ? 'director'
      : userRole === 'ADMIN'
      ? 'admin'
      : 'preparer';

  let periodPart = '';
  if (selectedPeriodStr && selectedPeriodStr.includes(' ')) {
    const [month, year] = selectedPeriodStr.split(' ');
    if (year?.length >= 4) {
      periodPart = `01-${month}-${year.slice(2, 4)}`;
    }
  }

  const isHistory =
    selectedPeriodStr && defaultPeriodStr ? selectedPeriodStr !== defaultPeriodStr : false;

  let url = '';

  if (isHistory) {
    url = `${baseUrl}/history/${rolePath}/${userId}/period/${periodPart}`;
    if (status !== 'All') url += `?status=${status.toUpperCase()}`;
    url += `${status === 'All' ? '?' : '&'}page=${page}&pagesize=${pageSize}`;
  } else {
    url = rolePath === 'reviewer' 
      ? `${baseUrl}/filter/${rolePath}/${userId}` 
      : `${baseUrl}/filter/${userId}`;
    if (status !== 'All') url += `?status=${status.toUpperCase()}`;
    url += `${status === 'All' ? '?' : '&'}page=${page}&pagesize=${pageSize}`;
  }

  return request(url, undefined, userId);
}

export async function getGraphicalRepresentData(
  userRole: string,
  selectedMonth?: string,
  defaultPeriod?: string
) {
  const baseUrl = `${RECON_API}/${RECON_API_PATH}/v1/reconciliation/summary/count/`;
  const selectedMonthStr = selectedMonth ? String(selectedMonth) : '';
  const defaultPeriodStr = defaultPeriod ? String(defaultPeriod) : '';
  
    userId,
    userRole,
  });

  // Build period part from format like "Jun 2025"
  let periodPart = '';
  if (selectedMonthStr && selectedMonthStr.includes(' ')) {
    const [month, year] = selectedMonthStr.split(' ');
    if (year?.length >= 4) {
      periodPart = `01-${month}-${year.slice(2, 4)}`; // ✅ 01-Jun-25
    }
  }

  const rolePath = userRole?.toLowerCase();

  // Determine if this is history by comparing periods
  const isHistory = selectedMonthStr && defaultPeriodStr ? selectedMonthStr !== defaultPeriodStr : false;

  let url = '';
  if (isHistory) {
    url = `${baseUrl}history/${rolePath}/${userId}/period/${periodPart}`;
  } else {
    url = `${baseUrl}${rolePath}/${userId}`;
  }

  return request(url, undefined, userId);
}


export async function uploadReconciliationFile(
  userId: any
) {
  const url = `${RECON_API}/${RECON_API_IMPORT}/api/v1/document/import/${reconciliationId}`;
  const formData = new FormData();
  formData.append('file', file);

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      "user-id": userId,
    },
  };

  const res = await axios(axiosConfig);
  return res;
}

export async function getCommentary(dbId: string, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/commentary/${dbId}`;
  return request(url, undefined, userId);
}

export async function addCommentary(reconciliationId: string, text: string, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/commentary`;
  return request(url,
    {
      body: JSON.stringify({
      }
      ),
    }, userId);
}

export async function searchLiveForSelf(
  userId: any
) {
  let baseUrl: string;
  const params = new URLSearchParams();

  if (userId) {
    baseUrl = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary/filter/${userId}`;
  } else {
    baseUrl = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary`;
  }

  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);
  if (currency) params.set('currency', currency);
  params.set('page', String(page));
  params.set('pagesize', String(pageSize));

  const url = `${baseUrl}?${params}`;
  return request(url, undefined, userId);
}

export async function getReconciliationById(id: string, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary/${id}`;
  return request(url, undefined, userId);
}

export async function getSelfSummary(userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/reconciliation/summary/self`;
  return request(url, undefined, userId);
}

export async function updateRecStatus(payload: any, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/status`;
  return request(url, {
  }, userId);
}

export async function submitForReview(reconciliationId: string, comment: string | undefined, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/${reconciliationId}/submit`;
  return request(url, {
  }, userId);
}

export async function deleteCommentary(dbId: any, commentId: string, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/commentary/${dbId}/comment/${commentId}`;
  return request(url, {
  }, userId);
}

export async function downloadReconciliationFile(reconciliationId: string, fileId: string, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/${reconciliationId}/files/${fileId}/download`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'User-id': userId,
    },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res;
}

export async function processRecFile(data: any) {
  const url = `${RECON_API}/${RECON_API_IMPORT}/api/v1/process`;
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    data,
  };
  const processRes = await axios(axiosConfig);
  return processRes;
}

export async function publishRecFile(data: any) {
  const url = `${RECON_API}/${RECON_API_IMPORT}/api/v1/process/publish`;
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    data,
  };
  const publishRes = await axios(axiosConfig);
  return publishRes;
}

export async function statusUpdateApi(data: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/status`;
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    data,
  };
  const publishRes = await axios(axiosConfig);
  return publishRes;
}

export async function getAllDownloads(page: number, itemsPerPage: number, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/document/processed?page=${page}&pagesize=${itemsPerPage}`;
  return request(url, undefined, userId);
}

export async function exportspecificRowReport(reconciliationId: any, period: any) {
  const downloadUrl = `${RECON_API}/${RECON_API_IMPORT}/api/v1/document/imports/download/${reconciliationId}/period/${period}`;

  try {
    const response: any = await axios.get(downloadUrl, {
    });

    if (!response.data) {
      throw new Error('No data received from server');
    }

    const blob = response.data;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Download must be triggered in browser context');
    }

   
    const disposition = response.headers['content-disposition'];
    let fileName = 'downloaded_report'; 

    if (disposition && disposition.indexOf('attachment') !== -1) {
    
      const matches = /filename=["']?([^"']+)["']?/.exec(disposition);
      if (matches != null && matches[1]) {
       
        fileName = matches[1].trim();
      }
    }

    
    const url_2 = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url_2;
    downloadLink.download = fileName;

   
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url_2);
    }, 100);

    return true;
  } catch (error: any) {

    if (error.response) {
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Download failed');
    }
  }
}


export async function exportReport(
  userId: any
) {
  const params = new URLSearchParams(filters as Record<string, string>);
  const url = `${RECON_API}/${RECON_API_PATH}/v1/export/${type}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'User-id': userId,
    },
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res;
}

export async function listAssignedForReviewer(page: number, pageSize: number, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/assigned/self?page=${page}&pagesize=${pageSize}`;
  return request(url, undefined, userId);
}

export async function listApprovalsForSelf(page: number, pageSize: number, userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/process/live/summary/approval/self?page=${page}&pagesize=${pageSize}`;
  return request(url, undefined, userId);
}

export async function listUsers(userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/user/users`;
  return request(url, undefined, userId);
}

export async function listRecIds(userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rechistory/recids`;
  return request(url, undefined, userId);
}

export async function listPeriods(userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rechistory/periods`;
  return request(url, undefined, userId);
}

export async function currentPeriods(userId: any) {
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/admin/period`;
  return request(url, undefined, userId);
}

export async function periodApiCall(){
  const url = `${RECON_API}/${RECON_API_PATH}/v1/rec/admin/period`;
  return request(url)
}