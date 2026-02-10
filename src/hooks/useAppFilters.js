import { useEffect, useCallback } from "react";

export function useAppFilters({
  mode,
  range,
  showNewsArchive,
  userCardOpen,
  setMode,
  setRange,
  initialFiltersRef,
  rangeTouchedRef,
  filtersTouchedRef,
}) {
  const updateUrlFilters = useCallback(
    (nextMode, nextRange, includeFilters = true) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (includeFilters) {
        if (nextMode) params.set("mode", nextMode);
        else params.delete("mode");
        if (nextRange) params.set("range", nextRange);
        else params.delete("range");
      } else {
        params.delete("mode");
        params.delete("range");
      }
      if (userCardOpen) params.set("card", "open");
      else params.delete("card");
      const search = params.toString();
      const path = window.location.pathname || "/";
      window.history.replaceState({}, "", search ? `${path}?${search}` : path);
    },
    [userCardOpen]
  );

  const handleRangeChange = useCallback(
    (nextRange) => {
      rangeTouchedRef.current = true;
      filtersTouchedRef.current = true;
      setRange(nextRange);
      updateUrlFilters(mode, nextRange, !showNewsArchive);
    },
    [mode, showNewsArchive, setRange, updateUrlFilters, rangeTouchedRef, filtersTouchedRef]
  );

  const handleModeChange = useCallback(
    (nextMode) => {
      filtersTouchedRef.current = true;
      setMode(nextMode);
      updateUrlFilters(nextMode, range, !showNewsArchive);
    },
    [range, showNewsArchive, setMode, updateUrlFilters, filtersTouchedRef]
  );

  useEffect(() => {
    if (showNewsArchive) {
      updateUrlFilters(null, null, false);
      return;
    }
    const initial = initialFiltersRef.current;
    const shouldSyncFilters = filtersTouchedRef.current || initial.mode || initial.range;
    updateUrlFilters(mode, range, shouldSyncFilters);
  }, [mode, range, showNewsArchive, updateUrlFilters, initialFiltersRef, filtersTouchedRef]);

  return { handleRangeChange, handleModeChange };
}
