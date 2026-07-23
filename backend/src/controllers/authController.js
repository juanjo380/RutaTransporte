import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { getFromAddress, getMailer } from "../lib/mailer.js";
import { getSupabaseAdmin, getSupabaseBucketName } from "../lib/supabaseAdmin.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function mapRoleToApi(rol) {
	switch (rol) {
		case "ADMIN":
			return "admin";
		case "CONDUCTOR":
			return "driver";
		case "ESTUDIANTE":
		default:
			return "student";
	}
}

function mapRoleToDb(role) {
	switch ((role || "").toLowerCase()) {
		case "admin":
			return "ADMIN";
		case "driver":
			return "CONDUCTOR";
		case "student":
		default:
			return "ESTUDIANTE";
	}
}

function signToken(user) {
	return jwt.sign(
		{
			sub: user.id,
			email: user.email,
			role: user.rol,
		},
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);
}

function sanitizeUser(user) {
	return {
		id: user.id,
		name: user.nombre,
		email: user.email,
		phone: user.telefono || null,
		location: user.ubicacion || null,
		avatarUrl: user.avatarUrl || null,
		role: mapRoleToApi(user.rol),
		debeCambiarContrasena: Boolean(user.debeCambiarContrasena),
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

function generateTemporaryPassword() {
	return crypto.randomBytes(24).toString("base64url");
}

function generateResetToken() {
	return crypto.randomBytes(32).toString("hex");
}

function getResetPasswordUrl(token) {
	const baseUrl = FRONTEND_URL.replace(/\/$/, "");
	return `${baseUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
}

export async function updateMe(req, res) {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ ok: false, message: "No autenticado" });
		}

		const { name, phone, location } = req.body || {};

		const data = {};
		const nameOnlyData = {};
		if (typeof name === "string" && name.trim()) {
			data.nombre = name.trim();
			nameOnlyData.nombre = name.trim();
		}
		if (typeof phone === "string") {
			data.telefono = phone.trim() ? phone.trim() : null;
		}
		if (typeof location === "string") {
			data.ubicacion = location.trim() ? location.trim() : null;
		}

		if (Object.keys(data).length === 0) {
			return res.status(400).json({ ok: false, message: "No hay cambios para actualizar" });
		}

		let updated;
		try {
			updated = await prisma.usuario.update({
				where: { id: userId },
				data,
			});
		} catch (error) {
			const msg = String(error?.message || "");
			const isUnknownTelefono = msg.includes("Unknown field") && msg.includes("telefono");
			const isUnknownUbicacion = msg.includes("Unknown field") && msg.includes("ubicacion");
			if ((isUnknownTelefono || isUnknownUbicacion) && Object.keys(nameOnlyData).length > 0) {
				updated = await prisma.usuario.update({
					where: { id: userId },
					data: nameOnlyData,
				});

				return res.status(200).json({
					ok: true,
					message: "Perfil actualizado (parcial). Reinicia el backend para aplicar telefono/ubicacion.",
					user: sanitizeUser(updated),
				});
			}

			throw error;
		}

		return res.status(200).json({
			ok: true,
			message: "Perfil actualizado",
			user: sanitizeUser(updated),
		});
	} catch (error) {
		return res.status(500).json({ ok: false, message: "Error al actualizar perfil", error: error.message });
	}
}

export async function updateMyAvatar(req, res) {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ ok: false, message: "No autenticado" });
		}

		const file = req.file;
		if (!file) {
			return res.status(400).json({ ok: false, message: "avatar es obligatorio" });
		}

		if (file.mimetype !== "image/jpeg") {
			return res.status(400).json({ ok: false, message: "Formato no permitido. Sube una imagen JPG." });
		}

		const supabase = getSupabaseAdmin();
		const bucket = getSupabaseBucketName();
		const path = `avatars/${userId}.jpg`;

		const uploadResult = await supabase.storage
			.from(bucket)
			.upload(path, file.buffer, {
				upsert: true,
				contentType: file.mimetype,
				cacheControl: "3600",
			});

		if (uploadResult.error) {
			return res.status(500).json({
				ok: false,
				message: "Error al subir avatar",
				error: uploadResult.error.message,
			});
		}

		const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
		const avatarUrl = `${publicUrl}?v=${Date.now()}`;

		const updated = await prisma.usuario.update({
			where: { id: userId },
			data: { avatarUrl },
		});

		return res.status(200).json({
			ok: true,
			message: "Avatar actualizado",
			user: sanitizeUser(updated),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al actualizar avatar",
			error: error.message,
		});
	}
}

export async function register(req, res) {
	try {
		const { name, email, role } = req.body || {};

		if (!name || !email) {
			return res.status(400).json({
				ok: false,
				message: "name y email son obligatorios",
			});
		}

		const existingUser = await prisma.usuario.findUnique({
			where: { email: String(email).toLowerCase() },
		});

		if (existingUser) {
			return res.status(409).json({
				ok: false,
				message: "El correo ya esta registrado",
			});
		}

		const generatedPassword = generateTemporaryPassword();
		const hashedPassword = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

		const user = await prisma.usuario.create({
			data: {
				nombre: name,
				email: String(email).toLowerCase(),
				password: hashedPassword,
				rol: mapRoleToDb(role),
				debeCambiarContrasena: true,
			},
		});

		const token = signToken(user);

		return res.status(201).json({
			ok: true,
			message: "Usuario registrado correctamente",
			token,
			generatedPassword,
			user: sanitizeUser(user),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al registrar usuario",
			error: error.message,
		});
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body || {};

		if (!email || !password) {
			return res.status(400).json({
				ok: false,
				message: "email y password son obligatorios",
			});
		}

		const user = await prisma.usuario.findUnique({
			where: { email: String(email).toLowerCase() },
		});

		if (!user) {
			return res.status(401).json({
				ok: false,
				message: "Credenciales invalidas",
			});
		}

		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			return res.status(401).json({
				ok: false,
				message: "Credenciales invalidas",
			});
		}

		const token = signToken(user);

		return res.status(200).json({
			ok: true,
			message: "Inicio de sesion exitoso",
			token,
			debeCambiarContrasena: Boolean(user.debeCambiarContrasena),
			user: sanitizeUser(user),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al iniciar sesion",
			error: error.message,
		});
	}
}

export async function getMe(req, res) {
	try {
		const userId = req.user?.id;

		const user = await prisma.usuario.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({
				ok: false,
				message: "Usuario no encontrado",
			});
		}

		return res.status(200).json({
			ok: true,
			user: sanitizeUser(user),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: "Error al obtener usuario autenticado",
			error: error.message,
		});
	}
}

export async function changeMyPassword(req, res) {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ ok: false, message: "No autenticado" });
		}

		const { currentPassword, newPassword } = req.body || {};

		if (!newPassword) {
			return res.status(400).json({ ok: false, message: "newPassword es obligatorio" });
		}

		const user = await prisma.usuario.findUnique({
			where: { id: userId },
			select: {
				id: true,
				password: true,
				debeCambiarContrasena: true,
			},
		});

		if (!user) {
			return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
		}

		if (!user.debeCambiarContrasena) {
			if (!currentPassword) {
				return res.status(400).json({ ok: false, message: "currentPassword es obligatorio" });
			}

			const passwordMatch = await bcrypt.compare(currentPassword, user.password);
			if (!passwordMatch) {
				return res.status(401).json({ ok: false, message: "Credenciales invalidas" });
			}
		}

		const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
		const updated = await prisma.usuario.update({
			where: { id: userId },
			data: {
				password: hashedPassword,
				debeCambiarContrasena: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
			},
		});

		return res.status(200).json({
			ok: true,
			message: "Contraseña actualizada",
			user: sanitizeUser(updated),
		});
	} catch (error) {
		return res.status(500).json({ ok: false, message: "Error al cambiar la contraseña", error: error.message });
	}
}

export async function forgotPassword(req, res) {
	try {
		const { email } = req.body || {};
		if (!email) {
			return res.status(400).json({ ok: false, message: "email es obligatorio" });
		}

		const normalizedEmail = String(email).toLowerCase();
		const user = await prisma.usuario.findUnique({
			where: { email: normalizedEmail },
		});

		if (!user) {
			return res.status(200).json({
				ok: true,
				message: "Si el correo existe, se enviara un enlace de recuperacion",
			});
		}

		const resetToken = generateResetToken();
		const resetPasswordToken = await bcrypt.hash(resetToken, SALT_ROUNDS);
		const resetPasswordExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
		const resetUrl = getResetPasswordUrl(resetToken);

		await prisma.usuario.update({
			where: { id: user.id },
			data: {
				resetPasswordToken,
				resetPasswordExpires,
			},
		});

		const transporter = getMailer();
		await transporter.sendMail({
			from: getFromAddress(),
			to: normalizedEmail,
			subject: "Recuperación de contraseña",
			html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
         <a href="${resetUrl}">${resetUrl}</a>
         <p>Este enlace expira en 1 hora.</p>`,
		});

		return res.status(200).json({
			ok: true,
			message: "Si el correo existe, se enviara un enlace de recuperacion",
		});
	} catch (error) {
		return res.status(500).json({ ok: false, message: "Error al solicitar recuperacion de contraseña", error: error.message });
	}
}

