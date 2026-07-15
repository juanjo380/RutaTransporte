import { Router } from "express";
import {
	changeMyPassword,
	forgotPassword,
	getMe,
	login,
	register,
	resetPassword,
	updateMe,
	updateMyAvatar,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/avatarUpload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", requireAuth, changeMyPassword);
router.post("/me/avatar", requireAuth, avatarUpload, updateMyAvatar);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
