// App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/fr";
import { v4 as uuidv4 } from "uuid";
import { Check, Newspaper, Sparkles, Swords, Trophy } from "lucide-react";
import { AppHeader } from "./sections/AppHeader";
import { EditModal } from "./sections/EditModal";
import { Dashboard } from "./sections/Dashboard";
import { GlobalDashboard } from "./sections/GlobalDashboard";
import { NewsArchive } from "./sections/NewsArchive";
import { LoadingScreen } from "./sections/LoadingScreen";
import { BusyOverlay } from "./sections/BusyOverlay";
import { UserCardsPage } from "./sections/UserCardsPage";
import { Toast } from "./components/Toast";
import { InfoPopover } from "./components/InfoPopover";
import { UserHoloCard } from "./components/UserHoloCard";
import { useEditAuth } from "./hooks/useEditAuth";
import { useAppActions } from "./hooks/useAppActions";
import { useAppFilters } from "./hooks/useAppFilters";
import { useAppGestures } from "./hooks/useAppGestures";
import { useAppData } from "./hooks/useAppData";
import { apiGet, apiJson } from "./utils/api";
import { downloadCSV } from "./utils/downloadCSV";
import { parseCSV } from "./utils/parseCSV";
import { capFirst } from "./utils/strings";
import {
  buildCardsPath,
  buildNewsPath,
  buildUserPath,
  readCardParam,
  readFilterParams,
  readRouteState,
} from "./utils/routing";
import { formatKmFixed, getInitialRange, normType, normalizeSession, parseDateValue } from "./utils/appUtils";

dayjs.locale("fr");
dayjs.extend(customParseFormat);

const slugify = (value) => {
  const clean = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return clean || "";
};

const getUserSlug = (user) => slugify(user?.slug || user?.name || "");

/* =========================
   App principale
   ========================= */
