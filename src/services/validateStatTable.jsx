/**
 * validateStatTable
 * [2025-06-29] Compares student inputs with expected values.
 * Supports optional filtering via expectedColumns (validates only selected columns).
 * If expectedColumns is omitted or null, validates all columns.
 */
export function validateStatTable({
  inputs,
  expected,
  columns,
  statMeasure = "MeanDeviation",
  expectedColumns = null // ✅ optional filter
}) {
  const tolerance = 0.01;

  if (!Array.isArray(inputs) || !Array.isArray(expected)) {
    console.warn("⚠️ validateStatTable: Invalid input → inputs or expected not arrays");
    return [];
  }

  return inputs.map((row, idx) => {
    const result = {};
    const expRow = expected[idx] || {};

    columns.forEach(({ key }) => {
      // ✅ Skip validation if column not in expectedColumns (when provided)
      if (expectedColumns && !expectedColumns.includes(key)) return;

      const userVal = parseFloat(row[key]);
      const expVal = parseFloat(expRow[key]);

      if (isNaN(expVal) || expVal === undefined) {
        result[`${key}Correct`] = undefined;
      } else if (isNaN(userVal)) {
        result[`${key}Correct`] = false;
      } else {
        result[`${key}Correct`] = Math.abs(userVal - expVal) < tolerance;
      }
    });

    return result;
  });
}
