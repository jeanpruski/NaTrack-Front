import React from "react";
import { CalendarCheck, Trophy } from "lucide-react";
import { formatKmDecimal } from "../../utils/appUtils";

export function ComparePanel({
  mode,
  modeLabel,
  monthCompare,
  compareTotalWinner,
  compareToDayWinner,
  nfDecimal,
}) {
  const totalWinner = compareTotalWinner;
  const totalDenom = monthCompare.currentTotal + monthCompare.lastTotal;
  const totalMarker = totalDenom > 0 ? (monthCompare.currentTotal / totalDenom) * 100 : 50;
  const toDayWinner = compareToDayWinner;
  const toDayDenom = monthCompare.currentToDay + monthCompare.lastToDay;
  const toDayMarker = toDayDenom > 0 ? (monthCompare.currentToDay / toDayDenom) * 100 : 50;

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          <span className="inline-flex items-center gap-2">
            <CalendarCheck size={18} />
            Comparatif mensuel — {mode === "all" ? "Mixte" : modeLabel}
          </span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
          {monthCompare.currentLabel} vs {monthCompare.lastLabel}
        </span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>Total des mois</span>
            {totalWinner !== "tie" && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                <Trophy size={14} />
                {totalWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>{monthCompare.currentLabel}</span>
              <span className="font-semibold">{formatKmDecimal(monthCompare.currentTotal, nfDecimal)}</span>
            </div>
            <div
              className={`relative h-2 w-full rounded-full overflow-hidden ${
                totalDenom > 0 ? "bg-sky-400" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              {totalDenom > 0 && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                    style={{ width: `${totalMarker}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                    style={{ left: `calc(${totalMarker}% - 1px)` }}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>{monthCompare.lastLabel}</span>
              <span className="font-semibold">{formatKmDecimal(monthCompare.lastTotal, nfDecimal)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>
              A date (J{monthCompare.currentDay} vs J{monthCompare.lastMonthDay})
            </span>
            {toDayWinner !== "tie" && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                <Trophy size={14} />
                {toDayWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>{monthCompare.currentLabel}</span>
              <span className="font-semibold">{formatKmDecimal(monthCompare.currentToDay, nfDecimal)}</span>
            </div>
            <div
              className={`relative h-2 w-full rounded-full overflow-hidden ${
                toDayDenom > 0 ? "bg-sky-400" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              {toDayDenom > 0 && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                    style={{ width: `${toDayMarker}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                    style={{ left: `calc(${toDayMarker}% - 1px)` }}
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>{monthCompare.lastLabel}</span>
              <span className="font-semibold">{formatKmDecimal(monthCompare.lastToDay, nfDecimal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
