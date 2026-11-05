import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useTanques } from "../../utils/Context/TanquesContext";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

import {
  Box, Paper, Stack, Typography, Button, TextField, MenuItem, Menu, Alert,
  CircularProgress, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  ToggleButtonGroup, ToggleButton, IconButton, Checkbox
} from "@mui/material";

import TableChartIcon from "@mui/icons-material/TableChart";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
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
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
import Papa from "papaparse";

import ExportarInformeSCADAPDF from "./utils_SCADA/ExportarInformeSCADAPDF.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const API_SCADA = "http\://localhost:4041/api/scada/nivelesaveva"
const API_DESPACHOS = "https://ambiocomserver.onrender.com/api/despacho-alcoholes";
const API_BASCULA = "https://ambiocomserver.onrender.com/api/pesajes";

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


const normalizarFechaBascula = (valor) => {
  const fecha = String(valor ?? "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return "";
};


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

const sombreadoExclusionesNodos = {
  id: "sombreadoExclusionesNodos",

  beforeDatasetsDraw(chart, _args, opciones) {
    if (!opciones?.activo || !opciones?.intervalos?.length) return;

    const { ctx, chartArea: area } = chart;
    const escalaX = chart.scales?.x;

    if (!area || !escalaX) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      area.left,
      area.top,
      area.right - area.left,
      area.bottom - area.top
    );
    ctx.clip();

    opciones.intervalos.forEach(({ desde, hasta }) => {
      const x1 = escalaX.getPixelForValue(desde);
      const x2 = escalaX.getPixelForValue(hasta);

      if (!Number.isFinite(x1) || !Number.isFinite(x2)) return;

      ctx.fillStyle = "rgba(123,63,242,0.10)";
      ctx.fillRect(
        Math.min(x1, x2),
        area.top,
        Math.abs(x2 - x1),
        area.bottom - area.top
      );

      ctx.strokeStyle = "rgba(123,63,242,0.40)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);

      [x1, x2].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
      });

      ctx.setLineDash([]);
    });

    ctx.restore();
  },
};

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
    if (ultimo && ultimo.indice !== primero?.indice) {
      const rotulo = opts.filtrado ? "ÚLTIMO ACEPTADO" : "FINAL";

      agregar(
        ultimo.indice,
        `${rotulo} · ${conUnidad(
          esVolumen ? ultimo.volumen : ultimo.nivel,
          unidad,
          decimales
        )}`,
        AZUL,
        false,
        3
      );
    }
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

    const dibujarEscaleraFiltrada = (desde, hasta) => {
      if (!Number.isFinite(desde) || !Number.isFinite(hasta)) return;
      if (hasta <= desde) return;

      const a = meta.data[desde];
      const b = meta.data[hasta];

      if (!a || !b || a.skip || b.skip) return;

      ctx.save();
      ctx.strokeStyle = MORADO;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([6, 3]);
      ctx.globalAlpha = 0.95;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.restore();
    };

    if (opts.tipo === "nodos") {
      (opts.eventos || []).forEach(ev => {
        if (ev?.delta == null || ev.delta === 0) return;
        const i0 = mapa.get(ev.anterior);
        const i1 = mapa.get(ev.indice);
        if (i0 == null || i1 == null) return;
        if (opts.simplificado) {
          dibujarEscaleraFiltrada(Math.min(i0, i1), Math.max(i0, i1));
        } else {
          dibujarEscalera(Math.min(i0, i1), Math.max(i0, i1));
        }
      });
      return;
    }

    if (opts.tipo === "operaciones") {
      (opts.operaciones || []).forEach(op => {
        const i0 = mapa.get(op?.desde?.indice);
        const i1 = mapa.get(op?.hasta?.indice);
        if (i0 == null || i1 == null) return;
        if (opts.simplificado) {
          dibujarEscaleraFiltrada(Math.min(i0, i1), Math.max(i0, i1));
        } else {
          dibujarEscalera(Math.min(i0, i1), Math.max(i0, i1));
        }
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


function analizarCrestasValles(puntos, umbral = 0.002, umbralPersonalizado = false) {
  const operaciones = [], extremos = [];
  const tolerancia = umbral > 0.002
    ? 0
    : Math.max(0.000001, Math.min(0.002, umbral / 5));

  const minimo = Math.max(0.000001, umbral);
  const epsilon = 1e-10;
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
    if (
      umbralPersonalizado
        ? Math.abs(delta) <= minimo + epsilon
        : Math.abs(delta) + epsilon < minimo
    ) return;

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
    } else if (
      umbralPersonalizado
        ? -direccion * diff > minimo + epsilon
        : -direccion * diff >= minimo
    ) {
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

function EncabezadoSeccion({ titulo, periodo, color = AZUL, fondo = "#F0F5FF" }) {
  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 0.5,
      px: 1.2,
      py: 0.65,
      my: 1,
      bgcolor: fondo,
      borderLeft: `3px solid ${color}`,
      borderRadius: 1
    }}>
      <Typography sx={{ color: MARINO, fontSize: 12.5, fontWeight: 800, lineHeight: 1.2 }}>
        {titulo}
      </Typography>
      {periodo && (
        <Typography sx={{ color: "#58709C", fontSize: 10.5, fontWeight: 600, lineHeight: 1.2 }}>
          {periodo}
        </Typography>
      )}
    </Box>
  );
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
  const [despachos, setDespachos] = useState([]);
  const [registrosBascula, setRegistrosBascula] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [visualizacion, setVisualizacion] = useState("nivel");
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [tipoAnalisis, setTipoAnalisis] = useState("original");
  const UMBRAL_GIRO = 0.002; // Umbral de movimiento estimado (2 mm); no modifica lecturas SCADA.
  const [umbralLimpiezaL, setUmbralLimpiezaL] = useState(0);
  const [umbralTexto, setUmbralTexto] = useState("0");
  const chartRef = useRef(null);
  const [modalGrafica, setModalGrafica] = useState(false);
  const [lecturasExcluidasNodos, setLecturasExcluidasNodos] = useState(() => new Set());
  const [lecturasExcluidasOperaciones, setLecturasExcluidasOperaciones] = useState(() => new Set());

  const alternarLecturaOperacion = (idLectura) => {
    setLecturasExcluidasOperaciones(anterior => {
      const siguiente = new Set(anterior);

      if (siguiente.has(idLectura)) {
        siguiente.delete(idLectura);
      } else {
        siguiente.add(idLectura);
      }

      return siguiente;
    });
  };

  const alternarLecturaNodo = (idLectura) => {
    setLecturasExcluidasNodos(anterior => {
      const siguiente = new Set(anterior);

      if (siguiente.has(idLectura)) {
        siguiente.delete(idLectura);
      } else {
        siguiente.add(idLectura);
      }

      return siguiente;
    });
  };

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


  useEffect(() => {
    const ctrl = new AbortController();


    const obtenerDespachos = async () => {
      const desde = obtenerDiaAnterior(fechaConsultada);
      const hasta = fechaConsultada;

      try {
        const respuesta = await axios.get(`${API_DESPACHOS}/rango`, {
          params: {
            from: desde,
            to: hasta,
          },
          withCredentials: true,
          signal: ctrl.signal,
        });

        if (ctrl.signal.aborted) return;

        const jsonCompleto = respuesta.data;

        setDespachos(jsonCompleto);
        console.log("JSON COMPLETO DESPACHOS:", jsonCompleto);

      } catch (error) {
        if (error.code === "ERR_CANCELED" || ctrl.signal.aborted) return;

        console.error("Error consultando despachos:", error);
        setDespachos([]);
      }
    };

    obtenerDespachos();

    return () => ctrl.abort();

  }, [fechaConsultada, actualizar]);

  useEffect(() => {
    const ctrl = new AbortController();

    const obtenerRegistrosBascula = async () => {
      const desde = obtenerDiaAnterior(fechaConsultada);
      const hasta = fechaConsultada;

      try {
        const { data: respuesta } = await axios.get(
          `${API_BASCULA}/rango`,
          {
            params: {
              from: desde,
              to: hasta,
            },
            withCredentials: true,
            signal: ctrl.signal,
          }
        );

        if (!respuesta?.ok || !Array.isArray(respuesta.data)) {
          throw new Error("Respuesta inválida de báscula");
        }


        if (ctrl.signal.aborted) return;

        const jsonCompleto = respuesta.data;
        setRegistrosBascula(jsonCompleto);

      } catch (error) {
        if (error.code === "ERR_CANCELED" || ctrl.signal.aborted) return;

        console.error("Error consultando báscula:", error);
        setRegistrosBascula([]);
      }
    };

    obtenerRegistrosBascula();

    return () => ctrl.abort();

  }, [fechaConsultada, actualizar]);

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

  const umbralLimpiezaMetros =
    factor != null && factor > 0
      ? umbralLimpiezaL / factor
      : 0;

  const umbralMovimientoMetros =
    umbralLimpiezaL > 0
      ? umbralLimpiezaMetros
      : UMBRAL_GIRO;

  const umbralMostrado =
    esVolumen
      ? umbralLimpiezaL
      : umbralLimpiezaMetros;

  useEffect(() => {
    setUmbralTexto(
      String(Number(umbralMostrado.toFixed(esVolumen ? 2 : 8)))
    );
  }, [umbralMostrado, esVolumen]);

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
          ordenOriginal,
          fecha: fechaRegistro,
          hora: horaReal,
          horaReal,
          minutosDia,
          nivel,
          volumen,
          valor: nivel,
          idLectura: `${clave(tanque)}|${String(
            r._id ?? `${fechaRegistro}|${horaReal}|${sensorSeleccionado}`
          )}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.minutosDia - b.minutosDia || a.ordenOriginal - b.ordenOriginal)
      .map((p, indice) => ({ ...p, indice }));
  }, [lecturas, lecturasDiaAnterior, fechaConsultada, fechaAnterior, modoDia, sensorSeleccionado, tieneSensor, factor, tanque]);

  const despachosFiltrados = useMemo(() => {
    const registros = Array.isArray(despachos)
      ? despachos
      : Array.isArray(despachos?.data)
        ? despachos.data
        : [];

    const tanqueSeleccionado = clave(tanque);

    return registros.filter((registro) =>
      clave(registro?.lecturas?.tanque_salida) === tanqueSeleccionado
    );
  }, [despachos, tanque]);



  const resumenDespachos = useMemo(() => {
    const fechaAnterior = obtenerDiaAnterior(fechaConsultada);

    const registrosDia = despachosFiltrados.filter((registro) => {
      const fechaRegistro = String(registro?.fecha ?? "").trim();
      const horaSalidaRegistrada = String(
        registro?.lecturas?.hora_salida ?? ""
      ).trim();

      if (!horaSalidaRegistrada) return false;

      if (modoDia === "natural") {
        return fechaRegistro === fechaConsultada;
      }


      const fechaSalida = String(
        registro?.lecturas?.fecha_salida_bascula_ambiocom ?? ""
      ).trim();

      const horaSalida = String(
        registro?.lecturas?.hora_salida ?? ""
      ).trim();

      if (!fechaSalida || !horaSalida) return false;

      const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(horaSalida);
      if (!match) return false;

      const horas = Number(match[1]);
      const minutos = Number(match[2]);
      const segundos = Number(match[3] ?? 0);

      if (horas > 23 || minutos > 59 || segundos > 59) {
        return false;
      }

      const minutoSalida = horas * 60 + minutos + segundos / 60;

      return (
        (fechaSalida === fechaAnterior && minutoSalida >= 480) ||
        (fechaSalida === fechaConsultada && minutoSalida < 480)
      );
    });

    const totalizar = (campo) =>
      registrosDia.reduce((total, registro) => {
        const valor = n(registro?.lecturas?.[campo]);
        return total + (valor ?? 0);
      }, 0);

    return {
      volumenAmbiocom: totalizar("volumen_ambiocom_contador"),
      volumenGravimetrico: totalizar("volumen_contador_gravimetrico"),
      volumenProgramado: totalizar("volumen_despachar"),
      cantidadDespachos: registrosDia.length,
    };
  }, [despachosFiltrados, fechaConsultada, modoDia]);



  const resumenBascula = useMemo(() => {
    const pesajes = Array.isArray(registrosBascula)
      ? registrosBascula
      : Array.isArray(registrosBascula?.data)
        ? registrosBascula.data
        : [];

    const fechaAnterior = obtenerDiaAnterior(fechaConsultada);

    const normalizar = (valor) =>
      String(valor ?? "").trim().toUpperCase();

    const perteneceAlPeriodo = (registro, campoFecha, campoHora) => {
      const fechaRegistro = normalizarFechaBascula(registro?.[campoFecha]);
      const horaOriginal = String(registro?.[campoHora] ?? "").trim();

      if (!horaOriginal) return false;

      if (modoDia === "natural") {
        return fechaRegistro === fechaConsultada;
      }

      const hora = horaOriginal.slice(0, 5);
      const match = /^(\d{2}):(\d{2})$/.exec(hora);

      if (!match) return false;

      const horas = Number(match[1]);
      const minutos = Number(match[2]);

      if (horas > 23 || minutos > 59) return false;

      const minutoRegistro = horas * 60 + minutos;

      return (
        (fechaRegistro === fechaAnterior && minutoRegistro >= 480) ||
        (fechaRegistro === fechaConsultada && minutoRegistro < 480)
      );
    };

    const tiquetesDespachos = new Set(
      despachosFiltrados
        .map((registro) =>
          normalizar(registro?.lecturas?.tiquete_bascula)
        )
        .filter(Boolean)
    );

    const densidadesPorTiquete = new Map(
      despachosFiltrados
        .map((registro) => [
          normalizar(registro?.lecturas?.tiquete_bascula),
          n(registro?.lecturas?.densidadlab_alcohol_tanque)
        ])
        .filter(([tiquete, densidad]) =>
          tiquete && densidad !== null && densidad > 0
        )
    );

    const densidadesValidas = [...densidadesPorTiquete.values()]
      .sort((a, b) => a - b);

    const mitad = Math.floor(densidadesValidas.length / 2);

    const densidadEstimada = !densidadesValidas.length
      ? null
      : densidadesValidas.length % 2
        ? densidadesValidas[mitad]
        : (densidadesValidas[mitad - 1] + densidadesValidas[mitad]) / 2;


    const salidas = pesajes.filter((registro) =>
      normalizar(registro?.movimiento) === "VENTA O DESPACHO" &&
      tiquetesDespachos.has(normalizar(registro?.consecutivo)) &&
      perteneceAlPeriodo(registro, "fechaSalida", "horaSalida")
    );

    const ingresosNacionales = pesajes.filter((registro) =>
      normalizar(registro?.movimiento) ===
      "INGRESO MATERIA PRIMA NACIONAL" &&
      perteneceAlPeriodo(registro, "fechaIngreso", "horaIngreso")
    );

    const ingresosImportados = pesajes.filter((registro) =>
      normalizar(registro?.movimiento) ===
      "INGRESO MATERIA PRIMA IMPORTACION" &&
      perteneceAlPeriodo(registro, "fechaIngreso", "horaIngreso")
    );

    const resultadoGravimetrico = salidas.reduce(
      (acumulado, registro) => {
        const pesoNeto = n(registro?.pesoNeto);
        const tiquete = normalizar(registro?.consecutivo);

        if (pesoNeto === null || pesoNeto <= 0) {
          return acumulado;
        }

        const densidadReal = densidadesPorTiquete.get(tiquete);
        const densidad = densidadReal ?? densidadEstimada;

        if (densidad === null || densidad <= 0) {
          acumulado.sinDensidad++;
          return acumulado;
        }

        acumulado.volumen += pesoNeto / densidad;
        acumulado.pesoCalculado += pesoNeto;
        acumulado.calculados++;

        if (densidadReal === undefined) {
          acumulado.estimados++;
        }

        return acumulado;
      },
      { volumen: 0, pesoCalculado: 0, calculados: 0, estimados: 0, sinDensidad: 0 }
    );

    const sumarPesoNeto = (registros) =>
      registros.reduce(
        (total, registro) => total + (n(registro?.pesoNeto) ?? 0),
        0
      );

    const densidadPonderadaRecepciones =
      resultadoGravimetrico.volumen > 0
        ? resultadoGravimetrico.pesoCalculado / resultadoGravimetrico.volumen
        : null;

    const estimarVolumenRecibido = (pesoKg) =>
      densidadPonderadaRecepciones != null &&
        densidadPonderadaRecepciones > 0
        ? pesoKg / densidadPonderadaRecepciones
        : null;

    return {
      pesoNetoSalidas: sumarPesoNeto(salidas),
      volumenGravimetrico: resultadoGravimetrico.calculados
        ? resultadoGravimetrico.volumen
        : null,
      cantidadVolumenEstimado: resultadoGravimetrico.estimados,
      cantidadSinDensidad: resultadoGravimetrico.sinDensidad,
      densidadPromedioPonderada: resultadoGravimetrico.volumen > 0
        ? resultadoGravimetrico.pesoCalculado / resultadoGravimetrico.volumen
        : null,
      densidadReferencia: densidadEstimada,
      volumenEstimadoNacional: estimarVolumenRecibido(sumarPesoNeto(ingresosNacionales)),
      volumenEstimadoImportacion: estimarVolumenRecibido(sumarPesoNeto(ingresosImportados)),
      densidadEstimadaRecepciones: densidadPonderadaRecepciones,
      pesoNetoNacional: sumarPesoNeto(ingresosNacionales),
      pesoNetoImportacion: sumarPesoNeto(ingresosImportados),
      pesoNetoIngresos:
        sumarPesoNeto(ingresosNacionales) +
        sumarPesoNeto(ingresosImportados),
      cantidadSalidas: salidas.length,
      cantidadNacionales: ingresosNacionales.length,
      cantidadImportados: ingresosImportados.length,
      cantidadIngresos:
        ingresosNacionales.length + ingresosImportados.length,
    };
  }, [registrosBascula, despachosFiltrados, fechaConsultada, modoDia]);

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

  const analisisOperaciones = useMemo(
    () => analizarCrestasValles(
      puntos,
      umbralMovimientoMetros,
      umbralLimpiezaL > 0
    ),
    [puntos, umbralMovimientoMetros, umbralLimpiezaL]
  );

  const puntosAceptadosOperaciones = useMemo(() => {
    return puntos.filter(
      p => !lecturasExcluidasOperaciones.has(p.idLectura)
    );
  }, [puntos, lecturasExcluidasOperaciones]);

  const lecturasExcluidasOperacionesPeriodo = useMemo(() => {
    return puntos.filter(
      p => lecturasExcluidasOperaciones.has(p.idLectura)
    );
  }, [puntos, lecturasExcluidasOperaciones]);

  const analisisOperacionesVista = useMemo(() => {
    if (!lecturasExcluidasOperacionesPeriodo.length) {
      return analisisOperaciones;
    }

    return analizarCrestasValles(
      puntosAceptadosOperaciones,
      umbralMovimientoMetros,
      umbralLimpiezaL > 0
    );
  }, [
    analisisOperaciones,
    puntosAceptadosOperaciones,
    lecturasExcluidasOperacionesPeriodo,
    umbralMovimientoMetros,
    umbralLimpiezaL,
  ]);

  const puntosAceptadosNodos = useMemo(() => {
    return puntos.filter(
      p => !lecturasExcluidasNodos.has(p.idLectura)
    );
  }, [puntos, lecturasExcluidasNodos]);

  const lecturasExcluidasEnPeriodo = useMemo(() => {
    return puntos.filter(
      p => lecturasExcluidasNodos.has(p.idLectura)
    );
  }, [puntos, lecturasExcluidasNodos]);

  const operacionesNodosAceptados = useMemo(() => {
    return analizarCrestasValles(
      puntosAceptadosNodos,
      umbralMovimientoMetros,
      umbralLimpiezaL > 0
    );
  }, [puntosAceptadosNodos, umbralMovimientoMetros, umbralLimpiezaL]);

  const analisisNodosLimpios = useMemo(() => {
    if (!puntosAceptadosNodos.length) {
      return {
        eventos: [],
        puntosVisibles: [],
        ingresado: null,
        salido: null,
        cantidadSubidas: 0,
        cantidadBajadas: 0,
      };
    }

    const primero = puntosAceptadosNodos[0];

    const eventoInicio = {
      ...primero,
      tipo: "Inicio",
      delta: null,
      deltaL: null,
    };

    // Sin umbral de limpieza: comparar lecturas aceptadas consecutivas.
    if (umbralLimpiezaL <= 0) {
      const eventos = [eventoInicio];

      let ingresado = 0;
      let salido = 0;
      let cantidadSubidas = 0;
      let cantidadBajadas = 0;

      for (let i = 1; i < puntosAceptadosNodos.length; i++) {
        const a = puntosAceptadosNodos[i - 1];
        const b = puntosAceptadosNodos[i];

        const delta = b.nivel - a.nivel;

        if (delta === 0) continue;

        const deltaL =
          a.volumen != null && b.volumen != null
            ? b.volumen - a.volumen
            : null;

        eventos.push({
          ...b,
          anterior: a.indice,
          delta,
          deltaL,
          minutos: b.minutosDia - a.minutosDia,
          sinSenal: b.minutosDia - a.minutosDia > 30,
          tipo: delta > 0 ? "Subida" : "Bajada",
        });

        if (delta > 0) {
          cantidadSubidas++;
          if (deltaL != null) ingresado += deltaL;
        } else {
          cantidadBajadas++;
          if (deltaL != null) salido -= deltaL;
        }
      }

      const conVolumen = puntosAceptadosNodos.every(
        p => p.volumen != null
      );

      return {
        eventos,
        puntosVisibles: puntosAceptadosNodos,
        ingresado: conVolumen ? ingresado : null,
        salido: conVolumen ? salido : null,
        cantidadSubidas,
        cantidadBajadas,
      };
    }

    // Con umbral de limpieza: conservar el algoritmo actual,
    // pero utilizando únicamente lecturas aceptadas.
    const operaciones = operacionesNodosAceptados.operaciones;
    const indices = new Set([primero.indice]);
    const eventos = [eventoInicio];

    for (const op of operaciones) {
      indices.add(op.desde.indice);
      indices.add(op.hasta.indice);

      eventos.push({
        ...op.hasta,
        anterior: op.desde.indice,
        delta: op.delta,
        deltaL: op.deltaL,
        minutos: op.duracion,
        sinSenal: op.intervalosSinSenal > 0,
        tipo: op.delta > 0 ? "Subida" : "Bajada",
      });
    }

    return {
      eventos,
      puntosVisibles: puntosAceptadosNodos.filter(
        p => indices.has(p.indice)
      ),
      ingresado: operacionesNodosAceptados.totalCargasL,
      salido: operacionesNodosAceptados.totalDescargasL,
      cantidadSubidas: operacionesNodosAceptados.cantidadCargas,
      cantidadBajadas: operacionesNodosAceptados.cantidadDescargas,
    };
  }, [
    puntosAceptadosNodos,
    operacionesNodosAceptados,
    umbralLimpiezaL,
  ]);

  const intervalosExcluidosNodos = useMemo(() => {
    const resultado = [];
    let inicio = -1;

    for (let i = 0; i <= puntos.length; i++) {
      const excluido =
        i < puntos.length &&
        lecturasExcluidasNodos.has(puntos[i].idLectura);

      if (excluido && inicio < 0) {
        inicio = i;
      }

      if (!excluido && inicio >= 0) {
        const antes = puntos[inicio - 1];
        const despues = puntos[i];
        const primero = puntos[inicio];
        const ultimo = puntos[i - 1];

        resultado.push({
          desde: antes
            ? (antes.minutosDia + primero.minutosDia) / 2
            : primero.minutosDia,
          hasta: despues
            ? (ultimo.minutosDia + despues.minutosDia) / 2
            : ultimo.minutosDia,
        });

        inicio = -1;
      }
    }

    return resultado;
  }, [puntos, lecturasExcluidasNodos]);

  const intervalosExcluidosOperaciones = useMemo(() => {
    const resultado = [];
    let inicio = -1;

    for (let i = 0; i <= puntos.length; i++) {
      const excluido =
        i < puntos.length &&
        lecturasExcluidasOperaciones.has(puntos[i].idLectura);

      if (excluido && inicio < 0) {
        inicio = i;
      }

      if (!excluido && inicio >= 0) {
        const antes = puntos[inicio - 1];
        const despues = puntos[i];
        const primero = puntos[inicio];
        const ultimo = puntos[i - 1];

        resultado.push({
          desde: antes
            ? (antes.minutosDia + primero.minutosDia) / 2
            : primero.minutosDia,
          hasta: despues
            ? (ultimo.minutosDia + despues.minutosDia) / 2
            : ultimo.minutosDia,
        });

        inicio = -1;
      }
    }

    return resultado;
  }, [puntos, lecturasExcluidasOperaciones]);

  const resumenVolumenSCADA = useMemo(() => {

    if (!puntos.length) {
      return {
        ingresado: null,
        salido: null,
      };
    }

    if (tipoAnalisis === "operaciones") {
      return {
        ingresado: analisisOperacionesVista.totalCargasL,
        salido: analisisOperacionesVista.totalDescargasL,
      };
    }

    if (tipoAnalisis === "nodos") {
      return {
        ingresado: analisisNodosLimpios.ingresado,
        salido: analisisNodosLimpios.salido,
      };
    }

    return {
      ingresado: analisis.subidasL,
      salido: analisis.bajadasL,
    };
  }, [tipoAnalisis, analisis, analisisOperacionesVista, analisisNodosLimpios, puntos.length,]);

  // const balanceFiltroSCADA = useMemo(() => {
  //   const netoReal = analisis.netoL;

  //   const ingresado = resumenVolumenSCADA.ingresado;
  //   const salido = resumenVolumenSCADA.salido;

  //   if (
  //     netoReal == null ||
  //     ingresado == null ||
  //     salido == null
  //   ) {
  //     return {
  //       netoReal,
  //       netoFiltrado: null,
  //       residual: null,
  //     };
  //   }

  //   const netoFiltrado = ingresado - salido;

  //   return {
  //     netoReal,
  //     netoFiltrado,
  //     residual: netoReal - netoFiltrado,
  //   };
  // }, [analisis.netoL, resumenVolumenSCADA]);

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

    const filtroActivo =
      tipoAnalisis === "nodos" &&
      (umbralLimpiezaL > 0 || lecturasExcluidasEnPeriodo.length > 0);

    const indicesAceptados = new Set(
      analisisNodosLimpios.puntosVisibles.map(p => p.indice)
    );

    const datosFiltrados = puntos.map(p => ({
      x: p.minutosDia,
      y: tipoAnalisis === "nodos" && filtroActivo
        ? (
          indicesAceptados.has(p.indice) &&
            !lecturasExcluidasNodos.has(p.idLectura)
            ? valorDe(p)
            : null
        )
        : valorDe(p),
    }));

    const base = {
      label: esVolumen ? 'Volumen (L)' : 'Nivel (m)',
      data: datosFiltrados,
      borderColor: tipoAnalisis === 'nodos' ? AZUL : 'rgba(8,124,255,.24)',
      backgroundColor: 'rgba(8,124,255,.08)',
      fill: tipoAnalisis === 'nodos' ? 'origin' : false,
      tension: 0, borderWidth: tipoAnalisis === 'nodos' ? 2.5 : 1.5,
      pointRadius: tipoAnalisis === 'nodos' ? 2.8 : 0,
      pointHoverRadius: 5, spanGaps: true,
      segment: {
        borderColor: ({ p0DataIndex, p1DataIndex }) => {
          const desde = puntos[p0DataIndex]?.minutosDia;
          const hasta = puntos[p1DataIndex]?.minutosDia;

          if (desde == null || hasta == null) {
            return AZUL;
          }

          const contieneVacio = tramosSinSenal.some(tramo =>
            tramo.desde < hasta && tramo.hasta > desde
          );

          if (contieneVacio) return ROJO;

          return tipoAnalisis === "nodos"
            ? AZUL
            : "rgba(8,124,255,.24)";
        },
      },
    };


    if (tipoAnalisis === 'original') return {
      datasets: [
        {
          label: esVolumen ? 'Volumen calculado (L)' : 'Lectura SCADA (m)',
          data: puntos.map(p => ({
            x: p.minutosDia,
            y: esVolumen ? p.volumen : p.nivel
          })),
          parsing: false,
          borderColor: AZUL,
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0,
          pointRadius: 3,
          pointBackgroundColor: MORADO,
          pointBorderColor: "#FFFFFF",
          pointBorderWidth: 1,
          pointHoverRadius: 6,
          pointHitRadius: 9,
          spanGaps: false,
          showLine: true
        },
        {
          label: 'Escaleras de variación',
          data: puntos.map(p => ({
            x: p.minutosDia,
            y: esVolumen ? p.volumen : p.nivel
          })),
          parsing: false,
          borderColor: ROJO,
          borderWidth: 2,
          borderDash: [6, 4],
          stepped: 'before',
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHitRadius: 0,
          spanGaps: false,
          showLine: true,
          order: 2
        }
      ]
    };

    if (tipoAnalisis === "nodos") {
      return {
        datasets: [
          {
            ...base,
            parsing: false,
            pointRadius: (ctx) => {
              const p = puntos[ctx.dataIndex];

              return p &&
                indicesAceptados.has(p.indice) &&
                !lecturasExcluidasNodos.has(p.idLectura)
                ? 3
                : 0;
            },
          },
          {
            label: "Lecturas excluidas manualmente",
            data: puntos.map(p => ({
              x: p.minutosDia,
              y: lecturasExcluidasNodos.has(p.idLectura)
                ? valorDe(p)
                : null,
            })),
            parsing: false,
            showLine: false,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointStyle: "crossRot",
            pointBorderWidth: 2,
            pointBorderColor: MORADO,
            pointBackgroundColor: MORADO,
          },
        ],
      };
    }

    const eventos = analisisOperacionesVista.operaciones;

    const destacados = eventos.map(ev => ({
      label: ev.tipo || "Movimiento estimado",
      data: [ev.desde, ev.hasta].map(p => ({
        x: p.minutosDia,
        y: valorDe(p),
      })),
      parsing: false,
      borderColor: ev.delta < 0 ? ROJO : VERDE,
      backgroundColor: ev.delta < 0 ? ROJO : VERDE,
      pointBackgroundColor: ev.delta < 0 ? ROJO : VERDE,
      pointBorderColor: "#fff",
      pointBorderWidth: 1.5,
      pointRadius: 5.5,
      pointHoverRadius: 7,
      borderWidth: 3.2,
      showLine: true,
      fill: false,
      tension: 0,
      evento: ev,
    }));

    const hayExclusiones =
      lecturasExcluidasOperacionesPeriodo.length > 0;

    if (!hayExclusiones) {
      return {
        datasets: [base, ...destacados],
      };
    }

    const baseDepurada = {
      ...base,
      parsing: false,
      data: puntos.map(p => ({
        x: p.minutosDia,
        y: lecturasExcluidasOperaciones.has(p.idLectura)
          ? null
          : valorDe(p),
      })),
    };

    const puntosExcluidos = {
      label: "Extremos excluidos manualmente",
      data: puntos.map(p => ({
        x: p.minutosDia,
        y: lecturasExcluidasOperaciones.has(p.idLectura)
          ? valorDe(p)
          : null,
      })),
      parsing: false,
      showLine: false,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointStyle: "crossRot",
      pointBorderWidth: 2,
      pointBorderColor: MORADO,
      pointBackgroundColor: MORADO,
      lecturaExcluidaOperacion: true,
    };

    return {
      datasets: [
        baseDepurada,
        ...destacados,
        puntosExcluidos,
      ],
    };
  }, [
    puntos,
    esVolumen,
    tipoAnalisis,
    analisisOperaciones,
    analisisNodosLimpios,
    umbralLimpiezaL,
    tramosSinSenal,
    lecturasExcluidasNodos,
    lecturasExcluidasEnPeriodo,
    analisisOperacionesVista,
    lecturasExcluidasOperaciones,
    lecturasExcluidasOperacionesPeriodo,
  ]);

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
        sombreadoExclusionesNodos: {
          activo:
            tipoAnalisis === "nodos" ||
            tipoAnalisis === "operaciones",

          intervalos:
            tipoAnalisis === "operaciones"
              ? intervalosExcluidosOperaciones
              : intervalosExcluidosNodos,
        },
        escalerasAnalisisCocli: {
          activo:
            tipoAnalisis !== "original" &&
            !(tipoAnalisis === "nodos" &&
              lecturasExcluidasEnPeriodo.length > 0) &&
            !(tipoAnalisis === "operaciones" &&
              lecturasExcluidasOperacionesPeriodo.length > 0),
          tipo: tipoAnalisis,
          puntos,
          eventos: tipoAnalisis === "nodos"
            ? analisisNodosLimpios.eventos
            : analisis.eventos,
          operaciones: analisisOperacionesVista.operaciones,
          simplificado: umbralLimpiezaL > 0,
        },

        deltaEscalonadoCocli: {
          eventos: tipoAnalisis === "nodos"
            ? analisisNodosLimpios.eventos
            : [],
          puntos: tipoAnalisis === "nodos"
            ? analisisNodosLimpios.puntosVisibles
            : puntos,
          etiquetas: tipoAnalisis === "nodos" && mostrarEtiquetas,
          modo: visualizacion,
          filtrado:
            tipoAnalisis === "nodos" &&
            (umbralLimpiezaL > 0 || lecturasExcluidasEnPeriodo.length > 0),
        },

        etiquetasTotalesSCADA: {
          mostrar: tipoAnalisis === "operaciones" && mostrarEtiquetas,
          operaciones: analisisOperacionesVista.operaciones,
          modo: visualizacion,
        },

        tooltip: {
          callbacks: {
            title: (items) => {
              const ctx = items[0];

              if (ctx?.dataset?.lecturaExcluidaOperacion) {
                const p = puntos[ctx.dataIndex];

                return p
                  ? `${p.fecha} ${p.horaReal}`
                  : etiquetaPeriodo;
              }

              const p = (
                ctx?.datasetIndex === 0 ||
                (tipoAnalisis === "nodos" && ctx?.datasetIndex === 1)
              )
                ? puntos[ctx.dataIndex]
                : (
                  ctx?.dataIndex === 0
                    ? ctx?.dataset?.evento?.desde
                    : ctx?.dataset?.evento?.hasta
                );
              return p ? `${p.fecha} ${p.horaReal}` : etiquetaPeriodo;
            },
            label: (ctx) => {

              if (ctx.dataset?.lecturaExcluidaOperacion) {
                const p = puntos[ctx.dataIndex];

                return p
                  ? [
                    "Extremo excluido manualmente",
                    `Nivel: ${conUnidad(p.nivel, "m", 3)}`,
                    `Volumen: ${conUnidad(p.volumen, "L", 0)}`,
                    "Lectura no incluida en el análisis",
                  ]
                  : "";
              }

              if (tipoAnalisis === "original" && ctx.datasetIndex > 0) {
                const punto = puntos[ctx.dataIndex];

                if (!punto) return "";

                return [
                  `Hora real: ${punto.fecha} ${punto.horaReal}`,
                  `Lectura SCADA: ${conUnidad(punto.nivel, "m", 3)}`,
                  esVolumen
                    ? `Volumen calculado: ${conUnidad(punto.volumen, "L", 0)}`
                    : "",
                ].filter(Boolean);
              }

              if (tipoAnalisis === "nodos" && ctx.datasetIndex === 1) {
                const rechazado = puntos[ctx.dataIndex];

                return rechazado
                  ? [
                    "Lectura excluida manualmente",
                    conUnidad(rechazado.nivel, "m", 3),
                    conUnidad(rechazado.volumen, "L", 0),
                  ]
                  : "";
              }

              const p = ctx.datasetIndex === 0 ? puntos[ctx.dataIndex] :
                (ctx.dataIndex === 0 ? ctx.dataset.evento?.desde : ctx.dataset.evento?.hasta);
              if (!p) return '';

              // if (tipoAnalisis === "original" && ctx.datasetIndex > 0) {
              //   return [
              //     `Hora real: ${p.fecha} ${p.horaReal}`,
              //     `Lectura SCADA: ${p.nivel} m`,
              //     esVolumen ? `Volumen calculado: ${p.volumen} L` : "",
              //   ].filter(Boolean);
              // }

              if (ctx.datasetIndex > 0) return [ctx.dataset.label,
              `Hora: ${p.fecha} ${p.horaReal}`, conUnidad(p.nivel, 'm', 3), conUnidad(p.volumen, 'L', 0),
              `Total evento: ${signo(ctx.dataset.evento.delta, 'm', 3)} / ${signo(ctx.dataset.evento.deltaL, 'L', 0)}`];
              if (tipoAnalisis === "original") return [
                `Hora real: ${p.fecha} ${p.horaReal}`,
                `Lectura SCADA: ${p.nivel} m`,
                esVolumen ? `Volumen calculado: ${p.volumen} L` : ''
              ].filter(Boolean);
              const eventosTooltip = tipoAnalisis === "nodos"
                ? analisisNodosLimpios.eventos
                : analisis.eventos;

              const e = eventosTooltip.find(
                ev => ev.indice === ctx.dataIndex && ev.tipo !== "Inicio"
              );
              return [
                conUnidad(p.nivel, "m", 2),
                conUnidad(p.volumen, "L", 0),
                e
                  ? `Movimiento aceptado: ${signo(e.delta, "m", 6)} / ${signo(e.deltaL, "L", 0)}`
                  : tipoAnalisis === "nodos" && umbralLimpiezaL > 0
                    ? "Punto de referencia del análisis filtrado"
                    : "Sin variación contabilizada respecto a la lectura anterior",
                e?.sinSenal
                  ? `Movimiento de ${fmt(e.minutos, 1)} min con intervalo(s) sin señal`
                  : "",
                (tipoAnalisis === "operaciones"
                  ? analisisOperacionesVista.extremos
                  : analisisOperaciones.extremos
                ).find(ex => ex.indice === ctx.dataIndex)?.clase || "",
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

  }, [
    puntos,
    analisis.eventos,
    analisisOperaciones,
    tipoAnalisis,
    tramosSinSenal,
    fechaConsultada,
    visualizacion,
    esVolumen,
    mostrarEtiquetas,
    analisisNodosLimpios,
    umbralLimpiezaL,
    modoDia,
    etiquetaPeriodo,
    intervalosExcluidosNodos,
    lecturasExcluidasEnPeriodo,
    analisisOperacionesVista,
    intervalosExcluidosOperaciones,
    lecturasExcluidasOperacionesPeriodo,
  ]);

  const consultar = () => {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { setError("Selecciona una fecha válida"); return; }
    setFechaConsultada(fecha);
    setActualizar((x) => x + 1);

  };

  const filas = useMemo(() => {
    if (tipoAnalisis === "operaciones") {
      const eventosAceptados = analisisOperacionesVista.operaciones.map(op => ({
        ...op.hasta,
        fecha: op.hasta.fecha,
        hora: op.hasta.hora,
        valor: op.hasta.nivel,
        volumen: op.hasta.volumen,
        delta: op.delta,
        deltaL: op.deltaL,
        tipo: op.tipo,
        anterior: op.desde.indice,
        parcial: op.parcial,
      }));

      if (!lecturasExcluidasOperacionesPeriodo.length) {
        return eventosAceptados;
      }

      const eventosExcluidos = lecturasExcluidasOperacionesPeriodo.map(p => ({
        ...p,
        tipo: "Lectura excluida manualmente",
        delta: null,
        deltaL: null,
        excluido: true,
      }));

      return [...eventosAceptados, ...eventosExcluidos]
        .sort((a, b) =>
          a.minutosDia - b.minutosDia || a.indice - b.indice
        );
    }

    if (tipoAnalisis === "nodos") {
      const excluidos = lecturasExcluidasEnPeriodo.map(p => ({
        ...p,
        tipo: "Excluido",
        delta: null,
        deltaL: null,
        excluido: true,
      }));

      return [...analisisNodosLimpios.eventos, ...excluidos]
        .sort((a, b) =>
          a.minutosDia - b.minutosDia || a.indice - b.indice
        );
    }

    return analisis.eventos;

  }, [
    tipoAnalisis,
    analisisOperaciones,
    analisisNodosLimpios,
    analisis,
    lecturasExcluidasEnPeriodo,
    analisisOperacionesVista,
    analisisOperacionesVista,
    lecturasExcluidasOperacionesPeriodo,
  ]);

  const exportarCSV = () => {
    const contenido = Papa.unparse(filas.map((e) => ({
      Fecha: e.fecha, Periodo: modoDia === "inventario" ? "Día inventario" : "Día natural", Tanque: tituloTanque, Hora: e.hora,
      Nivel: redondear(e.valor, 4) ?? "",
      Unidad: unidadNivel,
      Volumen_L: redondear(e.volumen, 0) ?? "",
      Cambio_nivel: redondear(e.delta, 6) ?? "",
      Cambio_L: redondear(e.deltaL, 0) ?? "", Movimiento: e.tipo,
    })), { delimiter: ";" });

    const url = URL.createObjectURL(new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `SCADA_${tituloTanque}_${fechaConsultada}_${modoDia}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);

  };

  const l = (v) => conUnidad(v, "L", 0);
  const nivel = (v) => conUnidad(v, unidadNivel);
  const mayor = (e) => e ? `${signo(e.delta, unidadNivel)}${e.deltaL != null ? ` (${signo(e.deltaL, "L", 0)})` : ""} a las ${e.fecha} ${e.hora}${e.sinSenal ? " (intervalo sin señal)" : ""}` : "—";
  const ultimo = analisis.final
    ? `${analisis.final.fecha} ${analisis.final.horaReal}`
    : "—";

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


          <ExportarInformeSCADAPDF
            tituloTanque={tituloTanque}
            fechaConsultada={fechaConsultada}
            factor={factor}
            puntos={puntos}
            eventos={analisis.eventos}
            eventosNodos={analisisNodosLimpios.eventos}
            operaciones={analisisOperacionesVista.operaciones}
            puntosVisiblesNodos={analisisNodosLimpios.puntosVisibles}
            lecturasExcluidasNodos={lecturasExcluidasNodos}
            lecturasExcluidasOperaciones={lecturasExcluidasOperaciones}
            umbralLimpiezaL={umbralLimpiezaL}
            resumenMovimientosPorModo={{
              original: {
                ingresado: analisis.subidasL,
                salido: analisis.bajadasL,
              },
              nodos: {
                ingresado: analisisNodosLimpios.ingresado,
                salido: analisisNodosLimpios.salido,
              },
              operaciones: {
                ingresado: analisisOperacionesVista.totalCargasL,
                salido: analisisOperacionesVista.totalDescargasL,
              },
            }}
            tramosSinSenal={tramosSinSenal}
            tipo={tipoAnalisis}
            unidad={visualizacion}
            modoDia={modoDia}
            chartRef={chartRef}
            analisisSCADA={analisis}
            resumenVolumenSCADA={resumenVolumenSCADA}
            resumenDespachos={resumenDespachos}
            resumenBascula={resumenBascula}
            producto={producto}
            capacidad={capacidad}
            gradoAlcoholico={gradoAlcoholico}
            etiquetaPeriodo={etiquetaPeriodo}
            disabled={!tieneSensor || !filas.length || cargando}
          />

        </Box>

        <Box sx={{ alignSelf: "end" }}>
          <Button
            variant="outlined"
            onClick={() => setModoDia((prev) => prev === "natural" ? "inventario" : "natural")}
            title="Alternar entre día natural y día inventario"
            sx={{
              height: 38, minWidth: 145, textTransform: "none", fontSize: 12,
              borderColor: AZUL, color: AZUL, fontWeight: 800, whiteSpace: "nowrap"
            }}
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
                <MenuItem value="nodos">Nodos (lectura a lectura / filtrados)</MenuItem>
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

              <TextField
                size="small"
                type="number"
                label={`Filtro de ruido (${esVolumen ? "L" : "m"})`}
                value={umbralTexto}
                onChange={(e) => setUmbralTexto(e.target.value)}
                onBlur={() => {
                  const valor = Number(umbralTexto);

                  if (!Number.isFinite(valor) || valor < 0) {
                    setUmbralTexto(
                      String(Number(umbralMostrado.toFixed(esVolumen ? 2 : 8)))
                    );
                    return;
                  }

                  const nuevoUmbralL =
                    esVolumen ? valor : valor * (factor ?? 0);

                  setUmbralLimpiezaL(nuevoUmbralL);
                }}
                disabled={factor == null}
                inputProps={{ min: 0, step: "any" }}
                sx={{
                  width: 90,
                  "& .MuiInputBase-root": {
                    height: 36,
                    fontSize: 12,
                    bgcolor: umbralLimpiezaL > 0 ? "#F0FFF5" : "#fff",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: umbralLimpiezaL > 0 ? VERDE : BORDE,
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: 11,
                    fontWeight: 700,
                  },
                }}
              />

              {/* {umbralLimpiezaL > 0 && (
                <Typography sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: VERDE,
                  whiteSpace: "nowrap",
                }}>
                  Filtro: {fmt(umbralLimpiezaL, 2)} L
                </Typography>
              )} */}
              {/* 
              {tipoAnalisis !== "original" && <Button size="small" onClick={() => setMostrarEtiquetas((v) => !v)} sx={{ fontSize: 10, textTransform: "none", p: 0 }}>
                {mostrarEtiquetas ? "Ocultar etiquetas" : "Ver etiquetas"}
              </Button>} */}

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
            {analisis.inicial ? <Line data={dataGrafico} options={opcionesGrafico} plugins={[sombreadoSinSenal, sombreadoExclusionesNodos, escalerasAnalisis, deltaEscalonado, etiquetasTotalesSCADA]} ref={chartRef} />

              : <Box sx={{ height: "100%", display: "grid", placeItems: "center", border: `1px dashed ${BORDE}`, borderRadius: 1.5, fontSize: 13, color: "#56739d" }}>
                Sin lecturas para el tanque y la fecha seleccionados</Box>}
          </Box>

          {tipoAnalisis !== "original" && tramosSinSenal.length > 0 && (
            <Typography sx={{ color: "#9a4b36", fontSize: 10.5, mb: 1 }}>
              Tramos rojos: intervalos entre lecturas SCADA superiores a 30 minutos.
              La unión es visual; el cambio neto entre los extremos sí se incluye, pero no representa movimientos intermedios medidos.
            </Typography>
          )}

          {(
            (tipoAnalisis === "nodos" && lecturasExcluidasEnPeriodo.length > 0) ||
            (tipoAnalisis === "operaciones" && lecturasExcluidasOperacionesPeriodo.length > 0)
          ) && (
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#6847A3",
                  bgcolor: "#F7F3FF",
                  borderLeft: `3px solid ${MORADO}`,
                  px: 1,
                  py: 0.6,
                  mb: 1,
                  borderRadius: 0.5,
                }}
              >
                Análisis depurado: los movimientos se recalculan utilizando las
                lecturas aceptadas. Los tramos que atraviesan lecturas excluidas
                representan variaciones estimadas entre extremos observados.
              </Typography>
            )}

          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: .7 }}><CalendarMonthIcon sx={{ color: AZUL }} />
            <Typography sx={{ fontWeight: 800, color: "#0636ad", fontSize: 15 }}>Eventos registrados durante el día (cada variación observada)</Typography>
          </Stack>

          <Typography sx={{ mb: 0.7, fontSize: 11, color: "#42608d" }}>
            {puntos.length} lecturas originales ·{" "}

            {tipoAnalisis === "operaciones"
              ? analisisOperacionesVista.cantidadCargas
              : tipoAnalisis === "nodos"
                ? analisisNodosLimpios.cantidadSubidas
                : analisis.cantidadSubidas} subidas ·{" "}

            {tipoAnalisis === "operaciones"
              ? analisisOperacionesVista.cantidadDescargas
              : tipoAnalisis === "nodos"
                ? analisisNodosLimpios.cantidadBajadas
                : analisis.cantidadBajadas} bajadas ·{" "}

            {tramosSinSenal.length} intervalos sin señal (&gt;30 min)
          </Typography>
          {tipoAnalisis === "nodos" && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              sx={{
                px: 1,
                py: 0.7,
                mb: 1,
                bgcolor: "#F5F1FF",
                border: "1px solid #E4D9FF",
                borderRadius: 1.2,
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: MARINO, fontWeight: 700 }}>
                Depuración manual · {lecturasExcluidasEnPeriodo.length} excluidas ·{" "}
                {puntosAceptadosNodos.length} aceptadas
              </Typography>

              <Button
                size="small"
                variant="outlined"
                disabled={!lecturasExcluidasEnPeriodo.length}
                onClick={() => {
                  setLecturasExcluidasNodos(anterior => {
                    const siguiente = new Set(anterior);

                    lecturasExcluidasEnPeriodo.forEach(p => {
                      siguiente.delete(p.idLectura);
                    });

                    return siguiente;
                  });
                }}
                sx={{
                  textTransform: "none",
                  fontSize: 11,
                  color: MORADO,
                  borderColor: MORADO,
                }}
              >
                Restaurar lecturas
              </Button>
            </Stack>
          )}

          {tipoAnalisis === "operaciones" && (
            <Typography sx={{ mb: 1, fontSize: 11, color: "#42608d" }}>
              {`${analisisOperacionesVista.cantidadCargas} cargas estimadas (${conUnidad(analisisOperacionesVista.totalCargasL, "L", 0)}) · ${analisisOperacionesVista.cantidadDescargas} descargas estimadas (${conUnidad(analisisOperacionesVista.totalDescargasL, "L", 0)}). Rojo: descenso. Verde: ascenso. La operación se cierra al confirmar una reversión significativa. Los movimientos finales pueden quedar parcialmente reconocidos. `}
              {`Umbral efectivo de movimiento: ${fmt(umbralMovimientoMetros, 6)} m. Los movimientos deben superar este valor para contabilizarse. `}
            </Typography>
          )}
          {tipoAnalisis === "operaciones" && (

            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                sx={{
                  px: 1,
                  py: 0.7,
                  mb: 1,
                  bgcolor: "#F5F1FF",
                  border: "1px solid #E4D9FF",
                  borderRadius: 1.2,
                }}
              >
                <Typography sx={{ fontSize: 11.5, color: MARINO, fontWeight: 700 }}>
                  Depuración Crestas/Valles ·{" "}
                  {lecturasExcluidasOperacionesPeriodo.length} excluidas ·{" "}
                  {puntosAceptadosOperaciones.length} aceptadas
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={!lecturasExcluidasOperacionesPeriodo.length}
                  onClick={() => {
                    setLecturasExcluidasOperaciones(anterior => {
                      const siguiente = new Set(anterior);

                      lecturasExcluidasOperacionesPeriodo.forEach(p => {
                        siguiente.delete(p.idLectura);
                      });

                      return siguiente;
                    });
                  }}
                  sx={{
                    textTransform: "none",
                    fontSize: 11,
                    color: MORADO,
                    borderColor: MORADO,
                  }}
                >
                  Restaurar lecturas
                </Button>
              </Stack>
              <TableContainer sx={{ maxHeight: 320, border: `1px solid ${BORDE}`, borderRadius: 1.1, mb: 1 }}>
                <Table stickyHeader size="small" sx={{ "& .MuiTableCell-root": { fontSize: 11, py: .55 } }}>
                  <TableHead><TableRow>
                    <TableCell>Tipo</TableCell><TableCell>Desde</TableCell><TableCell>Hasta</TableCell>
                    <TableCell align="right">Δ nivel (m)</TableCell>
                    <TableCell align="right">Δ volumen (L)</TableCell>
                    <TableCell align="right">Duración (min)</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center" sx={{ width: 75 }}>Incluir</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {analisisOperacionesVista.operaciones.map(ev => (
                      <TableRow key={ev.id} sx={{ bgcolor: ev.delta < 0 ? "#fff5f1" : "#eefbf2" }}>
                        <TableCell sx={{ color: ev.delta < 0 ? ROJO : VERDE, fontWeight: 700 }}>{ev.tipo}</TableCell>
                        <TableCell>{ev.desde.fecha} {ev.desde.horaReal} ({fmt(ev.desde.nivel, 3)} m)</TableCell>
                        <TableCell>{ev.hasta.fecha} {ev.hasta.horaReal} ({fmt(ev.hasta.nivel, 3)} m)</TableCell>
                        <TableCell align="right">{signo(ev.delta, "m", 3)}</TableCell>
                        <TableCell align="right">{signo(ev.deltaL, "L", 0)}</TableCell>
                        <TableCell align="right">{fmt(ev.duracion, 1)}</TableCell>
                        <TableCell>{ev.intervalosSinSenal > 0 ? `Estimado · ${ev.intervalosSinSenal} vacío(s) SCADA` : ev.parcial ? "Parcial / límite del tramo" : "Giro confirmado"}</TableCell>
                        <TableCell align="center">
                          <Checkbox
                            size="small"
                            checked={
                              !lecturasExcluidasOperaciones.has(ev.hasta.idLectura)
                            }
                            onChange={() => {
                              alternarLecturaOperacion(ev.hasta.idLectura);
                            }}
                            inputProps={{
                              "aria-label": `Incluir extremo ${ev.hasta.fecha} ${ev.hasta.horaReal}`,
                            }}
                            sx={{
                              p: 0.2,
                              color: MORADO,
                              "&.Mui-checked": {
                                color: VERDE,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {analisisOperacionesVista.operaciones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          Sin movimientos que cumplan el umbral
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {lecturasExcluidasOperacionesPeriodo.length > 0 && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      color: MORADO,
                      fontWeight: 800,
                      mb: 0.5,
                    }}
                  >
                    Extremos excluidos manualmente
                  </Typography>

                  <TableContainer
                    sx={{
                      border: "1px solid #E4D9FF",
                      borderRadius: 1,
                      maxHeight: 180,
                    }}
                  >
                    <Table
                      size="small"
                      sx={{
                        "& .MuiTableCell-root": {
                          fontSize: 11,
                          py: 0.5,
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha / Hora</TableCell>
                          <TableCell align="right">Nivel (m)</TableCell>
                          <TableCell align="right">Volumen (L)</TableCell>
                          <TableCell align="center">Incluir</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {lecturasExcluidasOperacionesPeriodo.map(p => (
                          <TableRow
                            key={p.idLectura}
                            sx={{ bgcolor: "#F7F3FF" }}
                          >
                            <TableCell>
                              {p.fecha} {p.horaReal}
                            </TableCell>

                            <TableCell align="right">
                              {fmt(p.nivel, 3)}
                            </TableCell>

                            <TableCell align="right">
                              {fmt(p.volumen, 0)}
                            </TableCell>

                            <TableCell align="center">
                              <Checkbox
                                size="small"
                                checked={false}
                                onChange={() => {
                                  alternarLecturaOperacion(p.idLectura);
                                }}
                                sx={{ color: MORADO, p: 0.2 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
          {(tipoAnalisis === "nodos" || tipoAnalisis === "original") && (
            <TableContainer sx={{ maxHeight: 355, border: `1px solid ${BORDE}`, borderRadius: 1.1 }}>

              <Table stickyHeader size="small" sx={{ minWidth: tipoAnalisis === "nodos" ? 720 : 640, tableLayout: "fixed", "& .MuiTableCell-root": { fontSize: 11.5, px: .6, py: .4, borderRight: `1px solid ${BORDE}` }, "& .MuiTableHead-root .MuiTableCell-root": { bgcolor: "#eff5fc", fontWeight: 800, textAlign: "center" } }}>
                <TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Nivel ({unidadNivel})</TableCell><TableCell>Volumen (L)</TableCell><TableCell>Cambio ({unidadNivel})</TableCell><TableCell>Cambio (L)</TableCell><TableCell>Tipo de movimiento</TableCell> {tipoAnalisis === "nodos" && (
                  <TableCell sx={{ width: 70 }} align="center">
                    Incluir
                  </TableCell>
                )}</TableRow></TableHead>

                <TableBody>{!filas.length ? <TableRow><TableCell colSpan={tipoAnalisis === "nodos" ? 7 : 6} align="center">No hay datos disponibles</TableCell></TableRow> : filas.map((e) => <TableRow key={`${e.fecha}-${e.hora}-${e.indice}`} sx={{ bgcolor: e.tipo === "Subida" ? "#eefbf2" : e.tipo === "Bajada" ? "#fff5f0" : "#fff" }}>

                  <TableCell align="center">{e.fecha} {e.hora}{e.sinSenal ? " ⚠" : ""}</TableCell><TableCell align="center">{fmt(e.valor)}</TableCell>
                  <TableCell align="center">{fmt(e.volumen, 0)}</TableCell>
                  <TableCell align="center">{e.delta == null ? "0,00" : signo(e.delta, "")}</TableCell>
                  <TableCell align="center">{e.deltaL == null ? e.tipo === "Inicio" ? "0" : "—" : signo(e.deltaL, "", 0)}</TableCell>
                  <TableCell align="center" sx={{ color: e.tipo === "Subida" ? VERDE : e.tipo === "Bajada" ? ROJO : MARINO }}>
                    {e.excluido
                      ? "Excluido"
                      : e.tipo === "Subida"
                        ? <><ArrowUpwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Subida*</>
                        : e.tipo === "Bajada"
                          ? <><ArrowDownwardIcon sx={{ fontSize: 16, verticalAlign: "middle" }} /> Bajada*</>
                          : "—"
                    }
                  </TableCell>

                  {tipoAnalisis === "nodos" && (
                    <TableCell align="center">
                      <Checkbox
                        size="small"
                        checked={!lecturasExcluidasNodos.has(e.idLectura)}
                        onChange={() => alternarLecturaNodo(e.idLectura)}
                        inputProps={{
                          "aria-label": `Incluir lectura ${e.fecha} ${e.hora}`,
                        }}
                        sx={{
                          p: 0.2,
                          color: MORADO,
                          "&.Mui-checked": {
                            color: VERDE,
                          },
                        }}
                      />
                    </TableCell>
                  )}

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

          <EncabezadoSeccion
            titulo="Análisis de lecturas SCADA"
            periodo={etiquetaPeriodo}
            color={MORADO}
            fondo="#F5F1FF"
          />

          <Typography sx={{ fontSize: 10.5, color: "#6680a3", mb: 0.8 }}>
            Los niveles y volúmenes inicial/final corresponden a lecturas originales.
            Los movimientos acumulados corresponden al modo de análisis seleccionado.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel inicial" valor={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<WaterDropIcon fontSize="large" />} titulo="Nivel final" valor={nivel(analisis.final?.valor)} />
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen inicial" valor={l(analisis.inicial?.volumen)} detalle={nivel(analisis.inicial?.valor)} />
            <Indicador icono={<Inventory2OutlinedIcon fontSize="large" />} titulo="Volumen final" valor={l(analisis.final?.volumen)} detalle={nivel(analisis.final?.valor)} />
            {/* <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Volumen ingresado total*" valor={l(analisis.subidasL)} color={VERDE} />
            <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Salida total de volumen*" valor={l(analisis.bajadasL)} color={ROJO} /> */}
            <Indicador
              icono={<ArrowUpwardIcon fontSize="large" />}
              titulo="Volumen ingresado estimado*"
              valor={l(resumenVolumenSCADA.ingresado)}
              color={VERDE}
            />

            <Indicador
              icono={<ArrowDownwardIcon fontSize="large" />}
              titulo="Salida total de volumen*"
              valor={l(resumenVolumenSCADA.salido)}
              color={ROJO}
            />
            {/* <Indicador icono={<FunctionsIcon fontSize="large" />} titulo="Promedio de lecturas de volumen" valor={l(analisis.promedioL)} ancho /> */}
            {/* <Indicador icono={<ArrowUpwardIcon fontSize="large" />} titulo="Metros que subió" valor={analisis.inicial ? conUnidad(analisis.subidas, unidadNivel) : "—"} color={VERDE} /> */}
            {/* <Indicador icono={<ArrowDownwardIcon fontSize="large" />} titulo="Metros que bajó" valor={analisis.inicial ? conUnidad(analisis.bajadas, unidadNivel) : "—"} color={ROJO} /> */}
            {/* <Indicador icono={<ShowChartIcon fontSize="large" />} titulo="Promedio de lecturas de nivel" valor={nivel(analisis.promedio)} ancho /> */}

          </Box>

          {(
            <Box sx={{ mt: 1.5 }}>

              <EncabezadoSeccion titulo="Resumen del Análisis de despachos" periodo={etiquetaPeriodo} color={MORADO} fondo="#F5F1FF" />

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
                <Indicador
                  icono={<Inventory2OutlinedIcon fontSize="large" />}
                  titulo="Volumen contador Ambiocom"
                  valor={l(resumenDespachos.volumenAmbiocom)}
                />
                <Indicador
                  icono={<FunctionsIcon fontSize="large" />}
                  titulo="Volumen contador gravimétrico"
                  valor={l(resumenDespachos.volumenGravimetrico)}
                />
                <Indicador
                  icono={<WaterDropIcon fontSize="large" />}
                  titulo="Volumen programado a despachar"
                  valor={l(resumenDespachos.volumenProgramado)}
                />
                <Indicador
                  icono={<BarChartIcon fontSize="large" />}
                  titulo="Registros de despachos"
                  valor={resumenDespachos.cantidadDespachos}
                />
              </Box>
            </Box>
          )}

          {(
            <Box sx={{ mt: 1.5 }}>

              <EncabezadoSeccion titulo="Resumen del Análisis de Ventas báscula" periodo={etiquetaPeriodo} color={MORADO} fondo="#F5F1FF" />

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
                <Indicador
                  icono={<ArrowDownwardIcon fontSize="large" />}
                  titulo="Peso neto despachado · tanque seleccionado"
                  valor={`${fmt(resumenBascula.pesoNetoSalidas, 0)} kg`}
                  color={ROJO}
                />

                <Indicador
                  icono={<ArrowUpwardIcon fontSize="large" />}
                  titulo="Peso neto recibido · planta"
                  valor={`${fmt(resumenBascula.pesoNetoIngresos, 0)} kg`}
                  color={VERDE}
                />

                <Indicador
                  icono={<FunctionsIcon fontSize="large" />}
                  titulo="Volumen gravimétrico · báscula"
                  valor={l(resumenBascula.volumenGravimetrico)}
                  detalle={
                    `${resumenBascula.cantidadVolumenEstimado} vehículos con densidad estimada` +
                    (resumenBascula.cantidadSinDensidad
                      ? ` · ${resumenBascula.cantidadSinDensidad} sin densidad disponible`
                      : "")
                  }
                />

                <Indicador
                  icono={<DonutSmallIcon fontSize="large" />}
                  titulo="Densidad promedio ponderada"
                  valor={
                    resumenBascula.densidadPromedioPonderada == null
                      ? "—"
                      : `${fmt(resumenBascula.densidadPromedioPonderada, 5)} kg/L`
                  }
                  detalle={
                    resumenBascula.densidadReferencia == null
                      ? "Sin densidad de referencia"
                      : `Mediana de referencia: ${fmt(resumenBascula.densidadReferencia, 5)} kg/L`
                  }
                />

              </Box>

              <EncabezadoSeccion titulo="Resumen del Análisis Recepciones en báscula" periodo={etiquetaPeriodo} color={MORADO} fondo="#F5F1FF" />

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
                <Indicador
                  icono={<Inventory2OutlinedIcon fontSize="large" />}
                  titulo="Recepción nacional · peso neto"
                  valor={`${fmt(resumenBascula.pesoNetoNacional, 0)} kg`}
                  detalle={`${resumenBascula.cantidadNacionales} registros`}
                />
                <Indicador
                  icono={<Inventory2OutlinedIcon fontSize="large" />}
                  titulo="Recepción importación · peso neto"
                  valor={`${fmt(resumenBascula.pesoNetoImportacion, 0)} kg`}
                  detalle={`${resumenBascula.cantidadImportados} registros`}
                />

                <Indicador
                  icono={<WaterDropIcon fontSize="large" />}
                  titulo="R. nacional · volumen grav"
                  valor={conUnidad(resumenBascula.volumenEstimadoNacional, "L", 0)}
                  detalle={
                    resumenBascula.densidadEstimadaRecepciones == null
                      ? "Sin densidad de referencia disponible"
                      : `densidad ponderada: ${fmt(resumenBascula.densidadEstimadaRecepciones, 5)} kg/L`
                  }
                />

                <Indicador
                  icono={<WaterDropIcon fontSize="large" />}
                  titulo="R. importación · volumen grav"
                  valor={conUnidad(resumenBascula.volumenEstimadoImportacion, "L", 0)}
                  detalle={
                    resumenBascula.densidadEstimadaRecepciones == null
                      ? "Sin densidad de referencia disponible"
                      : `densidad ponderada: ${fmt(resumenBascula.densidadEstimadaRecepciones, 5)} kg/L`
                  }
                />
              </Box>

              <EncabezadoSeccion titulo=" Resumen del Análisis Movimientos en báscula" periodo={etiquetaPeriodo} color={MORADO} fondo="#F5F1FF" />

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: .85 }}>
                <Indicador
                  icono={<BarChartIcon fontSize="large" />}
                  titulo="Salidas registradas"
                  valor={resumenBascula.cantidadSalidas}
                />

                <Indicador
                  icono={<BarChartIcon fontSize="large" />}
                  titulo="Ingresos registrados"
                  valor={resumenBascula.cantidadIngresos}
                />
              </Box>

            </Box>
          )}


          {/* <Box sx={{ mt: 1, border: `1px solid ${BORDE}`, borderRadius: 1.5, bgcolor: "#f7fbff", overflow: "hidden" }}>
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

          </Box> */}
          {/* 
          <Typography sx={{ mt: .9, fontSize: 10.5, color: "#6680a3", lineHeight: 1.4 }}>
            *Las subidas y bajadas son diferencias entre lecturas consecutivas, no ingresos ni salidas logísticos confirmados.
            El promedio es aritmético sobre las lecturas válidas (no ponderado por tiempo). Cuando faltan lecturas, las diferencias calculadas son netas entre observaciones; no permiten reconstruir movimientos intermedios.
            Los factores, capacidad y producto proceden del catálogo actual de Gestión de Tanques.
          </Typography> */}

        </Paper>
      </Box>

    )
    }

    <GraficaSCADAModal
      open={modalGrafica}
      onClose={() => setModalGrafica(false)}
      tituloTanque={tituloTanque}
      fechaConsultada={fechaConsultada}
      factor={factor}
      puntos={puntos}
      eventos={
        tipoAnalisis === "nodos"
          ? analisisNodosLimpios.eventos
          : analisis.eventos
      }
      operaciones={analisisOperacionesVista.operaciones}
      tramosSinSenal={tramosSinSenal}
      tipoInicial={tipoAnalisis}
      unidadInicial={visualizacion}
      modoDia={modoDia}
    />

  </Box >;



}
