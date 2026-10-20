import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useTanques } from "../../utils/Context/TanquesContext";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Box, Paper, Stack, Typography, Button, TextField, MenuItem, Menu, Alert, CircularProgress, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, ToggleButtonGroup, ToggleButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DonutSmallIcon from "@mui/icons-material/DonutSmall";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FunctionsIcon from "@mui/icons-material/Functions";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// const API_SCADA = import.meta.env.DEV

//   ? "https://ambiocomserver.onrender.com/api/scada/nivelesaveva"
//   : "https://ambiocomserver.onrender.com/api/scada/nivelesaveva";

const API_SCADA = "https://ambiocomserver.onrender.com/api/scada/nivelesaveva"

const SENSORES = ["LT650", "LT801A", "LT801B", "LT102A", "LT102B", "LT402A", "LT402B", "LT805", "LT806", "LT807", "LT808", "LT300A"];
const SENSORES_REGISTRADOS = new Set(SENSORES);
const AZUL = "#087cff", MARINO = "#081c6a", VERDE = "#009846", ROJO = "#f04321", BORDE = "#dce7f3";
const ETIQUETAS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const hoja = { bgcolor: "#fff", border: "1px solid #e7eef7", borderRadius: 2, boxShadow: "0 3px 14px rgba(32,76,129,.05)" };
const n = (v) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const positivo = (v) => { const num = n(v?.$numberDecimal ?? v); return num !== null && num > 0 ? num : null; };

const redondear = (valor, decimales = 2) => {
  const numero = n(valor);
  if (numero == null) return null;
  const escala = 10 ** decimales;
  return Math.sign(numero) * Math.round((Math.abs(numero) + Number.EPSILON) * escala) / escala;
};

const fmt = (valor, decimales = 2) => {

  const numero = redondear(valor, decimales);

  return numero == null ? "—" : numero.toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

};

const conUnidad = (v, u, d = 2) => v == null ? "—" : `${fmt(v, d)} ${u}`;
const signo = (v, u, d = 2) => v == null ? "—" : `${v > 0 ? "+" : ""}${fmt(v, d)} ${u}`;
const clave = (v) => String(v ?? "").toUpperCase().trim().replace(/^(LT|TK)[-\s]*/, "").replace(/[^A-Z0-9]/g, "");
const sensorDe = (nombre) => `LT${clave(nombre)}`;
const fechaBogota = () => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const x = (t) => p.find((e) => e.type === t)?.value;
  return `${x("year")}-${x("month")}-${x("day")}`;
};

function convertir(lectura, factor) {

  if (lectura == null) return { nivel: null, volumen: null };
  return {
    nivel: lectura,
    volumen: factor != null ? lectura * factor : null,
  };
}

const sombreadoSinSenal = {
  id: "sombreadoSinSenalCocli",
  beforeDatasetsDraw(chart, _args, opciones) {
    const tramos = opciones?.tramos || [];
    const { chartArea: area, ctx } = chart;
    const escalaX = chart.scales?.x;
    if (!tramos.length || !area || !escalaX) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    ctx.clip();

    tramos.forEach(({ desde, hasta }) => {
      const x1 = escalaX.getPixelForValue(desde);
      const x2 = escalaX.getPixelForValue(hasta);
      if (!Number.isFinite(x1) || !Number.isFinite(x2)) return;

      // Franja roja tenue únicamente sobre el intervalo sin señal.
      ctx.fillStyle = "rgba(240, 67, 33, 0.10)";
      ctx.fillRect(Math.min(x1, x2), area.top, Math.abs(x2 - x1), area.bottom - area.top);
    });

    ctx.restore();
  },
};

