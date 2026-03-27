// src/utils/Context/TanquesContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext/AuthContext"; // ajusta la ruta si cambia

const TanquesContext = createContext();
TanquesContext.displayName = "TanquesContext";

export const TanquesProvider = ({ children }) => {
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, isAuth, loadingAuth } = useAuth();

  const fetchTanques = async () => {
    try {
      setLoading(true);

      const res = await axios.get("https://ambiocomserver.onrender.com/api/tanques", {
        withCredentials: true,
      });

      setTanques(res.data);
    } catch (error) {
      console.error("❌ Error al cargar tanques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Espera a que termine la validación de sesión
    if (loadingAuth) return;

    // Si no está autenticado, no hagas la consulta
    if (!isAuth || !user) return;

    fetchTanques();
  }, [loadingAuth, isAuth, user]);

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