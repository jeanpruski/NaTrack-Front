import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AddSessionForm } from "../components/AddSessionForm";
import { History } from "../components/History";
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
  isAdmin = false,
  isBusy = false,
  canEditSelected = false,
  adminSessions = [],
  onAddSession,
  onEditSession,
  onDeleteSession,
  onExportSessions,
  onImportSessions,
  adminPanelOpen,
  onAdminPanelOpenChange,
}) {
  const showUserCard = Boolean(userCardOpen);
  const setShowUserCard = onUserCardOpenChange || (() => {});
  const isOwnUser = Boolean(userInfo?.id && currentUserId && String(userInfo.id) === String(currentUserId));
  const [showChallengeCard, setShowChallengeCard] = useState(false);
  const [localAdminPanel, setLocalAdminPanel] = useState(false);
  const showAdminPanel = adminPanelOpen ?? localAdminPanel;
  const setShowAdminPanel = onAdminPanelOpenChange || setLocalAdminPanel;
  const [adminTab, setAdminTab] = useState("options");
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
      showAdminAction={Boolean((isAdmin || isOwnUser) && !isBotUser)}
      onAdminAction={() => setShowAdminPanel((v) => !v)}
      isAdminPanelOpen={showAdminPanel}
      toRgba={toRgba}
    />
  );

  const adminPanel = (
    <AnimatePresence>
      {showAdminPanel && (
        <motion.div
          className="overflow-hidden px-4 xl:px-8 mt-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.32, ease: "easeInOut" }}
        >
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 px-4 py-4 text-sm text-blue-900 shadow-sm dark:border-blue-400/40 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="mb-8 flex justify-end">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700">
                <button
                  type="button"
                  onClick={() => setAdminTab("options")}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition ${
                    adminTab === "options"
                      ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  Ajout distance
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("history")}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition ${
                    adminTab === "history"
                      ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  Historique
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("settings")}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition ${
                    adminTab === "settings"
                      ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
            {adminTab === "options" ? (
              <AddSessionForm
                onAdd={onAddSession}
                onExport={onExportSessions}
                onImport={onImportSessions}
                readOnly={!canEditSelected || isBusy}
                isAdmin={isAdmin}
              />
            ) : adminTab === "history" ? (
              <History
                sessions={adminSessions}
                onDelete={onDeleteSession}
                onEdit={onEditSession}
                readOnly={!canEditSelected || isBusy}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200/70 bg-white/70 px-4 py-6 text-center text-sm text-blue-900/80 dark:border-blue-400/30 dark:bg-slate-900/30 dark:text-blue-100/70">
                Settings du joueur (bientôt)
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!hasSessions) {
    return (
      <>
        {heroBadge}
        {adminPanel}
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
        <AnimatePresence>
          {!showAdminPanel && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
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
      {adminPanel}
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
      <AnimatePresence>
        {!showAdminPanel && (
          <motion.div
            key="dashboard-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
