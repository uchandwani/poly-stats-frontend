import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox,
} from "../shared";
import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";
import { statEngines } from "../services/statMeasureEngines";
import { fetchSubmission } from "../services/api";
import { validateStatTable } from "../services/StatValidationPlus";
import { calculateSummaryStats } from "../services/statSummaryEnginePlus";

export default function StatMeasuresComparisonEnhanced() {
  const { code } = useParams();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const studentId = user?.username || "demo-student";
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [config, setConfig] = useState(null);
  const [rowsA, setRowsA] = useState([]);
  const [rowsB, setRowsB] = useState([]);
  const [summaryA, setSummaryA] = useState({});
  const [summaryB, setSummaryB] = useState({});
  const [note, setNote] = useState("");
  const [validationResultsA, setValidationResultsA] = useState([]);
  const [validationResultsB, setValidationResultsB] = useState([]);
  const [totalA, setTotalA] = useState({});
  const [totalB, setTotalB] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        const res = await fetch(`/api/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const measure = data.statMeasure;
        const engine = statEngines[measure];
        if (!engine) throw new Error(`Unknown stat engine: ${measure}`);

        const configData = data.configData ?? {};
        let datasetA = configData.datasetA ?? {};
        let datasetB = configData.datasetB ?? {};

        // Fallback logic for missing data
        const fallback = () => {
          const gen = data.generateInputs || {};
          const count = gen.count || 6;
          const min = gen.min || 10;
          const max = gen.max || 90;
          const intervalSize = gen.intervalSize || 10;
          const base = Math.floor(Math.random() * (max - min - intervalSize * count) + min);
          const intervals = Array.from({ length: count }, (_, i) => {
            const lower = base + i * intervalSize;
            const upper = lower + intervalSize;
            return `${lower}-${upper}`;
          });
          const freqs = Array.from({ length: count }, () => Math.floor(Math.random() * 5 + 1));
          return { classIntervals: intervals, frequencies: freqs };
        };

        if (!datasetA?.classIntervals?.length || !datasetA?.frequencies?.length) {
          datasetA = fallback();
        }
        if (!datasetB?.classIntervals?.length || !datasetB?.frequencies?.length) {
          datasetB = fallback();
        }

        const blankA = engine.generateInitialRows(datasetA.classIntervals, datasetA.frequencies);
        const blankB = engine.generateInitialRows(datasetB.classIntervals, datasetB.frequencies);

        const saved = await fetchSubmission(code, studentId);
        console.log("✅ Exercise loaded:", data);
        console.log("📦 Submission loaded:", saved);

        setConfig({
          statMeasure: measure,
          topBar: data.description,
          metaA: {
            title: "Dataset A",
            description: "Grouped frequency distribution",
            intervals: datasetA.classIntervals,
            freqs: datasetA.frequencies,
          },
          metaB: {
            title: "Dataset B",
            description: "Grouped frequency distribution",
            intervals: datasetB.classIntervals,
            freqs: datasetB.frequencies,
          },
          table: engine.tableConfig,
          summaryTitle: data.summaryTitle,
          summaryKeys: engine.summaryKeys,
          analysisPrompt: data.analysisPrompt,
          instructions: data.instructions,
        });

        setRowsA(saved?.tableInputsA || blankA);
        setRowsB(saved?.tableInputsB || blankB);
        setSummaryA(saved?.summaryStatsA || {});
        setSummaryB(saved?.summaryStatsB || {});
        setNote(saved?.analysisText || "");
      } catch (err) {
        console.error("❌ Load error:", err);
        setLoadError("⚠️ Failed to load exercise.");
      }
    }

    loadExercise();
  }, [code, studentId]);

  const engine = useMemo(() => statEngines[config?.statMeasure], [config?.statMeasure]);
  const columns = config?.table?.columns ?? [];

  const expectedRowsA = useMemo(() => {
    if (!engine || !config?.metaA?.intervals?.length) return [];
    return engine.generateExpectedRows(config.metaA.intervals, config.metaA.freqs);
  }, [engine, config?.metaA]);

  const expectedRowsB = useMemo(() => {
    if (!engine || !config?.metaB?.intervals?.length) return [];
    return engine.generateExpectedRows(config.metaB.intervals, config.metaB.freqs);
  }, [engine, config?.metaB]);

  useEffect(() => {
    if (engine && expectedRowsA.length) {
      setTotalA(engine.generateTotalRow(expectedRowsA, columns));
    }
  }, [engine, expectedRowsA, columns]);

  useEffect(() => {
    if (engine && expectedRowsB.length) {
      setTotalB(engine.generateTotalRow(expectedRowsB, columns));
    }
  }, [engine, expectedRowsB, columns]);

  const handleSubmit = async (isFinal) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${baseURL}/submissions/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseCode: code,
          studentId,
          analysisText: note,
          tableInputsA: rowsA,
          tableInputsB: rowsB,
          summaryStatsA: summaryA,
          summaryStatsB: summaryB,
          isFinal,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
    } catch (err) {
      console.error("❌ Error saving:", err);
      alert("❌ Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleValidation = () => {
      if (!engine?.generateExpectedRows) return;
      const expected = engine.generateExpectedRows(intervals, freqs);
      const results = validateStatTable({
        inputs: studentRows,
        expected,
        columns,
        statMeasure: config.statMeasure,
      });
      setValidationResults(results);
    };

  if (loadError) return <p className="p-4 text-red-600">{loadError}</p>;
  if (!config) return <p className="p-4">⏳ Loading…</p>;

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto">
      <TopBarDescription text={config.topBar} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProblemHeader config={config.metaA} />
        <ProblemHeader config={config.metaB} />
      </div>

      <InstructionSidebar instructions={config.instructions} />

      <div className="grid md:grid-cols-2 gap-6 w-full">
        <ValidatedInputTable
          tableConfig={config.table}
          rows={rowsA}
          setRows={setRowsA}
          validationResults={validationResultsA}
          totalRow={totalA}
          useColor={true}
        />


        <ValidatedInputTable
          tableConfig={config.table}
          rows={rowsB}
          setRows={setRowsB}
          validationResults={validationResultsB}
          totalRow={totalB}
          useColor={true}
        />
      </div>

      <div className="mt-4 flex gap-4">
      <button
        onClick={handleValidation}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        ✅ Validate
      </button>
    </div>

    <div className="mt-4 flex gap-4">
      <button
        onClick={handleValidation}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        ✅ Validate
      </button>
    </div>

       


      <div className="grid md:grid-cols-2 gap-6">
        <StatSummaryFormEnhanced
          expectedStats={calculateSummaryStats(expectedRowsA, config.statMeasure)}
          statMeasure={config.statMeasure}
          summaryKeys={config.summaryKeys}
          studentSummary={summaryA}
          setStudentSummary={setSummaryA}
        />

        <StatSummaryFormEnhanced
          expectedStats={calculateSummaryStats(expectedRowsB, config.statMeasure)}
          statMeasure={config.statMeasure}
          summaryKeys={config.summaryKeys}
          studentSummary={summaryB}
          setStudentSummary={setSummaryB}
        />
      </div>




      <StudentAnalysisBox
        studentNote={note}
        setStudentNote={setNote}
        prompt={config.analysisPrompt}
      />

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          onClick={() => handleSubmit(false)}
          className="px-4 py-2 bg-blue-400 text-white rounded"
          disabled={isSubmitting}
        >
          💾 Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={isSubmitting}
        >
          ✅ Submit Final
        </button>
      </div>
    </div>
  );
}
