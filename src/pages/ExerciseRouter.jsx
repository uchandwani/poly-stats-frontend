import React from "react";
import { useParams } from "react-router-dom";

// Route targets
import StatMeasures from "./StatMeasures";
import StatMeasuresComp from "./StatMeasuresCompare";
import StatMeasuresComparisonEnhanced from "./StatMeasuresComparisonEnhanced";
import RangeMeasures from "./RangeMeasures";
import GroupedMeasures from "./GroupedMeasures";
import PlotFunctions from "./PlotFunctions";
import GroupedRange from "./GroupedRange";
import LoginPage from "./LoginPage";
import FunctionPlotter from "./FunctionPlotter";
import FunctionQuadrants from "./FunctionQuadrants"; // ✅ NEW</EvenOdd>
import EvenOddFunctions from "./EvenOddFunctions";
import DerivativeApproach from "./DerivativeApproach";
import FunctionFivePoints from "./FunctionFivePoints"; // 👈 Import the new file
// Code groups
const enhancedCompareCodes = ["Insights_01", "Insights_02"];
const groupedInsightsCodes = ["Insights_03", "Insights_04", "Insights_05"];
const groupedBasicsCodes = ["Basics_02", "Basics_03", "Basics_04"];
const groupRangeCodes = ["Basics_01"];
const compareCodes = ["MD_05", "SD_05"];
const plotFunctionCodes = ["PlotFunctions"];
const functionPlotterCodes = ["FunctionPlotter"];
const functionDerivativeApproach = ["Derivative_01", "Derivative_02","Derivative_03","Derivative_04" ];
const functionEvenOdd = ["EvenOdd_01", "EvenOdd_02","EvenOdd_03","EvenOdd_04"];
const functionDrawFivePoints = ["Draw_01", "Draw_02", "Draw_03", "Draw_04", "Draw_05"];


const functionQuadrantCodes = [ // ✅ NEW
  "Functions_01", "Functions_02", "Functions_03", "Functions_04"
];
const statMeasuresCodes = [
  "Mean_01", "Mean_02", "Mean_03", "Mean_04",
  "SD_01", "SD_02", "SD_03", "SD_04"
];
const loginCodes = ["Login"];

export default function ExerciseRouter() {
  const { code } = useParams();

  const [measureType, variant] = code?.split("_") ?? [];

  if (enhancedCompareCodes.includes(code)) return <GroupedMeasures />;
  if (groupedInsightsCodes.includes(code)) return <GroupedMeasures />;
  if (compareCodes.includes(code)) return <StatMeasuresComp />;
  if (loginCodes.includes(code)) return <LoginPage />;
  if (groupRangeCodes.includes(code)) return <RangeMeasures />;
  if (groupedBasicsCodes.includes(code)) return <GroupedMeasures />;
  if (functionPlotterCodes.includes(code)) return <FunctionPlotter />;
  if (plotFunctionCodes.includes(code)) return <PlotFunctions />;
  if (functionDrawFivePoints.includes(code)) return <FunctionFivePoints />;
  if (functionQuadrantCodes.includes(code)) return <FunctionQuadrants />; // ✅ NEW
  if (functionDerivativeApproach.includes(code)) return <DerivativeApproach />;
  if (functionEvenOdd.includes(code)) return <EvenOddFunctions/>; // ✅ NEW
  if (statMeasuresCodes.includes(code)) return <StatMeasures />;
  if (code?.startsWith("Basics_")) return <GroupedMeasures />;
  if (code?.startsWith("Mean_") || code?.startsWith("SD_")) return <StatMeasures />;

  return <StatMeasures />;
}
