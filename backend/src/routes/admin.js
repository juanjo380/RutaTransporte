import { Router } from "express";
import { notificarContratiempo } from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = Router();

router.post("/notificaciones/contratiempo", requireAuth, requireAdmin, notificarContratiempo);

export default router;
