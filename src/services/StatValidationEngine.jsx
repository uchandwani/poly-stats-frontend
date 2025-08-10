/**
 * Service: Validate a grouped frequency table against expected values.
 * @module StatValidationEngine
 */

/**
 * Validates each cell of the student input rows by comparing to expected rows.
 *
 * @param {Object} params
 * @param {Array<Object>} params.inputs   - Student-provided table rows.
 * @param {Array<Object>} params.expected - Expected table rows from generateExpectedRows().
 * @param {Array<Object>} params.columns  - Table column definitions (with key property).
 * @returns {Array<Object>} An array of result objects with boolean flags for each column key: e.g. { fiCorrect: true, xiCorrect: false, ... }
 */
export function validateStatTable({ inputs, expected, columns }) {
  if (!Array.isArray(inputs) || !Array.isArray(expected) || !Array.isArray(columns)) {
    throw new Error("validateStatTable: inputs, expected, and columns must be arrays");
  }

  return inputs.map((row, rowIndex) => {
    const result = {};

    columns.forEach(col => {
      const key = col.key;
      const actualValue   = parseFloat(row[key]);
      const expectedValue = parseFloat(expected[rowIndex]?.[key]);

      // Compare with strict equality or fallback to false
      result[`${key}Correct`] = !isNaN(actualValue) && actualValue === expectedValue;
    });

    return result;
  });
}
