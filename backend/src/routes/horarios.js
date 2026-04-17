import { Router } from "express";
import { listarHorarios } from "../controllers/horariosController.js";

const router = Router();

router.get("/", listarHorarios);

export default router;
