export function calculateGroupedMeanVsMode(classIntervals = [], frequencies = []) {
  const n = frequencies.reduce((sum, f) => sum + Number(f), 0);

  const midpoints = classIntervals.map(([lower, upper]) => (lower + upper) / 2);
  const fixiList = midpoints.map((xi, i) => xi * frequencies[i]);

  const sumFixi = fixiList.reduce((sum, val) => sum + val, 0);
  const mean = sumFixi / n;

  const maxFreq = Math.max(...frequencies);
  const modalIndex = frequencies.findIndex(f => f === maxFreq);

  const [l1, l2] = classIntervals[modalIndex];
  const f1 = frequencies[modalIndex];
  const f0 = frequencies[modalIndex - 1] ?? 0;
  const f2 = frequencies[modalIndex + 1] ?? 0;
  const h = l2 - l1;

  const mode = l1 + (h * (f1 - f0)) / ((2 * f1) - f0 - f2);

  return {
    mean: mean.toFixed(2),
    mode: mode.toFixed(2)
  };
}
