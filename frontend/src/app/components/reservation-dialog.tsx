import { useState } from "react";
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
import { User, Phone, CreditCard, GraduationCap } from "lucide-react";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleInfo: {
    id: string;
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
}

export function ReservationDialog({
  open,
  onOpenChange,
  scheduleInfo,
  onConfirm,
}: ReservationDialogProps) {
  const [formData, setFormData] = useState<ReservationData>({
    name: "",
    studentId: "",
    phone: "",
    university: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
    setFormData({ name: "", studentId: "", phone: "", university: "" });
  };

  const isFormValid =
    formData.name &&
    formData.studentId &&
    formData.phone &&
    formData.university;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Cupo</DialogTitle>
          <DialogDescription>
            {scheduleInfo && (
              <>
                Horario: {scheduleInfo.departureTime} - {scheduleInfo.arrivalTime}
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