import React, { useState } from "react";
import { Box, Typography, Container, Paper, Modal, Button, Tooltip, tooltipClasses  } from "@mui/material";
import { motion } from "framer-motion";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import GoogleIcon from "@mui/icons-material/Google";

import { styled } from "@mui/material/styles";

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#0077c2", // Azul corporativo intenso
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    borderRadius: 6,
    boxShadow: "0 4px 10px rgba(0, 119, 194, 0.5)", // sombra suave azul
    padding: "8px 16px",
    maxWidth: 220,
    textAlign: "center",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#0077c2", // mismo color para la flecha
  },
}));

function InicioApp() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box
      sx={{
        minHeight: "96vh",
        backgroundColor: "#e3f2fd",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <br />

      {/* ENCABEZADO */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Box
          component="header"
          sx={{
            background: "linear-gradient(90deg, #004d40 0%, #0077c2 100%)",
            color: "white",
            textAlign: "center",
            py: 4,
          }}
        >
          {/* LOGO */}
          <Box
            component="img"
            src="/ambiocom.png"
            alt="Logo Ambiocom"
            sx={{
              height: 96,
              mb: 2,
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              backgroundColor: "white",
              padding: "0.5rem",
            }}
          />
          <Typography variant="h4" component="h1">
            Bienvenido a Ambiocom S.A.S
          </Typography>
          <Typography variant="subtitle1">
            Plataforma interna de gestión y monitoreo
          </Typography>
        </Box>
      </motion.div>

      {/* CONTENIDO PRINCIPAL */}
      <Container
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1 }}
        maxWidth="md"
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={4}
          component={motion.div}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "white",
            borderLeft: "6px solid #0077c2",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: "#004d40", fontWeight: "bold" }}
          >
            Hola, colaborador 👋
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Esta plataforma está diseñada para brindarte acceso a los procesos internos de la
            organización. Revisa información, visualiza datos y contribuye a la mejora continua.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Si tienes dudas, contacta al área de sistemas o revisa los canales internos de soporte.
          </Typography>
        </Paper>
      </Container>

      {/* PIE DE PÁGINA */}
      <Box
        component="footer"
        sx={{
          backgroundColor: "#004d40",
          color: "white",
          textAlign: "center",
          py: 2,
        }}
      >
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Ambiocom S.A.S – Uso exclusivo interno
        </Typography>

        {/* Clickable developer name that opens modal */}
        <CustomTooltip title="Contactame" arrow enterDelay={500}>
          <motion.div
            initial={{ x: 0 }}
            animate={{
              x: [0, -5, 5, -5, 5, 0], // shake once
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                mt: 0.5,
                textDecoration: "underline",
                cursor: "pointer",
                display: "inline-block",
              }}
              onClick={handleOpen}
            >
              Desarrollado por Marlon Yoel Esteban Valencia – Ingeniero Químico y Desarrollador de Software
            </Typography>
          </motion.div>
        </CustomTooltip>
      </Box>

      {/* MODAL de contacto mejorado */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            maxWidth: 440,
            width: "90%",
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Contactar al desarrollador
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            ¿Tienes preguntas, sugerencias o deseas reportar un error? Puedes escribir directamente a mi correo.
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 2, color: "text.secondary", textAlign: "left" }}
          >
            Para enviar correos directamente desde la plataforma usando Gmail web, asegúrate de tener Gmail configurado como cliente de correo predeterminado en tu navegador.
            <br />
            En Google Chrome, cuando visites Gmail, puedes permitir que abra los enlaces de correo automáticamente siguiendo estos pasos:
          </Typography>
          <ul
            style={{
              paddingLeft: "1.5rem",
              marginTop: "0.5rem",
              color: "#555",
              textAlign: "left",
            }}
          >
            <li>Abre Gmail en Google Chrome.</li>
            <li>
              Mira en la barra de direcciones al lado derecho del ícono de estrella para agregar a favoritos, donde aparece un icono de doble diamante (handler).
            </li>
            <li>
              Haz clic en ese icono y selecciona "Permitir" para que Gmail pueda abrir los enlaces de correo (mailto) automáticamente.
            </li>
          </ul>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 3, textAlign: "left" }}
          >
            Así, al hacer clic en enlaces de correo desde esta plataforma, Gmail abrirá automáticamente una ventana para redactar el mensaje.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mt: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              href="https://mail.google.com/mail/?view=cm&fs=1&to=maryoe_95@hotmail.com&su=Contacto desde la plataforma Ambiocom"
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<GoogleIcon />}
              sx={{ minWidth: 180, fontWeight: "bold" }}
            >
              Usar Gmail Web
            </Button>

            <Button
              variant="contained"
              color="primary"
              href="mailto:maryoe_95@hotmail.com?subject=Contacto desde la plataforma"
              onClick={handleClose}
              startIcon={<MailOutlineIcon />}
              sx={{ minWidth: 180, fontWeight: "bold" }}
            >
              Cliente del sistema
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default InicioApp;
