import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useTheme } from "../context/theme-context";
import { Bus, LogOut, User, Clock, GraduationCap, BarChart3, Grid3x3, ListChecks, UserCog, Star, Shield, CheckCircle, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { Input } from "../components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";

// Mock data - conductores disponibles
const availableDrivers = [
  {
    id: "d1",
    name: "Carlos Rodríguez",
    licensePlate: "ABC-123",
    rating: 4.8,
    experience: "8 años",
    verified: true,
  },
  {
    id: "d2",
    name: "María González",
    licensePlate: "XYZ-789",
    rating: 4.9,
    experience: "10 años",
    verified: true,
  },
  {
    id: "d3",
    name: "Jorge Martínez",
    licensePlate: "DEF-456",
    rating: 4.7,
    experience: "6 años",
    verified: true,
  },
  {
    id: "d4",
    name: "Andrea López",
    licensePlate: "GHI-321",
    rating: 5.0,
    experience: "12 años",
    verified: true,
  },
];

type Schedule = {
  id: string;
  departureTime: string;
  arrivalTime: string;
  driverId: string | null;
};

type Reservation = {
  id: string;
  codigo: string;
  studentName: string;
  studentEmail: string;
  university: string;
  scheduleId: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  status: string;
};

type AdminReservasResponse = {
  ok: boolean;
  message?: string;
  data?: Array<{
    id: string;
    codigo: string;
    estado: string;
    createdAt: string;
    usuario: {
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
  }>;
};

type HorariosResponse = {
  ok: boolean;
  message?: string;
  data?: Array<{
    id: string;
    salida: string;
    llegada: string | null;
  }>;
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

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [emailToCancel, setEmailToCancel] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoadingData(true);
    try {
      const [reservasRes, horariosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reservas/admin`, {
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
          studentName: reserva.usuario.nombre,
          studentEmail: reserva.usuario.email,
          university: "No informado",
          scheduleId: reserva.horario.id,
          departureTime: formatTime(reserva.horario.salida),
          arrivalTime: formatTime(reserva.horario.llegada || reserva.horario.salida),
          date: new Date(reserva.createdAt).toLocaleDateString("es-CO"),
          status: reserva.estado.toLowerCase(),
        }));

        setReservations(mappedReservations);
      }

      if (!horariosRes.ok || !horariosJson.ok) {
        toast.error("No se pudieron cargar horarios", {
          description: horariosJson.message || "Intenta nuevamente",
        });
      } else {
        const mappedSchedules = (horariosJson.data || []).map((horario) => ({
          id: horario.id,
          departureTime: formatTime(horario.salida),
          arrivalTime: formatTime(horario.llegada || horario.salida),
          driverId: null,
        }));

        setSchedules(mappedSchedules);
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
  }, []);

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

      const result = (await response.json()) as { ok: boolean; message?: string; data?: { reservasCanceladas?: number } };

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

  // Get unique schedules for filter
  const scheduleOptions = Array.from(
    new Set(reservations.map((r) => `${r.departureTime} - ${r.arrivalTime}`))
  );

  // Statistics
  const totalReservations = reservations.length;
  const totalStudents = new Set(reservations.map((r) => r.studentEmail)).size;

  // Matriz de rutas - agrupar por horario
  const scheduleMatrix = schedules.map((schedule) => {
    const studentsInSchedule = reservations.filter(
      (r) => r.scheduleId === schedule.id
    );
    const driver = availableDrivers.find((d) => d.id === schedule.driverId);
    return {
      ...schedule,
      driver,
      studentCount: studentsInSchedule.length,
      students: studentsInSchedule,
    };
  });

  // Asignar conductor a ruta
  const handleAssignDriver = (scheduleId: string, driverId: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId ? { ...s, driverId: driverId } : s
      )
    );
    const driver = availableDrivers.find((d) => d.id === driverId);
    toast.success("Conductor asignado", {
      description: `${driver?.name} ha sido asignado a la ruta.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-3 py-2 rounded-lg">
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

        {/* Statistics Cards */}
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-900 dark:text-purple-200">
                  {totalReservations}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Estudiantes Únicos
              </CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Horarios Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="size-8 text-green-600" />
                <span className="text-3xl font-bold text-green-900 dark:text-green-200">
                  {scheduleOptions.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes vistas */}
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

          {/* MATRIZ DE RUTAS */}
          <TabsContent value="matrix" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Matriz de rutas del día
              </h2>
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
                          {schedule.departureTime} - {schedule.arrivalTime}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Ruta: Buga → Tuluá
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">
                          {schedule.studentCount}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Estudiantes</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Conductor asignado */}
                    {schedule.driver ? (
                      <div className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/40 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg">
                              <Bus className="size-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900 dark:text-green-200">
                                {schedule.driver.name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span>Placa: {schedule.driver.licensePlate}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                  {schedule.driver.rating}
                                </span>
                              </div>
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
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Sin conductor asignado
                        </p>
                      </div>
                    )}

                    {/* Lista de estudiantes */}
                    {schedule.studentCount > 0 ? (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Estudiantes registrados:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedule.students.map((student) => (
                            <div
                              key={student.id}
                              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="size-4 text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {student.studentName}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">
                                    {student.studentEmail}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isSubmitting}
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
                        <p className="text-sm text-gray-500 text-center py-2">
                          No hay estudiantes registrados en este horario
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* VISTA RÁPIDA */}
          <TabsContent value="quick" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Vista rápida de ocupación
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Resumen compacto de cuántos estudiantes hay en cada horario
              </p>
            </div>

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

            {/* Tabla compacta */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100 dark:bg-gray-800/70">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Horario
                        </th>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Conductor
                        </th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Estudiantes
                        </th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Estado
                        </th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
                          Accion
                        </th>
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
                                {schedule.departureTime} - {schedule.arrivalTime}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            {schedule.driver ? (
                              <div>
                                <p className="font-medium">{schedule.driver.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  {schedule.driver.licensePlate}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Sin asignar
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center justify-center bg-purple-100 dark:bg-gray-700 rounded-full px-3 py-1">
                              <span className="text-lg font-bold text-purple-900 dark:text-purple-200">
                                {schedule.studentCount}
                              </span>
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
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              Gestionar en "Matriz de Rutas"
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total de estudiantes transportados hoy</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">
                      {totalReservations}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Rutas con conductor asignado</p>
                    <p className="text-3xl font-bold text-green-700">
                      {scheduleMatrix.filter((s) => s.driver).length}/{schedules.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASIGNAR CONDUCTORES */}
          <TabsContent value="assign" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Asignar conductores a rutas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gestiona qué conductor estará a cargo de cada horario
              </p>
            </div>

            {/* Lista de conductores disponibles */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-5 text-green-600" />
                  Conductores disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <User className="size-5 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <span>{driver.licensePlate}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="size-3 text-yellow-500 fill-yellow-500" />
                              {driver.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                      {driver.verified && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="size-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Formulario de asignación */}
            <div className="space-y-3">
              {schedules.map((schedule) => {
                const currentDriver = availableDrivers.find(
                  (d) => d.id === schedule.driverId
                );
                return (
                  <Card key={schedule.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="size-5 text-purple-600" />
                          {schedule.departureTime} - {schedule.arrivalTime}
                        </CardTitle>
                        {currentDriver && (
                          <Badge className="bg-green-600">Asignado</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[120px]">
                          Conductor:
                        </label>
                        <Select
                          value={schedule.driverId || ""}
                          onValueChange={(value) =>
                            handleAssignDriver(schedule.id, value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar conductor" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDrivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                <div className="flex items-center gap-2">
                                  <span>{driver.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({driver.licensePlate})
                                  </span>
                                  <span className="text-xs flex items-center gap-1">
                                    <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                    {driver.rating}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {currentDriver && (
                        <div className="mt-3 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/40 rounded-lg p-2">
                          <p className="text-xs text-green-800 dark:text-green-200">
                            ✓ {currentDriver.name} - {currentDriver.licensePlate} - {currentDriver.experience} de experiencia
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
