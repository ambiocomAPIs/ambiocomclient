import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, Divider, IconButton, MenuItem, Stack, Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ResumenTanqueSCADADrawer from "./ResumenTanquesSCADADrawer";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
const AZUL = "#087bff3f", MARINO = "#081c6a", VERDE = "#009846", ROJO = "#f0432162", ROJO_DARK = "#ff1e00", MORADO = "#7b3ff2";
const formatear = (v, dec = 3) => Number(v).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const horaDe = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;

// Todas las etiquetas se dibujan DENTRO del área de trazado. Ningún dato es modificado.
const etiquetasInternas = {
  id: "scadaModalEtiquetasInternas",
  afterDatasetsDraw(chart, _args, conf) {
    if (!conf?.mostrar || conf.tipo === "original") return;
    const { ctx, chartArea: a, scales } = chart;
    if (!a || !scales?.x || !scales?.y) return;

    const litros = conf.unidad === "volumen";
    const valor = (p) => litros ? p?.volumen : p?.nivel;
    const items = conf.tipo === "operaciones"
      ? (conf.operaciones || []).map(o => ({
        x: (o.desde.minutosDia + o.hasta.minutosDia) / 2,
        y: (valor(o.desde) + valor(o.hasta)) / 2,
        delta: litros ? o.deltaL : o.delta,
      }))
      : (conf.eventos || [])
        .filter(e => e.delta != null && e.delta !== 0)
        .map(e => ({ x: e.minutosDia, y: valor(e), delta: litros ? e.deltaL : e.delta }));

    const validos = items.filter(e => Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.delta) && e.delta !== 0);
    if (!validos.length) return;

    ctx.save();
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cajasOcupadas = [];
    const filas = [28, 52, 76, 100, 124, 148];
    const gapX = 8;
    const gapY = 6;
    const altoCaja = 21;

    const baseMeta = chart.getDatasetMeta(0);
    const puntosBase = (baseMeta?.data || []).filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && !p.skip);
    const zonasProtegidas = [];
    for (let i = 0; i < puntosBase.length; i++) {
      const p = puntosBase[i];
      zonasProtegidas.push({ left: p.x - 9, right: p.x + 9, top: p.y - 9, bottom: p.y + 9 });
      if (i < puntosBase.length - 1) {
        const q = puntosBase[i + 1];
        zonasProtegidas.push({
          left: Math.min(p.x, q.x) - 8,
          right: Math.max(p.x, q.x) + 8,
          top: Math.min(p.y, q.y) - 8,
          bottom: Math.max(p.y, q.y) + 8,
        });
      }
    }

    const interseca = (r1, r2) => !(r1.right + gapX < r2.left || r1.left - gapX > r2.right || r1.bottom + gapY < r2.top || r1.top - gapY > r2.bottom);
    const hayChoqueEtiquetas = (rect) => cajasOcupadas.some(r => interseca(rect, r));
    const tocaGrafica = (rect) => zonasProtegidas.some(r => !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom));

    const dibujarGrupo = (grupo, esPositivo) => {
      const ordenados = [...grupo].sort((a, b) => a.x - b.x);
      for (const e of ordenados) {
        const px = scales.x.getPixelForValue(e.x);
        const py = scales.y.getPixelForValue(e.y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) continue;

        const texto = `${e.delta > 0 ? "+" : ""}${formatear(e.delta, litros ? 0 : 3)} ${litros ? "L" : "m"}`;
        const ancho = ctx.measureText(texto).width + 16;
        if (ancho >= a.right - a.left - 8) continue;

        const color = esPositivo ? VERDE : ROJO_DARK;
        let elegido = null;
        const desplazamientos = [0, 20, -20, 38, -38, 58, -58, 82, -82, 108, -108];

        for (const dy of filas) {
          for (const dx of desplazamientos) {
            const y = esPositivo
              ? Math.max(a.top + 4, py - dy - altoCaja)
              : Math.min(a.bottom - altoCaja - 4, py + dy);
            const x = Math.max(a.left + 4, Math.min(px - ancho / 2 + dx, a.right - ancho - 4));
            const rect = { left: x, right: x + ancho, top: y, bottom: y + altoCaja };
            if (hayChoqueEtiquetas(rect)) continue;
            if (tocaGrafica(rect)) continue;
            elegido = { x, y, rect };
            break;
          }
          if (elegido) break;
        }

        if (!elegido) {
          for (const dy of [148, 172]) {
            for (const dx of desplazamientos) {
              const y = esPositivo
                ? Math.max(a.top + 4, py - dy - altoCaja)
                : Math.min(a.bottom - altoCaja - 4, py + dy);
              const x = Math.max(a.left + 4, Math.min(px - ancho / 2 + dx, a.right - ancho - 4));
              const rect = { left: x, right: x + ancho, top: y, bottom: y + altoCaja };
              if (!hayChoqueEtiquetas(rect)) {
                elegido = { x, y, rect };
                break;
              }
            }
            if (elegido) break;
          }
        }

        if (!elegido) continue;

        cajasOcupadas.push(elegido.rect);
        const cx = elegido.x + ancho / 2;
        const cyCaja = elegido.y + altoCaja / 2;
        const bordeCaja = esPositivo ? elegido.y + altoCaja : elegido.y;
        const pivoteY = esPositivo ? bordeCaja - 4 : bordeCaja + 4;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, pivoteY);
        ctx.lineTo(cx, pivoteY);
        ctx.lineTo(cx, bordeCaja);
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(elegido.x, elegido.y, ancho, altoCaja, 4);
        ctx.fillStyle = "rgba(255,255,255,.98)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillText(texto, cx, cyCaja);
      }
    };

    dibujarGrupo(validos.filter(e => e.delta > 0), true);
    dibujarGrupo(validos.filter(e => e.delta < 0), false);
    ctx.restore();
  },
};

