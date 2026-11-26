import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext/AuthContext";

const TanquesContext = createContext();
TanquesContext.displayName = "TanquesContext";

export const TanquesProvider = ({ children }) => {
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, isAuth, loadingAuth } = useAuth();

  const limpiarEstado = useCallback(() => {
    setTanques([]);
    setLoading(false);
  }, []);

  const usuarioValido =
    !!user &&
    typeof user === "object" &&
    Object.keys(user).length > 0 &&
    !!(user.id || user._id || user.email);

  const autenticadoValido = isAuth === true && usuarioValido;

  const fetchTanques = useCallback(async () => {
    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
        "https://ambiocomserver.onrender.com/api/tanques",
        {
          withCredentials: true,
        }
      );

      setTanques(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ Error al cargar tanques:", error);
      setTanques([]);
    } finally {
      setLoading(false);
    }
  }, [autenticadoValido, limpiarEstado]);

  useEffect(() => {
    if (loadingAuth) return;

    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    fetchTanques();
  }, [loadingAuth, autenticadoValido, fetchTanques, limpiarEstado]);

  return (
    <TanquesContext.Provider
      value={{ tanques, setTanques, loading, fetchTanques }}
    >
      {children}
    </TanquesContext.Provider>
  );
};

export const useTanques = () => {
  const context = useContext(TanquesContext);

  if (!context) {
    throw new Error("useTanques debe usarse dentro de un TanquesProvider");
  }

  return context;
};