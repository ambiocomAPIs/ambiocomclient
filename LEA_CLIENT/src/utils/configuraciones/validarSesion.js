// validamos que el iniciado en sesion concuerde con los registrados por defecto      
import { users } from "./config";

export const validarSesion = () => {
  const storedUser = JSON.parse(sessionStorage.getItem("usuario"));

  const userValido = users.some(
    (user) =>
      user.email === storedUser?.email &&
      user.rol === storedUser?.rol
  );

  if (!userValido) {
    sessionStorage.removeItem("usuario");
    return false;
  }

  return true;
};      
