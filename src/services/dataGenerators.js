
export function generateClassData(generate) {
  const { min = 10, max = 100, interval = 10, count = 5, totalFrequency = 100 } = generate;

  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    typeof interval !== "number" ||
    typeof count !== "number"
  ) {
    console.warn("⚠️ Invalid 'generate' config:", generate);
    return [];
  }

  const data = [];

  // Random weights to distribute frequency proportionally
  const weights = Array.from({ length: count }, () => Math.random());
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < count; i++) {
    const lower = min + i * interval;
    const upper = lower + interval;

    const fi = Math.round((weights[i] / totalWeight) * totalFrequency);

    data.push({
      class: [lower, upper], // e.g., [10, 20]
      fi
    });
  }

  console.log("📊 Generated Grouped Class Data:", data);
  return data;
}


/**
 * Generate single value xi data with frequencies summing to a target total.
 * @param {Object} options
 * @param {number} options.min - Minimum xi value (inclusive)
 * @param {number} options.max - Maximum xi value (inclusive)
 * @param {number} [options.count=6] - Number of xi values to generate
 * @param {number} [options.totalFrequency=100] - Total of all frequencies
 * @returns {{ intervals: number[], freqs: number[] }}
 */
export function generateSingleData({ min, max, count = 6, totalFrequency = 100 }, statMeasure = "") {
  console.log("🔧 generateSingleData() called with:", { min, max, count, totalFrequency, statMeasure });


  if (typeof min !== "number" || typeof max !== "number" || typeof count !== "number" || typeof totalFrequency !== "number") {
  console.warn("⚠️ Invalid inputs to generateSingleData:", { min, max, count, totalFrequency });
  return { intervals: [], frequencies: [] };
}

  const possible = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const shuffled = possible.sort(() => 0.5 - Math.random());
  const intervals = shuffled.slice(0, count).sort((a, b) => a - b); // sorted xi values

  console.log("🎲 Selected dataPoints (xi):", intervals);

  let rawFreqs = Array.from({ length: count }, () => Math.random() + 0.5);
  const rawSum = rawFreqs.reduce((a, b) => a + b, 0);
  let frequencies = rawFreqs.map(f => Math.round((f / rawSum) * totalFrequency));

  console.log("📉 Raw frequencies before adjustment:", rawFreqs);
  console.log("📊 Frequencies after normalization & rounding:", frequencies);

  let diff = totalFrequency - frequencies.reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    const i = Math.floor(Math.random() * count);
    frequencies[i] += diff;
    console.log(`🛠 Adjusted frequency at index ${i} by ${diff} to ensure total = ${totalFrequency}`);
  }

  console.log("✅ Final output from generateSingleData:", { intervals, frequencies });
  return { intervals, frequencies };
}
