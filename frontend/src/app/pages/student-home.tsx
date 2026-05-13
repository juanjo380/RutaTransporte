import { useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { MyReservations, WeeklyScheduleItem } from "../components/my-reservations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const RESERVATION_DETAILS_STORAGE_KEY = "ruta_transporte_reservation_details";
const RESERVATION_PROFILE_STORAGE_KEY = "ruta_transporte_reservation_profile";
const FIXED_UCEVA_STOP = "Tulua - UCEVA";
const LOCAL_PROFILE_KEY_PREFIX = "ruta_transporte_local_profile_";

interface Schedule {
  id: string;
  direction: "ida" | "vuelta";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  departureAt: string;
  arrivalAt: string | null;
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
    direccion?: "IDA" | "VUELTA" | null;
    salida: string;
    llegada: string | null;
    cupoTotal: number;
    cupoOcupado: number;
    ruta?: {
      id: string;
      nombre: string;
      origen: string;
      destino: string;
    } | null;
    conductor?: {
      id: string;
      nombre: string;
      email: string;
    } | null;
  }>;
};

type CalendarioResponse = {
  ok: boolean;
  message?: string;
  data?: {
    diaSemana: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | null;
    diaLabel: string | null;
    fechaIso: string;
    fechaLabel: string;
    esDiaSiguiente: boolean;
    cutoffHour: number;
  };
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
      direccion?: "IDA" | "VUELTA" | null;
      salida: string;
      llegada: string | null;
      ruta?: {
        id: string;
        nombre: string;
        origen: string;
        destino: string;
      } | null;
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
type ReservationProfileMap = Record<string, ReservationData>;
type LocalProfile = { lastName?: string; university?: string };

type HorarioOcupantesResponse = {
  ok: boolean;
  message?: string;
  data?: {
    horarioId: string;
    ocupantes: Array<{
      id: string;
      name: string;
    }>;
  };
  error?: string;
};

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

function getReservationProfile(userId?: string | null): ReservationData | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(RESERVATION_PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const map = JSON.parse(raw) as ReservationProfileMap;
    return map[userId] || null;
  } catch {
    return null;
  }
}

function saveReservationProfile(userId: string | null | undefined, profile: ReservationData) {
  if (!userId) {
    return;
  }

  try {
    const raw = localStorage.getItem(RESERVATION_PROFILE_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as ReservationProfileMap) : {};
    map[userId] = profile;
    localStorage.setItem(RESERVATION_PROFILE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors to keep UI usable.
  }
}

function getLocalProfileUniversity(userId?: string | null): string | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    const profile = JSON.parse(raw) as LocalProfile;
    return profile.university || null;
  } catch {
    return null;
  }
}

function getLocalProfileLastName(userId?: string | null): string | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    const profile = JSON.parse(raw) as LocalProfile;
    return profile.lastName || null;
  } catch {
    return null;
  }
}

