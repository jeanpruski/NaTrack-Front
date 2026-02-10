import { useEffect, useRef, useCallback } from "react";

export function useAppGestures({
  enabled,
  isGlobalView,
  showCardsPage,
  selectedUser,
  showNewsArchive,
  mainRef,
  dashboardRefreshingRef,
  refreshGlobalDashboard,
  setPullActive,
  setPullDistance,
  handleBack,
}) {
  const pullRefreshRef = useRef({ active: false, startY: 0, lastY: 0, mouse: false });
  const swipeRef = useRef({ x: 0, y: 0, t: 0, moved: false, lastX: 0, lastY: 0 });
  const wheelPullRef = useRef({ accum: 0, lastTs: 0, startTs: 0 });
  const wheelResetTimerRef = useRef(null);
  const wheelTriggerTimerRef = useRef(null);
  const lastNonZeroScrollTsRef = useRef(0);

  const getMainScrollTop = useCallback(() => {
    if (mainRef?.current) return mainRef.current.scrollTop || 0;
    const scrollingEl = document.scrollingElement || document.documentElement;
    return scrollingEl ? scrollingEl.scrollTop || 0 : 0;
  }, [mainRef]);

  const startPullRefresh = useCallback(
    (clientY) => {
      if (!enabled) return false;
      if (!isGlobalView || showCardsPage || showNewsArchive) return false;
      if (dashboardRefreshingRef.current) return false;
      if (getMainScrollTop() > 0) return false;
      if (clientY > 80) return false;
      if (typeof window !== "undefined" && window.__DEBUG_PULL) {
        console.log("[pull] start", {
          clientY,
          mainScrollTop: mainRef.current ? mainRef.current.scrollTop : null,
          docScrollTop: (document.scrollingElement || document.documentElement)?.scrollTop ?? null,
        });
      }
      pullRefreshRef.current.active = true;
      pullRefreshRef.current.startY = clientY;
      pullRefreshRef.current.lastY = clientY;
      setPullActive(true);
      setPullDistance(0);
      return true;
    },
    [
      enabled,
      isGlobalView,
      showCardsPage,
      showNewsArchive,
      dashboardRefreshingRef,
      getMainScrollTop,
      mainRef,
      setPullActive,
      setPullDistance,
    ]
  );

  const updatePullRefresh = useCallback(
    (clientY) => {
      if (!pullRefreshRef.current.active) return;
      pullRefreshRef.current.lastY = clientY;
      const dy = Math.max(0, clientY - pullRefreshRef.current.startY);
      const eased = Math.min(120, dy);
      setPullDistance(eased);
      if (typeof window !== "undefined" && window.__DEBUG_PULL) {
        console.log("[pull] move", {
          clientY,
          dy,
          mainScrollTop: mainRef.current ? mainRef.current.scrollTop : null,
          docScrollTop: (document.scrollingElement || document.documentElement)?.scrollTop ?? null,
        });
      }
    },
    [mainRef, setPullDistance]
  );

  const endPullRefresh = useCallback(() => {
    if (!pullRefreshRef.current.active) return;
    const dy = pullRefreshRef.current.lastY - pullRefreshRef.current.startY;
    pullRefreshRef.current.active = false;
    pullRefreshRef.current.mouse = false;
    setPullActive(false);
    setPullDistance(0);
    if (typeof window !== "undefined" && window.__DEBUG_PULL) {
      console.log("[pull] end", {
        dy,
        mainScrollTop: mainRef.current ? mainRef.current.scrollTop : null,
        docScrollTop: (document.scrollingElement || document.documentElement)?.scrollTop ?? null,
      });
    }
    if (dy > 60) {
      refreshGlobalDashboard({ includeNews: false });
    }
  }, [mainRef, refreshGlobalDashboard, setPullActive, setPullDistance]);

  const onTouchStart = useCallback(
    (e) => {
      const touch = e.touches?.[0];
      if (!touch) return;
      if (startPullRefresh(touch.clientY)) return;
      if (!showCardsPage && !selectedUser && !showNewsArchive) return;
      swipeRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        t: Date.now(),
        moved: false,
      };
    },
    [startPullRefresh, showCardsPage, selectedUser, showNewsArchive]
  );

  const onTouchMove = useCallback(
    (e) => {
      const touch = e.touches?.[0];
      if (!touch) return;
      if (pullRefreshRef.current.active) {
        updatePullRefresh(touch.clientY);
        return;
      }
      if (!showCardsPage && !selectedUser && !showNewsArchive) return;
      const dx = touch.clientX - swipeRef.current.x;
      const dy = touch.clientY - swipeRef.current.y;
      swipeRef.current.lastX = touch.clientX;
      swipeRef.current.lastY = touch.clientY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        swipeRef.current.moved = true;
      }
    },
    [showCardsPage, selectedUser, showNewsArchive, updatePullRefresh]
  );

  const onTouchEnd = useCallback(() => {
    if (pullRefreshRef.current.active) {
      endPullRefresh();
      return;
    }
    if (!showCardsPage && !selectedUser && !showNewsArchive) return;
    const { x, y, lastX, lastY, t, moved } = swipeRef.current || {};
    if (!moved) return;
    const dt = Date.now() - (t || 0);
    if (!dt || dt > 700) return;
    const dx = (lastX || 0) - (x || 0);
    const dy = (lastY || 0) - (y || 0);
    if (dx > 70 && Math.abs(dy) < 50) {
      handleBack();
    }
  }, [endPullRefresh, handleBack, showCardsPage, selectedUser, showNewsArchive]);

  const onMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (startPullRefresh(e.clientY)) {
        pullRefreshRef.current.mouse = true;
      }
    },
    [startPullRefresh]
  );

  const onMouseMove = useCallback(
    (e) => {
      if (!pullRefreshRef.current.active || !pullRefreshRef.current.mouse) return;
      updatePullRefresh(e.clientY);
    },
    [updatePullRefresh]
  );

  const onMouseUp = useCallback(() => {
    if (!pullRefreshRef.current.active || !pullRefreshRef.current.mouse) return;
    endPullRefresh();
  }, [endPullRefresh]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleTouchStart = (e) => onTouchStart(e);
    const handleTouchMove = (e) => onTouchMove(e);
    const handleTouchEnd = () => onTouchEnd();
    const handleTouchCancel = () => onTouchEnd();
    const handleTouchStartDebug = (e) => {
      if (typeof window !== "undefined" && window.__DEBUG_PULL) {
        const touch = e.touches?.[0];
        console.log("[pull] touchstart", {
          clientY: touch?.clientY ?? null,
          mainScrollTop: mainRef.current ? mainRef.current.scrollTop : null,
          docScrollTop: (document.scrollingElement || document.documentElement)?.scrollTop ?? null,
        });
      }
    };
    const handleScroll = () => {
      if (getMainScrollTop() > 0) lastNonZeroScrollTsRef.current = Date.now();
    };
    const handleWheel = (e) => {
      if (!enabled) return;
      if (!isGlobalView || showCardsPage || showNewsArchive) return;
      if (dashboardRefreshingRef.current) return;
      if (getMainScrollTop() > 0) return;
      if (Date.now() - lastNonZeroScrollTsRef.current < 250) return;
      const delta = e.deltaY || 0;
      if (Math.abs(delta) < 10) return;
      if (delta < 0) {
        const nowTs = Date.now();
        const idleGap = nowTs - (wheelPullRef.current.lastTs || 0);
        if (!wheelPullRef.current.startTs || idleGap > 260) {
          wheelPullRef.current.startTs = nowTs;
          if (wheelTriggerTimerRef.current) clearTimeout(wheelTriggerTimerRef.current);
          wheelTriggerTimerRef.current = setTimeout(() => {
            if (!isGlobalView || showCardsPage || showNewsArchive) return;
            if (dashboardRefreshingRef.current) return;
            if (getMainScrollTop() > 0) return;
            const lastGap = Date.now() - (wheelPullRef.current.lastTs || 0);
            if (lastGap > 220) return;
            if (wheelPullRef.current.accum >= 60) {
              wheelPullRef.current.accum = 0;
              wheelPullRef.current.startTs = 0;
              setPullActive(false);
              setPullDistance(0);
              refreshGlobalDashboard({ includeNews: false });
            }
          }, 800);
        }
        wheelPullRef.current.lastTs = nowTs;
        wheelPullRef.current.accum += Math.abs(delta);
      } else if (wheelPullRef.current.accum > 0) {
        wheelPullRef.current.accum = Math.max(0, wheelPullRef.current.accum - delta * 0.15);
      } else {
        return;
      }
      const eased = Math.min(60, wheelPullRef.current.accum);
      if (wheelPullRef.current.accum >= 60) {
        setPullActive(true);
        setPullDistance(eased);
      }
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(() => {
        wheelPullRef.current.accum = 0;
        wheelPullRef.current.startTs = 0;
        if (wheelTriggerTimerRef.current) {
          clearTimeout(wheelTriggerTimerRef.current);
          wheelTriggerTimerRef.current = null;
        }
        setPullActive(false);
        setPullDistance(0);
      }, 1100);
      if (wheelPullRef.current.accum > 60) {
        const nowTs = Date.now();
        const duration = nowTs - (wheelPullRef.current.startTs || 0);
        if (duration < 800) return;
        if (nowTs - (wheelPullRef.current.lastTs || 0) > 220) return;
        wheelPullRef.current.accum = 0;
        wheelPullRef.current.startTs = 0;
        if (wheelTriggerTimerRef.current) {
          clearTimeout(wheelTriggerTimerRef.current);
          wheelTriggerTimerRef.current = null;
        }
        setPullActive(false);
        setPullDistance(0);
        refreshGlobalDashboard({ includeNews: false });
      }
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchstart", handleTouchStartDebug, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchstart", handleTouchStartDebug);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      if (wheelResetTimerRef.current) {
        clearTimeout(wheelResetTimerRef.current);
        wheelResetTimerRef.current = null;
      }
      if (wheelTriggerTimerRef.current) {
        clearTimeout(wheelTriggerTimerRef.current);
        wheelTriggerTimerRef.current = null;
      }
    };
  }, [
    enabled,
    isGlobalView,
    showCardsPage,
    showNewsArchive,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    getMainScrollTop,
    refreshGlobalDashboard,
    setPullActive,
    setPullDistance,
    mainRef,
    dashboardRefreshingRef,
  ]);
}
