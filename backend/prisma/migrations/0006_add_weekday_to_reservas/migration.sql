-- Track weekly reservations by weekday

ALTER TABLE "Reserva"
ADD COLUMN "diaSemana" "DiaSemana",
ADD COLUMN "esSemanal" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "Reserva_usuarioId_horarioId_key";

CREATE UNIQUE INDEX "Reserva_usuarioId_horarioId_diaSemana_key"
ON "Reserva"("usuarioId", "horarioId", "diaSemana");
