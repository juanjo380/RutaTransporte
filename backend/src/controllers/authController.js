import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

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
		role: mapRoleToApi(user.rol),
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

export async function register(req, res) {
	try {
		const { name, email, password, role } = req.body || {};

		if (!name || !email || !password) {
			return res.status(400).json({
				ok: false,
				message: "name, email y password son obligatorios",
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

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		const user = await prisma.usuario.create({
			data: {
				nombre: name,
				email: String(email).toLowerCase(),
				password: hashedPassword,
				rol: mapRoleToDb(role),
			},
		});

		const token = signToken(user);

		return res.status(201).json({
			ok: true,
			message: "Usuario registrado correctamente",
			token,
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
