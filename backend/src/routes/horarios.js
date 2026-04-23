import { Router } from "express";
import {
	asignarConductorHorario,
	desasignarConductorHorario,
	listarHorariosConductor,
	listarConductoresDisponibles,
	listarHorarios,
	listarOcupantesHorario,
} from "../controllers/horariosController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireRole } from "../middleware/roles.js";

const router = Router();

router.get("/", listarHorarios);
router.get("/:horarioId/ocupantes", requireAuth, listarOcupantesHorario);
router.get("/conductor/mis-horarios", requireAuth, requireRole("CONDUCTOR"), listarHorariosConductor);
router.get("/admin/conductores-disponibles", requireAuth, requireAdmin, listarConductoresDisponibles);
router.post("/admin/asignar-conductor", requireAuth, requireAdmin, asignarConductorHorario);
router.post("/admin/desasignar-conductor", requireAuth, requireAdmin, desasignarConductorHorario);

export default router;
