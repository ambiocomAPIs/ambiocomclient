import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const ESTADOS_PROGRAMACION = [
  "PENDIENTE",
  "CONFIRMADO",
  "EN PLANTA",
  "EN CARGUE",
  "DESPACHADO",
  "EN TRÁNSITO",
  "EN CLIENTE",
  "ENTREGADO",
  "CANCELADO",
];

const normalizeText = (value) =>
  String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeEstado = (value) =>
  normalizeText(value || "PENDIENTE").toUpperCase();

const formatNumber = (value) => {
  const numero = Number(value);

  if (Number.isNaN(numero)) return "0";

  return numero.toLocaleString("es-CO");
};

const getEstadoChipColor = (estado) => {
  const value = normalizeEstado(estado);

  if (value === "ENTREGADO") return "success";
  if (value === "CANCELADO") return "error";
  if (value === "PENDIENTE") return "warning";
  if (value === "CONFIRMADO") return "info";

  return "primary";
};

const ReadOnlyField = ({ label, value, md = 3 }) => (
  <Grid item xs={12} md={md}>
    <TextField
      fullWidth
      size="small"
      label={label}
      value={normalizeText(value) || "—"}
      InputLabelProps={{ shrink: true }}
      InputProps={{ readOnly: true }}
      sx={{
        "& .MuiInputBase-root": {
          backgroundColor: "rgba(0, 0, 0, 0.025)",
        },
        "& .MuiInputBase-input": {
          fontSize: 13,
          fontWeight: 500,
        },
      }}
    />
  </Grid>
);

const EstadoProgramacionModal = ({
  open,
  programacion,
  saving = false,
  onClose,
  onSave,
}) => {
  const [estado, setEstado] = useState("PENDIENTE");
  const [observacionesEstado, setObservacionesEstado] = useState("");
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    setEstado(normalizeEstado(programacion?.estado));
    setObservacionesEstado(
      normalizeText(programacion?.observacionesEstado)
    );
  }, [
    open,
    programacion?._id,
    programacion?.estado,
    programacion?.observacionesEstado,
  ]);

  const estadoInicial = normalizeEstado(programacion?.estado);
  const observacionInicial = normalizeText(
    programacion?.observacionesEstado
  );

  const hayCambios =
    normalizeEstado(estado) !== estadoInicial ||
    normalizeText(observacionesEstado) !== observacionInicial;

  const handleClose = () => {
    if (saving || submitLockRef.current) return;

    onClose?.();
  };

  const handleSubmit = async () => {
    if (saving || submitLockRef.current || !programacion?._id) return;

    submitLockRef.current = true;

    try {
      await onSave?.({
        estado: normalizeEstado(estado),
        observacionesEstado: normalizeText(observacionesEstado),
      });
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
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
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <FactCheckIcon color="primary" />

          <Box>
            <Typography variant="h6" fontWeight="bold">
              Estado de la programación
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Consulta la información y actualiza el seguimiento del despacho.
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={saving}
          aria-label="Cerrar modal"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {programacion && (
          <>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Estado actual:
              </Typography>

              <Chip
                size="small"
                label={estadoInicial}
                color={getEstadoChipColor(estadoInicial)}
              />
            </Box>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              Información de la programación
            </Typography>

            <Grid container spacing={2}>
              <ReadOnlyField
                label="Fecha programación"
                value={programacion.fecha}
                md={2}
              />

              <ReadOnlyField
                label="Fecha estimada entrega"
                value={
                  normalizeText(programacion.fechaEstimadaEntrega).toUpperCase() ===
                    "NA" || !programacion.fechaEstimadaEntrega
                    ? "Pendiente"
                    : programacion.fechaEstimadaEntrega
                }
                md={3}
              />

              <ReadOnlyField
                label="Hora programada"
                value={programacion.horaProgramada}
                md={2}
              />

              <ReadOnlyField
                label="Placa"
                value={programacion.placa}
                md={2}
              />

              <ReadOnlyField
                label="Trailer"
                value={programacion.trailer}
                md={3}
              />

              <ReadOnlyField
                label="Conductor"
                value={programacion.conductor}
                md={4}
              />

              <ReadOnlyField
                label="Transportadora"
                value={programacion.transportadora}
                md={4}
              />

              <ReadOnlyField
                label="Cliente"
                value={programacion.cliente}
                md={4}
              />

              <ReadOnlyField
                label="Destino"
                value={programacion.destino}
                md={3}
              />

              <ReadOnlyField
                label="Producto"
                value={programacion.producto}
                md={3}
              />

              <ReadOnlyField
                label="Cantidad"
                value={`${formatNumber(programacion.cantidad)} L`}
                md={3}
              />

              <ReadOnlyField
                label="Despacho cumplido"
                value={programacion.cumplido ? "SÍ" : "NO"}
                md={3}
              />
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              Actualización del estado
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Estado"
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                  disabled={saving}
                >
                  {ESTADOS_PROGRAMACION.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  label="Observaciones"
                  value={observacionesEstado}
                  onChange={(event) =>
                    setObservacionesEstado(event.target.value)
                  }
                  placeholder="Escribe novedades o información relevante..."
                  disabled={saving}
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${observacionesEstado.length}/1000 caracteres`}
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          onClick={handleClose}
          disabled={saving}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || !programacion || !estado || !hayCambios}
        >
          {saving ? "Guardando..." : "Guardar estado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EstadoProgramacionModal;