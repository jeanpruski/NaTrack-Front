import React from "react";
import { CalendarDays } from "lucide-react";
import { CalendarHeatmap } from "../../components/CalendarHeatmap";
import { Reveal } from "../../components/Reveal";

export function ActivityCalendarSection({
  firstSessionLabel,
  shownSessions,
  range,
  seasonStartDate,
  seasonEndDate,
}) {
  return (
    <Reveal as="section" className="px-4 xl:px-8 pb-8">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={18} />
              Calendrier d'activité
            </span>
          </h2>
          {firstSessionLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
              1ere seance :{" "}
              <span className="font-semibold tracking-wide text-slate-700 dark:text-slate-200">
                {firstSessionLabel}
              </span>
            </span>
          )}
        </div>
        <div className="p-4">
          <CalendarHeatmap
            sessions={shownSessions}
            range={range}
            seasonStartDate={seasonStartDate}
            seasonEndDate={seasonEndDate}
          />
        </div>
      </div>
    </Reveal>
  );
}
