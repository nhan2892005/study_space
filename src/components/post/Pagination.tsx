"use client";

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  total: number;
  pages: number;
  current: number;
}

export default function Pagination({ total, pages, current }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/?${params.toString()}`);
  };

  if (pages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center items-center gap-2">
      {/* Previous Page Button */}
      <button
        onClick={() => handlePageChange(current - 1)}
        disabled={current === 1}
        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 
                 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Page Numbers */}
      {Array.from({ length: pages }, (_, i) => i + 1)
        .filter(page => {
          if (pages <= 7) return true;
          if (page === 1 || page === pages) return true;
          if (Math.abs(page - current) <= 1) return true;
          return false;
        })
        .map((page, i, arr) => {
          if (i > 0 && arr[i - 1] !== page - 1) {
            return (
              <div key={`ellipsis-${page}`} className="flex items-center">
                <span className="px-2 text-gray-400">...</span>
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg ${
                    page === current
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
                  } transition-colors duration-200`}
                >
                  {page}
                </button>
              </div>
            );
          }

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg ${
                page === current
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              {page}
            </button>
          );
        })}

      {/* Next Page Button */}
      <button
        onClick={() => handlePageChange(current + 1)}
        disabled={current === pages}
        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 
                 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
