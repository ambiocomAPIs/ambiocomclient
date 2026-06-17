import React, { useEffect, useMemo, useState } from "react";
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
  Divider,
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
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BarChartIcon from "@mui/icons-material/BarChart";
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

const COLORS = {
  brandBlue: "#1F1AE8",
  brandBlueDark: "#1812B8",
  brandBlueLight: "#E8E7FE",
  brandGreen: "#1EE03A",
  brandGreenDark: "#13B82C",
  brandGreenLight: "#E5FBE9",
  page: "#F7F8FB",
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

const PROD = {
  tafias: { n: "Tafias", pe: 0.862 },
  ind9293: { n: "Industrial 92-93", pe: 0.5 },
  ind99: { n: "Industrial 99", pe: 0.742 },
  ind96: { n: "Industrial 96", pe: 0.712 },
  ind94: { n: "Industrial 94", pe: 0.692 },
  extraneutro: { n: "Extra neutro", pe: 0.81 },
  anhidro: { n: "Anhidro ENA", pe: 0.84 },
  encana: { n: "Extra neutro Caña", pe: 0.892 },
  enmaiz: { n: "Extra neutro Maíz", pe: 0.81 },
  rectn: { n: "Rectificado N", pe: 0.721 },
  vodka: { n: "Vodka / Ginebra", pe: 0.937 },
  rect: { n: "Rectificado", pe: 0.158 },
};

const RECIP = {
  garrafa: { n: "Garrafa 20L", cop: 50000, cap: 20 },
  tambor: { n: "Tambor plástico 200L", cop: 110000, cap: 200 },
  tamborM: { n: "Tambor metálico 200L", cop: 200000, cap: 200 },
  ibc: { n: "IBC 1000L", cop: 600000, cap: 1000 },
};

const COM = {
  emily: { n: "Emily López", bg: "#FCE7F3", color: "#BE185D" },
  vanessa: { n: "Vanessa Sarmiento", bg: "#FEF3C7", color: "#92400E" },
  marcelo: { n: "Marcelo Garrido", bg: COLORS.infoBg, color: COLORS.brandBlue },
};

const ESTADOS = {
  enviada: { n: "Enviada", bg: COLORS.infoBg, color: COLORS.brandBlue, Icon: SendOutlinedIcon },
  negociacion: { n: "En negociación", bg: COLORS.warningBg, color: COLORS.warning, Icon: ForumOutlinedIcon },
  ganada: { n: "Ganada", bg: COLORS.successBg, color: COLORS.success, Icon: EmojiEventsOutlinedIcon },
  perdida: { n: "Perdida", bg: COLORS.dangerBg, color: COLORS.danger, Icon: CancelOutlinedIcon },
};
const ESTADO_ORDER = ["enviada", "negociacion", "ganada", "perdida"];

const FLETES = {
  AMB: {
    BOGOTA: [6990000, 5600000, 3360000, 2500000],
    MEDELLIN: [6990000, 5600000, 3360000, 2500000],
    CALI: [1670000, 1200000, 950000, 800000],
    BARRANQUILLA: [10400000, 8320000, 6220000, 3500000],
    CARTAGENA: [10400000, 8320000, 5600000, 3500000],
    BUCARAMANGA: [9180000, 7350000, 4400000, 3200000],
    MANIZALES: [5000000, 3550000, 2300000, 1800000],
    PEREIRA: [3420000, 2750000, 1670000, 1400000],
    ARMENIA: [3420000, 2750000, 1670000, 1400000],
    IBAGUE: [5330000, 4100000, 2550000, 1900000],
    COTA: [7400000, 5920000, 3550000, 2700000],
    FONTIBON: [6990000, 5600000, 3360000, 2500000],
    ITAGUI: [6900000, 5600000, 3360000, 2500000],
    COPACABANA: [6990000, 5600000, 3360000, 2500000],
    SINCELEJO: [10400000, 8320000, 5450000, 3500000],
    SANTA_MARTA: [10400000, 8320000, 6000000, 3800000],
    TUNJA: [8600000, 6900000, 4200000, 3000000],
    TOCANICPA: [7480000, 5990000, 3600000, 2700000],
    CAUCA: [2900000, 2200000, 1350000, 1000000],
    BRICEÑO: [8600000, 6900000, 4200000, 3000000],
    PUERTO_TEJADA: [2730000, 2000000, 1350000, 900000],
  },
  BUN: {
    BOGOTA: [6990000, 5600000, 3360000, 2500000],
    MEDELLIN: [6990000, 5600000, 3360000, 2500000],
    CALI: [1670000, 1200000, 950000, 800000],
    BARRANQUILLA: [10800000, 10000000, null, 3800000],
    CARTAGENA: [11400000, null, null, 4000000],
    BUCARAMANGA: [7200000, 7100000, 6726500, 3200000],
    MANIZALES: [3600000, 3400000, 3750000, 1800000],
    PEREIRA: [2800000, 3300000, 3520000, 1600000],
    ARMENIA: [2800000, 3100000, 3520000, 1600000],
    IBAGUE: [5480000, 3800000, 3860000, 2000000],
    COTA: [5360000, null, null, 2200000],
    FONTIBON: [5360000, null, null, 2200000],
    ITAGUI: [5360000, 5650000, 5200000, 2200000],
    COPACABANA: [5360000, 5800000, 5200000, 2200000],
    SINCELEJO: [10680000, null, null, 4000000],
    SANTA_MARTA: [11600000, 10200000, 9750000, 4200000],
    TUNJA: [6200000, 6500000, 5800000, 2800000],
    TOCANICPA: [5680000, 5940000, 5350000, 2400000],
    CAUCA: [2400000, 2100000, 2900000, 1000000],
    BRICEÑO: [8320000, 6500000, null, 3200000],
    PUERTO_TEJADA: [1920000, 2000000, null, 900000],
  },
};

const PDV_VOLS = [40000, 80000, 120000, 160000, 200000];
const PDV_TAB = {
  tafias: [1.0, 0.991, 0.974, 0.957, 0.948],
  ind9293: [0.58, 0.575, 0.565, 0.555, 0.55],
  ind99: [0.861, 0.853, 0.838, 0.824, 0.816],
  ind96: [0.826, 0.819, 0.805, 0.79, 0.783],
  ind94: [0.803, 0.796, 0.782, 0.768, 0.761],
  extraneutro: [0.939, 0.931, 0.915, 0.899, 0.891],
  anhidro: [0.974, 0.966, 0.949, 0.932, 0.924],
  encana: [1.035, 1.026, 1.017, 1.008, 0.981],
  enmaiz: [1.012, 1.004, 0.996, 0.988, 0.98],
  rectn: [0.837, 0.83, 0.822, 0.815, 0.779],
  vodka: [1.171, 1.162, 1.152, 1.143, 1.133],
  rect: [null, null, null, null, null],
};

const TIPO_LBL = {
  ct10: "Carrotanque 10.000 lt",
  ct20: "Carrotanque 20.000 lt",
  ct40: "Carrotanque 40.000 lt",
  seco: "Furgón + recipientes",
};
const TIPO_SHORT = { ct10: "CT 10K", ct20: "CT 20K", ct40: "CT 40K", seco: "Furgón" };

const CIUDADES = [
  "BOGOTA",
  "MEDELLIN",
  "CALI",
  "BARRANQUILLA",
  "CARTAGENA",
  "BUCARAMANGA",
  "MANIZALES",
  "PEREIRA",
  "ARMENIA",
  "IBAGUE",
  "COTA",
  "FONTIBON",
  "ITAGUI",
  "COPACABANA",
  "SINCELEJO",
  "SANTA_MARTA",
  "TUNJA",
  "TOCANICPA",
  "CAUCA",
  "BRICEÑO",
  "PUERTO_TEJADA",
];

const DEFAULT_FORM = {
  comercial: "",
  cliente: "",
  producto: "tafias",
  sector: "otros",
  volMensual: 40000,
  origen: "AMB",
  ciudad: "BOGOTA",
  tipoDespacho: "ct10",
  volumen: 10000,
  recipiente: "garrafa",
  amort: 6,
  cantRecip: 50,
  trm: 4200,
  pventa: "",
};

const panelSx = {
  bgcolor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(10,14,39,.04)",
  transition: "box-shadow .15s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(10,14,39,.06)" },
};

