export default function StudentAnalysisBox({ prompt, studentNote, setStudentNote }) {
  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-2">{prompt}</h3>
      <textarea
        value={studentNote}
        onChange={(e) => setStudentNote(e.target.value)}
        placeholder="Write your analysis here..."
        className="w-full border p-2 rounded h-28 text-sm"
      />
    </div>
  );
}

