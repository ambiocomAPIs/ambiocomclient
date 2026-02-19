// src/auth/RequireRole.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireRole({ roles = [], children }) {
  const { loadingAuth, isAuth, rol } = useAuth();

  if (loadingAuth) return null; // o loader
  if (!isAuth) return <Navigate to="/" replace />;
  if (roles.length && !roles.includes(rol)) return <Navigate to="/principal" replace />;

  return children;
}


// Este modulo proteje rutas en APP.JSX