import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Badge,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    ListSubheader,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import CalculateIcon from "@mui/icons-material/Calculate";
import HistoryIcon from "@mui/icons-material/History";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SaveAltOutlinedIcon from "@mui/icons-material/SaveAltOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import {
    RECIP,
    COM,
    ESTADOS_DB,
    ESTADO_ORDER,
    TIPO_LBL,
    TIPO_SHORT,
    DEFAULT_FORM,
} from "./utils/archivodb";
import { obtenerDestinosColombia, } from "./utils/DestinosNacionalesDB"
import { obtenerAlcoholesDespacho } from "./utils/AlcoholesDespachoDB";

import TrmColombiaCard from "./utils/components/TRMcolombiaComponent";

const COLORS = {
    brandBlue: "#1F1AE8",
    brandBlueDark: "#1812B8",
    brandBlueLight: "#E8E7FE",
    brandGreen: "#1EE03A",
    brandGreenDark: "#13B82C",
    brandGreenLight: "#E5FBE9",
    page: "#F5F7FB",
    card: "#FFFFFF",
    soft: "#F1F3F8",
    softer: "#FAFBFD",
    text: "#0A0E27",
    secondary: "#5A6378",
    tertiary: "#9099AD",
    border: "#E5E8F0",
    borderSoft: "#EEF0F6",
    success: "#13B82C",
    successBg: "#E5FBE9",
    warning: "#D97706",
    warningBg: "#FEF3C7",
    danger: "#DC2626",
    dangerBg: "#FEE2E2",
    infoBg: "#E8E7FE",
};

const RAW_API_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://ambiocomserver.onrender.com";

const API_URL = RAW_API_URL.replace(/\/$/, "");

const RUTAS_FLETES_ENDPOINT = "/api/rutas-fletes-ambiocom";
const COTIZACIONES_ENDPOINT = "/api/cotizaciones-alcoholes";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});


const ESTADO_ICONS = {
    send: SendOutlinedIcon,
    forum: ForumOutlinedIcon,
    award: EmojiEventsOutlinedIcon,
    cancel: CancelOutlinedIcon,
};

const ESTADOS = Object.fromEntries(
    Object.entries(ESTADOS_DB).map(([key, value]) => [
        key,
        {
            ...value,
            Icon: ESTADO_ICONS[value.iconKey],
        },
    ])
);

const appShellSx = {
    width: { xs: "100%", md: "95vw" },
    maxWidth: "1880px",
    mx: "auto",
    px: { xs: 2, md: 0 },
    boxSizing: "border-box",
};

const cotizarGridSx = {
    display: "grid",
    gridTemplateColumns: {
        xs: "1fr",
        xl: "minmax(0, 1fr) 460px",
    },
    gap: { xs: 2, md: 2.75 },
    alignItems: "stretch",
};

const panelSx = {
    bgcolor: "rgba(255,255,255,.96)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 14px 36px rgba(10,14,39,.055)",
    backdropFilter: "blur(10px)",
    transition: "box-shadow .18s ease, transform .18s ease, border-color .18s ease",
    "&:hover": {
        boxShadow: "0 18px 46px rgba(10,14,39,.085)",
        borderColor: "rgba(31,26,232,.22)",
    },
};

const getMargenObjetivo = ({ sector, volMensual, producto }) => {
    const volumen = Number(volMensual) || 0;
    const prod = normalizeText(producto);

    let margen = sector === "licores" ? 0.1 : 0.13;

    if (sector === "licores") {
        if (volumen >= 200000) margen = 0.06;
        else if (volumen >= 120000) margen = 0.075;
        else if (volumen >= 80000) margen = 0.085;
        else if (volumen >= 40000) margen = 0.1;
        else margen = 0.12;
    } else {
        if (volumen >= 200000) margen = 0.08;
        else if (volumen >= 120000) margen = 0.095;
        else if (volumen >= 80000) margen = 0.11;
        else if (volumen >= 40000) margen = 0.13;
        else margen = 0.16;
    }

    if (
        prod.includes("EXTRA") ||
        prod.includes("ANHIDRO") ||
        prod.includes("MAIZ") ||
        prod.includes("CANA") ||
        prod.includes("VODKA") ||
        prod.includes("GINEBRA")
    ) {
        margen += 0.015;
    }

    return Math.min(Math.max(margen, 0.04), 0.22);
};

const calcularPrecioSugeridoRealista = ({
    peCOP,
    trm,
    fleteCOP,
    volumen,
    recipienteUSD = 0,
    otrosCostosUSD = 0,
    margenObjetivo = 0.1,
}) => {
    const pe = toNumberSafe(peCOP) || 0;
    const tasa = toNumberSafe(trm) || 0;
    const flete = toNumberSafe(fleteCOP) || 0;
    const litros = toNumberSafe(volumen) || 0;
    const margen = Number(margenObjetivo) || 0;

    const peUSD = pe > 0 && tasa > 0 ? pe / tasa : 0;
    const fleteUSD = flete > 0 && tasa > 0 && litros > 0 ? flete / tasa / litros : 0;
    const costoTotalUSD = peUSD + fleteUSD + recipienteUSD + otrosCostosUSD;
    const precioSugerido =
        costoTotalUSD > 0 && margen > 0 && margen < 1
            ? costoTotalUSD / (1 - margen)
            : null;

    return {
        precioSugerido,
        costoTotalUSD,
        peUSD,
        fleteUSD,
        recipienteUSD,
        otrosCostosUSD,
        margenObjetivo: margen,
        utilidadUSD: precioSugerido != null ? precioSugerido - costoTotalUSD : null,
    };
};

const f3 = (n) =>
    n != null && !Number.isNaN(n) ? Number(n).toFixed(3) : "N/D";

const f4 = (n) =>
    n != null && !Number.isNaN(n) ? Number(n).toFixed(4) : "N/D";

const fCOP = (n) =>
    n != null && !Number.isNaN(n)
        ? `$${Math.round(n).toLocaleString("es-CO")}`
        : "N/D";

const cityLabel = (value) => String(value || "").replaceAll("_", " ");

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replaceAll("_", " ")
        .replace(/\s+/g, " ");

const toNumberSafe = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;

    const raw = String(value).trim();

    if (!raw || raw === "-" || raw === "–" || raw === "—") return null;

    let clean = raw
        .replace(/\$/g, "")
        .replace(/COP/gi, "")
        .replace(/\s/g, "");

    const commaCount = (clean.match(/,/g) || []).length;
    const dotCount = (clean.match(/\./g) || []).length;

    if (commaCount > 0 && dotCount > 0) {
        if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
            clean = clean.replace(/\./g, "").replace(",", ".");
        } else {
            clean = clean.replace(/,/g, "");
        }
    } else if (commaCount > 0) {
        const decimals = clean.split(",").at(-1);
        clean =
            decimals?.length === 3
                ? clean.replace(/,/g, "")
                : clean.replace(",", ".");
    } else if (dotCount > 0) {
        const decimals = clean.split(".").at(-1);
        clean = decimals?.length === 3 ? clean.replace(/\./g, "") : clean;
    }

    const parsed = Number(clean);

    return Number.isFinite(parsed) ? parsed : null;
};

const inferTipoDespacho = (row) => {
    const cantidad = toNumberSafe(row?.cantidadLitros);
    const texto = normalizeText(
        `${row?.tipoVehiculo || ""} ${row?.especificacion || ""}`
    );

    if (texto.includes("FURGON") || texto.includes("SECO")) return "seco";
    if (cantidad >= 35000) return "ct40";
    if (cantidad >= 18000) return "ct20";
    if (cantidad > 0) return "ct10";

    return "ct10";
};

const getRutaKey = (row, index = 0) =>
    String(
        row?._id ||
        row?.id ||
        `${normalizeText(row?.ciudadOrigen)}-${normalizeText(row?.ciudadDestino)}-${toNumberSafe(row?.cantidadLitros) || 0}-${index}`
    );

const calcularFletePromedioMatriz = (row) => {
    const fletePromedio = toNumberSafe(row?.fletePromedio);

    if (fletePromedio !== null) return fletePromedio;

    const fletesValidos = Array.isArray(row?.fletes)
        ? row.fletes.map(toNumberSafe).filter((value) => value !== null)
        : [];

    if (!fletesValidos.length) return null;

    return (
        fletesValidos.reduce((acc, value) => acc + value, 0) /
        fletesValidos.length
    );
};

const matchOrigen = (origenCotizador, ciudadOrigenMatriz) => {
    const origen = normalizeText(origenCotizador);
    const ciudadOrigen = normalizeText(ciudadOrigenMatriz);

    if (!ciudadOrigen) return true;

    if (origen === "BUN") {
        return ciudadOrigen.includes("BUENAVENTURA");
    }

    if (origen === "AMB") {
        return (
            ciudadOrigen.includes("AMBIOCOM") ||
            ciudadOrigen.includes("PALMIRA") ||
            ciudadOrigen.includes("PALMASECA") ||
            !ciudadOrigen.includes("BUENAVENTURA")
        );
    }

    return true;
};

const getRutaLabel = (row) => {
    const cantidad = toNumberSafe(row?.cantidadLitros);
    const tipoVehiculo = String(row?.tipoVehiculo || "").trim();
    const especificacion = String(row?.especificacion || "").trim();
    const flete = calcularFletePromedioMatriz(row);

    const partes = [
        cantidad ? `${cantidad.toLocaleString("es-CO")} L` : "",
        tipoVehiculo,
        especificacion,
        flete ? `Flete ${fCOP(flete)}` : "",
    ].filter(Boolean);

    return partes.join(" · ");
};

const buscarMejorRutaFlete = ({ rows = [], origen, ciudad, volumen }) => {
    const ciudadBuscada = normalizeText(cityLabel(ciudad));
    const volumenPedido = toNumberSafe(volumen) || 0;

    if (!ciudadBuscada) return null;

    const candidatas = rows
        .map((row, index) => {
            const ciudadDestino = normalizeText(row?.ciudadDestino);
            const cantidadLitros = toNumberSafe(row?.cantidadLitros);
            const fletePromedio = calcularFletePromedioMatriz(row);

            return {
                row,
                index,
                key: getRutaKey(row, index),
                ciudadDestino,
                cantidadLitros,
                fletePromedio,
            };
        })
        .filter((item) => {
            if (!item.fletePromedio) return false;
            if (!item.ciudadDestino) return false;

            const destinoMatch =
                item.ciudadDestino === ciudadBuscada ||
                item.ciudadDestino.includes(ciudadBuscada) ||
                ciudadBuscada.includes(item.ciudadDestino);

            if (!destinoMatch) return false;

            return matchOrigen(origen, item.row?.ciudadOrigen);
        });

    if (!candidatas.length) return null;

    const ordenadas = [...candidatas].sort((a, b) => {
        const aLitros = a.cantidadLitros || 0;
        const bLitros = b.cantidadLitros || 0;

        const aPrioridad = aLitros >= volumenPedido ? 0 : 1;
        const bPrioridad = bLitros >= volumenPedido ? 0 : 1;

        if (aPrioridad !== bPrioridad) return aPrioridad - bPrioridad;

        return (
            Math.abs(aLitros - volumenPedido) -
            Math.abs(bLitros - volumenPedido)
        );
    });

    return ordenadas[0];
};

