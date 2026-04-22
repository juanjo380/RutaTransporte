import multer from "multer";
import path from "path";
import fs from "fs/promises";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");

function getSafeExt(mimetype) {
	switch (mimetype) {
		case "image/webp":
			return ".webp";
		case "image/png":
			return ".png";
		case "image/jpeg":
		default:
			return ".jpg";
	}
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		fs.mkdir(AVATAR_DIR, { recursive: true })
			.then(() => cb(null, AVATAR_DIR))
			.catch((error) => cb(error));
	},
	filename: (req, file, cb) => {
		const userId = req.user?.id;
		if (!userId) {
			return cb(new Error("No autenticado"));
		}

		const ext = getSafeExt(file.mimetype);
		cb(null, `${userId}${ext}`);
	},
});

function fileFilter(_req, file, cb) {
	const allowed = ["image/jpeg", "image/png", "image/webp"];
	if (!allowed.includes(file.mimetype)) {
		return cb(new Error("Formato de imagen no permitido"));
	}
	return cb(null, true);
}

export const avatarUpload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 3 * 1024 * 1024, // 3MB
	},
});
