import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Bell, BellRing, Bot, Check, Medal, Newspaper, Sparkles, Swords, Trophy, User } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { InfoPopover } from "../components/InfoPopover";
import { UserHoloCard } from "../components/UserHoloCard";
import { formatKmFixed } from "../utils/appUtils";

function buildMonthKeys(sessions) {
  const set = new Set();
  sessions.forEach((s) => {
    const key = String(s.date || "").slice(0, 7);
    if (key) set.add(key);
  });
  return Array.from(set).sort();
}

function buildSparklinePoints(values, w, h) {
  if (!values.length) return `0,${h / 2} ${w},${h / 2}`;
  const filtered = values.filter((v) => v > 0);
  if (!filtered.length) return `0,${h / 2} ${w},${h / 2}`;
  if (filtered.length === 1) return `0,${h / 2} ${w},${h / 2}`;
  const max = Math.max(...filtered, 1);
  const step = filtered.length > 1 ? w / (filtered.length - 1) : w;
  return filtered
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function GlobalDashboard({
  rangeLabel,
  modeLabel,
  mode,
  users,
  allUsers,
  totalsByUser,
  sessions,
  nfDecimal,
  onSelectUser,
  onOpenCards,
  onOpenNewsArchive,
  onCancelChallenge,
  isAdmin,
  isAuth,
  notifications = [],
  notificationsLoading = false,
  notificationsError = "",
  onRefreshNotifications,
  activeChallenge,
  newsItems = [],
  newsLoading = false,
  newsError = "",
  onOpenMyOptions,
}) {
  const [newsImageReadyMap, setNewsImageReadyMap] = useState({});
  const [showNotifInfo, setShowNotifInfo] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [showBotsInPodium, setShowBotsInPodium] = useState(false);
  const [notifAnchorRect] = useState(null);
  const [adminNotifOverride, setAdminNotifOverride] = useState(null);
  const buildAdminNotification = (kind) => {
    const pool = (allUsers && allUsers.length ? allUsers : users) || [];
    const bots = pool.filter((u) => Boolean(u?.is_bot));
    if (!bots.length) return null;
    const pickBot = (type) =>
      bots.find((b) => String(b?.bot_card_type || "").toLowerCase() === type) || bots[0];
    const bot =
      kind === "rare"
        ? pickBot("rare")
        : kind === "event"
          ? pickBot("evenement")
          : pickBot("defi");
    const distance = kind === "rare" ? 12 : kind === "event" ? 5 : 8;
    const dateLabel = dayjs().locale("fr").format("D MMMM YYYY");
    const body =
      kind === "event"
        ? `Fais ${distance} km aujourd'hui pour gagner la carte ${bot.name}.`
        : `[${bot.name}] te défie à la course, cours ${distance} km avant le ${dateLabel} pour gagner sa carte !`;
    return {
      id: `test-${kind}-${Date.now()}`,
      type: kind === "event" ? "event_start" : "challenge_start",
      title: kind === "event" ? "Événement du jour" : "Nouveau défi",
      body,
      meta: { bot_id: bot.id, challenge_id: `test-${kind}` },
      created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      read_at: null,
    };
  };
  useEffect(() => {
    const openFromAdmin = (evt) => {
      const kind = evt?.detail?.kind || "defi";
      const mock = buildAdminNotification(kind);
      if (!mock) return;
      setAdminNotifOverride([mock]);
      setShowNotifInfo(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("admin:open-notifs", openFromAdmin);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("admin:open-notifs", openFromAdmin);
      }
    };
  }, [buildAdminNotification]);
  useEffect(() => {
    let alive = true;
    const next = {};
    (newsItems || []).forEach((item) => {
      if (!item?.image_url) return;
      const img = new Image();
      const done = () => {
        if (!alive) return;
        setNewsImageReadyMap((prev) => ({ ...prev, [item.id]: true }));
      };
      img.onload = done;
      img.onerror = done;
      img.src = item.image_url;
      if (img.complete) next[item.id] = true;
    });
    if (Object.keys(next).length) {
      setNewsImageReadyMap((prev) => ({ ...prev, ...next }));
    }
    return () => { alive = false; };
  }, [newsItems]);

  const realUnreadNotifications = (notifications || []).filter(
    (n) => !n.read_at && (n.type === "challenge_start" || n.type === "event_start")
  );
  const unreadNotifications = adminNotifOverride || realUnreadNotifications;
  const hasUnreadNotif = realUnreadNotifications.length > 0;

  const formatEventDate = (value) => {
    if (!value) return "";
    const d = dayjs(value);
    if (!d.isValid()) return value;
    const formatted = d.locale("fr").format("dddd D MMMM YYYY");
    const parts = formatted.split(" ");
    if (parts.length < 3) return formatted;
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    const day = cap(parts[0]);
    const month = cap(parts[2]);
    return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`.trim();
  };
  const subtitle = (() => {
    if (mode === "all") return rangeLabel;
    const parts = [rangeLabel, modeLabel].filter(Boolean);
    return parts.join(" · ");
  })();
  const latestNews = useMemo(() => {
    const items = newsItems || [];
    if (!items.length) return [];
    const withDates = items
      .map((item, idx) => ({
        item,
        idx,
        ts: dayjs(item.event_date).isValid() ? dayjs(item.event_date).startOf("day").valueOf() : null,
      }))
      .sort((a, b) => {
        if (a.ts === null && b.ts === null) return a.idx - b.idx;
        if (a.ts === null) return 1;
        if (b.ts === null) return -1;
        return a.ts - b.ts;
      });
    const today = dayjs().startOf("day").valueOf();
    const upcoming = withDates.filter((n) => n.ts !== null && n.ts >= today).map((n) => n.item);
    if (upcoming.length >= 2) return upcoming.slice(0, 2);
    const fallback = withDates.map((n) => n.item).filter((it) => !upcoming.includes(it));
    return [...upcoming, ...fallback].slice(0, 2);
  }, [newsItems]);
  const hasBotsInRanking = useMemo(
    () => users.some((u) => u?.is_bot && (totalsByUser?.[u.id] || 0) > 0),
    [users, totalsByUser]
  );
  const podiumUsers = useMemo(() => {
    const base = showBotsInPodium ? users : users.filter((u) => !u?.is_bot);
    return base.filter((u) => (totalsByUser?.[u.id] || 0) > 0);
  }, [users, showBotsInPodium, totalsByUser]);

  const totals = useMemo(() => {
    return podiumUsers
      .map((u) => ({
        id: u.id,
        name: u.name,
        total: totalsByUser?.[u.id] || 0,
        isBot: Boolean(u?.is_bot),
      }))
      .sort((a, b) => b.total - a.total);
  }, [podiumUsers, totalsByUser]);

  const monthKeys = useMemo(() => buildMonthKeys(sessions), [sessions]);
  const sparklineMap = useMemo(() => {
    const map = new Map();
    podiumUsers.forEach((u) => map.set(u.id, monthKeys.map(() => 0)));
    if (!monthKeys.length) return map;
    const keyIndex = new Map(monthKeys.map((k, i) => [k, i]));
    sessions.forEach((s) => {
      if (!s.user_id) return;
      const idx = keyIndex.get(String(s.date || "").slice(0, 7));
      if (idx === undefined) return;
      const arr = map.get(s.user_id);
      if (!arr) return;
      arr[idx] += Number(s.distance) || 0;
    });
    return map;
  }, [sessions, podiumUsers, monthKeys]);

  const getRemainingDays = (dueDate) => {
    if (!dueDate) return null;
    const end = new Date(`${dueDate}T23:59:59`);
    const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const cardNotification = unreadNotifications.find(
    (n) => n.type === "event_start" || n.type === "challenge_start"
  );
  const fullUsers = allUsers && allUsers.length ? allUsers : users;
  const cardBot =
    cardNotification?.meta?.bot_id
      ? fullUsers.find((u) => String(u.id) === String(cardNotification.meta.bot_id))
      : null;
  const botRankInfo = useMemo(() => {
    if (!cardBot) return null;
    const bots = fullUsers
      .filter((u) => Boolean(u?.is_bot))
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return String(a.name || a.id || "").localeCompare(String(b.name || b.id || ""));
      });
    const index = bots.findIndex((u) => String(u.id) === String(cardBot.id));
    if (index < 0) return null;
    return { index: index + 1, total: bots.length };
  }, [fullUsers, cardBot]);
  const cardNotifDetails = useMemo(() => {
    if (!cardNotification) return null;
    const todayTs = dayjs().startOf("day").valueOf();
    const upcomingEvents = (notifications || [])
      .filter((n) => n?.type === "event_start")
      .map((n) => ({
        notif: n,
        ts: dayjs(n?.event_date || n?.created_at).startOf("day").valueOf(),
      }))
      .filter((n) => Number.isFinite(n.ts) && n.ts >= todayTs)
      .sort((a, b) => a.ts - b.ts);
    const eventNotification = upcomingEvents.length ? upcomingEvents[0].notif : null;
    const upcomingEventBot = (fullUsers || [])
      .filter((u) => u?.is_bot && String(u?.bot_card_type || "").toLowerCase() === "evenement" && u?.bot_event_date)
      .map((u) => ({
        user: u,
        ts: dayjs(u.bot_event_date).startOf("day").valueOf(),
      }))
      .filter((n) => Number.isFinite(n.ts) && n.ts >= todayTs)
      .sort((a, b) => a.ts - b.ts)[0] || null;
    const body = cardNotification?.body || "";
    const isEvent = cardNotification?.type === "event_start";
    const botCardType = String(cardBot?.bot_card_type || activeChallenge?.type || "").toLowerCase();
    const kind = isEvent ? "event" : botCardType === "rare" ? "rare" : "defi";
    const prefix = kind === "event" ? "Événement" : "";
    const challengeMatch = body.match(
      /^\[([^\]]+)\] te défie à la course, cours ([0-9.,\s]+km) avant le (.+) pour gagner sa carte !$/i
    );
    const eventMatch = body.match(
      /^Fais\s+([0-9.,\s]+)\s*km\s+aujourd'hui\s+pour\s+gagner\s+la\s+carte\s+(.+)$/i
    );
    const parseDistance = (raw) => {
      if (!raw) return { label: null, value: null };
      const num = Number.parseFloat(String(raw).toLowerCase().replace("km", "").replace(/\s+/g, "").replace(",", "."));
      if (!Number.isFinite(num)) return { label: String(raw).trim(), value: null };
      return { label: formatKmFixed(num), value: num };
    };
    let botName = cardBot?.name || activeChallenge?.bot_name || "Un bot";
    let distanceLabel = null;
    let dueLabel = null;
    let dueTs = null;
    let dueIsEvent = false;
    if (challengeMatch) {
      botName = challengeMatch[1] || botName;
      const parsed = parseDistance(challengeMatch[2]);
      distanceLabel = parsed.label;
      const rawDue = challengeMatch[3] || null;
      const parsedDue = rawDue ? dayjs(rawDue) : null;
      if (parsedDue && parsedDue.isValid()) {
        dueLabel = formatEventDate(parsedDue.format("YYYY-MM-DD"));
        dueTs = parsedDue.startOf("day").valueOf();
      } else {
        dueLabel = rawDue;
      }
    }
    if (eventMatch) {
      const parsed = parseDistance(eventMatch[1]);
      distanceLabel = parsed.label;
      botName = cardBot?.name || eventMatch[2] || botName;
    }
    if (!distanceLabel && Number.isFinite(activeChallenge?.target_distance_m)) {
      distanceLabel = formatKmFixed(Number(activeChallenge.target_distance_m) / 1000);
    }
    if (!isEvent && (eventNotification || upcomingEventBot)) {
      const eventDateValue = (eventNotification?.event_date || eventNotification?.created_at || upcomingEventBot?.user?.bot_event_date || "");
      const eventTs = dayjs(eventDateValue).startOf("day").valueOf();
      if (!dueTs && activeChallenge?.due_at) {
        const ts = dayjs(activeChallenge.due_at).startOf("day").valueOf();
        if (Number.isFinite(ts)) dueTs = ts;
      }
      if (!dueTs || (Number.isFinite(eventTs) && eventTs <= dueTs)) {
        const formatted = formatEventDate(eventDateValue);
        dueLabel = formatted || dueLabel;
        dueIsEvent = true;
      }
    }
    if (activeChallenge?.due_date && !isEvent) {
      const formatted = formatEventDate(activeChallenge.due_date);
      if (!dueLabel) dueLabel = formatted || null;
      if (!dueTs) {
        const ts = dayjs(activeChallenge.due_date).startOf("day").valueOf();
        if (Number.isFinite(ts)) dueTs = ts;
      }
    }
    if (!dueLabel && !isEvent) {
      const baseDate = cardNotification?.created_at ? dayjs(cardNotification.created_at) : dayjs();
      const fallback = baseDate.add(3, "day");
      const formatted = formatEventDate(fallback.format("YYYY-MM-DD"));
      dueLabel = formatted || null;
    }
    const distanceSuffix = isEvent ? "km aujourd'hui" : "km en une course";
    const title = kind === "event"
      ? (distanceLabel
        ? `${prefix} ${botName} – ${distanceLabel} ${distanceSuffix}`
        : `${prefix} ${botName}`)
      : (distanceLabel
        ? `${botName} te défie ! – ${distanceLabel} ${distanceSuffix}`
        : `${botName} te défie !`);
    const objective = distanceLabel ? `${distanceLabel} km minimum` : "Distance minimum";
    return {
      isEvent,
      kind,
      title,
      objective,
      dueLabel: isEvent ? "aujourd'hui" : dueLabel,
      dueIsEvent,
    };
  }, [cardNotification, cardBot, activeChallenge]);
  const showCardNotif = !!cardNotification && unreadNotifications.length === 1 && cardBot;
  const isAdminTestNotif = Array.isArray(adminNotifOverride) && adminNotifOverride.length > 0;
  const canCancelChallenge =
    !!onCancelChallenge &&
    !!activeChallenge?.id &&
    activeChallenge.type !== "evenement" &&
    cardNotification?.meta?.challenge_id &&
    String(cardNotification.meta.challenge_id) === String(activeChallenge.id);
  const canCancelEvent =
    !!onCancelChallenge &&
    !!activeChallenge?.id &&
    activeChallenge.type === "evenement" &&
    cardNotification?.meta?.challenge_id &&
    String(cardNotification.meta.challenge_id) === String(activeChallenge.id);
  const canCancelAny =
    (canCancelChallenge || canCancelEvent) ||
    (isAdminTestNotif && !!onCancelChallenge && cardNotification?.type);
  const openCardPreview = () => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;
    if (!cardBot) return;
    setShowCardPreview(true);
  };

  return (
    <div className="grid gap-4 px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0 pb-8">
      <div className="grid gap-4">
        {isAuth && onOpenCards && (
          <Reveal as="section">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative w-full">
                <button
                  type="button"
                  disabled={!hasUnreadNotif}
                  onClick={() => {
                    if (!unreadNotifications.length) return;
                    setShowNotifInfo((v) => !v);
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
                  onClose={() => {
                    setShowNotifInfo(false);
                    setAdminNotifOverride(null);
                    setShowCardPreview(false);
                  }}
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
                                          const parts = title.split(" – ");
                                          if (parts.length >= 2) {
                                            return (
                                              <div className="space-y-1">
                                                <div>{parts[0]}</div>
                                                <div className="text-base font-medium text-slate-600 dark:text-slate-300">
                                                  {parts.slice(1).join(" – ")}
                                                </div>
                                              </div>
                                            );
                                          }
                                          return title;
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
                                          Objectif : <span className="font-semibold">{cardNotifDetails?.objective || "Distance minimum"}</span>
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
                                      setShowNotifInfo(false);
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
                                      setShowNotifInfo(false);
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
                      : unreadNotifications.length
                        ? unreadNotifications.map((n) => (
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
                      <div
                        className="absolute inset-0 bg-black/80"
                        onClick={() => setShowCardPreview(false)}
                        aria-hidden="true"
                      />
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
        )}
        <Reveal as="section">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-col gap-2 border-b px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <Newspaper size={18} />
                  Événements spéciaux
                </span>
              </h2>
              <div className="flex w-full justify-end md:w-auto md:justify-start">
                <button
                  type="button"
                  onClick={() => onOpenNewsArchive?.()}
                  disabled={!newsItems.length}
                  className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                >
                  Toutes les news
                </button>
              </div>
            </div>
            <div className="p-4">
              {newsLoading ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">Chargement…</div>
              ) : newsError ? (
                <div className="text-sm text-rose-600 dark:text-rose-300">Erreur: {newsError}</div>
              ) : !latestNews.length ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Aucune news pour le moment.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {latestNews.map((item) => {
                    const ready = !!newsImageReadyMap[item.id];
                    const content = (
                      <>
                        {!ready && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/60">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400/70 border-t-transparent" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/30" aria-hidden="true" />
                        <div className="absolute inset-0 flex flex-col px-5 pt-5 pb-5 text-slate-100">
                          <div className="text-sm font-semibold uppercase tracking-wide text-slate-100/80">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatEventDate(item.event_date)}{" "}
                            {item.city ? <span className="italic font-normal">({item.city})</span> : null}
                          </div>
                          {item.subtitle ? (
                            <div className="mt-auto text-sm font-medium italic text-slate-100/80">
                              « {item.subtitle} »
                            </div>
                          ) : null}
                        </div>
                      </>
                    );
                    const focusY = Number.isFinite(Number(item.image_focus_y))
                      ? Math.min(100, Math.max(0, Number(item.image_focus_y)))
                      : null;
                    const card = (
                      <div
                        className={`group relative min-h-[180px] overflow-hidden rounded-2xl border border-slate-200 px-5 pt-5 pb-10 text-slate-900 shadow-sm dark:border-slate-700 dark:text-slate-100 ${
                          item.link_url ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 ${item.link_url ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]" : ""}`}
                          style={{
                            backgroundImage: ready ? `url(${item.image_url})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: focusY !== null ? `50% ${focusY}%` : "50% 50%",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950/60" aria-hidden="true" />
                        {content}
                      </div>
                    );
                    if (item.link_url) {
                      return (
                        <a
                          key={item.id}
                          href={item.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="transition hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          {card}
                        </a>
                      );
                    }
                    return <div key={item.id}>{card}</div>;
                  })}
                </div>
              )}
            </div>
          </div>
        </Reveal>
        {totals.length > 0 && (
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
                {hasBotsInRanking && (
                  <div className="flex w-full justify-end md:w-auto md:justify-start">
                    <button
                      type="button"
                      onClick={() => setShowBotsInPodium((prev) => !prev)}
                      className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                    >
                      {showBotsInPodium ? "Masquer les bots" : "Afficher les bots"}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {totals.map((u, index) => {
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
                      : "bg-slate-50/80 dark:bg-slate-800/50";
                    const hoverBg = u.isBot
                      ? "hover:bg-rose-100 dark:hover:bg-rose-900/40"
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
                                <Bot
                                  size={16}
                                  className="text-slate-500 dark:text-slate-400"
                                />
                              ) : (
                                <User
                                  size={16}
                                  className="text-slate-500 dark:text-slate-400"
                                />
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
        )}
      </div>
    </div>
  );
}
