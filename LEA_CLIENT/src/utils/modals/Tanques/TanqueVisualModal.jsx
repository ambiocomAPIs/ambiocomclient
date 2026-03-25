// src/utils/modals/Tanques/TanqueVisualModal.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StraightenIcon from "@mui/icons-material/Straighten";
import HeightIcon from "@mui/icons-material/Height";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

import InformacionTanques from "./InformacionTanques";

/**
 * Escala visual manual por tanque.
 * Ajusta solo los que lo necesiten.
 * 1 = normal
 * >1 = más grande
 * <1 = más pequeño
 */
const TANK_IMAGE_SCALE = {
  // "301": 1.08,
  // "401": 0.94,
  // "801A": 1.12,
  // "M-301/801A": 0.98,
};

const DEFAULT_SCALE = 1;

const TanqueVisualModal = ({ open, onClose, nombreTanque }) => {
  const tanqueData = InformacionTanques?.[nombreTanque] ?? null;
  const imagePath = tanqueData?.imagen ?? "";
  const dimensiones = tanqueData?.dimensiones ?? {};

  const material = dimensiones?.material ?? "No disponible";
  const altura = dimensiones?.altura ?? "No disponible";
  const diametro = dimensiones?.diametro ?? "No disponible";
  const volumen = dimensiones?.volumen ?? "No disponible";

  const tieneImagen = Boolean(imagePath);
  const imageScale = TANK_IMAGE_SCALE?.[nombreTanque] ?? DEFAULT_SCALE;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          minHeight: { xs: "82vh", md: "88vh" },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background:
            "linear-gradient(135deg, rgba(227,242,253,0.95) 0%, rgba(248,250,252,1) 100%)",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.1 }}
          >
            Tanque {nombreTanque}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualización técnica y especificaciones
          </Typography>
        </Box>

        <IconButton onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, md: 3 },
          backgroundColor: "#f8fafc",
        }}
      >
        <Grid container spacing={2.5}>
          {/* VISUAL */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
                minHeight: { xs: 360, md: 620 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tieneImagen ? (
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    minHeight: { xs: 320, md: 560 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 2,
                    background:
                      "radial-gradient(circle at center, rgba(241,245,249,1) 0%, rgba(255,255,255,1) 65%)",
                  }}
                >
                  {/* Marco uniforme para todos los tanques */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: { xs: 300, md: 520 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Caja interna fija donde siempre se adapta la imagen */}
                    <Box
                      sx={{
                        width: { xs: "80%", md: "78%" },
                        height: { xs: "78%", md: "82%" },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <Box
                        component="img"
                        src={imagePath}
                        alt={`Tanque ${nombreTanque}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          objectPosition: "center center",
                          transform: `scale(${imageScale})`,
                          transformOrigin: "center center",
                          borderRadius: 2,
                          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.12))",
                          transition: "transform 0.25s ease",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                      />
                    </Box>

                    {/* Línea vertical - Altura */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: { xs: 20, md: 34 },
                        top: "10%",
                        bottom: "10%",
                        width: "3px",
                        backgroundColor: "#d32f2f",
                        borderRadius: 99,
                      }}
                    />

                    {/* Flecha superior */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: { xs: 16, md: 30 },
                        top: "9%",
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderBottom: "10px solid #d32f2f",
                      }}
                    />

                    {/* Flecha inferior */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: { xs: 16, md: 30 },
                        bottom: "9%",
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "10px solid #d32f2f",
                      }}
                    />

                    <Chip
                      icon={<HeightIcon sx={{ fontSize: 16 }} />}
                      label={`Altura: ${altura}`}
                      size="small"
                      sx={{
                        position: "absolute",
                        left: { xs: 28, md: 46 },
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.96)",
                        color: "#b71c1c",
                        fontWeight: 700,
                        boxShadow: 2,
                      }}
                    />

                    {/* Línea horizontal - Diámetro */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "22%",
                        right: "22%",
                        bottom: { xs: 24, md: 34 },
                        height: "3px",
                        backgroundColor: "#1565c0",
                        borderRadius: 99,
                      }}
                    />

                    {/* Flecha izquierda */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "21.5%",
                        bottom: { xs: 20, md: 30 },
                        width: 0,
                        height: 0,
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        borderRight: "10px solid #1565c0",
                      }}
                    />

                    {/* Flecha derecha */}
                    <Box
                      sx={{
                        position: "absolute",
                        right: "21.5%",
                        bottom: { xs: 20, md: 30 },
                        width: 0,
                        height: 0,
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        borderLeft: "10px solid #1565c0",
                      }}
                    />

                    <Chip
                      icon={<StraightenIcon sx={{ fontSize: 16 }} />}
                      label={`Diámetro: ${diametro}`}
                      size="small"
                      sx={{
                        position: "absolute",
                        left: "50%",
                        bottom: { xs: 34, md: 46 },
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(255,255,255,0.96)",
                        color: "#0d47a1",
                        fontWeight: 700,
                        boxShadow: 2,
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    minHeight: { xs: 300, md: 560 },
                    borderRadius: 3,
                    border: "1px dashed rgba(0,0,0,0.18)",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 3,
                  }}
                >
                  <ImageNotSupportedOutlinedIcon
                    sx={{ fontSize: 58, color: "text.secondary", mb: 1.5 }}
                  />
                  <Typography variant="h6" fontWeight={700}>
                    No hay imagen disponible
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No se encontró una imagen para el tanque{" "}
                    <strong>{nombreTanque}</strong>.
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Aun así puedes consultar la ficha técnica en el panel lateral.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* FICHA TÉCNICA */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.08)",
                backgroundColor: "#ffffff",
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Especificaciones
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Información asociada al tanque seleccionado.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <CategoryOutlinedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Material
                        </Typography>
                        <Typography fontWeight={700}>{material}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#fff5f5",
                      borderColor: "rgba(211,47,47,0.20)",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <HeightIcon sx={{ color: "#d32f2f" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Altura
                        </Typography>
                        <Typography fontWeight={700}>{altura}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#f3f8ff",
                      borderColor: "rgba(21,101,192,0.20)",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <StraightenIcon sx={{ color: "#1565c0" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Diámetro
                        </Typography>
                        <Typography fontWeight={700}>{diametro}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#f6fff8",
                      borderColor: "rgba(46,125,50,0.18)",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Inventory2OutlinedIcon sx={{ color: "#2e7d32" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Volumen
                        </Typography>
                        <Typography fontWeight={700}>{volumen}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px dashed rgba(0,0,0,0.12)",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Referencias visuales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  La línea roja representa la altura total del tanque y la línea azul
                  el diámetro aproximado mostrado en la ilustración.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default TanqueVisualModal;