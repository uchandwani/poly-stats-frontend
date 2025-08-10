// --- Core Engines (define first to avoid circular references) ---
import { calculateGroupedMeanVsMode } from "./StatCalcMeanVsMode.js";

export function validateGroupedMean(data, intervals, frequencies) {
  
  const results = [];

  for (let i = 0; i < intervals.length; i++) {
    const rowLabel = `Row ${i}`;

    const fi = Number(frequencies[i]);
    const interval = intervals[i];
    const [lower, upper] = interval || [NaN, NaN];
    const xi = (lower + upper) / 2;
    const expectedFixi = xi * fi;

    const enteredFixiRaw = data[i]?.fixi;
    const enteredFixi = Number(enteredFixiRaw);

    const isValid = !isNaN(expectedFixi) && !isNaN(enteredFixi);
    const isCorrect = isValid && Math.abs(expectedFixi - enteredFixi) < 1e-2;

    console.log(`🔍 ${rowLabel}`);
    console.log(`  ➤ Interval:`, interval);
    console.log(`  ➤ fi = ${fi}, xi = ${xi}`);
    console.log(`  ➤ expectedFixi = ${expectedFixi}`);
    console.log(`  ➤ enteredFixi (raw) = '${enteredFixiRaw}', parsed = ${enteredFixi}`);
    console.log(`  ✅ Correct?`, isCorrect);

    results.push({ isFixiCorrect: isCorrect });
  }

  return results;
}


const MD_Para = {
  inputType: "parameter",
  summaryKeys: ["mean", "meandeviation"],
  intervalLabel: "Parameter",
  expectedColumns: ["fixi", "absDiff", "fiAbsDiff"],

  /* summaryStats: (rows) => {
    const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
    const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
    const md = rows.reduce((a, r) => a + r.fi * Math.abs(r.xi - mean), 0) / totalFi;
    return {
      mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : null,
      meandeviation: Number.isFinite(md) ? md.toFixed(2) : "-"
    };
  }, */

 generateInitialRows: (xiList = [], fiList = []) =>
  xiList.map((xi, i) => ({
    xi,
    fi: fiList[i] ?? "",
    fixi: "",
    absDiff: "",
    fiAbsDiff: ""
  })),



  generateExpectedRows: (xiList = [], fiList = []) => {
    const totalFi = fiList.reduce((sum, f) => sum + f, 0);
    const mean = xiList.reduce((sum, xi, i) => sum + xi * fiList[i], 0) / totalFi;
    return xiList.map((xi, i) => {
      const fi = fiList[i];
      const absDiff = Math.abs(xi - mean);
      return {
        xi,
        fi,
        fixi: fi * xi,
        absDiff,
        fiAbsDiff: fi * absDiff
      };
    });
  },

  generateTotalRow: (rows, columns) => {
  const isRowEntered = (row) => {
    // Mark row as valid if at least one editable cell has value
    return Object.values(row).some(
      (val) => val !== "" && val !== null && !isNaN(val)
    );
  };

  const enteredRows = rows.filter(isRowEntered);

  const sumColumn = (rows, key) =>
    rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);

  const totalRow = {};
  columns.forEach((col) => {
    if (["fixi", "fiAbsDiff", "fi"].includes(col.key)) {
      totalRow[col.key] = sumColumn(enteredRows, col.key).toFixed(2);
    } else {
      totalRow[col.key] = col.key === "xi" ? "Σ" : "";
    }
  });

  return totalRow;
},

  tableConfig: {
    columns: [
      { key: "xi", label: "xᵢ (Value)", editable: false },
      { key: "fi", label: "fᵢ (Frequency)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "absDiff", label: "|xᵢ − x̄|", editable: true },
      { key: "fiAbsDiff", label: "fᵢ·|xᵢ − x̄|", editable: true }
    ],
    expectedColumns: ["fixi", "absDiff", "fiAbsDiff"],
    enableValidation: true
  }
};

const MeanDeviation = {
  inputType: "grouped",
  summaryKeys: ["mean", "meandeviation"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
    const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
    const md = rows.reduce((a, r) => a + r.fi * Math.abs(r.xi - mean), 0) / totalFi;
    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      meandeviation: Number.isFinite(md) ? md.toFixed(2) : "-"
    };
  },

  generateInitialRows: (classIntervals = [], frequencies = []) =>
    classIntervals.map((ci, i) => {
      const [a, b] = ci.split("-").map(Number);
      const xi = ((a + b) / 2).toFixed(1);
      return {
        ci,
        fi: frequencies[i] ?? "",
        xi,
        fixi: "",
        absDiff: "",
        fiAbsDiff: ""
      };
    }),

  generateExpectedRows: (classIntervals = [], frequencies = []) => {
    const mids = classIntervals.map((ci) => {
      const [a, b] = ci.split("-").map(Number);
      return (a + b) / 2;
    });
    const totalFi = frequencies.reduce((sum, f) => sum + f, 0);
    const mean = mids.reduce((sum, m, i) => sum + m * frequencies[i], 0) / totalFi;

    return classIntervals.map((ci, i) => {
      const xi = mids[i];
      const fi = frequencies[i];
      return {
        ci,
        fi,
        xi,
        fixi: fi * xi,
        absDiff: Math.abs(xi - mean),
        fiAbsDiff: fi * Math.abs(xi - mean)
      };
    });
  },

  generateTotalRow: (rows, columns) => {
    const sumColumn = (rows, key) => rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);
    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "ci") totalRow[col.key] = "Σ";
      else if (["fi", "fixi", "fiAbsDiff"].includes(col.key)) {
        totalRow[col.key] = sumColumn(rows, col.key).toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      { key: "ci", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "absDiff", label: "|xᵢ − x̄|", editable: true },
      { key: "fiAbsDiff", label: "fᵢ·|xᵢ − x̄|", editable: true }
    ],
    expectedColumns: ["fixi", "absDiff", "fiAbsDiff"],
    enableValidation: true
  }
};

