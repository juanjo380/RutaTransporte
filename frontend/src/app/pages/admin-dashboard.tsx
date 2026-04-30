import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useTheme } from "../context/theme-context";
import {
  Bus,
  LogOut,
  User,
  Clock,
  GraduationCap,
  BarChart3,
  Grid3x3,
  ListChecks,
  UserCog,
  CheckCircle,
  Moon,
  Sun,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";

type Schedule = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  cupoTotal: number;
  cupoOcupado: number;
  route: {
    id: string;
    nombre: string;
    origen: string;
    destino: string;
  } | null;
  driverId: string | null;
  driver: {
    id: string;
    nombre: string;
    email: string;
  } | null;
};

type Reservation = {
  id: string;
  codigo: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  university: string;
  scheduleId: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  status: string;
};

type ReservationStatusFilter = "ACTIVA" | "CANCELADA" | "COMPLETADA";


type DriverAvailability = {
  id: string;
  nombre: string;
  email: string;
  disponible: boolean;
  asignadoEnHorario: boolean;
};

type AdminReservasResponse = {
  ok: boolean;
  message?: string;
  data?: {
    id: string;
    codigo: string;
    estado: string;
    createdAt: string;
    usuario: {
      id: string;
      nombre: string;
      email: string;
    };
    horario: {
      id: string;
      salida: string;
      llegada: string | null;
      cupoTotal: number;
      cupoOcupado: number;
    };
  }[];
};

type HorariosResponse = {
  ok: boolean;
  message?: string;
  data?: Array<{
    id: string;
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

type ConductoresDisponiblesResponse = {
  ok: boolean;
  message?: string;
  data?: {
    horarioId: string;
    conductores: DriverAvailability[];
  };
};

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

const VUELTA_SCHEDULE_IDS = new Set(["4", "5", "6", "9", "10", "11"]);

function getScheduleTime(schedule: Pick<Schedule, "arrivalTime" | "departureTime"> | null | undefined) {
  if (!schedule) {
    return "";
  }

  return schedule.arrivalTime || schedule.departureTime || "-";
}

function getScheduleRoute(schedule: Pick<Schedule, "id" | "route">) {
  if (!schedule.route) {
    return null;
  }

  const isVuelta = VUELTA_SCHEDULE_IDS.has(schedule.id);
  const origin = isVuelta ? schedule.route.destino : schedule.route.origen;
  const destination = isVuelta ? schedule.route.origen : schedule.route.destino;

  return {
    origin,
    destination,
    name: `${origin} - ${destination}`,
  };
}

function mapReservationStatusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVA":
      return "Activa";
    case "CANCELADA":
      return "Cancelada";
    case "COMPLETADA":
      return "Completada";
    default:
      return status;
  }
}

function mapReservationStatusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVA":
      return "bg-green-600";
    case "CANCELADA":
      return "bg-red-600";
    case "COMPLETADA":
      return "bg-blue-600";
    default:
      return "bg-gray-600";
  }
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableDriversBySchedule, setAvailableDriversBySchedule] = useState<Record<string, DriverAvailability[]>>({});
  const [selectedDriverBySchedule, setSelectedDriverBySchedule] = useState<Record<string, string>>({});
  const [emailToCancel, setEmailToCancel] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState<ReservationStatusFilter>("ACTIVA");
  const [occupancyScheduleFilter, setOccupancyScheduleFilter] = useState<string>("all");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigningScheduleId, setIsAssigningScheduleId] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationScheduleId, setNotificationScheduleId] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoadingData(true);

    try {
      const reservasUrl = new URL(`${API_BASE_URL}/api/reservas/admin`);
      reservasUrl.searchParams.set("estado", reservationStatusFilter);

      const [reservasRes, horariosRes] = await Promise.all([
        fetch(reservasUrl.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/api/horarios`),
      ]);

      const reservasJson = (await reservasRes.json()) as AdminReservasResponse;
      const horariosJson = (await horariosRes.json()) as HorariosResponse;

      if (!reservasRes.ok || !reservasJson.ok) {
        toast.error("No se pudieron cargar reservas", {
          description: reservasJson.message || "Intenta nuevamente",
        });
      } else {
        const mappedReservations = (reservasJson.data || []).map((reserva) => ({
          id: reserva.id,
          codigo: reserva.codigo,
          studentId: reserva.usuario.id,
          studentName: reserva.usuario.nombre,
          studentEmail: reserva.usuario.email,
          university: "No informado",
          scheduleId: reserva.horario.id,
          departureTime: formatTime(reserva.horario.salida),
          arrivalTime: formatTime(reserva.horario.llegada || reserva.horario.salida),
          date: new Date(reserva.createdAt).toLocaleDateString("es-CO"),
          status: reserva.estado,
        }));

        setReservations(mappedReservations);
      }

      if (!horariosRes.ok || !horariosJson.ok) {
        toast.error("No se pudieron cargar horarios", {
          description: horariosJson.message || "Intenta nuevamente",
        });
        setSchedules([]);
        setAvailableDriversBySchedule({});
      } else {
        const mappedSchedules = (horariosJson.data || []).map((horario) => ({
          id: horario.id,
          departureTime: formatTime(horario.salida),
          arrivalTime: formatTime(horario.llegada || horario.salida),
          cupoTotal: horario.cupoTotal,
          cupoOcupado: horario.cupoOcupado,
          route: horario.ruta || null,
          driverId: horario.conductor?.id || null,
          driver: horario.conductor || null,
        }));

        setSchedules(mappedSchedules);
        setSelectedDriverBySchedule(
          Object.fromEntries(
            mappedSchedules.map((schedule) => [schedule.id, schedule.driverId || ""])
          )
        );

        const availabilityEntries = await Promise.all(
          mappedSchedules.map(async (schedule) => {
            const response = await fetch(
              `${API_BASE_URL}/api/horarios/admin/conductores-disponibles?horarioId=${encodeURIComponent(schedule.id)}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const json = (await response.json()) as ConductoresDisponiblesResponse;

            if (!response.ok || !json.ok) {
              return [schedule.id, [] as DriverAvailability[]] as const;
            }

            return [schedule.id, json.data?.conductores || []] as const;
          })
        );

        setAvailableDriversBySchedule(Object.fromEntries(availabilityEntries));
      }
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible cargar la informacion del panel.",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [reservationStatusFilter]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCancelReservation = async (reservationId: string) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/admin/${reservationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo cancelar la reserva", {
          description: result.message || "Intenta nuevamente",
        });
        return;
      }

      toast.success("Reserva cancelada", {
        description: "El cupo fue liberado correctamente.",
      });
      await fetchDashboardData();
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible cancelar la reserva.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelByEmail = async () => {
    const email = emailToCancel.trim().toLowerCase();
    if (!email) {
      toast.error("Correo requerido", {
        description: "Ingresa el correo del estudiante a limpiar.",
      });
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas/admin/cancelar-usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        data?: { reservasCanceladas?: number };
      };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo limpiar el usuario", {
          description: result.message || "Intenta nuevamente",
        });
        return;
      }

      toast.success("Reservas canceladas", {
        description: `Se cancelaron ${result.data?.reservasCanceladas ?? 0} reserva(s).`,
      });
      setEmailToCancel("");
      await fetchDashboardData();
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible cancelar reservas por correo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDriver = async (scheduleId: string, driverId: string) => {
    const schedule = schedules.find((item) => item.id === scheduleId);
    const driver = (availableDriversBySchedule[scheduleId] || []).find((item) => item.id === driverId);
    const scheduleTime = getScheduleTime(schedule);

    const confirmation = window.confirm(
      `Confirmar asignacion de ${driver?.nombre || "conductor"} al horario ${scheduleTime}?`
    );

    if (!confirmation) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsAssigningScheduleId(scheduleId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios/admin/asignar-conductor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ horarioId: scheduleId, conductorId: driverId }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo confirmar la asignacion", {
          description: result.message || "Intenta nuevamente",
        });
        return;
      }

      toast.success("Asignacion confirmada", {
        description: `${driver?.nombre || "Conductor"} fue asignado correctamente.`,
      });

      await fetchDashboardData();
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible confirmar la asignacion.",
      });
    } finally {
      setIsAssigningScheduleId(null);
    }
  };

  const handleUnassignDriver = async (scheduleId: string) => {
    const schedule = schedules.find((item) => item.id === scheduleId);
    const scheduleTime = getScheduleTime(schedule);

    const confirmation = window.confirm(
      `Confirmar desasignacion del conductor para el horario ${scheduleTime}?`
    );

    if (!confirmation) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsAssigningScheduleId(scheduleId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios/admin/desasignar-conductor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ horarioId: scheduleId }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo confirmar la desasignacion", {
          description: result.message || "Intenta nuevamente",
        });
        return;
      }

      toast.success("Desasignacion confirmada", {
        description: "El horario quedo sin conductor asignado.",
      });

      await fetchDashboardData();
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible desasignar el conductor.",
      });
    } finally {
      setIsAssigningScheduleId(null);
    }
  };

  const scheduleMatrix = schedules.map((schedule) => {
    const studentsInSchedule = reservations.filter((reservation) => reservation.scheduleId === schedule.id);

    return {
      ...schedule,
      studentCount: studentsInSchedule.length,
      students: studentsInSchedule,
    };
  });

  const occupancyRows = schedules
    .filter((schedule) => occupancyScheduleFilter === "all" || schedule.id === occupancyScheduleFilter)
    .map((schedule) => {
      const occupiedSeats = Math.max(0, schedule.cupoOcupado);
      const totalSeats = Math.max(0, schedule.cupoTotal);
      const occupancyPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

      return {
        scheduleId: schedule.id,
        scheduleLabel: getScheduleTime(schedule),
        routeLabel: (() => {
          const route = getScheduleRoute(schedule);
          if (!route) {
            return "Ruta sin informacion";
          }
          return `${route.name} (${route.origin} -> ${route.destination})`;
        })(),
        occupiedSeats,
        totalSeats,
        occupancyPct,
      };
    });

  const allAvailableDrivers = useMemo(() => {
    const allDrivers = Object.values(availableDriversBySchedule).flat();
    const uniqueMap = new Map<string, DriverAvailability>();

    allDrivers.forEach((driver) => {
      if (!uniqueMap.has(driver.id)) {
        uniqueMap.set(driver.id, driver);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [availableDriversBySchedule]);

  const totalReservations = reservations.length;
  const totalStudents = new Set(reservations.map((reservation) => reservation.studentEmail)).size;
  const handleSendNotification = async () => {
    const titulo = notificationTitle.trim();
    const mensaje = notificationMessage.trim();

    if (!titulo || !mensaje) {
      toast.error("Titulo y mensaje requeridos", {
        description: "Completa el titulo y el mensaje antes de enviar.",
      });
      return;
    }

    if (!notificationScheduleId) {
      toast.error("Selecciona un horario", {
        description: "Debes elegir un horario para enviar la notificacion.",
      });
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSendingNotification(true);
    try {
      const payload: Record<string, string> = {
        titulo,
        mensaje,
        horarioId: notificationScheduleId,
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/notificaciones/contratiempo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { ok: boolean; message?: string; data?: { enviados?: number } };

      if (!response.ok || !result.ok) {
        toast.error("No se pudo enviar la notificacion", {
          description: result.message || "Intenta nuevamente",
        });
        return;
      }

      toast.success("Notificacion enviada", {
        description: `Correos enviados: ${result.data?.enviados ?? 0}.`,
      });
      setNotificationTitle("");
      setNotificationMessage("");
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible enviar la notificacion.",
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bus className="size-10 text-purple-600" />
              <div>
                <h1 className="text-4xl text-purple-900 dark:text-purple-200">Panel Administrativo</h1>
                <p className="text-gray-700 dark:text-gray-300">Gestión de reservas y cupos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div
                className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-3 py-2 rounded-lg cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/profile")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate("/profile");
                  }
                }}
              >
                <User className="size-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>

        {isLoadingData && (
          <Card className="mb-6">
            <CardContent className="py-4 text-sm text-gray-600 dark:text-gray-300">
              Cargando informacion del panel administrativo...
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-900 dark:text-purple-200">{totalReservations}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Estudiantes Únicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GraduationCap className="size-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-900 dark:text-blue-200">{totalStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Horarios Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="size-8 text-green-600" />
                <span className="text-3xl font-bold text-green-900 dark:text-green-200">{schedules.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <Grid3x3 className="size-4" />
              Matriz de Rutas
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <ListChecks className="size-4" />
              Vista Rápida
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <UserCog className="size-4" />
              Asignar Conductores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">Matriz de rutas del día</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Visualización completa de todos los horarios, conductores asignados y estudiantes
              </p>
            </div>

            <div className="space-y-4">
              {scheduleMatrix.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="size-5 text-purple-600" />
                          {getScheduleTime(schedule)}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Ruta: {getScheduleRoute(schedule)
                            ? `${getScheduleRoute(schedule)?.origin} -> ${getScheduleRoute(schedule)?.destination}`
                            : "Ruta sin informacion"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">{schedule.studentCount}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Estudiantes</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {schedule.driver ? (
                      <div className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/40 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg">
                              <Bus className="size-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900 dark:text-green-200">{schedule.driver.nombre}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{schedule.driver.email}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-600 flex items-center gap-1">
                            <CheckCircle className="size-3" />
                            Asignado
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/40 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-medium">Sin conductor asignado</p>
                      </div>
                    )}

                    {schedule.studentCount > 0 ? (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Estudiantes registrados:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedule.students.map((student) => (
                            <div
                              key={student.id}
                              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="size-4 text-gray-600" />
                                <div>
                                  <p
                                    className="text-sm font-medium cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => navigate(`/users/${student.studentId}`)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        navigate(`/users/${student.studentId}`);
                                      }
                                    }}
                                  >
                                    {student.studentName}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{student.studentEmail}</p>
                                  <Badge className={`mt-1 text-xs ${mapReservationStatusBadgeClass(student.status)}`}>
                                    {mapReservationStatusLabel(student.status)}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isSubmitting || student.status !== "ACTIVA"}
                                onClick={() => handleCancelReservation(student.id)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-500 text-center py-2">No hay estudiantes registrados en este horario</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">Vista rápida de ocupación</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Resumen compacto de cuántos estudiantes hay en cada horario</p>
              <div className="mt-3 max-w-xs">
                <Select
                  value={reservationStatusFilter}
                  onValueChange={(value) => setReservationStatusFilter(value as ReservationStatusFilter)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVA">Activas</SelectItem>
                    <SelectItem value="CANCELADA">Canceladas</SelectItem>
                    <SelectItem value="COMPLETADA">Completadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notificar contratiempo</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Envía un correo a estudiantes con reservas activas según ruta u horario.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Titulo de la notificacion"
                    value={notificationTitle}
                    onChange={(event) => setNotificationTitle(event.target.value)}
                  />
                </div>

                <Select value={notificationScheduleId} onValueChange={setNotificationScheduleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.length === 0 ? (
                      <SelectItem value="" disabled>
                        Sin horarios disponibles
                      </SelectItem>
                    ) : (
                      schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          {getScheduleTime(schedule)}
                          {getScheduleRoute(schedule)
                            ? ` | ${getScheduleRoute(schedule)?.name} (${getScheduleRoute(schedule)?.origin} -> ${getScheduleRoute(schedule)?.destination})`
                            : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Mensaje para los estudiantes"
                  value={notificationMessage}
                  onChange={(event) => setNotificationMessage(event.target.value)}
                />

                <div className="flex justify-end">
                  <Button onClick={handleSendNotification} disabled={isSendingNotification}>
                    Enviar notificacion
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Demanda por ruta</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Número de estudiantes por ruta y ocupación total de cupos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xs">
                  <Select value={occupancyScheduleFilter} onValueChange={setOccupancyScheduleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por horario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los horarios</SelectItem>
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          {getScheduleTime(schedule)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {occupancyRows.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay horarios para el filtro seleccionado.</p>
                ) : (
                  <div className="space-y-3">
                    {occupancyRows.map((row) => (
                      <div
                        key={row.scheduleId}
                        className="rounded-lg border bg-gray-50/80 dark:bg-gray-900/60 p-3 space-y-2"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{row.routeLabel}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Horario: {row.scheduleLabel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-200">
                              {row.occupiedSeats}/{row.totalSeats}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{row.occupancyPct}% ocupación</p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            style={{ width: `${Math.min(100, row.occupancyPct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cancelar reservas por estudiante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    placeholder="correo@ejemplo.com"
                    value={emailToCancel}
                    onChange={(event) => setEmailToCancel(event.target.value)}
                  />
                  <Button onClick={handleCancelByEmail} disabled={isSubmitting}>
                    Cancelar reservas del correo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100 dark:bg-gray-800/70">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">Horario</th>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">Conductor</th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">Estudiantes</th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">Estado</th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">Accion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scheduleMatrix.map((schedule, index) => (
                        <tr
                          key={schedule.id}
                          className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-gray-500" />
                              <span className="font-medium">
                                {getScheduleTime(schedule)}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            {schedule.driver ? (
                              <div>
                                <p className="font-medium">{schedule.driver.nombre}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{schedule.driver.email}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Sin asignar</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center justify-center bg-purple-100 dark:bg-gray-700 rounded-full px-3 py-1">
                              <span className="text-lg font-bold text-purple-900 dark:text-purple-200">{schedule.studentCount}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {schedule.driver ? (
                              <Badge className="bg-green-600">Listo</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                Pendiente
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs text-gray-500 dark:text-gray-300">Gestionar en "Asignar Conductores"</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total de estudiantes transportados hoy</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{totalReservations}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Rutas con conductor asignado</p>
                    <p className="text-3xl font-bold text-green-700">
                      {scheduleMatrix.filter((item) => item.driver).length}/{schedules.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">Asignar conductores a rutas</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Se muestran solo conductores disponibles por horario. La asignación solicita confirmación.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-5 text-green-600" />
                  Conductores disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allAvailableDrivers.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No hay conductores registrados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allAvailableDrivers.map((driver) => (
                      <div key={driver.id} className="bg-white dark:bg-gray-900 rounded-lg p-3">
                        <p className="font-medium">{driver.nombre}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{driver.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {schedules.map((schedule) => {
                const driversForSchedule = availableDriversBySchedule[schedule.id] || [];
                const selectableDrivers = driversForSchedule.filter(
                  (driver) => driver.disponible || driver.id === schedule.driverId
                );

                return (
                  <Card key={schedule.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="size-5 text-purple-600" />
                          {getScheduleTime(schedule)}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{selectableDrivers.length} disponibles</Badge>
                          {schedule.driver && <Badge className="bg-green-600">Asignado</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[120px]">Conductor:</label>
                        <Select
                          value={selectedDriverBySchedule[schedule.id] || undefined}
                          onValueChange={(value) => {
                            setSelectedDriverBySchedule((prev) => ({
                              ...prev,
                              [schedule.id]: value,
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar conductor" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableDrivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                <div className="flex items-center gap-2">
                                  <span>{driver.nombre}</span>
                                  <span className="text-xs text-gray-500">({driver.email})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          disabled={isAssigningScheduleId === schedule.id || !selectedDriverBySchedule[schedule.id]}
                          onClick={() => {
                            const selectedDriverId = selectedDriverBySchedule[schedule.id];
                            if (selectedDriverId) {
                              void handleAssignDriver(schedule.id, selectedDriverId);
                            }
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={isAssigningScheduleId === schedule.id || !schedule.driverId}
                          onClick={() => {
                            void handleUnassignDriver(schedule.id);
                          }}
                        >
                          Desasignar
                        </Button>
                      </div>
                      {schedule.driver && (
                        <div className="mt-3 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/40 rounded-lg p-2">
                          <p className="text-xs text-green-800 dark:text-green-200">
                            Asignado actualmente: {schedule.driver.nombre} ({schedule.driver.email})
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}