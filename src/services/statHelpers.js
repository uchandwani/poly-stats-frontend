export function generateExpectedRows({ classIntervals, frequencies, columns }) {
  if (!Array.isArray(classIntervals) || !Array.isArray(frequencies) || !Array.isArray(columns)) {
    console.warn("Invalid inputs to generateExpectedRows");
    return [];
  }

  if (classIntervals.length !== frequencies.length) {
    console.warn("Mismatch between classIntervals and frequencies");
    return [];
  }

  const rows = classIntervals.map((ci, i) => {
    const [a, b] = ci.split("-").map(Number);
    const xi = (a + b) / 2;
    const fi = frequencies[i];
    const xi2 = xi * xi;

    return {
      ci,
      xi,
      xi2,
      fi,
      fixi: fi * xi,
      fixi2: fi * xi2
    };
  });

  const totalFi = rows.reduce((sum, r) => sum + r.fi, 0);
  if (totalFi === 0) return [];

  const mean = rows.reduce((sum, r) => sum + r.fixi, 0) / totalFi;

  const allowedKeys = new Set(columns.map(c => c.key));

  return rows.map(row => {
    const diffMean = row.xi - mean;
    const absDiff = Math.abs(diffMean);
    const diffSq = diffMean ** 2;

    const computed = {
      absDiff,
      fiAbsDiff: row.fi * absDiff,
      diffMean,
      diffSq,
      fiDiffSq: row.fi * diffSq,
    };

    // Only include keys that are in column config
    Object.keys(computed).forEach(key => {
      if (!allowedKeys.has(key)) delete computed[key];
    });

    return { ...row, ...computed };
  });
}
