import React from "react";
import { Box, Typography, Container, Paper } from "@mui/material";
import { motion } from "framer-motion";

function InicioApp() {
  return (
    <Box
      sx={{
        minHeight: "96vh",
        backgroundColor: "#e3f2fd", // azul claro de fondo
        display: "flex",
        flexDirection: "column",
      }}
    >
        <br></br>
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
            borderLeft: "6px solid #0077c2", // Azul corporativo
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
      </Box>
    </Box>
  );
}

export default InicioApp;
