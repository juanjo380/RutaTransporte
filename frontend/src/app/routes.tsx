import { Navigate, type RouteObject } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { StudentHome } from "./pages/student-home";
import { AdminDashboard } from "./pages/admin-dashboard";
import { DriverView } from "./pages/driver-view";
import { ProfilePage } from "@/app/pages/profile";
import { ProtectedRoute } from "./components/protected-route";
import { RoleBasedRedirect } from "./components/role-based-redirect";

export const appRoutes: RouteObject[] = [
  {
    path: "/login",
    Component: LoginPage,
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
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
