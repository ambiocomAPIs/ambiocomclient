// src/components/LoginModal.jsx
import { useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { users } from '../utils/configuraciones/config.js';

const LoginModal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const showLogin = async () => {
      const { value: formValues } = await Swal.fire({
        title: "Iniciar sesión",
        width: '500px', // <-- Aumenta o reduce el tamaño
        html: `
        <input id="swal-input-email" class="swal2-input" style="width: 90%; margin: 10px auto; display: block;" placeholder="Correo">
        <input id="swal-input-password" type="password" class="swal2-input" style="width: 90%; margin: 10px auto; display: block;" placeholder="Contraseña">
        <div style="text-align: center; margin-bottom: 15px;margin-top: 25px;">
          <img src="/ambiocom.png" alt="Logo" style="max-width: 250px; height: auto;" />
        </div>
      `,      
        focusConfirm: false,
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Ingresar",
        customClass: {
          popup: 'my-swal-popup'
        },
        preConfirm: () => {
          const email = document.getElementById("swal-input-email").value;
          const password = document.getElementById("swal-input-password").value;

          if (!email || !password) {
            Swal.showValidationMessage("Por favor completa ambos campos");
            return;
          }

          const user = users.find(u => u.email === email && u.password === password);
          if (!user) {
            Swal.showValidationMessage("Credenciales incorrectas");
            return;
          }

          sessionStorage.setItem("usuario", JSON.stringify({
            email: user.email,
            rol: user.rol
          }));

          return user;
        }
      });

      if (formValues) {
        navigate(formValues.redirect || "/");
      }
    };

    showLogin();
  }, [navigate]);

  return null;
};

export default LoginModal;
