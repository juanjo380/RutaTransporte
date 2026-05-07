import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Bus,
  Calendar,
  LogOut,
  User,
  Clock,
  MapPin,
  Users,
  Shield,
  Route,
  GraduationCap,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";

type DriverReservation = {
  id: string;
  codigo: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
};

type DriverSchedule = {
  id: string;
  direccion?: "IDA" | "VUELTA" | null;
  salida: string;
  llegada: string | null;
  ruta: {
    nombre: string;
    origen: string;
    destino: string;
  };
  reservas: DriverReservation[];
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

type DriverViewResponse = {
  ok: boolean;
  message?: string;
  data?: {
    conductor: {
      id: string;
      nombre: string;
      email: string;
    };
    horarios: DriverSchedule[];
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getRouteDisplay(schedule: DriverSchedule) {
  if (!schedule.ruta) {
    return { origin: "-", destination: "-", name: "-" };
  }
  const direction = String(schedule.direccion || "").toUpperCase();
  const isVuelta = direction === "VUELTA";
  const origin = isVuelta ? schedule.ruta.destino : schedule.ruta.origen;
  const destination = isVuelta ? schedule.ruta.origen : schedule.ruta.destino;

  return {
    origin,
    destination,
    name: `${origin} - ${destination}`,
  };
}

export function DriverView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [driverInfo, setDriverInfo] = useState<{ id: string; nombre: string; email: string } | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarContext, setCalendarContext] = useState<CalendarioResponse["data"] | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  const fetchDriverData = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios/conductor/mis-horarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = (await response.json()) as DriverViewResponse;
      const payload = json.data;

      if (!response.ok || !json.ok || !payload) {
        toast.error("No se pudo cargar la agenda del conductor", {
          description: json.message || "Intenta nuevamente.",
        });
        return;
      }

      setDriverInfo(payload.conductor);
      setSchedules(payload.horarios || []);

      if (payload.horarios.length > 0) {
        setSelectedScheduleId((prev) => prev || payload.horarios[0].id);
      } else {
        setSelectedScheduleId(null);
      }
    } catch {
      toast.error("Error de conexion", {
        description: "No fue posible cargar la agenda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCalendarContext();
    void fetchDriverData();
  }, []);

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) || null,
    [schedules, selectedScheduleId]
  );

  const selectedRoute = useMemo(
    () => (selectedSchedule ? getRouteDisplay(selectedSchedule) : null),
    [selectedSchedule]
  );

  const totalStudentsToday = useMemo(
    () => schedules.reduce((acc, schedule) => acc + schedule.reservas.length, 0),
    [schedules]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 dark:bg-green-500 p-3 rounded-xl shadow-lg">
                <Bus className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl text-green-900 dark:text-green-200">Panel del Conductor</h1>
                <p className="text-gray-700 dark:text-gray-300">Mis rutas y pasajeros</p>
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
            {calendarContext?.diaLabel ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm px-4 py-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Calendar className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Dia asignado
                  </p>
                  <p className="text-xl font-semibold text-green-900 dark:text-green-200">
                    {calendarContext.diaLabel}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {calendarContext.fechaLabel}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isLoading && (
          <Card className="mb-6">
            <CardContent className="py-4 text-sm text-gray-600 dark:text-gray-300">
              Cargando agenda del conductor...
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-green-600" />
              Informacion del Conductor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Bus className="size-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Conductor</p>
                  <p className="font-semibold">{driverInfo?.nombre || user?.name || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Route className="size-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Horarios asignados</p>
                  <p className="font-semibold">{schedules.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Pasajeros activos</p>
                  <p className="font-semibold">{totalStudentsToday}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-5" />
              Mis horarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No tienes horarios asignados actualmente.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schedules.map((schedule) => (
                  <Button
                    key={schedule.id}
                    variant={selectedScheduleId === schedule.id ? "default" : "outline"}
                    onClick={() => setSelectedScheduleId(schedule.id)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="size-4" />
                    <span className="flex flex-col items-start">
                      <span className="text-sm">{formatTime(schedule.llegada || schedule.salida)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        {calendarContext?.fechaLabel || formatDate(schedule.salida)}
                      </span>
                    </span>
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                      {schedule.reservas.length} pasajeros
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedSchedule && (
          <>
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {calendarContext?.fechaLabel || formatDate(selectedSchedule.salida)}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="size-4" />
                    <span>
                      {selectedRoute?.origin || "-"} {"->"} {selectedRoute?.destination || "-"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Detalle de ruta: {selectedRoute?.name || "-"}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{selectedSchedule.reservas.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Pasajeros</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedSchedule.reservas.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No hay pasajeros activos en este horario
                  </CardContent>
                </Card>
              ) : (
                selectedSchedule.reservas.map((reservation, index) => (
                  <Card key={reservation.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full size-10 flex items-center justify-center">
                            <span className="font-semibold text-green-700 dark:text-green-200">{index + 1}</span>
                          </div>
                          <div
                            className="cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/users/${reservation.usuario.id}`)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                navigate(`/users/${reservation.usuario.id}`);
                              }
                            }}
                          >
                            <CardTitle className="text-base">{reservation.usuario.nombre}</CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{reservation.usuario.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">Confirmado</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <GraduationCap className="size-4" />
                        Codigo reserva: {reservation.codigo}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
