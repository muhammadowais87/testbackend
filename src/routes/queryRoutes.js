import express from "express";
import {
  createQuery,
  deleteQuery,
  getQueries,
  markQueryAsRead,
} from "../controllers/queryController.js";

const router = express.Router();

router.post("/", createQuery);
router.get("/", getQueries);
router.patch("/:id/read", markQueryAsRead);
router.delete("/:id", deleteQuery);

export default router;
