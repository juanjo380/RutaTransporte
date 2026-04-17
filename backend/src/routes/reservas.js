import { Router } from "express";
import {
	cancelarMiReserva,
	cancelarReservaAdmin,
	cancelarReservasUsuarioAdmin,
	crearReserva,
	listarMisReservas,
	listarReservasAdmin,
} from "../controllers/reservasController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = Router();

router.post("/", requireAuth, crearReserva);
router.get("/mias", requireAuth, listarMisReservas);
router.delete("/:reservaId", requireAuth, cancelarMiReserva);
router.get("/admin", requireAuth, requireAdmin, listarReservasAdmin);
router.delete("/admin/:reservaId", requireAuth, requireAdmin, cancelarReservaAdmin);
router.post("/admin/cancelar-usuario", requireAuth, requireAdmin, cancelarReservasUsuarioAdmin);

export default router;