const deltaEscalonado = {

  id: "deltaEscalonadoCocli",

  afterDatasetsDraw(chart, _args, opts) {
    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;
    const area = chart.chartArea;
    if (!meta || meta.hidden || !area) return;
    const esVolumen = opts?.modo === "volumen";
    const unidad = esVolumen ? "L" : "m";
    const decimales = esVolumen ? 0 : 2;
    const eventos = (opts?.eventos || []).filter((e) => {
      const valor = esVolumen ? e.deltaL : e.delta;
      return valor != null && valor !== 0;
    });

    const ocupados = [];

    const etiqueta = (indice, texto, color, desplazamiento) => {
      const punto = meta.data[indice];
      if (!punto || punto.skip) return;
      ctx.save();
      ctx.font = "bold 11px Arial";
      const ancho = ctx.measureText(texto).width + 20;
      const alto = 24;
      const x = Math.max(area.left + 2, Math.min(punto.x - ancho / 2, area.right - ancho - 2));
      const y = Math.max(area.top + 2, Math.min(punto.y + desplazamiento - alto / 2, area.bottom - alto - 2));
      if (ocupados.some((r) => x < r.x + r.ancho + 5 && x + ancho + 5 > r.x && y < r.y + r.alto + 5 && y + alto + 5 > r.y)) {
        ctx.restore();
        return;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, ancho, alto, 5);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = MARINO;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(texto, x + ancho / 2, y + alto / 2);
      ocupados.push({ x, y, ancho, alto });
      ctx.restore();
    };

    eventos.forEach((e) => {

      const a = meta.data[e.anterior];
      const b = meta.data[e.indice];
      if (!a || !b || a.skip || b.skip) return;
      ctx.save();
      ctx.strokeStyle = e.delta > 0 ? VERDE : ROJO;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();

    });

    if (!opts?.etiquetas) return;

    const puntos = (opts.puntos || []).filter((p) => (esVolumen ? p.volumen : p.nivel) != null);
    if (puntos.length) {
      const p = puntos[0];
      etiqueta(p.indice, conUnidad(esVolumen ? p.volumen : p.nivel, unidad, decimales), AZUL, -29);
    }

    [...eventos]

      .sort((a, b) => Math.abs(esVolumen ? b.deltaL : b.delta) - Math.abs(esVolumen ? a.deltaL : a.delta))
      .slice(0, 8)
      .sort((a, b) => a.indice - b.indice)
      .forEach((e) => {

        const valor = esVolumen ? e.deltaL : e.delta;
        etiqueta(e.indice, signo(valor, unidad, decimales), e.delta > 0 ? VERDE : ROJO, e.delta > 0 ? -31 : 31);

      });

    if (puntos.length > 1) {
      const p = puntos[puntos.length - 1];
      etiqueta(p.indice, conUnidad(esVolumen ? p.volumen : p.nivel, unidad, decimales), AZUL, -29);
    }

  },

};



function MiniDato({ icono, titulo, valor }) {

  return <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.1, minHeight: 56, bgcolor: "#f8fbff", border: `1px solid ${BORDE}`, borderRadius: 1.5, minWidth: 0 }}>
    <Box sx={{ color: AZUL, display: "flex" }}>{icono}</Box>
    <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 11, color: "#58709c" }}>{titulo}</Typography>
      <Typography sx={{ color: MARINO, fontWeight: 800, fontSize: 12.5, overflowWrap: "anywhere" }}>{valor}</Typography></Box>

  </Box>;

}



function Indicador({ icono, titulo, valor, detalle, color = MARINO, ancho = false }) {

  return <Box sx={{ gridColumn: ancho ? "span 2" : "auto", border: `1px solid ${BORDE}`, borderRadius: 1.5, minHeight: 69, px: 1.1, py: .7, display: "flex", alignItems: "center", gap: 1 }}>
    <Box sx={{ color: color === MARINO ? AZUL : color, display: "flex", minWidth: 38 }}>{icono}</Box>
    <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 11.5, color: "#42608d" }}>{titulo}</Typography>
      <Typography sx={{ color, fontWeight: 850, fontSize: { xs: 16, xl: 19 }, lineHeight: 1.18 }}>{valor}</Typography>
      {detalle && <Typography sx={{ fontSize: 11, color: "#5c78a1" }}>{detalle}</Typography>}</Box>
  </Box>;
}

