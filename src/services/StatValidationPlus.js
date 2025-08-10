// services/StatValidationPlus.js

// ✅ General Stat Table Validation (row-wise)
export function validateStatTable({ inputs, expected, columns, measure = "MeanDeviation", tolerance = 0.1 }) {
  if (!Array.isArray(inputs) || !Array.isArray(expected)) return [];

  return inputs.map((input, idx) => {
    const expectedRow = expected[idx] || {};
    const result = {};

    for (const col of columns) {
      const key = col.key;
      const studentVal = input[key];
      const expectedVal = expectedRow[key];

      // 🔒 Skip non-editable columns
      if (!col.editable) continue;

      // ❌ Skip empty or missing values
      if (
        studentVal === "" ||
        studentVal === undefined ||
        expectedVal === "" ||
        expectedVal === undefined ||
        expectedVal === null
      ) {
        result[`${key}Correct`] = null;
        continue;
      }

      const roundedStudent = Number(parseFloat(studentVal).toFixed(2));
      const roundedExpected = Number(parseFloat(expectedVal).toFixed(2));

      result[`${key}Correct`] = Math.abs(roundedStudent - roundedExpected) <= tolerance;
    }

    return result;
  });
}

// ✅ Grouped Table Validator (Frequencies and Cumulative Frequencies)
export function validateGroupedTable(intervals, frequencies, cumulativeFrequencies) {
  if (!Array.isArray(intervals) || !Array.isArray(frequencies)) return [];

  const results = [];
  let cumulativeTotal = 0;

  for (let i = 0; i < intervals.length; i++) {
    const fi = Number(frequencies[i]);
    const userCF = Number(cumulativeFrequencies?.[i]);

    const isFiValid = !isNaN(fi);
    if (isFiValid) cumulativeTotal += fi;

    const isCumulativeValid = !isNaN(userCF) && userCF === cumulativeTotal;

    results.push({
      fiCorrect: isFiValid,
      cumulativeFiCorrect: isCumulativeValid,
    });
  }

  return results;
}

// ✅ Summary Stats Validator (Mean, Mode, SD, etc.)
export function validateSummaryStats({ inputs, expected, tolerance = 0.1 }) {
  const result = {};

  for (const key in expected) {
    const studentVal = inputs[key];
    const expectedVal = expected[key];

    if (
      studentVal === "" ||
      studentVal === undefined ||
      expectedVal === "" ||
      expectedVal === undefined
    ) {
      result[`${key}Correct`] = null;
      continue;
    }

    // Handle null Mode or Median
    if (expectedVal === null || Number.isNaN(expectedVal)) {
      result[`${key}Correct`] = studentVal === "" || studentVal === null ? null : false;
      continue;
    }

    const roundedStudent = +parseFloat(studentVal).toFixed(2);
    const roundedExpected = +parseFloat(expectedVal).toFixed(2);

    result[`${key}Correct`] = Math.abs(roundedStudent - roundedExpected) <= tolerance;
  }

  return result;
}

// ✅ Grouped Median Validator
export function validateGroupedMedian(studentMedian, expectedMedian, tolerance = 0.1) {
  if (
    studentMedian === "" ||
    studentMedian === undefined ||
    expectedMedian === "" ||
    expectedMedian === undefined
  ) {
    return { medianCorrect: null };
  }

  const roundedStudent = +parseFloat(studentMedian).toFixed(2);
  const roundedExpected = +parseFloat(expectedMedian).toFixed(2);

  return {
    medianCorrect: Math.abs(roundedStudent - roundedExpected) <= tolerance,
  };
}

// ✅ Inference Utility – Skewness based on Mean vs Mode
export function inferSkewness(mean, mode, tolerance = 0.1) {
  if (mean == null || mode == null || isNaN(mean) || isNaN(mode)) return "Unknown";

  const delta = mean - mode;

  if (Math.abs(delta) <= tolerance) return "Symmetric";
  if (delta > 0) return "Right-skewed (Mean > Mode)";
  return "Left-skewed (Mean < Mode)";
}

export function calculateGroupedMedian(classIntervals = [], frequencies = []) {
  const n = frequencies.reduce((sum, f) => sum + Number(f), 0);

  const cumulativeFi = [];
  let sum = 0;
  for (let f of frequencies) {
    sum += f;
    cumulativeFi.push(sum);
  }

  const medianPosition = n / 2;
  const medianClassIndex = cumulativeFi.findIndex(c => c >= medianPosition);

  const [l, u] = classIntervals[medianClassIndex];
  const f = frequencies[medianClassIndex];
  const F = medianClassIndex > 0 ? cumulativeFi[medianClassIndex - 1] : 0;
  const h = u - l;

  const median = l + ((medianPosition - F) / f) * h;

  return {
    median: median.toFixed(2)
  };
}


export function validateGroupedMedianTable({ intervals, freqs, cumulativeFi }) {
  const expectedCumulative = [];
  let sum = 0;
  for (let i = 0; i < freqs.length; i++) {
    sum += Number(freqs[i]);
    expectedCumulative.push(sum);
  }

  const isValid = expectedCumulative.every((val, i) => Number(cumulativeFi[i]) === val);

  return {
    isValid,
    expectedCumulative,
    message: isValid ? "✅ Valid cumulative frequency" : "❌ Check cumulative values"
  };
}

