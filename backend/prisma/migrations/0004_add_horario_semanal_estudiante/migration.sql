-- Weekly schedule for students: first entry and last exit per weekday

CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES');

CREATE TABLE "HorarioSemanalEstudiante" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "dia" "DiaSemana" NOT NULL,
  "primeraEntrada" TEXT NOT NULL,
  "ultimaSalida" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HorarioSemanalEstudiante_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HorarioSemanalEstudiante_usuarioId_idx" ON "HorarioSemanalEstudiante"("usuarioId");

CREATE UNIQUE INDEX "HorarioSemanalEstudiante_usuarioId_dia_key" ON "HorarioSemanalEstudiante"("usuarioId", "dia");

ALTER TABLE "HorarioSemanalEstudiante"
ADD CONSTRAINT "HorarioSemanalEstudiante_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
