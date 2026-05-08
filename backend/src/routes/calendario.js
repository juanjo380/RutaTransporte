import { Router } from "express";
import { obtenerCalendarioEstado } from "../controllers/calendarioController.js";

const router = Router();

router.get("/estado", obtenerCalendarioEstado);

export default router;
