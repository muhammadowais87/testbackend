import mongoose from "mongoose";

const chapterGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    chapters: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const questionBankChapterSchema = new mongoose.Schema(
  {
    syllabusKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    board: {
      type: String,
      required: true,
      trim: true,
    },
    groups: {
      type: [chapterGroupSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const QuestionBankChapter = mongoose.model("QuestionBankChapter", questionBankChapterSchema);

export default QuestionBankChapter;
