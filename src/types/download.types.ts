export interface DownloadItem {
  id: string;
  fileName: string;
  fileSize: number;
  type: 'report' | 'data' | 'template';
  createdAt: string;
  description: string;
}

export interface DownloadState {
  items: DownloadItem[];
  loading: boolean;
  error: string | null;
}