import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Crear contexto
const EmpleadosContext = createContext([]);

// Hook para consumir el contexto fácilmente
export const useEmpleados = () => useContext(EmpleadosContext);

// Provider
export const EmpleadosProvider = ({ children }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const res = await axios.get("https://ambiocomserver.onrender.com/api/empleadosambiocom");
        setEmpleados(res.data || []);
      } catch (error) {
        console.error("Error cargando empleados:", error);
        setEmpleados([]);
      } finally {
        setLoadingEmpleados(false);
      }
    };

    fetchEmpleados();
  }, []);

  const empleadosActivos = empleados.filter(emp => emp.activo);

  return (
    <EmpleadosContext.Provider value={{ empleadosActivos, loadingEmpleados }}>
      {children}
    </EmpleadosContext.Provider>
  );
};
