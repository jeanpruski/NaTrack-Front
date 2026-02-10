import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { formatKmFixed } from "../utils/appUtils";

export function useDashboardData({
  userName,
  userInfo,
  userRunningAvgById,
  range,
  activeSeasonNumber,
  activeChallenge,
  activeChallengeDueAt,
  notifications,
  allUsers,
  currentUserId,
  cardsUnlockedCounts,
  showUserCard,
}) {
  const displayName = userName || userInfo?.name || "";
  const cardUser = userInfo || (userName ? { name: userName } : {});
  const userRunningAvgKm = userInfo ? userRunningAvgById?.get(userInfo.id) : null;
  const isBotUser = Boolean(userInfo?.is_bot);
  const botCardType = userInfo?.bot_card_type || "";
  const isSeasonRange = String(range || "").startsWith("season:");
  const isEventBot = isBotUser && botCardType === "evenement";
  const selectedSeasonKey = isSeasonRange ? String(range || "").split(":")[1] : null;
  const isActiveSeasonRange =
    isSeasonRange &&
    selectedSeasonKey !== null &&
    activeSeasonNumber !== null &&
    String(activeSeasonNumber) === String(selectedSeasonKey);
  const botBorderColor = userInfo?.bot_border_color || (isBotUser ? "#992929" : "");
  const showChallenge =
    !!activeChallenge &&
    currentUserId &&
    (!userInfo?.id || String(userInfo.id) === String(currentUserId));
  const showCardCounts = !isBotUser && cardsUnlockedCounts && userInfo?.id;

  const isEventChallenge = activeChallenge?.type === "evenement";
  const eventCancelInfo = useMemo(() => {
    const todayTs = dayjs().startOf("day").valueOf();
    const upcoming = (notifications || [])
      .filter((n) => n?.type === "event_start")
      .map((n) => ({
        notif: n,
        ts: dayjs(n?.event_date || n?.created_at).startOf("day").valueOf(),
      }))
      .filter((n) => Number.isFinite(n.ts) && n.ts >= todayTs)
      .sort((a, b) => a.ts - b.ts);
    const eventNotif = upcoming.length ? upcoming[0].notif : null;
    const eventBot = (allUsers || [])
      .filter((u) => u?.is_bot && String(u?.bot_card_type || "").toLowerCase() === "evenement" && u?.bot_event_date)
      .map((u) => ({
        user: u,
        ts: dayjs(u.bot_event_date).startOf("day").valueOf(),
      }))
      .filter((n) => Number.isFinite(n.ts) && n.ts >= todayTs)
      .sort((a, b) => a.ts - b.ts)[0] || null;
    if (!eventNotif && !eventBot) return { label: "", ts: null, isEventCancel: false };
    const dateValue = eventNotif?.event_date || eventNotif?.created_at || eventBot?.user?.bot_event_date || "";
    const formatted = dayjs(dateValue).locale("fr").format("dddd D MMMM YYYY");
    const parts = formatted.split(" ");
    if (parts.length < 3) return { label: formatted, ts: upcoming[0].ts };
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    const day = cap(parts[0]);
    const month = cap(parts[2]);
    const fallbackTs = eventBot?.ts ?? upcoming[0]?.ts ?? null;
    return { label: `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`, ts: fallbackTs, isEventCancel: true };
  }, [notifications, allUsers]);

  const formattedDueDate = useMemo(() => {
    if (!activeChallengeDueAt && !activeChallenge?.due_at && !activeChallenge?.due_date) return "";
    if (isEventChallenge) return "demain";
    const dueBase = activeChallengeDueAt || activeChallenge.due_at || activeChallenge.due_date;
    const dueTs = dueBase ? dayjs(dueBase).startOf("day").valueOf() : null;
    if (eventCancelInfo?.label && (!dueTs || (eventCancelInfo.ts !== null && eventCancelInfo.ts <= dueTs))) {
      return `${eventCancelInfo.label} (pour cause d'événement)`;
    }
    const dateValue = activeChallengeDueAt || activeChallenge.due_at || activeChallenge.due_date;
    const formatted = dayjs(dateValue).locale("fr").format("dddd D MMMM YYYY");
    const parts = formatted.split(" ");
    if (parts.length < 5) return formatted;
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    const day = cap(parts[0]);
    const month = cap(parts[2]);
    return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`;
  }, [activeChallenge, activeChallengeDueAt, eventCancelInfo, isEventChallenge]);

  const challengeKm = activeChallenge?.target_distance_m
    ? formatKmFixed(Number(activeChallenge.target_distance_m) / 1000)
    : null;
  const challengeBotRankInfo = useMemo(() => {
    if (!activeChallenge?.bot_id) return null;
    const pool = (allUsers && allUsers.length ? allUsers : []).filter((u) => Boolean(u?.is_bot));
    if (!pool.length) return null;
    const bots = pool.slice().sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.name || a.id || "").localeCompare(String(b.name || b.id || ""));
    });
    const index = bots.findIndex((u) => String(u.id) === String(activeChallenge.bot_id));
    if (index < 0) return null;
    return { index: index + 1, total: bots.length };
  }, [allUsers, activeChallenge]);

  const challengeBot = useMemo(() => {
    if (!activeChallenge?.bot_id) return null;
    const pool = allUsers && allUsers.length ? allUsers : [];
    const found = pool.find((u) => String(u.id) === String(activeChallenge.bot_id));
    if (found) {
      return {
        ...found,
        is_bot: true,
        bot_card_type: found.bot_card_type || activeChallenge.type || "defi",
      };
    }
    return {
      id: activeChallenge.bot_id,
      name: activeChallenge.bot_name || "Un bot",
      is_bot: true,
      bot_card_type: activeChallenge.type || "defi",
    };
  }, [allUsers, activeChallenge]);

  const challengeBotUser = challengeBot || { name: activeChallenge?.bot_name || "Un bot", is_bot: true };

  const toRgba = (hex, alpha) => {
    if (!hex) return "";
    const clean = hex.replace("#", "").trim();
    if (![3, 6].includes(clean.length)) return "";
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const num = Number.parseInt(full, 16);
    if (Number.isNaN(num)) return "";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    if (!showUserCard) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showUserCard]);

  useEffect(() => {
    const scrollTop = () => window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => requestAnimationFrame(scrollTop));
    setTimeout(scrollTop, 0);
    setTimeout(scrollTop, 80);
    setTimeout(scrollTop, 200);
  }, [userInfo?.id]);

  return {
    displayName,
    cardUser,
    userRunningAvgKm,
    isBotUser,
    botCardType,
    isSeasonRange,
    isEventBot,
    isActiveSeasonRange,
    botBorderColor,
    showChallenge,
    showCardCounts,
    isEventChallenge,
    eventCancelInfo,
    formattedDueDate,
    challengeKm,
    challengeBotRankInfo,
    challengeBotUser,
    toRgba,
  };
}
