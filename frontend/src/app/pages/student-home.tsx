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
  direction: "ida" | "vuelta";
  origin: string;
  destination: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const idaSchedules = schedules.filter((schedule) => schedule.direction === "ida");
  const vueltaSchedules = schedules.filter((schedule) => schedule.direction === "vuelta");

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
      direction: selectedSchedule.direction,
      origin: selectedSchedule.origin,
      destination: selectedSchedule.destination,
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
      description: `Tu cupo para llegar a las ${selectedSchedule.arrivalTime} ha sido reservado.`,
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
