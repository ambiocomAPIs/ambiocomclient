import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  InputAdornment,
  Autocomplete,
} from "@mui/material";

import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import NotesIcon from "@mui/icons-material/Notes";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const isoToDDMMYYYY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

const generarHoras = (intervalo = 5) => {
  const horas = [];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += intervalo) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      horas.push(`${hh}:${mm}`);
    }
  }

  return horas;
};

const opcionesHora = generarHoras(5);

const responsables = [
  "Jose Morales",
  "Liber Antonio",
  "Robinson Jaramillo",
  "Nuevo Operario",
];

export default function ModalMedicionAgua({
  open,
  openEditar,
  form,
  setForm,
  columnas,
  onClose,
  onGuardar,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          background: "linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)",
          color: "#FFFFFF",
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {openEditar ? "Editar medición" : "Nueva medición"}
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Registra la información diaria de los contadores de agua.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          backgroundColor: "#F8FAFC",
          px: 3,
          py: 2.2,
        }}
      >
        <Box
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: 3,
            p: 2,
            border: "1px solid #E0E0E0",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1.5,
              fontWeight: 800,
              color: "#1A237E",
            }}
          >
            Información general
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                type="date"
                label="Fecha"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setForm({ ...form, fecha: isoToDDMMYYYY(e.target.value) })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={opcionesHora}
                value={form.hora || null}
                freeSolo
                onChange={(e, newValue) =>
                  setForm({ ...form, hora: newValue || "" })
                }
                onInputChange={(e, newInputValue) =>
                  setForm({ ...form, hora: newInputValue || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Hora"
                    size="small"
                    fullWidth
                    placeholder="Ej: 08:00"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <AccessTimeIcon fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={responsables}
                value={form.operador || null}
                freeSolo
                onChange={(e, newValue) =>
                  setForm({ ...form, operador: newValue || "" })
                }
                onInputChange={(e, newInputValue) =>
                  setForm({ ...form, operador: newInputValue || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Responsable"
                    size="small"
                    fullWidth
                    placeholder="Seleccione o escriba"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.observaciones}
                onChange={(e) =>
                  setForm({ ...form, observaciones: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotesIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: 3,
            p: 2,
            border: "1px solid #E0E0E0",
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.2}>
            <WaterDropIcon sx={{ color: "#0288D1" }} />

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "#1A237E",
              }}
            >
              Lecturas de medidores
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {columnas.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.key}>
                <TextField
                  label={c.nombre}
                  type="number"
                  fullWidth
                  size="small"
                  value={form.lecturas[c.key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lecturas: {
                        ...form.lecturas,
                        [c.key]: Number(e.target.value),
                      },
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {c.unidad}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 1.7,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E0E0E0",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onGuardar}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 800,
            px: 3,
            backgroundColor: "#1A237E",
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}