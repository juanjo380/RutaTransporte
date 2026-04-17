export function requireRole(...allowedRoles) {
	return (req, res, next) => {
		const role = req.user?.role;

		if (!role) {
			return res.status(401).json({
				ok: false,
				message: "Usuario no autenticado",
			});
		}

		if (!allowedRoles.includes(role)) {
			return res.status(403).json({
				ok: false,
				message: "No tienes permisos para realizar esta accion",
			});
		}

		return next();
	};
}

export const requireAdmin = requireRole("ADMIN");