function getSug(prod, vol) {
  const table = PDV_TAB[prod];
  if (!table || table[0] == null) return null;
  for (let i = 0; i < PDV_VOLS.length; i += 1) {
    if (Number(vol) <= PDV_VOLS[i]) return table[i];
  }
  return table[table.length - 1];
}

const f3 = (n) => (n != null && !Number.isNaN(n) ? Number(n).toFixed(3) : "N/D");
const f4 = (n) => (n != null && !Number.isNaN(n) ? Number(n).toFixed(4) : "N/D");
const fCOP = (n) => (n != null && !Number.isNaN(n) ? `$${Math.round(n).toLocaleString("es-CO")}` : "N/D");
const cityLabel = (value) => String(value || "").replaceAll("_", " ");
const fDate = (ts) => {
  const d = new Date(ts);
  return `${d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
};

function Panel({ icon: Icon, title, children, sx }) {
  return (
    <Paper elevation={0} sx={{ ...panelSx, ...sx }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${COLORS.borderSoft}`, bgcolor: COLORS.softer }}
      >
        <Icon sx={{ fontSize: 20, color: COLORS.brandBlue }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: ".06em" }}>
          {title}
        </Typography>
      </Stack>
      <Box sx={{ p: 2.25 }}>{children}</Box>
    </Paper>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === "pos" ? COLORS.success : tone === "neg" ? COLORS.danger : tone === "warn" ? COLORS.warning : tone === "info" ? COLORS.brandBlue : COLORS.text;
  return (
    <Box sx={{ bgcolor: COLORS.softer, border: `1px solid ${COLORS.borderSoft}`, borderRadius: "10px", p: 1.5 }}>
      <Typography sx={{ fontSize: 11, color: COLORS.secondary, mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color }}>{value}</Typography>
    </Box>
  );
}

