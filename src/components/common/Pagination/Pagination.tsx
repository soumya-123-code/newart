'use client';

import React, { useMemo } from 'react';
import styles from './Pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const MAX_VISIBLE_PAGES = 3;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = 1; i <= MAX_VISIBLE_PAGES; i++) {
        pages.push(i);
      }

      if (currentPage > MAX_VISIBLE_PAGES + 1) {
        pages.push('ellipsis');
      }

      if (
        currentPage > MAX_VISIBLE_PAGES &&
        currentPage <= totalPages - MAX_VISIBLE_PAGES
      ) {
        pages.push(currentPage);
      }

      if (currentPage < totalPages - MAX_VISIBLE_PAGES) {
        pages.push('ellipsis-end');
      }

      for (let i = totalPages - MAX_VISIBLE_PAGES + 1; i <= totalPages; i++) {
        if (i > 0) {
          pages.push(i);
        }
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEllipsisClick = (type: 'start' | 'end') => {
    if (type === 'start') {
      const newPage = Math.max(1, currentPage - 5);
      onPageChange(newPage);
    } else {
      const newPage = Math.min(totalPages, currentPage + 5);
      onPageChange(newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.pagination}>
      <button
        className={styles.navigationButton}
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.buttonText}>Back</span>
      </button>

      <div className={styles.pageNumbers}>
        {pageNumbers.map((page) => {
          if (typeof page === 'number') {
            return (
              <button
                key={`page-${page}`}
                className={`${styles.pageButton} ${
                  currentPage === page ? styles.active : ''
                }`}
                onClick={() => {
                  onPageChange(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          } else {
            const isStartEllipsis = page === 'ellipsis';
            return (
              <button
                key={page}
                className={styles.ellipsis}
                onClick={() =>
                  handleEllipsisClick(isStartEllipsis ? 'start' : 'end')
                }
                aria-label={
                  isStartEllipsis
                    ? 'Jump to previous pages'
                    : 'Jump to next pages'
                }
              >
                ...
              </button>
            );
          }
        })}
      </div>

      <button
        className={styles.navigationButton}
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span className={styles.buttonText}>Next</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;