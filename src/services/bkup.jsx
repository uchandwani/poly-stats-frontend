import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { API_BASE } from "../services/apiBase";
import { fetchSubmission } from "../services/api";
import { generateClassData } from "../services/dataGenerators";
import { statEngines } from "../services/statMeasureEngines";
import { validateGroupTable } from "../services/StatValidationPlus";
import { calculateGroupedMean } from "../services/StatCalcMean";
import { calculateGroupedMode } from "../services/StatCalcMode";

import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";
import {
  TopBarDescription,
  InstructionSidebar,
  ProblemHeader,
  StudentAnalysisBox
} from "../shared";

export default function MeanVsMode() {
  const { code } = useParams();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const studentId = user?.username || "demo-student";
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [studentNote, setStudentNote] = useState("");
  const [studentSummary, setStudentSummary] = useState({});
  const [expectedSummary, setExpectedSummary] = useState({});
  const [totalRow, setTotalRow] = useState({});
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadExerciseAndSubmission() {
      try {
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const configData = data.configData ?? {};
        const generate = data.generateInputs ?? {};
        let xi = [], fi = [];

        if (configData.classIntervals?.length && configData.frequencies?.length) {
          xi = configData.classIntervals;
          fi = configData.frequencies;
        } else {
          const generated = generateClassData(generate, "mean");
          xi = generated.xi;
          fi = generated.fi;
        }

        const initialRows = xi.map((ci, i) => ({
          ci,
          fi: fi[i],
        }));

        setConfig({
          statMeasure: "MeanVsMode",
          topBar: data.description,
          meta: {
            title: data.title,
            description: data.questionText,
            intervals: xi,
            freqs: fi
          },
          table: {
            columns: [
              { key: "ci", label: "Class Interval", editable: false },
              { key: "fi", label: "Frequency", editable: false }
            ]
          },
          summaryTitle: data.summaryTitle || "Compare Mean & Mode",
          summaryKeys: ["mean", "mode"],
          analysisPrompt: data.analysisPrompt,
          instructions: data.instructions,
        });

        const saved = await fetchSubmission(code, studentId);
        if (saved?.tableInputs?.length) {
          setRows(saved.tableInputs);
          setStudentNote(saved.analysisText || "");
          setStudentSummary(saved.summaryStats || {});
        } else {
          setRows(initialRows);
        }

        const mean = calculateGroupedMean(initialRows);
        const mode = calculateGroupedMode(initialRows);
        setExpectedSummary({ ...mean, ...mode });

        const expected = initialRows;
        const columns = [
          { key: "ci", editable: false },
          { key: "fi", editable: false }
        ];
        const validation = validateGroupTable({
          inputs: initialRows,
          expected,
          columns,
          statMeasure: "GroupedMean" // Reuse mean validation rules
        });
        setValidationResults(validation);
      } catch (err) {
        console.error("❌ Failed to load MeanVsMode:", err);
        setLoadError("Failed to load exercise.");
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

  const handleSummaryValidation = (summary) => {
    setStudentSummary(summary);
  };

  const handleSubmit = async (isFinal) => {
    try {
      const res = await fetch(`${baseURL}/submissions/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseCode: code,
          studentId,
          analysisText: studentNote,
          tableInputs: rows,
          summaryStats: studentSummary,
          isFinal,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
    } catch (err) {
      console.error("❌ Save failed:", err);
      alert("Error saving. See console.");
    }
  };

  if (loadError) return <p className="p-4 text-red-600">{loadError}</p>;
  if (!config) return <p className="p-4">⏳ Loading…</p>;

  return (
    <div className="p-4 space-y-6">
      <TopBarDescription text={config.topBar} />
      <div className="grid grid-cols-4 gap-4 items-start">
        <div className="col-span-1 shadow-md border rounded p-4">
          <InstructionSidebar instructions={config.instructions} />
        </div>
        <div className="col-span-3 shadow-md border rounded p-4 space-y-6">
          <ProblemHeader config={config.meta} />
          <ValidatedInputTable
            tableConfig={config.table}
            rows={rows}
            setRows={setRows}
            validationResults={validationResults}
            totalRow={totalRow}
          />
          <StatSummaryFormEnhanced
            expectedStats={expectedSummary}
            statMeasure="MeanVsMode"
            summaryKeys={["mean", "mode"]}
            studentSummary={studentSummary}
            onValidateSummary={handleSummaryValidation}
            setStudentSummary={setStudentSummary}
          />
          <StudentAnalysisBox
            studentNote={studentNote}
            setStudentNote={setStudentNote}
            prompt={config.analysisPrompt}
          />
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-blue-300 text-white rounded"
            >
              💾 Save Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              ✅ Submit Final
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
