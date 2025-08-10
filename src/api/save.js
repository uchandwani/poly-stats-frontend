iimport dbConnect from "@/lib/dbConnect"; // your DB connector
import Submission from "@/models/Submission";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await dbConnect();
    const {
      exerciseCode,
      studentId,
      analysisText,
      tableInputs,
      summaryStats,
      isFinal
    } = req.body;

    const filter = { exerciseCode, studentId };
    const update = {
      submittedAt: new Date(),
      isFinal,
      analysisText,
      tableInputs,
      summaryStats
    };

    const result = await Submission.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true
    });

    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error("Save submission error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