const escalerasAnalisis = {
  id: "scadaModalEscalerasAnalisis",
  afterDatasetsDraw(chart, _args, conf) {
    if (!conf?.activo || conf.tipo === "original") return;
    const meta = chart.getDatasetMeta(0);
    const { ctx } = chart;
    if (!meta?.data?.length) return;

    const puntos = conf.puntos || [];
    const indiceAData = new Map();
    puntos.forEach((p, i) => indiceAData.set(p.indice, i));

    const dibujarTramo = (desde, hasta) => {
      if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta <= desde) return;
      const primero = meta.data[desde];
      if (!primero || primero.skip) return;
      ctx.save();
      ctx.strokeStyle = MORADO;
      ctx.lineWidth = 1.45;
      ctx.setLineDash([5, 3]);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(primero.x, primero.y);
      for (let i = desde; i < hasta; i++) {
        const a = meta.data[i];
        const b = meta.data[i + 1];
        if (!a || !b || a.skip || b.skip) continue;
        ctx.lineTo(b.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.restore();
    };

    if (conf.tipo === "nodos") {
      (conf.eventos || []).forEach(ev => {
        if (ev?.delta == null || ev.delta === 0) return;
        const i0 = indiceAData.get(ev.anterior);
        const i1 = indiceAData.get(ev.indice);
        if (i0 == null || i1 == null) return;
        dibujarTramo(i0, i1);
      });
      return;
    }

    (conf.operaciones || []).forEach(op => {
      const i0 = indiceAData.get(op?.desde?.indice);
      const i1 = indiceAData.get(op?.hasta?.indice);
      if (i0 == null || i1 == null) return;
      dibujarTramo(Math.min(i0, i1), Math.max(i0, i1));
    });
  },
};

const sombrasIntermitencias = {
  id: "scadaModalIntermitencias",
  beforeDatasetsDraw(chart, _args, conf) {
    if (!conf?.activo) return;
    const { ctx, chartArea: a, scales } = chart;
    if (!a || !scales?.x) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top);
    ctx.clip();
    ctx.fillStyle = "rgba(240,67,33,.09)";
    (conf.tramos || []).forEach(t => {
      const x1 = scales.x.getPixelForValue(t.desde);
      const x2 = scales.x.getPixelForValue(t.hasta);
      if (Number.isFinite(x1) && Number.isFinite(x2)) ctx.fillRect(Math.min(x1, x2), a.top, Math.abs(x2 - x1), a.bottom - a.top);
    });
    ctx.restore();
  },
};

// Sombreado del intervalo elegido en la gráfica principal.
const rangoLupaPlugin = {
  id: "scadaRangoLupa",
  beforeDatasetsDraw(chart, _args, config) {
    if (!config?.activo || !chart.chartArea || !chart.scales?.x) return;
    const { ctx, chartArea: a, scales: { x } } = chart;
    const pos = [config.inicio, config.fin].filter(Number.isFinite);
    if (!pos.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top);
    ctx.clip();
    if (pos.length === 2) {
      const x1 = x.getPixelForValue(Math.min(...pos));
      const x2 = x.getPixelForValue(Math.max(...pos));
      ctx.fillStyle = "rgba(8,124,255,.12)";
      ctx.fillRect(x1, a.top, x2 - x1, a.bottom - a.top);
    }
    pos.forEach((v, i) => {
      const px = x.getPixelForValue(v);
      ctx.strokeStyle = i === 0 ? "#009846" : "#ff6b35";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
    });
    ctx.restore();
  },
};

// Conversión del eje SCADA a fecha/hora real (también en día inventario).
const momentoSCADA = (minutos, fecha, modo) => {
  if (!fecha) return horaDe(modo === "inventario" ? (minutos + 480) % 1440 : minutos);
  if (modo !== "inventario") return `${fecha} ${horaDe(minutos)}`;
  const d = new Date(`${fecha}T00:00:00Z`);
  if (minutos < 960) d.setUTCDate(d.getUTCDate() - 1);
  return `${d.toISOString().slice(0, 10)} ${horaDe((minutos + 480) % 1440)}`;
};

// Etiquetas contextuales de la lupa: destacan cambios significativos sin tapar la curva.
const etiquetasLupaPlugin = {
  id: "scadaEtiquetasLupa",
  afterDatasetsDraw(chart, _args, config) {
    if (!config?.activo) return;
    const meta = chart.getDatasetMeta(0);
    const datos = config.datos || [];
    if (!meta?.data?.length || !datos.length) return;
    const { ctx, chartArea: area } = chart;
    const valor = p => config.volumen ? p?.volumen : p?.nivel;
    const cambios = [];
    for (let i = 1; i < datos.length; i++) {
      const dt = datos[i].minutosDia - datos[i - 1].minutosDia;
      const dv = valor(datos[i]) - valor(datos[i - 1]);
      if (dt > 0 && dt <= 30 && Number.isFinite(dv) && dv !== 0) cambios.push({ i, dv, abs: Math.abs(dv) });
    }
    // Seleccionamos los cambios más notables, distribuidos a lo largo del eje temporal.
    const maxEtiquetas = Math.max(2, Math.min(8, Math.floor((area.right - area.left) / 120)));
    const seleccionados = [];
    for (const item of [...cambios].sort((a, b) => b.abs - a.abs)) {
      const punto = meta.data[item.i];
      if (!punto || punto.skip || !Number.isFinite(punto.x)) continue;
      if (punto.x < area.left + 35 || punto.x > area.right - 35) continue;
      if (seleccionados.some(x => Math.abs(x.x - punto.x) < 108)) continue;
      seleccionados.push({ ...item, x: punto.x, y: punto.y });
      if (seleccionados.length >= maxEtiquetas) break;
    }
    ctx.save();
    ctx.font = "600 10px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (const item of seleccionados) {
      const positivo = item.dv > 0;
      const color = positivo ? "#008b52" : "#dc472f";
      const texto = `${positivo ? "+" : "−"}${formatear(Math.abs(item.dv), config.volumen ? 0 : 3)} ${config.volumen ? "L" : "m"}`;
      const ancho = ctx.measureText(texto).width + 14;
      const alto = 22;
      const x = Math.max(area.left + 3, Math.min(item.x - ancho / 2, area.right - ancho - 3));
      let y = positivo ? item.y - 34 : item.y + 12;
      y = Math.min(area.bottom - alto - 2, Math.max(area.top + 3, y));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.moveTo(item.x, item.y); ctx.lineTo(item.x, positivo ? y + alto : y); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, ancho, alto, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(texto, x + ancho / 2, y + alto / 2);
    }
    ctx.restore();
  },
};

