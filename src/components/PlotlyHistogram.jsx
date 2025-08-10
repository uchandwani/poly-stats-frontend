import Plot from "react-plotly.js";

export default function PlotlyHistogram({ data, showStatsLines, mean, stdDev, colorMap }) {
  if (!data || data.length === 0) return null;

  const xLabels = data.map(d => String(d.range));   // category labels
  const xMidpoints = data.map(d => Number(d.xi));   // for stats only
  const yValues = data.map(d => d.count);
  const peak = Math.max(...yValues);

  const hasValidStats =
    typeof mean === "number" &&
    typeof stdDev === "number" &&
    !isNaN(mean) &&
    !isNaN(stdDev);

  // Optional mean line
  const meanLine = hasValidStats && {
    type: "line",
    x0: mean,
    x1: mean,
    y0: 0,
    y1: peak + 1,
    line: { color: "red", width: 2, dash: "dash" },
  };

  // Optional std deviation shaded region
  const stdDevArea = hasValidStats && {
    type: "rect",
    x0: mean - stdDev,
    x1: mean + stdDev,
    y0: 0,
    y1: peak + 1,
    fillcolor: "green",
    opacity: 0.2,
    line: { width: 0 },
  };

  // Optional normal curve
  const normalX = [];
  const normalY = [];
  if (hasValidStats) {
    const steps = 100;
    const minX = Math.min(...xMidpoints);
    const maxX = Math.max(...xMidpoints);
    for (let i = 0; i < steps; i++) {
      const x = minX + ((maxX - minX) * i) / steps;
      const y = peak * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
      normalX.push(x);
      normalY.push(y);
    }
  }

  const layout = {

    title: {
    text: "Frequency Chart",   // Chart title text
    font: { size: 16, color: "#333" },
    x: 0.5,                    // center it horizontally (0 = left, 1 = right)
    xanchor: "center"
  },
  margin: { t: 50, b: 60, r: 10, l: 40 }, // increase top margin for title
  xaxis: {
    title: "Marks",
    type: "category",
    tickangle: -45,
  },
       // Remove "Frequency" axis title if you don't want it anymore
    yaxis: { title: "" },
    // Only show a legend if the normal curve is drawn
    showlegend: !!(showStatsLines && hasValidStats),
    legend: {
      x: 0,
      xanchor: "left",
      y: 1.1,
      orientation: "v",
      bgcolor: "rgba(255,255,255,0.7)",
      borderwidth: 0,
    },
    shapes: showStatsLines && hasValidStats ? [meanLine, stdDevArea] : [],
    annotations:
      showStatsLines && hasValidStats
        ? [
            {
              x: mean,
              y: -1,
              text: `Mean: ${mean.toFixed(2)}`,
              showarrow: false,
              font: { size: 10, color: "red" },
            },
            {
              x: mean + stdDev / 2,
              y: peak,
              text: `±1 Std Dev: ${stdDev.toFixed(2)}`,
              showarrow: false,
              font: { size: 10, color: "green" },
            },
          ]
        : [],
  };

  return (
    <div className="w-full">
      <Plot
        data={[
          {
            type: "bar",
            x: xLabels,
            y: yValues,
            width: 0.8,
            marker: {
              color: xLabels.map(label => colorMap?.[label] || "#8884d8"),
              opacity: 0.9,
              line: { width: 1, color: "black" },
            },
            // 🔹 Show the bar values inside the bars
            text: yValues.map(v => String(v)),
            texttemplate: "%{text}",
            textposition: "inside",
            insidetextanchor: "middle",
            textfont: { size: 12, color: "black" }, // your colors are light, so black reads well
            // 🔹 Remove "Frequency" from legend
            showlegend: false,
            hovertemplate: "Marks: %{x}<br>Count: %{y}<extra></extra>",
            name: "Frequency", // name kept for hover but hidden from legend
          },
          ...(showStatsLines && hasValidStats
            ? [
                {
                  type: "scatter",
                  mode: "lines",
                  x: normalX,
                  y: normalY,
                  name: "Normal Curve",
                  line: { color: "orange", width: 2 },
                  hovertemplate: "x: %{x:.2f}<br>y: %{y:.2f}<extra></extra>",
                },
              ]
            : []),
        ]}
        layout={layout}
        style={{ width: "100%", height: "260px" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
}
