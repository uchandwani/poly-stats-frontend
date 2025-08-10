import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Plot from "react-plotly.js";
import { API_BASE } from "../services/apiBase";
import { InstructionSidebar } from "../shared";

// ===== Questions =====
const questions = [
  { expression: "3x⁴ - 2x² + cos(x)", func: (x) => 3 * x ** 4 - 2 * x ** 2 + Math.cos(x),                  type: "even" },
  {  expression: "x² / (1 + x²)",  func: (x) => (x ** 2) / (1 + x ** 2),                                   type: "even" },
  { expression: "x³ + 4x + sin(x)",    func: (x) => x ** 3 + 4 * x + Math.sin(x),                          type: "odd"  },
  { expression: "eˣ + e⁻ˣ",           func: (x) => Math.exp(x) + Math.exp(-x),                             type: "even" },
  { expression: "x³ - x",              func: (x) => x * x * x - x,                                         type: "odd"  },
];

// Centered y-range around x∈[-zoomWindow, +zoomWindow]
function getCenteredYRange(fn, xValues, zoomWindow = 10, minFloor = -10000) {
  const centerXs = xValues.filter((x) => Math.abs(x) <= zoomWindow);
  const centerYs = centerXs.map(fn);
  const minY = Math.min(...centerYs);
  const maxY = Math.max(...centerYs);
  const span = Math.max(1e-9, maxY - minY);
  const padding = 0.1 * span;
  const yMin = Math.max(minY - padding, minFloor);
  const yMax = maxY + padding;
  return [yMin, yMax];
}

