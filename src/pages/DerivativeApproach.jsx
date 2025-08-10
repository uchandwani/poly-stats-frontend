import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";

const derivativeFunctions = {
  1: {
    name: "f(x) = x²",
    func: (x) => x ** 2,
    x0: 6,
    xOptions: [6, 7, 8],
    color: "blue",
    yRange: [-20, 150],            // 👈 per-function Y range
  },
  2: {
    name: "f(x) = sin(x)",
    func: (x) => Math.sin(x),
    x0: Math.PI / 6,
    xOptions: [Math.PI / 2, Math.PI / 4, Math.PI / 3],
    color: "green",
    yRange: [-1.5, 1.5],        // 👈 per-function Y range
  },
  3: {
    name: "f(x) = x³ − x",
    func: (x) => x ** 3 - x,
    x0: 1,
    color: "purple",
    yRange: [-10, 80],          // 👈 per-function Y range
  },
  4: {
    name: "f(x) = ln(x)",
    func: (x) => (x > 0 ? Math.log(x) : NaN),
    x0: 1,
    color: "orange",
    domainCheck: (x) => x > 0,
    yRange: [-3, 3],            // 👈 per-function Y range
  },
};

// fixed plot window
const X_MIN = -2;
const X_MAX = 12;
const N = 400;

export default function DerivativeApproach({ questionId = 1 }) {
  const [currentQn, setCurrentQn] = useState(questionId);
  const fn = derivativeFunctions[currentQn];

  // base x0
  const [xBase, setXBase] = useState(fn.x0);

  // dual-handle ranges (both start fully away from center)
  const HMAX = 3;
  const [leftDist, setLeftDist] = useState(HMAX);   // distance from x0 to the LEFT (h = -leftDist)
  const [rightDist, setRightDist] = useState(HMAX); // distance from x0 to the RIGHT (h = +rightDist)
  const [activeSide, setActiveSide] = useState("right"); // "left" | "right"

  // animated h we draw with
  const [viewH, setViewH] = useState(HMAX);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);

  function stopAnim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = 0;
  }

  // reset when question changes
  useEffect(() => {
    const nextX0 = derivativeFunctions[currentQn].x0;
    setXBase(nextX0);
    setLeftDist(HMAX);
    setRightDist(HMAX);
    setActiveSide("right");
    setViewH(HMAX);
    stopAnim();
  }, [currentQn]);

  function onChooseX0(v) {
    setXBase(v);
    setLeftDist(HMAX);
    setRightDist(HMAX);
    setActiveSide("right");
    setViewH(HMAX);
    stopAnim();
  }

  const isSin = currentQn === 2;
  const isLn = currentQn === 4;
  const x0 = xBase;

  // plot-bound caps so the probe point stays within [X_MIN, X_MAX]
  const plotLeftCap = Math.max(0, x0 - X_MIN);
  const plotRightCap = Math.max(0, X_MAX - x0);

  // ln(x): additionally require x1 > 0 (keep a tiny margin)
  const lnLeftCap = isLn ? Math.max(0, x0 - 0.05) : HMAX;

  const maxLeftAllowed = Math.min(HMAX, plotLeftCap, lnLeftCap);
  const maxRightAllowed = Math.min(HMAX, plotRightCap);

  // clamp sliders any time caps change
  useEffect(() => {
    setLeftDist((d) => Math.min(d, maxLeftAllowed));
    setRightDist((d) => Math.min(d, maxRightAllowed));
  }, [maxLeftAllowed, maxRightAllowed]);

  // target h from the active side (0 at center → increases outward)
  const targetH =
    activeSide === "left"
      ? -Math.min(leftDist, maxLeftAllowed)
      : Math.min(rightDist, maxRightAllowed);

  // animate viewH → targetH
  useEffect(() => {
    stopAnim();
    const SPEED = 6.0;
    const EPS = 1e-4;

    function step(ts) {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      setViewH((prev) => {
        const diff = targetH - prev;
        const delta = Math.sign(diff) * Math.min(Math.abs(diff), SPEED * dt);
        const next = prev + delta;
        if (Math.abs(targetH - next) < EPS) {
          stopAnim();
          return targetH;
        }
        rafRef.current = requestAnimationFrame(step);
        return next;
      });
    }

    rafRef.current = requestAnimationFrame(step);
    return stopAnim;
  }, [targetH]);

  // function + drawing data
  const f = fn.func;
  const h = viewH;
  const x1 = x0 + h;
  const y0 = f(x0);
  const y1 = f(x1);
  const slope = (y1 - y0) / (x1 - x0);
  const secantLine = (x) => y0 + slope * (x - x0);

  const tangentThreshold = 0.1;

  // sample curve on the fixed [0,8] window
  const xVals = Array.from({ length: N }, (_, i) => X_MIN + (i * (X_MAX - X_MIN)) / (N - 1));
  const yVals = xVals.map((x) => (fn.domainCheck && !fn.domainCheck(x) ? NaN : f(x)));
  const secantY = xVals.map((x) => (fn.domainCheck && !fn.domainCheck(x) ? NaN : secantLine(x)));

  // fallback y-range if a function doesn't specify yRange
  const finiteYs = yVals.filter((v) => Number.isFinite(v));
  const yMinFinite = finiteYs.length ? Math.min(...finiteYs) : -1;
  const fallbackYRange = isSin ? [-1.5, 1.5] : [yMinFinite - 1, 50];

  // 🟢 Use per-function yRange when provided
  const yRange = fn.yRange ?? fallbackYRange;

  // helper slope table
  const slopePoints = [x0 + 1, x0 + 0.5, x0 + 0.1];
  const [studentSlopes, setStudentSlopes] = useState({ X: "", Y: "", Z: "" });
  const slopeData = slopePoints.map((x, i) => ({ x, y: f(x), label: ["X", "Y", "Z"][i] }));

  // only one slider active at a time; unlock when the other returns to 0
  const leftDisabled = activeSide === "right" && rightDist > 0;
  const rightDisabled = activeSide === "left" && leftDist > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-screen-xl mx-auto">
      {/* LEFT: plot + controls */}
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-2 text-center">Visualizing Derivative as Tangent Line</h2>
        <p className="text-center mb-1">
          Function: <code>{fn.name}</code> at x = {x0.toFixed(4)}
        </p>
        <p className="text-center mb-3">
          Δx = {h.toFixed(4)}, Slope ≈ {isNaN(slope) ? "∞" : slope.toFixed(4)}
        </p>

        {/* choose x0 if options */}
        {Array.isArray(fn.xOptions) && fn.xOptions.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm font-medium">Choose base x₀:</span>
            {fn.xOptions.map((v) => (
              <button
                key={v}
                onClick={() => onChooseX0(v)}
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  x0 === v ? "bg-blue-600 text-white" : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                x₀ = {Number.isFinite(v) ? v.toFixed(2) : v}
              </button>
            ))}
          </div>
        )}

        {/* Adjacent half-sliders with center seam at x0 */}
        <div className="my-4">
          <div className="relative w-full">
            <div className="flex items-center">
              {/* Left half (red) - flipped so 0 is at the seam */}
              <div className="w-1/2 pr-2">
                <input
                  type="range"
                  min={0}
                  max={maxLeftAllowed}
                  step="0.001"
                  value={leftDist}
                  onChange={(e) => {
                    const v = Math.min(parseFloat(e.target.value), maxLeftAllowed);
                    setLeftDist(v);
                    setActiveSide("left");
                  }}
                  disabled={leftDisabled}
                  className="w-full accent-red-600"
                  style={{ transform: "scaleX(-1)" }}
                  aria-label="Left Δx from x0"
                />
              </div>

              <div className="w-px h-6 bg-gray-400" aria-hidden />

              {/* Right half (blue) - normal so 0 is at the seam */}
              <div className="w-1/2 pl-2">
                <input
                  type="range"
                  min={0}
                  max={maxRightAllowed}
                  step="0.001"
                  value={rightDist}
                  onChange={(e) => {
                    const v = Math.min(parseFloat(e.target.value), maxRightAllowed);
                    setRightDist(v);
                    setActiveSide("right");
                  }}
                  disabled={rightDisabled}
                  className="w-full accent-blue-600"
                  aria-label="Right Δx from x0"
                />
              </div>
            </div>

            <div className="mt-1 flex justify-between text-xs text-gray-600">
              <span>{X_MIN}</span>
              <span>center (x₀)</span>
              <span>{X_MAX}</span>
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Active: <b>{activeSide}</b> • Left Δx = {(-Math.min(leftDist, maxLeftAllowed)).toFixed(3)} • Right Δx = {rightDist.toFixed(3)} • Drawn Δx = {h.toFixed(3)}
              {isLn && <span> — ln(x): left limited so x₁ &gt; 0</span>}
            </div>
          </div>
        </div>

        <Plot
          data={[
            { x: xVals, y: yVals, type: "scatter", mode: "lines", name: fn.name, line: { color: fn.color } },
            {
              x: xVals,
              y: secantY,
              type: "scatter",
              mode: "lines",
              name: Math.abs(h) <= tangentThreshold ? "Tangent Line" : "Secant Line",
              line: { color: Math.abs(h) <= tangentThreshold ? "green" : "red", dash: Math.abs(h) <= tangentThreshold ? "solid" : "dashdot", width: 3 },
            },
            { x: [x0, x1], y: [y0, y1], type: "scatter", mode: "markers", name: "Points", marker: { size: 10, color: "blue" }, text: ["A", "B"], textposition: "bottom center" },
            ...(Math.abs(h) > tangentThreshold
              ? [
                  { x: [x0, x1], y: [y0, y0], type: "scatter", mode: "lines", line: { color: "blue", dash: "dot", width: 1 }, hoverinfo: "skip", showlegend: false },
                  { x: [x1, x1], y: [y0, y1], type: "scatter", mode: "lines", line: { color: "blue", dash: "dot", width: 1 }, hoverinfo: "skip", showlegend: false },
                ]
              : []),
            // Tangent helper triangle (Δx = 1) on the approached side
            ...(Math.abs(h) <= tangentThreshold
              ? (() => {
                  const m = slope;
                  const dxFixed = 1;
                  const useLeft = h < 0 || activeSide === "left";
                  const xStart = useLeft ? x0 - dxFixed : x0;
                  const xEnd   = useLeft ? x0 : x0 + dxFixed;
                  const yStart = f(xStart);
                  const dyFixed = m * dxFixed;
                  const yEnd = yStart + dyFixed;
                  return [
                    {
                      x: [xStart, xEnd],
                      y: [yStart, yStart],
                      type: "scatter",
                      mode: "lines+text",
                      line: { color: "green", dash: "dot", width: 2 },
                      text: [`Δx = ${dxFixed.toFixed(2)}`],
                      textposition: useLeft ? "bottom left" : "bottom right",
                      showlegend: false,
                      hoverinfo: "skip",
                    },
                    {
                      x: [xEnd, xEnd],
                      y: [yStart, yEnd],
                      type: "scatter",
                      mode: "lines+text",
                      line: { color: "green", dash: "dot", width: 2 },
                      text: [`Δy = ${dyFixed.toFixed(2)}`],
                      textposition: "middle right",
                      showlegend: false,
                      hoverinfo: "skip",
                    },
                  ];
                })()
              : []),
          ]}
          layout={{
            autosize: false,
            height: 450,
            width: 700,
            margin: { l: 60, r: 20, t: 20, b: 40 },
            xaxis: {
              title: "x",
              zeroline: false,
              gridcolor: "#cccccc",
               linecolor: "#000",    // border color
              linewidth: 2,         // border thickness
              mirror: true,          // mirror the line on t
              range: [X_MIN, X_MAX],
              tickvals: Array.from({ length: X_MAX - X_MIN + 1 }, (_, i) => X_MIN + i),
              ticktext: Array.from({ length: X_MAX - X_MIN + 1 }, (_, i) => String(X_MIN + i)),
            },
            yaxis: { title: "f(x)", zeroline: false, range: yRange , gridcolor: "#cccccc", linecolor: "#000", linewidth: 2, mirror: true,    }, // 👈 uses per-function yRange
            showlegend: false,
            annotations:
              Math.abs(h) > tangentThreshold
                ? [
                    { x: x0, y: y0, text: "A(x)", showarrow: false, font: { size: 12 }, xshift: -20, yshift: 15 },
                    { x: x1, y: y1, text: "B(x′)", showarrow: false, font: { size: 12 }, xshift: 20, yshift: 15 },
                    { x: (x0 + x1) / 2, y: y0, text: `Δx = ${(x1 - x0).toFixed(2)}`, showarrow: false, font: { size: 12 }, yshift: -25 },
                    { x: x1, y: (y0 + y1) / 2, text: `Δy = ${(y1 - y0).toFixed(2)}`, showarrow: false, font: { size: 12 }, xshift: 30 },
                  ]
                : [],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", maxWidth: "650px" }}
        />
      </div>

      {/* RIGHT: formulas + small table */}
      <div className="flex flex-col items-start w-full lg:w-64">
        <div className="text-sm text-gray-700 leading-tight border p-3 rounded bg-white shadow-sm w-full mb-3">
          <div><strong>f(x₀)</strong> = {y0.toFixed(4)}</div>
          <div><strong>f(x₀ + Δx)</strong> = {y1.toFixed(4)}</div>
          <div><strong>Left Δx</strong> = {(-Math.min(leftDist, maxLeftAllowed)).toFixed(4)}</div>
          <div><strong>Right Δx</strong> = {rightDist.toFixed(4)}</div>
          <div><strong>Δx (drawing)</strong> = {h.toFixed(4)}</div>
          <div>Slope ≈ [f(x₀ + Δx) − f(x₀)] / Δx</div>
          <div>≈ [{y1.toFixed(4)} − {y0.toFixed(4)}] / {h.toFixed(4)}</div>
          <div>= <strong>{isFinite(slope) ? slope.toFixed(4) : "∞"}</strong></div>
        </div>

        <h3 className="text-lg font-semibold mb-2 text-center w-full">Estimate Slopes</h3>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Point</th>
              <th className="border px-2 py-1">x</th>
              <th className="border px-2 py-1">Slope</th>
            </tr>
          </thead>
          <tbody>
            {slopeData.map((pt) => (
              <tr key={pt.label}>
                <td className="border px-2 py-1">{pt.label}</td>
                <td className="border px-2 py-1">{pt.x.toFixed(2)}</td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={studentSlopes[pt.label]}
                    onChange={(e) => setStudentSlopes((prev) => ({ ...prev, [pt.label]: e.target.value }))}
                    className="w-full px-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 w-full flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((qn) => (
            <button
              key={qn}
              onClick={() => setCurrentQn(qn)}
              className={`flex-1 py-1 px-3 rounded text-white text-sm font-semibold ${currentQn === qn ? "bg-blue-600" : "bg-gray-500"} hover:bg-blue-700 transition`}
            >
              Q{qn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