function BrandLogo() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          color: "#fff",
          fontWeight: 900,
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${COLORS.brandBlue} 0%, ${COLORS.brandGreen} 100%)`,
          boxShadow: "0 4px 12px rgba(31,26,232,.25)",
        }}
      >
        A
      </Box>
      <Box sx={{ lineHeight: 1.1 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em" }}>
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
        <Typography sx={{ fontSize: 11, color: COLORS.secondary, fontWeight: 600 }}>Cotizador comercial</Typography>
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
        minHeight: 36,
        borderRadius: "6px",
        textTransform: "none",
        fontSize: 13,
        fontWeight: 700,
        color: active ? COLORS.brandBlue : COLORS.secondary,
        bgcolor: active ? COLORS.card : "transparent",
        boxShadow: active ? "0 1px 2px rgba(10,14,39,.04)" : "none",
        "&:hover": { bgcolor: active ? COLORS.card : "rgba(10,14,39,.04)" },
      }}
    >
      {children}
      {badge != null && (
        <Box component="span" sx={{ ml: 0.75, px: 0.75, borderRadius: 99, fontSize: 10, fontWeight: 800, color: "#fff", bgcolor: COLORS.brandBlue }}>
          {badge}
        </Box>
      )}
    </Button>
  );
}

function TextInput({ label, value, onChange, type = "text", placeholder, helperText, InputProps }) {
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
        "& .MuiInputLabel-root": { fontSize: 13, color: COLORS.secondary, fontWeight: 600 },
        "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, bgcolor: COLORS.card },
        "& input[type=number]": { MozAppearance: "textfield" },
        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
        "& .MuiFormHelperText-root": { color: COLORS.tertiary, fontSize: 11, ml: 0.25 },
      }}
    />
  );
}

function SelectInput({ label, value, onChange, children }) {
  return (
    <FormControl fullWidth size="small" sx={{ "& .MuiInputLabel-root": { fontSize: 13, color: COLORS.secondary, fontWeight: 600 }, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, bgcolor: COLORS.card } }}>
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
      sx={{ ml: 0.75, height: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", bgcolor: lic ? COLORS.infoBg : COLORS.brandGreenLight, color: lic ? COLORS.brandBlue : COLORS.brandGreenDark }}
    />
  );
}

function CommercialChip({ comercial, short = false }) {
  const data = COM[comercial];
  if (!data) return null;
  return (
    <Chip
      size="small"
      icon={<FiberManualRecordIcon sx={{ fontSize: "9px !important", color: `${data.color} !important` }} />}
      label={short ? data.n.split(" ")[0] : data.n}
      sx={{ height: 24, fontSize: 11, fontWeight: 800, bgcolor: data.bg, color: data.color, "& .MuiChip-label": { px: 0.75 } }}
    />
  );
}

function EstadoChip({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.enviada;
  return (
    <Chip
      size="small"
      icon={<FiberManualRecordIcon sx={{ fontSize: "9px !important", color: `${e.color} !important` }} />}
      label={e.n}
      sx={{ height: 24, fontSize: 11, fontWeight: 800, bgcolor: e.bg, color: e.color, "& .MuiChip-label": { px: 0.75 } }}
    />
  );
}

function Gauge({ margen }) {
  const pct = margen ?? 0;
  const total = 251.2;
  const clamped = Math.max(0, Math.min(pct, 0.3));
  const offset = total - total * (clamped / 0.3);
  const color = clamped >= 0.1 ? COLORS.success : clamped >= 0.05 ? COLORS.warning : COLORS.danger;
  return (
    <Stack alignItems="center" sx={{ px: 2.25, pt: 1.5, pb: 0.5 }}>
      <Box component="svg" viewBox="0 0 200 110" width="180" aria-label="Gauge de margen" role="img">
        <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke={COLORS.borderSoft} strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20,100 A80,80 0 0,1 180,100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={offset.toFixed(1)}
        />
        <text x="100" y="88" textAnchor="middle" fontSize="24" fontWeight="700" fill={color}>
          {margen != null ? `${(margen * 100).toFixed(1)}%` : "—"}
        </text>
        <text x="18" y="114" textAnchor="middle" fontSize="9" fill={COLORS.tertiary} fontWeight="500">
          0%
        </text>
        <text x="182" y="114" textAnchor="middle" fontSize="9" fill={COLORS.tertiary} fontWeight="500">
          30%
        </text>
      </Box>
      <Typography sx={{ fontSize: 11, color: COLORS.secondary, fontWeight: 600 }}>Margen sobre precio de venta</Typography>
    </Stack>
  );
}

function CostBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (Number(value || 0) / max) * 100) : 0;
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.75 }}>
      <Typography sx={{ width: 90, fontSize: 11, color: COLORS.secondary, fontWeight: 700 }}>{label}</Typography>
      <Box sx={{ flex: 1, height: 10, bgcolor: COLORS.soft, borderRadius: "4px", overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: "4px", transition: "width .3s ease" }} />
      </Box>
      <Typography sx={{ width: 52, fontSize: 11, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${f3(value || 0)}</Typography>
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
      sx={{ py: total ? 1.1 : 0.75, borderBottom: total ? "none" : `1px solid ${COLORS.borderSoft}`, borderTop: total ? `1px solid ${COLORS.border}` : "none", mt: total ? 0.5 : 0 }}
    >
      <Typography sx={{ fontSize: total ? 13 : 12, color: total ? COLORS.text : COLORS.secondary, fontWeight: total ? 800 : 500 }}>{label}</Typography>
      <Box sx={{ fontSize: total ? 14 : 12, fontWeight: total ? 900 : 700, color: total ? COLORS.brandBlue : COLORS.text, textAlign: "right" }}>{children || value}</Box>
    </Stack>
  );
}

function SummaryCard({ label, value, accent, color }) {
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "14px", p: 2, bgcolor: COLORS.card }}>
      <Typography sx={{ fontSize: 11, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 800, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 900, letterSpacing: "-.02em", color: color || (accent ? COLORS.brandBlue : COLORS.text) }}>{value}</Typography>
    </Paper>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <Button
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 99,
        border: `1px solid ${active ? COLORS.brandBlue : COLORS.border}`,
        bgcolor: active ? COLORS.brandBlue : COLORS.card,
        color: active ? "#fff" : COLORS.secondary,
        fontSize: 12,
        textTransform: "none",
        fontWeight: 800,
        "&:hover": { bgcolor: active ? COLORS.brandBlueDark : COLORS.softer },
      }}
    >
      {children}
    </Button>
  );
}

function EmptyState({ hasFilter }) {
  return (
    <Stack alignItems="center" sx={{ py: 7.5, px: 2.5, color: COLORS.secondary, textAlign: "center" }}>
      <InboxOutlinedIcon sx={{ fontSize: 52, color: COLORS.tertiary, mb: 1.5 }} />
      <Typography sx={{ fontSize: 16, color: COLORS.text, mb: 0.75, fontWeight: 800 }}>Sin cotizaciones{hasFilter ? " para este filtro" : ""}</Typography>
      <Typography sx={{ fontSize: 13, maxWidth: 420 }}>Las cotizaciones que guardes aparecerán acá con todos sus datos para consulta y análisis.</Typography>
    </Stack>
  );
}

export default function CotizadorAmbiocom() {
  const [view, setView] = useState("cotizar");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [autoMode, setAutoMode] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentEstadoFilter, setCurrentEstadoFilter] = useState("all");
  const [currentSearch, setCurrentSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quotes-history");
      const loaded = raw ? JSON.parse(raw) : [];
      setHistorial(Array.isArray(loaded) ? loaded.map((q) => ({ ...q, estado: q.estado || "enviada" })) : []);
    } catch {
      setHistorial([]);
    }
  }, []);

  const persistHistorial = (next) => {
    setHistorial(next);
    localStorage.setItem("quotes-history", JSON.stringify(next));
  };

  const suggestedPrice = useMemo(() => getSug(form.producto, Number(form.volMensual) || 40000), [form.producto, form.volMensual]);

  useEffect(() => {
    if (!autoMode || suggestedPrice == null) return;
    const next = suggestedPrice.toFixed(3);
    setForm((prev) => (prev.pventa === next ? prev : { ...prev, pventa: next }));
  }, [autoMode, suggestedPrice]);

  const result = useMemo(() => {
    const prod = form.producto;
    const sector = form.sector;
    const origen = form.origen;
    const ciudad = form.ciudad;
    const tipo = form.tipoDespacho;
    const trm = Number.parseFloat(form.trm) || 4200;
    const volMen = Number.parseFloat(form.volMensual) || 40000;
    const pd = PROD[prod] || PROD.tafias;
    const pe = pd.pe;
    const sug = getSug(prod, volMen);
    const manualPv = Number.parseFloat(form.pventa);
    const pv = !Number.isNaN(manualPv) && manualPv > 0 ? manualPv : sug || pe + 0.05;

    const row = FLETES[origen]?.[ciudad] || [null, null, null, null];
    const idx = { ct10: 0, ct20: 1, ct40: 2, seco: 3 }[tipo];
    const fleteCOP = row[idx];

    const isSeco = tipo === "seco";
    let volT = isSeco ? null : { ct10: 10000, ct20: 20000, ct40: 40000 }[tipo];
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
      recipUSD = (rd.cop * cant) / amort / trm / litros;
      recipDesc = `${cant} × ${rd.n} | amort. ${amort}`;
      recipData = { tipo: rec, cant, amort };
    }

    const fleteUSD = fleteCOP != null && volT > 0 ? fleteCOP / trm / volT : null;
    const util = fleteUSD != null ? pv - pe - fleteUSD - recipUSD : null;
    const margen = util != null && pv > 0 ? util / pv : null;

    return {
      pv,
      pe,
      util,
      margen,
      fleteUSD,
      recipUSD,
      volT,
      recipData,
      fleteCOP,
      sug,
      prod,
      sector,
      origen,
      ciudad,
      tipo,
      trm,
      volMen,
      volPed: Number.parseFloat(form.volumen) || 10000,
      recipDesc,
      isSeco,
    };
  }, [form]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const resetPV = () => {
    setAutoMode(true);
    setForm((prev) => ({ ...prev, pventa: "" }));
  };

  const guardar = () => {
    if (!form.comercial) {
      showToast("Selecciona un comercial primero", "error");
      return;
    }
    if (!String(form.cliente || "").trim()) {
      showToast("Ingresa el nombre del cliente", "error");
      return;
    }

    const entry = {
      id: Date.now(),
      fecha: Date.now(),
      comercial: form.comercial,
      cliente: String(form.cliente).trim(),
      estado: "enviada",
      producto: result.prod,
      sector: result.sector,
      origen: result.origen,
      ciudad: result.ciudad,
      tipo: result.tipo,
      volPed: result.volPed,
      volMen: result.volMen,
      trm: result.trm,
      pv: result.pv,
      pe: result.pe,
      fleteUSD: result.fleteUSD,
      recipUSD: result.recipUSD,
      util: result.util,
      margen: result.margen,
      recipData: result.recipData,
    };

    persistHistorial([entry, ...historial]);
    showToast(`Cotización guardada para ${entry.cliente}`);
  };

  const copiar = async () => {
    const comercial = form.comercial ? COM[form.comercial].n : "(sin comercial)";
    const cliente = form.cliente || "(sin cliente)";
    const txt = `COTIZACIÓN AMBIOCOM\n─────────────────────\nCliente: ${cliente}\nComercial: ${comercial}\nProducto: ${PROD[result.prod].n}\nRuta: ${result.origen} → ${cityLabel(result.ciudad)}\nTransporte: ${TIPO_LBL[result.tipo]}\nVolumen: ${Number(form.volumen || 0).toLocaleString("es-CO")} lt\nTRM: ${fCOP(result.trm)}\nPrecio: $${result.pv.toFixed(3)} USD/lt\nUtilidad: ${result.util != null ? `$${f3(result.util)}` : "N/D"}\nMargen: ${result.margen != null ? `${(result.margen * 100).toFixed(1)}%` : "N/D"}`;
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
        const blob = `${q.cliente || ""} ${PROD[q.producto]?.n || ""} ${q.ciudad || ""} ${COM[q.comercial]?.n || ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [historial, currentFilter, currentEstadoFilter, currentSearch]);

  const baseCom = useMemo(() => historial.filter((q) => currentFilter === "all" || q.comercial === currentFilter), [historial, currentFilter]);
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
    const avgMargin = validMargin.length ? validMargin.reduce((s, q) => s + q.margen, 0) / validMargin.length : 0;
    const ganadas = filtered.filter((q) => q.estado === "ganada").length;
    const perdidas = filtered.filter((q) => q.estado === "perdida").length;
    const cerradas = ganadas + perdidas;
    const tasaCierre = cerradas > 0 ? ganadas / cerradas : null;
    const usdGanado = filtered.filter((q) => q.estado === "ganada").reduce((s, q) => s + (q.pv || 0) * (q.volPed || 0), 0);
    return { totalVol, totalUSD, avgMargin, tasaCierre, usdGanado };
  }, [filtered]);

  const selectedQuote = useMemo(() => historial.find((q) => q.id === selectedId), [historial, selectedId]);

  const cambiarEstado = (id, nuevoEstado) => {
    const next = historial.map((q) => (q.id === id ? { ...q, estado: nuevoEstado } : q));
    persistHistorial(next);
    showToast(`Estado: ${ESTADOS[nuevoEstado].n}`);
  };

  const eliminarActual = () => {
    if (selectedId == null) return;
    if (!window.confirm("¿Eliminar esta cotización del historial?")) return;
    persistHistorial(historial.filter((q) => q.id !== selectedId));
    setSelectedId(null);
    showToast("Cotización eliminada");
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
      tipoDespacho: selectedQuote.tipo,
      volumen: selectedQuote.volPed,
      volMensual: selectedQuote.volMen,
      trm: selectedQuote.trm,
      pventa: Number(selectedQuote.pv).toFixed(3),
      recipiente: selectedQuote.recipData?.tipo || "garrafa",
      amort: selectedQuote.recipData?.amort || 6,
      cantRecip: selectedQuote.recipData?.cant || 50,
    });
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
    const header = ["Fecha", "Comercial", "Cliente", "Producto", "Sector", "Origen", "Destino", "Transporte", "Volumen lt", "TRM", "PE USD", "Flete USD", "Recipiente USD", "PV USD", "Utilidad USD", "Margen %", "Valor pedido USD"];
    const rows = filtered.map((q) => [
      fDate(q.fecha),
      COM[q.comercial]?.n || "",
      q.cliente,
      PROD[q.producto]?.n || "",
      q.sector,
      q.origen,
      cityLabel(q.ciudad),
      TIPO_LBL[q.tipo],
      q.volPed,
      q.trm,
      f3(q.pe),
      f4(q.fleteUSD),
      f4(q.recipUSD),
      f3(q.pv),
      f3(q.util),
      q.margen != null ? (q.margen * 100).toFixed(2) : "N/D",
      Math.round((q.pv || 0) * (q.volPed || 0)),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => {
        const s = String(c ?? "");
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(";"))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cotizaciones-ambiocom-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exportadas ${filtered.length} cotizaciones`);
  };

  const margenTone = result.margen == null ? undefined : result.margen >= 0.1 ? "pos" : result.margen >= 0.05 ? "warn" : "neg";
  const utilTone = result.util == null ? undefined : result.util >= 0 ? "pos" : "neg";
  const margenColor = summary.avgMargin >= 0.1 ? COLORS.success : summary.avgMargin >= 0.05 ? COLORS.warning : COLORS.danger;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: COLORS.page, color: COLORS.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: COLORS.card,
          borderBottom: `1px solid ${COLORS.border}`,
          px: 3,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          boxShadow: "0 1px 2px rgba(10,14,39,.04)",
        }}
      >
        <BrandLogo />

        <Stack direction="row" spacing={0.5} sx={{ bgcolor: COLORS.soft, p: 0.5, borderRadius: "10px" }}>
          <NavButton active={view === "cotizar"} icon={CalculateIcon} onClick={() => setView("cotizar")}>Nueva cotización</NavButton>
          <NavButton active={view === "historial"} icon={HistoryIcon} badge={historial.length} onClick={() => setView("historial")}>Historial</NavButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: COLORS.soft, px: 1.5, py: 0.75, borderRadius: 99, color: COLORS.secondary }}>
          <AccountCircleOutlinedIcon sx={{ fontSize: 17, color: COLORS.brandBlue }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{form.comercial ? COM[form.comercial].n : "Sin asignar"}</Typography>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: 2.5, px: { xs: 2, md: 3 } }}>
        {view === "cotizar" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" }, gap: 2.5, alignItems: "start" }}>
            <Stack spacing={2}>
              <Panel icon={BadgeOutlinedIcon} title="Cotización">
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <SelectInput label="Comercial" value={form.comercial} onChange={(v) => update("comercial", v)}>
                    <MenuItem value="">— Seleccionar —</MenuItem>
                    <MenuItem value="emily">Emily López</MenuItem>
                    <MenuItem value="vanessa">Vanessa Sarmiento</MenuItem>
                    <MenuItem value="marcelo">Marcelo Garrido</MenuItem>
                  </SelectInput>
                  <TextInput label="Cliente" value={form.cliente} placeholder="Razón social del cliente" onChange={(v) => update("cliente", v)} />
                </Box>
              </Panel>

              <Panel icon={ScienceOutlinedIcon} title="Producto">
                <Stack spacing={1.5}>
                  <SelectInput label="Producto" value={form.producto} onChange={(v) => update("producto", v)}>
                    <ListSubheader>Otros sectores</ListSubheader>
                    <MenuItem value="tafias">Tafias</MenuItem>
                    <MenuItem value="ind9293">Industrial 92-93</MenuItem>
                    <MenuItem value="ind99">Industrial 99</MenuItem>
                    <MenuItem value="ind96">Industrial 96</MenuItem>
                    <MenuItem value="ind94">Industrial 94</MenuItem>
                    <MenuItem value="extraneutro">Extra neutro</MenuItem>
                    <MenuItem value="anhidro">Anhidro ENA</MenuItem>
                    <ListSubheader>Licores</ListSubheader>
                    <MenuItem value="encana">Extra neutro Caña</MenuItem>
                    <MenuItem value="enmaiz">Extra neutro Maíz</MenuItem>
                    <MenuItem value="rectn">Rectificado N</MenuItem>
                    <MenuItem value="vodka">Vodka / Ginebra</MenuItem>
                    <MenuItem value="rect">Rectificado</MenuItem>
                  </SelectInput>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <SelectInput label="Sector del cliente" value={form.sector} onChange={(v) => update("sector", v)}>
                      <MenuItem value="otros">Otros sectores</MenuItem>
                      <MenuItem value="licores">Licores</MenuItem>
                    </SelectInput>
                    <TextInput label="Vol. mensual cliente (lt)" type="number" value={form.volMensual} onChange={(v) => update("volMensual", v)} />
                  </Box>
                </Stack>
              </Panel>

              <Panel icon={LocalShippingOutlinedIcon} title="Transporte">
                <Stack spacing={1.5}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <SelectInput label="Origen" value={form.origen} onChange={(v) => update("origen", v)}>
                      <MenuItem value="AMB">Ambiocom (AMB)</MenuItem>
                      <MenuItem value="BUN">Buenaventura (BUN)</MenuItem>
                    </SelectInput>
                    <SelectInput label="Ciudad destino" value={form.ciudad} onChange={(v) => update("ciudad", v)}>
                      {CIUDADES.map((c) => (
                        <MenuItem key={c} value={c}>{cityLabel(c)}</MenuItem>
                      ))}
                    </SelectInput>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <SelectInput label="Tipo de despacho" value={form.tipoDespacho} onChange={(v) => update("tipoDespacho", v)}>
                      <MenuItem value="ct10">Carrotanque 10.000 lt</MenuItem>
                      <MenuItem value="ct20">Carrotanque 20.000 lt</MenuItem>
                      <MenuItem value="ct40">Carrotanque 40.000 lt</MenuItem>
                      <MenuItem value="seco">Furgón + recipientes</MenuItem>
                    </SelectInput>
                    <TextInput label="Volumen del pedido (lt)" type="number" value={form.volumen} onChange={(v) => update("volumen", v)} />
                  </Box>

                  {result.isSeco && (
                    <>
                      <Divider sx={{ borderColor: COLORS.borderSoft }} />
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                        <SelectInput label="Tipo de recipiente" value={form.recipiente} onChange={(v) => update("recipiente", v)}>
                          <MenuItem value="garrafa">Garrafa 20 lt — $50.000</MenuItem>
                          <MenuItem value="tambor">Tambor plástico 200 lt — $110.000</MenuItem>
                          <MenuItem value="tamborM">Tambor metálico 200 lt — $200.000</MenuItem>
                          <MenuItem value="ibc">IBC 1.000 lt — $600.000</MenuItem>
                        </SelectInput>
                        <TextInput label="Amortización (compras)" type="number" value={form.amort} onChange={(v) => update("amort", v)} />
                      </Box>
                      <TextInput label="Cantidad de recipientes" type="number" value={form.cantRecip} onChange={(v) => update("cantRecip", v)} />
                    </>
                  )}
                </Stack>
              </Panel>

              <Panel icon={AttachMoneyIcon} title="Precio">
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <TextInput label="TRM (COP / USD)" type="number" value={form.trm} onChange={(v) => update("trm", v)} />
                  <TextInput
                    label="Precio de venta (USD/lt)"
                    type="number"
                    value={form.pventa}
                    placeholder="Auto-sugerido"
                    helperText={suggestedPrice != null ? `Ref. PDV EXW: $${suggestedPrice.toFixed(3)}` : "Sin referencia PDV"}
                    onChange={(v) => {
                      setAutoMode(false);
                      update("pventa", v);
                    }}
                  />
                </Box>
              </Panel>
            </Stack>

            <Paper elevation={0} sx={{ ...panelSx, position: { md: "sticky" }, top: { md: 90 } }}>
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${COLORS.borderSoft}`, bgcolor: COLORS.softer }}>
                <BarChartIcon sx={{ fontSize: 20, color: COLORS.brandBlue }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: ".06em" }}>Resultado</Typography>
              </Stack>

              <Box sx={{ p: 2.25, pb: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                  <Metric label="Precio venta" value={`$${f3(result.pv)}`} tone="info" />
                  <Metric label="Pto. equilibrio" value={`$${f3(result.pe)}`} />
                  <Metric label="Utilidad / lt" value={result.util != null ? `$${f3(result.util)}` : "N/D"} tone={utilTone} />
                  <Metric label="Margen" value={result.margen != null ? `${(result.margen * 100).toFixed(1)}%` : "N/D"} tone={margenTone} />
                </Box>
              </Box>

              <Gauge margen={result.margen} />

              <Box sx={{ px: 2.25, py: 2 }}>
                <Typography sx={{ fontSize: 11, color: COLORS.secondary, mb: 1.25, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 800 }}>Desglose de costos (USD/lt)</Typography>
                <CostBar label="Pto. equilibrio" value={result.pe} max={result.pv || 1} color={COLORS.brandBlue} />
                <CostBar label="Flete" value={result.fleteUSD || 0} max={result.pv || 1} color="#EF9F27" />
                {result.isSeco && <CostBar label="Recipiente" value={result.recipUSD} max={result.pv || 1} color="#7C3AED" />}
                <CostBar label="Utilidad" value={Math.max(0, result.util || 0)} max={result.pv || 1} color={COLORS.success} />
              </Box>

              <Box sx={{ px: 2.25, pb: 2 }}>
                <BreakdownRow label="Producto">
                  <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>{PROD[result.prod].n}</Typography>
                    <SectorChip sector={result.sector} />
                  </Stack>
                </BreakdownRow>
                <BreakdownRow label="Ruta" value={`${result.origen} → ${cityLabel(result.ciudad)}`} />
                <BreakdownRow label="Transporte" value={TIPO_LBL[result.tipo]} />
                {result.isSeco && <BreakdownRow label="Recipiente" value={result.recipDesc} />}
                <BreakdownRow label="Flete por litro" value={result.fleteUSD != null ? `$${f4(result.fleteUSD)} / lt` : "N/D"} />
                <BreakdownRow label="Precio de venta" total value={`$${f3(result.pv)} USD/lt`} />
                <BreakdownRow label="Utilidad neta" total value={result.util != null ? `$${f3(result.util)} / lt` : "N/D"} />
              </Box>

              <Box sx={{ px: 2.25, pb: 2 }}>
                {result.pv < result.pe ? (
                  <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: "10px", fontSize: 12, fontWeight: 700 }}>Precio bajo punto de equilibrio. Requiere aprobación de gerencia general.</Alert>
                ) : result.margen != null && result.margen < 0.05 ? (
                  <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: "10px", fontSize: 12, fontWeight: 700 }}>Margen inferior al 5%. Revisa con el equipo comercial antes de enviar.</Alert>
                ) : result.margen != null && result.margen >= 0.1 ? (
                  <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: "10px", fontSize: 12, fontWeight: 700 }}>Cotización en zona de margen saludable.</Alert>
                ) : null}
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ px: 2.25, pb: 2.25, gap: 1 }}>
                <Button variant="contained" startIcon={<SaveAltOutlinedIcon />} onClick={guardar} sx={{ bgcolor: COLORS.brandGreenDark, borderRadius: "10px", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#0E9123" } }}>Guardar cotización</Button>
                <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copiar} sx={{ bgcolor: COLORS.brandBlue, borderRadius: "10px", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: COLORS.brandBlueDark } }}>Copiar resumen</Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={resetPV} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 800, color: COLORS.text, borderColor: COLORS.border }}>Resetear</Button>
              </Stack>
            </Paper>
          </Box>
        )}

        {view === "historial" && (
          <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1.5, mb: 2 }}>
              <SummaryCard label="Cotizaciones" value={filtered.length} accent />
              <SummaryCard label="Volumen total" value={<>{summary.totalVol.toLocaleString("es-CO")} <Box component="span" sx={{ fontSize: 12, color: COLORS.secondary, fontWeight: 600 }}>lt</Box></>} />
              <SummaryCard label="Valor total cotizado" value={<>{Math.round(summary.totalUSD).toLocaleString("es-CO")} <Box component="span" sx={{ fontSize: 12, color: COLORS.secondary, fontWeight: 600 }}>USD</Box></>} />
              <SummaryCard label="Ganado (USD)" value={Math.round(summary.usdGanado).toLocaleString("es-CO")} color={COLORS.success} />
              <SummaryCard label="Tasa de cierre" value={summary.tasaCierre == null ? "—" : `${(summary.tasaCierre * 100).toFixed(0)}%`} color={summary.tasaCierre == null ? COLORS.tertiary : summary.tasaCierre >= 0.5 ? COLORS.success : COLORS.warning} />
              <SummaryCard label="Margen promedio" value={`${(summary.avgMargin * 100).toFixed(1)}%`} color={margenColor} />
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5} sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                <Typography sx={{ fontSize: 11, color: COLORS.tertiary, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em", mr: 0.5 }}>Comercial</Typography>
                <FilterButton active={currentFilter === "all"} onClick={() => setCurrentFilter("all")}>Todos <Badge color="default" badgeContent={counts.all} sx={{ ml: 1 }} /></FilterButton>
                <FilterButton active={currentFilter === "emily"} onClick={() => setCurrentFilter("emily")}>Emily <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.emily}</Box></FilterButton>
                <FilterButton active={currentFilter === "vanessa"} onClick={() => setCurrentFilter("vanessa")}>Vanessa <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.vanessa}</Box></FilterButton>
                <FilterButton active={currentFilter === "marcelo"} onClick={() => setCurrentFilter("marcelo")}>Marcelo <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.marcelo}</Box></FilterButton>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  value={currentSearch}
                  placeholder="Buscar cliente, producto…"
                  onChange={(e) => setCurrentSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.tertiary, fontSize: 18 }} /></InputAdornment> }}
                  sx={{ width: { xs: "100%", md: 260 }, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: COLORS.card, fontSize: 13 } }}
                />
                <Button variant="text" startIcon={<DownloadIcon />} onClick={exportarCSV} sx={{ textTransform: "none", fontWeight: 800, color: COLORS.secondary }}>CSV</Button>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 2 }}>
              <Typography sx={{ fontSize: 11, color: COLORS.tertiary, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em", mr: 0.5 }}>Estado</Typography>
              <FilterButton active={currentEstadoFilter === "all"} onClick={() => setCurrentEstadoFilter("all")}>Todos <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.eAll}</Box></FilterButton>
              <FilterButton active={currentEstadoFilter === "enviada"} onClick={() => setCurrentEstadoFilter("enviada")}>Enviada <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.enviada}</Box></FilterButton>
              <FilterButton active={currentEstadoFilter === "negociacion"} onClick={() => setCurrentEstadoFilter("negociacion")}>En negociación <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.negociacion}</Box></FilterButton>
              <FilterButton active={currentEstadoFilter === "ganada"} onClick={() => setCurrentEstadoFilter("ganada")}>Ganada <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.ganada}</Box></FilterButton>
              <FilterButton active={currentEstadoFilter === "perdida"} onClick={() => setCurrentEstadoFilter("perdida")}>Perdida <Box component="span" sx={{ ml: 0.75, opacity: 0.8 }}>{counts.perdida}</Box></FilterButton>
            </Stack>

            <Paper elevation={0} sx={{ ...panelSx }}>
              {filtered.length === 0 ? (
                <EmptyState hasFilter={currentFilter !== "all" || currentEstadoFilter !== "all" || Boolean(currentSearch)} />
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 980 }}>
                    <TableHead sx={{ bgcolor: COLORS.softer }}>
                      <TableRow>
                        {["Fecha", "Comercial", "Cliente", "Producto", "Ruta", "Volumen", "PV (USD/lt)", "Margen", "Estado", ""].map((h, idx) => (
                          <TableCell key={h || idx} align={[5, 6, 7].includes(idx) ? "right" : "left"} sx={{ py: 1.35, px: 1.75, fontSize: 11, fontWeight: 900, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: ".04em", borderColor: COLORS.border }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((q) => {
                        const mgCls = q.margen >= 0.1 ? "pos" : q.margen >= 0.05 ? "warn" : "neg";
                        const mgColor = mgCls === "pos" ? COLORS.success : mgCls === "warn" ? COLORS.warning : COLORS.danger;
                        const mgBg = mgCls === "pos" ? COLORS.successBg : mgCls === "warn" ? COLORS.warningBg : COLORS.dangerBg;
                        return (
                          <TableRow key={q.id} hover sx={{ cursor: "pointer", "& td": { borderColor: COLORS.borderSoft, py: 1.5, px: 1.75, fontSize: 12 } }} onClick={() => setSelectedId(q.id)}>
                            <TableCell sx={{ color: COLORS.secondary, whiteSpace: "nowrap" }}>{fDate(q.fecha)}</TableCell>
                            <TableCell><CommercialChip comercial={q.comercial} short /></TableCell>
                            <TableCell sx={{ fontWeight: 900 }}>{q.cliente}</TableCell>
                            <TableCell>{PROD[q.producto]?.n}</TableCell>
                            <TableCell>
                              <Typography component="span" sx={{ fontSize: 11, color: COLORS.secondary }}>{q.origen} → </Typography>
                              {cityLabel(q.ciudad)}
                              <Typography sx={{ fontSize: 11, color: COLORS.tertiary }}>{TIPO_SHORT[q.tipo]}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{(q.volPed || 0).toLocaleString("es-CO")}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Number(q.pv || 0).toFixed(3)}</TableCell>
                            <TableCell align="right">
                              <Chip size="small" label={q.margen != null ? `${(q.margen * 100).toFixed(1)}%` : "N/D"} sx={{ height: 24, fontSize: 11, fontWeight: 900, bgcolor: mgBg, color: mgColor }} />
                            </TableCell>
                            <TableCell><EstadoChip estado={q.estado} /></TableCell>
                            <TableCell align="right">
                              <Tooltip title="Ver detalle">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedId(q.id); }}>
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
        )}
      </Container>

      <Dialog open={Boolean(selectedQuote)} onClose={() => setSelectedId(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "18px" } }}>
        {selectedQuote && (
          <>
            <DialogTitle sx={{ borderBottom: `1px solid ${COLORS.border}`, py: 2.25 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                  <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{selectedQuote.cliente}</Typography>
                  <CommercialChip comercial={selectedQuote.comercial} />
                </Stack>
                <IconButton onClick={() => setSelectedId(null)} size="small"><CloseIcon /></IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, color: COLORS.secondary, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", mb: 1 }}>Estado</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: 0.75 }}>
                  {ESTADO_ORDER.map((key) => {
                    const e = ESTADOS[key];
                    const Icon = e.Icon;
                    const active = selectedQuote.estado === key;
                    return (
                      <Button
                        key={key}
                        onClick={() => cambiarEstado(selectedQuote.id, key)}
                        startIcon={<Icon sx={{ fontSize: 16 }} />}
                        sx={{
                          minWidth: 0,
                          px: 1,
                          py: 1,
                          borderRadius: "10px",
                          textTransform: "none",
                          fontSize: 12,
                          fontWeight: 900,
                          border: `${active ? 2 : 1}px solid ${active ? e.color : COLORS.border}`,
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
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{PROD[selectedQuote.producto]?.n}</Typography>
                  <SectorChip sector={selectedQuote.sector} />
                </Stack>
              </Detail>
              <Detail label="Vol. mensual cliente" value={`${(selectedQuote.volMen || 0).toLocaleString("es-CO")} lt`} />
              <Detail label="Ruta" value={`${selectedQuote.origen} → ${cityLabel(selectedQuote.ciudad)}`} />
              <Detail label="Transporte" value={TIPO_LBL[selectedQuote.tipo]} />
              {selectedQuote.recipData && <Detail label="Recipientes" value={`${selectedQuote.recipData.cant} × ${RECIP[selectedQuote.recipData.tipo].n} (amort. ${selectedQuote.recipData.amort})`} />}
              <Detail label="Volumen del pedido" value={`${(selectedQuote.volPed || 0).toLocaleString("es-CO")} lt`} />
              <Detail label="TRM" value={fCOP(selectedQuote.trm)} />
              <Detail label="Pto. equilibrio" value={`${f3(selectedQuote.pe)} USD/lt`} />
              <Detail label="Flete" value={`${f4(selectedQuote.fleteUSD)} USD/lt`} />
              {selectedQuote.recipUSD > 0 && <Detail label="Recipiente" value={`${f4(selectedQuote.recipUSD)} USD/lt`} />}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: COLORS.brandBlueLight, p: 1.25, borderRadius: "8px", mt: 0.5, mb: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 900, color: COLORS.brandBlue }}>Precio de venta</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 900, color: COLORS.brandBlue }}>{Number(selectedQuote.pv || 0).toFixed(3)} USD/lt</Typography>
              </Stack>
              <Detail label="Utilidad neta" value={`${f3(selectedQuote.util)} USD/lt`} />
              <Detail label="Margen">
                <Chip size="small" label={selectedQuote.margen != null ? `${(selectedQuote.margen * 100).toFixed(1)}%` : "N/D"} sx={{ height: 24, fontSize: 11, fontWeight: 900, bgcolor: selectedQuote.margen >= 0.1 ? COLORS.successBg : selectedQuote.margen >= 0.05 ? COLORS.warningBg : COLORS.dangerBg, color: selectedQuote.margen >= 0.1 ? COLORS.success : selectedQuote.margen >= 0.05 ? COLORS.warning : COLORS.danger }} />
              </Detail>
              <Detail label="Valor estimado pedido" value={`${Math.round((selectedQuote.pv || 0) * (selectedQuote.volPed || 0)).toLocaleString("es-CO")} USD`} strong />
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${COLORS.border}`, bgcolor: COLORS.softer, p: 1.75 }}>
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={eliminarActual} sx={{ textTransform: "none", fontWeight: 800 }}>Eliminar</Button>
              <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={recargarEnCotizador} sx={{ bgcolor: COLORS.brandBlue, borderRadius: "10px", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: COLORS.brandBlueDark } }}>Cargar en cotizador</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2400} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontWeight: 800 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Detail({ label, value, children, strong = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
      <Typography sx={{ fontSize: 13, color: COLORS.secondary }}>{label}</Typography>
      <Box sx={{ fontSize: 13, color: COLORS.text, fontWeight: strong ? 900 : 700, textAlign: "right" }}>{children || value}</Box>
    </Stack>
  );
}
