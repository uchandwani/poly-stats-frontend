export default function InstructionSidebar({ instructions }) {
  // Force fallback to empty array if not a valid array
  const safeInstructions = Array.isArray(instructions) ? instructions : [];

  return (
    <div className="w-full p-4 bg-gray-50 border rounded text-sm space-y-2">
      <h4 className="font-semibold text-gray-700">📋 Instructions</h4>
      {safeInstructions.length === 0 ? (
        <p className="text-gray-500 italic">No instructions provided.</p>
      ) : (
        safeInstructions.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="font-bold">{i + 1}.</span>
            <span>{step}</span>
          </div>
        ))
      )}
    </div>
  );
}