export default function App() {
  const FORCE_LOADING = false;
  const { token: authToken, user, isAuth, checking, login, logout: editLogout } = useEditAuth();
  const [error, setError] = useState("");
  const {
    sessions,
    setSessions,
    users,
    seasons,
    activeSeasonInfo,
    newsItems,
    newsLoading,
    newsError,
    notifications,
    notificationsLoading,
    notificationsError,
    activeChallenge,
    sessionLikes,
    cardResults,
    refreshSessions,
    refreshUsers,
    refreshNews,
    refreshNotifications,
    refreshSessionLikes,
    refreshCardResults,
    refreshChallenge,
    setNotifications,
    setNotificationsError,
    setSessionLikes,
    setActiveChallenge,
  } = useAppData({ authToken, isAuth, setError });
  const [showEditModal, setShowEditModal] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [showCardsPage, setShowCardsPage] = useState(false);
  const [cardsFilter, setCardsFilter] = useState("mixte");
  const [showAllCardsFront, setShowAllCardsFront] = useState(false);
  const [hideLockedCards, setHideLockedCards] = useState(false);
  const [scrollToCardId, setScrollToCardId] = useState(null);
  const [toast, setToast] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [authTransition, setAuthTransition] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState("options");
  const [showVictoryCardPreview, setShowVictoryCardPreview] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState(null);
  const toastTimerRef = useRef(null);
  const didInitScrollRef = useRef(false);
  const prevAuthRef = useRef(isAuth);
  const prevUserIdRef = useRef(user?.id || null);
  const authTransitionRef = useRef(isAuth);
  const authTransitionTimerRef = useRef(null);
  const initialFiltersRef = useRef(readFilterParams());
  const loginRedirectRef = useRef(isAuth);
  const rangeTouchedRef = useRef(false);
  const filtersTouchedRef = useRef(false);
  const forceHomeRef = useRef(false);
  const didInitHistoryRef = useRef(false);
  const scrollTopSoonRef = useRef(null);
  const mainRef = useRef(null);
  const dashboardRefreshingRef = useRef(false);
  const lastRefreshTsRef = useRef(0);
  const refreshSpinnerSinceRef = useRef(0);
  const pullToRefreshEnabled = false;

  useEffect(() => {
    scrollTopSoonRef.current = () => {
      const scrollTop = () => {
        const scrollingEl = document.scrollingElement || document.documentElement;
        if (scrollingEl) scrollingEl.scrollTop = 0;
        document.body.scrollTop = 0;
        if (mainRef.current) mainRef.current.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: "auto" });
      };
      requestAnimationFrame(() => requestAnimationFrame(scrollTop));
      setTimeout(scrollTop, 0);
      setTimeout(scrollTop, 80);
      setTimeout(scrollTop, 200);
    };
  }, []);

  const [selectedUser, setSelectedUser] = useState(null);
  const [mode, setMode] = useState(() => readFilterParams().mode || "run");   // all | swim | run
  const [range, setRange] = useState(() => readFilterParams().range || getInitialRange()); // all | month | 6m | 3m | 2026 | 2025
  const [routeState, setRouteState] = useState(readRouteState);
  const [userCardOpen, setUserCardOpen] = useState(readCardParam);
  const [showNewsArchive, setShowNewsArchive] = useState(false);
  const [newsFilter, setNewsFilter] = useState("future");
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullActive, setPullActive] = useState(false);

  const [loadingPhase, setLoadingPhase] = useState("loading"); // loading | fading | done

  useEffect(() => {
    let alive = true;
    let delayTimer = null;
    let fadeTimer = null;
    const start = Date.now();
    const startFade = () => {
      if (!alive) return;
      setLoadingPhase("fading");
      fadeTimer = setTimeout(() => {
        if (alive) setLoadingPhase("done");
      }, 500);
    };
    (async () => {
      try {
        await refreshSessions({ shouldUpdate: () => alive });
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(1500 - elapsed, 0);
        if (!alive) return;
        if (remaining === 0) {
          startFade();
          return;
        }
        delayTimer = setTimeout(startFade, remaining);
      }
    })();
    return () => {
      alive = false;
      if (delayTimer) clearTimeout(delayTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    const initialRange = readFilterParams().range;
    if (initialRange) rangeTouchedRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!dashboardRefreshing) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [dashboardRefreshing]);

  useEffect(() => {
    const hasSeason =
      activeSeasonInfo?.season_number !== null && activeSeasonInfo?.season_number !== undefined;
    if (hasSeason) {
      if (!rangeTouchedRef.current) {
        setRange(`season:${activeSeasonInfo.season_number}`);
      }
      return;
    }
    if (String(range).startsWith("season:")) {
      setRange("month");
      return;
    }
    if (!rangeTouchedRef.current) {
      setRange("month");
    }
  }, [activeSeasonInfo, range]);

  const [selectedUserCardCounts, setSelectedUserCardCounts] = useState(null);

  const refreshGlobalDashboard = async ({ includeNews = true } = {}) => {
    const now = Date.now();
    if (now - lastRefreshTsRef.current < 1200) return;
    if (dashboardRefreshingRef.current) return;
    lastRefreshTsRef.current = now;
    dashboardRefreshingRef.current = true;
    refreshSpinnerSinceRef.current = now;
    setDashboardRefreshing(true);
    try {
      const tasks = [
        refreshSessions(),
        refreshUsers(),
        refreshNotifications(),
        refreshChallenge(),
        refreshSessionLikes(),
      ];
      if (includeNews) tasks.push(refreshNews());
      await Promise.all(tasks);
    } finally {
      const elapsed = Date.now() - (refreshSpinnerSinceRef.current || 0);
      const remaining = Math.max(1500 - elapsed, 0);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setDashboardRefreshing(false);
      dashboardRefreshingRef.current = false;
    }
  };

  const cancelChallenge = async () => {
    if (!isAuth || !authToken) return;
    try {
      await withBusy(async () => {
        await apiJson("POST", "/me/challenge/cancel", null, authToken);
      });
      showToast("Défi annulé");
    } catch (e) {
      showToast("Impossible d'annuler le défi");
    } finally {
      refreshNotifications();
      refreshChallenge();
    }
  };

  const markNotificationsRead = async (ids) => {
    if (!isAuth || !authToken) return;
    try {
      await apiJson("POST", "/me/notifications/read", { ids }, authToken);
      refreshNotifications();
    } catch {
      // ignore
    }
  };

  const toggleSessionLike = async (sessionId) => {
    if (!isAuth || !authToken || !sessionId) return;
    try {
      const res = await apiJson("POST", `/sessions/${sessionId}/like`, null, authToken);
      const liked = !!res?.liked;
      const likesCount = Number(res?.likes_count);
      setSessionLikes((prev) => {
        const next = new Set(prev);
        const key = String(sessionId);
        if (liked) next.add(key);
        else next.delete(key);
        return next;
      });
      if (Number.isFinite(likesCount)) {
        setSessions((prev) =>
          prev.map((s) =>
            String(s.id) === String(sessionId)
              ? { ...s, likes_count: likesCount }
              : s
          )
        );
      }
    } catch {
      showToast("Impossible de liker");
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      const next = readRouteState();
      setRouteState(next);
      setUserCardOpen(readCardParam());
      const { mode: nextMode, range: nextRange } = readFilterParams();
      if (nextMode && nextMode !== mode) setMode(nextMode);
      if (nextRange && nextRange !== range) {
        rangeTouchedRef.current = true;
        setRange(nextRange);
      }
      if (scrollTopSoonRef.current) scrollTopSoonRef.current();
      if (next.type === "root") {
        setShowCardsPage(false);
        setSelectedUser(null);
      }
      if (next.type === "cards") {
        if (!isAuth) {
          setShowCardsPage(false);
          setSelectedUser(null);
        } else {
          setShowCardsPage(true);
          setSelectedUser(null);
        }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isAuth, mode, range]);

  useEffect(() => {
    if (!isAuth) {
      setNotifications([]);
      setNotificationsError("");
      setSessionLikes(new Set());
    }
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth || !authToken) return;
    refreshNotifications();
    refreshChallenge();
    refreshCardResults();
    refreshSessionLikes();
  }, [isAuth, authToken]);


  const activeChallengeDueAt = useMemo(() => {
    if (!activeChallenge?.id) return null;
    const startNotif = notifications.find((n) => {
      const isStartType =
        activeChallenge.type === "evenement"
          ? n.type === "event_start" || n.type === "challenge_start"
          : n.type === "challenge_start";
      if (!isStartType) return false;
      const metaId = n?.meta?.challenge_id ?? n?.meta?.event_id;
      return metaId && String(metaId) === String(activeChallenge.id);
    });
    if (!startNotif?.created_at) return null;
    const start = dayjs(startNotif.created_at);
    if (!start.isValid()) return null;
    const due = activeChallenge.type === "evenement" ? start.endOf("day") : start.add(2, "day");
    return due.toDate();
  }, [activeChallenge, notifications]);

  useEffect(() => {
    if (didInitHistoryRef.current) return;
    didInitHistoryRef.current = true;
    const path = window.location.pathname || "/";
    const isUser = path.match(/^\/user\/([^/]+)\/?$/);
    const isCards = path.match(/^\/cards\/?$/);
    if (!isUser && !isCards) return;
    if (window.history.length > 1) return;
    window.history.replaceState({}, "", "/");
    window.history.pushState({}, "", path);
  }, []);

  useEffect(() => {
    if (!didInitScrollRef.current) {
      didInitScrollRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [range, mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const setAppHeight = () => {
      const isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
      const vv = window.visualViewport;
      const height = isStandalone
        ? window.innerHeight
        : (vv ? vv.height + (vv.offsetTop || 0) : window.innerHeight);
      document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
    };
    setAppHeight();
    window.addEventListener("resize", setAppHeight);
    window.addEventListener("orientationchange", setAppHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setAppHeight);
      window.visualViewport.addEventListener("scroll", setAppHeight);
    }
    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.removeEventListener("orientationchange", setAppHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setAppHeight);
        window.visualViewport.removeEventListener("scroll", setAppHeight);
      }
    };
  }, []);

  useEffect(() => {
    if (!showCardsPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showCardsPage, cardsFilter]);

  useEffect(() => {
    if (!selectedUser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedUser]);

  useEffect(() => {
    const scrollTop = () => window.scrollTo({ top: 0, behavior: "auto" });
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(scrollTop);
      setTimeout(scrollTop, 0);
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [routeState.type, routeState.slug]);

  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const nfDecimal = useMemo(
    () => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    []
  );
  const monthKey = dayjs().format("YYYY-MM");
  const monthLabel = capFirst(dayjs().format("MMMM YYYY"));

  const modeLabel = mode === "swim" ? "Natation" : mode === "run" ? "Running" : null;
  const seasonLabel =
    activeSeasonInfo?.season_number !== null && activeSeasonInfo?.season_number !== undefined
      ? `Saison ${activeSeasonInfo.season_number}`
      : null;
  const victoryBotRankInfo = useMemo(() => {
    if (!victoryInfo?.botId) return null;
    const bots = (users || [])
      .filter((u) => Boolean(u?.is_bot))
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return String(a.name || a.id || "").localeCompare(String(b.name || b.id || ""));
      });
    const index = bots.findIndex((u) => String(u.id) === String(victoryInfo.botId));
    if (index < 0) return null;
    return { index: index + 1, total: bots.length };
  }, [users, victoryInfo]);
  const seasonsSortedAsc = useMemo(() => {
    return [...(seasons || [])].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [seasons]);
  const seasonsSortedDesc = useMemo(() => {
    return [...seasonsSortedAsc].reverse();
  }, [seasonsSortedAsc]);
  const seasonsVisible = useMemo(() => {
    const today = dayjs().startOf("day").valueOf();
    return seasonsSortedDesc.filter((s) => {
      if (!s?.start_date) return false;
      return dayjs(s.start_date).startOf("day").valueOf() <= today;
    });
  }, [seasonsSortedDesc]);
  const seasonRanges = useMemo(() => {
    const map = new Map();
    seasonsSortedAsc.forEach((s, idx) => {
      const next = seasonsSortedAsc[idx + 1];
      map.set(String(s.season_number), {
        season_number: s.season_number,
        start_date: s.start_date || null,
        end_date: next?.start_date || null,
      });
    });
    return map;
  }, [seasonsSortedAsc]);
  const selectedSeasonKey =
    String(range || "").startsWith("season:") ? String(range).split(":")[1] : null;
  const selectedSeasonRange = selectedSeasonKey ? seasonRanges.get(String(selectedSeasonKey)) : null;
  const seasonStartTs = selectedSeasonRange?.start_date
    ? dayjs(selectedSeasonRange.start_date).startOf("day").valueOf()
    : null;
  const seasonEndTs = selectedSeasonRange?.end_date
    ? dayjs(selectedSeasonRange.end_date).startOf("day").valueOf()
    : null;
  const seasonCalendarStartDate = selectedSeasonRange?.start_date || null;
  const seasonCalendarEndDate = (() => {
    if (!selectedSeasonRange?.start_date) return null;
    if (!selectedSeasonRange?.end_date) {
      return dayjs().endOf("day").format("YYYY-MM-DD");
    }
    return dayjs(selectedSeasonRange.end_date).subtract(1, "day").format("YYYY-MM-DD");
  })();
  const rangeOptions = useMemo(() => {
    const seasonOpts = seasonsVisible.map((s) => ({
      key: `season:${s.season_number}`,
      label: `Saison ${s.season_number}`,
    }));
    const base = [
      { key: "all", label: "Historique complet" },
      { key: "month", label: "Mois en cours" },
      { key: "3m", label: "3 Derniers mois" },
      { key: "6m", label: "6 Derniers mois" },
      { key: "2026", label: "Année 2026" },
      { key: "2025", label: "Année 2025" },
    ];
    return seasonOpts.length ? [...seasonOpts, ...base] : base;
  }, [seasonsVisible]);
  const seasonRangeLabel = (() => {
    if (
      selectedSeasonRange?.season_number === null ||
      selectedSeasonRange?.season_number === undefined ||
      !selectedSeasonRange?.start_date
    ) {
      return null;
    }
    const start = dayjs(selectedSeasonRange.start_date).locale("fr").format("D MMMM YYYY");
    if (selectedSeasonRange.end_date) {
      const end = dayjs(selectedSeasonRange.end_date).subtract(1, "day").locale("fr").format("D MMMM YYYY");
      return `Saison ${selectedSeasonRange.season_number} (${start} au ${end})`;
    }
    return `Saison ${selectedSeasonRange.season_number} (${start} au ...)`;
  })();
  const isSeasonRange = String(range).startsWith("season:");
  const rangeLabel =
    range === "all"
      ? "Tout l'historique"
      : range === "month"
        ? "Ce mois-ci"
        : range === "3m"
          ? "Les 3 derniers mois"
          : range === "6m"
            ? "Les 6 derniers mois"
            : isSeasonRange
              ? seasonRangeLabel || seasonLabel
              : /^\d{4}$/.test(range)
                ? `L'annee ${range}`
                : "Cette periode";
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    const prevUserId = prevUserIdRef.current;
    if (!isAuth || isAdmin || !user) {
      prevAuthRef.current = isAuth;
      prevUserIdRef.current = user?.id || null;
      return;
    }
    const justLoggedIn = !wasAuth && isAuth;
    const userChanged = prevUserId && prevUserId !== user.id;
    if (justLoggedIn || userChanged) {
      setShowEditModal(false);
    }
    prevAuthRef.current = isAuth;
    prevUserIdRef.current = user.id;
  }, [isAuth, isAdmin, user, selectedUser]);

  useEffect(() => {
    if (authTransitionRef.current === isAuth) return;
    authTransitionRef.current = isAuth;
    setAuthTransition(true);
    if (authTransitionTimerRef.current) clearTimeout(authTransitionTimerRef.current);
    authTransitionTimerRef.current = setTimeout(() => {
      setAuthTransition(false);
    }, 1000);
  }, [isAuth]);

  const verifyAndLogin = async (payload) => {
    const startedAt = Date.now();
    setAuthTransition(true);
    if (authTransitionTimerRef.current) clearTimeout(authTransitionTimerRef.current);
    try {
      await login(payload);
    } catch (e) {
      const elapsed = Date.now() - startedAt;
      const minMs = 400;
      if (elapsed < minMs) {
        await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
      }
      setAuthTransition(false);
      throw e;
    }
  };

  useEffect(() => {
    return () => {
      if (authTransitionTimerRef.current) clearTimeout(authTransitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const wasAuth = loginRedirectRef.current;
    if (!wasAuth && isAuth) {
      forceHomeRef.current = true;
      setShowCardsPage(false);
      setSelectedUser(null);
      setUserCardOpen(false);
      setShowNewsArchive(false);
      if ((window.location.pathname || "/") !== "/") {
        window.history.replaceState({}, "", "/");
        setRouteState({ type: "root", slug: null });
      }
    }
    loginRedirectRef.current = isAuth;
  }, [isAuth]);

  useEffect(() => {
    if (showEditModal && isAuth && !selectedUser) {
      setShowEditModal(false);
    }
  }, [showEditModal, isAuth, selectedUser]);

  const getSessionsBasePath = () => {
    if (isAdmin && selectedUser && user?.id !== selectedUser.id) {
      return `/users/${selectedUser.id}/sessions`;
    }
    return "/me/sessions";
  };

  const userSessions = useMemo(() => {
    if (!selectedUser) return [];
    return sessions.filter((s) => s.user_id === selectedUser.id);
  }, [sessions, selectedUser]);

  const globalPeriodSessions = useMemo(() => {
    if (range === "all") return sessions;

    const now = dayjs();
    if (range === "month") {
      return sessions.filter((s) => dayjs(s.date).format("YYYY-MM") === monthKey);
    }
    if (range === "6m") {
      return sessions.filter((s) => dayjs(s.date).isAfter(now.subtract(6, "month")));
    }
    if (range === "3m") {
      return sessions.filter((s) => dayjs(s.date).isAfter(now.subtract(3, "month")));
    }
    if (String(range).startsWith("season:") && seasonStartTs !== null) {
      return sessions.filter((s) => {
        const ts = dayjs(s.date).startOf("day").valueOf();
        if (ts < seasonStartTs) return false;
        if (seasonEndTs !== null && ts >= seasonEndTs) return false;
        return true;
      });
    }

    return sessions.filter((s) => dayjs(s.date).format("YYYY") === range);
  }, [sessions, range, monthKey, seasonStartTs, seasonEndTs]);

  const globalShownSessions = useMemo(() => {
    if (mode === "all") return globalPeriodSessions;
    return globalPeriodSessions.filter((s) => normType(s.type) === mode);
  }, [globalPeriodSessions, mode]);

  const monthTotalsByUser = useMemo(() => {
    const map = {};
    globalShownSessions.forEach((s) => {
      if (!s.user_id) return;
      map[s.user_id] = (map[s.user_id] || 0) + (Number(s.distance) || 0);
    });
    return map;
  }, [globalShownSessions]);

  const derivedUsers = useMemo(() => {
    if (users.length) return users;
    const map = new Map();
    sessions.forEach((s) => {
      if (!s.user_id) return;
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { id: s.user_id, name: s.user_name || "Utilisateur" });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [users, sessions]);

  const usersForRouting = useMemo(() => (users.length ? users : derivedUsers), [users, derivedUsers]);

  const userBySlug = useMemo(() => {
    const map = new Map();
    usersForRouting.forEach((u) => {
      const slug = getUserSlug(u);
      if (slug && !map.has(slug)) map.set(slug, u);
    });
    return map;
  }, [usersForRouting]);

  const globalUsers = useMemo(() => {
    if (!derivedUsers.length) return derivedUsers;
    return derivedUsers.filter((u) => !u.is_bot || (monthTotalsByUser?.[u.id] || 0) > 0);
  }, [derivedUsers, monthTotalsByUser]);

  const userRunningAvgById = useMemo(() => {
    const cutoff = dayjs().subtract(3, "month").startOf("day").valueOf();
    const totals = new Map();
    const counts = new Map();
    sessions.forEach((s) => {
      if (!s?.user_id) return;
      if (String(s.type || "").toLowerCase() !== "run") return;
      if (dayjs(s.date).valueOf() < cutoff) return;
      const dist = Number(s.distance) || 0;
      totals.set(s.user_id, (totals.get(s.user_id) || 0) + dist);
      counts.set(s.user_id, (counts.get(s.user_id) || 0) + 1);
    });
    const avg = new Map();
    totals.forEach((totalDist, userId) => {
      const count = counts.get(userId) || 0;
      if (count > 0) avg.set(userId, totalDist / count / 1000);
    });
    return avg;
  }, [sessions]);

  const selectedUserInfo = useMemo(() => {
    if (!selectedUser) return null;
    return users.find((u) => u.id === selectedUser.id) || selectedUser;
  }, [selectedUser, users]);

  useEffect(() => {
    if (forceHomeRef.current) {
      forceHomeRef.current = false;
      if (routeState.type !== "root") {
        setRouteState({ type: "root", slug: null });
      }
      if (selectedUser) setSelectedUser(null);
      if (showCardsPage) setShowCardsPage(false);
      if (userCardOpen) setUserCardOpen(false);
      return;
    }
    if (routeState.type === "root" && selectedUser) {
      const slug = getUserSlug(selectedUser);
      if (slug) {
        setRouteState({ type: "user", slug });
        return;
      }
    }
    if (routeState.type === "cards") {
      if (!isAuth) {
        setShowCardsPage(false);
        setSelectedUser(null);
        setShowNewsArchive(false);
        setUserCardOpen(false);
        if ((window.location.pathname || "/") !== "/") {
          window.history.replaceState({}, "", "/");
          setRouteState({ type: "root", slug: null });
        }
        return;
      }
      if (!showCardsPage) setShowCardsPage(true);
      if (selectedUser) setSelectedUser(null);
      if (showNewsArchive) setShowNewsArchive(false);
      if (userCardOpen) setUserCardOpen(false);
      return;
    }

    if (routeState.type === "news") {
      if (showCardsPage) setShowCardsPage(false);
      if (selectedUser) setSelectedUser(null);
      if (userCardOpen) setUserCardOpen(false);
      if (!showNewsArchive) setShowNewsArchive(true);
      return;
    }

    if (routeState.type === "user") {
      if (!usersForRouting.length) {
        if (!selectedUser) {
          setSelectedUser({ id: `slug:${routeState.slug}`, name: routeState.slug });
        }
        return;
      }
      const match = userBySlug.get(routeState.slug);
      if (match) {
        if (!selectedUser || selectedUser.id !== match.id) {
          setSelectedUser(match);
        }
        if (showCardsPage) setShowCardsPage(false);
        if (showNewsArchive) setShowNewsArchive(false);
        return;
      }
      setSelectedUser(null);
      if (showNewsArchive) setShowNewsArchive(false);
      if (userCardOpen) setUserCardOpen(false);
      if ((window.location.pathname || "/") !== "/") {
        window.history.replaceState({}, "", "/");
        setRouteState({ type: "root", slug: null });
      }
      return;
    }

    if (userCardOpen) setUserCardOpen(false);
    if (showNewsArchive) setShowNewsArchive(false);
  }, [routeState, userBySlug, usersForRouting.length, selectedUser, showCardsPage, showNewsArchive, isAuth, userCardOpen]);

  useEffect(() => {
    if (showNewsArchive) {
      const path = buildNewsPath();
      const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
      if (current !== path) {
        window.history.pushState({}, "", path);
        setRouteState({ type: "news", slug: null });
      }
      return;
    }
    if (routeState.type === "news") {
      return;
    }
    if (showCardsPage) {
      if (!isAuth) {
        setShowCardsPage(false);
        return;
      }
      const path = buildCardsPath(mode, range);
      const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
      if (current !== path) {
        window.history.pushState({}, "", path);
        setRouteState({ type: "cards", slug: null });
      }
      return;
    }
    if (selectedUser) {
      const slug = getUserSlug(selectedUser);
      if (slug) {
        const path = buildUserPath(slug, userCardOpen, mode, range);
        const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
        if (current !== path) {
          window.history.pushState({}, "", path);
          setRouteState({ type: "user", slug });
        }
        return;
      }
    }
    if (routeState.type === "user" && !selectedUser && !usersForRouting.length) {
      return;
    }
    if ((window.location.pathname || "/") !== "/") {
      window.history.pushState({}, "", "/");
      setRouteState({ type: "root", slug: null });
    }
  }, [showCardsPage, showNewsArchive, selectedUser, isAuth, userCardOpen, routeState.type, usersForRouting.length, mode, range]);

  const userRankInfo = useMemo(() => {
    if (!selectedUserInfo || !users.length) return null;
    const isSelectedBot = Boolean(selectedUserInfo.is_bot);
    const baseUsers = users.filter((u) => Boolean(u.is_bot) === isSelectedBot);
    const sorted = [...baseUsers].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
    const idx = sorted.findIndex((u) => u.id === selectedUserInfo.id);
    if (idx === -1) return null;
    return { index: idx + 1, total: sorted.length };
  }, [selectedUserInfo, users]);

  /* ===== Filtre période ===== */
  const periodSessions = useMemo(() => {
    if (range === "all") return userSessions;

    const now = dayjs();
    if (range === "month") {
      return userSessions.filter((s) => dayjs(s.date).format("YYYY-MM") === monthKey);
    }
    if (range === "6m") {
      return userSessions.filter((s) => dayjs(s.date).isAfter(now.subtract(6, "month")));
    }
    if (range === "3m") {
      return userSessions.filter((s) => dayjs(s.date).isAfter(now.subtract(3, "month")));
    }
    if (String(range).startsWith("season:") && seasonStartTs !== null) {
      return userSessions.filter((s) => {
        const ts = dayjs(s.date).startOf("day").valueOf();
        if (ts < seasonStartTs) return false;
        if (seasonEndTs !== null && ts >= seasonEndTs) return false;
        return true;
      });
    }

    return userSessions.filter((s) => dayjs(s.date).format("YYYY") === range);
  }, [userSessions, range, seasonStartTs, seasonEndTs]);

  /* ===== Filtre sport ===== */
  const shownSessions = useMemo(() => {
    if (mode === "all") return periodSessions;
    return periodSessions.filter((s) => normType(s.type) === mode);
  }, [periodSessions, mode]);

  /* ===== Total du mois (mètres) ===== */
  const monthTotals = useMemo(() => {
    let swim = 0, run = 0;
    shownSessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      const d = Number(s.distance) || 0;
      if (normType(s.type) === "run") run += d;
      else swim += d;
    });
    return { all: swim + run, swim, run };
  }, [shownSessions, monthKey]);

  /* ===== Stats globales (moyennes + counts) ===== */
  const stats = useMemo(() => {
    let swimSum = 0, swimN = 0, runSum = 0, runN = 0;

    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") { runSum += d; runN += 1; }
      else { swimSum += d; swimN += 1; }
    });

    const swimAvg = swimN ? Math.round(swimSum / swimN) : 0;
    const runAvg = runN ? Math.round(runSum / runN) : 0;
    const totalN = swimN + runN;
    const totalMeters = swimSum + runSum;

    return { swimAvg, runAvg, swimN, runN, totalN, swimSum, runSum, totalMeters };
  }, [shownSessions]);

  const sportTotals = useMemo(() => {
    let swimSum = 0, runSum = 0;
    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      if (normType(s.type) === "run") runSum += d;
      else swimSum += d;
    });
    return { swimSum, runSum, total: swimSum + runSum };
  }, [shownSessions]);

  const records = useMemo(() => {
    let bestSwim = null;
    let bestRun = null;
    const weekTotals = new Map();
    const daysSet = new Set();
    const daySportCounts = new Map();

    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") {
        if (!bestRun || d > bestRun.distance) bestRun = { distance: d, date: s.date };
      } else {
        if (!bestSwim || d > bestSwim.distance) bestSwim = { distance: d, date: s.date };
      }

      const weekStart = dayjs(s.date).startOf("week");
      const key = weekStart.format("YYYY-MM-DD");
      const prev = weekTotals.get(key) || { total: 0, swim: 0, run: 0, weekStart: weekStart.toISOString() };
      prev.total += d;
      if (t === "run") prev.run += d;
      else prev.swim += d;
      weekTotals.set(key, prev);

      const dayKey = dayjs(s.date).format("YYYY-MM-DD");
      daysSet.add(dayKey);
      const dayPrev = daySportCounts.get(dayKey) || { swim: 0, run: 0 };
      if (t === "run") dayPrev.run += 1;
      else dayPrev.swim += 1;
      daySportCounts.set(dayKey, dayPrev);
    });

    let bestWeek = null;
    weekTotals.forEach((val) => {
      if (!bestWeek || val.total > bestWeek.total) bestWeek = val;
    });

    const days = Array.from(daysSet).sort();
    let streakBest = null;
    let streakLen = 0;
    let streakStart = null;
    let prevDay = null;
    let streakSwim = 0;
    let streakRun = 0;

    days.forEach((day) => {
      const dayCounts = daySportCounts.get(day) || { swim: 0, run: 0 };
      if (!prevDay) {
        streakLen = 1;
        streakStart = day;
        streakSwim = dayCounts.swim;
        streakRun = dayCounts.run;
      } else if (dayjs(day).diff(dayjs(prevDay), "day") === 1) {
        streakLen += 1;
        streakSwim += dayCounts.swim;
        streakRun += dayCounts.run;
      } else {
        streakLen = 1;
        streakStart = day;
        streakSwim = dayCounts.swim;
        streakRun = dayCounts.run;
      }

      if (!streakBest || streakLen > streakBest.length) {
        streakBest = {
          length: streakLen,
          start: streakStart,
          end: day,
          swim: streakSwim,
          run: streakRun,
        };
      }
      prevDay = day;
    });

    return { bestSwim, bestRun, bestWeek, streakBest };
  }, [shownSessions]);

  /* ===== Chaussures running (Nike Pegasus Premium) ===== */
  const shoesConfig = useMemo(() => {
    const baseSource = selectedUser || user;
    if (!baseSource) return null;
    const enrichedSource =
      baseSource.shoe_name && baseSource.shoe_start_date && baseSource.shoe_target_km != null
        ? baseSource
        : users.find((u) => u.id === baseSource.id) || baseSource;
    const source = enrichedSource;
    if (!source) return null;
    const name = String(source.shoe_name || "").trim();
    const startRaw = source.shoe_start_date;
    const targetKm = Number(source.shoe_target_km);
    if (!name || !startRaw || !Number.isFinite(targetKm) || targetKm <= 0) return null;
    const startDate = dayjs(startRaw);
    if (!startDate.isValid()) return null;
    return { name, startDate, targetKm, targetMeters: targetKm * 1000 };
  }, [selectedUser, user]);

  const shoesLife = useMemo(() => {
    if (!shoesConfig) return null;
    let runMeters = 0;
    userSessions.forEach((s) => {
      if (normType(s.type) !== "run") return;
      if (dayjs(s.date).isBefore(shoesConfig.startDate, "day")) return;
      runMeters += Number(s.distance) || 0;
    });
    const used = Math.min(runMeters, shoesConfig.targetMeters);
    const remaining = Math.max(shoesConfig.targetMeters - runMeters, 0);
    const percent = shoesConfig.targetMeters
      ? Math.min((runMeters / shoesConfig.targetMeters) * 100, 100)
      : 0;
    return {
      used,
      remaining,
      percent,
      name: shoesConfig.name,
      targetKm: shoesConfig.targetKm,
      startDate: shoesConfig.startDate.format("YYYY-MM-DD"),
    };
  }, [userSessions, shoesConfig]);

  const shoesLifeByRange = useMemo(() => {
    return shoesLife;
  }, [shoesLife]);

  /* ===== Séances ce mois-ci ===== */
  const monthCounts = useMemo(() => {
    let swimN = 0, runN = 0;
    shownSessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      if (normType(s.type) === "run") runN += 1;
      else swimN += 1;
    });
    return { swimN, runN, totalN: swimN + runN };
  }, [shownSessions, monthKey]);

  const monthCompare = useMemo(() => {
    const now = dayjs();
    const currentKey = now.format("YYYY-MM");
    const lastMonth = now.subtract(1, "month");
    const lastKey = lastMonth.format("YYYY-MM");
    const currentDay = now.date();
    const lastMonthDay = Math.min(currentDay, lastMonth.daysInMonth());

    let currentTotal = 0;
    let lastTotal = 0;
    let currentToDay = 0;
    let lastToDay = 0;

    shownSessions.forEach((s) => {
      const d = dayjs(s.date);
      const key = d.format("YYYY-MM");
      const dist = Number(s.distance) || 0;
      if (key === currentKey) {
        currentTotal += dist;
        if (d.date() <= currentDay) currentToDay += dist;
      } else if (key === lastKey) {
        lastTotal += dist;
        if (d.date() <= lastMonthDay) lastToDay += dist;
      }
    });

    return {
      currentTotal,
      lastTotal,
      currentToDay,
      lastToDay,
      currentDay,
      lastMonthDay,
      currentLabel: capFirst(now.format("MMMM YYYY")),
      lastLabel: capFirst(lastMonth.format("MMMM YYYY")),
    };
  }, [shownSessions]);

  const showCompareInline = range === "3m" || range === "6m";
  const showCompareAbove = range === "all";
  const compareTotalWinner =
    monthCompare.currentTotal === monthCompare.lastTotal
      ? "tie"
      : monthCompare.currentTotal > monthCompare.lastTotal
        ? "current"
        : "last";
  const compareToDayWinner =
    monthCompare.currentToDay === monthCompare.lastToDay
      ? "tie"
      : monthCompare.currentToDay > monthCompare.lastToDay
        ? "current"
        : "last";
  /* ===== Dernière séance ===== */
  const lastSession = useMemo(() => {
    if (!shownSessions.length) return null;
    return shownSessions.reduce((best, s) => {
      if (!best) return s;
      return dayjs(s.date).isAfter(best.date) ? s : best;
    }, null);
  }, [shownSessions]);

  const firstSessionLabel = useMemo(() => {
    if (!shownSessions.length) return null;
    const first = shownSessions.reduce((best, s) => {
      if (!best) return s;
      return dayjs(s.date).isBefore(best.date) ? s : best;
    }, null);
    return first ? capFirst(dayjs(first.date).format("dddd DD MMM YYYY")) : null;
  }, [shownSessions]);

  const lastSessionDay = useMemo(() => (lastSession ? dayjs(lastSession.date) : null), [lastSession]);
  const daysSinceLast = useMemo(() => (lastSessionDay ? dayjs().diff(lastSessionDay, "day") : null), [lastSessionDay]);
  const lastLabel = lastSessionDay ? capFirst(lastSessionDay.format("dddd DD MMM YYYY")) : "Aucune";
  const lastType = lastSession ? normType(lastSession.type) : null;
  const canEditSelected = !!selectedUser && (isAdmin || user?.id === selectedUser.id);

  const { showToast, withBusy, guard } = useAppActions({
    setToast,
    setIsBusy,
    toastTimerRef,
    canEditSelected,
    checking,
    isAuth,
    selectedUser,
    onRequireAuth: () => setShowEditModal(true),
    busyMinMs: 500,
    toastMs: 2400,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    const strava = params.get("strava");
    if (!strava) return;
    if (strava === "connected") {
      showToast("Strava connecté");
    } else if (strava === "error") {
      showToast("Connexion Strava échouée");
    }
    params.delete("strava");
    const next = params.toString();
    const base = window.location.pathname || "/";
    const hash = window.location.hash || "";
    const url = next ? `${base}?${next}${hash}` : `${base}${hash}`;
    window.history.replaceState({}, "", url);
  }, [showToast]);

  /* ===== CRUD ===== */

  const addSession = guard(async (payload) => {
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      const body = { id: payload.id, distance: payload.distance, date: payload.date, type: payload.type };
      const created = await apiJson("POST", basePath, body, authToken);
      const createdWithName = { ...created, user_name: selectedUser?.name };
      setSessions((prev) => [...prev, normalizeSession(createdWithName)]);
      if (created?.challenge_completed && created?.challenge) {
        setVictoryInfo({
          botId: created.challenge.bot_id,
          botName: created.challenge.bot_name || "un bot",
          distanceKm: Number(created.challenge.target_distance_m) / 1000,
          actualKm: Number(payload.distance) / 1000,
        });
      }
      refreshNotifications();
      refreshChallenge();
      refreshCardResults();
    });
    setShowEditModal(false);
    showToast("Seance ajoutée");
  });

  const handleLogout = () => {
    editLogout();
    setSelectedUser(null);
    setShowCardsPage(false);
    setShowNewsArchive(false);
    setRouteState({ type: "root", slug: null });
  };

  const deleteSession = guard(async (id) => {
    if (!window.confirm("Confirmer la suppression de cette seance ?")) return;
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      await apiJson("DELETE", `${basePath}/${id}`, undefined, authToken);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    });
    setShowEditModal(false);
    showToast("Seance supprimée");
  });

  const editSession = guard(async (id, updated) => {
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      await apiJson("PUT", `${basePath}/${id}`, updated, authToken);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? normalizeSession({ ...s, ...updated }) : s))
      );
    });
    setShowEditModal(false);
    showToast("Seance modifiée");
  });

  const importCSV = guard(async (file) => {
    if (!file) return;
    if (!window.confirm("Confirmer l'import du fichier CSV ?")) return;
    const basePath = getSessionsBasePath();
    const imported = await withBusy(async () => {
      const text = await file.text();
      const rows = parseCSV(text);
      const normalized = [];

      rows.forEach((row) => {
        if (!row || row.length < 2) return;
        const date = String(row[0] ?? "").trim();
        if (!date || date.toLowerCase() === "date") return;
        const parsedDate = parseDateValue(date);
        if (!parsedDate.isValid()) return;
        const distance = Number(String(row[1] ?? "").trim().replace(",", "."));
        if (!Number.isFinite(distance)) return;
        const typeRaw = String(row[2] ?? "").trim();
        const type = typeRaw ? normType(typeRaw) : "swim";
        normalized.push({ date: parsedDate.format("YYYY-MM-DD"), distance, type });
      });

      if (!normalized.length) return 0;

      const created = [];
      for (const row of normalized) {
        const body = { id: uuidv4(), distance: row.distance, date: row.date, type: row.type };
        const item = await apiJson("POST", basePath, body, authToken);
        created.push({ ...item, user_name: selectedUser?.name });
      }
      if (created.length) setSessions((prev) => [...prev, ...created.map(normalizeSession)]);
      return created.length;
    });

    if (imported) {
      setShowEditModal(false);
      showToast("Import terminé");
    }
  });

  const exportCSV = async () => {
    const sanitizeFilenamePart = (value) => {
      const clean = String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return clean || "user";
    };
    const namePart = sanitizeFilenamePart(headerTitle || user?.name);
    const datePart = dayjs().format("YYYY-MM-DD");
    await withBusy(() => {
      downloadCSV(`sessions-${namePart}-${datePart}.csv`, userSessions);
    });
    setShowEditModal(false);
    showToast("Export terminé");
  };

  const showMonthCardsOnlyWhenAllRange = range === "all";
  const showMonthlyChart = range !== "month" && !isSeasonRange;
  const hasSessions = shownSessions.length > 0;
  const isGlobalView = !selectedUser;
  const headerTitle = selectedUser ? selectedUser.name : null;
  const showEditorButton = isGlobalView || (!user || isAdmin || user?.id === selectedUser?.id);

  useEffect(() => {
    if (isGlobalView || showCardsPage || showNewsArchive) {
      setAdminPanelOpen(false);
    }
  }, [isGlobalView, showCardsPage, showNewsArchive]);
  const cardsUnlockedCounts = useMemo(() => {
    const counts = { defi: 0, rare: 0, evenement: 0 };
    const totals = { defi: 0, rare: 0, evenement: 0 };
    (users || []).forEach((u) => {
      if (!u?.is_bot) return;
      const type = String(u?.bot_card_type || "").toLowerCase();
      if (type === "defi" || type === "rare" || type === "evenement") {
        totals[type] += 1;
      }
    });
    const seen = { defi: new Set(), rare: new Set(), evenement: new Set() };
    (cardResults || []).forEach((r) => {
      const type = String(r?.type || "").toLowerCase();
      const botId = r?.bot_id ?? r?.botId ?? null;
      if (!botId) return;
      if (type === "defi" || type === "rare" || type === "evenement") {
        if (!seen[type].has(String(botId))) {
          seen[type].add(String(botId));
          counts[type] += 1;
        }
      }
    });
    return {
      ...counts,
      defiTotal: totals.defi,
      rareTotal: totals.rare,
      evenementTotal: totals.evenement,
    };
  }, [cardResults, users]);

  useEffect(() => {
    if (!isAuth) return;
    const victoryTypes = new Set(["defi", "rare", "evenement"]);
    const results = (cardResults || [])
      .filter((r) => victoryTypes.has(String(r?.type || "").toLowerCase()))
      .slice()
      .sort((a, b) => {
        const aTs = dayjs(a?.achieved_at_time || a?.achieved_at || 0).valueOf();
        const bTs = dayjs(b?.achieved_at_time || b?.achieved_at || 0).valueOf();
        if (aTs !== bTs) return bTs - aTs;
        return String(b?.id || "").localeCompare(String(a?.id || ""));
      });
    const latest = results[0];
    if (!latest?.id) return;

    const storageKey = "natrack:lastVictoryCardResultId";
    const lastSeen = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (victoryInfo) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(latest.id));
      }
      return;
    }
    if (lastSeen && String(lastSeen) === String(latest.id)) return;

    const botName = latest.bot_name || "un bot";
    const distanceKm = Number(latest.target_distance_m) / 1000;
    const actualKm = Number(latest.distance_m) / 1000;
    setVictoryInfo({
      botId: latest.bot_id,
      botName,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
      actualKm: Number.isFinite(actualKm) ? actualKm : null,
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(latest.id));
    }
  }, [cardResults, isAuth, victoryInfo]);

  useEffect(() => {
    if (!selectedUserInfo?.id || !isAuth || !authToken) {
      setSelectedUserCardCounts(null);
      return;
    }
    if (user?.id && String(selectedUserInfo.id) === String(user.id)) {
      setSelectedUserCardCounts(cardsUnlockedCounts);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await apiGet(`/users/${selectedUserInfo.id}/card-results-counts`, authToken);
        if (alive) setSelectedUserCardCounts(data || null);
      } catch {
        if (alive) setSelectedUserCardCounts(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedUserInfo?.id, isAuth, authToken, user?.id, cardsUnlockedCounts]);

  const { handleRangeChange, handleModeChange } = useAppFilters({
    mode,
    range,
    showNewsArchive,
    userCardOpen,
    setMode,
    setRange,
    initialFiltersRef,
    rangeTouchedRef,
    filtersTouchedRef,
  });

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    const slug = getUserSlug(u);
    if (slug) setRouteState({ type: "user", slug });
    if (scrollTopSoonRef.current) scrollTopSoonRef.current();
  };

  const handleOpenMyOptions = () => {
    if (user) {
      const slug = getUserSlug(user);
      const matched =
        usersForRouting.find((u) => String(u.id) === String(user.id)) ||
        usersForRouting.find((u) => getUserSlug(u) === slug) ||
        null;
      setShowCardsPage(false);
      setShowNewsArchive(false);
      setUserCardOpen(false);
      if (matched) {
        setSelectedUser(matched);
        if (slug) setRouteState({ type: "user", slug });
      } else if (slug) {
        setSelectedUser(user);
        setRouteState({ type: "user", slug });
      }
      if (scrollTopSoonRef.current) scrollTopSoonRef.current();
    }
    setEditModalInitialTab("options");
    setShowEditModal(true);
  };

  const handleBack = () => {
    if (showCardsPage) {
      setShowCardsPage(false);
      setRouteState({ type: "root", slug: null });
      if (scrollTopSoonRef.current) scrollTopSoonRef.current();
      return;
    }
    if (showNewsArchive) {
      setShowNewsArchive(false);
      setRouteState({ type: "root", slug: null });
      if (scrollTopSoonRef.current) scrollTopSoonRef.current();
      return;
    }
    if (selectedUser) {
      setRouteState({ type: "root", slug: null });
      setSelectedUser(null);
      if (scrollTopSoonRef.current) scrollTopSoonRef.current();
    }
  };

  useAppGestures({
    enabled: pullToRefreshEnabled,
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
  });

  if (loadingPhase !== "done" || FORCE_LOADING) {
    return <LoadingScreen loadingPhase={loadingPhase} forceLoading={FORCE_LOADING} />;
  }

  return (
    <div
      className="
        app-root
        min-h-[100dvh]
        flex flex-col
        relative
        bg-gradient-to-b
        from-slate-100 via-slate-50 to-slate-50
        dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]
        text-[13.5px] sm:text-[14px]
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <img
          src="/apple-touch-icon.png"
          alt=""
          aria-hidden="true"
          className="w-[90vw] max-w-[1200px] opacity-[0.48] blur-2xl dark:opacity-[0.32]"
        />
      </div>

      {authTransition && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen loadingPhase="loading" forceLoading />
        </div>
      )}
      <div className="relative z-10">
        <AppHeader
          range={range}
          mode={mode}
          isAuth={isAuth}
          showEditor={!showCardsPage && !showNewsArchive && showEditorButton}
          showFilters={!showCardsPage && !showNewsArchive}
          filtersHidden={adminPanelOpen}
          onRefresh={
            isGlobalView && !showCardsPage && !showNewsArchive ? () => refreshGlobalDashboard() : null
          }
          isRefreshing={dashboardRefreshing}
          newsFilter={showNewsArchive ? newsFilter : null}
          onNewsFilterChange={setNewsFilter}
          editorVariant={isGlobalView && isAuth ? "user" : "logout"}
          rangeOptions={rangeOptions}
          cardsFilter={
            showCardsPage
              ? {
                  value: cardsFilter,
                  onChange: setCardsFilter,
                }
              : null
          }
          cardsExtraAction={
            showCardsPage && isAdmin
              ? {
                  label: showAllCardsFront ? "Masquer" : "Tout afficher",
                  active: showAllCardsFront,
                  onClick: () => setShowAllCardsFront((prev) => !prev),
                }
              : null
          }
          cardsHideLockedAction={
            showCardsPage
              ? {
                  active: hideLockedCards,
                  onClick: () => setHideLockedCards((prev) => !prev),
                }
              : null
          }
          cardsUnlockedCounts={showCardsPage ? cardsUnlockedCounts : null}
          title={headerTitle}
          editorTargetName={headerTitle}
          loggedUserName={user?.name}
          onOpenEditor={() => {
            if (isGlobalView && isAuth && user) {
              setSelectedUser(user);
              return;
            }
            if (isAuth) {
              if (!window.confirm("Se déconnecter ?")) return;
              handleLogout();
              return;
            }
            setEditModalInitialTab("options");
            setShowEditModal(true);
          }}
          onModeChange={handleModeChange}
          onRangeChange={handleRangeChange}
          onBack={showCardsPage || showNewsArchive || !isGlobalView ? handleBack : null}
        />
        <div className="fixed bottom-6 left-4 z-40 text-xs text-slate-500 dark:text-slate-400 sm:bottom-8 sm:left-8">
          <span className="rounded-full bg-slate-200 px-2 py-1 shadow-sm dark:bg-slate-800">
            Alpha 0.0.11{seasonLabel ? ` · ${seasonLabel}` : ""}
          </span>
        </div>

        <main
          ref={mainRef}
          className="flex-1 pb-6"
          style={{ paddingTop: "var(--main-top-padding)" }}
        >
          <div className={showCardsPage ? "mx-auto" : "mx-auto max-w-[1550px]"}>
            {error && (
              <p className="mb-3 rounded-xl bg-rose-100 px-4 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                {error}
              </p>
            )}

            <Toast message={toast} />
            <BusyOverlay open={isBusy} />
            <InfoPopover
              open={!!victoryInfo}
              onClose={() => {
                setVictoryInfo(null);
                setShowVictoryCardPreview(false);
              }}
              title=""
              actionLabel={null}
              headerImage={null}
              items={
                victoryInfo
                  ? [
                      <div key="victory" className="grid gap-5">
                        <div className="px-2 pt-2 text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                                  <Trophy size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
                                    Victoire !
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <ul className="grid gap-2 text-sm sm:text-base">
                                  <li className="flex items-center gap-2">
                                    <Check size={18} className="text-emerald-500" />
                                    <span>
                                      Bot battu : <span className="font-semibold">{victoryInfo.botName}</span>
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check size={18} className="text-emerald-500" />
                                    <span>
                                      Ta distance :{" "}
                                      <span className="font-semibold">
                                        {Number.isFinite(victoryInfo.actualKm) ? `${formatKmFixed(victoryInfo.actualKm)} km` : "—"}
                                      </span>
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check size={18} className="text-emerald-500" />
                                    <span>
                                      Objectif :{" "}
                                      <span className="font-semibold">
                                        {Number.isFinite(victoryInfo.distanceKm) ? `${formatKmFixed(victoryInfo.distanceKm)} km` : "—"}
                                      </span>
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window === "undefined") return;
                                if (window.innerWidth < 768) return;
                                setShowVictoryCardPreview(true);
                              }}
                              className="hidden md:flex h-[170px] w-[140px] -ml-8 shrink-0 overflow-hidden self-start cursor-zoom-in"
                              aria-label="Ouvrir la carte"
                            >
                              <div className="pointer-events-none w-full">
                                <div className="origin-top-right rounded-2xl md:scale-[0.32] md:-translate-x-20">
                                  <UserHoloCard
                                    user={users.find((u) => String(u.id) === String(victoryInfo.botId)) || { name: victoryInfo.botName }}
                                    nfDecimal={nfDecimal}
                                    showBotAverage
                                    minSpinnerMs={500}
                                    userRankInfo={victoryBotRankInfo}
                                  />
                                </div>
                              </div>
                            </button>
                          </div>
                          <div className="pointer-events-none mt-6 flex justify-center md:hidden">
                            <div className="h-[265px] w-[185px] overflow-hidden">
                              <div className="origin-top rounded-2xl scale-[0.48] -translate-x-10">
                                <UserHoloCard
                                  user={users.find((u) => String(u.id) === String(victoryInfo.botId)) || { name: victoryInfo.botName }}
                                  nfDecimal={nfDecimal}
                                  showBotAverage
                                  minSpinnerMs={0}
                                  autoTiltOnMobile={false}
                                  userRankInfo={victoryBotRankInfo}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mb-6 flex justify-center md:mt-10">
                            <button
                              type="button"
                              onClick={() => {
                                setVictoryInfo(null);
                                setSelectedUser(null);
                                setUserCardOpen(false);
                                setShowCardsPage(true);
                                if (victoryInfo?.botId) {
                                  setScrollToCardId(String(victoryInfo.botId));
                                }
                                setRouteState({ type: "cards", slug: null });
                              }}
                              className="rounded-full border border-emerald-300/80 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                            >
                              Voir dans les cartes
                            </button>
                          </div>
                        </div>
                      </div>,
                    ]
                  : []
              }
              fullWidth
              maxWidth={720}
              anchorRect={null}
            />
            {showVictoryCardPreview && victoryInfo && typeof document !== "undefined"
              ? createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center px-[30px] sm:px-4"
                  onMouseDownCapture={(e) => e.stopPropagation()}
                  onTouchStartCapture={(e) => e.stopPropagation()}
                >
                  <div
                    className="absolute inset-0 bg-black/80"
                    onClick={() => setShowVictoryCardPreview(false)}
                    aria-hidden="true"
                  />
                  <div className="relative w-full max-w-[360px] mx-auto">
                    <UserHoloCard
                      user={users.find((u) => String(u.id) === String(victoryInfo.botId)) || { name: victoryInfo.botName }}
                      nfDecimal={nfDecimal}
                      showBotAverage
                      minSpinnerMs={500}
                      userRankInfo={victoryBotRankInfo}
                      elevated
                    />
                  </div>
                </div>,
                document.body
              )
              : null}

            {isGlobalView ? (
            showNewsArchive ? (
                <NewsArchive newsItems={newsItems} loading={newsLoading} error={newsError} filter={newsFilter} />
              ) : showCardsPage ? (
                <UserCardsPage
                  users={users}
                  nfDecimal={nfDecimal}
                  userRunningAvgById={userRunningAvgById}
                  filter={cardsFilter}
                  isAdmin={isAdmin}
                  currentUserId={user?.id || null}
                  showAllCardsFront={showAllCardsFront}
                  hideLockedCards={hideLockedCards}
                  isAuth={isAuth}
                  authToken={authToken}
                  cardResults={cardResults}
                  scrollToUserId={scrollToCardId}
                  onSelectUser={(u) => {
                    setShowCardsPage(false);
                    setUserCardOpen(false);
                    setScrollToCardId(null);
                    const slug = getUserSlug(u);
                    if (slug) setRouteState({ type: "user", slug });
                    handleSelectUser(u);
                  }}
                />
              ) : (
                <GlobalDashboard
                  rangeLabel={rangeLabel}
                  modeLabel={modeLabel}
                  mode={mode}
                  range={range}
                  activeSeasonNumber={activeSeasonInfo?.season_number ?? null}
                  users={globalUsers}
                  allUsers={usersForRouting}
                  totalsByUser={monthTotalsByUser}
                  sessions={globalShownSessions}
                  nfDecimal={nfDecimal}
                  onSelectUser={handleSelectUser}
                  currentUserId={user?.id || null}
                  sessionLikes={sessionLikes}
                  onToggleSessionLike={toggleSessionLike}
                  isRefreshing={dashboardRefreshing}
                  pullActive={pullActive}
                  pullDistance={pullDistance}
                  onRefresh={refreshGlobalDashboard}
                  onOpenCards={() => {
                    setShowCardsPage(true);
                    setRouteState({ type: "cards", slug: null });
                  }}
                  onOpenNewsArchive={() => {
                    setShowNewsArchive(true);
                    setRouteState({ type: "news", slug: null });
                  }}
                  onCancelChallenge={cancelChallenge}
                  isAdmin={isAdmin}
                  isAuth={isAuth}
                  notifications={notifications}
                  notificationsLoading={notificationsLoading}
                  notificationsError={notificationsError}
                  onRefreshNotifications={refreshNotifications}
                  onMarkNotificationRead={markNotificationsRead}
                  activeChallenge={activeChallenge}
                  newsItems={newsItems}
                  newsLoading={newsLoading}
                  newsError={newsError}
                  onOpenMyOptions={handleOpenMyOptions}
                />
              )
            ) : (
                <Dashboard
                  hasSessions={hasSessions}
                  mode={mode}
                  range={range}
                  modeLabel={modeLabel}
                  rangeLabel={rangeLabel}
                  userName={headerTitle}
                  userInfo={selectedUserInfo}
                  allUsers={usersForRouting}
                  notifications={notifications}
                  activeSeasonNumber={activeSeasonInfo?.season_number ?? null}
                  seasonStartDate={seasonCalendarStartDate}
                  seasonEndDate={seasonCalendarEndDate}
                  userRankInfo={userRankInfo}
                  userRunningAvgById={userRunningAvgById}
                  userCardOpen={userCardOpen}
                  onUserCardOpenChange={setUserCardOpen}
                  currentUserId={user?.id || null}
                  isAdmin={isAdmin}
                  isBusy={isBusy}
                  canEditSelected={canEditSelected}
                  adminSessions={canEditSelected ? userSessions : sessions.filter((s) => s.user_id === user?.id)}
                  onAddSession={addSession}
                  onEditSession={editSession}
                  onDeleteSession={deleteSession}
                  onExportSessions={exportCSV}
                  onImportSessions={importCSV}
                  adminPanelOpen={adminPanelOpen}
                  onAdminPanelOpenChange={setAdminPanelOpen}
                  authToken={authToken}
                  cardsUnlockedCounts={selectedUserCardCounts}
                  activeChallenge={activeChallenge}
                  activeChallengeDueAt={activeChallengeDueAt}
                  shownSessions={shownSessions}
                  stats={stats}
                  monthTotals={monthTotals}
                monthCounts={monthCounts}
                monthLabel={monthLabel}
                lastLabel={lastLabel}
                lastType={lastType}
                daysSinceLast={daysSinceLast}
                showMonthCardsOnlyWhenAllRange={showMonthCardsOnlyWhenAllRange}
                showMonthlyChart={showMonthlyChart}
                showCompareInline={showCompareInline}
                showCompareAbove={showCompareAbove}
                monthCompare={monthCompare}
                compareTotalWinner={compareTotalWinner}
                compareToDayWinner={compareToDayWinner}
                records={records}
                sportTotals={sportTotals}
                shoesLifeByRange={shoesLifeByRange}
                firstSessionLabel={firstSessionLabel}
                nf={nf}
                nfDecimal={nfDecimal}
              />
            )}
            {isAdmin && isGlobalView && !showCardsPage && !showNewsArchive && (
              <div className="flex justify-end gap-2 px-4 xl:px-8">
                <button
                  type="button"
                  aria-label="Test notif défi"
                  title="Test notif défi"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("admin:open-notifs", { detail: { kind: "defi" } }));
                    }
                  }}
                  className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <Swords size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Test notif rare"
                  title="Test notif rare"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("admin:open-notifs", { detail: { kind: "rare" } }));
                    }
                  }}
                  className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <Sparkles size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Test notif event"
                  title="Test notif event"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("admin:open-notifs", { detail: { kind: "event" } }));
                    }
                  }}
                  className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <Newspaper size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Test popup victoire"
                  title="Test popup victoire"
                  onClick={() => {
                    const bot =
                      (users || []).find((u) => Boolean(u?.is_bot)) ||
                      (users || [])[0] ||
                      { id: "test-bot", name: "Bot test", is_bot: true };
                    setVictoryInfo({
                      botId: bot.id,
                      botName: bot.name || "Bot test",
                      distanceKm: 5,
                      actualKm: 6.2,
                    });
                  }}
                  className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <Trophy size={16} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 h-[6px] bg-gradient-to-r from-sky-400 via-lime-300 to-emerald-300"
        aria-hidden="true"
      />
      <EditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        isBusy={isBusy}
        isAuth={isAuth}
        verifyAndLogin={verifyAndLogin}
        logout={editLogout}
        sessions={canEditSelected ? userSessions : sessions.filter((s) => s.user_id === user?.id)}
        readOnly={!canEditSelected}
        targetName={headerTitle}
        loggedUserName={user?.name}
        isAdmin={isAdmin}
        onAdd={addSession}
        onEdit={editSession}
        onDelete={deleteSession}
        onExport={exportCSV}
        onImport={importCSV}
        initialTab={editModalInitialTab}
      />
    </div>
  );
}
