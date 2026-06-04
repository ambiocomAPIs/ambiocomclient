import React, { useMemo } from "react";
import {
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

function calculateRice(item) {
  const alcance = Number(item.alcance) || 0;
  const impacto = Number(item.impacto) || 0;
  const confianza = Number(item.confianza) || 0;
  const esfuerzo = Number(item.esfuerzo) || 1;

  return ((alcance * impacto * confianza) / esfuerzo).toFixed(2);
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#ffffff",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 650,
  },
  "& .MuiFormHelperText-root": {
    mx: 0,
    fontWeight: 600,
  },
};

const compactCenteredFieldSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-input": {
    textAlign: "center",
    fontWeight: 800,
  },
  "& .MuiSelect-select": {
    textAlign: "center",
    fontWeight: 800,
  },
};

export default function RiceItemModal({
  open,
  modalMode,
  form,
  onClose,
  onSubmit,
  onChange,
  carriles,
  tiposActividad,
  areasSolicitantes,
  estados,
  sprints,
  alcanceOptions,
  impactoOptions,
  confianzaOptions,
  esfuerzoOptions,
}) {
  const isViewMode = modalMode === "view";
  const riceScore = useMemo(() => calculateRice(form), [form]);

  const modalTitle =
    modalMode === "create"
      ? "Crear ítem"
      : modalMode === "edit"
      ? "Editar ítem"
      : "Consultar ítem";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 880,
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#ffffff",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2.2, md: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#ffffff",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {modalTitle}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              mt: 0.3,
            }}
          >
            Registro y seguimiento de ítems priorizados mediante metodología
            RICE.
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.12)",
            borderRadius: 2,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2.2, md: 3 },
          py: 2.5,
          bgcolor: "#f8f9fb",
        }}
      >
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.8, md: 2 },
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Stack spacing={1.8}>
              <TextField
                fullWidth
                required
                label="Nombre del ítem"
                value={form.titulo}
                disabled={isViewMode}
                onChange={(e) => onChange("titulo", e.target.value)}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Descripción"
                value={form.descripcion}
                disabled={isViewMode}
                onChange={(e) => onChange("descripcion", e.target.value)}
                sx={fieldSx}
              />

              <Grid container spacing={1.0} style={{marginLeft:-5}}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de actividad"
                    value={form.tipoActividad}
                    disabled={isViewMode}
                    onChange={(e) => onChange("tipoActividad", e.target.value)}
                    sx={fieldSx}
                  >
                    {tiposActividad.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Carril"
                    value={form.carril}
                    disabled={isViewMode}
                    onChange={(e) => onChange("carril", e.target.value)}
                    sx={fieldSx}
                  >
                    {carriles.map((carril) => (
                      <MenuItem key={carril} value={carril}>
                        {carril}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Grid container spacing={1.0} style={{marginLeft:-5}}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Área solicitante"
                    value={form.areaSolicitante}
                    disabled={isViewMode}
                    onChange={(e) =>
                      onChange("areaSolicitante", e.target.value)
                    }
                    sx={fieldSx}
                  >
                    {areasSolicitantes.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Solicitado por"
                    value={form.solicitadoPor}
                    disabled={isViewMode}
                    onChange={(e) => onChange("solicitadoPor", e.target.value)}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.8, md: 2 },
              borderRadius: 3,
              bgcolor: "#f4f2ea",
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
              sx={{ mb: 1.6 }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 900,
                    color: "text.secondary",
                    letterSpacing: 0.8,
                  }}
                >
                  VALORES RICE
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  Alcance × Impacto × Confianza / Esfuerzo
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2.5,
                  bgcolor: "#ffffff",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.10)",
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 800,
                    letterSpacing: 0.4,
                  }}
                >
                  PUNTAJE RICE
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 950,
                    lineHeight: 1.1,
                    color: "#0f5fa8",
                  }}
                >
                  {riceScore}
                </Typography>
              </Paper>
            </Stack>

            <Grid container spacing={1.6} alignItems="flex-start">
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="R — Alcance"
                  value={form.alcance}
                  disabled={isViewMode}
                  onChange={(e) => onChange("alcance", e.target.value)}
                  helperText="Áreas impactadas"
                  sx={compactCenteredFieldSx}
                >
                  {alcanceOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="I — Impacto"
                  value={form.impacto}
                  disabled={isViewMode}
                  onChange={(e) => onChange("impacto", e.target.value)}
                  helperText="0.25 mín - 3 crítico"
                  sx={compactCenteredFieldSx}
                >
                  {impactoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="C — Confianza"
                  value={form.confianza}
                  disabled={isViewMode}
                  onChange={(e) => onChange("confianza", e.target.value)}
                  helperText="Certeza del impacto"
                  sx={compactCenteredFieldSx}
                >
                  {confianzaOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="E — Esfuerzo"
                  value={form.esfuerzo}
                  disabled={isViewMode}
                  onChange={(e) => onChange("esfuerzo", e.target.value)}
                  helperText="Semanas-persona"
                  sx={compactCenteredFieldSx}
                >
                  {esfuerzoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.8, md: 2 },
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Stack spacing={1.8}>
              <Grid container spacing={1.0} style={{marginLeft:-5}}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Estado"
                    value={form.estado}
                    disabled={isViewMode}
                    onChange={(e) => onChange("estado", e.target.value)}
                    sx={fieldSx}
                  >
                    {estados.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Sprint asignado"
                    value={form.sprint}
                    disabled={isViewMode}
                    onChange={(e) => onChange("sprint", e.target.value)}
                    sx={fieldSx}
                  >
                    <MenuItem value="">Sin sprint asignado</MenuItem>

                    {sprints
                      .filter((sprint) => sprint)
                      .map((sprint) => (
                        <MenuItem key={sprint} value={sprint}>
                          {sprint}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider />

              <Box
                sx={{
                  px: 1.2,
                  py: 0.7,
                  borderRadius: 2,
                  bgcolor: "#f8f9fb",
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <FormControlLabel
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-label": {
                      fontWeight: 750,
                      color: "text.primary",
                    },
                  }}
                  control={
                    <Checkbox
                      checked={form.vetoGerencia}
                      disabled={isViewMode}
                      onChange={(e) =>
                        onChange("vetoGerencia", e.target.checked)
                      }
                    />
                  }
                  label="Veto Gerencia General"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notas de seguimiento"
                placeholder="Decisiones, bloqueos, actualizaciones..."
                value={form.notasSeguimiento}
                disabled={isViewMode}
                onChange={(e) => onChange("notasSeguimiento", e.target.value)}
                sx={fieldSx}
              />
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.2, md: 3 },
          py: 2,
          borderTop: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          bgcolor: "#ffffff",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: "none",
            minWidth: 120,
          }}
        >
          {isViewMode ? "Cerrar" : "Cancelar"}
        </Button>

        {!isViewMode && (
          <Button
            variant="contained"
            startIcon={modalMode === "edit" ? <SaveIcon /> : <AddIcon />}
            onClick={onSubmit}
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              textTransform: "none",
              minWidth: 160,
              background: "linear-gradient(180deg, #4f8fd6 0%, #0f5fa8 100%)",
              boxShadow: "0 8px 18px rgba(15, 95, 168, 0.22)",
            }}
          >
            {modalMode === "edit" ? "Guardar cambios" : "Crear ítem"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}