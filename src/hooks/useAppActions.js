import { useCallback } from "react";

export function useAppActions({
  setToast,
  setIsBusy,
  toastTimerRef,
  canEditSelected,
  checking,
  isAuth,
  selectedUser,
  onRequireAuth,
  busyMinMs = 500,
  toastMs = 2400,
}) {
  const showToast = useCallback(
    (message) => {
      setToast(message);
      if (toastTimerRef?.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => setToast(""), toastMs);
    },
    [setToast, toastTimerRef, toastMs]
  );

  const withBusy = useCallback(
    async (fn) => {
      setIsBusy(true);
      const start = Date.now();
      try {
        return await fn();
      } finally {
        const elapsed = Date.now() - start;
        if (elapsed < busyMinMs) {
          await new Promise((resolve) => setTimeout(resolve, busyMinMs - elapsed));
        }
        setIsBusy(false);
      }
    },
    [setIsBusy, busyMinMs]
  );

  const guard = useCallback(
    (fn) => async (...args) => {
      if (checking) return;
      if (!isAuth) {
        onRequireAuth?.();
        return;
      }
      if (!selectedUser) return;
      if (!canEditSelected) {
        showToast("Edition reservee");
        return;
      }
      return fn(...args);
    },
    [checking, isAuth, onRequireAuth, selectedUser, canEditSelected, showToast]
  );

  return { showToast, withBusy, guard };
}
