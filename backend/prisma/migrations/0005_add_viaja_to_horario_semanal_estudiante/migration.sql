-- Add no-travel option to weekly student schedule

ALTER TABLE "HorarioSemanalEstudiante"
ADD COLUMN "viaja" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "HorarioSemanalEstudiante"
ALTER COLUMN "primeraEntrada" DROP NOT NULL,
ALTER COLUMN "ultimaSalida" DROP NOT NULL;
