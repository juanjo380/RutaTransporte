"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Bus, Camera, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";

import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/theme-context";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const LOCAL_PROFILE_KEY_PREFIX = "ruta_transporte_local_profile_";

type LocalProfile = {
  lastName?: string;
  sex?: "MASCULINO" | "FEMENINO" | "OTRO" | "NO_ESPECIFICA";
  description?: string;
  university?: string;
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
    avatarUrl?: string | null;
    role: "student" | "admin" | "driver";
  };
  error?: string;
};

type UpdateAvatarResponse = {
  ok: boolean;
  message?: string;
  user?: UpdateMeResponse["user"];
  error?: string;
};

const PROFILE_LOCATION_OPTIONS = [
  "Montellano - Ara",
  "Estambul - Dollarcity",
  "Julia - Rapitienda del parque",
  "Julia - Pizza nostra",
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
  "La ventura - Alibaba",
  "Buga - Universidad sede",
  "Tulua - UCEVA",
].filter((item) => item.trim().length > 0);

const UNIVERSITY_OPTIONS = [
  { value: "UCEVA", label: "UCEVA" },
  { value: "Universidad del Valle", label: "Universidad del Valle" },
];

function getGeneratedAvatarUrl(seed: string) {
  const base = "https://api.dicebear.com/7.x/initials/svg";
  const url = new URL(base);
  url.searchParams.set("seed", seed);
  return url.toString();
}

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

function stripLastName(fullName: string, lastName: string) {
  const base = (fullName || "").trim();
  const ln = (lastName || "").trim();
  if (!base || !ln) {
    return base;
  }

  const lowerBase = base.toLowerCase();
  const lowerLn = ln.toLowerCase();

  if (lowerBase === lowerLn) {
    return base;
  }

  if (lowerBase.endsWith(` ${lowerLn}`)) {
    return base.slice(0, base.length - ln.length).trim();
  }

  return base;
}

