import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useTanques } from "../../utils/Context/TanquesContext";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

import {
  Box, Paper, Stack, Typography, Button, TextField, MenuItem, Menu, Alert,
  CircularProgress, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  ToggleButtonGroup, ToggleButton, IconButton
} from "@mui/material";

import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SearchIcon from "@mui/icons-material/Search";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import GraficaSCADAModal from "./utils_SCADA/AnalisisNivelesTanquesSCADAModal";
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

const API_SCADA = "http\://localhost:4041/api/scada/nivelesaveva"

const SENSORES = ["LT650", "LT801A", "LT801B", "LT102A", "LT102B", "LT402A", "LT402B", "LT805", "LT806", "LT807", "LT808", "LT300A"];
const SENSORES_REGISTRADOS = new Set(SENSORES);
const AZUL = "#087cff", MARINO = "#081c6a", VERDE = "#009846", ROJO = "#f04321", MORADO = "#7b3ff2", BORDE = "#dce7f3";
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

const obtenerDiaAnterior = (fecha) => {
  const fechaUTC = new Date(`${fecha}T00:00:00Z`);
  fechaUTC.setUTCDate(fechaUTC.getUTCDate() - 1);
  return fechaUTC.toISOString().slice(0, 10);
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

      // Franja roja intervalo sin señal.
      ctx.fillStyle = "rgba(240, 67, 33, 0.10)";
      ctx.fillRect(Math.min(x1, x2), area.top, Math.abs(x2 - x1), area.bottom - area.top);

    });
    ctx.restore();
  },
};

function dibujarEtiquetasConGuia(chart, elementos) {
  const { ctx, chartArea: area } = chart;
  if (!area || !elementos.length) return;
  const ocupados = [];
  const margen = 5;
  const distanciaMinima = 32;
  const separacion = 4;

  ctx.save();
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const ordenados = elementos.map((e, i) => ({ ...e, orden: i }))
    .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0) || a.orden - b.orden);

  for (const e of ordenados) {
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !e.texto) continue;
    const ancho = ctx.measureText(e.texto).width + 16;
    const alto = 21;
    if (ancho > area.right - area.left - margen * 2) continue;

    const preferencia = e.preferirAbajo ? 1 : -1;
    const candidatos = [];

    for (const distancia of [38, 61, 86, 113, 143, 177]) {
      for (const lado of [preferencia, -preferencia]) {
        for (const dx of [0, -ancho * 0.65, ancho * 0.65, -ancho * 1.25, ancho * 1.25]) {
          candidatos.push({
            x: Math.max(area.left + margen, Math.min(e.x + dx - ancho / 2, area.right - ancho - margen)),
            y: e.y + lado * distancia - alto / 2,
          });
        }
      }
    }
    const solapa = (a, b) => a.x < b.x + b.w + separacion &&
      a.x + a.w + separacion > b.x && a.y < b.y + b.h + separacion &&
      a.y + a.h + separacion > b.y;
    let elegido = null;
    for (const c of candidatos) {
      const rect = { ...c, w: ancho, h: alto };
      if (rect.y < area.top + margen || rect.y + alto > area.bottom - margen) continue;
      if (ocupados.some(o => solapa(rect, o))) continue;
      elegido = rect;
      break;
    }
    if (!elegido) continue;

    const centroX = elegido.x + ancho / 2;
    const centroY = elegido.y + alto / 2;
    const destinoX = Math.max(elegido.x + 5, Math.min(e.x, elegido.x + ancho - 5));
    const destinoY = e.y < elegido.y ? elegido.y : e.y > elegido.y + alto ? elegido.y + alto : centroY;

    // Línea fina desde la medición hasta el borde del rótulo.
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    if (Math.hypot(destinoX - e.x, destinoY - e.y) > distanciaMinima) {
      ctx.lineTo(e.x + (destinoX - e.x) * 0.35, e.y + (destinoY - e.y) * 0.35);
    }
    ctx.lineTo(destinoX, destinoY);
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(e.x, e.y, 2.3, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(elegido.x, elegido.y, ancho, alto, 5);
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1.15;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = e.color;
    ctx.fillText(e.texto, centroX, centroY);
    ocupados.push(elegido);
  }
  ctx.restore();
}

const deltaEscalonado = {
  id: "deltaEscalonadoCocli",
  afterDatasetsDraw(chart, _args, opts) {
    const meta = chart.getDatasetMeta(0);
    if (!meta || meta.hidden || !chart.chartArea) return;
    const ctx = chart.ctx;
    const esVolumen = opts?.modo === "volumen";
    const unidad = esVolumen ? "L" : "m";
    const decimales = esVolumen ? 0 : 2;
    const eventos = (opts?.eventos || []).filter(e => e.delta != null && e.delta !== 0);

    // Las líneas escalonadas originales siguen siendo visuales; no alteran lecturas.
    eventos.forEach(e => {
      const a = meta.data[e.anterior];
      const b = meta.data[e.indice];
      if (!a || !b || a.skip || b.skip) return;
      ctx.save();
      ctx.strokeStyle = e.delta > 0 ? VERDE : ROJO;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    });

    if (!opts?.etiquetas) return;
    const etiquetas = [];
    const puntosValidos = (opts.puntos || []).filter(p => (esVolumen ? p.volumen : p.nivel) != null);
    const agregar = (indice, texto, color, preferirAbajo, prioridad) => {
      const pt = meta.data[indice];
      if (pt && !pt.skip) etiquetas.push({ x: pt.x, y: pt.y, texto, color, preferirAbajo, prioridad });
    };
    // Anclajes de inicio/fin tienen prioridad, luego cada cambio individual.
    const primero = puntosValidos[0];
    const ultimo = puntosValidos[puntosValidos.length - 1];
    if (primero) agregar(primero.indice, `INICIO · ${conUnidad(esVolumen ? primero.volumen : primero.nivel, unidad, decimales)}`, AZUL, false, 3);
    if (ultimo && ultimo.indice !== primero?.indice)
      agregar(ultimo.indice, `FINAL · ${conUnidad(esVolumen ? ultimo.volumen : ultimo.nivel, unidad, decimales)}`, AZUL, false, 3);
    eventos.forEach(e => {
      const valor = esVolumen ? e.deltaL : e.delta;
      if (valor == null) return;
      agregar(e.indice, signo(valor, unidad, decimales), e.delta > 0 ? VERDE : ROJO, e.delta < 0, 1);
    });
    dibujarEtiquetasConGuia(chart, etiquetas);
  },
};


