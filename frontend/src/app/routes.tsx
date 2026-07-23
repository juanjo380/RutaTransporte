import { Navigate, type RouteObject } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { StudentHome } from "./pages/student-home";
import { AdminDashboard } from "./pages/admin-dashboard";
import { DriverView } from "./pages/driver-view";
import { ProfilePage } from "@/app/pages/profile";
import { UserProfilePage } from "./pages/user-profile";
import { ChangePasswordPage } from "./pages/change-password";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordPage } from "./pages/reset-password";
import { ProtectedRoute } from "./components/protected-route";
import { RoleBasedRedirect } from "./components/role-based-redirect";

export const appRoutes: RouteObject[] = [
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/olvido-contrasena",
    Component: ForgotPasswordPage,
  },
  {
    path: "/restablecer-contrasena",
    Component: ResetPasswordPage,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RoleBasedRedirect />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <DriverView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cambiar-contrasena",
    element: (
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users/:userId",
    element: (
      <ProtectedRoute>
        <UserProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
