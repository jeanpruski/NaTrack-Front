import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Calculator,
  Footprints,
  Gauge,
  TrendingUpDown,
  Trophy,
} from "lucide-react";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { KpiChip } from "../../components/KpiChip";
import { MonthlyBarChart } from "../../components/MonthlyBarChart";
import { Reveal } from "../../components/Reveal";
import { SwimChart } from "../../components/SwimChart";
import { TypePill } from "../../components/TypePill";
import { formatKmDecimal, pluralize } from "../../utils/appUtils";

export function DashboardTopSection({
  showMonthCardsOnlyWhenAllRange,
  isBotUser,
  isEventBot,
  mode,
  modeLabel,
  lastLabel,
  lastType,
  daysSinceLast,
  monthLabel,
  monthTotals,
  monthCounts,
  stats,
  nf,
  nfDecimal,
  showCompareInline,
  monthCompare,
  compareTotalWinner,
  compareToDayWinner,
  range,
  isActiveSeasonRange,
  shoesLifeByRange,
  shownSessions,
  showMonthlyChart,
  isSeasonRange,
  rangeLabel,
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_3fr] gap-4 items-start px-4 xl:px-8 pt-4 pb-4 xl:pt-3 xl:pb-4">
      <Reveal as="aside" className="self-start">
        <div className="grid grid-cols-1 min-[800px]:grid-cols-2 xl:grid-cols-1 gap-4">
          {showMonthCardsOnlyWhenAllRange && !isBotUser && (
            <KpiChip
              title="Dernière séance"
              subtitle={mode === "all" ? lastLabel : `${modeLabel} · ${lastLabel}`}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  {daysSinceLast !== null ? (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap items-center">
                      <div className="font-bold leading-none flex items-baseline">
                        {nf.format(daysSinceLast)}
                        <span className="ml-1 text-xs opacity-70 leading-none">
                          jour{daysSinceLast > 1 ? "s" : ""}
                        </span>
                      </div>

                      {mode === "all" && lastType && (
                        <TypePill type={lastType}>{lastType === "run" ? "Running" : "Natation"}</TypePill>
                      )}
                    </div>
                  ) : (
                    <div className="font-bold">—</div>
                  )}
                </div>
              }
              icon={<CalendarCheck />}
              tone={daysSinceLast > 4 ? "danger" : "default"}
            />
          )}

          {showMonthCardsOnlyWhenAllRange && !isEventBot && (
            <KpiChip
              title="Total du mois"
              subtitle={mode === "all" ? monthLabel : modeLabel}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={monthTotals.all} format={(n) => nf.format(Math.round(n))} />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{nf.format(monthTotals.swim)} m</TypePill>
                      <TypePill type="run">{nf.format(monthTotals.run)} m</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<Calculator />}
            />
          )}

          {showMonthCardsOnlyWhenAllRange && !isEventBot && (
            <KpiChip
              title="Séances ce mois-ci"
              subtitle={mode === "all" ? monthLabel : modeLabel}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={monthCounts.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                    {monthCounts.totalN > 1 ? "Séances" : "Séance"}
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{pluralize(monthCounts.swimN, "Séance")}</TypePill>
                      <TypePill type="run">{pluralize(monthCounts.runN, "Séance")}</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />
          )}

          {!isEventBot && (
            <KpiChip
              title="Moyenne / séance"
              subtitle={mode === "all" ? "Par sport" : modeLabel}
              value={
                mode === "all" ? (
                  <div className="mt-1 flex justify-end gap-2 flex-wrap">
                    <TypePill type="swim">
                      {nf.format(stats.swimAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                    <TypePill type="run">
                      {nf.format(stats.runAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                  </div>
                ) : (
                  <div className="text-right font-bold">
                    <AnimatedNumber
                      value={mode === "swim" ? stats.swimAvg : stats.runAvg}
                      format={(n) => nf.format(Math.round(n))}
                    />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                )
              }
              icon={<Gauge />}
            />
          )}

          {mode === "run" &&
            shoesLifeByRange &&
            (range === "all" ||
              range === "month" ||
              range === "6m" ||
              range === "3m" ||
              range === "2026" ||
              isActiveSeasonRange) && (
              <KpiChip
                title="Chaussures"
                subtitle={
                  <span className="block">
                    <span className="block break-words">{shoesLifeByRange.name}</span>
                  </span>
                }
                subtitleClassName="whitespace-normal leading-tight"
                tone={shoesLifeByRange.remaining <= 0 ? "danger" : "default"}
                value={
                  <div className="text-right">
                    <div className="font-bold whitespace-nowrap">
                      {nfDecimal.format(shoesLifeByRange.remaining / 1000)}{" "}
                      <span className="text-xs opacity-70">km restants</span>
                      <div className="text-xs opacity-70 mb-2">
                        ({nfDecimal.format(shoesLifeByRange.used / 1000)}km /{" "}
                        {nfDecimal.format(shoesLifeByRange.targetKm)}km)
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          shoesLifeByRange.remaining <= 0 ? "bg-rose-500" : "bg-emerald-400"
                        }`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${shoesLifeByRange.percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true, amount: 0.4 }}
                      />
                    </div>
                  </div>
                }
                icon={<Footprints />}
              />
            )}

          <KpiChip
            title="Distance totale"
            subtitle={mode === "all" ? "Total" : modeLabel}
            value={
              <div className="text-right">
                <div className="font-bold">
                  <AnimatedNumber value={stats.totalMeters} format={(n) => nf.format(Math.round(n))} />{" "}
                  <span className="text-xs opacity-70">m</span>
                </div>
                {mode === "all" && (
                  <div className="mt-1 flex justify-end gap-2 flex-wrap">
                    <TypePill type="swim">{nf.format(stats.swimSum)} m</TypePill>
                    <TypePill type="run">{nf.format(stats.runSum)} m</TypePill>
                  </div>
                )}
              </div>
            }
            icon={<Calculator />}
          />

          {!isEventBot && (
            <KpiChip
              title="Séances totales"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={stats.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                    {stats.totalN > 1 ? "Séances" : "Séance"}
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{pluralize(stats.swimN, "Séance")}</TypePill>
                      <TypePill type="run">{pluralize(stats.runN, "Séance")}</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />
          )}

          {showCompareInline && !isEventBot && (
            <>
              <KpiChip
                title="Comparatif"
                subtitle={`${mode === "all" ? "Mixte" : modeLabel}`}
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <span className="text-base">
                        {nfDecimal.format(monthCompare.currentTotal / 1000)}
                        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                      </span>{" "}
                      <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatKmDecimal(monthCompare.lastTotal, nfDecimal)}
                      </span>
                    </div>
                    <div
                      className={`relative h-2 w-full rounded-full overflow-hidden ${
                        compareTotalWinner === "tie" && monthCompare.currentTotal === 0
                          ? "bg-slate-200 dark:bg-slate-700"
                          : "bg-sky-400"
                      }`}
                    >
                      {monthCompare.currentTotal + monthCompare.lastTotal > 0 && (
                        <>
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${(monthCompare.currentTotal / (monthCompare.currentTotal + monthCompare.lastTotal)) * 100}%`,
                            }}
                          />
                          <div
                            className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                            style={{
                              left: `calc(${(monthCompare.currentTotal / (monthCompare.currentTotal + monthCompare.lastTotal)) * 100}% - 1px)`,
                            }}
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {compareTotalWinner === "tie" ? (
                        "Egalite"
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                          <Trophy size={14} />
                          {(compareTotalWinner === "current"
                            ? monthCompare.currentLabel
                            : monthCompare.lastLabel
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                }
                icon={<Trophy />}
              />
              <KpiChip
                title={`Comparatif au ${monthCompare.currentDay}`}
                subtitle={`${mode === "all" ? "Mixte" : modeLabel} à date`}
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <span className="text-base">
                        {nfDecimal.format(monthCompare.currentToDay / 1000)}
                        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                      </span>{" "}
                      <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatKmDecimal(monthCompare.lastToDay, nfDecimal)}
                      </span>
                    </div>
                    <div
                      className={`relative h-2 w-full rounded-full overflow-hidden ${
                        compareToDayWinner === "tie" && monthCompare.currentToDay === 0
                          ? "bg-slate-200 dark:bg-slate-700"
                          : "bg-sky-400"
                      }`}
                    >
                      {monthCompare.currentToDay + monthCompare.lastToDay > 0 && (
                        <>
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${(monthCompare.currentToDay / (monthCompare.currentToDay + monthCompare.lastToDay)) * 100}%`,
                            }}
                          />
                          <div
                            className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                            style={{
                              left: `calc(${(monthCompare.currentToDay / (monthCompare.currentToDay + monthCompare.lastToDay)) * 100}% - 1px)`,
                            }}
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {compareToDayWinner === "tie" ? (
                        "Egalite"
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                          <Trophy size={14} />
                          {(compareToDayWinner === "current"
                            ? monthCompare.currentLabel
                            : monthCompare.lastLabel
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                }
                icon={<CalendarDays />}
              />
            </>
          )}
        </div>
      </Reveal>

      <Reveal as="section" className="flex flex-col gap-4 self-start">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <TrendingUpDown size={18} />
                Séances
                {isSeasonRange && (
                  <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 sm:inline sm:ml-2">
                    {rangeLabel}
                  </span>
                )}
              </span>
            </h2>
          </div>
          <div className="p-4">
            <SwimChart sessions={shownSessions} mode={mode} />
          </div>
        </div>

        {showMonthlyChart && !isSeasonRange && !isEventBot && (
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <BarChart3 size={18} />
                  Cumulatif par mois
                </span>
              </h2>
            </div>
            <div className="p-4">
              <MonthlyBarChart sessions={shownSessions} />
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
