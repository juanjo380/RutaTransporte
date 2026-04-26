import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./src/lib/prisma.js";
import authRoutes from "./src/routes/auth.js";
import reservasRoutes from "./src/routes/reservas.js";
import horariosRoutes from "./src/routes/horarios.js";
import usersRoutes from "./src/routes/users.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/horarios", horariosRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ruta-transporte-backend" });
});

app.get("/db-check", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, database: "disconnected", error: error.message });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
