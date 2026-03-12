import React from "react";
import { AlertTriangle, RotateCcw, TrendingUp, Trophy } from "lucide-react";
import { Reveal } from "../../components/Reveal";

const toneStyles = {
  danger:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100",
  info:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-sky-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100",
};

const iconByType = {
  inactive: AlertTriangle,
  records: Trophy,
  comeback: RotateCcw,
  momentum: TrendingUp,
};

export function CommunityRadarSection({ alerts = [], currentUserId = null }) {
  const shownAlerts = (alerts || []).slice(0, 4);

  return (
    <Reveal as="section">
      <div className="h-full overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="p-4">
          {shownAlerts.length ? (
            <div className="space-y-3">
              {shownAlerts.map((alert, idx) => {
                const Icon = iconByType[alert.type] || TrendingUp;
                const toneClass = toneStyles[alert.tone] || toneStyles.info;
                return (
                  <div key={alert.id} className={`${idx > 0 ? "mt-3" : ""} rounded-xl border p-3 ${toneClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <Icon size={16} className="mt-[2px] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{alert.title}</div>
                          <div className="mt-0.5 text-xs opacity-90">{alert.detail}</div>
                          <div className="mt-1 text-xs">
                            <span className="font-semibold">Users:</span>{" "}
                            {Array.isArray(alert.usersItems) && alert.usersItems.length ? (
                              alert.usersItems.map((item, idx) => (
                                <React.Fragment key={`${item.name}-${item.meta || ""}-${idx}`}>
                                  {idx > 0 ? ", " : ""}
                                  <span
                                    className={`font-semibold ${
                                      currentUserId !== null &&
                                      item?.id !== null &&
                                      item?.id !== undefined &&
                                      String(item.id) === String(currentUserId)
                                        ? "underline decoration-2 underline-offset-2"
                                        : ""
                                    }`}
                                  >
                                    {item.name}
                                  </span>
                                  {item.meta ? ` (${item.meta})` : ""}
                                </React.Fragment>
                              ))
                            ) : (
                              alert.usersLabel || "—"
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold dark:bg-slate-950/30">
                        {alert.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
              RAS pour le moment, la communauté est régulière.
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
