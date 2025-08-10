// StatEngine.js

function generateCommonTotalRow(rows, columns) {
  const totalRow = {};
  columns.forEach((col) => {
    if (col.key === "ciLabel") totalRow[col.key] = "Σ";
    else if (["fi", "fixi"].includes(col.key)) {
      totalRow[col.key] = rows.reduce((sum, r) => sum + Number(r[col.key] || 0), 0).toFixed(2);
    } else {
      totalRow[col.key] = "";
    }
  });
  return totalRow;
}

  const GroupedMean = {
    
      inputType: "grouped",
      summaryKeys: ["mean"],

      generateInitialRows: (intervals = [], freqs = []) =>
        intervals.map(([lower, upper], i) => {
          const midpoint = (lower + upper) / 2;
          return {
            ci: [lower, upper],
            ciLabel: `${lower}–${upper}`,
            fi: freqs[i] ?? "",
            xi: midpoint,
            fixi: ""
          };
        }),

      generateExpectedRows: (intervals = [], frequencies = []) =>
        intervals.map(([lower, upper], i) => {
          const xi = (lower + upper) / 2;
          const fi = frequencies[i] ?? 0;
          return {
            ci: [lower, upper],
            ciLabel: `${lower}–${upper}`,
            fi,
            xi,
            fixi: fi * xi
          };
        }),

      summaryStats: (rows) => {
        const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
        const numerator = rows.reduce((sum, r) => sum + Number(r.fi) * Number(r.xi), 0);
        const mean = numerator / totalFi;
        return {
          mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : "-"
        };
      },

      validateRows: (studentRows, expectedRows) =>
        studentRows.map((row, index) => {
          const studentFx = Number(row?.fixi);
          const expectedFx = Number(expectedRows?.[index]?.fixi);
          const isCorrect = Math.abs(studentFx - expectedFx) < 0.01;
          return row?.fixi === "" ? null : { fixiCorrect: isCorrect };
        }),

      generateTotalRow: generateCommonTotalRow,

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

  const GroupedMedian = {
  inputType: "grouped",
  summaryKeys: ["median"],

  generateInitialRows: (intervals = [], freqs = []) =>
    intervals.map(([lower, upper], i) => ({
      ci: [lower, upper],
      ciLabel: `${lower}–${upper}`,
      fi: freqs[i] ?? "",
      cumulativeFi: "",
      h: upper - lower
    })),

  generateExpectedRows: (intervals = [], freqs = []) => {
    if (!intervals.length) {
      console.warn("⚠️ No classIntervals provided for expected rows.");
      return [];
    }

    const rows = intervals.map(([lower, upper], i) => {
      const fi = Number(freqs[i] ?? 0);
      return {
        ci: [lower, upper],
        ciLabel: `${lower}–${upper}`,
        lower,
        upper,
        fi,
        h: upper - lower,
        xi: (lower + upper) / 2
      };
    });

    // ✅ Compute cumulative frequency and mark median class
    let cf = 0;
    const N = rows.reduce((sum, r) => sum + r.fi, 0);
    const Nby2 = N / 2;

    for (let i = 0; i < rows.length; i++) {
      cf += rows[i].fi;
      rows[i].cumulativeFi = cf;
      if (cf >= Nby2 && !rows.some(r => r.isMedian)) {
        rows[i].isMedian = true;
      }
    }

    return rows;
  },

  summaryStats: (rows) => {
    const N = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const Nby2 = N / 2;

    let cf = 0;
    const index = rows.findIndex((r) => {
      cf += Number(r.fi);
      return cf >= Nby2;
    });

    if (index === -1) return { median: "-" };

    const L = Number(rows[index].ci?.[0] ?? 0);
    const f = Number(rows[index].fi);
    const h = Number(rows[index].h);
    const F = rows.slice(0, index).reduce((sum, r) => sum + Number(r.fi), 0);

    const median = L + ((Nby2 - F) / f) * h;
    return {
      median: Number.isFinite(median) ? Number(median.toFixed(2)) : "-"
    };
  },

  validateRows: (rows) => {
    const validations = [];
    let runningTotal = 0;
    for (let i = 0; i < rows.length; i++) {
      const expected = runningTotal + Number(rows[i].fi);
      const actual = Number(rows[i].cumulativeFi);
      validations.push({
        cumulativeFiCorrect: actual === expected
      });
      runningTotal = expected;
    }
    return validations;
  },

  generateTotalRow: generateCommonTotalRow,

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


  const GroupedMode = {
    inputType: "grouped",
    summaryKeys: ["mode"],

    generateInitialRows: (intervals = [], freqs = []) =>
      intervals.map(([lower, upper], i) => ({
        ci: [lower, upper],
        ciLabel: `${lower}–${upper}`,
        fi: freqs[i] ?? "",
        h: upper - lower
      })),

  generateExpectedRows: (boundaries = [], frequencies = []) => {
  if (!boundaries.length) {
    console.warn("⚠️ No classIntervals provided for expected rows.");
    return [];
  }

  const rows = boundaries.map((interval, i) => {
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
      ci: [lower, upper]  // ✅ FIXED to array
    };
  });

  // ✅ Mark modal class
  let modalIndex = rows.reduce(
    (maxIdx, r, idx, arr) => (r.fi > arr[maxIdx].fi ? idx : maxIdx),
    0
  );
  rows[modalIndex].isModal = true;

  return rows;
},


    summaryStats: (rows) => {
      const modalIndex = rows.reduce(
        (maxIdx, r, i, arr) => (Number(r.fi) > Number(arr[maxIdx].fi) ? i : maxIdx),
        0
      );
      const modal = rows[modalIndex];
      const prev = rows[modalIndex - 1] ?? { fi: 0 };
      const next = rows[modalIndex + 1] ?? { fi: 0 };

      const f1 = Number(modal.fi);
      const f0 = Number(prev.fi);
      const f2 = Number(next.fi);
      const L = modal.ci?.[0] ?? 0;
      const h = (modal.ci?.[1] ?? 0) - L;

      const denom = (2 * f1) - f0 - f2;
      const mode = L + ((f1 - f0) / denom) * h;

      return { mode: Number.isFinite(mode) ? Number(mode.toFixed(2)) : "-" };
    },

    validateRows: () => [],

    generateTotalRow: generateCommonTotalRow,

    tableConfig: {
      columns: [
        { key: "ciLabel", label: "Class Interval", editable: false },
        { key: "fi", label: "Frequency (fᵢ)", editable: true }
      ],
      expectedColumns: [],
      enableValidation: false
    }
  };

  const GroupedRange = {
    inputType: "grouped",
    summaryKeys: ["range"],

    generateInitialRows: (intervals = [], freqs = []) =>
      intervals.map(([lower, upper], i) => ({
        ci: [lower, upper],
        ciLabel: `${lower}–${upper}`,
        fi: freqs[i] ?? ""
      })),

    generateExpectedRows: (intervals = [], freqs = []) =>
      intervals.map(([lower, upper], i) => ({
        ci: [lower, upper],
        ciLabel: `${lower}–${upper}`,
        fi: freqs[i] ?? 0
      })),

    summaryStats: (rows) => {
      const lowers = rows.map((r) => r.ci?.[0]);
      const uppers = rows.map((r) => r.ci?.[1]);
      const range = Math.max(...uppers) - Math.min(...lowers);
      return { range: Number.isFinite(range) ? Number(range.toFixed(2)) : "-" };
    },

    validateRows: () => [],

    generateTotalRow: generateCommonTotalRow,

    tableConfig: {
      columns: [
        { key: "ciLabel", label: "Class Interval", editable: false },
        { key: "fi", label: "Frequency (fᵢ)", editable: true }
      ],
      expectedColumns: [],
      enableValidation: false
    }
  };

  const DiscreteMean = {
  inputType: "discrete",
  summaryKeys: ["mean"],

  generateInitialRows: (values = []) =>
    values.map((val) => ({
      value: val,
      xi: val,
      fixi: "", // optional: student can compute xi (trivial here)
    })),

  generateExpectedRows: (values = []) => {
    const parsed = values.map(v => Number(v)).filter(n => !isNaN(n));
    const mean = parsed.reduce((sum, x) => sum + x, 0) / parsed.length;

    return parsed.map((x) => ({
      value: x,
      xi: x,
      deviation: x - mean,
    }));
  },

  summaryStats: (rows) => {
    const values = rows.map(r => Number(r.value)).filter(n => !isNaN(n));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
      mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : "-"
    };
  },

  validateRows: (studentRows, expectedRows) =>
    studentRows.map((row, index) => {
      const studentVal = Number(row?.value);
      const expectedVal = Number(expectedRows?.[index]?.value);
      return {
        valueCorrect: Math.abs(studentVal - expectedVal) < 0.01
      };
    }),

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "value") {
        totalRow[col.key] = "Σ";
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      { key: "value", label: "Value (xᵢ)", editable: true },
      // Optionally add: { key: "deviation", label: "xᵢ – x̄", editable: false }
    ],
    expectedColumns: [],
    enableValidation: true
  }
};

