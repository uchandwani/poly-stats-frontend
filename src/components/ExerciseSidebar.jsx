import React from 'react';

const exerciseCodes = [
  "Range_01", "Range_02", "Range_03", "Range_04", "Range_05",
  "Mean_01", "Mean_02", "Mean_03", "Mean_04", "Mean_05",
  "SD_01", "SD_02", "SD_03", "SD_04", "SD_05",
  "Insights_01", "Insights_02", "Insights_03", "Insights_04", "Insights_05"
];

export default function ExerciseSidebar({ onSelect }) {
  return (
    <div className="w-56 bg-gray-100 p-2 border-r h-screen overflow-y-auto">
      {exerciseCodes.map(code => (
        <button
          key={code}
          onClick={() => onSelect(code)}
          className="block w-full text-left px-2 py-1 hover:bg-blue-100"
        >
          {code}
        </button>
      ))}
    </div>
  );
}
