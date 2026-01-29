import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarCheck,
  Calculator,
  BarChart3,
  Waves,
  PersonStanding,
  Footprints,
  Gauge,
  Car,
  Train,
  Plane,
  Globe,
  Medal,
  Scale,
  Trophy,
  TrendingUpDown,
  Target,
  Bot,
  Newspaper,
  Sparkles,
  Swords,
  User,
} from "lucide-react";
import { KpiChip } from "../components/KpiChip";
import { SwimChart } from "../components/SwimChart";
import { MonthlyBarChart } from "../components/MonthlyBarChart";
import { SportSharePie } from "../components/SportSharePie";
import { CalendarHeatmap } from "../components/CalendarHeatmap";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { UserHoloCard } from "../components/UserHoloCard";
import { Reveal } from "../components/Reveal";
import { TypePill } from "../components/TypePill";
import { capFirst } from "../utils/strings";
import { formatDistance, formatKmDecimal, pluralize, weekOfMonthLabel } from "../utils/appUtils";

const PROGRESS_GOALS = [
  { id: "paris-disneyland", label: "Paris → Disneyland", targetMeters: 45000, Icon: Car },
  { id: "paris-metz", label: "Paris → Metz", targetMeters: 330000, Icon: Train },
  { id: "paris-athenes", label: "Paris → Athènes", targetMeters: 2100000, Icon: Plane },
  { id: "tour-du-monde", label: "Tour du monde", targetMeters: 40075000, Icon: Globe },
];

