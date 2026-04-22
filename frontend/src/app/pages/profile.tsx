"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bus, Camera, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";

import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/theme-context";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const LOCAL_PROFILE_KEY_PREFIX = "ruta_transporte_local_profile_";

type LocalProfile = {
  lastName?: string;
  sex?: "MASCULINO" | "FEMENINO" | "OTRO" | "NO_ESPECIFICA";
  description?: string;
};

type UpdateMeResponse = {
  ok: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    location?: string | null;
    role: "student" | "admin" | "driver";
  };
  error?: string;
};

type UploadAvatarResponse = {
  ok: boolean;
  message?: string;
  data?: {
    url: string;
  };
  error?: string;
};

function loadLocalProfile(userId: string): LocalProfile {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return {};
  }
}

function saveLocalProfile(userId: string, profile: LocalProfile) {
  localStorage.setItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`,
    JSON.stringify(profile)
  );
}

export function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState<LocalProfile["sex"]>("NO_ESPECIFICA");
  const [description, setDescription] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(() => Date.now());

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setPhone(user.phone || "");
    setLocation(user.location || "");

    const localProfile = loadLocalProfile(user.id);
    setLastName(localProfile.lastName || "");
    setSex(localProfile.sex || "NO_ESPECIFICA");
    setDescription(localProfile.description || "");
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${API_BASE_URL}/api/auth/avatar/${user.id}?v=${avatarVersion}`;
  }, [user, avatarVersion]);

  const initials = useMemo(() => {
    const value = (name || user?.name || "").trim();
    if (!value) {
      return "U";
    }

    const parts = value.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

    return (first + second).toUpperCase() || "U";
  }, [name, user?.name]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUploadAvatar = async () => {
    if (!user) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    if (!avatarFile) {
      toast.error("Selecciona una imagen", {
        description: "Elige un archivo PNG/JPG/WEBP de máximo 3MB.",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile);

      const response = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const json = (await response.json()) as UploadAvatarResponse;

      if (!response.ok || !json.ok) {
        toast.error("No se pudo subir la foto", {
          description: json.message || "Intenta nuevamente.",
        });
        return;
      }

      setAvatarFile(null);
      setAvatarVersion(Date.now());

      toast.success("Foto actualizada", {
        description: "Tu foto de perfil se guardó correctamente.",
      });
    } catch {
      toast.error("Error de conexión", {
        description: "No fue posible subir la foto.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          location,
        }),
      });

      const json = (await response.json()) as UpdateMeResponse;

      if (!response.ok || !json.ok || !json.user) {
        toast.error("No se pudo guardar", {
          description: json.message || "Intenta nuevamente.",
        });
        return;
      }

      setUser({
        ...user,
        name: json.user.name,
        phone: json.user.phone ?? null,
        location: json.user.location ?? null,
      });

      saveLocalProfile(user.id, {
        lastName: lastName.trim() ? lastName.trim() : undefined,
        sex,
        description: description.trim() ? description.trim() : undefined,
      });

      toast.success("Perfil guardado", {
        description: "Los cambios se aplicaron correctamente.",
      });
    } catch {
      toast.error("Error de conexión", {
        description: "No fue posible guardar el perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bus className="size-10 text-indigo-600 dark:text-indigo-300" />
              <div>
                <h1 className="text-4xl text-indigo-900 dark:text-indigo-200">Mi perfil</h1>
                <p className="text-gray-700 dark:text-gray-300">Configura tu información y foto</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                <UserIcon className="size-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-5 text-indigo-600" />
              Foto de perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={avatarSrc} alt="Avatar" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user.email}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">PNG/JPG/WEBP • Máx. 3MB</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setAvatarFile(file);
                  }}
                />
                <Button onClick={handleUploadAvatar} disabled={isUploadingAvatar || !avatarFile}>
                  {isUploadingAvatar ? "Subiendo..." : "Subir foto"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos principales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nombre</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Correo</Label>
                <Input id="profile-email" value={user.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Teléfono</Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-location">Ubicación / dirección</Label>
                <Input
                  id="profile-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Ej: Barrio, dirección o punto de encuentro"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información adicional (solo en este dispositivo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-lastname">Apellido</Label>
                <Input
                  id="profile-lastname"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Tu apellido"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Se guarda en tu navegador (no se envía a la BD).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sexo</Label>
                <RadioGroup
                  value={sex}
                  onValueChange={(value) => setSex(value as LocalProfile["sex"])}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label className="flex items-center gap-2 rounded-md border border-input bg-white/60 dark:bg-gray-900/40 px-3 py-2">
                    <RadioGroupItem value="MASCULINO" />
                    Masculino
                  </Label>
                  <Label className="flex items-center gap-2 rounded-md border border-input bg-white/60 dark:bg-gray-900/40 px-3 py-2">
                    <RadioGroupItem value="FEMENINO" />
                    Femenino
                  </Label>
                  <Label className="flex items-center gap-2 rounded-md border border-input bg-white/60 dark:bg-gray-900/40 px-3 py-2">
                    <RadioGroupItem value="OTRO" />
                    Otro
                  </Label>
                  <Label className="flex items-center gap-2 rounded-md border border-input bg-white/60 dark:bg-gray-900/40 px-3 py-2">
                    <RadioGroupItem value="NO_ESPECIFICA" />
                    No especifica
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-description">Descripción</Label>
                <Textarea
                  id="profile-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Algo breve sobre ti (opcional)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
