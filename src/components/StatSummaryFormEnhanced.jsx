import React, { useState, useEffect } from "react";

/**
 * Stat Summary Form: Editable + Validation with background color feedback
 */
export default function StatSummaryFormEnhanced({
  expectedStats = {},
  summaryKeys = [],
  statMeasure = "MeanDeviation",
  studentSummary = {},
  setStudentSummary = () => {},
  onValidateSummary = () => {}, // 🔥 new callback
}) {
  const [validationResults, setValidationResults] = useState({});

  // 🧪 Log initial props
  useEffect(() => {
    console.log("🧮 [StatSummaryForm] summaryKeys:", summaryKeys);
    console.log("📦 [StatSummaryForm] expectedStats:", expectedStats);
    console.log("📝 [StatSummaryForm] studentSummary:", studentSummary);
  }, [summaryKeys, expectedStats, studentSummary]);

  if (!summaryKeys?.length) {
    console.warn("🚫 No summaryKeys provided to StatSummaryForm.");
    return null;
  }

  const handleChange = (key, value) => {
    setStudentSummary((prev) => ({ ...prev, [key]: value }));
    setValidationResults((prev) => ({ ...prev, [key]: undefined }));
  };

  const round = (val, places = 2) =>
    Number(Math.round(val * 10 ** places) / 10 ** places);

  const validateSummary = () => {
    const results = {};
    let allValid = true;

    summaryKeys.forEach((key) => {
      const expected = Number(expectedStats[key]);
      const entered = Number(studentSummary[key]);
      const isValid =
        !isNaN(expected) && !isNaN(entered) && Math.abs(expected - entered) < 0.1;
      results[key] = isValid;
      if (!isValid) allValid = false;

      // 🧪 Per-stat log
      console.log(
        `🔍 Validating [${key}] → Student: ${entered} | Expected: ${expected} | ✅ ${isValid}`
      );
    });

    setValidationResults(results);

    // ✅ Fire validation callback only for stats we care about
    if (summaryKeys?.length && typeof onValidateSummary === "function") {
      const summarySubset = {};
      summaryKeys.forEach((key) => {
        const val = expectedStats?.[key];
        if (typeof val !== "undefined") {
          summarySubset[key] = Number(val);
        }
      });
      console.log("📤 Firing onValidateSummary callback with:", summarySubset);
      onValidateSummary(summarySubset);
    }
  };

  const getBgColor = (key) => {
    const status = validationResults[key];
    if (status === true) return "bg-green-100";
    if (status === false) return "bg-red-100";
    return "";
  };

  // 🏷️ Friendly label mapping
  const labelMap = {
    range: "Range",
    coefficientOfRange: "Co-efficient of Range",
    mean: "Mean",
    mode: "Mode",
    median: "Median",
    standarddeviation: "Standard Deviation",
    standardDeviation: "Standard Deviation",
    meandeviation: "Mean Deviation",
    meanDeviation: "Mean Deviation",
    variance: "Variance",
    cv: "Co-efficient of Variance",
  };

  return (
    <div className="mt-6">
      <table className="table-auto border text-sm text-left shadow bg-white w-full">
        <thead>
          <tr className="bg-blue-100">
            <th className="px-4 py-2">Statistic</th>
            <th className="px-4 py-2">Your Answer</th>
          </tr>
        </thead>
        <tbody>
            {summaryKeys.map((key) => {
              const value = studentSummary?.[key] ?? "";
              const expected = expectedStats?.[key];

              return (
                <tr key={key}>
                  <td className="px-4 py-2 font-medium">{labelMap[key] || key}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={value != null ? value : ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={expected != null ? String(expected) : ""}
                      className={`w-24 border px-2 py-1 rounded text-sm text-right ${getBgColor(
                        key
                      )}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

      </table>

      <div className="mt-4 text-right">
        <button
          className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={validateSummary}
        >
          ✅ Validate Summary
        </button>
      </div>
    </div>
  );
}
