import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useTheme } from "../context/theme-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Bus, LogIn, Mail, Lock, AlertCircle, Moon, Sun } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.message || "Email o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-xl shadow-lg">
              <Bus className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl text-blue-900 dark:text-blue-100">Transporte Uceva</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">Buga - Tuluá</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sistema de reserva de cupos para estudiantes
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="size-5" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    Correo electrónico
                  </div>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@universidad.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    Contraseña
                  </div>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full">
                <LogIn className="size-4 mr-2" />
                Iniciar sesión
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials toggle */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCredentials(!showCredentials)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            {showCredentials ? "Ocultar" : "Ver"} credenciales de prueba
          </Button>
        </div>

        {/* Demo Credentials */}
        {showCredentials && (
          <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base dark:text-gray-100">Credenciales de prueba</CardTitle>
              <CardDescription className="text-xs dark:text-gray-300">
                Usa estas credenciales para probar el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-300">Estudiante</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Email: estudiante@univ.edu</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Contraseña: estudiante123</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-purple-900 dark:text-purple-300">Administrador</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Email: admin@ruta.com</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Contraseña: admin123</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-300">Conductor</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Email: carlos@conductor.com</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Contraseña: conductor123</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Prototipo v1.0 - Sistema de gestión de transporte universitario
        </p>
      </div>
    </div>
  );
}
