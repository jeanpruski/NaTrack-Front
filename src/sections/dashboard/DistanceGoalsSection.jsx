import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { Reveal } from "../../components/Reveal";
import { PROGRESS_GOALS } from "../../constants/dashboard";
import { formatDistance, formatKmDecimal } from "../../utils/appUtils";

export function DistanceGoalsSection({ isBotUser, isSeasonRange, stats, nf, nfDecimal }) {
  if (isBotUser || isSeasonRange) return null;

  return (
    <Reveal as="section" className="px-4 xl:px-8 pb-4">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2">
              <Target size={18} />
              Objectifs distance
            </span>
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
            <span className="mr-2">Parcouru :</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              <AnimatedNumber value={stats.totalMeters / 1000} format={(n) => nfDecimal.format(n)} /> km
            </span>
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {PROGRESS_GOALS.map((goal) => {
            const percent = goal.targetMeters ? (stats.totalMeters / goal.targetMeters) * 100 : 0;
            const barPercent = Math.min(percent, 100);
            const target = formatDistance(goal.targetMeters, nf);
            const completedTimes = goal.targetMeters ? Math.floor(stats.totalMeters / goal.targetMeters) : 0;
            const remainingMeters = goal.targetMeters ? Math.max(goal.targetMeters - stats.totalMeters, 0) : 0;
            const remainingKm = formatKmDecimal(remainingMeters, nfDecimal);

            return (
              <div
                key={goal.id}
                className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <goal.Icon size={16} className="text-slate-700 dark:text-slate-200" />
                    {goal.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{target}</div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${barPercent}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.4 }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>
                    {completedTimes > 0
                      ? `${formatDistance(stats.totalMeters, nf)} · ${completedTimes}× atteint`
                      : `${remainingKm}`}
                  </span>
                  <span>{Math.round(percent)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
