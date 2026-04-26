import { prisma } from "../lib/prisma.js";

export async function getUserProfile(req, res) {
	try {
		const userId = String(req.params.userId || "");
		if (!userId || userId.includes("/") || userId.includes("\\")) {
			return res.status(400).json({ ok: false, message: "userId invalido" });
		}

		const isAdmin = req.user?.role === "ADMIN";

		const baseUser = await prisma.usuario.findUnique({
			where: { id: userId },
			select: {
				id: true,
				nombre: true,
				avatarUrl: true,
			},
		});

		if (!baseUser) {
			return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
		}

		let phone = null;
		let location = null;

		if (isAdmin) {
			try {
				const adminFields = await prisma.usuario.findUnique({
					where: { id: userId },
					select: {
						telefono: true,
						ubicacion: true,
					},
				});

				phone = adminFields?.telefono || null;
				location = adminFields?.ubicacion || null;
			} catch {
				phone = null;
				location = null;
			}
		}

		return res.status(200).json({
			ok: true,
			data: {
				id: baseUser.id,
				name: baseUser.nombre,
				avatarUrl: baseUser.avatarUrl || null,
				phone,
				location,
			},
		});
	} catch (error) {
		return res.status(500).json({ ok: false, message: "Error al obtener perfil", error: error.message });
	}
}
