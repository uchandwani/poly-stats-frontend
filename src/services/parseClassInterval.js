// 📁 src/utils/parseClassInterval.js

export function parseClassInterval(interval) {
  if (!interval || (Array.isArray(interval) && interval.length === 0)) {
    console.warn("⚠️ Invalid interval:", interval);
    return { L: NaN, U: NaN, h: NaN, mid: NaN };
  }

  // ✅ New format: [L, U] or [x]
  if (Array.isArray(interval)) {
    const [L, U] = interval.length === 2 ? interval : [interval[0], interval[0]];
    const h = U - L;
    const mid = (L + U) / 2;
    return { L, U, h, mid };
  }

  // 🔁 Old format: "20–30"
  const match = interval?.match?.(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (!match) {
    console.warn("⚠️ Could not parse classInterval:", interval);
    return { L: NaN, U: NaN, h: NaN, mid: NaN };
  }

  const L = Number(match[1]);
  const U = Number(match[2]);
  const h = U - L;
  const mid = (L + U) / 2;

  return { L, U, h, mid };
}
