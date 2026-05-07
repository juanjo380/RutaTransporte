import { Router } from "express";
import { listarRutas } from "../controllers/rutasController.js";

const router = Router();

router.get("/", listarRutas);

export default router;
