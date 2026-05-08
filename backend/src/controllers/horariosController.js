import { prisma } from "../lib/prisma.js";
import { getCalendarioContexto } from "../utils/calendario.js";

function parseHora24(hora) {
	if (typeof hora !== "string") {
		return null;
	}

	const valor = hora.trim();
	if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(valor)) {
		return null;
	}

	return valor;
}

function buildDateAtTime(time) {
	const now = new Date();
	const [hours, minutes] = time.split(":").map(Number);
	const result = new Date(now);
	result.setHours(hours, minutes, 0, 0);
	return result;
}

function normalizarDireccion(direccion) {
	const value = String(direccion || "").trim().toUpperCase();
	if (value === "IDA" || value === "VUELTA") {
		return value;
	}

	return null;
}

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
				direccion: true,
				salida: true,
				llegada: true,
				cupoTotal: true,
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

		const contexto = getCalendarioContexto();
		const ocupaciones = await prisma.reserva.groupBy({
			by: ["horarioId"],
			where: {
				estado: "ACTIVA",
				OR: [
					{ diaSemana: contexto.diaSemana },
					{ diaSemana: null },
				],
			},
			_count: {
				_all: true,
			},
		});

		const ocupacionMap = new Map(
			ocupaciones.map((item) => [item.horarioId, item._count._all])
		);

		const horariosConCupo = horarios.map((horario) => ({
			...horario,
			cupoOcupado: ocupacionMap.get(horario.id) || 0,
		}));

		return res.status(200).json({
			ok: true,
			data: horariosConCupo,
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

export async function crearHorarioAdmin(req, res) {
	try {
		const { rutaId, direccion, horaSalida, horaLlegada, cupoTotal } = req.body || {};

		if (!rutaId) {
			return res.status(400).json({
				ok: false,
				message: "rutaId es obligatorio",
			});
		}

		const direccionNormalizada = normalizarDireccion(direccion);
		if (!direccionNormalizada) {
			return res.status(400).json({
				ok: false,
				message: "direccion invalida. Usa IDA o VUELTA",
			});
		}

		const salidaValidada = parseHora24(horaSalida);
		if (!salidaValidada) {
			return res.status(400).json({
				ok: false,
				message: "horaSalida invalida. Usa HH:MM en 24 horas",
			});
		}

		const llegadaValidada = horaLlegada ? parseHora24(horaLlegada) : null;
		if (horaLlegada && !llegadaValidada) {
			return res.status(400).json({
				ok: false,
				message: "horaLlegada invalida. Usa HH:MM en 24 horas",
			});
		}

		const cupo = Number(cupoTotal);
		if (!Number.isFinite(cupo) || cupo <= 0) {
			return res.status(400).json({
				ok: false,
				message: "cupoTotal debe ser mayor a 0",
			});
		}

		const ruta = await prisma.ruta.findUnique({
			where: { id: String(rutaId) },
			select: { id: true, activa: true },
		});

		if (!ruta || !ruta.activa) {
			return res.status(404).json({
				ok: false,
				message: "Ruta no encontrada o inactiva",
			});
		}

		const salida = buildDateAtTime(salidaValidada);
		const llegada = llegadaValidada ? buildDateAtTime(llegadaValidada) : salida;

		const horario = await prisma.horario.create({
			data: {
				rutaId: ruta.id,
				direccion: direccionNormalizada,
				salida,
				llegada,
				cupoTotal: cupo,
				cupoOcupado: 0,
				activo: true,
			},
			select: {
				id: true,
				direccion: true,
				salida: true,
				llegada: true,
				cupoTotal: true,
				cupoOcupado: true,
			},
		});

		return res.status(201).json({
			ok: true,
			message: "Horario creado",
			data: horario,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al crear horario",
			error: error.message,
		});
	}
}

export async function eliminarHorarioAdmin(req, res) {
	try {
		const horarioId = String(req.params?.horarioId || "");

		if (!horarioId) {
			return res.status(400).json({
				ok: false,
				message: "horarioId es obligatorio",
			});
		}

		const horario = await prisma.horario.findUnique({
			where: { id: horarioId },
			select: { id: true, activo: true },
		});

		if (!horario || !horario.activo) {
			return res.status(404).json({
				ok: false,
				message: "Horario no encontrado",
			});
		}

		const reservasActivas = await prisma.reserva.count({
			where: {
				horarioId,
				estado: "ACTIVA",
			},
		});

		if (reservasActivas > 0) {
			return res.status(409).json({
				ok: false,
				message: "No se puede eliminar el horario con reservas activas",
			});
		}

		await prisma.horario.update({
			where: { id: horarioId },
			data: {
				activo: false,
				conductorId: null,
			},
		});

		return res.status(200).json({
			ok: true,
			message: "Horario eliminado",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al eliminar horario",
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

		const contexto = getCalendarioContexto();

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
				direccion: true,
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
						OR: [
							{ diaSemana: contexto.diaSemana },
							{ diaSemana: null },
						],
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

export async function listarOcupantesHorario(req, res) {
	try {
		const horarioId = String(req.params?.horarioId || "");
		const userId = req.user?.id;
		const role = req.user?.role;

		if (!userId) {
			return res.status(401).json({ ok: false, message: "Usuario no autenticado" });
		}

		if (!horarioId) {
			return res.status(400).json({ ok: false, message: "horarioId es obligatorio" });
		}

		const contexto = getCalendarioContexto();

		const horario = await prisma.horario.findUnique({
			where: { id: horarioId },
			select: {
				id: true,
				conductorId: true,
				reservas: {
					where: {
						estado: "ACTIVA",
						OR: [
							{ diaSemana: contexto.diaSemana },
							{ diaSemana: null },
						],
					},
					orderBy: { createdAt: "asc" },
					select: {
						usuarioId: true,
						usuario: {
							select: {
								id: true,
								nombre: true,
							},
						},
					},
				},
			},
		});

		if (!horario) {
			return res.status(404).json({ ok: false, message: "Horario no encontrado" });
		}

		const isAdmin = role === "ADMIN";
		const isDriver = role === "CONDUCTOR";
		const isStudent = role === "ESTUDIANTE";

		if (isAdmin) {
			// ok
		} else if (isDriver) {
			if (horario.conductorId !== userId) {
				return res.status(403).json({ ok: false, message: "No tienes permisos para ver los ocupantes de este horario" });
			}
		} else if (isStudent) {
			// Permitido para estudiantes autenticados.
		} else {
			return res.status(403).json({ ok: false, message: "No tienes permisos para ver los ocupantes de este horario" });
		}

		const ocupantes = horario.reservas
			.map((reserva) => reserva.usuario)
			.filter(Boolean)
			.map((usuario) => ({
				id: usuario.id,
				name: usuario.nombre,
			}));

		return res.status(200).json({
			ok: true,
			data: {
				horarioId: horario.id,
				ocupantes,
			},
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar ocupantes del horario",
			error: error.message,
		});
	}
}
