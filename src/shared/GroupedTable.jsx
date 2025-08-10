import React from "react";

export default function GroupedTable({
  tableConfig,
  header,
  rows = [],
  setRows,
  validationResults = [],
  onValidate,
  totalRow,                 // ← add this
}) {
  const { columns } = tableConfig || {};

  if (!columns?.length) {
    return <div className="text-red-600">⚠️ Missing or invalid column config</div>;
  }

  if (!rows?.length) {
    return <div className="text-gray-500 italic">Loading data...</div>;
  }

  const editableKeys = new Set(["fi", "fixi", "absDiff", "fiAbsDiff"]);
  const isEditable   = (key) => editableKeys.has(key);
  const getStatus    = (r, k) => validationResults[r]?.[`${k}Correct`];
  const handleChange = (r, k, v) => {
    const updated = [...rows];
    updated[r][k] = v;
    setRows(updated);
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border border-gray-300 text-sm">
        <thead className="bg-blue-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                className="border px-2 py-1 text-left font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50">
              {columns.map(col => {
                const status = getStatus(rowIdx, col.key);
                const bg = status === true
                  ? "bg-green-100"
                  : status === false
                  ? "bg-red-100"
                  : "";

                return (
                  <td
                    key={col.key}
                    className={`border px-2 py-1 text-center ${bg}`}
                  >
                    {isEditable(col.key) ? (
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none"
                        value={row[col.key] ?? ""}
                        onChange={e =>
                          handleChange(rowIdx, col.key, e.target.value)
                        }
                      />
                    ) : (
                      row[col.key]
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {totalRow && (
          <tfoot>
            <tr className="font-semibold bg-gray-100">
              {columns.map(col => (
                <td
                  key={col.key}
                  className="border px-2 py-1 text-center"
                >
                  {totalRow[col.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>

      <div className="text-right mt-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
          onClick={onValidate}
        >
          ✅ Validate
        </button>
      </div>
    </div>
  );
}
