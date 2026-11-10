import React, { useState } from "react";
import { Button, IconButton, CircularProgress, Tooltip } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { registerDejaVuFont } from "../../../assets/fonts/DejaVuSans.js";
const MARINO = [8, 28, 106];
const AZUL = [8, 124, 255];
const VERDE = [0, 152, 70];
const ROJO = [207, 59, 49];
const GRIS = [92, 107, 130];
const FONT = "DejaVuSans";
const LOGO_URL = "/LogoCompany/logoambiocomsinfondo.png";

const cargarLogo = url => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        } catch {
            resolve(null);
        }
    };
    img.onerror = () => resolve(null);
    img.src = url;
});

const numero = value =>
    value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
        ? Number(value)
        : null;
const fmt = (value, decimales = 0) =>
    numero(value) !== null
        ? Number(value).toLocaleString("es-CO", {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales,
        })
        : "—";
const resta = (a, b) =>
    numero(a) !== null && numero(b) !== null
        ? Number(a) - Number(b)
        : null;
const pct = (a, base) =>
    numero(a) !== null &&
        numero(base) !== null &&
        Math.abs(Number(base)) > 0.000001
        ? `${fmt(100 * Number(a) / Math.abs(Number(base)), 2)} %`
        : "—";
const variacion = value =>
    numero(value) === null
        ? "—"
        : `${Number(value) > 0 ? "+" : ""}${fmt(value)} L`;
const conNivel = value =>
    numero(value) === null ? "—" : `${fmt(value, 3)} m`;
const conNivelDelta = value =>
    numero(value) === null
        ? "—"
        : `${Number(value) > 0 ? "+" : ""}${fmt(value, 3)} m`;
const conLitros = value =>
    numero(value) === null ? "—" : `${fmt(value)} L`;
const normalizarSet = valor =>
    valor instanceof Set ? valor : new Set(valor || []);
const modoTexto = tipo =>
    tipo === "nodos"
        ? "Nodos depurados"
        : tipo === "operaciones"
            ? "Crestas / Valles"
            : "Lecturas originales";
const tituloArchivo = value =>
    String(value || "tanque")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 55);
