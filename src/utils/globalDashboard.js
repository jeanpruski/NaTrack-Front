const buildMonthKeys = (sessions) => {
  const set = new Set();
  sessions.forEach((s) => {
    const key = String(s.date || "").slice(0, 7);
    if (key) set.add(key);
  });
  return Array.from(set).sort();
};

const buildSparklinePoints = (values, w, h) => {
  if (!values.length) return `0,${h / 2} ${w},${h / 2}`;
  const filtered = values.filter((v) => v > 0);
  if (!filtered.length) return `0,${h / 2} ${w},${h / 2}`;
  if (filtered.length === 1) return `0,${h / 2} ${w},${h / 2}`;
  const max = Math.max(...filtered, 1);
  const step = filtered.length > 1 ? w / (filtered.length - 1) : w;
  return filtered
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

export { buildMonthKeys, buildSparklinePoints };
