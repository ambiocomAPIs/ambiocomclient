import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Typography,
} from "@mui/material";

const ObservacionEstadoModal = ({
  open,
  onClose,
  data = {},
  title = "Observación del vehículo",
  subtitle = "Revisión / control de despacho",
  context: contextProp,
}) => {
  const context = contextProp || data?.context || "modulo_despacho";

  const estado = (data?.estado || "").toString().toUpperCase().trim();

  const isAlert =
    estado === "SI" ||
    estado === "RECHAZADO POR CLIENTE" ||
    estado === "APROBADO CON OBSERVACIONES" ||
    estado === "RETRASADO" ||
    estado === "RECHAZADO" ||
    estado === "PROCESO";

  const esRecepcion = context === "modulo_recepcion";

  const labelClienteProveedor = esRecepcion ? "Proveedor" : "Cliente";
  const valorClienteProveedor = esRecepcion
    ? data?.proveedor || data?.cliente || ""
    : data?.cliente || "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 2.2,
          py: 1.6,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, letterSpacing: 0.2 }}
            >
              {title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.1,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.4,
              border: "1px solid rgba(0,0,0,0.14)",
              bgcolor: isAlert
                ? "rgba(211, 47, 47, 0.10)"
                : "rgba(46, 125, 50, 0.10)",
              color: isAlert ? "rgb(211, 47, 47)" : "rgb(46, 125, 50)",
              whiteSpace: "nowrap",
            }}
          >
            {estado || "—"}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ px: 2.2, py: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            p: 1.4,
            bgcolor: "rgba(0,0,0,0.02)",
            borderColor: "rgba(0,0,0,0.08)",
            mb: 1.5,
          }}
        >
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr", rowGap: 0.6 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Fecha
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data?.fecha || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {labelClienteProveedor}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  textAlign: "right",
                  maxWidth: "65%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={valorClienteProveedor || ""}
              >
                {valorClienteProveedor || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Transportadora
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  textAlign: "right",
                  maxWidth: "65%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={data?.transportadora || ""}
              >
                {data?.transportadora || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Producto
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  textAlign: "right",
                  maxWidth: "65%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={data?.producto || ""}
              >
                {data?.producto || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Conductor
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  textAlign: "right",
                  maxWidth: "65%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={data?.conductor || ""}
              >
                {data?.conductor || "—"}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          sx={{ opacity: 0.75, display: "block", mb: 0.8 }}
        >
          Observación
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            p: 1.4,
            borderColor: "rgba(0,0,0,0.10)",
            bgcolor: "#fff",
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
          >
            {data?.observacion || "Esta fila no tiene observación registrada"}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.2,
          py: 1.4,
          borderTop: "1px solid rgba(0,0,0,0.08)",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            px: 2.4,
            boxShadow: "none",
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservacionEstadoModal;