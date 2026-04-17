import { prisma } from "../src/lib/prisma.js";

function getEmailArg() {
	const arg = process.argv.find((item) => item.startsWith("--email="));
	return arg?.split("=")[1]?.trim().toLowerCase();
}

async function main() {
	const email = getEmailArg();

	if (!email) {
		throw new Error("Debes enviar --email=<correo>");
	}

	const user = await prisma.usuario.findUnique({
		where: { email },
		select: { id: true, email: true, nombre: true },
	});

	if (!user) {
		throw new Error(`No existe usuario con email ${email}`);
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
			return { reservasCanceladas: 0, horariosAjustados: 0 };
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
			const horario = await tx.horario.findUnique({
				where: { id: horarioId },
				select: { cupoOcupado: true },
			});

			if (!horario) {
				continue;
			}

			const nuevoCupo = Math.max(0, horario.cupoOcupado - cantidad);
			await tx.horario.update({
				where: { id: horarioId },
				data: { cupoOcupado: nuevoCupo },
			});
			horariosAjustados += 1;
		}

		return {
			reservasCanceladas: reservasActivas.length,
			horariosAjustados,
		};
	});

	console.log(`✅ Usuario: ${user.nombre} <${user.email}>`);
	console.log(`✅ Reservas activas canceladas: ${result.reservasCanceladas}`);
	console.log(`✅ Horarios ajustados: ${result.horariosAjustados}`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error("💥 Error:", error.message);
		await prisma.$disconnect();
		process.exit(1);
	});
