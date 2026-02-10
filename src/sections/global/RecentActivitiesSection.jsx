import React from "react";
import { Heart, Medal, Newspaper, Sparkles, Swords } from "lucide-react";
import { Reveal } from "../../components/Reveal";

export function RecentActivitiesSection({
  showRecentActivityCard,
  recentActivities,
  recentActivitiesShown,
  showMoreRecent,
  onToggleShowMore,
  userById,
  currentUserId,
  isAuth,
  sessionLikesSet,
  onToggleSessionLike,
  onSelectUser,
}) {
  if (!showRecentActivityCard || !recentActivities.length) return null;

  return (
    <Reveal as="section">
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-2 border-b px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2">
              <Medal size={18} />
              Dernières activités
            </span>
          </h2>
          {recentActivities.length > 3 && (
            <div className="flex w-full justify-end md:w-auto md:justify-start">
              <button
                type="button"
                onClick={onToggleShowMore}
                className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
              >
                {showMoreRecent ? "Afficher moins" : "Afficher plus"}
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {!recentActivities.length ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Aucune activité récente.</div>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <div className="min-w-[540px]">
                  <div className="grid grid-cols-[80px_1.2fr_1.2fr_0.7fr_0.7fr] gap-3 rounded-xl bg-slate-100/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <span>Likes</span>
                    <span>Utilisateur</span>
                    <span>Challenge</span>
                    <span className="text-right">Distance</span>
                    <span className="text-right">Objectif</span>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {recentActivitiesShown.map((row) => {
                      const targetUser = row.userId ? userById.get(String(row.userId)) : null;
                      const isMine = currentUserId && row.userId && String(row.userId) === String(currentUserId);
                      const canLike = !!(isAuth && !isMine && row.sessionId);
                      const isLiked = canLike && sessionLikesSet.has(String(row.sessionId));
                      const handleOpen = () => {
                        if (!targetUser) return;
                        onSelectUser?.(targetUser);
                      };
                      return (
                        <div
                          key={row.id}
                          role={targetUser ? "button" : undefined}
                          tabIndex={targetUser ? 0 : -1}
                          onClick={handleOpen}
                          onKeyDown={(e) => {
                            if (!targetUser) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleOpen();
                            }
                          }}
                          className={`grid grid-cols-[80px_1.2fr_1.2fr_0.7fr_0.7fr] items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:text-slate-200 ${
                            targetUser
                              ? isMine
                                ? "cursor-pointer border-emerald-200/70 bg-emerald-50/70 hover:border-emerald-300/70 hover:bg-emerald-50 hover:shadow-md dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-900/30"
                                : "cursor-pointer border-slate-200/60 bg-white/90 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                              : "border-slate-200/40 bg-white/60 opacity-60 dark:border-slate-700/40 dark:bg-slate-900/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canLike}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canLike) return;
                                onToggleSessionLike?.(row.sessionId);
                              }}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition ${
                                canLike
                                  ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                  : "text-slate-400"
                              }`}
                              aria-label={isLiked ? "Retirer le like" : "Liker l'activité"}
                            >
                              <span>{row.likesCount}</span>
                              <Heart
                                size={14}
                                className={`${isLiked ? "text-rose-500 fill-rose-500" : "text-slate-400"} ${
                                  canLike ? "" : "opacity-60"
                                }`}
                              />
                            </button>
                          </div>
                          <span className="truncate font-medium">
                            <span
                              className={`${
                                currentUserId && row.userId && String(row.userId) === String(currentUserId)
                                  ? "text-emerald-600 dark:text-emerald-300"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                            >
                              {row.userName}
                            </span>
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                              ({row.dateLabel})
                            </span>
                          </span>
                          <span className="flex items-center gap-2 truncate">
                            {row.challengeType === "defi" ? (
                              <Swords size={14} className="text-rose-600 dark:text-rose-300" />
                            ) : row.challengeType === "rare" ? (
                              <Sparkles size={14} className="text-sky-600 dark:text-sky-300" />
                            ) : row.challengeType === "evenement" ? (
                              <Newspaper size={14} className="text-amber-500 dark:text-amber-300" />
                            ) : null}
                            <span className="truncate">{row.challengeLabel}</span>
                          </span>
                          <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {row.kmLabel}
                          </span>
                          <span className="text-right text-slate-500 dark:text-slate-400">{row.targetLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 md:hidden">
                {recentActivitiesShown.map((row) => {
                  const targetUser = row.userId ? userById.get(String(row.userId)) : null;
                  const isMine = currentUserId && row.userId && String(row.userId) === String(currentUserId);
                  const canLike = !!(isAuth && !isMine && row.sessionId);
                  const isLiked = canLike && sessionLikesSet.has(String(row.sessionId));
                  const handleOpen = () => {
                    if (!targetUser) return;
                    onSelectUser?.(targetUser);
                  };
                  return (
                    <div
                      key={row.id}
                      role={targetUser ? "button" : undefined}
                      tabIndex={targetUser ? 0 : -1}
                      onClick={handleOpen}
                      onKeyDown={(e) => {
                        if (!targetUser) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpen();
                        }
                      }}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:text-slate-200 ${
                        targetUser
                          ? isMine
                            ? "cursor-pointer border-emerald-200/70 bg-emerald-50/70 hover:border-emerald-300/70 hover:bg-emerald-50 hover:shadow-md dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-900/30"
                            : "cursor-pointer border-slate-200/60 bg-white/90 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                          : "border-slate-200/40 bg-white/60 opacity-60 dark:border-slate-700/40 dark:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={`truncate font-semibold ${
                              currentUserId && row.userId && String(row.userId) === String(currentUserId)
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {row.userName}{" "}
                            <span className="text-xs text-slate-500 dark:text-slate-400">({row.dateLabel})</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                            {row.challengeType === "defi" ? (
                              <Swords size={12} className="text-rose-600 dark:text-rose-300" />
                            ) : row.challengeType === "rare" ? (
                              <Sparkles size={12} className="text-sky-600 dark:text-sky-300" />
                            ) : row.challengeType === "evenement" ? (
                              <Newspaper size={12} className="text-amber-500 dark:text-amber-300" />
                            ) : null}
                            <span className="truncate">{row.challengeLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.kmLabel}</div>
                          <button
                            type="button"
                            disabled={!canLike}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canLike) return;
                              onToggleSessionLike?.(row.sessionId);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition ${
                              canLike
                                ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                : "text-slate-400"
                            }`}
                            aria-label={isLiked ? "Retirer le like" : "Liker l'activité"}
                          >
                            <span>{row.likesCount}</span>
                            <Heart
                              size={14}
                              className={`${isLiked ? "text-rose-500 fill-rose-500" : "text-slate-400"} ${
                                canLike ? "" : "opacity-60"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Objectif: {row.targetLabel}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Reveal>
  );
}
