import express from "express";
import {
  createSavedPaper,
  deleteSavedPaper,
  getSavedPaperById,
  getSavedPapers,
} from "../controllers/savedPaperController.js";
import { protectAnyPortal } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectAnyPortal);
router.get("/", getSavedPapers);
router.post("/", createSavedPaper);
router.get("/:id", getSavedPaperById);
router.delete("/:id", deleteSavedPaper);

export default router;
