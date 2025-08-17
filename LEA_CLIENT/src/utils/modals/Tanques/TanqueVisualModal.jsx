// src/utils/modals/Tanques/TanqueVisualModal.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import InformacionTanques from "./InformacionTanques"; // trae los tanques y la informacion detallada

const TanqueVisualModal = ({ open, onClose, nombreTanque }) => {
  const tanqueData = InformacionTanques[nombreTanque];
  const imagePath = tanqueData?.imagen;
  const dimensiones = tanqueData?.dimensiones;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "1.3rem",
          color: "primary.main",
        }}
      >
        Visualizando: Tanque {nombreTanque}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          position: "relative",
        }}
      >
        {imagePath ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              maxWidth: 600,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Imagen */}
            <Box
              component="img"
              src={imagePath}
              alt={`Tanque ${nombreTanque}`}
              sx={{
                mt: -10,
                maxHeight: "94%",
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: 2,
              }}
            />

            {/* Línea de altura */}
            <Box
              sx={{
                position: "absolute",
                left: 12,
                top: "10%",
                bottom: "10%",
                width: "2px",
                backgroundColor: "red",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                color: "red",
                fontWeight: "bold",
              }}
            >
              {dimensiones?.altura}
            </Typography>

            {/* Línea de diámetro */}
            <Box
              sx={{
                position: "absolute",
                bottom: 35,
                left: "20%",
                right: "20%",
                height: "2px",
                backgroundColor: "blue",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                bottom: 40,
                left: "50%",
                transform: "translateX(-50%)",
                color: "blue",
                fontWeight: "bold",
              }}
            >
              {dimensiones?.diametro}
            </Typography>

            {/* Tarjeta con dimensiones */}
            {dimensiones && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 10,
                  right: -100,
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  borderRadius: 2,
                  padding: "8px 12px",
                  boxShadow: 3,
                  zIndex: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>Material:</strong> {dimensiones.material}
                </Typography>
                <Typography variant="body2">
                  <strong>Altura:</strong> {dimensiones.altura}
                </Typography>
                <Typography variant="body2">
                  <strong>Diámetro:</strong> {dimensiones.diametro}
                </Typography>
                <Typography variant="body2">
                  <strong>Volumen:</strong> {dimensiones.volumen}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No se encontró una imagen para el tanque{" "}
            <strong>{nombreTanque}</strong>.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TanqueVisualModal;
