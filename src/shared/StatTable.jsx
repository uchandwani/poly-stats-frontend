import { useState, useEffect, useMemo } from "react";

export default function StatTable({
  tableId,
  classIntervals,
  columns,
  colorMap = {},
  useColor = true,
  expectedRows = [],
  validationResults = [],
  onInputChange = () => {},
  showTotals = true
}) {
  const [inputs, setInputs] = useState([]);

  useEffect(() => {
    const initialized = classIntervals.map((ci, i) => {
      const row = { ci };
      columns.forEach(col => {
        if (col.key === "xi") {
          const [a, b] = ci.split("-").map(Number);
          row[col.key] = ((a + b) / 2).toFixed(1);
        } else if (col.key === "fi") {
          row[col.key] = expectedRows[i]?.fi ?? "";
        } else {
          row[col.key] = "";
        }
      });
      return row;
    });
    setInputs(initialized);
    setValidationResults([]);
  }, [classIntervals, columns, expectedRows]);

  useEffect(() => {
    if (inputs.length > 0) {
      onInputChange(inputs);
    }
  }, [inputs, onInputChange]);

  const handleChange = (rowIndex, field, value) => {
    const updated = [...inputs];
    updated[rowIndex][field] = value;
    setInputs(updated);
  };

  const getValidationClass = (rowIndex, key) => {
    const result = validationResults?.[rowIndex]?.[`${key}Correct`];
    if (result === true) return "bg-green-100";
    if (result === false) return "bg-red-100";
    return "";
  };

  const totalsRow = useMemo(() => {
    const totals = { ci: "Total" };
    columns.forEach(col => {
      if (col.key === "ci") return;
      const total = inputs.reduce((sum, row) => {
        const val = parseFloat(row[col.key]);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      if (!isNaN(total) && total !== 0) {
        totals[col.key] = total.toFixed(2);
      }
    });
    return totals;
  }, [inputs, columns]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-collapse text-xs text-center">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Class Interval</th>
            {columns.map(col => (
              <th key={col.key} className="border px-2 py-1">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inputs.map((row, i) => (
            <tr
              key={`${tableId}-${i}`}
              style={{ backgroundColor: useColor ? (colorMap[row.ci] || "white") : undefined }}
            >
              <td className="border px-2 py-1 font-medium">{row.ci}</td>
              {columns.map(col => (
                <td key={col.key} className="border px-2 py-1">
                  {col.editable ? (
                    <input
                      type="number"
                      className={`w-20 border text-center text-sm ${getValidationClass(i, col.key)}`}
                      value={row[col.key] || ""}
                      onChange={(e) => handleChange(i, col.key, e.target.value)}
                    />
                  ) : (
                    row[col.key]
                  )}
                </td>
              ))}
            </tr>
          ))}

          {showTotals && (
            <tr className="bg-gray-200 font-semibold text-black">
              <td className="border px-2 py-1 text-left">{totalsRow.ci}</td>
              {columns.map(col => (
                <td key={col.key} className="border px-2 py-1">
                  {totalsRow[col.key] ?? ""}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
