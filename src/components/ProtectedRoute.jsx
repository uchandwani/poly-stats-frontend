// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const loc = useLocation();

  // Not logged in → go to /login (IMPORTANT: not "/")
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // Optional role check
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return children;
}
