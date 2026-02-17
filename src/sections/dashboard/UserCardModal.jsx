import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { UserHoloCard } from "../../components/UserHoloCard";
import { InfoPopover } from "../../components/InfoPopover";
import { apiGet } from "../../utils/api";
import { formatKmFixed } from "../../utils/appUtils";

export function UserCardModal({
  open,
  onClose,
  user,
  nfDecimal,
  userRankInfo,
  userRunningAvgKm,
  userRunningMaxKm,
  isAuth,
  authToken,
  currentUserId,
}) {
  const [showResultsInfo, setShowResultsInfo] = useState(false);
  const [resultsRows, setResultsRows] = useState([]);
  const [resultsMessage, setResultsMessage] = useState("");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const [resultsCount, setResultsCount] = useState(0);
  const canShowResults =
    !!user?.id && (user?.is_bot || String(user.id) !== String(currentUserId));

  useEffect(() => {
    if (!open) setShowResultsInfo(false);
  }, [open]);

  useEffect(() => {
    if (!showResultsInfo || !user?.id) return;
    if (!isAuth || !authToken) {
      setResultsLoading(false);
      setResultsError("");
      setResultsCount(0);
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
        const isBotTarget = !!user?.is_bot;
        const endpoint = isBotTarget
          ? `/me/card-results?bot_id=${encodeURIComponent(user.id)}`
          : `/me/user-card-results?target_user_id=${encodeURIComponent(user.id)}`;
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
  }, [showResultsInfo, user, isAuth, authToken]);
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-[30px] sm:px-4"
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-[360px] mx-auto"
            initial={{ opacity: 0, scale: 0.9, rotateX: 18, y: -12 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: -6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <UserHoloCard
              user={user}
              nfDecimal={nfDecimal}
              userRankInfo={userRankInfo}
              elevated
              showBotAverage
              userRunningAvgKm={userRunningAvgKm}
              userRunningMaxKm={userRunningMaxKm}
              minSpinnerMs={500}
            />
            {canShowResults && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultsInfo(true)}
                  className="rounded-full border border-emerald-300/70 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:bg-slate-900/80 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                >
                  Résultats
                </button>
              </div>
            )}
          </motion.div>
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
                              Résultats contre {user?.name || ""}
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
        </div>
      )}
    </AnimatePresence>
  );
}
