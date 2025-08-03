import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Paper,
} from "@mui/material";
import Draggable from "react-draggable";
import Swal from "sweetalert2";

// Componente que permite el arrastre del modal
const PaperComponent = (props) => {
  return (
    <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
};

const TanquesModal = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    NombreTanque: "",
    Disposicion: "",
    Factor: "",
    VolumenTotal: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        NombreTanque: initialData.NombreTanque || "",
        Disposicion: initialData.Disposicion || "",
        Factor: initialData.Factor || "",
        VolumenTotal: initialData.VolumenTotal || "",
      });
    } else {
      setFormData({
        NombreTanque: "",
        Disposicion: "",
        Factor: "",
        VolumenTotal: "",
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const { NombreTanque, Disposicion, Factor, VolumenTotal } = formData;

    if (!NombreTanque || !Disposicion || !Factor || !VolumenTotal) {
      Swal.fire("Campos incompletos", "Todos los campos son obligatorios", "warning");
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperComponent}
    >
      <DialogTitle
        style={{
          cursor: "move",
          textAlign: "center",
          fontWeight: "bold",
          color: "#1976d2",
          fontSize: "1.5rem",
        }}
        id="draggable-dialog-title"
      >
        {initialData ? "Editar Tanque" : "Nuevo Tanque"}
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nombre del Tanque"
            name="NombreTanque"
            value={formData.NombreTanque}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Disposición"
            name="Disposicion"
            value={formData.Disposicion}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Factor"
            name="Factor"
            value={formData.Factor}
            onChange={handleChange}
            type="number"
            fullWidth
          />
          <TextField
            label="Volumen Total (L)"
            name="VolumenTotal"
            value={formData.VolumenTotal}
            onChange={handleChange}
            type="number"
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TanquesModal;
