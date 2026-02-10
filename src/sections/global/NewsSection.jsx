import React from "react";
import { Newspaper } from "lucide-react";
import { Reveal } from "../../components/Reveal";

export function NewsSection({
  onOpenNewsArchive,
  newsItems,
  newsLoading,
  newsError,
  latestNews,
  newsImageReadyMap,
  formatEventDate,
}) {
  return (
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
            <div className="text-sm text-slate-600 dark:text-slate-300">Aucune news pour le moment.</div>
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
  );
}
