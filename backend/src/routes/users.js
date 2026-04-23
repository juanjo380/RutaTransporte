import { Router } from "express";
import { getUserProfile } from "../controllers/usersController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:userId", requireAuth, getUserProfile);

export default router;
