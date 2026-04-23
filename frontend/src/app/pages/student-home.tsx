import { useEffect, useState } from "react";
import { BusScheduleCard } from "../components/bus-schedule-card";
import { ReservationDialog, ReservationData } from "../components/reservation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Bus, Calendar, TicketCheck, LogOut, User, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Driver } from "../components/driver-profile";
import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/theme-context";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { MyReservations, WeeklyScheduleItem } from "../components/my-reservations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const RESERVATION_DETAILS_STORAGE_KEY = "ruta_transporte_reservation_details";

interface Schedule {
  id: string;
  direction: "ida" | "vuelta";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  driver: Driver;
}

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

type CreateReservationResponse = {
  ok: boolean;
  message?: string;
  code?: string;
  data?: {
    id: string;
    codigo: string;
    horarioId: string;
  };
};

type HorarioOcupacionResponse = {
  ok: boolean;
  message?: string;
  data?: Array<{
    id: string;
    cupoTotal: number;
    cupoOcupado: number;
    conductor?: {
      id: string;
      nombre: string;
      email: string;
    } | null;
  }>;
};

type MisReservasResponse = {
  ok: boolean;
  message?: string;
  data?: Array<{
    id: string;
    codigo: string;
    estado: string;
    diaSemana?: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | null;
    esSemanal?: boolean;
    createdAt: string;
    horario: {
      id: string;
      salida: string;
      llegada: string | null;
    };
  }>;
};

type HorarioSemanalResponse = {
  ok: boolean;
  message?: string;
  meta?: {
    reservasNoAsignadas?: Array<{
      horarioId: string;
      motivo: string;
    }>;
  };
  data?: Array<{
    dia: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES";
    viaja: boolean;
    primeraEntrada: string | null;
    ultimaSalida: string | null;
    reservaIdaHorarioId?: string | null;
    reservaIdaHora?: string | null;
    reservaVueltaHorarioId?: string | null;
    reservaVueltaHora?: string | null;
  }>;
};

type ReservationDetailsMap = Record<string, ReservationData>;

