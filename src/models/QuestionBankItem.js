import mongoose from "mongoose";

const questionBankItemSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    chapter: {
      type: Number,
      required: true,
      index: true,
      min: 1,
    },
    contentType: {
      type: String,
      required: true,
      enum: ["mcq", "short", "long"],
      index: true,
    },
    contentOrder: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    sourceId: {
      type: Number,
      required: true,
      min: 1,
    },
    priorityKey: {
      type: String,
      default: "additional",
      trim: true,
      lowercase: true,
    },
    chapterPart: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      default: "Additional",
      trim: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    urdu: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

questionBankItemSchema.index({ chapter: 1, contentOrder: 1, sourceId: 1 });

const QuestionBankItem = mongoose.model("QuestionBankItem", questionBankItemSchema);

export default QuestionBankItem;