const indicadoresLupa = (label, valor, color = MARINO, aclaracion = "") => (
  <Box sx={{ border: "1px solid #e3eaf4", borderRadius: 1.8, bgcolor: "#fff", px: 1.6, py: 1.3, minWidth: 0 }}>
    <Typography sx={{ color: "#61738e", fontSize: 11, fontWeight: 600 }}>{label}</Typography>
    <Typography sx={{ color, fontSize: { xs: 15, sm: 17 }, fontWeight: 800, mt: .3, lineHeight: 1.35, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{valor}</Typography>
    {aclaracion && <Typography sx={{ color: "#8190a6", fontSize: 10.5, mt: .4 }}>{aclaracion}</Typography>}
  </Box>
);

function ModalIntervaloSCADA({ open, onClose, puntos, tituloTanque, fechaConsultada, modoDia, factor }) {
  const [unidadDetalle, setUnidadDetalle] = useState("volumen");
  const [mostrarEtiquetasLupa, setMostrarEtiquetasLupa] = useState(true);
  useEffect(() => {
    if (open) {
      setUnidadDetalle(factor != null ? "volumen" : "nivel");
      setMostrarEtiquetasLupa(true);
    }
  }, [open, factor]);
  const datos = useMemo(() => [...puntos].sort((a, b) => a.minutosDia - b.minutosDia), [puntos]);
  const primero = datos[0], ultimo = datos[datos.length - 1];
  const tieneVolumen = datos.length > 0 && datos.every(p => Number.isFinite(p.volumen));
  const seriesN = datos.map(p => p.nivel).filter(Number.isFinite);
  const seriesL = tieneVolumen ? datos.map(p => p.volumen) : [];
  const intervalos = datos.slice(1).map((p, i) => ({ anterior: datos[i], actual: p, dt: p.minutosDia - datos[i].minutosDia }));
  const fiables = intervalos.filter(t => t.dt > 0 && t.dt <= 30 && Number.isFinite(t.anterior.volumen) && Number.isFinite(t.actual.volumen));
  const alzas = fiables.reduce((s, t) => s + Math.max(0, t.actual.volumen - t.anterior.volumen), 0);
  const bajas = fiables.reduce((s, t) => s + Math.max(0, t.anterior.volumen - t.actual.volumen), 0);
  const sinSenal = intervalos.filter(t => t.dt > 30);
  const duracion = primero && ultimo ? ultimo.minutosDia - primero.minutosDia : 0;
  const neto = tieneVolumen ? ultimo.volumen - primero.volumen : null;
  const unidadVol = unidadDetalle === "volumen" && tieneVolumen;
  const valorPunto = p => unidadVol ? p?.volumen : p?.nivel;
  const fmtNivel = n => Number.isFinite(n) ? formatear(n, 3) : "—";
  const fmtLitros = n => Number.isFinite(n) ? formatear(n, 0) : "—";
  const fmtSigno = (n, unidad) => Number.isFinite(n) ? `${n > 0 ? "+" : ""}${formatear(n, unidad === "L" ? 0 : 3)} ${unidad}` : "—";
  const magnitudNeta = primero && ultimo ? valorPunto(ultimo) - valorPunto(primero) : null;
  const serieUnidad = unidadVol ? seriesL : seriesN;
  const graficoDetalle = useMemo(() => ({
    datasets: [{
      label: unidadVol ? "Volumen (L)" : "Nivel (m)",
      data: datos.filter(p => Number.isFinite(valorPunto(p))).map(p => ({ x: p.minutosDia, y: valorPunto(p) })),
      parsing: false, fill: true, tension: 0, borderWidth: 2.1,
      borderColor: "#1479e6", backgroundColor: "rgba(20,121,230,.055)",
      pointRadius: datos.length > 180 ? 0 : 1.7, pointHoverRadius: 5, pointHitRadius: 9,
      segment: {
        borderColor: ({ p0, p1 }) => p1.parsed.x - p0.parsed.x > 30 ? "#e45039" : "#1479e6",
        borderDash: ({ p0, p1 }) => p1.parsed.x - p0.parsed.x > 30 ? [5, 4] : []
      },
    }]
  }), [datos, unidadVol]);
  const opcionesDetalle = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { intersect: false, mode: "index" },
    layout: { padding: { top: 30, right: 16, bottom: 4, left: 8 } },
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      scadaEtiquetasLupa: { activo: mostrarEtiquetasLupa, datos, volumen: unidadVol },
      tooltip: {
        displayColors: false, backgroundColor: "#102c57", padding: 11,
        callbacks: {
          title: items => momentoSCADA(items[0]?.parsed?.x ?? 0, fechaConsultada, modoDia),
          label: item => `${formatear(item.parsed.y, unidadVol ? 0 : 3)} ${unidadVol ? "L" : "m"}`
        }
      },
    },
    scales: {
      x: {
        type: "linear", min: primero?.minutosDia ?? 0, max: ultimo?.minutosDia ?? 1440,
        grid: { color: "#eef2f7" }, border: { display: false },
        title: { display: true, text: "Hora del intervalo", color: "#64748b", font: { size: 11 } },
        ticks: {
          color: "#64748b", maxTicksLimit: 9, font: { size: 10 },
          callback: v => horaDe(modoDia === "inventario" ? (Number(v) + 480) % 1440 : Number(v))
        }
      },
      y: {
        grid: { color: "#eef2f7" }, border: { display: false },
        title: { display: true, text: unidadVol ? "Volumen (L)" : "Nivel (m)", color: "#64748b", font: { size: 11 } },
        ticks: { color: "#64748b", maxTicksLimit: 7, font: { size: 10 }, callback: v => formatear(v, unidadVol ? 0 : 3) }
      },
    },
  }), [datos, primero, ultimo, fechaConsultada, modoDia, mostrarEtiquetasLupa, unidadVol]);
  const duracionTexto = `${Math.floor(duracion / 60)} h ${Math.round(duracion % 60)} min`;
  const celda = { py: .95, px: 1.4, fontSize: 11.5, borderBottomColor: "#eef1f6", whiteSpace: "nowrap" };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "90vw",
          maxWidth: "90vw",
          height: "90vh",
          maxHeight: "90vh",
          m: 0,
          borderRadius: 2.5,
          bgcolor: "#f6f8fc",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.7, bgcolor: "white", borderBottom: "1px solid #e3eaf4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "#eaf3ff", color: "#087cff" }}><ZoomInOutlinedIcon fontSize="small" /></Box>
          <Box>
            <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: 16 }}>Análisis de intervalo · {tituloTanque}</Typography>
            <Typography sx={{ color: "#667892", fontSize: 11.5 }}>Modo Lupa SCADA · {datos.length} lecturas</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ToggleButtonGroup size="small" exclusive value={unidadDetalle} onChange={(_, v) => { if (v) setUnidadDetalle(v); }} sx={{ height: 32, "& .MuiToggleButton-root": { textTransform: "none", fontSize: 11, px: 1.2 } }}>
            <ToggleButton value="nivel">Nivel (m)</ToggleButton>
            <ToggleButton value="volumen" disabled={!tieneVolumen}>Volumen (L)</ToggleButton>
          </ToggleButtonGroup>
          <IconButton size="small" onClick={onClose} aria-label="Cerrar análisis de intervalo"><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
      <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2, overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Chip size="small" label={`Desde · ${primero ? momentoSCADA(primero.minutosDia, fechaConsultada, modoDia) : "—"}`} sx={{ bgcolor: "#e8f7ef", color: "#087c47", fontWeight: 700, fontSize: 11 }} />
          <Chip size="small" label={`Hasta · ${ultimo ? momentoSCADA(ultimo.minutosDia, fechaConsultada, modoDia) : "—"}`} sx={{ bgcolor: "#fff0e9", color: "#b74a25", fontWeight: 700, fontSize: 11 }} />
          <Chip variant="outlined" size="small" label={duracionTexto} sx={{ borderColor: "#dce5ef", color: "#526780", fontSize: 11 }} />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))" }, gap: 1, mb: 1.5 }}>
          {indicadoresLupa(unidadVol ? "Volumen inicial" : "Nivel inicial", primero ? `${unidadVol ? fmtLitros(primero.volumen) : fmtNivel(primero.nivel)} ${unidadVol ? "L" : "m"}` : "—")}
          {indicadoresLupa(unidadVol ? "Volumen final" : "Nivel final", ultimo ? `${unidadVol ? fmtLitros(ultimo.volumen) : fmtNivel(ultimo.nivel)} ${unidadVol ? "L" : "m"}` : "—")}
          {indicadoresLupa("Variación neta", fmtSigno(magnitudNeta, unidadVol ? "L" : "m"), magnitudNeta > 0 ? VERDE : magnitudNeta < 0 ? "#d34838" : MARINO, "Entre los dos extremos")}
          {indicadoresLupa("Mínimo / máximo", serieUnidad.length ? `${formatear(Math.min(...serieUnidad), unidadVol ? 0 : 3)} / ${formatear(Math.max(...serieUnidad), unidadVol ? 0 : 3)} ${unidadVol ? "L" : "m"}` : "—")}
        </Box>
        <Box sx={{ bgcolor: "white", border: "1px solid #e3eaf4", borderRadius: 2, p: { xs: 1.2, sm: 1.8 }, mb: 1.5 }}>
          <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
            <Box>
              <Typography sx={{ color: MARINO, fontSize: 13, fontWeight: 800 }}>Comportamiento del tanque</Typography>
              <Typography sx={{ color: "#79899e", fontSize: 10.5 }}>Etiquetas de los cambios más significativos · rojo discontinuo indica falta de señal</Typography>
            </Box>
            <FormControlLabel sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 11.5, color: "#51657f" } }} control={<Switch checked={mostrarEtiquetasLupa} size="small" onChange={(_, v) => setMostrarEtiquetasLupa(v)} />} label="Etiquetas" />
          </Stack>
          <Box sx={{ height: { xs: 260, sm: 320 }, minWidth: 0 }}>
            {datos.length > 1 ? <Line data={graficoDetalle} options={opcionesDetalle} plugins={[etiquetasLupaPlugin]} /> : <Typography sx={{ color: "#74849b", p: 2 }}>Se necesitan dos lecturas para graficar.</Typography>}
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 1, color: "#64748b" }}>
            <Typography sx={{ fontSize: 10.5 }}><Box component="span" sx={{ color: VERDE, fontWeight: 900 }}>●</Box> Variación positiva</Typography>
            <Typography sx={{ fontSize: 10.5 }}><Box component="span" sx={{ color: "#dc472f", fontWeight: 900 }}>●</Box> Variación negativa</Typography>
            <Typography sx={{ fontSize: 10.5 }}><Box component="span" sx={{ color: "#dc472f", fontWeight: 900 }}>┄</Box> Brecha &gt; 30 min</Typography>
          </Stack>
        </Box>
        <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: 13, mb: 1 }}>Balance observado y señal</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }, gap: 1, mb: 1 }}>
          {indicadoresLupa("Subidas observadas*", tieneVolumen ? `+${fmtLitros(alzas)} L` : "—", VERDE)}
          {indicadoresLupa("Bajadas observadas*", tieneVolumen ? `−${fmtLitros(bajas)} L` : "—", "#d34838")}
          {indicadoresLupa("Variación neta por hora", neto != null && duracion > 0 ? fmtSigno(neto * 60 / duracion, "L/h") : "—")}
          {indicadoresLupa("Brechas de señal", `${sinSenal.length}`, sinSenal.length ? "#d34838" : VERDE, "Intervalos mayores a 30 min")}
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: 13 }}>Detalle de lecturas</Typography>
          <Typography sx={{ fontSize: 11, color: "#8190a6" }}>{datos.length} registros</Typography>
        </Stack>
        <TableContainer sx={{ bgcolor: "white", border: "1px solid #e3eaf4", borderRadius: 2, maxHeight: 245 }}>
          <Table size="small" stickyHeader sx={{ minWidth: 630 }}>
            <TableHead><TableRow sx={{ "& th": { ...celda, bgcolor: "#f3f7fc", color: MARINO, fontWeight: 750 } }}>
              <TableCell>Fecha y hora</TableCell><TableCell align="right">Nivel (m)</TableCell><TableCell align="right">Volumen (L)</TableCell><TableCell align="right">Δ volumen (L)</TableCell><TableCell align="right">Intervalo (min)</TableCell>
            </TableRow></TableHead>
            <TableBody>{datos.map((p, i) => {
              const prev = datos[i - 1];
              const dt = prev ? p.minutosDia - prev.minutosDia : null;
              const dv = prev && Number.isFinite(p.volumen) && Number.isFinite(prev.volumen) ? p.volumen - prev.volumen : null;
              return <TableRow key={`${p.minutosDia}-${i}`} sx={{ bgcolor: dt > 30 ? "#fff4f0" : "white", "&:hover": { bgcolor: "#f5f9ff" } }}>
                <TableCell sx={celda}>{momentoSCADA(p.minutosDia, fechaConsultada, modoDia)}</TableCell>
                <TableCell align="right" sx={celda}>{fmtNivel(p.nivel)}</TableCell>
                <TableCell align="right" sx={celda}>{fmtLitros(p.volumen)}</TableCell>
                <TableCell align="right" sx={{ ...celda, fontWeight: 700, color: dv > 0 ? VERDE : dv < 0 ? "#d34838" : "#718199" }}>{dv == null ? "—" : `${dv > 0 ? "+" : ""}${fmtLitros(dv)}`}</TableCell>
                <TableCell align="right" sx={{ ...celda, color: dt > 30 ? "#d34838" : "#61738e", fontWeight: dt > 30 ? 800 : 400 }}>{dt == null ? "—" : formatear(dt, 0)}</TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Dialog>
  );
}

export default function AnalisisNivelesTanquesSCADAModal({
  open = false, onClose = () => { }, tituloTanque = "Tanque", fechaConsultada = "", factor = null,
  puntos = [], eventos = [], operaciones = [], tramosSinSenal = [],
  tipoInicial = "original", unidadInicial = "nivel", modoDia = "natural",
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [unidad, setUnidad] = useState(unidadInicial);
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [modoLupa, setModoLupa] = useState(false);
  const [inicioLupa, setInicioLupa] = useState(null);
  const [finLupa, setFinLupa] = useState(null);
  const [modalLupa, setModalLupa] = useState(false);
  useEffect(() => {
    if (open) {
      setTipo(tipoInicial);
      setUnidad(unidadInicial === "volumen" && factor == null ? "nivel" : unidadInicial);
      setMostrarEtiquetas(true);
      setModoLupa(false);
      setInicioLupa(null);
      setFinLupa(null);
      setModalLupa(false);
    }
  }, [open, tipoInicial, unidadInicial, factor]);

  const litros = unidad === "volumen";
  const valor = (p) => litros ? p?.volumen : p?.nivel;
  const validos = useMemo(() => puntos.filter(p => Number.isFinite(p?.minutosDia) && Number.isFinite(litros ? p?.volumen : p?.nivel)), [puntos, litros]);
  const puntosIntervalo = useMemo(() => {
    if (!inicioLupa || !finLupa) return [];
    const desde = Math.min(inicioLupa.minutosDia, finLupa.minutosDia);
    const hasta = Math.max(inicioLupa.minutosDia, finLupa.minutosDia);
    return validos.filter(p => p.minutosDia >= desde && p.minutosDia <= hasta);
  }, [validos, inicioLupa, finLupa]);
  const seleccionarLupa = (event, _elementos, chart) => {
    if (!modoLupa || !validos.length || !chart?.scales?.x || !Number.isFinite(event.x)) return;
    const x = chart.scales.x.getValueForPixel(event.x);
    if (!Number.isFinite(x)) return;
    const cercano = validos.reduce((mejor, p) => Math.abs(p.minutosDia - x) < Math.abs(mejor.minutosDia - x) ? p : mejor, validos[0]);
    if (!inicioLupa || finLupa) {
      setInicioLupa(cercano);
      setFinLupa(null);
    } else if (cercano.minutosDia !== inicioLupa.minutosDia) {
      setFinLupa(cercano);
      setModalLupa(true);
    }
  };
  const grafico = useMemo(() => {
    const base = {
      label: litros ? "Volumen calculado (L)" : "Nivel SCADA (m)",
      data: validos.map(p => ({ x: p.minutosDia, y: litros ? p.volumen : p.nivel })),
      parsing: false, borderColor: AZUL, backgroundColor: "rgba(8,124,255,.05)",
      borderWidth: 2.4, fill: false, tension: 0, spanGaps: false,
      pointRadius: tipo === "original" ? 0 : 3, pointHoverRadius: 6, pointHitRadius: 10,
      segment: {
        borderColor: ({ p0DataIndex, p1DataIndex }) =>
          tipo !== "original" && validos[p1DataIndex]?.minutosDia - validos[p0DataIndex]?.minutosDia > 30 ? ROJO : AZUL
      },
    };
    if (tipo !== "operaciones") return { datasets: [base] };
    const destacados = operaciones.filter(o => Number.isFinite(litros ? o?.desde?.volumen : o?.desde?.nivel) && Number.isFinite(litros ? o?.hasta?.volumen : o?.hasta?.nivel)).map(o => ({
      label: o.tipo,
      data: [o.desde, o.hasta].map(p => ({ x: p.minutosDia, y: litros ? p.volumen : p.nivel })),
      parsing: false, borderColor: o.delta > 0 ? VERDE : ROJO_DARK,
      backgroundColor: o.delta > 0 ? VERDE : ROJO_DARK,
      borderWidth: 3.3, pointRadius: 5, pointHoverRadius: 7,
      fill: false, tension: 0, evento: o,
    }));
    return { datasets: [base, ...destacados] };
  }, [validos, operaciones, litros, tipo]);

  const opciones = useMemo(() => {
    // Un unico dominio vertical se calcula en METROS. Al mostrar litros,
    // se convierten tambien los limites por el mismo factor del tanque.
    // Asi la altura relativa y la forma de la curva permanecen iguales.
    const niveles = puntos.map(p => p?.nivel).filter(Number.isFinite);
    const bajoNivel = niveles.length ? Math.min(...niveles) : 0;
    const altoNivel = niveles.length ? Math.max(...niveles) : 1;
    const rangoNivel = Math.max(altoNivel - bajoNivel, 0.004);
    const margenNivel = Math.max(rangoNivel * 0.22, 0.003);
    const limiteInferiorNivel = Math.max(0, bajoNivel - margenNivel);
    const limiteSuperiorNivel = altoNivel + margenNivel;
    const escala = litros ? factor : 1;
    const limiteInferior = limiteInferiorNivel * escala;
    const limiteSuperior = limiteSuperiorNivel * escala;
    return {
      responsive: true, maintainAspectRatio: false, animation: false,
      onClick: seleccionarLupa,
      interaction: { mode: "nearest", intersect: false },
      layout: { padding: { top: 10, bottom: 10, left: 9, right: 16 } },
      plugins: {
        legend: { display: false },
        datalabels: { display: false, formatter: () => null },
        scadaModalEscalerasAnalisis: { activo: true, tipo, puntos: validos, eventos, operaciones },
        scadaModalEtiquetasInternas: { mostrar: mostrarEtiquetas, tipo, unidad, eventos, operaciones },
        scadaModalIntermitencias: { activo: tipo !== "original", tramos: tramosSinSenal },
        scadaRangoLupa: { activo: modoLupa, inicio: inicioLupa?.minutosDia, fin: finLupa?.minutosDia },
        tooltip: {
          callbacks: {
            title: items => {
              const minutos = Number(items[0]?.parsed?.x ?? 0);
              if (modoDia !== "inventario") return `${fechaConsultada} ${horaDe(minutos)}`;

              const minutosReales = (minutos + 480) % 1440;
              const anterior = new Date(`${fechaConsultada}T00:00:00Z`);
              anterior.setUTCDate(anterior.getUTCDate() - 1);
              const fechaPunto = minutos < 960
                ? anterior.toISOString().slice(0, 10)
                : fechaConsultada;
              return `${fechaPunto} ${horaDe(minutosReales)}`;
            },
            label: ctx => `${ctx.dataset.label}: ${formatear(ctx.parsed.y, litros ? 0 : 4)} ${litros ? "L" : "m"}`,
          }
        },
      },
      scales: {
        x: {
          type: "linear", min: 0, max: 1440,
          title: {
            display: true,
            text: modoDia === "inventario" ? "Hora · día inventario (08:00–08:00)" : "Hora del día",
            color: MARINO,
          },
          grid: { color: "#e4ebf4" },
          ticks: {
            autoSkip: false,
            stepSize: 60,
            color: "#58709a",
            font: { size: 10 },
            callback: valor => modoDia === "inventario"
              ? horaDe((Number(valor) + 480) % 1440)
              : horaDe(Number(valor)),
          },
        },
        y: {
          min: limiteInferior, max: limiteSuperior,
          title: { display: true, text: litros ? "Volumen (L)" : "Nivel (m)", color: MARINO },
          grid: { color: "#e4ebf4" },
          ticks: { maxTicksLimit: 8, color: "#58709a", callback: v => formatear(v, litros ? 0 : 3) }
        },
      },
    };
  }, [puntos, validos, litros, factor, mostrarEtiquetas, tipo, unidad, eventos, operaciones, tramosSinSenal, fechaConsultada, modoDia, modoLupa, inicioLupa, finLupa]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: modoLupa ? "#eef5ff" : "#f5faff", transition: "background-color .3s ease" } }}>
      <Box sx={{
        position: "relative",
        background: modoLupa ? "linear-gradient(105deg, #e8f2ff 0%, #f2f7ff 58%, #ffffff 100%)" : "white",
        borderBottom: modoLupa ? "2px solid #468fff" : "1px solid #dce7f3",
        boxShadow: modoLupa ? "0 4px 16px rgba(8,124,255,.08)" : "none",
        transition: "background .3s ease, border-color .3s ease, box-shadow .3s ease",
        px: 2,
        py: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
      }}>
        <Box>
          <Typography sx={{ color: modoLupa ? "#0862c4" : MARINO, fontSize: 17, fontWeight: 850, transition: "color .25s ease" }}>{tituloTanque} · {fechaConsultada}</Typography>
          <Typography
            sx={{
              position: { xs: "static", md: "absolute" },
              left: { md: "50%" },
              top: { md: "50%" },
              transform: { md: "translate(-50%, -50%)" },
              zIndex: 2,
              color: modoLupa ? "#0754ae" : "#087cff",
              fontSize: 17,
              fontWeight: 900,
              whiteSpace: "nowrap",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {modoDia === "inventario"
              ? "DÍA INVENTARIO · 08:00 A 08:00"
              : "DÍA NATURAL · 00:00 A 24:00"}
          </Typography>
          <Typography sx={{ color: modoLupa ? "#2166aa" : "#58709a", fontSize: 11, fontWeight: modoLupa ? 700 : 400 }}>
            {modoLupa ? "LUPA ACTIVA · Selecciona dos puntos en la gráfica" : "Análisis SCADA ampliado"} · {puntos.length} lecturas
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button size="small" variant={modoLupa ? "contained" : "outlined"} startIcon={<ZoomInOutlinedIcon />}
            onClick={() => { setModoLupa(v => !v); setInicioLupa(null); setFinLupa(null); setModalLupa(false); }}
            sx={{ textTransform: "none", fontWeight: 750, borderRadius: 1.4,
              bgcolor: modoLupa ? "#086ad7" : undefined,
              boxShadow: modoLupa ? "0 3px 12px rgba(8,106,215,.22)" : "none",
              "&:hover": { bgcolor: modoLupa ? "#075bbb" : undefined },
              transition: "all .25s ease"
            }}>{modoLupa ? "Salir de lupa" : "Modo Lupa"}</Button>
          {modoLupa 
             && <IconButton size="small" title="Limpiar intervalo" onClick={() => { setInicioLupa(null); setFinLupa(null); setModalLupa(false); }}>
                  <RestartAltOutlinedIcon />
                </IconButton>
           }
          <TextField select size="small" label="Análisis gráfico" value={tipo} onChange={e => setTipo(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="original">Lecturas originales</MenuItem>
            <MenuItem value="nodos">Nodos (lectura a lectura)</MenuItem>
            <MenuItem value="operaciones">Crestas / Valles</MenuItem>
          </TextField>
          {tipo !== "original" && (
            <IconButton
              size="small"
              onClick={() => setMostrarEtiquetas(v => !v)}
              title={mostrarEtiquetas ? "Ocultar etiquetas" : "Mostrar etiquetas"}
              aria-label={mostrarEtiquetas ? "Ocultar etiquetas" : "Mostrar etiquetas"}
              aria-pressed={mostrarEtiquetas}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.2,
                border: "1px solid #dce7f3",
                bgcolor: mostrarEtiquetas ? "#eaf3ff" : "#f5f7fa",
                color: mostrarEtiquetas ? "#087cff" : "#8fa3be",
                "&:hover": {
                  bgcolor: "#dcecff",
                  color: "#087cff",
                },
              }}
            >
              {mostrarEtiquetas ? (
                <VisibilityOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOffOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <ToggleButtonGroup size="small" exclusive value={unidad} onChange={(_, v) => { if (v) setUnidad(v); }}>
            <ToggleButton value="nivel" sx={{ textTransform: "none" }}>Nivel (m)</ToggleButton>
            <ToggleButton value="volumen" disabled={factor == null} sx={{ textTransform: "none" }}>Volumen (L)</ToggleButton>
          </ToggleButtonGroup>

          <IconButton onClick={onClose} aria-label="Cerrar modal"><CloseIcon /></IconButton>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, p: 1.5, display: "flex", transition: "background-color .3s ease" }}>
        <Box sx={{
          flex: 1, minHeight: 0, minWidth: 0, bgcolor: "#fff",
          border: modoLupa ? "2px solid #85b6fc" : "1px solid #dce7f3",
          boxShadow: modoLupa ? "0 0 0 4px rgba(8,124,255,.045)" : "none",
          borderRadius: 2, p: 1.2, position: "relative",
          "& canvas": { cursor: modoLupa ? "zoom-in" : "default" },
          transition: "border-color .3s ease, box-shadow .3s ease"
        }}>
          {validos.length ? (
            <Line data={grafico} options={opciones} plugins={[sombrasIntermitencias, escalerasAnalisis, etiquetasInternas, rangoLupaPlugin]} />
          ) : (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center", color: "#58709a" }}>Sin lecturas para esta unidad</Box>
          )}
          <IconButton
            onClick={() => setResumenAbierto(true)}
            aria-label="Abrir resumen del análisis"
            title="Resumen del análisis"
            sx={{
              position: "absolute",
              right: 32,
              bottom: 75,
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: "#087cff",
              color: "#fff",
              boxShadow: "0 5px 18px rgba(8,124,255,.35)",
              "&:hover": { bgcolor: "#065fc9" },
            }}
          >
            <AssessmentOutlinedIcon />
          </IconButton>
        </Box>
      </Box>
      <ModalIntervaloSCADA
        open={modalLupa && open}
        onClose={() => setModalLupa(false)}
        puntos={puntosIntervalo}
        tituloTanque={tituloTanque}
        fechaConsultada={fechaConsultada}
        modoDia={modoDia}
        factor={factor}
      />
      <ResumenTanqueSCADADrawer
        open={resumenAbierto && open}
        onClose={() => setResumenAbierto(false)}
        puntos={puntos}
        tituloTanque={tituloTanque}
        fechaConsultada={fechaConsultada}
        umbralVariacionL={300}
      />
    </Dialog>
  );
}
