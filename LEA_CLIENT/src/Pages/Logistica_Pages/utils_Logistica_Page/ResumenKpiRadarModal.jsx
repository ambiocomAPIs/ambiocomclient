import React, { useMemo, useRef } from "react";
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
  Tooltip,
  Paper,
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

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhotoIcon from "@mui/icons-material/Photo";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DonutSmallIcon from "@mui/icons-material/DonutSmall";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const formatPct = (n) => `${Number(n ?? 0).toFixed(1)}%`;

const ESTADOS_ORDEN_RADAR = [
  "Cumple",
  "Aprobado En Cliente",
  "Aprobado con observaciones",
  "En proceso",
  "Programado (no despachado)",
  "No programado",
  "Rechazado Ambiocom",
  "Rechazado por cliente",
  "Sin datos",
];

const ESTADO_CHIP_STYLES = {
  Cumple: {
    backgroundColor: "#D7F5E8",
    color: "#1B5E20",
    borderColor: "#36B865",
  },
  "Aprobado En Cliente": {
    backgroundColor: "#D7F5E8",
    color: "#1B5E20",
    borderColor: "#36B865",
  },
  "Aprobado con observaciones": {
    backgroundColor: "#FFF3CD",
    color: "#8A5A00",
    borderColor: "#F4B400",
  },
  "En proceso": {
    backgroundColor: "#E6D9FC",
    color: "#4A148C",
    borderColor: "#8B5CF6",
  },
  "Programado (no despachado)": {
    backgroundColor: "#E3F2FD",
    color: "#0D47A1",
    borderColor: "#2196F3",
  },
  "No programado": {
    backgroundColor: "#FFE0B2",
    color: "#E65100",
    borderColor: "#FB8C00",
  },
  "Rechazado Ambiocom": {
    backgroundColor: "#FFCDD2",
    color: "#B71C1C",
    borderColor: "#E53935",
  },
  "Rechazado por cliente": {
    backgroundColor: "#F8BBD0",
    color: "#880E4F",
    borderColor: "#D81B60",
  },
  "Sin datos": {
    backgroundColor: "#ECEFF1",
    color: "#37474F",
    borderColor: "#90A4AE",
  },
};

const getKpiFromRadar = (radarData, subject) => {
  return (radarData ?? []).find((item) => item.subject === subject);
};

