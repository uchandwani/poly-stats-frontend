// StatCalcMean_LU.js
export function calculateGroupedMean_LU({ classIntervals, frequencies }) {
  if (!Array.isArray(classIntervals) || !Array.isArray(frequencies)) {
    throw new Error("Invalid input: Expected arrays.");
  }

  const mids = classIntervals.map(ci => (ci.lower + ci.upper) / 2);
  const totalFi = frequencies.reduce((sum, f) => sum + f, 0);
  const mean = mids.reduce((sum, m, i) => sum + m * frequencies[i], 0) / totalFi;

  const rows = classIntervals.map((ci, i) => ({
    ...ci,
    mid: mids[i],
    freq: frequencies[i],
    fx: mids[i] * frequencies[i],
  }));

  return {
    measure: "Grouped Mean (Lower/Upper)",
    mean: parseFloat(mean.toFixed(2)),
    table: rows,
  };
}
