// src/services/llmDataFetcher.js
export async function fetchGroupedDataFromLLM({
  min = 10,
  max = 100,
  interval = 10,
  count = 5,
  theme = "exam scores",
  targetMean = null,
  targetStdDev = null
}) 
{
const prompt = `
Generate class intervals and frequencies for grouped data.

- Start: 10
- Interval size: 10
- Groups: 6
- Frequencies: Random integers between 2 and 10

Output this JSON:
{
  "intervals": [[10,20],[20,30],...],
  "frequencies": [5, 7, 3, 6, 2, 8]
}
Only return JSON, nothing else.`;



  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "phi",
      stream: false,
      prompt: prompt
    })
  });

  const { response } = await res.json();
  const match = response.match(/\{[\s\S]*?\}/);
  console.log("The response from LLM is ", match);
  return match ? JSON.parse(match[0]) : null;
}
