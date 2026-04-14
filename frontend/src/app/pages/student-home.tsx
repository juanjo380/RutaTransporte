import { useState } from "react";
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
import { MyReservations } from "../components/my-reservations";

interface Schedule {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  driver: Driver;
}

interface Reservation {
  id: string;
  scheduleId: string;
  departureTime: string;
  arrivalTime: string;
  userData: ReservationData;
  driver: Driver;
  date: string;
}

export function StudentHome() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      departureTime: "06:00 AM",
      arrivalTime: "07:00 AM",
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
      departureTime: "08:00 AM",
      arrivalTime: "09:00 AM",
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
      id: "3",
      departureTime: "12:00 PM",
      arrivalTime: "01:00 PM",
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
      id: "4",
      departureTime: "04:00 PM",
      arrivalTime: "05:00 PM",
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
      id: "5",
      departureTime: "06:00 PM",
      arrivalTime: "07:00 PM",
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const handleReserve = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setDialogOpen(true);
    }
  };

  const handleConfirmReservation = (userData: ReservationData) => {
    if (!selectedSchedule) return;

    const newReservation: Reservation = {
      id: Date.now().toString(),
      scheduleId: selectedSchedule.id,
      departureTime: selectedSchedule.departureTime,
      arrivalTime: selectedSchedule.arrivalTime,
      userData,
      driver: selectedSchedule.driver,
      date: new Date().toLocaleDateString("es-CO"),
    };

    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === selectedSchedule.id
          ? { ...schedule, availableSeats: schedule.availableSeats - 1 }
          : schedule
      )
    );

    setReservations((prev) => [...prev, newReservation]);
    setDialogOpen(false);
    setSelectedSchedule(null);

    toast.success("¡Reserva confirmada!", {
      description: `Tu cupo para el bus de las ${selectedSchedule.departureTime} ha sido reservado.`,
    });
  };

  const handleCancelReservation = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === reservation.scheduleId
          ? { ...schedule, availableSeats: schedule.availableSeats + 1 }
          : schedule
      )
    );

    setReservations((prev) => prev.filter((r) => r.id !== reservationId));

    toast.success("Reserva cancelada", {
      description: "El cupo ha sido liberado.",
    });
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
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="size-4" />
              Horarios
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <TicketCheck className="size-4" />
              Mis Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Horarios disponibles - Hoy
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selecciona el horario de tu preferencia y completa el formulario para reservar tu cupo.
              </p>
            </div>
            {schedules.map((schedule) => (
              <BusScheduleCard
                key={schedule.id}
                {...schedule}
                onReserve={handleReserve}
              />
            ))}
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
