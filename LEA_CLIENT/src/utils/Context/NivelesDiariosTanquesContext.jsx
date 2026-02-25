import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// 👉 Context exclusivo para niveles diarios
const NivelesDiariosTanquesContext = createContext();
NivelesDiariosTanquesContext.displayName = "NivelesDiariosTanquesContext";

export const NivelesDiariosTanquesProvider = ({ children }) => {
  const [nivelesTanques, setNivelesTanques] = useState([]);
  const [nivelesTanquesLoading, setNivelesTanquesLoading] = useState(true);

  console.log("se esta ejecutando el contexto");
  

  const fetchNivelesTanques = async () => {
    try {
      const res = await axios.get(
        "https://ambiocomserver.onrender.com1/api/tanquesjornaleros/nivelesdiariostanquesjornaleros"
      );
      setNivelesTanques(res.data);
    } catch (error) {
      console.error("❌ Error al cargar niveles diarios de tanques:", error);
    } finally {
      setNivelesTanquesLoading(false);
    }
  };

  useEffect(() => {
    fetchNivelesTanques();
  }, []);

  return (
    <NivelesDiariosTanquesContext.Provider
      value={{ nivelesTanques, setNivelesTanques, nivelesTanquesLoading }}
    >
      {children}
    </NivelesDiariosTanquesContext.Provider>
  );
};

// ✅ Hook seguro para consumir este contexto
export const useNivelesDiariosTanques = () => {
  const context = useContext(NivelesDiariosTanquesContext);
  if (!context) {
    throw new Error(
      "useNivelesDiariosTanques debe usarse dentro de un NivelesDiariosTanquesProvider"
    );
  }
  return context;
};
