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

const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
const HORARIOS_IDA_IDS = new Set(["1", "2", "3", "7", "8"]);
const HORARIOS_VUELTA_IDS = new Set(["4", "5", "6", "9", "10", "11"]);

function getDiaSemanaActual() {
	const day = new Date().getDay();
	const map = {
		1: "LUNES",
		2: "MARTES",
		3: "MIERCOLES",
		4: "JUEVES",
		5: "VIERNES",
	};

	return map[day] || null;
}

function normalizarDia(dia) {
	if (!dia) {
		return null;
	}

	const normalizado = String(dia)
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toUpperCase();

	return DIAS_SEMANA.includes(normalizado) ? normalizado : null;
}

function parseHoraAHorasMinutos(hora) {
	if (typeof hora !== "string") {
		return null;
	}

	const valor = hora.trim();
	if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(valor)) {
		return null;
	}

	const [horas, minutos] = valor.split(":").map(Number);
	return horas * 60 + minutos;
}

function esHoraPuntual(hora) {
	return /^([01]\d|2[0-3]):00$/.test(String(hora || "").trim());
}

function formatMinutosAHora(minutos) {
	const h = Math.floor(minutos / 60)
		.toString()
		.padStart(2, "0");
	const m = (minutos % 60).toString().padStart(2, "0");
	return `${h}:${m}`;
}

function getHorarioMinutes(horario) {
	const salida = new Date(horario.salida);
	return salida.getHours() * 60 + salida.getMinutes();
}

function clasificarDireccionHorario(horario) {
	if (HORARIOS_IDA_IDS.has(String(horario.id))) {
		return "ida";
	}

	if (HORARIOS_VUELTA_IDS.has(String(horario.id))) {
		return "vuelta";
	}

	return null;
}

function seleccionarHorarioIda(horariosIda, entradaMinutos) {
	if (horariosIda.length === 0) {
		return null;
	}

	const candidatos = horariosIda.filter((horario) => horario.minutos <= entradaMinutos);
	if (candidatos.length > 0) {
		return candidatos.sort((a, b) => b.minutos - a.minutos)[0];
	}

	return [...horariosIda].sort((a, b) => a.minutos - b.minutos)[0];
}

function seleccionarHorarioVuelta(horariosVuelta, salidaMinutos) {
	if (horariosVuelta.length === 0) {
		return null;
	}

	const candidatos = horariosVuelta.filter((horario) => horario.minutos >= salidaMinutos);
	if (candidatos.length > 0) {
		return candidatos.sort((a, b) => a.minutos - b.minutos)[0];
	}

	return [...horariosVuelta].sort((a, b) => b.minutos - a.minutos)[0];
}

function construirAsignaciones(horariosSemanales, horariosActivos) {
	const horariosClasificados = horariosActivos
		.map((horario) => {
			const direccion = clasificarDireccionHorario(horario);
			return {
				id: horario.id,
				direccion,
				minutos: getHorarioMinutes(horario),
			};
		})
		.filter((horario) => Boolean(horario.direccion));

	const ida = horariosClasificados.filter((horario) => horario.direccion === "ida");
	const vuelta = horariosClasificados.filter((horario) => horario.direccion === "vuelta");

	const desiredAsignaciones = [];
	const dias = horariosSemanales.map((item) => {
		if (!item.viaja) {
			return {
				dia: item.dia,
				viaja: false,
				primeraEntrada: null,
				ultimaSalida: null,
				reservaIdaHorarioId: null,
				reservaIdaHora: null,
				reservaVueltaHorarioId: null,
				reservaVueltaHora: null,
			};
		}

		const entradaMinutos = parseHoraAHorasMinutos(item.primeraEntrada);
		const salidaMinutos = parseHoraAHorasMinutos(item.ultimaSalida);

		const idaSeleccionada = seleccionarHorarioIda(ida, entradaMinutos);
		const vueltaSeleccionada = seleccionarHorarioVuelta(vuelta, salidaMinutos);

		if (idaSeleccionada?.id) {
			desiredAsignaciones.push({
				dia: item.dia,
				direccion: "ida",
				horarioId: idaSeleccionada.id,
			});
		}

		if (vueltaSeleccionada?.id) {
			desiredAsignaciones.push({
				dia: item.dia,
				direccion: "vuelta",
				horarioId: vueltaSeleccionada.id,
			});
		}

		return {
			dia: item.dia,
			viaja: true,
			primeraEntrada: item.primeraEntrada,
			ultimaSalida: item.ultimaSalida,
			reservaIdaHorarioId: idaSeleccionada?.id || null,
			reservaIdaHora: idaSeleccionada
				? formatMinutosAHora(idaSeleccionada.minutos)
				: null,
			reservaVueltaHorarioId: vueltaSeleccionada?.id || null,
			reservaVueltaHora: vueltaSeleccionada
				? formatMinutosAHora(vueltaSeleccionada.minutos)
				: null,
		};
	});

	return {
		dias,
		desiredAsignaciones,
	};
}

