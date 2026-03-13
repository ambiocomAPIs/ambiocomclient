import React, { useRef } from "react";
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
  Stack,
  Tooltip
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhotoIcon from '@mui/icons-material/Photo';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const exportRef = useRef(null);

  const getCanvas = async () => {
    if (!exportRef.current) return null;

    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#ffffff",
      scale: 4, // alta resolución
      useCORS: true,
      logging: false,
    });

    return canvas;
  };

  const handleExportPNG = async () => {
    try {
      const canvas = await getCanvas();
      if (!canvas) return;

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `resumen-kpis-radar-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error("Error exportando PNG:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const canvas = await getCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20; // márgenes
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (finalHeight > pageHeight - 20) {
        finalHeight = pageHeight - 20;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }

      const x = (pageWidth - finalWidth) / 2;
      const y = 10;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save(`resumen-kpis-radar-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error exportando PDF:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Resumen ejecutivo de KPIs · Grafica de indicadores tipo Radar
      </DialogTitle>

      <DialogContent dividers>
        <Box
          ref={exportRef}
          sx={{
            backgroundColor: "#fff",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Visualización consolidada de cumplimiento y desempeño general en los Despachos.
          </Typography>

          <Box sx={{ width: "100%", height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
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
                label={`% Cump. Volumen: ${formatPct(resumen?.pctCumplCant)}`}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Chip
                label={`% Cump. Despachos: ${formatPct(resumen?.pctCumplViaje)}`}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Chip
                label={`% Vehículos aceptados: ${formatPct(resumen?.pctVehiculos)}`}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Chip
                label={`Viajes prog.: ${resumen?.viajesProgramados ?? 0}`}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Chip
                label={`Viajes real.: ${resumen?.viajesRealizados ?? 0}`}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Chip
                label={`Registros analizados: ${resumen?.filas ?? 0}`}
                sx={{ width: "100%" }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip placement="top" title="Exportar Gráfico a  PNG">
            <Button onClick={handleExportPNG} variant="outlined">
              <PhotoIcon />
            </Button>
          </Tooltip>
          <Tooltip placement="top" title="Exportar Gráfico a PDF">
            <Button onClick={handleExportPDF} variant="outlined">
              <PictureAsPdfIcon sx={{ color: "#FF522E" }} />
            </Button>
          </Tooltip>

        </Stack>

        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumenKpiRadarModal;