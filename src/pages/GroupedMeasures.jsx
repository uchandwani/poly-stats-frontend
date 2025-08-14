import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { API_BASE } from "../services/apiBase";
import { fetchSubmission } from "../services/api";
import { statEngines } from "../services/StatEngine.js";
import { generateClassData } from "../services/dataGenerators";
import { generateColorMap } from "../services/colorMapUtils";
import { validateGroupedTable } from "../services/StatValidationPlus";
import { calculateSummaryStats } from "../services/statSummaryEnginePlus";
import { buildFrequencyData } from "../services/frequencyData";

import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";
import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox
} from "../shared";

function formatIntervals(intervals) {
  return intervals.map(([start, end]) => `${start}–${end}`);
}

export default function GroupedMeasures() {
  const { code } = useParams();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const studentId = user?.username || "demo-student";
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [config, setConfig] = useState(null);
  const [studentRows, setStudentRows] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [studentNote, setStudentNote] = useState("");
  const [studentSummary, setStudentSummary] = useState({});
  const [totalRow, setTotalRow] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModalIndex, setSelectedModalIndex] = useState(null);
  const [selectedMedianIndex, setSelectedMedianIndex] = useState(null);


  const engine = useMemo(() => statEngines[config?.statMeasure], [config?.statMeasure]);

  const expectedRows = useMemo(() => {
    if (!config || !engine) return [];
    const intervals = config.intervals || [];
    const freqs = config.freqs || [];
    return engine.generateExpectedRows(intervals, freqs);
  }, [config, engine]);

  const expectedSummary = useMemo(() => {
    if (!expectedRows.length || !engine?.summaryStats) return {};
    return engine.summaryStats(expectedRows);
  }, [expectedRows, engine]);
  console.log("✅ expectedSummary =", expectedSummary);

  const frequencyData = useMemo(() => {
      return buildFrequencyData(config?.intervals ?? [], config?.frequencies ?? []);
    }, [config]);

  const colorMap = useMemo(() => {
      return generateColorMap(frequencyData.map(d => d.range));
    }, [frequencyData]);

  useEffect(() => {
    if (engine && expectedRows.length) {
      const totals = engine.generateTotalRow(expectedRows, config?.table?.columns ?? []);
      setTotalRow(totals);
    }
  }, [expectedRows, config?.table?.columns, engine]);

  useEffect(() => {
    async function loadExerciseAndSubmission() {
      try {
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("📦 Loaded exercise:", data);

        const measure = data.statMeasure;
        const engine = statEngines[measure];
        if (!engine) throw new Error(`Unknown stat engine: ${measure}`);

        let intervals = data.intervals;
        let freqs = data.frequencies;

        console.log("The vaule of intervals and freq are",  freqs);

        if (!intervals?.length || !freqs?.length) {
            const generate = data.dataGeneration ?? {};
            const generated = generateClassData(generate, measure);
            intervals = generated.intervals;
            freqs = generated.frequencies;
          }


        setConfig({
          statMeasure: measure,
          intervals,
          freqs,
          frequencies : freqs,
          topBar: data.problemDescription ?? data.description ?? "",
          table: engine.tableConfig,
          summaryTitle: data.summaryTitle ?? "Summary Statistics",
          headerTitle: data.headerTitle ?? "Problem Data Table",
          chartTitle: data.chartTitle ?? "Distribution Chart",
          dataTableLabel: data.dataTableLabel ?? "Data Table",
          summaryKeys: engine.summaryKeys,
          analysisPrompt: data.analysisPrompt,
          instructions: data.instructions
        });

        const saved = await fetchSubmission(code, studentId);

        if (saved?.tableInputs?.length) {
          setStudentRows(saved.tableInputs);
          setStudentNote(saved.analysisText || "");
          setStudentSummary(saved.summaryStats || {});
          setValidationResults([]);
        } else {
          const blank = engine.generateInitialRows(intervals, freqs);
          setStudentRows(blank);
        }
      } catch (err) {
        console.error("❌ Failed to load:", err);
        setLoadError("Failed to load exercise.");
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

 // --- replace handleValidation entirely ---
const handleValidation = () => {
  if (!engine?.generateExpectedRows || !config) return;

  // Build expected from the same sources studentRows used
  const expected = engine.generateExpectedRows(config.intervals, config.freqs);

  // Which columns should be validated? (comes from tableConfig)
  const keysToValidate = config?.table?.expectedColumns ?? [];

  // Clone rows so we can set row-level flags like isModal/isMedian
  const updatedRows = studentRows.map((row) => ({ ...row }));

  // Per-row validation results shaped for ValidatedInputTable
  const results = updatedRows.map((row, rowIndex) => {
    const expectedRow = expected[rowIndex] || {};
    const resultForRow = {};

    keysToValidate.forEach((key) => {
      const expectedVal = parseFloat(expectedRow[key]);
      const actualVal = parseFloat(row[key]);
      const isValid =
        Number.isFinite(expectedVal) &&
        Number.isFinite(actualVal) &&
        Math.abs(expectedVal - actualVal) < 0.01; // tolerance

      // IMPORTANT: emit `${key}Correct` so ValidatedInputTable colors cells
      resultForRow[`${key}Correct`] = isValid;
    });

    // Mode: mark modal class on both row + result object
    if (config.statMeasure === "GroupedMode") {
      const isModal = !!expectedRow.isModal;
      updatedRows[rowIndex].isModal = isModal;
      resultForRow.isModal = isModal;
    }

    return resultForRow;
  });

  // Median: compute and flag median row (row-level, not per-cell)
  if (config.statMeasure === "GroupedMedian") {
    const N = updatedRows.reduce((sum, r) => sum + Number(r.fi || 0), 0);
    let cumulative = 0;
    const medianIndex = updatedRows.findIndex((row) => {
      cumulative += Number(row.fi || 0);
      return cumulative >= N / 2;
    });
    if (medianIndex !== -1) {
      updatedRows[medianIndex].isMedian = true;
    }
  }

  setStudentRows(updatedRows);
  setValidationResults(results); // ✅ keys match the table’s `${col}Correct` lookup
};



  const handleSummaryValidation = (stats) => {
    setStudentSummary(stats);
  };

  const handleSubmit = async (isFinal) => {
  setIsSubmitting(true);

  // helper: safely parse JSON when the body may be empty or not JSON
  const parseJsonSafe = async (res) => {
    const text = await res.text();
    if (!text) return null; // e.g., 204 No Content
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text }; // non-JSON response
    }
  };

  try {
    const res = await fetch(`${API_BASE}/submissions/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseCode: code,
        studentId,
        analysisText: studentNote,
        tableInputs: studentRows,
        summaryStats: studentSummary,
        isFinal
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${errText ? ` – ${errText}` : ""}`);
    }

    const result = await parseJsonSafe(res);
    // If your backend responds with { ok: true }, you can check it here:
    // if (result && result.ok === false) throw new Error(result.error || "Unknown save error");

    alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
  } catch (err) {
    console.error("❌ Save failed:", err);
    alert(`❌ Save failed: ${err.message}`);
  } finally {
    setIsSubmitting(false);
  }
};


  if (loadError) return <p className="p-4 text-red-600">{loadError}</p>;
  if (!config || !engine) return <p className="p-4">⏳ Loading…</p>;

  const isMode = config.statMeasure === "GroupedMode";
  const isMedian = config.statMeasure === "GroupedMedian";
  console.log("🟢 isMedian flags in studentRows:", studentRows.map(r => r.isMedian));


  return (
    <div className="p-4 space-y-6">
      <TopBarDescription text={config.topBar} />
      <div className="grid grid-cols-4 gap-4 items-start">
        <div className="col-span-1 shadow-md border rounded p-4">
          <InstructionSidebar instructions={config.instructions} />
        </div>
        <div className="col-span-3 shadow-md border rounded p-4 space-y-6">
         <ProblemHeader config={config} />


          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <ValidatedInputTable
                tableConfig={config.table}
                rows={studentRows}
                setRows={setStudentRows}
                validationResults={validationResults}
                totalRow={totalRow}
                useColor={true}
                colorMap={colorMap}
                statMeasure={config.statMeasure}
                onRowClick={
                  isMode
                    ? setSelectedModalIndex
                    : isMedian
                    ? setSelectedMedianIndex
                    : undefined
                }
                selectedRowIndex={
                  isMode
                    ? selectedModalIndex
                    : isMedian
                    ? selectedMedianIndex
                    : undefined
                }

              />
              {isMode && selectedModalIndex !== null && (
                <div className="text-sm text-green-700">
                  ✅ You selected <strong>{studentRows[selectedModalIndex].ciLabel}</strong> as the modal class.
                </div>
              )}

              {isMedian && selectedMedianIndex !== null && (
                  <div className="text-sm text-green-700">
                    ✅ You selected <strong>{studentRows[selectedMedianIndex].ciLabel}</strong> as the median class.
                  </div>
                )}

              <div className="flex gap-4">
                <button onClick={handleValidation} className="px-4 py-2 bg-blue-500 text-white rounded">
                  ✅ Validate Table
                </button>
              </div>
            </div>
            <div className="w-full lg:w-1/3 shadow-md border rounded p-4 flex flex-col justify-between self-stretch">
              <div>
                <h2 className="font-bold text-lg mb-2">{config.summaryTitle}</h2>
                <StatSummaryFormEnhanced
                  expectedStats={expectedSummary}
                  statMeasure={config.statMeasure}
                  summaryKeys={config.summaryKeys}
                  studentSummary={studentSummary}
                  onValidateSummary={handleSummaryValidation}
                  setStudentSummary={setStudentSummary}
                />
              </div>
            </div>
          </div>
          <div className="shadow-md border rounded p-4">
            <StudentAnalysisBox
              studentNote={studentNote}
              setStudentNote={setStudentNote}
              prompt={config.analysisPrompt}
            />
            <div className="flex gap-4 mt-4">
              <button onClick={() => handleSubmit(false)} className="px-4 py-2 bg-blue-300 text-white rounded" disabled={isSubmitting}>
                📂 Save Draft
              </button>
              <button onClick={() => handleSubmit(true)} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isSubmitting}>
                ✅ Submit Final
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
