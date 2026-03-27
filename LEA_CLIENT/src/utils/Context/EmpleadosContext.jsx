import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext/AuthContext";

// Crear contexto
const EmpleadosContext = createContext([]);

// Hook
export const useEmpleados = () => useContext(EmpleadosContext);

// Provider
export const EmpleadosProvider = ({ children }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const { user, isAuth, loadingAuth, rol } = useAuth();

  const limpiarEstado = useCallback(() => {
    setEmpleados([]);
    setLoadingEmpleados(false);
  }, []);

  const usuarioValido =
    !!user &&
    typeof user === "object" &&
    Object.keys(user).length > 0 &&
    !!(user.id || user._id || user.email);

  const autenticadoValido = isAuth === true && usuarioValido;

  const fetchEmpleados = useCallback(async () => {
    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    try {
      setLoadingEmpleados(true);

      const res = await axios.get(
        "https://ambiocomserver.onrender.com/api/empleadosambiocom",
        { withCredentials: true }
      );

      setEmpleados(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      setEmpleados([]);
    } finally {
      setLoadingEmpleados(false);
    }
  }, [autenticadoValido, limpiarEstado]);

  useEffect(() => {
    if (loadingAuth) return;

    if (!autenticadoValido) {
      limpiarEstado();
      return;
    }

    // 🔐 opcional: validar rol
    // if (rol !== "developer") {
    //   limpiarEstado();
    //   return;
    // }

    fetchEmpleados();
  }, [loadingAuth, autenticadoValido, fetchEmpleados, limpiarEstado, rol]);

  const empleadosActivos = empleados.filter((emp) => emp.activo);

  return (
    <EmpleadosContext.Provider value={{ empleadosActivos, loadingEmpleados, fetchEmpleados }}>
      {children}
    </EmpleadosContext.Provider>
  );
};