import React, { useMemo, useState } from "react";
import { Box, Drawer, IconButton, Typography, Stack, Divider, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

const MARINO = "#081c6a";
const VERDE = "#009846";
const ROJO_DARK = "#ff1e00";
const formatear = (v, dec = 0) => Number(v).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const horaDe = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;

// Lógica reutilizable e independiente de la gráfica: no consulta datos ni cambia lecturas.
export function calcularResumenTanqueSCADA(puntos = [], umbral = 300) {
    const ordenados = [...puntos]
        .filter(p => Number.isFinite(p?.minutosDia) && Number.isFinite(p?.nivel))
        .sort((a, b) => a.minutosDia - b.minutosDia || (a.indice ?? 0) - (b.indice ?? 0));
    if (!ordenados.length) return null;
    const inicial = ordenados[0];
    const final = ordenados[ordenados.length - 1];
    const tieneVolumen = ordenados.every(p => Number.isFinite(p?.volumen));
    let ingresado = 0, salido = 0, posibleEntrada = 0, posibleSalida = 0;
    let cantidadPosiblesEntradas = 0, cantidadPosiblesSalidas = 0, intervalosSinSenal = 0;
    for (let i = 1; i < ordenados.length; i++) {
        const anterior = ordenados[i - 1];
        const actual = ordenados[i];
        if (actual.minutosDia - anterior.minutosDia > 30) intervalosSinSenal++;
        if (!tieneVolumen) continue;
        const delta = actual.volumen - anterior.volumen;
        if (delta > 0) {
            ingresado += delta;
            if (delta < umbral) { posibleEntrada += delta; cantidadPosiblesEntradas++; }
        } else if (delta < 0) {
            salido += -delta;
            if (-delta < umbral) { posibleSalida += -delta; cantidadPosiblesSalidas++; }
        }
    }
    let maximo = ordenados[0], minimo = ordenados[0];
    let mayorEntrada = null, mayorSalida = null;
    let tasaMaxEntrada = null, tasaMaxSalida = null;
    let tiempoVariacionesPequenas = 0, minutosSinSenal = 0;
    let cambiosConSenal = 0, cambiosObservados = 0;
    for (let i = 1; i < ordenados.length; i++) {
        const previo = ordenados[i - 1], actual = ordenados[i];
        const dt = actual.minutosDia - previo.minutosDia;
        if (dt > 30) minutosSinSenal += dt;
        if (dt > 0 && dt <= 30) cambiosConSenal++;
        if (!tieneVolumen || dt <= 0) continue;
        const delta = actual.volumen - previo.volumen;
        cambiosObservados++;
        if (dt <= 30 && Math.abs(delta) < umbral) tiempoVariacionesPequenas += dt;
        if (delta > 0) {
            if (!mayorEntrada || delta > mayorEntrada.delta) mayorEntrada = { delta, desde: previo, hasta: actual };
            if (dt <= 30) {
                const tasa = delta * 60 / dt;
                if (!tasaMaxEntrada || tasa > tasaMaxEntrada.tasa) tasaMaxEntrada = { tasa, desde: previo, hasta: actual };
            }
        } else if (delta < 0) {
            if (!mayorSalida || -delta > mayorSalida.delta) mayorSalida = { delta: -delta, desde: previo, hasta: actual };
            if (dt <= 30) {
                const tasa = -delta * 60 / dt;
                if (!tasaMaxSalida || tasa > tasaMaxSalida.tasa) tasaMaxSalida = { tasa, desde: previo, hasta: actual };
            }
        }
    }
    for (const p of ordenados) {
        if (p.nivel > maximo.nivel) maximo = p;
        if (p.nivel < minimo.nivel) minimo = p;
    }
    return {
        inicial, final, ingresado: tieneVolumen ? ingresado : null,
        salido: tieneVolumen ? salido : null,
        posibleEntrada: tieneVolumen ? posibleEntrada : null,
        posibleSalida: tieneVolumen ? posibleSalida : null,
        cantidadPosiblesEntradas, cantidadPosiblesSalidas, intervalosSinSenal,
        neto: tieneVolumen ? final.volumen - inicial.volumen : null,
        netoNivel: final.nivel - inicial.nivel,
        maximo, minimo, mayorEntrada, mayorSalida, tasaMaxEntrada, tasaMaxSalida,
        tiempoVariacionesPequenas: tieneVolumen ? tiempoVariacionesPequenas : null,
        minutosSinSenal, cantidadLecturas: ordenados.length,
        cambiosConSenal, cambiosObservados,
    };
}

function DatoResumen({ titulo, valor, detalle, color = MARINO }) {
    return (
        <Box sx={{
            border: "1px solid #dce7f3", borderRadius: 1.6, p: 1.5,
            bgcolor: "#f8fbff", minWidth: 0, height: "100%", boxSizing: "border-box"
        }}>
            <Typography sx={{ color: "#58709a", fontSize: 11, mb: .4 }}>{titulo}</Typography>
            <Typography sx={{ color, fontWeight: 850, fontSize: { xs: 18, sm: 20 }, lineHeight: 1.2, overflowWrap: "anywhere" }}>{valor}</Typography>
            <Typography sx={{ color: "#58709a", fontSize: 11, mt: .5 }}>{detalle}</Typography>
        </Box>
    );
}

export default function ResumenTanqueSCADADrawer({ open = false, onClose = () => {}, puntos = [], tituloTanque = "Tanque", fechaConsultada = "", umbralVariacionL = 300 }) {
    const resumen = useMemo(() => calcularResumenTanqueSCADA(puntos, umbralVariacionL), [puntos, umbralVariacionL]);
    const litros = (v) => v == null ? "Sin factor" : `${formatear(v)} L`;
    const metros = (v) => v == null ? "—" : `${formatear(v, 3)} m`;
    const momento = (p) => p ? (p.horaReal || horaDe(p.minutosDia)) : "—";
    const intervalo = (dato) => dato ? `${momento(dato.desde)} – ${momento(dato.hasta)}` : "Sin variaciones";
    const [seccionAbierta, setSeccionAbierta] = useState("balance");
    const seccion = (id, titulo, contenido) => (
        <Accordion key={id} disableGutters elevation={0} expanded={seccionAbierta === id}
            onChange={(_, expanded) => setSeccionAbierta(expanded ? id : "")}
            sx={{ border: "1px solid #dce7f3", borderRadius: "10px !important", overflow: "hidden", mb: 1.1,
                "&::before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, bgcolor: "#f8fbff" }}>
                <Typography sx={{ fontWeight: 800, fontSize: 13, color: MARINO }}>{titulo}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.25 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.15 }}>
                    {contenido}
                </Box>
            </AccordionDetails>
        </Accordion>
    );

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 620, md: 680 },
                    maxWidth: "100vw",
                    bgcolor: "#fff",
                },
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <AssessmentOutlinedIcon sx={{ color: "#087cff" }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850, fontSize: 17, color: MARINO }}>Resumen del análisis</Typography>
                        <Typography sx={{ fontSize: 11, color: "#58709a" }}>{tituloTanque} · {fechaConsultada}</Typography>
                    </Box>
                </Stack>
                <IconButton onClick={onClose} aria-label="Cerrar resumen"><CloseIcon /></IconButton>
            </Stack>
            <Divider />
            <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
                {!resumen ? (
                    <Typography sx={{ color: "#58709a" }}>No hay lecturas para resumir.</Typography>
                ) : (
                    <>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.4 }}>
                            <Typography sx={{ fontSize: 12, color: "#58709a" }}>Análisis basado en lecturas SCADA</Typography>
                            <Chip size="small" variant="outlined" label={`${resumen.cantidadLecturas} lecturas`} />
                        </Stack>
                        {seccion("balance", "01 · Balance de inventario", <>
                            <DatoResumen titulo="Inventario inicial" valor={litros(resumen.inicial.volumen)} detalle={`${metros(resumen.inicial.nivel)} · ${momento(resumen.inicial)}`} />
                            <DatoResumen titulo="Inventario final" valor={litros(resumen.final.volumen)} detalle={`${metros(resumen.final.nivel)} · ${momento(resumen.final)}`} />
                            <DatoResumen titulo="Volumen total de entrada" valor={litros(resumen.ingresado)} detalle="Suma de incrementos entre lecturas" color={VERDE} />
                            <DatoResumen titulo="Volumen total de salida" valor={litros(resumen.salido)} detalle="Suma absoluta de disminuciones" color={ROJO_DARK} />
                            <DatoResumen titulo="Variación neta" valor={resumen.neto == null ? "Sin factor" : `${resumen.neto > 0 ? "+" : ""}${litros(resumen.neto)}`} detalle={`Cambio de nivel: ${metros(resumen.netoNivel)}`} />
                            <DatoResumen titulo="Máximo y mínimo registrados" valor={`${metros(resumen.maximo.nivel)} / ${metros(resumen.minimo.nivel)}`} detalle={`Máx. ${momento(resumen.maximo)} · Mín. ${momento(resumen.minimo)}`} />
                        </>)}
                        {seccion("movimientos", "02 · Dinámica de movimientos", <>
                            <DatoResumen titulo="Mayor incremento individual" valor={resumen.mayorEntrada ? litros(resumen.mayorEntrada.delta) : "—"} detalle={intervalo(resumen.mayorEntrada)} color={VERDE} />
                            <DatoResumen titulo="Mayor disminución individual" valor={resumen.mayorSalida ? litros(resumen.mayorSalida.delta) : "—"} detalle={intervalo(resumen.mayorSalida)} color={ROJO_DARK} />
                            <DatoResumen titulo="Tasa aparente máxima de entrada" valor={resumen.tasaMaxEntrada ? `${formatear(resumen.tasaMaxEntrada.tasa)} L/h` : "—"} detalle={intervalo(resumen.tasaMaxEntrada)} color={VERDE} />
                            <DatoResumen titulo="Tasa aparente máxima de salida" valor={resumen.tasaMaxSalida ? `${formatear(resumen.tasaMaxSalida.tasa)} L/h` : "—"} detalle={intervalo(resumen.tasaMaxSalida)} color={ROJO_DARK} />
                        </>)}
                        {seccion("estabilidad", "03 · Estabilidad y fluctuaciones", <>
                            <DatoResumen titulo="Posible variación de entrada" valor={litros(resumen.posibleEntrada)} detalle={`Subidas menores de ${umbralVariacionL} L · ${resumen.cantidadPosiblesEntradas} lecturas`} color={VERDE} />
                            <DatoResumen titulo="Posible variación de salida" valor={litros(resumen.posibleSalida)} detalle={`Bajadas menores de ${umbralVariacionL} L · ${resumen.cantidadPosiblesSalidas} lecturas`} color={ROJO_DARK} />
                            <DatoResumen titulo="Tiempo con cambios pequeños" valor={resumen.tiempoVariacionesPequenas == null ? "Sin factor" : `${formatear(resumen.tiempoVariacionesPequenas, 1)} min`} detalle={`Intervalos de hasta 30 min con |ΔV| < ${umbralVariacionL} L; no confirma inactividad`} />
                        </>)}
                        {seccion("integridad", "04 · Integridad de datos", <>
                            <DatoResumen titulo="Lecturas recibidas" valor={formatear(resumen.cantidadLecturas)} detalle="Para el tanque y día seleccionados" />
                            <DatoResumen titulo="Intervalos sin señal" valor={formatear(resumen.intervalosSinSenal)} detalle="Separaciones superiores a 30 min" />
                            <DatoResumen titulo="Tiempo entre lecturas con brechas" valor={`${formatear(resumen.minutosSinSenal, 1)} min`} detalle="Suma completa de intervalos >30 min; no equivale a tiempo exacto de caída" />
                            <DatoResumen titulo="Intervalos de hasta 30 min" valor={formatear(resumen.cambiosConSenal)} detalle="Con horas válidas y ordenadas" />
                        </>)}
                        {seccion("conciliacion", "05 · Conciliación operativa", <>
                            <Box sx={{ gridColumn: "1 / -1", p: 1.5, bgcolor: "#f8fbff", border: "1px dashed #b6c7db", borderRadius: 1.5 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: MARINO }}>Pendiente de integración</Typography>
                                <Typography sx={{ fontSize: 11.5, mt: .5, color: "#58709a" }}>
                                    Para comparar contra despachos, recepciones, transferencias y SAP se necesitan sus registros reales con fecha, hora y volumen. No se muestran cifras simuladas.
                                </Typography>
                            </Box>
                        </>)}
                    </>
                )}
            </Box>
        </Drawer>
    );
}
