import { prisma } from "../lib/prisma.js";

export async function listarHorarios(req, res) {
	try {
		const horarios = await prisma.horario.findMany({
			where: { activo: true },
			orderBy: { salida: "asc" },
			select: {
				id: true,
				salida: true,
				llegada: true,
				cupoTotal: true,
				cupoOcupado: true,
			},
		});

		return res.status(200).json({
			ok: true,
			data: horarios,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar horarios",
			error: error.message,
		});
	}
}
