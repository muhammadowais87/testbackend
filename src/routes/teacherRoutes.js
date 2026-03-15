import express from "express";
import {
  assignTeacherSubjects,
  createTeacher,
  deletePayment,
  deleteTeacher,
  getTeachers,
  toggleTeacherActive,
  updateTeacher,
  updateTeacherPlan,
  updateTeacherStatus,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", getTeachers);
router.post("/", createTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

router.patch("/:id/plan", updateTeacherPlan);
router.patch("/:id/status", updateTeacherStatus);
router.patch("/:id/active", toggleTeacherActive);
router.patch("/:id/subjects", assignTeacherSubjects);
router.delete("/:id/payments/:month", deletePayment);

export default router;