export const SD_Para = {
  inputType: "parameter",
  summaryKeys: ["mean", "variance", "standarddeviation", "cv"],
  expectedColumns: ["fixi", "squaredDiff", "fiSquaredDiff"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
    const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
    const variance = rows.reduce((a, r) => a + r.fi * Math.pow(r.xi - mean, 2), 0) / totalFi;
    const sd = Math.sqrt(variance);
    const cv = (sd / mean) * 100;
  console.log("The summary values are", totalFi, mean, variance, sd, cv);

    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      variance: Number.isFinite(variance) ? variance.toFixed(2) : "-",
      standarddeviation: Number.isFinite(sd) ? sd.toFixed(2) : "-",
      cv: Number.isFinite(cv) ? cv.toFixed(2) : "-"
    };
  },

  generateInitialRows: (xiList = [], fiList = []) =>
    xiList.map((xi, i) => ({
      xi,
      fi: fiList[i] ?? "",
      fixi: "",
      squaredDiff: "",
      fiSquaredDiff: ""
    })),

  generateExpectedRows: (xiList = [], fiList = []) => {
    const totalFi = fiList.reduce((sum, f) => sum + f, 0);
    const mean = xiList.reduce((sum, xi, i) => sum + xi * fiList[i], 0) / totalFi;
    console.log("The values are ", totalFi, mean);
    return xiList.map((xi, i) => {
      const fi = fiList[i];
      const squaredDiff = Math.pow(xi - mean, 2);
      return {
        xi,
        fi,
        fixi: fi * xi,
        squaredDiff,
        fiSquaredDiff: fi * squaredDiff
      };
    });
  },

  generateTotalRow: (rows, columns) => {
    const sumColumn = (rows, key) => rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);
    const totalRow = {};
    columns.forEach((col) => {
      if (["fi", "fixi", "fiSquaredDiff"].includes(col.key)) {
        totalRow[col.key] = sumColumn(rows, col.key).toFixed(2);
      } else if (col.key === "xi") {
        totalRow[col.key] = "Σ";
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      { key: "xi", label: "xᵢ (Value)", editable: false },
      { key: "fi", label: "fᵢ (Frequency)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "squaredDiff", label: "(xᵢ − x̄)²", editable: true },
      { key: "fiSquaredDiff", label: "fᵢ·(xᵢ − x̄)²", editable: true }
    ],
    expectedColumns: ["fixi", "squaredDiff", "fiSquaredDiff"],
    enableValidation: true
  }
};

const StandardDeviation = {
  inputType: "grouped",
  summaryKeys: ["mean", "variance", "standarddeviation", "cv"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
    const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
    const variance = rows.reduce((a, r) => a + r.fi * Math.pow(r.xi - mean, 2), 0) / totalFi;
    const sd = Math.sqrt(variance);
    const cv = (sd / mean) * 100;
    console.log("The summary values are", totalFi, mean, variance, sd, cv);
    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      variance: Number.isFinite(variance) ? variance.toFixed(2) : "-",
      standarddeviation: Number.isFinite(sd) ? sd.toFixed(2) : "-",
      cv: Number.isFinite(cv) ? cv.toFixed(2) : "-"
    };
  },

  generateInitialRows(intervals = [], freqs = []) {
  return intervals.map(([lower, upper], i) => {
    const midpoint = (lower + upper) / 2;
    const fi = freqs[i] ?? 0;
    return {
      ci: { lower, upper },
      ciLabel: `${lower}–${upper}`,
      fi,
      xi: midpoint,
      fixi: ""  // Let student calculate this
    };
  });
},


  generateExpectedRows: (classIntervals = [], frequencies = []) => {
  const mids = classIntervals.map(([a, b]) => (a + b) / 2);
  const totalFi = frequencies.reduce((sum, f) => sum + f, 0);
  const mean = mids.reduce((sum, m, i) => sum + m * frequencies[i], 0) / totalFi;

  return classIntervals.map(([a, b], i) => {
    const xi = mids[i];
    const fi = frequencies[i];
    const squaredDiff = Math.pow(xi - mean, 2);
    return {
      ciLabel: `${a}–${b}`,
      lower: a,
      upper: b,
      fi,
      xi,
      fixi: fi * xi,
      squaredDiff,
      fiSquaredDiff: fi * squaredDiff
    };
  });

},

  generateTotalRow: (rows, columns) => {
    const sumColumn = (rows, key) => rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);
    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "ci") totalRow[col.key] = "Σ";
      else if (["fi", "fixi", "fiSquaredDiff"].includes(col.key)) {
        totalRow[col.key] = sumColumn(rows, col.key).toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      { key: "ci", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "squaredDiff", label: "(xᵢ − x̄)²", editable: true },
      { key: "fiSquaredDiff", label: "fᵢ·(xᵢ − x̄)²", editable: true }
    ],
    expectedColumns: ["fixi", "squaredDiff", "fiSquaredDiff"],
    enableValidation: true
  }
};

const groupedRange = {
  inputType: "grouped",
  summaryKeys: ["range", "coefficientOfRange"],
  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true }
    ]
  },
  generateExpectedRows(intervals, freqs) {
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





const Mean = {
  inputType: "grouped",
  summaryKeys: ["mean"],
  summaryStats: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const mean = rows.reduce((sum, r) => sum + r.xi * r.fi, 0) / totalFi;
    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-"
    };
  }
};

const Mode = {
  inputType: "grouped",
  summaryKeys: ["mode"],
  summaryStats: (rows) => {
    let modalClassIndex = rows.reduce(
      (maxIdx, row, idx, arr) => (row.fi > arr[maxIdx].fi ? idx : maxIdx),
      0
    );

    const modal = rows[modalClassIndex];
    const fi = modal.fi;
    const f1 = rows[modalClassIndex - 1]?.fi ?? 0;
    const f2 = rows[modalClassIndex + 1]?.fi ?? 0;

    const L = parseFloat(modal.lower);
    const h = parseFloat(modal.upper) - parseFloat(modal.lower);
    const mode = L + (fi - f1) / ((2 * fi) - f1 - f2) * h;

    return {
      mode: Number.isFinite(mode) ? mode.toFixed(2) : "-"
    };
  }
};

