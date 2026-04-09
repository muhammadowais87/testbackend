import mongoose from "mongoose";
import SavedPaper from "../models/SavedPaper.js";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const getOwnerQuery = (portalUser) => {
  const ownerRef = toObjectId(portalUser?.id);
  if (!ownerRef) {
    throw new Error("Invalid owner id in token");
  }

  return {
    ownerType: portalUser.role,
    ownerRef,
  };
};

const toResponsePaper = (paper) => ({
  id: paper.paperId,
  title: paper.title,
  subject: paper.subject,
  className: paper.className,
  board: paper.board,
  teacherName: paper.teacherName,
  date: paper.date,
  paperCategory: paper.paperCategory,
  timeAllowed: paper.timeAllowed,
  totalMarks: paper.totalMarks,
  questionType: paper.questionType,
  questions: Array.isArray(paper.questions) ? paper.questions : [],
});

const getUniquePaperId = async () => {
  let candidate = Date.now();

  // Keep incrementing until we get a unique numeric paper id.
  // This keeps frontend routing stable with numeric ids.
  // In normal cases, first check passes.
  while (await SavedPaper.exists({ paperId: candidate })) {
    candidate += 1;
  }

  return candidate;
};

export const createSavedPaper = async (req, res) => {
  try {
    const ownerQuery = getOwnerQuery(req.portalUser);
    const paperId = await getUniquePaperId();

    const questions = Array.isArray(req.body?.questions)
      ? req.body.questions.map((q) => ({
          id: Number(q?.id) || 0,
          text: clean(q?.text),
          urdu: clean(q?.urdu),
          contentType: ["mcq", "short", "long"].includes(q?.contentType) ? q.contentType : "short",
        }))
      : [];

    const savedPaper = await SavedPaper.create({
      paperId,
      ownerType: ownerQuery.ownerType,
      ownerRef: ownerQuery.ownerRef,
      instituteRef: req.portalUser?.role === "sub-user" ? toObjectId(req.portalUser.instituteId) : null,
      title: clean(req.body?.title) || "Paper",
      subject: clean(req.body?.subject),
      className: clean(req.body?.className),
      board: clean(req.body?.board),
      teacherName: clean(req.body?.teacherName),
      date: clean(req.body?.date),
      paperCategory: clean(req.body?.paperCategory),
      timeAllowed: clean(req.body?.timeAllowed),
      totalMarks: clean(req.body?.totalMarks),
      questionType: clean(req.body?.questionType),
      questions,
    });

    return res.status(201).json({ paper: toResponsePaper(savedPaper) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save paper", error: error.message });
  }
};

export const getSavedPapers = async (req, res) => {
  try {
    const ownerQuery = getOwnerQuery(req.portalUser);
    const papers = await SavedPaper.find(ownerQuery).sort({ createdAt: -1 });

    return res.status(200).json({ papers: papers.map(toResponsePaper) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch saved papers", error: error.message });
  }
};

export const getSavedPaperById = async (req, res) => {
  try {
    const ownerQuery = getOwnerQuery(req.portalUser);
    const paperId = Number(req.params.id);

    if (!Number.isFinite(paperId)) {
      return res.status(400).json({ message: "Invalid paper id" });
    }

    const paper = await SavedPaper.findOne({ ...ownerQuery, paperId });
    if (!paper) {
      return res.status(404).json({ message: "Saved paper not found" });
    }

    return res.status(200).json({ paper: toResponsePaper(paper) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch saved paper", error: error.message });
  }
};

export const deleteSavedPaper = async (req, res) => {
  try {
    const ownerQuery = getOwnerQuery(req.portalUser);
    const paperId = Number(req.params.id);

    if (!Number.isFinite(paperId)) {
      return res.status(400).json({ message: "Invalid paper id" });
    }

    const paper = await SavedPaper.findOneAndDelete({ ...ownerQuery, paperId });
    if (!paper) {
      return res.status(404).json({ message: "Saved paper not found" });
    }

    return res.status(200).json({ message: "Saved paper deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete saved paper", error: error.message });
  }
};
