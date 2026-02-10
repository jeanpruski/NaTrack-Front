import React from "react";
import dayjs from "dayjs";
import { CalendarDays, Gauge, Medal, PersonStanding, Scale, Waves } from "lucide-react";
import { Reveal } from "../../components/Reveal";
import { SportSharePie } from "../../components/SportSharePie";
import { capFirst } from "../../utils/strings";
import { formatKmDecimal, weekOfMonthLabel } from "../../utils/appUtils";

export function RecordsAndShareSection({
  isBotUser,
  isSeasonRange,
  mode,
  records,
  nfDecimal,
  stats,
  sportTotals,
  nf,
}) {
  if (isBotUser || isSeasonRange) return null;

  return (
    <Reveal as="section" className="px-4 xl:px-8 pb-4">
      <div className={`grid gap-4 ${mode === "all" ? "md:grid-cols-2" : ""}`}>
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <Medal size={18} />
                Records
              </span>
            </h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {mode !== "run" && (
              <div
                className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                  mode === "swim" ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Waves size={14} />
                  <span>Natation</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {records.bestSwim
                    ? `${formatKmDecimal(records.bestSwim.distance, nfDecimal)} · ${capFirst(
                        dayjs(records.bestSwim.date).format("DD MMM YYYY")
                      )}`
                    : "—"}
                </div>
              </div>
            )}

            {mode !== "swim" && (
              <div
                className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                  mode === "run" ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <PersonStanding size={14} />
                  <span>Running</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {records.bestRun
                    ? `${formatKmDecimal(records.bestRun.distance, nfDecimal)} · ${capFirst(
                        dayjs(records.bestRun.date).format("DD MMM YYYY")
                      )}`
                    : "—"}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} />
                <span>Meilleure semaine</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {records.bestWeek
                  ? `${formatKmDecimal(records.bestWeek.total, nfDecimal)} · ${weekOfMonthLabel(
                      records.bestWeek.weekStart
                    )}`
                  : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {records.bestWeek
                  ? records.bestWeek.run === records.bestWeek.swim
                    ? "Mixte"
                    : records.bestWeek.run > records.bestWeek.swim
                      ? "Running"
                      : "Natation"
                  : "—"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Gauge size={14} />
                <span>Série la plus longue</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {records.streakBest
                  ? `${records.streakBest.length} jour${records.streakBest.length > 1 ? "s" : ""} · du ${capFirst(
                      dayjs(records.streakBest.start).format("DD MMM YYYY")
                    )} au ${capFirst(dayjs(records.streakBest.end).format("DD MMM YYYY"))}`
                  : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {records.streakBest
                  ? `${records.streakBest.swim} natation · ${records.streakBest.run} running`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {mode === "all" && (
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <Scale size={18} />
                  Répartition par sport
                </span>
              </h2>
            </div>
            <div className="p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Par distance
                  </div>
                  <SportSharePie
                    swimValue={sportTotals.swimSum}
                    runValue={sportTotals.runSum}
                    unitLabel="km"
                    formatValue={(value) => nfDecimal.format(value / 1000)}
                    heightClass="h-60 sm:h-44"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Par séances
                  </div>
                  <SportSharePie
                    swimValue={stats.swimN}
                    runValue={stats.runN}
                    unitLabel="séance"
                    formatValue={(value) => nf.format(value)}
                    heightClass="h-60 sm:h-44"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
