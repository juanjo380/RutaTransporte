import { prisma } from "../lib/prisma.js";
import { getFromAddress, getMailer } from "../lib/mailer.js";

function buildMessageBody({ titulo, mensaje, ruta, horario }) {
	let body = `${mensaje}`;

	if (ruta) {
		body += `\n\nRuta: ${ruta.nombre} (${ruta.origen} -> ${ruta.destino})`;
	}

	if (horario) {
		const salida = new Date(horario.salida).toLocaleString("es-CO", { hour12: false });
		const llegada = horario.llegada
			? new Date(horario.llegada).toLocaleString("es-CO", { hour12: false })
			: null;
		body += `\nHorario: ${salida}${llegada ? ` - ${llegada}` : ""}`;
	}

	return body;
}

async function resolveHorarioIds({ horarioId }) {
	if (!horarioId) {
		return {
			error: {
				status: 400,
				message: "horarioId es obligatorio",
			},
		};
	}

	const horario = await prisma.horario.findUnique({
		where: { id: String(horarioId) },
		select: {
			id: true,
			salida: true,
			llegada: true,
			activo: true,
			ruta: {
				select: {
					id: true,
					nombre: true,
					origen: true,
					destino: true,
				},
			},
		},
	});

	if (!horario || !horario.activo) {
		return {
			error: {
				status: 404,
				message: "Horario no encontrado",
			},
		};
	}

	return {
		horarioIds: [horario.id],
		ruta: horario.ruta,
		horario,
	};
}

export async function notificarContratiempo(req, res) {
	try {
		const { titulo, mensaje, horarioId } = req.body || {};

		if (!titulo || !mensaje) {
			return res.status(400).json({
				ok: false,
				message: "titulo y mensaje son obligatorios",
			});
		}

		const resolved = await resolveHorarioIds({ horarioId });

		if (resolved.error) {
			return res.status(resolved.error.status).json({
				ok: false,
				message: resolved.error.message,
			});
		}

		const reservas = await prisma.reserva.findMany({
			where: {
				horarioId: { in: resolved.horarioIds },
				estado: "ACTIVA",
			},
			select: {
				usuario: {
					select: {
						email: true,
						nombre: true,
						rol: true,
					},
				},
			},
		});

		const recipients = new Set(
			reservas
				.map((item) => item.usuario)
				.filter((user) => user?.rol === "ESTUDIANTE" && user.email)
				.map((user) => user.email)
		);

		const emails = Array.from(recipients);

		if (!emails.length) {
			return res.status(200).json({
				ok: true,
				message: "No hay estudiantes para notificar",
				data: { enviados: 0 },
			});
		}

		const mailer = getMailer();
		const from = getFromAddress();
		const body = buildMessageBody({
			titulo,
			mensaje,
			ruta: resolved.ruta,
			horario: resolved.horario,
		});
		const batchSize = 50;
		let enviados = 0;

		for (let i = 0; i < emails.length; i += batchSize) {
			const batch = emails.slice(i, i + batchSize);
			await mailer.sendMail({
				from,
				to: from,
				bcc: batch,
				subject: titulo,
				text: body,
			});
			enviados += batch.length;
		}

		return res.status(200).json({
			ok: true,
			message: "Notificacion enviada",
			data: { enviados },
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al enviar notificacion",
			error: error.message,
		});
	}
}
