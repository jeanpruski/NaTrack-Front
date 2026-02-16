import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Reveal } from "../components/Reveal";
import { RefreshCw } from "lucide-react";
import { formatKmFixed } from "../utils/appUtils";
import { buildMonthKeys } from "../utils/globalDashboard";
import { NewsSection } from "./global/NewsSection";
import { NotificationsSection } from "./global/NotificationsSection";
import { PodiumSection } from "./global/PodiumSection";
import { PlayerCardsSection } from "./global/PlayerCardsSection";
import { PullToRefreshOverlay } from "./global/PullToRefreshOverlay";
import { RecentActivitiesSection } from "./global/RecentActivitiesSection";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("fr");

export function GlobalDashboard({
  rangeLabel,
  modeLabel,
  mode,
  range,
  activeSeasonNumber = null,
  currentUserId = null,
  users,
  allUsers,
  totalsByUser,
  sessions,
  nfDecimal,
  onSelectUser,
  sessionLikes,
  sessionLikePending,
  onToggleSessionLike,
  onOpenCards,
  onOpenNewsArchive,
  onCancelChallenge,
  isAdmin,
  isAuth,
  showMoreRecent = false,
  onToggleShowMoreRecent,
  showMorePodium = false,
  onToggleShowMorePodium,
  showBotsInPodium = false,
  onToggleShowBotsInPodium,
  showMoreCards = false,
  onToggleShowMoreCards,
  notifications = [],
  notificationsLoading = false,
  notificationsError = "",
  onRefreshNotifications,
  onRefresh,
  activeChallenge,
  newsItems = [],
  newsLoading = false,
  newsError = "",
  onOpenMyOptions,
  isRefreshing = false,
  pullActive = false,
  pullDistance = 0,
}) {
  const [newsImageReadyMap, setNewsImageReadyMap] = useState({});
  const [showNotifInfo, setShowNotifInfo] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const toggleShowMoreRecent = () => onToggleShowMoreRecent?.(!showMoreRecent);
  const toggleShowMorePodium = () => onToggleShowMorePodium?.(!showMorePodium);
  const toggleShowBotsInPodium = () => onToggleShowBotsInPodium?.(!showBotsInPodium);
  const toggleShowMoreCards = () => onToggleShowMoreCards?.(!showMoreCards);
  const [notifAnchorRect] = useState(null);
  const [adminNotifOverride, setAdminNotifOverride] = useState(null);
  const sessionLikesSet = useMemo(() => {
    if (sessionLikes instanceof Set) return sessionLikes;
    return new Set(sessionLikes || []);
  }, [sessionLikes]);
  const sessionLikePendingSet = useMemo(() => {
    if (sessionLikePending instanceof Set) return sessionLikePending;
    return new Set(sessionLikePending || []);
  }, [sessionLikePending]);
  const showRecentActivityCard = useMemo(() => {
    if (range === "all" || range === "month" || range === "3m") return true;
    if (String(range || "").startsWith("season:") && activeSeasonNumber !== null && activeSeasonNumber !== undefined) {
      return String(range) === `season:${activeSeasonNumber}`;
    }
    return false;
  }, [range, activeSeasonNumber]);
  const userNameById = useMemo(() => {
    const map = new Map();
    const pool = (allUsers && allUsers.length ? allUsers : users) || [];
    pool.forEach((u) => {
      if (u?.id !== undefined && u?.id !== null) map.set(String(u.id), u.name || "Utilisateur");
    });
    return map;
  }, [allUsers, users]);
  const userById = useMemo(() => {
    const map = new Map();
    const pool = (allUsers && allUsers.length ? allUsers : users) || [];
    pool.forEach((u) => {
      if (u?.id !== undefined && u?.id !== null) map.set(String(u.id), u);
    });
    return map;
  }, [allUsers, users]);
  const userIsBotById = useMemo(() => {
    const map = new Map();
    const pool = (allUsers && allUsers.length ? allUsers : users) || [];
    pool.forEach((u) => {
      if (u?.id !== undefined && u?.id !== null) map.set(String(u.id), Boolean(u?.is_bot));
    });
    return map;
  }, [allUsers, users]);
  const recentActivities = useMemo(() => {
    const toParis = (value) => {
      if (!value) return null;
      const raw = String(value);
      const parsed = dayjs.utc(raw).tz("Europe/Paris");
      return parsed.isValid() ? parsed : dayjs(raw);
    };
    const hasTimePart = (value) => {
      if (!value) return false;
      const raw = String(value);
      return /[T\s]\d{1,2}:\d{2}/.test(raw);
    };
    const buildSessionTs = (sessionDate, createdAt) => {
      const sessionHasTime = hasTimePart(sessionDate);
      if (sessionHasTime) {
        const ts = toParis(sessionDate)?.valueOf();
        return Number.isFinite(ts) ? ts : 0;
      }
      const baseDay = toParis(sessionDate)?.startOf("day");
      if (!baseDay || !baseDay.isValid()) return 0;
      const created = toParis(createdAt);
      if (created && created.isValid()) {
        return baseDay
          .hour(created.hour())
          .minute(created.minute())
          .second(created.second())
          .millisecond(created.millisecond())
          .valueOf();
      }
      return baseDay.valueOf();
    };
    const buildDateLabel = (sessionDate, createdAt) => {
      if (!sessionDate) return "—";
      const sessionHasTime = hasTimePart(sessionDate);
      if (sessionHasTime) {
        return toParis(sessionDate)?.format("D MMM HH:mm") || "—";
      }
      const base = toParis(sessionDate);
      if (!base || !base.isValid()) return "—";
      const created = toParis(createdAt);
      if (created && created.isValid()) {
        return `${base.format("D MMM")} ${created.format("HH:mm")}`;
      }
      return base.format("D MMM");
    };
    const list = (sessions || []).filter((s) => {
      const isBot =
        s?.is_bot !== undefined
          ? Boolean(s.is_bot)
          : userIsBotById.get(String(s?.user_id)) || false;
      return !isBot;
    });
    list.sort((a, b) => {
      const aRaw = a?.date || null;
      const bRaw = b?.date || null;
      const aDay = toParis(aRaw)?.startOf("day").valueOf() || 0;
      const bDay = toParis(bRaw)?.startOf("day").valueOf() || 0;
      if (aDay !== bDay) return bDay - aDay;
      const aTs = buildSessionTs(a?.date, a?.created_at);
      const bTs = buildSessionTs(b?.date, b?.created_at);
      if (aTs !== bTs) return bTs - aTs;
      return String(b?.id || "").localeCompare(String(a?.id || ""));
    });
    return list.map((s) => {
      const userName = s?.user_name || userNameById.get(String(s?.user_id)) || "Utilisateur";
      const challengeCompleted = Boolean(s?.challenge_completed || s?.challengeCompleted);
      const challenge = s?.challenge || s?.challenge_info || null;
      const challengeName =
        (challenge?.event_name || challenge?.bot_name || challenge?.bot?.name || challenge?.name || "").trim() || null;
      const challengeType = String(challenge?.type || "").toLowerCase() || null;
      const targetMetersRaw =
        challenge?.target_distance_m ??
        challenge?.distance_m ??
        (Number.isFinite(Number(challenge?.target_km)) ? Number(challenge.target_km) * 1000 : null);
      const targetMeters = Number.isFinite(Number(targetMetersRaw)) ? Number(targetMetersRaw) : null;
      const distanceKm = Number.isFinite(Number(s?.distance)) ? Number(s.distance) / 1000 : null;
      const dateLabel = buildDateLabel(s?.date || null, s?.created_at || null);
      return {
        id: s?.id ?? `${userName}-${s?.date || ""}-${s?.distance || ""}`,
        sessionId: s?.id ?? null,
        userId: s?.user_id ?? null,
        userName,
        dateLabel,
        challengeLabel:
          challengeCompleted && challengeName
            ? challengeType === "evenement"
              ? `Event ${challengeName}`
              : challengeName
            : "—",
        challengeType: challengeCompleted && challengeType ? challengeType : null,
        kmLabel: distanceKm !== null ? `${formatKmFixed(distanceKm)} km` : "—",
        targetLabel: challengeCompleted && targetMeters !== null ? `${formatKmFixed(targetMeters / 1000)} km` : "—",
        likesCount: Number(s?.likes_count) || 0,
      };
    });
  }, [sessions, userIsBotById, userNameById]);
  const recentActivitiesShown = useMemo(() => {
    return recentActivities.slice(0, showMoreRecent ? 20 : 3);
  }, [recentActivities, showMoreRecent]);
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

  const isFreshNotification = (n) => {
    const created = dayjs(n?.created_at);
    if (!created.isValid()) return true;
    const todayStart = dayjs().startOf("day");
    if (n.type === "event_start") {
      return created.startOf("day").valueOf() === todayStart.valueOf();
    }
    if (n.type === "challenge_start") {
      const threshold = todayStart.subtract(2, "day").valueOf();
      return created.startOf("day").valueOf() >= threshold;
    }
    return true;
  };
  const realUnreadNotifications = (notifications || [])
    .filter(
      (n) =>
        !n.read_at &&
        (n.type === "challenge_start" || n.type === "event_start")
    )
    .filter(isFreshNotification);
  const unreadNotifications = adminNotifOverride || realUnreadNotifications;
  const latestUnreadNotification = useMemo(() => {
    if (!unreadNotifications.length) return null;
    return [...unreadNotifications].sort((a, b) => {
      const aTs = dayjs(a?.created_at || 0).valueOf();
      const bTs = dayjs(b?.created_at || 0).valueOf();
      if (aTs !== bTs) return bTs - aTs;
      return String(b?.id || "").localeCompare(String(a?.id || ""));
    })[0];
  }, [unreadNotifications]);
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
  const podiumShown = useMemo(() => {
    return totals.slice(0, showMorePodium ? totals.length : 3);
  }, [totals, showMorePodium]);
  const cardCountsByUser = useMemo(() => {
    const pool = (allUsers && allUsers.length ? allUsers : users) || [];
    return pool
      .filter((u) => !u?.is_bot)
      .map((u) => {
        const defi = Number(u?.cards_defi) || 0;
        const rare = Number(u?.cards_rare) || 0;
        const evenement = Number(u?.cards_evenement) || 0;
        const lastUniqueRaw = u?.cards_last_unique_at || null;
        const lastUniqueLabel = lastUniqueRaw && dayjs(lastUniqueRaw).isValid()
          ? dayjs(lastUniqueRaw).locale("fr").format("D MMM YYYY")
          : null;
        const score = defi + evenement * 2 + rare * 3;
        return {
          id: u?.id,
          name: u?.name || "Utilisateur",
          defi,
          rare,
          evenement,
          lastLabel: lastUniqueLabel,
          score,
          user: u,
        };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return String(a.name).localeCompare(String(b.name));
      });
  }, [allUsers, users]);
  const cardCountsShown = useMemo(() => {
    const rows = cardCountsByUser.filter((u) => u.score > 0);
    return showMoreCards ? rows : rows.slice(0, 3);
  }, [cardCountsByUser, showMoreCards]);

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

  const cardNotification =
    latestUnreadNotification &&
    (latestUnreadNotification.type === "event_start" || latestUnreadNotification.type === "challenge_start")
      ? latestUnreadNotification
      : null;
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
      /^\[([^\]]+)\] te défie à la course, cours ([0-9.,\s]+km) (?:avant le|au plus tard le) (.+) pour gagner sa carte !$/i
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
      const fallback = baseDate.add(2, "day");
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
  const showCardNotif = !!cardNotification && cardBot;
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

  const showPull = isRefreshing;
  const handleToggleNotifInfo = () => {
    if (!unreadNotifications.length) return;
    setShowNotifInfo((v) => !v);
  };
  return (
    <div className="relative grid gap-4 px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0 pb-8">
      <PullToRefreshOverlay show={showPull} />
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Rafraîchir"
          className="fixed bottom-6 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/90 text-white shadow-lg transition hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      )}
      <div
        className={`transition-[filter] duration-500 ease-out ${showPull ? "blur-[2px]" : "blur-0"}`}
      >
        <div className="grid gap-4">
        <NotificationsSection
          isAuth={isAuth}
          onOpenCards={onOpenCards}
          hasUnreadNotif={hasUnreadNotif}
          unreadNotifications={unreadNotifications}
          showNotifInfo={showNotifInfo}
          onToggleNotifInfo={handleToggleNotifInfo}
          onCloseNotifInfo={() => {
            setShowNotifInfo(false);
            setAdminNotifOverride(null);
            setShowCardPreview(false);
          }}
          showCardNotif={showCardNotif}
          latestUnreadNotification={latestUnreadNotification}
          notificationsLoading={notificationsLoading}
          notificationsError={notificationsError}
          cardNotifDetails={cardNotifDetails}
          cardBot={cardBot}
          botRankInfo={botRankInfo}
          openCardPreview={openCardPreview}
          showCardPreview={showCardPreview}
          onCloseCardPreview={() => setShowCardPreview(false)}
          cardNotification={cardNotification}
          activeChallenge={activeChallenge}
          getRemainingDays={getRemainingDays}
          onCancelChallenge={onCancelChallenge}
          canCancelAny={canCancelAny}
          onOpenMyOptions={onOpenMyOptions}
          nfDecimal={nfDecimal}
        />
        <NewsSection
          onOpenNewsArchive={onOpenNewsArchive}
          newsItems={newsItems}
          newsLoading={newsLoading}
          newsError={newsError}
          latestNews={latestNews}
          newsImageReadyMap={newsImageReadyMap}
          formatEventDate={formatEventDate}
        />
        <RecentActivitiesSection
          showRecentActivityCard={showRecentActivityCard}
          recentActivities={recentActivities}
          recentActivitiesShown={recentActivitiesShown}
          showMoreRecent={showMoreRecent}
          onToggleShowMore={toggleShowMoreRecent}
          userById={userById}
          currentUserId={currentUserId}
          isAuth={isAuth}
          sessionLikesSet={sessionLikesSet}
          sessionLikePendingSet={sessionLikePendingSet}
          onToggleSessionLike={onToggleSessionLike}
          onSelectUser={onSelectUser}
        />
        <PodiumSection
          totals={totals}
          subtitle={subtitle}
          hasBotsInRanking={hasBotsInRanking}
          showBotsInPodium={showBotsInPodium}
          onToggleBots={toggleShowBotsInPodium}
          showMorePodium={showMorePodium}
          onToggleMore={toggleShowMorePodium}
          podiumShown={podiumShown}
          sparklineMap={sparklineMap}
          onSelectUser={onSelectUser}
          nfDecimal={nfDecimal}
        />
        <PlayerCardsSection
          cardCountsByUser={cardCountsByUser}
          cardCountsShown={cardCountsShown}
          showMoreCards={showMoreCards}
          onToggleMore={toggleShowMoreCards}
          currentUserId={currentUserId}
          onSelectUser={onSelectUser}
        />
        </div>
      </div>
    </div>
  );
}
