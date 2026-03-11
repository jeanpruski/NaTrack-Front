import React from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Check, Medal, Newspaper, Sparkles, Swords } from "lucide-react";
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
  hasCurrentCardOwned = false,
}) {
  const challengeTitle = (() => {
    const title = cardNotifDetails?.title || `${cardBot?.name || "Un bot"} te défie !`;
    return title.split(" – ")[0] || title;
  })();
  const showChallengeBanner = Boolean(hasUnreadNotif && showCardNotif && cardNotifDetails);
  const toRgba = (hex, alpha) => {
    if (!hex) return "";
    const clean = String(hex).replace("#", "").trim();
    if (![3, 6].includes(clean.length)) return "";
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const num = Number.parseInt(full, 16);
    if (Number.isNaN(num)) return "";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const challengeBorderStyle = cardBot?.bot_border_color
    ? { backgroundImage: `linear-gradient(135deg, ${cardBot.bot_border_color}, #000000)` }
    : cardNotifDetails?.kind === "defi"
      ? { backgroundImage: "linear-gradient(135deg, rgb(153, 41, 41), rgb(0, 0, 0))" }
      : undefined;
  const challengeInnerStyle = {
    backgroundColor: "rgb(2 6 23 / 0.95)",
    backgroundImage: cardBot?.bot_color
      ? `linear-gradient(135deg, ${toRgba(cardBot.bot_color, 0.35)}, ${toRgba(cardBot.bot_color, 0.7)}, ${toRgba(cardBot.bot_color, 0.95)})`
      : undefined,
    "--holo-x": "50%",
    "--holo-y": "50%",
    "--spark-x": "50%",
    "--spark-y": "50%",
    "--spark-opacity": "0.6",
  };
  const ensureDayName = (label) => {
    if (!label) return label;
    const weekdays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    const lower = String(label).trim().toLowerCase();
    if (weekdays.some((w) => lower.startsWith(w))) return label;
    if (activeChallenge?.due_date) {
      const d = dayjs(activeChallenge.due_date).locale("fr");
      if (d.isValid()) {
        const dayName = d.format("dddd");
        const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
        return `${cap(dayName)} ${label}`;
      }
    }
    return label;
  };
  if (!isAuth || !onOpenCards) return null;

  return (
    <Reveal as="section">
      <div className="flex flex-col gap-3">
        <div className="relative z-10 flex flex-col gap-3">
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
                                        const withDay = ensureDayName(cleaned || cardNotifDetails.dueLabel);
                                        return (
                                          <>
                                            A réaliser au plus tard le{" "}
                                            <span className="font-semibold">{withDay}</span>
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
                        {(n.type === "challenge_success" || n.type === "event_success") && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-300">
                            Victoire enregistrée 🎉
                          </div>
                        )}
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

          <div className={`grid gap-3 ${showChallengeBanner ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_170px]" : "grid-cols-1"}`}>
            {showChallengeBanner && (
              <button
                type="button"
                onClick={() => {
                  if (!unreadNotifications.length) return;
                  onToggleNotifInfo();
                }}
                className="relative z-0 w-full rounded-[28px] border-0 bg-gradient-to-br from-emerald-300 via-lime-300 to-sky-400 p-2 text-left shadow-[0_12px_36px_rgba(0,0,0,0.32)] dark:shadow-[0_12px_36px_rgba(255,255,255,0.2)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                style={challengeBorderStyle}
              >
                <div
                  className="user-card-holo relative overflow-hidden rounded-[22px] p-[12px] text-slate-100"
                  style={challengeInnerStyle}
                >
                  <span
                    className={`absolute right-3 top-3 z-20 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      hasCurrentCardOwned
                        ? "bg-slate-200/80 text-slate-800"
                        : "bg-emerald-300/90 text-emerald-950"
                    }`}
                  >
                    {hasCurrentCardOwned ? "DÉJÀ" : "NEW"}
                  </span>
                  {cardBot?.card_image && (
                    <div
                      className="absolute inset-0 z-0 bg-cover opacity-30 md:hidden"
                      style={{ backgroundImage: `url(${cardBot.card_image})`, backgroundPosition: "top center" }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-emerald-300/10 via-sky-200/15 to-transparent opacity-100" />
                  <div className="relative z-10 flex items-stretch gap-3">
                    <div className="hidden w-[210px] shrink-0 sm:w-[280px] md:block">
                      <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-slate-900 via-emerald-900/40 to-slate-900">
                      {cardBot?.card_image ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${cardBot.card_image})` }}
                          aria-hidden="true"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
                          CARTE
                        </div>
                      )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-white/10 text-slate-100">
                          {cardNotifDetails?.kind === "rare" ? (
                            <Sparkles size={18} />
                          ) : cardNotifDetails?.isEvent ? (
                            <Newspaper size={18} />
                          ) : (
                            <Swords size={18} />
                          )}
                        </div>
                        <div className="text-base font-semibold text-slate-100 sm:text-lg">{challengeTitle}</div>
                      </div>
                      <ul className="mt-2 grid gap-2 text-xs sm:text-sm">
                        {cardNotifDetails?.dueLabel && (
                          <li className="inline-flex items-center gap-2 rounded-xl bg-white/10 p-[12px] text-slate-100">
                            <Check size={14} className="shrink-0 text-emerald-400" />
                            <span>
                              {cardNotifDetails?.isEvent ? (
                                <>
                                  A réaliser <span className="font-semibold">aujourd&apos;hui</span>
                                </>
                              ) : (() => {
                                const raw = String(cardNotifDetails.dueLabel || "");
                                const cleaned = raw.replace(/\s*à\s*\d{1,2}(:\d{2}|h\d{2}).*$/i, "").trim();
                                const withDay = ensureDayName(cleaned || cardNotifDetails.dueLabel);
                                return (
                                  <>
                                    A réaliser au plus tard le <span className="font-semibold">{withDay}</span>
                                    {cardNotifDetails?.dueIsEvent ? " (pour cause d'événement)" : ""}
                                  </>
                                );
                              })()}
                            </span>
                          </li>
                        )}
                        <li className="inline-flex items-center gap-2 rounded-xl bg-white/10 p-[12px] text-slate-100">
                          <Check size={14} className="shrink-0 text-emerald-400" />
                          <span>
                            En <span className="font-semibold">une seule</span> session
                          </span>
                        </li>
                        <li className="inline-flex items-center gap-2 rounded-xl bg-white/10 p-[12px] text-slate-100">
                          <Check size={14} className="shrink-0 text-emerald-400" />
                          <span>
                            Objectif :{" "}
                            <span className="font-semibold">{cardNotifDetails?.objective || "Distance minimum"}</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </button>
            )}
            <button
              onClick={onOpenCards}
              className={`relative w-full overflow-hidden border-0 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                showChallengeBanner
                  ? "rounded-[28px] bg-gradient-to-br from-emerald-300 via-lime-300 to-sky-400 p-2 shadow-[0_12px_36px_rgba(0,0,0,0.32)] dark:shadow-[0_12px_36px_rgba(255,255,255,0.2)] md:h-full"
                  : "rounded-2xl bg-gradient-to-r from-emerald-300/60 to-transparent px-4 py-3 text-slate-900 shadow-sm hover:ring-1 hover:ring-emerald-300/70 dark:text-slate-100"
              }`}
            >
              {showChallengeBanner ? (
                <div className="user-card-holo relative h-full overflow-hidden rounded-[22px] bg-slate-950/95 p-3 text-slate-100">
                  <span className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-emerald-300/10 via-sky-200/15 to-transparent opacity-100" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1">
                    <img
                      src="/nacards-logo.png"
                      alt="NaCards"
                      className="h-9 w-auto drop-shadow-[0_8px_20px_rgba(16,185,129,0.45)]"
                    />
                    <div className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 md:block">
                      Mes cartes
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="pointer-events-none absolute inset-0 z-0 bg-emerald-300/45 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <Medal size={20} className="text-slate-900 dark:text-white" />
                    </div>
                    <img src="/nacards-logo.png" alt="NaCards" className="h-7 w-auto" />
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
