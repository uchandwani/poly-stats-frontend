import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import { API_BASE } from "../services/apiBase";
import {
  TopBarDescription,
  InstructionSidebar,
} from "../shared";

const FUNCTIONS = {
  1: { name: "f(t) = -5t² + 20t + 2", f: (x) => -5 * x * x + 20 * x + 2, defaultXs: [0, 1, 2, 3, 4, 5], domain: [0, 5], range: [0, 25], helperXs: [.5, 1.5,3.5] },
  2: { name: "f(x) = sin(x°)", f: (x) => Math.sin((x * Math.PI) / 180), defaultXs: [0, 60, 120, 180, 240, 300, 360], range: [-1.2, 1.2], domain: [0, 360], helperXs: [30, 90, 135] },
  3: { name: "f(x) = x³ − x", f: (x) => x ** 3 - x, defaultXs: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], domain: [-3, 3], range: [-10, 10], helperXs: [-2, 0, 2] },
  4: { name: "f(t) = ln(t)", f: (x) => (x > 0 ? Math.log(x) : NaN), defaultXs: [0.5, 0.8, 1, 1.5, 2, 3], domain: [0.1, 5], range: [-2.5, 2], helperXs: [0.25, 1, 2.5] },
  5: { name: "f(x) = 1 / (1 + x²)", f: (x) => 1 / (1 + x ** 2), defaultXs: [-3, -2, -1, 0, 1, 2], domain: [-5, 5], range: [0, 1.1], helperXs: [-2, 0, 2] },
};

function linspace(a, b, n = 300) {
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}

// --- UI helpers ---
const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-2xl border bg-white shadow-sm ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between px-4 py-3 border-b">
        {title ? <h3 className="text-sm font-semibold text-gray-800">{title}</h3> : <div />}
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </header>
    )}
    <div className="p-4 lg:p-6">{children}</div>
  </section>
);

const Button = ({ variant = "primary", className = "", ...props }) => {
  const base = "px-3 py-1 rounded-md text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
      : "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-300";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
};

