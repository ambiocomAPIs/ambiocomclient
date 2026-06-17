import React, { useMemo, useRef } from "react";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";
import {
    Box,
    Chip,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RTooltip,
    XAxis,
    YAxis,
} from "recharts";

import CollapsibleSection from "./CollapsibleSection";
import OtiffExportActions from "../utils/OtiffExportActions";

const COLORS = {
    ok: "#16a34a",
    bad: "#dc2626",
    warning: "#f59e0b",
    primary: "#4f46e5",
    primaryDark: "#312e81",
    slate: "#0f172a",
    text: "#334155",
    subtleText: "#64748b",
    muted: "#e2e8f0",
    line: "rgba(203,213,225,0.88)",
    softBlue: "#eef2ff",
    softGreen: "#dcfce7",
    softRed: "#fee2e2",
    softYellow: "#fef3c7",
    whiteGlass: "rgba(255,255,255,0.84)",
};

const sectionGradient =
    "radial-gradient(circle at top left, rgba(79,70,229,0.10), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #eef2ff 100%)";

const cardSx = {
    p: { xs: 1.75, md: 2 },
    borderRadius: 3,
    border: `1px solid ${COLORS.line}`,
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.055)",
    overflow: "hidden",
};

const chartBoxSx = {
    height: { xs: 230, md: 245 },
    mt: 1,
    p: { xs: 0.5, md: 0.75 },
    borderRadius: 2.5,
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.84))",
    border: "1px solid rgba(226,232,240,0.92)",
    overflow: "hidden",
};

const miniCardSx = {
    width: "100%",
    p: { xs: 1.5, md: 1.75 },
    borderRadius: 3,
    border: `1px solid ${COLORS.line}`,
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        inset: "0 auto 0 0",
        width: 4,
        background: "linear-gradient(180deg, #4f46e5, #16a34a)",
        opacity: 0.9,
    },
};

const tableHeadCellSx = {
    fontWeight: 950,
    color: COLORS.slate,
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #cbd5e1",
    py: 1.25,
};

const metricChipSx = (backgroundColor, color = COLORS.text) => ({
    fontWeight: 850,
    borderRadius: 999,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.75)",
    "& .MuiChip-label": {
        px: 1.15,
    },
});

const statusPillSx = (label) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 98,
    px: 1.45,
    py: 0.45,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    lineHeight: 1.4,
    color: "#ffffff",
    backgroundColor:
        label === "Cumple"
            ? COLORS.ok
            : label === "En riesgo"
                ? COLORS.warning
                : COLORS.bad,
    boxShadow: "0 8px 16px rgba(15,23,42,0.12)",
    whiteSpace: "nowrap",
});

const safeNumber = (value) => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const normalize = (value) =>
    String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

const sumByName = (data = [], predicate) =>
    data.reduce((acc, item) => {
        const name = normalize(item?.name);
        return predicate(name) ? acc + safeNumber(item?.value) : acc;
    }, 0);

const calcPct = (cumple, total) => {
    if (!total || total <= 0) return 0;
    return (cumple / total) * 100;
};

const getStatus = (pct, meta) => {
    if (pct >= meta) {
        return {
            label: "Cumple",
            color: "success",
            icon: <CheckCircleIcon fontSize="small" />,
        };
    }

    if (pct >= meta - 5) {
        return {
            label: "En riesgo",
            color: "warning",
            icon: <ErrorOutlineIcon fontSize="small" />,
        };
    }

    return {
        label: "No cumple",
        color: "error",
        icon: <ErrorOutlineIcon fontSize="small" />,
    };
};

const getOtiffColor = (pct) => {
    if (pct >= 95) return COLORS.ok;
    if (pct >= 90) return COLORS.warning;
    return COLORS.bad;
};

const getRangeLabel = (range) => {
    const from = range?.from || "N/D";
    const to = range?.to || "N/D";
    return `${from} → ${to}`;
};

