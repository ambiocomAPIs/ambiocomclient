// src/utils/Context/TanquesContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TanquesContext = createContext();
TanquesContext.displayName = "TanquesContext"; // 🔍 útil en React DevTools

export const TanquesProvider = ({ children }) => {
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTanques = async () => {
    try {
      const res = await axios.get("https://ambiocomserver.onrender.com1/api/tanques");
      setTanques(res.data);
    } catch (error) {
      console.error("❌ Error al cargar tanques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTanques();
  }, []);

  return (
    <TanquesContext.Provider value={{ tanques, setTanques, loading }}>
      {children}
    </TanquesContext.Provider>
  );
};

// ✅ Hook seguro para consumir el contexto
export const useTanques = () => {
  const context = useContext(TanquesContext);
  if (!context) {
    throw new Error("useTanques debe usarse dentro de un TanquesProvider");
  }
  return context;
};
