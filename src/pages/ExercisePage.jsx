// src/pages/ExercisePage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { fetchSubmission, saveSubmission, submitSubmission } from "../services/api";

export default function ExercisePage() {
  const { code } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id || "guest";

  const [exercise, setExercise] = useState(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    if (code) {
      setLoading(true);

      axios
        .get(`${API_BASE}/exercises/by-code/${code}`)
        .then(async (res) => {
          setExercise(res.data);
          setError("");

          if (userId !== "guest") {
            const submission = await fetchSubmission(code, userId);
            if (submission) {
              setAnswer(submission.analysisText || "");
              setReadOnly(submission.isFinal === true);
              setStatus(
                submission.isFinal
                  ? "✅ You have already submitted this exercise."
                  : "📝 Your draft has been loaded."
              );
            }
          }
        })
        .catch((err) => {
          console.error("❌ Failed to load exercise:", err);
          setError("⚠️ Failed to load exercise. Please check the code or try again.");
        })
        .finally(() => setLoading(false));
    }
  }, [code, userId]);

  const handleSave = async () => {
    const success = await saveSubmission(code, userId, answer);
    if (success) {
      setStatus("💾 Saved as draft!");
    } else {
      setStatus("❌ Failed to save.");
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit? You won't be able to edit it later.")) return;

    const success = await submitSubmission(code, userId, answer);
    if (success) {
      setStatus("✅ Submitted!");
      setReadOnly(true);
    } else {
      setStatus("❌ Failed to submit.");
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!exercise?.code) {
    return <p className="text-red-600">⚠️ No exercise data found for: {code}</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 border rounded shadow-md bg-white">
      <h2 className="text-xl font-bold mb-2">{exercise.code}</h2>
      <p className="mb-4 text-gray-700">
        📝 {exercise.question || `Solve the ${exercise.type} - ${exercise.subtype} question.`}
      </p>

      <textarea
        aria-label="Your Answer"
        rows="6"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
        placeholder="Write your answer here..."
        readOnly={readOnly}
      ></textarea>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          disabled={readOnly || !answer.trim()}
        >
          Save Draft
        </button>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={readOnly || !answer.trim()}
        >
          Submit Final
        </button>
      </div>

      {status && <p className="mt-2 text-green-700 font-semibold">{status}</p>}
    </div>
  );
}