const Median = {
  inputType: "grouped",
  summaryKeys: ["median"],
  summaryStats: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    if (!Number.isFinite(totalFi) || totalFi === 0) return { median: "-" };

    // Find the median class
    let cumulative = 0;
    let medianIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      cumulative += Number(rows[i].fi);
      if (cumulative >= totalFi / 2) {
        medianIndex = i;
        break;
      }
    }

    if (medianIndex === -1) return { median: "-" };

    const medianRow = rows[medianIndex];
    const L = Number(medianRow.lower);
    const h = Number(medianRow.upper) - Number(medianRow.lower);
    const f = Number(medianRow.fi);
    const F = rows.slice(0, medianIndex).reduce((sum, r) => sum + Number(r.fi), 0);

    const median = L + ((totalFi / 2 - F) / f) * h;
    return {
      median: Number.isFinite(median) ? median.toFixed(2) : "-"
    };
  }
};



const GroupedMean = {
  inputType: "grouped",
  summaryKeys: ["mean"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const meanNumerator = rows.reduce((sum, r) => sum + Number(r.xi) * Number(r.fi), 0);
    const mean = meanNumerator / totalFi;

    console.log("🔢 totalFi =", totalFi);
    console.log("🔢 mean =", mean);

    return {
      mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : "-"
    };
  },

 generateInitialRows: (intervals = [], freqs = []) => {
  return intervals.map(([lower, upper], i) => {
    const midpoint = (lower + upper) / 2;
    const fi = freqs[i] ?? 0;
    return {
      ci: { lower, upper },
      ciLabel: `${lower}–${upper}`,
      fi,
      xi: midpoint,
      fixi: ""
    };
  });
},


  generateExpectedRows: (classIntervals = [], frequencies = []) =>
    classIntervals.map(([lower, upper], i) => {
      const xi = (lower + upper) / 2;
      const fi = frequencies[i] ?? 0;
      return {
        ci: { lower, upper },
        ciLabel: `${lower}–${upper}`,
        fi,
        xi,
        fixi: fi * xi
      };
    }),

  validateRows: (studentRows, expectedRows) =>
    studentRows.map((row, index) => {
      const studentFx = Number(row?.fixi);
      const expectedFx = Number(expectedRows?.[index]?.fixi);
      const isCorrect = Math.abs(studentFx - expectedFx) < 0.01;

      if (row?.fixi === undefined || row?.fixi === "") return null;
      return { fixiCorrect: isCorrect };
    }),

 generateTotalRow: (rows, columns) => {
  const sumColumn = (rows, key) =>
    rows.reduce((sum, r) => {
      const val = Number(r[key]);
      return isFinite(val) ? sum + val : sum;
    }, 0);

  const totalRow = {};
  columns.forEach((col) => {
    if (col.key === "ciLabel") {
      totalRow[col.key] = "Σ";
    } else if (["fi", "fixi"].includes(col.key)) {
      const sum = sumColumn(rows, col.key);
      totalRow[col.key] = sum > 0 ? sum.toFixed(2) : "";
    } else {
      totalRow[col.key] = "";
    }
  });

   return totalRow;
},


  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true }
    ],
    expectedColumns: ["fixi"],
    enableValidation: true
  }
};



