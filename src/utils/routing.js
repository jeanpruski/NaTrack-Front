const readRouteState = () => {
  if (typeof window === "undefined") return { type: "root", slug: null };
  const path = window.location.pathname || "/";
  const userMatch = path.match(/^\/user\/([^/]+)\/?$/);
  if (userMatch) return { type: "user", slug: decodeURIComponent(userMatch[1]) };
  if (path.match(/^\/cards\/?$/)) return { type: "cards", slug: null };
  if (path.match(/^\/events\/?$/)) return { type: "news", slug: null };
  return { type: "root", slug: null };
};

const readCardParam = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("card") === "open";
};

const parseModeParam = (value) => {
  if (!value) return null;
  const cleaned = String(value).toLowerCase();
  return cleaned === "all" || cleaned === "run" || cleaned === "swim" ? cleaned : null;
};

const parseRangeParam = (value) => {
  if (!value) return null;
  const cleaned = String(value);
  if (["all", "month", "3m", "6m"].includes(cleaned)) return cleaned;
  if (/^\d{4}$/.test(cleaned)) return cleaned;
  if (cleaned.startsWith("season:")) return cleaned;
  return null;
};

const readFilterParams = () => {
  if (typeof window === "undefined") return { mode: null, range: null };
  const params = new URLSearchParams(window.location.search);
  return {
    mode: parseModeParam(params.get("mode")),
    range: parseRangeParam(params.get("range")),
  };
};

const buildSearchParams = ({ withCard, modeValue, rangeValue }) => {
  const params = new URLSearchParams();
  if (withCard) params.set("card", "open");
  if (modeValue) params.set("mode", modeValue);
  if (rangeValue) params.set("range", rangeValue);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const buildUserPath = (slug, withCard = false, modeValue = null, rangeValue = null) =>
  `/user/${encodeURIComponent(slug)}${buildSearchParams({ withCard, modeValue, rangeValue })}`;

const buildCardsPath = (modeValue = null, rangeValue = null) =>
  `/cards${buildSearchParams({ withCard: false, modeValue, rangeValue })}`;

const buildNewsPath = () => "/events";

export {
  buildCardsPath,
  buildNewsPath,
  buildSearchParams,
  buildUserPath,
  parseModeParam,
  parseRangeParam,
  readCardParam,
  readFilterParams,
  readRouteState,
};
