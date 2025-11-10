'use client';
import React from 'react';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status = "" }) => {
  const getStatusClass = () => {
    switch (status?.toLowerCase()) {
      case 'not_started':
        return 'info';
      case "ready":
        return "warning";
      case 'pending_review':
        return 'info';
      case 'review':
        return 'warning';
      case 'completed':
        return 'success';
      case 'approved':
        return 'primary';
      case 'rejected':
        return 'danger';
      default:
        return 'primary';
    }
  };

 const getStatusLabel = () => {
    switch (status?.toLowerCase()) {
      case "not_started":
        return "Prepare";
      case 'ready':
        return 'Review';
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'NA';
    }
  }

  return (
    <div className={`badge border border-${getStatusClass()} bg-light-${getStatusClass()} text-${getStatusClass()}`}>
      {getStatusLabel()}
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;