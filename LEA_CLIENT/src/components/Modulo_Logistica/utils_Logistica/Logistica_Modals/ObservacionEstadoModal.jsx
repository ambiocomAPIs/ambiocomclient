import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import UpdateIcon from "@mui/icons-material/Update";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

const ESTADOS_DEFAULT = [
  "EN PLANTA",
  "RECHAZADO AMBIOCOM",
  "APROBADO AMBIOCOM",
  "EN CARGUE",
  "EN TRANSITO",
  "EN CLIENTE",
  "APROBADO POR EL CLIENTE",
  "APROBADO CON OBSERVACIONES",
  "RECHAZADO POR CLIENTE",
];

const getEstadoColor = (estado = "") => {
  const value = estado.toUpperCase();

  if (value.includes("RECHAZADO")) {
    return {
      bg: "rgba(211,47,47,0.10)",
      color: "#d32f2f",
      border: "rgba(211,47,47,0.35)",
      solid: "#d32f2f",
    };
  }

  if (value.includes("APROBADO") || value.includes("CLIENTE")) {
    return {
      bg: "rgba(46,125,50,0.10)",
      color: "#2e7d32",
      border: "rgba(46,125,50,0.35)",
      solid: "#2e7d32",
    };
  }

  if (value.includes("TRANSITO") || value.includes("CARGUE")) {
    return {
      bg: "rgba(245,124,0,0.10)",
      color: "#ef6c00",
      border: "rgba(245,124,0,0.35)",
      solid: "#ef6c00",
    };
  }

  return {
    bg: "rgba(25,118,210,0.10)",
    color: "#1976d2",
    border: "rgba(25,118,210,0.35)",
    solid: "#1976d2",
  };
};

