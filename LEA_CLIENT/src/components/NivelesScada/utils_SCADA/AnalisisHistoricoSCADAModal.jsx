import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import {
    Dialog, AppBar, Toolbar, Box, Typography, IconButton, TextField,
    Button, Paper, Stack, Alert, CircularProgress, ToggleButton,
    ToggleButtonGroup, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Tooltip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FunctionsIcon from "@mui/icons-material/Functions";
import DonutSmallIcon from "@mui/icons-material/DonutSmall";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip as ChartTooltip, Legend, } from "chart.js";

ChartJS.register(LinearScale, PointElement, LineElement, ChartTooltip, Legend);

const AZUL = "#087cff";
const MARINO = "#081c6a";
const VERDE = "#009846";
const ROJO = "#f04321";
const MORADO = "#7b3ff2";
const BORDE = "#dce7f3";
const MAX_DIAS = 120;
const TAMANO_LOTE = 5;
const FRECUENCIA_MIN = 30;

const num = (valor) => {
    const v = valor?.$numberDecimal ?? valor;
    if (v === null || v === undefined || v === "") return null;
    const resultado = Number(v);
    return Number.isFinite(resultado) ? resultado : null;
};

const fmt = (valor, decimales = 2) => {
    const v = num(valor);
    return v === null ? "—" : v.toLocaleString("es-CO", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    });
};

const fmtUnid = (valor, unidad, decimales = 2) =>
    num(valor) === null ? "—" : `${fmt(valor, decimales)} ${unidad}`;

const fechaBogota = () => {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());

    const p = (tipo) => partes.find((x) => x.type === tipo)?.value;
    return `${p("year")}-${p("month")}-${p("day")}`;
};

const fechaValida = (valor) => {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const date = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valor;
};

const diaAnterior = (fecha) => {
    const date = new Date(`${fecha}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
};

const contarDias = (desde, hasta) => {
    if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) return 0;
    return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400000) + 1;
};

const fechasDelRango = (desde, hasta) => {
    const fechas = [];
    const total = contarDias(desde, hasta);
    if (!total || total > MAX_DIAS) return fechas;
    for (let i = 0; i < total; i++) {
        fechas.push(new Date(Date.parse(`${desde}T00:00:00Z`) + i * 86400000).toISOString().slice(0, 10));
    }

    return fechas;
};

const clave = (valor) => String(valor ?? "").toUpperCase().trim()

    .replace(/^(LT|TK)[-\s]*/, "").replace(/[^A-Z0-9]/g, "");



const registrosDe = (respuesta) => {

    if (Array.isArray(respuesta)) return respuesta;

    if (Array.isArray(respuesta?.data)) return respuesta.data;

    throw new Error("La respuesta del servidor no contiene un arreglo de registros.");

};



const minutosDesde = (fecha, hora, inicio) => {

    if (!fechaValida(fecha)) return null;

    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(hora ?? "").trim());

    if (!match) return null;

    const h = Number(match[1]);

    const m = Number(match[2]);

    const s = Number(match[3] ?? 0);

    if (h > 23 || m > 59 || s > 59) return null;

    return (Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 60000

        + h * 60 + m + s / 60;

};



const consultarSCADAPorDias = async ({ apiScada, desde, hasta, signal, onProgreso }) => {

    const fechas = fechasDelRango(desde, hasta);

    const todas = [];

    for (let i = 0; i < fechas.length; i += TAMANO_LOTE) {

        if (signal.aborted) throw new axios.CanceledError();

        const lote = fechas.slice(i, i + TAMANO_LOTE);

        const respuestas = await Promise.all(lote.map((fecha) => axios.get(

            `${apiScada.replace(/\/+$/, "")}/por-fecha/${fecha}`,

            { withCredentials: true, signal }

        )));

        if (signal.aborted) throw new axios.CanceledError();

        respuestas.forEach((respuesta, indice) => {

            if (respuesta.data?.ok !== true || !Array.isArray(respuesta.data?.data)) {

                throw new Error(`Respuesta SCADA inválida para ${lote[indice]}.`);

            }

            todas.push(...respuesta.data.data);

        });

        onProgreso?.(Math.min(i + lote.length, fechas.length), fechas.length);

    }

    return todas;

};

// Análisis punto a punto: la misma semántica de Nodos sin umbral del padre.



const analizarNodos = (puntos) => {

    const eventos = [];

    let ingresado = 0;

    let salido = 0;

    let subidas = 0;

    let bajadas = 0;

    let intervalosSinSenal = 0;

    let conVolumen = puntos.length > 0 && puntos.every((p) => p.volumen !== null);

    for (let i = 1; i < puntos.length; i++) {

        const a = puntos[i - 1];

        const b = puntos[i];

        const minutos = b.minutos - a.minutos;

        const sinSenal = minutos > FRECUENCIA_MIN;

        if (sinSenal) intervalosSinSenal++;

        const delta = b.nivel - a.nivel;

        if (delta === 0) continue;

        const deltaL = a.volumen === null || b.volumen === null ? null : b.volumen - a.volumen;

        eventos.push({

            desde: a, hasta: b, delta, deltaL, minutos, sinSenal,

            tipo: delta > 0 ? "Subida" : "Bajada"

        });

        if (delta > 0) {

            subidas++;

            if (deltaL !== null) ingresado += deltaL;

        } else {

            bajadas++;

            if (deltaL !== null) salido -= deltaL;

        }

    }

    return {

        eventos, ingresado: conVolumen ? ingresado : null,

        salido: conVolumen ? salido : null,

        subidas, bajadas, intervalosSinSenal,

        puntosVisibles: puntos,

    };

};

// Traslado de la lógica de detección de crestas/valles del padre al eje continuo.

// Una inversión de dirección >= umbral cierra la operación anterior.



function analizarCrestasValles(puntos, umbral = 0.002, umbralPersonalizado = false) {

    const operaciones = [];

    const extremos = [];

    const tolerancia = umbral > 0.002 ? 0 : Math.max(0.000001, Math.min(0.002, umbral / 5));

    const minimo = Math.max(0.000001, umbral);

    const epsilon = 1e-10;

    if (!puntos.length) {

        return {

            operaciones, extremos, totalCargasL: 0, totalDescargasL: 0,

            cantidadCargas: 0, cantidadDescargas: 0

        };

    }

    let inicio = puntos[0];

    let extremo = inicio;

    let direccion = 0;

    let candidatoMax = inicio;

    let candidatoMin = inicio;

    const pivotes = [{ ...inicio, clase: "Inicio" }];

    const agregarPivote = (p, clase) => {

        const anterior = pivotes[pivotes.length - 1];

        if (anterior?.idLectura === p.idLectura) {

            if (clase !== "Inicio") anterior.clase = clase;

        } else pivotes.push({ ...p, clase });

    };

    const cerrar = (fin, clase, parcial = false) => {

        if (fin.idLectura === inicio.idLectura) return;

        const delta = fin.nivel - inicio.nivel;

        if (umbralPersonalizado

            ? Math.abs(delta) <= minimo + epsilon

            : Math.abs(delta) + epsilon < minimo) return;

        const afectados = puntos.filter((p) => p.minutos >= inicio.minutos && p.minutos <= fin.minutos);

        const intervalosSinSenal = afectados.slice(1).reduce((n, p, i) =>

            n + (p.minutos - afectados[i].minutos > FRECUENCIA_MIN ? 1 : 0), 0);

        operaciones.push({

            id: operaciones.length + 1, desde: inicio, hasta: fin,

            delta, deltaL: inicio.volumen !== null && fin.volumen !== null

                ? fin.volumen - inicio.volumen : null,

            duracion: fin.minutos - inicio.minutos, parcial, intervalosSinSenal,

            tipo: delta > 0 ? "Carga estimada" : "Descarga estimada",

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

                inicio = candidatoMax; direccion = -1; extremo = p;

            } else if (ascenso >= minimo) {

                inicio = candidatoMin; direccion = 1; extremo = p;

            }

            continue;

        }

        const diff = p.nivel - extremo.nivel;

        if (direccion * diff > tolerancia) {

            extremo = p;

        } else if (umbralPersonalizado

            ? -direccion * diff > minimo + epsilon

            : -direccion * diff >= minimo) {

            cerrar(extremo, direccion > 0 ? "Cresta" : "Valle");

            inicio = extremo;

            candidatoMax = extremo;

            candidatoMin = extremo;

            direccion = -direccion;

            extremo = p;

        }

    }

    if (direccion !== 0) cerrar(extremo, "Final", true);

    agregarPivote(puntos[puntos.length - 1], "Final");

    extremos.push(...pivotes);

    const cargas = operaciones.filter((o) => o.delta > 0);

    const descargas = operaciones.filter((o) => o.delta < 0);

    return {

        operaciones, extremos,

        cantidadCargas: cargas.length,

        cantidadDescargas: descargas.length,

        totalCargasL: cargas.length && cargas.every((o) => o.deltaL !== null)

            ? cargas.reduce((s, o) => s + o.deltaL, 0) : cargas.length ? null : 0,

        totalDescargasL: descargas.length && descargas.every((o) => o.deltaL !== null)

            ? descargas.reduce((s, o) => s - o.deltaL, 0) : descargas.length ? null : 0,

    };

}



const PALETA_INDICADORES = {

    azul: {

        fondo: "#EBF1FA",

        borde: "#C8D7EB",

        texto: "#081C6A",

        acento: "#173E84",

    },

    celeste: {

        fondo: "#EAF4FF",

        borde: "#C6DFF7",

        texto: "#0B3F83",

        acento: "#087CFF",

    },

    verde: {

        fondo: "#E8F5EE",

        borde: "#C7E6D5",

        texto: "#086B49",

        acento: "#13865E",

    },

    rojo: {

        fondo: "#FFF0EC",

        borde: "#F3D0C9",

        texto: "#A83D2A",

        acento: "#D4543E",

    },

    violeta: {

        fondo: "#EEF2F9",

        borde: "#CCD8E9",

        texto: "#2F4979",

        acento: "#48699C",

    },

};

function dibujarEtiquetasHistorico(chart, elementos) {

    const { ctx, chartArea: area } = chart;

    chart.$etiquetasHitSCADA = [];

    if (!area || !elementos.length) return;

    const margen = 5;
    const separacion = 4;
    const ocupados = [];
    const anchoZona = 105;
    const numeroZonas = Math.max(1, Math.ceil((area.right - area.left) / anchoZona));

    const etiquetasBase = elementos.filter(e => !e.soloHover);
    const etiquetasTemporales = elementos.filter(e => e.soloHover);

    const zonas = Array.from({ length: numeroZonas }, () => []);

    etiquetasBase.forEach((e, orden) => {
        if (!Number.isFinite(e.x)) return;
        const zona = Math.max(0, Math.min(numeroZonas - 1,
            Math.floor((e.x - area.left) / anchoZona)));
        zonas[zona].push({ ...e, orden });
    });

    zonas.forEach(z => z.sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0) || a.orden - b.orden));

    const ordenados = [];
    const anclas = etiquetasBase.map((e, orden) => ({ ...e, orden }))
        .filter(e => (e.prioridad || 0) >= 5)
        .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
    const idsAnclas = new Set(anclas.map(e => e.orden));
    ordenados.push(...anclas);
    zonas.forEach((zona, i) => {
        zonas[i] = zona.filter(e => !idsAnclas.has(e.orden));
    });

    let quedan = true;

    while (quedan) {
        quedan = false;
        for (const zona of zonas) {
            if (!zona.length) continue;
            quedan = true;
            ordenados.push(zona.shift());
        }
    }

    ordenados.push(...etiquetasTemporales);

    ctx.save();
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const e of ordenados) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !e.texto) continue;
        // Evitar rótulos anclados fuera del área realmente visible.
        if (e.x < area.left || e.x > area.right || e.y < area.top || e.y > area.bottom) continue;
        const ancho = ctx.measureText(e.texto).width + 16;
        const alto = 21;
        if (ancho > area.right - area.left - margen * 2) continue;

        const preferencia = e.preferirAbajo ? 1 : -1;
        let elegido = null;
        for (const distancia of [32, 54, 78, 106, 135, 170]) {
            if (elegido) break;
            for (const lado of [preferencia, -preferencia]) {
                if (elegido) break;
                for (const dx of [0, -ancho * 0.65, ancho * 0.65, -ancho * 1.25, ancho * 1.25]) {
                    const rect = {
                        x: Math.max(area.left + margen, Math.min(e.x + dx - ancho / 2, area.right - ancho - margen)),
                        y: e.y + lado * distancia - alto / 2,
                        w: ancho,
                        h: alto,
                    };
                    if (rect.y < area.top + margen || rect.y + alto > area.bottom - margen) continue;
                    const solapa = ocupados.some(o =>
                        rect.x < o.x + o.w + separacion &&
                        rect.x + rect.w + separacion > o.x &&
                        rect.y < o.y + o.h + separacion &&
                        rect.y + rect.h + separacion > o.y
                    );
                    if (!solapa) {
                        elegido = rect;
                        break;
                    }
                }
            }
        }

        let posicionTemporal = false;

        // Si el punto está seleccionado, mostrar su etiqueta
        if (!elegido && e.clave === chart.$hoverEtiquetaSCADA) {
            posicionTemporal = true;
            elegido = {
                x: Math.max(
                    area.left + margen,
                    Math.min(
                        e.x - ancho / 2,
                        area.right - ancho - margen
                    )
                ),
                y: Math.max(
                    area.top + margen,
                    Math.min(
                        e.y - 40,
                        area.bottom - alto - margen
                    )
                ),
                w: ancho,
                h: alto,
            };
        }

        if (!elegido) continue;

        const resaltado = e.clave === chart.$hoverEtiquetaSCADA;

        const centroX = elegido.x + ancho / 2;
        const centroY = elegido.y + alto / 2;
        const destinoX = Math.max(elegido.x + 5, Math.min(e.x, elegido.x + ancho - 5));
        const destinoY = e.y < elegido.y ? elegido.y : e.y > elegido.y + alto ? elegido.y + alto : centroY;

        // Línea guía entre el punto y su etiqueta.
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(destinoX, destinoY);
        ctx.strokeStyle = resaltado ? "#D49A00" : e.color;
        ctx.globalAlpha = resaltado ? 1 : 0.8;
        ctx.lineWidth = resaltado ? 2.5 : 1;
        ctx.setLineDash(resaltado ? [] : [3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Resaltar el punto o los extremos del tramo.
        const puntosDestacados = e.puntosRelacionados?.length
            ? e.puntosRelacionados
            : [{ x: e.x, y: e.y }];

        puntosDestacados.forEach((p) => {
            if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) {
                return;
            }

            ctx.beginPath();
            ctx.arc(
                p.x,
                p.y,
                resaltado ? 7 : 2.5,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = resaltado ? "#FFD54F" : e.color;
            ctx.fill();

            if (resaltado) {
                ctx.strokeStyle = "#B77900";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Fondo de la etiqueta.
        ctx.beginPath();
        ctx.roundRect(
            elegido.x,
            elegido.y,
            ancho,
            alto,
            5
        );

        ctx.fillStyle = resaltado
            ? "rgba(255, 235, 130, 0.98)"
            : "rgba(255, 255, 255, 0.97)";

        ctx.strokeStyle = resaltado ? "#D49A00" : e.color;
        ctx.lineWidth = resaltado ? 2 : 1.15;

        ctx.fill();
        ctx.stroke();

        // Texto de la etiqueta.
        ctx.fillStyle = resaltado ? "#604500" : e.color;
        ctx.fillText(e.texto, centroX, centroY);

        // Guardar el rectángulo para la interacción inversa.
        chart.$etiquetasHitSCADA.push({
            clave: e.clave,
            ...elegido,
        });

        if (!posicionTemporal) {
            ocupados.push(elegido);
        }

    }
    ctx.restore();
}

const fondoDiasHistoricoSCADA = {
    id: "fondoDiasHistoricoSCADA",
    beforeDraw(chart, _args, opciones) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales?.x || !opciones?.desde || !opciones?.hasta) return;

        const { left, right, top, bottom } = chartArea;
        const alto = bottom - top;

        const desde = opciones.desde;
        const hasta = opciones.hasta;

        const totalDias = contarDias(desde, hasta);
        if (!totalDias || totalDias <= 1) return;

        const minutosPorDia = 1440;

        ctx.save();

        for (let i = 0; i < totalDias; i++) {
            const inicioMin = i * minutosPorDia;
            const finMin = (i + 1) * minutosPorDia;

            const x1 = Math.max(left, scales.x.getPixelForValue(inicioMin));
            const x2 = Math.min(right, scales.x.getPixelForValue(finMin));

            if (!Number.isFinite(x1) || !Number.isFinite(x2) || x2 <= x1) continue;

            ctx.fillStyle = i % 2 === 0
                ? "rgba(100, 116, 139, 0.12)"
                : "rgba(255, 255, 255, 1)";

            ctx.fillRect(x1, top, x2 - x1, alto);

            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(x1, top);
                ctx.lineTo(x1, bottom);
                ctx.strokeStyle = "rgba(88, 112, 156, 0.18)";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Etiqueta superior del día
            const fechaActual = new Date(Date.parse(`${desde}T00:00:00Z`) + i * 86400000)
                .toISOString()
                .slice(0, 10);

            ctx.fillStyle = "rgba(8, 28, 106, 0.55)";
            ctx.font = "600 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(fechaActual, (x1 + x2) / 2, top + 6);
        }

        ctx.restore();
    },
};

const detallesGraficaHistorico = {

    id: "detallesGraficaHistoricoSCADA",
    afterDatasetsDraw(chart, _args, opciones) {
        const { ctx, chartArea: area, scales } = chart;
        if (!area || !scales?.x || !scales?.y || !opciones) return;
        const tipo = opciones.tipo;
        const esVolumen = opciones.modo === "volumen";
        const unidad = esVolumen ? "L" : "m";
        const decimales = esVolumen ? 0 : 3;
        const valorDe = p => esVolumen ? p?.volumen : p?.nivel;
        const ubicacion = (x, y) => ({
            x: scales.x.getPixelForValue(x),
            y: scales.y.getPixelForValue(y),
        });
        const posicion = p => p && valorDe(p) != null
            ? ubicacion(p.minutos, valorDe(p))
            : null;
        const visible = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
            p.x >= area.left && p.x <= area.right && p.y >= area.top && p.y <= area.bottom;

        // En Crestas/Valles unir cada inicio y final real de operación.
        // Línea continua verde/roja y trayectoria escalonada morada como el padre.
        if (tipo === "operaciones") {
            ctx.save();
            ctx.beginPath();
            ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
            ctx.clip();
            for (const op of opciones.operaciones || []) {
                const a = posicion(op.desde);
                const b = posicion(op.hasta);
                if (!a || !b || !Number.isFinite(a.x + a.y + b.x + b.y)) continue;
                const color = op.delta < 0 ? ROJO : VERDE;
                // Conexión directa del movimiento completo.
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.stroke();
                // Recorrido escalonado calculado con los mismos extremos.
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = MORADO;
                ctx.lineWidth = 1.6;
                ctx.globalAlpha = 0.9;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }

        const etiquetas = [];

        for (const alerta of opciones.alertas || []) {

            const punto = posicion(alerta.punto);

            if (!visible(punto)) continue;

            const { x, y } = punto;

            ctx.save();

            // Halo amarillo alrededor de la lectura sospechosa.
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,193,7,0.22)";
            ctx.fill();

            // Punto central.
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFD54F";
            ctx.strokeStyle = "#B8860B";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            etiquetas.push({
                x,
                y,
                clave: `error-senal:${alerta.punto.idLectura}`,
                texto: alerta.repetida
                    ? "⚠ Oscilación sospechosa"
                    : "⚠ Posible error de señal",
                color: "#B8860B",
                prioridad: 6,
                preferirAbajo: alerta.deltaAnterior > 0,
                puntosRelacionados: [{ x, y }],
            });
        }

        if (!opciones.mostrarEtiquetas) return;

        const registrar = (p, texto, color, prioridad = 1, preferirAbajo = false) => {
            if (!p || valorDe(p) == null) return;
            const punto = posicion(p);
            if (!visible(punto)) return;

            etiquetas.push({
                ...punto,
                clave: p.idLectura,
                texto,
                color,
                prioridad,
                preferirAbajo,
            });

        };
        const etiquetaValor = p => `${fmt(valorDe(p), decimales)} ${unidad}`;

        if (tipo === "original") {
            const lecturas = opciones.puntos || [];

            if (lecturas.length) {
                lecturas.forEach((p, i) => {

                    const valorActual = esVolumen
                        ? p.volumen
                        : p.nivel;

                    if (valorActual === null || valorActual === undefined) {
                        return;
                    }

                    const etiqueta = esVolumen
                        ? `${fmt(valorActual, 0)} L`
                        : `${fmt(valorActual, 3)} m`;

                    if (i === 0) {
                        registrar(
                            p,
                            `INICIO · ${etiqueta}`,
                            AZUL,
                            5
                        );
                    } else if (i === lecturas.length - 1) {
                        registrar(
                            p,
                            `FINAL · ${etiqueta}`,
                            AZUL,
                            5
                        );
                    } else {
                        registrar(
                            p,
                            etiqueta,
                            MORADO,
                            1,
                            i % 2 === 0
                        );
                    }
                });
            }
        } else if (tipo === "nodos") {
            const aceptados = opciones.nodos || [];
            const eventos = opciones.eventos || [];
            const cambios = new Map(eventos.map(e => [e.hasta?.idLectura, e]));
            aceptados.forEach((p, i) => {
                if (i === 0) {
                    registrar(p, `INICIO · ${etiquetaValor(p)}`, AZUL, 5);
                } else if (i === aceptados.length - 1) {
                    registrar(p, `FINAL · ${etiquetaValor(p)}`, AZUL, 5);
                } else {
                    const evento = cambios.get(p.idLectura);
                    const color = evento?.delta > 0 ? VERDE : evento?.delta < 0 ? ROJO : MORADO;
                    // El rótulo muestra la lectura en este nodo, no solo la variación.
                    registrar(p, etiquetaValor(p), color, 2, evento?.delta < 0);
                }
            });
        } else if (tipo === "operaciones") {
            const extremos = opciones.extremos || [];
            const usados = new Set();
            extremos.forEach(e => {
                if (usados.has(e.idLectura)) return;
                usados.add(e.idLectura);
                const texto = e.clase === "Cresta" ? "▲ CRESTA" :
                    e.clase === "Valle" ? "▼ VALLE" : String(e.clase || "PUNTO").toUpperCase();
                const color = e.clase === "Cresta" ? ROJO : e.clase === "Valle" ? VERDE : AZUL;
                const prioridad = e.clase === "Inicio" || e.clase === "Final" ? 5 : 4;
                registrar(e, `${texto} · ${etiquetaValor(e)}`, color, prioridad, e.clase === "Valle");
            });
            for (const op of opciones.operaciones || []) {
                const a = valorDe(op.desde);
                const b = valorDe(op.hasta);
                const cambio = esVolumen ? op.deltaL : op.delta;
                if (a == null || b == null || cambio == null) continue;
                const puntoMedio = ubicacion(
                    (op.desde.minutos + op.hasta.minutos) / 2,
                    (a + b) / 2
                );
                if (!visible(puntoMedio)) continue;
                etiquetas.push({
                    ...puntoMedio,
                    clave: `tramo:${op.id}`,
                    texto: `${cambio > 0 ? "+" : ""}${fmt(cambio, decimales)} ${unidad}`,
                    color: cambio < 0 ? ROJO : VERDE,
                    prioridad: 3,
                    preferirAbajo: cambio < 0,
                    puntosRelacionados: [
                        posicion(op.desde),
                        posicion(op.hasta),
                    ].filter(Boolean),
                });
            }
        }

        // Todas las etiquetas del análisis.
        // Incluye lecturas que no consiguieron espacio
        // para mostrar un rótulo permanentemente.
        const candidatas = [...etiquetas];
        const registradas = new Set(
            candidatas.map(e => e.clave)
        );

        const puntosInteractivos = tipo === "nodos"
            ? opciones.nodos || []
            : tipo === "operaciones"
                ? opciones.puntosAceptados || []
                : opciones.puntos || [];

        for (const p of puntosInteractivos) {
            if (valorDe(p) == null || registradas.has(p.idLectura)) {
                continue;
            }

            const punto = posicion(p);
            if (!visible(punto)) continue;

            candidatas.push({
                ...punto,
                clave: p.idLectura,
                texto: etiquetaValor(p),
                color: MORADO,
                prioridad: 1,
                preferirAbajo: false,
            });

            registradas.add(p.idLectura);
        }

        chart.$candidatasSCADA = candidatas;

        const activa = candidatas.find(
            e => e.clave === chart.$hoverEtiquetaSCADA
        );

        const estaDibujada = etiquetas.some(
            e => e.clave === chart.$hoverEtiquetaSCADA
        );

        // Si la etiqueta del punto activo fue omitida por
        // falta de espacio, mostrarla temporalmente.
        const etiquetasParaDibujar =
            activa && !estaDibujada
                ? [
                    ...etiquetas,
                    { ...activa, soloHover: true },
                ]
                : etiquetas;

        dibujarEtiquetasHistorico(
            chart,
            etiquetasParaDibujar
        );
    },

    afterEvent(chart, args, opciones) {
        if (!opciones?.mostrarEtiquetas) {
            if (chart.$hoverEtiquetaSCADA != null) {
                chart.$hoverEtiquetaSCADA = null;
                args.changed = true;
            }
            return;
        }

        const evento = args.event;

        if (!evento) return;

        let nuevaClave = null;

        if (evento.type !== "mouseout") {
            const x = evento.x;
            const y = evento.y;

            // PRIMERO: detectar si el cursor está
            // directamente sobre una etiqueta.
            const rectangulos = chart.$etiquetasHitSCADA || [];

            for (let i = rectangulos.length - 1; i >= 0; i--) {
                const r = rectangulos[i];

                if (
                    x >= r.x &&
                    x <= r.x + r.w &&
                    y >= r.y &&
                    y <= r.y + r.h
                ) {
                    nuevaClave = r.clave;
                    break;
                }
            }

            // SEGUNDO: detectar el punto más cercano
            // cuando no estamos encima de una etiqueta.
            if (nuevaClave == null) {
                let distanciaMinima = 12 * 12;

                for (const e of chart.$candidatasSCADA || []) {
                    const relacionados = e.puntosRelacionados?.length
                        ? e.puntosRelacionados
                        : [{ x: e.x, y: e.y }];

                    for (const p of relacionados) {
                        if (
                            !Number.isFinite(p?.x) ||
                            !Number.isFinite(p?.y)
                        ) {
                            continue;
                        }

                        const dx = x - p.x;
                        const dy = y - p.y;
                        const distancia = dx * dx + dy * dy;

                        if (distancia <= distanciaMinima) {
                            distanciaMinima = distancia;
                            nuevaClave = e.clave;
                        }
                    }
                }
            }
        }

        if (chart.$hoverEtiquetaSCADA !== nuevaClave) {
            chart.$hoverEtiquetaSCADA = nuevaClave;

            args.changed = true;
        }
    },
};

function Indicador({

    titulo,

    valor,

    detalle,

    tono = "azul",

    color,

}) {

    const estilo =

        PALETA_INDICADORES[tono] ||

        PALETA_INDICADORES.azul;

    return (

        <Box

            sx={{

                bgcolor: estilo.fondo,

                border: `1px solid ${estilo.borde}`,

                borderLeft: `3px solid ${estilo.acento}`,

                borderRadius: 1.5,

                px: 1.5,

                py: 1.2,

                minWidth: 0,

                minHeight: 81,

                display: "flex",

                flexDirection: "column",

                justifyContent: "center",

                transition: "background-color 0.2s ease",

                "&:hover": {

                    bgcolor: estilo.fondo,

                    borderColor: estilo.acento,

                },

            }}

        >

            <Typography

                sx={{

                    fontSize: 11,

                    color: "#526C94",

                    fontWeight: 600,

                    mb: 0.4,

                }}

            >

                {titulo}

            </Typography>

            <Typography

                sx={{

                    fontSize: { xs: 16, md: 20 },

                    fontWeight: 850,

                    lineHeight: 1.15,

                    color: color || estilo.texto,

                    overflowWrap: "anywhere",

                    fontVariantNumeric: "tabular-nums",

                }}

            >

                {valor}

            </Typography>

            {detalle && (

                <Typography

                    sx={{

                        fontSize: 10.5,

                        color: "#61799C",

                        mt: 0.5,

                    }}

                >

                    {detalle}

                </Typography>

            )}

        </Box>

    );

}



export default function AnalisisHistoricoSCADAModal({
    open, onClose, tanque = "801A", tituloTanque, factor, capacidad, producto, gradoAlcoholico,
    fechaReferencia, lecturasIniciales = [], despachosIniciales = [], basculaInicial = [], apiScada, apiDespachos, apiBascula,
}) {

    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [periodoConsultado, setPeriodoConsultado] = useState(null);
    const [datosConsultados, setDatosConsultados] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [visualizacion, setVisualizacion] = useState("nivel");
    const [tipoAnalisis, setTipoAnalisis] = useState("original");
    const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
    const [detalleCompletoNodos, setDetalleCompletoNodos] = useState(false);
    const [umbralLimpiezaL, setUmbralLimpiezaL] = useState(0);
    const [excluidosNodos, setExcluidosNodos] = useState(() => new Set());
    const [excluidosOperaciones, setExcluidosOperaciones] = useState(() => new Set());
    const [eventosExcluidosNodos, setEventosExcluidosNodos] = useState(() => new Map());
    const [eventosExcluidosOperaciones, setEventosExcluidosOperaciones] = useState(() => new Map());
    const [progreso, setProgreso] = useState({ completados: 0, total: 0 });

    const controladorRef = useRef(null);

    useEffect(() => {

        if (!open) return undefined;

        const referencia = fechaValida(fechaReferencia)
            ? fechaReferencia
            : fechaBogota();

        const desde = diaAnterior(referencia);

        setFechaDesde(desde);
        setFechaHasta(referencia);
        setPeriodoConsultado({ desde, hasta: referencia });
        setDatosConsultados(null);
        setCargando(false);
        setError("");
        setVisualizacion("nivel");
        setTipoAnalisis("original");
        setMostrarEtiquetas(true);
        setUmbralLimpiezaL(0);

        setExcluidosNodos(new Set());
        setExcluidosOperaciones(new Set());

        setEventosExcluidosNodos(new Map());
        setEventosExcluidosOperaciones(new Map());

        setProgreso({ completados: 0, total: 0 });

        return () => controladorRef.current?.abort();

    }, [open, fechaReferencia, tanque]);

    const usandoDatosIniciales = datosConsultados === null;
    const lecturas = usandoDatosIniciales ? lecturasIniciales : datosConsultados.lecturas;
    const despachos = usandoDatosIniciales ? despachosIniciales : datosConsultados.despachos;
    const bascula = usandoDatosIniciales ? basculaInicial : datosConsultados.bascula;
    const diasSeleccionados = contarDias(fechaDesde, fechaHasta);
    const rangoValido = diasSeleccionados >= 1 && diasSeleccionados <= MAX_DIAS;
    const factorNumerico = num(factor);
    const factorValido = factorNumerico !== null && factorNumerico > 0;
    const sensorSeleccionado = `LT${clave(tanque)}`;
    const titulo = tituloTanque || `TK-${clave(tanque)}`;

    const cerrar = () => {
        controladorRef.current?.abort();
        controladorRef.current = null;

        setCargando(false);
        onClose?.();

    };

    const consultar = async () => {

        if (!rangoValido || cargando) return;

        if (!apiScada || !apiDespachos || !apiBascula) {

            setError("Faltan las direcciones API para consultar el histórico.");

            return;

        }

        controladorRef.current?.abort();

        const ctrl = new AbortController();

        controladorRef.current = ctrl;

        const desde = fechaDesde;

        const hasta = fechaHasta;

        setCargando(true);

        setError("");

        setProgreso({ completados: 0, total: diasSeleccionados });

        try {

            const [lecturasSCADA, respuestaDespachos, respuestaBascula] = await Promise.all([

                consultarSCADAPorDias({

                    apiScada, desde, hasta, signal: ctrl.signal,

                    onProgreso: (completados, total) => {

                        if (!ctrl.signal.aborted) setProgreso({ completados, total });

                    },

                }),

                axios.get(`${apiDespachos.replace(/\/+$/, "")}/rango`, {

                    params: { from: desde, to: hasta }, withCredentials: true, signal: ctrl.signal,

                }),

                axios.get(`${apiBascula.replace(/\/+$/, "")}/rango`, {

                    params: { from: desde, to: hasta }, withCredentials: true, signal: ctrl.signal,

                }),

            ]);

            if (ctrl.signal.aborted) return;

            if (respuestaBascula.data?.ok !== true) {

                throw new Error("La respuesta de báscula es inválida.");

            }

            setDatosConsultados({

                lecturas: lecturasSCADA,

                despachos: registrosDe(respuestaDespachos.data),

                bascula: registrosDe(respuestaBascula.data),

            });

            setPeriodoConsultado({ desde, hasta });

            setExcluidosNodos(new Set());

            setExcluidosOperaciones(new Set());

        } catch (e) {

            if (ctrl.signal.aborted || axios.isCancel(e)) return;

            setError(e.response?.data?.message || e.message || "No fue posible consultar el rango.");

        } finally {

            if (!ctrl.signal.aborted) {

                setCargando(false);

                if (controladorRef.current === ctrl) controladorRef.current = null;

            }

        }

    };

    const puntos = useMemo(() => {

        if (!periodoConsultado) return [];

        const { desde, hasta } = periodoConsultado;

        return lecturas.map((registro, ordenOriginal) => {

            const fecha = String(registro?.fecha ?? "").trim();

            const hora = String(registro?.hora ?? "").trim();

            if (fecha < desde || fecha > hasta) return null;

            const minutos = minutosDesde(fecha, hora, desde);

            const nivel = num(registro?.[sensorSeleccionado]);

            if (minutos === null || nivel === null) return null;

            return {

                ordenOriginal, fecha, hora, minutos, nivel,

                volumen: factorValido ? nivel * factorNumerico : null,

                idLectura: `${clave(tanque)}|${String(registro?._id ?? `${fecha}|${hora}|${ordenOriginal}`)}`,

            };

        }).filter(Boolean)

            .sort((a, b) => a.minutos - b.minutos || a.ordenOriginal - b.ordenOriginal)

            .map((p, indice) => ({ ...p, indice }));

    }, [lecturas, periodoConsultado, sensorSeleccionado, factorValido, factorNumerico, tanque]);

    const posiblesErroresSenal = useMemo(() => {

        const alertas = [];
        const UMBRAL_ANOMALIA_L = 5000;

        for (let i = 1; i < puntos.length - 1; i++) {

            const a = puntos[i - 1];
            const b = puntos[i];
            const c = puntos[i + 1];

            if (![a.volumen, b.volumen, c.volumen].every(Number.isFinite)) continue;

            const intervaloAnterior = b.minutos - a.minutos;
            const intervaloSiguiente = c.minutos - b.minutos;

            if (intervaloAnterior <= 0 || intervaloSiguiente <= 0) continue;

            const deltaAnterior = b.volumen - a.volumen;
            const deltaSiguiente = c.volumen - b.volumen;

            const esPico =
                deltaAnterior >= UMBRAL_ANOMALIA_L &&
                deltaSiguiente <= -UMBRAL_ANOMALIA_L;

            const esValle =
                deltaAnterior <= -UMBRAL_ANOMALIA_L &&
                deltaSiguiente >= UMBRAL_ANOMALIA_L;

            if (!esPico && !esValle) continue;

            alertas.push({
                punto: b,
                deltaAnterior,
                deltaSiguiente,
            });
        }

        return alertas.map((alerta, i) => ({
            ...alerta,
            repetida:
                alerta.punto.indice - alertas[i - 1]?.punto.indice === 1 ||
                alertas[i + 1]?.punto.indice - alerta.punto.indice === 1,
        }));

    }, [puntos]);

    const aceptadosNodos = useMemo(() => puntos.filter((p) => !excluidosNodos.has(p.idLectura)), [puntos, excluidosNodos]);

    const aceptadosOperaciones = useMemo(() => puntos.filter((p) => !excluidosOperaciones.has(p.idLectura)), [puntos, excluidosOperaciones]);

    const umbralMetros = umbralLimpiezaL > 0 && factorValido ? umbralLimpiezaL / factorNumerico : 0.002;

    const nodosBase = useMemo(() => analizarNodos(aceptadosNodos), [aceptadosNodos]);

    const nodosConUmbral = useMemo(() => analizarCrestasValles(aceptadosNodos, umbralMetros, umbralLimpiezaL > 0), [aceptadosNodos, umbralMetros, umbralLimpiezaL]);

    const nodos = useMemo(() => {

        if (umbralLimpiezaL <= 0) return nodosBase;

        const operaciones = nodosConUmbral.operaciones;
        const indices = new Set(aceptadosNodos.length ? [aceptadosNodos[0].idLectura] : []);
        const eventos = operaciones.map((op) => {
            indices.add(op.desde.idLectura);
            indices.add(op.hasta.idLectura);

            return {
                ...op, sinSenal: op.intervalosSinSenal > 0,
                minutos: op.duracion, tipo: op.delta > 0 ? "Subida" : "Bajada"
            };
        });

        return {

            eventos, puntosVisibles: operaciones.length
                ? aceptadosNodos.filter((p) => indices.has(p.idLectura))
                : aceptadosNodos,

            ingresado: nodosConUmbral.totalCargasL,
            salido: nodosConUmbral.totalDescargasL,
            subidas: nodosConUmbral.cantidadCargas,
            bajadas: nodosConUmbral.cantidadDescargas,
            intervalosSinSenal: nodosBase.intervalosSinSenal,

        };

    }, [nodosBase, nodosConUmbral, umbralLimpiezaL, aceptadosNodos]);

    const operaciones = useMemo(() => analizarCrestasValles(aceptadosOperaciones, umbralMetros, umbralLimpiezaL > 0), [aceptadosOperaciones, umbralMetros, umbralLimpiezaL]);
    const original = useMemo(() => analizarNodos(puntos), [puntos]);
    const tipoActual = tipoAnalisis === "operaciones" ? operaciones : tipoAnalisis === "nodos" ? nodos : original;
    const eventosActuales = tipoAnalisis === "operaciones" ? operaciones.operaciones : tipoActual.eventos;

    const filasEventos = useMemo(() => {
        if (tipoAnalisis === "original") {
            return eventosActuales.map((evento) => ({
                evento,
                excluido: false,
            }));
        }

        const excluidos = tipoAnalisis === "nodos"
            ? eventosExcluidosNodos
            : eventosExcluidosOperaciones;

        const filas = eventosActuales.map((evento) => ({
            evento,
            excluido: false,
        }));

        const idsVisibles = new Set(
            eventosActuales.map((evento) => evento.hasta?.idLectura)
        );

        for (const [idLectura, evento] of excluidos) {
            if (!idsVisibles.has(idLectura)) {
                filas.push({
                    evento,
                    excluido: true,
                });
            }
        }

        filas.sort((a, b) =>
            (a.evento.hasta?.minutos ?? 0) -
            (b.evento.hasta?.minutos ?? 0)
        );

        return filas;
    }, [
        tipoAnalisis,
        eventosActuales,
        eventosExcluidosNodos,
        eventosExcluidosOperaciones,
    ]);

    const ingresado = tipoAnalisis === "operaciones" ? operaciones.totalCargasL : tipoActual.ingresado;
    const salido = tipoAnalisis === "operaciones" ? operaciones.totalDescargasL : tipoActual.salido;
    const cantidadSubidas = tipoAnalisis === "operaciones" ? operaciones.cantidadCargas : tipoActual.subidas;
    const cantidadBajadas = tipoAnalisis === "operaciones" ? operaciones.cantidadDescargas : tipoActual.bajadas;
    const aceptadosActuales = tipoAnalisis === "operaciones" ? aceptadosOperaciones : tipoAnalisis === "nodos" ? aceptadosNodos : puntos;

    const visuales = tipoAnalisis === "operaciones"

        ? operaciones.extremos.map((p) => aceptadosOperaciones.find((a) => a.idLectura === p.idLectura)).filter(Boolean)
        : tipoAnalisis === "nodos" ? nodos.puntosVisibles : puntos;

    const extremoInicial = aceptadosActuales[0] ?? null;
    const extremoFinal = aceptadosActuales[aceptadosActuales.length - 1] ?? null;
    const netoNivel = extremoInicial && extremoFinal ? extremoFinal.nivel - extremoInicial.nivel : null;
    const netoVolumen = extremoInicial?.volumen != null && extremoFinal?.volumen != null
        ? extremoFinal.volumen - extremoInicial.volumen : null;

    const volumenFinalCalculado =
        extremoInicial?.volumen != null &&
            ingresado != null &&
            salido != null
            ? extremoInicial.volumen + ingresado - salido
            : null;

    // Diferencia entre el inventario reconstruido y el inventario
    // realmente registrado por la última lectura SCADA.
    const diferenciaConciliacion =
        volumenFinalCalculado != null &&
            extremoFinal?.volumen != null
            ? volumenFinalCalculado - extremoFinal.volumen
            : null;

    const TOLERANCIA_NUMERICA_L = 0.000001;

    const balanceConciliado =
        diferenciaConciliacion != null &&
        Math.abs(diferenciaConciliacion) <= TOLERANCIA_NUMERICA_L;

    const huecos = original.intervalosSinSenal;

    const esVolumen = visualizacion === "volumen";


    const alternarExclusion = (evento) => {
        if (tipoAnalisis === "original") return;

        const idLectura = evento?.hasta?.idLectura;
        if (!idLectura) return;

        const esNodos = tipoAnalisis === "nodos";

        const excluidos = esNodos
            ? excluidosNodos
            : excluidosOperaciones;

        const setExcluidos = esNodos
            ? setExcluidosNodos
            : setExcluidosOperaciones;

        const setEventosExcluidos = esNodos
            ? setEventosExcluidosNodos
            : setEventosExcluidosOperaciones;

        const estabaExcluido = excluidos.has(idLectura);

        setEventosExcluidos((anterior) => {
            const siguiente = new Map(anterior);

            if (estabaExcluido) {
                siguiente.delete(idLectura);
            } else {
                siguiente.set(idLectura, evento);
            }

            return siguiente;
        });

        setExcluidos((anterior) => {
            const siguiente = new Set(anterior);

            if (estabaExcluido) {
                siguiente.delete(idLectura);
            } else {
                siguiente.add(idLectura);
            }

            return siguiente;
        });
    };


    const datosGrafica = useMemo(() => {

        const valor = (p) => esVolumen ? p.volumen : p.nivel;

        const puntosSerie = tipoAnalisis === "original"
            ? puntos
            : tipoAnalisis === "nodos"
                ? aceptadosNodos
                : aceptadosOperaciones;

        const serieOriginal = {
            label: tipoAnalisis === "original"
                ? "Lecturas originales"
                : "Lecturas aceptadas",

            data: puntosSerie.map((p) => ({
                x: p.minutos,
                y: valor(p),
            })),
            parsing: false,
            borderColor: AZUL,
            backgroundColor: AZUL,
            borderWidth: tipoAnalisis === "original" ? 2 : 1.2,
            borderDash: tipoAnalisis === "original" ? [] : [3, 3],
            pointRadius: tipoAnalisis === "original" && puntos.length <= 350 ? 2 : 0,
            pointHoverRadius: 5,
            tension: 0,
            spanGaps: false,
            fill: false,
        };

        if (tipoAnalisis === "original") return { datasets: [serieOriginal] };

        const serieAnalisis = {
            label: tipoAnalisis === "nodos" ? "Nodos aceptados" : "Extremos detectados",
            data: visuales.map((p) => ({ x: p.minutos, y: valor(p) })),
            parsing: false,
            borderColor: MORADO,
            backgroundColor: MORADO,
            pointBackgroundColor: tipoAnalisis === "operaciones"
                ? visuales.map((p) => {
                    const extremo = operaciones.extremos.find((e) => e.idLectura === p.idLectura);
                    return extremo?.clase === "Cresta" ? ROJO : extremo?.clase === "Valle" ? VERDE : MORADO;
                })
                : MORADO,

            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0,
            showLine: tipoAnalisis === "nodos",
            stepped: tipoAnalisis === "nodos" ? "after" : false,
            spanGaps: false,
            fill: false,

        };

        const idsExcluidos = tipoAnalisis === "nodos"
            ? excluidosNodos
            : excluidosOperaciones;

        const serieExcluidos = {
            label: "Lecturas excluidas manualmente",

            data: puntos
                .filter((p) => idsExcluidos.has(p.idLectura))
                .map((p) => ({
                    x: p.minutos,
                    y: valor(p),
                })),

            parsing: false,
            showLine: false,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHitRadius: 8,
            pointStyle: "crossRot",
            pointBorderWidth: 2,
            pointBorderColor: MORADO,
            pointBackgroundColor: MORADO,
            order: -1,
            fill: false,
        };

        return {
            datasets: [
                serieOriginal,
                serieAnalisis,
                serieExcluidos,
            ],
        };

    }, [
        puntos,
        visuales,
        tipoAnalisis,
        esVolumen,
        operaciones.extremos,
        excluidosNodos,
        excluidosOperaciones,
        aceptadosNodos,
        aceptadosOperaciones,
    ]);

    const opcionesGrafica = useMemo(() => {

        const origen = periodoConsultado?.desde;

        const etiquetaTiempo = (minutos) => {
            if (!origen || !Number.isFinite(minutos)) return "";
            const instante = new Date(Date.parse(`${origen}T00:00:00Z`) + Math.round(minutos * 60000));
            return `${instante.toISOString().slice(0, 10)} ${instante.toISOString().slice(11, 16)}`;
        };

        return {

            responsive: true, maintainAspectRatio: false, animation: false,
            interaction: { mode: "nearest", intersect: false },
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                labels: { display: false },
                fondoDiasHistoricoSCADA: {
                    desde: periodoConsultado?.desde,
                    hasta: periodoConsultado?.hasta,
                },
                detallesGraficaHistoricoSCADA: {
                    tipo: tipoAnalisis,
                    modo: visualizacion,
                    mostrarEtiquetas,
                    puntos,
                    puntosAceptados: aceptadosOperaciones,
                    nodos: nodos.puntosVisibles,
                    eventos: nodos.eventos,
                    extremos: operaciones.extremos,
                    operaciones: operaciones.operaciones,
                    alertas: posiblesErroresSenal,
                },
                tooltip: {
                    enabled: true,
                    position: "average",
                    xAlign: "right",
                    yAlign: "top",
                    caretPadding: 12,
                    padding: 10,

                    backgroundColor: "rgba(8, 28, 106, 0.95)",
                    titleColor: "#FFFFFF",
                    bodyColor: "#FFFFFF",

                    callbacks: {
                        title: (items) =>
                            etiquetaTiempo(items[0]?.parsed?.x),

                        label: (item) =>
                            `${item.dataset.label}: ${esVolumen
                                ? `${fmt(item.parsed.y, 0)} L`
                                : `${fmt(item.parsed.y, 3)} m`
                            }`,

                        afterLabel: (item) => {

                            const alerta = posiblesErroresSenal.find(a =>
                                a.punto.minutos === item.parsed.x &&
                                (esVolumen ? a.punto.volumen : a.punto.nivel) === item.parsed.y
                            );

                            if (!alerta) return [];

                            return [
                                "",
                                alerta.repetida
                                    ? "⚠ Oscilación sospechosa repetida"
                                    : "⚠ Posible error de señal",

                                `Variación anterior: ${alerta.deltaAnterior > 0 ? "+" : ""}${fmt(alerta.deltaAnterior, 0)} L`,
                                `Variación siguiente: ${alerta.deltaSiguiente > 0 ? "+" : ""}${fmt(alerta.deltaSiguiente, 0)} L`,

                                "Revisar lectura antes de excluir",
                            ];
                        },
                    },
                },

            },

            scales: {

                x: {

                    type: "linear", title: { display: true, text: "Fecha y hora", color: MARINO },
                    ticks: { maxTicksLimit: 10, color: "#58709c", callback: (v) => etiquetaTiempo(v) },
                    grid: { color: "#e4ebf4" },

                },

                y: {

                    beginAtZero: false,
                    title: { display: true, text: esVolumen ? "Volumen (L)" : "Nivel (m)", color: MARINO },
                    ticks: { color: "#58709c", callback: (v) => fmt(v, esVolumen ? 0 : 3) },
                    grid: { color: "#e4ebf4" },

                },
            },
        };

    }, [
        esVolumen,
        periodoConsultado,
        tipoAnalisis,
        visualizacion,
        mostrarEtiquetas,
        puntos,
        nodos,
        operaciones,
        aceptadosOperaciones,
        posiblesErroresSenal,
    ]);

    return (

        <Dialog open={open} onClose={cerrar} fullScreen keepMounted={false}

            PaperProps={{ sx: { bgcolor: "#f5faff" } }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: "#fff", color: MARINO, borderBottom: `1px solid ${BORDE}` }}>
                <Toolbar sx={{ gap: 1.5 }}>
                    <DateRangeOutlinedIcon sx={{ color: AZUL }} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: { xs: 16, md: 19 }, fontWeight: 900 }}>Análisis histórico SCADA</Typography>
                        <Typography sx={{ fontSize: 11, color: "#58709c" }}>{titulo} · {producto || "Sin configurar"}</Typography>
                    </Box>
                    <IconButton onClick={cerrar} aria-label="Cerrar análisis histórico" sx={{ color: MARINO }}><CloseIcon /></IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, md: 2.5 } }}>
                <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, border: `1px solid ${BORDE}`, borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}
                        alignItems={{ xs: "stretch", md: "center" }} useFlexGap flexWrap="wrap">
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: MARINO }}>{titulo}</Typography>
                        <TextField label="Desde" type="date" size="small" value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)} InputLabelProps={{ shrink: true }} />
                        <TextField label="Hasta" type="date" size="small" value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)} InputLabelProps={{ shrink: true }} />
                        <Button variant="contained" startIcon={cargando ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                            disabled={!rangoValido || cargando} onClick={consultar}
                            sx={{ bgcolor: AZUL, fontWeight: 800, textTransform: "none", height: 38 }}>
                            {cargando ? "Consultando..." : "Consultar período"}
                        </Button>

                        <ToggleButtonGroup exclusive size="small" value={visualizacion}
                            onChange={(_e, valor) => { if (valor) setVisualizacion(valor); }} sx={{ height: 36 }}>
                            <ToggleButton value="nivel"><WaterDropIcon sx={{ fontSize: 16, mr: 0.5 }} />Nivel</ToggleButton>
                            <ToggleButton value="volumen" disabled={!factorValido}>
                                <Inventory2OutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />Volumen
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>

                    {!rangoValido && <Alert severity="warning" sx={{ mt: 1.5 }}>Selecciona un rango válido de máximo {MAX_DIAS} días.</Alert>}

                    {cargando && <Typography sx={{ fontSize: 11, color: "#58709c", mt: 1 }}>

                        SCADA: {progreso.completados} de {progreso.total} días consultados.

                    </Typography>}

                </Paper>

                {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

                <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, border: `1px solid ${BORDE}`, borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }}

                        justifyContent="space-between" spacing={2} useFlexGap flexWrap="wrap">

                        <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: MARINO }}>Análisis de movimientos</Typography>
                            <Typography sx={{ fontSize: 11, color: "#58709c" }}>Cambia entre lecturas originales, nodos y crestas/valles.</Typography>
                        </Box>

                        <ToggleButtonGroup exclusive size="small" value={tipoAnalisis}
                            onChange={(_e, valor) => { if (valor) setTipoAnalisis(valor); }}
                            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 11.5, fontWeight: 800, px: 1.5 } }}>
                            <ToggleButton value="original"><ShowChartIcon sx={{ fontSize: 16, mr: 0.5 }} />Original</ToggleButton>
                            <ToggleButton value="nodos"><FunctionsIcon sx={{ fontSize: 16, mr: 0.5 }} />Nodos</ToggleButton>
                            <ToggleButton value="operaciones"><DonutSmallIcon sx={{ fontSize: 16, mr: 0.5 }} />Crestas / Valles</ToggleButton>
                        </ToggleButtonGroup>

                        <Stack direction="row" alignItems="center" spacing={1}>

                            <TextField label="Filtro de ruido (L)" size="small" type="number"
                                inputProps={{ min: 0, step: 100 }} value={umbralLimpiezaL}
                                onChange={(e) => setUmbralLimpiezaL(Math.max(0, Number(e.target.value) || 0))}
                                disabled={!factorValido} sx={{ width: 145 }} />

                            <Button
                                size="small"
                                variant={mostrarEtiquetas ? "contained" : "outlined"}
                                onClick={() => setMostrarEtiquetas(v => !v)}
                                sx={{
                                    height: 36,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    whiteSpace: "nowrap",
                                    bgcolor: mostrarEtiquetas ? MARINO : "transparent",
                                    color: mostrarEtiquetas ? "#fff" : MARINO,
                                    borderColor: BORDE,
                                    "&:hover": { bgcolor: mostrarEtiquetas ? "#173e84" : "#eef4fa" },
                                }}
                            >
                                {mostrarEtiquetas ? "Ocultar etiquetas" : "Ver etiquetas"}
                            </Button>
                            {tipoAnalisis === "nodos" && mostrarEtiquetas && (
                                <Button
                                    size="small"
                                    variant={detalleCompletoNodos ? "contained" : "outlined"}
                                    onClick={() => setDetalleCompletoNodos(v => !v)}
                                    sx={{
                                        height: 36,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                        bgcolor: detalleCompletoNodos ? MARINO : "transparent",
                                        "&:hover": { bgcolor: detalleCompletoNodos ? "#173e84" : "#eef4fa" },
                                    }}
                                >
                                    {detalleCompletoNodos ? "Vista general" : "Detalle completo · nodos"}
                                </Button>
                            )}
                            {tipoAnalisis !== "original" && <Tooltip title="Restaurar lecturas excluidas de este modo">

                                <IconButton size="small" aria-label="Restablecer exclusiones"
                                    onClick={() => {
                                        if (tipoAnalisis === "nodos") {
                                            setExcluidosNodos(new Set());
                                            setEventosExcluidosNodos(new Map());
                                        } else {
                                            setExcluidosOperaciones(new Set());
                                            setEventosExcluidosOperaciones(new Map());
                                        }
                                    }}
                                >
                                    <RestartAltIcon />
                                </IconButton>

                            </Tooltip>}

                        </Stack>

                    </Stack>

                </Paper>


                {/* ========= INDICADORES Y CONCILIACIÓN VOLUMÉTRICA SCADA ========== */}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 1,
                        mb: 1.5,
                    }}
                >
                    <Indicador
                        tono="azul"
                        titulo="Inventario inicial SCADA"
                        valor={fmtUnid(extremoInicial?.volumen, "L", 0)}
                        detalle={
                            extremoInicial
                                ? `${extremoInicial.fecha} ${extremoInicial.hora}`
                                : "Sin lectura"
                        }
                    />

                    <Indicador
                        tono="verde"
                        titulo="Entradas estimadas"
                        valor={fmtUnid(ingresado, "L", 0)}
                    />


                    <Indicador
                        tono="celeste"
                        titulo="Inventario final calculado"
                        valor={fmtUnid(volumenFinalCalculado, "L", 0)}
                        detalle="Inicial + entradas − salidas"
                    />


                    <Indicador
                        tono={
                            netoVolumen == null
                                ? "azul"
                                : netoVolumen < 0
                                    ? "rojo"
                                    : "verde"
                        }
                        titulo="Variación neta del inventario"
                        valor={fmtUnid(netoVolumen, "L", 0)}
                        detalle={`Nivel neto: ${fmtUnid(netoNivel, "m", 3)}`}
                    />

                    <Indicador
                        tono="azul"
                        titulo="Inventario final SCADA"
                        valor={fmtUnid(extremoFinal?.volumen, "L", 0)}
                        detalle={
                            extremoFinal
                                ? `${extremoFinal.fecha} ${extremoFinal.hora}`
                                : "Sin lectura"
                        }
                    />

                    <Indicador
                        tono="rojo"
                        titulo="Salidas estimadas"
                        valor={fmtUnid(salido, "L", 0)}
                    />

                    <Indicador
                        tono={
                            diferenciaConciliacion == null
                                ? "azul"
                                : balanceConciliado
                                    ? "verde"
                                    : "rojo"
                        }
                        titulo="Diferencia de conciliación"
                        valor={fmtUnid(diferenciaConciliacion, "L", 3)}
                        detalle={
                            diferenciaConciliacion == null
                                ? "Sin datos suficientes"
                                : balanceConciliado
                                    ? "Balance matemáticamente conciliado"
                                    : "Variación no contabilizada por el método"
                        }
                    />

                    <Indicador
                        tono="violeta"
                        titulo="Movimientos entrada / salida"
                        valor={`${cantidadSubidas} / ${cantidadBajadas}`}
                    />

                </Box>

                {/* Advertencia de conciliación */}
                {diferenciaConciliacion != null && !balanceConciliado && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 1.5,
                            fontSize: 12,
                            borderRadius: 1.5,
                        }}
                    >
                        El balance presenta una diferencia de{" "}
                        <strong>
                            {fmt(Math.abs(diferenciaConciliacion), 3)} L
                        </strong>{" "}
                        respecto al inventario final SCADA.

                        Esta diferencia puede corresponder a movimientos
                        filtrados o lecturas excluidas; no representa
                        necesariamente una merma física.
                    </Alert>
                )}


                <Paper elevation={0} sx={{ p: 2, mb: 1.5, border: `1px solid ${BORDE}`, borderRadius: 2 }}>

                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: MARINO, mb: 1 }}>
                        {tipoAnalisis === "original" ? "Lecturas originales" : tipoAnalisis === "nodos" ? "Análisis por nodos" : "Análisis por crestas y valles"} · {titulo}
                    </Typography>

                    <Box sx={{
                        overflowX: tipoAnalisis === "nodos" && detalleCompletoNodos ? "auto" : "hidden",
                        width: "100%",
                    }}>
                        {posiblesErroresSenal.length > 0 && (
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#946500",
                                    bgcolor: "#FFF8E1",
                                    border: "1px solid #EBD59A",
                                    borderRadius: 1,
                                    px: 1.2,
                                    py: 0.8,
                                    mb: 1,
                                    maxHeight: 85,
                                    overflowY: "auto",
                                }}
                            >
                                ⚠ Posibles errores de señal ({posiblesErroresSenal.length}):{" "}

                                {posiblesErroresSenal.map(a =>
                                    `${a.punto.fecha} ${a.punto.hora}${a.repetida ? "*" : ""}`
                                ).join(" · ")}

                                {posiblesErroresSenal.some(a => a.repetida) &&
                                    " · *Oscilación repetida: contrastar antes de excluir."}
                            </Typography>
                        )}

                        <Box sx={{
                            height: { xs: 340, md: 460 },
                            // En detalle completo ampliamos la escala temporal sin descartar lecturas.
                            // Cada punto sigue usando su minuto real, no un índice artificial.
                            minWidth: tipoAnalisis === "nodos" && detalleCompletoNodos
                                ? `${Math.min(24000, Math.max(1200, nodos.puntosVisibles.length * 108))}px`
                                : 0,
                            position: "relative",
                        }}>
                            {puntos.length
                                ? <Line data={datosGrafica} options={opcionesGrafica} plugins={[fondoDiasHistoricoSCADA, detallesGraficaHistorico]} />
                                : <Box sx={{ height: "100%", display: "grid", placeItems: "center", border: `1px dashed ${BORDE}` }}>
                                    <Typography sx={{ fontSize: 12, color: "#58709c" }}>Sin lecturas válidas para el período.</Typography>
                                </Box>}
                        </Box>
                    </Box>

                    <Typography sx={{ mt: 1, fontSize: 11, color: "#58709c" }}>

                        Las etiquetas muestran el nivel o volumen de cada punto visible; en Crestas/Valles también se muestran los totales de cada tramo. Se revisan todos los puntos del período, de principio a fin. En la vista general las etiquetas se distribuyen sin superponerse; en Nodos, activa «Detalle completo · nodos» para ampliar horizontalmente el histórico y recorrerlo con la barra de desplazamiento. El cursor permite consultar cualquier lectura.

                        {tipoAnalisis === "nodos"

                            ? " La línea azul representa las lecturas originales; los puntos violetas y la línea escalonada enlazan nodos aceptados."
                            : tipoAnalisis === "operaciones"
                                ? " La línea azul es la lectura original; cada operación se une en verde o rojo con una trayectoria escalonada violeta. Las etiquetas indican crestas, valles y variaciones totales."
                                : ""}

                    </Typography>

                </Paper>

                <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, border: `1px solid ${BORDE}`, borderRadius: 2 }}>

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mb: 1.5 }}
                    >

                        {/* IZQUIERDA: EVENTOS */}
                        <Typography

                            sx={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: MARINO,
                            }}
                        >

                            Eventos y movimientos · {eventosActuales.length} activos
                            {tipoAnalisis !== "original" &&
                                ` · ${filasEventos.filter((fila) => fila.excluido).length} excluidos`
                            }

                        </Typography>

                        {/* DERECHA: PERÍODO */}

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                        >

                            <Typography

                                sx={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: MARINO,
                                }}

                            >
                                Período visualizado:

                            </Typography>

                            <Typography

                                sx={{
                                    fontSize: 12,
                                    color: "#58709c",
                                }}
                            >

                                {periodoConsultado
                                    ? `${periodoConsultado.desde} a ${periodoConsultado.hasta}`
                                    : "Sin período"}

                            </Typography>
                        </Stack>
                    </Stack>

                    <TableContainer sx={{ maxHeight: 360 }}>
                        <Table stickyHeader size="small">
                            <TableHead><TableRow>
                                {tipoAnalisis !== "original" && <TableCell sx={{ fontWeight: 800 }}>Acción</TableCell>}
                                {tipoAnalisis !== "original" && (
                                    <TableCell sx={{ fontWeight: 800 }}>
                                        Estado
                                    </TableCell>
                                )}

                                <TableCell sx={{ fontWeight: 800 }}>Inicio</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Final</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Movimiento</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Cambio (m)</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Cambio (L)</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Duración (min)</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Señal</TableCell>

                            </TableRow></TableHead>

                            <TableBody>

                                {filasEventos.map(({ evento: ev, excluido }, i) => {
                                    const fin = ev.hasta;
                                    const inicio = ev.desde;

                                    return <TableRow
                                        key={`${fin?.idLectura || i}|${inicio?.idLectura || i}|${excluido}`}
                                        hover
                                        sx={{
                                            opacity: excluido ? 0.65 : 1,
                                            bgcolor: excluido ? "#F1F5F9" : "transparent",
                                        }}
                                    >


                                        {tipoAnalisis !== "original" && (
                                            <>
                                                <TableCell>
                                                    <Tooltip
                                                        title={
                                                            excluido
                                                                ? `Reincorporar lectura ${fin?.fecha} ${fin?.hora}`
                                                                : `Excluir lectura ${fin?.fecha} ${fin?.hora}`
                                                        }
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            color={excluido ? "success" : "error"}
                                                            aria-label={
                                                                excluido
                                                                    ? `Reincorporar lectura ${fin?.fecha} ${fin?.hora}`
                                                                    : `Excluir lectura ${fin?.fecha} ${fin?.hora}`
                                                            }
                                                            onClick={() => alternarExclusion(ev)}
                                                        >
                                                            {excluido ? (
                                                                <AddCircleOutlineIcon fontSize="small" />
                                                            ) : (
                                                                <RemoveCircleOutlineIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: excluido ? "#64748B" : VERDE,
                                                    }}
                                                >
                                                    {excluido ? "Excluido" : "Incluido"}
                                                </TableCell>
                                            </>
                                        )}

                                        <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>{inicio?.fecha} {inicio?.hora}</TableCell>
                                        <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>{fin?.fecha} {fin?.hora}</TableCell>
                                        <TableCell sx={{ color: ev.delta > 0 ? VERDE : ROJO, fontWeight: 700, fontSize: 11 }}>{ev.tipo}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: 11 }}>{fmt(ev.delta, 3)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: 11 }}>{fmt(ev.deltaL, 0)}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: 11 }}>{fmt(ev.minutos ?? ev.duracion, 1)}</TableCell>
                                        <TableCell sx={{ color: ev.sinSenal || ev.intervalosSinSenal > 0 ? ROJO : VERDE, fontSize: 11 }}>

                                            {ev.sinSenal || ev.intervalosSinSenal > 0 ? "Intervalo >30 min" : "Continua"}

                                        </TableCell>
                                    </TableRow>;

                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography sx={{ mt: 1, fontSize: 11, color: "#58709c" }}>

                        En Nodos y Crestas/Valles, el icono rojo excluye la lectura final del evento y recalcula movimientos.
                        La restauración se realiza con el botón de reinicio; excluir puntos puede unir dos lecturas que antes estaban separadas.

                    </Typography>

                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,minmax(0,1fr))" }, gap: 1, mb: 1.5 }}>
                    <Indicador titulo="Registros SCADA recibidos" valor={lecturas.length} />
                    <Indicador titulo="Registros despachos recibidos" valor={despachos.length} />
                    <Indicador titulo="Registros báscula recibidos" valor={bascula.length} />
                </Box>

                <Typography sx={{ fontSize: 11, color: "#58709c" }}>
                    Capacidad: {fmtUnid(capacidad, "L", 0)} · Grado: {gradoAlcoholico || "—"} ·
                    Factor: {fmtUnid(factor, "L/m", 0)}. Volúmenes = niveles × factor; no se ha aplicado corrección térmica.
                </Typography>

            </Box>

        </Dialog>

    );

}