export async function resetPassword(req, res) {
	try {
		const { token, nuevaContrasena } = req.body || {};
		if (!token || !nuevaContrasena) {
			return res.status(400).json({ ok: false, message: "token y nuevaContrasena son obligatorios" });
		}

		const activeUsers = await prisma.usuario.findMany({
			where: {
				resetPasswordToken: { not: null },
				resetPasswordExpires: { gt: new Date() },
			},
			select: {
				id: true,
				resetPasswordToken: true,
			},
		});

		let matchedUserId = null;
		for (const candidate of activeUsers) {
			const tokenMatches = await bcrypt.compare(token, candidate.resetPasswordToken);
			if (tokenMatches) {
				matchedUserId = candidate.id;
				break;
			}
		}

		if (!matchedUserId) {
			return res.status(400).json({ ok: false, message: "Token invalido o expirado" });
		}

		const hashedPassword = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);
		const updated = await prisma.usuario.update({
			where: { id: matchedUserId },
			data: {
				password: hashedPassword,
				debeCambiarContrasena: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
			},
		});

		return res.status(200).json({
			ok: true,
			message: "Contraseña restablecida correctamente",
			user: sanitizeUser(updated),
		});
	} catch (error) {
		return res.status(500).json({ ok: false, message: "Error al restablecer la contraseña", error: error.message });
	}
}
