import { Router } from "express";
import { getMe, login, register, updateMe, updateMyAvatar } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/avatarUpload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.post("/me/avatar", requireAuth, avatarUpload, updateMyAvatar);

export default router;
