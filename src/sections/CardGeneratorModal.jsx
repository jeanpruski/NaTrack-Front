import React, { useEffect, useMemo, useState } from "react";
import generatorConfig from "../data/card-generator-config.json";

const FALLBACK_CONFIG = {
  shoes: ["Nike Pegasus 39", "Adidas Adizero", "Asics Nimbus", "Hoka Clifton", "Brooks Ghost"],
  namePrefixes: ["Aube", "Ombre", "Flamme", "Eclat", "Rune", "Vent", "Cendre", "Foudre"],
  nameSuffixes: ["du Run", "du Vent", "du Roc", "des Brumes", "du Feu", "du Nord"],
  nameTitles: ["Sentinelle", "Oracle", "Arpenteur", "Gardien", "Porteur"],
  descriptionOpeners: [
    "Nulle route n'est banale sous",
    "Dans les terres de",
    "Quand souffle",
    "Au seuil de",
    "Sous la garde de",
  ],
  descriptionVerbs: ["révèle", "éprouve", "embrase", "forge", "guide"],
  descriptionFinishers: [
    "les pas dignes d'être gravés.",
    "la volonté des coureurs.",
    "les serments des endurants.",
    "les distances oubliées.",
    "les chemins cachés.",
  ],
  imageStyles: [
    "epic fantasy illustration",
    "hand-painted trading card art",
    "cinematic concept art",
  ],
  imageBackgrounds: [
    "misty forest trail",
    "stormy coastline cliff",
    "desert dunes at dawn",
    "neon city night",
    "snowy mountain pass",
  ],
  imageAngles: [
    "low angle",
    "bird's-eye view",
    "three-quarter view",
    "wide panoramic",
    "over-the-shoulder",
  ],
  imageLighting: [
    "golden hour lighting",
    "moody twilight",
    "dramatic rim light",
    "soft diffused light",
  ],
};

const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const buildConfig = (raw) => {
  const merged = { ...FALLBACK_CONFIG, ...(raw || {}) };
  const normalized = {};
  Object.keys(merged).forEach((key) => {
    normalized[key] = ensureArray(merged[key]);
  });
  return normalized;
};

const CONFIG = buildConfig(generatorConfig);

const pick = (items) => {
  if (!items || !items.length) return "";
  return items[Math.floor(Math.random() * items.length)];
};

const toTitle = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");

const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const randBetween = (min, max, step = 0.1) => {
  const safeMin = Number.isFinite(min) ? min : 1.5;
  const safeMax = Number.isFinite(max) ? max : 11;
  const hi = Math.max(safeMin, safeMax);
  const lo = Math.min(safeMin, safeMax);
  const steps = Math.floor((hi - lo) / step) + 1;
  const pickIndex = Math.floor(Math.random() * steps);
  const value = lo + pickIndex * step;
  return Math.round(value * 10) / 10;
};

