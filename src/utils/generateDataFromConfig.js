// utils/generateDataFromConfig.js
import { generateClassData, generateSingleData } from "./dataGenerators";

/**
 * Unified function to retrieve dataPoints and frequencies,
 * whether stored or generated.
 * 
 * @param {Object} exercise - Full exercise object from DB
 * @returns {{ dataPoints: any[], frequencies: number[] }}
 */
export function generateDataFromConfig(exercise) {
  const {
    generateRandomData = false,
    dataPoints = [],
    frequencies = [],
    dataGeneration = {},
    inputType = "grouped",  // fallback
    statMeasure = ""
  } = exercise;

  if (!generateRandomData) {
    console.log("📥 Using stored dataPoints and frequencies");
    return { dataPoints, frequencies };
  }

  console.log("⚙️ Generating data using config:", dataGeneration);

  if (inputType === "grouped") {
    return generateClassData(dataGeneration, statMeasure);
  } else {
    return generateSingleData(dataGeneration, statMeasure);
  }
}
