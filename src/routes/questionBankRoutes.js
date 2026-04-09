import express from "express";
import { getQuestionBankChapters, getQuestionBankItems } from "../controllers/questionBankController.js";

const router = express.Router();

router.get("/questions", getQuestionBankItems);
router.get("/chapters", getQuestionBankChapters);

export default router;
