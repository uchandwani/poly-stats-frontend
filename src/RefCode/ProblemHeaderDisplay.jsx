import React, { useEffect, useState } from "react";
import { API_BASE } from "../services/apiBase";
import { ProblemHeader } from "../shared";

/**
 * Displays the problem header — title and summary heading.
 * Fetches from DB using exercise code.
 */
export default function ProblemHeaderDisplay({ code }) {
  const [meta, setMeta] = useState({
    title: "",
    summaryTitle: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/exercises/by-code/${code}`);
        const data = await res.json();
        setMeta({
          title: data.title || "Untitled",
          summaryTitle: data.summaryTitle || "Summary Statistics",
        });
      } catch (err) {
        console.error("❌ Failed to load metadata:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (code) fetchMetadata();
  }, [code]);

  if (loading) {
    return (
      <div className="text-sm text-blue-800 italic">
        ⏳ Loading problem header...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-800">
        ❌ Problem header could not be loaded.
      </div>
    );
  }

  return <ProblemHeader title={meta.title} summaryTitle={meta.summaryTitle} />;
}
