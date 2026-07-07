import { useState, useCallback, useMemo } from 'react';

export const useMultiSelect = (initialSelected: string[] = []) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set([...prev, ...ids]);
      return Array.from(next);
    });
  }, []);

  const deselectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const toggleAllOnPage = useCallback((pageIds: string[]) => {
    const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelectedOnPage) {
      deselectAll(pageIds);
    } else {
      selectAll(pageIds);
    }
  }, [selectedIds, selectAll, deselectAll]);

  const isAllSelectedOnPage = useCallback((pageIds: string[]) => {
    return pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  }, [selectedIds]);

  const isSomeSelectedOnPage = useCallback((pageIds: string[]) => {
    const hasSelected = pageIds.some((id) => selectedIds.includes(id));
    const hasUnselected = pageIds.some((id) => !selectedIds.includes(id));
    return hasSelected && hasUnselected;
  }, [selectedIds]);

  const count = useMemo(() => selectedIds.length, [selectedIds]);

  return {
    selectedIds,
    setSelectedIds,
    toggle,
    selectAll,
    deselectAll,
    clear,
    isSelected,
    toggleAllOnPage,
    isAllSelectedOnPage,
    isSomeSelectedOnPage,
    count,
  };
};
