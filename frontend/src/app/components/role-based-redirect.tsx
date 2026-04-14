import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export function RoleBasedRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case "student":
      return <Navigate to="/student" replace />;
    case "admin":
      return <Navigate to="/admin" replace />;
    case "driver":
      return <Navigate to="/driver" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
