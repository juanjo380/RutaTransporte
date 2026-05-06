import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Check,
  ChevronsUpDown,
  User,
  Phone,
  CreditCard,
  GraduationCap,
  MapPin,
} from "lucide-react";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleInfo: {
    id: string;
    direction: "ida" | "vuelta";
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  } | null;
  onConfirm: (data: ReservationData) => void;
}

export interface ReservationData {
  name: string;
  studentId: string;
  phone: string;
  university: string;
  pickupStop: string;
  dropoffStop: string;
}

const FIXED_UCEVA_STOP = "Tulua - UCEVA";

const IDA_PICKUP_STOPS = [
  "Montellano - Ara",
  "Estambul - Dollarcity",
  "Julia - Rapitienda del parque",
  "Julia - Pizza nostra",
  "Julia - ",
  "Portales del rio - Bahia Terminal",
  "Aures - Semaforo Caribe",
  "Paloblanco - Estación Terpel",
  "Paloblanco - D1",
  "Paloblanco - Panaderia",
  "Carmelo - CR1/CL4",
  "Carmelo - CR1/CL5",
  "Carmelo - CR2/CL5",
  "La Merced - Cañaveral Terminal",
  "La Merced - CR19/CL3",
  "Buga - Universidad sede",
];

const VUELTA_DROPOFF_STOPS = [
  "Montellano - Ara",
  "Estambul - Dollarcity",
  "Julia - Rapitienda del parque",
  "Julia - Pizza nostra",
  "Julia - ",
  "La ventura - Alibaba",
  "Portales del rio - Bahia Terminal",
  "Aures - Semaforo Caribe",
  "Paloblanco - Estación Terpel",
  "Paloblanco - D1",
  "Paloblanco - Panaderia",
  "Carmelo - CR1/CL4",
  "Carmelo - CR1/CL5",
  "Carmelo - CR2/CL5",
  "Buga - Universidad sede",
];

export function ReservationDialog({
  open,
  onOpenChange,
  scheduleInfo,
  onConfirm,
}: ReservationDialogProps) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [dropoffOpen, setDropoffOpen] = useState(false);
  const [formData, setFormData] = useState<ReservationData>({
    name: "",
    studentId: "",
    phone: "",
    university: "",
    pickupStop: "",
    dropoffStop: "",
  });

  const isVuelta = scheduleInfo?.direction === "vuelta";
  const scheduleTime = scheduleInfo?.arrivalTime || scheduleInfo?.departureTime || "";
  const pickupStops = isVuelta ? [FIXED_UCEVA_STOP] : IDA_PICKUP_STOPS;
  const dropoffStops = isVuelta ? VUELTA_DROPOFF_STOPS : [FIXED_UCEVA_STOP];

  useEffect(() => {
    if (!scheduleInfo) {
      return;
    }

    setFormData((prev) => {
      if (scheduleInfo.direction === "ida") {
        return {
          ...prev,
          pickupStop: IDA_PICKUP_STOPS.includes(prev.pickupStop) ? prev.pickupStop : "",
          dropoffStop: FIXED_UCEVA_STOP,
        };
      }

      return {
        ...prev,
        pickupStop: FIXED_UCEVA_STOP,
        dropoffStop: VUELTA_DROPOFF_STOPS.includes(prev.dropoffStop)
          ? prev.dropoffStop
          : "",
      };
    });
  }, [scheduleInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
    setFormData({
      name: "",
      studentId: "",
      phone: "",
      university: "",
      pickupStop: "",
      dropoffStop: "",
    });
  };

  const isFormValid =
    formData.name &&
    formData.studentId &&
    formData.phone &&
    formData.university &&
    formData.pickupStop &&
    formData.dropoffStop;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Cupo</DialogTitle>
          <DialogDescription>
            {scheduleInfo && (
              <>
                Hora: {scheduleTime} ({scheduleInfo.origin} - {scheduleInfo.destination})
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  Nombre completo
                </div>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Juan Pérez García"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Código estudiantil
                </div>
              </Label>
              <Input
                id="studentId"
                placeholder="Ej: 2020123456"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  Universidad
                </div>
              </Label>
              <Input
                id="university"
                placeholder="Ej: Universidad del Valle"
                value={formData.university}
                onChange={(e) =>
                  setFormData({ ...formData, university: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  Teléfono
                </div>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 3001234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupStop">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Parada de recogida
                </div>
              </Label>
              <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="pickupStop"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickupOpen}
                    className="w-full justify-between"
                    disabled={isVuelta}
                  >
                    {formData.pickupStop || "Selecciona dónde te recogen"}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar parada..." />
                    <CommandList>
                      <CommandEmpty>No se encontró una parada.</CommandEmpty>
                      <CommandGroup>
                        {pickupStops.map((stop) => (
                          <CommandItem
                            key={stop}
                            value={stop}
                            onSelect={() => {
                              setFormData({ ...formData, pickupStop: stop });
                              setPickupOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 size-4 ${formData.pickupStop === stop ? "opacity-100" : "opacity-0"}`}
                            />
                            {stop}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isVuelta && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  En vuelta, la recogida siempre inicia en UCEVA.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoffStop">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Parada de destino
                </div>
              </Label>
              <Popover open={dropoffOpen} onOpenChange={setDropoffOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="dropoffStop"
                    variant="outline"
                    role="combobox"
                    aria-expanded={dropoffOpen}
                    className="w-full justify-between"
                    disabled={!isVuelta}
                  >
                    {formData.dropoffStop || "Selecciona dónde te dejan"}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar parada..." />
                    <CommandList>
                      <CommandEmpty>No se encontró una parada.</CommandEmpty>
                      <CommandGroup>
                        {dropoffStops.map((stop) => (
                          <CommandItem
                            key={stop}
                            value={stop}
                            onSelect={() => {
                              setFormData({ ...formData, dropoffStop: stop });
                              setDropoffOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 size-4 ${formData.dropoffStop === stop ? "opacity-100" : "opacity-0"}`}
                            />
                            {stop}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {!isVuelta && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  En ida, el destino siempre es UCEVA.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Confirmar reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}