// Utility to generate raw data with uniform or normal distribution
export function generateRawData({
  count = 100,
  min = 0,
  max = 100,
  distribution = 'uniform',
  decimalPlaces = 0,
}) {
  const data = [];

  for (let i = 0; i < count; i++) {
    let value;

    if (distribution === 'uniform') {
      value = Math.random() * (max - min) + min;
    } else if (distribution === 'normal') {
      // Box-Muller transform to generate a normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const stdNorm = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      value = stdNorm * (max - min) / 6 + (min + max) / 2;
    }

    value = +value.toFixed(decimalPlaces);
    data.push(value);
  }

  return data;
}

// Utility to group raw data into class intervals
export function groupDataIntoIntervals(data, { intervalSize = 10 }) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("groupDataIntoIntervals: Invalid or empty data array.");
    return { classIntervals: [], frequencies: [] };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const start = Math.floor(min / intervalSize) * intervalSize;
  const end = Math.ceil(max / intervalSize) * intervalSize;

  const classIntervals = [];
  const frequencies = [];

  for (let i = start; i < end; i += intervalSize) {
    const label = `${i}-${i + intervalSize}`;
    const count = data.filter(val => val >= i && val < i + intervalSize).length;
    classIntervals.push(label);
    frequencies.push(count);
  }

  return { classIntervals, frequencies };
}

// Combines raw data generation and grouping
export function generateGroupedDataFromConfig({
  count = 100,
  min = 0,
  max = 100,
  distribution = 'uniform',
  intervalSize = 10,
  decimalPlaces = 0,
}) {
  const rawData = generateRawData({ count, min, max, distribution, decimalPlaces });
  const { classIntervals, frequencies } = groupDataIntoIntervals(rawData, { intervalSize });

  return {
    rawData,
    classIntervals,
    frequencies,
    tableColumns: ['x', 'f'],  // Optional default
  };
}