function getReservationDetailsMap(): ReservationDetailsMap {
  try {
    const raw = localStorage.getItem(RESERVATION_DETAILS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ReservationDetailsMap;
  } catch {
    return {};
  }
}

function saveReservationDetailsMap(map: ReservationDetailsMap) {
  localStorage.setItem(RESERVATION_DETAILS_STORAGE_KEY, JSON.stringify(map));
}

function mapConductorToDriver(
  conductor?: {
    id: string;
    nombre: string;
    email: string;
  } | null
): Driver {
  if (!conductor) {
    return {
      id: "unassigned",
      name: "Conductor por asignar",
      phone: "No disponible",
      rating: 0,
      experience: "Por definir",
      licensePlate: "Sin placa",
      verified: false,
      totalTrips: 0,
    };
  }

  return {
    id: conductor.id,
    name: conductor.nombre,
    phone: conductor.email,
    rating: 0,
    experience: "No informada",
    licensePlate: "No informada",
    verified: true,
    totalTrips: 0,
  };
}

export function StudentHome() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      direction: "ida",
      origin: "Buga",
      destination: "Tuluá",
      departureTime: "06:30 AM",
      arrivalTime: "06:30 AM",
      availableSeats: 15,
      totalSeats: 40,
      driver: {
        id: "d1",
        name: "Fabian",
        phone: "300-123-4567",
        rating: 4.8,
        experience: "8 años",
        licensePlate: "ABC-123",
        verified: true,
        totalTrips: 1200,
      },
    },
    {
      id: "2",
      direction: "ida",
      origin: "Buga",
      destination: "Tuluá",
      departureTime: "07:00 AM",
      arrivalTime: "07:00 AM",
      availableSeats: 18,
      totalSeats: 40,
      driver: {
        id: "d2",
        name: "Jeison Amado",
        phone: "301-987-6543",
        rating: 4.9,
        experience: "10 años",
        licensePlate: "XYZ-789",
        verified: true,
        totalTrips: 1500,
      },
    },
    {
      id: "3",
      direction: "ida",
      origin: "Buga",
      destination: "Tuluá",
      departureTime: "08:00 AM",
      arrivalTime: "08:00 AM",
      availableSeats: 3,
      totalSeats: 40,
      driver: {
        id: "d2",
        name: "Jeison Amado",
        phone: "301-987-6543",
        rating: 4.9,
        experience: "10 años",
        licensePlate: "XYZ-789",
        verified: true,
        totalTrips: 1500,
      },
    },
    {
      id: "4",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "11:00 AM",
      arrivalTime: "11:00 AM",
      availableSeats: 25,
      totalSeats: 40,
      driver: {
        id: "d3",
        name: "Jose",
        phone: "302-456-7890",
        rating: 4.7,
        experience: "6 años",
        licensePlate: "DEF-456",
        verified: true,
        totalTrips: 950,
      },
    },
    {
      id: "5",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "11:30 AM",
      arrivalTime: "11:30 AM",
      availableSeats: 22,
      totalSeats: 40,
      driver: {
        id: "d1",
        name: "Jose",
        phone: "300-123-4567",
        rating: 4.8,
        experience: "8 años",
        licensePlate: "ABC-123",
        verified: true,
        totalTrips: 1200,
      },
    },
    {
      id: "6",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "12:20 PM",
      arrivalTime: "12:20 PM",
      availableSeats: 16,
      totalSeats: 40,
      driver: {
        id: "d4",
        name: "Jeison Amado",
        phone: "303-234-5678",
        rating: 5.0,
        experience: "12 años",
        licensePlate: "GHI-321",
        verified: true,
        totalTrips: 2000,
      },
    },
    {
      id: "7",
      direction: "ida",
      origin: "Buga",
      destination: "Tuluá",
      departureTime: "01:10 PM",
      arrivalTime: "01:10 PM",
      availableSeats: 8,
      totalSeats: 40,
      driver: {
        id: "d1",
        name: "Jose",
        phone: "300-123-4567",
        rating: 4.8,
        experience: "8 años",
        licensePlate: "ABC-123",
        verified: true,
        totalTrips: 1200,
      },
    },
    {
      id: "8",
      direction: "ida",
      origin: "Buga",
      destination: "Tuluá",
      departureTime: "02:00 PM",
      arrivalTime: "02:00 PM",
      availableSeats: 11,
      totalSeats: 40,
      driver: {
        id: "d2",
        name: "Jeison Amado",
        phone: "301-987-6543",
        rating: 4.9,
        experience: "10 años",
        licensePlate: "XYZ-789",
        verified: true,
        totalTrips: 1500,
      },
    },
    {
      id: "9",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "04:30 PM",
      arrivalTime: "04:30 PM",
      availableSeats: 13,
      totalSeats: 40,
      driver: {
        id: "d1",
        name: "Fabian",
        phone: "300-123-4567",
        rating: 4.8,
        experience: "8 años",
        licensePlate: "ABC-123",
        verified: true,
        totalTrips: 1200,
      },
    },
    {
      id: "10",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "05:30 PM",
      arrivalTime: "05:30 PM",
      availableSeats: 9,
      totalSeats: 40,
      driver: {
        id: "d3",
        name: "Jose",
        phone: "302-456-7890",
        rating: 4.7,
        experience: "6 años",
        licensePlate: "DEF-456",
        verified: true,
        totalTrips: 950,
      },
    },
    {
      id: "11",
      direction: "vuelta",
      origin: "Tuluá",
      destination: "Buga",
      departureTime: "06:10 PM",
      arrivalTime: "06:10 PM",
      availableSeats: 0,
      totalSeats: 40,
      driver: {
        id: "d4",
        name: "Jeison Amado",
        phone: "303-234-5678",
        rating: 5.0,
        experience: "12 años",
        licensePlate: "GHI-321",
        verified: true,
        totalTrips: 2000,
      },
    },
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [isSavingWeeklySchedule, setIsSavingWeeklySchedule] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const refreshWeeklySchedule = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setWeeklySchedule([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/horario-semanal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as HorarioSemanalResponse;

      if (!response.ok || !result.ok || !result.data) {
        setWeeklySchedule([]);
        return;
      }

      setWeeklySchedule(result.data);
    } catch {
      setWeeklySchedule([]);
    }
  };

  const refreshMyReservations = async (schedulesSource?: Schedule[]) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setReservations([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/mias`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as MisReservasResponse;

      if (!response.ok || !result.ok || !result.data) {
        setReservations([]);
        return;
      }

      const source = schedulesSource || schedules;
      const scheduleMap = new Map(source.map((schedule) => [schedule.id, schedule]));
      const detailsMap = getReservationDetailsMap();

      const mappedReservations: Reservation[] = result.data
        .map((item) => {
          const schedule = scheduleMap.get(item.horario.id);
          if (!schedule) {
            return null;
          }

          const savedDetails = detailsMap[item.id];

          return {
            id: item.id,
            scheduleId: item.horario.id,
            weekday: item.diaSemana || null,
            direction: schedule.direction,
            origin: schedule.origin,
            destination: schedule.destination,
            departureTime: schedule.departureTime,
            arrivalTime: schedule.arrivalTime,
            userData: savedDetails || {
              name: user?.name || "Estudiante",
              studentId: "No registrado",
              phone: "No registrado",
              university: "No registrado",
              pickupStop: "No registrado",
              dropoffStop: "No registrado",
            },
            driver: schedule.driver,
            date: new Date(item.createdAt).toLocaleDateString("es-CO"),
          };
        })
        .filter((item): item is Reservation => Boolean(item));

      setReservations(mappedReservations);
    } catch {
      setReservations([]);
    }
  };

  const refreshScheduleAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios`);
      const result = (await response.json()) as HorarioOcupacionResponse;

      if (!response.ok || !result.ok || !result.data) {
        return;
      }

      const ocupacionMap = new Map(
        result.data.map((horario) => [
          horario.id,
          {
            totalSeats: horario.cupoTotal,
            availableSeats: Math.max(0, horario.cupoTotal - horario.cupoOcupado),
            driver: mapConductorToDriver(horario.conductor),
          },
        ])
      );

      const nextSchedules = schedules.map((schedule) => {
          const ocupacion = ocupacionMap.get(schedule.id);
          if (!ocupacion) {
            return schedule;
          }

          return {
            ...schedule,
            totalSeats: ocupacion.totalSeats,
            availableSeats: ocupacion.availableSeats,
            driver: ocupacion.driver,
          };

      });

      setSchedules(nextSchedules);
      return nextSchedules;
    } catch {
      // Silently ignore refresh errors to keep static UI usable.
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setReservations([]);
      setWeeklySchedule([]);
      const updatedSchedules = await refreshScheduleAvailability();
      await refreshMyReservations(updatedSchedules || undefined);
      await refreshWeeklySchedule();
    };

    if (!user?.id) {
      setReservations([]);
      setWeeklySchedule([]);
      return;
    }

    void loadData();
  }, [user?.id]);

  const handleSaveWeeklySchedule = async (items: WeeklyScheduleItem[]) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Sesion expirada", {
        description: "Inicia sesion nuevamente.",
      });
      navigate("/login");
      return false;
    }

    setIsSavingWeeklySchedule(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/horario-semanal`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ horarios: items }),
      });

      const result = (await response.json()) as HorarioSemanalResponse;

      if (!response.ok || !result.ok || !result.data) {
        toast.error("No se pudo guardar", {
          description: result.message || "Revisa los horarios e intenta de nuevo.",
        });
        return false;
      }

      setWeeklySchedule(result.data);

      if (result.meta?.reservasNoAsignadas?.length) {
        toast.error("Algunas reservas no se asignaron", {
          description: "Revisa cupos disponibles en los horarios sugeridos.",
        });
      }

      toast.success("Horario semanal actualizado", {
        description: "Tus horarios de lunes a viernes fueron guardados.",
      });
      return true;
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible guardar el horario semanal.",
      });
      return false;
    } finally {
      setIsSavingWeeklySchedule(false);
    }
  };

  const reservedScheduleIds = new Set(reservations.map((reservation) => reservation.scheduleId));

  const idaSchedules = schedules.filter(
    (schedule) => schedule.direction === "ida" && !reservedScheduleIds.has(schedule.id)
  );
  const vueltaSchedules = schedules.filter(
    (schedule) => schedule.direction === "vuelta" && !reservedScheduleIds.has(schedule.id)
  );

  const handleReserve = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setDialogOpen(true);
    }
  };

  const handleConfirmReservation = async (userData: ReservationData) => {
    if (!selectedSchedule) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Sesion expirada", {
        description: "Inicia sesion nuevamente para reservar.",
      });
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ horarioId: selectedSchedule.id }),
      });

      const result = (await response.json()) as CreateReservationResponse;

      if (!response.ok || !result.ok || !result.data) {
        const message = result.message || "No se pudo confirmar la reserva";

        if (result.code === "CAPACIDAD_COMPLETA") {
          toast.error("Cupo agotado", {
            description: message,
          });
          return;
        }

        toast.error("No se pudo reservar", {
          description: message,
        });
        return;
      }

      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === selectedSchedule.id
            ? { ...schedule, availableSeats: Math.max(0, schedule.availableSeats - 1) }
            : schedule
        )
      );

      setDialogOpen(false);
      setSelectedSchedule(null);

      const detailsMap = getReservationDetailsMap();
      detailsMap[result.data.id] = userData;
      saveReservationDetailsMap(detailsMap);

      const updatedSchedules = await refreshScheduleAvailability();
      await refreshMyReservations(updatedSchedules || undefined);

      toast.success("Reserva confirmada", {
        description: result.message || `Tu cupo para llegar a las ${selectedSchedule.arrivalTime} ha sido reservado.`,
      });
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible conectar con el servidor de reservas.",
      });
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Sesion expirada", {
        description: "Inicia sesion nuevamente.",
      });
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/${reservationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo cancelar", {
          description: result.message || "Intenta nuevamente.",
        });
        return;
      }

      const detailsMap = getReservationDetailsMap();
      delete detailsMap[reservationId];
      saveReservationDetailsMap(detailsMap);

      const updatedSchedules = await refreshScheduleAvailability();
      await refreshMyReservations(updatedSchedules || undefined);

      toast.success("Reserva cancelada", {
        description: "El cupo ha sido liberado.",
      });
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible cancelar la reserva.",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Bus className="size-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl text-blue-900 dark:text-blue-100">Ruta Universitaria</h1>
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                <User className="size-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}
              >
                <User className="size-4 mr-2" />
                Perfil
              </Button>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Buga - Tuluá</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Sistema de reserva de cupos para estudiantes
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <TicketCheck className="size-4" />
              Mis Reservas
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="size-4" />
              Horarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Horarios disponibles - Hoy
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selecciona un horario de ida o vuelta y completa el formulario para reservar tu cupo.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Ida
              </h3>
              {idaSchedules.map((schedule) => (
                <BusScheduleCard
                  key={schedule.id}
                  {...schedule}
                  onReserve={handleReserve}
                />
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Vuelta
              </h3>
              {vueltaSchedules.map((schedule) => (
                <BusScheduleCard
                  key={schedule.id}
                  {...schedule}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservations">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Tus reservas activas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Aquí puedes ver y gestionar tus reservas confirmadas.
              </p>
            </div>
            <MyReservations
              reservations={reservations}
              onCancel={handleCancelReservation}
              weeklySchedule={weeklySchedule}
              onSaveWeeklySchedule={handleSaveWeeklySchedule}
              isSavingWeeklySchedule={isSavingWeeklySchedule}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scheduleInfo={
          selectedSchedule
            ? {
                id: selectedSchedule.id,
                direction: selectedSchedule.direction,
                origin: selectedSchedule.origin,
                destination: selectedSchedule.destination,
                departureTime: selectedSchedule.departureTime,
                arrivalTime: selectedSchedule.arrivalTime,
              }
            : null
        }
        onConfirm={handleConfirmReservation}
      />
    </div>
  );
}
