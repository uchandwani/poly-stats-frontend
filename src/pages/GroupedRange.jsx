// pages/GroupedRange.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { API_BASE } from "../services/apiBase";
import { statEngines } from "../services/statMeasureEngines";
import { generateClassData } from "../services/dataGenerators";
import { calculateSummaryStats } from "../services/statSummaryEnginePlus";

import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";

import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox,
} from "../shared";

export default function GroupedRange() {
  const { code } = useParams();
  const [config, setConfig] = useState({});
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState({});
  const [studentSummary, setStudentSummary] = useState({});

  useEffect(() => {
    async function fetchConfig() {
      try {
        console.log("📦 Fetching config for:", code);
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        const data = await res.json();

        console.log("✅ Loaded data:", data);

        const statMeasure = data.statMeasure;
        const engine = statEngines[statMeasure];
        if (!engine) {
          console.error("❌ statMeasure not recognized:", statMeasure);
          return;
        }

        const xi = data.configData?.classIntervals ?? generateClassData(data.dataGeneration).xi;
        const fi = data.configData?.frequencies ?? generateClassData(data.dataGeneration).fi;

        if (!Array.isArray(xi) || !Array.isArray(fi) || xi.length !== fi.length) {
          console.error("❌ Mismatch in class intervals and frequencies", { xi, fi });
          return;
        }

        const expectedRows = engine.generateInitialRows?.(xi, fi) ?? [];
        const withLabels = expectedRows.map((row, i) => ({
          ...row,
          ciLabel: `${xi[i][0]}–${xi[i][1]}`,
        }));

        setConfig(data);
        setRows(withLabels);
        setColumns(engine.tableConfig?.columns ?? []);

        const summaryStats = calculateSummaryStats(withLabels, statMeasure);
        console.log("📊 Summary stats:", summaryStats);
        setSummary(summaryStats);

      } catch (err) {
        console.error("❌ Failed to load exercise:", err);
      }
    }

    if (code) fetchConfig();
  }, [code]);

  return (
    <div className="p-4 space-y-6">
      {/* 🟦 Top Description */}
      <TopBarDescription text={config.topBar} />

      <div className="grid grid-cols-4 gap-4 items-start">
        {/* 🟧 Left Instructions */}
        <div className="col-span-1 shadow-md border rounded p-4">
          <InstructionSidebar instructions={config.instructions ?? []} />
        </div>

        {/* 🟩 Main Panel */}
        <div className="col-span-3 shadow-md border rounded p-4 space-y-6">
          {/* 🟪 Problem Header */}
          <h3 className="text-lg font-semibold text-center text-blue-700 mb-2">
            {config?.meta?.title ?? "📌 Problem"}
          </h3>
          <ProblemHeader config={config.meta ?? {}} />

          {/* 🟨 Input Table */}
          <ValidatedInputTable data={rows} setData={setRows} columns={columns} />

          {/* 🟫 Summary Section */}
          <StatSummaryFormEnhanced
            expectedSummary={summary}
            summaryKeys={statEngines[config.statMeasure]?.summaryKeys ?? []}
            studentSummary={studentSummary}
            setStudentSummary={setStudentSummary}
          />

          {/* 🟦 Analysis */}
          <StudentAnalysisBox code={code} />
        </div>
      </div>
    </div>
  );
}
