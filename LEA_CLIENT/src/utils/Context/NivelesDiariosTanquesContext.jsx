import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext/AuthContext";

const NivelesDiariosTanquesContext = createContext();
NivelesDiariosTanquesContext.displayName = "NivelesDiariosTanquesContext";

export const NivelesDiariosTanquesProvider = ({ children }) => {
  const [nivelesTanques, setNivelesTanques] = useState([]);
  const [nivelesTanquesLoading, setNivelesTanquesLoading] = useState(false);

  const { user, isAuth, loadingAuth, rol } = useAuth();

  const limpiarEstado = useCallback(() => {
    setNivelesTanques([]);
    setNivelesTanquesLoading(false);
  }, []);

  const usuarioValido =
    !!user &&
    typeof user === "object" &&
    Object.keys(user).length > 0 &&
    !!(user.id || user._id || user.email);

  const autenticadoValido = isAuth === true && usuarioValido;

  const fetchNivelesTanques = useCallback(async () => {
    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    try {
      setNivelesTanquesLoading(true);

      const res = await axios.get(
        "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros",
        {
          withCredentials: true,
        }
      );

      setNivelesTanques(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ Error al cargar niveles diarios de tanques:", error);
      setNivelesTanques([]);
    } finally {
      setNivelesTanquesLoading(false);
    }
  }, [autenticadoValido, limpiarEstado]);

  useEffect(() => {
    if (loadingAuth) return;

    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    // opcional: validar rol
    // if (rol !== "developer") {
    //   limpiarEstado();
    //   return;
    // }

    fetchNivelesTanques();
  }, [loadingAuth, autenticadoValido, fetchNivelesTanques, limpiarEstado, rol]);

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