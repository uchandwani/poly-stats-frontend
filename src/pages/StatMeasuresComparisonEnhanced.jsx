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
import { statEngines } from "../services/StatEngine";
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
  const [studentRows, setStudentRows] = useState({ A: [], B: [] });
  const [validationResults, setValidationResults] = useState({ A: [], B: [] });
  const [studentSummary, setStudentSummary] = useState({ A: {}, B: {} });
  const [studentNote, setStudentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadExerciseAndSubmission() {
      try {
        const res = await fetch(`/api/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const { statMeasureA, statMeasureB } = data;
        const engineA = statEngines[statMeasureA];
        const engineB = statEngines[statMeasureB];
        if (!engineA || !engineB) throw new Error("❌ Invalid stat engines");

        const configData = data.configData ?? {};

        const parseValues = (grouped, dataset, dataPrefix) => {
          if (grouped) {
            return {
              values: configData[dataset]?.classIntervals || data[dataPrefix] || [],
              freqs: configData[dataset]?.frequencies || data[`frequencies${dataPrefix.slice(-1)}`] || [],
            };
          } else {
            return {
              values: (configData[dataset]?.xi || data[`xiList${dataPrefix.slice(-1)}`] || []).map(Number),
              freqs: configData[dataset]?.frequencies || data[`fiList${dataPrefix.slice(-1)}`] || [],
            };
          }
        };

        const valsA = parseValues(engineA.inputType === "grouped", "datasetA", "classIntervalsA");
        const valsB = parseValues(engineB.inputType === "grouped", "datasetB", "classIntervalsB");

        const blankRowsA = engineA.generateInitialRows(valsA.values, valsA.freqs);
        const blankRowsB = engineB.generateInitialRows(valsB.values, valsB.freqs);

        setConfig({
          ...data,
          metaA: { ...valsA, title: "Dataset A", description: engineA.inputType },
          metaB: { ...valsB, title: "Dataset B", description: engineB.inputType },
          tableA: engineA.tableConfig,
          tableB: engineB.tableConfig,
          summaryKeysA: engineA.summaryKeys,
          summaryKeysB: engineB.summaryKeys,
          statMeasureA,
          statMeasureB,
        });

        const saved = await fetchSubmission(code, studentId);
        if (saved?.tableInputs?.A?.length || saved?.tableInputs?.B?.length) {
          setStudentNote(saved.analysisText || "");
          setStudentRows({
            A: saved.tableInputs.A || [],
            B: saved.tableInputs.B || [],
          });
          setStudentSummary({
            A: saved.summaryStats?.A || {},
            B: saved.summaryStats?.B || {},
          });
        } else {
          setStudentRows({ A: blankRowsA, B: blankRowsB });
        }
      } catch (err) {
        console.error("❌ Error loading comparison exercise:", err);
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

  const engineA = useMemo(() => statEngines[config?.statMeasureA], [config]);
  const engineB = useMemo(() => statEngines[config?.statMeasureB], [config]);

  const handleValidation = () => {
    const validate = (key, engine, meta, table) => validateStatTable({
      inputs: studentRows[key],
      expected: engine.generateExpectedRows(meta.values, meta.freqs),
      columns: table.columns,
      statMeasure: config[`statMeasure${key}`],
    });

    setValidationResults({
      A: validate("A", engineA, config.metaA, config.tableA),
      B: validate("B", engineB, config.metaB, config.tableB),
    });
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
          isFinal,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Error saving submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) return <p className="p-4">⏳ Loading comparison exercise…</p>;

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto">
      <TopBarDescription text={config.description} />
      <ProblemHeader config={config} />
      <InstructionSidebar instructions={config.instructions} />

      <h2 className="font-bold text-lg">{config.dataTableLabel}</h2>
      {['A', 'B'].map((key) => (
        <div key={key} className="space-y-2">
          <h3 className="font-semibold">{config[`meta${key}`]?.title}</h3>
          <ValidatedInputTable
            tableConfig={config[`table${key}`]}
            rows={studentRows[key]}
            setRows={(rows) => setStudentRows((prev) => ({ ...prev, [key]: rows }))}
            validationResults={validationResults[key]}
            totalRow={statEngines[config[`statMeasure${key}`]].generateTotalRow(
              studentRows[key].filter((r) => Object.values(r).some((val) => val !== "" && val !== null && !isNaN(val))),
              config[`table${key}`].columns
            )}
          />
        </div>
      ))}

      <h2 className="font-bold text-lg mt-4">{config.summaryTitle}</h2>
      {['A', 'B'].map((key) => (
        <StatSummaryFormEnhanced
          key={key}
          expectedStats={calculateSummaryStats(
            statEngines[config[`statMeasure${key}`]].generateExpectedRows(
              config[`meta${key}`].values,
              config[`meta${key}`].freqs
            ),
            config[`statMeasure${key}`]
          )}
          statMeasure={config[`statMeasure${key}`]}
          summaryKeys={config[`summaryKeys${key}`]}
          studentSummary={studentSummary[key]}
          setStudentSummary={(summary) =>
            setStudentSummary((prev) => ({ ...prev, [key]: summary }))
          }
        />
      ))}

      <StudentAnalysisBox
        studentNote={studentNote}
        setStudentNote={setStudentNote}
        prompt={config.analysisPrompt}
      />

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => handleSubmit(false)}
          className="px-4 py-2 bg-blue-300 text-white rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "⏳ Saving…" : "💾 Save Draft"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "⏳ Submitting…" : "✅ Submit Final"}
        </button>
      </div>
    </div>
  );
}
