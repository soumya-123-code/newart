
'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import DatePicker from '@/components/common/DatePicker/DatePicker';
import StatusBadge from '@/components/common/StatusBadge/StatusBadge';
import { ExportRow } from '../admin.mock';

export default function AdminDownload() {
  const [month, setMonth] = useState('July 2025');
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'CSV'|'XLSX'>('CSV');
  const [rows, setRows] = useState<ExportRow[]>([]);

  const generate = () => {
    const id = `${Date.now()}`;
    setRows(prev => [{ id, period: month, format, requestedAt: new Date().toLocaleString(), status:'Queued' }, ...prev]);
    setTimeout(()=> setRows(prev => prev.map(r => r.id===id ? { ...r, status:'Ready' } : r)), 1200);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Download</h1></div>

      <div className={styles.card}>
        <div className={styles.cardHead}><h2>Create export</h2></div>
        <div className={styles.exportRow}>
          <DatePicker selectedMonth={month} isOpen={open} onToggle={()=>setOpen(!open)} onMonthChange={(m)=>{ setMonth(m); setOpen(false); }} />
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggle} ${format==='CSV'?styles.active:''}`} onClick={()=>setFormat('CSV')}>CSV</button>
            <button className={`${styles.toggle} ${format==='XLSX'?styles.active:''}`} onClick={()=>setFormat('XLSX')}>XLSX</button>
          </div>
          <button className={styles.primaryBtn} onClick={generate}>Generate</button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><h2>Exports</h2></div>
        <div className={styles.table}>
          <div className={styles.thead}>
            <div>Period</div><div>Format</div><div>Requested</div><div>Status</div><div className={styles.right}>Actions</div>
          </div>
          <div className={styles.tbody}>
            {rows.map(r => (
              <div className={styles.tr} key={r.id}>
                <div>{r.period}</div>
                <div>{r.format}</div>
                <div>{r.requestedAt}</div>
                <div><StatusBadge status={r.status === 'Ready' ? 'Completed' : r.status === 'Failed' ? 'Rejected' : 'Review'} /></div>
                <div className={styles.right}>
                  {r.status === 'Ready' ? <button className={styles.textBtn}>Download</button> : <span className={styles.dim}>—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
