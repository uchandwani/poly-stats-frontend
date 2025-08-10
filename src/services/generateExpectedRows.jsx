export function generateExpectedRows({ classIntervals, frequencies, columns, statMeasure }) {
  const rows = [];

  let sumFi = 0;
  let sumFixi = 0;

  for (let i = 0; i < classIntervals.length; i++) {
    const ci = classIntervals[i];
    const [a, b] = ci.split("-").map(Number);
    const xi = Math.round((a + b) / 2);

    const fi = frequencies[i];
    const fixi = +(xi * fi).toFixed(2);

    sumFi += fi;
    sumFixi += fixi;

    rows.push({ ci, fi, xi, fixi }); // basic structure
  }
  
  console.log("The stats values calculated using", sumFi, sumFixi);
  const mean = +(sumFixi / sumFi).toFixed(2);

  // Add SD-specific fields
  if (statMeasure === "StandardDeviation") {
    rows.forEach((row, i) => {
      const diff = row.xi - mean;
      const squaredDiff = +(diff * diff).toFixed(2);
      const fiSquaredDiff = +(squaredDiff * row.fi).toFixed(2);
      rows[i].squaredDiff = squaredDiff;
      rows[i].fiSquaredDiff = fiSquaredDiff;
    });
  } else if (statMeasure === "MeanDeviation") {
    rows.forEach((row, i) => {
      const absDiff = +(Math.abs(row.xi - mean)).toFixed(2);
      const fiAbsDiff = +(absDiff * row.fi).toFixed(2);
      rows[i].absDiff = absDiff;
      rows[i].fiAbsDiff = fiAbsDiff;
    });
  }

  return rows;
}
