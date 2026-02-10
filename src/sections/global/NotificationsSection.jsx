import React from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Bell, BellRing, Check, Medal, Newspaper, Sparkles, Swords } from "lucide-react";
import { InfoPopover } from "../../components/InfoPopover";
import { Reveal } from "../../components/Reveal";
import { UserHoloCard } from "../../components/UserHoloCard";

export function NotificationsSection({
  isAuth,
  onOpenCards,
  hasUnreadNotif,
  unreadNotifications,
  showNotifInfo,
  onToggleNotifInfo,
  onCloseNotifInfo,
  showCardNotif,
  latestUnreadNotification,
  notificationsLoading,
  notificationsError,
  cardNotifDetails,
  cardBot,
  botRankInfo,
  openCardPreview,
  showCardPreview,
  onCloseCardPreview,
  cardNotification,
  activeChallenge,
  getRemainingDays,
  onCancelChallenge,
  canCancelAny,
  onOpenMyOptions,
  nfDecimal,
}) {
  if (!isAuth || !onOpenCards) return null;

  return (
    <Reveal as="section">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative w-full">
          <button
            type="button"
            disabled={!hasUnreadNotif}
            onClick={() => {
              if (!unreadNotifications.length) return;
              onToggleNotifInfo();
            }}
            className={`relative w-full overflow-hidden rounded-2xl border-0 px-4 py-3 text-left text-slate-900 shadow-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 dark:text-slate-100 ${
              hasUnreadNotif
                ? "bg-gradient-to-l from-rose-400/60 to-transparent hover:ring-1 hover:ring-rose-300/70 focus-visible:ring-rose-300"
                : "bg-gradient-to-l from-sky-400/60 to-transparent focus-visible:ring-sky-300 cursor-default"
            }`}
          >
            <span
              className={`pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 ${
                hasUnreadNotif ? "hover:opacity-100 bg-rose-400/45" : "bg-sky-400/45"
              }`}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {hasUnreadNotif ? "Notification" : "Pas de notification"}
              </div>
              {hasUnreadNotif ? (
                <BellRing size={20} className="text-slate-900 dark:text-white" />
              ) : (
                <Bell size={20} className="text-slate-900 dark:text-white" />
              )}
            </div>
          </button>
          <InfoPopover
            open={showNotifInfo}
            onClose={onCloseNotifInfo}
            title={
              showCardNotif
                ? ""
                : unreadNotifications.length
                  ? <div className="text-center">Notifications</div>
                  : <div className="text-[26px] leading-tight text-center">Pas de notification</div>
            }
            actionLabel={null}
            headerImage={null}
            items={
              showCardNotif
                ? [
                    <div key="card" className="grid gap-5">
                      <div className="px-2 pt-2 text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                                {cardNotifDetails?.kind === "rare" ? (
                                  <Sparkles size={20} />
                                ) : cardNotifDetails?.isEvent ? (
                                  <Newspaper size={20} />
                                ) : (
                                  <Swords size={20} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
                                  {(() => {
                                    const title = cardNotifDetails?.title || `${cardBot?.name || "Un bot"} te défie !`;
                                    return title.split(" – ")[0] || title;
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <ul className="grid gap-2 text-sm sm:text-base">
                                {cardNotifDetails?.dueLabel && (
                                  <li className="flex items-center gap-2">
                                    <Check size={18} className="text-emerald-500" />
                                    <span>
                                      {cardNotifDetails?.isEvent ? (
                                        <>
                                          A réaliser <span className="font-semibold">aujourd'hui</span>
                                        </>
                                      ) : (() => {
                                        const raw = String(cardNotifDetails.dueLabel || "");
                                        const cleaned = raw
                                          .replace(/\s*à\s*\d{1,2}(:\d{2}|h\d{2}).*$/i, "")
                                          .trim();
                                        return (
                                          <>
                                            A réaliser avant le{" "}
                                            <span className="font-semibold">{cleaned || cardNotifDetails.dueLabel}</span>
                                            {cardNotifDetails?.dueIsEvent ? " (pour cause d'événement)" : ""}
                                          </>
                                        );
                                      })()}
                                    </span>
                                  </li>
                                )}
                                <li className="flex items-center gap-2">
                                  <Check size={18} className="text-emerald-500" />
                                  <span>
                                    En <span className="font-semibold">une seule</span> session
                                  </span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check size={18} className="text-emerald-500" />
                                  <span>
                                    Objectif :{" "}
                                    <span className="font-semibold">{cardNotifDetails?.objective || "Distance minimum"}</span>
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={openCardPreview}
                            className="hidden md:flex h-[170px] w-[140px] -ml-8 shrink-0 overflow-hidden self-start cursor-zoom-in text-left"
                            aria-label="Ouvrir la carte"
                          >
                            <div className="pointer-events-none w-full">
                              <div className="origin-top-right rounded-2xl md:scale-[0.32] md:-translate-x-20">
                                <UserHoloCard
                                  user={cardBot}
                                  nfDecimal={nfDecimal}
                                  showBotAverage
                                  minSpinnerMs={500}
                                  userRankInfo={botRankInfo}
                                  leftAlignDetailsDesktop
                                />
                              </div>
                            </div>
                          </button>
                        </div>
                        <div className="pointer-events-none mt-6 flex justify-center md:hidden">
                          <div className="h-[265px] w-[185px] overflow-hidden">
                            <div className="origin-top rounded-2xl scale-[0.48] -translate-x-10">
                              <UserHoloCard
                                user={cardBot}
                                nfDecimal={nfDecimal}
                                showBotAverage
                                minSpinnerMs={0}
                                autoTiltOnMobile={false}
                                userRankInfo={botRankInfo}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center md:mt-10">
                          {canCancelAny && (
                            <button
                              type="button"
                              onClick={() => {
                                const confirmLabel =
                                  cardNotification?.type === "event_start"
                                    ? "Ne pas participer à cet événement ?"
                                    : "Annuler ce défi ?";
                                if (!window.confirm(confirmLabel)) return;
                                onCancelChallenge();
                                onCloseNotifInfo();
                              }}
                              className="rounded-full border border-rose-300/70 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:border-rose-400/60 dark:text-rose-300 dark:hover:bg-rose-400/10"
                            >
                              {cardNotification?.type === "event_start" ? "Ne pas participer" : "Annuler le défi"}
                            </button>
                          )}
                          {onOpenMyOptions && isAuth && (
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window === "undefined") return;
                                onOpenMyOptions?.();
                                onCloseNotifInfo();
                              }}
                              className="rounded-full border border-emerald-300/70 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/60 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                            >
                              {cardNotifDetails?.isEvent ? "Participer à l'événement" : "Relever le défi"}
                            </button>
                          )}
                        </div>
                        {cardNotification?.created_at && (
                          <div className="mt-6 text-right text-xs text-slate-400 dark:text-slate-500">
                            {(() => {
                              const formatted = dayjs(cardNotification.created_at)
                                .locale("fr")
                                .format("dddd D MMMM YYYY");
                              const parts = formatted.split(" ");
                              if (parts.length < 3) return formatted;
                              const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
                              const day = cap(parts[0]);
                              const month = cap(parts[2]);
                              return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`.trim();
                            })()}
                          </div>
                        )}
                      </div>
                    </div>,
                  ]
                : latestUnreadNotification
                  ? [latestUnreadNotification].map((n) => (
                      <div key={n.id} className="flex flex-col gap-1">
                        <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">
                          {n.title || "Notification"}
                        </div>
                        {n.body && <div className="text-sm text-slate-700 dark:text-slate-200">{n.body}</div>}
                        {activeChallenge?.id &&
                          n?.meta?.challenge_id === activeChallenge.id &&
                          activeChallenge?.due_date && (
                            <div className="text-xs text-slate-500">
                              Il te reste {getRemainingDays(activeChallenge.due_date)} jour
                              {getRemainingDays(activeChallenge.due_date) > 1 ? "s" : ""}
                            </div>
                          )}
                        <div className="text-xs text-slate-400">{n.created_at}</div>
                      </div>
                    ))
                  : notificationsLoading
                    ? [<span key="loading">Chargement...</span>]
                    : notificationsError
                      ? [<span key="error">Erreur notifications</span>]
                      : []
            }
            fullWidth
            maxWidth={720}
            anchorRect={null}
            offsetY={-15}
            offsetYMobile={0}
          />
          {showCardPreview && cardBot && typeof document !== "undefined"
            ? createPortal(
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center px-[30px] sm:px-4"
                  onMouseDownCapture={(e) => e.stopPropagation()}
                  onTouchStartCapture={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-0 bg-black/80" onClick={onCloseCardPreview} aria-hidden="true" />
                  <div className="relative w-full max-w-[360px] mx-auto">
                    <UserHoloCard
                      user={cardBot}
                      nfDecimal={nfDecimal}
                      showBotAverage
                      minSpinnerMs={500}
                      userRankInfo={botRankInfo}
                      elevated
                    />
                  </div>
                </div>,
                document.body
              )
            : null}
        </div>

        <button
          onClick={onOpenCards}
          className="relative w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-emerald-300/60 to-transparent px-4 py-3 text-left text-slate-900 shadow-sm transition-colors duration-200 hover:ring-1 hover:ring-emerald-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:text-slate-100"
        >
          <span className="pointer-events-none absolute inset-0 z-0 bg-emerald-300/45 opacity-0 transition-opacity duration-300 hover:opacity-100" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Medal size={20} className="text-slate-900 dark:text-white" />
            </div>
            <img src="/nacards-logo.png" alt="NaCards" className="h-7 w-auto" />
          </div>
        </button>
      </div>
    </Reveal>
  );
}