export function Dashboard({
  hasSessions,
  mode,
  range,
  modeLabel,
  rangeLabel,
  shownSessions,
  stats,
  monthTotals,
  monthCounts,
  monthLabel,
  lastLabel,
  lastType,
  daysSinceLast,
  showMonthCardsOnlyWhenAllRange,
  showMonthlyChart,
  showCompareInline,
  showCompareAbove,
  monthCompare,
  compareTotalWinner,
  compareToDayWinner,
  records,
  sportTotals,
  shoesLifeByRange,
  firstSessionLabel,
  nf,
  nfDecimal,
  activeSeasonNumber = null,
  seasonStartDate = null,
  seasonEndDate = null,
  userName,
  userInfo,
  userRankInfo,
  userRunningAvgById,
  userCardOpen,
  onUserCardOpenChange,
  currentUserId,
  cardsUnlockedCounts,
  activeChallenge,
  activeChallengeDueAt,
}) {
  const showUserCard = Boolean(userCardOpen);
  const setShowUserCard = onUserCardOpenChange || (() => {});

  const displayName = userName || userInfo?.name || "";
  const cardUser = userInfo || (userName ? { name: userName } : {});
  const userRunningAvgKm = userInfo ? userRunningAvgById?.get(userInfo.id) : null;
  const isBotUser = Boolean(userInfo?.is_bot);
  const isSeasonRange = String(range || "").startsWith("season:");
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

  const formattedDueDate = (() => {
    if (!activeChallengeDueAt && !activeChallenge?.due_at && !activeChallenge?.due_date) return "";
    const dateValue = activeChallengeDueAt || activeChallenge.due_at || activeChallenge.due_date;
    const formatted = dayjs(dateValue)
      .locale("fr")
      .format("dddd D MMMM YYYY à HH:mm");
    const parts = formatted.split(" ");
    if (parts.length < 5) return formatted;
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    const day = cap(parts[0]);
    const month = cap(parts[2]);
    return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`;
  })();

  const challengeKm = activeChallenge?.target_distance_m
    ? (Number(activeChallenge.target_distance_m) / 1000).toFixed(3)
    : null;

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

  const userCard = (
    <AnimatePresence>
      {showUserCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-[30px] sm:px-4"
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowUserCard(false)}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-[360px] mx-auto"
            initial={{ opacity: 0, scale: 0.9, rotateX: 18, y: -12 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: -6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <UserHoloCard
              user={cardUser}
              nfDecimal={nfDecimal}
              userRankInfo={userRankInfo}
              elevated
              showBotAverage
              userRunningAvgKm={userRunningAvgKm}
              minSpinnerMs={500}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const [heroHover, setHeroHover] = useState(false);

  const heroBadge = displayName ? (
    <Reveal as="section" className="px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0">
      <button
        type="button"
        onClick={() => setShowUserCard(true)}
        onMouseEnter={() => setHeroHover(true)}
        onMouseLeave={() => setHeroHover(false)}
        className={`relative w-full overflow-hidden text-left rounded-2xl border-0 ${
          isBotUser ? "bg-gradient-to-r from-rose-400/60 to-transparent" : "bg-gradient-to-r from-emerald-300/60 to-transparent"
        } px-4 py-3 text-slate-900 shadow-sm transition-colors duration-200 ${
          isBotUser
            ? "hover:border-rose-400 hover:ring-1 hover:ring-rose-300/70 focus-visible:ring-rose-300"
            : "hover:border-emerald-400 hover:ring-1 hover:ring-emerald-300/70 focus-visible:ring-emerald-300"
        } focus:outline-none dark:text-slate-100`}
        style={
          botBorderColor
            ? {
                borderColor: undefined,
                backgroundColor: isBotUser
                  ? undefined
                  : heroHover
                    ? toRgba(botBorderColor, 0.18)
                    : toRgba(botBorderColor, 0.08),
                backgroundImage: isBotUser ? undefined : "none",
              }
            : undefined
        }
      >
        <span
          className={`pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 hover:opacity-100 ${
            isBotUser ? "bg-rose-400/45" : "bg-emerald-300/45"
          }`}
        />
        <div className="relative flex items-center justify-between gap-2 text-xl sm:text-2xl font-black tracking-tight">
          <div className="flex flex-wrap items-center gap-2">
            {isBotUser ? (
              <Bot size={18} className="text-slate-900 dark:text-white" />
            ) : (
              <User size={18} className="text-slate-900 dark:text-white" />
            )}
            <span className="whitespace-nowrap">{displayName}</span>
          </div>
          {showCardCounts && (
            <span className="flex flex-wrap items-center gap-2 text-[18px] font-extrabold text-slate-800 dark:text-slate-100">
              <span className="inline-flex items-center gap-0.5">
                {cardsUnlockedCounts.defi || 0}
                <Swords size={16} className="text-slate-700 dark:text-slate-200" />
              </span>
              <span className="opacity-60">·</span>
              <span className="inline-flex items-center gap-0.5">
                {cardsUnlockedCounts.rare || 0}
                <Sparkles size={16} className="text-slate-700 dark:text-slate-200" />
              </span>
              <span className="opacity-60">·</span>
              <span className="inline-flex items-center gap-0.5">
                {cardsUnlockedCounts.evenement || 0}
                <Newspaper size={16} className="text-slate-700 dark:text-slate-200" />
              </span>
            </span>
          )}
        </div>
      </button>
    </Reveal>
  ) : null;

  if (!hasSessions) {
    return (
      <>
        {heroBadge}
        {userCard}
        {showChallenge && (
          <div className="px-4 xl:px-8 pt-4">
            <Reveal>
              <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-400/20 dark:bg-rose-900/20 dark:text-rose-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="font-semibold">
                    Défi en cours contre {activeChallenge.bot_name || "un bot"}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-200 sm:text-right">
                    <span className="hidden sm:inline">À réaliser avant le {formattedDueDate}</span>
                  </div>
                </div>
                {challengeKm && (
                  <div className="mt-1 text-sm">
                    Distance à atteindre : <span className="font-semibold">{challengeKm} km</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200 sm:hidden">
                  À réaliser avant le {formattedDueDate}
                </div>
              </div>
            </Reveal>
          </div>
        )}
        <Reveal as="section" className="px-4 xl:px-8 pt-4 pb-8">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <div className="text-lg font-semibold">Aucune seance</div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aucune seance pour {mode === "all" ? "tous les sports" : modeLabel.toLowerCase()} sur {rangeLabel}.
            </p>
          </div>
        </Reveal>
      </>
    );
  }

  const comparePanel = (
    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          <span className="inline-flex items-center gap-2">
            <CalendarCheck size={18} />
            Comparatif mensuel — {mode === "all" ? "Mixte" : modeLabel}
          </span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
          {monthCompare.currentLabel} vs {monthCompare.lastLabel}
        </span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {(() => {
          const totalWinner = compareTotalWinner;
          const totalDenom = monthCompare.currentTotal + monthCompare.lastTotal;
          const totalMarker = totalDenom > 0 ? (monthCompare.currentTotal / totalDenom) * 100 : 50;
          const toDayWinner = compareToDayWinner;
          const toDayDenom = monthCompare.currentToDay + monthCompare.lastToDay;
          const toDayMarker = toDayDenom > 0 ? (monthCompare.currentToDay / toDayDenom) * 100 : 50;

          return (
            <>
              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Total des mois</span>
                  {totalWinner !== "tie" && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      <Trophy size={14} />
                      {totalWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.currentLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.currentTotal, nfDecimal)}
                    </span>
                  </div>
                  <div
                    className={`relative h-2 w-full rounded-full overflow-hidden ${
                      totalDenom > 0 ? "bg-sky-400" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {totalDenom > 0 && (
                      <>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                          style={{ width: `${totalMarker}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                          style={{ left: `calc(${totalMarker}% - 1px)` }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.lastLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.lastTotal, nfDecimal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>A date (J{monthCompare.currentDay} vs J{monthCompare.lastMonthDay})</span>
                  {toDayWinner !== "tie" && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      <Trophy size={14} />
                      {toDayWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.currentLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.currentToDay, nfDecimal)}
                    </span>
                  </div>
                  <div
                    className={`relative h-2 w-full rounded-full overflow-hidden ${
                      toDayDenom > 0 ? "bg-sky-400" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {toDayDenom > 0 && (
                      <>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                          style={{ width: `${toDayMarker}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                          style={{ left: `calc(${toDayMarker}% - 1px)` }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.lastLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.lastToDay, nfDecimal)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      {heroBadge}
      {userCard}
      {showChallenge && (
        <div className="px-4 xl:px-8 pt-4">
          <Reveal>
            <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-400/20 dark:bg-rose-900/20 dark:text-rose-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="font-semibold">
                    Défi en cours contre {activeChallenge.bot_name || "un bot"}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-200 sm:text-right">
                    <span className="hidden sm:inline">À réaliser avant le {formattedDueDate}</span>
                  </div>
                </div>
                {challengeKm && (
                  <div className="mt-1 text-sm">
                    Distance à atteindre : <span className="font-semibold">{challengeKm} km</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200 sm:hidden">
                  À réaliser avant le {formattedDueDate}
                </div>
            </div>
          </Reveal>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_3fr] gap-4 items-start px-4 xl:px-8 pt-4 pb-4 xl:pt-3 xl:pb-4">
        <Reveal as="aside" className="self-start">
          <div className="grid grid-cols-1 min-[800px]:grid-cols-2 xl:grid-cols-1 gap-4">
            {showMonthCardsOnlyWhenAllRange && !isBotUser && (
              <KpiChip
                title="Dernière séance"
                subtitle={mode === "all" ? lastLabel : `${modeLabel} · ${lastLabel}`}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    {daysSinceLast !== null ? (
                      <div className="mt-1 flex justify-end gap-2 flex-wrap items-center">
                        <div className="font-bold leading-none flex items-baseline">
                          {nf.format(daysSinceLast)}
                          <span className="ml-1 text-xs opacity-70 leading-none">
                            jour{daysSinceLast > 1 ? "s" : ""}
                          </span>
                        </div>

                        {mode === "all" && lastType && (
                          <TypePill type={lastType}>
                            {lastType === "run" ? "Running" : "Natation"}
                          </TypePill>
                        )}
                      </div>
                    ) : (
                      <div className="font-bold">—</div>
                    )}
                  </div>
                }
                icon={<CalendarCheck />}
                tone={daysSinceLast > 4 ? "danger" : "default"}
              />
            )}

            {showMonthCardsOnlyWhenAllRange && (
              <KpiChip
                title="Total du mois"
                subtitle={mode === "all" ? monthLabel : modeLabel}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <AnimatedNumber value={monthTotals.all} format={(n) => nf.format(Math.round(n))} />{" "}
                      <span className="text-xs opacity-70">m</span>
                    </div>
                    {mode === "all" && (
                      <div className="mt-1 flex justify-end gap-2 flex-wrap">
                        <TypePill type="swim">{nf.format(monthTotals.swim)} m</TypePill>
                        <TypePill type="run">{nf.format(monthTotals.run)} m</TypePill>
                      </div>
                    )}
                  </div>
                }
                icon={<Calculator />}
              />
            )}

            {showMonthCardsOnlyWhenAllRange && (
              <KpiChip
                title="Séances ce mois-ci"
                subtitle={mode === "all" ? monthLabel : modeLabel}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <AnimatedNumber value={monthCounts.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                      {monthCounts.totalN > 1 ? "Séances" : "Séance"}
                    </div>
                    {mode === "all" && (
                      <div className="mt-1 flex justify-end gap-2 flex-wrap">
                        <TypePill type="swim">{pluralize(monthCounts.swimN, "Séance")}</TypePill>
                        <TypePill type="run">{pluralize(monthCounts.runN, "Séance")}</TypePill>
                      </div>
                    )}
                  </div>
                }
                icon={<CalendarDays />}
              />
            )}

            <KpiChip
              title="Moyenne / séance"
              subtitle={mode === "all" ? "Par sport" : modeLabel}
              value={
                mode === "all" ? (
                  <div className="mt-1 flex justify-end gap-2 flex-wrap">
                    <TypePill type="swim">
                      {nf.format(stats.swimAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                    <TypePill type="run">
                      {nf.format(stats.runAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                  </div>
                ) : (
                  <div className="text-right font-bold">
                    <AnimatedNumber
                      value={mode === "swim" ? stats.swimAvg : stats.runAvg}
                      format={(n) => nf.format(Math.round(n))}
                    />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                )
              }
              icon={<Gauge />}
            />

            {mode === "run" &&
              shoesLifeByRange &&
              (range === "all" ||
                range === "month" ||
                range === "6m" ||
                range === "3m" ||
                range === "2026" ||
                isActiveSeasonRange) && (
                <KpiChip
                  title="Chaussures"
                  subtitle={
                    <span className="block">
                      <span className="block break-words">{shoesLifeByRange.name}</span>
                      {/* <span className="text-xs opacity-70">
                        Début: {dayjs(shoesLifeByRange.startDate).format("DD/MM/YYYY")} ·{" "}
                        {nfDecimal.format(shoesLifeByRange.targetKm)} km
                      </span> */}
                    </span>
                  }
                  subtitleClassName="whitespace-normal leading-tight"
                  tone={shoesLifeByRange.remaining <= 0 ? "danger" : "default"}
                  value={
                    <div className="text-right">
                      <div className="font-bold whitespace-nowrap">
                        {nfDecimal.format(shoesLifeByRange.remaining / 1000)}{" "}
                        <span className="text-xs opacity-70">
                          km restants
                        </span>
                        <div className="text-xs opacity-70 mb-2">  
                          ({nfDecimal.format(shoesLifeByRange.used / 1000)}km /{" "}
                          {nfDecimal.format(shoesLifeByRange.targetKm)}km)
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                          shoesLifeByRange.remaining <= 0 ? "bg-rose-500" : "bg-emerald-400"
                          }`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${shoesLifeByRange.percent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          viewport={{ once: true, amount: 0.4 }}
                        />
                      </div>
                    </div>
                  }
                  icon={<Footprints />}
                />
              )}

            <KpiChip
              title="Distance totale"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={stats.totalMeters} format={(n) => nf.format(Math.round(n))} />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{nf.format(stats.swimSum)} m</TypePill>
                      <TypePill type="run">{nf.format(stats.runSum)} m</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<Calculator />}
            />

            <KpiChip
              title="Séances totales"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={stats.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                    {stats.totalN > 1 ? "Séances" : "Séance"}
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{pluralize(stats.swimN, "Séance")}</TypePill>
                      <TypePill type="run">{pluralize(stats.runN, "Séance")}</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />

            {showCompareInline && (
              <>
                <KpiChip
                  title="Comparatif"
                  subtitle={`${mode === "all" ? "Mixte" : modeLabel}`}
                  value={
                    <div className="text-right">
                      <div className="font-bold">
                        <span className="text-base">
                          {nfDecimal.format(monthCompare.currentTotal / 1000)}
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                        </span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatKmDecimal(monthCompare.lastTotal, nfDecimal)}
                        </span>
                      </div>
                      <div
                        className={`relative h-2 w-full rounded-full overflow-hidden ${
                          compareTotalWinner === "tie" && monthCompare.currentTotal === 0
                            ? "bg-slate-200 dark:bg-slate-700"
                            : "bg-sky-400"
                        }`}
                      >
                        {monthCompare.currentTotal + monthCompare.lastTotal > 0 && (
                          <>
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${(monthCompare.currentTotal / (monthCompare.currentTotal + monthCompare.lastTotal)) * 100}%`,
                              }}
                            />
                            <div
                              className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                              style={{
                                left: `calc(${(monthCompare.currentTotal / (monthCompare.currentTotal + monthCompare.lastTotal)) * 100}% - 1px)`,
                              }}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {compareTotalWinner === "tie" ? (
                          "Egalite"
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                            <Trophy size={14} />
                            {(compareTotalWinner === "current"
                              ? monthCompare.currentLabel
                              : monthCompare.lastLabel
                            ).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                  icon={<Trophy />}
                />
                <KpiChip
                  title={`Comparatif au ${monthCompare.currentDay}`}
                  subtitle={`${mode === "all" ? "Mixte" : modeLabel} à date`}
                  value={
                    <div className="text-right">
                      <div className="font-bold">
                        <span className="text-base">
                          {nfDecimal.format(monthCompare.currentToDay / 1000)}
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                        </span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatKmDecimal(monthCompare.lastToDay, nfDecimal)}
                        </span>
                      </div>
                      <div
                        className={`relative h-2 w-full rounded-full overflow-hidden ${
                          compareToDayWinner === "tie" && monthCompare.currentToDay === 0
                            ? "bg-slate-200 dark:bg-slate-700"
                            : "bg-sky-400"
                        }`}
                      >
                        {monthCompare.currentToDay + monthCompare.lastToDay > 0 && (
                          <>
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${(monthCompare.currentToDay / (monthCompare.currentToDay + monthCompare.lastToDay)) * 100}%`,
                              }}
                            />
                            <div
                              className="absolute inset-y-0 w-[2px] bg-white/80 dark:bg-slate-900/70"
                              style={{
                                left: `calc(${(monthCompare.currentToDay / (monthCompare.currentToDay + monthCompare.lastToDay)) * 100}% - 1px)`,
                              }}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {compareToDayWinner === "tie" ? (
                          "Egalite"
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                            <Trophy size={14} />
                            {(compareToDayWinner === "current"
                              ? monthCompare.currentLabel
                              : monthCompare.lastLabel
                            ).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                  icon={<CalendarDays />}
                />
              </>
            )}
          </div>
        </Reveal>

        <Reveal as="section" className="flex flex-col gap-4 self-start">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <TrendingUpDown size={18} />
                  Séances
                  {isSeasonRange && (
                    <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 sm:inline sm:ml-2">
                      {rangeLabel}
                    </span>
                  )}
                </span>
              </h2>
            </div>
            <div className="p-4">
              <SwimChart sessions={shownSessions} mode={mode} />
            </div>
          </div>

          {showMonthlyChart && !isSeasonRange && (
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 size={18} />
                    Cumulatif par mois
                  </span>
                </h2>
              </div>
              <div className="p-4">
                <MonthlyBarChart sessions={shownSessions} />
              </div>
            </div>
          )}
        </Reveal>
      </div>

      {showCompareAbove && (
        <Reveal as="section" className="px-4 xl:px-8 pb-4">
          {comparePanel}
        </Reveal>
      )}

      {!isBotUser && !isSeasonRange && (
        <Reveal as="section" className="px-4 xl:px-8 pb-4">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
          <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <Target size={18} />
                Objectifs distance
              </span>
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
              <span className="mr-2">Parcouru :</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                <AnimatedNumber value={stats.totalMeters / 1000} format={(n) => nfDecimal.format(n)} /> km
              </span>
            </div>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRESS_GOALS.map((goal) => {
              const percent = goal.targetMeters ? (stats.totalMeters / goal.targetMeters) * 100 : 0;
              const barPercent = Math.min(percent, 100);
              const target = formatDistance(goal.targetMeters, nf);
              const completedTimes = goal.targetMeters ? Math.floor(stats.totalMeters / goal.targetMeters) : 0;
              const remainingMeters = goal.targetMeters ? Math.max(goal.targetMeters - stats.totalMeters, 0) : 0;
              const remainingKm = formatKmDecimal(remainingMeters, nfDecimal);

              return (
                <div
                  key={goal.id}
                  className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <goal.Icon size={16} className="text-slate-700 dark:text-slate-200" />
                      {goal.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{target}</div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-sky-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${barPercent}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      viewport={{ once: true, amount: 0.4 }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>
                      {completedTimes > 0
                        ? `${formatDistance(stats.totalMeters, nf)} · ${completedTimes}× atteint`
                        : `${remainingKm}`}
                    </span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </Reveal>
      )}

      {!isBotUser && !isSeasonRange && (
        <Reveal as="section" className="px-4 xl:px-8 pb-4">
        <div className={`grid gap-4 ${mode === "all" ? "md:grid-cols-2" : ""}`}>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <Medal size={18} />
                  Records
                </span>
              </h2>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {mode !== "run" && (
                <div
                  className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                    mode === "swim" ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <Waves size={14} />
                    <span>Natation</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {records.bestSwim
                      ? `${formatKmDecimal(records.bestSwim.distance, nfDecimal)} · ${capFirst(
                          dayjs(records.bestSwim.date).format("DD MMM YYYY")
                        )}`
                      : "—"}
                  </div>
                </div>
              )}

              {mode !== "swim" && (
                <div
                  className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                    mode === "run" ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <PersonStanding size={14} />
                    <span>Running</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {records.bestRun
                      ? `${formatKmDecimal(records.bestRun.distance, nfDecimal)} · ${capFirst(
                          dayjs(records.bestRun.date).format("DD MMM YYYY")
                        )}`
                      : "—"}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <CalendarDays size={14} />
                  <span>Meilleure semaine</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {records.bestWeek
                    ? `${formatKmDecimal(records.bestWeek.total, nfDecimal)} · ${weekOfMonthLabel(
                        records.bestWeek.weekStart
                      )}`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {records.bestWeek
                    ? records.bestWeek.run === records.bestWeek.swim
                      ? "Mixte"
                      : records.bestWeek.run > records.bestWeek.swim
                        ? "Running"
                        : "Natation"
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Gauge size={14} />
                  <span>Série la plus longue</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {records.streakBest
                    ? `${records.streakBest.length} jour${records.streakBest.length > 1 ? "s" : ""} · du ${capFirst(
                        dayjs(records.streakBest.start).format("DD MMM YYYY")
                      )} au ${capFirst(dayjs(records.streakBest.end).format("DD MMM YYYY"))}`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {records.streakBest
                    ? `${records.streakBest.swim} natation · ${records.streakBest.run} running`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {mode === "all" && (
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <Scale size={18} />
                    Répartition par sport
                  </span>
                </h2>
              </div>
              <div className="p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Par distance
                    </div>
                    <SportSharePie
                      swimValue={sportTotals.swimSum}
                      runValue={sportTotals.runSum}
                      unitLabel="km"
                      formatValue={(value) => nfDecimal.format(value / 1000)}
                      heightClass="h-60 sm:h-44"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Par séances
                    </div>
                    <SportSharePie
                      swimValue={stats.swimN}
                      runValue={stats.runN}
                      unitLabel="séance"
                      formatValue={(value) => nf.format(value)}
                      heightClass="h-60 sm:h-44"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </Reveal>
      )}

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
    </>
  );
}
