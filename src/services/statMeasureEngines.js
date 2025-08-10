// statMeasureEngines.js

export const GroupedRange = {
  inputType: "grouped",
  summaryKeys: ["range", "coefficientOfRange"],
  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true }
    ]
  },
  generateInitialRows(intervals = [], freqs = []) {
    return intervals.map(([start, end], i) => ({
      ciLabel: `${start}–${end}`,
      fi: freqs[i]
    }));
  },
  calculateSummaryStats(rows) {
    const bounds = rows.map(r => r.ciLabel.split("–").map(Number));
    const lower = bounds[0][0];
    const upper = bounds[bounds.length - 1][1];
    const range = upper - lower;
    const coefficientOfRange = Math.round((range / (upper + lower)) * 100) / 100;
    return { range, coefficientOfRange };
  }
};

export const GroupedMean = {
  inputType: "grouped",
  summaryKeys: ["mean"],
  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢxᵢ", editable: false }
    ]
  },
  generateInitialRows(intervals = [], freqs = []) {
    return intervals.map(([start, end], i) => {
      const xi = (start + end) / 2;
      return {
        ciLabel: `${start}–${end}`,
        fi: freqs[i],
        xi,
        fixi: ""
      };
    });
  },
  calculateSummaryStats(rows) {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const meanNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Number(r.xi), 0);
    const mean = meanNumerator / totalFi;
    return { mean: Number(mean.toFixed(2)) };
  }
};

export const GroupedMode = {
  inputType: "grouped",
  summaryKeys: ["mode"],
  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true }
    ]
  },
  generateInitialRows(intervals = [], freqs = []) {
    return intervals.map(([start, end], i) => ({
      ciLabel: `${start}–${end}`,
      fi: freqs[i]
    }));
  },
  calculateSummaryStats(rows) {
    const fiList = rows.map(r => Number(r.fi));
    const modalIndex = fiList.findIndex(f => f === Math.max(...fiList));
    if (modalIndex <= 0 || modalIndex >= rows.length - 1) return { mode: "-" };

    const [L, h] = rows[modalIndex].ciLabel.split("–").map(Number);
    const f1 = fiList[modalIndex];
    const f0 = fiList[modalIndex - 1];
    const f2 = fiList[modalIndex + 1];
    const mode = L + ((f1 - f0) / ((2 * f1) - f0 - f2)) * (h - L);
    return { mode: Number(mode.toFixed(2)) };
  }
};

export const GroupedMedian = {
  inputType: "grouped",
  summaryKeys: ["median"],
  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true }
    ]
  },
  generateInitialRows(intervals = [], freqs = []) {
    return intervals.map(([start, end], i) => ({
      ciLabel: `${start}–${end}`,
      fi: freqs[i]
    }));
  },
  calculateSummaryStats(rows) {
    const N = rows.reduce((sum, row) => sum + Number(row.fi), 0);
    const Nby2 = N / 2;

    let cumulativeFreq = 0;
    const medianClassIndex = rows.findIndex(row => {
      cumulativeFreq += Number(row.fi);
      return cumulativeFreq >= Nby2;
    });

    if (medianClassIndex === -1) return { median: "-" };

    const [L, h] = rows[medianClassIndex].ciLabel.split("–").map(Number);
    const f = Number(rows[medianClassIndex].fi);
    const F = rows.slice(0, medianClassIndex).reduce((sum, row) => sum + Number(row.fi), 0);
    const median = L + ((Nby2 - F) / f) * (h - L);
    return { median: Number(median.toFixed(2)) };
  }
};

export const statEngines = {
  range: GroupedRange,
  mean: GroupedMean,
  mode: GroupedMode,
  median: GroupedMedian
};