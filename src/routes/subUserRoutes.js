import express from "express";
import {
  assignInstituteSubUserSubjects,
  createInstituteSubUser,
  deleteInstituteSubUser,
  getInstituteSubUsers,
  toggleInstituteSubUserActive,
  updateInstituteSubUser,
} from "../controllers/subUserController.js";

const router = express.Router();

router.get("/", getInstituteSubUsers);
router.post("/", createInstituteSubUser);
router.put("/:id", updateInstituteSubUser);
router.delete("/:id", deleteInstituteSubUser);
router.patch("/:id/active", toggleInstituteSubUserActive);
router.patch("/:id/subjects", assignInstituteSubUserSubjects);

export default router;
