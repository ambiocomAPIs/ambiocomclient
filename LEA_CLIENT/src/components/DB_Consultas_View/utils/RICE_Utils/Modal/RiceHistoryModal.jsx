import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Typography,
  Paper,
  Chip,
  Box,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import UpdateIcon from "@mui/icons-material/Update";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function getHistoryColor(tipo = "") {
  switch (tipo) {
    case "Creación":
      return "success";
    case "Cambio de estado":
      return "warning";
    case "Cambio RICE":
      return "secondary";
    case "Actualización":
      return "primary";
    default:
      return "default";
  }
}

function getHistoryIcon(tipo = "") {
  if (tipo === "Creación") return <AddCircleOutlineIcon fontSize="small" />;
  return <UpdateIcon fontSize="small" />;
}

function formatValue(value) {
  if (value === "" || value === null || value === undefined) return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

/* ==============================
   FORMATO FECHA / HORA COLOMBIA
============================== */
function formatFechaHora(fecha) {
  if (!fecha) return "Sin fecha";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return "Fecha no válida";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatFechaSolo(fecha) {
  if (!fecha) return "Sin fecha";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return "Fecha no válida";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatHoraSolo(fecha) {
  if (!fecha) return "";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function RiceHistoryModal({ open, onClose, item }) {
  const historial = item?.historial || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 900,
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <HistoryIcon />

          <Box>
            <Typography sx={{ fontWeight: 900 }}>
              Historial del ítem
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item?.titulo || "Sin ítem seleccionado"}
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {historial.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: "#f8f9fb",
              border: "1px dashed",
              borderColor: "rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>
              Este ítem todavía no tiene historial registrado.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {[...historial].reverse().map((event, index) => (
              <Paper
                key={event.id || index}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.10)",
                  bgcolor: "#ffffff",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 5,
                    height: "100%",
                    bgcolor:
                      event.tipo === "Creación"
                        ? "#2E7D32"
                        : event.tipo === "Cambio de estado"
                        ? "#EF6C00"
                        : event.tipo === "Cambio RICE"
                        ? "#6A1B9A"
                        : "#1565C0",
                  },
                }}
              >
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={getHistoryIcon(event.tipo)}
                        label={event.tipo}
                        color={getHistoryColor(event.tipo)}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />

                      <Typography sx={{ fontWeight: 900 }}>
                        {event.titulo || "Movimiento registrado"}
                      </Typography>
                    </Stack>

                    {/* FECHA Y HORA FORMATEADA */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        px: 1.2,
                        py: 0.7,
                        borderRadius: 999,
                        bgcolor: "#f4f6f8",
                        border: "1px solid rgba(0,0,0,0.08)",
                        maxWidth: "100%",
                      }}
                    >
                      <AccessTimeIcon
                        sx={{
                          fontSize: 17,
                          color: "text.secondary",
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.primary",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatFechaHora(event.fecha)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Opcional: línea más ejecutiva debajo */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    Fecha: {formatFechaSolo(event.fecha)} · Hora:{" "}
                    {formatHoraSolo(event.fecha)}
                  </Typography>

                  {event.descripcion && (
                    <Typography sx={{ color: "text.secondary" }}>
                      {event.descripcion}
                    </Typography>
                  )}

                  {event.cambios?.length > 0 && (
                    <>
                      <Divider />

                      <Stack spacing={0.8}>
                        {event.cambios.map((change, i) => (
                          <Box
                            key={`${change.campo}-${i}`}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                md: "180px 1fr 1fr",
                              },
                              gap: 1,
                              alignItems: "center",
                              p: 1,
                              borderRadius: 2,
                              bgcolor: "#f8f9fb",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 900 }}
                            >
                              {change.campo}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                overflowWrap: "anywhere",
                              }}
                            >
                              Antes:{" "}
                              <strong>{formatValue(change.anterior)}</strong>
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                overflowWrap: "anywhere",
                              }}
                            >
                              Ahora:{" "}
                              <strong>{formatValue(change.nuevo)}</strong>
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}