function buildFullName(name: string, lastName: string) {
  const base = (name || "").trim();
  const ln = (lastName || "").trim();
  if (!ln) {
    return base;
  }

  const lowerBase = base.toLowerCase();
  const lowerLn = ln.toLowerCase();
  if (lowerBase === lowerLn || lowerBase.endsWith(` ${lowerLn}`)) {
    return base;
  }

  return `${base} ${ln}`.trim();
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
  const [university, setUniversity] = useState("");

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

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
    setUniversity(localProfile.university || "");
    if (localProfile.lastName) {
      setName(stripLastName(user.name || "", localProfile.lastName));
    }
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (!user) {
      return "";
    }

    if (avatarPreviewUrl) {
      return avatarPreviewUrl;
    }

    if (user.avatarUrl) {
      return user.avatarUrl;
    }

    return getGeneratedAvatarUrl(user.id);
  }, [user, avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const loadImageFromBlob = (blob: Blob) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo leer la imagen"));
      };
      img.src = url;
    });

  const prepareAvatarJpeg = async (file: File) => {
    const lowerType = (file.type || "").toLowerCase();

    let sourceBlob: Blob = file;

    if (lowerType === "image/heic" || lowerType === "image/heif") {
      const mod = await import("heic2any");
      const heic2any = mod.default as unknown as (options: {
        blob: Blob;
        toType: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
      const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
      sourceBlob = Array.isArray(converted) ? converted[0] : converted;
    }

    if (sourceBlob.type === "image/jpeg") {
      return new File([sourceBlob], "avatar.jpg", { type: "image/jpeg" });
    }

    const img = await loadImageFromBlob(sourceBlob);

    const max = 512;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo preparar la imagen");
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("No se pudo convertir la imagen"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.85
      );
    });

    return new File([jpegBlob], "avatar.jpg", { type: "image/jpeg" });
  };

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

  const displayName = useMemo(() => {
    const base = (name || user?.name || "").trim();
    const ln = (lastName || "").trim();
    const result = buildFullName(base, ln);
    return result || user?.name || "";
  }, [lastName, name, user?.name]);

  const locationSelectValue = location.trim() ? location : "__none__";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBackToPanel = () => {
    const role = user?.role;
    if (role === "admin") {
      navigate("/admin-dashboard");
    } else if (role === "driver") {
      navigate("/driver-view");
    } else {
      navigate("/");
    }
  };

  const handlePickAvatar = (file: File | null) => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    if (!file) {
      setAvatarPreviewUrl(null);
      setAvatarFile(null);
      return;
    }

    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarFile(file);
    toast.message("Foto seleccionada", {
      description: "Se subirá al guardar cambios (y se verá en otros perfiles).",
    });
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

    const remotePayload = { name: buildFullName(name, lastName), phone, location };

    const hasRemoteChanges =
      (remotePayload.name || "").trim() !== (user.name || "").trim() ||
      (remotePayload.phone || "").trim() !== String(user.phone || "").trim() ||
      (remotePayload.location || "").trim() !== String(user.location || "").trim();

    setIsSaving(true);
    try {
      let remoteSaved = false;
      let avatarSaved = false;

      let nextUser = user;

      if (avatarFile) {
        try {
          const jpeg = await prepareAvatarJpeg(avatarFile);
          const form = new FormData();
          form.append("avatar", jpeg);

          const response = await fetch(`${API_BASE_URL}/api/auth/me/avatar`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          });

          const json = (await response.json()) as UpdateAvatarResponse;

          if (!response.ok || !json.ok || !json.user) {
            toast.error("No se pudo subir la foto", {
              description: json.message || "Intenta nuevamente.",
            });
          } else {
            nextUser = {
              ...nextUser,
              avatarUrl: json.user.avatarUrl ?? null,
            };
            avatarSaved = true;
            setAvatarFile(null);
          }
        } catch (error) {
          toast.error("No se pudo preparar la foto", {
            description: error instanceof Error ? error.message : "Intenta con otra imagen.",
          });
        }
      }

      if (hasRemoteChanges) {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(remotePayload),
        });

        const json = (await response.json()) as UpdateMeResponse;

        if (!response.ok || !json.ok || !json.user) {
          toast.error("No se pudo guardar en el servidor", {
            description: json.message || "Intenta nuevamente.",
          });

			if (avatarSaved) {
				setUser(nextUser);
			}
        } else {
          setUser({
            ...nextUser,
            name: json.user.name,
            phone: json.user.phone ?? null,
            location: json.user.location ?? null,
            avatarUrl: json.user.avatarUrl ?? nextUser.avatarUrl ?? null,
          });
          remoteSaved = true;
        }
      } else if (avatarSaved) {
        setUser(nextUser);
      }

      saveLocalProfile(user.id, {
        lastName: lastName.trim() ? lastName.trim() : undefined,
        sex,
        description: description.trim() ? description.trim() : undefined,
        university: university.trim() ? university.trim() : undefined,
      });

      if (!hasRemoteChanges && avatarSaved) {
        toast.success("Perfil guardado", {
          description: "Foto actualizada correctamente.",
        });
      } else if (!hasRemoteChanges) {
        toast.success("Perfil guardado", {
          description: "Cambios locales guardados correctamente.",
        });
      } else if (remoteSaved) {
        toast.success("Perfil guardado", {
          description: "Los cambios se aplicaron correctamente.",
        });
      } else {
        toast.message("Cambios locales guardados", {
          description: "Apellido/sexo/descripcion se guardaron en este dispositivo.",
        });
      }
    } catch {
      saveLocalProfile(user.id, {
        lastName: lastName.trim() ? lastName.trim() : undefined,
        sex,
        description: description.trim() ? description.trim() : undefined,
        university: university.trim() ? university.trim() : undefined,
      });

      toast.error("Error de conexión", {
        description: "No fue posible guardar en el servidor. Se guardaron los cambios locales.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 md:p-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Bus className="size-10 text-indigo-600 dark:text-indigo-300" />
              <div>
                <h1 className="text-3xl sm:text-4xl text-indigo-900 dark:text-indigo-200">Mi perfil</h1>
                <p className="text-gray-700 dark:text-gray-300">Configura tu información y foto</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleBackToPanel}>
                <ArrowLeft className="size-4 mr-2" />
                Volver al panel
              </Button>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-3 py-2 rounded-lg w-full justify-center sm:w-auto">
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
                <button type="button" className="text-left" onClick={() => setIsAvatarOpen(true)}>
                  <Avatar className="size-16">
                    <AvatarImage src={avatarSrc} alt="Avatar" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{displayName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Toca la foto para verla en grande</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-3">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    handlePickAvatar(file);
                  }}
                />
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Formatos: JPG, PNG, WebP o HEIC. Máximo 1 MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Foto de perfil</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img
                src={avatarSrc}
                alt="Avatar"
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>

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
                <Select
                  value={locationSelectValue}
                  onValueChange={(value) => setLocation(value === "__none__" ? "" : value)}
                >
                  <SelectTrigger id="profile-location">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin ubicación</SelectItem>
                    {PROFILE_LOCATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="profile-university">Universidad</Label>
                <Select
                  value={university || "__none__"}
                  onValueChange={(value) => setUniversity(value === "__none__" ? "" : value)}
                >
                  <SelectTrigger id="profile-university">
                    <SelectValue placeholder="Selecciona una universidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin universidad</SelectItem>
                    {UNIVERSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Se guarda en tu navegador (no se envía a la BD).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sexo</Label>
                  <RadioGroup
                    value={sex}
                    onValueChange={(value) => setSex(value as LocalProfile["sex"])}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
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
