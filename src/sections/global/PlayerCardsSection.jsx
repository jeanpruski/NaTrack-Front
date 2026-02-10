import React from "react";
import { Newspaper, Sparkles, Swords } from "lucide-react";
import { Reveal } from "../../components/Reveal";

export function PlayerCardsSection({
  cardCountsByUser,
  cardCountsShown,
  showMoreCards,
  onToggleMore,
  currentUserId,
  onSelectUser,
}) {
  return (
    <Reveal as="section">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-2 border-b px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2">
              <Sparkles size={18} />
              Cartes des joueurs
            </span>
          </h2>
          {cardCountsByUser.filter((u) => u.score > 0).length > 3 && (
            <div className="flex w-full justify-end md:w-auto md:justify-start">
              <button
                type="button"
                onClick={onToggleMore}
                className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
              >
                {showMoreCards ? "Afficher moins" : "Afficher plus"}
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {!cardCountsShown.length ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Aucune carte pour le moment.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[2fr_0.35fr_0.35fr_0.35fr_0.5fr] gap-3 rounded-xl bg-slate-100/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <span>Utilisateur</span>
                    <span className="text-center">Défi</span>
                    <span className="text-center">Rare</span>
                    <span className="text-center">Event</span>
                    <span className="text-right">Score</span>
                  </div>
                      <div className="mt-2 grid gap-2">
                        {cardCountsShown.map((row) => (
                          <button
                            key={row.id}
                            onClick={() => row.user && onSelectUser?.(row.user)}
                            className={`grid grid-cols-[2fr_0.35fr_0.35fr_0.35fr_0.5fr] items-center gap-3 rounded-xl border px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:shadow-md dark:text-slate-200 ${
                              currentUserId && String(row.id) === String(currentUserId)
                                ? "border-emerald-200/70 bg-emerald-50/70 hover:border-emerald-300/70 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-900/30"
                                : "border-slate-200/60 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                            }`}
                      >
                        <span
                          className={`text-left font-semibold ${
                            currentUserId && String(row.id) === String(currentUserId)
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {row.name}
                          {row.lastLabel ? (
                            <span className="ml-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                              ({row.lastLabel})
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200">
                          <Swords size={14} className="text-rose-600 dark:text-rose-300" />
                          {row.defi}
                        </span>
                        <span className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200">
                          <Sparkles size={14} className="text-sky-600 dark:text-sky-300" />
                          {row.rare}
                        </span>
                        <span className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200">
                          <Newspaper size={14} className="text-amber-500 dark:text-amber-300" />
                          {row.evenement}
                        </span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{row.score}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 md:hidden">
                {cardCountsShown.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => row.user && onSelectUser?.(row.user)}
                    className={`rounded-2xl border px-4 py-3 text-sm text-slate-700 shadow-sm transition dark:text-slate-200 ${
                      currentUserId && String(row.id) === String(currentUserId)
                        ? "border-emerald-200/70 bg-emerald-50/70 hover:border-emerald-300/70 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-900/30"
                        : "border-slate-200/60 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`text-left font-semibold ${
                          currentUserId && String(row.id) === String(currentUserId)
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {row.name}
                        {row.lastLabel ? (
                          <span className="ml-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                            ({row.lastLabel})
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                          <Swords size={12} className="text-rose-600 dark:text-rose-300" />
                          {row.defi}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                          <Sparkles size={12} className="text-sky-600 dark:text-sky-300" />
                          {row.rare}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                          <Newspaper size={12} className="text-amber-500 dark:text-amber-300" />
                          {row.evenement}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Reveal>
  );
}
