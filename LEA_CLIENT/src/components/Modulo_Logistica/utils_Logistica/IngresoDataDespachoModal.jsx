import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

const columnasBloqueadas = [
  "volumen_contador_gravimetrico",
  "volumen_ambiocom_contador",
  "diferencia_recibo_cliente",
  "dif_v_netodif_v_desp_bascula_ambiocom",
  "dif_kilos_neto","peso_neto_contador_ambiocom","variacion_peso",
  "variación_volumen", "tiempo_neto_cargue_despacho", "cantidad_recibida_cliente",
  "kilos_peso_neto", "diferencia_recibo_cliente_vnetofacturado"
];

const IngresoDataDespachoModal = ({
  open,
  onClose,
  onSave,
  columnas = [],
  form,
  setForm,
  isEdit = false,
}) => {
  const handleChangeLectura = (key, value) => {
    setForm((prev) => ({
      ...prev,
      lecturas: {
        ...prev.lecturas,
        [key]: value,
      },
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          width: "80%",
          maxWidth: "none",
          margin: "auto",
        },
      }}
    >
      <DialogTitle>
        {isEdit ? "Editar Recepción" : "Nueva Recepción"}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={1} mt={1}>
          {/* 🔹 Campos dinámicos */}
          {columnas.map((c) => {
            const isDisabled = columnasBloqueadas.includes(c.key);
            return (
              <Grid item xs={12} md={2} key={c.key}>
                <TextField
                  fullWidth
                  label={`${c.nombre}${c.unidad ? ` (${c.unidad})` : ""}`}
                  type="text"
                  value={form.lecturas?.[c.key] ?? ""}
                  onChange={(e) => handleChangeLectura(c.key, e.target.value)}
                  disabled={isDisabled}
                  sx={{
                    backgroundColor: isDisabled ? "#f5f5f5" : "inherit",
                  }}
                />
              </Grid>
            );
          })}

          {/* 🔹 Campos fijos */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              value={form.observaciones || ""}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Responsable"
              value={form.responsable || ""}
              onChange={(e) =>
                setForm({ ...form, responsable: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              InputLabelProps={{ shrink: true }}
              value={form.fecha || ""}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSave}>
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngresoDataDespachoModal;
