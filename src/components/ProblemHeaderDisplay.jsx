import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../services/apiBase";
import { statEngines } from "../services/StatEngine";
import { generateSingleData } from "../services/dataGenerators";
import ProblemHeader from "../shared/ProblemHeader";

export default function ProblemHeaderDisplay() {
  const { code } = useParams();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function fetchAndPrepareConfig() {
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

        if (!intervals.length || !frequencies.length) {
          console.log("⚙️ Generating intervals and frequencies since none found in DB.");
          const generate = data.generateInputs ?? data.dataGeneration ?? {};
          const generated = generateSingleData(generate, measure);
          intervals = generated.intervals;
          frequencies = generated.frequencies;
        }

        setConfig({
          ...data,
          intervals,
          frequencies // For ProblemHeader.jsx compatibility
        });

      } catch (err) {
        console.error("❌ Failed to fetch/generate exercise", err);
      }
    }

    fetchAndPrepareConfig();
  }, [code]);

  if (!config) return <p>Loading...</p>;

  return (
    <div className="problem-header">
      <h2 className="text-center font-semibold text-blue-700 mb-4">
        Problem Code: {code}
      </h2>
      <ProblemHeader config={config} useColor={true} />
    </div>
  );
}
