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
import Autocomplete from "@mui/material/Autocomplete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

import { CIUDADES_COLOMBIA, getCiudadDestinoValue } from "../../utils_Logistica/Catalogo/ciudadesColombia";

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

const normalizarBusquedaCiudad = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");

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
              type="datetime-local"
              label="Fecha estimada entrega"
              name="fechaEstimadaEntrega"
              value={
                !form.fechaEstimadaEntrega ||
                  String(form.fechaEstimadaEntrega).toUpperCase() === "NA"
                  ? ""
                  : String(form.fechaEstimadaEntrega).includes(" ")
                    ? String(form.fechaEstimadaEntrega).replace(" ", "T")
                    : `${String(form.fechaEstimadaEntrega).slice(0, 10)}T00:00`
              }
              onChange={(e) => {
                onChange({
                  target: {
                    name: "fechaEstimadaEntrega",
                    value: e.target.value.replace("T", " "),
                  },
                });
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
              disabled={!canEditFechaEstimadaEntrega || submitting}
              helperText={
                !canEditFechaEstimadaEntrega
                  ? "Solo comercial, torre de control o lider logistica pueden editar este campo"
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
            <Autocomplete
              options={catalog.destinos ?? []}
              value={
                (catalog.destinos ?? []).includes(form.destino)
                  ? form.destino
                  : null
              }
              disabled={submitting}
              autoHighlight
              forcePopupIcon
              selectOnFocus
              clearOnEscape
              getOptionLabel={(option) => option ?? ""}
              isOptionEqualToValue={(option, value) =>
                option === value
              }
              filterOptions={(options, state) => {
                const busqueda = normalizarBusquedaCiudad(
                  state.inputValue
                );

                return options
                  .filter((ciudad) =>
                    normalizarBusquedaCiudad(ciudad).includes(
                      busqueda
                    )
                  )
                  .slice(0, 100);
              }}
              onChange={(event, newValue) => {
                onChange({
                  target: {
                    name: "destino",
                    value: newValue ?? "",
                  },
                });
              }}
              noOptionsText="No se encontraron ciudades"
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  size="small"
                  sx={INPUT_SX_COMPACT}
                  label="Destino"
                  placeholder="Buscar ciudad"
                />
              )}
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