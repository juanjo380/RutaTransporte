import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Bus, LogOut, User, Clock, MapPin, GraduationCap, Phone, CreditCard, BarChart3, Grid3x3, ListChecks, UserCog, Star, Shield, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

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

// Mock data - horarios del día
const schedulesList = [
  { id: "1", departureTime: "06:00 AM", arrivalTime: "07:00 AM", driverId: "d1" },
  { id: "2", departureTime: "08:00 AM", arrivalTime: "09:00 AM", driverId: "d2" },
  { id: "3", departureTime: "12:00 PM", arrivalTime: "01:00 PM", driverId: "d3" },
  { id: "4", departureTime: "04:00 PM", arrivalTime: "05:00 PM", driverId: "d1" },
  { id: "5", departureTime: "06:00 PM", arrivalTime: "07:00 PM", driverId: null },
];

// Mock data - reservas
const mockReservations = [
  {
    id: "1",
    studentName: "Ana García Pérez",
    studentId: "2021001234",
    university: "Universidad del Valle",
    phone: "300-555-0001",
    scheduleId: "1",
    departureTime: "06:00 AM",
    arrivalTime: "07:00 AM",
    driver: "Carlos Rodríguez",
    licensePlate: "ABC-123",
    date: "31/03/2026",
    status: "confirmed",
  },
  {
    id: "2",
    studentName: "Luis Martínez López",
    studentId: "2020987654",
    university: "Universidad del Valle",
    phone: "301-555-0002",
    scheduleId: "1",
    departureTime: "06:00 AM",
    arrivalTime: "07:00 AM",
    driver: "Carlos Rodríguez",
    licensePlate: "ABC-123",
    date: "31/03/2026",
    status: "confirmed",
  },
  {
    id: "3",
    studentName: "María Rodríguez Sánchez",
    studentId: "2021567890",
    university: "Universidad Autónoma",
    phone: "302-555-0003",
    scheduleId: "2",
    departureTime: "08:00 AM",
    arrivalTime: "09:00 AM",
    driver: "María González",
    licensePlate: "XYZ-789",
    date: "31/03/2026",
    status: "confirmed",
  },
  {
    id: "4",
    studentName: "Carlos Hernández",
    studentId: "2019123456",
    university: "Universidad del Valle",
    phone: "303-555-0004",
    scheduleId: "4",
    departureTime: "04:00 PM",
    arrivalTime: "05:00 PM",
    driver: "Carlos Rodríguez",
    licensePlate: "ABC-123",
    date: "31/03/2026",
    status: "confirmed",
  },
  {
    id: "5",
    studentName: "Diana Gutiérrez",
    studentId: "2022654321",
    university: "Universidad Santiago de Cali",
    phone: "304-555-0005",
    scheduleId: "3",
    departureTime: "12:00 PM",
    arrivalTime: "01:00 PM",
    driver: "Jorge Martínez",
    licensePlate: "DEF-456",
    date: "31/03/2026",
    status: "confirmed",
  },
];

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reservations] = useState(mockReservations);
  const [selectedSchedule, setSelectedSchedule] = useState<string | "all">("all");
  const [schedules, setSchedules] = useState(schedulesList);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get unique schedules for filter
  const scheduleOptions = Array.from(
    new Set(reservations.map((r) => `${r.departureTime} - ${r.arrivalTime}`))
  );

  const filteredReservations =
    selectedSchedule === "all"
      ? reservations
      : reservations.filter(
          (r) => `${r.departureTime} - ${r.arrivalTime}` === selectedSchedule
        );

  // Statistics
  const totalReservations = reservations.length;
  const totalStudents = new Set(reservations.map((r) => r.studentId)).size;

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bus className="size-10 text-purple-600" />
              <div>
                <h1 className="text-4xl text-purple-900">Panel Administrativo</h1>
                <p className="text-gray-700">Gestión de reservas y cupos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                <User className="size-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-900">
                  {totalReservations}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Estudiantes Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GraduationCap className="size-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-900">{totalStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Horarios Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="size-8 text-green-600" />
                <span className="text-3xl font-bold text-green-900">
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
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Matriz de rutas del día
              </h2>
              <p className="text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600 mt-1">
                          Ruta: Buga → Tuluá
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-900">
                          {schedule.studentCount}
                        </div>
                        <p className="text-xs text-gray-600">Estudiantes</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Conductor asignado */}
                    {schedule.driver ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg">
                              <Bus className="size-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900">
                                {schedule.driver.name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Sin conductor asignado
                        </p>
                      </div>
                    )}

                    {/* Lista de estudiantes */}
                    {schedule.studentCount > 0 ? (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Estudiantes registrados:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedule.students.map((student) => (
                            <div
                              key={student.id}
                              className="bg-gray-50 rounded-lg p-2 flex items-center gap-2"
                            >
                              <GraduationCap className="size-4 text-gray-600" />
                              <div>
                                <p className="text-sm font-medium">
                                  {student.studentName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {student.university}
                                </p>
                              </div>
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
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Vista rápida de ocupación
              </h2>
              <p className="text-sm text-gray-600">
                Resumen compacto de cuántos estudiantes hay en cada horario
              </p>
            </div>

            {/* Tabla compacta */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900">
                          Horario
                        </th>
                        <th className="text-left p-3 text-sm font-semibold text-purple-900">
                          Conductor
                        </th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900">
                          Estudiantes
                        </th>
                        <th className="text-center p-3 text-sm font-semibold text-purple-900">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scheduleMatrix.map((schedule, index) => (
                        <tr
                          key={schedule.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
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
                                <p className="text-xs text-gray-600">
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
                            <div className="inline-flex items-center justify-center bg-purple-100 rounded-full px-3 py-1">
                              <span className="text-lg font-bold text-purple-900">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de estudiantes transportados hoy</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {totalReservations}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Rutas con conductor asignado</p>
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
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">
                Asignar conductores a rutas
              </h2>
              <p className="text-sm text-gray-600">
                Gestiona qué conductor estará a cargo de cada horario
              </p>
            </div>

            {/* Lista de conductores disponibles */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50">
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
                      className="bg-white rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <User className="size-5 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
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
                        <label className="text-sm font-medium text-gray-700 min-w-[120px]">
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
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                          <p className="text-xs text-green-800">
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
