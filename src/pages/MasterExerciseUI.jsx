import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { TopBarDescription,ProblemHeader,GroupedTable,InstructionSidebar,StudentAnalysisBox } from '../shared' 
import StatSummaryForm from "../components/StatSummaryForm";
import { generateExpectedRows } from "../services/statHelpers";
import { calculateSummaryStats } from "../services/statSummaryEngine";
//import { ValidatedInputTable } from "../services/StatValidationEngine";

export default function MasterExerciseUI() {
  const { code } = useParams();
  const [exercise, setExercise] = useState(null);
  const [studentRows, setStudentRows] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [analysisText, setAnalysisText] = useState("");

  useEffect(() => {
    async function fetchExercise() {
      const res = await fetch(`/api/exercises/by-code/${code}`);
      const data = await res.json();
      setExercise(data);
    }
    fetchExercise();
  }, [code]);

  useEffect(() => {
    if (!exercise) return;

    const initRows = exercise.classIntervals.map((ci, i) => {
      const [a, b] = ci.split("-").map(Number);
      const xi = ((a + b) / 2).toFixed(1);
      return {
        ci,
        fi: exercise.frequencies[i],
        xi,
        fixi: "",
        absDiff: "",
        fiAbsDiff: "",
        diffMean: "",
        diffSq: "",
        fiDiffSq: "",
        xi2: "",
        fixi2: "",
      };
    });

    setStudentRows(initRows);
  }, [exercise]);

  const expectedRows = useMemo(() => {
    if (!exercise) return [];
    return generateExpectedRows({
      classIntervals: exercise.classIntervals,
      frequencies: exercise.frequencies,
      columns: exercise.tableColumns,
    });
  }, [exercise]);

  const expectedSummary = useMemo(() => {
    return calculateSummaryStats(expectedRows);
  }, [expectedRows]);

  /* const handleValidation = () => {
    const results = ValidatedInputTable({
      inputs: studentRows,
      expected: expectedRows,
      columns: exercise.tableColumns,
    }); 
    setValidationResults(results);
  };  */

  const handleSubmitAnalysis = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        userId: user._id,
        text: analysisText,
      }),
    });
    alert("Your analysis has been saved.");
  };

  if (!exercise) {
    return <div className="p-4 text-red-600">Loading exercise data...</div>;
  }

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <TopBarDescription text={exercise.description} />
        <ProblemHeader
          config={{
            classIntervals: exercise.classIntervals,
            frequencies: exercise.frequencies,
          }}
          useColor={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <div className="bg-gray-50 p-4 rounded shadow">
              <InstructionSidebar instructions={exercise.instructions} />
            </div>
          </div>

          <div className="md:col-span-8">
            <GroupedTable
              tableConfig={{ columns: exercise.tableColumns }}
              header={{
                classIntervals: exercise.classIntervals,
                frequencies: exercise.frequencies,
              }}
              rows={studentRows}
              setRows={setStudentRows}
              validationResults={validationResults}
              onValidate={handleValidation}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <StatSummaryForm
          expectedStats={expectedSummary}
          title={exercise.summaryTitle}
        />
      </div>

      <StudentAnalysisBox
        prompt={exercise.analysisPrompt}
        text={analysisText}
        setText={setAnalysisText}
        onSave={handleSubmitAnalysis}
      />
    </>
  );
}