const escalerasAnalisis = {
  id: "escalerasAnalisisCocli",
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts?.activo) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta || meta.hidden || !chart.chartArea) return;
    const ctx = chart.ctx;
    const mapa = new Map();
    (opts.puntos || []).forEach((p, i) => mapa.set(p.indice, i));

    const dibujarEscalera = (desde, hasta) => {
      if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta <= desde) return;
      const inicio = meta.data[desde];
      if (!inicio || inicio.skip) return;
      ctx.save();
      ctx.strokeStyle = MORADO;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([6, 3]);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(inicio.x, inicio.y);
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

    if (opts.tipo === "nodos") {
      (opts.eventos || []).forEach(ev => {
        if (ev?.delta == null || ev.delta === 0) return;
        const i0 = mapa.get(ev.anterior);
        const i1 = mapa.get(ev.indice);
        if (i0 == null || i1 == null) return;
        dibujarEscalera(Math.min(i0, i1), Math.max(i0, i1));
      });
      return;
    }

    if (opts.tipo === "operaciones") {
      (opts.operaciones || []).forEach(op => {
        const i0 = mapa.get(op?.desde?.indice);
        const i1 = mapa.get(op?.hasta?.indice);
        if (i0 == null || i1 == null) return;
        dibujarEscalera(Math.min(i0, i1), Math.max(i0, i1));
      });
    }
  },
};


// Etiquetas de crestas y valles directamente sobre las lecturas originales.

const etiquetasExtremosSCADA = {
  id: "etiquetasExtremosSCADA",
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts?.mostrar || !opts?.extremos?.length) return;
    const meta = chart.getDatasetMeta(0);
    const area = chart.chartArea;
    if (!meta || !area || meta.hidden) return;
    const ctx = chart.ctx;
    const posiciones = [];
    const extremos = opts.extremos.filter(e => ["Cresta", "Valle", "Inicio", "Final"].includes(e.clase));
    const usados = new Set();
    for (const e of extremos) {
      if (usados.has(e.indice)) continue;
      usados.add(e.indice);
      const punto = meta.data[e.indice];
      const valor = opts.modo === "volumen" ? e.volumen : e.nivel;
      if (!punto || punto.skip || valor == null) continue;
      const titulo = e.clase === "Cresta" ? "▲ CRESTA" : e.clase === "Valle" ? "▼ VALLE" : e.clase.toUpperCase();
      const dato = conUnidad(valor, opts.modo === "volumen" ? "L" : "m", opts.modo === "volumen" ? 0 : 3);
      const texto = `${titulo} · ${dato}`;
      const color = e.clase === "Cresta" ? ROJO : e.clase === "Valle" ? VERDE : AZUL;
      ctx.save();
      ctx.font = "bold 10px Arial";
      const ancho = ctx.measureText(texto).width + 16;
      const alto = 22;
      const opcionesY = e.clase === "Valle" ? [15, -35, 40, -60, 65] : [-35, 15, -60, 40, -85];
      let pos = null;
      for (const dy of opcionesY) {
        const x = Math.max(area.left + 2, Math.min(punto.x - ancho / 2, area.right - ancho - 2));
        const y = punto.y + dy;
        if (y < area.top + 2 || y + alto > area.bottom - 2) continue;
        if (posiciones.some(r => x < r.x + r.w + 3 && x + ancho + 3 > r.x && y < r.y + r.h + 3 && y + alto + 3 > r.y)) continue;
        pos = { x, y, w: ancho, h: alto };
        break;
      }
      if (pos) {
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, pos.w, pos.h, 5);
        ctx.fillStyle = "rgba(255,255,255,0.96)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texto, pos.x + pos.w / 2, pos.y + pos.h / 2);
        posiciones.push(pos);
      }
      ctx.restore();
    }
  },
};


function analizarCrestasValles(puntos, umbral = 0.002) {
  const operaciones = [], extremos = [];
  const tolerancia = Math.max(0.000001, Math.min(0.002, umbral / 5));
  const minimo = Math.max(0.000001, umbral);
  if (!puntos.length) return {
    operaciones, extremos, segmentos: 0, cantidadCargas: 0,
    cantidadDescargas: 0, totalCargasL: 0, totalDescargasL: 0,
  };

  let inicio = puntos[0];
  let extremo = inicio;
  let direccion = 0;
  let candidatoMax = inicio;
  let candidatoMin = inicio;
  let id = 0;
  const pivotes = [{ ...inicio, clase: 'Inicio' }];
  const agregarPivote = (p, clase) => {
    const previo = pivotes[pivotes.length - 1];
    if (previo?.indice === p.indice) {
      if (clase !== 'Inicio') previo.clase = clase;
    } else pivotes.push({ ...p, clase });
  };
  const cerrar = (fin, clase, parcial = false) => {
    if (fin.indice === inicio.indice) return;
    const delta = fin.nivel - inicio.nivel;
    if (Math.abs(delta) + 1e-10 < minimo) return;
    const afectados = puntos.filter(p => p.minutosDia >= inicio.minutosDia && p.minutosDia <= fin.minutosDia);
    const intervalosSinSenal = afectados.slice(1).reduce((n, p, i) =>
      n + (p.minutosDia - afectados[i].minutosDia > 30 ? 1 : 0), 0);
    operaciones.push({
      id: ++id, segmento: 0, desde: inicio, hasta: fin,
      delta, deltaL: inicio.volumen != null && fin.volumen != null
        ? fin.volumen - inicio.volumen : null,
      tipo: delta < 0 ? 'Descarga estimada' : 'Carga estimada',
      duracion: fin.minutosDia - inicio.minutosDia,
      parcial, intervalosSinSenal,
    });
    agregarPivote(fin, clase);
  };


  for (let i = 1; i < puntos.length; i++) {
    const p = puntos[i];
    if (direccion === 0) {

      if (p.nivel >= candidatoMax.nivel) candidatoMax = p;
      if (p.nivel <= candidatoMin.nivel) candidatoMin = p;
      const descenso = candidatoMax.nivel - p.nivel;
      const ascenso = p.nivel - candidatoMin.nivel;
      if (descenso >= minimo && descenso >= ascenso) {
        inicio = candidatoMax;
        direccion = -1;
        extremo = p;
      } else if (ascenso >= minimo) {
        inicio = candidatoMin;
        direccion = 1;
        extremo = p;
      }
      continue;
    }
    const diff = p.nivel - extremo.nivel;
    if (direccion * diff > tolerancia) {
      extremo = p;
    } else if (-direccion * diff >= minimo) {
      // Reversión: la operación termina en la cresta/valle ANTERIOR.
      cerrar(extremo, direccion > 0 ? 'Cresta' : 'Valle');
      inicio = extremo;
      candidatoMax = extremo;
      candidatoMin = extremo;
      direccion = -direccion;
      extremo = p;
    }
  }

  if (direccion !== 0) cerrar(extremo, 'Final', true);
  agregarPivote(puntos[puntos.length - 1], 'Final');
  extremos.push(...pivotes.map(p => ({ ...p, segmento: 0 })));
  const cargas = operaciones.filter(o => o.delta > 0);
  const descargas = operaciones.filter(o => o.delta < 0);
  return {
    operaciones, extremos, segmentos: 1,
    cantidadCargas: cargas.length, cantidadDescargas: descargas.length,
    totalCargasL: cargas.length && cargas.every(o => o.deltaL != null)
      ? cargas.reduce((sum, o) => sum + o.deltaL, 0) : cargas.length ? null : 0,
    totalDescargasL: descargas.length && descargas.every(o => o.deltaL != null)
      ? descargas.reduce((sum, o) => sum - o.deltaL, 0) : descargas.length ? null : 0,
  };
}