const getKpiStatus = (value) => {
  const n = Number(value ?? 0);

  if (n >= 95) {
    return {
      label: "Excelente",
      softBg: "#D7F5E8",
      textColor: "#1B5E20",
      borderColor: "#36B865",
      gradient:
        "linear-gradient(135deg, rgba(54,184,101,0.16), rgba(54,184,101,0.04))",
    };
  }

  if (n >= 85) {
    return {
      label: "Aceptable",
      softBg: "#FFF3CD",
      textColor: "#8A5A00",
      borderColor: "#F4B400",
      gradient:
        "linear-gradient(135deg, rgba(244,180,0,0.18), rgba(244,180,0,0.05))",
    };
  }

  return {
    label: "Requiere atención",
    softBg: "#FFCDD2",
    textColor: "#B71C1C",
    borderColor: "#E53935",
    gradient:
      "linear-gradient(135deg, rgba(229,57,53,0.16), rgba(229,57,53,0.04))",
  };
};

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
        minWidth: 260,
        maxWidth: 340,
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
        {label}
      </Typography>

      <Typography variant="body2">
        <strong>Resultado:</strong> {formatPct(row?.value)}
      </Typography>

      {row?.meta && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {row.meta}
        </Typography>
      )}

      {label === "Client/Fact" && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            borderRadius: 1.5,
            backgroundColor: "rgba(63, 81, 245, 0.08)",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Este KPI valida si la diferencia entre el volumen recibido por el
            cliente y el volumen facturado está dentro de la tolerancia
            configurada.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Este componente reemplaza a Chip cuando se requiere exportar con html2canvas.
 * Evita que el texto desaparezca en la imagen/PDF.
 */
const ExportSafeChip = ({
  label,
  backgroundColor = "#ECEFF1",
  color = "#37474F",
  borderColor = "#90A4AE",
  fontWeight = 600,
  justifyContent = "center",
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 32,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        border: "1px solid",
        borderColor,
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent,
        boxSizing: "border-box",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: 14,
          lineHeight: 1.2,
          fontWeight,
          color,
          textAlign: justifyContent === "flex-start" ? "left" : "center",
          width: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
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

  const kpiClientFact = useMemo(
    () => getKpiFromRadar(radarData, "Client/Fact"),
    [radarData]
  );

  const kpiPesoRango = useMemo(
    () => getKpiFromRadar(radarData, "Peso en rango"),
    [radarData]
  );

  const kpiDespachosEjecutados = useMemo(
    () => getKpiFromRadar(radarData, "Despachos ejecutados"),
    [radarData]
  );

  const kpiGeneral = useMemo(() => {
    const valores = (radarData ?? [])
      .map((item) => Number(item?.value ?? 0))
      .filter((value) => Number.isFinite(value));

    if (!valores.length) return 0;

    const suma = valores.reduce((acc, value) => acc + value, 0);

    return suma / valores.length;
  }, [radarData]);

  const kpiGeneralStatus = useMemo(
    () => getKpiStatus(kpiGeneral),
    [kpiGeneral]
  );

  const getCanvas = async () => {
    if (!exportRef.current) return null;

    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#ffffff",
      scale: 4,
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
      link.download = `resumen-kpis-radar-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
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

      const imgWidth = pageWidth - 20;
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
      pdf.save(
        `resumen-kpis-radar-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error("Error exportando PDF:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Resumen ejecutivo de KPIs · Radar de indicadores
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
            Visualización consolidada de cumplimiento, tolerancias y estados
            operativos. El indicador <strong>Client/Fact</strong> evalúa la
            merma entre el volumen recibido por el cliente y el volumen
            facturado.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "rgba(63, 81, 245, 0.04)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <InfoOutlinedIcon fontSize="small" color="primary" />

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  ¿Qué está evaluando el radar?
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Cumpl. Volumen</strong> valida facturado vs
                  gravimétrico despachado. <strong>Client/Fact</strong> valida
                  volumen recibido por cliente vs volumen facturado.{" "}
                  <strong>Peso en rango</strong> valida diferencia de kilos
                  entre báscula Ambiocom y báscula cliente.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: kpiGeneralStatus.borderColor,
              background: kpiGeneralStatus.gradient,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: kpiGeneralStatus.softBg,
                    color: kpiGeneralStatus.textColor,
                    border: "1px solid",
                    borderColor: kpiGeneralStatus.borderColor,
                  }}
                >
                  <DonutSmallIcon />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    KPI general del radar
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    lineHeight={1}
                    sx={{ color: kpiGeneralStatus.textColor }}
                  >
                    {formatPct(kpiGeneral)}
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={kpiGeneralStatus.label}
                sx={{
                  fontWeight: "bold",
                  backgroundColor: kpiGeneralStatus.softBg,
                  color: kpiGeneralStatus.textColor,
                  border: "1px solid",
                  borderColor: kpiGeneralStatus.borderColor,
                }}
              />
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1.5, display: "block" }}
            >
              Promedio simple de los indicadores graficados en el radar. Cada
              KPI tiene el mismo peso dentro del resultado general.
            </Typography>
          </Paper>

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

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Indicadores principales
          </Typography>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Promedio simple de los KPIs graficados en el radar."
              >
                <Box>
                  <ExportSafeChip
                    label={`KPI General: ${formatPct(kpiGeneral)}`}
                    backgroundColor={kpiGeneralStatus.softBg}
                    color={kpiGeneralStatus.textColor}
                    borderColor={kpiGeneralStatus.borderColor}
                    fontWeight={800}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa cantidad facturada vs volumen gravimétrico despachado, según tolerancia configurada."
              >
                <Box>
                  <ExportSafeChip
                    label={`Despacho Fact/Grav.: ${formatPct(
                      resumen?.pctCumplCant
                    )}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa volumen recibido por cliente vs volumen facturado. Este es el KPI de la columna Client/Fact."
              >
                <Box>
                  <ExportSafeChip
                    label={`Client/Fact: ${formatPct(kpiClientFact?.value)}`}
                    backgroundColor="#FFFFFF"
                    color="#0D6EFD"
                    borderColor="#0D6EFD"
                    fontWeight={800}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa diferencia de peso entre báscula Ambiocom y báscula cliente."
              >
                <Box>
                  <ExportSafeChip
                    label={`Peso en rango: ${formatPct(kpiPesoRango?.value)}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa registros donde hubo programación y despacho real."
              >
                <Box>
                  <ExportSafeChip
                    label={`% Cump. Despachos: ${formatPct(
                      resumen?.pctCumplViaje
                    )}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa vehículos aceptados sobre total despachado."
              >
                <Box>
                  <ExportSafeChip
                    label={`% Vehículos aceptados: ${formatPct(
                      resumen?.pctVehiculos
                    )}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Viajes realizados sobre viajes programados."
              >
                <Box>
                  <ExportSafeChip
                    label={`Despachos ejecutados: ${formatPct(
                      kpiDespachosEjecutados?.value
                    )}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip
                placement="top"
                title="Evalúa fecha estimada de entrega vs fecha real de entrega."
              >
                <Box>
                  <ExportSafeChip
                    label={`% Fecha entrega: ${formatPct(
                      resumen?.pctFechaEntrega
                    )}`}
                    backgroundColor="#E8E8E8"
                    color="#212121"
                    borderColor="#E8E8E8"
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <ExportSafeChip
                label={`Entrega: ${resumen?.cumplidosFechaEntrega ?? 0}/${
                  resumen?.totalFechaEntrega ?? 0
                } evaluables`}
                backgroundColor="#E8E8E8"
                color="#212121"
                borderColor="#E8E8E8"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ExportSafeChip
                label={`Excluidos entrega: ${
                  resumen?.excluidosFechaEntrega ?? 0
                }`}
                backgroundColor="#E8E8E8"
                color="#212121"
                borderColor="#E8E8E8"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ExportSafeChip
                label={`Viajes prog.: ${resumen?.viajesProgramados ?? 0}`}
                backgroundColor="#E8E8E8"
                color="#212121"
                borderColor="#E8E8E8"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ExportSafeChip
                label={`Viajes real.: ${resumen?.viajesRealizados ?? 0}`}
                backgroundColor="#E8E8E8"
                color="#212121"
                borderColor="#E8E8E8"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <ExportSafeChip
                label={`Registros analizados: ${resumen?.filas ?? 0}`}
                backgroundColor="#E8E8E8"
                color="#212121"
                borderColor="#E8E8E8"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Detalle de KPIs graficados en el radar
          </Typography>

          <Grid container spacing={1}>
            {(radarData ?? []).map((item) => {
              const isClientFact = item.subject === "Client/Fact";

              return (
                <Grid item xs={12} sm={6} md={4} key={item.subject}>
                  <Tooltip placement="top" title={item.meta || ""}>
                    <Box>
                      <ExportSafeChip
                        label={`${item.subject}: ${formatPct(item.value)}`}
                        backgroundColor={isClientFact ? "#FFFFFF" : "#E8E8E8"}
                        color={isClientFact ? "#0D6EFD" : "#212121"}
                        borderColor={isClientFact ? "#0D6EFD" : "#E8E8E8"}
                        fontWeight={isClientFact ? 800 : 600}
                        justifyContent="flex-start"
                      />
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Distribución por estado de programación
          </Typography>

          <Grid container spacing={1}>
            {ESTADOS_ORDEN_RADAR.map((estado) => {
              const cantidad = Number(resumen?.estados?.[estado] ?? 0);
              const total = Number(resumen?.filas ?? 0);
              const porcentaje = total ? (cantidad / total) * 100 : 0;

              const chipStyle = ESTADO_CHIP_STYLES[estado] ?? {
                backgroundColor: "#ECEFF1",
                color: "#37474F",
                borderColor: "#90A4AE",
              };

              return (
                <Grid item xs={12} sm={6} md={4} key={estado}>
                  <ExportSafeChip
                    label={`${estado}: ${cantidad} (${formatPct(porcentaje)})`}
                    backgroundColor={chipStyle.backgroundColor}
                    color={chipStyle.color}
                    borderColor={chipStyle.borderColor}
                    fontWeight={700}
                    justifyContent="flex-start"
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip placement="top" title="Exportar gráfico a PNG">
            <Button onClick={handleExportPNG} variant="outlined">
              <PhotoIcon />
            </Button>
          </Tooltip>

          <Tooltip placement="top" title="Exportar gráfico a PDF">
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