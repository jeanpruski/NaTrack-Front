import React, { useState } from "react";
import { Reveal } from "../components/Reveal";
import { ChallengeCardModal } from "./dashboard/ChallengeCardModal";
import { ComparePanel } from "./dashboard/ComparePanel";
import { DashboardTopSection } from "./dashboard/DashboardTopSection";
import { DistanceGoalsSection } from "./dashboard/DistanceGoalsSection";
import { HeroBadge } from "./dashboard/HeroBadge";
import { RecordsAndShareSection } from "./dashboard/RecordsAndShareSection";
import { UserCardModal } from "./dashboard/UserCardModal";
import { ActivityCalendarSection } from "./dashboard/ActivityCalendarSection";
import { useDashboardData } from "../hooks/useDashboardData";


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
  allUsers,
  notifications = [],
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
  const [showChallengeCard, setShowChallengeCard] = useState(false);
  const {
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
    formattedDueDate,
    challengeKm,
    challengeBotRankInfo,
    challengeBotUser,
    toRgba,
  } = useDashboardData({
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
  });

  const dueLabel = isEventChallenge
    ? <>À réaliser avant <span className="underline">demain</span></>
    : (
        <>
          À réaliser avant le <span className="underline">{formattedDueDate}</span>
        </>
      );

  const heroBadge = (
    <HeroBadge
      displayName={displayName}
      isBotUser={isBotUser}
      botCardType={botCardType}
      botBorderColor={botBorderColor}
      showCardCounts={showCardCounts}
      cardsUnlockedCounts={cardsUnlockedCounts}
      onOpenUserCard={() => setShowUserCard(true)}
      toRgba={toRgba}
    />
  );

  if (!hasSessions) {
    return (
      <>
        {heroBadge}
        <UserCardModal
          open={showUserCard}
          onClose={() => setShowUserCard(false)}
          user={cardUser}
          nfDecimal={nfDecimal}
          userRankInfo={userRankInfo}
          userRunningAvgKm={userRunningAvgKm}
        />
        <ChallengeCardModal
          open={showChallengeCard}
          onClose={() => setShowChallengeCard(false)}
          botUser={challengeBotUser}
          nfDecimal={nfDecimal}
          userRankInfo={challengeBotRankInfo}
        />
        {showChallenge && (
          <div className="px-4 xl:px-8 pt-4">
            <Reveal>
              <button
                type="button"
                onClick={() => {
                  setShowUserCard(false);
                  setShowChallengeCard(true);
                }}
                className="w-full rounded-2xl border border-rose-300/80 bg-rose-50/50 px-4 py-3 text-left text-sm text-rose-900 shadow-sm transition-colors hover:border-rose-400/90 dark:border-rose-400/60 dark:bg-rose-900/20 dark:text-rose-100 dark:hover:border-rose-300/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="font-semibold">
                    Défi en cours contre {activeChallenge.bot_name || "un bot"}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-200 sm:text-right">
                    <span className="hidden sm:inline">{dueLabel}</span>
                  </div>
                </div>
                {challengeKm && (
                  <div className="mt-1 text-sm">
                    Distance à atteindre : <span className="font-semibold">{challengeKm} km</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200 sm:hidden">
                  {dueLabel}
                </div>
              </button>
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
    <ComparePanel
      mode={mode}
      modeLabel={modeLabel}
      monthCompare={monthCompare}
      compareTotalWinner={compareTotalWinner}
      compareToDayWinner={compareToDayWinner}
      nfDecimal={nfDecimal}
    />
  );

  return (
    <>
      {heroBadge}
      <UserCardModal
        open={showUserCard}
        onClose={() => setShowUserCard(false)}
        user={cardUser}
        nfDecimal={nfDecimal}
        userRankInfo={userRankInfo}
        userRunningAvgKm={userRunningAvgKm}
      />
      <ChallengeCardModal
        open={showChallengeCard}
        onClose={() => setShowChallengeCard(false)}
        botUser={challengeBotUser}
        nfDecimal={nfDecimal}
        userRankInfo={challengeBotRankInfo}
      />
      {showChallenge && (
        <div className="px-4 xl:px-8 pt-4">
          <Reveal>
            <button
              type="button"
              onClick={() => {
                setShowUserCard(false);
                setShowChallengeCard(true);
              }}
              className="w-full rounded-2xl border border-rose-300/80 bg-rose-50/50 px-4 py-3 text-left text-sm text-rose-900 shadow-sm transition-colors hover:border-rose-400/90 dark:border-rose-400/60 dark:bg-rose-900/20 dark:text-rose-100 dark:hover:border-rose-300/80"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="font-semibold">
                    Défi en cours contre {activeChallenge.bot_name || "un bot"}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-200 sm:text-right">
                    <span className="hidden sm:inline">{dueLabel}</span>
                  </div>
                </div>
                {challengeKm && (
                  <div className="mt-1 text-sm">
                    Distance à atteindre : <span className="font-semibold">{challengeKm} km</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200 sm:hidden">
                  {dueLabel}
                </div>
            </button>
          </Reveal>
        </div>
      )}
      <DashboardTopSection
        showMonthCardsOnlyWhenAllRange={showMonthCardsOnlyWhenAllRange}
        isBotUser={isBotUser}
        isEventBot={isEventBot}
        mode={mode}
        modeLabel={modeLabel}
        lastLabel={lastLabel}
        lastType={lastType}
        daysSinceLast={daysSinceLast}
        monthLabel={monthLabel}
        monthTotals={monthTotals}
        monthCounts={monthCounts}
        stats={stats}
        nf={nf}
        nfDecimal={nfDecimal}
        showCompareInline={showCompareInline}
        monthCompare={monthCompare}
        compareTotalWinner={compareTotalWinner}
        compareToDayWinner={compareToDayWinner}
        range={range}
        isActiveSeasonRange={isActiveSeasonRange}
        shoesLifeByRange={shoesLifeByRange}
        shownSessions={shownSessions}
        showMonthlyChart={showMonthlyChart}
        isSeasonRange={isSeasonRange}
        rangeLabel={rangeLabel}
      />

      {showCompareAbove && !isEventBot && (
        <Reveal as="section" className="px-4 xl:px-8 pb-4">
          {comparePanel}
        </Reveal>
      )}

      <DistanceGoalsSection
        isBotUser={isBotUser}
        isSeasonRange={isSeasonRange}
        stats={stats}
        nf={nf}
        nfDecimal={nfDecimal}
      />

      <RecordsAndShareSection
        isBotUser={isBotUser}
        isSeasonRange={isSeasonRange}
        mode={mode}
        records={records}
        nfDecimal={nfDecimal}
        stats={stats}
        sportTotals={sportTotals}
        nf={nf}
      />

      <ActivityCalendarSection
        firstSessionLabel={firstSessionLabel}
        shownSessions={shownSessions}
        range={range}
        seasonStartDate={seasonStartDate}
        seasonEndDate={seasonEndDate}
      />
    </>
  );
}
