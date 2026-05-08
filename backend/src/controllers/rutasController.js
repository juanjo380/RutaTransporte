import { prisma } from "../lib/prisma.js";

export async function listarRutas(req, res) {
  try {
    const soloActivas = String(req.query?.activas || "true").toLowerCase() !== "false";

    const rutas = await prisma.ruta.findMany({
      where: soloActivas ? { activa: true } : undefined,
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        origen: true,
        destino: true,
        activa: true,
      },
    });

    return res.status(200).json({
      ok: true,
      data: rutas,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error al listar rutas",
      error: error.message,
    });
  }
}
