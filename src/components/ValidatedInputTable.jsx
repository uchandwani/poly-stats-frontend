import React, { useEffect } from "react";

export default function ValidatedInputTable({
  tableConfig,
  rows,
  setRows,
  validationResults = [],
  onRowClick,
  selectedRowIndex,
  statMeasure,
  useColor = false,
  colorMap = {},
}) {
  if (!tableConfig?.columns?.length) return null;
  const { columns } = tableConfig;

  const handleChange = (rowIdx, key, value) => {
    const newRows = [...rows];
    newRows[rowIdx] = { ...newRows[rowIdx], [key]: value };
    setRows(newRows);
  };

  // ✅ Dynamically compute total of user-entered data
  const computedTotalRow = {};
  columns.forEach((col) => {
    
    const values = rows.map((r) => parseFloat(r[col.key]) || 0);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    // Display 0.00 for fi sum as well (total frequency)
    computedTotalRow[col.key] = Number.isFinite(sum)
      ? sum.toFixed(2)
      : "";
  });



  useEffect(() => {
    console.log("🧪 Table rows:", rows);
    console.log("✅ validationResults:", validationResults);
  }, [rows, validationResults]);

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed w-auto border text-sm">
        <colgroup>
          {columns.map((_, i) => (
            <col key={i} className="w-[150px]" />
          ))}
        </colgroup>

        <thead className="bg-blue-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-1 py-1 text-left font-semibold text-xs">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => {
            const isSelected = selectedRowIndex === rowIndex;
            const isModal = row?.isModal;
            const isMedianRow = row?.isMedian;
            const isValidated = validationResults.length > 0;

            let rowClass = "";

            const isCorrectSelected =
              (statMeasure === "GroupedMode" && isModal) ||
              (statMeasure === "GroupedMedian" && isMedianRow);

            if ((statMeasure === "GroupedMode" || statMeasure === "GroupedMedian") && isSelected) {
              rowClass = isValidated
                ? isCorrectSelected ? "bg-green-200" : "bg-red-200"
                : "bg-yellow-100";
            }

            return (
              <tr
                key={rowIndex}
                className={`cursor-pointer transition-colors duration-300 ${rowClass}`}
                onClick={() => onRowClick?.(rowIndex)}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  const editable = col.editable;
                  const isValid = validationResults?.[rowIndex]?.[`${col.key}Correct`];

                  let cellStyle = {};
                  if (
                    useColor &&
                    ["xi", "fi", "ci", "ciLabel", "x"].includes(col.key)
                  ) {
                    let key = row.ci || row.ciLabel || row.x || (row.xi !== undefined
                      ? (String(row.xi).includes(".") ? Number(row.xi).toFixed(1) : String(row.xi))
                      : "");
                    if (colorMap[key]) {
                      cellStyle.backgroundColor = colorMap[key];
                    }
                  }

                  const cellClass = `
                    border px-2 py-1 text-sm text-right transition-colors duration-300
                    ${isValid === true ? "bg-green-100" : ""}
                    ${isValid === false ? "bg-red-100" : ""}
                  `;

                  // 🔍 Debugging
                  console.log(`Cell (${rowIndex}, ${col.key}):`, {
                    value,
                    isValid,
                    class: isValid === true ? "green" : isValid === false ? "red" : "none"
                  });

                  return (
                    <td key={col.key} className={cellClass} style={cellStyle}>
                      {editable ? (
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            handleChange(
                              rowIndex,
                              col.key,
                              e.target.value === "" ? "" : parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-1 py-0.5 border rounded text-right focus:outline-none focus:ring focus:ring-blue-200"
                        />
                      ) : (
                        <div className="flex justify-between items-center">
                          <span>
                            {(() => {
                              if (typeof value === "object") {
                                if (Array.isArray(value)) {
                                  return value.length === 2
                                    ? `${value[0]}–${value[1]}`
                                    : value[0];
                                } else if (value?.lower != null && value?.upper != null) {
                                  return `${value.lower}–${value.upper}`;
                                } else {
                                  return JSON.stringify(value);
                                }
                              } else {
                                return value;
                              }
                            })()}
                          </span>
                          {isValidated &&
                            (isValid === true ? (
                              <span className="text-green-600 font-bold ml-1">✔</span>
                            ) : isValid === false ? (
                              <span className="text-red-600 font-bold ml-1">✘</span>
                            ) : null)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>

        {rows.length > 0 && (
          <tfoot>
            <tr className="font-semibold bg-gray-100">
              {columns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className="border px-2 py-1 text-sm text-center"
                >
                  {colIndex === 0 ? "Total" : computedTotalRow[col.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