const DiscreteMedian = {
  inputType: "discrete",
  summaryKeys: ["median"],

  generateInitialRows: (values = []) =>
    values.map((val) => ({ value: val })),

  generateExpectedRows: (values = []) => {
    const cleaned = values.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const mid = Math.floor(cleaned.length / 2);
    const median = cleaned.length % 2 === 0
      ? (cleaned[mid - 1] + cleaned[mid]) / 2
      : cleaned[mid];

    return cleaned.map((v) => ({
      value: v,
      isMedian: v === median  // optionally mark
    }));
  },

  summaryStats: (rows) => {
    const values = rows.map(r => Number(r.value)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
    return { median: Number.isFinite(median) ? Number(median.toFixed(2)) : "-" };
  },

  validateRows: (studentRows, expectedRows) =>
    studentRows.map((row, i) => ({
      isMedianCorrect: !!(row?.isMedian && expectedRows?.[i]?.isMedian)
    })),

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach(col => {
      totalRow[col.key] = col.key === "value" ? "Σ" : "";
    });
    return totalRow;
  },

  tableConfig: {
    columns: [{ key: "value", label: "Value (xᵢ)", editable: true }],
    expectedColumns: [],
    enableValidation: true
  }
};


 const DiscreteMode = {
  inputType: "discrete",
  summaryKeys: ["mode"],

  generateInitialRows: (values = []) =>
    values.map((val) => ({ value: val })),

  generateExpectedRows: (values = []) => {
    const cleaned = values.map(Number).filter(n => !isNaN(n));
    const freqMap = {};
    cleaned.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freqMap));
    const modeCandidates = Object.entries(freqMap)
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => Number(val));

    return cleaned.map((v) => ({
      value: v,
      isMode: modeCandidates.includes(v)
    }));
  },

  summaryStats: (rows) => {
    const values = rows.map(r => Number(r.value)).filter(n => !isNaN(n));
    const freqMap = {};
    values.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freqMap));
    const modes = Object.entries(freqMap)
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => Number(val));
    const primaryMode = modes.length ? modes[0] : null;

    return { mode: Number.isFinite(primaryMode) ? Number(primaryMode.toFixed(2)) : "-" };
  },

  validateRows: (studentRows, expectedRows) =>
    studentRows.map((row, i) => ({
      isModeCorrect: !!(row?.isMode && expectedRows?.[i]?.isMode)
    })),

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach(col => {
      totalRow[col.key] = col.key === "value" ? "Σ" : "";
    });
    return totalRow;
  },

  tableConfig: {
    columns: [{ key: "value", label: "Value (xᵢ)", editable: true }],
    expectedColumns: [],
    enableValidation: true
  }
};