export default function EvenOddFunctions() {
  const { code } = useParams(); // e.g., "EvenOdd_03"
  const index = Math.max(0, (parseInt(code.split("_")[1], 10) || 1) - 1);
  const question = questions[index] || questions[0];

  // Plot data
  const [xValues, setXValues] = useState([]);
  const [yValues, setYValues] = useState([]);

  // UI state
  const [selection, setSelection] = useState(""); // EVEN/ODD/NEITHER
  const [feedback, setFeedback] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [zoomY, setZoomY] = useState(true);

  // DB-backed text
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  // ===== Fetch ProblemDescription + Instructions from DB =====
  useEffect(() => {
    let cancelled = false;

    async function fetchMeta() {
      setLoading(true);
      setDbError(null);
      setProblemDescription("");
      setInstructions("");

      const urls = [
        `${API_BASE}/exercises/by-code/${code}`,
        `${API_BASE}/exercises?code=${encodeURIComponent(code)}`,
      ];

      let lastErr = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const doc = Array.isArray(data) ? data[0] : data;
          if (!doc) throw new Error("Document not found");

          if (!cancelled) {
            setProblemDescription(
              String(
                doc?.ProblemDescription ?? doc?.problemDescription ?? doc?.description ?? ""
              ).trim()
            );
            setInstructions(String(doc?.instructions ?? "").trim());
            setLoading(false);
          }
          return;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!cancelled) {
        setDbError(lastErr?.message || "Failed to load");
        setLoading(false);
      }
    }

    if (code) fetchMeta();
    return () => { cancelled = true; };
  }, [code]);

  // ===== Build x/y when question changes =====
  useEffect(() => {
    const xs = Array.from({ length: 101 }, (_, i) => i - 50); // [-50, 50]
    const ys = xs.map(question.func);
    setXValues(xs);
    setYValues(ys);

    // reset
    setSelection("");
    setFeedback("");
    setShowExplanation(false);
    setZoomY(true);
  }, [question]);

  // ===== Memo: ranges & layout bits =====
  const yRangeZoomed = useMemo(
    () => getCenteredYRange(question.func, xValues),
    [question, xValues]
  );

  const yRangeFull = useMemo(() => {
    if (!yValues.length) return [-1, 1];
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    return [minY, maxY];
  }, [yValues]);

  const yRange = zoomY ? yRangeZoomed : yRangeFull;

  // ===== Top problem panel =====
  const problemBlock = useMemo(() => {
    if (loading) {
      return (
        <div className="w-full max-w-[900px] p-3 mb-4 rounded bg-gray-50 border">
          Loading problem…
        </div>
      );
    }
    if (dbError) {
      return (
        <div className="w-full max-w-[900px] p-3 mb-4 rounded bg-red-50 border border-red-200 text-red-700">
          Could not load problem from database: {dbError}
        </div>
      );
    }
    if (problemDescription) {
      return (
        <div className="w-full problem-card p-4 mb-4 rounded bg-blue-50 border border-blue-200">
          <div style={{ whiteSpace: "pre-line" }}>{problemDescription}</div>
        </div>
      );
    }
    return null;
  }, [loading, dbError, problemDescription]);

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-4">
      {/* DB-backed ProblemDescription panel */}
      <div className="flex justify-center">{problemBlock}</div>

      <div className="grid grid-cols-4 gap-4">
        {/* LEFT: Instructions from DB */}
        <div className="col-span-1">
          <div className="shadow-md border rounded p-4 h-full">
            <InstructionSidebar instructions={instructions} />
            {!instructions && !loading && (
              <div className="text-xs text-gray-500">No instructions provided.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Plot + controls */}
        <div className="col-span-3 space-y-4">
          <div className="shadow-md border rounded p-4">
            <h2 className="text-lg font-semibold text-center text-blue-700 mb-2">
              f(x) = {question.expression}
            </h2>

                       
            {/* Function Plot */}
            <div className="flex justify-center w-full">
             <Plot
              data={[
                {
                  x: xValues,
                  y: yValues,
                  type: "scatter",
                  mode: "lines",
                  name: `f(x) = ${question.expression}`,
                  line: { color: "blue" }
                }
              ]}
              layout={{
                xaxis: {
                  title: "x",
                  zeroline: true,
                  range: [-25, 25],
                  automargin: true
                },
                yaxis: {
                  title: "f(x)",
                  zeroline: true,
                  range: yRange,
                  automargin: true
                },
                height: 500,
                margin: { l: 50, r: 30, t: 20, b: 40 },
                plot_bgcolor: "#fff",
                
                // ✅ Add shaded background for positive and negative Y
                shapes: [
                  {
                    type: "rect",
                    xref: "paper",     // full width
                    yref: "y",         // reference actual y values
                    x0: 0,
                    x1: 1,
                    y0: 0,
                    y1: Math.max(...yRange),
                    fillcolor: "rgba(173, 216, 230, 0.2)", // very light blue
                    line: { width: 0 }
                  },
                  {
                    type: "rect",
                    xref: "paper",
                    yref: "y",
                    x0: 0,
                    x1: 1,
                    y0: Math.min(...yRange),
                    y1: 0,
                    fillcolor: "rgba(255, 182, 193, 0.2)", // very light red (pinkish)
                    line: { width: 0 }
                  }
                ]
              }}
              config={{ responsive: true }}
              style={{ width: "100%", maxWidth: "900px" }}
            />

            </div>

            {/* Answer Buttons */}
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {["EVEN", "ODD", "NEITHER"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelection(option);
                    setShowExplanation(false);
                    setFeedback(
                      option === "EVEN"
                        ? "You think the function is EVEN."
                        : option === "ODD"
                        ? "You think the function is ODD."
                        : "You think the function is NEITHER."
                    );
                  }}
                  className={`px-5 py-2 rounded font-semibold ${
                    selection === option
                      ? "bg-green-600 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Feedback + Student Reasoning + Explain */}
            {feedback && (
              <>
                <div className="mt-4 text-md font-semibold text-gray-800 text-center">
                  {feedback}
                </div>

                {/* Student Analysis */}
                <div className="mt-4 text-left w-full max-w-[900px] mx-auto">
                  <label className="block font-semibold mb-1">
                    📝 Why do you think it is {selection}?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write your reasoning here..."
                    className="w-full border rounded p-2"
                  />
                </div>

                {/* Show Explain Button */}
                <div className="mt-4 text-center">
                  <button
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    onClick={() => setShowExplanation(true)}
                  >
                    📘 Explain
                  </button>
                </div>
              </>
            )}

            {/* Explanation Section */}
            {showExplanation && (
              <div className="mt-3 p-3 border bg-blue-50 rounded w-full max-w-[900px] mx-auto text-left">
                <strong>Explanation:</strong>
                <p className="mt-1 text-sm text-gray-800">
                  {{
                    even: "All terms are even functions (like x², x⁴, cos(x)). Their sum is also even.",
                    odd: "All terms are odd functions (like x³, x, sin(x)). Their sum is also odd.",
                    neither:
                      "The function has both even and odd components, or non-symmetric terms like |x|, so it is neither even nor odd.",
                  }[question.type]}
                </p>
              </div>
            )}

            
          </div>
        </div>
      </div>
    </div>
  );
}
