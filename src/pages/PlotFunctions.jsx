// PlotQuadratic.jsx
import React from "react";
import Plot from "react-plotly.js";

const PlotQuadratic = () => {
  // Generate x values from -10 to 10
  const xValues = Array.from({ length: 201 }, (_, i) => -10 + i * 0.1);
  const yValues = xValues.map(x => x * x + 3 * x + 10); // f(x) = x² + 3x + 10

  return (
    <Plot
      data={[
        {
          x: xValues,
          y: yValues,
          type: "scatter",
          mode: "lines",
          marker: { color: "blue" },
          name: "f(x) = x² + 3x + 10"
        }
      ]}
      layout={{
        title: "Graph of f(x) = x² + 3x + 10",
        xaxis: { title: "x" },
        yaxis: { title: "f(x)" },
        autosize: true
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default PlotQuadratic;
