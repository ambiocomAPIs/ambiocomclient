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
  LabelList,
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

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

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
  "#EF6C00",
  "#FFA726",
  "#1A237E",
  "#2E7D32",
  "#EF6C00",
  "#6A1B9A",
  "#0277BD",
  "#C62828",
  "#00838F",
  "#F9A825",
];

export default function GraficaConsumoDiarioEnergia({
  mediciones,
  columnas,
  onClose,
}) {
  /* ================= STATE ================= */
  const [seriesVisibles, setSeriesVisibles] = useState([]);
  const [verAnalisis, setVerAnalisis] = useState(false);

  const [fechaDesde, setFechaDesde] = useState(
    getPrimerDiaMesActual().toISOString().slice(0, 10)
  );
  const [fechaHasta, setFechaHasta] = useState(
    getUltimoDiaMesActual().toISOString().slice(0, 10)
  );

  const exportRef = useRef();
  const buttonsRef = useRef();

  /* ================= INIT ================= */
  useEffect(() => {
    setSeriesVisibles(columnas.map((c) => c.key));
  }, [columnas]);

  /* ================= FILTRO + ORDEN ================= */
  const medicionesFiltradas = useMemo(() => {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    return [...mediciones]
      .filter((m) => {
        const fecha = parseFechaToDate(m.fecha);
        return fecha >= desde && fecha <= hasta;
      })
      .sort((a, b) => parseFechaToDate(a.fecha) - parseFechaToDate(b.fecha));
  }, [mediciones, fechaDesde, fechaHasta]);

  /* ================= DATA BASE ================= */
  const data = useMemo(() => {
    return medicionesFiltradas.map((row) => {
      const lecturas = {};
      columnas.forEach((c) => {
        lecturas[c.key] = row.lecturas?.[c.key] ?? 0;
      });

      return {
        fecha: parseFechaLabel(row.fecha),
        ...lecturas,
      };
    });
  }, [medicionesFiltradas, columnas]);

  /* ================= MAXIMO GLOBAL + TOP 3 ================= */
  const maximos = useMemo(() => {
    const registros = [];

    data.forEach((row) => {
      columnas.forEach((c) => {
        if (!seriesVisibles.includes(c.key)) return;

        registros.push({
          valor: row[c.key] ?? 0,
          fecha: row.fecha,
          medidor: c.nombre,
          key: c.key,
        });
      });
    });

    const ordenados = registros
      .filter((r) => r.valor > 0)
      .sort((a, b) => b.valor - a.valor);

    return {
      maximo: ordenados[0] || null,
      top3: ordenados.slice(0, 3),
    };
  }, [data, columnas, seriesVisibles]);

  /* ================= DATA CON ANALISIS (Δ) ================= */
  const dataConAnalisis = useMemo(() => {
    return data.map((row, index) => {
      if (index === 0) return row;

      const prev = data[index - 1];
      const deltas = {};

      columnas.forEach((c) => {
        deltas[`delta_${c.key}`] = (row[c.key] ?? 0) - (prev[c.key] ?? 0);
      });

      return {
        ...row,
        ...deltas,
      };
    });
  }, [data, columnas]);

  /* ================= KPI ================= */
  const acumulados = useMemo(() => {
    const totales = {};
    const last = data[data.length - 1];
    columnas.forEach((c) => {
      totales[c.key] = last ? last[c.key] ?? 0 : 0;
    });
    return totales;
  }, [data, columnas]);

  /* ================= ACUMULADO REAL (AÑADIDO) ================= */
  const acumuladoTotal = useMemo(() => {
    const totales = {};

    columnas.forEach((c) => {
      totales[c.key] = data.reduce(
        (sum, row) => sum + (row[c.key] ?? 0),
        0
      );
    });

    return totales;
  }, [data, columnas]);

  /* ================= HANDLERS ================= */
  const handleChangeSeries = (event) => {
    setSeriesVisibles(event.target.value);
  };

  const hideButtons = () => {
    if (buttonsRef.current) buttonsRef.current.style.visibility = "hidden";
  };

  const showButtons = () => {
    if (buttonsRef.current) buttonsRef.current.style.visibility = "visible";
  };

  /* ================= EXPORTS ================= */
  const handleExportImage = async () => {
    hideButtons();
    await new Promise((r) => setTimeout(r, 300));
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      backgroundColor: "#FFFFFF",
    });
    showButtons();
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "lecturas_energia.png";
    link.click();
  };

  const handleExportPDF = async () => {
    hideButtons();
    await new Promise((r) => setTimeout(r, 300));
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      backgroundColor: "#FFFFFF",
    });
    showButtons();

    const pdf = new jsPDF("landscape", "px", [canvas.width, canvas.height]);
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      canvas.width,
      canvas.height
    );
    pdf.save("lecturas_energia.pdf");
  };

  /* ================= RENDER ================= */
  return (
    <Box
      ref={exportRef}
      sx={{
        width: "90vw",
        height: "94vh",
        display: "flex",
        flexDirection: "column",
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
        }}
      >
        <Typography sx={{ fontWeight: 600, color: "#1A237E" }}>
          Lecturas de energía
        </Typography>

        <Box ref={buttonsRef} sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={verAnalisis ? "contained" : "outlined"}
            color="warning"
            onClick={() => setVerAnalisis(!verAnalisis)}
          >
            {verAnalisis ? "Ocultar análisis" : "Analizar consumo"}
          </Button>

          <Button onClick={handleExportPDF} variant="contained">
            Exportar PDF
          </Button>
          <Button onClick={handleExportImage} variant="outlined">
            Exportar Imagen
          </Button>
          {onClose && (
            <Button color="error" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== CONTROLES ===== */}
      <Box
        sx={{ px: 2, py: 1, display: "flex", gap: 2, justifyContent: "center" }}
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
            renderValue={(v) => `${v.length} seleccionados`}
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

      {/* ===== ACUMULADO TOTAL + KPIs en una fila ajustada al 100% ===== */}
      <Box
        sx={{
          mx: 2,
          my: 1,
          display: "flex",
          gap: 2,
          alignItems: "stretch",
          width: "calc(100% - 32px)", // para compensar los márgenes horizontales mx:2 (8px*4)
        }}
      >
        {/* Tarjeta Acumulado Total (aprox 40%) */}
        <Box
          sx={{
            flex: "0 1 88%",
            p: 2,
            borderRadius: 3,
            background: "linear-gradient(135deg, #1A237E, #3949AB)",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minWidth: 0, // para que no fuerce más espacio del disponible
          }}
        >
          <Box sx={{ marginLeft: 5 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              Energía total acumulada
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {Object.values(acumuladoTotal)
                .reduce((a, b) => a + b, 0)
                .toFixed(2)}{" "}
              kWh
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
              Rango seleccionado: <bold>{fechaDesde + " / " + fechaHasta}</bold>
            </Typography>
          </Box>
          <TrendingUpIcon sx={{ fontSize: 56, opacity: 0.35 }} />
        </Box>

        {/* KPIs Última Lectura (aprox 60%) */}
        <Box
          sx={{
            flex: "1 1 12%",
            px: 2,
            py: 1,
            display: "flex",
            gap: 2,
            justifyContent: "flex-start",
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {columnas
            .filter((c) => seriesVisibles.includes(c.key))
            .map((c, i) => (
              <Box
                key={c.key}
                sx={{
                  minWidth: 180,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "#F5F7FA",
                  borderLeft: `5px solid ${COLORS[i % COLORS.length]}`,
                }}
              >
                <Typography variant="caption">{c.nombre}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {acumulados[c.key].toFixed(2)} kWh
                </Typography>
                <Typography variant="caption">Última lectura</Typography>
              </Box>
            ))}
        </Box>
      </Box>


      {/* ===== MAXIMO + TOP 3 EN UNA FILA ===== */}
      <Box
        sx={{
          mx: 2,
          my: 1,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* ===== MAXIMO GLOBAL ===== */}
        <Box
          sx={{
            flex: 1,
            minWidth: 300,
            p: 1,
            borderRadius: 3,
            background: "linear-gradient(135deg, #2E7D32, #66BB6A)",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ marginLeft: 5 }}>
            <Typography variant="h7" sx={{ opacity: 0.9 }}>
              Pico máximo de consumo del rango filtrado
            </Typography>

            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {maximos.maximo?.valor.toFixed(2)} kWh
            </Typography>

            <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
              {maximos.maximo?.medidor} · {maximos.maximo?.fecha}
            </Typography>
          </Box>

          <TrendingUpIcon sx={{ fontSize: 56, opacity: 0.35 }} />
        </Box>

        {/* ===== TOP 3 PICOS COMPACTO ===== */}
        <Box
          sx={{
            flex: 1,
            minWidth: 300,
            p: 2,
            borderRadius: 3,
            backgroundColor: "#F5F7FA",
            display: "flex",
            flexDirection: "column",
            height: "auto",
            boxSizing: "border-box",
            overflowY: "auto", // scroll si excede la altura
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 400,
              mb: 1,
              borderBottom: "2px solid #1976d2",
              pb: 0.4,
              color: "#1976d2",
            }}
          >
            Top 3 picos de consumo
          </Typography>

          {maximos.top3.map((pico, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                py: 1,
                borderBottom: i < 2 ? "1px solid #DDD" : "none",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 200,
                  color: "#333",
                  width: "40%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={`Medidor: ${pico.medidor}`}
              >
                #{i + 1} · {pico.medidor}
              </Typography>

              <Typography
                variant="body2"
                sx={{ fontWeight: 400, color: "#000", width: "60%", textAlign: "right" }}
                title={`Valor: ${pico.valor.toFixed(2)} kWh · Fecha: ${pico.fecha}`}
              >
                {pico.valor.toFixed(2)} kWh · {pico.fecha}
              </Typography>
            </Box>
          ))}
        </Box>

      </Box>

      {/* ===== GRAFICA ===== */}
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={verAnalisis ? dataConAnalisis : data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Legend />

            {columnas.map((c, i) =>
              seriesVisibles.includes(c.key) ? (
                <Line
                  key={c.key}
                  dataKey={c.key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={({ cx, cy, payload }) => {
                    if (
                      maximos.maximo &&
                      payload.fecha === maximos.maximo.fecha &&
                      payload[c.key] === maximos.maximo.valor
                    ) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={9}
                          fill="#D32F2F"
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}

                />
              ) : null
            )}

            {verAnalisis &&
              columnas.map((c) =>
                seriesVisibles.includes(c.key) ? (
                  <Line
                    key={`delta_${c.key}`}
                    dataKey={`delta_${c.key}`}
                    name={`Δ ${c.nombre}`}
                    stroke="#2E7D32"
                    strokeWidth={2}
                    dot={({ cx, cy, payload }) => {
                      const v = payload[`delta_${c.key}`];
                      if (v === undefined) return null;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={v > 0 ? "#2E7D32" : "#C62828"}
                        />
                      );
                    }}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey={`delta_${c.key}`}
                      content={({ x, y, value }) => {
                        if (value === undefined || value === 0) return null;

                        const isPositive = value > 0;
                        const color = isPositive ? "#2E7D32" : "#C62828";

                        return (
                          <g transform={`translate(${x}, ${y - 34})`}>
                            <text
                              x={0}
                              y={0}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight={700}
                            >
                              {value.toFixed(2)}
                            </text>

                            <path
                              d={
                                isPositive
                                  ? "M7 14l5-5 5 5H7z"
                                  : "M7 10l5 5 5-5H7z"
                              }
                              fill={color}
                              transform="translate(20, -15) scale(0.95)"
                            />
                          </g>
                        );
                      }}
                    />
                  </Line>
                ) : null
              )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
