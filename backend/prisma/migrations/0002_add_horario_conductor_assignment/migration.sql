-- Add nullable conductor assignment to horarios
ALTER TABLE "Horario"
ADD COLUMN "conductorId" TEXT;

ALTER TABLE "Horario"
ADD CONSTRAINT "Horario_conductorId_fkey"
FOREIGN KEY ("conductorId") REFERENCES "Usuario"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Horario_conductorId_idx" ON "Horario"("conductorId");