const GroupedMode = {
  inputType: "grouped",
  summaryKeys: ["mode"],

 summaryStats: (rows) => {
  const modalIndex = rows.reduce(
    (maxIdx, row, i, arr) => (Number(row.fi) > Number(arr[maxIdx].fi) ? i : maxIdx),
    0
  );

  const modal = rows[modalIndex];
  console.log("The modal value is ", modal);
  const prev = rows[modalIndex - 1] ?? { fi: 0 };
  const next = rows[modalIndex + 1] ?? { fi: 0 };

  const f1 = Number(modal.fi);
  const f0 = Number(prev.fi);
  const f2 = Number(next.fi);

  const L = modal.lower ?? 0;
  const h = (modal.upper ?? 0) - L;

  const denominator = (2 * f1) - f0 - f2;
  const mode = L + ((f1 - f0) / denominator) * h;

  const rounded = Number.isFinite(mode) ? Number(mode.toFixed(2)) : null;



  console.log("🧪 f0:", f0, "f1:", f1, "f2:", f2);
  console.log("🧪 L:", L, "h:", h);
  console.log("🧪 modalIndex:", modalIndex, "modal class:", modal?.ci);

  
  
  console.log("🟢 Raw mode value:", mode);

  return { mode: rounded };
},


  generateInitialRows: (intervals = [], frequencies = []) => {
  let maxFi = -Infinity;
  let modalIndex = -1;

  // First pass to find modal index
  frequencies.forEach((fi, i) => {
    if (Number(fi) > maxFi) {
      maxFi = Number(fi);
      modalIndex = i;
    }
  });

  return intervals.map((range, i) => {
    const lower = range[0];
    const upper = range[1];

    return {
      ci: { lower, upper },
      ciLabel: `${lower}–${upper}`,
      fi: frequencies[i] ?? "",
      isModal: i === modalIndex   // ✅ add this flag here
    };
  });
},


 generateExpectedRows: (boundaries = [], frequencies = []) => {
  if (!boundaries.length) {
    console.warn("⚠️ No classIntervals provided for expected rows.");
    return [];
  }

  const rows = boundaries.map((interval, i) => {
    // ✨ Handle both array form [a,b] and object {lower:a,upper:b}
    const [lowerRaw, upperRaw] = Array.isArray(interval)
      ? interval
      : [interval.lower, interval.upper];

    const lower = Number(lowerRaw);
    const upper = Number(upperRaw);
    const fi    = Number(frequencies[i] ?? 0);
    const xi    = (lower + upper) / 2;
    const h     = upper - lower;

    return {
      lower,
      upper,
      fi,
      xi,
      h,
      ci: { lower, upper }      // needed by summaryStats
    };
  });

  // mark modal class
  let modalIndex = rows.reduce(
    (maxIdx, r, idx, arr) => (r.fi > arr[maxIdx].fi ? idx : maxIdx),
    0
  );
  rows[modalIndex].isModal = true;

  return rows;
},


 validateRows: (studentRows, expectedRows) => {
  return studentRows.map((row, index) => ({
    isModalCorrect: !!(row?.isModal && expectedRows?.[index]?.isModal),
  }));
},


  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach((col) => {
      totalRow[col.key] =
        col.key === "ciLabel"
          ? "Σ"
          : col.key === "fi"
          ? rows.reduce((sum, r) => sum + Number(r.fi || 0), 0)
          : "";
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true }
    ],
    expectedColumns: [],
    enableValidation: true
  }
};



