import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  exerciseCode: { type: String, required: true },
  studentId: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  isFinal: { type: Boolean, default: false },

  // Free-text analysis or conclusion
  analysisText: { type: String, default: "" },

  // Flexible array of table rows (can have varying columns)
  tableInputs: [
    {
      type: Map,
      of: mongoose.Schema.Types.Mixed  // Values can be string/number/null
    }
  ],

  // Flexible array of stat labels and values
  summaryStats: [
    {
      label: { type: String },
      value: { type: mongoose.Schema.Types.Mixed }
    }
  ],

  // Future extensibility
  additionalMeta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

export default mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
