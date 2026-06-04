import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HistoryIcon from "@mui/icons-material/History";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const estadosKanban = [
  "Backlog",
  "En análisis",
  "Priorizado",
  "En sprint",
  "En ajuste",
  "Completado",
];

function calculateRice(item) {
  const alcance = Number(item.alcance) || 0;
  const impacto = Number(item.impacto) || 0;
  const confianza = Number(item.confianza) || 0;
  const esfuerzo = Number(item.esfuerzo) || 1;

  return ((alcance * impacto * confianza) / esfuerzo).toFixed(2);
}

function formatScore(score) {
  const value = Number(score);
  return Number.isInteger(value) ? String(value) : String(value);
}

function getEstadoStyles(estado) {
  switch (estado) {
    case "Backlog":
      return {
        bg: "#F7F6F1",
        border: "#D8D2C4",
        accent: "#8D7B68",
        headerBg: "#EFEDE6",
      };

    case "En análisis":
      return {
        bg: "#F3EAFE",
        border: "#B39DDB",
        accent: "#6A1B9A",
        headerBg: "#E9DDF8",
      };

    case "Priorizado":
      return {
        bg: "#FFF4E5",
        border: "#FFB74D",
        accent: "#EF6C00",
        headerBg: "#FFE8C2",
      };

    case "En sprint":
      return {
        bg: "#EAF4FF",
        border: "#90CAF9",
        accent: "#1565C0",
        headerBg: "#DCEEFF",
      };

    case "En ajuste":
      return {
        bg: "#FFF8E1",
        border: "#FFE082",
        accent: "#F9A825",
        headerBg: "#FFF0B8",
      };

    case "Completado":
      return {
        bg: "#EAF7EF",
        border: "#81C784",
        accent: "#2E7D32",
        headerBg: "#DDF2E5",
      };

    default:
      return {
        bg: "#F8F9FB",
        border: "rgba(0,0,0,0.12)",
        accent: "#616161",
        headerBg: "#F1F3F4",
      };
  }
}

function getCarrilColor(carril = "") {
  if (carril.includes("Carril 1")) return "success";
  if (carril.includes("Carril 2")) return "primary";
  return "default";
}

function getCarrilLabel(carril = "") {
  if (carril.includes("Carril 1")) return "Carril 1";
  if (carril.includes("Carril 2")) return "Carril 2";
  return carril || "Sin carril";
}

function getTipoActividadColor(tipo = "") {
  switch (tipo) {
    case "Requerimiento":
      return "primary";
    case "Tarea":
      return "success";
    case "Hallazgo":
      return "warning";
    case "Seguridad":
      return "error";
    case "Soporte":
      return "secondary";
    case "Mejora":
      return "info";
    default:
      return "default";
  }
}

function getRiceProgressColor(score, fallbackColor) {
  const value = Number(score);

  if (value >= 5) return "#2e7d32";
  if (value >= 2.5) return fallbackColor;
  return "#9e9e9e";
}

