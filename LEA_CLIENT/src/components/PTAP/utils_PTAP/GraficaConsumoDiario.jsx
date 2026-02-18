import { useEffect, useMemo, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from "@mui/material";

/* ================= UTILS ================= */
const parseFechaToDate = (fecha) => {
  const [d, m, y] = fecha.split("-");
  return new Date(y, m - 1, d);
};

const parseFechaLabel = (fecha) => {
  const [d, m, y] = fecha.split("-");
  return `${y}-${m}-${d}`;
};

const getPrimerDiaMesActual = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getUltimoDiaMesActual = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

/* ================= PALETA ================= */
const COLORS = [
  "#1A237E",
  "#2E7D32",
  "#EF6C00",
  "#6A1B9A",
  "#0277BD",
  "#C62828",
  "#00838F",
  "#F9A825",
];

export default function GraficaConsumoDiarioPTAP({
  mediciones,
  columnas,
  onClose,
}) {
  /* ================= STATE ================= */
  const [seriesVisibles, setSeriesVisibles] = useState([]);

  const [fechaDesde, setFechaDesde] = useState(
    getPrimerDiaMesActual().toISOString().slice(0, 10)
  );
  const [fechaHasta, setFechaHasta] = useState(
    getUltimoDiaMesActual().toISOString().slice(0, 10)
  );

  /* ===== REF PARA EXPORTAR ===== */
  const exportRef = useRef();
  const buttonsRef = useRef();

  /* ================= INIT ================= */
  useEffect(() => {
    setSeriesVisibles(columnas.map((c) => c.key));
  }, [columnas]);

  /* ================= FILTRO FECHAS ================= */
  const medicionesFiltradas = useMemo(() => {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    return mediciones.filter((m) => {
      const fecha = parseFechaToDate(m.fecha);
      return fecha >= desde && fecha <= hasta;
    });
  }, [mediciones, fechaDesde, fechaHasta]);

  /* ================= DATA ================= */
  const data = useMemo(() => {
    return medicionesFiltradas.map((row, index) => {
      const prev = index === 0 ? null : medicionesFiltradas[index - 1];
      const consumos = {};

      columnas.forEach((c) => {
        if (!prev) {
          consumos[c.key] = 0;
        } else {
          const actual = row.lecturas[c.key] ?? 0;
          const anterior = prev.lecturas[c.key] ?? 0;

          // consumo nunca negativo
          const diff = actual - anterior;
          consumos[c.key] = diff < 0 ? 0 : diff;
        }
      });

      return {
        fecha: parseFechaLabel(row.fecha),
        ...consumos,
      };
    });
  }, [medicionesFiltradas, columnas]);

  /* ================= ACUMULADOS ================= */
  const acumulados = useMemo(() => {
    const totales = {};
    columnas.forEach((c) => (totales[c.key] = 0));

    data.forEach((row) => {
      columnas.forEach((c) => {
        totales[c.key] += row[c.key] || 0;
      });
    });

    return totales;
  }, [data, columnas]);

  /* ================= HANDLERS ================= */
  const handleChangeSeries = (event) => {
    setSeriesVisibles(event.target.value);
  };

  /* ===== UTIL OCULTAR SIN MOVER LAYOUT ===== */
  const hideButtons = () => {
    if (buttonsRef.current) buttonsRef.current.style.visibility = "hidden";
  };

  const showButtons = () => {
    if (buttonsRef.current) buttonsRef.current.style.visibility = "visible";
  };

  /* ================= EXPORTAR IMAGEN ================= */
  const handleExportImage = async () => {
    const node = exportRef.current;
    if (!node) return;

    hideButtons();
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
    });

    showButtons();

    const extra = 120;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + extra;
    finalCanvas.height = canvas.height;

    const ctx = finalCanvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, extra / 2, 0);

    const img = finalCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = img;
    link.download = "consumo_diario.png";
    link.click();
  };

  /* ================= EXPORTAR PDF ================= */
  const handleExportPDF = async () => {
    const node = exportRef.current;
    if (!node) return;

    hideButtons();
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
    });

    showButtons();

    const extra = 120;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + extra;
    finalCanvas.height = canvas.height;

    const ctx = finalCanvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, extra / 2, 0);

    const imgData = finalCanvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [finalCanvas.width, finalCanvas.height],
    });

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      finalCanvas.width,
      finalCanvas.height
    );

    pdf.save("consumo_diario.pdf");
  };

  /* ================= RENDER ================= */
  return (
    <Box
      ref={exportRef}
      sx={{
        width: "90vw",
        height: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        margin: "0 auto",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* ===== HEADER ===== */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "#1A237E" }}
        >
          Consumo diario de agua (m³)
        </Typography>

        <Box
          ref={buttonsRef}
          sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
        >
          <Button variant="contained" color="primary" onClick={handleExportPDF}>
            Exportar PDF
          </Button>

          <Button variant="outlined" color="primary" onClick={handleExportImage}>
            Exportar Imagen
          </Button>

          {onClose && (
            <Button variant="outlined" color="error" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== CONTROLES ===== */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <TextField
          type="date"
          size="small"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />

        <TextField
          type="date"
          size="small"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Medidores</InputLabel>
          <Select
            multiple
            value={seriesVisibles}
            onChange={handleChangeSeries}
            label="Medidores"
            renderValue={(selected) =>
              selected.length === 0
                ? "Seleccione medidores"
                : `${selected.length} seleccionados`
            }
          >
            {columnas.map((c) => (
              <MenuItem key={c.key} value={c.key}>
                <Checkbox checked={seriesVisibles.includes(c.key)} />
                <ListItemText primary={c.nombre} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ===== KPIs ACUMULADOS ===== */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {columnas
          .filter((c) => seriesVisibles.includes(c.key))
          .map((c, index) => (
            <Box
              key={c.key}
              sx={{
                minWidth: 180,
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "#F5F7FA",
                borderLeft: `5px solid ${COLORS[index % COLORS.length]}`,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {c.nombre}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {acumulados[c.key].toFixed(2)} m³
              </Typography>

              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Acumulado del período
              </Typography>
            </Box>
          ))}
      </Box>

      {/* ===== GRAFICA ===== */}
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />

            {/* ✅ ÚNICO CAMBIO: eje Y solo positivo */}
            <YAxis domain={[0, "auto"]} allowDecimals={false} />

            <Tooltip />
            <Legend />

            {columnas.map((c, index) =>
              seriesVisibles.includes(c.key) ? (
                <Line
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  name={c.nombre}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