const fDate = (ts) => {
    const d = new Date(ts);

    return `${d.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })} ${d.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

function Panel({ icon: Icon, title, children, sx, bodySx }) {
    return (
        <Paper
            elevation={0}
            sx={{
                ...panelSx,
                display: "flex",
                flexDirection: "column",
                ...sx,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.35}
                sx={{
                    px: { xs: 2, md: 2.6 },
                    py: 1.85,
                    borderBottom: `1px solid ${COLORS.borderSoft}`,
                    background:
                        "linear-gradient(180deg, rgba(250,251,253,.98) 0%, rgba(255,255,255,.94) 100%)",
                }}
            >
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: COLORS.brandBlueLight,
                        color: COLORS.brandBlue,
                        boxShadow: "inset 0 0 0 1px rgba(31,26,232,.08)",
                    }}
                >
                    <Icon sx={{ fontSize: 20 }} />
                </Box>

                <Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 950,
                            color: COLORS.text,
                            textTransform: "uppercase",
                            letterSpacing: ".07em",
                            lineHeight: 1.1,
                        }}
                    >
                        {title}
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: 11,
                            color: COLORS.tertiary,
                            fontWeight: 600,
                            mt: 0.25,
                        }}
                    >
                        Información de la cotización
                    </Typography>
                </Box>
            </Stack>

            <Box
                sx={{
                    p: { xs: 2, md: 2.6 },
                    flex: 1,
                    minHeight: 0,
                    ...bodySx,
                }}
            >
                {children}
            </Box>
        </Paper>
    );
}

function Metric({ label, value, tone }) {
    const color =
        tone === "pos"
            ? COLORS.success
            : tone === "neg"
                ? COLORS.danger
                : tone === "warn"
                    ? COLORS.warning
                    : tone === "info"
                        ? COLORS.brandBlue
                        : COLORS.text;

    return (
        <Box
            sx={{
                bgcolor: COLORS.softer,
                border: `1px solid ${COLORS.borderSoft}`,
                borderRadius: "14px",
                p: 1.6,
                minHeight: 76,
            }}
        >
            <Typography
                sx={{
                    fontSize: 10.5,
                    color: COLORS.secondary,
                    mb: 0.6,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".045em",
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    fontSize: 20,
                    fontWeight: 950,
                    letterSpacing: "-.035em",
                    color,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

function BrandLogo() {
    return (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "13px",
                    color: "#fff",
                    fontWeight: 950,
                    fontSize: 19,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${COLORS.brandBlue} 0%, ${COLORS.brandGreen} 100%)`,
                    boxShadow: "0 8px 20px rgba(31,26,232,.22)",
                }}
            >
                A
            </Box>

            <Box sx={{ lineHeight: 1.1 }}>
                <Typography sx={{ fontSize: 17, fontWeight: 950, letterSpacing: "-.035em" }}>
                    <Box component="span" sx={{ color: COLORS.brandBlue }}>
                        Am
                    </Box>
                    <Box component="span" sx={{ color: COLORS.brandGreenDark }}>
                        bio
                    </Box>
                    <Box component="span" sx={{ color: COLORS.brandBlue }}>
                        com
                    </Box>
                </Typography>

                <Typography sx={{ fontSize: 11, color: COLORS.secondary, fontWeight: 700 }}>
                    Cotizador comercial
                </Typography>
            </Box>
        </Stack>
    );
}

function NavButton({ active, icon: Icon, children, badge, onClick }) {
    return (
        <Button
            onClick={onClick}
            startIcon={<Icon sx={{ fontSize: 17 }} />}
            sx={{
                px: 2,
                py: 1,
                minHeight: 38,
                borderRadius: "9px",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 850,
                color: active ? COLORS.brandBlue : COLORS.secondary,
                bgcolor: active ? COLORS.card : "transparent",
                boxShadow: active ? "0 3px 10px rgba(10,14,39,.055)" : "none",
                whiteSpace: "nowrap",
                "&:hover": {
                    bgcolor: active ? COLORS.card : "rgba(10,14,39,.04)",
                },
            }}
        >
            {children}

            {badge != null && (
                <Box
                    component="span"
                    sx={{
                        ml: 0.75,
                        px: 0.75,
                        py: 0.1,
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 900,
                        color: "#fff",
                        bgcolor: COLORS.brandBlue,
                    }}
                >
                    {badge}
                </Box>
            )}
        </Button>
    );
}

function TextInput({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    helperText,
    InputProps,
}) {
    return (
        <TextField
            fullWidth
            size="small"
            type={type}
            label={label}
            value={value}
            placeholder={placeholder}
            helperText={helperText}
            onChange={(e) => onChange(e.target.value)}
            InputProps={InputProps}
            sx={{
                "& .MuiInputLabel-root": {
                    fontSize: 13,
                    color: COLORS.secondary,
                    fontWeight: 700,
                },
                "& .MuiOutlinedInput-root": {
                    borderRadius: "13px",
                    fontSize: 13,
                    bgcolor: COLORS.card,
                    minHeight: 42,
                    "& fieldset": {
                        borderColor: COLORS.border,
                    },
                    "&:hover fieldset": {
                        borderColor: "rgba(31,26,232,.35)",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: COLORS.brandBlue,
                    },
                },
                "& input[type=number]": {
                    MozAppearance: "textfield",
                },
                "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                {
                    WebkitAppearance: "none",
                    margin: 0,
                },
                "& .MuiFormHelperText-root": {
                    color: COLORS.tertiary,
                    fontSize: 11,
                    ml: 0.25,
                },
            }}
        />
    );
}

function SelectInput({ label, value, onChange, children }) {
    return (
        <FormControl
            fullWidth
            size="small"
            sx={{
                "& .MuiInputLabel-root": {
                    fontSize: 13,
                    color: COLORS.secondary,
                    fontWeight: 700,
                },
                "& .MuiOutlinedInput-root": {
                    borderRadius: "13px",
                    fontSize: 13,
                    bgcolor: COLORS.card,
                    minHeight: 42,
                    "& fieldset": {
                        borderColor: COLORS.border,
                    },
                    "&:hover fieldset": {
                        borderColor: "rgba(31,26,232,.35)",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: COLORS.brandBlue,
                    },
                },
            }}
        >
            <InputLabel>{label}</InputLabel>
            <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
                {children}
            </Select>
        </FormControl>
    );
}

function SectorChip({ sector }) {
    const lic = sector === "licores";

    return (
        <Chip
            size="small"
            label={lic ? "Licores" : "Otros"}
            sx={{
                ml: 0.75,
                height: 22,
                fontSize: 10,
                fontWeight: 900,
                textTransform: "uppercase",
                bgcolor: lic ? COLORS.infoBg : COLORS.brandGreenLight,
                color: lic ? COLORS.brandBlue : COLORS.brandGreenDark,
            }}
        />
    );
}

function CommercialChip({ comercial, short = false }) {
    const data = COM[comercial];

    if (!data) return null;

    return (
        <Chip
            size="small"
            icon={
                <FiberManualRecordIcon
                    sx={{
                        fontSize: "9px !important",
                        color: `${data.color} !important`,
                    }}
                />
            }
            label={short ? data.n.split(" ")[0] : data.n}
            sx={{
                height: 25,
                fontSize: 11,
                fontWeight: 900,
                bgcolor: data.bg,
                color: data.color,
                "& .MuiChip-label": { px: 0.75 },
            }}
        />
    );
}

function EstadoChip({ estado }) {
    const e = ESTADOS[estado] || ESTADOS.enviada;

    return (
        <Chip
            size="small"
            icon={
                <FiberManualRecordIcon
                    sx={{
                        fontSize: "9px !important",
                        color: `${e.color} !important`,
                    }}
                />
            }
            label={e.n}
            sx={{
                height: 25,
                fontSize: 11,
                fontWeight: 900,
                bgcolor: e.bg,
                color: e.color,
                "& .MuiChip-label": { px: 0.75 },
            }}
        />
    );
}

function Gauge({ margen }) {
    const pct = margen ?? 0;
    const total = 251.2;
    const clamped = Math.max(0, Math.min(pct, 0.3));
    const offset = total - total * (clamped / 0.3);
    const color =
        clamped >= 0.1
            ? COLORS.success
            : clamped >= 0.05
                ? COLORS.warning
                : COLORS.danger;

    return (
        <Stack alignItems="center" sx={{ px: 2.25, pt: 1.5, pb: 0.5 }}>
            <Box
                component="svg"
                viewBox="0 5 200 120"
                width="188"
                aria-label="Gauge de margen"
                role="img"
            >
                <path
                    d="M20,100 A80,80 0 0,1 180,100"
                    fill="none"
                    stroke={COLORS.borderSoft}
                    strokeWidth="16"
                    strokeLinecap="round"
                />

                <path
                    d="M20,100 A80,80 0 0,1 180,100"
                    fill="none"
                    stroke={color}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={offset.toFixed(1)}
                />

                <text
                    x="100"
                    y="88"
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="800"
                    fill={color}
                >
                    {margen != null ? `${(margen * 100).toFixed(1)}%` : "—"}
                </text>

                <text
                    x="18"
                    y="118"
                    textAnchor="middle"
                    fontSize="9"
                    fill={COLORS.tertiary}
                    fontWeight="600"
                >
                    0%
                </text>

                <text
                    x="182"
                    y="118"
                    textAnchor="middle"
                    fontSize="9"
                    fill={COLORS.tertiary}
                    fontWeight="600"
                >
                    30%
                </text>
            </Box>

            <Typography sx={{ fontSize: 11, color: COLORS.secondary, fontWeight: 700 }}>
                Margen sobre precio de venta
            </Typography>
        </Stack>
    );
}

function CostBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.min(100, (Number(value || 0) / max) * 100) : 0;

    return (
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.85 }}>
            <Typography
                sx={{
                    width: 92,
                    fontSize: 11,
                    color: COLORS.secondary,
                    fontWeight: 800,
                }}
            >
                {label}
            </Typography>

            <Box
                sx={{
                    flex: 1,
                    height: 10,
                    bgcolor: COLORS.soft,
                    borderRadius: "99px",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        height: "100%",
                        width: `${pct}%`,
                        bgcolor: color,
                        borderRadius: "99px",
                        transition: "width .3s ease",
                    }}
                />
            </Box>

            <Typography
                sx={{
                    width: 56,
                    fontSize: 11,
                    textAlign: "right",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                ${f3(value || 0)}
            </Typography>
        </Stack>
    );
}

function BreakdownRow({ label, value, total = false, children }) {
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{
                py: total ? 1.15 : 0.82,
                borderBottom: total ? "none" : `1px solid ${COLORS.borderSoft}`,
                borderTop: total ? `1px solid ${COLORS.border}` : "none",
                mt: total ? 0.5 : 0,
            }}
        >
            <Typography
                sx={{
                    fontSize: total ? 13 : 12,
                    color: total ? COLORS.text : COLORS.secondary,
                    fontWeight: total ? 900 : 600,
                }}
            >
                {label}
            </Typography>

            <Box
                sx={{
                    fontSize: total ? 14 : 12,
                    fontWeight: total ? 950 : 800,
                    color: total ? COLORS.brandBlue : COLORS.text,
                    textAlign: "right",
                }}
            >
                {children || value}
            </Box>
        </Stack>
    );
}

function SummaryCard({ label, value, accent, color }) {
    return (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: "18px",
                p: 2.1,
                bgcolor: COLORS.card,
                boxShadow: "0 10px 28px rgba(10,14,39,.045)",
                position: "relative",
                overflow: "hidden",
                "&:before": accent
                    ? {
                        content: '""',
                        position: "absolute",
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        right: -35,
                        top: -35,
                        background: COLORS.brandBlueLight,
                    }
                    : {},
            }}
        >
            <Typography
                sx={{
                    fontSize: 11,
                    color: COLORS.secondary,
                    textTransform: "uppercase",
                    letterSpacing: ".055em",
                    fontWeight: 900,
                    mb: 0.65,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    fontSize: 22,
                    fontWeight: 950,
                    letterSpacing: "-.035em",
                    color: color || (accent ? COLORS.brandBlue : COLORS.text),
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {value}
            </Typography>
        </Paper>
    );
}

function FilterButton({ active, children, onClick }) {
    return (
        <Button
            onClick={onClick}
            sx={{
                px: 1.55,
                py: 0.78,
                borderRadius: 99,
                border: `1px solid ${active ? COLORS.brandBlue : COLORS.border}`,
                bgcolor: active ? COLORS.brandBlue : COLORS.card,
                color: active ? "#fff" : COLORS.secondary,
                fontSize: 12,
                textTransform: "none",
                fontWeight: 900,
                whiteSpace: "nowrap",
                boxShadow: active ? "0 8px 16px rgba(31,26,232,.13)" : "none",
                "&:hover": {
                    bgcolor: active ? COLORS.brandBlueDark : COLORS.softer,
                },
            }}
        >
            {children}
        </Button>
    );
}

function EmptyState({ hasFilter }) {
    return (
        <Stack
            alignItems="center"
            sx={{
                py: 7.5,
                px: 2.5,
                color: COLORS.secondary,
                textAlign: "center",
            }}
        >
            <InboxOutlinedIcon sx={{ fontSize: 54, color: COLORS.tertiary, mb: 1.5 }} />

            <Typography sx={{ fontSize: 16, color: COLORS.text, mb: 0.75, fontWeight: 900 }}>
                Sin cotizaciones{hasFilter ? " para este filtro" : ""}
            </Typography>

            <Typography sx={{ fontSize: 13, maxWidth: 420 }}>
                Las cotizaciones que guardes aparecerán acá con todos sus datos para consulta y análisis.
            </Typography>
        </Stack>
    );
}

function DispatchMiniCard({ label, value }) {
    return (
        <Box
            sx={{
                p: 1.4,
                borderRadius: "14px",
                bgcolor: COLORS.card,
                border: `1px solid ${COLORS.borderSoft}`,
                minHeight: 76,
            }}
        >
            <Typography
                sx={{
                    fontSize: 10,
                    color: COLORS.tertiary,
                    fontWeight: 950,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    mb: 0.45,
                }}
            >
                {label}
            </Typography>

            <Typography sx={{ fontSize: 15, fontWeight: 950, color: COLORS.text }}>
                {value}
            </Typography>
        </Box>
    );
}

export default function CotizadorAmbiocom() {
    const [view, setView] = useState("cotizar");
    const [form, setForm] = useState(() => {
        const initialForm = { ...DEFAULT_FORM };
        return {
            ...initialForm,
            // La TRM ya no inicia con un valor quemado. Se llena cuando
            // TrmColombiaCard termina de consultar la TRM vigente.
            trm: "",
            peUSD: initialForm.peUSD ?? "",
        };
    });
    const [peInputMode, setPeInputMode] = useState("cop");
    const [autoMode, setAutoMode] = useState(true);
    const [historial, setHistorial] = useState([]);
    const [historialLoading, setHistorialLoading] = useState(false);
    const [savingCotizacion, setSavingCotizacion] = useState(false);
    const [currentFilter, setCurrentFilter] = useState("all");
    const [currentEstadoFilter, setCurrentEstadoFilter] = useState("all");
    const [currentSearch, setCurrentSearch] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [destinos, setDestinos] = useState([]);
    const [destinosLoading, setDestinosLoading] = useState(false);
    const [alcoholesDespacho, setAlcoholesDespacho] = useState([]);
    const [alcoholesLoading, setAlcoholesLoading] = useState(false);
    const [matrizFletes, setMatrizFletes] = useState([]);
    const [matrizFletesLoading, setMatrizFletesLoading] = useState(false);
    const [matrizFletesError, setMatrizFletesError] = useState("");
    const [toast, setToast] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        let mounted = true;

        const cargarDestinos = async () => {
            try {
                setDestinosLoading(true);

                const result = await obtenerDestinosColombia();

                if (!mounted) return;

                setDestinos(Array.isArray(result?.data) ? result.data : []);

                if (result?.warning) {
                    showToast(result.warning, "warning");
                }
            } catch (error) {
                if (!mounted) return;

                setDestinos([]);

                showToast(
                    error?.message || "No se pudieron cargar los destinos.",
                    "error"
                );
            } finally {
                if (mounted) {
                    setDestinosLoading(false);
                }
            }
        };

        cargarDestinos();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const cargarAlcoholesDespacho = async () => {
            try {
                setAlcoholesLoading(true);

                const result = await obtenerAlcoholesDespacho();

                if (!mounted) return;

                setAlcoholesDespacho(Array.isArray(result.data) ? result.data : []);

                if (result.warning) {
                    showToast(result.warning, "warning");
                }

            } catch (error) {
                if (!mounted) return;

                setAlcoholesDespacho([]);

                showToast(
                    error?.message || "No se pudieron cargar los alcoholes de despacho.",
                    "error"
                );
            } finally {
                if (mounted) {
                    setAlcoholesLoading(false);
                }
            }
        };

        cargarAlcoholesDespacho();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const cargarMatrizFletes = async () => {
            try {
                setMatrizFletesLoading(true);
                setMatrizFletesError("");

                const { data } = await api.get(RUTAS_FLETES_ENDPOINT);

                if (!mounted) return;

                const rows = Array.isArray(data?.data?.rows) ? data.data.rows : [];

                setMatrizFletes(rows);
            } catch (error) {
                if (!mounted) return;

                const message =
                    error?.response?.data?.message ||
                    error.message ||
                    "No se pudo cargar la matriz de fletes.";

                setMatrizFletes([]);
                setMatrizFletesError(message);
                showToast(message, "warning");
            } finally {
                if (mounted) {
                    setMatrizFletesLoading(false);
                }
            }
        };

        cargarMatrizFletes();

        return () => {
            mounted = false;
        };
    }, []);

    const HISTORIAL_CACHE_KEY = "cotizaciones-alcoholes-cache-v1";
    const HISTORIAL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    const normalizarCotizacion = (q = {}) => ({
        ...q,
        estado: q.estado || "enviada",
        fecha: q.fecha || q.createdAt || new Date().toISOString(),
    });

    const leerHistorialCache = () => {
        try {
            const raw = localStorage.getItem(HISTORIAL_CACHE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed?.data)) return null;

            return {
                data: parsed.data,
                savedAt: Number(parsed.savedAt) || 0,
            };
        } catch {
            return null;
        }
    };

    const guardarHistorialCache = (data) => {
        try {
            localStorage.setItem(
                HISTORIAL_CACHE_KEY,
                JSON.stringify({
                    savedAt: Date.now(),
                    data,
                })
            );
        } catch (error) {
            console.warn("No se pudo guardar caché de cotizaciones:", error);
        }
    };

    const actualizarHistorialLocal = (updater) => {
        setHistorial((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            guardarHistorialCache(next);
            return next;
        });
    };

    const cargarHistorial = async ({ force = false } = {}) => {
        const cache = leerHistorialCache();

        if (cache?.data?.length) {
            setHistorial(cache.data);
        }

        const cacheEstaVigente =
            cache?.savedAt && Date.now() - cache.savedAt < HISTORIAL_CACHE_TTL_MS;

        if (!force && cacheEstaVigente) {
            return;
        }

        try {
            setHistorialLoading(true);

            const { data } = await api.get(COTIZACIONES_ENDPOINT, {
                params: {
                    limit: 500,
                    activo: "true",
                },
            });

            const rows = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                    ? data
                    : [];

            const normalizedRows = rows.map(normalizarCotizacion);

            setHistorial(normalizedRows);
            guardarHistorialCache(normalizedRows);
        } catch (error) {
            console.error("Error cargando cotizaciones:", error);

            if (!cache?.data?.length) {
                setHistorial([]);
            }

            setToast({
                open: true,
                message:
                    error?.response?.data?.message ||
                    "No se pudo cargar el historial de cotizaciones.",
                severity: "error",
            });
        } finally {
            setHistorialLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const destinosMatrizOptions = useMemo(() => {
        const mapa = new Map();

        matrizFletes.forEach((row) => {
            const label = String(row?.ciudadDestino || "").trim();

            if (!label) return;

            const key = normalizeText(label);

            if (!mapa.has(key)) {
                mapa.set(key, {
                    value: label,
                    label,
                });
            }
        });

        return [...mapa.values()].sort((a, b) =>
            a.label.localeCompare(b.label)
        );
    }, [matrizFletes]);

    const destinosCotizador = useMemo(() => {
        return destinosMatrizOptions.length ? destinosMatrizOptions : destinos;
    }, [destinosMatrizOptions, destinos]);

    const opcionesDespachoMatriz = useMemo(() => {
        const ciudadBuscada = normalizeText(form.ciudad);

        if (!ciudadBuscada) return [];

        return matrizFletes
            .map((row, index) => {
                const ciudadDestino = normalizeText(row?.ciudadDestino);
                const fletePromedio = calcularFletePromedioMatriz(row);
                const cantidadLitros = toNumberSafe(row?.cantidadLitros);
                const tipoDespacho = inferTipoDespacho(row);
                const key = getRutaKey(row, index);

                return {
                    key,
                    value: key,
                    row,
                    ciudadDestino,
                    fletePromedio,
                    cantidadLitros,
                    tipoDespacho,
                    label: getRutaLabel(row),
                };
            })
            .filter((item) => {
                if (!item.fletePromedio) return false;
                if (!item.ciudadDestino) return false;

                const destinoMatch =
                    item.ciudadDestino === ciudadBuscada ||
                    item.ciudadDestino.includes(ciudadBuscada) ||
                    ciudadBuscada.includes(item.ciudadDestino);

                if (!destinoMatch) return false;

                return matchOrigen(form.origen, item.row?.ciudadOrigen);
            })
            .sort((a, b) => {
                const aLitros = a.cantidadLitros || 0;
                const bLitros = b.cantidadLitros || 0;

                return aLitros - bLitros;
            });
    }, [matrizFletes, form.ciudad, form.origen]);

    const rutaFleteSeleccionada = useMemo(() => {
        if (!form.rutaFleteId) return null;

        return (
            opcionesDespachoMatriz.find(
                (item) => item.value === form.rutaFleteId
            ) || null
        );
    }, [opcionesDespachoMatriz, form.rutaFleteId]);

    useEffect(() => {
        if (!form.ciudad) return;
        if (form.rutaFleteId) return;
        if (!opcionesDespachoMatriz.length) return;

        const first = opcionesDespachoMatriz[0];

        setForm((prev) => ({
            ...prev,
            rutaFleteId: first.value,
            tipoDespacho: first.tipoDespacho,
            volumen: first.cantidadLitros || prev.volumen || "",
        }));
    }, [form.ciudad, form.rutaFleteId, opcionesDespachoMatriz]);

    const result = useMemo(() => {
        const prod = form.producto;
        const sector = form.sector;
        const origen = form.origen;
        const ciudad = form.ciudad;
        const trm = Number.parseFloat(form.trm) || 0;
        const volMen = Number.parseFloat(form.volMensual) || 40000;

        const peCOPInput = toNumberSafe(form.pe);
        const peUSDInput = toNumberSafe(form.peUSD);

        let peCOP = 0;

        if (peInputMode === "usd" && peUSDInput != null && trm > 0) {
            peCOP = peUSDInput * trm;
        } else if (peCOPInput != null) {
            peCOP = peCOPInput;
        } else if (peUSDInput != null && trm > 0) {
            peCOP = peUSDInput * trm;
        }

        const rutaFromSelect = rutaFleteSeleccionada?.row || null;

        const rutaFromMatch =
            rutaFromSelect ||
            buscarMejorRutaFlete({
                rows: matrizFletes,
                origen,
                ciudad,
                volumen: form.volumen,
            })?.row ||
            null;

        const tipo = rutaFromMatch
            ? inferTipoDespacho(rutaFromMatch)
            : form.tipoDespacho || "ct10";

        const isSeco = tipo === "seco";

        const cantidadRuta = toNumberSafe(rutaFromMatch?.cantidadLitros);
        const volPed =
            Number.parseFloat(form.volumen) ||
            cantidadRuta ||
            (tipo === "ct40" ? 40000 : tipo === "ct20" ? 20000 : 10000);

        const fleteCOP = rutaFromMatch
            ? calcularFletePromedioMatriz(rutaFromMatch)
            : null;

        let volT = isSeco ? null : volPed;

        let recipUSD = 0;
        let recipDesc = "—";
        let recipData = null;

        if (isSeco) {
            const rec = form.recipiente;
            const amort = Math.max(1, Number.parseInt(form.amort, 10) || 6);
            const cant = Math.max(1, Number.parseInt(form.cantRecip, 10) || 1);
            const rd = RECIP[rec] || RECIP.garrafa;
            const litros = rd.cap * cant;

            volT = litros;
            recipUSD = trm > 0 ? (rd.cop * cant) / amort / trm / litros : 0;
            recipDesc = `${cant} × ${rd.n} | amort. ${amort}`;
            recipData = { tipo: rec, cant, amort };
        }

        const margenObjetivo = getMargenObjetivo({
            sector,
            volMensual: volMen,
            producto: prod,
        });

        const precioInfo = calcularPrecioSugeridoRealista({
            peCOP,
            trm,
            fleteCOP,
            volumen: volT,
            recipienteUSD: recipUSD,
            otrosCostosUSD: 0,
            margenObjetivo,
        });

        const sug = precioInfo.precioSugerido;
        const pe = precioInfo.peUSD;
        const fleteUSD = precioInfo.fleteUSD;
        const costoTotalUSD = precioInfo.costoTotalUSD;

        const manualPv = Number.parseFloat(form.pventa);

        const pv =
            !Number.isNaN(manualPv) && manualPv > 0
                ? manualPv
                : sug ?? (costoTotalUSD > 0 ? costoTotalUSD / 0.9 : 0);

        const util = costoTotalUSD > 0 ? pv - costoTotalUSD : null;
        const margen = util != null && pv > 0 ? util / pv : null;

        return {
            pv,
            pe,
            peCOP,
            util,
            margen,
            margenObjetivo,
            costoTotalUSD,
            otrosCostosUSD: precioInfo.otrosCostosUSD,
            precioSugerido: sug,
            fleteUSD,
            recipUSD,
            volT,
            recipData,
            fleteCOP,
            rutaFlete: rutaFromMatch,
            rutaFleteId: rutaFromMatch ? getRutaKey(rutaFromMatch) : "",
            sug,
            prod,
            sector,
            origen,
            ciudad,
            tipo,
            trm,
            volMen,
            volPed,
            recipDesc,
            isSeco,
        };
    }, [form, matrizFletes, rutaFleteSeleccionada, peInputMode]);

    const suggestedPrice = result.sug;

    useEffect(() => {
        if (!autoMode || suggestedPrice == null) return;

        const next = suggestedPrice.toFixed(3);

        setForm((prev) => (prev.pventa === next ? prev : { ...prev, pventa: next }));
    }, [autoMode, suggestedPrice]);

    const updatePuntoEquilibrioCOP = (value) => {
        setPeInputMode("cop");

        setForm((prev) => {
            const trmActual = toNumberSafe(prev.trm) || 0;
            const peCOP = toNumberSafe(value);

            return {
                ...prev,
                pe: value,
                peUSD:
                    peCOP != null && trmActual > 0
                        ? (peCOP / trmActual).toFixed(4)
                        : "",
            };
        });
    };

    const updatePuntoEquilibrioUSD = (value) => {
        setPeInputMode("usd");

        setForm((prev) => {
            const trmActual = toNumberSafe(prev.trm) || 0;
            const peUSD = toNumberSafe(value);

            return {
                ...prev,
                peUSD: value,
                pe:
                    peUSD != null && trmActual > 0
                        ? (peUSD * trmActual).toFixed(2)
                        : "",
            };
        });
    };

    const update = (key, value) => {
        setForm((prev) => {
            if (key === "origen") {
                return {
                    ...prev,
                    origen: value,
                    ciudad: "",
                    rutaFleteId: "",
                    tipoDespacho: "",
                    volumen: "",
                };
            }

            if (key === "ciudad") {
                return {
                    ...prev,
                    ciudad: value,
                    rutaFleteId: "",
                    tipoDespacho: "",
                    volumen: "",
                };
            }

            if (key === "trm") {
                const nuevaTrm = toNumberSafe(value) || 0;
                const peCOP = toNumberSafe(prev.pe);
                const peUSD = toNumberSafe(prev.peUSD);

                if (peInputMode === "usd") {
                    return {
                        ...prev,
                        trm: value,
                        pe:
                            peUSD != null && nuevaTrm > 0
                                ? (peUSD * nuevaTrm).toFixed(2)
                                : "",
                    };
                }

                return {
                    ...prev,
                    trm: value,
                    peUSD:
                        peCOP != null && nuevaTrm > 0
                            ? (peCOP / nuevaTrm).toFixed(4)
                            : "",
                };
            }

            return {
                ...prev,
                [key]: value,
            };
        });
    };

    const updateRutaFlete = (rutaFleteId) => {
        const selected = opcionesDespachoMatriz.find(
            (item) => item.value === rutaFleteId
        );

        setForm((prev) => ({
            ...prev,
            rutaFleteId,
            tipoDespacho: selected?.tipoDespacho || prev.tipoDespacho,
            volumen: selected?.cantidadLitros || prev.volumen,
        }));
    };

    const showToast = (message, severity = "success") => {
        setToast({
            open: true,
            message,
            severity,
        });
    };

    const resetPV = () => {
        setAutoMode(true);
        setForm((prev) => ({ ...prev, pventa: "" }));
    };

    const usarTrmLive = (valorTrm, { silent = false } = {}) => {
        const trmConsultada = toNumberSafe(valorTrm);

        if (trmConsultada == null || trmConsultada <= 0) {
            if (!silent) {
                showToast("No hay TRM disponible para aplicar", "error");
            }
            return;
        }

        const trmActualizada = Math.round(trmConsultada);

        update("trm", trmActualizada);

        if (!silent) {
            showToast(`TRM actualizada aplicada: ${fCOP(trmActualizada)}`);
        }
    };

    const cargarTrmConsultadaAutomaticamente = (valorTrm) => {
        usarTrmLive(valorTrm, { silent: true });
    };

    const guardar = async () => {
        if (!form.comercial) {
            showToast("Selecciona un comercial primero", "error");
            return;
        }

        if (!String(form.cliente || "").trim()) {
            showToast("Ingresa el nombre del cliente", "error");
            return;
        }

        const entry = {
            fecha: new Date(),
            comercial: form.comercial,
            cliente: String(form.cliente).trim(),
            estado: "enviada",

            producto: result.prod,
            sector: result.sector,
            origen: result.origen,
            ciudad: result.ciudad,

            rutaFleteId: form.rutaFleteId,
            rutaFlete: result.rutaFlete
                ? {
                    ciudadOrigen: result.rutaFlete.ciudadOrigen,
                    ciudadDestino: result.rutaFlete.ciudadDestino,
                    tipoVehiculo: result.rutaFlete.tipoVehiculo,
                    especificacion: result.rutaFlete.especificacion,
                    cantidadLitros: result.rutaFlete.cantidadLitros,
                    fletePromedio: result.fleteCOP,
                }
                : null,

            tipo: result.tipo,
            volPed: result.volPed,
            volMen: result.volMen,
            trm: result.trm,

            pv: result.pv,
            pe: result.pe,
            peCOP: result.peCOP,

            margenObjetivo: result.margenObjetivo,
            costoTotalUSD: result.costoTotalUSD,

            fleteCOP: result.fleteCOP,
            fleteUSD: result.fleteUSD,

            recipUSD: result.recipUSD,
            util: result.util,
            margen: result.margen,

            recipData: result.recipData,
        };

        try {
            setSavingCotizacion(true);

            const { data } = await api.post(COTIZACIONES_ENDPOINT, entry);

            const saved = data?.data || data;

            actualizarHistorialLocal((prev) => [
                normalizarCotizacion(saved),
                ...prev,
            ]);

            showToast(`Cotización guardada para ${saved.cliente}`);
            setView("historial");
        } catch (error) {
            console.error("Error guardando cotización:", error);

            showToast(
                error?.response?.data?.message ||
                "No se pudo guardar la cotización.",
                "error"
            );
        } finally {
            setSavingCotizacion(false);
        }
    };

    const copiar = async () => {
        const comercial = form.comercial ? COM[form.comercial].n : "(sin comercial)";
        const cliente = form.cliente || "(sin cliente)";

        const txt = `COTIZACIÓN AMBIOCOM
─────────────────────
Cliente: ${cliente}
Comercial: ${comercial}
Producto: ${result.prod || "—"}
Ruta: ${result.origen} → ${cityLabel(result.ciudad)}
Transporte: ${TIPO_LBL[result.tipo] || "N/D"}
Volumen: ${Number(form.volumen || 0).toLocaleString("es-CO")} L
TRM: ${fCOP(result.trm)}
Precio: $${result.pv.toFixed(3)} USD/L
Utilidad: ${result.util != null ? `$${f3(result.util)}` : "N/D"}
Margen: ${result.margen != null ? `${(result.margen * 100).toFixed(1)}%` : "N/D"}`;

        try {
            await navigator.clipboard.writeText(txt);
            showToast("Resumen copiado al portapapeles");
        } catch {
            showToast("No se pudo copiar el resumen", "error");
        }
    };

    const filtered = useMemo(() => {
        return historial.filter((q) => {
            if (currentFilter !== "all" && q.comercial !== currentFilter) return false;
            if (currentEstadoFilter !== "all" && q.estado !== currentEstadoFilter) return false;

            if (currentSearch) {
                const s = currentSearch.toLowerCase();
                const blob = `${q.cliente || ""} ${q.producto || ""} ${q.ciudad || ""} ${COM[q.comercial]?.n || ""}`.toLowerCase();

                if (!blob.includes(s)) return false;
            }

            return true;
        });
    }, [historial, currentFilter, currentEstadoFilter, currentSearch]);

    const baseCom = useMemo(
        () => historial.filter((q) => currentFilter === "all" || q.comercial === currentFilter),
        [historial, currentFilter]
    );

    const counts = useMemo(
        () => ({
            all: historial.length,
            emily: historial.filter((q) => q.comercial === "emily").length,
            vanessa: historial.filter((q) => q.comercial === "vanessa").length,
            marcelo: historial.filter((q) => q.comercial === "marcelo").length,
            eAll: baseCom.length,
            enviada: baseCom.filter((q) => q.estado === "enviada").length,
            negociacion: baseCom.filter((q) => q.estado === "negociacion").length,
            ganada: baseCom.filter((q) => q.estado === "ganada").length,
            perdida: baseCom.filter((q) => q.estado === "perdida").length,
        }),
        [historial, baseCom]
    );

    const summary = useMemo(() => {
        const totalVol = filtered.reduce((s, q) => s + (q.volPed || 0), 0);
        const totalUSD = filtered.reduce((s, q) => s + (q.pv || 0) * (q.volPed || 0), 0);
        const validMargin = filtered.filter((q) => q.margen != null);
        const avgMargin = validMargin.length
            ? validMargin.reduce((s, q) => s + q.margen, 0) / validMargin.length
            : 0;
        const ganadas = filtered.filter((q) => q.estado === "ganada").length;
        const perdidas = filtered.filter((q) => q.estado === "perdida").length;
        const cerradas = ganadas + perdidas;
        const tasaCierre = cerradas > 0 ? ganadas / cerradas : null;
        const usdGanado = filtered
            .filter((q) => q.estado === "ganada")
            .reduce((s, q) => s + (q.pv || 0) * (q.volPed || 0), 0);

        return {
            totalVol,
            totalUSD,
            avgMargin,
            tasaCierre,
            usdGanado,
        };
    }, [filtered]);

    const selectedQuote = useMemo(
        () => historial.find((q) => q._id === selectedId),
        [historial, selectedId]
    );

    const cambiarEstado = async (_id, nuevoEstado) => {
        try {
            const { data } = await api.patch(
                `${COTIZACIONES_ENDPOINT}/${_id}/estado`,
                {
                    estado: nuevoEstado,
                }
            );

            const updated = data?.data || data;

            actualizarHistorialLocal((prev) =>
                prev.map((q) =>
                    q._id === _id
                        ? normalizarCotizacion({
                            ...updated,
                            estado: updated.estado || nuevoEstado,
                            fecha: updated.fecha || updated.createdAt || q.fecha,
                        })
                        : q
                )
            );

            showToast(`Estado: ${ESTADOS[nuevoEstado].n}`);
        } catch (error) {
            console.error("Error cambiando estado:", error);

            showToast(
                error?.response?.data?.message ||
                "No se pudo cambiar el estado.",
                "error"
            );
        }
    };

    const eliminarActual = async () => {
        if (selectedId == null) return;
        if (!window.confirm("¿Eliminar esta cotización del historial?")) return;

        try {
            await api.delete(`${COTIZACIONES_ENDPOINT}/${selectedId}`);

            actualizarHistorialLocal((prev) =>
                prev.filter((q) => q._id !== selectedId)
            );

            setSelectedId(null);
            showToast("Cotización eliminada");
        } catch (error) {
            console.error("Error eliminando cotización:", error);

            showToast(
                error?.response?.data?.message ||
                "No se pudo eliminar la cotización.",
                "error"
            );
        }
    };

    const recargarEnCotizador = () => {
        if (!selectedQuote) return;

        setForm({
            comercial: selectedQuote.comercial,
            cliente: selectedQuote.cliente,
            producto: selectedQuote.producto,
            sector: selectedQuote.sector,
            origen: selectedQuote.origen,
            ciudad: selectedQuote.ciudad,
            rutaFleteId: selectedQuote.rutaFleteId || "",
            tipoDespacho: selectedQuote.tipo,
            volumen: selectedQuote.volPed,
            volMensual: selectedQuote.volMen,
            trm: selectedQuote.trm,
            pe:
                selectedQuote.peCOP != null
                    ? Number(selectedQuote.peCOP).toFixed(2)
                    : selectedQuote.pe != null && selectedQuote.trm
                        ? (Number(selectedQuote.pe) * Number(selectedQuote.trm)).toFixed(2)
                        : "",
            peUSD:
                selectedQuote.pe != null
                    ? Number(selectedQuote.pe).toFixed(4)
                    : selectedQuote.peCOP != null && selectedQuote.trm
                        ? (Number(selectedQuote.peCOP) / Number(selectedQuote.trm)).toFixed(4)
                        : "",
            pventa: Number(selectedQuote.pv).toFixed(3),
            recipiente: selectedQuote.recipData?.tipo || "garrafa",
            amort: selectedQuote.recipData?.amort || 6,
            cantRecip: selectedQuote.recipData?.cant || 50,
        });

        setPeInputMode("cop");
        setAutoMode(false);
        setSelectedId(null);
        setView("cotizar");
        showToast("Cotización cargada en el formulario");
    };

    const exportarCSV = () => {
        if (historial.length === 0) {
            showToast("No hay datos para exportar", "error");
            return;
        }

        const header = [
            "Fecha",
            "Comercial",
            "Cliente",
            "Producto",
            "Sector",
            "Origen",
            "Destino",
            "Transporte",
            "Volumen L",
            "TRM",
            "PE COP",
            "PE USD",
            "Flete COP",
            "Flete USD",
            "Recipiente USD",
            "PV USD",
            "Utilidad USD",
            "Margen %",
            "Valor pedido USD",
        ];

        const rows = filtered.map((q) => [
            fDate(q.fecha),
            COM[q.comercial]?.n || "",
            q.cliente,
            q.producto || "",
            q.sector,
            q.origen,
            cityLabel(q.ciudad),
            TIPO_LBL[q.tipo],
            q.volPed,
            q.trm,
            q.peCOP != null ? Math.round(q.peCOP) : "N/D",
            f3(q.pe),
            q.fleteCOP != null ? Math.round(q.fleteCOP) : "N/D",
            f4(q.fleteUSD),
            f4(q.recipUSD),
            f3(q.pv),
            f3(q.util),
            q.margen != null ? (q.margen * 100).toFixed(2) : "N/D",
            Math.round((q.pv || 0) * (q.volPed || 0)),
        ]);

        const csv = [header, ...rows]
            .map((r) =>
                r
                    .map((c) => {
                        const s = String(c ?? "");
                        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                    })
                    .join(";")
            )
            .join("\n");

        const blob = new Blob([`\ufeff${csv}`], {
            type: "text/csv;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `cotizaciones-ambiocom-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();

        URL.revokeObjectURL(url);

        showToast(`Exportadas ${filtered.length} cotizaciones`);
    };

    const utilTone = result.util == null ? undefined : result.util >= 0 ? "pos" : "neg";

    const margenColor =
        summary.avgMargin >= 0.1
            ? COLORS.success
            : summary.avgMargin >= 0.05
                ? COLORS.warning
                : COLORS.danger;


    const productosOptions = useMemo(() => {
        if (!Array.isArray(alcoholesDespacho)) return [];

        const mapa = new Map();

        alcoholesDespacho.forEach((alcohol, index) => {
            const nombre = String(alcohol?.nombre || "").trim();

            if (!nombre) return;

            const key = normalizeText(nombre);

            if (!mapa.has(key)) {
                mapa.set(key, {
                    key: `${key}-${alcohol?._id || alcohol?.id || index}`,
                    value: nombre,
                    label: nombre,
                });
            }
        });

        return [...mapa.values()].sort((a, b) =>
            a.label.localeCompare(b.label)
        );
    }, [alcoholesDespacho]);


    return (
        <Box
            sx={{
                marginTop: 6,
                minHeight: "100vh",
                bgcolor: COLORS.page,
                color: COLORS.text,
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                background:
                    "radial-gradient(circle at top left, rgba(31,26,232,.055) 0%, transparent 32%), radial-gradient(circle at top right, rgba(30,224,58,.05) 0%, transparent 26%), #F5F7FB",
            }}
        >
            <Box
                component="header"
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    bgcolor: "rgba(255,255,255,.88)",
                    backdropFilter: "blur(18px)",
                    borderBottom: `1px solid ${COLORS.border}`,
                    boxShadow: "0 1px 8px rgba(10,14,39,.04)",
                }}
            >
                <Box
                    sx={{
                        ...appShellSx,
                        py: 1.35,
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(240px,.8fr) auto minmax(220px,.6fr)",
                        },
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <BrandLogo />

                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                            justifySelf: { xs: "stretch", md: "center" },
                            bgcolor: COLORS.soft,
                            p: 0.5,
                            borderRadius: "12px",
                            border: `1px solid ${COLORS.borderSoft}`,
                            overflowX: "auto",
                        }}
                    >
                        <NavButton
                            active={view === "cotizar"}
                            icon={CalculateIcon}
                            onClick={() => setView("cotizar")}
                        >
                            Nueva cotización
                        </NavButton>

                        <NavButton
                            active={view === "historial"}
                            icon={HistoryIcon}
                            badge={historial.length}
                            onClick={() => setView("historial")}
                        >
                            Historial
                        </NavButton>
                    </Stack>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            justifySelf: { xs: "stretch", md: "end" },
                            bgcolor: COLORS.softer,
                            px: 1.6,
                            py: 0.9,
                            borderRadius: 99,
                            color: COLORS.secondary,
                            border: `1px solid ${COLORS.borderSoft}`,
                            minWidth: { md: 210 },
                        }}
                    >
                        <AccountCircleOutlinedIcon sx={{ fontSize: 18, color: COLORS.brandBlue }} />

                        <Typography
                            noWrap
                            sx={{
                                fontSize: 12,
                                fontWeight: 800,
                                flex: 1,
                            }}
                        >
                            {form.comercial ? COM[form.comercial].n : "Sin asignar"}
                        </Typography>
                    </Stack>
                </Box>
            </Box>

            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    ...appShellSx,
                    py: { xs: 2, md: 3 },
                }}
            >
                {view === "cotizar" && (
                    <Stack spacing={2.75}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.4, md: 3.2 },
                                borderRadius: "28px",
                                overflow: "hidden",
                                position: "relative",
                                color: "#fff",
                                background: `
                  radial-gradient(circle at 88% 8%, rgba(30,224,58,.34) 0%, transparent 28%),
                  radial-gradient(circle at 38% 120%, rgba(255,255,255,.18) 0%, transparent 34%),
                  linear-gradient(135deg, ${COLORS.brandBlue} 0%, #2320EA 48%, ${COLORS.brandBlueDark} 100%)
                `,
                                boxShadow: "0 20px 54px rgba(31,26,232,.18)",
                                border: "1px solid rgba(255,255,255,.16)",
                                "&:before": {
                                    content: '""',
                                    position: "absolute",
                                    width: 280,
                                    height: 280,
                                    borderRadius: "50%",
                                    right: -85,
                                    top: -135,
                                    background: "rgba(255,255,255,.13)",
                                },
                                "&:after": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(90deg, rgba(255,255,255,.08) 0%, transparent 38%, rgba(255,255,255,.05) 100%)",
                                    pointerEvents: "none",
                                },
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", lg: "row" }}
                                alignItems={{ xs: "flex-start", lg: "center" }}
                                justifyContent="space-between"
                                spacing={2.5}
                                sx={{ position: "relative", zIndex: 1 }}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            fontSize: { xs: 25, md: 32 },
                                            fontWeight: 950,
                                            letterSpacing: "-.045em",
                                            mb: 0.6,
                                        }}
                                    >
                                        Nueva cotización comercial
                                    </Typography>

                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: 2.1 }}>
                                        <Chip
                                            size="small"
                                            label={form.comercial ? COM[form.comercial].n : "Comercial sin asignar"}
                                            sx={{
                                                bgcolor: "rgba(255,255,255,.14)",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,.22)",
                                                fontWeight: 900,
                                            }}
                                        />

                                        <Chip
                                            size="small"
                                            label={form.cliente ? form.cliente : "Cliente pendiente"}
                                            sx={{
                                                bgcolor: "rgba(255,255,255,.14)",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,.22)",
                                                fontWeight: 900,
                                            }}
                                        />

                                        <Chip
                                            size="small"
                                            label={`${result.origen} → ${cityLabel(result.ciudad)}`}
                                            sx={{
                                                bgcolor: "rgba(255,255,255,.14)",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,.22)",
                                                fontWeight: 900,
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr 1fr",
                                            sm: "repeat(4, minmax(120px,1fr))",
                                            lg: "repeat(4, 136px)",
                                        },
                                        gap: 1,
                                        width: { xs: "100%", lg: "auto" },
                                    }}
                                >
                                    {[
                                        ["PV", `$${f3(result.pv)}`],
                                        ["TRM ACTUALIZADA", result.trm > 0 ? fCOP(result.trm) : "Consultando…"],
                                        [
                                            "Margen",
                                            result.margen != null ? `${(result.margen * 100).toFixed(1)}%` : "N/D",
                                        ],
                                        ["Utilidad", result.util != null ? `$${f3(result.util)}` : "N/D"],
                                    ].map(([label, value]) => (
                                        <Box
                                            key={label}
                                            sx={{
                                                p: 1.45,
                                                borderRadius: "17px",
                                                bgcolor: "rgba(255,255,255,.13)",
                                                border: "1px solid rgba(255,255,255,.20)",
                                                backdropFilter: "blur(8px)",
                                                minHeight: 78,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    fontWeight: 950,
                                                    color: "rgba(255,255,255,.70)",
                                                    textTransform: "uppercase",
                                                    letterSpacing: ".08em",
                                                }}
                                            >
                                                {label}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontSize: 18,
                                                    fontWeight: 950,
                                                    letterSpacing: "-.035em",
                                                    mt: 0.25,
                                                }}
                                            >
                                                {value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Stack>
                        </Paper>

                        <Box sx={cotizarGridSx}>
                            <Stack spacing={2.35} sx={{ minWidth: 0, height: "100%" }}>
                                <Panel icon={BadgeOutlinedIcon} title="Datos principales">
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                md: "minmax(240px,.7fr) minmax(0,1.3fr)",
                                            },
                                            gap: 1.6,
                                        }}
                                    >
                                        <SelectInput
                                            label="Comercial"
                                            value={form.comercial}
                                            onChange={(v) => update("comercial", v)}
                                        >
                                            <MenuItem value="">— Seleccionar —</MenuItem>
                                            <MenuItem value="emily">Emily López</MenuItem>
                                            <MenuItem value="vanessa">Vanessa Sarmiento</MenuItem>
                                            <MenuItem value="vanessa">Juan Carlos</MenuItem>
                                            <MenuItem value="marcelo">Marcelo Garrido</MenuItem>
                                        </SelectInput>

                                        <TextInput
                                            label="Cliente"
                                            value={form.cliente}
                                            placeholder="Razón social del cliente"
                                            onChange={(v) => update("cliente", v)}
                                        />
                                    </Box>
                                </Panel>

                                <TrmColombiaCard
                                    colors={COLORS}
                                    // Aplicación manual desde el botón de la tarjeta.
                                    onUseTrm={usarTrmLive}
                                    // Aplicación automática cuando termina la consulta.
                                    onTrmLoaded={cargarTrmConsultadaAutomaticamente}
                                    showToast={showToast}
                                />

                                <Panel icon={ScienceOutlinedIcon} title="Producto y precio">
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                lg: "minmax(0,1.15fr) minmax(330px,.85fr)",
                                            },
                                            gap: 2,
                                        }}
                                    >
                                        <Stack spacing={1.6}>
                                            <SelectInput
                                                label={alcoholesLoading ? "Cargando productos..." : "Producto"}
                                                value={form.producto || ""}
                                                onChange={(v) => update("producto", v)}
                                            >
                                                <MenuItem value="">— Seleccionar producto —</MenuItem>

                                                {productosOptions.map((producto) => (
                                                    <MenuItem key={producto.key} value={producto.value}>
                                                        {producto.label}
                                                    </MenuItem>
                                                ))}
                                            </SelectInput>

                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                                    gap: 1.6,
                                                }}
                                            >
                                                <SelectInput
                                                    label="Sector del cliente"
                                                    value={form.sector}
                                                    onChange={(v) => update("sector", v)}
                                                >
                                                    <MenuItem value="otros">Otros sectores</MenuItem>
                                                    <MenuItem value="Licores">Licores</MenuItem>
                                                    <MenuItem value="farmaceutica">Farmaceútica</MenuItem>
                                                    <MenuItem value="Pinturas">Pinturas</MenuItem>
                                                    <MenuItem value="Disolventes">Disolventes</MenuItem>
                                                    <MenuItem value="Tintas">Tintas</MenuItem>
                                                    <MenuItem value="Alimentos">Alimentos</MenuItem>
                                                    <MenuItem value="Rones">Rones</MenuItem>
                                                    <MenuItem value="Industria">Industria</MenuItem>
                                                    <MenuItem value="Cosmetica">Cosmética</MenuItem>
                                                </SelectInput>

                                                <TextInput
                                                    label="Vol. mensual cliente (L)"
                                                    type="number"
                                                    value={form.volMensual}
                                                    onChange={(v) => update("volMensual", v)}
                                                />
                                                <TextInput
                                                    label="Punto Equilibrio base COP/L"
                                                    type="number"
                                                    value={form.pe ?? ""}
                                                    onChange={updatePuntoEquilibrioCOP}
                                                    helperText={
                                                        peInputMode === "cop"
                                                            ? "Valor principal; USD se convierte automáticamente."
                                                            : "Calculado desde el valor manual en USD."
                                                    }
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">COP</InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <TextInput
                                                    label="Punto Equilibrio base USD/L"
                                                    type="number"
                                                    value={form.peUSD ?? ""}
                                                    onChange={updatePuntoEquilibrioUSD}
                                                    helperText={
                                                        peInputMode === "usd"
                                                            ? "Valor principal; COP se convierte automáticamente."
                                                            : "Calculado desde el valor manual en COP."
                                                    }
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">USD</InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Box>
                                        </Stack>

                                        <Stack spacing={1.6}>
                                            <Box
                                                sx={{
                                                    p: 1.85,
                                                    borderRadius: "18px",
                                                    bgcolor: COLORS.softer,
                                                    border: `1px solid ${COLORS.borderSoft}`,
                                                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.65)",
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: 11,
                                                                color: COLORS.secondary,
                                                                fontWeight: 950,
                                                                textTransform: "uppercase",
                                                                letterSpacing: ".06em",
                                                            }}
                                                        >
                                                            Precio sugerido
                                                        </Typography>

                                                        <Typography sx={{ fontSize: 12, color: COLORS.tertiary, fontWeight: 700 }}>
                                                            Costo real + margen objetivo
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: 26,
                                                                color: COLORS.brandBlue,
                                                                fontWeight: 950,
                                                                letterSpacing: "-.045em",
                                                            }}
                                                        >
                                                            {suggestedPrice != null ? `$${suggestedPrice.toFixed(3)}` : "N/D"}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 14, color: COLORS.tertiary, fontWeight: 800 }}>
                                                            <strong> COP $ :</strong> <span style={{ color: "orange" }}>{(suggestedPrice * form.trm).toFixed(2)}</span>
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr" },
                                                    gap: 1.6,
                                                }}
                                            >
                                                <TextInput
                                                    label="TRM ACTUALIZADA (COP / USD)"
                                                    type="number"
                                                    value={form.trm}
                                                    onChange={(v) => update("trm", v)}
                                                />

                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: {
                                                            xs: "1fr",
                                                            sm: "1fr 1fr",
                                                        },
                                                        gap: 1.6,
                                                    }}
                                                >
                                                    <TextInput
                                                        label="Precio de venta USD/L"
                                                        type="number"
                                                        value={form.pventa}
                                                        placeholder="Auto-sugerido"
                                                        helperText={autoMode ? "Modo automático activo" : "Precio editado manualmente"}
                                                        onChange={(v) => {
                                                            setAutoMode(false);
                                                            update("pventa", v);
                                                        }}
                                                    />

                                                    <TextInput
                                                        label="Precio de venta COP/L"
                                                        type="number"
                                                        value={
                                                            form.pventa && form.trm
                                                                ? Math.round(Number(form.pventa) * Number(form.trm))
                                                                : ""
                                                        }
                                                        placeholder="Calculado"
                                                        helperText="Equivalente en COP/L"
                                                        onChange={(v) => {
                                                            const trm = Number(form.trm) || 0;
                                                            const cop = Number(v) || 0;

                                                            setAutoMode(false);

                                                            update(
                                                                "pventa",
                                                                trm > 0 && cop > 0 ? (cop / trm).toFixed(4) : ""
                                                            );
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Panel>

                                <Panel
                                    icon={LocalShippingOutlinedIcon}
                                    title="Ruta y despacho"
                                    sx={{
                                        flex: 1,
                                        minHeight: { xl: 430 },
                                    }}
                                    bodySx={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Stack spacing={1.6} sx={{ flex: 1 }}>
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: {
                                                    xs: "1fr",
                                                    md: "repeat(2, minmax(0,1fr))",
                                                    lg: "repeat(4, minmax(0,1fr))",
                                                },
                                                gap: 1.6,
                                            }}
                                        >
                                            <SelectInput
                                                label="Origen"
                                                value={form.origen}
                                                onChange={(v) => update("origen", v)}
                                            >
                                                <MenuItem value="AMB">Ambiocom (AMB)</MenuItem>
                                                <MenuItem value="BUN">Buenaventura (BUN)</MenuItem>
                                            </SelectInput>
                                            <SelectInput
                                                label={
                                                    matrizFletesLoading
                                                        ? "Cargando matriz de fletes..."
                                                        : destinosLoading
                                                            ? "Cargando destinos..."
                                                            : "Ciudad destino"
                                                }
                                                value={form.ciudad}
                                                onChange={(v) => update("ciudad", v)}
                                            >
                                                <MenuItem value="">— Seleccionar destino —</MenuItem>

                                                {destinosCotizador.map((d) => (
                                                    <MenuItem key={d.value} value={d.value}>
                                                        {d.label}
                                                    </MenuItem>
                                                ))}
                                            </SelectInput>

                                            <SelectInput
                                                label="Ruta / capacidad / flete"
                                                value={form.rutaFleteId || ""}
                                                onChange={updateRutaFlete}
                                            >
                                                <MenuItem value="">— Seleccionar ruta —</MenuItem>

                                                {opcionesDespachoMatriz.map((item) => (
                                                    <MenuItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </MenuItem>
                                                ))}
                                            </SelectInput>

                                            <TextInput
                                                label="Volumen pedido (L)"
                                                type="number"
                                                value={form.volumen}
                                                onChange={(v) => update("volumen", v)}
                                            />
                                        </Box>

                                        {matrizFletesError && (
                                            <Alert
                                                severity="warning"
                                                sx={{
                                                    borderRadius: "14px",
                                                    fontSize: 12,
                                                    fontWeight: 850,
                                                }}
                                            >
                                                {matrizFletesError}
                                            </Alert>
                                        )}

                                        <Box
                                            sx={{
                                                p: 1.65,
                                                borderRadius: "16px",
                                                bgcolor: COLORS.softer,
                                                border: `1px dashed ${COLORS.border}`,
                                                display: "grid",
                                                gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
                                                gap: 1.3,
                                            }}
                                        >
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 10,
                                                        color: COLORS.tertiary,
                                                        fontWeight: 950,
                                                        textTransform: "uppercase",
                                                        letterSpacing: ".06em",
                                                    }}
                                                >
                                                    Ruta
                                                </Typography>

                                                <Typography sx={{ fontSize: 13, fontWeight: 950 }}>
                                                    {result.origen} → {cityLabel(result.ciudad)}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 10,
                                                        color: COLORS.tertiary,
                                                        fontWeight: 950,
                                                        textTransform: "uppercase",
                                                        letterSpacing: ".06em",
                                                    }}
                                                >
                                                    Flete / L
                                                </Typography>

                                                <Typography sx={{ fontSize: 13, fontWeight: 950 }}>
                                                    {result.fleteUSD != null ? `$${f4(result.fleteUSD)} USD` : "N/D"}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontSize: 10,
                                                        color: COLORS.tertiary,
                                                        fontWeight: 950,
                                                        textTransform: "uppercase",
                                                        letterSpacing: ".06em",
                                                    }}
                                                >
                                                    Transporte
                                                </Typography>

                                                <Typography sx={{ fontSize: 13, fontWeight: 950 }}>
                                                    {TIPO_SHORT[result.tipo] || "N/D"}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {result.isSeco && (
                                            <Box
                                                sx={{
                                                    p: 1.9,
                                                    borderRadius: "18px",
                                                    bgcolor: "rgba(124,58,237,.05)",
                                                    border: "1px solid rgba(124,58,237,.16)",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 11,
                                                        color: COLORS.secondary,
                                                        fontWeight: 950,
                                                        textTransform: "uppercase",
                                                        letterSpacing: ".06em",
                                                        mb: 1.35,
                                                    }}
                                                >
                                                    Recipientes
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: {
                                                            xs: "1fr",
                                                            md: "1.2fr .8fr .8fr",
                                                        },
                                                        gap: 1.6,
                                                    }}
                                                >
                                                    <SelectInput
                                                        label="Tipo de recipiente"
                                                        value={form.recipiente}
                                                        onChange={(v) => update("recipiente", v)}
                                                    >
                                                        <MenuItem value="garrafa">Garrafa 20 L — $50.000</MenuItem>
                                                        <MenuItem value="tambor">Tambor plástico 200 L — $110.000</MenuItem>
                                                        <MenuItem value="tamborM">Tambor metálico 200 L — $200.000</MenuItem>
                                                        <MenuItem value="ibc">IBC 1.000 L — $600.000</MenuItem>
                                                    </SelectInput>

                                                    <TextInput
                                                        label="Amortización"
                                                        type="number"
                                                        value={form.amort}
                                                        onChange={(v) => update("amort", v)}
                                                    />

                                                    <TextInput
                                                        label="Cantidad"
                                                        type="number"
                                                        value={form.cantRecip}
                                                        onChange={(v) => update("cantRecip", v)}
                                                    />
                                                </Box>
                                            </Box>
                                        )}

                                        <Box
                                            sx={{
                                                mt: "auto",
                                                pt: { xs: 1, xl: 2 },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 1.8,
                                                    borderRadius: "18px",
                                                    border: `1px solid ${COLORS.borderSoft}`,
                                                    background:
                                                        "linear-gradient(135deg, rgba(31,26,232,.035) 0%, rgba(30,224,58,.045) 100%)",
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 11,
                                                        color: COLORS.secondary,
                                                        fontWeight: 950,
                                                        textTransform: "uppercase",
                                                        letterSpacing: ".06em",
                                                        mb: 1.4,
                                                    }}
                                                >
                                                    Resumen operativo del despacho
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: {
                                                            xs: "1fr",
                                                            sm: "repeat(2, minmax(0,1fr))",
                                                            lg: "repeat(5, minmax(0,1fr))",
                                                        },
                                                        gap: 1.2,
                                                    }}
                                                >
                                                    <DispatchMiniCard
                                                        label="Capacidad despacho"
                                                        value={
                                                            result.volT != null
                                                                ? `${Number(result.volT).toLocaleString("es-CO")} L`
                                                                : "N/D"
                                                        }
                                                    />

                                                    <DispatchMiniCard
                                                        label="Flete total"
                                                        value={result.fleteCOP != null ? fCOP(result.fleteCOP) : "N/D"}
                                                    />

                                                    <DispatchMiniCard
                                                        label="Volumen pedido"
                                                        value={`${Number(result.volPed || 0).toLocaleString("es-CO")} L`}
                                                    />

                                                    <DispatchMiniCard
                                                        label="Modalidad"
                                                        value={TIPO_SHORT[result.tipo] || "N/D"}
                                                    />

                                                    <DispatchMiniCard
                                                        label="Fuente flete"
                                                        value={result.rutaFlete ? "Matriz activa" : "Sin cruce"}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Panel>
                            </Stack>

                            <Paper
                                elevation={0}
                                sx={{
                                    ...panelSx,
                                    position: { xl: "sticky" },
                                    top: { xl: 92 },
                                    alignSelf: "stretch",
                                    borderRadius: "26px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2.65,
                                        color: "#fff",
                                        background: `
                      radial-gradient(circle at 92% 10%, rgba(30,224,58,.25) 0%, transparent 32%),
                      linear-gradient(135deg, ${COLORS.brandBlue} 0%, ${COLORS.brandBlueDark} 100%)
                    `,
                                    }}
                                >
                                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: 11,
                                                    fontWeight: 950,
                                                    color: "rgba(255,255,255,.72)",
                                                    textTransform: "uppercase",
                                                    letterSpacing: ".08em",
                                                }}
                                            >
                                                Resultado comercial
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontSize: 38,
                                                    lineHeight: 1,
                                                    fontWeight: 950,
                                                    letterSpacing: "-.065em",
                                                    mt: 0.8,
                                                }}
                                            >
                                                ${f3(result.pv)}
                                            </Typography>

                                            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,.75)", mt: 0.85 }}>
                                                USD por litro
                                            </Typography>
                                        </Box>

                                        <Box sx={{ textAlign: "right" }}>
                                            <Chip
                                                label={
                                                    result.margen != null
                                                        ? `${(result.margen * 100).toFixed(1)}% margen`
                                                        : "Margen N/D"
                                                }
                                                sx={{
                                                    bgcolor: "rgba(255,255,255,.15)",
                                                    color: "#fff",
                                                    fontWeight: 950,
                                                    border: "1px solid rgba(255,255,255,.22)",
                                                }}
                                            />

                                            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,.75)", mt: 1 }}>
                                                {result.prod || "—"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box sx={{ p: 2.3, pb: 0 }}>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                                        <Metric label="Pto. equilibrio" value={`$${f3(result.pe)}`} />

                                        <Metric
                                            label="Utilidad / L"
                                            value={result.util != null ? `$${f3(result.util)}` : "N/D"}
                                            tone={utilTone}
                                        />

                                        <Metric
                                            label="Flete / L"
                                            value={result.fleteUSD != null ? `$${f4(result.fleteUSD)}` : "N/D"}
                                        />

                                        <Metric
                                            label="Volumen"
                                            value={`${Number(result.volPed || 0).toLocaleString("es-CO")}`}
                                            tone="info"
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ p: 2.3, pb: 0 }}>
                                    <Box
                                        sx={{
                                            border: `1px solid ${COLORS.borderSoft}`,
                                            borderRadius: "18px",
                                            bgcolor: COLORS.softer,
                                        }}
                                    >
                                        <Gauge margen={result.margen} />
                                    </Box>
                                </Box>

                                <Box sx={{ px: 2.3, py: 2 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: COLORS.secondary,
                                            mb: 1.3,
                                            textTransform: "uppercase",
                                            letterSpacing: ".06em",
                                            fontWeight: 950,
                                        }}
                                    >
                                        Composición USD/L
                                    </Typography>

                                    <CostBar label="Equilibrio" value={result.pe} max={result.pv || 1} color={COLORS.brandBlue} />
                                    <CostBar label="Flete" value={result.fleteUSD || 0} max={result.pv || 1} color="#EF9F27" />

                                    {result.isSeco && (
                                        <CostBar
                                            label="Recipiente"
                                            value={result.recipUSD}
                                            max={result.pv || 1}
                                            color="#7C3AED"
                                        />
                                    )}

                                    <CostBar
                                        label="Utilidad"
                                        value={Math.max(0, result.util || 0)}
                                        max={result.pv || 1}
                                        color={COLORS.success}
                                    />
                                </Box>

                                <Box sx={{ px: 2.3, pb: 2 }}>
                                    <Box
                                        sx={{
                                            p: 1.6,
                                            borderRadius: "16px",
                                            bgcolor: COLORS.softer,
                                            border: `1px solid ${COLORS.borderSoft}`,
                                        }}
                                    >
                                        <BreakdownRow label="Producto">
                                            <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                                                <Typography component="span" sx={{ fontSize: 12, fontWeight: 950 }}>
                                                    {result.prod || "—"}
                                                </Typography>
                                                <SectorChip sector={result.sector} />
                                            </Stack>
                                        </BreakdownRow>

                                        <BreakdownRow label="Ruta" value={`${result.origen} → ${cityLabel(result.ciudad)}`} />
                                        <BreakdownRow label="Transporte" value={TIPO_LBL[result.tipo] || "N/D"} />

                                        {result.isSeco && (
                                            <BreakdownRow label="Recipiente" value={result.recipDesc} />
                                        )}

                                        <BreakdownRow label="Precio de venta" total value={`$${f3(result.pv)} USD/L`} />

                                        <BreakdownRow
                                            label="Utilidad neta"
                                            total
                                            value={result.util != null ? `$${f3(result.util)} / L` : "N/D"}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ px: 2.3, pb: 2 }}>
                                    {result.pv < result.pe ? (
                                        <Alert
                                            severity="error"
                                            icon={<WarningAmberIcon />}
                                            sx={{ borderRadius: "14px", fontSize: 12, fontWeight: 850 }}
                                        >
                                            Precio bajo punto de equilibrio. Requiere aprobación de gerencia general.
                                        </Alert>
                                    ) : result.margen != null && result.margen < 0.05 ? (
                                        <Alert
                                            severity="warning"
                                            icon={<WarningAmberIcon />}
                                            sx={{ borderRadius: "14px", fontSize: 12, fontWeight: 850 }}
                                        >
                                            Margen inferior al 5%. Revisa con el equipo comercial antes de enviar.
                                        </Alert>
                                    ) : result.margen != null && result.margen >= 0.1 ? (
                                        <Alert
                                            severity="success"
                                            icon={<CheckCircleOutlineIcon />}
                                            sx={{ borderRadius: "14px", fontSize: 12, fontWeight: 850 }}
                                        >
                                            Cotización en zona de margen saludable.
                                        </Alert>
                                    ) : null}
                                </Box>

                                <Box
                                    sx={{
                                        px: 2.3,
                                        pb: 2.3,
                                        mt: "auto",
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1,
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        disabled={savingCotizacion}
                                        startIcon={<SaveAltOutlinedIcon />}
                                        onClick={guardar}
                                        sx={{
                                            bgcolor: COLORS.brandGreenDark,
                                            borderRadius: "14px",
                                            textTransform: "none",
                                            fontWeight: 950,
                                            py: 1.15,
                                            boxShadow: "0 10px 22px rgba(19,184,44,.20)",
                                            "&:hover": { bgcolor: "#0E9123" },
                                        }}
                                    >
                                        {savingCotizacion ? "Guardando..." : "Guardar"}
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={<ContentCopyIcon />}
                                        onClick={copiar}
                                        sx={{
                                            bgcolor: COLORS.brandBlue,
                                            borderRadius: "14px",
                                            textTransform: "none",
                                            fontWeight: 950,
                                            py: 1.15,
                                            boxShadow: "0 10px 22px rgba(31,26,232,.20)",
                                            "&:hover": { bgcolor: COLORS.brandBlueDark },
                                        }}
                                    >
                                        Copiar
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        startIcon={<RefreshIcon />}
                                        onClick={resetPV}
                                        sx={{
                                            gridColumn: { sm: "1 / -1" },
                                            borderRadius: "14px",
                                            textTransform: "none",
                                            fontWeight: 950,
                                            color: COLORS.text,
                                            borderColor: COLORS.border,
                                            py: 1.1,
                                            "&:hover": {
                                                borderColor: COLORS.brandBlue,
                                                bgcolor: COLORS.brandBlueLight,
                                            },
                                        }}
                                    >
                                        Resetear precio sugerido
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    </Stack >
                )
                }

                {
                    view === "historial" && (
                        <Box sx={{ width: "100%" }}>
                            {historialLoading && (
                                <Alert severity="info" sx={{ mb: 2, borderRadius: "14px" }}>
                                    Cargando historial de cotizaciones...
                                </Alert>
                            )}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                                    gap: 1.5,
                                    mb: 2,
                                }}
                            >

                                <SummaryCard label="Cotizaciones" value={filtered.length} accent />

                                <SummaryCard
                                    label="Volumen total"
                                    value={
                                        <>
                                            {summary.totalVol.toLocaleString("es-CO")}{" "}
                                            <Box component="span" sx={{ fontSize: 12, color: COLORS.secondary, fontWeight: 700 }}>
                                                L
                                            </Box>
                                        </>
                                    }
                                />

                                <SummaryCard
                                    label="Valor total cotizado"
                                    value={
                                        <>
                                            {Math.round(summary.totalUSD).toLocaleString("es-CO")}{" "}
                                            <Box component="span" sx={{ fontSize: 12, color: COLORS.secondary, fontWeight: 700 }}>
                                                USD
                                            </Box>
                                        </>
                                    }
                                />

                                <SummaryCard
                                    label="Ganado (USD)"
                                    value={Math.round(summary.usdGanado).toLocaleString("es-CO")}
                                    color={COLORS.success}
                                />

                                <SummaryCard
                                    label="Tasa de cierre"
                                    value={summary.tasaCierre == null ? "—" : `${(summary.tasaCierre * 100).toFixed(0)}%`}
                                    color={
                                        summary.tasaCierre == null
                                            ? COLORS.tertiary
                                            : summary.tasaCierre >= 0.5
                                                ? COLORS.success
                                                : COLORS.warning
                                    }
                                />

                                <SummaryCard
                                    label="Margen promedio"
                                    value={`${(summary.avgMargin * 100).toFixed(1)}%`}
                                    color={margenColor}
                                />
                            </Box>

                            <Paper
                                elevation={0}
                                sx={{
                                    ...panelSx,
                                    p: { xs: 1.6, md: 2 },
                                    mb: 2,
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", lg: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "stretch", lg: "center" }}
                                    spacing={1.5}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                color: COLORS.tertiary,
                                                fontWeight: 950,
                                                textTransform: "uppercase",
                                                letterSpacing: ".05em",
                                                mr: 0.5,
                                            }}
                                        >
                                            Comercial
                                        </Typography>

                                        <FilterButton active={currentFilter === "all"} onClick={() => setCurrentFilter("all")}>
                                            Todos <Badge color="default" badgeContent={counts.all} sx={{ ml: 1 }} />
                                        </FilterButton>

                                        <FilterButton active={currentFilter === "emily"} onClick={() => setCurrentFilter("emily")}>
                                            Emily <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.emily}</Box>
                                        </FilterButton>

                                        <FilterButton active={currentFilter === "vanessa"} onClick={() => setCurrentFilter("vanessa")}>
                                            Vanessa <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.vanessa}</Box>
                                        </FilterButton>

                                        <FilterButton active={currentFilter === "marcelo"} onClick={() => setCurrentFilter("marcelo")}>
                                            Marcelo <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.marcelo}</Box>
                                        </FilterButton>
                                    </Stack>

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                                        <TextField
                                            size="small"
                                            value={currentSearch}
                                            placeholder="Buscar cliente, producto…"
                                            onChange={(e) => setCurrentSearch(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon sx={{ color: COLORS.tertiary, fontSize: 18 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{
                                                width: { xs: "100%", md: 300 },
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "13px",
                                                    bgcolor: COLORS.card,
                                                    fontSize: 13,
                                                },
                                            }}
                                        />

                                        <Button
                                            variant="contained"
                                            startIcon={<DownloadIcon />}
                                            onClick={exportarCSV}
                                            sx={{
                                                textTransform: "none",
                                                fontWeight: 900,
                                                borderRadius: "13px",
                                                bgcolor: COLORS.brandBlue,
                                                "&:hover": {
                                                    bgcolor: COLORS.brandBlueDark,
                                                },
                                            }}
                                        >
                                            CSV
                                        </Button>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: 2 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: COLORS.tertiary,
                                            fontWeight: 950,
                                            textTransform: "uppercase",
                                            letterSpacing: ".05em",
                                            mr: 0.5,
                                        }}
                                    >
                                        Estado
                                    </Typography>

                                    <FilterButton active={currentEstadoFilter === "all"} onClick={() => setCurrentEstadoFilter("all")}>
                                        Todos <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.eAll}</Box>
                                    </FilterButton>

                                    <FilterButton active={currentEstadoFilter === "enviada"} onClick={() => setCurrentEstadoFilter("enviada")}>
                                        Enviada <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.enviada}</Box>
                                    </FilterButton>

                                    <FilterButton active={currentEstadoFilter === "negociacion"} onClick={() => setCurrentEstadoFilter("negociacion")}>
                                        En negociación <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.negociacion}</Box>
                                    </FilterButton>

                                    <FilterButton active={currentEstadoFilter === "ganada"} onClick={() => setCurrentEstadoFilter("ganada")}>
                                        Ganada <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.ganada}</Box>
                                    </FilterButton>

                                    <FilterButton active={currentEstadoFilter === "perdida"} onClick={() => setCurrentEstadoFilter("perdida")}>
                                        Perdida <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.perdida}</Box>
                                    </FilterButton>
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ ...panelSx }}>
                                {filtered.length === 0 ? (
                                    <EmptyState
                                        hasFilter={
                                            currentFilter !== "all" ||
                                            currentEstadoFilter !== "all" ||
                                            Boolean(currentSearch)
                                        }
                                    />
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small" sx={{ minWidth: 1180 }}>
                                            <TableHead sx={{ bgcolor: COLORS.softer }}>
                                                <TableRow>
                                                    {[
                                                        "Fecha",
                                                        "Comercial",
                                                        "Cliente",
                                                        "Producto",
                                                        "Ruta",
                                                        "Volumen",
                                                        "PV (USD/L)",
                                                        "Margen",
                                                        "Estado",
                                                        "",
                                                    ].map((h, idx) => (
                                                        <TableCell
                                                            key={h || idx}
                                                            align={[5, 6, 7].includes(idx) ? "right" : "left"}
                                                            sx={{
                                                                py: 1.45,
                                                                px: 1.8,
                                                                fontSize: 11,
                                                                fontWeight: 950,
                                                                color: COLORS.secondary,
                                                                textTransform: "uppercase",
                                                                letterSpacing: ".04em",
                                                                borderColor: COLORS.border,
                                                            }}
                                                        >
                                                            {h}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {filtered.map((q) => {
                                                    const mgCls =
                                                        q.margen >= 0.1 ? "pos" : q.margen >= 0.05 ? "warn" : "neg";

                                                    const mgColor =
                                                        mgCls === "pos"
                                                            ? COLORS.success
                                                            : mgCls === "warn"
                                                                ? COLORS.warning
                                                                : COLORS.danger;

                                                    const mgBg =
                                                        mgCls === "pos"
                                                            ? COLORS.successBg
                                                            : mgCls === "warn"
                                                                ? COLORS.warningBg
                                                                : COLORS.dangerBg;

                                                    return (
                                                        <TableRow
                                                            key={q._id}
                                                            hover
                                                            sx={{
                                                                cursor: "pointer",
                                                                transition: "background .16s ease",
                                                                "& td": {
                                                                    borderColor: COLORS.borderSoft,
                                                                    py: 1.6,
                                                                    px: 1.8,
                                                                    fontSize: 12,
                                                                },
                                                                "&:hover": {
                                                                    bgcolor: "rgba(31,26,232,025)",
                                                                },
                                                            }}
                                                            onClick={() => setSelectedId(q._id)}
                                                        >
                                                            <TableCell sx={{ color: COLORS.secondary, whiteSpace: "nowrap" }}>
                                                                {fDate(q.fecha)}
                                                            </TableCell>

                                                            <TableCell>
                                                                <CommercialChip comercial={q.comercial} short />
                                                            </TableCell>

                                                            <TableCell sx={{ fontWeight: 950 }}>{q.cliente}</TableCell>

                                                            <TableCell>{q.producto || "—"}</TableCell>

                                                            <TableCell>
                                                                <Typography component="span" sx={{ fontSize: 11, color: COLORS.secondary }}>
                                                                    {q.origen} →{" "}
                                                                </Typography>
                                                                {cityLabel(q.ciudad)}
                                                                <Typography sx={{ fontSize: 11, color: COLORS.tertiary }}>
                                                                    {TIPO_SHORT[q.tipo]}
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell
                                                                align="right"
                                                                sx={{ fontWeight: 850, fontVariantNumeric: "tabular-nums" }}
                                                            >
                                                                {(q.volPed || 0).toLocaleString("es-CO")}
                                                            </TableCell>

                                                            <TableCell
                                                                align="right"
                                                                sx={{ fontWeight: 850, fontVariantNumeric: "tabular-nums" }}
                                                            >
                                                                {Number(q.pv || 0).toFixed(3)}
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Chip
                                                                    size="small"
                                                                    label={q.margen != null ? `${(q.margen * 100).toFixed(1)}%` : "N/D"}
                                                                    sx={{
                                                                        height: 25,
                                                                        fontSize: 11,
                                                                        fontWeight: 950,
                                                                        bgcolor: mgBg,
                                                                        color: mgColor,
                                                                    }}
                                                                />
                                                            </TableCell>

                                                            <TableCell>
                                                                <EstadoChip estado={q.estado} />
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Tooltip title="Ver detalle">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedId(q._id);
                                                                        }}
                                                                    >
                                                                        <VisibilityOutlinedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    )
                }
            </Container >

            <Dialog
                open={Boolean(selectedQuote)}
                onClose={() => setSelectedId(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: "22px", overflow: "hidden" },
                }}
            >
                {selectedQuote && (
                    <>
                        <DialogTitle sx={{ borderBottom: `1px solid ${COLORS.border}`, py: 2.25 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                    <Typography sx={{ fontSize: 17, fontWeight: 950 }}>
                                        {selectedQuote.cliente}
                                    </Typography>

                                    <CommercialChip comercial={selectedQuote.comercial} />
                                </Stack>

                                <IconButton onClick={() => setSelectedId(null)} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Stack>
                        </DialogTitle>

                        <DialogContent sx={{ pt: 2.5 }}>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        color: COLORS.secondary,
                                        fontWeight: 950,
                                        textTransform: "uppercase",
                                        letterSpacing: ".04em",
                                        mb: 1,
                                    }}
                                >
                                    Estado
                                </Typography>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" },
                                        gap: 0.75,
                                    }}
                                >
                                    {ESTADO_ORDER.map((key) => {
                                        const e = ESTADOS[key];
                                        const Icon = e.Icon;
                                        const active = selectedQuote.estado === key;

                                        return (
                                            <Button
                                                key={key}
                                                onClick={() => cambiarEstado(selectedQuote._id, key)}
                                                startIcon={<Icon sx={{ fontSize: 16 }} />}
                                                sx={{
                                                    minWidth: 0,
                                                    px: 1,
                                                    py: 1,
                                                    borderRadius: "12px",
                                                    textTransform: "none",
                                                    fontSize: 12,
                                                    fontWeight: 950,
                                                    border: `${active ? 2 : 1}px solid ${active ? e.color : COLORS.border
                                                        }`,
                                                    bgcolor: active ? e.bg : COLORS.card,
                                                    color: active ? e.color : COLORS.secondary,
                                                }}
                                            >
                                                {e.n}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </Box>

                            <Detail label="Fecha" value={fDate(selectedQuote.fecha)} />

                            <Detail label="Producto">
                                <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                                    <Typography sx={{ fontSize: 13, fontWeight: 850 }}>
                                        {selectedQuote.producto || "—"}
                                    </Typography>

                                    <SectorChip sector={selectedQuote.sector} />
                                </Stack>
                            </Detail>

                            <Detail
                                label="Vol. mensual cliente"
                                value={`${(selectedQuote.volMen || 0).toLocaleString("es-CO")} L`}
                            />

                            <Detail
                                label="Ruta"
                                value={`${selectedQuote.origen} → ${cityLabel(selectedQuote.ciudad)}`}
                            />

                            <Detail label="Transporte" value={TIPO_LBL[selectedQuote.tipo] || "N/D"} />

                            {selectedQuote.recipData && (
                                <Detail
                                    label="Recipientes"
                                    value={`${selectedQuote.recipData.cant} × ${RECIP[selectedQuote.recipData.tipo].n
                                        } (amort. ${selectedQuote.recipData.amort})`}
                                />
                            )}

                            <Detail
                                label="Volumen del pedido"
                                value={`${(selectedQuote.volPed || 0).toLocaleString("es-CO")} L`}
                            />

                            <Detail label="TRM" value={fCOP(selectedQuote.trm)} />

                            {/* <Detail label="Pto. equilibrio USD" value={`${f3(selectedQuote.pe)} USD/L`} /> */}
                            <Detail
                                label="Pto. equilibrio"
                                value={
                                    selectedQuote?.pe != null
                                        ? `${f3(Number(selectedQuote.pe))} USD/L - ${selectedQuote?.trm != null
                                            ? `${fCOP(Number(selectedQuote.pe) * Number(selectedQuote.trm))} COP/L`
                                            : "COP N/D"
                                        }`
                                        : "N/D"
                                }
                            />
                            {/* <Detail label="Flete USD" value={`${f4(selectedQuote.fleteUSD)} USD/L`} /> */}
                            <Detail
                                label="Flete"
                                value={
                                    selectedQuote?.fleteUSD != null
                                        ? `${f4(Number(selectedQuote.fleteUSD))} USD/L - ${selectedQuote?.trm != null && Number(selectedQuote.trm) > 0
                                            ? `${fCOP(Number(selectedQuote.fleteUSD) * Number(selectedQuote.trm))} COP/L`
                                            : "COP N/D"
                                        }`
                                        : "N/D"
                                }
                            />
                            {selectedQuote.recipUSD > 0 && (
                                <Detail
                                    label="Recipiente"
                                    value={`${f4(selectedQuote.recipUSD)} USD/L`}
                                />
                            )}

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    bgcolor: COLORS.brandBlueLight,
                                    p: 1.35,
                                    borderRadius: "12px",
                                    mt: 0.5,
                                    mb: 0.5,
                                }}
                            >
                                <Typography sx={{ fontSize: 13, fontWeight: 950, color: COLORS.brandBlue }}>
                                    Precio de venta
                                </Typography>

                                <Typography sx={{ fontSize: 15, fontWeight: 950, color: COLORS.brandBlue }}>
                                    {Number(selectedQuote.pv || 0).toFixed(2)} USD/L - {fCOP(Number(selectedQuote.pv) * Number(selectedQuote.trm))} COP/L
                                </Typography>
                            </Stack>

                            <Detail
                                label="Utilidad neta"
                                value={
                                    selectedQuote?.util != null
                                        ? `${f3(selectedQuote.util)} USD/L - ${selectedQuote?.trm != null
                                            ? `${fCOP(Number(selectedQuote.util) * Number(selectedQuote.trm))} COP/L`
                                            : "COP N/D"
                                        }`
                                        : "N/D"
                                }
                            />

                            <Detail label="Margen">
                                <Chip
                                    size="small"
                                    label={
                                        selectedQuote.margen != null
                                            ? `${(selectedQuote.margen * 100).toFixed(1)}%`
                                            : "N/D"
                                    }
                                    sx={{
                                        height: 25,
                                        fontSize: 11,
                                        fontWeight: 950,
                                        bgcolor:
                                            selectedQuote.margen >= 0.1
                                                ? COLORS.successBg
                                                : selectedQuote.margen >= 0.05
                                                    ? COLORS.warningBg
                                                    : COLORS.dangerBg,
                                        color:
                                            selectedQuote.margen >= 0.1
                                                ? COLORS.success
                                                : selectedQuote.margen >= 0.05
                                                    ? COLORS.warning
                                                    : COLORS.danger,
                                    }}
                                />
                            </Detail>

                            <Detail
                                label="Valor estimado pedido"
                                value={
                                    selectedQuote?.pv != null && selectedQuote?.volPed != null
                                        ? `${Math.round(
                                            Number(selectedQuote.pv) * Number(selectedQuote.volPed)
                                        ).toLocaleString("es-CO")} USD · ${selectedQuote?.trm != null && Number(selectedQuote.trm) > 0
                                            ? `${fCOP(
                                                Number(selectedQuote.pv) *
                                                Number(selectedQuote.volPed) *
                                                Number(selectedQuote.trm)
                                            )} COP`
                                            : "COP N/D"
                                        }`
                                        : "N/D"
                                }
                                strong
                            />
                        </DialogContent>

                        <DialogActions
                            sx={{
                                borderTop: `1px solid ${COLORS.border}`,
                                bgcolor: COLORS.softer,
                                p: 1.75,
                            }}
                        >
                            <Button
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={eliminarActual}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 850,
                                }}
                            >
                                Eliminar
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<EditOutlinedIcon />}
                                onClick={recargarEnCotizador}
                                sx={{
                                    bgcolor: COLORS.brandBlue,
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 850,
                                    "&:hover": {
                                        bgcolor: COLORS.brandBlueDark,
                                    },
                                }}
                            >
                                Cargar en cotizador
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={2400}
                onClose={() => setToast((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setToast((p) => ({ ...p, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{
                        borderRadius: "12px",
                        fontWeight: 850,
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box >
    );
}

function Detail({ label, value, children, strong = false }) {
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{
                py: 1,
                borderBottom: `1px solid ${COLORS.borderSoft}`,
            }}
        >
            <Typography sx={{ fontSize: 13, color: COLORS.secondary }}>{label}</Typography>

            <Box
                sx={{
                    fontSize: 13,
                    color: COLORS.text,
                    fontWeight: strong ? 950 : 800,
                    textAlign: "right",
                }}
            >
                {children || value}
            </Box>
        </Stack>
    );
}