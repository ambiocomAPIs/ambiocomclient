import { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Button,
  Box
} from "@mui/material";
import axios from "axios";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function HeaderForm({ data, onChange, clearFieldsExceptFechaTurno }) {

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState(false);

  const turnos = [
    { value: "TurnoMañana(6am-2pm)", label: "Turno Mañana (6 am - 2 pm)" },
    { value: "TurnoTarde(2pm-10pm)", label: "Turno Tarde (2 pm - 10 pm)" },
    { value: "TurnoNoche(10pm-6am)", label: "Turno Noche (10 pm - 6 am)" },
    { value: "Turno12Horas(6am-6pm)", label: "Turno 12Horas (6 am - 6 pm)" },
    { value: "Turno12Horas(6pm-6am)", label: "Turno 12Horas (6 pm - 6 am)" },
  ];

  const fields = [
    { label: "Fecha", key: "fecha", type: "date" },
    { label: "Turno", key: "turno", type: "select" },
    { label: "Supervisor", key: "supervisor" },
    { label: "Op. Destilería", key: "op_destileria" },
    { label: "Op. Caldera", key: "op_caldera" },
    { label: "Op. Aguas", key: "op_aguas" },
    { label: "Aux. Caldera", key: "aux_caldera" },
    { label: "Analista 1", key: "analista1" },
    { label: "Analista 2", key: "analista2", optional: true },
  ];

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!data.fecha || !data.turno) return;
  
      setIsLoading(true);
  
      try {
        const response = await axios.get("
https://ambiocomserver.onrender.com/api/bitacora/getbyfechayturno", {
          params: {
            fecha: data.fecha,
            turno: data.turno,
          },
        });
  
        if (response.data && response.data.length > 0) {
          const existing = response.data[0];
          Object.keys(existing).forEach((key) => {
            if (key in data && existing[key] !== data[key]) {
              onChange(key, existing[key]);
            }
          });
  
          setExistingRecord(true);
          setSnackbarMessage("Datos existentes cargados");
          setSnackbarSeverity("info");
          setSnackbarOpen(true);
        } else {
          setExistingRecord(false);
          clearFieldsExceptFechaTurno();
          setSnackbarMessage("No hay datos registrados para esta fecha y turno.");
          setSnackbarSeverity("info");
          setSnackbarOpen(true);
        }
      } catch (err) {
        setExistingRecord(false);
        clearFieldsExceptFechaTurno();
        setSnackbarMessage("No hay datos registrados para esta fecha y turno.");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
        console.error("Error al cargar datos existentes:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchExistingData();
  }, [data.fecha, data.turno]);

  // Nueva función para formatear fecha en local (sin zona horaria)
  const formatDateToLocalISO = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!data.fecha || !data.turno) {
      setSnackbarMessage("Fecha y Turno son obligatorios para guardar.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post("
https://ambiocomserver.onrender.com/api/bitacora/bitacorareplaceall", [data]);
      if (response.status === 200) {
        setSnackbarMessage("Datos guardados correctamente");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setExistingRecord(true);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage("Error al guardar los datos");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const isFormValid = fields
    .filter(field => !field.optional)
    .every(field => data[field.key] && data[field.key].toString().trim() !== "");

  return (
    <>
      <Grid container spacing={2} sx={{ marginBottom: 2, marginTop: 2 }}>
        {fields.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field.key}>
            {field.type === "select" ? (
              <FormControl fullWidth>
                <InputLabel>Turno</InputLabel>
                <Select
                  value={data[field.key] || ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  label="Turno"
                >
                  {turnos.map((turno) => (
                    <MenuItem key={turno.value} value={turno.value}>
                      {turno.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : field.type === "date" ? (
              // Aquí uso DatePicker en lugar de TextField para la fecha
             <LocalizationProvider dateAdapter={AdapterDateFns}>
             <DatePicker
               label={field.label}
               // Construimos la fecha con hora 00:00 para evitar desfase UTC
               value={
                data[field.key] ? 
                new Date(data[field.key] + "T00:00:00") 
                : 
                new Date()
                // null
              }
               onChange={(newValue) => {
               // Formateamos fecha en local a "YYYY-MM-DD"
               const isoDate = newValue ? formatDateToLocalISO(newValue) : "";
               onChange(field.key, isoDate);
               }}
                renderInput={(params) => <TextField sx={{ width: '100%', display: 'block' }} {...params} fullWidth  />}
              />
              </LocalizationProvider>
            ) : (
              <TextField
                fullWidth
                label={field.label}
                type={field.type || "text"}
                value={data[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
       <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={!isFormValid || isLoading}
        >
         {existingRecord ? "Actualizar información" : "Guardar"}
       </Button>
       </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default HeaderForm;
