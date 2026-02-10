import React from "react";
import { Bot, Trophy, User } from "lucide-react";
import { Reveal } from "../../components/Reveal";
import { buildSparklinePoints } from "../../utils/globalDashboard";

export function PodiumSection({
  totals,
  subtitle,
  hasBotsInRanking,
  showBotsInPodium,
  onToggleBots,
  showMorePodium,
  onToggleMore,
  podiumShown,
  sparklineMap,
  onSelectUser,
  nfDecimal,
}) {
  if (!totals.length) return null;

  return (
    <Reveal as="section">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-2 border-b px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-start gap-2">
              <Trophy size={18} className="mt-[2px] shrink-0" />
              <span className="whitespace-normal">
                {subtitle ? (
                  (() => {
                    const openIdx = subtitle.indexOf(" (");
                    const closeIdx = subtitle.lastIndexOf(")");
                    if (openIdx !== -1 && closeIdx > openIdx) {
                      const before = subtitle.slice(0, openIdx);
                      const dates = subtitle.slice(openIdx, closeIdx + 1);
                      const after = subtitle.slice(closeIdx + 1).trim();
                      return (
                        <>
                          <span>{`Podium · ${before}`}</span>
                          <span className="font-normal not-italic">{dates}</span>
                          {after ? <span>{` · ${after.replace(/^·\s*/, "")}`}</span> : null}
                        </>
                      );
                    }
                    return `Podium · ${subtitle}`;
                  })()
                ) : (
                  "Podium"
                )}
              </span>
            </span>
          </h2>
          <div className="flex w-full justify-end gap-2 md:w-auto md:justify-start">
            {hasBotsInRanking && (
              <button
                type="button"
                onClick={onToggleBots}
                className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
              >
                {showBotsInPodium ? "Masquer les bots" : "Afficher les bots"}
              </button>
            )}
            {totals.length > 3 && (
              <button
                type="button"
                onClick={onToggleMore}
                className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
              >
                {showMorePodium ? "Afficher moins" : "Afficher plus"}
              </button>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {podiumShown.map((u, index) => {
              const sparkValues = sparklineMap.get(u.id) || [];
              const points = buildSparklinePoints(sparkValues, 96, 40);
              const isPodium = index < 3;
              const podium = isPodium
                ? [
                    { img: "/na-first.png", label: "1" },
                    { img: "/na-second.png", label: "2" },
                    { img: "/na-third.png", label: "3" },
                  ][index]
                : { img: "/na-null.png", label: "" };
              const podiumClass =
                index === 0
                  ? "ring-amber-300/70 dark:ring-amber-300/40"
                  : index === 1
                    ? "ring-slate-400/70 dark:ring-slate-300/50"
                    : "ring-orange-300/70 dark:ring-orange-300/45";
              const baseBg = u.isBot
                ? "bg-rose-50/80 dark:bg-rose-900/30"
                : showBotsInPodium
                  ? "bg-emerald-50/80 dark:bg-emerald-900/30"
                  : "bg-slate-50/80 dark:bg-slate-800/50";
              const hoverBg = u.isBot
                ? "hover:bg-rose-100 dark:hover:bg-rose-900/40"
                : showBotsInPodium
                  ? "hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800";
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`text-left rounded-xl p-3 ring-1 ${hoverBg} ${
                    isPodium
                      ? `${podiumClass} ${baseBg} text-slate-900 dark:text-slate-100`
                      : `${baseBg} ring-slate-200 dark:ring-slate-700`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center rounded-lg ${isPodium ? podiumClass : ""}`}>
                        <img
                          src={podium.img}
                          alt={podium.label ? `Podium ${podium.label}` : ""}
                          aria-hidden={!podium.label}
                          className={`h-12 w-12 shrink-0 object-contain ${isPodium ? "" : "opacity-40 blur-[4px]"}`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {u.isBot ? (
                            <Bot size={16} className="text-slate-500 dark:text-slate-400" />
                          ) : (
                            <User size={16} className="text-slate-500 dark:text-slate-400" />
                          )}
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                        </div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {nfDecimal.format(u.total / 1000)} km
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <svg width="96" height="40" viewBox="0 0 96 40" aria-hidden="true">
                        <polyline
                          points={points}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-emerald-500"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
