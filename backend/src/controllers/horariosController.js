import { prisma } from "../lib/prisma.js";

function getHorarioRange(horario) {
	const start = new Date(horario.salida);
	const end = horario.llegada ? new Date(horario.llegada) : new Date(horario.salida);
	return { start, end };
}

function hasTimeOverlap(first, second) {
	const firstRange = getHorarioRange(first);
	const secondRange = getHorarioRange(second);

	return (
		firstRange.start.getTime() <= secondRange.end.getTime() &&
		secondRange.start.getTime() <= firstRange.end.getTime()
	);
}

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
				ruta: {
					select: {
						id: true,
						nombre: true,
						origen: true,
						destino: true,
					},
				},
				conductor: {
					select: {
						id: true,
						nombre: true,
						email: true,
					},
				},
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

export async function listarConductoresDisponibles(req, res) {
	try {
		const { horarioId } = req.query || {};

		if (!horarioId) {
			return res.status(400).json({
				ok: false,
				message: "horarioId es obligatorio",
			});
		}

		const horarioObjetivo = await prisma.horario.findUnique({
			where: { id: String(horarioId) },
			select: {
				id: true,
				salida: true,
				llegada: true,
				activo: true,
				conductorId: true,
			},
		});

		if (!horarioObjetivo || !horarioObjetivo.activo) {
			return res.status(404).json({
				ok: false,
				message: "Horario no encontrado",
			});
		}

		const conductores = await prisma.usuario.findMany({
			where: { rol: "CONDUCTOR" },
			orderBy: { nombre: "asc" },
			select: {
				id: true,
				nombre: true,
				email: true,
			},
		});

		const posiblesConflictos = await prisma.horario.findMany({
			where: {
				activo: true,
				id: { not: horarioObjetivo.id },
				conductorId: { in: conductores.map((driver) => driver.id) },
			},
			select: {
				id: true,
				salida: true,
				llegada: true,
				conductorId: true,
			},
		});

		const conductoresConConflicto = new Set(
			posiblesConflictos
				.filter((horario) => hasTimeOverlap(horarioObjetivo, horario))
				.map((horario) => horario.conductorId)
				.filter(Boolean)
		);

		const data = conductores.map((driver) => {
			const hasConflict = conductoresConConflicto.has(driver.id);

			return {
				id: driver.id,
				nombre: driver.nombre,
				email: driver.email,
				disponible: !hasConflict,
				asignadoEnHorario: driver.id === horarioObjetivo.conductorId,
			};
		});

		return res.status(200).json({
			ok: true,
			data: {
				horarioId: horarioObjetivo.id,
				conductores: data,
			},
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar conductores disponibles",
			error: error.message,
		});
	}
}

export async function asignarConductorHorario(req, res) {
	try {
		const { horarioId, conductorId } = req.body || {};

		if (!horarioId || !conductorId) {
			return res.status(400).json({
				ok: false,
				message: "horarioId y conductorId son obligatorios",
			});
		}

		const horarioObjetivo = await prisma.horario.findUnique({
			where: { id: String(horarioId) },
			select: {
				id: true,
				salida: true,
				llegada: true,
				activo: true,
				conductorId: true,
			},
		});

		if (!horarioObjetivo || !horarioObjetivo.activo) {
			return res.status(404).json({
				ok: false,
				message: "Horario no encontrado",
			});
		}

		const conductor = await prisma.usuario.findUnique({
			where: { id: String(conductorId) },
			select: {
				id: true,
				nombre: true,
				rol: true,
			},
		});

		if (!conductor || conductor.rol !== "CONDUCTOR") {
			return res.status(404).json({
				ok: false,
				message: "Conductor no encontrado",
			});
		}

		const horariosDelConductor = await prisma.horario.findMany({
			where: {
				activo: true,
				id: { not: horarioObjetivo.id },
				conductorId: conductor.id,
			},
			select: {
				id: true,
				salida: true,
				llegada: true,
			},
		});

		const conflicto = horariosDelConductor.find((horario) =>
			hasTimeOverlap(horarioObjetivo, horario)
		);

		if (conflicto) {
			return res.status(409).json({
				ok: false,
				message: "El conductor ya tiene otro horario asignado en ese mismo rango",
			});
		}

		const horarioActualizado = await prisma.horario.update({
			where: { id: horarioObjetivo.id },
			data: { conductorId: conductor.id },
			select: {
				id: true,
				salida: true,
				llegada: true,
				conductor: {
					select: {
						id: true,
						nombre: true,
						email: true,
					},
				},
			},
		});

		return res.status(200).json({
			ok: true,
			message: "Asignacion confirmada",
			data: horarioActualizado,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al asignar conductor al horario",
			error: error.message,
		});
	}
}

export async function desasignarConductorHorario(req, res) {
	try {
		const { horarioId } = req.body || {};

		if (!horarioId) {
			return res.status(400).json({
				ok: false,
				message: "horarioId es obligatorio",
			});
		}

		const horarioObjetivo = await prisma.horario.findUnique({
			where: { id: String(horarioId) },
			select: {
				id: true,
				activo: true,
				conductorId: true,
				salida: true,
				llegada: true,
			},
		});

		if (!horarioObjetivo || !horarioObjetivo.activo) {
			return res.status(404).json({
				ok: false,
				message: "Horario no encontrado",
			});
		}

		if (!horarioObjetivo.conductorId) {
			return res.status(409).json({
				ok: false,
				message: "El horario no tiene conductor asignado",
			});
		}

		const horarioActualizado = await prisma.horario.update({
			where: { id: horarioObjetivo.id },
			data: { conductorId: null },
			select: {
				id: true,
				salida: true,
				llegada: true,
				conductor: {
					select: {
						id: true,
						nombre: true,
						email: true,
					},
				},
			},
		});

		return res.status(200).json({
			ok: true,
			message: "Desasignacion confirmada",
			data: horarioActualizado,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al desasignar conductor del horario",
			error: error.message,
		});
	}
}

export async function listarHorariosConductor(req, res) {
	try {
		const conductorId = req.user?.id;

		if (!conductorId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		const conductor = await prisma.usuario.findUnique({
			where: { id: conductorId },
			select: {
				id: true,
				nombre: true,
				email: true,
				rol: true,
			},
		});

		if (!conductor || conductor.rol !== "CONDUCTOR") {
			return res.status(403).json({
				ok: false,
				message: "No tienes permisos para consultar esta informacion",
			});
		}

		const horarios = await prisma.horario.findMany({
			where: {
				activo: true,
				conductorId,
			},
			orderBy: {
				salida: "asc",
			},
			select: {
				id: true,
				salida: true,
				llegada: true,
				ruta: {
					select: {
						nombre: true,
						origen: true,
						destino: true,
					},
				},
				reservas: {
					where: {
						estado: "ACTIVA",
					},
					orderBy: {
						createdAt: "asc",
					},
					select: {
						id: true,
						codigo: true,
						usuario: {
							select: {
								id: true,
								nombre: true,
								email: true,
							},
						},
					},
				},
			},
		});

		return res.status(200).json({
			ok: true,
			data: {
				conductor: {
					id: conductor.id,
					nombre: conductor.nombre,
					email: conductor.email,
				},
				horarios,
			},
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar horarios del conductor",
			error: error.message,
		});
	}
}