const OtiffGeneralCollapsible = ({
    comparativoFiltrado = [],
    tolerancia = 0.002,
    pieCumpleVsNoCumpleHoraProgramada = [],
    pieCumplimientoFechaEntrega = [],
    range,
    formatNumber = (v) => v,
    formatNumber1D = (v) => Number(v ?? 0).toFixed(1),
    metaOtiff = 95,
}) => {
    const otiffExportRef = useRef(null);

    const otiffData = useMemo(() => {
        const rowsOtiff = (comparativoFiltrado ?? []).filter(
            (r) => !r.rechazado && !r.rechazadoCliente
        );

        const totalBaseOtiff = rowsOtiff.length;
        const tol = safeNumber(tolerancia);

        const llegadaCumpleRaw = sumByName(
            pieCumpleVsNoCumpleHoraProgramada,
            (name) => name.startsWith("cumple")
        );

        const llegadaCumple = Math.min(llegadaCumpleRaw, totalBaseOtiff);
        const llegadaTotal = totalBaseOtiff;
        const llegadaNoCumple = Math.max(llegadaTotal - llegadaCumple, 0);
        const pctLlegada = calcPct(llegadaCumple, llegadaTotal);

        const fechaCumple = rowsOtiff.filter(
            (r) => r.cumplioFechaEntrega === true
        ).length;

        const fechaTotal = totalBaseOtiff;
        const fechaNoCumple = Math.max(fechaTotal - fechaCumple, 0);
        const pctFechaEntrega = calcPct(fechaCumple, fechaTotal);

        const mermaClienteCumple = rowsOtiff.filter((r) => {
            const cantidadFacturada = safeNumber(r.cantidadProgramada);
            const volumenRecibidoCliente = safeNumber(r.volumenRecibidoCliente);

            if (cantidadFacturada <= 0 || volumenRecibidoCliente <= 0) return false;

            const diferenciaClientFact = safeNumber(
                r.diffCliente_Facturado ?? volumenRecibidoCliente - cantidadFacturada
            );

            return Math.abs(diferenciaClientFact) <= cantidadFacturada * tol;
        }).length;

        const mermaClienteTotal = totalBaseOtiff;
        const mermaClienteNoCumple = Math.max(
            mermaClienteTotal - mermaClienteCumple,
            0
        );
        const pctMermaCliente = calcPct(mermaClienteCumple, mermaClienteTotal);

        const indicadores = [
            {
                key: "llegadaAmbiocom",
                title: "Llegada Ambiocom",
                subtitle:
                    "Evalúa si el vehículo llegó a Ambiocom dentro de la ventana de tolerancia definida.",
                regla: "Hora llegada real vs hora programada",
                cumple: llegadaCumple,
                noCumple: llegadaNoCumple,
                total: llegadaTotal,
                pct: pctLlegada,
                meta: 95,
                icon: <ScheduleIcon fontSize="small" />,
            },
            {
                key: "fechaEntrega",
                title: "Fecha entrega",
                subtitle:
                    "Evalúa si la entrega al cliente cumplió frente a la fecha estimada de entrega.",
                regla: "Fecha estimada de entrega vs fecha real de entrega",
                cumple: fechaCumple,
                noCumple: fechaNoCumple,
                total: fechaTotal,
                pct: pctFechaEntrega,
                meta: 95,
                icon: <LocalShippingIcon fontSize="small" />,
            },
            {
                key: "mermaCliente",
                title: "Merma cliente",
                subtitle:
                    "Evalúa cuánto recibió el cliente frente al volumen facturado.",
                regla: `Diff Facturado - R.Cliente vs ±${(tol * 100).toFixed(
                    2
                )}% del volumen facturado`,
                cumple: mermaClienteCumple,
                noCumple: mermaClienteNoCumple,
                total: mermaClienteTotal,
                pct: pctMermaCliente,
                meta: 95,
                icon: <WaterDropIcon fontSize="small" />,
            },
        ];

        const indicadoresEvaluables = indicadores.filter((item) => item.total > 0);

        const otiffGeneral = indicadoresEvaluables.length
            ? indicadoresEvaluables.reduce((acc, item) => acc + item.pct, 0) /
            indicadoresEvaluables.length
            : 0;

        const brechaOtiff = Math.max(100 - otiffGeneral, 0);

        return {
            indicadores,
            indicadoresEvaluables,
            otiffGeneral,
            brechaOtiff,
            totalRegistrosBase: totalBaseOtiff,
            pieGeneral: [
                {
                    name: "Cumplimiento OTIFF",
                    value: Number(otiffGeneral.toFixed(2)),
                    color: COLORS.ok,
                },
                {
                    name: "Brecha OTIFF",
                    value: Number(brechaOtiff.toFixed(2)),
                    color: COLORS.bad,
                },
            ].filter((x) => x.value > 0),
            barras: indicadores.map((item) => ({
                indicador: item.title,
                Cumple: Number(item.pct.toFixed(2)),
                Brecha: Number(Math.max(100 - item.pct, 0).toFixed(2)),
            })),
        };
    }, [
        comparativoFiltrado,
        tolerancia,
        pieCumpleVsNoCumpleHoraProgramada,
        pieCumplimientoFechaEntrega,
    ]);

    const otiffColor = getOtiffColor(otiffData.otiffGeneral);
    const otiffStatus = getStatus(otiffData.otiffGeneral, metaOtiff);

    return (
        <Grid item xs={12}>
            <CollapsibleSection
                title="OTIFF general logístico"
                subtitle="OTIFF calculado con la misma base de datos para llegada Ambiocom, fecha entrega y merma cliente."
                chipLabel={`OTIFF ${formatNumber1D(otiffData.otiffGeneral)}%`}
                defaultOpen={false}
                paperSx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 4,
                    border: "1px solid rgba(148, 163, 184, 0.30)",
                    background: sectionGradient,
                    boxShadow: "0 18px 46px rgba(15, 23, 42, 0.075)",
                    overflow: "visible",
                }}
            >
                <Box
                    ref={otiffExportRef}
                    sx={{
                        p: { xs: 0.25, md: 0.75 },
                        borderRadius: 4,
                        background: "transparent",
                        overflow: "visible",
                    }}
                >
                    <Stack spacing={1.75}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 1.5, md: 2 },
                                borderRadius: 3,
                                border: "1px solid rgba(226,232,240,0.95)",
                                background: COLORS.whiteGlass,
                                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                                position: "relative",
                                overflow: "hidden",
                                "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background:
                                        "linear-gradient(90deg, #4f46e5 0%, #16a34a 55%, #f59e0b 100%)",
                                },
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                                spacing={1.5}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        useFlexGap
                                        flexWrap="wrap"
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 950,
                                                color: COLORS.slate,
                                                letterSpacing: -0.35,
                                            }}
                                        >
                                            Resultado consolidado del OTIFF
                                        </Typography>

                                        <Chip
                                            size="small"
                                            label={`Rango: ${getRangeLabel(range)}`}
                                            sx={metricChipSx(COLORS.softBlue, COLORS.primaryDark)}
                                        />

                                        <Chip
                                            size="small"
                                            label={`Base evaluada: ${formatNumber(
                                                otiffData.totalRegistrosBase
                                            )}`}
                                            sx={metricChipSx(COLORS.softGreen, "#14532d")}
                                        />

                                        <Chip
                                            size="small"
                                            label={`Tolerancia: ±${(
                                                safeNumber(tolerancia) * 100
                                            ).toFixed(2)}%`}
                                            sx={metricChipSx(COLORS.softYellow, "#713f12")}
                                        />
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 0.75,
                                            color: COLORS.subtleText,
                                            maxWidth: 860,
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        Lectura ejecutiva del cumplimiento logístico: llegada a Ambiocom,
                                        fecha de entrega y merma cliente sobre la misma base evaluada.
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    useFlexGap
                                    flexWrap="wrap"
                                    sx={{ flexShrink: 0 }}
                                >
                                    <OtiffExportActions
                                        targetRef={otiffExportRef}
                                        range={range}
                                        filePrefix="Analisis_OTIFF_Ambiocom"
                                    />

                                    <Tooltip title="Ver metodología">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                                Swal.fire({
                                                    icon: "info",
                                                    title: "Metodología OTIFF general",
                                                    html: DOMPurify.sanitize(`
                                                        <div style="text-align:left; line-height:1.7">
                                                          <b>Base OTIFF:</b> registros filtrados, sin rechazados Ambiocom ni rechazados cliente.<br/><br/>
                                                          <b>Rango evaluado:</b> ${getRangeLabel(range)}<br/>
                                                          <b>Base evaluada:</b> ${formatNumber(
                                                              otiffData.totalRegistrosBase
                                                          )} registros<br/><br/>
                                                          <b>Indicadores:</b>
                                                          <ul style="padding-left:18px">
                                                            <li><b>Llegada Ambiocom:</b> cumplidos / base OTIFF.</li>
                                                            <li><b>Fecha entrega:</b> cumplidos / base OTIFF.</li>
                                                            <li><b>Merma cliente:</b> Diff Facturado - R.Cliente dentro de tolerancia / base OTIFF.</li>
                                                          </ul>
                                                          <b>Fórmula:</b><br/>
                                                          OTIFF = (Llegada Ambiocom % + Fecha Entrega % + Merma Cliente %) / 3
                                                        </div>
                                                    `),
                                                    width: 720,
                                                    confirmButtonText: "Entendido",
                                                    confirmButtonColor: COLORS.primary,
                                                });
                                            }}
                                            sx={{
                                                border: "1px solid rgba(203,213,225,0.95)",
                                                backgroundColor: "rgba(255,255,255,0.96)",
                                                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                                                "&:hover": {
                                                    backgroundColor: COLORS.softBlue,
                                                },
                                            }}
                                        >
                                            <InfoOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Paper>

                        <Grid container spacing={1.5} alignItems="stretch">
                            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        ...cardSx,
                                        width: "100%",
                                        background:
                                            "radial-gradient(circle at top right, rgba(79,70,229,0.14), transparent 38%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                                    }}
                                >
                                    <Stack spacing={1.45}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            spacing={1}
                                        >
                                            <Typography
                                                variant="overline"
                                                sx={{
                                                    color: COLORS.subtleText,
                                                    fontWeight: 950,
                                                    letterSpacing: 1.1,
                                                }}
                                            >
                                                OTIFF GENERAL
                                            </Typography>

                                            <Chip
                                                size="small"
                                                color={otiffStatus.color}
                                                icon={otiffStatus.icon}
                                                label={otiffStatus.label}
                                                sx={{
                                                    fontWeight: 900,
                                                    borderRadius: 999,
                                                    boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                                                }}
                                            />
                                        </Stack>

                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: 44, md: 54 },
                                                    lineHeight: 0.96,
                                                    fontWeight: 950,
                                                    color: otiffColor,
                                                    letterSpacing: -2,
                                                }}
                                            >
                                                {formatNumber1D(otiffData.otiffGeneral)}%
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ mt: 0.75, color: COLORS.subtleText }}
                                            >
                                                Meta general: <strong>{formatNumber1D(metaOtiff)}%</strong>
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(Math.max(otiffData.otiffGeneral, 0), 100)}
                                                sx={{
                                                    height: 12,
                                                    borderRadius: 99,
                                                    backgroundColor: COLORS.muted,
                                                    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08)",
                                                    "& .MuiLinearProgress-bar": {
                                                        borderRadius: 99,
                                                        backgroundColor: otiffColor,
                                                    },
                                                }}
                                            />

                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                sx={{ mt: 0.5 }}
                                            >
                                                <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                                    0%
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                                    100%
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            <Chip
                                                size="small"
                                                label={`Registros base: ${formatNumber(
                                                    otiffData.totalRegistrosBase
                                                )}`}
                                                sx={metricChipSx(COLORS.softBlue, COLORS.primaryDark)}
                                            />

                                            <Chip
                                                size="small"
                                                label={`Brecha: ${formatNumber1D(
                                                    otiffData.brechaOtiff
                                                )}%`}
                                                sx={metricChipSx(COLORS.softRed, "#7f1d1d")}
                                            />

                                            <Chip
                                                size="small"
                                                label={`Indicadores: ${otiffData.indicadoresEvaluables.length}/3`}
                                                sx={metricChipSx(COLORS.softGreen, "#14532d")}
                                            />
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                                <Paper elevation={0} sx={{ ...cardSx, width: "100%" }}>
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 950, color: COLORS.slate }}
                                        >
                                            Cumplimiento OTIFF vs brecha
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                            Distribución del resultado consolidado
                                        </Typography>
                                    </Box>

                                    <Box sx={chartBoxSx}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={otiffData.pieGeneral}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={58}
                                                    outerRadius={86}
                                                    paddingAngle={2}
                                                    cornerRadius={7}
                                                    labelLine={false}
                                                    label={({ value }) => `${formatNumber1D(value)}%`}
                                                >
                                                    {otiffData.pieGeneral.map((entry, idx) => (
                                                        <Cell key={`otiff-pie-${idx}`} fill={entry.color} />
                                                    ))}
                                                </Pie>

                                                <RTooltip
                                                    formatter={(value) => `${formatNumber1D(value)}%`}
                                                />

                                                <Legend
                                                    iconType="circle"
                                                    verticalAlign="bottom"
                                                    wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4} sx={{ display: "flex" }}>
                                <Paper elevation={0} sx={{ ...cardSx, width: "100%" }}>
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 950, color: COLORS.slate }}
                                        >
                                            Cumplimiento por indicador
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                            Cumple vs brecha por cada variable
                                        </Typography>
                                    </Box>

                                    <Box sx={chartBoxSx}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={otiffData.barras}
                                                layout="vertical"
                                                margin={{ top: 10, right: 12, left: 28, bottom: 8 }}
                                                barCategoryGap={14}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="rgba(148,163,184,0.42)"
                                                    horizontal={false}
                                                />

                                                <XAxis
                                                    type="number"
                                                    domain={[0, 100]}
                                                    tickFormatter={(v) => `${v}%`}
                                                    tick={{ fontSize: 11, fill: COLORS.subtleText }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <YAxis
                                                    type="category"
                                                    dataKey="indicador"
                                                    width={104}
                                                    tick={{ fontSize: 11, fill: COLORS.text, fontWeight: 700 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <RTooltip
                                                    formatter={(value) => `${formatNumber1D(value)}%`}
                                                />

                                                <Legend
                                                    iconType="circle"
                                                    wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                                                />

                                                <Bar
                                                    dataKey="Cumple"
                                                    stackId="a"
                                                    fill={COLORS.ok}
                                                    radius={[10, 0, 0, 10]}
                                                    barSize={17}
                                                />

                                                <Bar
                                                    dataKey="Brecha"
                                                    stackId="a"
                                                    fill={COLORS.muted}
                                                    radius={[0, 10, 10, 0]}
                                                    barSize={17}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            {otiffData.indicadores.map((item) => {
                                const status = getStatus(item.pct, item.meta);
                                const itemColor = getOtiffColor(item.pct);

                                return (
                                    <Grid
                                        item
                                        xs={12}
                                        md={4}
                                        key={item.key}
                                        sx={{ display: "flex" }}
                                    >
                                        <Paper elevation={0} sx={miniCardSx}>
                                            <Stack spacing={1.15} sx={{ pl: 0.35 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1.25}
                                                    alignItems="flex-start"
                                                    justifyContent="space-between"
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        sx={{ minWidth: 0 }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: "12px",
                                                                backgroundColor: COLORS.softBlue,
                                                                color: COLORS.primary,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                                boxShadow:
                                                                    "inset 0 0 0 1px rgba(79,70,229,0.10)",
                                                            }}
                                                        >
                                                            {item.icon}
                                                        </Box>

                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 950,
                                                                    lineHeight: 1.15,
                                                                    color: COLORS.slate,
                                                                }}
                                                            >
                                                                {item.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ color: COLORS.subtleText }}
                                                            >
                                                                Meta {formatNumber1D(item.meta)}%
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Chip
                                                        size="small"
                                                        color={status.color}
                                                        label={status.label}
                                                        sx={{
                                                            fontWeight: 900,
                                                            borderRadius: 999,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                </Stack>

                                                <Stack direction="row" alignItems="baseline" spacing={0.75}>
                                                    <Typography
                                                        variant="h4"
                                                        sx={{
                                                            fontWeight: 950,
                                                            color: itemColor,
                                                            letterSpacing: -0.8,
                                                        }}
                                                    >
                                                        {formatNumber1D(item.pct)}%
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                                        cumplimiento
                                                    </Typography>
                                                </Stack>

                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min(Math.max(item.pct, 0), 100)}
                                                    sx={{
                                                        height: 9,
                                                        borderRadius: 99,
                                                        backgroundColor: COLORS.muted,
                                                        "& .MuiLinearProgress-bar": {
                                                            borderRadius: 99,
                                                            backgroundColor: itemColor,
                                                        },
                                                    }}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: COLORS.subtleText,
                                                        lineHeight: 1.45,
                                                    }}
                                                    display="block"
                                                >
                                                    {item.subtitle}
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: 1,
                                                        pt: 1,
                                                        borderTop: "1px dashed rgba(148,163,184,0.45)",
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ color: COLORS.subtleText }}>
                                                        Cumplen
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ fontWeight: 950, color: COLORS.slate }}
                                                    >
                                                        {formatNumber(item.cumple)} / {formatNumber(item.total)} registros
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                mt: 1,
                                borderRadius: 3,
                                border: "1px solid rgba(203,213,225,0.92)",
                                backgroundColor: "rgba(255,255,255,0.94)",
                                overflow: "hidden",
                                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx}>Indicador</TableCell>
                                        <TableCell sx={tableHeadCellSx}>Regla</TableCell>
                                        <TableCell align="right" sx={tableHeadCellSx}>
                                            Cumple
                                        </TableCell>
                                        <TableCell align="right" sx={tableHeadCellSx}>
                                            No cumple / Castiga
                                        </TableCell>
                                        <TableCell align="right" sx={tableHeadCellSx}>
                                            Total evaluado
                                        </TableCell>
                                        <TableCell align="right" sx={tableHeadCellSx}>
                                            %
                                        </TableCell>
                                        <TableCell align="center" sx={tableHeadCellSx}>
                                            Estado
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {otiffData.indicadores.map((item, index) => {
                                        const status = getStatus(item.pct, item.meta);

                                        return (
                                            <TableRow
                                                key={`table-${item.key}`}
                                                hover
                                                sx={{
                                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                                    "&:hover": {
                                                        backgroundColor: "#eef2ff !important",
                                                    },
                                                    "& td": {
                                                        borderBottom: "1px solid rgba(226,232,240,0.95)",
                                                        py: 1.25,
                                                    },
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 900, color: COLORS.slate }}>
                                                    {item.title}
                                                </TableCell>

                                                <TableCell sx={{ color: COLORS.text, maxWidth: 360 }}>
                                                    {item.regla}
                                                </TableCell>

                                                <TableCell align="right" sx={{ fontWeight: 800 }}>
                                                    {formatNumber(item.cumple)}
                                                </TableCell>

                                                <TableCell align="right" sx={{ fontWeight: 800 }}>
                                                    {formatNumber(item.noCumple)}
                                                </TableCell>

                                                <TableCell align="right" sx={{ fontWeight: 800 }}>
                                                    {formatNumber(item.total)}
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 950,
                                                        color: getOtiffColor(item.pct),
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {formatNumber1D(item.pct)}%
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Box component="span" sx={statusPillSx(status.label)}>
                                                        {status.label}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Stack>
                </Box>
            </CollapsibleSection>
        </Grid>
    );
};

export default OtiffGeneralCollapsible;