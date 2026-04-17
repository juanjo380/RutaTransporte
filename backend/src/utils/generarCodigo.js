export function generarCodigoReserva(prefix = "RES") {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).slice(2, 7).toUpperCase();

	return `${prefix}-${timestamp}-${random}`;
}

export default generarCodigoReserva;
