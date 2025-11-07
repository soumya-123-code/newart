// // services/preparer/preparer.service.ts

// import * as reconService from '../reconciliation/ReconClientApiService';

// // ========================
// // Wrapper/Alias Functions
// // ========================

// /**
//  * Get all live reconciliations for the preparer
//  */
// export async function getAllLiveReconciliations(page = 1, pageSize = 10) {
//   return reconService.listLiveForSelf(page, pageSize);
// }

// /**
//  * Search live reconciliations
//  */
// export async function searchLiveReconciliations(filters: {
//   status?: string;
//   priority?: string;
//   currency?: string;
//   page?: number;
//   pageSize?: number;
// }) {
//   return reconService.searchLiveForSelf(
//     filters.status,
//     filters.priority,
//     filters.currency,
//     filters.page || 1,
//     filters.pageSize || 10
//   );
// }

// /**
//  * Get reconciliation by ID
//  */
// export async function getReconciliationById(id: string) {
//   return reconService.getReconciliationById(id);
// }

// /**
//  * Get preparer summary
//  */
// export async function getPreparerSummary() {
//   return reconService.getSelfSummary();
// }

// /**
//  * Upload a document
//  */
// export async function uploadDocument(file: File, options?: { reconciliationId?: string }) {
//   if (!options?.reconciliationId) {
//     throw new Error('reconciliationId is required');
//   }
//   return reconService.uploadReconciliationFile(options.reconciliationId, file);
// }

// /**
//  * Download a reconciliation file
//  */
// export async function downloadReconciliationFile(reconciliationId: string, fileId: string) {
//   const response = await reconService.downloadReconciliationFile(reconciliationId, fileId);
//   return response.blob();
// }


// /**
//  * Submit a reconciliation for review
//  */
// export async function submitReconciliationForReview(reconciliationId: string, comment?: string) {
//   return reconService.submitForReview(reconciliationId, comment);
// }

// /**
//  * Export preparer report
//  */
// export async function exportPreparerReport(p0: string, p1: { status: string | undefined; priority: string | undefined; }, format: 'csv' | 'excel' | 'pdf' = 'excel') {
//   const response = await reconService.exportReport(format, {});
//   return response.blob();
// }

// /**
//  * Alias for exportPreparerReport - export report
//  */
// export const exportReport = exportPreparerReport;
