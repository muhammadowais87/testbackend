import QuestionBankItem from "../models/QuestionBankItem.js";
import QuestionBankChapter from "../models/QuestionBankChapter.js";

const parseChapterList = (chaptersQuery) => {
  if (!chaptersQuery || typeof chaptersQuery !== "string") {
    return [];
  }

  const parsed = chaptersQuery
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  return [...new Set(parsed)].sort((a, b) => a - b);
};

const normalizeQuestion = (item) => ({
  id: item.chapter * 100000 + item.contentOrder * 10000 + item.sourceId,
  chapter: item.chapter,
  contentType: item.contentType,
  priorityKey: item.priorityKey || "additional",
  chapterPart: item.chapterPart || null,
  type: item.type || "Additional",
  text: item.text || "",
  urdu: item.urdu || "",
});

export const getQuestionBankItems = async (req, res) => {
  try {
    const chapters = parseChapterList(req.query?.chapters);

    if (chapters.length === 0) {
      return res.status(200).json({ questions: [] });
    }

    const items = await QuestionBankItem.find({ chapter: { $in: chapters } })
      .sort({ chapter: 1, contentOrder: 1, sourceId: 1 })
      .lean();

    return res.status(200).json({
      questions: items.map(normalizeQuestion),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch question bank", error: error.message });
  }
};

export const getQuestionBankChapters = async (req, res) => {
  try {
    const subject = (typeof req.query?.subject === "string" ? req.query.subject : "").trim();
    const className = (typeof req.query?.className === "string" ? req.query.className : "").trim();
    const board = (typeof req.query?.board === "string" ? req.query.board : "").trim();

    if (!subject || !className || !board) {
      return res.status(400).json({ message: "subject, className and board are required" });
    }

    const syllabusKey = `${subject}-${className}-${board}`;
    const chapterDoc = await QuestionBankChapter.findOne({ syllabusKey }).lean();

    return res.status(200).json({ groups: chapterDoc?.groups || [] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch chapter groups", error: error.message });
  }
};
