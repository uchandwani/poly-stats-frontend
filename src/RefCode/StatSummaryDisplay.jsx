import React, { useEffect, useState } from "react";
import { API_BASE } from "../services/apiBase";
import { statEngines } from "../services/statMeasureEngines";
import { generateClassData } from "../services/dataGenerators";
import { calculateSummaryStats } from "../services/statSummaryEnginePlus";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";

/**
 * 📊 Displays pre-computed summary stats (mean, median, SD, etc.)
 * Can support raw or configData from DB.
 */
export default function StatSummaryDisplay({ code }) {
  const [summary, setSummary] = useState({});
  const [summaryKeys, setSummaryKeys] = useState([]);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        const data = await res.json();

        const engine = statEngines[data.statMeasure];
        const generated = generateClassData(data.dataGeneration);

        const xi = data.configData?.classIntervals ?? generated.xi;
        const fi = data.configData?.frequencies ?? generated.fi;

        const rows = engine.generateExpectedRows(xi, fi);
        const result = calculateSummaryStats(rows, data.statMeasure);

        setSummary(result);
        setSummaryKeys(engine.summaryKeys);
      } catch (err) {
        console.error("❌ Failed to load summary:", err);
      }
    }

    if (code) fetchSummary();
  }, [code]);

  return (
    <StatSummaryFormEnhanced
      expectedSummary={summary}
      summaryKeys={summaryKeys}
      studentSummary={{}}
      setStudentSummary={() => {}}
    />
  );
}
