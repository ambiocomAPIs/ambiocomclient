import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AssignmentTurnedIn,
  CalendarMonth,
  Close,
  Science,
  WaterDrop,
  FilterAlt,
} from "@mui/icons-material";

const SectionCard = ({ icon, title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography fontWeight={800} lineHeight={1.1}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {children}
    </Paper>
  );
};

export default function RegistroModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  estadoOptions,
  siNoOptions,
}) {
  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const normalizarNumeroDecimal = (valor) => {
    const valorConPunto = String(valor).replace(/,/g, ".");
    const soloNumerosYPuntos = valorConPunto.replace(/[^0-9.]/g, "");
    const partes = soloNumerosYPuntos.split(".");

    if (partes.length <= 1) return soloNumerosYPuntos;

    return `${partes[0]}.${partes.slice(1).join("")}`;
  };

  const handleNumericChange = (campo, valor) => {
    handleChange(campo, normalizarNumeroDecimal(valor));
  };

  const formInvalido = !form.fecha || !form.responsable;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
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
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Box sx={{ px: 3, py: 1.8 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.18)",
                }}
              >
                <AssignmentTurnedIn />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Nuevo registro de regeneración
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Tren carbón activado, catiónico y aniónico · Control operativo
                </Typography>
              </Box>
            </Stack>

            <Button
              onClick={onClose}
              startIcon={<Close />}
              sx={{
                color: "inherit",
                borderColor: "rgba(255,255,255,0.35)",
                display: { xs: "none", sm: "inline-flex" },
              }}
              variant="outlined"
              size="small"
            >
              Cerrar
            </Button>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 2, md: 3 },
          bgcolor: "grey.50",
        }}
      >
        <Stack spacing={0.8}>
          <SectionCard
            icon={<CalendarMonth fontSize="small" />}
            title="Información general"
            subtitle="Datos base del registro"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="date"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={form.fecha}
                  onChange={(e) => handleChange("fecha", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Responsable</InputLabel>
                  <Select
                    value={form.responsable}
                    label="Responsable"
                    onChange={(e) => handleChange("responsable", e.target.value)}
                  >
                    <MenuItem value="liber antonio">Liber Antonio</MenuItem>
                    <MenuItem value="jose morales">José Morales</MenuItem>
                    <MenuItem value="robinson jaramillo">Robinson Jaramillo</MenuItem>
                    <MenuItem value="nuevo operario">Nuevo operario</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </SectionCard>

          <Grid container spacing={0.8}>
            <Grid item xs={12} md={4}>
              <SectionCard
                icon={<FilterAlt fontSize="small" />}
                title="Tren carbón activado"
                subtitle="Control de calidad de carbón activado"
              >
                <Stack spacing={1.3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="pH carbón"
                    placeholder="Ej: 7.2"
                    value={form.phCarbon || ""}
                    onChange={(e) => handleNumericChange("phCarbon", e.target.value)}
                    inputProps={{ inputMode: "decimal" }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Conductividad carbón"
                    placeholder="Ej: 12"
                    value={form.conductividadCarbon || ""}
                    onChange={(e) =>
                      handleNumericChange("conductividadCarbon", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">µS/cm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Dureza carbón"
                    placeholder="Ej: 0"
                    value={form.durezaCarbon || ""}
                    onChange={(e) =>
                      handleNumericChange("durezaCarbon", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Sílice carbón"
                    placeholder="Ej: 0.5"
                    value={form.siliceCarbon || ""}
                    onChange={(e) =>
                      handleNumericChange("siliceCarbon", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="TDS carbón"
                    placeholder="Ej: 15"
                    value={form.tdsCarbon || ""}
                    onChange={(e) =>
                      handleNumericChange("tdsCarbon", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Alcalinidad carbón"
                    placeholder="Ej: 20"
                    value={form.alcalinidadCarbon || ""}
                    onChange={(e) =>
                      handleNumericChange("alcalinidadCarbon", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <SectionCard
                icon={<Science fontSize="small" />}
                title="Parámetros catión"
                subtitle="Control químico del tren catiónico"
              >
                <Stack spacing={1.3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="pH catión"
                    placeholder="Ej: 2.5"
                    value={form.phCation}
                    onChange={(e) => handleNumericChange("phCation", e.target.value)}
                    inputProps={{ inputMode: "decimal" }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Dureza catión"
                    placeholder="Ej: 0"
                    value={form.durezaCation}
                    onChange={(e) =>
                      handleNumericChange("durezaCation", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Ácido sulfúrico"
                    placeholder="Ej: 45"
                    value={form.acidoSulfurico}
                    onChange={(e) =>
                      handleNumericChange("acidoSulfurico", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">Kg</InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <SectionCard
                icon={<WaterDrop fontSize="small" />}
                title="Parámetros anión"
                subtitle="Control químico del tren aniónico"
              >
                <Stack spacing={1.3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="pH anión"
                    placeholder="Ej: 10.8"
                    value={form.phAnion}
                    onChange={(e) => handleNumericChange("phAnion", e.target.value)}
                    inputProps={{ inputMode: "decimal" }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Conductividad"
                    placeholder="Ej: 12"
                    value={form.conductividad}
                    onChange={(e) =>
                      handleNumericChange("conductividad", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">µS/cm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Sílice anión"
                    placeholder="Ej: 0.5"
                    value={form.siliceAnion || ""}
                    onChange={(e) =>
                      handleNumericChange("siliceAnion", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="TDS anión"
                    placeholder="Ej: 15"
                    value={form.tdsAnion || ""}
                    onChange={(e) => handleNumericChange("tdsAnion", e.target.value)}
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Alcalinidad anión"
                    placeholder="Ej: 20"
                    value={form.alcalinidadAnion || ""}
                    onChange={(e) =>
                      handleNumericChange("alcalinidadAnion", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ppm</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Consumo de soda"
                    placeholder="Ej: 38"
                    value={form.consumoSoda}
                    onChange={(e) =>
                      handleNumericChange("consumoSoda", e.target.value)
                    }
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">Kg</InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard
            icon={<AssignmentTurnedIn fontSize="small" />}
            title="Seguimiento y cierre"
            subtitle="Estado de operación, reporte y notificación"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Catión</InputLabel>
                  <Select
                    value={form.estadoCation}
                    label="Catión"
                    onChange={(e) => handleChange("estadoCation", e.target.value)}
                  >
                    {estadoOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Anión</InputLabel>
                  <Select
                    value={form.estadoAnion}
                    label="Anión"
                    onChange={(e) => handleChange("estadoAnion", e.target.value)}
                  >
                    {estadoOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Reporte CICOQ</InputLabel>
                  <Select
                    value={form.reporteCicoq}
                    label="Reporte CICOQ"
                    onChange={(e) => handleChange("reporteCicoq", e.target.value)}
                  >
                    {siNoOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Correo notificado</InputLabel>
                  <Select
                    value={form.correoNotificado}
                    label="Correo notificado"
                    onChange={(e) =>
                      handleChange("correoNotificado", e.target.value)
                    }
                  >
                    {siNoOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  label="Observaciones"
                  placeholder="Describe novedades, condiciones especiales o pendientes..."
                  value={form.observaciones}
                  onChange={(e) => handleChange("observaciones", e.target.value)}
                />
              </Grid>
            </Grid>
          </SectionCard>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          sx={{ width: "100%" }}
        >
          <Typography variant="caption" color="text.secondary">
            Los campos marcados con * son obligatorios.
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose} variant="text">
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave} disabled={formInvalido}>
              Guardar registro
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}