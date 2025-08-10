import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import { API_BASE } from "../services/apiBase";

const FUNCTIONS = {
  1: { name: "f(x) = x²", f: (x) => x * x, defaultXs: [-3,-2,-1,0,1,2], domain: [-5,5], range: [0,25], helperXs: [-4,-3,2] },
  2: { name: "f(x) = sin(x°)", f: (x) => Math.sin((x * Math.PI) / 180), defaultXs: [0,60,120,180,240,300,360], range: [-1.2,1.2], domain: [0,360], helperXs: [30,90,135] },
  3: { name: "f(x) = x³ − x", f: (x) => x**3 - x, defaultXs: [-2.5,-1.5,-0.5,0.5,1.5,2.5], domain: [-3,3], range: [-10,10], helperXs: [-2,0,2] },
  4: { name: "f(x) = ln(x)", f: (x) => (x > 0 ? Math.log(x) : NaN), defaultXs: [0.5,0.8,1,1.5,2,3], domain: [0.1,5], range: [-2.5,2], helperXs: [0.25,1,2.5] },
  5: { name: "f(x) = 1 / (1 + x²)", f: (x) => 1/(1 + x**2), defaultXs: [-3,-2,-1,0,1,2], domain: [-5,5], range: [0,1.1], helperXs: [-2,0,2] },
};

function linspace(a, b, n = 300) {
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}

