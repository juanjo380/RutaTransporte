import { Bus, Clock, Users, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Driver, DriverProfile } from "./driver-profile";

interface BusScheduleCardProps {
  id: string;
  direction: "ida" | "vuelta";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  driver: Driver;
  onReserve: (scheduleId: string) => void;
  onDriverClick?: (driverId: string) => void;
  onViewOccupants?: (scheduleId: string) => void;
}

export function BusScheduleCard({
  id,
  direction,
  origin,
  destination,
  departureTime,
  arrivalTime,
  availableSeats,
  totalSeats,
  driver,
  onReserve,
  onDriverClick,
  onViewOccupants,
}: BusScheduleCardProps) {
  const occupancyPercentage = ((totalSeats - availableSeats) / totalSeats) * 100;
  const isAlmostFull = availableSeats <= 5 && availableSeats > 0;
  const isFull = availableSeats === 0;
  const scheduleTime = arrivalTime || departureTime;

  const canOpenDriverProfile = driver.id !== "unassigned" && driver.id.length > 10;
  const isDriverClickable = Boolean(onDriverClick) && canOpenDriverProfile;

  return (
    <Card className={isFull ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bus className="size-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg dark:text-gray-100">
              {direction === "ida" ? "Ruta de ida" : "Ruta de vuelta"}
            </CardTitle>
          </div>
          {isAlmostFull && !isFull && (
            <Badge variant="destructive" className="text-xs">
              ¡Últimos cupos!
            </Badge>
          )}
          {isFull && (
            <Badge variant="secondary" className="text-xs">
              Lleno
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Salida</p>
              <p className="font-medium dark:text-gray-100">{origin}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Llegada</p>
              <p className="font-medium dark:text-gray-100">{destination}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hora</p>
              <p className="font-semibold dark:text-gray-100">{scheduleTime}</p>
            </div>
          </div>
        </div>

        {isDriverClickable ? (
          <div
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => onDriverClick?.(driver.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onDriverClick?.(driver.id);
              }
            }}
          >
            <DriverProfile driver={driver} compact={true} />
          </div>
        ) : (
          <DriverProfile driver={driver} compact={true} />
        )}

        {onViewOccupants ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              onClick={() => onViewOccupants(id)}
            >
              Ver ocupantes
            </Button>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Cupos disponibles</span>
            </div>
            <span className="font-semibold text-sm dark:text-gray-100">
              {availableSeats} de {totalSeats}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                occupancyPercentage > 80
                  ? "bg-red-500"
                  : occupancyPercentage > 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => onReserve(id)}
          disabled={isFull}
        >
          {isFull ? "Sin cupos disponibles" : "Solicitar cupo"}
        </Button>
      </CardContent>
    </Card>
  );
}