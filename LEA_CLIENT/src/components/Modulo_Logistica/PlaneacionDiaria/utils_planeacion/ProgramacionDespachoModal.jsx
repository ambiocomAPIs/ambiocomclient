import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Box,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

const INPUT_SX_COMPACT = {
  "& .MuiInputBase-root": {
    height: 40,
    fontSize: 13,
  },
  "& .MuiInputBase-input": {
    padding: "8px 10px",
  },
  "& .MuiInputLabel-root": {
    fontSize: 15,
    top: "-3px",
  },
  "& .MuiInputLabel-shrink": {
    top: 0,
  },
};

const ProgramacionDespachoModal = ({
  open,
  editingId,
  form,
  catalog,
  catalogLoading,
  canEditFechaEstimadaEntrega = false,
  onChange,
  onSubmit,
  onClose,
}) => {

  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const handleSubmitClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      await onSubmit?.(event);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {editingId ? "Editar programación" : "Registrar nueva programación"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {editingId
              ? "Modifica la información del despacho seleccionado."
              : "Diligencia los campos para crear una nueva programación."}
          </Typography>
        </Box>

        <IconButton onClick={onClose} disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              type="date"
              label="Fecha programación"
              name="fecha"
              value={form.fecha}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              sx={{
                ...INPUT_SX_COMPACT,
                "& .MuiInputBase-root.Mui-disabled": {
                  backgroundColor: "rgba(244, 67, 54, 0.06)",
                },
              }}
              type="date"
              label="Fecha estimada entrega"
              name="fechaEstimadaEntrega"
              value={form.fechaEstimadaEntrega || ""}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              disabled={!canEditFechaEstimadaEntrega || submitting}
              helperText={
                !canEditFechaEstimadaEntrega
                  ? "Solo comercial o developer pueden editar este campo"
                  : ""
              }
              FormHelperTextProps={{
                sx: {
                  fontSize: "0.68rem",
                  color: "error.main",
                  mx: 0,
                  mt: 0.4,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              type="time"
              label="Hora"
              name="horaProgramada"
              value={form.horaProgramada}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Placa"
              name="placa"
              value={form.placa}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.placas.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Trailer"
              name="trailer"
              value={form.trailer}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.trailers.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Conductor"
              name="conductor"
              value={form.conductor}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.conductores.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Transportadora"
              name="transportadora"
              value={form.transportadora}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.transportadoras.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Cliente"
              name="cliente"
              value={form.cliente}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.clientes.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Destino"
              name="destino"
              value={form.destino}
              onChange={onChange}
              placeholder="Ej: ITAGUI"
              disabled={submitting}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Producto"
              name="producto"
              value={form.producto}
              onChange={onChange}
              disabled={catalogLoading || submitting}
            >
              <MenuItem value="">(Selecciona)</MenuItem>
              {catalog.productos.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              sx={INPUT_SX_COMPACT}
              label="Cantidad"
              name="cantidad"
              value={form.cantidad}
              onChange={onChange}
              placeholder="Ej: 40000"
              type="number"
              inputProps={{ inputMode: "numeric", min: 0 }}
              disabled={submitting}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={submitting}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="contained"
          color={editingId ? "warning" : "primary"}
          startIcon={editingId ? <SaveIcon /> : <AddIcon />}
          onClick={handleSubmitClick}
          disabled={submitting}
        >
          {submitting
            ? editingId
              ? "Actualizando..."
              : "Registrando..."
            : editingId
              ? "Actualizar"
              : "Registrar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProgramacionDespachoModal;