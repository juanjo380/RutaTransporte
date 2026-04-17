import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { generarCodigoReserva } from "../utils/generarCodigo.js";

function isUniqueConstraintError(error) {
	return error?.code === "P2002";
}

async function descontarCupoSeguro(tx, horarioId, cantidad = 1) {
	const horario = await tx.horario.findUnique({
		where: { id: horarioId },
		select: { cupoOcupado: true },
	});

	if (!horario) {
		return false;
	}

	const nuevoCupo = Math.max(0, horario.cupoOcupado - cantidad);
	await tx.horario.update({
		where: { id: horarioId },
		data: { cupoOcupado: nuevoCupo },
	});

	return true;
}

export async function crearReserva(req, res) {
	try {
		const usuarioId = req.user?.id;
		const { horarioId } = req.body || {};

		if (!usuarioId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		if (!horarioId) {
			return res.status(400).json({
				ok: false,
				message: "horarioId es obligatorio",
			});
		}

		const result = await prisma.$transaction(
			async (tx) => {
				const horario = await tx.horario.findUnique({
					where: { id: horarioId },
					select: {
						id: true,
						activo: true,
						cupoTotal: true,
						cupoOcupado: true,
					},
				});

				if (!horario || !horario.activo) {
					return {
						error: {
							status: 404,
							message: "Horario no encontrado o inactivo",
						},
					};
				}

				const reservasActivas = await tx.reserva.count({
					where: {
						horarioId,
						estado: "ACTIVA",
					},
				});

				if (reservasActivas >= horario.cupoTotal) {
					return {
						error: {
							status: 409,
							message:
								"Alerta: el bus ya alcanzo su capacidad maxima. No se permiten mas reservas.",
							code: "CAPACIDAD_COMPLETA",
							data: {
								cupoTotal: horario.cupoTotal,
								reservasActivas,
							},
						},
					};
				}

				const reservaExistente = await tx.reserva.findUnique({
					where: {
						usuarioId_horarioId: {
							usuarioId,
							horarioId,
						},
					},
					select: {
						id: true,
						codigo: true,
						estado: true,
						horarioId: true,
						usuarioId: true,
						createdAt: true,
					},
				});

				if (reservaExistente?.estado === "ACTIVA") {
					return {
						error: {
							status: 409,
							message: "Ya tienes una reserva activa para este horario",
							code: "RESERVA_DUPLICADA",
						},
					};
				}

				const reserva = reservaExistente
					? await tx.reserva.update({
							where: { id: reservaExistente.id },
							data: {
								estado: "ACTIVA",
							},
						})
					: await tx.reserva.create({
							data: {
								usuarioId,
								horarioId,
								codigo: generarCodigoReserva(),
								estado: "ACTIVA",
							},
						});

				const horarioActualizado = await tx.horario.updateMany({
					where: {
						id: horarioId,
						cupoOcupado: { lt: horario.cupoTotal },
					},
					data: {
						cupoOcupado: { increment: 1 },
					},
				});

				if (horarioActualizado.count === 0) {
					throw new Error("CAPACIDAD_COMPLETA_RACE");
				}

				return {
					data: {
						id: reserva.id,
						codigo: reserva.codigo,
						horarioId: reserva.horarioId,
						usuarioId: reserva.usuarioId,
						estado: reserva.estado,
						createdAt: reserva.createdAt,
						cupo: {
							reservasActivas: reservasActivas + 1,
							cupoTotal: horario.cupoTotal,
						},
					},
				};
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		if (result.error) {
			return res.status(result.error.status).json({
				ok: false,
				message: result.error.message,
				code: result.error.code,
				...(result.error.data ? { data: result.error.data } : {}),
			});
		}

		return res.status(201).json({
			ok: true,
			message: "Reserva creada correctamente",
			data: result.data,
		});
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return res.status(409).json({
				ok: false,
				message: "Ya existe una reserva para este usuario en el horario seleccionado",
				code: "RESERVA_DUPLICADA",
			});
		}

		if (error.message === "CAPACIDAD_COMPLETA_RACE") {
			return res.status(409).json({
				ok: false,
				message: "Alerta: capacidad completa, no se pudo registrar la reserva",
				code: "CAPACIDAD_COMPLETA",
			});
		}

		if (error.code === "P2034") {
			return res.status(409).json({
				ok: false,
				message:
					"Alerta: alta concurrencia detectada, intenta nuevamente para confirmar disponibilidad",
				code: "CONFLICTO_CONCURRENCIA",
			});
		}

		return res.status(500).json({
			ok: false,
			message: "Error al crear la reserva",
			error: error.message,
		});
	}
}

export async function cancelarReservaAdmin(req, res) {
	try {
		const { reservaId } = req.params;

		if (!reservaId) {
			return res.status(400).json({
				ok: false,
				message: "reservaId es obligatorio",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			const reserva = await tx.reserva.findUnique({
				where: { id: reservaId },
				select: {
					id: true,
					estado: true,
					horarioId: true,
					usuarioId: true,
				},
			});

			if (!reserva) {
				return {
					error: {
						status: 404,
						message: "Reserva no encontrada",
					},
				};
			}

			if (reserva.estado !== "ACTIVA") {
				return {
					error: {
						status: 409,
						message: "La reserva no esta activa",
						code: "RESERVA_NO_ACTIVA",
					},
				};
			}

			await tx.reserva.update({
				where: { id: reserva.id },
				data: { estado: "CANCELADA" },
			});

			await descontarCupoSeguro(tx, reserva.horarioId, 1);

			return {
				data: {
					id: reserva.id,
					usuarioId: reserva.usuarioId,
					horarioId: reserva.horarioId,
					estado: "CANCELADA",
				},
			};
		});

		if (result.error) {
			return res.status(result.error.status).json({
				ok: false,
				message: result.error.message,
				code: result.error.code,
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Reserva cancelada correctamente por administrador",
			data: result.data,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al cancelar reserva",
			error: error.message,
		});
	}
}

export async function cancelarReservasUsuarioAdmin(req, res) {
	try {
		const { email } = req.body || {};

		if (!email) {
			return res.status(400).json({
				ok: false,
				message: "email es obligatorio",
			});
		}

		const user = await prisma.usuario.findUnique({
			where: { email: String(email).toLowerCase() },
			select: {
				id: true,
				email: true,
				nombre: true,
			},
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				message: "Usuario no encontrado",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			const reservasActivas = await tx.reserva.findMany({
				where: {
					usuarioId: user.id,
					estado: "ACTIVA",
				},
				select: {
					id: true,
					horarioId: true,
				},
			});

			if (reservasActivas.length === 0) {
				return {
					data: {
						usuario: user,
						reservasCanceladas: 0,
						horariosAjustados: 0,
					},
				};
			}

			const reservasByHorario = new Map();
			for (const reserva of reservasActivas) {
				const current = reservasByHorario.get(reserva.horarioId) || 0;
				reservasByHorario.set(reserva.horarioId, current + 1);
			}

			await tx.reserva.updateMany({
				where: {
					id: { in: reservasActivas.map((reserva) => reserva.id) },
				},
				data: {
					estado: "CANCELADA",
				},
			});

			let horariosAjustados = 0;
			for (const [horarioId, cantidad] of reservasByHorario.entries()) {
				const adjusted = await descontarCupoSeguro(tx, horarioId, cantidad);
				if (adjusted) {
					horariosAjustados += 1;
				}
			}

			return {
				data: {
					usuario: user,
					reservasCanceladas: reservasActivas.length,
					horariosAjustados,
				},
			};
		});

		return res.status(200).json({
			ok: true,
			message: "Reservas del usuario canceladas por administrador",
			data: result.data,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al cancelar reservas del usuario",
			error: error.message,
		});
	}
}

export async function listarReservasAdmin(req, res) {
	try {
		const estado = (req.query?.estado || "ACTIVA").toString().toUpperCase();
		const estadoFilter = ["ACTIVA", "CANCELADA", "COMPLETADA"].includes(estado)
			? estado
			: "ACTIVA";

		const reservas = await prisma.reserva.findMany({
			where: {
				estado: estadoFilter,
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				codigo: true,
				estado: true,
				createdAt: true,
				usuario: {
					select: {
						id: true,
						nombre: true,
						email: true,
					},
				},
				horario: {
					select: {
						id: true,
						salida: true,
						llegada: true,
						cupoTotal: true,
						cupoOcupado: true,
					},
				},
			},
		});

		return res.status(200).json({
			ok: true,
			data: reservas,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar reservas",
			error: error.message,
		});
	}
}

export async function listarMisReservas(req, res) {
	try {
		const usuarioId = req.user?.id;

		if (!usuarioId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		const reservas = await prisma.reserva.findMany({
			where: {
				usuarioId,
				estado: "ACTIVA",
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				codigo: true,
				estado: true,
				createdAt: true,
				horario: {
					select: {
						id: true,
						salida: true,
						llegada: true,
					},
				},
			},
		});

		return res.status(200).json({
			ok: true,
			data: reservas,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar reservas del usuario",
			error: error.message,
		});
	}
}

export async function cancelarMiReserva(req, res) {
	try {
		const usuarioId = req.user?.id;
		const { reservaId } = req.params;

		if (!usuarioId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		if (!reservaId) {
			return res.status(400).json({
				ok: false,
				message: "reservaId es obligatorio",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			const reserva = await tx.reserva.findUnique({
				where: { id: reservaId },
				select: {
					id: true,
					usuarioId: true,
					horarioId: true,
					estado: true,
				},
			});

			if (!reserva) {
				return {
					error: {
						status: 404,
						message: "Reserva no encontrada",
					},
				};
			}

			if (reserva.usuarioId !== usuarioId) {
				return {
					error: {
						status: 403,
						message: "No tienes permiso para cancelar esta reserva",
					},
				};
			}

			if (reserva.estado !== "ACTIVA") {
				return {
					error: {
						status: 409,
						message: "La reserva no esta activa",
						code: "RESERVA_NO_ACTIVA",
					},
				};
			}

			await tx.reserva.update({
				where: { id: reserva.id },
				data: { estado: "CANCELADA" },
			});

			await descontarCupoSeguro(tx, reserva.horarioId, 1);

			return {
				data: {
					id: reserva.id,
					estado: "CANCELADA",
				},
			};
		});

		if (result.error) {
			return res.status(result.error.status).json({
				ok: false,
				message: result.error.message,
				code: result.error.code,
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Reserva cancelada correctamente",
			data: result.data,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al cancelar reserva",
			error: error.message,
		});
	}
}