export default function FunctionFivePoints() {
  const { code } = useParams();
  const questionId = parseInt(code?.split("_")[1], 10) || 1;
  const fn = FUNCTIONS[questionId] || FUNCTIONS[1];

  // DB-backed problem + instructions
  const [loading, setLoading] = useState(false);
  const [dbErr, setDbErr] = useState("");
  const [problem, setProblem] = useState("");
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setDbErr("");
        const res = await fetch(`${API_BASE}/exercises/by-code/${encodeURIComponent(code)}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const desc = data?.ProblemDescription ?? data?.problemDescription ?? data?.description ?? "";
        const instr = Array.isArray(data?.instructions)
          ? data.instructions
          : data?.instructions
          ? String(data.instructions).split(/\r?\n/).filter(Boolean)
          : [];
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
    return () => {
      alive = false;
    };
  }, [code]);

  const pointLabels = ["A", "B", "C", "D", "E", "F"];
  const [xs, setXs] = useState(Array(6).fill(""));
  const [helperInputs, setHelperInputs] = useState(["", "", ""]);

  useEffect(() => {
    setXs(fn.defaultXs.map((v) => String(v)));
    setHelperInputs(["", "", ""]);
  }, [questionId]);

  const parsedXs = xs.map((v) => (v === "" ? null : Number(v)));
  const lastFilledIndex = (() => {
    let k = -1;
    for (let i = 0; i < parsedXs.length; i++) {
      if (parsedXs[i] !== null && isFinite(parsedXs[i])) k = i;
      else break;
    }
    return k;
  })();

  const showHelperPoints = lastFilledIndex >= 5;
  const isClose = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;

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

  const onXChange = (i, val) => setXs((prev) => prev.map((x, j) => (j === i ? val : x)));

  return (
    <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
      {/* Problem description */}
      {/* Problem description (blue bar) */}
      {(problem || loading || dbErr) && (
        <TopBarDescription
          text={
            loading
              ? "Loading problem…"
              : dbErr
              ? `Could not load problem: ${dbErr}`
              : problem
          }
        />
      )}


      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-4 space-y-4">
            <Card title="Instructions">
              {steps?.length ? (
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                  {steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-gray-500">No instructions provided.</p>
              )}
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-8 space-y-6">
          {/* Compact controls in one row */}
          <Card
            title="Progressive Drawing of Function"
            action={
              <div className="flex items-center gap-2 flex-nowrap">
                <Button onClick={() => setXs(fn.defaultXs.map((v) => String(v)))}>Use sensible x’s</Button>
                <Button variant="secondary" onClick={() => setXs(Array(pointLabels.length).fill(""))}>
                  Clear
                </Button>
              </div>
            }
          >
            <div className="flex items-center justify-center gap-3 flex-nowrap">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Function:&nbsp;<code className="font-semibold">{fn.name}</code>
              </span>

              <div className="flex gap-1 flex-nowrap">
                {pointLabels.map((lab, i) => (
                  <input
                    key={lab}
                    type="number"
                    step="any"
                    value={xs[i]}
                    onChange={(e) => onXChange(i, e.target.value)}
                    placeholder={lab}
                    aria-label={`x${lab}`}
                    className="w-14 h-8 text-sm text-center rounded-md border border-gray-300 px-2 py-1
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Plot */}
          <Card>
            <div className="mx-auto w-full max-w-[860px]">
              <Plot
                data={[
                  ...(progCurve
                    ? [
                        {
                          x: progCurve.x,
                          y: progCurve.y,
                          mode: "lines",
                          line: { width: 3 },
                          name: "Drawn Curve",
                        },
                      ]
                    : []),
                  {
                    x: enteredPoints.map((p) => p.x),
                    y: enteredPoints.map((p) => p.y),
                    mode: "markers+text",
                    marker: { size: 10 },
                    text: enteredPoints.map((p) => p.label),
                    textposition: "top center",
                    name: "Points",
                  },
                  ...(showHelperPoints
                    ? [
                        {
                          x: helperMarkers.map((p) => p.x),
                          y: helperMarkers.map((p) => p.y),
                          mode: "markers+text",
                          marker: {
                            size: 12,
                            color: ["#7C3AED", "#7C3AED", "#7C3AED"],
                            symbol: ["square", "square", "square"],
                          },
                          text: helperMarkers.map((p) => p.label),
                          textposition: "top center",
                          name: "Helper Points",
                        },
                      ]
                    : []),
                ]}
                layout={{
                  title: "", // compact: the card already has a title
                  height: 380, // reduced height
                  margin: { l: 60, r: 20, t: 20, b: 40 }, // tighter margins
                  xaxis: {
                    title: fn.name.includes("sin") ? "x (degrees)" : "x",
                    range: fn.domain,
                    zeroline: true,
                    tickvals: fn.name.includes("sin") ? [0, 60, 120, 180, 240, 300, 360] : undefined,
                    ticktext: fn.name.includes("sin")
                      ? ["0°", "60°", "120°", "180°", "240°", "300°", "360°"]
                      : undefined,
                  },
                  yaxis: { title: "f(x)", range: fn.range, zeroline: true },
                  showlegend: false,
                  plot_bgcolor: "#fff",
                  paper_bgcolor: "rgba(0,0,0,0)",
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", maxWidth: "860px" }}
              />
            </div>

            {/* Helper inputs */}
            {showHelperPoints && (
              <div className="mt-3">
                <p className="text-center text-sm font-medium text-gray-700 mb-2">
                  Enter f(x) values for X, Y, Z
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {helperMarkers.map((pt, i) => {
                    const userVal = parseFloat(helperInputs[i]);
                    const trueVal = pt.y;
                    const ok = helperInputs[i] !== "" && !isNaN(userVal) && isClose(userVal, trueVal);
                    return (
                      <label key={pt.label} className="text-xs font-medium text-gray-600">
                        <span className="block mb-1 text-center">{pt.label}</span>
                        <input
                          type="number"
                          step="any"
                          value={helperInputs[i]}
                          onChange={(e) =>
                            setHelperInputs((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                          }
                          className={`w-20 text-center rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 ${
                            helperInputs[i] === ""
                              ? "border-gray-300 focus:ring-blue-400"
                              : ok
                              ? "border-green-500 bg-green-50 focus:ring-green-400"
                              : "border-red-500 bg-red-50 focus:ring-red-400"
                          }`}
                          placeholder={`f(${pt.x.toFixed(2)})`}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