const GroupedMedian = {
  inputType: "grouped",
  summaryKeys: ["median"],

  generateExpectedRows: (intervals = [], frequencies = []) => {
    return intervals.map((ci, i) => {
      let lower = 0, upper = 0;

      if (typeof ci === "string") {
        [lower, upper] = ci.split(/[-–]/).map(Number);
      } else if (Array.isArray(ci)) {
        [lower, upper] = ci;
      } else {
        lower = ci.lower;
        upper = ci.upper;
      }

      const fi = Number(frequencies[i] ?? 0);
      const h = upper - lower;
      const xi = (lower + upper) / 2;

      return {
        ci: `${lower}-${upper}`,
        ciLabel: `${lower}-${upper}`,
        lower,
        upper,
        fi,
        cumulativeFi: "",
        h,
        xi
      };
    });
  },

  generateInitialRows: (intervals = [], frequencies = []) => {
    return intervals.map((ci, i) => {
      let lower = 0, upper = 0;

      if (typeof ci === "string") {
        [lower, upper] = ci.split(/[-–]/).map(Number);
      } else if (Array.isArray(ci)) {
        [lower, upper] = ci;
      } else {
        lower = ci.lower;
        upper = ci.upper;
      }

      return {
        ci: `${lower}-${upper}`,
        ciLabel: `${lower}-${upper}`,
        lower,
        upper,
        fi: frequencies[i] ?? "",
        cumulativeFi: "",
        h: upper - lower
      };
    });
  },

  summaryStats: (rows) => {
    const N = rows.reduce((sum, row) => sum + Number(row.fi), 0);
    const Nby2 = N / 2;

    let cumulativeFreq = 0;
    const medianClassIndex = rows.findIndex(row => {
      cumulativeFreq += Number(row.fi);
      return cumulativeFreq >= Nby2;
    });

    if (medianClassIndex === -1) return { median: "–" };

    const L = Number(rows[medianClassIndex].lower);
    const f = Number(rows[medianClassIndex].fi);
    const h = Number(rows[medianClassIndex].h);

    const F = rows
      .slice(0, medianClassIndex)
      .reduce((sum, row) => sum + Number(row.fi), 0);

    if (!isFinite(L) || !isFinite(f) || !isFinite(h) || f === 0) {
      return { median: "–" };
    }

    const median = L + ((Nby2 - F) / f) * h;

    console.log("🧮 Median Debug:", {
      N, Nby2, L, f, F, h, medianClassIndex, median
    });

    return {
      median: Number.isFinite(median) ? Number(median.toFixed(2)) : "–"
    };
  },

  validateRows: (rows) => {
    const validations = [];
    let runningTotal = 0;

    for (let i = 0; i < rows.length; i++) {
      const expected = runningTotal + Number(rows[i].fi);
      const studentInput = Number(rows[i].cumulativeFi);

      console.log(`🔍 Row ${i + 1}: fi = ${rows[i].fi}, expected CF = ${expected}, student CF = ${studentInput}`);

      validations.push({
        cumulativeFiCorrect: studentInput === expected
      });

      runningTotal = expected;
    }

    return validations;
  },

  generateTotalRow: (rows, columns) => {
  const totalRow = {};
  columns.forEach((col) => {
    if (col.key === "ciLabel") {
      totalRow[col.key] = "Σ";
    } else if (col.key === "fi") {
      totalRow[col.key] = rows.reduce((sum, row) => {
        const val = Number(row.fi);
        return isNaN(val) ? sum : sum + val;
      }, 0);
    } else {
      totalRow[col.key] = ""; // Don't show anything for CF
    }
  });
  return totalRow;
},



  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "cumulativeFi", label: "Cumulative Frequency (Fᵢ)", editable: true }
    ],
    expectedColumns: ["cumulativeFi"],
    enableValidation: true
  }
};

export default GroupedMedian;

const GroupedMeanVsMode = {
  inputType: "grouped",
  summaryKeys: ["mean", "mode"],

  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "cumulativeFi", label: "Cumulative Frequency (Fᵢ)", editable: false }
    ],
    expectedColumns: ["fixi"],
    enableValidation: true
  },

  generateInitialRows: (classIntervals = [], frequencies = []) => {
    let cumulative = 0;

    return classIntervals.map((ci, i) => {
      const { lower, upper } = ci;
      const xi = Number(((lower + upper) / 2).toFixed(2));

      const rawFi = frequencies[i] ?? "";
      const fi = rawFi !== "" ? Number(rawFi) : "";

      cumulative += Number.isFinite(fi) ? fi : 0;

      return {
        ci: { lower, upper },
        ciLabel: `${lower}–${upper}`,
        fi,
        xi,
        fixi: "", // ✅ left for student input
        cumulativeFi: cumulative
      };
    });
  },

  generateExpectedRows: (classIntervals = [], frequencies = []) => {
    return classIntervals.map((ci, i) => {
      const { lower, upper } = ci;
      const xi = Number(((lower + upper) / 2).toFixed(2));
      const fi = frequencies[i] ?? 0;
      return {
        ci: `${lower}-${upper}`,
        fi,
        xi,
        fixi: (fi * xi).toFixed(2),
        cumulativeFi: "" // optional UI calculation
      };
    });
  },

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "ciLabel") {
        totalRow[col.key] = "Σ";
      } else if (["fi", "fixi"].includes(col.key)) {
        totalRow[col.key] = rows
          .reduce((sum, r) => sum + Number(r[col.key] || 0), 0)
          .toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  calculateSummary: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const mean = rows.reduce((sum, r) => sum + r.xi * r.fi, 0) / totalFi;

    const modalIndex = rows.reduce(
      (maxIdx, row, idx, arr) => (row.fi > arr[maxIdx].fi ? idx : maxIdx),
      0
    );

    const modal = rows[modalIndex];
    const f1 = modal.fi;
    const f0 = rows[modalIndex - 1]?.fi ?? 0;
    const f2 = rows[modalIndex + 1]?.fi ?? 0;
    const [lower, upper] = rows[modalIndex].ciLabel.split("–").map(Number);
    const h = upper - lower;
    const mode = lower + ((f1 - f0) / ((2 * f1) - f0 - f2)) * h;

    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      mode: Number.isFinite(mode) ? mode.toFixed(2) : "-"
    };
  }
};

const GroupedMeanVsMedian = {
  inputType: "grouped",
  summaryKeys: ["mean", "median"],

  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "cumulativeFi", label: "Cumulative Frequency (Fᵢ)", editable: false }
    ],
    expectedColumns: ["fixi"],
    enableValidation: true
  },

  generateInitialRows: (classIntervals = [], frequencies = []) => {
    let cumulative = 0;

    return classIntervals.map((ci, i) => {
      const { lower, upper } = ci;
      const xi = Number(((lower + upper) / 2).toFixed(2));
      const fi = frequencies[i] ?? "";
      const freq = fi !== "" ? Number(fi) : "";
      cumulative += Number.isFinite(freq) ? freq : 0;

      return {
        ci: { lower, upper },
        ciLabel: `${lower}–${upper}`,
        fi,
        xi,
        fixi: "", // for student input
        cumulativeFi: cumulative
      };
    });
  },

  generateExpectedRows: (classIntervals = [], frequencies = []) => {
    let cumulative = 0;
    return classIntervals.map((ci, i) => {
      const xi = (ci.lower + ci.upper) / 2;
      const fi = frequencies[i];
      cumulative += fi;

      return {
        ci: `${ci.lower}-${ci.upper}`,
        fi,
        xi,
        fixi: fi * xi,
        cumulativeFi: cumulative
      };
    });
  },

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "ciLabel") {
        totalRow[col.key] = "Σ";
      } else if (["fi", "fixi"].includes(col.key)) {
        totalRow[col.key] = rows
          .reduce((sum, r) => sum + Number(r[col.key] || 0), 0)
          .toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  calculateSummary: (rows) => {
    // ✅ Mean
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const mean = rows.reduce((sum, r) => sum + r.xi * r.fi, 0) / totalFi;

    // ✅ Median
    const N = totalFi;
    const Nby2 = N / 2;

    let medianClassIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].cumulativeFi >= Nby2) {
        medianClassIndex = i;
        break;
      }
    }

    if (medianClassIndex === -1) return { mean: "-", median: "-" };

    const medianClass = rows[medianClassIndex];
    const L = Number(medianClass.ci.split("-")[0]);
    const f = medianClass.fi;
    const h = Number(medianClass.ci.split("-")[1]) - L;
    const F = medianClassIndex > 0 ? rows[medianClassIndex - 1].cumulativeFi : 0;

    const median = L + ((N / 2 - F) / f) * h;

    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      median: Number.isFinite(median) ? median.toFixed(2) : "-"
    };
  }
};


// ...existing engines

// --- Final Export ---

export const statEngines = {
  MD_Para,
  SD_Para,
  MeanDeviation,
  StandardDeviation,
  Range,
  Mean,
  Mode,
  Median, 
  GroupedMean,
  GroupedMode, // ✅ Added here
  GroupedMedian,
  GroupedMeanVsMode,
  GroupedMeanVsMedian,


  // Auto-generated variants
  MD_Gen_Para: {
    ...MD_Para,
    inputType: "parameter"
  },
  SD_Gen_Para: {
    ...SD_Para,
    inputType: "generatedparameter"
  },
  MD_Gen_Class: {
    ...MeanDeviation,
    inputType: "grouped"
  },
  SD_Gen_Class: {
    ...StandardDeviation,
    inputType: "grouped"
  }
};
