import mongoose from "mongoose";

const savedPaperQuestionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    text: { type: String, default: "" },
    urdu: { type: String, default: "" },
    contentType: { type: String, enum: ["mcq", "short", "long"], default: "short" },
  },
  { _id: false }
);

const savedPaperSchema = new mongoose.Schema(
  {
    paperId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    ownerType: {
      type: String,
      required: true,
      enum: ["institute", "teacher", "sub-user"],
      index: true,
    },
    ownerRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    instituteRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: "", trim: true },
    className: { type: String, default: "", trim: true },
    board: { type: String, default: "", trim: true },
    teacherName: { type: String, default: "", trim: true },
    date: { type: String, default: "", trim: true },
    paperCategory: { type: String, default: "", trim: true },
    timeAllowed: { type: String, default: "", trim: true },
    totalMarks: { type: String, default: "", trim: true },
    questionType: { type: String, default: "", trim: true },
    questions: {
      type: [savedPaperQuestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

savedPaperSchema.index({ ownerType: 1, ownerRef: 1, createdAt: -1 });

const SavedPaper = mongoose.model("SavedPaper", savedPaperSchema);

export default SavedPaper;