export default function RiceKanbanBoard({
  items = [],
  onView,
  onHistory,
  onDelete,
}) {
  const groupedItems = useMemo(() => {
    return estadosKanban.reduce((acc, estado) => {
      acc[estado] = items
        .filter((item) => item.estado === estado)
        .sort((a, b) => Number(calculateRice(b)) - Number(calculateRice(a)));

      return acc;
    }, {});
  }, [items]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "#ffffff",
        border: "1px solid",
        borderColor: "rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Tablero Kanban RICE
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Seguimiento visual por estado, prioridad RICE y bloqueos
            gerenciales.
          </Typography>
        </Box>

        <Chip
          label={`${items.length} ítems`}
          sx={{
            fontWeight: 800,
            bgcolor: "#f4f6f8",
          }}
        />
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          overflowY: "hidden",
          pb: 1.5,
          pr: 0.5,
          scrollSnapType: "x proximity",
          "&::-webkit-scrollbar": {
            height: 10,
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "rgba(0,0,0,0.05)",
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(0,0,0,0.22)",
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            bgcolor: "rgba(0,0,0,0.34)",
          },
        }}
      >
        {estadosKanban.map((estado) => {
          const styles = getEstadoStyles(estado);
          const columnItems = groupedItems[estado] || [];

          return (
            <Paper
              key={estado}
              elevation={0}
              sx={{
                flex: "0 0 380px",
                width: 380,
                maxWidth: "88vw",
                height: {
                  xs: "70vh",
                  md: "calc(100vh - 220px)",
                },
                minHeight: 540,
                borderRadius: 3,
                bgcolor: styles.bg,
                border: "1px solid",
                borderColor: styles.border,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                scrollSnapAlign: "start",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: styles.headerBg,
                  borderBottom: "1px solid",
                  borderColor: styles.border,
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  flexShrink: 0,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: styles.accent,
                    }}
                  >
                    {estado}
                  </Typography>

                  <Chip
                    size="small"
                    label={columnItems.length}
                    sx={{
                      fontWeight: 900,
                      bgcolor: "#ffffff",
                      color: styles.accent,
                      border: "1px solid",
                      borderColor: styles.border,
                    }}
                  />
                </Stack>
              </Box>

              <Stack
                spacing={1.3}
                sx={{
                  p: 1.5,
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  alignItems: "stretch",
                  "&::-webkit-scrollbar": {
                    width: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "rgba(0,0,0,0.04)",
                    borderRadius: 999,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "rgba(0,0,0,0.18)",
                    borderRadius: 999,
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    bgcolor: "rgba(0,0,0,0.28)",
                  },
                }}
              >
                {columnItems.map((item, index) => {
                  const score = calculateRice(item);
                  const progress = Math.min(Number(score) * 20, 100);
                  const hasVeto = Boolean(item.vetoGerencia);
                  const progressColor = getRiceProgressColor(
                    score,
                    styles.accent
                  );

                  return (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 1.6,
                        pl: 1.8,
                        borderRadius: 3,
                        bgcolor: hasVeto ? "#fff7f7" : "#ffffff",
                        border: "1px solid",
                        borderColor: hasVeto
                          ? "rgba(211,47,47,0.30)"
                          : "rgba(0,0,0,0.10)",
                        boxShadow: hasVeto
                          ? "0 8px 24px rgba(211,47,47,0.10)"
                          : "none",
                        transition: "all 0.22s ease",
                        position: "relative",
                        overflow: "hidden",
                        flexShrink: 0,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: hasVeto
                            ? "0 14px 34px rgba(211,47,47,0.16)"
                            : "0 10px 24px rgba(0,0,0,0.10)",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: 6,
                          height: "100%",
                          bgcolor: hasVeto ? "#d32f2f" : styles.accent,
                        },
                      }}
                    >
                      <Stack spacing={1.15}>
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            flexWrap="wrap"
                            sx={{ minWidth: 0 }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 900,
                                color: "text.secondary",
                              }}
                            >
                              #{index + 1}
                            </Typography>

                            <Chip
                              size="small"
                              label={getCarrilLabel(item.carril)}
                              color={getCarrilColor(item.carril)}
                              sx={{
                                fontWeight: 800,
                                height: 24,
                              }}
                            />

                            {item.tipoActividad && (
                              <Chip
                                size="small"
                                label={item.tipoActividad}
                                color={getTipoActividadColor(
                                  item.tipoActividad
                                )}
                                sx={{
                                  fontWeight: 800,
                                  height: 24,
                                }}
                              />
                            )}
                          </Stack>

                          {hasVeto && (
                            <Tooltip title="Veto gerencial activo">
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 2,
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                  bgcolor: "rgba(211,47,47,0.10)",
                                  color: "#d32f2f",
                                  border: "1px solid rgba(211,47,47,0.20)",
                                  animation:
                                    "kanbanVetoPulse 1.45s infinite ease-in-out",
                                  "@keyframes kanbanVetoPulse": {
                                    "0%": {
                                      transform: "scale(1)",
                                      boxShadow:
                                        "0 0 0 0 rgba(211,47,47,0.22)",
                                    },
                                    "70%": {
                                      transform: "scale(1.06)",
                                      boxShadow:
                                        "0 0 0 8px rgba(211,47,47,0)",
                                    },
                                    "100%": {
                                      transform: "scale(1)",
                                      boxShadow:
                                        "0 0 0 0 rgba(211,47,47,0)",
                                    },
                                  },
                                }}
                              >
                                <WarningAmberRoundedIcon fontSize="small" />
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>

                        <Typography
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1.18,
                            fontSize: 16,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.titulo}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.descripcion || "Sin descripción registrada."}
                        </Typography>

                        <Box
                          sx={{
                            width: "100%",
                            height: 6,
                            borderRadius: 999,
                            bgcolor: "rgba(0,0,0,0.10)",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${progress}%`,
                              height: "100%",
                              borderRadius: 999,
                              bgcolor: hasVeto ? "#d32f2f" : progressColor,
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 0.8,
                          }}
                        >
                          {[
                            ["R", item.alcance],
                            ["I", item.impacto],
                            [
                              "C",
                              `${Math.round(Number(item.confianza) * 100)}%`,
                            ],
                            ["E", item.esfuerzo],
                          ].map(([label, value]) => (
                            <Paper
                              key={label}
                              elevation={0}
                              sx={{
                                p: 0.8,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: hasVeto
                                  ? "rgba(211,47,47,0.14)"
                                  : "rgba(0,0,0,0.10)",
                                bgcolor: hasVeto ? "#ffffff" : "#fafafa",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  color: "text.secondary",
                                  fontWeight: 800,
                                  lineHeight: 1.1,
                                }}
                              >
                                {label}
                              </Typography>

                              <Typography
                                sx={{
                                  fontWeight: 900,
                                  lineHeight: 1.2,
                                }}
                              >
                                {value}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>

                        <Divider />

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 800,
                                letterSpacing: 0.4,
                              }}
                            >
                              RICE
                            </Typography>

                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 900,
                                lineHeight: 1,
                                color: hasVeto ? "#b71c1c" : styles.accent,
                              }}
                            >
                              {formatScore(score)}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={0.7}>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => onView?.(item)}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 2,
                                  bgcolor: "#ffffff",
                                  border: "1px solid",
                                  borderColor: "rgba(0,0,0,0.14)",
                                  "&:hover": {
                                    bgcolor: "#f4f6f8",
                                  },
                                }}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Historial">
                              <IconButton
                                size="small"
                                onClick={() => onHistory?.(item)}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 2,
                                  bgcolor: "#ffffff",
                                  border: "1px solid",
                                  borderColor: "rgba(0,0,0,0.14)",
                                  "&:hover": {
                                    bgcolor: "#f4f6f8",
                                  },
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete?.(item.id)}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 2,
                                  bgcolor: "#ffffff",
                                  border: "1px solid",
                                  borderColor: "rgba(211,47,47,0.22)",
                                  "&:hover": {
                                    bgcolor: "rgba(211,47,47,0.08)",
                                  },
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Stack spacing={0.2}>
                          {item.areaSolicitante && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 700,
                              }}
                            >
                              Área: {item.areaSolicitante}
                            </Typography>
                          )}

                          {item.sprint && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 700,
                              }}
                            >
                              Sprint: {item.sprint}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}

                {columnItems.length === 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "rgba(255,255,255,0.55)",
                      border: "1px dashed",
                      borderColor: styles.border,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                      }}
                    >
                      Sin ítems
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
}