import React, { useState } from "react";
import Plot from "react-plotly.js";

// Define the mathematical function here
const mathFunction = (x) => x ** 2 + 3 * x - 7;

// X-values to ask students about
const promptXs = [2, 5, 6];

export default function FunctionPlotter() {
  const [studentAnswers, setStudentAnswers] = useState({});
  const [feedback, setFeedback] = useState({});

  const handleChange = (x, value) => {
    const num = Number(value);
    setStudentAnswers((prev) => ({
      ...prev,
      [x]: value,
    }));

    if (!isNaN(num)) {
      const correct = mathFunction(x);
      const isCorrect = Math.abs(num - correct) < 1e-2;
      setFeedback((prev) => ({
        ...prev,
        [x]: isCorrect ? "✅ Correct" : `❌ Incorrect (Ans: ${correct})`,
      }));
    } else {
      setFeedback((prev) => ({
        ...prev,
        [x]: "❌ Invalid number",
      }));
    }
  };

  // Generate points for graph
  const xValues = Array.from({ length: 50 }, (_, i) => i - 10);
  const yValues = xValues.map(mathFunction);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        Plot: <code>f(x) = x² + 3x − 7</code>
      </h2>

      <Plot
        data={[
          {
            x: xValues,
            y: yValues,
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "blue" },
            name: "f(x)",
          },
        ]}
        layout={{
          title: "Graph of f(x) = x² + 3x − 7",
          xaxis: { title: "x", zeroline: false },
          yaxis: { title: "f(x)", zeroline: false },
          autosize: true,
          height: 400,
        }}
        config={{ responsive: true }}
      />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Enter f(x) values for:</h3>
        {promptXs.map((x) => (
          <div key={x} className="mb-2">
            <label className="mr-2">x = {x}:</label>
            <input
              type="number"
              value={studentAnswers[x] || ""}
              onChange={(e) => handleChange(x, e.target.value)}
              className="border px-2 py-1 w-24 mr-2"
            />
            <span className="text-sm">
              {feedback[x] && <em>{feedback[x]}</em>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
