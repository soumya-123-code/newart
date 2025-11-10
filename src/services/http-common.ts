import { createAxiosInstance } from './apiInterceptor';

// Create axios instances with unified interceptor
export const importerAxios = createAxiosInstance(
  process.env.NEXT_PUBLIC_IMPORTER_BASE_URL || 'http://localhost:3001'
);

export const reconApiAxios = createAxiosInstance(
  process.env.NEXT_PUBLIC_RECON_API_BASE_URL || 'http://localhost:3000'
);

export const reconLedgerAxios = createAxiosInstance(
  process.env.NEXT_PUBLIC_RECON_LEDGER_BASE_URL || 'http://localhost:3002'
);

export { importerAxios as default };