export default function FunctionFivePoints() {
  const { code } = useParams();                     // e.g. "Draw_01" or "Functions_03"
  const questionId = parseInt(code?.split("_")[1], 10) || 1;
  const fn = FUNCTIONS[questionId] || FUNCTIONS[1];

  // ---------- NEW: DB-backed problem + instructions ----------
  const [loading, setLoading] = useState(false);
  const [dbErr, setDbErr] = useState("");
  const [problem, setProblem] = useState("");       // description string
  const [steps, setSteps] = useState([]);           // instructions as array of strings

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setDbErr("");
        const res = await fetch(`${API_BASE}/exercises/by-code/${encodeURIComponent(code)}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const desc = data?.ProblemDescription ?? data?.problemDescription ?? data?.description ?? "";
        // allow either array or newline-separated string
        const instr = Array.isArray(data?.instructions)
          ? data.instructions
          : (data?.instructions ? String(data.instructions).split(/\r?\n/).filter(Boolean) : []);

        if (alive) {
          setProblem(String(desc || "").trim());
          setSteps(instr);
        }
      } catch (e) {
        if (alive) setDbErr(e.message || "Failed to load exercise");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [code]);
  // ------------------------------------------------------------

  const pointLabels = ["A", "B", "C", "D", "E", "F"];
  const [xs, setXs] = useState(Array(6).fill(""));
  const [helperInputs, setHelperInputs] = useState(["", "", ""]);

  useEffect(() => {
    setXs(fn.defaultXs.map((v) => String(v)));
    setHelperInputs(["","",""]);
  }, [questionId]);

  const parsedXs = xs.map((v) => (v === "" ? null : Number(v)));

  const lastFilledIndex = (() => {
    let k = -1;
    for (let i = 0; i < parsedXs.length; i++) {
      if (parsedXs[i] !== null && isFinite(parsedXs[i])) k = i; else break;
    }
    return k;
  })();

  const showHelperPoints = lastFilledIndex >= 5;

  const onHelperChange = (i, val) =>
    setHelperInputs((prev) => prev.map((x, j) => (j === i ? val : x)));

  const isClose = (a, b, tolerance = 0.05) => Math.abs(a - b) <= tolerance;

  const [minDom, maxDom] = useMemo(() => {
    const domainStart = fn.domain[0];
    const lastX = parsedXs[lastFilledIndex];
    if (lastFilledIndex >= 0 && isFinite(lastX)) return [domainStart, lastX];
    return [null, null];
  }, [parsedXs, lastFilledIndex, fn.domain]);

  const progCurve = useMemo(() => {
    if (minDom === null || maxDom === null) return null;
    const xsDense = linspace(minDom, maxDom, 400);
    return { x: xsDense, y: xsDense.map(fn.f) };
  }, [minDom, maxDom, fn]);

  const enteredPoints = useMemo(
    () =>
      parsedXs
        .slice(0, lastFilledIndex + 1)
        .filter((x) => x !== null && isFinite(x))
        .map((x, i) => ({ x, y: fn.f(x), label: pointLabels[i] })),
    [parsedXs, lastFilledIndex, fn]
  );

  const helperMarkers = useMemo(() => {
    if (!showHelperPoints || !fn.helperXs) return [];
    return fn.helperXs.map((x, i) => ({ x, y: fn.f(x), label: ["X", "Y", "Z"][i] }));
  }, [showHelperPoints, fn]);

  const onXChange = (i, val) =>
    setXs((prev) => prev.map((x, j) => (j === i ? val : x)));

  return (
    <div className="max-w-screen-xl mx-auto p-4 space-y-4">
      {/* ---- Problem Description block ---- */}
      {loading ? (
        <div className="p-3 rounded border bg-gray-50 text-sm">Loading problem…</div>
      ) : dbErr ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-sm text-red-700">
          Could not load problem: {dbErr}
        </div>
      ) : problem ? (
        <div className="p-4 rounded border bg-blue-50">
          <div style={{ whiteSpace: "pre-line" }}>{problem}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ---- Instructions sidebar ---- */}
        <aside className="lg:col-span-1">
          <div className="p-4 rounded border shadow-sm bg-white h-full">
            <h3 className="font-semibold mb-2">Instructions</h3>
            {steps.length ? (
              <ol className="list-decimal pl-4 space-y-1 text-sm">
                {steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            ) : (
              <div className="text-xs text-gray-500">No instructions provided.</div>
            )}
          </div>
        </aside>

        {/* ---- Plot + inputs ---- */}
        <main className="lg:col-span-3">
          <div className="flex flex-col items-center gap-6 p-4 rounded border shadow-sm bg-white">
            <h2 className="text-xl font-semibold text-center">Progressive Drawing of Function</h2>
            <p className="text-center mb-2">Function: <code>{fn.name}</code></p>

            <div className="flex flex-wrap justify-center gap-3">
              {pointLabels.map((lab, i) => (
                <div key={lab}>
                  <label className="block text-sm mb-1 text-center">x{lab}</label>
                  <input
                    type="number"
                    step="any"
                    value={xs[i]}
                    onChange={(e) => onXChange(i, e.target.value)}
                    className="border rounded px-2 py-1 w-24 text-center"
                    placeholder={`x${lab}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={() => setXs(fn.defaultXs.map((v) => String(v)))}
                className="px-4 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Use sensible x’s
              </button>
              <button
                onClick={() => setXs(Array(pointLabels.length).fill(""))}
                className="px-4 py-1 rounded bg-gray-400 text-white font-medium hover:bg-gray-500"
              >
                Clear
              </button>
            </div>

            <Plot
              data={[
                ...(progCurve ? [{
                  x: progCurve.x,
                  y: progCurve.y,
                  mode: "lines",
                  line: { width: 3 },
                  name: "Drawn Curve",
                }] : []),
                {
                  x: enteredPoints.map((p) => p.x),
                  y: enteredPoints.map((p) => p.y),
                  mode: "markers+text",
                  marker: { size: 10 },
                  text: enteredPoints.map((p) => p.label),
                  textposition: "top center",
                  name: "Points",
                },
                ...(showHelperPoints ? [{
                  x: helperMarkers.map((p) => p.x),
                  y: helperMarkers.map((p) => p.y),
                  mode: "markers+text",
                  marker: { size: 12, color: ["purple","purple","purple"], symbol: ["square","square","square"] },
                  text: helperMarkers.map((p) => p.label),
                  textposition: "top center",
                  name: "Helper Points",
                }] : []),
              ]}
              layout={{
                title: `${fn.name} — Progressive Plot`,
                height: 450,
                margin: { l: 60, r: 20, t: 50, b: 50 },
                xaxis: {
                  title: fn.name.includes("sin") ? "x (degrees)" : "x",
                  range: fn.domain,
                  zeroline: true,
                  tickvals: fn.name.includes("sin") ? [0,60,120,180,240,300,360] : undefined,
                  ticktext: fn.name.includes("sin") ? ["0°","60°","120°","180°","240°","300°","360°"] : undefined,
                },
                yaxis: { title: "f(x)", range: fn.range, zeroline: true },
                showlegend: false,
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", maxWidth: "700px" }}
            />

            {showHelperPoints && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <p className="text-sm font-medium">Enter f(x) values for X, Y, Z</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {helperMarkers.map((pt, i) => {
                    const userVal = parseFloat(helperInputs[i]);
                    const trueVal = pt.y;
                    const ok = helperInputs[i] !== "" && !isNaN(userVal) && isClose(userVal, trueVal);
                    return (
                      <div key={pt.label}>
                        <label className="block text-sm mb-1 text-center">{pt.label}</label>
                        <input
                          type="number"
                          step="any"
                          value={helperInputs[i]}
                          onChange={(e) => onHelperChange(i, e.target.value)}
                          className={`border rounded px-2 py-1 w-24 text-center ${
                            helperInputs[i] === "" ? "" : ok ? "bg-green-200" : "bg-red-200"
                          }`}
                          placeholder={`f(${pt.x.toFixed(2)})`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
