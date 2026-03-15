import express from "express";
import {
  changeInstitutePassword,
  getInstituteProfile,
  instituteLogin,
  updateInstituteSettings,
} from "../controllers/instituteAuthController.js";
import { protectInstitute } from "../middleware/authMiddleware.js";
import subUserRoutes from "./subUserRoutes.js";

const router = express.Router();

router.post("/login", instituteLogin);
router.get("/me", protectInstitute, getInstituteProfile);
router.patch("/change-password", protectInstitute, changeInstitutePassword);
router.patch("/settings", protectInstitute, updateInstituteSettings);
router.use("/sub-users", protectInstitute, subUserRoutes);

export default router;
