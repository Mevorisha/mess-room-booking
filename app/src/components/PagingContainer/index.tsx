import React from "react";

import "./styles.css";

export interface PagingContainerProps {
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onPageChange: (n: number) => void;
}

export default function PagingContainer({
  totalPages,
  currentPage,
  setCurrentPage,
  onPageChange,
}: PagingContainerProps): React.ReactNode {
  if (totalPages <= 1) return <></>;

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onPageChange(page);
  }

  function renderPageNumbers() {
    const pageNumbers = [];
    let startPage, endPage;
    if (totalPages <= 5) {
      // If total pages are 5 or less, show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // Show 5 pages with current in the middle when possible
      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <div className={`page-button ${i === currentPage ? "active" : ""}`} key={i} onClick={() => handlePageChange(i)}>
          {i}
        </div>
      );
    }
    return pageNumbers;
  }

  return (
    <div className="components-PagingContainer">
      <div className="control-button first-page" onClick={() => handlePageChange(1)} title="First Page">
        <i className="fa fa-angle-double-left"></i>
      </div>
      <div className="control-button prev-page" onClick={() => handlePageChange(currentPage - 1)} title="Previous Page">
        <i className="fa fa-angle-left"></i>
      </div>

      {renderPageNumbers()}

      <div className="control-button next-page" onClick={() => handlePageChange(currentPage + 1)} title="Next Page">
        <i className="fa fa-angle-right"></i>
      </div>
      <div className="control-button last-page" onClick={() => handlePageChange(totalPages)} title="Last Page">
        <i className="fa fa-angle-double-right"></i>
      </div>
    </div>
  );
}
