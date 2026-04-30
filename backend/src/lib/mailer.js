import nodemailer from "nodemailer";

function getEnv(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} es obligatorio para enviar correos`);
	}
	return value;
}

export function getFromAddress() {
	return getEnv("SMTP_FROM");
}

export function getMailer() {
	const host = getEnv("SMTP_HOST");
	const portValue = getEnv("SMTP_PORT");
	const user = getEnv("SMTP_USER");
	const pass = getEnv("SMTP_PASS");
	const port = Number(portValue);

	if (!Number.isInteger(port)) {
		throw new Error("SMTP_PORT debe ser un numero");
	}

	const secure = process.env.SMTP_SECURE === "true" || port === 465;

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: {
			user,
			pass,
		},
	});
}
