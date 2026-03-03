import React, { useEffect, useMemo, useState } from "react";
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
      const total = toNumber(row.total_count) + toNumber(row.event_count);
      const seasonCount =
        toNumber(row.season_current_count) + toNumber(row.event_season_current_count);
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
    } catch (e) {
      setErr(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadStats();
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
          className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
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

          <div className="px-5 py-4 sm:px-6 sm:py-5">
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
                <div className="text-xs uppercase text-slate-500">Total défis/rares</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{summary.total}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Saison courante</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {summary.seasonCurrent + summary.eventSeasonCurrent} (
                  {pct(summary.seasonCurrent + summary.eventSeasonCurrent, summary.total + summary.event)}%)
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <div className="text-xs uppercase text-slate-500">Rare / Événement</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {summary.rare} rares · {summary.event} events
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Moyenne % saison courante (14j): <span className="font-semibold">{trendAverage}%</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                % Saison courante (14 derniers jours)
              </div>
              {trendRows.length === 0 ? (
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Aucune donnée.</div>
              ) : (
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(14, minmax(18px, 1fr))" }}>
                  {trendRows.map((row, index) => {
                    const total = toNumber(row.total_count) + toNumber(row.event_count);
                    const seasonCount =
                      toNumber(row.season_current_count) + toNumber(row.event_season_current_count);
                    const noneCount =
                      toNumber(row.season_none_count) + toNumber(row.event_season_none_count);
                    const value = pct(seasonCount, total);
                    const nonePct = pct(noneCount, total);
                    const hasEvent = toNumber(row.event_count) > 0;
                    const rareCurrent = toNumber(row.rare_season_current_count);
                    const rareOther = toNumber(row.rare_season_other_count);
                    const rareCurrentPct = pct(rareCurrent, total);
                    const rareOtherPct = pct(rareOther, total);
                    const rareTotalPct = Math.min(100, rareCurrentPct + rareOtherPct);
                    return (
                      <div key={row.stat_date} className="flex flex-col items-center gap-1">
                        <div
                          className={`relative h-32 w-full ${
                            hasEvent
                              ? "bg-amber-200/80 dark:bg-amber-400/25"
                              : "bg-emerald-100 dark:bg-emerald-500/20"
                          }`}
                          title={`${row.stat_date}: ${value}% (saison courante, events inclus). Sans saison: ${nonePct}%. Rares: ${rareCurrentPct}% saison courante, ${rareOtherPct}% saisons precedentes.`}
                        >
                          <div
                            className={`h-full w-full origin-bottom scale-y-0 transition-transform duration-300 ${
                              hasEvent ? "bg-amber-500/80" : "bg-emerald-500/70"
                            }`}
                            style={{ transform: `scaleY(${Math.max(0.05, value / 100)})` }}
                          />
                          <div className="pointer-events-none absolute inset-0">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-black/40 dark:bg-white/80"
                              style={{ height: `${nonePct}%` }}
                            />
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-sky-400/90 border-t border-black/70"
                              style={{ height: `${rareTotalPct}%` }}
                            />
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-sky-600/90 border-t border-black/70"
                              style={{ height: `${rareCurrentPct}%` }}
                            />
                          </div>
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

            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 md:block">
              <div className="grid grid-cols-6 gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                <div>Date</div>
                <div>Total</div>
                <div>Saison</div>
                <div>Défi</div>
                <div>Rare</div>
                <div>Event</div>
              </div>
              {rows.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">Aucune donnée.</div>
              ) : (
                <div>
                  {pagedRows.map((row) => {
                    const total = toNumber(row.total_count) + toNumber(row.event_count);
                    const seasonCount =
                      toNumber(row.season_current_count) + toNumber(row.event_season_current_count);
                    return (
                      <div
                        key={row.stat_date}
                        className="grid grid-cols-6 gap-2 border-b border-slate-100 px-3 py-2 text-sm text-slate-700 last:border-b-0 dark:border-slate-800 dark:text-slate-200"
                      >
                        <div>{row.stat_date}</div>
                        <div>{total}</div>
                        <div>
                          {seasonCount} ({pct(seasonCount, total)}%)
                        </div>
                        <div>{toNumber(row.defi_count)}</div>
                        <div>{toNumber(row.rare_count)}</div>
                        <div>{toNumber(row.event_count)}</div>
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
