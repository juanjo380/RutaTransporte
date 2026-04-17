import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, MapPin, Trash2, User, GraduationCap } from "lucide-react";
import { ReservationData } from "./reservation-dialog";
import { Driver, DriverProfile } from "./driver-profile";

interface Reservation {
  id: string;
  scheduleId: string;
  direction: "ida" | "vuelta";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  userData: ReservationData;
  driver: Driver;
  date: string;
}

interface MyReservationsProps {
  reservations: Reservation[];
  onCancel: (reservationId: string) => void;
}

function parseTimeToMinutes(time: string): number {
  const [clock, period] = time.trim().split(" ");
  const [hoursText, minutesText] = clock.split(":");
  const normalizedPeriod = period.toUpperCase();

  let hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (normalizedPeriod === "PM" && hours !== 12) {
    hours += 12;
  }

  if (normalizedPeriod === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function MyReservations({
  reservations,
  onCancel,
}: MyReservationsProps) {
  const sortedReservations = [...reservations].sort((a, b) => {
    const directionPriorityA = a.direction === "ida" ? 0 : 1;
    const directionPriorityB = b.direction === "ida" ? 0 : 1;

    if (directionPriorityA !== directionPriorityB) {
      return directionPriorityA - directionPriorityB;
    }

    const timeA =
      a.direction === "vuelta"
        ? parseTimeToMinutes(a.departureTime)
        : parseTimeToMinutes(a.arrivalTime);
    const timeB =
      b.direction === "vuelta"
        ? parseTimeToMinutes(b.departureTime)
        : parseTimeToMinutes(b.arrivalTime);

    return timeA - timeB;
  });

  const firstEntryReservation =
    reservations.filter((reservation) => reservation.direction === "ida").length > 0
      ? [...reservations]
          .filter((reservation) => reservation.direction === "ida")
          .sort(
            (a, b) =>
              parseTimeToMinutes(a.arrivalTime) - parseTimeToMinutes(b.arrivalTime)
          )[0]
      : null;

  const firstReturnReservation =
    reservations.filter((reservation) => reservation.direction === "vuelta").length > 0
      ? [...reservations]
          .filter((reservation) => reservation.direction === "vuelta")
          .sort(
            (a, b) =>
              parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime)
          )[0]
      : null;

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
          No tienes reservas activas
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-gray-100">
            Primer horario de entrada y salida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entrada (Ida)</p>
                <p className="text-sm font-medium dark:text-gray-100">
                  {firstEntryReservation ? firstEntryReservation.arrivalTime : "Sin reserva"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Salida (Vuelta)</p>
                <p className="text-sm font-medium dark:text-gray-100">
                  {firstReturnReservation ? firstReturnReservation.departureTime : "Sin reserva"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedReservations.map((reservation) => (
        <Card key={reservation.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base dark:text-gray-100">Reserva confirmada</CardTitle>
              <Badge variant="default" className="bg-green-600 dark:bg-green-700">
                Activa
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ruta</p>
                  <p className="text-sm font-medium dark:text-gray-100">
                    {reservation.origin} - {reservation.destination}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reservation.direction === "vuelta" ? "Hora de salida" : "Hora de llegada"}
                  </p>
                  <p className="text-sm font-medium dark:text-gray-100">
                    {reservation.direction === "vuelta" ? reservation.departureTime : reservation.arrivalTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Te recogen en</p>
                  <p className="text-sm dark:text-gray-100">{reservation.userData.pickupStop}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Te dejan en</p>
                  <p className="text-sm dark:text-gray-100">{reservation.userData.dropoffStop}</p>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estudiante</p>
                  <p className="text-sm dark:text-gray-100">{reservation.userData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Universidad</p>
                  <p className="text-sm dark:text-gray-100">{reservation.userData.university}</p>
                </div>
              </div>
            </div>

            <DriverProfile driver={reservation.driver} compact={true} />

            <div className="flex items-center justify-end pt-2 border-t dark:border-gray-700">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(reservation.id)}
              >
                <Trash2 className="size-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}