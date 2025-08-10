import React from "react";
import ReactMarkdown from "react-markdown";

export default function ProblemDescription({ text }) {
  return (
    <div className="bg-blue-100 border border-blue-300 p-4 rounded text-sm">
      <strong>Problem Description:</strong>
      <ReactMarkdown className="mt-1">{text}</ReactMarkdown>
    </div>
  );
}