function buildFallbackReservationData(
  direction: "ida" | "vuelta",
  user: { name?: string | null; phone?: string | null; location?: string | null } | null,
  profile: ReservationData | null,
  localUniversity: string | null,
  localLastName: string | null
): ReservationData {
  if (profile) {
    return profile;
  }

  const location = user?.location || "No registrado";
  const university = localUniversity || "UCEVA";
  const baseName = user?.name || "Estudiante";
  const fullName = localLastName ? `${baseName} ${localLastName}`.trim() : baseName;

  return {
    name: fullName,
    studentId: "No registrado",
    phone: user?.phone || "No registrado",
    university,
    pickupStop: direction === "vuelta" ? FIXED_UCEVA_STOP : location,
    dropoffStop: direction === "ida" ? FIXED_UCEVA_STOP : location,
  };
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

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function mapDireccionToDirection(value?: string | null): "ida" | "vuelta" {
  return String(value || "").toUpperCase() === "VUELTA" ? "vuelta" : "ida";
}

function getRouteForHorario(
  horario: { ruta?: { origen: string; destino: string } | null },
  direction: "ida" | "vuelta"
) {
  if (!horario.ruta) {
    return { origin: "-", destination: "-" };
  }

  if (direction === "vuelta") {
    return { origin: horario.ruta.destino, destination: horario.ruta.origen };
  }

  return { origin: horario.ruta.origen, destination: horario.ruta.destino };
}

function getScheduleTime(schedule: Pick<Schedule, "arrivalTime" | "departureTime">) {
  return schedule.arrivalTime || schedule.departureTime || "-";
}

export function StudentHome() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleOpenDriverProfile = (driverId: string) => {
    navigate(`/users/${driverId}`);
  };

  const [calendarContext, setCalendarContext] = useState<CalendarioResponse["data"] | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [isSavingWeeklySchedule, setIsSavingWeeklySchedule] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [isOccupantsOpen, setIsOccupantsOpen] = useState(false);
  const [isOccupantsLoading, setIsOccupantsLoading] = useState(false);
  const [occupantsError, setOccupantsError] = useState<string | null>(null);
  const [occupantsSchedule, setOccupantsSchedule] = useState<Schedule | null>(null);
  const [occupants, setOccupants] = useState<Array<{ id: string; name: string }>>([]);

  const fetchCalendarContext = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendario/estado`);
      const result = (await response.json()) as CalendarioResponse;

      if (!response.ok || !result.ok || !result.data) {
        return;
      }

      setCalendarContext(result.data);
    } catch {
      // Ignore calendar errors to keep UI usable.
    }
  };

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
      const profile = getReservationProfile(user?.id);
      const localUniversity = getLocalProfileUniversity(user?.id);
      const localLastName = getLocalProfileLastName(user?.id);

      const mappedReservations: Reservation[] = result.data.reduce<Reservation[]>((acc, item) => {
        const schedule = scheduleMap.get(item.horario.id);
        const direction = schedule?.direction || mapDireccionToDirection(item.horario.direccion);
        const routeInfo = schedule
          ? { origin: schedule.origin, destination: schedule.destination }
          : getRouteForHorario(item.horario, direction);

        const savedDetails = detailsMap[item.id];
        const fallbackDetails = buildFallbackReservationData(
          direction,
          user,
          profile,
          localUniversity,
          localLastName
        );

        acc.push({
          id: item.id,
          scheduleId: item.horario.id,
          weekday: item.diaSemana || null,
          direction,
          origin: routeInfo.origin,
          destination: routeInfo.destination,
          departureTime: schedule?.departureTime || formatTime(item.horario.salida),
          arrivalTime: schedule?.arrivalTime || formatTime(item.horario.llegada || item.horario.salida),
          userData: savedDetails || fallbackDetails,
          driver: schedule?.driver || mapConductorToDriver(null),
          date: new Date(item.createdAt).toLocaleDateString("es-CO"),
        });

        return acc;
      }, []);

      setReservations(mappedReservations);
    } catch {
      setReservations([]);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios`);
      const result = (await response.json()) as HorarioOcupacionResponse;

      if (!response.ok || !result.ok || !result.data) {
        return null;
      }

      const mappedSchedules = result.data.map((horario) => {
        const direction = mapDireccionToDirection(horario.direccion);
        const routeInfo = getRouteForHorario({ ruta: horario.ruta || null }, direction);

        return {
          id: horario.id,
          direction,
          origin: routeInfo.origin,
          destination: routeInfo.destination,
          departureTime: formatTime(horario.salida),
          arrivalTime: formatTime(horario.llegada || horario.salida),
          departureAt: horario.salida,
          arrivalAt: horario.llegada || null,
          availableSeats: Math.max(0, horario.cupoTotal - horario.cupoOcupado),
          totalSeats: horario.cupoTotal,
          driver: mapConductorToDriver(horario.conductor),
        } as Schedule;
      });

      setSchedules(mappedSchedules);
      return mappedSchedules;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setReservations([]);
      setWeeklySchedule([]);
      await fetchCalendarContext();
      const updatedSchedules = await loadSchedules();
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

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const aDate = new Date(a.departureAt);
      const bDate = new Date(b.departureAt);
      const aMinutes = aDate.getHours() * 60 + aDate.getMinutes();
      const bMinutes = bDate.getHours() * 60 + bDate.getMinutes();
      if (aMinutes !== bMinutes) {
        return aMinutes - bMinutes;
      }
      return a.origin.localeCompare(b.origin);
    });
  }, [schedules]);

  const idaSchedules = sortedSchedules.filter(
    (schedule) => schedule.direction === "ida" && !reservedScheduleIds.has(schedule.id)
  );
  const vueltaSchedules = sortedSchedules.filter(
    (schedule) => schedule.direction === "vuelta" && !reservedScheduleIds.has(schedule.id)
  );

  const handleReserve = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setDialogOpen(true);
    }
  };

  const handleViewOccupants = async (scheduleId: string) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Sesion expirada", {
        description: "Inicia sesion nuevamente.",
      });
      navigate("/login");
      return;
    }

    const schedule = schedules.find((s) => s.id === scheduleId) || null;
    setOccupantsSchedule(schedule);
    setIsOccupantsOpen(true);
    setIsOccupantsLoading(true);
    setOccupantsError(null);
    setOccupants([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios/${scheduleId}/ocupantes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = (await response.json()) as HorarioOcupantesResponse;

      if (!response.ok || !json.ok || !json.data) {
        setOccupantsError(
          json.message ||
            (response.status === 403
              ? "No tienes permisos para ver los ocupantes de este horario."
              : "No fue posible cargar los ocupantes.")
        );
        return;
      }

      setOccupants(json.data.ocupantes || []);
    } catch {
      setOccupantsError("No fue posible conectar con el servidor.");
    } finally {
      setIsOccupantsLoading(false);
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
      saveReservationProfile(user?.id, userData);

      const updatedSchedules = await loadSchedules();
      await refreshMyReservations(updatedSchedules || undefined);

      toast.success("Reserva confirmada", {
        description: result.message || `Tu cupo para las ${getScheduleTime(selectedSchedule)} ha sido reservado.`,
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

      const updatedSchedules = await loadSchedules();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
            <div className="hidden lg:flex flex-1" />
            <div className="flex items-center justify-center gap-3">
              <Bus className="size-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl sm:text-4xl text-blue-900 dark:text-blue-100">Ruta Universitaria</h1>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
              <div
                className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-2 rounded-lg cursor-pointer w-full justify-center sm:w-auto"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/profile")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate("/profile");
                  }
                }}
              >
                <User className="size-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
              </div>
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
          <p className="text-lg text-gray-700 dark:text-gray-300">Buga - Tuluá / Tuluá - Buga</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Sistema de reserva de cupos para estudiantes
          </p>
          {calendarContext?.diaLabel ? (
            <div className="mt-5 flex flex-col items-center gap-1">
              <span className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Dia asignado
              </span>
              <h2 className="text-3xl font-semibold text-blue-900 dark:text-blue-100">
                {calendarContext.diaLabel}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {calendarContext.fechaLabel}
              </p>
              {calendarContext.esDiaSiguiente ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Asignaciones aplican al siguiente dia desde las {calendarContext.cutoffHour}:00
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6">
            <TabsTrigger value="reservations" className="flex w-full items-center justify-center gap-2">
              <TicketCheck className="size-4" />
              Mis Reservas
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex w-full items-center justify-center gap-2">
              <Calendar className="size-4" />
              Horarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 mb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Horarios disponibles
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Selecciona un horario de ida o vuelta y completa el formulario para reservar tu cupo.
                  </p>
                </div>
                {calendarContext?.diaLabel ? (
                  <div className="rounded-lg bg-white/70 dark:bg-gray-900/60 px-3 py-2 text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Dia asignado
                    </p>
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                      {calendarContext.diaLabel}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {calendarContext.fechaLabel}
                    </p>
                  </div>
                ) : null}
              </div>
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
                  onDriverClick={handleOpenDriverProfile}
                  onViewOccupants={handleViewOccupants}
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
                  onDriverClick={handleOpenDriverProfile}
                  onViewOccupants={handleViewOccupants}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservations">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 mb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Tus reservas activas
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Aqui puedes ver y gestionar tus reservas confirmadas.
                  </p>
                </div>
                {calendarContext?.diaLabel ? (
                  <div className="rounded-lg bg-white/70 dark:bg-gray-900/60 px-3 py-2 text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Dia asignado
                    </p>
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                      {calendarContext.diaLabel}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {calendarContext.fechaLabel}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <MyReservations
              reservations={reservations}
              onCancel={handleCancelReservation}
              onDriverClick={handleOpenDriverProfile}
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

      <Dialog open={isOccupantsOpen} onOpenChange={setIsOccupantsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ocupantes del horario</DialogTitle>
          </DialogHeader>

          {occupantsSchedule ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {occupantsSchedule.direction === "ida" ? "Ida" : "Vuelta"} • {occupantsSchedule.origin} → {occupantsSchedule.destination}
            </p>
          ) : null}

          {isOccupantsLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Cargando ocupantes...</p>
          ) : occupantsError ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">{occupantsError}</p>
          ) : occupants.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Aún no hay ocupantes asignados.</p>
          ) : (
            <div className="space-y-2">
              {occupants.map((occupant) => (
                <div
                  key={occupant.id}
                  className="flex items-center justify-between rounded-md border border-input bg-white/60 dark:bg-gray-900/40 px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {occupant.name}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsOccupantsOpen(false);
                      navigate(`/users/${occupant.id}`);
                    }}
                  >
                    Ver perfil
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOccupantsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
