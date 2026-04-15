import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			ok: false,
			message: "Token no proporcionado",
		});
	}

	const token = authHeader.slice("Bearer ".length);

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
		};
		return next();
	} catch (error) {
		return res.status(401).json({
			ok: false,
			message: "Token invalido o expirado",
			error: error.message,
		});
	}
}