const fechaHora = (min, fecha, modo) => {
    if (!Number.isFinite(min)) return "—";
    const m = modo === "inventario" ? (min + 480) % 1440 : min;
    const hora = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
        Math.floor(m % 60)
    ).padStart(2, "0")}`;
    if (!fecha) return hora;
    if (modo !== "inventario") return `${fecha} ${hora}`;
    const d = new Date(`${fecha}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return `${fecha} ${hora}`;
    if (min < 960) d.setUTCDate(d.getUTCDate() - 1);
    return `${d.toISOString().slice(0, 10)} ${hora}`;
};
export default function ExportarInformeSCADAPDF({
    tituloTanque = "Tanque",
    fechaConsultada = "",
    factor = null,
    puntos = [],
    eventos = [],
    eventosNodos = null,
    operaciones = [],
    puntosVisiblesNodos = null,
    lecturasExcluidasNodos = null,
    lecturasExcluidasOperaciones = null,
    umbralLimpiezaL = 0,
    resumenMovimientosPorModo = null,
    tramosSinSenal = [],
    tipo = "original",
    unidad = "nivel",
    modoDia = "natural",
    inicioLupa = null,
    finLupa = null,
    chartRef = null,
    disabled = false,
    analisisSCADA = null,
    resumenVolumenSCADA = null,
    resumenDespachos = null,
    resumenBascula = null,
    producto = null,
    capacidad = null,
    gradoAlcoholico = null,
    etiquetaPeriodo = null,
}) {
    const [generando, setGenerando] = useState(false);
    const generar = async () => {
        if (generando) return;
        setGenerando(true);
        try {
            const originales = Array.isArray(puntos) ? puntos : [];
            const excluidos =
                tipo === "nodos"
                    ? normalizarSet(lecturasExcluidasNodos)
                    : tipo === "operaciones"
                        ? normalizarSet(lecturasExcluidasOperaciones)
                        : new Set();
            const tieneFiltroNodos =
                Number(umbralLimpiezaL) > 0 ||
                originales.some(p => excluidos.has(p.idLectura));
            const indicesNodos = new Set(
                (Array.isArray(puntosVisiblesNodos)
                    ? puntosVisiblesNodos
                    : originales
                ).map(p => p.indice)
            );
            const valido = p =>
                Number.isFinite(p?.minutosDia) &&
                Number.isFinite(p?.nivel);
            const visible = p =>
                tipo === "original" ||
                (tipo === "nodos"
                    ? !excluidos.has(p.idLectura) &&
                    (!tieneFiltroNodos || indicesNodos.has(p.indice))
                    : !excluidos.has(p.idLectura));
            const enRango = p =>
                !inicioLupa ||
                !finLupa ||
                (p.minutosDia >=
                    Math.min(inicioLupa.minutosDia, finLupa.minutosDia) &&
                    p.minutosDia <=
                    Math.max(inicioLupa.minutosDia, finLupa.minutosDia));
            const universo = originales
                .filter(p => valido(p) && enRango(p))
                .sort((a, b) => a.minutosDia - b.minutosDia);
            const aceptadas = universo.filter(visible);
            const manuales = universo.filter(
                p => tipo !== "original" && excluidos.has(p.idLectura)
            );
            const ocultasFiltro = universo.filter(
                p =>
                    tipo === "nodos" &&
                    !excluidos.has(p.idLectura) &&
                    !visible(p)
            );
            const eventosActuales =
                (tipo === "nodos"
                    ? eventosNodos ?? eventos
                    : eventos) || [];
            const resumen =
                resumenVolumenSCADA ??
                resumenMovimientosPorModo?.[tipo] ??
                null;
            const primerOriginal = originales[0] ?? null;
            const ultimoOriginal = originales[originales.length - 1] ?? null;
            const volumenInicial = numero(
                analisisSCADA?.inicial?.volumen ?? primerOriginal?.volumen
            );
            const volumenFinal = numero(
                analisisSCADA?.final?.volumen ?? ultimoOriginal?.volumen
            );
            const nivelInicial = numero(
                analisisSCADA?.inicial?.nivel ?? primerOriginal?.nivel
            );
            const nivelFinal = numero(
                analisisSCADA?.final?.nivel ?? ultimoOriginal?.nivel
            );
            const netoObservado = resta(volumenFinal, volumenInicial);
            const nivelNeto = resta(nivelFinal, nivelInicial);
            const entrada = numero(resumen?.ingresado);
            const salida = numero(resumen?.salido);
            const netoMovimientos =
                entrada !== null && salida !== null
                    ? entrada - salida
                    : null;
            const diferenciaNoExplicada = resta(
                netoObservado,
                netoMovimientos
            );
            const refOriginal = resumenMovimientosPorModo?.original ?? null;
            const originalEntrada = numero(refOriginal?.ingresado);
            const originalSalida = numero(refOriginal?.salido);
            const originalBruto =
                originalEntrada !== null && originalSalida !== null
                    ? originalEntrada + originalSalida
                    : null;
            const filtradoBruto =
                entrada !== null && salida !== null
                    ? entrada + salida
                    : null;
            const diferenciaBruta = resta(originalBruto, filtradoBruto);
            const cantidadTotal = universo.length;
            const cantidadOculta = manuales.length + ocultasFiltro.length;
            const factorValido =
                numero(factor) !== null && Number(factor) > 0;
            const equivalenteUmbralM = factorValido
                ? Number(umbralLimpiezaL) / Number(factor)
                : null;
            const entradaM =
                factorValido && entrada !== null
                    ? entrada / Number(factor)
                    : null;
            const salidaM =
                factorValido && salida !== null
                    ? salida / Number(factor)
                    : null;
            const netoMovimientosM =
                factorValido && netoMovimientos !== null
                    ? netoMovimientos / Number(factor)
                    : null;
            const residualM =
                factorValido && diferenciaNoExplicada !== null
                    ? diferenciaNoExplicada / Number(factor)
                    : null;
            const originalEntradaM =
                factorValido && originalEntrada !== null
                    ? originalEntrada / Number(factor)
                    : null;
            const originalSalidaM =
                factorValido && originalSalida !== null
                    ? originalSalida / Number(factor)
                    : null;
            const intervaloMayor = universo
                .slice(1)
                .reduce(
                    (resultado, p, i) =>
                        Math.max(
                            resultado,
                            p.minutosDia - universo[i].minutosDia
                        ),
                    0
                );
            const conteoTramos = Array.isArray(tramosSinSenal)
                ? tramosSinSenal.length
                : 0;
            const despachoContador = numero(
                resumenDespachos?.volumenAmbiocom
            );
            const despachoGrav = numero(
                resumenDespachos?.volumenGravimetrico
            );
            const despachoProgramado = numero(
                resumenDespachos?.volumenProgramado
            );
            const basculaGrav = numero(
                resumenBascula?.volumenGravimetrico
            );
            const recepcionNacional = numero(
                resumenBascula?.volumenEstimadoNacional
            );
            const recepcionImportacion = numero(
                resumenBascula?.volumenEstimadoImportacion
            );
            const recepcionEstimada =
                recepcionNacional !== null &&
                    recepcionImportacion !== null
                    ? recepcionNacional + recepcionImportacion
                    : null;
            const diferenciaSalidaContador = resta(
                salida,
                despachoContador
            );
            const diferenciaContadores = resta(
                despachoContador,
                despachoGrav
            );
            // Volúmenes gravimétricos estimados con las densidades disponibles.
            // El padre ya calcula el volumen de ventas en báscula por tiquete.
            const pesoSalidasKg = numero(resumenBascula?.pesoNetoSalidas);
            const pesoIngresosPlantaKg = numero(resumenBascula?.pesoNetoIngresos);
            const densidadVentas = numero(resumenBascula?.densidadPromedioPonderada);
            const densidadRecepciones = numero(resumenBascula?.densidadEstimadaRecepciones);
            const basculaSalidasL = basculaGrav !== null
                ? basculaGrav
                : pesoSalidasKg !== null && densidadVentas !== null && densidadVentas > 0
                    ? pesoSalidasKg / densidadVentas
                    : null;
            const basculaIngresosPlantaL = recepcionEstimada !== null
                ? recepcionEstimada
                : pesoIngresosPlantaKg !== null && densidadRecepciones !== null && densidadRecepciones > 0
                    ? pesoIngresosPlantaKg / densidadRecepciones
                    : null;
            const scadaVsBasculaSalidas = resta(salida, basculaSalidasL);
            const contadorVsBasculaSalidas = resta(despachoContador, basculaSalidasL);
            const desde = universo[0];
            const hasta = universo[universo.length - 1];
            const eventosReporte = (
                tipo === "operaciones" ? operaciones : eventosActuales
            ).filter(e => {
                const ini =
                    tipo === "operaciones"
                        ? e?.desde?.minutosDia
                        : e?.minutosDia ?? e?.hasta?.minutosDia;
                const fin =
                    tipo === "operaciones"
                        ? e?.hasta?.minutosDia
                        : ini;
                return (
                    Number.isFinite(ini) &&
                    Number.isFinite(fin) &&
                    (!desde ||
                        (Math.max(ini, fin) >= desde.minutosDia &&
                            Math.min(ini, fin) <= hasta.minutosDia))
                );
            });
            const resumenEsDelPeriodoCompleto = Boolean(
                inicioLupa && finLupa
            );
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
                compress: true,
            });
            registerDejaVuFont(pdf);
            pdf.setFont(FONT, "normal");
            const ancho = pdf.internal.pageSize.getWidth();
            const alto = pdf.internal.pageSize.getHeight();
            const margen = 14;
            let y = 0;
            // Navegación interna del documento (no altera ningún cálculo SCADA).
            const paginasSeccion = new Map();
            const filasIndice = [];
            const COLORES_SECCION = {
                1: [0, 116, 123], // Comparativo cruzado SCADA - despacho - báscula
                2: [0, 152, 70], 3: [8, 124, 255], 4: [0, 116, 123],
                5: [123, 63, 242], 6: [61, 91, 127], 7: [8, 124, 255],
                8: [207, 59, 49], 9: [92, 107, 130], 10: [123, 63, 242],
                11: [8, 124, 255], 12: [92, 107, 130], 13: [207, 59, 49],
                14: [123, 63, 242], 15: [61, 91, 127],
            };
            let colorActual = MARINO;
            const nuevaPaginaSi = altura => {
                if (y + altura > alto - 19) {
                    pdf.addPage();
                    y = 18;
                }
            };
            const seccion = texto => {
                nuevaPaginaSi(16);
                const id = Number(/^([0-9]+)\./.exec(texto)?.[1]);
                if (Number.isInteger(id)) {
                    paginasSeccion.set(id, pdf.internal.getCurrentPageInfo().pageNumber);
                    colorActual = COLORES_SECCION[id] || MARINO;
                }
                pdf.setFillColor(...colorActual);
                pdf.roundedRect(margen, y - 4, 2.5, 9, 0.8, 0.8, "F");
                pdf.setFont(FONT, "bold");
                pdf.setFontSize(12);
                pdf.setTextColor(...MARINO);
                pdf.text(texto, margen + 6, y);
                y += 4;
                pdf.setDrawColor(...colorActual);
                pdf.setLineWidth(0.55);
                pdf.line(margen, y, ancho - margen, y);
                y += 6;
            };
            const tabla = (head, body, widths = {}) => {
                autoTable(pdf, {
                    startY: y,
                    head: [head],
                    body: body.length
                        ? body
                        : [
                            [
                                "Sin registros",
                                ...Array(head.length - 1).fill(""),
                            ],
                        ],
                    theme: "grid",
                    styles: {
                        font: FONT,
                        fontSize: 8,
                        cellPadding: 2,
                        overflow: "linebreak",
                        textColor: [37, 54, 76],
                        lineColor: [225, 233, 243],
                        lineWidth: 0.13,
                    },
                    headStyles: {
                        fillColor: colorActual,
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                    },
                    alternateRowStyles: {
                        fillColor: [246, 249, 253],
                    },
                    margin: {
                        left: margen,
                        right: margen,
                        top: 18,
                        bottom: 20,
                    },
                    columnStyles: widths,
                });
                y = pdf.lastAutoTable.finalY + 10;
            };
            const pie = () => {
                const paginas = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= paginas; i++) {
                    pdf.setPage(i);
                    pdf.setFont(FONT, "normal");
                    pdf.setDrawColor(222, 231, 242);
                    pdf.line(
                        margen,
                        alto - 13,
                        ancho - margen,
                        alto - 13
                    );
                    pdf.setTextColor(...GRIS);
                    pdf.setFontSize(8);
                    pdf.text(
                        "COCLÍ · AMBIOCOM S.A.S. | Lecturas SCADA y movimientos estimados; sujetos a conciliación.",
                        margen,
                        alto - 8
                    );
                    pdf.text(
                        `Página ${i} de ${paginas}`,
                        ancho - margen,
                        alto - 8,
                        { align: "right" }
                    );
                    if (i > 1) {
                        pdf.setFont(FONT, "bold");
                        pdf.setFontSize(8);
                        pdf.setTextColor(...AZUL);
                        const textoVolver = "← VOLVER AL ÍNDICE";
                        pdf.text(textoVolver, ancho - margen, 10, { align: "right" });
                        pdf.link(ancho - margen - 43, 4, 44, 9, { pageNumber: 1 });
                    }
                }
            };
            // ENCABEZADO CORPORATIVO
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, ancho, 27, "F");
            const logo = await cargarLogo(LOGO_URL);
            if (logo) {
                try {
                    pdf.addImage(logo, "PNG", margen, 3.5, 53, 19);
                } catch {
                    // Continuar sin logo.
                }
            }
            pdf.setFont(FONT, "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(...MARINO);
            pdf.text(
                "AMBIOCOM S.A.S. | INFORME SCADA",
                ancho - margen,
                13,
                { align: "right" }
            );
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(8.5);
            pdf.text(
                "Análisis de niveles, volúmenes y movimientos estimados",
                ancho - margen,
                20,
                { align: "right" }
            );
            const bandaY = 28;
            const pasos = 65;
            for (let i = 0; i < pasos; i++) {
                const t = i / (pasos - 1);
                pdf.setFillColor(
                    Math.round(41 + 5 * t),
                    Math.round(128 + 76 * t),
                    Math.round(185 - 72 * t)
                );
                pdf.rect(
                    (ancho * i) / pasos,
                    bandaY,
                    ancho / pasos + 0.4,
                    14,
                    "F"
                );
            }
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(FONT, "bold");
            pdf.setFontSize(14);
            pdf.text(
                "INFORME TÉCNICO · ANÁLISIS SCADA",
                margen,
                37
            );
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(...MARINO);
            pdf.text(
                `${tituloTanque} | ${fechaConsultada} | ${modoTexto(tipo)}`,
                margen,
                49
            );
            y = 58;
            // Página inicial: índice ejecutivo con enlaces internos al apartado real.
            const indiceSecciones = [
                {
                    grupo: "CONCILIACIÓN Y RESULTADOS OPERATIVOS", items: [
                        [1, "Comparativo SCADA · Despachos · Báscula"],
                        [2, "Balance SCADA: niveles y volúmenes"],
                        [3, "Despachos del tanque seleccionado"],
                        [4, "Ventas en báscula: peso y volumen"],
                        [5, "Recepciones en báscula: peso y volumen"],
                        [6, "Movimientos registrados en báscula"],
                    ]
                },
                {
                    grupo: "ANÁLISIS Y DIAGNÓSTICO", items: [
                        [7, "Comparación de modos y efecto volumétrico"],
                        [8, "Diagnóstico técnico y observaciones"],
                        [9, "Contexto y condiciones del análisis"],
                        [10, "Calidad de señal y puntos omitidos"],
                    ]
                },
                {
                    grupo: "SOPORTE Y TRAZABILIDAD", items: [
                        [11, "Gráfica actual"],
                        [12, "Lecturas visibles"],
                        ...(tipo !== "original" ? [[13, "Exclusiones manuales"]] : []),
                        ...(tipo === "nodos" ? [[14, "Lecturas ocultas por depuración"]] : []),
                        [15, "Eventos y operaciones"],
                    ]
                },
            ];
            pdf.setFont(FONT, "bold");
            pdf.setFontSize(15);
            pdf.setTextColor(...MARINO);
            pdf.text("ÍNDICE EJECUTIVO INTERACTIVO", margen, y);
            y += 7;
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(...GRIS);
            pdf.text("Selecciona un apartado para abrirlo. En cada página encontrarás el enlace de regreso.", margen, y);
            y += 8;
            for (const grupo of indiceSecciones) {
                pdf.setFillColor(239, 245, 252);
                pdf.roundedRect(margen, y - 3.5, ancho - 2 * margen, 7, 1.5, 1.5, "F");
                pdf.setFont(FONT, "bold");
                pdf.setFontSize(9);
                pdf.setTextColor(...MARINO);
                pdf.text(grupo.grupo, margen + 4, y + 1);
                y += 8;
                for (const [id, nombre] of grupo.items) {
                    const color = COLORES_SECCION[id] || MARINO;
                    pdf.setFillColor(...color);
                    pdf.roundedRect(margen + 2, y - 3.1, 11, 5.6, 1, 1, "F");
                    pdf.setFont(FONT, "bold");
                    pdf.setFontSize(8.5);
                    pdf.setTextColor(255, 255, 255);
                    pdf.text(String(id).padStart(2, "0"), margen + 7.5, y + 0.6, { align: "center" });
                    pdf.setTextColor(...MARINO);
                    pdf.setFont(FONT, "normal");
                    pdf.text(nombre, margen + 17, y + 0.6);
                    filasIndice.push({ id, x: margen + 1, y: y - 3.5, w: ancho - 2 * margen - 2, h: 6.25 });
                    y += 6.25;
                }
                y += 1;
            }
            // Los resultados comienzan en la página 2; el índice queda independiente.
            pdf.addPage();
            y = 19;
            // 1. COMPARATIVO INTERSISTEMAS: primera lectura gerencial del informe.
            seccion("1. CONCILIACIÓN PRELIMINAR | SCADA vs DESPACHOS vs BÁSCULA");
            tabla(
                ["SALIDAS | Fuente", "Volumen (L)", "Peso (kg)", "Alcance / trazabilidad"],
                [
                    ["SCADA · tanque seleccionado", conLitros(salida), "—", `${modoTexto(tipo)}; movimiento estimado por nivel`],
                    ["Despacho · contador Ambiocom", conLitros(despachoContador), "—", "Salidas registradas del tanque seleccionado"],
                    ["Despacho · contador gravimétrico", conLitros(despachoGrav), "—", "Volumen registrado en despacho"],
                    ["Báscula · ventas vinculadas", conLitros(basculaSalidasL),
                        pesoSalidasKg === null ? "—" : `${fmt(pesoSalidasKg)} kg`,
                        "Peso neto / densidad por tiquete (o estimada); mismo tanque vinculado"],
                ],
                { 0: { cellWidth: 63 }, 1: { cellWidth: 38 }, 2: { cellWidth: 39 } }
            );
            tabla(
                ["DIFERENCIAS DE SALIDA", "Δ volumen (L)", "Desviación %", "Criterio"],
                [
                    ["SCADA - despacho Ambiocom", variacion(diferenciaSalidaContador),
                        pct(diferenciaSalidaContador, despachoContador),
                        "Indicador preliminar; requiere fechas/horas y movimientos comparables"],
                    ["SCADA - báscula gravimétrica", variacion(scadaVsBasculaSalidas),
                        pct(scadaVsBasculaSalidas, basculaSalidasL),
                        "Comparación del movimiento estimado y volumen de báscula"],
                    ["Despacho Ambiocom - báscula", variacion(contadorVsBasculaSalidas),
                        pct(contadorVsBasculaSalidas, basculaSalidasL),
                        "Diferencia entre dos fuentes registradas"],
                ],
                { 0: { cellWidth: 70 }, 1: { cellWidth: 41 }, 2: { cellWidth: 34 } }
            );
            tabla(
                ["INGRESOS | Fuente", "Volumen (L)", "Peso (kg)", "Alcance / trazabilidad"],
                [
                    ["SCADA · tanque seleccionado", conLitros(entrada), "—",
                        `${modoTexto(tipo)}; aumento estimado por nivel`],
                    ["Despachos · ingreso a tanque", "No disponible", "—",
                        "El resumen de despachos no suministra entradas al tanque"],
                    ["Báscula · recepciones nacionales", conLitros(recepcionNacional),
                        numero(resumenBascula?.pesoNetoNacional) === null ? "—" : `${fmt(resumenBascula.pesoNetoNacional)} kg`,
                        "Recepción de PLANTA, no asignada al tanque"],
                    ["Báscula · recepciones importadas", conLitros(recepcionImportacion),
                        numero(resumenBascula?.pesoNetoImportacion) === null ? "—" : `${fmt(resumenBascula.pesoNetoImportacion)} kg`,
                        "Recepción de PLANTA, no asignada al tanque"],
                    ["Báscula · TOTAL recepciones de planta", conLitros(basculaIngresosPlantaL),
                        pesoIngresosPlantaKg === null ? "—" : `${fmt(pesoIngresosPlantaKg)} kg`,
                        "Estimado con densidad de referencia cuando existe"],
                ],
                { 0: { cellWidth: 71 }, 1: { cellWidth: 38 }, 2: { cellWidth: 39 } }
            );
            nuevaPaginaSi(22);
            pdf.setFont(FONT, "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(...ROJO);
            const avisoConciliacion =
                "IMPORTANTE: Las recepciones en báscula son de toda la planta. Sin tanque receptor identificado NO deben restarse ni conciliarse directamente contra ingresos SCADA del tanque.";
            const avisoLineas = pdf.splitTextToSize(avisoConciliacion, ancho - 2 * margen);
            pdf.text(avisoLineas, margen, y);
            y += avisoLineas.length * 5 + 5;
            // 3. RESUMEN EJECUTIVO
            seccion("2. RESUMEN EJECUTIVO | Indicadores SCADA del tanque");
            tabla(
                [
                    "Indicador principal",
                    "Nivel (m)",
                    "Volumen (L)",
                    "Interpretación / procedencia",
                ],
                [
                    [
                        "Inventario inicial",
                        conNivel(nivelInicial),
                        conLitros(volumenInicial),
                        "Primera lectura original del período",
                    ],
                    [
                        "Inventario final",
                        conNivel(nivelFinal),
                        conLitros(volumenFinal),
                        "Última lectura original del período",
                    ],
                    [
                        "Variación neta observada",
                        conNivelDelta(nivelNeto),
                        variacion(netoObservado),
                        "Final - inicial; no es el movimiento bruto",
                    ],
                    [
                        "Ingresado estimado*",
                        conNivel(entradaM),
                        conLitros(entrada),
                        `${modoTexto(tipo)} · acumulado del panel lateral`,
                    ],
                    [
                        "Salida total estimada*",
                        conNivel(salidaM),
                        conLitros(salida),
                        `${modoTexto(tipo)} · acumulado del panel lateral`,
                    ],
                    [
                        "Neto de movimientos estimados*",
                        conNivelDelta(netoMovimientosM),
                        variacion(netoMovimientos),
                        "Ingresado - salido del modo activo",
                    ],
                    [
                        "Diferencia de cierre del método",
                        conNivelDelta(residualM),
                        variacion(diferenciaNoExplicada),
                        "Observado - estimado; no demuestra merma",
                    ],
                ],
                {
                    0: { cellWidth: 61 },
                    1: { cellWidth: 39 },
                    2: { cellWidth: 45 },
                }
            );
            nuevaPaginaSi(12);
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...GRIS);
            pdf.text(
                "* Equivalencia en metros = volumen acumulado / factor (L/m); NO suma física de alturas de líquido independientes.",
                margen,
                y
            );
            y += 7;
            // 3. DESPACHOS
            seccion(
                "3. Resumen del análisis de DESPACHOS | Tanque seleccionado"
            );
            tabla(
                ["Indicador del panel", "Valor", "Ámbito"],
                [
                    [
                        "Volumen programado a despachar",
                        conLitros(despachoProgramado),
                        "Programado, no necesariamente ejecutado",
                    ],
                    [
                        "SCADA salida estimada*",
                        conLitros(salida),
                        "Modo seleccionado; no despacho confirmado",
                    ],
                    [
                        "Volumen contador Ambiocom",
                        conLitros(despachoContador),
                        "Despachos del tanque seleccionado",
                    ],
                    [
                        "Volumen contador gravimétrico",
                        conLitros(despachoGrav),
                        "Despachos del tanque seleccionado",
                    ],
                    [
                        "Báscula · volumen por peso y densidad",
                        conLitros(basculaSalidasL),
                        "Ventas vinculadas al tanque; cálculo por tiquete del padre o estimación peso/densidad",
                    ],
                    [
                        "Báscula · peso neto de ventas",
                        pesoSalidasKg === null ? "—" : `${fmt(pesoSalidasKg)} kg`,
                        "Peso de las salidas vinculadas al tanque seleccionado",
                    ],
                    [
                        "Registros de despachos",
                        fmt(resumenDespachos?.cantidadDespachos),
                        "Conteo del período",
                    ],
                    [
                        "Diferencia SCADA vs contador Ambiocom",
                        variacion(diferenciaSalidaContador),
                        "Estimación SCADA menos contador",
                    ],
                    [
                        "Diferencia relativa (solo con referencia >0)",
                        pct(diferenciaSalidaContador, despachoContador),
                        "Sin base positiva no se calcula porcentaje",
                    ],
                    [
                        "Contador Ambiocom - gravimétrico",
                        variacion(diferenciaContadores),
                        "Diferencia entre los dos contadores",
                    ],
                    [
                        "Diferencia SCADA vs volumen báscula",
                        variacion(scadaVsBasculaSalidas),
                        "Salida estimada SCADA menos salida calculada por báscula",
                    ],
                    [
                        "Diferencia SCADA vs báscula (%)",
                        pct(scadaVsBasculaSalidas, basculaSalidasL),
                        "Porcentaje respecto al volumen de báscula; sin base positiva se omite",
                    ],
                    [
                        "Contador Ambiocom vs báscula",
                        variacion(contadorVsBasculaSalidas),
                        "Contador de despacho menos volumen de báscula",
                    ],
                    [
                        "Contador Ambiocom vs báscula (%)",
                        pct(contadorVsBasculaSalidas, basculaSalidasL),
                        "Porcentaje respecto al volumen de báscula; sin base positiva se omite",
                    ],
                ]
            );
            // 5. VENTAS BÁSCULA (peso y volumen juntos)
            seccion("4. Resumen del análisis de VENTAS BÁSCULA");
            tabla(
                ["Indicador del panel", "Peso (kg)", "Volumen (L)", "Ámbito / nota"],
                [
                    ["Peso neto despachado · tanque seleccionado",
                        pesoSalidasKg === null ? "—" : `${fmt(pesoSalidasKg)} kg`,
                        conLitros(basculaSalidasL),
                        "Venta vinculada; volumen gravimétrico del padre o peso/densidad"],
                    ["Peso neto recibido · planta completa",
                        pesoIngresosPlantaKg === null ? "—" : `${fmt(pesoIngresosPlantaKg)} kg`,
                        conLitros(basculaIngresosPlantaL),
                        "Recepción de planta, NO necesariamente del tanque seleccionado"],
                    ["Volumen gravimétrico de báscula", "—", conLitros(basculaGrav),
                        "Salidas con densidad disponible o estimada"],
                    ["Densidad promedio ponderada", "—", "—",
                        densidadVentas === null ? "Sin densidad" : `${fmt(densidadVentas, 5)} kg/L (salidas vinculadas)`],
                    ["Mediana de densidad de referencia", "—", "—",
                        numero(resumenBascula?.densidadReferencia) === null ? "—" :
                            `${fmt(resumenBascula.densidadReferencia, 5)} kg/L (referencia del padre)`],
                    ["Vehículos con densidad estimada", "—", "—",
                        `${fmt(resumenBascula?.cantidadVolumenEstimado)} vehículos; estimación no medición directa`],
                    ["Vehículos sin densidad", "—", "—",
                        `${fmt(resumenBascula?.cantidadSinDensidad)} vehículos; no se estimó volumen`],
                ],
                { 0: { cellWidth: 76 }, 1: { cellWidth: 36 }, 2: { cellWidth: 37 } }
            );
            // 5. RECEPCIONES
            seccion("5. Resumen del análisis de RECEPCIONES EN BÁSCULA");
            tabla(
                [
                    "Recepción",
                    "Peso neto (kg)",
                    "Volumen estimado (L)",
                    "Registros",
                ],
                [
                    [
                        "Materia prima nacional",
                        fmt(resumenBascula?.pesoNetoNacional),
                        fmt(recepcionNacional),
                        fmt(resumenBascula?.cantidadNacionales),
                    ],
                    [
                        "Materia prima importación",
                        fmt(resumenBascula?.pesoNetoImportacion),
                        fmt(recepcionImportacion),
                        fmt(resumenBascula?.cantidadImportados),
                    ],
                    [
                        "TOTAL PLANTA",
                        fmt(resumenBascula?.pesoNetoIngresos),
                        fmt(recepcionEstimada),
                        fmt(resumenBascula?.cantidadIngresos),
                    ],
                ]
            );
            tabla(
                ["Parámetro de estimación", "Resultado", "Alcance"],
                [
                    [
                        "Densidad ponderada aplicada a recepciones",
                        numero(
                            resumenBascula?.densidadEstimadaRecepciones
                        ) === null
                            ? "—"
                            : `${fmt(
                                resumenBascula.densidadEstimadaRecepciones,
                                5
                            )} kg/L`,
                        "Referencia estimada, derivada de salidas",
                    ],
                    [
                        "Asignación de entradas al tanque",
                        "NO DISPONIBLE",
                        "Recepciones de planta no equivalen a entradas del tanque",
                    ],
                ]
            );
            // 6. MOVIMIENTOS BÁSCULA
            seccion("6. Movimientos registrados en BÁSCULA");
            tabla(
                ["Indicador", "Cantidad", "Ámbito"],
                [
                    [
                        "Salidas registradas",
                        fmt(resumenBascula?.cantidadSalidas),
                        "Vinculadas al tanque seleccionado",
                    ],
                    [
                        "Ingresos registrados",
                        fmt(resumenBascula?.cantidadIngresos),
                        "Planta",
                    ],
                ]
            );
            // 7. COMPARACIÓN DE MODOS
            seccion("7. Análisis comparativo | Original vs modo activo");
            tabla(
                [
                    "Movimiento / criterio",
                    "Original (m / L)",
                    "Modo activo (m / L)",
                    "Diferencia de litros",
                ],
                [
                    [
                        "Entradas estimadas",
                        `${conNivel(originalEntradaM)} / ${conLitros(originalEntrada)}`,
                        `${conNivel(entradaM)} / ${conLitros(entrada)}`,
                        variacion(resta(originalEntrada, entrada)),
                    ],
                    [
                        "Salidas estimadas",
                        `${conNivel(originalSalidaM)} / ${conLitros(originalSalida)}`,
                        `${conNivel(salidaM)} / ${conLitros(salida)}`,
                        variacion(resta(originalSalida, salida)),
                    ],
                    [
                        "Movilización bruta",
                        conLitros(originalBruto),
                        conLitros(filtradoBruto),
                        variacion(diferenciaBruta),
                    ],
                    [
                        "Efecto relativo sobre bruto",
                        "—",
                        "—",
                        pct(diferenciaBruta, originalBruto),
                    ],
                    [
                        "Neto observado (sin depurar)",
                        `${conNivelDelta(nivelNeto)} / ${variacion(netoObservado)}`,
                        `${conNivelDelta(nivelNeto)} / ${variacion(netoObservado)}`,
                        "Extremos originales constantes",
                    ],
                ],
                {
                    0: { cellWidth: 59 },
                    1: { cellWidth: 70 },
                    2: { cellWidth: 70 },
                }
            );
            nuevaPaginaSi(12);
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...GRIS);
            pdf.text(
                "Original - modo activo refleja efecto del método: NO es volumen retirado de inventario ni pérdida física.",
                margen,
                y
            );
            y += 8;
            // 8. DIAGNÓSTICO
            seccion("8. Diagnóstico técnico y puntos de revisión");
            const observaciones = [];
            if (netoObservado !== null) {
                observaciones.push([
                    "Comportamiento del inventario",
                    netoObservado > 0
                        ? "El volumen final observado es mayor que el inicial: el tanque presenta acumulación neta en el período."
                        : netoObservado < 0
                            ? "El volumen final observado es menor que el inicial: el tanque presenta disminución neta en el período."
                            : "El inventario observado cerró al mismo volumen inicial; esto no descarta ingresos y salidas intermedias.",
                ]);
            } else {
                observaciones.push([
                    "Inventario",
                    "Sin factor o sin lecturas de extremos; no se puede establecer cierre volumétrico.",
                ]);
            }
            if (entrada !== null && salida !== null) {
                observaciones.push([
                    "Dinámica estimada",
                    entrada > salida
                        ? "Según el algoritmo activo, el volumen acumulado de entradas supera el de salidas."
                        : entrada < salida
                            ? "Según el algoritmo activo, el volumen acumulado de salidas supera el de entradas."
                            : "El algoritmo activo estima igual magnitud de entradas y salidas.",
                ]);
            }
            if (diferenciaNoExplicada !== null) {
                observaciones.push([
                    "Cierre del método",
                    `Residual de ${variacion(
                        diferenciaNoExplicada
                    )} entre extremos originales y acumulados del algoritmo. Puede deberse a exclusiones, umbral, bordes o brechas; NO confirma fuga ni merma.`,
                ]);
            }
            if (
                tipo !== "original" &&
                originalBruto !== null &&
                filtradoBruto !== null
            ) {
                observaciones.push([
                    "Efecto de la depuración",
                    `El bruto de movimientos cambió en ${variacion(
                        diferenciaBruta
                    )} (${pct(
                        diferenciaBruta,
                        originalBruto
                    )} del bruto original). Es una diferencia analítica, NO litros eliminados físicamente.`,
                ]);
            }
            if (cantidadOculta > 0) {
                observaciones.push([
                    "Puntos omitidos",
                    `Se omitieron ${cantidadOculta} lecturas de ${cantidadTotal} (${pct(
                        cantidadOculta,
                        cantidadTotal
                    )}): ${manuales.length} manuales y ${ocultasFiltro.length
                    } por depuración de Nodos.`,
                ]);
            }
            if (conteoTramos > 0) {
                observaciones.push([
                    "Continuidad de señal",
                    `Se registraron ${conteoTramos} intervalos sin señal. No se reconstruyen movimientos dentro de esas brechas; revisar el detalle temporal.`,
                ]);
            }
            if (
                diferenciaSalidaContador !== null &&
                numero(resumenDespachos?.cantidadDespachos) > 0
            ) {
                observaciones.push([
                    "Contraste SCADA - despachos",
                    `La salida acumulada estimada por SCADA difiere del contador Ambiocom en ${variacion(
                        diferenciaSalidaContador
                    )} (${pct(
                        diferenciaSalidaContador,
                        despachoContador
                    )} respecto al contador). Revisar conciliación por franja horaria, traslados y nivel de tanque.`,
                ]);
            }
            if (scadaVsBasculaSalidas !== null && numero(resumenBascula?.cantidadSalidas) > 0) {
                observaciones.push([
                    "Contraste SCADA - báscula de ventas",
                    `El volumen de salida estimado por SCADA difiere del volumen gravimétrico de ventas vinculadas en ${variacion(scadaVsBasculaSalidas)} (${pct(scadaVsBasculaSalidas, basculaSalidasL)} frente a báscula). Revisar conciliación temporal, movimientos internos y densidad aplicada; no implica pérdida física confirmada.`,
                ]);
            }
            if (numero(resumenBascula?.cantidadIngresos) > 0) {
                observaciones.push([
                    "Alcance de recepciones",
                    "Las recepciones corresponden al conjunto de planta y no identifican el tanque receptor; no se utilizan para cerrar el balance individual.",
                ]);
            }
            if (numero(umbralLimpiezaL) > 0) {
                observaciones.push([
                    "Sensibilidad del filtro",
                    `El umbral activo es ${fmt(
                        umbralLimpiezaL,
                        2
                    )} L (${equivalenteUmbralM === null
                        ? "sin equivalencia en metros"
                        : `${fmt(equivalenteUmbralM, 6)} m`
                    }). Para cuantificar sensibilidad, comparar el mismo período con otros umbrales; este informe refleja solo el vigente.`,
                ]);
            }
            if (!observaciones.length) {
                observaciones.push([
                    "Información",
                    "No hay suficientes datos cuantitativos para realizar un diagnóstico volumétrico.",
                ]);
            }
            tabla(
                ["Aspecto", "Interpretación / acción recomendada"],
                observaciones,
                { 0: { cellWidth: 58 } }
            );
            nuevaPaginaSi(12);
            pdf.setFont(FONT, "normal");
            pdf.setTextColor(...GRIS);
            pdf.setFontSize(7.6);
            pdf.text(
                `Período: ${etiquetaPeriodo ||
                (modoDia === "inventario"
                    ? "Inventario 08:00–08:00"
                    : "Natural 00:00–24:00")
                }. Análisis de un tanque; comparaciones sujetas a desfases operativos.`,
                margen,
                y
            );
            y += 8;
            // 9. CONTEXTO
            seccion("9. Contexto y condiciones del análisis");
            tabla(
                ["Parámetro", "Valor", "Parámetro", "Valor"],
                [
                    ["Tanque", tituloTanque, "Producto", producto || "—"],
                    [
                        "Período",
                        etiquetaPeriodo || fechaConsultada,
                        "Modo",
                        modoTexto(tipo),
                    ],
                    [
                        "Tipo de día",
                        modoDia === "inventario"
                            ? "Inventario 08:00 a 08:00"
                            : "Natural 00:00 a 24:00",
                        "Vista en pantalla",
                        unidad === "volumen" ? "Volumen" : "Nivel",
                    ],
                    [
                        "Factor",
                        factorValido ? `${fmt(factor, 3)} L/m` : "—",
                        "Umbral de ruido",
                        `${fmt(umbralLimpiezaL, 2)} L`,
                    ],
                    [
                        "Capacidad nominal",
                        conLitros(capacidad),
                        "Grado alcohólico",
                        gradoAlcoholico ?? "—",
                    ],
                    [
                        "Lecturas válidas",
                        fmt(universo.length),
                        "Lecturas visibles",
                        fmt(aceptadas.length),
                    ],
                    [
                        "Exclusiones manuales",
                        fmt(manuales.length),
                        "Omitidas por depuración",
                        fmt(ocultasFiltro.length),
                    ],
                ]
            );
            if (resumenEsDelPeriodoCompleto) {
                nuevaPaginaSi(12);
                pdf.setTextColor(...ROJO);
                pdf.setFontSize(8);
                pdf.text(
                    "NOTA: La lupa limita las TABLAS; los indicadores volumétricos del panel corresponden al período completo.",
                    margen,
                    y
                );
                y += 9;
            }
            // 10. DEPURACIÓN
            seccion("10. Calidad de señal y trazabilidad de la depuración");
            tabla(
                ["Indicador de trazabilidad", "Valor", "Significado"],
                [
                    [
                        "Lecturas válidas del intervalo",
                        fmt(cantidadTotal),
                        "Registros válidos disponibles para evaluar",
                    ],
                    [
                        "Lecturas efectivamente visibles",
                        fmt(aceptadas.length),
                        "Puntos conservados en el modo activo",
                    ],
                    [
                        "Excluidas manualmente",
                        fmt(manuales.length),
                        "Acción del analista",
                    ],
                    [
                        "Omitidas por filtro de Nodos",
                        fmt(ocultasFiltro.length),
                        "Simplificación automática; no altera registros fuente",
                    ],
                    [
                        "Total omitidas",
                        fmt(cantidadOculta),
                        "Manuales + filtro, sin duplicarlas",
                    ],
                    [
                        "Porcentaje de omisión",
                        pct(cantidadOculta, cantidadTotal),
                        "Fracción de lecturas válidas",
                    ],
                    [
                        "Umbral configurado",
                        `${fmt(umbralLimpiezaL, 2)} L`,
                        "Parámetro configurado, no una cantidad restada",
                    ],
                    [
                        "Equivalencia del umbral",
                        equivalenteUmbralM === null
                            ? "—"
                            : `${fmt(equivalenteUmbralM, 6)} m`,
                        "Umbral (L) / Factor (L/m)",
                    ],
                    [
                        "Brechas >30 minutos",
                        fmt(conteoTramos),
                        "Segmentos reportados por el análisis",
                    ],
                    [
                        "Mayor intervalo entre lecturas",
                        `${fmt(intervaloMayor, 1)} min`,
                        "Calculado con lecturas válidas del intervalo",
                    ],
                ]
            );
            // 11. GRÁFICA
            const canvas = chartRef?.current?.canvas;
            if (canvas && typeof canvas.toDataURL === "function") {
                try {
                    const imagen = canvas.toDataURL("image/png", 1);
                    const proporcion =
                        canvas.width / Math.max(canvas.height, 1);
                    const w = ancho - 2 * margen;
                    const h = Math.min(92, w / proporcion);
                    const imagenW = h * proporcion;
                    nuevaPaginaSi(h + 19);
                    seccion("11. Gráfica actual del análisis");
                    nuevaPaginaSi(h + 2);
                    pdf.addImage(
                        imagen,
                        "PNG",
                        margen,
                        y,
                        imagenW,
                        h
                    );
                    y += h + 9;
                } catch (error) {
                    console.warn(
                        "No se pudo incluir la gráfica en el PDF:",
                        error
                    );
                }
            }
            // 12. LECTURAS VISIBLES
            seccion("12. Lecturas visibles utilizadas en la gráfica");
            const filasPuntos = aceptadas.map((p, i) => {
                const anterior = aceptadas[i - 1];
                const dl =
                    anterior &&
                        Number.isFinite(p.volumen) &&
                        Number.isFinite(anterior.volumen)
                        ? p.volumen - anterior.volumen
                        : null;
                return [
                    i + 1,
                    fechaHora(
                        p.minutosDia,
                        fechaConsultada,
                        modoDia
                    ),
                    fmt(p.nivel, 3),
                    fmt(p.volumen),
                    dl === null ? "—" : fmt(dl),
                    anterior
                        ? fmt(p.minutosDia - anterior.minutosDia)
                        : "—",
                ];
            });
            tabla(
                [
                    "#",
                    "Fecha / hora",
                    "Nivel (m)",
                    "Volumen (L)",
                    "Δ vs visible anterior (L)",
                    "Δ t (min)",
                ],
                filasPuntos,
                {
                    0: { cellWidth: 13 },
                    1: { cellWidth: 48 },
                    2: { cellWidth: 39 },
                    3: { cellWidth: 45 },
                    4: { cellWidth: 88 },
                    5: { cellWidth: 36 },
                }
            );
            // 13. EXCLUSIONES MANUALES
            if (tipo !== "original") {
                seccion("13. Lecturas excluidas manualmente");
                tabla(
                    [
                        "Fecha / hora",
                        "Nivel (m)",
                        "Volumen (L)",
                        "Estado",
                    ],
                    manuales.map(p => [
                        fechaHora(
                            p.minutosDia,
                            fechaConsultada,
                            modoDia
                        ),
                        fmt(p.nivel, 3),
                        fmt(p.volumen),
                        "Excluida manualmente",
                    ])
                );
                // 14. DEPURACIÓN DE NODOS
                if (tipo === "nodos") {
                    seccion(
                        "14. Lecturas ocultas por depuración de nodos"
                    );
                    tabla(
                        [
                            "Fecha / hora",
                            "Nivel (m)",
                            "Volumen (L)",
                            "Estado",
                        ],
                        ocultasFiltro.map(p => [
                            fechaHora(
                                p.minutosDia,
                                fechaConsultada,
                                modoDia
                            ),
                            fmt(p.nivel, 3),
                            fmt(p.volumen),
                            "No visible por filtro",
                        ])
                    );
                }
            }
            // 15. EVENTOS Y OPERACIONES
            seccion(
                "15. Detalle de eventos / operaciones proporcionados por el padre"
            );
            tabla(
                [
                    "#",
                    "Tipo",
                    "Desde",
                    "Hasta",
                    "Variación (m)",
                    "Variación (L)",
                ],
                eventosReporte.map((e, i) => [
                    i + 1,
                    tipo === "operaciones"
                        ? e.tipo ||
                        (e.delta > 0
                            ? "Carga estimada"
                            : "Descarga estimada")
                        : e.delta > 0
                            ? "Subida"
                            : e.delta < 0
                                ? "Bajada"
                                : "Sin cambio",
                    fechaHora(
                        e?.desde?.minutosDia ?? e?.minutosDia,
                        fechaConsultada,
                        modoDia
                    ),
                    fechaHora(
                        e?.hasta?.minutosDia ?? e?.minutosDia,
                        fechaConsultada,
                        modoDia
                    ),
                    fmt(e.delta, 3),
                    fmt(e.deltaL),
                ])
            );
            nuevaPaginaSi(16);
            pdf.setTextColor(...GRIS);
            pdf.setFont(FONT, "normal");
            pdf.setFontSize(8.5);
            pdf.text(
                "Notas: Δ entre puntos visibles no significa necesariamente una operación real. Los puntos excluidos no se eliminaron de la fuente.",
                margen,
                y
            );
            y += 5;
            pdf.text(
                "El reporte documenta estimaciones SCADA y registros recibidos; no sustituye conciliación temporal, báscula ni inventario físico.",
                margen,
                y
            );
            pie();
            // Crear enlaces una vez finalizada la paginación de las tablas.
            // El apartado 10 puede no existir si no fue posible obtener el canvas.
            pdf.setPage(1);
            for (const fila of filasIndice) {
                const paginaDestino = paginasSeccion.get(fila.id);
                if (!paginaDestino) continue;
                pdf.link(fila.x, fila.y, fila.w, fila.h, { pageNumber: paginaDestino });
                pdf.setFont(FONT, "bold");
                pdf.setFontSize(8.2);
                pdf.setTextColor(...AZUL);
                pdf.text(`Pág. ${paginaDestino}`, ancho - margen - 4, fila.y + 4.7, { align: "right" });
            }
            const nombre = `SCADA_${tituloArchivo(
                tituloTanque
            )}_${tituloArchivo(fechaConsultada)}_${tipo}.pdf`;
            pdf.save(nombre);
        } catch (error) {
            console.error(
                "Error generando informe SCADA:",
                error
            );
            window.alert(
                `No fue posible generar el informe PDF: ${error.message}`
            );
        } finally {
            setGenerando(false);
        }
    };
    return (
        <Tooltip title="Exportar informe PDF">
            <span>
                <IconButton
                    onClick={generar}
                    disabled={disabled || generando}
                    size="small"
                    sx={{
                        width: 38,
                        height: 38,
                        color: "#cf3b31",
                        border: "1px solid #cf3b31",
                        borderRadius: 1.4,
                        bgcolor: "#fff5f4",
                        "&:hover": { bgcolor: "#ffe9e6" },
                    }}
                >
                    {generando
                        ? <CircularProgress size={18} color="inherit" />
                        : <PictureAsPdfOutlinedIcon fontSize="small" />}
                </IconButton>
            </span>
        </Tooltip>
    );
}
