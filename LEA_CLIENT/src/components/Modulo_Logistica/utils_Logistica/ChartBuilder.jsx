// ChartBuilder.jsx (MISMO componente, ahora con FULLSCREEN integrado)
// ✅ Corregido:
// 1) NO early-return antes de hooks (evita "Rendered fewer hooks than expected")
// 2) Evita mini-modal cuando existe un Dialog padre (Dialog anidado) usando renderInDialog={false}
// 3) Cierre consistente: cierra su Dialog interno y notifica al padre via onClose()

import React, { useMemo, useRef, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import {
  Box,
  Paper,
  Stack,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";

export default function ChartBuilder({
  rows = [],
  columnas = [],
  onClose,

  // ✅ NUEVO (para arreglar el mini-modal):
  // - true (default): ChartBuilder renderiza su propio <Dialog fullScreen />
  // - false: ChartBuilder solo renderiza el contenido (para usarlo DENTRO de un Dialog padre)
  renderInDialog = true,

  // ✅ Opcional: si quieres controlar el open desde afuera.
  // Si no lo pasas, el componente usa su estado interno openFull.
  open: openProp,
}) {
  const chartRef = useRef(null);

  const [chartType, setChartType] = useState("bar");
  const [xField, setXField] = useState("fecha");
  const [yField, setYField] = useState("");
  const [agg, setAgg] = useState("sum");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // FULL SCREEN (dentro del mismo componente)
  // ✅ Si openProp viene del padre, usamos eso. Si no, usamos estado interno.
  const [openFull, setOpenFull] = useState(true);
  const isControlled = typeof openProp === "boolean";
  const open = isControlled ? openProp : openFull;

  useEffect(() => {
    if (yField) {
      const col = (columnas || []).find((c) => c.key === yField);
      if (!col || col.totalizable !== true) {
        setYField("");
      }
    }
  }, [columnas, yField]);

  const handleClose = () => {
    // Si no es controlado, cerramos el estado interno
    if (!isControlled) setOpenFull(false);

    // Siempre notificamos al padre (para que cierre su Dialog si existe)
    onClose?.();
  };

  const Transition = React.useMemo(
    () =>
      React.forwardRef(function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
      }),
    []
  );

  // Aplana tu estructura: {fecha, responsable, observaciones, ...lecturas}
  const flatRows = useMemo(() => {
    const data = (rows || []).map((r) => ({
      fecha: r?.fecha ?? "",
      responsable: r?.responsable ?? "",
      observaciones: r?.observaciones ?? "",
      ...(r?.lecturas || {}),
    }));

    // filtro de fecha simple si "fecha" existe
    const fd = fechaDesde ? dayjs(fechaDesde) : null;
    const fh = fechaHasta ? dayjs(fechaHasta) : null;

    return data.filter((r) => {
      if (!r.fecha) return true;
      const f = dayjs(r.fecha);
      if (fd && f.isBefore(fd, "day")) return false;
      if (fh && f.isAfter(fh, "day")) return false;
      return true;
    });
  }, [rows, fechaDesde, fechaHasta]);

  const formatValue = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return v ?? "";
    return n.toLocaleString("es-CL", { maximumFractionDigits: 2 });
  };

  const statsByCategory = useMemo(() => {
    const map = new Map();

    for (const r of flatRows) {
      const key = (r?.[xField] ?? "").toString();

      if (!map.has(key)) {
        map.set(key, { sum: 0, count: 0 });
      }

      const obj = map.get(key);
      obj.count += 1;

      if (yField) {
        const raw = r?.[yField];
        const cleaned =
          typeof raw === "string"
            ? raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".")
            : raw;

        const num = Number(cleaned);
        if (!Number.isNaN(num)) obj.sum += num;
      }
    }

    const out = {};
    for (const [k, v] of map.entries()) {
      out[k] = { ...v, avg: v.count ? v.sum / v.count : 0 };
    }
    return out;
  }, [flatRows, xField, yField]);

  // Campos disponibles para X (incluye campos base + lecturas)
  const xOptions = useMemo(() => {
    const base = ["fecha", "responsable", "observaciones"];
    const lecturas = (columnas || []).map((c) => c.key);
    return [...base, ...lecturas];
  }, [columnas]);

  const yOptions = useMemo(() => {
    return (columnas || [])
      .filter((c) => c.totalizable === true)
      .map((c) => c.key);
  }, [columnas]);

  const { categories, seriesData, pieData } = useMemo(() => {
    if (
      (chartType === "bar" ||
        chartType === "line" ||
        chartType === "scatter" ||
        chartType === "area" ||
        chartType === "heatmap") &&
      !yField
    ) {
      return { categories: [], seriesData: [], pieData: [] };
    }

    // Agrupación: groupBy xField
    const map = new Map();

    for (const r of flatRows) {
      const xVal = (r?.[xField] ?? "").toString();

      if (!map.has(xVal)) {
        map.set(xVal, { count: 0, sum: 0 });
      }

      const obj = map.get(xVal);
      obj.count += 1;

      if (yField) {
        const raw = r?.[yField];
        // Soporta "1.234,5" o "1,234.5" básico (sin complicarlo mucho)
        const cleaned =
          typeof raw === "string"
            ? raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".")
            : raw;

        const num = Number(cleaned);
        if (!Number.isNaN(num)) obj.sum += num;
      }
    }

    // orden: si xField es fecha, ordenar por fecha; si no, alfabético
    const keys = Array.from(map.keys());

    const sortedKeys =
      xField === "fecha"
        ? keys.sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1))
        : keys.sort((a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        );

    const cats = sortedKeys;

    // valores según agg
    const vals = sortedKeys.map((k) => {
      const { count, sum } = map.get(k);
      if (agg === "count") return count;
      if (agg === "avg") return count === 0 ? 0 : sum / count;
      return sum; // sum
    });

    // pie usa {name, value}
    const pData = sortedKeys.map((k, i) => ({
      name: k || "(Vacío)",
      value: vals[i],
    }));

    // scatter: (x index, y)
    const sData =
      chartType === "scatter" ? sortedKeys.map((k, i) => [i, vals[i]]) : vals;

    return { categories: cats, seriesData: sData, pieData: pData };
  }, [flatRows, xField, yField, agg, chartType]);

  const yLabel = useMemo(() => {
    const col = (columnas || []).find((c) => c.key === yField);
    if (!col) return "";
    return `${col.nombre}${col.unidad ? ` (${col.unidad})` : ""}`;
  }, [columnas, yField]);

  const option = useMemo(() => {
    const common = {
      backgroundColor: "transparent",
      animationDuration: 450,
      tooltip: chartType === "pie" ? { trigger: "item" } : { trigger: "axis" },
      toolbox: {
        right: 10,
        feature: {
          saveAsImage: { title: "Guardar PNG" },
          dataZoom: { title: { zoom: "Zoom", back: "Reset zoom" } },
          restore: { title: "Restaurar" },
        },
      },
    };

    const axisTooltipFormatter = (params) => {
      const p = Array.isArray(params) ? params[0] : params;
      if (!p) return "";

      const key = p.name;
      const s = statsByCategory?.[key];

      const sum = s ? formatValue(s.sum) : "-";
      const avg = s ? formatValue(s.avg) : "-";
      const cnt = s ? formatValue(s.count) : "-";

      return `<b>${p.axisValueLabel}</b><br/>${p.seriesName}: ${formatValue(
        p.value
      )}<br/>Suma Total: ${sum}<br/>Promedio: ${avg}<br/>Camiones: ${cnt}`;
    };

    const itemTooltipFormatter = (p) => {
      if (!p) return "";
      const key = p.name === "(Vacío)" ? "" : p.name;
      const s = statsByCategory?.[key];

      const sum = s ? formatValue(s.sum) : "-";
      const avg = s ? formatValue(s.avg) : "-";
      const cnt = s ? formatValue(s.count) : "-";

      return `<b>${p.name}</b><br/>Valor: ${formatValue(
        p.value
      )}<br/>Suma Total: ${sum}<br/>Promedio: ${avg}<br/>Camiones: ${cnt}`;
    };

    if (chartType === "pie") {
      const total =
        Array.isArray(pieData)
          ? pieData.reduce((a, b) => a + (Number(b.value) || 0), 0)
          : 0;

      return {
        ...common,
        tooltip: { trigger: "item", formatter: itemTooltipFormatter },
        legend: { top: 0, left: "center" },
        // TEXTO CENTRAL EN LA DONA
        graphic: [
          {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: formatValue(total),
              textAlign: "center",
              fill: "#333",
              fontSize: 16,
              fontWeight: 600,
              mt: 5
            },
          },
        ],
        series: [
          {
            name: yLabel || agg,
            type: "pie",
            radius: ["23%", "50%"],
            center: ["50%", "55%"],
            avoidLabelOverlap: true,
            label: {
              show: true,
              formatter: (p) => {
                const val = formatValue(p.value);
                return `${p.name}\n${val} (${p.percent}%)`;
              },
              fontSize: 10,
              lineHeight: 14,
              color: "#444",
            },
            data: pieData,
          },
        ],
      };
    }

    if (chartType === "scatter") {
      return {
        ...common,
        tooltip: { trigger: "axis", formatter: axisTooltipFormatter },
        grid: { left: 55, right: 30, top: 55, bottom: 60 },
        xAxis: {
          type: "category",
          data: categories,
          axisLabel: { rotate: 35 },
        },
        yAxis: { type: "value", name: yLabel || agg },
        dataZoom: [{ type: "inside" }, { type: "slider" }],

        series: [
          {
            name: yLabel || agg,
            type: "scatter",
            data: seriesData,

            // ✅ LABELS VISIBLES EN SCATTER
            label: {
              show: true,
              formatter: (p) => {
                // soporta [x,y] o solo y
                const val = Array.isArray(p.value) ? p.value[1] : p.value;
                return formatValue(val);
              },
              position: "top",
            },

            labelLayout: { hideOverlap: false },

            // puntos más visibles (recomendado)
            symbolSize: 10,
          },
        ],
      };
    }

    if (chartType === "area") {

      const totalArea =
        Array.isArray(seriesData)
          ? seriesData.reduce((a, b) => a + (Number(b) || 0), 0)
          : 0;

      return {
        ...common,

        // ✅ MOSTRAR TOTAL COMO AREA BAJO LA CURVA
        title: {
          text: yLabel || agg,
          subtext:
            agg === "sum" || agg === "count"
              ? `Total (Área bajo la curva): ${formatValue(totalArea)} ${agg === "sum" ? "Litros" : "Carrotanques"}`
              : "",
          left: "center",
        },

        tooltip: { trigger: "axis", formatter: axisTooltipFormatter },

        grid: { left: 55, right: 30, top: 85, bottom: 60 },

        xAxis: {
          type: "category",
          data: categories,
          axisLabel: { rotate: 35 },
        },

        yAxis: {
          type: "value",
          name: yLabel || agg,
        },

        dataZoom: [{ type: "inside" }, { type: "slider" }],

        series: [
          {
            name: yLabel || agg,
            type: "line",
            smooth: true,
            areaStyle: {},
            data: seriesData,

            label: {
              show: true,
              formatter: (p) => formatValue(p.value),
              position: "top",
            },

            labelLayout: { hideOverlap: false },

            showSymbol: true,
            symbolSize: 7,
          },
        ],
      };
    }

    if (chartType === "heatmap") {
      const arr = Array.isArray(seriesData) ? seriesData : [];
      const heatmapData = categories.map((cat, index) => [
        index,
        0,
        arr[index] || 0,
      ]);

      const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0);
      const count = arr.length;
      const avg = count ? (sum / count).toFixed(2) : 0;

      return {
        ...common,
        tooltip: { position: "top" },
        title: {
          text: "Heatmap recepción de alcoholes",
          subtext: `Volumen Total: ${sum} | Registros: ${count} | Promedio: ${avg}`,
          left: "center",
        },
        tooltip: {
          position: "top",
          formatter: function (params) {
            const key = categories[params.data[0]];
            const s = statsByCategory?.[key];

            const sSum = s ? formatValue(s.sum) : "-";
            const sAvg = s ? formatValue(s.avg) : "-";
            const sCnt = s ? formatValue(s.count) : "-";

            return `
              <b>${categories[params.data[0]]}</b><br/>
              Valor: ${formatValue(params.data[2])}<br/>
              Suma Total: ${sSum}<br/>
              Promedio: ${sAvg}<br/>
              Camiones: ${sCnt}<br/>
            `;
          },
        },
        grid: {
          height: "50%",
          top: "15%",
        },
        xAxis: {
          type: "category",
          data: categories,
          splitArea: { show: true },
          axisLabel: { rotate: 35 },
        },
        yAxis: {
          type: "category",
          data: [yLabel || agg],
          splitArea: { show: true },
        },
        visualMap: {
          min: 0,
          max: Math.max(...arr, 0),
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "0%",
          inRange: {
            color: ["#313695", "#4575b4", "#74add1", "#f46d43", "#a50026"],
          },
        },
        series: [
          {
            name: yLabel || agg,
            type: "heatmap",
            data: heatmapData,
            label: { show: true },
            emphasis: {
              itemStyle: { shadowBlur: 10 },
            },
          },
        ],
      };
    }

    if (chartType === "funnel") {
      return {
        ...common,
        tooltip: { trigger: "item", formatter: itemTooltipFormatter },
        legend: { top: 0 },
        series: [
          {
            name: yLabel || agg,
            type: "funnel",
            left: "10%",
            width: "80%",
            sort: "descending",
            label: { show: true, position: "inside" },
            // ✅ funnel necesita {name,value}, usamos pieData
            data: pieData,
          },
        ],
      };
    }

    if (chartType === "gauge") {
      const first =
        Array.isArray(seriesData) && typeof seriesData[0] === "number"
          ? seriesData[0]
          : 0;

      return {
        ...common,
        series: [
          {
            name: yLabel || agg,
            type: "gauge",
            min: 0,
            max: 100,
            progress: { show: true },
            detail: { formatter: "{value}%" },
            data: [{ value: first, name: yLabel }],
          },
        ],
      };
    }

    const dataForSeries = Array.isArray(seriesData)
      ? seriesData.map((v) => (typeof v === "number" ? v : Number(v)))
      : [];

    return {
      ...common,
      grid: { left: 55, right: 30, top: 55, bottom: 60 },
      xAxis: { type: "category", data: categories, axisLabel: { rotate: 35 } },
      yAxis: { type: "value", name: yLabel || agg },
      dataZoom: [{ type: "inside" }, { type: "slider" }],
      tooltip: {
        trigger: "axis",
        formatter: axisTooltipFormatter,
      },
      series: [
        {
          name: yLabel || agg,
          type: chartType,
          data: dataForSeries,
          label: {
            show: true,
            formatter: (p) => formatValue(p.value),
            position: "top",
          },
          labelLayout: { hideOverlap: false },
          ...(chartType === "line"
            ? { showSymbol: true, symbolSize: 7, smooth: true }
            : {}),
        },
      ],
    };
  }, [chartType, categories, seriesData, pieData, yLabel, agg, statsByCategory]);

  const exportPNG = () => {
    const inst = chartRef.current?.getEchartsInstance?.();
    if (!inst) return;
    const url = inst.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `chart_${chartType}_${xField}_${yField || agg}.png`;
    a.click();
  };

  const resetAll = () => {
    setChartType("bar");
    setXField("fecha");
    setYField("");
    setAgg("sum");
    setFechaDesde("");
    setFechaHasta("");
  };

  // ====== UI reutilizable (misma vista) ======
  const Content = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header + controles */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Chart Builder
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Selecciona campos, agregación y rango de fechas para explorar los datos.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={`${flatRows.length} registros`} sx={{ fontWeight: 700 }} />

            <Tooltip title="Cerrar Modal">
              <IconButton onClick={handleClose} color="error">
                <CloseIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Restablecer">
              <IconButton onClick={resetAll}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={chartType} label="Tipo" onChange={(e) => setChartType(e.target.value)}>
                <MenuItem value="bar">Barras</MenuItem>
                <MenuItem value="line">Líneas</MenuItem>
                <MenuItem value="heatmap">heat map</MenuItem>
                <MenuItem value="pie">Pie / Dona</MenuItem>
                <MenuItem value="area">area</MenuItem>
                <MenuItem value="scatter">Dispersión</MenuItem>
                <MenuItem value="funnel">Funnel Power-BI</MenuItem>
                <MenuItem value="gauge">Gauge "KPI" Power-BI</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Eje X</InputLabel>
              <Select value={xField} label="Eje X" onChange={(e) => setXField(e.target.value)}>
                {xOptions.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Eje Y (lectura)</InputLabel>
              <Select value={yField} label="Eje Y (lectura)" onChange={(e) => setYField(e.target.value)}>
                <MenuItem value="">(Selecciona)</MenuItem>
                {yOptions.map((k) => {
                  const c = (columnas || []).find((x) => x.key === k);
                  return (
                    <MenuItem key={k} value={k}>
                      {c?.nombre ?? k}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={1.8}>
            <FormControl fullWidth size="small">
              <InputLabel>Agregación</InputLabel>
              <Select value={agg} label="Agregación" onChange={(e) => setAgg(e.target.value)}>
                <MenuItem value="sum">Suma</MenuItem>
                <MenuItem value="avg">Promedio</MenuItem>
                <MenuItem value="count">Conteo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={1.85}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1.85}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Card de la gráfica */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          p: 2,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 700, opacity: 0.85 }}>
            {chartType.toUpperCase()} · {xField} {yField ? `vs ${yField}` : ""}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Exportar PNG">
              <IconButton onClick={exportPNG}>
                <ImageIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ReactECharts
            ref={chartRef}
            option={option}
            notMerge={true}
            lazyUpdate={true}
            style={{ height: "100%", width: "100%" }}
          />
        </Box>
      </Paper>
    </Box>
  );

  if (!renderInDialog) {
    return Content;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      keepMounted={false}
      TransitionComponent={Transition}
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        "& .MuiDialog-paper": {
          bgcolor: "#f6f7fb",
        },
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "white",
          color: "inherit",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Typography sx={{ fontWeight: 800, flex: 1 }}>
            Análisis y Gráficas
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: "calc(100vh - 64px)", p: 2 }}>{Content}</Box>
    </Dialog>
  );
}
