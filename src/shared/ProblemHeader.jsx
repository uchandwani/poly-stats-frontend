import React, { useMemo } from "react";
import { generateColorMap } from "../services/colorMapUtils";

export default function ProblemHeader({ config, useColor = true }) {
  if (!config) {
    console.warn("🚫 ProblemHeader: config is undefined.");
    return null;
  }

  console.log("📦 Full config received in ProblemHeader:", config);

  const {
    title = "Untitled Problem",
    description = "",
    classIntervals,
    values,
    frequencies,
    freqs,
    meta = {}
  } = config;

  const {
    intervals: metaIntervals,
    freqs: metaFreqs
  } = meta;

  const displayList = classIntervals ?? metaIntervals ?? config.intervals ?? values ?? config.dataPoints ?? [];

  const freqsFinal = frequencies ?? metaFreqs ?? config.freqs ?? [];

  const hasData = displayList.length && freqsFinal.length;

  if (!hasData) {
    console.warn("⚠️ No displayable data (intervals/values + freqs) found in ProblemHeader.");
    return null;
  }

  const isGrouped = useMemo(() => {
    return displayList.length > 0 && Array.isArray(displayList[0]) && displayList[0].length === 2;
  }, [displayList]);

  const intervalLabels = useMemo(() => {
    return displayList.map((item) => {
      if (typeof item === "string" || typeof item === "number") return item;
      if (Array.isArray(item)) {
        if (item.length === 2) return `${item[0]}–${item[1]}`;
        if (item.length === 1) return `${item[0]}`;
      }
      if (item?.lower != null && item?.upper != null) return `${item.lower}–${item.upper}`;
      return "--";
    });
  }, [displayList]);

  const colorMap = useMemo(() => generateColorMap(intervalLabels), [intervalLabels]);

  return (
    <div className="mb-6 w-full overflow-x-auto">
     
      <table className="text-sm border border-collapse border-gray-300 w-full text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 font-semibold">
              {isGrouped ? "C.I →" : "x →"}
            </th>
            {intervalLabels.map((label, i) => (
              <th
                key={`interval-${i}`}
                className="border px-3 py-2"
                style={{ backgroundColor: useColor ? colorMap[label] : undefined }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-3 py-2 font-semibold">
              f<sub>i</sub>
            </td>
            {freqsFinal.map((f, i) => (
              <td
                key={`freq-${i}`}
                className="border px-3 py-2"
                style={{ backgroundColor: useColor ? colorMap[intervalLabels[i]] : undefined }}
              >
                {f}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
