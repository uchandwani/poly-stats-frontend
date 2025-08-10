import React, { useState, useEffect } from "react";

/**
 * Renders a statistical summary input form with validation.
 * @param {Object} props
 * @param {Object} props.expectedStats - Object with expected keys and correct values
 * @param {Function} props.onValidate - Function to validate student input
 * @param {String} props.title - Title to show above the form
 */
export default function StatSummaryForm({
  expectedStats = {},
  title = "Statistical Measures",
}) {
  const keys = Object.keys(expectedStats);
  const [studentInput, setStudentInput] = useState(() =>
    keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
  );

  const [validationResult, setValidationResult] = useState({});

  useEffect(() => {
    console.log("🔄 Resetting StatSummaryForm input on expectedStats change");

    setStudentInput(
      keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
    );
    setValidationResult({});
  }, [expectedStats])

  const handleChange = (key, value) => {
    setStudentInput(prev => ({ ...prev, [key]: value }));
  };


const EPSILON = 0.01;

const handleValidate = () => {
  const result = {};
  keys.forEach(key => {
    const enteredRaw = studentInput[key];
    const expectedRaw = expectedStats[key];

    const entered = parseFloat(enteredRaw);
    const expected = parseFloat(expectedRaw);

    const isValid =
      !isNaN(entered) &&
      !isNaN(expected) &&
      Math.abs(entered - expected) < EPSILON;

    console.log(
      `[Validation] ${key}: entered = ${enteredRaw} → ${entered}, expected = ${expectedRaw} → ${expected}, |diff| = ${Math.abs(entered - expected)}, valid = ${isValid}`
    );

    result[key] = isValid;
  });
  setValidationResult(result);
};



  const getInputClass = key => {
    if (!(key in validationResult)) return "";
    return validationResult[key] ? "bg-green-100" : "bg-red-100";
  };

  return (
    <div className="border mt-4 p-4 rounded bg-gray-50 text-sm max-w-md">
      <h4 className="text-md font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {keys.map(key => (
          <div key={key} className="flex items-center justify-between">
            <label className="w-32 font-medium capitalize">{key}</label>
            <input
              type="number"
              step="0.01"
              value={studentInput[key]}
              onChange={e => handleChange(key, e.target.value)}
              className={`w-32 p-1 border rounded text-right ${getInputClass(key)}`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleValidate}
        className="mt-4 px-3 py-1 bg-blue-600 text-white text-sm rounded"
      >
        ✅ Validate
      </button>
    </div>
  );
}
