const RECON_API = process.env.NEXT_PUBLIC_RECON_API || 'http://localhost:3000';
const RECON_API_PATH = process.env.NEXT_PUBLIC_API_BASE_URL_PATH || 'api';
const RECON_API_IMPORT = process.env.NEXT_PUBLIC_API_BASE_URL_IMPORT || 'importer';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${AUTH_TOKEN}`,
    // 'User-id': '1001',
    // ...(options?.headers || {})
  };

  // Build fetch config
  const fetchConfig: RequestInit = {
    method: options?.method || 'GET',
    headers,
  };

  // Handle request body
  if (options?.body) {
    try {
      fetchConfig.body = typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
    } catch {
      fetchConfig.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, fetchConfig);

    // Check for non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText, status: response.status };
      }
      throw errorData;
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;

  } catch (err) {
    throw err;
  }
}

export async function getUserInfo() {
  const url = `${RECON_API}/api/v1/user/userinfo`;
  return request(url);
}
