import React, { useEffect, useState } from 'react';

export default function ExerciseViewer({ selectedCode }) {
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    if (!selectedCode) return;
    fetch(`/api/exercise/${selectedCode}`)
      .then(res => res.json())
      .then(data => setExercise(data));
  }, [selectedCode]);

  if (!exercise) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">{exercise.title}</h2>
      <p className="text-sm text-gray-600 mb-1">Code: <strong>{exercise.code}</strong></p>
      <p className="mb-2">Question: <em>{exercise.question}</em></p>
      <div className="border p-2 rounded bg-gray-50 text-gray-500 italic">
        🚧 Placeholder for solving logic goes here.
      </div>
    </div>
  );
}
