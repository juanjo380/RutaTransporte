import { prisma } from "../src/lib/prisma.js";

const ROUTE_ID = "ruta-buga-tulua";

const horarios = [
	{ id: "1", direction: "ida", time: "06:30" },
	{ id: "2", direction: "ida", time: "07:00" },
	{ id: "3", direction: "ida", time: "08:00" },
	{ id: "4", direction: "vuelta", time: "11:00" },
	{ id: "5", direction: "vuelta", time: "11:30" },
	{ id: "6", direction: "vuelta", time: "12:20" },
	{ id: "7", direction: "ida", time: "13:10" },
	{ id: "8", direction: "ida", time: "14:00" },
	{ id: "9", direction: "vuelta", time: "16:30" },
	{ id: "10", direction: "vuelta", time: "17:30" },
	{ id: "11", direction: "vuelta", time: "18:10" },
];

function buildDateAtTime(time) {
	const now = new Date();
	const [hours, minutes] = time.split(":").map(Number);
	const result = new Date(now);
	result.setHours(hours, minutes, 0, 0);
	return result;
}

async function main() {
	console.log("🌱 Iniciando seeding de ruta y horarios...\n");

	await prisma.ruta.upsert({
		where: { id: ROUTE_ID },
		create: {
			id: ROUTE_ID,
			nombre: "Buga - Tuluá",
			origen: "Buga",
			destino: "Tuluá",
			activa: true,
		},
		update: {
			nombre: "Buga - Tuluá",
			origen: "Buga",
			destino: "Tuluá",
			activa: true,
		},
	});

	for (const horario of horarios) {
		const salida = buildDateAtTime(horario.time);
		const llegada = new Date(salida);

		await prisma.horario.upsert({
			where: { id: horario.id },
			create: {
				id: horario.id,
				rutaId: ROUTE_ID,
				salida,
				llegada,
				cupoTotal: 40,
				cupoOcupado: 0,
				activo: true,
			},
			update: {
				rutaId: ROUTE_ID,
				salida,
				llegada,
				cupoTotal: 40,
				activo: true,
			},
		});

		console.log(`✅ Horario sincronizado: ID ${horario.id} (${horario.direction} ${horario.time})`);
	}

	console.log("\n✨ Seeding de horarios completado");
}

main()
	.then(async () => {
		await prisma.$disconnect();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error("💥 Error fatal:", error);
		await prisma.$disconnect();
		process.exit(1);
	});
