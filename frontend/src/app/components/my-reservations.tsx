import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, MapPin, Trash2, User, GraduationCap } from "lucide-react";
import { ReservationData } from "./reservation-dialog";
import { Driver, DriverProfile } from "./driver-profile";

interface Reservation {
  id: string;
  scheduleId: string;
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

export function MyReservations({
  reservations,
  onCancel,
}: MyReservationsProps) {
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
      {reservations.map((reservation) => (
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
                  <p className="text-sm font-medium dark:text-gray-100">Buga - Tuluá</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Horario</p>
                  <p className="text-sm font-medium dark:text-gray-100">
                    {reservation.departureTime} - {reservation.arrivalTime}
                  </p>
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