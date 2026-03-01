require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_BUDGET_USD = Number(process.env.MAX_BUDGET_USD || 0);
const COST_INPUT_PER_1M = Number(process.env.OPENAI_COST_INPUT_PER_1M || 0.15);
const COST_OUTPUT_PER_1M = Number(process.env.OPENAI_COST_OUTPUT_PER_1M || 0.6);
const USAGE_PATH = path.join(__dirname, ".usage.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: OPENAI_MODEL });
});

function loadUsage() {
  try {
    const raw = fs.readFileSync(USAGE_PATH, "utf8");
    const data = JSON.parse(raw);
    return {
      totalUsd: Number(data?.totalUsd || 0),
      totalTokens: Number(data?.totalTokens || 0),
    };
  } catch {
    return { totalUsd: 0, totalTokens: 0 };
  }
}

function saveUsage(next) {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(next, null, 2));
}

function buildPrompt({ theme, cards, maxNameLength }) {
  const lines = cards
    .map((c) => {
      const visual = c.visual || {};
      return [
        `id:${c.id}`,
        `type:${c.type}`,
        `distance_km:${Number(c.distance_km || 0).toFixed(1)}`,
        `shoe:${c.shoe_name || ""}`,
        `style:${visual.style || ""}`,
        `background:${visual.background || ""}`,
        `angle:${visual.angle || ""}`,
        `light:${visual.light || ""}`,
      ].join(" | ");
    })
    .join("\n");

  return [
    "Tu es un auteur de cartes fantasy style Magic the Gathering.",
    `Thématique globale: ${theme}.`,
    `Contraintes: noms uniques, ${maxNameLength} caractères max, liés au thème sans être identiques.`,
    "Chaque description doit être en français, 1-2 phrases, évocatrice.",
    "La description doit être cohérente avec le nom ET les indices visuels (style, background, angle, light).",
    "Mentionne subtilement la distance et évoque le type (défi/rare/événement).",
    "Retourne un JSON pur sous forme de tableau: [{id, name, description}].",
    "Aucune autre sortie.",
    "\nCartes à traiter:",
    lines,
  ].join("\n");
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

app.post("/generate-cards", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(400).json({ error: "OPENAI_API_KEY manquant" });
    }
    const theme = String(req.body?.theme || "").trim();
    const cards = Array.isArray(req.body?.cards) ? req.body.cards : [];
    const maxNameLength = Number(req.body?.maxNameLength || 14);
    if (!theme) return res.status(400).json({ error: "Theme manquant" });
    if (!cards.length) return res.status(400).json({ error: "Cartes manquantes" });

    if (MAX_BUDGET_USD > 0) {
      const usage = loadUsage();
      if (usage.totalUsd >= MAX_BUDGET_USD) {
        return res.status(402).json({ error: "Budget local atteint" });
      }
    }

    const prompt = buildPrompt({ theme, cards, maxNameLength });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: "Réponds uniquement en JSON valide." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText || "Erreur OpenAI" });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = tryParseJson(content);
    if (!parsed || !Array.isArray(parsed)) {
      return res.status(500).json({ error: "Reponse IA invalide", raw: content });
    }

    const usage = data?.usage || {};
    const promptTokens = Number(usage.prompt_tokens || 0);
    const completionTokens = Number(usage.completion_tokens || 0);
    const totalTokens = Number(usage.total_tokens || promptTokens + completionTokens);
    const cost =
      (promptTokens / 1_000_000) * COST_INPUT_PER_1M +
      (completionTokens / 1_000_000) * COST_OUTPUT_PER_1M;
    if (MAX_BUDGET_USD > 0) {
      const current = loadUsage();
      const next = {
        totalUsd: Number((current.totalUsd + cost).toFixed(6)),
        totalTokens: current.totalTokens + totalTokens,
      };
      saveUsage(next);
    }

    const clean = parsed.map((item) => {
      const name = String(item?.name || "").trim().slice(0, maxNameLength);
      const description = String(item?.description || "").trim();
      return {
        id: String(item?.id || "").trim(),
        name,
        description,
      };
    });

    res.json({ items: clean });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`natrack-tools server listening on http://localhost:${PORT}`);
});
