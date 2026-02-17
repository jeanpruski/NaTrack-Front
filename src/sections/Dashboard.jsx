import React, { useEffect, useState } from "react";
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
import { apiGet, apiJson } from "../utils/api";


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
  userRunningMaxById,
  userCardOpen,
  onUserCardOpenChange,
  currentUserId,
  cardsUnlockedCounts,
  activeChallenge,
  activeChallengeDueAt,
  isAdmin = false,
  isAuth = false,
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
  authToken,
}) {
  const showUserCard = Boolean(userCardOpen);
  const setShowUserCard = onUserCardOpenChange || (() => {});
  const isOwnUser = Boolean(userInfo?.id && currentUserId && String(userInfo.id) === String(currentUserId));
  const [showChallengeCard, setShowChallengeCard] = useState(false);
  const [localAdminPanel, setLocalAdminPanel] = useState(false);
  const showAdminPanel = adminPanelOpen ?? localAdminPanel;
  const setShowAdminPanel = onAdminPanelOpenChange || setLocalAdminPanel;
  const [adminTab, setAdminTab] = useState("options");
  const [stravaBusy, setStravaBusy] = useState(false);
  const [stravaError, setStravaError] = useState("");
  const [stravaButtonOk, setStravaButtonOk] = useState(true);
  const [stravaFinalizeUrl, setStravaFinalizeUrl] = useState("");
  const [stravaFinalizeBusy, setStravaFinalizeBusy] = useState(false);
  const [stravaFinalizeMsg, setStravaFinalizeMsg] = useState("");
  const [stravaStatus, setStravaStatus] = useState(null);
  const [stravaLogs, setStravaLogs] = useState([]);
  const [stravaLogsLoading, setStravaLogsLoading] = useState(false);
  const {
    displayName,
    cardUser,
    userRunningAvgKm,
    userRunningMaxKm,
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
    userRunningMaxById,
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

  const loadStravaStatus = async () => {
    if (!authToken) return;
    const data = await apiGet("/strava/status", authToken);
    setStravaStatus(data || { connected: false });
  };

  const loadStravaLogs = async () => {
    if (!authToken) return;
    setStravaLogsLoading(true);
    try {
      const data = await apiGet("/strava/logs?limit=10", authToken);
      setStravaLogs(Array.isArray(data) ? data : []);
    } finally {
      setStravaLogsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwnUser) return;
    if (adminTab !== "settings") return;
    loadStravaStatus();
    loadStravaLogs();
  }, [adminTab, isOwnUser, authToken]);

  const dueLabel = isEventChallenge
    ? <>À réaliser avant <span className="underline">demain</span></>
    : (
        <>
          À réaliser au plus tard le <span className="underline">{formattedDueDate}</span>
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
              <div className="grid gap-4">
                {!isAdmin && (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-900/20 dark:text-amber-100">
                    L’intégration Strava est temporairement réservée aux admins.
                  </div>
                )}
                {isAdmin && (
                  <>
                    <div className="rounded-2xl border border-blue-200/70 bg-white/70 px-4 py-5 text-sm text-blue-900 shadow-sm dark:border-blue-400/30 dark:bg-slate-900/30 dark:text-blue-100">
                      <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Connexion Strava
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Connecte ton compte Strava pour importer automatiquement ton dernier run.
                      </p>
                      {!isOwnUser && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          La connexion Strava est uniquement disponible pour ton propre compte.
                        </div>
                      )}
                      {stravaError && (
                        <div className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                          {stravaError}
                        </div>
                      )}
                      {stravaStatus?.connected && (
                        <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                          Strava connecté{stravaStatus?.athlete_id ? ` (athlete ${stravaStatus.athlete_id})` : ""}.
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!stravaStatus?.connected && (
                          <button
                            type="button"
                            disabled={!authToken || stravaBusy || !isOwnUser}
                            onClick={async () => {
                              if (!authToken || !isOwnUser) return;
                              setStravaBusy(true);
                              setStravaError("");
                              try {
                                const data = await apiGet("/strava/connect", authToken);
                                if (data?.url) {
                                  window.location.href = data.url;
                                } else {
                                  setStravaError("URL Strava introuvable.");
                                }
                              } catch (e) {
                                setStravaError(e?.message || "Connexion Strava impossible");
                              } finally {
                                setStravaBusy(false);
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-transparent p-0 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                            aria-label="Connect with Strava"
                          >
                            {stravaButtonOk ? (
                              <img
                                src="/strava/connect-with-strava.png"
                                alt="Connect with Strava"
                                className="h-10 w-auto"
                                onError={() => setStravaButtonOk(false)}
                              />
                            ) : (
                              <span className="rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500">
                            {stravaBusy ? "Connexion..." : "Connecter Strava"}
                          </span>
                        )}
                      </button>
                    )}
                        {stravaStatus?.connected && (
                          <button
                            type="button"
                            disabled={!authToken || stravaBusy || !isOwnUser}
                            onClick={async () => {
                              if (!authToken || !isOwnUser) return;
                              if (!window.confirm("Déconnecter Strava ?")) return;
                              setStravaBusy(true);
                              setStravaError("");
                              try {
                                await apiJson("POST", "/strava/disconnect", null, authToken);
                                await loadStravaStatus();
                                await loadStravaLogs();
                              } catch (e) {
                                setStravaError(e?.message || "Déconnexion Strava impossible");
                              } finally {
                                setStravaBusy(false);
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-rose-400/40 dark:bg-slate-900/40 dark:text-rose-300 dark:hover:bg-rose-400/10"
                          >
                            Déconnecter Strava
                          </button>
                        )}
                        {stravaStatus?.connected && (
                          <button
                            type="button"
                            disabled={!authToken || stravaLogsLoading || !isOwnUser}
                            onClick={loadStravaLogs}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
                          >
                            Rafraîchir logs
                      </button>
                    )}
                  </div>

                  {!stravaStatus?.connected && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 px-3 py-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                      <div className="font-semibold">Si Strava ne te redirige pas</div>
                      <div className="mt-1 opacity-80">
                        Copie l’URL de redirection (Network → accept_application → Location) puis colle-la ici.
                      </div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="url"
                          value={stravaFinalizeUrl}
                          onChange={(e) => setStravaFinalizeUrl(e.target.value)}
                          placeholder="https://natrack.prjski.com/api/strava/callback?state=...&code=..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          disabled={stravaFinalizeBusy || !stravaFinalizeUrl}
                          onClick={async () => {
                            if (!stravaFinalizeUrl) return;
                            setStravaFinalizeBusy(true);
                            setStravaFinalizeMsg("");
                            try {
                              const url = new URL(stravaFinalizeUrl);
                              const code = url.searchParams.get("code");
                              const state = url.searchParams.get("state");
                              if (!code || !state) {
                                setStravaFinalizeMsg("URL invalide (code/state manquants).");
                              } else {
                                await apiJson("POST", "/strava/exchange", { code, state }, authToken);
                                await loadStravaStatus();
                                await loadStravaLogs();
                                setStravaFinalizeMsg("Strava connecté ✅");
                              }
                            } catch (e) {
                              setStravaFinalizeMsg(e?.message || "Connexion Strava impossible");
                            } finally {
                              setStravaFinalizeBusy(false);
                            }
                          }}
                          className="rounded-lg bg-sky-500/90 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-60"
                        >
                          {stravaFinalizeBusy ? "Finalisation..." : "Finaliser"}
                        </button>
                      </div>
                      {stravaFinalizeMsg && (
                        <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                          {stravaFinalizeMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                    {stravaStatus?.connected && (
                      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
                        <div className="text-base font-semibold">Derniers imports Strava</div>
                        {stravaLogsLoading ? (
                          <div className="mt-2 text-xs text-slate-500">Chargement...</div>
                        ) : !stravaLogs.length ? (
                          <div className="mt-2 text-xs text-slate-500">Aucun import pour le moment.</div>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {stravaLogs.map((row) => (
                              <div
                                key={row.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    {row.start_datetime || row.date}
                                  </span>
                                  <span className="opacity-70">
                                    {row.distance} m · {row.type}
                                  </span>
                                </div>
                                <div className="opacity-70">#{row.strava_activity_id}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
          userRunningMaxKm={userRunningMaxKm}
          isAuth={isAuth}
          authToken={authToken}
          currentUserId={currentUserId}
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
        userRunningMaxKm={userRunningMaxKm}
        isAuth={isAuth}
        authToken={authToken}
        currentUserId={currentUserId}
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
