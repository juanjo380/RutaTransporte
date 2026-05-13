import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Clock, MapPin, Trash2, User, GraduationCap } from "lucide-react";
import { ReservationData } from "./reservation-dialog";
import { Driver, DriverProfile } from "./driver-profile";
import { useEffect, useMemo, useState } from "react";

interface Reservation {
  id: string;
  scheduleId: string;
  weekday?: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | null;
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
  onDriverClick?: (driverId: string) => void;
  weeklySchedule: WeeklyScheduleItem[];
  onSaveWeeklySchedule: (items: WeeklyScheduleItem[]) => Promise<boolean>;
  isSavingWeeklySchedule?: boolean;
}

type DiaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES";

export interface WeeklyScheduleItem {
  dia: DiaSemana;
  viaja: boolean;
  primeraEntrada: string | null;
  ultimaSalida: string | null;
  reservaIdaHorarioId?: string | null;
  reservaIdaHora?: string | null;
  reservaVueltaHorarioId?: string | null;
  reservaVueltaHora?: string | null;
}

const DIAS_SEMANA: Array<{ key: DiaSemana; label: string }> = [
  { key: "LUNES", label: "Lunes" },
  { key: "MARTES", label: "Martes" },
  { key: "MIERCOLES", label: "Miercoles" },
  { key: "JUEVES", label: "Jueves" },
  { key: "VIERNES", label: "Viernes" },
];

const DIA_LABELS: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miercoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 5;
  const value = `${hour.toString().padStart(2, "0")}:00`;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const label = `${hour12.toString().padStart(2, "0")}:00 ${period}`;
  return { value, label };
});

