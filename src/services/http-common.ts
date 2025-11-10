import axios from "axios";


axios.defaults.headers.post["Content-Type"] = "application/json";

const importerAxios = axios.create({
  baseURL: process.env.VUE_APP_IMPORTER_BASE_URL,
});

const reconApiAxios = axios.create({
  baseURL: process.env.VUE_APP_RECON_API_BASE_URL,
});

const reconLedgerAxios = axios.create({
  baseURL: process.env.VUE_APP_RECON_LEDGER_BASE_URL,
});

// Enhanced interceptor to handle 401 errors
reconApiAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log("Intercepted error:" + JSON.stringify(error));
    
    // Handle network errors
    if (!error.response) {
      window.location.href = '/';
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Session expired
    if (error.response.status === 401) {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
      }
      // Redirect to unauthorized page with 401 error
      window.location.href = '/unauthorized?error=401';
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden - No permissions
    if (error.response.status === 403) {
      window.location.href = '/unauthorized?error=403';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  },
);

// Add the same interceptor to other axios instances
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        sessionStorage.clear();
        
        // Redirect to unauthorized page
        window.location.href = '/unauthorized';
      }
    }
    return Promise.reject(error);
  }
);

reconLedgerAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      window.location.href = '/';
    } else if (error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
      }
      window.location.href = '/unauthorized?error=401';
    } else if (error.response.status === 403) {
      window.location.href = '/unauthorized?error=403';
    }
    return Promise.reject(error);
  }
);

export { importerAxios, reconApiAxios, reconLedgerAxios };