async function activarReservaSiDisponible(tx, usuarioId, horarioId, diaSemana) {
	const horario = await tx.horario.findUnique({
		where: { id: horarioId },
		select: { id: true, activo: true, cupoTotal: true },
	});

	if (!horario || !horario.activo) {
		return { ok: false, motivo: "HORARIO_INACTIVO" };
	}

	const reservaExistente = await tx.reserva.findFirst({
		where: {
			usuarioId,
			horarioId,
			diaSemana,
			esSemanal: true,
		},
		select: {
			id: true,
			estado: true,
		},
	});

	if (reservaExistente?.estado === "ACTIVA") {
		return { ok: true };
	}

	const reservasActivas = await tx.reserva.count({
		where: {
			horarioId,
			estado: "ACTIVA",
		},
	});

	if (reservasActivas >= horario.cupoTotal) {
		return { ok: false, motivo: "CAPACIDAD_COMPLETA" };
	}

	const updateCupo = await tx.horario.updateMany({
		where: {
			id: horarioId,
			cupoOcupado: { lt: horario.cupoTotal },
		},
		data: {
			cupoOcupado: { increment: 1 },
		},
	});

	if (updateCupo.count === 0) {
		return { ok: false, motivo: "CAPACIDAD_COMPLETA" };
	}

	if (reservaExistente) {
		await tx.reserva.update({
			where: { id: reservaExistente.id },
			data: { estado: "ACTIVA", esSemanal: true, diaSemana },
		});
		return { ok: true };
	}

	await tx.reserva.create({
		data: {
			usuarioId,
			horarioId,
			diaSemana,
			esSemanal: true,
			codigo: generarCodigoReserva(),
			estado: "ACTIVA",
		},
	});

	return { ok: true };
}

function keyAsignacion(diaSemana, horarioId) {
	return `${diaSemana}|${horarioId}`;
}

async function sincronizarReservasHorarioSemanal(tx, usuarioId, desiredAsignaciones) {
	const desiredSet = new Set(
		desiredAsignaciones.map((item) => keyAsignacion(item.dia, item.horarioId))
	);

	const activas = await tx.reserva.findMany({
		where: {
			usuarioId,
			estado: "ACTIVA",
			esSemanal: true,
		},
		select: {
			id: true,
			horarioId: true,
			diaSemana: true,
		},
	});

	const cancelaciones = activas.filter(
		(reserva) =>
			!reserva.diaSemana ||
			!desiredSet.has(keyAsignacion(reserva.diaSemana, reserva.horarioId))
	);
	if (cancelaciones.length > 0) {
		await tx.reserva.updateMany({
			where: { id: { in: cancelaciones.map((item) => item.id) } },
			data: { estado: "CANCELADA" },
		});

		const porHorario = new Map();
		for (const item of cancelaciones) {
			const current = porHorario.get(item.horarioId) || 0;
			porHorario.set(item.horarioId, current + 1);
		}

		for (const [horarioId, cantidad] of porHorario.entries()) {
			await descontarCupoSeguro(tx, horarioId, cantidad);
		}
	}

	const noAsignadas = [];
	for (const asignacion of desiredAsignaciones) {
		const result = await activarReservaSiDisponible(
			tx,
			usuarioId,
			asignacion.horarioId,
			asignacion.dia
		);
		if (!result.ok) {
			noAsignadas.push({
				dia: asignacion.dia,
				direccion: asignacion.direccion,
				horarioId: asignacion.horarioId,
				motivo: result.motivo,
			});
		}
	}

	return { noAsignadas };
}

