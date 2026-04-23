import multer from "multer";

const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1MB

const storage = multer.memoryStorage();

export const avatarUpload = multer({
	storage,
	limits: {
		fileSize: MAX_AVATAR_BYTES,
	},
	fileFilter: (_req, file, cb) => {
		const allowed = new Set(["image/jpeg"]);
		if (!allowed.has(file.mimetype)) {
			cb(new Error("Formato no permitido. Sube una imagen JPG."));
			return;
		}
		cb(null, true);
	},
}).single("avatar");
