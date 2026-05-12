"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Bus, MapPin, Moon, Phone, Sun, User as UserIcon } from "lucide-react";

import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/theme-context";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const LOCAL_PROFILE_KEY_PREFIX = "ruta_transporte_local_profile_";

type LocalProfile = {
  lastName?: string;
  description?: string;
};

type UserProfileResponse = {
  ok: boolean;
  message?: string;
  data?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
    location?: string | null;
  };
  error?: string;
};

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

export function UserProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const params = useParams();

  const userId = String(params.userId || "");

  const [profile, setProfile] = useState<UserProfileResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const localProfile = useMemo(() => (userId ? loadLocalProfile(userId) : {}), [userId]);

  const fullName = useMemo(() => {
    const baseName = (profile?.name || "").trim();
    const lastName = (localProfile.lastName || "").trim();
    return lastName ? `${baseName} ${lastName}`.trim() : baseName;
  }, [profile?.name, localProfile.lastName]);

  const description = (localProfile.description || "").trim();

  const avatarSrc = useMemo(() => {
    if (profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    return getGeneratedAvatarUrl(userId || profile?.id || "user");
  }, [profile?.avatarUrl, userId, profile?.id]);

  const initials = useMemo(() => {
    const value = (fullName || profile?.name || "").trim();
    if (!value) {
      return "U";
    }

    const parts = value.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

    return (first + second).toUpperCase() || "U";
  }, [fullName, profile?.name]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    fetch(`${API_BASE_URL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const json = (await response.json()) as UserProfileResponse;
        if (!response.ok || !json.ok || !json.data) {
          toast.error("No se pudo cargar el perfil", {
            description: json.message || "Intenta nuevamente.",
          });
          setProfile(null);
          return;
        }

        setProfile(json.data);
      })
      .catch(() => {
        toast.error("Error de conexión", {
          description: "No fue posible cargar el perfil.",
        });
        setProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, [navigate, userId]);

  const canSeePrivateFields = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 md:p-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Bus className="size-10 text-indigo-600 dark:text-indigo-300" />
              <div>
                <h1 className="text-3xl sm:text-4xl text-indigo-900 dark:text-indigo-200">Perfil</h1>
                <p className="text-gray-700 dark:text-gray-300">Información del usuario</p>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end gap-2">
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-indigo-600" />
              Datos del perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Cargando perfil...</p>
            ) : !profile ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No hay datos para mostrar.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button type="button" className="text-left" onClick={() => setIsAvatarOpen(true)}>
                    <Avatar className="size-16">
                      <AvatarImage src={avatarSrc} alt="Avatar" />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{fullName || profile.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Toca la foto para verla en grande</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {description ? description : "Sin descripción"}
                  </p>
                </div>

                {canSeePrivateFields ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Phone className="size-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{profile.phone || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{profile.location || "No disponible"}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
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
      </div>
    </div>
  );
}
