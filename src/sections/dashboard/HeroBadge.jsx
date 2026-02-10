import React, { useState } from "react";
import { Bot, Newspaper, Sparkles, Swords, User } from "lucide-react";
import { Reveal } from "../../components/Reveal";

export function HeroBadge({
  displayName,
  isBotUser,
  botCardType,
  botBorderColor,
  showCardCounts,
  cardsUnlockedCounts,
  onOpenUserCard,
  toRgba,
}) {
  const [hover, setHover] = useState(false);

  if (!displayName) return null;

  return (
    <Reveal as="section" className="px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0">
      <button
        type="button"
        onClick={onOpenUserCard}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
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
                  : hover
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
          {isBotUser && botCardType && (
            <span className="inline-flex items-center gap-1 text-[18px] text-slate-800 dark:text-slate-100">
              {botCardType === "defi" ? (
                <Swords size={18} className="text-slate-700 dark:text-slate-200" />
              ) : botCardType === "rare" ? (
                <Sparkles size={18} className="text-slate-700 dark:text-slate-200" />
              ) : botCardType === "evenement" ? (
                <Newspaper size={18} className="text-slate-700 dark:text-slate-200" />
              ) : null}
            </span>
          )}
        </div>
      </button>
    </Reveal>
  );
}