const etiquetasTotalesSCADA = {
  id: "etiquetasTotalesSCADA",
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts?.mostrar || !opts?.operaciones?.length) return;
    const { scales } = chart;
    if (!scales?.x || !scales?.y) return;
    const etiquetas = [];
    for (const o of opts.operaciones) {
      const valor = opts.modo === "volumen" ? o.deltaL : o.delta;
      if (valor == null || !o.desde || !o.hasta) continue;
      const inicio = opts.modo === "volumen" ? o.desde.volumen : o.desde.nivel;
      const fin = opts.modo === "volumen" ? o.hasta.volumen : o.hasta.nivel;
      if (inicio == null || fin == null) continue;
      const x = scales.x.getPixelForValue((o.desde.minutosDia + o.hasta.minutosDia) / 2);
      const y = scales.y.getPixelForValue((inicio + fin) / 2);
      etiquetas.push({
        x, y,
        texto: `${valor > 0 ? "+" : ""}${fmt(valor, opts.modo === "volumen" ? 0 : 3)} ${opts.modo === "volumen" ? "L" : "m"}`,
        color: o.delta < 0 ? ROJO : VERDE,
        preferirAbajo: o.delta < 0,
        prioridad: 2,
      });
    }
    dibujarEtiquetasConGuia(chart, etiquetas);
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
  const [modoDia, setModoDia] = useState("natural");
  const [actualizar, setActualizar] = useState(0);
  const [lecturas, setLecturas] = useState([]);
  const [lecturasDiaAnterior, setLecturasDiaAnterior] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [visualizacion, setVisualizacion] = useState("nivel");
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [tipoAnalisis, setTipoAnalisis] = useState("original");
  const UMBRAL_GIRO = 0.002; // Umbral de movimiento estimado (2 mm); no modifica lecturas SCADA.
  const [menuExport, setMenuExport] = useState(null);
  const chartRef = useRef(null);
  const [modalGrafica, setModalGrafica] = useState(false);

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

    const consultarNiveles = async () => {
      setCargando(true);
      setError("");

      const fechaAnterior = obtenerDiaAnterior(fechaConsultada);
      const base = apiBase.replace(/\/$/, "");

      try {
        const [respuestaActual, respuestaAnterior] = await Promise.all([
          axios.get(`${base}/por-fecha/${fechaConsultada}`, {
            withCredentials: true,
            signal: ctrl.signal,
          }),
          axios.get(`${base}/por-fecha/${fechaAnterior}`, {
            withCredentials: true,
            signal: ctrl.signal,
          }),
        ]);

        if (
          !Array.isArray(respuestaActual.data?.data) ||
          !Array.isArray(respuestaAnterior.data?.data)
        ) {
          throw new Error("La respuesta SCADA no contiene data[]");
        }

        if (ctrl.signal.aborted) return;

        setLecturas(respuestaActual.data.data);
        setLecturasDiaAnterior(respuestaAnterior.data.data);

      } catch (e) {
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
        setLecturasDiaAnterior([]);

      } finally {
        if (!ctrl.signal.aborted) {
          setCargando(false);
        }
      }
    };

    consultarNiveles();

    return () => ctrl.abort();

  }, [apiBase, fechaConsultada, actualizar]);

  const catalogoPorNombre = useMemo(
    () => new Map(catalogo.filter((t) => clave(t?.NombreTanque)).map((t) => [clave(t.NombreTanque), t])),
    [catalogo]
  );

  const tanquesDisponibles = useMemo(() =>

    [...catalogoPorNombre.keys()].sort((a, b) => a.localeCompare(b, "es", { numeric: true })),
    [catalogoPorNombre]

  );

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
  const gradoRaw = [
    datosTanque?.GradoAlcoholico,
    datosTanque?.gradoAlcoholico,
    datosTanque?.GradoAlcohol,
    datosTanque?.gradoAlcohol,
    datosTanque?.Grado,
    datosTanque?.grado,
  ].find(v => v !== undefined && v !== null && String(v).trim() !== "");
  const gradoAlcoholico = gradoRaw == null
    ? "Sin registrar"
    : `${String(gradoRaw?.$numberDecimal ?? gradoRaw).trim()}°`;

  const capacidad = positivo(datosTanque?.VolumenTotal);
  const producto = datosTanque?.Disposicion || "Sin configurar";
  const esVolumen = visualizacion === "volumen";
  const unidadNivel = "m";
  const tituloTanque = `TK-${clave(tanque)}`;

  // Un mismo conjunto de puntos controla gráfica, indicadores, eventos y balances.
  // En inventario, el eje empieza a las 08:00 del día anterior (x=0)
  // y termina a las 08:00 del día seleccionado (x=1440).
  const fechaAnterior = useMemo(() => obtenerDiaAnterior(fechaConsultada), [fechaConsultada]);
  const etiquetaPeriodo = modoDia === "natural"
    ? `${fechaConsultada} · 00:00–24:00`
    : `${fechaAnterior} 08:00 – ${fechaConsultada} 08:00`;

  const puntos = useMemo(() => {
    const registros = modoDia === "inventario"
      ? [...lecturasDiaAnterior, ...lecturas]
      : lecturas;

    return registros
      .map((r, ordenOriginal) => {
        const fechaRegistro = String(r.fecha ?? "");
        const horaReal = String(r.hora ?? "").trim();
        const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(horaReal);
        if (!match) return null;

        const h = Number(match[1]);
        const m = Number(match[2]);
        const seg = Number(match[3] ?? 0);
        if (h > 23 || m > 59 || seg > 59) return null;

        const minutoReloj = h * 60 + m + seg / 60;
        let minutosDia;
        if (modoDia === "natural") {
          if (fechaRegistro !== fechaConsultada) return null;
          minutosDia = minutoReloj;
        } else if (fechaRegistro === fechaAnterior && minutoReloj >= 480) {
          minutosDia = minutoReloj - 480;
        } else if (fechaRegistro === fechaConsultada && minutoReloj <= 480) {
          minutosDia = minutoReloj + 960;
        } else {
          return null;
        }

        const lectura = tieneSensor ? n(r[sensorSeleccionado]) : null;
        if (lectura == null) return null;
        const { nivel, volumen } = convertir(lectura, factor);
        return {
          ordenOriginal, fecha: fechaRegistro, hora: horaReal, horaReal,
          minutosDia, nivel, volumen, valor: nivel,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.minutosDia - b.minutosDia || a.ordenOriginal - b.ordenOriginal)
      .map((p, indice) => ({ ...p, indice }));
  }, [lecturas, lecturasDiaAnterior, fechaConsultada, fechaAnterior, modoDia, sensorSeleccionado, tieneSensor, factor]);

  const analisis = useMemo(() => {
    const validos = puntos;
    const inicial = validos[0] || null;
    const final = validos[validos.length - 1] || null;
    const eventos = inicial ? [{ ...inicial, tipo: "Inicio", delta: null, deltaL: null }] : [];

    let subidas = 0, bajadas = 0, subidasL = 0, bajadasL = 0;
    let mayorSubida = null, mayorBajada = null;
    let cantidadSubidas = 0, cantidadBajadas = 0, cantidadSinCambio = 0;
    let movimientosSinLitros = false;

    // Se compara CADA lectura válida con la lectura válida inmediatamente anterior.
    for (let i = 1; i < validos.length; i++) {
      const a = validos[i - 1];
      const b = validos[i];
      const delta = b.nivel - a.nivel;
      const deltaL = a.volumen != null && b.volumen != null
        ? b.volumen - a.volumen : null;
      const minutos = b.minutosDia - a.minutosDia;
      const sinSenal = minutos > 30;

      if (delta === 0) {
        cantidadSinCambio++;
        continue;
      }

      const ev = {
        ...b, anterior: a.indice, delta, deltaL, minutos, sinSenal,
        tipo: delta > 0 ? "Subida" : "Bajada",
      };
      eventos.push(ev);

      if (delta > 0) {
        cantidadSubidas++;
        subidas += delta;
        if (!mayorSubida || delta > mayorSubida.delta) mayorSubida = ev;
      } else {
        cantidadBajadas++;
        bajadas += -delta;
        if (!mayorBajada || delta < mayorBajada.delta) mayorBajada = ev;
      }

      if (deltaL == null) movimientosSinLitros = true;
      else if (deltaL > 0) subidasL += deltaL;
      else bajadasL += -deltaL;
    }

    // Promedio de lecturas (no se presenta como promedio ponderado temporal).
    const promedio = validos.length
      ? validos.reduce((s, p) => s + p.nivel, 0) / validos.length : null;
    const promedioL = validos.length && validos.every((p) => p.volumen != null)
      ? validos.reduce((s, p) => s + p.volumen, 0) / validos.length : null;

    return {
      inicial, final, eventos, promedio, promedioL, subidas, bajadas,
      subidasL: inicial?.volumen == null || movimientosSinLitros ? null : subidasL,
      bajadasL: inicial?.volumen == null || movimientosSinLitros ? null : bajadasL,
      mayorSubida, mayorBajada,
      cantidadSubidas, cantidadBajadas, cantidadSinCambio,
      neto: inicial && final ? final.nivel - inicial.nivel : null,
      netoL: inicial?.volumen != null && final?.volumen != null
        ? final.volumen - inicial.volumen : null,
    };
  }, [puntos]);

  const analisisOperaciones = useMemo(() => analizarCrestasValles(puntos, UMBRAL_GIRO), [puntos]);

  const tramosSinSenal = useMemo(() => {
    const tramos = [];
    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1];
      const b = puntos[i];
      const minutos = b.minutosDia - a.minutosDia;
      if (minutos <= 30) continue;
      tramos.push({
        desde: a.minutosDia,
        hasta: b.minutosDia,
        horaDesde: a.horaReal,
        horaHasta: b.horaReal,
        minutos,
      });
    }
    return tramos;
  }, [puntos]);

  const fueraDeCapacidad = capacidad != null && puntos.some(



    (p) => p.volumen != null && (p.volumen < 0 || p.volumen > capacidad * 1.005)



  );



  const dataGrafico = useMemo(() => {
    const valorDe = p => esVolumen ? p.volumen : p.nivel;
    const base = {
      label: esVolumen ? 'Volumen (L)' : 'Nivel (m)',
      data: puntos.map(p => ({ x: p.minutosDia, y: valorDe(p) })),
      borderColor: tipoAnalisis === 'nodos' ? AZUL : 'rgba(8,124,255,.24)',
      backgroundColor: 'rgba(8,124,255,.08)',
      fill: tipoAnalisis === 'nodos' ? 'origin' : false,
      tension: 0, borderWidth: tipoAnalisis === 'nodos' ? 2.5 : 1.5,
      pointRadius: tipoAnalisis === 'nodos' ? 2.8 : 0,
      pointHoverRadius: 5, spanGaps: true,
      segment: {
        borderColor: ({ p0DataIndex, p1DataIndex }) =>
          puntos[p1DataIndex]?.minutosDia - puntos[p0DataIndex]?.minutosDia > 30 ? ROJO
            : tipoAnalisis === 'nodos' ? AZUL : 'rgba(8,124,255,.24)'
      },
    };

    if (tipoAnalisis === 'original') return {
      datasets: [{
        label: esVolumen ? 'Volumen calculado (L)' : 'Lectura SCADA (m)',
        data: puntos.map(p => ({ x: p.minutosDia, y: esVolumen ? p.volumen : p.nivel })),
        parsing: false,
        borderColor: AZUL,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 9,
        spanGaps: false,
        showLine: true,
      }]
    };
    if (tipoAnalisis === 'nodos') return { datasets: [base] };
    const eventos = analisisOperaciones.operaciones;
    const destacados = eventos.map(ev => ({
      label: ev.tipo || `${ev.clase} a ${ev.clase}`,
      data: [ev.desde, ev.hasta].map(p => ({ x: p.minutosDia, y: valorDe(p) })),
      borderColor: ev.delta < 0 ? ROJO : VERDE,
      backgroundColor: ev.delta < 0 ? ROJO : VERDE,
      pointBackgroundColor: ev.delta < 0 ? ROJO : VERDE,
      pointBorderColor: '#fff', pointBorderWidth: 1.5,
      pointRadius: 5.5, pointHoverRadius: 7, borderWidth: 3.2,
      showLine: true, fill: false, tension: 0,
      evento: ev,
    }));
    return { datasets: [base, ...destacados] };
  }, [puntos, esVolumen, tipoAnalisis, analisisOperaciones]);

  const opcionesGrafico = useMemo(() => {
    const ys = puntos
      .map(p => esVolumen ? p?.volumen : p?.nivel)
      .filter(v => Number.isFinite(v));
    const minimo = ys.length ? Math.min(...ys) : 0;
    const maximo = ys.length ? Math.max(...ys) : 1;
    const rango = Math.max(maximo - minimo, esVolumen ? 1500 : 0.04);
    const margenSuperior = Math.max(rango * 0.22, esVolumen ? 900 : 0.06);
    const margenInferior = Math.max(rango * 0.14, esVolumen ? 700 : 0.05);

    return ({

      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { intersect: false, mode: "nearest" },
      layout: { padding: { top: 17, right: 15, left: 4 } },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        sombreadoSinSenalCocli: { tramos: tipoAnalisis === "original" ? [] : tramosSinSenal },
        escalerasAnalisisCocli: {
          activo: tipoAnalisis !== "original",
          tipo: tipoAnalisis,
          puntos,
          eventos: analisis.eventos,
          operaciones: analisisOperaciones.operaciones
        },
        deltaEscalonadoCocli: { eventos: tipoAnalisis === "nodos" ? analisis.eventos : [], puntos, etiquetas: tipoAnalisis === "nodos" && mostrarEtiquetas, modo: visualizacion },
        etiquetasTotalesSCADA: { mostrar: tipoAnalisis === "operaciones" && mostrarEtiquetas, operaciones: analisisOperaciones.operaciones, modo: visualizacion },

        tooltip: {
          callbacks: {
            title: (items) => {
              const ctx = items[0];
              const p = ctx?.datasetIndex === 0 ? puntos[ctx.dataIndex] : (ctx?.dataIndex === 0 ? ctx?.dataset?.evento?.desde : ctx?.dataset?.evento?.hasta);
              return p ? `${p.fecha} ${p.horaReal}` : etiquetaPeriodo;
            },
            label: (ctx) => {

              const p = ctx.datasetIndex === 0 ? puntos[ctx.dataIndex] :
                (ctx.dataIndex === 0 ? ctx.dataset.evento?.desde : ctx.dataset.evento?.hasta);
              if (!p) return '';
              if (ctx.datasetIndex > 0) return [ctx.dataset.label,
              `Hora: ${p.fecha} ${p.horaReal}`, conUnidad(p.nivel, 'm', 3), conUnidad(p.volumen, 'L', 0),
              `Total evento: ${signo(ctx.dataset.evento.delta, 'm', 3)} / ${signo(ctx.dataset.evento.deltaL, 'L', 0)}`];
              if (tipoAnalisis === "original") return [
                `Hora real: ${p.fecha} ${p.horaReal}`,
                `Lectura SCADA: ${p.nivel} m`,
                esVolumen ? `Volumen calculado: ${p.volumen} L` : ''
              ].filter(Boolean);
              const e = analisis.eventos.find((ev) => ev.indice === ctx.dataIndex && ev.tipo !== "Inicio");
              return [
                conUnidad(p.nivel, "m", 2),
                conUnidad(p.volumen, "L", 0),
                e ? `Cambio: ${signo(e.delta, "m", 3)} / ${signo(e.deltaL, "L", 0)}` : "Sin cambio respecto a la lectura anterior",
                e?.sinSenal ? `Sin señal durante ${fmt(e.minutos, 1)} min: cambio neto entre lecturas` : "",
                analisisOperaciones.extremos.find(ex => ex.indice === ctx.dataIndex)?.clase || "",
              ].filter(Boolean);
            },
          },
        },
      },

      scales: {

        x: {
          type: "linear", min: 0, max: 1440,
          title: { display: true, text: modoDia === "inventario" ? "Hora · día inventario (08:00–08:00)" : "Hora del día", color: MARINO, font: { weight: "bold" } },
          ticks: {
            maxTicksLimit: 13, maxRotation: 0, color: "#54709a",
            callback: (v) => {
              const minutos = Number(v);
              const reloj = modoDia === "inventario" ? (minutos + 480) % 1440 : minutos % 1440;
              const hh = Math.floor(reloj / 60);
              const mm = Math.round(reloj % 60);
              return `${String((hh + Math.floor(mm / 60)) % 24).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
            },
          },
          grid: { color: "#e4ebf4" },
        },

        y: {
          beginAtZero: false,
          min: Math.max(0, minimo - margenInferior),
          max: maximo + margenSuperior,
          title: { display: true, text: esVolumen ? "Volumen (L)" : "Nivel (m)", color: MARINO, font: { weight: "bold" } },
          grid: { color: "#e4ebf4" },
          ticks: { color: "#54709a", callback: (v) => fmt(Number(v), esVolumen ? 0 : 2) },
        },

      },

    });

  }, [puntos, analisis.eventos, analisisOperaciones, tipoAnalisis, tramosSinSenal, fechaConsultada, visualizacion, esVolumen, mostrarEtiquetas, modoDia, etiquetaPeriodo]);



  const consultar = () => {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { setError("Selecciona una fecha válida"); return; }
    setFechaConsultada(fecha);
    setActualizar((x) => x + 1);

  };



  const filas = analisis.eventos;

  const exportarCSV = () => {
    const contenido = Papa.unparse(filas.map((e) => ({
      Fecha: e.fecha, Periodo: modoDia === "inventario" ? "Día inventario" : "Día natural", Tanque: tituloTanque, Hora: e.hora,
      Nivel: redondear(e.valor, 2) ?? "", Unidad: unidadNivel,
      Volumen_L: redondear(e.volumen, 0) ?? "",
      Cambio_nivel: redondear(e.delta, 2) ?? "",
      Cambio_L: redondear(e.deltaL, 0) ?? "", Movimiento: e.tipo,
    })), { delimiter: ";" });

    const url = URL.createObjectURL(new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `SCADA_${tituloTanque}_${fechaConsultada}_${modoDia}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMenuExport(null);

  };



  const exportarPDF = () => {

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(15); doc.text(`Monitoreo ${tituloTanque} - ${etiquetaPeriodo}`, 13, 14);
    try { const canvas = chartRef.current?.canvas; if (canvas) doc.addImage(canvas.toDataURL("image/png"), "PNG", 13, 21, 269, 105); }
    catch (err) { console.warn("No se pudo incluir la gráfica", err); }
    autoTable(doc, {
      startY: 134, head: [["Fecha", "Hora", "Nivel", "Volumen (L)", "Cambio nivel", "Cambio L", "Variación"]],
      body: filas.map((e) => [e.fecha, e.hora, fmt(e.valor), fmt(e.volumen, 0), e.delta == null ? "—" : signo(e.delta, unidadNivel), e.deltaL == null ? "—" : signo(e.deltaL, "L", 0), e.tipo]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [8, 124, 255] },
    });

    doc.save(`SCADA_${tituloTanque}_${fechaConsultada}_${modoDia}.pdf`); setMenuExport(null);

  };

  const ultimo = analisis.final ? `${analisis.final.fecha} ${analisis.final.horaReal || analisis.final.hora}` : "Sin lecturas";
  const l = (v) => conUnidad(v, "L", 0);
  const nivel = (v) => conUnidad(v, unidadNivel);
  const mayor = (e) => e ? `${signo(e.delta, unidadNivel)}${e.deltaL != null ? ` (${signo(e.deltaL, "L", 0)})` : ""} a las ${e.fecha} ${e.hora}${e.sinSenal ? " (intervalo sin señal)" : ""}` : "—";

  return <Box sx={{ minHeight: "100%", bgcolor: "#f5faff", marginTop: 5, p: { xs: 1.5, md: 2 }, color: MARINO }}>
    {/* Encabezado de página: no repetimos la barra global de Coclí */}

    <Typography sx={{ fontSize: { xs: 25, md: 35 }, fontWeight: 900, color: MARINO, lineHeight: 1.15, mb: 1.5 }}>
      Monitoreo diario del tanque {tituloTanque}
    </Typography>

    <Paper elevation={0} sx={{ ...hoja, p: 1.5, mb: 1.2 }}>

      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2,minmax(0,1fr))",
          lg: "repeat(4,minmax(0,1fr))",
          xl: "repeat(2,minmax(140px,1.1fr)) repeat(3,auto) repeat(6,minmax(105px,.9fr))"
        },
        gap: 1,
        alignItems: "end"
      }}>

        <Box>

          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Tanque</Typography>

          <TextField select fullWidth size="small" value={tanque} onChange={(e) => seleccionarTanque(e.target.value)}
            sx={{ "& .MuiInputBase-root": { height: 38 }, "& .MuiSelect-select": { fontSize: 12.5, py: 1 } }}>
            {!tanquesDisponibles.includes(tanque) && (
              <MenuItem value={tanque}>TK-{tanque} (selección externa)</MenuItem>
            )}

            {cargandoCatalogo && <MenuItem disabled>Cargando tanques...</MenuItem>}
            {tanquesDisponibles.map((nombre) => {
              const sinSensor = !sensoresDisponibles.has(sensorDe(nombre));
              const disposicion = catalogoPorNombre.get(nombre)?.Disposicion;

              return (
                <MenuItem
                  key={nombre}
                  value={nombre}
                  sx={{
                    minHeight: 38,
                    fontSize: 12.5,
                    bgcolor: sinSensor ? "rgba(240,67,33,0.07)" : "#fff",
                    color: sinSensor ? ROJO : MARINO,
                    borderLeft: sinSensor ? `3px solid ${ROJO}` : "3px solid transparent",
                    borderBottom: "1px solid #edf1f7",
                    "&:hover": {
                      bgcolor: sinSensor ? "rgba(240,67,33,0.14)" : "#f0f6ff",
                    },

                    "&.Mui-selected": {
                      bgcolor: sinSensor ? "rgba(240,67,33,0.16)" : "#e8f2ff",
                    },

                    "&.Mui-selected:hover": {
                      bgcolor: sinSensor ? "rgba(240,67,33,0.20)" : "#dcecff",
                    },
                  }}
                >

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      width: "100%",
                    }}
                  >

                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: sinSensor ? 800 : 600,
                        color: sinSensor ? ROJO : MARINO,
                      }}
                    >
                      TK-{nombre}
                      {disposicion ? ` (${disposicion})` : ""}
                    </Typography>



                    {sinSensor && (

                      <Box
                        sx={{
                          px: 0.8,
                          py: 0.25,
                          borderRadius: 0.8,
                          bgcolor: "rgba(240,67,33,0.12)",
                          border: `1px solid ${ROJO}`,
                          color: ROJO,
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        SIN SCADA
                      </Box>
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </TextField>
        </Box>



        <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Fecha</Typography>
          <TextField type="date" size="small" fullWidth value={fecha} onChange={(e) => setFecha(e.target.value)}
            sx={{ "& .MuiInputBase-root": { height: 38 }, "& .MuiInputBase-input": { fontSize: 12.5, py: 1 } }} /></Box>

        <IconButton
          onClick={consultar}
          disabled={cargando}
          title="Consultar"
          aria-label="Consultar"
          sx={{
            width: 38,
            height: 38,
            bgcolor: AZUL,
            color: "#fff",
            borderRadius: 1.2,
            "&:hover": {
              bgcolor: MARINO,
            },
            "&.Mui-disabled": {
              bgcolor: "#dce7f3",
              color: "#8fa3be",
            },
          }}
        >
          {cargando ? (
            <CircularProgress size={19} color="inherit" />
          ) : (
            <SearchIcon fontSize="small" />
          )}
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={exportarCSV}
            disabled={!tieneSensor || !filas.length}
            title="Exportar Excel (CSV)"
            aria-label="Exportar Excel"
            sx={{
              width: 38,
              height: 38,
              border: "1px solid #009846",
              borderRadius: 1.2,
              color: "#009846",
              bgcolor: "#f0fff5",
              "&:hover": {
                bgcolor: "#d9f7e5",
              },
            }}
          >
            <TableChartIcon fontSize="small" />
          </IconButton>

          <IconButton
            onClick={exportarPDF}
            disabled={!tieneSensor || !filas.length}
            title="Exportar PDF"
            aria-label="Exportar PDF"
            sx={{
              width: 38,
              height: 38,
              border: "1px solid #f04321",
              borderRadius: 1.2,
              color: "#f04321",
              bgcolor: "#fff5f2",
              "&:hover": {
                bgcolor: "#ffe5dd",
              },
            }}
          >
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
        </Box>


        <Box sx={{ alignSelf: "end" }}>
          <Button
            variant="outlined"
            onClick={() => setModoDia((prev) => prev === "natural" ? "inventario" : "natural")}
            title="Alternar entre día natural y día inventario"
            sx={{ height: 38, minWidth: 145, textTransform: "none", fontSize: 12,
              borderColor: AZUL, color: AZUL, fontWeight: 800, whiteSpace: "nowrap" }}
          >
            {modoDia === "natural" ? "Día natural" : "Día inventario"}
          </Button>
        </Box>

        <MiniDato titulo="Factor" valor={factor != null ? `${fmt(factor, 0)} L/m` : "Sin registrar"} />
        <MiniDato icono={<DonutSmallIcon />} titulo="Grado" valor={gradoAlcoholico} />
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
              {tipoAnalisis !== "original" && <Typography sx={{ fontSize: 10, color: VERDE }}>┄ Subida</Typography>}
              {tipoAnalisis !== "original" && <Typography sx={{ fontSize: 10, color: ROJO }}>┄ Bajada</Typography>}
              {tipoAnalisis !== "original" && tramosSinSenal.length > 0 && (
                <Typography sx={{ fontSize: 10, color: ROJO }}>━ Sin señal (&gt;30 min)</Typography>
              )}

              <TextField
                select
                size="small"
                label="Análisis gráfico"
                value={tipoAnalisis}
                onChange={(e) => setTipoAnalisis(e.target.value)}
                sx={{ minWidth: { xs: 195, md: 225 }, "& .MuiInputBase-root": { height: 36 }, "& .MuiSelect-select": { fontSize: 11, fontWeight: 700 } }}
              >
                <MenuItem value="original">Lecturas originales (sin análisis)</MenuItem>
                <MenuItem value="nodos">Nodos (lectura a lectura)</MenuItem>
                <MenuItem value="operaciones">Crestas / Valles (cargas y descargas)</MenuItem>
              </TextField>

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

              {tipoAnalisis !== "original" && <Button size="small" onClick={() => setMostrarEtiquetas((v) => !v)} sx={{ fontSize: 10, textTransform: "none", p: 0 }}>
                {mostrarEtiquetas ? "Ocultar etiquetas" : "Ver etiquetas"}
              </Button>}

              <IconButton size="small" aria-label="Ampliar gráfica" title="Ampliar gráfica"
                disabled={!puntos.length} onClick={() => setModalGrafica(true)} sx={{ color: AZUL }}>
                <FullscreenIcon fontSize="small" />
              </IconButton>

            </Stack>
          </Stack>


          {/* 
          {tipoAnalisis === "original" && (
            <Typography sx={{ fontSize: 10.5, color: "#4c6486", mb: 0.65 }}>
              Lecturas originales: línea azul sin nodos ni análisis. Se grafican todas las lecturas numéricas válidas del sensor con su hora exacta, sin modificar su valor, aplicar umbrales ni redondear los puntos. En Volumen (L) se aplica únicamente el factor del tanque. Pasa el cursor para comprobar la lectura.
            </Typography>
          )} */}
          <Typography sx={{ fontSize: 11, color: "#42608d", mb: .7, fontWeight: 700 }}>
            Período analizado: {etiquetaPeriodo}
          </Typography>
          {tipoAnalisis === "operaciones" && (
            <Typography sx={{ fontSize: 10.5, color: "#4c6486", mb: 0.65 }}>
              En Crestas / Valles cada línea destacada representa un movimiento completo. Su etiqueta muestra el cambio TOTAL del tramo; los puntos internos solo quedan como referencia tenue.
            </Typography>
          )}
          <Box onDoubleClick={() => setModalGrafica(true)} title="Doble clic para ampliar la gráfica" sx={{ height: { xs: 370, md: 420, xl: 450 }, mb: 1.2, cursor: "zoom-in" }}>
            {analisis.inicial ? <Line data={dataGrafico} options={opcionesGrafico} plugins={[sombreadoSinSenal, escalerasAnalisis, deltaEscalonado, etiquetasTotalesSCADA]} ref={chartRef} />

              : <Box sx={{ height: "100%", display: "grid", placeItems: "center", border: `1px dashed ${BORDE}`, borderRadius: 1.5, fontSize: 13, color: "#56739d" }}>
                Sin lecturas para el tanque y la fecha seleccionados</Box>}
          </Box>



          {tipoAnalisis !== "original" && tramosSinSenal.length > 0 && (
            <Typography sx={{ color: "#9a4b36", fontSize: 10.5, mb: 1 }}>
              Tramos rojos: intervalos entre lecturas SCADA superiores a 30 minutos.
              La unión es visual; el cambio neto entre los extremos sí se incluye, pero no representa movimientos intermedios medidos.
            </Typography>
          )}

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: .7 }}><CalendarMonthIcon sx={{ color: AZUL }} />

            <Typography sx={{ fontWeight: 800, color: "#0636ad", fontSize: 15 }}>Eventos registrados durante el día (cada variación observada)</Typography></Stack>
          {tipoAnalisis !== "original" && <Typography sx={{ mb: 0.7, fontSize: 11, color: "#42608d" }}>
            {puntos.length} lecturas · {analisis.cantidadSubidas} subidas · {analisis.cantidadBajadas} bajadas · {analisis.cantidadSinCambio} sin cambio · {tramosSinSenal.length} intervalos sin señal (&gt;30 min)
          </Typography>}



          {tipoAnalisis === "operaciones" && (
            <Typography sx={{ mb: 1, fontSize: 11, color: "#42608d" }}>
              {`${analisisOperaciones.cantidadCargas} cargas estimadas (${conUnidad(analisisOperaciones.totalCargasL, "L", 0)}) · ${analisisOperaciones.cantidadDescargas} descargas estimadas (${conUnidad(analisisOperaciones.totalDescargasL, "L", 0)}). Rojo: descenso. Verde: ascenso. Una meseta cierra la operación; los tramos finales pueden ser parciales.`}
              {" "}El análisis descarta giros inferiores a 0,01 m; los intervalos sin señal se conservan como saltos estimados entre extremos observados, sin suponer qué sucedió durante el vacío. Los valores son estimaciones a partir de niveles.
            </Typography>
          )}
          {tipoAnalisis === "operaciones" && (
            <TableContainer sx={{ maxHeight: 320, border: `1px solid ${BORDE}`, borderRadius: 1.1, mb: 1 }}>
              <Table stickyHeader size="small" sx={{ "& .MuiTableCell-root": { fontSize: 11, py: .55 } }}>
                <TableHead><TableRow>
                  <TableCell>Tipo</TableCell><TableCell>Desde</TableCell><TableCell>Hasta</TableCell>
                  <TableCell align="right">Δ nivel (m)</TableCell><TableCell align="right">Δ volumen (L)</TableCell><TableCell align="right">Duración (min)</TableCell><TableCell>Estado</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {analisisOperaciones.operaciones.map(ev => (
                    <TableRow key={ev.id} sx={{ bgcolor: ev.delta < 0 ? "#fff5f1" : "#eefbf2" }}>
                      <TableCell sx={{ color: ev.delta < 0 ? ROJO : VERDE, fontWeight: 700 }}>{ev.tipo}</TableCell>
                      <TableCell>{ev.desde.fecha} {ev.desde.horaReal} ({fmt(ev.desde.nivel, 3)} m)</TableCell>
                      <TableCell>{ev.hasta.fecha} {ev.hasta.horaReal} ({fmt(ev.hasta.nivel, 3)} m)</TableCell>
                      <TableCell align="right">{signo(ev.delta, "m", 3)}</TableCell>
                      <TableCell align="right">{signo(ev.deltaL, "L", 0)}</TableCell>
                      <TableCell align="right">{fmt(ev.duracion, 1)}</TableCell>
                      <TableCell>{ev.intervalosSinSenal > 0 ? `Estimado · ${ev.intervalosSinSenal} vacío(s) SCADA` : ev.parcial ? "Parcial / límite del tramo" : "Giro confirmado"}</TableCell>
                    </TableRow>
                  ))}
                  {analisisOperaciones.operaciones.length === 0 &&
                    <TableRow><TableCell colSpan={7} align="center">Sin movimientos que cumplan el umbral</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tipoAnalisis === "nodos" && (
            <TableContainer sx={{ maxHeight: 300, border: `1px solid ${BORDE}`, borderRadius: 1.1 }}>



              <Table stickyHeader size="small" sx={{ minWidth: 640, tableLayout: "fixed", "& .MuiTableCell-root": { fontSize: 11.5, px: .6, py: .4, borderRight: `1px solid ${BORDE}` }, "& .MuiTableHead-root .MuiTableCell-root": { bgcolor: "#eff5fc", fontWeight: 800, textAlign: "center" } }}>
                <TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Nivel ({unidadNivel})</TableCell><TableCell>Volumen (L)</TableCell><TableCell>Cambio ({unidadNivel})</TableCell><TableCell>Cambio (L)</TableCell><TableCell>Tipo de movimiento</TableCell></TableRow></TableHead>

                <TableBody>{!filas.length ? <TableRow><TableCell colSpan={6} align="center">No hay datos disponibles</TableCell></TableRow> : filas.map((e) => <TableRow key={`${e.fecha}-${e.hora}-${e.indice}`} sx={{ bgcolor: e.tipo === "Subida" ? "#eefbf2" : e.tipo === "Bajada" ? "#fff5f0" : "#fff" }}>

                  <TableCell align="center">{e.fecha} {e.hora}{e.sinSenal ? " ⚠" : ""}</TableCell><TableCell align="center">{fmt(e.valor)}</TableCell>
                  <TableCell align="center">{fmt(e.volumen, 0)}</TableCell>
                  <TableCell align="center">{e.delta == null ? "0,00" : signo(e.delta, "")}</TableCell>
                  <TableCell align="center">{e.deltaL == null ? e.tipo === "Inicio" ? "0" : "—" : signo(e.deltaL, "", 0)}</TableCell>
                  <TableCell align="center" sx={{ color: e.tipo === "Subida" ? VERDE : e.tipo === "Bajada" ? ROJO : MARINO }}>
                    {e.tipo === "Subida" ? <><ArrowUpwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Subida*</> : e.tipo === "Bajada" ? <><ArrowDownwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Bajada*</> : "—"}
                  </TableCell>

                </TableRow>)}</TableBody>
              </Table>

            </TableContainer>

          )}

          {factor == null && <Typography sx={{ mt: 1, color: "#8b6c2e", fontSize: 11 }}>El tanque no tiene un Factor (L/m) válido en el catálogo. Se muestra el nivel en metros; la vista de volumen permanecerá deshabilitada.</Typography>}

        </Paper>

        {/* DERECHA: indicadores y balance en el orden de tu captura */}

        <Paper elevation={0} sx={{ ...hoja, p: 1.7, minWidth: 0 }}>

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: .8 }}><DonutSmallIcon sx={{ color: AZUL, fontSize: 26 }} />

            <Typography sx={{ color: "#0636ad", fontSize: 16, fontWeight: 800 }}>Indicadores del {modoDia === "natural" ? "día natural" : "día inventario"}</Typography></Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen inicial" valor={l(analisis.inicial?.volumen)} detalle={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen final" valor={l(analisis.final?.volumen)} detalle={nivel(analisis.final?.valor)} />
            <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Volumen ingresado total*" valor={l(analisis.subidasL)} color={VERDE} />
            <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Volumen salido total*" valor={l(analisis.bajadasL)} color={ROJO} />
            {/* <Indicador icono={<FunctionsIcon fontSize="large" />} titulo="Promedio de lecturas de volumen" valor={l(analisis.promedioL)} ancho /> */}
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel inicial" valor={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel final" valor={nivel(analisis.final?.valor)} />
            <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Metros que subió" valor={analisis.inicial ? conUnidad(analisis.subidas, unidadNivel) : "—"} color={VERDE} />
            <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Metros que bajó" valor={analisis.inicial ? conUnidad(analisis.bajadas, unidadNivel) : "—"} color={ROJO} />
            {/* <Indicador icono={<ShowChartIcon fontSize="large" />} titulo="Promedio de lecturas de nivel" valor={nivel(analisis.promedio)} ancho /> */}

          </Box>

          <Box sx={{ mt: 1, border: `1px solid ${BORDE}`, borderRadius: 1.5, bgcolor: "#f7fbff", overflow: "hidden" }}>
            <Stack direction="row" gap={1} alignItems="center" sx={{ bgcolor: "#e8f4ff", p: .75 }}>
              <BarChartIcon sx={{ color: AZUL }} /><Typography sx={{ color: AZUL, fontWeight: 800, fontSize: 14 }}>Balance del {modoDia === "natural" ? "día natural" : "día inventario"}</Typography>
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
            *Las subidas y bajadas son diferencias entre lecturas consecutivas, no ingresos ni salidas logísticos confirmados.
            El promedio es aritmético sobre las lecturas válidas (no ponderado por tiempo). Cuando faltan lecturas, las diferencias calculadas son netas entre observaciones; no permiten reconstruir movimientos intermedios.
            Los factores, capacidad y producto proceden del catálogo actual de Gestión de Tanques.
          </Typography>

        </Paper>
      </Box>



    )}



    <GraficaSCADAModal
      open={modalGrafica}
      onClose={() => setModalGrafica(false)}
      tituloTanque={tituloTanque}
      fechaConsultada={fechaConsultada}
      factor={factor}
      puntos={puntos}
      eventos={analisis.eventos}
      operaciones={analisisOperaciones.operaciones}
      tramosSinSenal={tramosSinSenal}
      tipoInicial={tipoAnalisis}
      unidadInicial={visualizacion}
      modoDia={modoDia}
    />

  </Box>;



}
