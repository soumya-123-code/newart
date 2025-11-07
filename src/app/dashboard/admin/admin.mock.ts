// src/app/dashboard/admin/admin.mock.ts
export type Reco = {
  id: string;
  title: string;
  currency: string;
  priority: 'High' | 'Low';
  status: 'Prepare' | 'Review' | 'Completed' | 'Rejected';
  owner: string;
  updatedAt: string;
};

export const adminReconciliations: Reco[] = [
  { id: 'REC-0001', title: 'Cash GL 101', currency: 'USD', priority: 'High', status: 'Review', owner: 'alex.kim', updatedAt: '2025-07-12T10:34:00Z' },
  { id: 'REC-0002', title: 'Bank A/C 9876', currency: 'EUR', priority: 'Low', status: 'Prepare', owner: 'priya.s', updatedAt: '2025-07-12T08:11:00Z' },
  { id: 'REC-0003', title: 'Payroll Control', currency: 'INR', priority: 'High', status: 'Completed', owner: 'rahul.n', updatedAt: '2025-07-11T16:10:00Z' },
  { id: 'REC-0004', title: 'Interco 221', currency: 'USD', priority: 'Low', status: 'Rejected', owner: 'maria.p', updatedAt: '2025-07-10T09:15:00Z' },
  { id: 'REC-0005', title: 'Cash GL 102', currency: 'USD', priority: 'High', status: 'Review', owner: 'alex.kim', updatedAt: '2025-07-12T10:50:00Z' },
  { id: 'REC-0006', title: 'Duties Payable', currency: 'GBP', priority: 'Low', status: 'Prepare', owner: 'sam.t', updatedAt: '2025-07-09T19:00:00Z' },
  { id: 'REC-0007', title: 'Fixed Asset Recon', currency: 'USD', priority: 'High', status: 'Completed', owner: 'priya.s', updatedAt: '2025-07-08T21:18:00Z' },
  { id: 'REC-0008', title: 'Cash GL 103', currency: 'JPY', priority: 'Low', status: 'Review', owner: 'maria.p', updatedAt: '2025-07-12T06:10:00Z' },
  { id: 'REC-0009', title: 'Bank A/C 4321', currency: 'USD', priority: 'High', status: 'Prepare', owner: 'rahul.n', updatedAt: '2025-07-06T12:30:00Z' },
  { id: 'REC-0010', title: 'Accruals 900', currency: 'USD', priority: 'Low', status: 'Completed', owner: 'alex.kim', updatedAt: '2025-07-03T14:45:00Z' },
];

export const months = [
  'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025',
];

export const kpis = [
  { label: 'Total reconciliations', value: 248 },
  { label: 'Pending review', value: 36 },
  { label: 'Completed', value: 189 },
  { label: 'Rejected', value: 23 },
];

export const barTrend = [
  { label: 'Jan', value: 28 },
  { label: 'Feb', value: 34 },
  { label: 'Mar', value: 31 },
  { label: 'Apr', value: 40 },
  { label: 'May', value: 36 },
  { label: 'Jun', value: 44 },
  { label: 'Jul', value: 35 },
];

export type UploadRow = {
  id: string;
  fileName: string;
  size: string;
  uploadedAt: string;
  status: 'Queued'|'Processing'|'Completed'|'Failed';
  error?: string;
};

export type ExportRow = {
  id: string;
  period: string;
  format: 'CSV'|'XLSX';
  requestedAt: string;
  status: 'Queued'|'Ready'|'Failed';
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'PREPARER'|'REVIEWER'|'DIRECTOR'|'ADMIN';
  active: boolean;
};

export const seedUsers: AdminUser[] = [
  { id:'U-1001', name:'Alex Kim', email:'alex.kim@corp.com', role:'ADMIN', active:true },
  { id:'U-1002', name:'Priya Singh', email:'priya@corp.com', role:'REVIEWER', active:true },
  { id:'U-1003', name:'Rahul Nayak', email:'rahul@corp.com', role:'PREPARER', active:false },
  { id:'U-1004', name:'Maria Perez', email:'maria@corp.com', role:'DIRECTOR', active:true },
];
