import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number; // 0 means "Semua" (All)
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string; // e.g. "faktur", "pembayaran", "konsumen", "data"
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = "data",
}: PaginationProps) {
  const isAll = pageSize === 0;
  const totalPages = isAll || totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);

  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 shadow-2xs text-xs sm:text-sm text-gray-700">
      {/* Left: Row per page selector & Total Items info */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="rows-per-page-select" className="text-gray-500 font-medium whitespace-nowrap">
            Tampilkan:
          </label>
          <select
            id="rows-per-page-select"
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} baris
              </option>
            ))}
            <option value={0}>Semua ({totalItems})</option>
          </select>
        </div>

        <span className="text-gray-300 hidden sm:inline">|</span>

        <div className="text-gray-500">
          {totalItems === 0 ? (
            <span>Tidak ada {itemName}</span>
          ) : isAll ? (
            <span>
              Menampilkan seluruh <strong className="font-bold text-gray-800">{totalItems}</strong> {itemName}
            </span>
          ) : (
            <span>
              Menampilkan <strong className="font-bold text-gray-800">{startItem}-{endItem}</strong> dari{" "}
              <strong className="font-bold text-gray-800">{totalItems}</strong> {itemName}
            </span>
          )}
        </div>
      </div>

      {/* Right: Page Navigation Controls */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Pertama"
            aria-label="Halaman Pertama"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page Number Chips */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-1.5 py-1 text-gray-400 font-semibold select-none">
                    ...
                  </span>
                );
              }

              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Berikutnya"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman Terakhir"
            aria-label="Halaman Terakhir"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
