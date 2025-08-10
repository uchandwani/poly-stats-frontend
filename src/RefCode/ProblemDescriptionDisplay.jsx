import React, { useEffect, useState } from "react";
import { API_BASE } from "../services/apiBase";

/**
 * Fetches and displays the problem title and question text.
 * Used for top-level problem description block.
 */
export default function ProblemDescriptionDisplay({ code }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        const data = await res.json();
        setTitle(data.title || "Untitled Problem");
        setDescription(data.questionText || "No description available.");
      } catch (err) {
        console.error("❌ Failed to load problem description:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (code) fetchProblem();
  }, [code]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 italic">
        ⏳ Loading problem description...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
        ❌ Failed to load problem description. Please try again later.
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-300 p-4 rounded shadow-sm text-sm">
      <strong className="text-blue-900 block mb-1">{title}</strong>
      <p className="text-gray-800 whitespace-pre-line">{description}</p>
    </div>
  );
}

}
