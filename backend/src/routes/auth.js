import { Router } from "express";
import { getAvatar, getMe, login, register, updateMe, uploadAvatar } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/avatarUpload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

router.get("/avatar/:userId", getAvatar);
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);

export default router;
