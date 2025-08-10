// utils/colorMapUtils.js

const backgroundPalette = [
  "#f1f8fd", // lighter blue
  "#e3f9e0", // lighter mint green
  "#fffde7", // lighter lemon yellow
  "#fff3e0", // lighter soft orange
  "#fde4ec", // lighter pink
  "#e8f5e9", // lighter green
  "#ede7f6", // lighter lavender
  "#e0f7fa", // lighter cyan
  "#fef2f3", // lighter rose
  "#f7f6f3"  // lighter beige
];

/**
 * Returns a color map for class intervals (e.g., "30-40") or values (e.g., 45)
 * @param {(string|number)[]} intervals - array of class intervals or midpoints
 * @returns {Object} - mapping from interval/value to color
 */
export function generateColorMap(intervals) {
  const map = {};
  intervals.forEach((intv, i) => {
    const key = typeof intv === "number" ? String(intv) : intv;
    map[key] = backgroundPalette[i % backgroundPalette.length];
  });
  return map;
}
