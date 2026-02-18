import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

// Animación para gradiente en background
const gradientVariants = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Animación para las burbujas del fondo
const bubbleVariants = {
  animate: {
    y: [0, -20, 0],
    x: [0, 20, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    },
  },
};

export default function ModuloEnMantenimiento() {
  return (
    <Box
      sx={{
        // Forzar que ocupe 100% del viewport
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        m: 0,
        p: 0,
      }}
    >
      {/* Fondo animado - gradiente en movimiento */}
      <motion.div
        variants={gradientVariants}
        animate="animate"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `linear-gradient(270deg,
            #2E7D32, 
            #4CAF50, 
            #0288D1, 
            #0277BD, 
            #ffffff,
            #4CAF50,
            #0277BD
          )`,
          backgroundSize: "1400% 1400%",
          zIndex: 0,
          filter: "brightness(0.9)",
        }}
      />

      {/* Burbujas */}
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        style={{
          position: "absolute",
          top: "0%",
          left: "0%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          filter: "blur(50px)",
          zIndex: 0,
        }}
      />
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          filter: "blur(80px)",
          zIndex: 0,
          animationDelay: "4s",
        }}
      />
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        style={{
          position: "absolute",
          top: "40%",
          right: "30%",
          width: 150,
          height: 150,
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          filter: "blur(40px)",
          zIndex: 0,
          animationDelay: "2s",
        }}
      />

      {/* Contenido principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          maxWidth: 560,
          width: "90%",
          textAlign: "center",
          padding: "48px 40px",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0px 12px 30px rgba(0,0,0,0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LOGO */}
        <motion.img
          src={"/LogoCompany/logoambiocomsinfondo.png"}
          alt="Ambiocom"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            maxWidth: 220,
            marginBottom: 24,
            userSelect: "none",
          }}
        />

        {/* TITULO */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#2E7D32",
            mb: 1,
          }}
        >
          Módulo en mantenimiento
        </Typography>

        {/* MENSAJE PRINCIPAL */}
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            lineHeight: 1.7,
            mb: 2,
          }}
        >
          Disculpa las molestias.
          <br />
          Este módulo se encuentra actualmente en proceso de{" "}
          <strong>mantenimiento y desarrollo</strong>.
        </Typography>

        {/* MENSAJE SECUNDARIO */}
        <Typography
          variant="body2"
          sx={{
            color: "#2E7D32",
            fontWeight: 600,
          }}
        >
          Próximamente estará disponible.
        </Typography>

        {/* FOOTER */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 4,
            color: "text.disabled",
          }}
        >
          Ambiocom · Gestión Ambiental
        </Typography>
      </motion.div>
    </Box>
  );
}
