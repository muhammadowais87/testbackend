import express from "express";
import {
  changeSubUserPassword,
	changeTeacherPassword,
	getSubUserProfile,
	getTeacherProfile,
	teacherLogin,
  updateTeacherSettings,
} from "../controllers/teacherAuthController.js";
import { protectSubUser, protectTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", teacherLogin);
router.get("/me", protectTeacher, getTeacherProfile);
router.patch("/change-password", protectTeacher, changeTeacherPassword);
router.patch("/settings", protectTeacher, updateTeacherSettings);
router.get("/sub-user/me", protectSubUser, getSubUserProfile);
router.patch("/sub-user/change-password", protectSubUser, changeSubUserPassword);

export default router;
