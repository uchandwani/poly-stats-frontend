// src/services/ollamaService.js

export async function getGroupedDataAndQuestion() {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral",
      prompt: "Generate grouped data with 5 class intervals and ask a question on Standard Deviation. Return JSON format.",
      stream: false
    })
  });

  const result = await response.json();
  const parsed = JSON.parse(result.response); // String inside `response` key is JSON

  return parsed;
}