export default function AnalisisDeNivelesTanquesSCADA({

  nombreTanque = "801A", 
  onTanqueChange, 
  apiBase = API_SCADA,

}) {

  const { tanques: catalogo, loading: cargandoCatalogo } = useTanques();
  const [tanque, setTanque] = useState(() => clave(nombreTanque) || "801A");
  const [fecha, setFecha] = useState(fechaBogota);
  const [fechaConsultada, setFechaConsultada] = useState(fechaBogota);
  const [actualizar, setActualizar] = useState(0);
  const [lecturas, setLecturas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [visualizacion, setVisualizacion] = useState("nivel");
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [menuExport, setMenuExport] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {

    const siguiente = clave(nombreTanque);

    if (siguiente) {
      setTanque(siguiente);
      setVisualizacion("nivel");
    }

  }, [nombreTanque]);

  const seleccionarTanque = (valor) => {
    const siguiente = clave(valor);
    if (!siguiente) return;
    setTanque(siguiente);
    setVisualizacion("nivel");
    onTanqueChange?.(siguiente);
  };

  useEffect(() => {

    const ctrl = new AbortController();
    setCargando(true); setError("");
    axios.get(`${apiBase.replace(/\/$/, "")}/por-fecha/${fechaConsultada}`, { withCredentials: true, signal: ctrl.signal })
      .then(({ data }) => {
        if (!Array.isArray(data?.data)) throw Error("La respuesta SCADA no contiene data[]");
        setLecturas(data.data);
      }).catch((e) => {
        if (e.code === "ERR_CANCELED" || ctrl.signal.aborted) return;
        const estado = e.response?.status;
        const detalle = e.response?.data?.message || e.message;
        setError(
          estado === 401
            ? "SCADA: sesión no autenticada (401). Verifica la cookie y los permisos del backend."
            : estado === 403
              ? "SCADA: acceso denegado (403)."
              : estado === 404
                ? "SCADA: ruta por-fecha no encontrada (404) en el servidor consultado."
                : `SCADA: ${detalle}`
        );

        setLecturas([]);

      }).finally(() => { if (!ctrl.signal.aborted) setCargando(false); });

    return () => ctrl.abort();

  }, [apiBase, fechaConsultada, actualizar]);

  const catalogoPorNombre = useMemo(
    () => new Map(catalogo.filter((t) => clave(t?.NombreTanque)).map((t) => [clave(t.NombreTanque), t])),
    [catalogo]
  );

  // Lista todos los tanques de Gestión de Tanques, no solamente los que tienen sensor.

  const tanquesDisponibles = useMemo(() =>

    [...catalogoPorNombre.keys()].sort((a, b) => a.localeCompare(b, "es", { numeric: true })),
    [catalogoPorNombre]

  );

  // La colección por fecha contiene todos los sensores; la gráfica toma solamente uno.

  // Complementamos el esquema conocido con señales LT presentes en la respuesta.

  const sensoresDisponibles = useMemo(() => {

    const encontrados = new Set(SENSORES_REGISTRADOS);

    lecturas.forEach((registro) => {

      Object.keys(registro || {}).forEach((campo) => {

        if (/^LT[A-Z0-9]+$/i.test(campo)) encontrados.add(campo.toUpperCase());

      });

    });

    return encontrados;

  }, [lecturas]);

  const sensorSeleccionado = sensorDe(tanque);
  const tieneSensor = sensoresDisponibles.has(sensorSeleccionado);
  const datosTanque = catalogoPorNombre.get(clave(tanque));
  const factor = positivo(datosTanque?.Factor);
  const capacidad = positivo(datosTanque?.VolumenTotal);
  const producto = datosTanque?.Disposicion || "Sin configurar";
  const esVolumen = visualizacion === "volumen";
  const unidadNivel = "m";
  const tituloTanque = `TK-${clave(tanque)}`;

  const puntos = useMemo(() => {
    const datos = ETIQUETAS.map((hora, indice) => ({ indice, hora, lectura: null, horaReal: null }));

    [...lecturas].filter((r) => r.fecha === fechaConsultada)
      .sort((a, b) => String(a.hora).localeCompare(String(b.hora)) || String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")))
      .forEach((r) => {
        const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(String(r.hora || ""));
        if (!match) return;
        const h = Number(match[1]), m = Number(match[2]);
        if (h > 23 || m > 59) return;
        const valor = tieneSensor ? n(r[sensorSeleccionado]) : null;
        if (valor != null) { const indice = h * 2 + Math.floor(m / 30); datos[indice].lectura = valor; datos[indice].horaReal = r.hora; }
      });

    return datos.map((p) => {

      const { nivel, volumen } = convertir(p.lectura, factor);
      return { ...p, nivel, volumen, valor: nivel };

    });

  }, [lecturas, fechaConsultada, sensorSeleccionado, tieneSensor, factor]);

  const analisis = useMemo(() => {
    const validos = puntos.filter((p) => p.valor != null);
    const inicial = validos[0] || null, final = validos[validos.length - 1] || null;
    const eventos = inicial ? [{ ...inicial, tipo: "Inicio", delta: null, deltaL: null }] : [];
    let subidas = 0, bajadas = 0, subidasL = 0, bajadasL = 0;
    let mayorSubida = null, mayorBajada = null, movimientosSinLitros = false;

    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1], b = puntos[i];

      if (a.valor == null || b.valor == null) continue;
      const delta = b.valor - a.valor;
      const deltaL = a.volumen != null && b.volumen != null ? b.volumen - a.volumen : null;

      if (delta === 0) continue;
      const ev = { ...b, anterior: i - 1, delta, deltaL, tipo: delta > 0 ? "Subida" : "Bajada" };

      eventos.push(ev);

      if (delta > 0) { subidas += delta; if (!mayorSubida || delta > mayorSubida.delta) mayorSubida = ev; }

      else { bajadas += -delta; if (!mayorBajada || delta < mayorBajada.delta) mayorBajada = ev; }

      if (deltaL == null) movimientosSinLitros = true;

      else if (deltaL > 0) subidasL += deltaL;

      else bajadasL += -deltaL;

    }

    const promedio = validos.length ? validos.reduce((s, p) => s + p.valor, 0) / validos.length : null;
    const promedioL = validos.length && validos.every((p) => p.volumen != null)

      ? validos.reduce((s, p) => s + p.volumen, 0) / validos.length : null;

    return {
      inicial, final, eventos, promedio, promedioL, subidas, bajadas,
      subidasL: inicial?.volumen == null || movimientosSinLitros ? null : subidasL,
      bajadasL: inicial?.volumen == null || movimientosSinLitros ? null : bajadasL,
      mayorSubida, mayorBajada,
      neto: inicial && final ? final.valor - inicial.valor : null,
      netoL: inicial?.volumen != null && final?.volumen != null ? final.volumen - inicial.volumen : null,
    };

  }, [puntos]);

  const tramosSinSenal = useMemo(() => {
    const validos = puntos.filter((p) => p.nivel != null);
    const tramos = [];

    for (let i = 1; i < validos.length; i++) {
      const anterior = validos[i - 1];
      const siguiente = validos[i];
      if (siguiente.indice - anterior.indice <= 1) continue;

      tramos.push({
        desde: anterior.indice,
        hasta: siguiente.indice,
        horaDesde: anterior.hora,
        horaHasta: siguiente.hora,
        minutos: (siguiente.indice - anterior.indice) * 30,
      });
    }

    return tramos;
  }, [puntos]);

  const fueraDeCapacidad = capacidad != null && puntos.some(

    (p) => p.volumen != null && (p.volumen < 0 || p.volumen > capacidad * 1.005)

  );

  const dataGrafico = useMemo(() => ({

    labels: ETIQUETAS,

    datasets: [{
      label: esVolumen ? "Volumen (L)" : "Nivel (m)",
      data: puntos.map((p) => redondear(esVolumen ? p.volumen : p.nivel, esVolumen ? 0 : 2)),
      borderColor: AZUL, backgroundColor: "rgba(8,124,255,.11)", fill: "origin", tension: .12,
      pointRadius: 2.7, pointHoverRadius: 5, borderWidth: 2.8,
      spanGaps: true,
      segment: {
        borderColor: ({ p0DataIndex, p1DataIndex }) =>
          p1DataIndex - p0DataIndex > 1 ? ROJO : AZUL,
      },
      pointBackgroundColor: AZUL,

    }],

  }), [puntos, esVolumen]);

  const opcionesGrafico = useMemo(() => ({

    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { intersect: false, mode: "nearest" },
    layout: { padding: { top: 17, right: 15, left: 4 } },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      sombreadoSinSenalCocli: { tramos: tramosSinSenal },
      deltaEscalonadoCocli: { eventos: analisis.eventos, puntos, etiquetas: mostrarEtiquetas, modo: visualizacion },
      tooltip: {
        callbacks: {
          title: (items) => `${fechaConsultada} ${ETIQUETAS[items[0]?.dataIndex] || ""}`,
          label: (ctx) => {
            const p = puntos[ctx.dataIndex];
            return [conUnidad(p.nivel, "m", 2), conUnidad(p.volumen, "L", 0)];
          },
        },
      },
    },

    scales: {
      x: { title: { display: true, text: "Hora del día", color: MARINO, font: { weight: "bold" } }, ticks: { maxTicksLimit: 13, maxRotation: 0, color: "#54709a" }, grid: { color: "#e4ebf4" } },
      y: {
        beginAtZero: true,
        title: { display: true, text: esVolumen ? "Volumen (L)" : "Nivel (m)", color: MARINO, font: { weight: "bold" } },
        grid: { color: "#e4ebf4" },
        ticks: { color: "#54709a", callback: (v) => fmt(Number(v), esVolumen ? 0 : 2) },
      },
    },
  }), [puntos, analisis.eventos, tramosSinSenal, fechaConsultada, visualizacion, esVolumen, mostrarEtiquetas]);

  const consultar = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { setError("Selecciona una fecha válida"); return; }
    setFechaConsultada(fecha);
    setActualizar((x) => x + 1);
  };

  const filas = analisis.eventos;

  const exportarCSV = () => {
    const contenido = Papa.unparse(filas.map((e) => ({
      Fecha: fechaConsultada, Tanque: tituloTanque, Hora: e.hora,
      Nivel: redondear(e.valor, 2) ?? "", Unidad: unidadNivel,
      Volumen_L: redondear(e.volumen, 0) ?? "",
      Cambio_nivel: redondear(e.delta, 2) ?? "",
      Cambio_L: redondear(e.deltaL, 0) ?? "", Movimiento: e.tipo,
    })), { delimiter: ";" });

    const url = URL.createObjectURL(new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `SCADA_${tituloTanque}_${fechaConsultada}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMenuExport(null);
  };

  const exportarPDF = () => {

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(15); doc.text(`Monitoreo diario ${tituloTanque} - ${fechaConsultada}`, 13, 14);
    try { const canvas = chartRef.current?.canvas; if (canvas) doc.addImage(canvas.toDataURL("image/png"), "PNG", 13, 21, 269, 105); }
    catch (err) { console.warn("No se pudo incluir la gráfica", err); }
    autoTable(doc, {
      startY: 134, head: [["Hora", "Nivel", "Volumen (L)", "Cambio nivel", "Cambio L", "Variación"]],
      body: filas.map((e) => [e.hora, fmt(e.valor), fmt(e.volumen, 0), e.delta == null ? "—" : signo(e.delta, unidadNivel), e.deltaL == null ? "—" : signo(e.deltaL, "L", 0), e.tipo]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [8, 124, 255] },
    });

    doc.save(`SCADA_${tituloTanque}_${fechaConsultada}.pdf`); setMenuExport(null);

  };

  const ultimo = analisis.final ? `${fechaConsultada} ${analisis.final.horaReal || analisis.final.hora}` : "Sin lecturas";
  const l = (v) => conUnidad(v, "L", 0);
  const nivel = (v) => conUnidad(v, unidadNivel);
  const mayor = (e) => e ? `${signo(e.delta, unidadNivel)}${e.deltaL != null ? ` (${signo(e.deltaL, "L", 0)})` : ""} a las ${e.hora}` : "—";

  return <Box sx={{ minHeight: "100%", bgcolor: "#f5faff", p: { xs: 1.5, md: 2 }, color: MARINO }}>
    {/* Encabezado de página: no repetimos la barra global de Coclí */}
    <Stack direction="row" alignItems="center" gap={.6} sx={{ mb: 1, color: "#48648d" }}>
      <Typography sx={{ fontSize: 13 }}>Tanques</Typography><ChevronRightIcon fontSize="small" />
      <Typography sx={{ fontSize: 13 }}>Monitoreo diario</Typography><ChevronRightIcon fontSize="small" />
      <Typography sx={{ fontSize: 13, color: AZUL, fontWeight: 800 }}>{tituloTanque}</Typography>
    </Stack>

    <Typography sx={{ fontSize: { xs: 25, md: 35 }, fontWeight: 900, color: MARINO, lineHeight: 1.15 }}>
      Monitoreo diario del tanque {tituloTanque}
    </Typography>

    <Typography sx={{ fontSize: { xs: 13, md: 16 }, color: "#55709a", mb: 1.3 }}>
      Seguimiento del comportamiento del tanque durante el día con intervalos de 30 minutos.
    </Typography>

    {/* Barra única: filtros a la izquierda e información de inventario a la derecha */}

    <Paper elevation={0} sx={{ ...hoja, p: 1.5, mb: 1.2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))", xl: "minmax(170px,1.8fr) minmax(155px,1.3fr) auto auto repeat(4,minmax(114px,1fr))" }, gap: 1, alignItems: "end" }}>
        <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Tanque</Typography>
          <TextField select fullWidth size="small" value={tanque} onChange={(e) => seleccionarTanque(e.target.value)}
            sx={{ "& .MuiInputBase-root": { height: 38 }, "& .MuiSelect-select": { fontSize: 13 } }}>
            {!tanquesDisponibles.includes(tanque) && (
              <MenuItem value={tanque}>TK-{tanque} (selección externa)</MenuItem>
            )}
            {cargandoCatalogo && <MenuItem disabled>Cargando tanques...</MenuItem>}
            {tanquesDisponibles.map((nombre) => (
              <MenuItem key={nombre} value={nombre}>
                TK-{nombre}
                {catalogoPorNombre.get(nombre)?.Disposicion ? ` (${catalogoPorNombre.get(nombre).Disposicion})` : ""}
                {!sensoresDisponibles.has(sensorDe(nombre)) ? " — Sin sensor SCADA" : ""}
              </MenuItem>
            ))}
          </TextField></Box>

        <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Fecha</Typography>
          <TextField type="date" size="small" fullWidth value={fecha} onChange={(e) => setFecha(e.target.value)}
            sx={{ "& .MuiInputBase-root": { height: 38 }, "& .MuiInputBase-input": { fontSize: 13 } }} /></Box>
        <Button variant="contained" startIcon={<SearchIcon />} disabled={cargando} onClick={consultar}
          sx={{ height: 38, bgcolor: AZUL, textTransform: "none", boxShadow: "none", fontWeight: 750 }}>Consultar</Button>
        <Box><Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} endIcon={<KeyboardArrowDownIcon />}
          disabled={!tieneSensor || !filas.length} onClick={(e) => setMenuExport(e.currentTarget)}
          sx={{ height: 38, textTransform: "none", borderColor: AZUL, color: AZUL, fontWeight: 750 }}>Exportar</Button>
          <Menu anchorEl={menuExport} open={Boolean(menuExport)} onClose={() => setMenuExport(null)}>
            <MenuItem onClick={exportarCSV}>Exportar CSV</MenuItem><MenuItem onClick={exportarPDF}>Exportar PDF</MenuItem>
          </Menu></Box>

        <MiniDato icono={<AccessTimeIcon />} titulo="Última actualización" valor={ultimo} />
        <MiniDato icono={<Inventory2OutlinedIcon />} titulo="Capacidad" valor={l(capacidad)} />
        <MiniDato icono={<WaterDropIcon />} titulo="Producto" valor={producto} />
        <MiniDato icono={<MonitorHeartIcon />} titulo="Frecuencia" valor="30 min" />

      </Box>

    </Paper>

    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
    {!cargandoCatalogo && !catalogo.length && <Alert severity="warning" sx={{ mb: 1 }}>
      No hay tanques disponibles en TanquesContext. Verifica que TanquesProvider envuelva esta pantalla y que la sesión esté autenticada.
    </Alert>}

    {tieneSensor && fueraDeCapacidad && <Alert severity="warning" sx={{ mb: 1 }}>
      El volumen calculado supera la capacidad del tanque ({conUnidad(capacidad, "L", 0)}). Verifica el factor de calibración y la escala de lectura LT.
    </Alert>}

    {cargando && <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}><CircularProgress size={16} />Consultando AVEVA...</Stack>}

    {!tieneSensor ? (

      <Paper elevation={0} sx={{ ...hoja, p: { xs: 3, md: 5 }, textAlign: "center" }}>
        <MonitorHeartIcon sx={{ fontSize: 48, color: "#8fa3be", mb: 1 }} />
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: MARINO, mb: 0.8 }}>
          Este tanque no cuenta aún con sensores de nivel automatizados.
        </Typography>

        <Typography sx={{ color: "#58709c", fontSize: 13 }}>
          TK-{tanque} no tiene una señal de nivel registrada en Niveles SCADA.
          Puedes seleccionar otro tanque para consultar su monitoreo diario.
        </Typography>

      </Paper>

    ) : (

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,2.25fr) minmax(345px,1fr)" }, gap: 1.2, alignItems: "stretch" }}>
        {/* IZQUIERDA: gráfica y eventos */}

        <Paper elevation={0} sx={{ ...hoja, p: 1.7, minWidth: 0 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" gap={1}><BarChartIcon sx={{ color: AZUL }} />
              <Typography sx={{ fontWeight: 800, color: "#0636ad", fontSize: 16 }}>{esVolumen ? "Volumen del tanque durante el día" : "Nivel del tanque durante el día"}</Typography></Stack>
            <Stack direction="row" alignItems="center" gap={1} useFlexGap flexWrap="wrap">

              <Typography sx={{ fontSize: 10, color: "#3f5b81" }}>🔵 {esVolumen ? "Volumen (L)" : "Nivel (m)"}</Typography>
              <Typography sx={{ fontSize: 10, color: VERDE }}>┄ Subida</Typography>
              <Typography sx={{ fontSize: 10, color: ROJO }}>┄ Bajada</Typography>

              {tramosSinSenal.length > 0 && (
                <Typography sx={{ fontSize: 10, color: ROJO }}>━ Sin señal (&gt;30 min)</Typography>
              )}

              <ToggleButtonGroup
                value={visualizacion}
                exclusive
                size="small"
                onChange={(_e, value) => { if (value) setVisualizacion(value); }}
                sx={{ height: 32, "& .MuiToggleButton-root": { fontSize: 11, px: 1.3, py: 0.3, textTransform: "none" } }}
              >

                <ToggleButton value="nivel">Nivel (m)</ToggleButton>
                <ToggleButton value="volumen" disabled={factor == null}>Volumen (L)</ToggleButton>

              </ToggleButtonGroup>

              <Button size="small" onClick={() => setMostrarEtiquetas((v) => !v)} sx={{ fontSize: 10, textTransform: "none", p: 0 }}>
                {mostrarEtiquetas ? "Ocultar etiquetas" : "Ver etiquetas"}
              </Button>

            </Stack>
          </Stack>

          <Box sx={{ height: { xs: 300, md: 330, xl: 345 }, mb: 1.2 }}>
            {analisis.inicial ? <Line data={dataGrafico} options={opcionesGrafico} plugins={[sombreadoSinSenal, deltaEscalonado]} ref={chartRef} />
              : <Box sx={{ height: "100%", display: "grid", placeItems: "center", border: `1px dashed ${BORDE}`, borderRadius: 1.5, fontSize: 13, color: "#56739d" }}>
                Sin lecturas para el tanque y la fecha seleccionados</Box>}
          </Box>

          {tramosSinSenal.length > 0 && (
            <Typography sx={{ color: "#9a4b36", fontSize: 10.5, mb: 1 }}>
              Tramos rojos: ausencia de lecturas SCADA durante más de 30 minutos.
              La unión es visual; no representa una medición ni se suma como entrada o salida.
            </Typography>
          )}

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: .7 }}><CalendarMonthIcon sx={{ color: AZUL }} />

            <Typography sx={{ fontWeight: 800, color: "#0636ad", fontSize: 15 }}>Eventos registrados durante el día (intervalos de 30 minutos)</Typography></Stack>

          <TableContainer sx={{ maxHeight: 300, border: `1px solid ${BORDE}`, borderRadius: 1.1 }}>

            <Table stickyHeader size="small" sx={{ minWidth: 640, tableLayout: "fixed", "& .MuiTableCell-root": { fontSize: 11.5, px: .6, py: .4, borderRight: `1px solid ${BORDE}` }, "& .MuiTableHead-root .MuiTableCell-root": { bgcolor: "#eff5fc", fontWeight: 800, textAlign: "center" } }}>
              <TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Nivel ({unidadNivel})</TableCell><TableCell>Volumen (L)</TableCell><TableCell>Cambio ({unidadNivel})</TableCell><TableCell>Cambio (L)</TableCell><TableCell>Tipo de movimiento</TableCell></TableRow></TableHead>
              <TableBody>{!filas.length ? <TableRow><TableCell colSpan={6} align="center">No hay datos disponibles</TableCell></TableRow> : filas.map((e) => <TableRow key={e.hora} sx={{ bgcolor: e.tipo === "Subida" ? "#eefbf2" : e.tipo === "Bajada" ? "#fff5f0" : "#fff" }}>
                <TableCell align="center">{e.hora}</TableCell><TableCell align="center">{fmt(e.valor)}</TableCell>
                <TableCell align="center">{fmt(e.volumen, 0)}</TableCell>
                <TableCell align="center">{e.delta == null ? "0,00" : signo(e.delta, "")}</TableCell>
                <TableCell align="center">{e.deltaL == null ? e.tipo === "Inicio" ? "0" : "—" : signo(e.deltaL, "", 0)}</TableCell>
                <TableCell align="center" sx={{ color: e.tipo === "Subida" ? VERDE : e.tipo === "Bajada" ? ROJO : MARINO }}>
                  {e.tipo === "Subida" ? <><ArrowUpwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Subida*</> : e.tipo === "Bajada" ? <><ArrowDownwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Bajada*</> : "—"}
                </TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </TableContainer>
          {factor == null && <Typography sx={{ mt: 1, color: "#8b6c2e", fontSize: 11 }}>El tanque no tiene un Factor (L/m) válido en el catálogo. Se muestra el nivel en metros; la vista de volumen permanecerá deshabilitada.</Typography>}
        </Paper>

        {/* DERECHA: indicadores y balance en el orden de tu captura */}

        <Paper elevation={0} sx={{ ...hoja, p: 1.7, minWidth: 0 }}>

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: .8 }}><DonutSmallIcon sx={{ color: AZUL, fontSize: 26 }} />
            <Typography sx={{ color: "#0636ad", fontSize: 16, fontWeight: 800 }}>Indicadores del día</Typography></Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen inicial" valor={l(analisis.inicial?.volumen)} detalle={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen final" valor={l(analisis.final?.volumen)} detalle={nivel(analisis.final?.valor)} />
            <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Volumen ingresado total*" valor={l(analisis.subidasL)} color={VERDE} />
            <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Volumen salido total*" valor={l(analisis.bajadasL)} color={ROJO} />
            <Indicador icono={<FunctionsIcon fontSize="large" />} titulo="Promedio ponderado de volumen" valor={l(analisis.promedioL)} ancho />
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel inicial" valor={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel final" valor={nivel(analisis.final?.valor)} />
            <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Metros que subió" valor={analisis.inicial ? conUnidad(analisis.subidas, unidadNivel) : "—"} color={VERDE} />
            <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Metros que bajó" valor={analisis.inicial ? conUnidad(analisis.bajadas, unidadNivel) : "—"} color={ROJO} />
            <Indicador icono={<ShowChartIcon fontSize="large" />} titulo="Promedio ponderado de nivel" valor={nivel(analisis.promedio)} ancho />
          </Box>

          <Box sx={{ mt: 1, border: `1px solid ${BORDE}`, borderRadius: 1.5, bgcolor: "#f7fbff", overflow: "hidden" }}>
            <Stack direction="row" gap={1} alignItems="center" sx={{ bgcolor: "#e8f4ff", p: .75 }}>
              <BarChartIcon sx={{ color: AZUL }} /><Typography sx={{ color: AZUL, fontWeight: 800, fontSize: 14 }}>Balance del día</Typography>
            </Stack>

            <Box sx={{ px: 1.25, py: .8, display: "grid", gridTemplateColumns: "36% 64%", rowGap: .25, fontSize: 12 }}>
              <strong>Inicio:</strong><span>{l(analisis.inicial?.volumen)} ({nivel(analisis.inicial?.valor)})</span>
              <strong>Final:</strong><span>{l(analisis.final?.volumen)} ({nivel(analisis.final?.valor)})</span>
              <strong>Variación neta:</strong><span style={{ color: analisis.neto < 0 ? ROJO : VERDE, fontWeight: 750 }}>{signo(analisis.netoL, "L", 0)} ({signo(analisis.neto, unidadNivel)})</span>
              <strong>Mayor subida:</strong><span style={{ color: VERDE, fontWeight: 700 }}>{mayor(analisis.mayorSubida)}</span>
              <strong>Mayor bajada:</strong><span style={{ color: ROJO, fontWeight: 700 }}>{mayor(analisis.mayorBajada)}</span>
            </Box>

          </Box>
          <Typography sx={{ mt: .9, fontSize: 10.5, color: "#6680a3", lineHeight: 1.4 }}>
            *Las subidas y bajadas son variaciones de nivel observadas, no ingresos ni salidas logísticos confirmados.
            El promedio pondera únicamente los bloques válidos de 30 minutos. Si faltan lecturas, el balance neto puede diferir de los movimientos acumulados.
            Los factores, capacidad y producto proceden del catálogo actual de Gestión de Tanques.
          </Typography>
        </Paper>
      </Box>

    )}

  </Box>;

}
