import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "admin" | "driver";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  driverId?: string; // For drivers
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for prototype
const mockUsers: Record<string, { password: string; user: User }> = {
  "estudiante@univ.edu": {
    password: "estudiante123",
    user: {
      id: "u1",
      email: "estudiante@univ.edu",
      name: "Juan Estudiante",
      role: "student",
    },
  },
  "admin@ruta.com": {
    password: "admin123",
    user: {
      id: "u2",
      email: "admin@ruta.com",
      name: "Administrador Sistema",
      role: "admin",
    },
  },
  "carlos@conductor.com": {
    password: "conductor123",
    user: {
      id: "u3",
      email: "carlos@conductor.com",
      name: "Carlos Rodríguez",
      role: "driver",
      driverId: "d1",
    },
  },
  "maria@conductor.com": {
    password: "conductor123",
    user: {
      id: "u4",
      email: "maria@conductor.com",
      name: "María González",
      role: "driver",
      driverId: "d2",
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const mockUser = mockUsers[email];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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