const escapeSql = (value) => String(value || "").replace(/'/g, "''");

const sqlValue = (value) => {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return `'${escapeSql(value)}'`;
};

const makeName = (theme, usedNames) => {
  const themeWords = String(theme || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const core = themeWords.length ? themeWords[Math.floor(Math.random() * themeWords.length)] : pick(CONFIG.namePrefixes);
  const coreTitle = toTitle(core);
  const templates = [
    `${coreTitle}`,
    `${pick(CONFIG.namePrefixes)} ${coreTitle}`,
    `${coreTitle} ${pick(CONFIG.nameSuffixes)}`,
    `${pick(CONFIG.nameTitles)} ${coreTitle}`,
  ];
  for (let i = 0; i < 40; i += 1) {
    const candidate = templates[Math.floor(Math.random() * templates.length)].trim();
    if (!candidate) continue;
    if (candidate.length <= 14 && !usedNames.has(candidate)) return candidate;
  }
  const fallback = coreTitle.slice(0, 14) || `Bot-${Math.floor(Math.random() * 999)}`;
  if (usedNames.has(fallback)) return `${fallback.slice(0, 12)}${Math.floor(Math.random() * 90 + 10)}`;
  return fallback;
};

const makeDescription = ({ name, theme, style, background, angle, light }) => {
  const opener = pick(CONFIG.descriptionOpeners);
  const verb = pick(CONFIG.descriptionVerbs);
  const finisher = pick(CONFIG.descriptionFinishers);
  const themed = theme ? ` ${theme}` : "";
  const visuals = [style, background, angle, light].filter(Boolean).join(", ");
  const visualLine = visuals ? `Dans un decor ${visuals},` : "";
  const parts = [
    name ? `${name}.` : "",
    opener ? `${opener}${themed},` : "",
    verb ? `${verb}` : "",
    finisher || "",
    visualLine,
  ];
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
};

const makeImagePrompt = ({ name, theme, type, distanceKm, shoeName, style, background, angle, light }) => {
  const cardTypeLabel = type === "evenement" ? "event" : type === "rare" ? "rare" : "challenge";
  const shoeLabel = shoeName ? `visible running shoes (${shoeName})` : "visible running shoes";
  const subject = name || "runner";
  const themeLabel = theme ? `, theme: ${theme}` : "";
  return [
    `${style}, Magic the Gathering inspired trading card art, landscape format (16:9)`,
    `${angle}, ${light}, ${background}`,
    `${subject}, ${shoeLabel}${themeLabel}`,
    `card type: ${cardTypeLabel}, distance: ${distanceKm} km`,
    "unique camera perspective, varied composition, varied environment, do not repeat previous scenes",
    "no text, no UI, no watermark",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
};

export function CardGeneratorModal({ open, onClose }) {
  const [theme, setTheme] = useState("");
  const [sportType, setSportType] = useState("run");
  const [defiCount, setDefiCount] = useState(7);
  const [rareCount, setRareCount] = useState(2);
  const [eventCount, setEventCount] = useState(1);
  const [minKm, setMinKm] = useState(1.5);
  const [maxKm, setMaxKm] = useState(11);
  const [eventDate, setEventDate] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [aiServerUrl, setAiServerUrl] = useState("http://localhost:8787");
  const [aiLoading, setAiLoading] = useState(false);
  const [nameListRaw, setNameListRaw] = useState("");
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [sql, setSql] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("natrack:aiServerUrl");
    if (saved) setAiServerUrl(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("natrack:aiServerUrl", aiServerUrl);
  }, [aiServerUrl]);

  const totalCount = useMemo(() => {
    const total = Number(defiCount || 0) + Number(rareCount || 0) + Number(eventCount || 0);
    return Number.isFinite(total) ? total : 0;
  }, [defiCount, rareCount, eventCount]);

  const parsedNames = useMemo(() => {
    if (!nameListRaw) return [];
    return String(nameListRaw)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [nameListRaw]);

  const namePrompt = useMemo(() => {
    const count = totalCount || 1;
    const themeLabel = theme ? `Thématique : ${theme}.` : "Thématique : (à remplir).";
    return [
      `Génère ${count} noms courts de cartes fantasy.`,
      themeLabel,
      "Chaque nom doit faire 14 caractères max.",
      "Les noms doivent être liés au thème sans être identiques.",
      "Style : inspiré Magic the Gathering, évocateur et unique.",
      "Retourne un nom par ligne, sans numérotation.",
    ].join(" ");
  }, [theme, totalCount]);

  const buildBaseCards = (trimmedTheme) => {
    const safeMin = clamp(Number(minKm) || 1.5, 0.5, 50);
    const safeMax = clamp(Number(maxKm) || 11, 0.5, 50);
    const shoePool = CONFIG.shoes.length ? CONFIG.shoes : [];
    const baseCards = [];
    const pushCard = (type) => {
      const distanceKm = randBetween(safeMin, safeMax, 0.1);
      const distanceMeters = Math.round(distanceKm * 1000);
      const shoeName = shoePool.length ? pick(shoePool) : "";
      const style = pick(CONFIG.imageStyles);
      const background = pick(CONFIG.imageBackgrounds);
      const angle = pick(CONFIG.imageAngles);
      const light = pick(CONFIG.imageLighting);
      baseCards.push({
        id: `${type}-${baseCards.length + 1}`,
        type,
        theme: trimmedTheme,
        distanceKm,
        distanceMeters,
        shoeName,
        style,
        background,
        angle,
        light,
      });
    };
    for (let i = 0; i < Number(defiCount || 0); i += 1) pushCard("defi");
    for (let i = 0; i < Number(rareCount || 0); i += 1) pushCard("rare");
    for (let i = 0; i < Number(eventCount || 0); i += 1) pushCard("evenement");
    return baseCards;
  };

  const buildSqlAndSet = (nextCards) => {
    setCards(nextCards);
    const columns = [
      "id",
      "email",
      "name",
      "role",
      "password_hash",
      "is_bot",
      "description",
      "avg_distance_m",
      "shoe_name",
      "card_image",
      "bot_card_type",
      "bot_event_date",
      "bot_drop_rate",
      "bot_target_distance_m",
      "bot_season_int",
    ];

    const sqlRows = nextCards.map((card, index) => {
      const slug = slugify(card.name || `bot-${index + 1}`) || `bot-${index + 1}`;
      const email = `bot+${slug}@natrack.local`;
      const values = [
        "UUID()",
        sqlValue(email),
        sqlValue(card.name),
        sqlValue("user"),
        "NULL",
        1,
        sqlValue(card.description),
        sqlValue(card.avg_distance_m),
        sqlValue(card.shoe_name),
        sqlValue(card.image_url),
        sqlValue(card.card_type),
        sqlValue(card.bot_event_date),
        sqlValue(card.bot_drop_rate),
        sqlValue(card.bot_target_distance_m),
        sqlValue(card.bot_season_int),
      ];
      return `(${values.join(", ")})`;
    });

    const sqlText =
      sqlRows.length > 0
        ? `INSERT INTO users (${columns.join(", ")})\nVALUES\n${sqlRows.join(",\n")};`
        : "";
    setSql(sqlText);
  };

  const generate = () => {
    setError("");
    const trimmedTheme = String(theme || "").trim();
    if (!trimmedTheme) {
      setError("Donne une thematique pour generer les cartes.");
      return;
    }
    if (Number(eventCount) > 0 && !eventDate) {
      setError("Ajoute la date de debut de saison pour l'evenement.");
      return;
    }
    if (!seasonNumber) {
      setError("Indique le numero de saison.");
      return;
    }
    if (parsedNames.length && parsedNames.length < totalCount) {
      setError("Tu n'as pas assez de noms. Il en faut un par carte.");
      return;
    }
    const tooLong = parsedNames.filter((name) => name.length > 14);
    if (tooLong.length) {
      setError(`Certains noms depassent 14 caracteres: ${tooLong.slice(0, 3).join(", ")}.`);
      return;
    }
    const usedNames = new Set();
    const baseCards = buildBaseCards(trimmedTheme);
    let nameIndex = 0;
    const nextCards = baseCards.map((base) => {
      const name = parsedNames.length ? parsedNames[nameIndex++] : makeName(trimmedTheme, usedNames);
      usedNames.add(name);
      const description = makeDescription({
        name,
        theme: trimmedTheme,
        style: base.style,
        background: base.background,
        angle: base.angle,
        light: base.light,
      });
      const imagePrompt = makeImagePrompt({
        name,
        theme: trimmedTheme,
        type: base.type,
        distanceKm: base.distanceKm,
        shoeName: base.shoeName,
        style: base.style,
        background: base.background,
        angle: base.angle,
        light: base.light,
      });
      return {
        name,
        sport_type: sportType,
        card_type: base.type,
        description,
        avg_distance_m: base.distanceMeters,
        bot_target_distance_m: base.type === "evenement" ? base.distanceMeters : null,
        bot_event_date: base.type === "evenement" ? eventDate : null,
        bot_drop_rate: 1,
        bot_season_int: seasonNumber ? Number(seasonNumber) : null,
        shoe_name: base.shoeName,
        image_url: "",
        image_prompt: imagePrompt,
      };
    });

    buildSqlAndSet(nextCards);
  };

  const generateWithAI = async () => {
    setError("");
    if (aiLoading) return;
    const trimmedTheme = String(theme || "").trim();
    if (!trimmedTheme) {
      setError("Donne une thematique pour generer les cartes.");
      return;
    }
    if (Number(eventCount) > 0 && !eventDate) {
      setError("Ajoute la date de debut de saison pour l'evenement.");
      return;
    }
    if (!seasonNumber) {
      setError("Indique le numero de saison.");
      return;
    }

    const baseCards = buildBaseCards(trimmedTheme);
    setAiLoading(true);
    try {
      const response = await fetch(`${aiServerUrl.replace(/\/+$/, "")}/generate-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: trimmedTheme,
          maxNameLength: 14,
          cards: baseCards.map((c) => ({
            id: c.id,
            type: c.type,
            distance_km: c.distanceKm,
            shoe_name: c.shoeName,
            visual: {
              style: c.style,
              background: c.background,
              angle: c.angle,
              light: c.light,
            },
          })),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const msg = payload?.error || `Erreur IA (${response.status})`;
        throw new Error(msg);
      }
      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const byId = new Map(items.map((item) => [String(item.id), item]));
      const usedNames = new Set();

      const nextCards = baseCards.map((base) => {
        const aiItem = byId.get(String(base.id)) || {};
        let name = String(aiItem.name || "").trim();
        if (!name) name = makeName(trimmedTheme, usedNames);
        if (name.length > 14) name = name.slice(0, 14).trim();
        if (usedNames.has(name)) name = makeName(trimmedTheme, usedNames);
        usedNames.add(name);

        let description = String(aiItem.description || "").trim();
        if (!description) {
          description = makeDescription({
            name,
            theme: trimmedTheme,
            style: base.style,
            background: base.background,
            angle: base.angle,
            light: base.light,
          });
        }
        const imagePrompt = makeImagePrompt({
          name,
          theme: trimmedTheme,
          type: base.type,
          distanceKm: base.distanceKm,
          shoeName: base.shoeName,
          style: base.style,
          background: base.background,
          angle: base.angle,
          light: base.light,
        });
        return {
          name,
          sport_type: sportType,
          card_type: base.type,
          description,
          avg_distance_m: base.distanceMeters,
          bot_target_distance_m: base.type === "evenement" ? base.distanceMeters : null,
          bot_event_date: base.type === "evenement" ? eventDate : null,
          bot_drop_rate: 1,
          bot_season_int: seasonNumber ? Number(seasonNumber) : null,
          shoe_name: base.shoeName,
          image_url: "",
          image_prompt: imagePrompt,
        };
      });

      buildSqlAndSet(nextCards);
    } catch (err) {
      setError(err?.message || "Erreur lors de la generation IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const clear = () => {
    setCards([]);
    setSql("");
    setError("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generateur de cartes</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                7 defis, 2 rares, 1 evenement par serie (modifiables).
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Thematique
                  <input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Ocean mystique, Orage neon..."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Sport
                    <select
                      value={sportType}
                      onChange={(e) => setSportType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="run">Run</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Saison (optionnel)
                    <input
                      value={seasonNumber}
                      onChange={(e) => setSeasonNumber(e.target.value)}
                      placeholder="Ex: 1"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Defis
                    <input
                      type="number"
                      min="0"
                      value={defiCount}
                      onChange={(e) => setDefiCount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Rares
                    <input
                      type="number"
                      min="0"
                      value={rareCount}
                      onChange={(e) => setRareCount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Evenements
                    <input
                      type="number"
                      min="0"
                      value={eventCount}
                      onChange={(e) => setEventCount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Min km
                    <input
                      type="number"
                      step="0.1"
                      value={minKm}
                      onChange={(e) => setMinKm(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Max km
                    <input
                      type="number"
                      step="0.1"
                      value={maxKm}
                      onChange={(e) => setMaxKm(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Date event
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Serveur IA (local)
                  <input
                    value={aiServerUrl}
                    onChange={(e) => setAiServerUrl(e.target.value)}
                    placeholder="http://localhost:8787"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  Prompt IA pour les noms (copie/colle dans ton outil):
                  <div className="mt-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    {namePrompt}
                  </div>
                </div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Noms generes (1 par ligne)
                  <textarea
                    value={nameListRaw}
                    onChange={(e) => setNameListRaw(e.target.value)}
                    placeholder="Colle ici les noms IA (optionnel)."
                    className="mt-1 h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                {error ? (
                  <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={generate}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                  >
                    Generer ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={aiLoading}
                    className={`rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 ${
                      aiLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {aiLoading ? "IA en cours..." : "Generer via IA"}
                  </button>
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    Effacer
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Liste des chaussures: src/data/card-generator-config.json
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Apercu JSON</div>
                <textarea
                  readOnly
                  value={cards.length ? JSON.stringify(cards, null, 2) : ""}
                  className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">SQL</div>
                <textarea
                  readOnly
                  value={sql}
                  className="h-52 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
