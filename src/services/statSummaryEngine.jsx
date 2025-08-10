export function calculateSummaryStats(rows, mode = "mean") {
  const N = rows.reduce((sum, row) => sum + Number(row.fi || 0), 0);
  if (N === 0) return {};

  const mean = rows.reduce((sum, row) => sum + Number(row.fixi || 0), 0) / N;


  let meanDeviation = 0;
  let variance = 0;

  for (const row of rows) {
    const fi = Number(row.fi || 0);

    let deviation = 0;
    if (mode === "mean") {
      deviation = Math.abs(row.xi - mean);
    } else if (mode === "std") {
      deviation = row.xi - mean; // signed difference
    } else if (mode === "enhanced") {
      // Enhanced mode uses xi² directly for variance
      deviation = 0; // we won't use it here
    }

    if (mode === "mean") {
      meanDeviation += fi * deviation;
    } else if (mode === "std") {
      variance += fi * deviation ** 2;
    } else if (mode === "enhanced") {
      variance += Number(row.fixi2 || 0); // for enhanced

    }
  }

  if (mode === "mean") {
    meanDeviation = meanDeviation / N;
    return {
      mean: round(mean),
      meanDeviation: round(meanDeviation)
    };
  } else {
    // For std or enhanced
    const computedVariance = mode === "enhanced"
      ? (variance / N) - mean ** 2
      : variance / N;

    const stdDev = Math.sqrt(Number(computedVariance));
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;


    return {
      mean: round(mean),
      variance: round(computedVariance),
      stdDev: round(stdDev),
      cv: round(cv)
    };
  }
}

function round(val) {
  return Number(val.toFixed(2));
}
