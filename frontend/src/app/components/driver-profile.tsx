import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { User, Phone, Star, Award, ShieldCheck } from "lucide-react";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  experience: string;
  licensePlate: string;
  verified: boolean;
  totalTrips: number;
}

interface DriverProfileProps {
  driver: Driver;
  compact?: boolean;
}

export function DriverProfile({ driver, compact = false }: DriverProfileProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-center size-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold">
          {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm dark:text-gray-100">{driver.name}</p>
            {driver.verified && (
              <ShieldCheck className="size-4 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span>{driver.rating.toFixed(1)}</span>
            <span className="mx-1">•</span>
            <span>{driver.licensePlate}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-100">
          <User className="size-5 dark:text-gray-100" />
          Perfil del Conductor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-16 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-2xl font-semibold">
            {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg dark:text-gray-100">{driver.name}</h3>
              {driver.verified && (
                <Badge variant="default" className="bg-green-600 dark:bg-green-700 text-xs">
                  <ShieldCheck className="size-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-yellow-500 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < Math.floor(driver.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                {driver.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
              <p className="text-sm font-medium dark:text-gray-100">{driver.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Experiencia</p>
              <p className="text-sm font-medium dark:text-gray-100">{driver.experience}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Placa del vehículo</p>
            <p className="font-semibold text-sm dark:text-gray-100">{driver.licensePlate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Viajes realizados</p>
            <p className="font-semibold text-sm dark:text-gray-100">{driver.totalTrips}+</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <ShieldCheck className="size-4 inline mr-1" />
            Conductor verificado con licencia vigente y vehículo revisado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
