import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext/AuthContext";
const NivelesDiariosTanquesContext = createContext();
NivelesDiariosTanquesContext.displayName = "NivelesDiariosTanquesContext";

export const NivelesDiariosTanquesProvider = ({ children }) => {
  const [nivelesTanques, setNivelesTanques] = useState([]);
  const [nivelesTanquesLoading, setNivelesTanquesLoading] = useState(false);

  const { user, isAuth, loadingAuth, rol } = useAuth();

  const fetchNivelesTanques = async () => {
    try {
      setNivelesTanquesLoading(true);

      const res = await axios.get(
        "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros",
        {
          withCredentials: true,
        }
      );

      setNivelesTanques(res.data || []);
    } catch (error) {
      console.error("❌ Error al cargar niveles diarios de tanques:", error);
      setNivelesTanques([]);
    } finally {
      setNivelesTanquesLoading(false);
    }
  };

  useEffect(() => {
    if (loadingAuth) return;

    if (!isAuth || !user) {
      setNivelesTanques([]);
      return;
    }

    // opcional: validar rol
    // if (rol !== "developer") {
    //   setNivelesTanques([]);
    //   return;
    // }

    fetchNivelesTanques();
  }, [loadingAuth, isAuth, user, rol]);

  return (
    <NivelesDiariosTanquesContext.Provider
      value={{
        nivelesTanques,
        setNivelesTanques,
        nivelesTanquesLoading,
        fetchNivelesTanques,
      }}
    >
      {children}
    </NivelesDiariosTanquesContext.Provider>
  );
};

export const useNivelesDiariosTanques = () => {
  const context = useContext(NivelesDiariosTanquesContext);

  if (!context) {
    throw new Error(
      "useNivelesDiariosTanques debe usarse dentro de un NivelesDiariosTanquesProvider"
    );
  }

  return context;
};