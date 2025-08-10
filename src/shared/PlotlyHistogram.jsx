import Plot from "react-plotly.js";

export default function PlotlyHistogram({ data, showStatsLines, mean, stdDev, colorMap }) {
  if (!data || data.length === 0) return null;

  const xLabels = data.map(d => d.range);
  const xMidpoints = data.map(d => d.xi);
  const yValues = data.map(d => d.count);
  const peak = Math.max(...yValues);

  // Safe defaults
  const hasValidStats = typeof mean === "number" && typeof stdDev === "number" && !isNaN(mean) && !isNaN(stdDev);

  const meanLine = hasValidStats && {
    type: 'line',
    x0: mean,
    x1: mean,
    y0: 0,
    y1: peak + 1,
    line: {
      color: 'red',
      width: 2,
      dash: 'dash'
    }
  };

  const stdDevArea = hasValidStats && {
    type: 'rect',
    x0: mean - stdDev,
    x1: mean + stdDev,
    y0: 0,
    y1: peak + 1,
    fillcolor: 'green',
    opacity: 0.2,
    line: { width: 0 }
  };

  const normalX = [];
  const normalY = [];
  if (hasValidStats) {
    const steps = 100;
    const minX = Math.min(...xMidpoints);
    const maxX = Math.max(...xMidpoints);
    for (let i = 0; i < steps; i++) {
      const x = minX + ((maxX - minX) * i) / steps;
      const y = peak * Math.exp(-(Math.pow(x - mean, 2)) / (2 * Math.pow(stdDev, 2)));
      normalX.push(x);
      normalY.push(y);
    }
  }

  const layout = {
    margin: { t: 10, b: 60, r: 10, l: 40 },
    xaxis: {
      title: "Marks",
      tickvals: xMidpoints,
      ticktext: xLabels,
      tickangle: -45,
    },
    yaxis: { title: "Frequency" },
    legend: {
      x: 0,
      xanchor: "left",
      y: 1.1,
      orientation: "v",
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
              font: { size: 10, color: "red" }
            },
            {
              x: mean + stdDev / 2,
              y: peak,
              text: `±1 Std Dev: ${stdDev.toFixed(2)}`,
              showarrow: false,
              font: { size: 10, color: "green" }
            }
          ]
        : [],
    showlegend: true,
  };

  return (
    <div className="w-full">
      <Plot
        data={[
          {
            type: "bar",
            x: xMidpoints,
            y: yValues,
            marker: {
              color: xLabels.map(label => colorMap?.[label] || "#8884d8"),
              opacity: 0.8,
              line: { width: 1, color: "black" }
            },
            name: "Frequency",
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
