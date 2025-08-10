// ✅ src/utils/frequencyData.js

export function buildFrequencyData(intervals, freqs, mode = "grouped") {
  return intervals.map((label, i) => {
    
    let xi;
    let range;

    if (mode === "grouped" && Array.isArray(label) && label.length === 2) {
      const [L, U] = label;
      xi = (L + U) / 2;
      range = `${L}-${U}`;
    } else if (typeof label === "string" && label.includes("-")) {
      const [L, U] = label.split("-").map(Number);
      xi = (L + U) / 2;
      range = label;
    } else {
      xi = Number(label);
      range = String(label);
    }


    return {
      range,
      xi,
      count: freqs[i] ?? 0,
      fi: freqs[i] ?? 0,
      classInterval: mode === "grouped" ? range : undefined, // ✅ Key Fix
    };
  });
}
