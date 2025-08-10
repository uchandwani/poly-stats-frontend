import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MeanDeviationExercise({ exerciseCode = "Mean_02" }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.username || "demo-student";  // Ideally, use `user?._id` if available

  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");
  const [summaryStats, setSummaryStats] = useState({ mean: "", meanDeviation: "" });
  const [isFinal, setIsFinal] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await axios.get(\`/api/submissions/get?exerciseCode=\${exerciseCode}&studentId=\${studentId}\`);
        if (res.data.ok && res.data.submission) {
          setRows(res.data.submission.tableInputs || []);
          setNote(res.data.submission.analysisText || "");
          setSummaryStats(res.data.submission.summaryStats || {});
          setIsFinal(res.data.submission.isFinal || false);
        }
      } catch (err) {
        console.error("Error loading submission", err);
      }
    };
    fetchSubmission();
  }, []);

  return (
    <div>
      <h2>Mean Deviation Exercise</h2>

      <table className="table-auto border w-full text-sm">
        <thead>
          <tr><th>C.I</th><th>fᵢ</th><th>xᵢ</th><th>fᵢxᵢ</th><th>|x̄ − xᵢ|</th><th>fᵢ|x̄ − xᵢ|</th></tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {["ci", "fi", "xi", "fixi", "absDiff", "fiAbsDiff"].map((key) => (
                <td key={key}>
                  <input
                    className="border px-2 py-1 w-full"
                    value={row[key] || ""}
                    readOnly={isFinal}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[i][key] = e.target.value;
                      setRows(updated);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <textarea
        className="w-full mt-4 p-2 border"
        placeholder="Write your analysis here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        readOnly={isFinal}
      />

      <div className="mt-4 space-y-2">
        <div>Mean: <input value={summaryStats.mean || ""} readOnly={isFinal} /></div>
        <div>Mean Deviation: <input value={summaryStats.meanDeviation || ""} readOnly={isFinal} /></div>
      </div>

      {!isFinal && (
        <div className="mt-4 flex gap-4">
          <button onClick={() => handleSubmit(false)}>📝 Save Draft</button>
          <button onClick={() => handleSubmit(true)}>✅ Submit Final</button>
        </div>
      )}
    </div>
  );

  async function handleSubmit(isFinalSubmit) {
    try {
      await axios.post("/api/submissions/save", {
        exerciseCode,
        studentId,
        tableInputs: rows,
        analysisText: note,
        summaryStats,
        isFinal: isFinalSubmit
      });
      alert(isFinalSubmit ? "Final submission saved." : "Draft saved!");
      if (isFinalSubmit) setIsFinal(true);
    } catch (err) {
      alert("Submission failed.");
      console.error(err);
    }
  }
}