const DiscreteRange = {
  inputType: "discrete",
  summaryKeys: ["range"],

  generateInitialRows: (values = []) =>
    values.map((val) => ({ value: val })),

  generateExpectedRows: (values = []) => {
    const cleaned = values.map(Number).filter(n => !isNaN(n));
    const min = Math.min(...cleaned);
    const max = Math.max(...cleaned);
    return cleaned.map((v) => ({
      value: v,
      isMin: v === min,
      isMax: v === max
    }));
  },

  summaryStats: (rows) => {
    const values = rows.map(r => Number(r.value)).filter(n => !isNaN(n));
    const range = Math.max(...values) - Math.min(...values);
    return { range: Number.isFinite(range) ? Number(range.toFixed(2)) : "-" };
  },

  validateRows: (studentRows, expectedRows) =>
    studentRows.map((row, i) => ({
      isMinCorrect: !!(row?.isMin && expectedRows?.[i]?.isMin),
      isMaxCorrect: !!(row?.isMax && expectedRows?.[i]?.isMax)
    })),

  generateTotalRow: (rows, columns) => {
    const totalRow = {};
    columns.forEach(col => {
      totalRow[col.key] = col.key === "value" ? "Σ" : "";
    });
    return totalRow;
  },

  tableConfig: {
    columns: [{ key: "value", label: "Value (xᵢ)", editable: true }],
    expectedColumns: [],
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

 generateInitialRows: (intervals = [], frequencies = []) =>
  intervals.map((ci, i) => {
    let lower, upper, xi;

    // Class interval: [lower, upper]
    if (Array.isArray(ci) && ci.length === 2) {
      [lower, upper] = ci;
      xi = ((lower + upper) / 2);
    }

    // Discrete value: xi directly
    else if (typeof ci === "number") {
      xi = ci;
      lower = upper = ci;
    }

    return {
      ciLabel: Array.isArray(ci) ? `${lower}–${upper}` : `${xi}`,  // For display
      fi: frequencies[i] ?? "",
      xi,
      fixi: "",
      absDiff: "",
      fiAbsDiff: ""
    };
  }),


  generateExpectedRows: (intervals = [], frequencies = []) => {
  const mids = intervals.map((ci) => {
    if (Array.isArray(ci) && ci.length === 2) {
      const [a, b] = ci;
      return (a + b) / 2;
    } else if (typeof ci === "number") {
      return ci;
    } else {
      return NaN;
    }
  });

  const totalFi = frequencies.reduce((sum, f) => sum + f, 0);
  const mean = mids.reduce((sum, m, i) => sum + m * frequencies[i], 0) / totalFi;

  return intervals.map((ci, i) => {
    const xi = mids[i];
    const fi = frequencies[i];
    const isClassInterval = Array.isArray(ci);
    const ciLabel = isClassInterval ? `${ci[0]}–${ci[1]}` : `${xi}`;

    return {
      ciLabel,
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
    if (col.key === "ciLabel") {
      totalRow[col.key] = "Σ";
    } else if (["fi", "fixi", "fiAbsDiff"].includes(col.key)) {
      totalRow[col.key] = sumColumn(rows, col.key).toFixed(2);
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
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "absDiff", label: "|xᵢ − x̄|", editable: true },
      { key: "fiAbsDiff", label: "fᵢ·|xᵢ − x̄|", editable: true }
    ],
    expectedColumns: ["fixi", "absDiff", "fiAbsDiff"],
    enableValidation: true
  }
};

const SD_Para = {
  inputType: "parameter",
  summaryKeys: ["mean", "variance", "standarddeviation", "cv"],
  expectedColumns: ["fixi", "squaredDiff", "fiSquaredDiff"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
    const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
    const variance = rows.reduce((a, r) => a + r.fi * Math.pow(r.xi - mean, 2), 0) / totalFi;
    const sd = Math.sqrt(variance);
    const cv = (sd / mean) * 100;
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
      { key: "fi", label: "fᵢ (Frequency)", editable: true },
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
    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
      variance: Number.isFinite(variance) ? variance.toFixed(2) : "-",
      standarddeviation: Number.isFinite(sd) ? sd.toFixed(2) : "-",
      cv: Number.isFinite(cv) ? cv.toFixed(2) : "-"
    };
  },
generateInitialRows: (intervals = [], frequencies = []) =>
  intervals.map((ci, i) => {
    let xi, ciLabel;

    if (Array.isArray(ci) && ci.length === 2) {
      const [a, b] = ci;
      xi = ((a + b) / 2).toFixed(1);
      ciLabel = `${a}–${b}`;
    } else {
      xi = Number(ci);
      ciLabel = "";  // Not shown for discrete data
    }

    return {
      ciLabel,
      fi: frequencies[i] ?? "",
      xi,
      fixi: "",
      squaredDiff: "",
      fiSquaredDiff: ""
    };
  }),


 generateExpectedRows: (intervals = [], frequencies = []) => {
  const mids = intervals.map((ci) =>
    Array.isArray(ci) && ci.length === 2
      ? (ci[0] + ci[1]) / 2
      : Number(ci)
  );

  const totalFi = frequencies.reduce((sum, f) => sum + f, 0);
  const mean = mids.reduce((sum, m, i) => sum + m * frequencies[i], 0) / totalFi;

  return intervals.map((ci, i) => {
    const xi = mids[i];
    const fi = frequencies[i];
    const squaredDiff = Math.pow(xi - mean, 2);
    const ciLabel = Array.isArray(ci) && ci.length === 2 ? `${ci[0]}–${ci[1]}` : "";

    return {
      ciLabel,
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
    if (col.key === "ciLabel") totalRow[col.key] = "Σ";
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
      { key: "ciLabel", label: "Class Interval", editable: false },
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

const GroupedMeanVsSD = {
  inputType: "grouped",
  summaryKeys: ["meanDeviation", "standardDeviation"],

  tableConfig: {
    columns: [
      { key: "ciLabel", label: "Class Interval", editable: false },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true },
      { key: "absDev", label: "|xᵢ − x̄|", editable: true },
      { key: "fiAbsDev", label: "fᵢ·|xᵢ − x̄|", editable: true },
      { key: "squaredDev", label: "(xᵢ − x̄)²", editable: true },
      { key: "fiSquaredDev", label: "fᵢ·(xᵢ − x̄)²", editable: true }
    ],
    expectedColumns: ["fixi", "fiAbsDev", "fiSquaredDev"],
    enableValidation: true
  },

  summaryStats: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const meanNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Number(r.xi), 0);
    const mean = meanNumerator / totalFi;

    const mdNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Math.abs(Number(r.xi) - mean), 0);
    const sdNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Math.pow(Number(r.xi) - mean, 2), 0);

    const meanDeviation = mdNumerator / totalFi;
    const standardDeviation = Math.sqrt(sdNumerator / totalFi);

    return {
      meanDeviation: Number.isFinite(meanDeviation) ? Number(meanDeviation.toFixed(2)) : "-",
      standardDeviation: Number.isFinite(standardDeviation) ? Number(standardDeviation.toFixed(2)) : "-"
    };
  },

  generateInitialRows: (classIntervals = [], frequencies = []) => {
    return classIntervals.map((ci, i) => {
      const lower = ci?.lower ?? ci[0];
      const upper = ci?.upper ?? ci[1];
      const xi = Number(((lower + upper) / 2).toFixed(2));
      const rawFi = frequencies[i] ?? "";
      const fi = rawFi !== "" ? Number(rawFi) : "";

      return {
        ci: { lower, upper },
        ciLabel: `${lower}–${upper}`,
        fi,
        xi,
        fixi: "",            // fᵢ·xᵢ
        absDev: "",          // |xᵢ − x̄|
        fiAbsDev: "",        // fᵢ·|xᵢ − x̄|
        squaredDev: "",      // (xᵢ − x̄)²
        fiSquaredDev: ""     // fᵢ·(xᵢ − x̄)²
      };
    });
  },

  generateExpectedRows: (classIntervals = [], frequencies = []) => {
    const xiList = classIntervals.map(([low, high]) => (low + high) / 2);
    const totalFi = frequencies.reduce((sum, f) => sum + Number(f), 0);
    const meanNumerator = xiList.reduce((sum, xi, i) => sum + xi * frequencies[i], 0);
    const mean = meanNumerator / totalFi;

    return classIntervals.map((ci, i) => {
      const lower = ci?.lower ?? ci[0];
      const upper = ci?.upper ?? ci[1];
      const xi = Number(((lower + upper) / 2).toFixed(2));
      const fi = Number(frequencies[i] ?? 0);

      const fixi = xi * fi;
      const absDev = Math.abs(xi - mean);
      const fiAbsDev = fi * absDev;
      const squaredDev = Math.pow(xi - mean, 2);
      const fiSquaredDev = fi * squaredDev;

      return {
        ci: [lower, upper],       // ✅ Correct format (array of numbers)
        ciLabel: `${lower}–${upper}`,  // ✅ Still use this for display
        fi,
        xi: xi.toFixed(2),
        fixi: fixi.toFixed(2),
        absDev: absDev.toFixed(2),
        fiAbsDev: fiAbsDev.toFixed(2),
        squaredDev: squaredDev.toFixed(2),
        fiSquaredDev: fiSquaredDev.toFixed(2)
      };
    });
  },

  generateTotalRow: (rows, columns) => {
    const totalRow = {};

    columns.forEach((col) => {
      if (col.key === "ciLabel") {
        totalRow[col.key] = "Σ";
      } else if (["fi", "fixi", "fiAbsDev", "fiSquaredDev"].includes(col.key)) {
        const total = rows.reduce((sum, r) => sum + Number(r[col.key] || 0), 0);
        totalRow[col.key] = total.toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });

    return totalRow;
  }
};


const MD_Para = {
  inputType: "parameter",
  summaryKeys: ["mean", "meandeviation"],
  intervalLabel: "Parameter",
  expectedColumns: ["fixi", "absDiff", "fiAbsDiff"],

  generateInitialRows: (xiList = [], fiList = []) =>
    xiList.map((xi, i) => ({
      xi,
      fi: fiList[i] ?? "",
      fixi: "",
      absDiff: "",
      fiAbsDiff: ""
    })),

  summaryStats: (rows) => {
  const totalFi = rows.reduce((a, r) => a + Number(r.fi), 0);
  const mean = rows.reduce((a, r) => a + r.xi * r.fi, 0) / totalFi;
  const md = rows.reduce((a, r) => a + r.fi * Math.abs(r.xi - mean), 0) / totalFi;

  return {
    mean: Number.isFinite(mean) ? mean.toFixed(2) : "-",
    meandeviation: Number.isFinite(md) ? md.toFixed(2) : "-"
  };
  },
  

  generateExpectedRows: (xiList = [], fiList = []) => {
    const totalFi = fiList.reduce((sum, f) => sum + f, 0);
    const mean = xiList.reduce((sum, xi, i) => sum + xi * fiList[i], 0) / totalFi;

    return xiList.map((xi, i) => {
      const fi = fiList[i];
      const absDiff = Math.abs(xi - mean);
      return {
        xi,
        fi,
        fixi: Number((fi * xi).toFixed(2)),
        absDiff: Number(absDiff.toFixed(2)),
        fiAbsDiff: Number((fi * absDiff).toFixed(2))
      };
    });
  },

  generateTotalRow: (rows, columns) => {
  const sumColumn = (rows, key) => rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);
  const totalRow = {};

  columns.forEach((col) => {
    if (col.key === "ciLabel") totalRow[col.key] = "Σ";
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

  return classIntervals.map(([lower, upper], i) => {
    const xi = Number(((lower + upper) / 2).toFixed(2));

    const rawFi = frequencies[i] ?? "";
    const fi = rawFi !== "" ? Number(rawFi) : "";

    cumulative += Number.isFinite(fi) ? fi : 0;

    return {
      ci: [lower, upper],  // ✅ Use array format
      ciLabel: `${lower}–${upper}`,
      fi,
      xi,
      fixi: "",
      cumulativeFi: cumulative
    };
  });
},

summaryStats: (rows) => {
  const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
  const meanNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Number(r.xi), 0);
  const mean = meanNumerator / totalFi;

  // Find modal class: the row with the maximum frequency
  const modalIndex = rows.reduce((maxIdx, row, idx, arr) =>
    Number(row.fi) > Number(arr[maxIdx].fi) ? idx : maxIdx, 0
  );

  const L = Number(rows[modalIndex]?.ci?.lower ?? rows[modalIndex]?.ci?.[0]);
  const f1 = Number(rows[modalIndex]?.fi);
  const f0 = Number(rows[modalIndex - 1]?.fi ?? 0);
  const f2 = Number(rows[modalIndex + 1]?.fi ?? 0);
  const h = (rows[modalIndex]?.ci?.upper ?? rows[modalIndex]?.ci?.[1]) - L;

  const mode = L + ((f1 - f0) / ((2 * f1) - f0 - f2)) * h;

  return {
    mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : "-",
    mode: Number.isFinite(mode) ? Number(mode.toFixed(2)) : "-"
  };
},



 generateExpectedRows: (classIntervals = [], frequencies = []) => {
  return classIntervals.map(([lower, upper], i) => {
    const xi = Number(((lower + upper) / 2).toFixed(2));
    const fi = frequencies[i] ?? 0;

    return {
      ci: [lower, upper],                            // ✅ match format used in generateInitialRows
      ciLabel: `${lower}–${upper}`,                  // ✅ ensure consistent display label
      fi,
      xi,
      fixi: (fi * xi).toFixed(2),
      cumulativeFi: "" // optional
    };
  });
},



 generateTotalRow: (rows, columns) => {
  const totalRow = {};

  columns.forEach((col) => {
    const { key } = col;

    if (key === "ciLabel") {
      totalRow[key] = "Σ";
    } else if (["fi", "fixi", "cumulativeFi"].includes(key)) {
      // Sum only if the column is numeric
      const total = rows.reduce((sum, r) => {
        const val = Number(r[key]);
        return Number.isFinite(val) ? sum + val : sum;
      }, 0);
      totalRow[key] = total.toFixed(2);
    } else {
      // Leave blank for non-summable columns
      totalRow[key] = "";
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

summaryStats: (rows) => {
  console.log("📊 Input Rows:", rows);

  const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
  const meanNumerator = rows.reduce((sum, r) => sum + Number(r.fi) * Number(r.xi), 0);
  const mean = meanNumerator / totalFi;

  console.log("🔢 totalFi =", totalFi);
  console.log("➕ meanNumerator =", meanNumerator);
  console.log("📈 mean =", mean);

  const sortedRows = [...rows].sort((a, b) => a.ci[0] - b.ci[0]);
  const Nby2 = totalFi / 2;
  console.log("🔍 N/2 =", Nby2);

  let cumulativeFi = 0;
  let medianClassIndex = -1;

  for (let i = 0; i < sortedRows.length; i++) {
    cumulativeFi += Number(sortedRows[i].fi);
    console.log(`Row ${i} → cumulativeFi =`, cumulativeFi);

    if (cumulativeFi >= Nby2) {
      medianClassIndex = i;
      console.log("📍 Median class index =", medianClassIndex);
      break;
    }
  }

  if (medianClassIndex === -1) {
    console.log("❌ No valid median class found.");
    return {
      mean: Number(mean.toFixed(2)),
      median: "-"
    };
  }

  const L = sortedRows[medianClassIndex].ci[0];
  const h = sortedRows[medianClassIndex].ci[1] - L;
  const f = Number(sortedRows[medianClassIndex].fi);
  const F = sortedRows
    .slice(0, medianClassIndex)
    .reduce((sum, r) => sum + Number(r.fi), 0);

  console.log("📊 Median Class Info:", {
    L,
    h,
    f,
    F
  });

  const median = L + ((Nby2 - F) / f) * h;
  console.log("📏 median =", median);

  return {
    mean: Number.isFinite(mean) ? Number(mean.toFixed(2)) : "-",
    median: Number.isFinite(median) ? Number(median.toFixed(2)) : "-"
  };

},




 generateInitialRows: (classIntervals = [], frequencies = []) => {
  let cumulative = 0;

  return classIntervals.map((ci, i) => {
    const lower = ci?.lower ?? ci[0];
    const upper = ci?.upper ?? ci[1];
    const xi = Number(((lower + upper) / 2).toFixed(2));
    const rawFi = frequencies[i] ?? "";
    const fi = rawFi !== "" ? Number(rawFi) : "";

    cumulative += Number.isFinite(fi) ? fi : 0;

    return {
      ci: [lower, upper],  // ✅ FIXED: Use array instead of string
      ciLabel: `${lower}–${upper}`,  // ✅ Separate label for display
      fi,
      xi,
      fixi: "", // for student to enter
      cumulativeFi: cumulative
    };
  });
},


  generateExpectedRows: (classIntervals = [], frequencies = []) => {
  let cumulative = 0;

  return classIntervals.map((ci, i) => {
    const lower = ci?.lower ?? ci[0];
    const upper = ci?.upper ?? ci[1];
    const xi = Number(((lower + upper) / 2).toFixed(2));
    const fi = Number(frequencies[i] ?? 0);

    cumulative += fi;

    return {
      ci: [lower, upper],       // ✅ Correct format (array of numbers)
      ciLabel: `${lower}–${upper}`,  // ✅ Still use this for display

      fi,
      xi,
      fixi: (fi * xi).toFixed(2),
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
      const total = rows.reduce((sum, r) => sum + Number(r[col.key] || 0), 0);
      totalRow[col.key] = total.toFixed(2);
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

export const statEngines = {
  GroupedRange,
  GroupedMean,
  GroupedMode, // ✅ Added here
  GroupedMedian,
  DiscreteRange,
  DiscreteMean,
  DiscreteMode, // ✅ Added here
  DiscreteMedian,
  MD_Para,
  MeanDeviation,
  GroupedMeanVsMode,
  GroupedMeanVsMedian,
  GroupedMeanVsSD,
  StandardDeviation,
  SD_Para,
  
};




