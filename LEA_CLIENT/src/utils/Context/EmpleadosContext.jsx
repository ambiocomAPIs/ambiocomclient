import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setLoadingEmpleados(true);

        const res = await axios.get(
          "https://ambiocomserver.onrender.com/api/empleadosambiocom",
          { withCredentials: true }
        );

        setEmpleados(res.data || []);
      } catch (error) {
        console.error("Error cargando empleados:", error);
        setEmpleados([]);
      } finally {
        setLoadingEmpleados(false);
      }
    };

    // Esperar a que auth termine
    if (loadingAuth) return;

    // Si no hay sesión, no consultar
    if (!isAuth || !user) {
      setEmpleados([]);
      return;
    }

    // 🔐 (opcional) validar rol
    // if (rol !== "developer") {
    //   setEmpleados([]);
    //   return;
    // }

    fetchEmpleados();
  }, [loadingAuth, isAuth, user, rol]);

  const empleadosActivos = empleados.filter(emp => emp.activo);

  return (
    <EmpleadosContext.Provider value={{ empleadosActivos, loadingEmpleados }}>
      {children}
    </EmpleadosContext.Provider>
  );
};