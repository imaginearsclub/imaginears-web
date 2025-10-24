import { useState, useMemo } from "react";

/**
 * useTableFilter Hook
 * Provides filtering functionality for table data
 */

export function useTableFilter<T>(
  data: T[],
  filterFn?: (item: T, query: string) => boolean
) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!filterQuery.trim()) {
      return data;
    }

    if (filterFn) {
      return data.filter((item) => filterFn(item, filterQuery));
    }

    // Default: search all string values
    return data.filter((item) => {
      const searchStr = filterQuery.toLowerCase();
      return Object.values(item as any).some((value) =>
        String(value).toLowerCase().includes(searchStr)
      );
    });
  }, [data, filterQuery, filterFn]);

  return {
    filteredData,
    filterQuery,
    setFilterQuery,
    hasActiveFilter: filterQuery.trim().length > 0,
  };
}

