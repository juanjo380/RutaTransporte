-- Add profile fields to Usuario (minimal)

ALTER TABLE "Usuario"
ADD COLUMN "telefono" TEXT,
ADD COLUMN "ubicacion" TEXT;
