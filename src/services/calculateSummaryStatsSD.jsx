export function calculateSummaryStats(rows, statMeasure = "MeanDeviation") {
  let sumFi = 0, sumFixi = 0;

  rows.forEach(row => {
    sumFi += +row.fi;
    sumFixi += +row.fixi;
  });

  const mean = +(sumFixi / sumFi).toFixed(2);

  if (statMeasure === "StandardDeviation") {
    let sumFiSquaredDiff = 0;
    rows.forEach(row => {
      sumFiSquaredDiff += +row.fiSquaredDiff || 0;
    });
    const variance = +(sumFiSquaredDiff / sumFi).toFixed(2);
    const sd = +Math.sqrt(variance).toFixed(2);

    return { sumFixi, mean, sumFiSquaredDiff, sd };
  }

  // Default: MeanDeviation
  let sumFiAbsDiff = 0;
  rows.forEach(row => {
    sumFiAbsDiff += +row.fiAbsDiff || 0;
  });

  return { sumFixi, mean, sumFiAbsDiff };
}
