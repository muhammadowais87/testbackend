import express from "express";
import {
  createSchool,
  deleteSchool,
  deleteSchoolPayment,
  getSchools,
  getSchoolSubUsers,
  updateSchool,
  updateSchoolPlan,
  updateSchoolStatus,
} from "../controllers/schoolController.js";

const router = express.Router();

router.get("/", getSchools);
router.get("/:id/sub-users", getSchoolSubUsers);
router.post("/", createSchool);
router.put("/:id", updateSchool);
router.delete("/:id", deleteSchool);

router.patch("/:id/plan", updateSchoolPlan);
router.patch("/:id/status", updateSchoolStatus);
router.delete("/:id/payments/:month", deleteSchoolPayment);

export default router;
