// src/components/TopBarDescription.jsx
import React from "react";
import ReactMarkdown from "react-markdown";

export default function TopBarDescription({ text }) {
  return (
    <div className="bg-blue-100 border border-blue-300 p-4 rounded text-sm">
      <strong>Problem Description:</strong>
     <div className="mt-1">
      <ReactMarkdown>{text}</ReactMarkdown>
      </div>

    </div>
  );
}
