'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import Pagination from '@/components/common/Pagination/Pagination';
import StatusBadge from '@/components/common/StatusBadge/StatusBadge';
import { UploadRow } from '../admin.mock';

export default function AdminUpload() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const onChoose = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      fileName: f.name,
      size: `${(f.size/1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleString(),
      status: 'Queued' as const,
    }));
    setRows(prev => [...added, ...prev]);
    setTimeout(()=> setRows(prev => prev.map(r => r.status==='Queued'?{...r,status:'Processing'}:r)), 500);
    setTimeout(()=> setRows(prev => prev.map(r => r.status==='Processing'?{...r,status: Math.random()>0.1?'Completed':'Failed', error:'Validation failed'}:r)), 1500);
  };

  const start = (page-1)*perPage;
  const pageRows = rows.slice(start, start+perPage);

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Upload</h1></div>

      <div className={styles.card}>
        <div className={styles.cardHead}><h2>Upload files</h2></div>
        <div className={styles.uploadBody}>
          <input id="picker" type="file" accept=".csv,.xlsx" multiple onChange={(e)=>onChoose(e.target.files)} hidden />
          <label htmlFor="picker" className={styles.dropArea}>
            <div className={styles.icon}>⬆️</div>
            <div className={styles.dropText}>
              <div className={styles.title}>Click to upload or drag and drop</div>
              <div className={styles.sub}>CSV or XLSX up to 10MB</div>
            </div>
          </label>
          <div className={styles.linksRow}>
            <button className={styles.textLink}>Download template</button>
            <button className={styles.textLink}>View validation rules</button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><h2>Recent uploads</h2></div>
        <div className={styles.table}>
          <div className={styles.thead}>
            <div>File name</div><div>Size</div><div>Uploaded</div><div>Status</div><div className={styles.right}>Actions</div>
          </div>
          <div className={styles.tbody}>
            {pageRows.map(r => (
              <div key={r.id} className={styles.tr}>
                <div className={styles.file}>{r.fileName}</div>
                <div>{r.size}</div>
                <div>{r.uploadedAt}</div>
                <div><StatusBadge status={r.status === 'Failed' ? 'Rejected' : r.status === 'Completed' ? 'Completed' : 'Review'} /></div>
                <div className={styles.right}>
                  {r.status === 'Failed' && <button className={styles.rowLink} onClick={()=>{
                    setRows(prev => prev.map(x => x.id===r.id ? { ...x, status:'Processing', error: undefined } : x));
                    setTimeout(()=> setRows(prev => prev.map(x => x.id===r.id ? { ...x, status:'Completed' } : x)), 800);
                  }}>Retry</button>}
                  <button className={styles.rowLink} onClick={()=> setRows(prev => prev.filter(x => x.id!==r.id))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {rows.length ? `${start+1}-${Math.min(start+perPage, rows.length)} of ${rows.length}` : '0-0 of 0'}
          </span>
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(rows.length/perPage))} onPageChange={setPage}/>
        </div>
      </div>
    </div>
  );
}
