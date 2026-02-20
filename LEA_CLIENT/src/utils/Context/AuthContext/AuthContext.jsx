// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const sessionExpiredShownRef = useRef(false);

  const me = async () => {
    setLoadingAuth(true);
    try {
      const { data } = await axios.get("https://ambiocomserver.onrender.com/api/auth/me", { withCredentials: true });
      setUser(data.user);
      sessionExpiredShownRef.current = false;
    } catch (err) {
      console.log("ME ERROR:", err?.response?.status);
      if (err?.response?.status === 401) {
        console.log("Token Expirado");
        setUser(null);

        const inLogin = window.location.pathname === "/";

        if (!inLogin && !sessionExpiredShownRef.current) {
          sessionExpiredShownRef.current = true;
          Swal.fire({
            title: "Sesión expirada",
            text: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
            icon: "warning",
            confirmButtonText: "Ir al login",
            confirmButtonColor: "#3085d6",
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(async () => {
            try {
              await axios.post("https://ambiocomserver.onrender.com/api/auth/logout", {}, { withCredentials: true });
              window.location.replace("/")
            } catch (e) { }
            // window.location.replace("/");
          });
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    me();
  }, []);

  useEffect(() => {
    console.log("ROL CONTEXT:", user?.rol);
  }, [user, loadingAuth]);

  const logout = async () => {
    await axios.post("https://ambiocomserver.onrender.com/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
    sessionExpiredShownRef.current = false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rol: user?.rol,
        isAuth: !!user,
        loadingAuth,
        refreshMe: me,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}