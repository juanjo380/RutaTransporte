import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";

export type UserRole = "student" | "admin" | "driver";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  debeCambiarContrasena?: boolean;
  driverId?: string; // For drivers
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string; mustChangePassword?: boolean }>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "ruta_transporte_token";
const USER_STORAGE_KEY = "ruta_transporte_user";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos en ms

type AuthApiResponse = {
  ok: boolean;
  message?: string;
  token?: string;
  user?: User;
  debeCambiarContrasena?: boolean;
};

type AuthActionResponse = {
  ok: boolean;
  message?: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setUserAndPersist = (nextUser: User | null) => {
    if (!nextUser) {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      return;
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const userRaw = localStorage.getItem(USER_STORAGE_KEY);

      if (!token || !userRaw) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const data = (await response.json()) as AuthApiResponse;
        if (data.ok && data.user) {
          setUserAndPersist(data.user);
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  // Monitorear inactividad y logout silencioso
  useEffect(() => {
    if (!user) return; // Solo si está autenticado

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        // Logout silencioso después de inactividad
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      }, INACTIVITY_TIMEOUT);
    };

    // Escuchar actividad del usuario
    const activityEvents = ["click", "keypress", "mousemove", "mousedown", "touchstart"];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    // Iniciar timer al montar
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; message?: string; mustChangePassword?: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as AuthApiResponse;

      if (!response.ok || !data.ok || !data.user || !data.token) {
        return {
          ok: false,
          message: data.message || "Email o contraseña incorrectos",
        };
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setUserAndPersist(data.user);

      return {
        ok: true,
        mustChangePassword: Boolean(data.debeCambiarContrasena || data.user.debeCambiarContrasena),
      };
    } catch {
      return {
        ok: false,
        message: "No fue posible conectar con el servidor",
      };
    }
  };

  const changePassword = async (currentPassword: string | undefined, newPassword: string) => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        return { ok: false, message: "No autenticado" };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await response.json()) as AuthActionResponse;
      if (!response.ok || !data.ok) {
        return { ok: false, message: data.message || "No fue posible cambiar la contraseña" };
      }

      if (user) {
        const updatedUser = { ...user, debeCambiarContrasena: false };
        setUserAndPersist(updatedUser);
      }

      return { ok: true, message: data.message || "Contraseña actualizada" };
    } catch {
      return { ok: false, message: "No fue posible conectar con el servidor" };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as AuthActionResponse;
      if (!response.ok || !data.ok) {
        return { ok: false, message: data.message || "No fue posible solicitar la recuperación" };
      }

      return { ok: true, message: data.message || "Revisa tu correo" };
    } catch {
      return { ok: false, message: "No fue posible conectar con el servidor" };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContrasena: newPassword }),
      });

      const data = (await response.json()) as AuthActionResponse;
      if (!response.ok || !data.ok) {
        return { ok: false, message: data.message || "No fue posible restablecer la contraseña" };
      }

      return { ok: true, message: data.message || "Contraseña actualizada" };
    } catch {
      return { ok: false, message: "No fue posible conectar con el servidor" };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        changePassword,
        forgotPassword,
        resetPassword,
        logout,
        setUser: setUserAndPersist,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
