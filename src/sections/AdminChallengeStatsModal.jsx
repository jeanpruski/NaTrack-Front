import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { X } from "lucide-react";
import { apiGet } from "../utils/api";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const pct = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

export function AdminChallengeStatsModal({ open, onClose, authToken }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [seasonFilter] = useState("all");
  const [seasonRangeInfo, setSeasonRangeInfo] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");

  const splitRow = (row) => {
    const rareCurrent = toNumber(row.rare_season_current_count);
    const rareOther = toNumber(row.rare_season_other_count);
    const rareNone = toNumber(row.rare_season_none_count);
    const eventCurrent = toNumber(row.event_season_current_count);
    const eventOther = toNumber(row.event_season_other_count);
    const eventNone = toNumber(row.event_season_none_count);
    const baseCurrent = toNumber(row.season_current_count);
    const baseOther = toNumber(row.season_other_count);
    const baseNone = toNumber(row.season_none_count);
    const defiCurrent = Math.max(0, baseCurrent - rareCurrent);
    const defiOther = Math.max(0, baseOther - rareOther);
    const defiNone = Math.max(0, baseNone - rareNone);
    const currentTotal = defiCurrent + rareCurrent + eventCurrent;
    const otherTotal = defiOther + rareOther + eventOther;
    const noneTotal = defiNone + rareNone + eventNone;
    const allTotal = currentTotal + otherTotal + noneTotal;
    return {
      defiCurrent,
      defiOther,
      defiNone,
      rareCurrent,
      rareOther,
      rareNone,
      eventCurrent,
      eventOther,
      eventNone,
      currentTotal,
      otherTotal,
      noneTotal,
      allTotal,
    };
  };

  const loadDetails = async (nextFrom = "", nextTo = "") => {
    if (!authToken) return;
    setDetailLoading(true);
    setDetailErr("");
    try {
      const params = new URLSearchParams();
      if (nextFrom) params.set("from", nextFrom);
      if (nextTo) params.set("to", nextTo);
      const data = await apiGet(`/admin/challenge-stats/users?${params.toString()}`, authToken);
      setDetailRows(Array.isArray(data?.rows) ? data.rows : []);
      if (data?.activeSeasonNumber !== undefined) {
        setActiveSeasonNumber(data.activeSeasonNumber ?? null);
      }
    } catch (e) {
      setDetailErr(e?.message || "Erreur de chargement");
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const summary = useMemo(() => {
    const base = {
      total: 0,
      defi: 0,
      rare: 0,
      event: 0,
      seasonCurrent: 0,
      seasonOther: 0,
      seasonNone: 0,
      eventSeasonCurrent: 0,
      eventSeasonOther: 0,
      eventSeasonNone: 0,
      rareSeasonCurrent: 0,
      rareSeasonOther: 0,
      rareSeasonNone: 0,
    };
    rows.forEach((row) => {
      base.total += toNumber(row.total_count);
      base.defi += toNumber(row.defi_count);
      base.rare += toNumber(row.rare_count);
      base.event += toNumber(row.event_count);
      base.seasonCurrent += toNumber(row.season_current_count);
      base.seasonOther += toNumber(row.season_other_count);
      base.seasonNone += toNumber(row.season_none_count);
      base.eventSeasonCurrent += toNumber(row.event_season_current_count);
      base.eventSeasonOther += toNumber(row.event_season_other_count);
      base.eventSeasonNone += toNumber(row.event_season_none_count);
      base.rareSeasonCurrent += toNumber(row.rare_season_current_count);
      base.rareSeasonOther += toNumber(row.rare_season_other_count);
      base.rareSeasonNone += toNumber(row.rare_season_none_count);
    });
    return base;
  }, [rows]);

  const seasonBreakdown = useMemo(() => {
    const base = {
      defiCurrent: 0,
      defiOther: 0,
      defiNone: 0,
      rareCurrent: 0,
      rareOther: 0,
      rareNone: 0,
      eventCurrent: 0,
      eventOther: 0,
      eventNone: 0,
      currentTotal: 0,
      otherTotal: 0,
      noneTotal: 0,
      allTotal: 0,
    };
    rows.forEach((row) => {
      const split = splitRow(row);
      Object.keys(base).forEach((key) => {
        base[key] += split[key] || 0;
      });
    });
    return base;
  }, [rows]);

  const trendRows = useMemo(() => rows.slice(-14), [rows]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedRows = useMemo(() => {
    const ordered = [...rows].reverse();
    const start = (safePage - 1) * pageSize;
    return ordered.slice(start, start + pageSize);
  }, [rows, safePage]);

  const trendAverage = useMemo(() => {
    if (!trendRows.length) return 0;
    const sum = trendRows.reduce((acc, row) => {
      const split = splitRow(row);
      const total = split.allTotal;
      const seasonCount = split.currentTotal;
      return acc + pct(seasonCount, total);
    }, 0);
    return Math.round(sum / trendRows.length);
  }, [trendRows]);

  const seasonLabel = useMemo(() => {
    if (activeSeasonNumber !== null && activeSeasonNumber !== undefined) {
      return `Saison ${activeSeasonNumber}`;
    }
    return "Saison inconnue";
  }, [activeSeasonNumber]);

  const detailGrouped = useMemo(() => {
    const byDate = new Map();
    (detailRows || []).forEach((row) => {
      const date = row?.stat_date || "—";
      if (!byDate.has(date)) byDate.set(date, new Map());
      const userKey = String(row?.user_id || "");
      const userMap = byDate.get(date);
      if (!userMap.has(userKey)) {
        userMap.set(userKey, { user_id: row?.user_id, user_name: row?.user_name, cards: [] });
      }
      userMap.get(userKey).cards.push(row);
    });
    const orderedDates = Array.from(byDate.keys()).sort().reverse();
    return orderedDates.map((date) => ({
      date,
      users: Array.from(byDate.get(date).values()),
    }));
  }, [detailRows]);

  const getCardClass = (row) => {
    const type = String(row?.type || "");
    const bucket = row?.season_bucket || "none";
    if (type === "evenement") {
      return "border-amber-300 bg-amber-200/80 text-amber-950 dark:border-amber-400/50 dark:bg-amber-300/20 dark:text-amber-100";
    }
    if (bucket === "none") {
      return "border-slate-300 bg-slate-200/80 text-slate-800 dark:border-slate-500/40 dark:bg-slate-700/40 dark:text-slate-100";
    }
    if (type === "defi") {
      return bucket === "current"
        ? "border-rose-500/60 bg-rose-500/80 text-white dark:border-rose-400/60 dark:bg-rose-500/40"
        : "border-rose-200 bg-rose-200/80 text-rose-900 dark:border-rose-400/30 dark:bg-rose-300/20 dark:text-rose-100";
    }
    if (type === "rare") {
      return bucket === "current"
        ? "border-sky-500/60 bg-sky-500/80 text-white dark:border-sky-400/60 dark:bg-sky-500/40"
        : "border-sky-200 bg-sky-200/80 text-sky-900 dark:border-sky-400/30 dark:bg-sky-300/20 dark:text-sky-100";
    }
    return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  };

  const loadStats = async (nextFrom = "", nextTo = "") => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      const finalFrom = nextFrom || from;
      const finalTo = nextTo || to;
      if (finalFrom) params.set("from", finalFrom);
      if (finalTo) params.set("to", finalTo);
      params.set("rebuild", "1");
      const data = await apiGet(`/admin/challenge-stats?${params.toString()}`, authToken);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setActiveSeasonNumber(data?.activeSeasonNumber ?? null);
      setPage(1);
      setFrom(data?.from || finalFrom || "");
      setTo(data?.to || finalTo || "");
      loadDetails(data?.from || finalFrom || "", data?.to || finalTo || "");
    } catch (e) {
      setErr(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const season = await apiGet("/season/active");
        if (!alive) return;
        setSeasonRangeInfo(season || null);
        const defaultFrom = season?.start_date || "";
        const defaultTo = dayjs().format("YYYY-MM-DD");
        const finalFrom = from || defaultFrom;
        const finalTo = to || defaultTo;
        if (!from && defaultFrom) setFrom(defaultFrom);
        if (!to && defaultTo) setTo(defaultTo);
        loadStats(finalFrom, finalTo);
      } catch {
        if (!alive) return;
        loadStats();
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Stats cartes (défis/rares)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{seasonLabel}</div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Du
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Au
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => loadStats(from, to)}
                disabled={loading}
                className="rounded-full border border-emerald-300/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
              >
                {loading ? "Chargement…" : "Rafraîchir"}
              </button>
            </div>

            {err && (
              <div className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                {err}
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Total (filtre)</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {seasonFilter === "current" ? seasonBreakdown.currentTotal : seasonBreakdown.allTotal}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Saison courante</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {seasonBreakdown.currentTotal} ({pct(seasonBreakdown.currentTotal, seasonBreakdown.allTotal)}%)
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Rare / Événement</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {summary.rare} rares · {summary.event} events
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
                <div className="text-xs uppercase text-emerald-700 dark:text-emerald-300">Saison courante</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <span>Défi {seasonBreakdown.defiCurrent}</span>
                  <span>Rare {seasonBreakdown.rareCurrent}</span>
                  <span>Event {seasonBreakdown.eventCurrent}</span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Total {seasonBreakdown.currentTotal} ({pct(seasonBreakdown.currentTotal, seasonBreakdown.allTotal)}%)
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Hors saison</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <span>Défi {seasonBreakdown.defiOther}</span>
                  <span>Rare {seasonBreakdown.rareOther}</span>
                  <span>Event {seasonBreakdown.eventOther}</span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Total {seasonBreakdown.otherTotal} ({pct(seasonBreakdown.otherTotal, seasonBreakdown.allTotal)}%)
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Sans saison</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <span>Défi {seasonBreakdown.defiNone}</span>
                  <span>Rare {seasonBreakdown.rareNone}</span>
                  <span>Event {seasonBreakdown.eventNone}</span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Total {seasonBreakdown.noneTotal} ({pct(seasonBreakdown.noneTotal, seasonBreakdown.allTotal)}%)
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Moyenne % saison courante (14j): <span className="font-semibold">{trendAverage}%</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="rounded-full border border-rose-500/60 bg-rose-500/80 px-2 py-0.5 text-white">
                  Défi saison courante
                </span>
                <span className="rounded-full border border-rose-200 bg-rose-200/80 px-2 py-0.5 text-rose-900 dark:border-rose-400/30 dark:bg-rose-300/20 dark:text-rose-100">
                  Défi ancienne saison
                </span>
                <span className="rounded-full border border-rose-200/60 bg-rose-100/50 px-2 py-0.5 text-slate-700 dark:border-rose-400/20 dark:bg-slate-800/60 dark:text-rose-100">
                  Défi sans saison
                </span>
                <span className="rounded-full border border-sky-500/60 bg-sky-500/80 px-2 py-0.5 text-white">
                  Rare saison courante
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-200/80 px-2 py-0.5 text-sky-900 dark:border-sky-400/30 dark:bg-sky-300/20 dark:text-sky-100">
                  Rare ancienne saison
                </span>
                <span className="rounded-full border border-slate-200 bg-sky-100/90 px-2 py-0.5 text-slate-700 dark:border-sky-400/30 dark:bg-slate-800/60 dark:text-slate-100">
                  Rare sans saison
                </span>
                <span className="rounded-full border border-amber-300 bg-amber-200/80 px-2 py-0.5 text-amber-950 dark:border-amber-400/50 dark:bg-amber-300/20 dark:text-amber-100">
                  Event
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60 overflow-x-auto">
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                % Saison courante (14 derniers jours)
              </div>
              {trendRows.length === 0 ? (
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Aucune donnée.</div>
              ) : (
                <div className="mt-3 grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: "repeat(14, minmax(18px, 1fr))" }}>
                  {trendRows.map((row, index) => {
                    const split = splitRow(row);
                    const total = split.allTotal;
                    const eventTotal = split.eventCurrent + split.eventOther + split.eventNone;
                    const noneTotal = split.defiNone + split.rareNone;
                    const stack = [
                      { key: "defiCurrent", count: split.defiCurrent, cls: "bg-rose-500/80" },
                      { key: "defiOther", count: split.defiOther, cls: "bg-rose-200/80" },
                      { key: "rareCurrent", count: split.rareCurrent, cls: "bg-sky-500/80" },
                      { key: "rareOther", count: split.rareOther, cls: "bg-sky-200/80" },
                      { key: "event", count: eventTotal, cls: "bg-amber-400/90" },
                      { key: "rareNone", count: split.rareNone, cls: "bg-sky-100/90" },
                      { key: "defiNone", count: split.defiNone, cls: "bg-rose-100/70" },
                    ].filter((s) => s.count > 0);
                    return (
                      <div key={row.stat_date} className="flex flex-col items-center gap-1">
                        <div
                          className="relative h-32 w-full bg-slate-100/70 dark:bg-slate-800/40"
                          title={`${row.stat_date}: ${total} cartes (défi ${split.defiCurrent + split.defiOther + split.defiNone}, rare ${split.rareCurrent + split.rareOther + split.rareNone}, event ${eventTotal}, hors saison ${noneTotal}).`}
                        >
                          {total > 0 && (
                            <div className="absolute inset-0 flex flex-col justify-end">
                              {stack.reduce((acc, seg) => {
                                const height = seg.count / total;
                                acc.push(
                                  <div
                                    key={seg.key}
                                    className={`w-full ${seg.cls} border-t border-black/70`}
                                    style={{ height: `${height * 100}%` }}
                                  />
                                );
                                return acc;
                              }, [])}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {index % 2 === 0 ? String(row.stat_date || "").slice(5) : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 md:block">
              <div className="grid min-w-[980px] grid-cols-[1.1fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                <div>Date</div>
                <div>Total</div>
                <div>Saison</div>
                <div>Défi S</div>
                <div>Défi O</div>
                <div>Défi ∅</div>
                <div>Rare S</div>
                <div>Rare O</div>
                <div>Rare ∅</div>
                <div>Event</div>
              </div>
              {rows.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">Aucune donnée.</div>
              ) : (
                <div>
                  {pagedRows.map((row) => {
                    const split = splitRow(row);
                    const total = split.allTotal;
                    const seasonCount = split.currentTotal;
                    const eventShown = split.eventCurrent + split.eventOther + split.eventNone;
                    return (
                      <div
                        key={row.stat_date}
                        className="grid min-w-[980px] grid-cols-[1.1fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr_0.6fr] gap-2 border-b border-slate-100 px-3 py-2 text-sm text-slate-700 last:border-b-0 dark:border-slate-800 dark:text-slate-200"
                      >
                        <div>{row.stat_date}</div>
                        <div>{total}</div>
                        <div>
                          {seasonCount} ({pct(seasonCount, total)}%)
                        </div>
                        <div className="text-rose-700 dark:text-rose-300">{split.defiCurrent}</div>
                        <div className="text-rose-400 dark:text-rose-200">{split.defiOther}</div>
                        <div className="text-slate-600 dark:text-rose-200">{split.defiNone}</div>
                        <div className="text-sky-700 dark:text-sky-300">{split.rareCurrent}</div>
                        <div className="text-sky-400 dark:text-sky-200">{split.rareOther}</div>
                        <div className="text-slate-600 dark:text-slate-200">{split.rareNone}</div>
                        <div className="text-amber-700 dark:text-amber-300">{eventShown}</div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <div>
                      Page {safePage} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