function formatHourToAmPm(value?: string | null) {
  if (!value) {
    return "Sin definir";
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
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

function getReservationTime(reservation: Pick<Reservation, "arrivalTime" | "departureTime">) {
  return reservation.arrivalTime || reservation.departureTime || "Sin definir";
}

export function MyReservations({
  reservations,
  onCancel,
  onDriverClick,
  weeklySchedule,
  onSaveWeeklySchedule,
  isSavingWeeklySchedule = false,
}: MyReservationsProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<DiaSemana, { viaja: boolean; primeraEntrada: string; ultimaSalida: string }>>({
    LUNES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
    MARTES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
    MIERCOLES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
    JUEVES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
    VIERNES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
  });

  useEffect(() => {
    const nextData: Record<DiaSemana, { viaja: boolean; primeraEntrada: string; ultimaSalida: string }> = {
      LUNES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
      MARTES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
      MIERCOLES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
      JUEVES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
      VIERNES: { viaja: true, primeraEntrada: "", ultimaSalida: "" },
    };

    weeklySchedule.forEach((item) => {
      if (!item.viaja) {
        nextData[item.dia] = {
          viaja: false,
          primeraEntrada: "",
          ultimaSalida: "",
        };
        return;
      }

      nextData[item.dia] = {
        viaja: true,
        primeraEntrada: item.primeraEntrada || "",
        ultimaSalida: item.ultimaSalida || "",
      };
    });

    setFormData(nextData);
  }, [weeklySchedule]);

  const weeklyScheduleByDay = useMemo(() => {
    const map = new Map<DiaSemana, WeeklyScheduleItem>();
    weeklySchedule.forEach((item) => {
      map.set(item.dia, item);
    });
    return map;
  }, [weeklySchedule]);

  const hasInvalidRow = DIAS_SEMANA.some(({ key }) => {
    if (!formData[key].viaja) {
      return false;
    }

    const entrada = formData[key].primeraEntrada;
    const salida = formData[key].ultimaSalida;

    if (!entrada && !salida) {
      return false;
    }

    if (!entrada || !salida) {
      return true;
    }

    return toMinutes(salida) <= toMinutes(entrada);
  });

  const allDaysCompleted = DIAS_SEMANA.every(({ key }) => {
    if (!formData[key].viaja) {
      return true;
    }

    return Boolean(formData[key].primeraEntrada && formData[key].ultimaSalida);
  });

  const canSaveWeeklySchedule = allDaysCompleted && !hasInvalidRow && !isSavingWeeklySchedule;

  const handleWeeklyScheduleChange = (
    dia: DiaSemana,
    field: "primeraEntrada" | "ultimaSalida",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [field]: value,
      },
    }));
  };

  const handleSaveWeeklySchedule = async () => {
    const payload: WeeklyScheduleItem[] = DIAS_SEMANA.map(({ key }) => ({
      dia: key,
      viaja: formData[key].viaja,
      primeraEntrada: formData[key].viaja ? formData[key].primeraEntrada : null,
      ultimaSalida: formData[key].viaja ? formData[key].ultimaSalida : null,
    }));

    const saved = await onSaveWeeklySchedule(payload);
    if (saved) {
      setScheduleDialogOpen(false);
    }
  };

  const handleNoViajaChange = (dia: DiaSemana, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [dia]: {
        viaja: !checked,
        primeraEntrada: checked ? "" : prev[dia].primeraEntrada,
        ultimaSalida: checked ? "" : prev[dia].ultimaSalida,
      },
    }));
  };

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base dark:text-gray-100">
                Horario academico semanal
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Registra tu primera clase y tu ultima salida por cada dia de lunes a viernes.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
              Cargar horario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {DIAS_SEMANA.map((day) => {
              const item = weeklyScheduleByDay.get(day.key);
              return (
                <div key={day.key} className="rounded-lg border dark:border-gray-700 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {day.label}
                  </p>
                  <p className="text-sm mt-2 dark:text-gray-100">
                    Entrada: {item?.viaja ? formatHourToAmPm(item.primeraEntrada) : "No viaja"}
                  </p>
                  <p className="text-sm dark:text-gray-100">
                    Salida: {item?.viaja ? formatHourToAmPm(item.ultimaSalida) : "No viaja"}
                  </p>
                  <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                    Ida asignada: {formatHourToAmPm(item?.reservaIdaHora) || "Sin asignar"}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Vuelta asignada: {formatHourToAmPm(item?.reservaVueltaHora) || "Sin asignar"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
            No tienes reservas activas
          </CardContent>
        </Card>
      ) : (
        <>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hora (Ida)</p>
                    <p className="text-sm font-medium dark:text-gray-100">
                      {firstEntryReservation ? getReservationTime(firstEntryReservation) : "Sin reserva"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hora (Vuelta)</p>
                    <p className="text-sm font-medium dark:text-gray-100">
                      {firstReturnReservation ? getReservationTime(firstReturnReservation) : "Sin reserva"}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ruta</p>
                      <p className="text-sm font-medium dark:text-gray-100">
                        {reservation.origin} - {reservation.destination}
                      </p>
                      {reservation.weekday && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Dia asignado: {DIA_LABELS[reservation.weekday]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hora</p>
                      <p className="text-sm font-medium dark:text-gray-100">{getReservationTime(reservation)}</p>
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

                {onDriverClick && reservation.driver.id !== "unassigned" && reservation.driver.id.length > 10 ? (
                  <div
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => onDriverClick(reservation.driver.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onDriverClick(reservation.driver.id);
                      }
                    }}
                  >
                    <DriverProfile driver={reservation.driver} compact={true} />
                  </div>
                ) : (
                  <DriverProfile driver={reservation.driver} compact={true} />
                )}

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
        </>
      )}

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Horario semanal del estudiante</DialogTitle>
            <DialogDescription>
              Ingresa los cinco dias de lunes a viernes con primera entrada y ultima salida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {DIAS_SEMANA.map((day) => {
              const entrada = formData[day.key].primeraEntrada;
              const salida = formData[day.key].ultimaSalida;
              const noViaja = !formData[day.key].viaja;
              const showError = Boolean(
                !noViaja && entrada && salida && toMinutes(salida) <= toMinutes(entrada)
              );

              return (
                <div key={day.key} className="rounded-lg border dark:border-gray-700 p-3 space-y-3">
                  <p className="text-sm font-semibold dark:text-gray-100">{day.label}</p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`no-viaja-${day.key}`}
                      checked={noViaja}
                      onCheckedChange={(checked) => handleNoViajaChange(day.key, checked === true)}
                    />
                    <Label htmlFor={`no-viaja-${day.key}`}>No viaja este dia</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`entrada-${day.key}`}>Primera entrada</Label>
                      <select
                        id={`entrada-${day.key}`}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={entrada}
                        disabled={noViaja}
                        onChange={(e) =>
                          handleWeeklyScheduleChange(day.key, "primeraEntrada", e.target.value)
                        }
                      >
                        <option value="">Selecciona hora</option>
                        {HOUR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`salida-${day.key}`}>Ultima salida</Label>
                      <select
                        id={`salida-${day.key}`}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={salida}
                        disabled={noViaja}
                        onChange={(e) =>
                          handleWeeklyScheduleChange(day.key, "ultimaSalida", e.target.value)
                        }
                      >
                        <option value="">Selecciona hora</option>
                        {HOUR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {showError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      La salida debe ser posterior a la entrada.
                    </p>
                  )}
                </div>
              );
            })}
            {!allDaysCompleted && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Debes completar los 5 dias para guardar.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWeeklySchedule} disabled={!canSaveWeeklySchedule}>
              {isSavingWeeklySchedule ? "Guardando..." : "Guardar horario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}