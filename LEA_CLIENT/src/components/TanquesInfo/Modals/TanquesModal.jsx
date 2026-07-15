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
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
};

const TanquesModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    NombreTanque: "",
    Disposicion: "",
    Factor: "",
    VolumenTotal: "",
    GradoAlcoholico: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        NombreTanque: initialData.NombreTanque || "",
        Disposicion: initialData.Disposicion || "",
        Factor: initialData.Factor || "",
        VolumenTotal: initialData.VolumenTotal || "",
        GradoAlcoholico:
          initialData.GradoAlcoholico !== null &&
          initialData.GradoAlcoholico !== undefined
            ? String(initialData.GradoAlcoholico).replace(".", ",")
            : "",
        _id: initialData._id || "",
      });
    } else {
      setFormData({
        NombreTanque: "",
        Disposicion: "",
        Factor: "",
        VolumenTotal: "",
        GradoAlcoholico: "",
        _id: "",
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGradoAlcoholicoChange = (e) => {
    const value = e.target.value;

    /*
     * Permite:
     * 96
     * 96,2
     * 96.2
     */
    if (/^\d*[.,]?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        GradoAlcoholico: value,
      }));
    }
  };

  const handleSave = () => {
    const {
      NombreTanque,
      Disposicion,
      Factor,
      VolumenTotal,
      GradoAlcoholico,
    } = formData;

    if (
      !NombreTanque ||
      !Disposicion ||
      !Factor ||
      !VolumenTotal ||
      GradoAlcoholico === ""
    ) {
      Swal.fire(
        "Campos incompletos",
        "Todos los campos son obligatorios",
        "warning"
      );

      return;
    }

    const gradoNormalizado = Number(
      String(GradoAlcoholico)
        .trim()
        .replace(",", ".")
    );

    if (
      !Number.isFinite(gradoNormalizado) ||
      gradoNormalizado < 0 ||
      gradoNormalizado > 100
    ) {
      Swal.fire(
        "Grado alcohólico inválido",
        "Ingrese un porcentaje válido entre 0 y 100. Ejemplo: 96,2",
        "warning"
      );

      return;
    }

    onSubmit({
      ...formData,
      GradoAlcoholico: gradoNormalizado,
    });
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
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          mt={1}
        >
          <TextField
            label="Nombre del Tanque"
            name="NombreTanque"
            value={formData.NombreTanque}
            onChange={handleChange}
            placeholder="Ingrese nombre sin prefijos ni espacios ej: 300A ⛔ NO tk300A"
            fullWidth
          />

          <TextField
            label="Disposición"
            name="Disposicion"
            value={formData.Disposicion}
            onChange={handleChange}
            placeholder="Describa el uso del tanque. Ej: Materia Prima"
            fullWidth
          />

          <TextField
            label="Factor"
            name="Factor"
            value={formData.Factor}
            onChange={handleChange}
            placeholder="Factor en L/m"
            fullWidth
          />

          <TextField
            label="Volumen Total (L)"
            name="VolumenTotal"
            value={formData.VolumenTotal}
            onChange={handleChange}
            placeholder="Volumen en litros"
            fullWidth
          />

          <TextField
            label="Grado Alcohólico (% v/v)"
            name="GradoAlcoholico"
            value={formData.GradoAlcoholico}
            onChange={handleGradoAlcoholicoChange}
            placeholder="Ejemplo: 96,2"
            helperText="Puede utilizar coma o punto decimal"
            inputProps={{
              inputMode: "decimal",
            }}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TanquesModal;
