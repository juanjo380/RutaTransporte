-- Add direccion field to Horario for ida/vuelta handling
CREATE TYPE "Direccion" AS ENUM ('IDA', 'VUELTA');

ALTER TABLE "Horario"
ADD COLUMN "direccion" "Direccion" NOT NULL DEFAULT 'IDA';

UPDATE "Horario"
SET "direccion" = 'VUELTA'
WHERE "id" IN ('4', '5', '6', '9', '10', '11');
