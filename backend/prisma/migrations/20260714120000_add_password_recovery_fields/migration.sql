-- Add password recovery fields to Usuario

ALTER TABLE "Usuario"
ADD COLUMN "debeCambiarContrasena" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(3);