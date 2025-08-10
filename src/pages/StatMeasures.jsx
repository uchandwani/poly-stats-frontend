import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { API_BASE } from "../services/apiBase";
import { fetchSubmission } from "../services/api";
import { statEngines } from "../services/StatEngine";
import { generateSingleData, generateClassData } from "../services/dataGenerators";
import { validateStatTable } from "../services/StatValidationPlus";
import { calculateSummaryStats } from "../services/statSummaryEnginePlus";
import { buildFrequencyData } from "../services/frequencyData";
import { generateColorMap } from "../services/colorMapUtils";

import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";
import PlotlyHistogram from "../components/PlotlyHistogram";
import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox
} from "../shared";

export default function StatMeasures() {
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
  const [showStatsLines, setShowStatsLines] = useState(false);
  const [validatedStats, setValidatedStats] = useState({ mean: null, standarddeviation: null });

  const engine = useMemo(() => statEngines[config?.statMeasure], [config?.statMeasure]);

  const expectedRows = useMemo(() => {
    if (!config || !engine) return [];
    return engine.generateExpectedRows(config.intervals, config.frequencies);
  }, [config, engine]);

  const expectedSummary = useMemo(() => {
    if (!expectedRows.length || !engine?.summaryStats) return {};
    return engine.summaryStats(expectedRows);
  }, [expectedRows, engine]);

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
       
               let intervals = data.classIntervals ?? data.intervals ?? [];
               let frequencies = data.frequencies ?? data.freqs ?? [];
       
               console.log("🔍 Pre-check intervals & freqs:", intervals, frequencies);


               let generated;  // 👈 declared in outer scope

                       
               if (!intervals.length || !frequencies.length) {
                 console.log("⚙️ Generating intervals and frequencies since none found in DB.");
                 const generate = data.generateInputs ?? data.dataGeneration ?? {};
                 const dataType = data.dataType;
                 console.log("The parameter values are", generate, measure, dataType);
                 if (dataType === "class") {
                  generated = generateClassData(generate);

                  intervals = generated.map(row => row.class);     // Extract class intervals
                  frequencies = generated.map(row => row.fi);      // Extract frequencies

                } else {
                  generated = generateSingleData(generate, measure);
                  intervals = generated.intervals;
                  frequencies = generated.frequencies;
                }
                
                 
                 console.log ("The value of intervals and frequencies are", intervals, frequencies);
               }
               
        setConfig({
          ...data,
          statMeasure: measure,
          intervals,
          frequencies,
          
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
          setStudentNote(saved.analysisText || "");
          setStudentRows(saved.tableInputs);
          setStudentSummary(saved.summaryStats || {});
          setValidationResults([]);
        } else {
          const blank = engine.generateInitialRows(intervals, frequencies);
          setStudentRows(blank);
        }

      } catch (err) {
        console.error("❌ Failed to load exercise:", err);
        setLoadError("⚠️ Failed to load exercise. Please try again later.");
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

  const handleValidation = () => {
    const expected = engine.generateExpectedRows(config.intervals, config.frequencies);
    const results = validateStatTable({
      inputs: studentRows,
      expected,
      columns: config.table.columns,
      statMeasure: config.statMeasure,
    });
    setValidationResults(results);
  };

  const handleSummaryValidation = (stats) => {
    setValidatedStats(stats);
    setShowStatsLines(true);
  };

  const handleSubmit = async (isFinal) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${baseURL}/submissions/save`, {
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
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("❌ Error saving. See console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return <p className="p-4 text-red-600">{loadError}</p>;
  if (!config || !engine) return <p className="p-4">⏳ Loading…</p>;

      console.log("🔍 config.summaryKeys:", config.summaryKeys);
    console.log("✅ config.summaryKeys?.length:", !!config.summaryKeys?.length);
    console.log("📦 expectedSummary:", expectedSummary);
    console.log("📏 Object.keys(expectedSummary).length:", Object.keys(expectedSummary).length);
    console.log(
      "🧠 Final Condition:",
      !!config.summaryKeys?.length && Object.keys(expectedSummary).length > 0
    );

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {/* Left 3/4 */}
        <div className="col-span-3 space-y-4">
          {config.topBar && <TopBarDescription text={config.topBar} />}


          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 shadow-md border rounded p-4">
              <InstructionSidebar instructions={config.instructions} />
            </div>

            <div className="col-span-2 space-y-4">
              <div className="shadow-md border rounded p-4">
                <h3 className="text-lg font-semibold text-center text-blue-700 mb-2">
                  {config.headerTitle}
                </h3>
                <ProblemHeader config={config} useColor />

              </div>

              <div className="shadow-md border rounded p-4 space-y-2 flex flex-col">
                <h2 className="font-bold text-lg">{config.dataTableLabel}</h2>

                <ValidatedInputTable
                  tableConfig={config.table}
                  rows={studentRows}
                  setRows={setStudentRows}
                  validationResults={validationResults}
                  totalRow={totalRow}
                  useColor={true}
                  colorMap={colorMap}
                />

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={handleValidation}
                    className="px-4 py-2 bg-blue-400 text-white rounded"
                  >
                    ✅ Validate Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/4 */}
        <div className="col-span-1 flex flex-col justify-between space-y-4">
          <div className="shadow-md border rounded p-4">
            <PlotlyHistogram
              data={frequencyData}
              showStatsLines={showStatsLines}
              mean={validatedStats.mean}
              stdDev={validatedStats.standarddeviation}
              colorMap={colorMap}
            />
          </div>

          <div className="shadow-md border rounded p-4">
            {!!config.summaryKeys?.length && Object.keys(expectedSummary).length > 0 && (
              <>
                <h2 className="font-bold text-lg mb-2">{config.summaryTitle}</h2>
                <StatSummaryFormEnhanced
                  expectedStats={expectedSummary}
                  statMeasure={config.statMeasure}
                  summaryKeys={config.summaryKeys}
                  studentSummary={studentSummary}
                  onValidateSummary={handleSummaryValidation}
                  setStudentSummary={setStudentSummary}
                />
              </>
            )}
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
          <button
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-blue-300 text-white rounded"
            disabled={isSubmitting}
          >
            💾 Save Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-blue-400 text-white rounded"
            disabled={isSubmitting}
          >
            ✅ Submit Final
          </button>
        </div>
      </div>
    </div>
  );
}
