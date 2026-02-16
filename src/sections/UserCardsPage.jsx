import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { Trophy } from "lucide-react";
import { UserHoloCard } from "../components/UserHoloCard";
import { InfoPopover } from "../components/InfoPopover";
import { apiGet, apiJson } from "../utils/api";
import { formatKmFixed } from "../utils/appUtils";

export function UserCardsPage({
  users,
  sessions = [],
  activeSeasonInfo = null,
  nfDecimal,
  onSelectUser,
  onOpenResults,
  filter = "mixte",
  userRunningAvgById,
  isAdmin = false,
  currentUserId = null,
  showAllCardsFront = false,
  hideLockedCards = false,
  isAuth = false,
  authToken = null,
  cardResults = [],
  userCardResults = [],
  onUserCardResultsSaved,
  scrollToUserId = null,
  compactView: compactViewProp = null,
  onCompactViewChange = null,
}) {
  const [showResultsInfo, setShowResultsInfo] = useState(false);
  const [resultsUser, setResultsUser] = useState(null);
  const [resultsRows, setResultsRows] = useState([]);
  const [resultsMessage, setResultsMessage] = useState("");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const [resultsCount, setResultsCount] = useState(0);
  const [highlightId, setHighlightId] = useState(null);
  const [highlightFadeOut, setHighlightFadeOut] = useState(false);
  const [compactViewLocal, setCompactViewLocal] = useState(false);
  const userCardSyncRef = useRef(new Set());
  const compactView = compactViewProp ?? compactViewLocal;
  const setCompactView = useCallback(
    (next) => {
      const nextValue = typeof next === "function" ? next(compactView) : next;
      if (compactViewProp === null || compactViewProp === undefined) {
        setCompactViewLocal(nextValue);
      }
      onCompactViewChange?.(nextValue);
    },
    [compactView, compactViewProp, onCompactViewChange]
  );
  const [previewUser, setPreviewUser] = useState(null);
  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  }, [users]);

  const { usersOnlyByDate, botsOnlyByDate, botsOnlyByAvg } = useMemo(() => {
    const realUsers = [];
    const bots = [];
    sorted.forEach((u) => {
      if (u?.is_bot) bots.push(u);
      else realUsers.push(u);
    });
    const botsByAvg = [...bots].sort((a, b) => {
      const aVal = Number.isFinite(Number(a?.avg_distance_m)) ? Number(a.avg_distance_m) : null;
      const bVal = Number.isFinite(Number(b?.avg_distance_m)) ? Number(b.avg_distance_m) : null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return aVal - bVal;
    });
    return { usersOnlyByDate: realUsers, botsOnlyByDate: bots, botsOnlyByAvg: botsByAvg };
  }, [sorted]);

  const realUserIdSet = useMemo(() => {
    const set = new Set();
    usersOnlyByDate.forEach((u) => {
      if (u?.id !== undefined && u?.id !== null) set.add(String(u.id));
    });
    return set;
  }, [usersOnlyByDate]);

  const botsByAvgDesc = useMemo(() => {
    const list = [...botsOnlyByAvg];
    return list.sort((a, b) => {
      const aVal = Number.isFinite(Number(a?.avg_distance_m)) ? Number(a.avg_distance_m) : null;
      const bVal = Number.isFinite(Number(b?.avg_distance_m)) ? Number(b.avg_distance_m) : null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return bVal - aVal;
    });
  }, [botsOnlyByAvg]);

  const { userRankById, botRankById } = useMemo(() => {
    const userRanks = new Map();
    const botRanks = new Map();
    usersOnlyByDate.forEach((u, idx) => userRanks.set(u.id, idx + 1));
    botsOnlyByDate.forEach((u, idx) => botRanks.set(u.id, idx + 1));
    return { userRankById: userRanks, botRankById: botRanks };
  }, [usersOnlyByDate, botsOnlyByDate]);

  const getUserAvg = useCallback((u) => {
    const byMap = userRunningAvgById?.get?.(u.id);
    if (Number.isFinite(byMap)) return byMap;
    const fallback = Number(u?.avg_distance_m);
    return Number.isFinite(fallback) ? fallback / 1000 : null;
  }, [userRunningAvgById]);

  const usersSortedByAvg = useMemo(() => {
    const list = [...usersOnlyByDate];
    const withAvg = [];
    const withoutAvg = [];
    list.forEach((u) => {
      const avg = getUserAvg(u);
      if (avg === null) withoutAvg.push(u);
      else withAvg.push({ u, avg });
    });
    withAvg.sort((a, b) => b.avg - a.avg);
    return [...withAvg.map((x) => x.u), ...withoutAvg];
  }, [usersOnlyByDate, getUserAvg]);

  const unlockedBotIds = useMemo(() => {
    const set = new Set();
    (cardResults || []).forEach((r) => {
      if (r?.bot_id !== undefined && r?.bot_id !== null) set.add(String(r.bot_id));
      if (r?.bot_name) set.add(`name:${String(r.bot_name).toLowerCase()}`);
    });
    return set;
  }, [cardResults]);

  const seasonBounds = useMemo(() => {
    const startRaw = activeSeasonInfo?.start_date || null;
    if (!startRaw) return null;
    const start = dayjs(startRaw).startOf("day");
    if (!start.isValid()) return null;
    const end = activeSeasonInfo?.next_start_date
      ? dayjs(activeSeasonInfo.next_start_date).subtract(1, "day").endOf("day")
      : dayjs().endOf("day");
    return { start, end };
  }, [activeSeasonInfo]);

  const computedUserCardResults = useMemo(() => {
    if (!currentUserId || !seasonBounds) return [];
    const { start, end } = seasonBounds;
    const byUser = new Map();
    (sessions || []).forEach((s) => {
      if (!s?.user_id || !s?.date) return;
      if (!realUserIdSet.has(String(s.user_id))) return;
      const type = String(s.type || "").toLowerCase();
      if (type !== "run") return;
      const d = dayjs(s.date);
      if (!d.isValid()) return;
      if (d.isBefore(start, "day") || d.isAfter(end, "day")) return;
      const dateKey = d.format("YYYY-MM-DD");
      const dist = Number(s.distance) || 0;
      if (!byUser.has(s.user_id)) byUser.set(s.user_id, new Map());
      const map = byUser.get(s.user_id);
      const prev = map.get(dateKey) || 0;
      if (dist > prev) map.set(dateKey, dist);
    });
    const myMap = byUser.get(currentUserId);
    if (!myMap) return [];
    const results = [];
    byUser.forEach((dateMap, userId) => {
      if (String(userId) === String(currentUserId)) return;
      dateMap.forEach((otherDist, dateKey) => {
        const myDist = myMap.get(dateKey);
        if (!myDist || myDist < otherDist) return;
        results.push({
          target_user_id: userId,
          achieved_at: dateKey,
          distance_m: myDist,
          target_distance_m: otherDist,
        });
      });
    });
    return results;
  }, [sessions, currentUserId, seasonBounds, realUserIdSet]);

  const combinedUserCardResults = useMemo(() => {
    const map = new Map();
    (userCardResults || []).forEach((r) => {
      if (!r?.target_user_id || !r?.achieved_at) return;
      map.set(`${r.target_user_id}|${r.achieved_at}`, r);
    });
    (computedUserCardResults || []).forEach((r) => {
      if (!r?.target_user_id || !r?.achieved_at) return;
      const key = `${r.target_user_id}|${r.achieved_at}`;
      if (!map.has(key)) map.set(key, r);
    });
    return Array.from(map.values());
  }, [userCardResults, computedUserCardResults]);

  const userResultsCountById = useMemo(() => {
    const map = new Map();
    (combinedUserCardResults || []).forEach((r) => {
      if (!r?.target_user_id) return;
      const key = String(r.target_user_id);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [combinedUserCardResults]);

  const unlockedUserIds = useMemo(() => {
    const set = new Set();
    (combinedUserCardResults || []).forEach((r) => {
      if (r?.target_user_id !== undefined && r?.target_user_id !== null) {
        set.add(String(r.target_user_id));
      }
    });
    if (currentUserId !== null && currentUserId !== undefined) {
      set.add(String(currentUserId));
    }
    return set;
  }, [combinedUserCardResults, currentUserId]);

  useEffect(() => {
    if (!isAuth || !authToken) return;
    if (!computedUserCardResults.length) return;
    const existing = new Set(
      (userCardResults || [])
        .filter((r) => r?.target_user_id && r?.achieved_at)
        .map((r) => `${r.target_user_id}|${r.achieved_at}`)
    );
    const pending = computedUserCardResults.filter((r) => {
      const key = `${r.target_user_id}|${r.achieved_at}`;
      if (existing.has(key)) return false;
      if (userCardSyncRef.current.has(key)) return false;
      return true;
    });
    if (!pending.length) return;
    pending.forEach((r) => userCardSyncRef.current.add(`${r.target_user_id}|${r.achieved_at}`));
    (async () => {
      try {
        await apiJson("POST", "/me/user-card-results", { results: pending }, authToken);
        onUserCardResultsSaved?.();
      } catch {
        pending.forEach((r) => userCardSyncRef.current.delete(`${r.target_user_id}|${r.achieved_at}`));
      }
    })();
  }, [computedUserCardResults, userCardResults, isAuth, authToken, onUserCardResultsSaved]);

  const filteredUsers = useMemo(() => {
    if (filter === "users") {
      if (!currentUserId) return usersSortedByAvg;
      const me = usersSortedByAvg.find((u) => u.id === currentUserId);
      if (!me) return usersSortedByAvg;
      return [me, ...usersSortedByAvg.filter((u) => u.id !== currentUserId)];
    }
    if (filter === "bots") {
      const isUnlocked = (u) =>
        unlockedBotIds.has(String(u.id)) || unlockedBotIds.has(`name:${String(u.name || "").toLowerCase()}`);
      const unlocked = botsByAvgDesc.filter((u) => isUnlocked(u));
      const locked = botsOnlyByAvg.filter((u) => !isUnlocked(u));
      return [...unlocked, ...locked];
    }
    return sorted;
  }, [filter, usersSortedByAvg, botsByAvgDesc, sorted, currentUserId]);

  const isLockedBot = useCallback(
    (u) =>
      !!u?.is_bot &&
      !showAllCardsFront &&
      !unlockedBotIds.has(String(u.id)) &&
      !unlockedBotIds.has(`name:${String(u.name || "").toLowerCase()}`),
    [showAllCardsFront, unlockedBotIds]
  );

  const isLockedUser = useCallback(
    (u) =>
      !u?.is_bot &&
      !showAllCardsFront &&
      u?.id !== undefined &&
      u?.id !== null &&
      String(u.id) !== String(currentUserId) &&
      !unlockedUserIds.has(String(u.id)),
    [showAllCardsFront, unlockedUserIds, currentUserId]
  );

  const visibleUsers = useMemo(() => {
    if (!hideLockedCards) return filteredUsers;
    return filteredUsers.filter((u) => !isLockedBot(u) && !isLockedUser(u));
  }, [filteredUsers, hideLockedCards, isLockedBot, isLockedUser]);

  useEffect(() => {
    if (!showResultsInfo || !resultsUser?.id) return;
    if (!isAuth || !authToken) {
      setResultsRows([]);
      setResultsMessage("Connecte-toi pour voir les résultats.");
      return;
    }
    let alive = true;
    setResultsLoading(true);
    setResultsError("");
    setResultsMessage("");
    setResultsCount(0);
    (async () => {
      try {
        const isBotTarget = !!resultsUser?.is_bot;
        const endpoint = isBotTarget
          ? `/me/card-results?bot_id=${encodeURIComponent(resultsUser.id)}`
          : `/me/user-card-results?target_user_id=${encodeURIComponent(resultsUser.id)}`;
        const data = await apiGet(endpoint, authToken);
        if (!alive) return;
        const formatResultDate = (value) => {
          if (!value) return "—";
          const d = dayjs(value);
          if (!d.isValid()) return String(value);
          const formatted = d.locale("fr").format("dddd D MMMM YYYY");
          const parts = formatted.split(" ");
          if (parts.length < 3) {
            return formatted.replace(/^./, (c) => c.toUpperCase());
          }
          const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
          const day = cap(parts[0]);
          const month = cap(parts[2]);
          return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`.trim();
        };
        const rows = (Array.isArray(data) ? data : []).map((row, idx) => {
          const km = Number(row.distance_m) / 1000;
          const kmLabel = Number.isFinite(km) ? `${formatKmFixed(km)} km` : "—";
          const targetKm = Number(row.target_distance_m) / 1000;
          const targetLabel = Number.isFinite(targetKm) ? `${formatKmFixed(targetKm)} km` : "—";
          const rawDate = row.achieved_at_time || row.achieved_at || null;
          const date = rawDate ? dayjs(rawDate) : null;
          const dateLabel = formatResultDate(rawDate || row.achieved_at);
          const ts = date && date.isValid() ? date.valueOf() : null;
          return {
            id: row.id || idx,
            dateLabel,
            kmLabel,
            targetLabel,
            ts,
          };
        });
        rows.sort((a, b) => {
          const aTs = a.ts ?? 0;
          const bTs = b.ts ?? 0;
          if (aTs !== bTs) return bTs - aTs;
          return String(b.id || "").localeCompare(String(a.id || ""));
        });
        setResultsCount(rows.length);
        if (!rows.length) {
          setResultsRows([]);
          setResultsMessage("Aucun résultat pour le moment.");
        } else {
          setResultsRows(rows);
        }
      } catch (e) {
        if (!alive) return;
        setResultsError(e?.message || "Erreur résultats");
        setResultsRows([]);
      } finally {
        if (alive) setResultsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showResultsInfo, resultsUser, isAuth, authToken]);

  useEffect(() => {
    if (!scrollToUserId) return;
    let attempts = 0;
    let timer = null;
    const tryScroll = () => {
      attempts += 1;
      const el = document.getElementById(`card-item-${scrollToUserId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightId(String(scrollToUserId));
        setHighlightFadeOut(false);
        timer = setTimeout(() => setHighlightFadeOut(true), 2000);
        timer = setTimeout(() => {
          setHighlightId(null);
          setHighlightFadeOut(false);
        }, 2300);
        return;
      }
      if (attempts < 12) {
        setTimeout(tryScroll, 120);
      }
    };
    tryScroll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [scrollToUserId]);

  useEffect(() => {
    if (!compactView && previewUser) setPreviewUser(null);
  }, [compactView, previewUser]);

  if (!users.length) {
    return (
      <div className="px-4 xl:px-8 pt-4 pb-8 text-sm text-slate-600 dark:text-slate-300">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="px-4 xl:px-8 pt-4 pb-8">
      {previewUser && typeof document !== "undefined"
        ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => setPreviewUser(null)}
              aria-hidden="true"
            />
            <div
              className="relative w-full max-w-[360px] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <UserHoloCard
                user={previewUser}
                nfDecimal={nfDecimal}
                showBotAverage
                minSpinnerMs={500}
                userRunningAvgKm={!previewUser?.is_bot ? userRunningAvgById?.get(previewUser.id) : null}
                showBackOnly={isLockedBot(previewUser) || isLockedUser(previewUser)}
                autoTiltVariant="soft"
                userRankInfo={{
                  index: previewUser?.is_bot ? botRankById.get(previewUser.id) : userRankById.get(previewUser.id),
                  total: previewUser?.is_bot ? botsOnlyByDate.length : usersOnlyByDate.length,
                }}
                elevated
              />
            </div>
          </div>,
          document.body
        )
        : null}
      <InfoPopover
        open={showResultsInfo}
        onClose={() => setShowResultsInfo(false)}
        title=""
        actionLabel={null}
        headerImage={null}
        items={
          resultsLoading
            ? [<span key="loading">Chargement...</span>]
            : resultsError
              ? [<span key="error">Erreur résultats</span>]
              : [
                  <div key="results" className="grid gap-5">
                    <div className="flex items-center gap-3 px-2 pt-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
                          Résultats contre {resultsUser?.name || ""}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {resultsCount} résultat{resultsCount > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    {resultsMessage ? (
                      <div className="px-2 text-sm text-slate-600 dark:text-slate-300">{resultsMessage}</div>
                    ) : (
                      <div className="px-2">
                        <div className="sm:hidden grid gap-2">
                          {resultsRows.map((row) => (
                            <div
                              key={row.id}
                              className="rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-200"
                            >
                              <div className="text-[11px] uppercase tracking-wide text-slate-400">Date</div>
                              <div className="text-slate-900 dark:text-slate-100">{row.dateLabel}</div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 text-left shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Distance</div>
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">{row.kmLabel}</div>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 text-left shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Objectif</div>
                                  <div className="text-slate-500 dark:text-slate-400">{row.targetLabel}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden sm:block">
                          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-400">
                            <span>Date</span>
                            <span className="text-left">Distance</span>
                            <span className="text-left">Objectif</span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {resultsRows.map((row) => (
                              <div
                                key={row.id}
                                className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-200"
                              >
                                <span className="text-slate-900 dark:text-slate-100">{row.dateLabel}</span>
                                <span className="text-left font-semibold text-slate-900 dark:text-slate-100">
                                  {row.kmLabel}
                                </span>
                                <span className="text-left text-slate-500 dark:text-slate-400">{row.targetLabel}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>,
                ]
        }
        fullWidth
        maxWidth={720}
        anchorRect={null}
        offsetY={-15}
        offsetYMobile={0}
      />
      {isAdmin && (
        <div className="mb-3 hidden md:flex justify-end">
          <button
            type="button"
            onClick={() => setCompactView((v) => !v)}
            className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
          >
            {compactView ? "Vue normale" : "Vue compacte"}
          </button>
        </div>
      )}
      <div
        className={[
          "mx-auto flex w-full max-w-[1900px] flex-wrap justify-center gap-4",
          compactView ? "md:gap-1" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {visibleUsers.map((u) => (
          <div
            key={u.id}
            id={`card-item-${u.id}`}
            className={[
              "flex flex-col items-center gap-2",
              compactView ? "md:w-[200px] md:min-w-[180px] md:gap-1 md:h-[295px]" : "w-[360px] min-w-[342px]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              onClick={() => {
                if (!compactView) return;
                setPreviewUser(u);
              }}
              className={`relative ${compactView ? "md:scale-[0.55] md:origin-top md:-my-14 md:translate-y-[58px] md:cursor-zoom-in" : ""} ${
                highlightId === String(u.id)
                  ? "rounded-[22px] drop-shadow-[0_22px_70px_rgba(14,165,233,0.6)] drop-shadow-[0_0_130px_rgba(14,165,233,0.5)]"
                  : ""
              }`}
            >
              {highlightId === String(u.id) && (
                <span
                  className={`pointer-events-none absolute inset-[-6px] rounded-[28px] shadow-[0_0_90px_rgba(14,165,233,0.55)] transition-opacity duration-300 ${
                    highlightFadeOut ? "opacity-0" : "opacity-100"
                  }`}
                  aria-hidden="true"
                />
              )}
              <UserHoloCard
                user={u}
                nfDecimal={nfDecimal}
                showBotAverage
                minSpinnerMs={500}
                userRunningAvgKm={!u?.is_bot ? userRunningAvgById?.get(u.id) : null}
                showBackOnly={isLockedBot(u) || isLockedUser(u)}
                disableTilt={compactView}
                compact={compactView}
                autoTiltVariant="soft"
                userRankInfo={{
                  index: u?.is_bot ? botRankById.get(u.id) : userRankById.get(u.id),
                  total: u?.is_bot ? botsOnlyByDate.length : usersOnlyByDate.length,
                }}
              />
            </div>
            {!compactView && !(isLockedBot(u) || isLockedUser(u)) ? (
              <div className="flex items-center gap-2">
                {!!u?.is_bot && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultsUser(u);
                      setShowResultsInfo(true);
                      onOpenResults?.(u);
                    }}
                    className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                  >
                    Résultats
                  </button>
                )}
                {!u?.is_bot && String(u.id) !== String(currentUserId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultsUser(u);
                      setShowResultsInfo(true);
                      onOpenResults?.(u);
                    }}
                    className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                  >
                    Résultats
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectUser?.(u)}
                  className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                >
                  Ouvrir le dashboard de {u.name}
                </button>
              </div>
            ) : (
              <div className="h-[24px]" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <div className="fixed bottom-6 right-4 z-40 text-xs text-slate-500 dark:text-slate-400 sm:bottom-8 sm:right-8">
        <span className="rounded-full bg-slate-200 px-2 py-1 shadow-sm dark:bg-slate-800">
          Users {usersOnlyByDate.length} · Bots {botsOnlyByDate.length}
        </span>
      </div>
    </div>
  );
}
