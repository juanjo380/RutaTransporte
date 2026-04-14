import { useState } from "react";
import { useTheme } from "../context/theme-context";
import { useAuth } from "../context/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Bus,
  LogOut,
  User,
  Clock,
  MapPin,
  Users,
  Star,
  Shield,
  Route,
  GraduationCap,
  Phone,
} from "lucide-react";

// Mock data para el conductor
const driverSchedules = {
  d1: {
    // Carlos Rodríguez
    name: "Carlos Rodríguez",
    licensePlate: "ABC-123",
    rating: 4.8,
    totalTrips: 1200,
    todaySchedules: [
      {
        id: "1",
        departureTime: "06:00 AM",
        arrivalTime: "07:00 AM",
        students: [
          {
            name: "Ana García Pérez",
            studentId: "2021001234",
            university: "Universidad del Valle",
            phone: "300-555-0001",
            pickupPoint: "Terminal Buga",
          },
          {
            name: "Luis Martínez López",
            studentId: "2020987654",
            university: "Universidad del Valle",
            phone: "301-555-0002",
            pickupPoint: "Terminal Buga",
          },
        ],
      },
      {
        id: "4",
        departureTime: "04:00 PM",
        arrivalTime: "05:00 PM",
        students: [
          {
            name: "Carlos Hernández",
            studentId: "2019123456",
            university: "Universidad del Valle",
            phone: "303-555-0004",
            pickupPoint: "Terminal Buga",
          },
        ],
      },
    ],
  },
  d2: {
    // María González
    name: "María González",
    licensePlate: "XYZ-789",
    rating: 4.9,
    totalTrips: 1500,
    todaySchedules: [
      {
        id: "2",
        departureTime: "08:00 AM",
        arrivalTime: "09:00 AM",
        students: [
          {
            name: "María Rodríguez Sánchez",
            studentId: "2021567890",
            university: "Universidad Autónoma",
            phone: "302-555-0003",
            pickupPoint: "Terminal Buga",
          },
        ],
      },
    ],
  },
};

export function DriverView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const driverId = user?.driverId || "d1";
  const driverData = driverSchedules[driverId as keyof typeof driverSchedules];

  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(
    driverData?.todaySchedules[0]?.id || null
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!driverData) {
    return <div>Error: Conductor no encontrado</div>;
  }

  const currentSchedule = driverData.todaySchedules.find(
    (s) => s.id === selectedSchedule
  );

  const totalStudentsToday = driverData.todaySchedules.reduce(
    (acc, schedule) => acc + schedule.students.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <Bus className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl text-green-900">Panel del Conductor</h1>
                <p className="text-gray-700">Mis rutas y pasajeros</p>
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

        {/* Driver Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-green-600" />
              Información del Conductor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Bus className="size-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Placa</p>
                  <p className="font-semibold">{driverData.licensePlate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="size-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-500">Calificación</p>
                  <p className="font-semibold">{driverData.rating}/5.0</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Route className="size-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Viajes totales</p>
                  <p className="font-semibold">{driverData.totalTrips}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Pasajeros hoy</p>
                  <p className="font-semibold">{totalStudentsToday}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-5" />
              Mis horarios de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {driverData.todaySchedules.map((schedule) => (
                <Button
                  key={schedule.id}
                  variant={selectedSchedule === schedule.id ? "default" : "outline"}
                  onClick={() => setSelectedSchedule(schedule.id)}
                  className="flex items-center gap-2"
                >
                  <Clock className="size-4" />
                  {schedule.departureTime} - {schedule.arrivalTime}
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-100 text-green-800"
                  >
                    {schedule.students.length} estudiantes
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Schedule Details */}
        {currentSchedule && (
          <>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">
                    Ruta: {currentSchedule.departureTime} - {currentSchedule.arrivalTime}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="size-4" />
                    <span>Buga → Tuluá</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {currentSchedule.students.length}
                  </p>
                  <p className="text-xs text-gray-600">Estudiantes</p>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-3">
              {currentSchedule.students.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No hay estudiantes registrados en este horario
                  </CardContent>
                </Card>
              ) : (
                currentSchedule.students.map((student, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 rounded-full size-10 flex items-center justify-center">
                            <span className="font-semibold text-green-700">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {student.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {student.university}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">Confirmado</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Código</p>
                            <p className="text-sm font-medium">
                              {student.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Teléfono</p>
                            <p className="text-sm font-medium">{student.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">Punto de recogida</p>
                            <p className="text-sm font-medium">
                              {student.pickupPoint}
                            </p>
                          </div>
                        </div>
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
