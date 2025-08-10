import { parseClassInterval } from "../services/parseClassInterval.js";
import { getClassIntervalString } from "../services/getClassIntervalString.js"; 

const round = (val, places = 2) => Number(Math.round(val * 10 ** places) / 10 ** places);



export function calculateSummaryStats(rows, statMeasure = "MeanDeviation") {
  if (!Array.isArray(rows) || rows.length === 0) return {};

  let sumFi = 0, sumFixi = 0;

  const enrichedRows = rows.map((row, index) => {
    const ciStr = row.classInterval || row.ci || row.ciStr || getClassIntervalString(row);
    const { L, U } = parseClassInterval(ciStr);
    const midpoint = (L + U) / 2;

    const fi = Number(row.fi);
    const fixi = fi * midpoint;

    sumFi += fi;
    sumFixi += fixi;

    return { ...row, xi: midpoint, fixi };
  });

  const mean = Number.isFinite(sumFixi / sumFi)
    ? round(sumFixi / sumFi, 2)
    : null; // ✅ Changed from "-" to null

 


  // ✅ Standard Deviation
  if (statMeasure === "StandardDeviation") {
    let sumFiSquaredDiff = 0;
    enrichedRows.forEach((row) => {
      sumFiSquaredDiff += +row.fiSquaredDiff || 0;
    });

    const variance = round(sumFiSquaredDiff / sumFi, 2);
    const sd = round(Math.sqrt(variance), 2);
    const cv = round((sd / mean) * 100, 2);

    return {
      mean,
      variance,
      standarddeviation: sd,
      cv,
    };
  }

  // ✅ Grouped Mode
  if (statMeasure === "GroupedMode") {
    const modalIndex = enrichedRows.findIndex(
      (r) => r.fi === Math.max(...enrichedRows.map((r) => Number(r.fi)))
    );
    const modal = enrichedRows[modalIndex];
    const prev = enrichedRows[modalIndex - 1] ?? { fi: 0 };
    const next = enrichedRows[modalIndex + 1] ?? { fi: 0 };

    const intervalStr = getClassIntervalString(modal);
    const { L: lo, U: hi, h } = parseClassInterval(intervalStr);

    if (isNaN(lo) || isNaN(hi) || isNaN(h)) {
      console.warn("⚠️ Could not parse class interval:", intervalStr);
      return {};
    }

    const f1 = Number(modal.fi);
    const f0 = Number(prev.fi);
    const f2 = Number(next.fi);

    const mode = lo + ((f1 - f0) / ((2 * f1) - f0 - f2)) * h;

    return {
      mode: round(mode, 2),
      n: sumFi
    };
  }

  // ✅ Grouped Median
  if (statMeasure === "GroupedMedian") {
    const Nby2 = sumFi / 2;
    let cumulativeFreq = 0;
    let medianClassIndex = -1;

    for (let i = 0; i < enrichedRows.length; i++) {
      cumulativeFreq += Number(enrichedRows[i].fi);
      if (cumulativeFreq >= Nby2) {
        medianClassIndex = i;
        break;
      }
    }

    if (medianClassIndex === -1) {
      console.warn("⚠️ Median class not found.");
      return {};
    }

    const medianRow = enrichedRows[medianClassIndex];
    const ciStr = medianRow.classInterval || medianRow.ci || medianRow.ciStr;
    const { L, h } = parseClassInterval(ciStr);

    const F = enrichedRows
      .slice(0, medianClassIndex)
      .reduce((sum, r) => sum + Number(r.fi), 0);

    const f = Number(medianRow.fi);

    if (!isFinite(L) || !isFinite(h) || !isFinite(F) || !isFinite(f) || f === 0) {
      console.warn("⚠️ Invalid values for Median calculation.");
      return {};
    }

    const median = L + ((Nby2 - F) / f) * h;

    return {
      median: Number(median.toFixed(2)),
      N: sumFi
    };
  }

  // ✅ Grouped Mean
  // ✅ Grouped Mean (centralized fixi calculation)
  if (statMeasure === "GroupedMean") {
    let sumFi = 0, sumFixi = 0;

    rows.forEach((row) => {
      const ciStr = row.classInterval || row.ci || row.ciStr;
      const { L, U } = parseClassInterval(ciStr);
      const xi = (L + U) / 2;
      const fi = Number(row.fi);

      const fixi = fi * xi;

      // Inject for UI if needed
      row.fixi = round(fixi, 2);
      row.xi = round(xi, 2);

      sumFi += fi;
      sumFixi += fixi;
    });

    const mean = Number.isFinite(sumFixi / sumFi)
      ? round(sumFixi / sumFi, 2)
      : "-";

    return {
      mean
    };
  }

  // ✅ Mean Deviation (default)
  let sumFiAbsDiff = 0;
  enrichedRows.forEach((row) => {
    sumFiAbsDiff += +row.fiAbsDiff || 0;
  });

  const meanDev = round(sumFiAbsDiff / sumFi, 2);

  return {
    mean,
    meandeviation: meanDev
  };
}

