import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
} from "@mui/material";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

const formatPct = (n) => `${Number(n ?? 0).toFixed(1)}%`;

const CustomRadarTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 3,
        minWidth: 180,
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2">
        <strong>Valor:</strong> {formatPct(row?.value)}
      </Typography>
      {row?.meta && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {row.meta}
        </Typography>
      )}
    </Box>
  );
};

const ResumenKpiRadarModal = ({
  open,
  onClose,
  radarData = [],
  resumen = {},
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Resumen ejecutivo de KPIs · Radar
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Visualización consolidada de cumplimiento y desempeño general en los Despachos.
        </Typography>

        <Box sx={{ width: "100%", height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              outerRadius="72%"
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} tickCount={6} />
              <RTooltip content={<CustomRadarTooltip />} />
              <Legend />
              <Radar
                name="Resumen KPI"
                dataKey="value"
                stroke="#3f51f5"
                fill="#3f51f5"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`% Cump. Volumen: ${formatPct(resumen?.pctCumplCant)}`}
              sx={{ width: "100%" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`% Cump. Despachos: ${formatPct(resumen?.pctCumplViaje)}`}
              sx={{ width: "100%" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`% Vehículos aceptados: ${formatPct(resumen?.pctVehiculos)}`}
              sx={{ width: "100%" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`Viajes prog.: ${resumen?.viajesProgramados ?? 0}`}
              sx={{ width: "100%" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`Viajes real.: ${resumen?.viajesRealizados ?? 0}`}
              sx={{ width: "100%" }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Chip
              fullWidth
              label={`Registros analizados: ${resumen?.filas ?? 0}`}
              sx={{ width: "100%" }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumenKpiRadarModal;