import React from "react";

/**
 * Editable summary stats table with validation coloring.
 * Supports:
 *  - MeanDeviation: mean, meanDeviation
 *  - StandardDeviation: mean, variance, sd, cv
 */
export default function StatSummaryFormEditable({
  values = {},
  setValues,
  validation = {},
  onValidate,
  statMeasure = "StandardDeviation", // <-- Add this prop
}) {
  const fieldConfigs = {
    MeanDeviation: [
      { key: "mean", label: "Mean (𝑥̄)" },
      { key: "meanDeviation", label: "Mean Deviation (MD)" },
    ],
    StandardDeviation: [
      { key: "mean", label: "Mean (𝑥̄)" },
      { key: "variance", label: "Variance (σ²)" },
      { key: "sd", label: "Standard Deviation (σ)" },
      { key: "cv", label: "Coefficient of Variation (CV%)" },
    ],
  };

  const fields = fieldConfigs[statMeasure] || fieldConfigs.StandardDeviation;

  const getBg = (key) =>
    validation?.[`${key}Correct`] === true
      ? "bg-green-100"
      : validation?.[`${key}Correct`] === false
      ? "bg-red-100"
      : "bg-white";

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-2">
      <table className="table-auto w-full border border-gray-300 text-sm">
        <thead className="bg-blue-50">
          <tr>
            {fields.map(({ key, label }) => (
              <th key={key} className="px-3 py-2 text-center font-medium border">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {fields.map(({ key }) => (
              <td key={key} className={`px-2 py-1 text-center border ${getBg(key)}`}>
                <input
                  type="number"
                  step="0.01"
                  value={values[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-[6ch] border border-gray-300 rounded px-1 py-0.5 text-center bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="text-center">
        <button
          onClick={onValidate}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          ✅ Validate Summary
        </button>
      </div>
    </div>
  );
}