function validarHorarioSemanalPayload(horarios) {
	if (!Array.isArray(horarios)) {
		return { ok: false, message: "horarios debe ser un arreglo" };
	}

	if (horarios.length !== DIAS_SEMANA.length) {
		return {
			ok: false,
			message: "Debes registrar los 5 dias habiles (lunes a viernes)",
		};
	}

	const diasVistos = new Set();
	const normalizados = [];

	for (const item of horarios) {
		const dia = normalizarDia(item?.dia);
		const viaja = item?.viaja !== false;
		const primeraEntrada = item?.primeraEntrada;
		const ultimaSalida = item?.ultimaSalida;

		if (!dia) {
			return { ok: false, message: "Dia invalido. Usa lunes a viernes" };
		}

		if (diasVistos.has(dia)) {
			return { ok: false, message: `No repitas el dia ${dia}` };
		}

		diasVistos.add(dia);

		if (!viaja) {
			normalizados.push({
				dia,
				viaja: false,
				primeraEntrada: null,
				ultimaSalida: null,
			});
			continue;
		}

		if (!esHoraPuntual(primeraEntrada) || !esHoraPuntual(ultimaSalida)) {
			return {
				ok: false,
				message: `Para ${dia}, usa horarios puntuales en horas exactas (ej: 08:00)`,
			};
		}

		const entradaMin = parseHoraAHorasMinutos(primeraEntrada);
		const salidaMin = parseHoraAHorasMinutos(ultimaSalida);

		if (entradaMin === null || salidaMin === null) {
			return {
				ok: false,
				message: `Formato de hora invalido para ${dia}. Usa HH:MM en 24 horas`,
			};
		}

		if (salidaMin <= entradaMin) {
			return {
				ok: false,
				message: `Para ${dia}, ultimaSalida debe ser mayor a primeraEntrada`,
			};
		}

		normalizados.push({
			dia,
			viaja: true,
			primeraEntrada: String(primeraEntrada).trim(),
			ultimaSalida: String(ultimaSalida).trim(),
		});
	}

	for (const dia of DIAS_SEMANA) {
		if (!diasVistos.has(dia)) {
			return {
				ok: false,
				message: "Debes incluir todos los dias de lunes a viernes",
			};
		}
	}

	return { ok: true, data: normalizados };
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

				const reservaExistente = await tx.reserva.findFirst({
					where: {
						usuarioId,
						horarioId,
						diaSemana: null,
						esSemanal: false,
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
								diaSemana: null,
								esSemanal: false,
							},
						})
					: await tx.reserva.create({
							data: {
								usuarioId,
								horarioId,
								diaSemana: null,
								esSemanal: false,
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
				diaSemana: true,
				esSemanal: true,
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

export async function listarHorarioSemanalEstudiante(req, res) {
	try {
		const usuarioId = req.user?.id;

		if (!usuarioId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		const horarios = await prisma.horarioSemanalEstudiante.findMany({
			where: { usuarioId },
			orderBy: { dia: "asc" },
			select: {
				dia: true,
				viaja: true,
				primeraEntrada: true,
				ultimaSalida: true,
			},
		});

		const horariosActivos = await prisma.horario.findMany({
			where: { activo: true },
			select: { id: true, salida: true },
		});

		const asignaciones = construirAsignaciones(horarios, horariosActivos);

		return res.status(200).json({
			ok: true,
			data: asignaciones.dias,
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al listar horario semanal del estudiante",
			error: error.message,
		});
	}
}

export async function guardarHorarioSemanalEstudiante(req, res) {
	try {
		const usuarioId = req.user?.id;
		const { horarios } = req.body || {};

		if (!usuarioId) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		const validacion = validarHorarioSemanalPayload(horarios);
		if (!validacion.ok) {
			return res.status(400).json({
				ok: false,
				message: validacion.message,
			});
		}

		const horariosNormalizados = validacion.data;

		const horariosActivos = await prisma.horario.findMany({
			where: { activo: true },
			select: { id: true, salida: true },
		});

		const asignaciones = construirAsignaciones(horariosNormalizados, horariosActivos);
		const diaActual = getDiaSemanaActual();
		const asignacionesHoy = diaActual
			? asignaciones.desiredAsignaciones.filter((item) => item.dia === diaActual)
			: [];

		if (
			horariosNormalizados.some(
				(item) => item.viaja && (!asignaciones.dias.find((dia) => dia.dia === item.dia)?.reservaIdaHorarioId || !asignaciones.dias.find((dia) => dia.dia === item.dia)?.reservaVueltaHorarioId)
			)
		) {
			return res.status(409).json({
				ok: false,
				message:
					"No se pudieron encontrar rutas de ida y vuelta para todos los dias marcados para viajar",
			});
		}

		const syncResult = await prisma.$transaction(async (tx) => {
			await tx.horarioSemanalEstudiante.deleteMany({
				where: { usuarioId },
			});

			await tx.horarioSemanalEstudiante.createMany({
				data: horariosNormalizados.map((item) => ({
					usuarioId,
					dia: item.dia,
					viaja: item.viaja,
					primeraEntrada: item.primeraEntrada,
					ultimaSalida: item.ultimaSalida,
				})),
			});

			return sincronizarReservasHorarioSemanal(
				tx,
				usuarioId,
				asignacionesHoy
			);
		});

		const horariosGuardados = await prisma.horarioSemanalEstudiante.findMany({
			where: { usuarioId },
			orderBy: { dia: "asc" },
			select: {
				dia: true,
				viaja: true,
				primeraEntrada: true,
				ultimaSalida: true,
			},
		});

		const asignacionesGuardadas = construirAsignaciones(horariosGuardados, horariosActivos);

		return res.status(200).json({
			ok: true,
			message: "Horario semanal guardado correctamente",
			data: asignacionesGuardadas.dias,
			meta: {
				diaAplicado: diaActual,
				reservasEsperadasHoy: asignacionesHoy.length,
				reservasNoAsignadas: syncResult.noAsignadas,
			},
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al guardar horario semanal del estudiante",
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
