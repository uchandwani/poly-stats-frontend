import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox,
} from "../shared";
import StatSummaryForm from "../components/StatSummaryForm";
import ValidatedInputTable from "../components/ValidatedInputTable.jsx";
import { generateExpectedRows } from "../services/statHelpers";
import { calculateSummaryStats } from "../services/statSummaryEngine";
import { validateStatTable } from "../services/StatValidationEngine";
import { fetchSubmission } from "../services/api";

export default function MeanDeviationConfig() {
  const { code } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.username || "demo-student";
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const fallback = {
    topBar: "Practice Mean Deviation with a simple grouped frequency table.",
    header: {
      title: "Mean Deviation Problem",
      description: "Find the mean deviation of the grouped data shown below.",
      classIntervals: ["10-20", "20-30", "30-40", "40-50"],
      frequencies: [4, 6, 8, 2],
    },
    table: {
      tableId: "mean-deviation",
      columns: [
        { key: "ci", label: "Class Interval" },
        { key: "fi", label: "Frequency" },
        { key: "xi", label: "Mid-point" },
        { key: "fixi", label: "f × xᵒ" },
        { key: "absDiff", label: "|xᵒ − x̄|" },
        { key: "fiAbsDiff", label: "f × |xᵒ − x̄|" },
      ],
    },
    summaryTitle: "Summary of Mean Deviation",
    analysisPrompt: "What does this mean deviation suggest about the spread of data?",
    instructions: [
      "Form class intervals of equal width.",
      "Calculate the mid-point xᵒ of each class.",
      "Multiply each fᵒ by xᵒ to compute fᵒxᵒ.",
      "Find the mean x̄ of the distribution.",
      "Calculate |xᵒ - x̄| and then fᵒ|xᵒ - x̄|.",
      "Sum up to find the Mean Deviation.",
    ],
  };

  const [config, setConfig] = useState(fallback);
  const [studentRows, setStudentRows] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [studentNote, setStudentNote] = useState("");
  const [studentSummary, setStudentSummary] = useState({});

  useEffect(() => {
    async function loadExerciseAndSubmission() {
      try {
        const res = await fetch(`/api/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const intervals = data.configData?.classIntervals ?? data.classIntervals;
        const freqs = data.configData?.frequencies ?? data.frequencies;

        setStudentNote("");
        setStudentRows([]);
        setSummaryStats({});
        setValidationResults([]);

        setConfig({
          topBar: data.description,
          header: {
            title: "Mean Deviation Problem",
            description: "Find the mean deviation of the grouped data shown below.",
            classIntervals: intervals,
            frequencies: freqs,
          },
          table: fallback.table,
          summaryTitle: data.summaryTitle,
          analysisPrompt: data.analysisPrompt,
          instructions: data.instructions,
          frequencyBarLabel: data.frequencyBarLabel ?? "Class Interval Distribution",
          dataTableLabel: data.dataTableLabel ?? "Data Table",
          instructionsLabel: data.instructionsLabel ?? "Instructions",
        });

        const saved = await fetchSubmission(code, studentId);
        if (saved) {
          setStudentNote(saved.analysisText || "");
          setStudentRows(saved.tableInputs || []);
          setSummaryStats(saved.summaryStats || {});
          setValidationResults([]);
        } else {
          const blankRows = intervals.map((ci, i) => {
            const [a, b] = ci.split("-").map(Number);
            return {
              ci,
              fi: freqs[i],
              xi: ((a + b) / 2).toFixed(1),
              fixi: "",
              absDiff: "",
              fiAbsDiff: "",
            };
          });
          setStudentRows(blankRows);
        }
      } catch (err) {
        console.error("⚠️ Error loading exercise or submission:", err);
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

  const { columns } = config.table;
  const { classIntervals, frequencies } = config.header;

  const expectedRows = useMemo(() => {
    if (!Array.isArray(classIntervals) || !Array.isArray(frequencies) || classIntervals.length !== frequencies.length || !columns?.length) return [];
    return generateExpectedRows({ classIntervals, frequencies, columns });
  }, [classIntervals, frequencies, columns]);

  const expectedSummary = useMemo(() => {
    if (!expectedRows.length) return { sumFixi: 0, sumFiAbsDiff: 0 };
    return calculateSummaryStats(expectedRows);
  }, [expectedRows]);

  const totalRow = useMemo(() => {
    const sumF = frequencies?.reduce((a, b) => a + b, 0) || 0;
    const { sumFixi = 0, sumFiAbsDiff = 0 } = expectedSummary || {};
    return {
      ci: "Σ",
      fi: sumF,
      xi: "",
      fixi: sumFixi,
      absDiff: "",
      fiAbsDiff: sumFiAbsDiff,
    };
  }, [frequencies, expectedSummary]);

  const handleValidation = () => {
    const results = validateStatTable({ inputs: studentRows, expected: expectedRows, columns });
    setValidationResults(results);
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
          tableInputs: studentRows,
          summaryStats: studentSummary,
          isFinal,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      alert(isFinal ? "✅ Submission saved!" : "💾 Draft saved!");
    } catch (err) {
      console.error("Error saving submission:", err);
      alert("❌ Error saving submission. See console.");
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <TopBarDescription text={config.topBar} />
      {config.frequencyBarLabel && <h2 className="text-md font-semibold text-gray-600 text-center mb-2">{config.frequencyBarLabel}</h2>}
      <div className="w-4/5 mx-auto">
        <ProblemHeader config={config.header} useColor />
      </div>
      <div className="flex gap-6">
        <aside className="flex-none">
          <h2 className="text-md font-semibold text-gray-600 text-center mb-2">{config.instructionsLabel}</h2>
          <div className="bg-gray-50 p-4 rounded shadow w-fit">
            <InstructionSidebar instructions={config.instructions} />
          </div>
        </aside>
        <section className="flex-1 space-y-4">
          <h2 className="text-md font-semibold text-gray-600 text-center mb-2">{config.dataTableLabel}</h2>
          <ValidatedInputTable
            tableConfig={config.table}
            rows={studentRows}
            setRows={setStudentRows}
            validationResults={validationResults}
            totalRow={totalRow}
          />
          <div className="text-center">
            <button
              onClick={handleValidation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              ✅ Validate
            </button>
          </div>
        </section>
      </div>
      <div className="flex justify-center">
        <StatSummaryForm expectedStats={expectedSummary} />
      </div>
      <StudentAnalysisBox prompt={config.analysisPrompt} value={studentNote} onChange={setStudentNote} />
      <div className="flex gap-4 justify-end mt-4">
        <button onClick={() => handleSubmit(false)} className="px-4 py-2 bg-yellow-500 text-white rounded">💾 Save Draft</button>
        <button onClick={() => handleSubmit(true)} className="px-4 py-2 bg-green-600 text-white rounded">✅ Submit Final</button>
      </div>
    </div>
  );
}
