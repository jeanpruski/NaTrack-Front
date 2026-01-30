import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Newspaper } from "lucide-react";
import { Reveal } from "../components/Reveal";

export function NewsArchive({ newsItems = [], loading = false, error = "", filter = "all" }) {
  const [imageReadyMap, setImageReadyMap] = useState({});

  useEffect(() => {
    let alive = true;
    const next = {};
    newsItems.forEach((item) => {
      if (!item?.image_url) return;
      const img = new Image();
      const done = () => {
        if (!alive) return;
        setImageReadyMap((prev) => ({ ...prev, [item.id]: true }));
      };
      img.onload = done;
      img.onerror = done;
      img.src = item.image_url;
      if (img.complete) next[item.id] = true;
    });
    if (Object.keys(next).length) {
      setImageReadyMap((prev) => ({ ...prev, ...next }));
    }
    return () => { alive = false; };
  }, [newsItems]);

  const filteredItems = useMemo(() => {
    const items = newsItems || [];
    const today = dayjs().startOf("day").valueOf();
    const withDates = items
      .map((item, idx) => ({
        item,
        idx,
        ts: dayjs(item.event_date).isValid() ? dayjs(item.event_date).startOf("day").valueOf() : null,
      }))
      .filter((entry) => {
        if (filter === "all") return true;
        if (entry.ts === null) return false;
        if (filter === "future") return entry.ts >= today;
        if (filter === "past") return entry.ts < today;
        return true;
      });

    withDates.sort((a, b) => {
      if (a.ts === null && b.ts === null) return a.idx - b.idx;
      if (a.ts === null) return 1;
      if (b.ts === null) return -1;
      if (filter === "past") return b.ts - a.ts; // plus récent -> plus ancien
      return a.ts - b.ts; // plus proche -> plus lointain
    });
    return withDates.map((entry) => entry.item);
  }, [newsItems, filter]);

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

  return (
    <div className="grid gap-4 px-4 xl:px-8 pt-4 pb-8">
      <Reveal as="section">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
          <div className="flex flex-col gap-2 border-b px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <Newspaper size={18} />
                Événements spéciaux
              </span>
            </h2>
            <div className="flex w-full justify-end md:w-auto md:justify-end" />
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-rose-600 dark:text-rose-300">Erreur: {error}</div>
            ) : !filteredItems.length ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">Aucune news pour le moment.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredItems.map((item) => {
                  const ready = !!imageReadyMap[item.id];
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
                        className={`absolute inset-0 ${
                          item.link_url ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]" : ""
                        }`}
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
    </div>
  );
}
