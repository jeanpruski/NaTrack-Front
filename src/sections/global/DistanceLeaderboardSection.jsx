import React, { useMemo, useState } from "react";
import { Reveal } from "../../components/Reveal";

export function DistanceLeaderboardSection({
  users,
  totalsByUser,
  nfDecimal,
  currentUserId,
  onSelectUser,
  rangeLabel,
}) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => {
    const base = (users || [])
      .filter((u) => !u?.is_bot)
      .map((u) => {
        const total = Number(totalsByUser?.[u.id]) || 0;
        return { id: u.id, name: u.name || "Utilisateur", total, user: u };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    return base;
  }, [users, totalsByUser]);

  const maxTotal = rows.length ? Math.max(...rows.map((r) => r.total)) : 0;

  return (
    <Reveal as="section">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/60 dark:ring-slate-700 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left dark:border-slate-700 md:flex-row md:items-center md:justify-between"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Distances cumulées
            <span className="rounded-full border border-amber-300/60 bg-amber-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100">
              Admin
            </span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">{rangeLabel}</div>
        </button>
        {open && (
          <div className="p-4">
            {!rows.length ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée.</div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto">
                <div className="grid gap-1">
                  {rows.map((row, idx) => {
                    const percent = maxTotal ? Math.round((row.total / maxTotal) * 100) : 0;
                    return (
                      <button
                        key={row.id}
                        onClick={() => row.user && onSelectUser?.(row.user)}
                        className={`grid grid-cols-[24px_minmax(140px,1.2fr)_3fr_90px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 ${
                          currentUserId && String(row.id) === String(currentUserId)
                            ? "border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-900/10"
                            : "border-slate-200/60 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/40"
                        }`}
                        type="button"
                      >
                        <div className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">{idx + 1}</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{row.name}</div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-emerald-500/70"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                          {nfDecimal.format(row.total / 1000)} km
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}
