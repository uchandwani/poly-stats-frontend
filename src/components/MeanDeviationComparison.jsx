import { useState, useMemo } from "react";
import PlotlyHistogram from "./PlotlyHistogram";

export default function MeanDeviationComparison() {
  const [intervalSize] = useState(10);
  const markMin = 15;
  const markMax = 95;
  const studentCount = 100;
  const [studentNote, setStudentNote] = useState("");

 const tightMarks = useMemo(() => {
  const intervals = [
    [15, 25], [25, 35], [35, 45], [45, 55],
    [55, 65], [65, 75], [75, 85], [85, 95]
  ];

  // ✅ Carefully hand-tuned frequencies — total = 100
  const frequencies = [4, 6, 14, 28, 22, 14, 8, 4]; // SUM = 100 ✅

  const marks = [];
  for (let i = 0; i < intervals.length; i++) {
    const [min, max] = intervals[i];
    const count = frequencies[i];
    for (let j = 0; j < count; j++) {
      marks.push(Math.floor(Math.random() * (max - min)) + min);
    }
  }

  return marks;
}, []);




  // 🎯 Widely Spread: Even across full class intervals
  const wideMarks = useMemo(() => {
  const ranges = [
    [15, 25], [25, 35], [35, 45], [45, 55],
    [55, 65], [65, 75], [75, 85], [85, 95],
  ];

  const spread = [];

  // Add 11–14 marks randomly to each interval
  ranges.forEach(([min, max]) => {
    const count = 11 + Math.floor(Math.random() * 4); // 11,12,13,14
    spread.push(...Array.from({ length: count }, () =>
      Math.floor(Math.random() * (max - min)) + min
    ));
  });

  return spread.slice(0, 100); // Trim to exact total if over
}, []);


  const generateStats = (allMarks) => {
    const intervals = [];
    for (let i = markMin; i < markMax; i += intervalSize) {
      intervals.push(`${i}-${i + intervalSize}`);
    }

    const xi = intervals.map(range => {
      const [a, b] = range.split("-").map(Number);
      return (a + b) / 2;
    });

    const fi = intervals.map((range, i) => {
      const [min, max] = range.split("-").map(Number);
      return allMarks.filter(mark =>
        i === intervals.length - 1 ? mark >= min && mark <= max : mark >= min && mark < max
      ).length;
    });

    const sumFi = fi.reduce((a, b) => a + b, 0);
    const sumFixi = fi.reduce((sum, f, i) => sum + f * xi[i], 0);
    const mean = sumFixi / sumFi;
    const sumFiAbsDiff = fi.reduce((sum, f, i) => sum + f * Math.abs(xi[i] - mean), 0);
    const meanDev = sumFiAbsDiff / sumFi;
    const variance = fi.reduce((sum, f, i) => sum + f * Math.pow(xi[i] - mean, 2), 0) / sumFi;
    const stdDev = Math.sqrt(variance);

    const tableData = intervals.map((range, i) => ({
      range,
      xi: xi[i],
      fi: fi[i],
      fixi: xi[i] * fi[i],
      absDiff: Math.abs(xi[i] - mean),
      fiAbsDiff: fi[i] * Math.abs(xi[i] - mean),
    }));

    return {
      intervals,
      tableData,
      mean,
      stdDev,
      meanDev,
      histogramData: tableData.map(({ range, xi, fi }) => ({ range, xi, count: fi }))
    };
  };

  const tightData = useMemo(() => generateStats(tightMarks), [tightMarks]);
  const wideData = useMemo(() => generateStats(wideMarks), [wideMarks]);

  const colorPalette = [
    "#f9f9f9", "#e0f2f1", "#e1f5fe", "#f3e5f5", "#fff9c4",
    "#ffe0b2", "#c8e6c9", "#dcedc8", "#f8bbd0", "#d1c4e9"
  ];

  const getColorMap = (intervals) =>
    intervals.reduce((map, interval, index) => {
      map[interval] = colorPalette[index % colorPalette.length];
      return map;
    }, {});

  const tightColorMap = getColorMap(tightData.intervals);
  const wideColorMap = getColorMap(wideData.intervals);

  const renderProblemTable = (tableData, color, title) => (
  <div className="mb-6 w-full overflow-x-auto">
    <h3
      className={`text-center font-semibold mb-2 ${
        color === "blue" ? "text-blue-700" : "text-red-600"
      }`}
    >
      {title}
    </h3>
    <table className="text-sm border border-collapse w-full text-center">
      <thead>
        <tr className={color === "blue" ? "bg-blue-50" : "bg-red-50"}>
          <th className="border px-2 py-1">C.I →</th>
          {tableData.map((row, i) => (
            <th key={`ci-${i}`} className="border px-2 py-1">
              {row.range}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border px-2 py-1 font-semibold">fᵢ</td>
          {tableData.map((row, i) => (
            <td key={`fi-${i}`} className="border px-2 py-1">
              {row.fi}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);


  const renderComputationTable = (tableData, colorMap) => (
    <table className="text-sm border border-collapse w-full text-center mb-4">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">C.I</th>
          <th className="border px-2 py-1">xᵢ</th>
          <th className="border px-2 py-1">fᵢ</th>
          <th className="border px-2 py-1">fᵢxᵢ</th>
          <th className="border px-2 py-1">|xᵢ − x̄|</th>
          <th className="border px-2 py-1">fᵢ·|xᵢ − x̄|</th>
        </tr>
      </thead>
      <tbody>
        {tableData.map((row, i) => (
          <tr key={i}>
            <td className="border px-2 py-1" style={{ backgroundColor: colorMap[row.range] }}>{row.range}</td>
            <td className="border px-2 py-1">{row.xi}</td>
            <td className="border px-2 py-1">{row.fi}</td>
            <td className="border px-2 py-1">{row.fixi}</td>
            <td className="border px-2 py-1">{row.absDiff.toFixed(2)}</td>
            <td className="border px-2 py-1">{row.fiAbsDiff.toFixed(2)}</td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-semibold">
          <td className="border">Σ</td>
          <td className="border"></td>
          <td className="border">{tableData.reduce((sum, r) => sum + r.fi, 0)}</td>
          <td className="border">{tableData.reduce((sum, r) => sum + r.fixi, 0)}</td>
          <td className="border"></td>
          <td className="border">{tableData.reduce((sum, r) => sum + r.fiAbsDiff, 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">📊 Maths Marks Comparison: Class A vs Class B</h1>

      {/* Problem Overview */}
      <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-yellow-900">📘 Problem Statement</h2>
        <ul className="list-disc list-inside text-sm text-gray-800">
          <li>A teacher has two sections of Class 11. </li>
         <li>She wants to award a certificate of excellence to the most consistent section based on Mathematics test scores.</li>
         <li>Which section should be awarded based on performance and consistency? Explain..</li>
        </ul>
      </div>

      {/* Dual Column Layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* TIGHT */}
        <div>
          <h2 className="text-lg font-semibold text-center text-blue-600 mb-2">Class A Maths Marks Distribution</h2>
          {renderProblemTable(tightData.tableData, "blue")}
          {renderComputationTable(tightData.tableData, tightColorMap)}
          <PlotlyHistogram
            data={tightData.histogramData}
            showStatsLines={true}
            mean={tightData.mean}
            stdDev={tightData.stdDev}
            colorMap={tightColorMap}
          />
        </div>

        {/* WIDE */}
        <div>
          <h2 className="text-lg font-semibold text-center text-red-600 mb-2">Class B Maths Marks Distribution</h2>
          {renderProblemTable(wideData.tableData, "red")}
          {renderComputationTable(wideData.tableData, wideColorMap)}
          <PlotlyHistogram
            data={wideData.histogramData}
            showStatsLines={true}
            mean={wideData.mean}
            stdDev={wideData.stdDev}
            colorMap={wideColorMap}
          />
        </div>
      </div>

      {/* Student Analysis */}
      <div className="mt-10 max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold mb-2 text-center">
          ✍️ Student Analysis: Compare the Two Datasets
        </h3>
        <textarea
          value={studentNote}
          onChange={(e) => setStudentNote(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring focus:border-blue-400"
          placeholder="Write your comparison — which dataset is more consistent, and why?"
        />
      </div>
    </div>
  );
}
