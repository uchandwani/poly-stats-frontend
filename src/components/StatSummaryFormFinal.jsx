import React from "react";

/**
 * Displays only final summary statistics:
 * - Mean
 * - Variance
 * - Standard Deviation
 * - Coefficient of Variation (CV%)
 * 
 * Works only for "StandardDeviation" mode.
 */
export default function StatSummaryFormFinal({
  expectedStats = {},
  statMeasure = "StandardDeviation"
}) {
  if (!expectedStats || Object.keys(expectedStats).length === 0) return null;

  return (
    <table className="table-auto border text-sm text-left shadow bg-white mt-4">
      <thead>
        <tr className="bg-blue-100">
          <th className="px-4 py-2">Statistic</th>
          <th className="px-4 py-2">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 font-medium">Mean (𝑥̄)</td>
          <td className="px-4 py-2 text-center">{expectedStats.mean ?? "-"}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 font-medium">Variance (σ²)</td>
          <td className="px-4 py-2 text-center">{expectedStats.variance ?? "-"}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 font-medium">Standard Deviation (σ)</td>
          <td className="px-4 py-2 text-center">{expectedStats.sd ?? "-"}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 font-medium">Coefficient of Variation (CV%)</td>
          <td className="px-4 py-2 text-center">{expectedStats.cv ?? "-"}</td>
        </tr>
      </tbody>
    </table>
  );
}