const InfoItem = ({ label, value }) => (
  <Paper
    variant="outlined"
    sx={{
      px: 1.1,
      py: 0.7,
      borderRadius: 1.8,
      bgcolor: "#fff",
      borderColor: "rgba(15,23,42,0.06)",
      minHeight: 48,
      boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
    }}
  >
    <Typography
      sx={{
        color: "#64748b",
        fontWeight: 800,
        fontSize: 10.5,
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>

    <Typography
      title={value || ""}
      sx={{
        mt: 0.15,
        fontWeight: 900,
        color: "#0f172a",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: 12.5,
        lineHeight: 1.15,
      }}
    >
      {value || "—"}
    </Typography>
  </Paper>
);

const EstadoBadge = ({ estado, small = false }) => {
  const st = getEstadoColor(estado);

  return (
    <Chip
      label={estado || "—"}
      size={small ? "small" : "medium"}
      sx={{
        height: small ? 24 : 30,
        fontWeight: 900,
        fontSize: small ? 11 : 12,
        bgcolor: st.bg,
        color: st.color,
        border: `1px solid ${st.border}`,
        maxWidth: 260,
        letterSpacing: 0.2,
      }}
    />
  );
};

const ObservacionEstadoModal = ({
  open,
  onClose,
  data = {},
  title = "Gestión de estado del vehículo",
  subtitle = "Información completa del despacho",
  context: contextProp,
  estados = ESTADOS_DEFAULT,
  apiUrl,
  onUpdated,
}) => {
  const context = contextProp || data?.context || "modulo_despacho";
  const esRecepcion = context === "modulo_recepcion";

  const estadoInicial = (data?.estado || "").toString().toUpperCase().trim();

  const [estado, setEstado] = useState(estadoInicial || "EN CARGUE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEstado(estadoInicial || "EN CARGUE");
  }, [open, estadoInicial]);

  const estadoInicialStyle = useMemo(
    () => getEstadoColor(estadoInicial),
    [estadoInicial]
  );

  const cambioEstado = estado !== estadoInicial;

  const labelClienteProveedor = esRecepcion ? "Proveedor" : "Cliente";
  const valorClienteProveedor = esRecepcion
    ? data?.proveedor || data?.cliente || ""
    : data?.cliente || "";

  const observacion = data?.observacion || "";

  const handleGuardar = async () => {
    if (!apiUrl || !data?.row?._id) {
      console.error("Falta apiUrl o data.row._id para actualizar el estado");
      return;
    }

    try {
      setSaving(true);

      await axios.patch(
        `${apiUrl}/${data.row._id}/estado`,
        {
          vehiculo_rechazado: estado,
        },
        {
          withCredentials: true,
        }
      );

      if (onUpdated) await onUpdated();

      onClose();
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el estado del vehículo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 24px 80px rgba(15,23,42,0.28)",
          overflow: "hidden",
          bgcolor: "#f8fafc",
        },
      }}
    >
      <Box
        sx={{
          px: 2.2,
          py: 1.4,
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
          color: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: 18,
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>

            <Typography sx={{ opacity: 0.82, fontSize: 12.5, mt: 0.3 }}>
              {subtitle}
            </Typography>
          </Box>

          <Chip
            label={estado || "—"}
            size="small"
            sx={{
              height: 26,
              fontWeight: 950,
              fontSize: 11,
              bgcolor: "rgba(255,255,255,0.16)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              maxWidth: 250,
            }}
          />
        </Box>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.4,
            mb: 1.5,
            borderRadius: 2.4,
            border: "1px solid rgba(37,99,235,0.18)",
            background:
              "linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 950,
              color: "#1d4ed8",
              letterSpacing: 0.8,
              fontSize: 10.5,
              textTransform: "uppercase",
            }}
          >
            Resumen del despacho
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 0.7,
              mt: 0.6,
            }}
          >
            <InfoItem label="Fecha" value={data?.fecha} />
            <InfoItem label="Placa" value={data?.placa} />
            <InfoItem
              label={labelClienteProveedor}
              value={valorClienteProveedor}
            />
            <InfoItem label="Conductor" value={data?.conductor} />
            <InfoItem label="Transportadora" value={data?.transportadora} />
            <InfoItem label="Producto" value={data?.producto} />
            <InfoItem label="Volumen facturado" value={data?.volumenFacturado} />
            <InfoItem
              label="Volumen despachado"
              value={data?.volumenDespachado}
            />
            <InfoItem label="Peso neto báscula" value={data?.pesoNeto} />
            <InfoItem
              label="Remisión / Factura"
              value={data?.remisionFactura}
            />
            <InfoItem
              label="Orden fabricación"
              value={data?.ordenFabricacion}
            />
            <InfoItem label="ID registro" value={data?.row?._id} />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 2.5,
            border: "1px solid rgba(25,118,210,0.16)",
            bgcolor: "#ffffff",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.6,
              py: 1.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              borderBottom: "1px solid rgba(15,23,42,0.08)",
              background:
                "linear-gradient(135deg, rgba(248,251,255,1) 0%, rgba(239,246,255,1) 100%)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(25,118,210,0.10)",
                  color: "#1976d2",
                  border: "1px solid rgba(25,118,210,0.25)",
                }}
              >
                <UpdateIcon fontSize="small" />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 950, color: "#0f172a", fontSize: 14 }}>
                  Actualización de estado
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: 11.5 }}>
                  Cambia únicamente el estado operativo del vehículo
                </Typography>
              </Box>
            </Box>

            <Chip
              label={cambioEstado ? "Cambio pendiente" : "Sin cambios"}
              size="small"
              sx={{
                height: 24,
                fontWeight: 900,
                fontSize: 10.5,
                bgcolor: cambioEstado
                  ? "rgba(25,118,210,0.10)"
                  : "rgba(100,116,139,0.10)",
                color: cambioEstado ? "#1976d2" : "#64748b",
                border: `1px solid ${cambioEstado ? "rgba(25,118,210,0.25)" : "rgba(100,116,139,0.20)"
                  }`,
              }}
            />
          </Box>

          <Box sx={{ p: 1.6 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 40px 1.45fr" },
                gap: 1.3,
                alignItems: "stretch",
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  borderColor: "rgba(15,23,42,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: 72,
                }}
              >
                <Typography sx={{ color: "#64748b", fontWeight: 800, fontSize: 11 }}>
                  Estado actual
                </Typography>

                <Box sx={{ mt: 0.8 }}>
                  <EstadoBadge estado={estadoInicial || "—"} />
                </Box>
              </Paper>

              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1976d2",
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(25,118,210,0.08)",
                    border: "1px solid rgba(25,118,210,0.18)",
                  }}
                >
                  <SwapHorizIcon fontSize="small" />
                </Box>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "#f8fbff",
                  borderColor: "rgba(25,118,210,0.18)",
                  minHeight: 72,
                }}
              >
                <Typography sx={{ color: "#64748b", fontWeight: 800, fontSize: 11 }}>
                  Nuevo estado
                </Typography>

                <FormControl fullWidth size="small" sx={{ mt: 0.7 }}>
                  <Select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    disabled={saving}
                    IconComponent={KeyboardArrowDownRoundedIcon}
                    renderValue={(selected) => <EstadoBadge estado={selected} small />}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          borderRadius: 2,
                          boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          overflow: "hidden",
                        },
                      },
                    }}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                      color: "#1976d2",
                      fontWeight: 900,
                      minHeight: 38,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(25,118,210,0.35)",
                        borderWidth: 1.5,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1976d2",
                        borderWidth: 2,
                      },
                      "& .MuiSelect-icon": {
                        color: "#1976d2",
                      },
                    }}
                  >
                    {estados.map((item) => {
                      const st = getEstadoColor(item);

                      return (
                        <MenuItem key={item} value={item} dense>
                          <Box
                            sx={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: "50%",
                                  bgcolor: st.solid,
                                }}
                              />
                              <Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>
                                {item}
                              </Typography>
                            </Box>

                            {item === estadoInicial && (
                              <Chip
                                label="Actual"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  bgcolor: estadoInicialStyle.bg,
                                  color: estadoInicialStyle.color,
                                }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Paper>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                mt: 1.3,
                p: 1.2,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                borderColor: "rgba(15,23,42,0.08)",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontWeight: 800,
                  fontSize: 11,
                  mb: 0.5,
                }}
              >
                Observaciones del despacho
              </Typography>

              <Typography
                sx={{
                  color: "#0f172a",
                  fontSize: 13,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  maxHeight: 72,
                  overflowY: "auto",
                }}
              >
                {observacion || "Esta fila no tiene observación registrada"}
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.1,
          borderTop: "1px solid rgba(15,23,42,0.08)",
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            px: 2,
            color: "#475569",
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={saving || !cambioEstado}
          startIcon={
            saving ? (
              <CircularProgress size={16} sx={{ color: "inherit" }} />
            ) : (
              <UpdateIcon />
            )
          }
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 950,
            px: 2.4,
            boxShadow: "none",
            bgcolor: "#1976d2",
            "&:hover": {
              bgcolor: "#115293",
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(25,118,210,0.35)",
              color: "#fff",
            },
          }}
        >
          {saving ? "Guardando..." : "Actualizar estado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservacionEstadoModal;