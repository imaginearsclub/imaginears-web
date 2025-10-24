import { useState, useMemo } from "react";

/**
 * useTableSort Hook
 * Provides sorting functionality for table data
 */

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export function useTableSort<T>(data: T[], initialSortKey?: keyof T) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey || null,
    direction: null,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig({ key: direction ? key : null, direction });
  };

  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction;
  };

  return {
    sortedData,
    requestSort,
    sortConfig,
    getSortIcon,
  };
}

