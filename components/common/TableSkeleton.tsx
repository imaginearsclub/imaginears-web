"use client";
import { Skeleton } from "./Skeleton";

/**
 * TableSkeleton Component
 * Loading placeholder for tables
 */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showCheckbox = false,
  showActions = false,
}: TableSkeletonProps) {
  const totalColumns = columns + (showCheckbox ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            {Array.from({ length: totalColumns }).map((_, i) => (
              <th key={i} className="px-3 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              {showCheckbox && (
                <td className="px-3 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                </td>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-3">
                  <Skeleton
                    className={`h-4 ${
                      colIndex === 0 ? "w-32" : colIndex === 1 ? "w-24" : "w-20"
                    }`}
                  />
                </td>
              ))}
              {showActions && (
                <td className="px-3 py-3">
                  <Skeleton className="h-6 w-12 ml-auto" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;

