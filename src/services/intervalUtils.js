export function ensureIntervalArray(interval) {
  if (Array.isArray(interval)) return interval;
  if (typeof interval === "string" && interval.includes("-")) {
    const [a, b] = interval.split("-").map(Number);
    if (!isNaN(a) && !isNaN(b)) return [a, b];
  }
  console.warn("⚠️ Malformed interval:", interval);
  return [0, 0]; // fallback
}
