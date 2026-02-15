import React, { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Flag,
  Layers,
  Lock,
  LockOpen,
  Newspaper,
  Sparkles,
  Swords,
  User,
} from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import { InfoPopover } from "../components/InfoPopover";
import { HEADER_SURFACE_CLASS, HEADER_TOP_PADDING_STYLE } from "../constants/layout";

function TypeSwitch({ value, onChange }) {
  const items = [
    { key: "run", label: "Running" },
    { key: "all", label: "Mixte" },
    { key: "swim", label: "Natation" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition
              ${
                active
                  ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function CardsFilterSwitch({ value, onChange }) {
  const items = [
    { key: "mixte", label: "Mixte" },
    { key: "users", label: "Users" },
    { key: "bots", label: "Bots" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition
              ${
                active
                  ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function RangeSelect({ value, onChange, options }) {
  const items = options?.length
    ? options
    : [
        { key: "all", label: "Historique complet" },
        { key: "month", label: "Mois en cours" },
        { key: "3m", label: "3 Derniers mois" },
        { key: "6m", label: "6 Derniers mois" },
        { key: "2026", label: "Année 2026" },
        { key: "2025", label: "Année 2025" },
      ];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        appearance-none
        rounded-xl border border-slate-300
        bg-white px-3 py-2 text-sm
        text-slate-900
        dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
        outline-none focus:ring-2 focus:ring-indigo-500
      "
    >
      {items.map((it) => (
        <option key={it.key} value={it.key}>
          {it.label}
        </option>
      ))}
    </select>
  );
}

function NewsFilterSwitch({ value, onChange }) {
  const items = [
    { key: "future", label: "Futurs" },
    { key: "past", label: "Passés" },
    { key: "all", label: "Tous" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition
              ${
                active
                  ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppHeader({
  range,
  mode,
  isAuth,
  showEditor = true,
  showFilters = true,
  filtersHidden = false,
  newsFilter = null,
  title,
  editorTargetName,
  loggedUserName,
  editorVariant = "logout", // "logout" | "user"
  onOpenEditor,
  onRefresh,
  isRefreshing = false,
  onModeChange,
  onRangeChange,
  onBack,
  onNewsFilterChange,
  cardsFilter,
  cardsExtraAction,
  cardsHideLockedAction,
  cardsUnlockedCounts,
  rangeOptions,
}) {
  const didMountRef = useRef(false);
  const prevOnBackRef = useRef(false);
  const [showLogoInfo, setShowLogoInfo] = useState(false);
  const logoBtnRef = useRef(null);
  const [logoRect, setLogoRect] = useState(null);
  useEffect(() => {
    didMountRef.current = true;
  }, []);
  useEffect(() => {
    prevOnBackRef.current = Boolean(onBack);
  }, [onBack]);
  useEffect(() => {
    if (!showLogoInfo) return;
    const update = () => {
      const rect = logoBtnRef.current?.getBoundingClientRect?.();
      if (rect) setLogoRect(rect);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showLogoInfo]);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        flex flex-col gap-2
        xl:flex-row xl:items-center xl:justify-between
        ${HEADER_SURFACE_CLASS}
        border-b border-slate-200 dark:border-slate-700
        px-4 xl:px-8 pb-3
      `}
      style={HEADER_TOP_PADDING_STYLE}
    >
      <LayoutGroup>
        <div className="flex items-center gap-0 w-full xl:w-auto">
          {onBack && (
            <motion.div
              initial={
                !didMountRef.current
                  ? { width: 0, opacity: 0 }
                  : prevOnBackRef.current
                    ? false
                    : { width: 0, opacity: 0 }
              }
              animate={{ width: 44, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden", willChange: "width, opacity" }}
            >
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label="Retour"
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            </motion.div>
          )}
          <div className="relative">
            <button
              ref={logoBtnRef}
              type="button"
              onClick={() => setShowLogoInfo((v) => !v)}
              className="rounded-xl transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label="Informations NaTrack"
            >
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100 flex items-center gap-1 whitespace-nowrap">
                <img src="/big-logo.png" alt="NaTrack" className="h-9 translate-y-[4px]" />
                {/* {title && <span className="text-base sm:text-lg font-semibold">{title}</span>} */}
              </h1>
            </button>
            <InfoPopover
              open={showLogoInfo}
              onClose={() => setShowLogoInfo(false)}
              headerImage="/big-logo.png"
              title="Bienvenue sur NaTrack !"
              actionLabel={null}
              items={[
                <strong>NaTrack est bien plus qu’un simple tracker sportif.</strong>,
                <div className="mt-[40px]">
                  <span className="inline-flex items-start gap-2">
                    <Flag size={28} aria-hidden="true" />
                    <strong>Progresse et accomplis tes objectifs</strong>
                  </span>
                  {"\n"}Enregistre tes séances de course, d’entraînement ou d’effort du jour en saisissant tes données manuellement, puis suis ta progression séance après séance pour améliorer tes performances, atteindre de nouveaux paliers, relever des défis et rester motivé grâce aux objectifs et classements intégrés.
                </div>,
                <div className="mt-[20px]">
                  <span className="inline-flex items-start gap-2 ">
                    <Layers size={28} aria-hidden="true" />
                    <strong>Débloque et collectionne des cartes</strong>
                  </span>
                  {"\n"}Chaque effort compte : plus tu t’entraînes, plus tu débloques de cartes à collectionner. Des bots peuvent aussi te défier, transformant chaque sortie en duel, chaque foulée en affrontement — et faisant du running une véritable épopée.
                </div>,
                <div className="mt-[20px]">
                  <strong className="underline">De nombreuses nouveautés et surprises arrivent bientôt !</strong>
                </div>,
                <div className="mt-[60px] text-xs italic text-slate-500 dark:text-slate-400 text-right">
                  NaTrack Team · 2026
                </div>,
              ]}
              fullWidth
              anchorRect={logoRect}
              maxWidth={1024}
            />
          </div>

          <div className="ml-2 flex items-center gap-2">
            <ThemeToggle />
            {cardsExtraAction && !showFilters && (
              <button
                type="button"
                onClick={cardsExtraAction.onClick}
                aria-label={cardsExtraAction.active ? "Verrou ouvert" : "Verrou fermé"}
                className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {cardsExtraAction.active ? <LockOpen size={16} /> : <Lock size={16} />}
              </button>
            )}
          </div>

          {(onRefresh || showEditor) && (
            <div className="ml-auto xl:ml-2 flex items-center gap-2">
              {showEditor && (
                <button
                  onClick={onOpenEditor}
                  className={`rounded-xl px-3 py-2 text-sm transition relative overflow-hidden ${
                    isAuth
                      ? editorVariant === "user"
                        ? "bg-emerald-300/60 text-slate-900 dark:text-white hover:bg-emerald-300/80"
                        : "bg-orange-400/70 text-white hover:bg-orange-400/90 dark:bg-orange-400/70 dark:text-white dark:hover:bg-orange-400/90"
                      : "bg-amber-500/70 text-white hover:bg-amber-500/90"
                  }`}
                  title={
                    isAuth
                      ? editorVariant === "user"
                        ? "Voir mon dashboard"
                        : "Déconnexion"
                      : "Déverrouiller l’édition"
                  }
                >
                  <span
                    className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 ${
                      isAuth
                        ? editorVariant === "user"
                          ? "bg-emerald-300/45"
                          : "bg-orange-300/50"
                        : "bg-amber-400/40"
                    }`}
                  />
                  <span className="inline-flex items-center gap-1.5 relative z-10">
                    {!isAuth ? (
                      <span className="relative top-[1px] inline-flex h-4 w-4 items-center justify-center">
                        <LockOpen size={16} aria-hidden="true" />
                      </span>
                    ) : editorVariant === "user" ? (
                      <span className="relative top-[1px] inline-flex h-4 w-4 items-center justify-center">
                        <User size={16} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="relative top-[1px] inline-flex h-4 w-4 items-center justify-center">
                        <Lock size={16} aria-hidden="true" />
                      </span>
                    )}
                    {isAuth && loggedUserName && <span className="sm:inline">{` ${loggedUserName}`}</span>}
                  </span>
                </button>
              )}

            </div>
          )}

        </div>
      </LayoutGroup>

      {!showFilters && cardsUnlockedCounts && (
        <div className="hidden xl:flex flex-1 items-center justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow dark:bg-slate-700/70 dark:text-slate-100"
            aria-label="Nombre de cartes débloquées"
          >
            {cardsUnlockedCounts.defi || 0}/{cardsUnlockedCounts.defiTotal || 0}{" "}
            <Swords size={14} aria-hidden="true" />
            <span className="opacity-60">·</span>
            {cardsUnlockedCounts.rare || 0}/{cardsUnlockedCounts.rareTotal || 0}{" "}
            <Sparkles size={14} aria-hidden="true" />
            <span className="opacity-60">·</span>
            {cardsUnlockedCounts.evenement || 0}/{cardsUnlockedCounts.evenementTotal || 0}{" "}
            <Newspaper size={14} aria-hidden="true" />
          </div>
        </div>
      )}

      {newsFilter && (
        <div className="flex items-center justify-end gap-2 xl:hidden w-full">
          <NewsFilterSwitch value={newsFilter} onChange={onNewsFilterChange} />
        </div>
      )}

      {newsFilter && (
        <div className="hidden xl:flex items-center justify-end gap-3">
          <NewsFilterSwitch value={newsFilter} onChange={onNewsFilterChange} />
        </div>
      )}

      {showFilters && (
        <div
          className={`flex items-center justify-between gap-2 xl:hidden transition-opacity ${
            filtersHidden ? "opacity-0 invisible pointer-events-none" : "opacity-100"
          }`}
        >
          <RangeSelect value={range} onChange={onRangeChange} options={rangeOptions} />
          <TypeSwitch value={mode} onChange={onModeChange} />
        </div>
      )}

      {showFilters && (
        <div
          className={`hidden xl:flex items-center justify-end gap-3 transition-opacity ${
            filtersHidden ? "opacity-0 invisible pointer-events-none" : "opacity-100"
          }`}
        >
          <RangeSelect value={range} onChange={onRangeChange} options={rangeOptions} />
          <TypeSwitch value={mode} onChange={onModeChange} />
        </div>
      )}

      {!showFilters && (cardsFilter || cardsUnlockedCounts) && (
        <div className="flex items-center justify-between gap-2 xl:hidden w-full">
          {cardsUnlockedCounts ? (
            <div
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow dark:bg-slate-700/70 dark:text-slate-100"
              aria-label="Nombre de cartes débloquées"
            >
              <span className="text-[12px]">{cardsUnlockedCounts.defi || 0}<span className='opacity-70'>/{cardsUnlockedCounts.defiTotal || 0}{" "}</span></span>
              <Swords size={12} aria-hidden="true" />
              <span className="opacity-60">·</span>
              <span className="text-[12px]">{cardsUnlockedCounts.rare || 0}<span className='opacity-70'>/{cardsUnlockedCounts.rareTotal || 0}{" "}</span></span>
              <Sparkles size={12} aria-hidden="true" />
              <span className="opacity-60">·</span>
              <span className="text-[12px]">{cardsUnlockedCounts.evenement || 0}<span className='opacity-70'>/{cardsUnlockedCounts.evenementTotal || 0}{" "}</span></span>
              <Newspaper size={12} aria-hidden="true" />
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {cardsHideLockedAction && (
              <button
                type="button"
                onClick={cardsHideLockedAction.onClick}
                aria-label={cardsHideLockedAction.active ? "Masquer les cartes verrouillées" : "Afficher les cartes verrouillées"}
                className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {cardsHideLockedAction.active ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
            {cardsFilter && <CardsFilterSwitch value={cardsFilter.value} onChange={cardsFilter.onChange} />}
          </div>
        </div>
      )}

      {!showFilters && cardsFilter && (
        <div className="hidden xl:flex items-center justify-end gap-3">
          {cardsHideLockedAction && (
            <button
              type="button"
              onClick={cardsHideLockedAction.onClick}
              aria-label={cardsHideLockedAction.active ? "Masquer les cartes verrouillées" : "Afficher les cartes verrouillées"}
              className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {cardsHideLockedAction.active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <CardsFilterSwitch value={cardsFilter.value} onChange={cardsFilter.onChange} />
        </div>
      )}
    </header>
  );
}
