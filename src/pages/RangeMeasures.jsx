// RangeMeasures.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { API_BASE } from "../services/apiBase";
import { fetchSubmission } from "../services/api";
import { statEngines } from "../services/statMeasureEngines";
import { generateClassData } from "../services/dataGenerators";

import ValidatedInputTable from "../components/ValidatedInputTable";
import StatSummaryFormEnhanced from "../components/StatSummaryFormEnhanced";
import {
  TopBarDescription,
  ProblemHeader,
  InstructionSidebar,
  StudentAnalysisBox
} from "../shared";

// ✅ Format [a, b] -> "a–b"
function formatIntervals(intervals) {
  return intervals.map(([start, end]) => `${start}–${end}`);
}

function roundToTwo(num) {
  return Math.round(num * 100) / 100;
}

export default function RangeMeasures() {
  const { code } = useParams();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const studentId = user?.username || "demo-student";

  const [config, setConfig] = useState(null);
  const [studentRows, setStudentRows] = useState([]);
  const [studentNote, setStudentNote] = useState("");
  const [studentSummary, setStudentSummary] = useState({});
  const [expectedSummary, setExpectedSummary] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { intervals = [], freqs = [] } = config?.meta ?? {};
  const formattedIntervals = useMemo(() => {
    return intervals.length && Array.isArray(intervals[0])
      ? formatIntervals(intervals)
      : intervals;
  }, [intervals]);

  useEffect(() => {
    async function loadExerciseAndSubmission() {
      try {
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const measure = "range"; // ✅ lowercase key
        const engine = statEngines[measure] ?? {};
        let xi = [], fi = [];

        if (data.classIntervals?.length && data.frequencies?.length) {
          xi = data.classIntervals;
          fi = data.frequencies;
        } else {
          const generate = data.generateInputs ?? {};
          const generated = generateClassData(generate, measure);
          xi = generated.xi;
          fi = generated.fi;
        }

        const saved = await fetchSubmission(code, studentId);

        setConfig({
          statMeasure: measure,
          topBar: data.description,
          meta: {
            title: data.title,
            description: data.questionText,
            intervals: xi,
            freqs: fi,
          },
          table: engine.tableConfig ?? {
            columns: [
              { key: "ciLabel", label: "Class Interval", editable: false },
              { key: "fi", label: "Frequency (fᵢ)", editable: true },
            ],
          },
          summaryTitle: data.summaryTitle,
          summaryKeys: ["range", "coefficientOfRange"],
          analysisPrompt: data.analysisPrompt,
          instructions: data.instructions,
        });

        if (saved?.tableInputs?.length) {
          setStudentRows(injectBounds(saved.tableInputs, xi));
          setStudentNote(saved.analysisText || "");
          setStudentSummary(saved.summaryStats || {});
          setValidationResults([]);
        } else {
          const blank = engine.generateInitialRows?.(xi, fi) ?? [];
          setStudentRows(injectBounds(blank, xi));
        }

      } catch (err) {
        console.error("❌ Failed to load:", err);
      }
    }

    loadExerciseAndSubmission();
  }, [code, studentId]);

  useEffect(() => {
  if (!Array.isArray(intervals) || intervals.length === 0) return;

  console.log("🔍 Intervals received:", intervals);
  console.log("🔍 Sample typeof first interval:", typeof intervals[0]);
  console.log("🔍 First interval:", intervals[0]);


  const numericIntervals = intervals.filter(
    (ci) => Array.isArray(ci) && ci.length === 2 && !ci.some(isNaN)
  );

  if (numericIntervals.length === 0) {
    console.warn("⚠️ No valid numeric intervals found");
    return;
  }

  const lowerBounds = numericIntervals.map(([low]) => Number(low));
  const upperBounds = numericIntervals.map(([_, high]) => Number(high));

  const min = Math.min(...lowerBounds);
  const max = Math.max(...upperBounds);

  const range = max - min;
  const coefficientOfRange = (range / (max + min)) * 100;

  console.log("🧮 Calculated Range:", range);
  console.log("📈 Coefficient of Range:", coefficientOfRange.toFixed(2));

  setExpectedSummary({
    range: roundToTwo(range),
    coefficientOfRange: roundToTwo(coefficientOfRange),
  });
}, [intervals]);



  const handleValidateSummary = () => {
    const results = {};
    for (const key of config.summaryKeys || []) {
      const studentVal = parseFloat(studentSummary[key]);
      const expectedVal = parseFloat(expectedSummary[key]);
      results[key] = Math.abs(studentVal - expectedVal) < 0.01;
    }
    setValidationResults(results);
  };

  function injectBounds(rows, classIntervals = []) {
  return rows.map((row, i) => {
    const interval = classIntervals[i] || [];
    const lower = interval[0];
    const upper = interval[1];

    const midpoint =
      row.midpoint != null ? row.midpoint :
      lower != null && upper != null ? (lower + upper) / 2 :
      null;

    return {
      ...row,
      lower,
      upper,
      ciLabel: `${lower}–${upper}`, // ✅ Use this for display only
      midpoint,
      fixi: row.fixi ?? (midpoint != null && row.fi != null ? midpoint * row.fi : null),
    };
  });
}


  const handleSubmit = async (isFinal) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/submissions/save`, {
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
      alert("Error saving. See console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) return <p className="p-4">⏳ Loading…</p>;

  return (
    <div className="p-4 space-y-6">
      <TopBarDescription text={config.topBar} />
      <div className="grid grid-cols-4 gap-4 items-start">
        <div className="col-span-1 shadow-md border rounded p-4">
          <InstructionSidebar instructions={config.instructions} />
        </div>

        <div className="col-span-3 shadow-md border rounded p-4 space-y-6">
          <h3 className="text-lg font-semibold text-center text-blue-700 mb-2">
            {config?.meta?.title}
          </h3>
          <ProblemHeader config={config.meta} />

          <div className="flex flex-col md:flex-row gap-4 items-start">
            

            <div className="w-full md:w-1/3 shadow-md border rounded p-4">
              <h2 className="font-bold text-lg mb-2">{config.summaryTitle}</h2>
              <StatSummaryFormEnhanced
                expectedStats={expectedSummary}
                statMeasure={config.statMeasure}
                summaryKeys={config.summaryKeys}
                studentSummary={studentSummary}
                setStudentSummary={setStudentSummary}
                validationResults={validationResults}
              />
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
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={isSubmitting}
              >
                ✅ Submit Final
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
