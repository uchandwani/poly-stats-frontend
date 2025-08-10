// services/statMeasureEngines/GroupedMean_v2.js

export const GroupedMean_v2 = {
  inputType: "grouped",
  summaryKeys: ["mean"],

  summaryStats: (rows) => {
    const totalFi = rows.reduce((sum, r) => sum + Number(r.fi), 0);
    const mean = rows.reduce((sum, r) => sum + Number(r.xi) * Number(r.fi), 0) / totalFi;
    return {
      mean: Number.isFinite(mean) ? mean.toFixed(2) : "-"
    };
  },

  generateInitialRows: (classIntervals = [], frequencies = []) =>
    classIntervals.map(({ lower, upper }, i) => {
      const xi = ((lower + upper) / 2).toFixed(1);
      return {
        lower,
        upper,
        fi: frequencies[i] ?? "",
        xi,
        fixi: ""
      };
    }),

  generateExpectedRows: (classIntervals = [], frequencies = []) =>
    classIntervals.map(({ lower, upper }, i) => {
      const xi = (lower + upper) / 2;
      const fi = frequencies[i];
      return {
        lower,
        upper,
        fi,
        xi,
        fixi: fi * xi
      };
    }),

  generateTotalRow: (rows, columns) => {
    const sumColumn = (rows, key) =>
      rows.reduce((sum, r) => sum + Number(r[key] || 0), 0);

    const totalRow = {};
    columns.forEach((col) => {
      if (col.key === "label") totalRow[col.key] = "Σ";
      else if (["fi", "fixi"].includes(col.key)) {
        totalRow[col.key] = sumColumn(rows, col.key).toFixed(2);
      } else {
        totalRow[col.key] = "";
      }
    });
    return totalRow;
  },

  tableConfig: {
    columns: [
      {
        key: "label",
        label: "Class Interval",
        editable: false,
        generateFromRow: (row) => `${row.lower}–${row.upper}`
      },
      { key: "fi", label: "Frequency (fᵢ)", editable: true },
      { key: "xi", label: "Midpoint (xᵢ)", editable: false },
      { key: "fixi", label: "fᵢ·xᵢ", editable: true }
    ],
    expectedColumns: ["fixi"],
    enableValidation: true
  }
};
