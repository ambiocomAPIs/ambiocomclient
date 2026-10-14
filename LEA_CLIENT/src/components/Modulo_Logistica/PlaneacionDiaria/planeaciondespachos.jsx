import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelDownloadButton from "../../../utils/Export_Data_General/ExcelDownloadData";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  InputAdornment,
  Chip,
  Stack,
  MenuItem,
  Tooltip,
  Autocomplete
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { useAuth } from "../../../utils/Context/AuthContext/AuthContext";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import OpacityIcon from "@mui/icons-material/Opacity";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CheckIcon from '@mui/icons-material/Check';
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ProgramacionDespachoModal from "./utils_planeacion/ProgramacionDespachoModal";
import CargaMasivaProgramacionModal from "./utils_planeacion/CargaMasivaProgramacionModal";
import EstadoProgramacionModal from "./utils_planeacion/EstadoProgramacionModal";
import { CIUDADES_COLOMBIA, getCiudadDestinoValue } from "../utils_Logistica/Catalogo/ciudadesColombia";
const API_URL = "https://ambiocomserver.onrender.com/api/programaciondespacho";
const API_CONDUCTORES = "https://ambiocomserver.onrender.com/api/conductores";
const API_CLIENTES = "https://ambiocomserver.onrender.com/api/clienteslogistica";
const API_PRODUCTOS = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";
const API_TRANSPORTADORAS = "https://ambiocomserver.onrender.com/api/transportadoraslogistica";
const CATALOG_TTL_MS = 5 * 60 * 1000;
const CAMPOS_CATALOGO = {
  placa: ["placas", "Placa"],
  trailer: ["trailers", "Tráiler"],
  conductor: ["conductores", "Conductor"],
  transportadora: ["transportadoras", "Transportadora"],
  cliente: ["clientes", "Cliente"],
  producto: ["productos", "Producto"],
  destino: ["destinos", "Destino"],
};
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};
const getEstadoIconColor = (estado) => {
  const value = normalizeText(
    estado || "PENDIENTE"
  ).toUpperCase();
  const colores = {
    PROGRAMADO: "#1976d2",
    PENDIENTE: "#ed6c02",
    ADICIONAL: "#2e7d32",
    "REPROGRAMADO CLIENTE O VENTAS": "#0288d1",
    "REPROGRAMADO LOGISTICA": "#ed6c02",
    CANCELADO: "#d32f2f",
  };
  return colores[value] || "#757575";
};
const getEstadoIcon = (estado) => {
  const value = normalizeText(
    estado || "PROGRAMADO"
  ).toUpperCase();
  switch (value) {
    case "PROGRAMADO":
      return <ScheduleIcon fontSize="small" />;
    case "ADICIONAL":
      return <AddCircleOutlineIcon fontSize="small" />;
    case "REPROGRAMADO CLIENTE O VENTAS":
      return <EventRepeatIcon fontSize="small" />;
    case "REPROGRAMADO LOGISTICA":
      return <EventRepeatIcon fontSize="small" />;
    case "CANCELADO":
      return <CancelIcon fontSize="small" />;
    case "PENDIENTE":
      return <ScheduleIcon fontSize="small" />;
    default:
      return <ScheduleIcon fontSize="small" />;
  }
};
const normalizeText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const normalizeUpper = (v) => normalizeText(v).toUpperCase();
const normalizePlate = (v) =>
  normalizeUpper(v)
    .replace(/\s+/g, "")
    .trim();
const DESTINOS_CATALOGO = Array.from(
  new Set(
    CIUDADES_COLOMBIA
      .map((ciudad) => getCiudadDestinoValue(ciudad))
      .filter(
        (destino) =>
          typeof destino === "string" && destino.length > 0
      )
  )
).sort((a, b) => a.localeCompare(b, "es"));
const isValidDateISO = (s) => {
  const v = normalizeText(s);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  const dt = new Date(yyyy, mm - 1, dd);
  return (
    dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd
  );
};
const normalizeFechaEstimadaEntrega = (value) => {
  const v = normalizeText(value).toUpperCase();
  if (!v) return "NA";
  if (v === "NA" || v === "PENDIENTE") return "NA";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return `${v} 00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}\s\d{1,2}:\d{2}$/.test(v)) {
    const [date, time] = v.split(" ");
    const [hh, mm] = time.split(":");
    return `${date} ${String(hh).padStart(2, "0")}:${mm}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}/.test(v)) {
    const date = v.slice(0, 10);
    const time = v.slice(11, 16);
    const [hh, mm] = time.split(":");
    return `${date} ${String(hh).padStart(2, "0")}:${mm}`;
  }
  return v;
};
const isValidFechaEstimadaEntrega = (value) => {
  const v = normalizeFechaEstimadaEntrega(value);
  if (v === "NA") return true;
  return /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(v);
};
const displayFechaEstimadaEntrega = (value) => {
  const v = normalizeFechaEstimadaEntrega(value);
  return v === "NA" ? "" : v;
};
const formatNumber = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "0";
  return x.toLocaleString("es-CO");
};
const getApiErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
};
const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};
const getDefaultRange = () => {
  const now = new Date();
  const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toISODate(startPrevMonth),
    to: toISODate(endCurrentMonth),
  };
};
const normalizarBusquedaCiudad = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");

const FIELDS = [
  { key: "fecha", title: "Fecha", minWidth: 112 },
  { key: "fechaEstimadaEntrega", title: "Fecha Est. Entrega", minWidth: 160 },
  { key: "horaProgramada", title: "Hora", minWidth: 76 },
  { key: "placa", title: "Placa", minWidth: 105 },
  { key: "trailer", title: "Trailer", minWidth: 95 },
  { key: "conductor", title: "Conductor", minWidth: 175 },
  { key: "transportadora", title: "Transportadora", minWidth: 160 },
  { key: "cliente", title: "Cliente", minWidth: 190 },
  { key: "destino", title: "Destino", minWidth: 155 },
  { key: "producto", title: "Producto", minWidth: 175 },
  { key: "cantidad", title: "Cantidad", minWidth: 103 },
];

const DEFAULT_BLANK_ROWS = 1;
const MAX_PASTE_ROWS = 200;
const EXCEL_ROW_HEIGHT = 42;
const EXCEL_HEADER_HEIGHT = 42;
const EXCEL_VIEWPORT_ROWS = 22;
const EXCEL_OVERSCAN = 12;
const EXCEL_RENDER_COUNT = EXCEL_VIEWPORT_ROWS + EXCEL_OVERSCAN * 2;
const normalize = (v) => String(v ?? "").replace(/\u00a0/g, " ").trim();
const asCell = (row, field) => (row?.[field] == null ? "" : String(row[field]));
const hasContent = (row) => FIELDS.some(({ key }) => normalize(row?.[key]) !== "");
const dateISO = (value) => {
  const v = normalize(value);
  let iso = v;
  const dmy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(v);
  if (dmy) iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const isoParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!isoParts) return null;
  const [, yr, mo, day] = isoParts;
  const d = new Date(Number(yr), Number(mo) - 1, Number(day));
  if (d.getFullYear() !== Number(yr) || d.getMonth() + 1 !== Number(mo) || d.getDate() !== Number(day)) return null;
  return iso;
};
const dateTime = (value) => {
  const v = normalize(value);
  if (!v || /^(NA|PENDIENTE)$/i.test(v)) return "NA";
  const normalized = v.replace("T", " ");
  const isoDateTime = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.exec(normalized);
  if (isoDateTime) {
    const onlyDate = dateISO(isoDateTime[1]);
    const hh = Number(isoDateTime[2]); const mm = Number(isoDateTime[3]);
    return onlyDate && hh <= 23 && mm <= 59 ? `${onlyDate} ${String(hh).padStart(2, "0")}:${isoDateTime[3]}` : null;
  }
  const match = /^(.+?)\s+(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(normalized);
  if (!match) {
    const dateOnly = dateISO(normalized);
    return dateOnly ? `${dateOnly} 00:00` : null;
  }
  const d = dateISO(match[1]);
  const h = Number(match[2]);
  const m = Number(match[3]);
  if (!d || h > 23 || m > 59) return null;
  return `${d} ${String(h).padStart(2, "0")}:${match[3]}`;
};
const hourHHMM = (value) => {
  const v = normalize(value);
  if (!v) return "";
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};
const numericQty = (input) => {
  const v = normalize(input).replace(/\s/g, "");
  if (!v) return null;
  let str = v;
  if (/^\d{1,3}([.,]\d{3})+$/.test(v)) str = v.replace(/[.,]/g, "");
  else if (v.includes(",") && v.includes(".")) {
    str = v.lastIndexOf(",") > v.lastIndexOf(".")
      ? v.replace(/\./g, "").replace(",", ".")
      : v.replace(/,/g, "");
  } else str = v.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(str)) return null;
  const n = Number(str);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const parseTSV = (content) => {
  const result = []; let row = []; let cell = ""; let quoted = false;
  const str = String(content ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      if (quoted && str[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "\t" && !quoted) { row.push(cell); cell = ""; }
    else if (ch === "\n" && !quoted) { row.push(cell); result.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (row.length || cell !== "" || !result.length) { row.push(cell); result.push(row); }
  return result;
};
const rect = (a, b) => ({
  top: Math.min(a.r, b.r), bottom: Math.max(a.r, b.r),
  left: Math.min(a.c, b.c), right: Math.max(a.c, b.c),
});
const optionsFor = (catalog, key) => ({
  placa: catalog?.placas, trailer: catalog?.trailers, conductor: catalog?.conductores,
  transportadora: catalog?.transportadoras, cliente: catalog?.clientes,
  destino: catalog?.destinos, producto: catalog?.productos,
}[key] || []);
// Frecuencia por campo, calculada solo con la programación cargada; no consulta otro endpoint.
const obtenerPreferenciasCliente = (registros, catalogo) => {
  const canon = (valores) => new Map((valores || []).map((v) => [normalizeUpper(v), v]));
  const transportadoras = canon(catalogo.transportadoras);
  const productos = canon(catalogo.productos);
  const destinos = new Set(catalogo.destinos || []);
  const grupos = new Map();
  for (const r of registros || []) {
    if (normalizeUpper(r?.estado) === "CANCELADO") continue;
    const cliente = normalizeUpper(r?.cliente);
    if (!cliente) continue;
    if (!grupos.has(cliente)) grupos.set(cliente, new Map());
    const campos = grupos.get(cliente);
    const destinoOriginal = String(r?.destino ?? "");
    const cantidad = numericQty(r?.cantidad);
    const datos = {
      transportadora: transportadoras.get(normalizeUpper(r?.transportadora)),
      destino: destinos.has(destinoOriginal) ? destinoOriginal : null,
      producto: productos.get(normalizeUpper(r?.producto)),
      cantidad: cantidad === null ? null : String(cantidad),
    };
    const fecha = `${String(r?.fecha ?? "")} ${String(r?.createdAt ?? "")}`;
    for (const [campo, valor] of Object.entries(datos)) {
      if (!valor) continue;
      if (!campos.has(campo)) campos.set(campo, new Map());
      const contador = campos.get(campo);
      const previo = contador.get(valor) || { valor, repeticiones: 0, ultimaFecha: "" };
      previo.repeticiones++;
      if (fecha > previo.ultimaFecha) previo.ultimaFecha = fecha;
      contador.set(valor, previo);
    }
  }
  const resultado = new Map();
  for (const [cliente, campos] of grupos) {
    const elegidos = {};
    for (const [campo, contador] of campos) {
      const mejor = [...contador.values()].sort((a, b) =>
        b.repeticiones - a.repeticiones ||
        b.ultimaFecha.localeCompare(a.ultimaFecha) ||
        a.valor.localeCompare(b.valor, "es")
      )[0];
      if (mejor) elegidos[campo] = mejor.valor;
    }
    resultado.set(cliente, elegidos);
  }
  return resultado;
};
const ProgramacionDespachoDiariaPage = () => {
  const navigate = useNavigate();
  const { rol } = useAuth();
  const canEditFechaEstimadaEntrega = ["developer", "comercial", "liderlogistica", "torrecontrollogistica"].includes(normalizeText(rol).toLowerCase());
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [programacionSeleccionada, setProgramacionSeleccionada,] = useState(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [search, setSearch] = useState("");   // buscador global
  const [sortOrder, setSortOrder] = useState("desc");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [filters, setFilters] = useState({
    fecha: "",
    fechaEstimadaEntrega: "",
    cliente: "",
    producto: "",
    transportadora: "",
    destino: "",
  });
  const [range, setRange] = useState(() => getDefaultRange());
  const [form, setForm] = useState({
    fecha: "", // ISO YYYY-MM-DD (date picker)
    fechaEstimadaEntrega: "", // ISO YYYY-MM-DD
    placa: "",
    trailer: "",
    conductor: "",
    transportadora: "",
    cliente: "",
    destino: "", // digitables
    producto: "",
    cantidad: "",
    horaProgramada: "",
  });
  const [catalog, setCatalog] = useState({
    placas: [],
    trailers: [],
    conductores: [],
    transportadoras: [],
    clientes: [],
    destinos: DESTINOS_CATALOGO,
    productos: [],
  });
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErrors, setCatalogErrors] = useState([]);
  const [conductoresRelacionados, setConductoresRelacionados] = useState([]);
  const catalogFetchedAt = useRef(0);
  // Una carga de cuatro endpoints por vigencia; la actualización manual fuerza nueva consulta.
  const fetchCatalogs = async (force = false) => {
    if (!force && catalogFetchedAt.current && Date.now() - catalogFetchedAt.current < CATALOG_TTL_MS) return;
    setCatalogLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get(API_CONDUCTORES),
        axios.get(API_CLIENTES, { withCredentials: true }),
        axios.get(API_PRODUCTOS),
        axios.get(API_TRANSPORTADORAS),
      ]);
      const sourceNames = ["conductores", "clientes", "productos", "transportadoras"];
      const errores = results.flatMap((r, i) => r.status === "rejected" ? [sourceNames[i]] : []);
      setCatalogErrors(errores);
      const getData = (idx) => {
        const response = results[idx];
        if (response.status !== "fulfilled") return null;
        const data = response.value.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        errores.push(sourceNames[idx]);
        return null;
      };
      const conductoresData = getData(0);
      const clientesData = getData(1);
      const productosData = getData(2);
      const transportadorasData = getData(3);
      const únicos = (values) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
      if (conductoresData !== null) setConductoresRelacionados(conductoresData);
      setCatalog((prev) => ({
        ...prev,
        placas: conductoresData === null ? prev.placas : únicos(conductoresData.map((c) => normalizePlate(c?.placaVehiculo))),
        trailers: conductoresData === null ? prev.trailers : únicos(conductoresData.map((c) => normalizeText(c?.carroseria))),
        conductores: conductoresData === null ? prev.conductores : únicos(conductoresData.map((c) => normalizeText(`${c?.nombres ?? ""} ${c?.apellidos ?? ""}`))),
        clientes: clientesData === null ? prev.clientes : únicos(clientesData.map((c) => normalizeText(c?.cliente))),
        productos: productosData === null ? prev.productos : únicos(productosData.map((p) => normalizeText(p?.tipoProducto))),
        transportadoras: transportadorasData === null ? prev.transportadoras : únicos(transportadorasData.map((t) => normalizeText(t?.nombreTransportadora))),
        destinos: DESTINOS_CATALOGO,
      }));
      // No considerar vigente una respuesta parcial; permite intentar nuevamente al guardar o actualizar.
      if (!errores.length) catalogFetchedAt.current = Date.now();
      if (errores.length) console.warn("Catálogos no disponibles:", errores);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      setCatalogErrors(["conductores", "clientes", "productos", "transportadoras"]);
    } finally {
      setCatalogLoading(false);
    }
  };
  const fetchProgramacion = async (customRange) => {
    try {
      const effective = customRange ?? range ?? getDefaultRange();
      const from = normalizeText(effective.from);
      const to = normalizeText(effective.to);
      const res = await axios.get(`${API_URL}/rango`, {
        params: { from, to },
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
    } catch (error) {
      console.error("Error al obtener programaciones:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: getApiErrorMessage(error) || "No se pudieron cargar las programaciones.",
      });
      setRows([]);
    }
  };
  useEffect(() => {
    fetchCatalogs();
    fetchProgramacion(getDefaultRange());
  }, []);
  const options = useMemo(() => {
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const safe = rows ?? [];
    return {
      fechas: uniq(safe.map((r) => normalizeText(r.fecha))).filter((f) => isValidDateISO(f)),
      fechasEstimadasEntrega: uniq(safe.map((r) => normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega)))
        .sort((a, b) => {
          if (a === "NA") return -1;
          if (b === "NA") return 1;
          return a.localeCompare(b);
        }),
      clientes: uniq(safe.map((r) => normalizeText(r.cliente))),
      productos: uniq(safe.map((r) => normalizeText(r.producto))),
      transportadoras: uniq(safe.map((r) => normalizeText(r.transportadora))),
      destinos: uniq(safe.map((r) => r.destino).filter((destino) => typeof destino === "string")).sort((a, b) => a.localeCompare(b, "es")),
    };
  }, [rows]);
  const handleOpenCreateModal = () => {
    resetForm();
    setFormModalOpen(true);
  };
  const handleCloseFormModal = () => {
    resetForm();
    setFormModalOpen(false);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const resetForm = () => {
    setForm({
      fecha: "",
      fechaEstimadaEntrega: "",
      placa: "",
      trailer: "",
      conductor: "",
      transportadora: "",
      cliente: "",
      destino: "",
      producto: "",
      cantidad: "",
      horaProgramada: "",
    });
    setEditingId(null);
  };
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const clearFilters = () => {
    setFilters({
      fecha: "",
      fechaEstimadaEntrega: "",
      cliente: "",
      producto: "",
      transportadora: "",
      destino: "",
    });
    setSearch("");
  };
  const handleRangeChange = (e) => {
    setRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleApplyRange = async () => {
    const from = normalizeText(range.from);
    const to = normalizeText(range.to);
    if (from && !isValidDateISO(from)) {
      await Swal.fire({
        icon: "warning",
        title: "Desde inválido",
        text: 'La fecha "Desde" debe ser YYYY-MM-DD.',
      });
      return;
    }
    if (to && !isValidDateISO(to)) {
      await Swal.fire({
        icon: "warning",
        title: "Hasta inválido",
        text: 'La fecha "Hasta" debe ser YYYY-MM-DD.',
      });
      return;
    }
    if (from && to && from > to) {
      await Swal.fire({
        icon: "warning",
        title: "Rango inválido",
        text: '"Desde" no puede ser mayor que "Hasta".',
      });
      return;
    }
    Swal.fire({
      title: "Filtrando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await fetchProgramacion({ from, to });
      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Consulta por rango aplicada.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.close();
    }
  };
  const handleResetRangeToDefault = async () => {
    const def = getDefaultRange();
    setRange(def);
    Swal.fire({
      title: "Cargando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await fetchProgramacion(def);
      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Rango por defecto aplicado (mes actual y anterior).",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.close();
    }
  };
  const validatePayload = async (payload) => {
    if (!payload.fecha || !isValidDateISO(payload.fecha)) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha inválida",
        text: 'La fecha debe tener formato "YYYY-MM-DD".',
      });
      return false;
    }
    if (!isValidFechaEstimadaEntrega(payload.fechaEstimadaEntrega)) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha estimada inválida",
        text: 'La fecha estimada de entrega debe ser "NA" o tener formato "YYYY-MM-DD HH:mm".',
      });
      return false;
    }
    if (!payload.cliente) {
      await Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "Debes diligenciar Cliente.",
      });
      return false;
    }
    if (!payload.producto) {
      await Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "Debes diligenciar Producto.",
      });
      return false;
    }
    if (!payload.destino) {
      await Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "Debes diligenciar Destino.",
      });
      return false;
    }
    if (!DESTINOS_CATALOGO.includes(payload.destino)) {
      await Swal.fire({
        icon: "warning",
        title: "Destino no válido",
        text: "Debes seleccionar un destino del catálogo.",
      });
      return false;
    }
    const qty = Number(payload.cantidad);
    if (!payload.cantidad || Number.isNaN(qty) || qty <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser un número mayor a 0.",
      });
      return false;
    }
    if (payload.placa && normalizePlate(payload.placa).length < 5) {
      await Swal.fire({
        icon: "warning",
        title: "Placa inválida",
        text: "Verifica la placa (muy corta).",
      });
      return false;
    }
    return true;
  };
  const handleSubmit = async () => {
    try {
      const payload = {
        fecha: normalizeText(form.fecha), // <- YYYY-MM-DD del date picker
        horaProgramada: normalizeText(form.horaProgramada),
        placa: normalizeText(form.placa),
        trailer: normalizeText(form.trailer),
        conductor: normalizeText(form.conductor),
        transportadora: normalizeText(form.transportadora),
        cliente: normalizeText(form.cliente),
        destino: form.destino,
        producto: normalizeText(form.producto),
        cantidad: Number(normalizeText(form.cantidad)),
      };
      if (canEditFechaEstimadaEntrega) {
        payload.fechaEstimadaEntrega = normalizeFechaEstimadaEntrega(
          form.fechaEstimadaEntrega
        );
      }
      const ok = await validatePayload(payload);
      if (!ok) return;
      Swal.fire({
        title: editingId ? "Actualizando..." : "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post(API_URL, payload, { withCredentials: true });
      }
      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: editingId
          ? "Programación actualizada correctamente."
          : "Programación registrada correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
      resetForm();
      setFormModalOpen(false);
      await fetchProgramacion(range);
      fetchCatalogs();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar programación:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };
  const handleEdit = (item) => {
    setForm({
      fecha: item.fecha ?? "",
      fechaEstimadaEntrega: displayFechaEstimadaEntrega(item.fechaEstimadaEntrega),
      horaProgramada: item.horaProgramada ?? "",
      placa: item.placa ?? "",
      trailer: item.trailer ?? "",
      conductor: item.conductor ?? "",
      transportadora: item.transportadora ?? "",
      cliente: item.cliente ?? "",
      destino: item.destino ?? "",
      producto: item.producto ?? "",
      cantidad: String(item.cantidad ?? ""),
    });
    setEditingId(item._id);
    setFormModalOpen(true);
  };
  const handleOpenEstadoModal = (item) => {
    setProgramacionSeleccionada(item);
    setEstadoModalOpen(true);
  };
  const handleCloseEstadoModal = () => {
    if (guardandoEstado) return;
    setEstadoModalOpen(false);
    setProgramacionSeleccionada(null);
  };
  const handleSaveEstado = async ({ estado, observacionesEstado }) => {
    if (!programacionSeleccionada?._id) {
      Swal.fire({
        icon: "warning",
        title: "Programación no seleccionada",
        text: "No se encontró la programación que deseas actualizar.",
      });
      return;
    }
    try {
      setGuardandoEstado(true);
      const payload = {
        estado: normalizeText(estado).toUpperCase(),
        observacionesEstado: normalizeText(observacionesEstado),
      };
      const response = await axios.patch(
        `${API_URL}/${programacionSeleccionada._id}/estado`,
        payload,
        { withCredentials: true }
      );
      const responseData = response?.data?.data ?? response?.data ?? {};
      setRows((prevRows) =>
        prevRows.map((row) =>
          row._id === programacionSeleccionada._id
            ? {
              ...row,
              ...responseData,
              estado: responseData?.estado ?? payload.estado,
              observacionesEstado:
                responseData?.observacionesEstado ?? payload.observacionesEstado,
            }
            : row
        )
      );
      setEstadoModalOpen(false);
      setProgramacionSeleccionada(null);
      await Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: "El estado de la programación fue actualizado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error actualizando estado de programación:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: getApiErrorMessage(error),
      });
    } finally {
      setGuardandoEstado(false);
    }
  };
  const handleDelete = async (id) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar programación?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
      });
      if (!confirm.isConfirmed) return;
      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "Programación eliminada correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });
      if (editingId === id) resetForm();
      await fetchProgramacion(range);
      fetchCatalogs();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar programación:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(error),
      });
    }
  };
  const rowsFiltrados = useMemo(() => {
    const safe = rows ?? [];
    const fFecha = normalizeText(filters.fecha);
    const fFechaEstimadaEntrega = normalizeFechaEstimadaEntrega(filters.fechaEstimadaEntrega);
    const fCliente = normalizeText(filters.cliente);
    const fProducto = normalizeText(filters.producto);
    const fTransportadora = normalizeText(filters.transportadora);
    const fDestino = filters.destino;
    let out = [...safe];
    if (fFecha) out = out.filter((r) => normalizeText(r.fecha) === fFecha);
    if (filters.fechaEstimadaEntrega) {
      out = out.filter(
        (r) =>
          normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega) ===
          fFechaEstimadaEntrega
      );
    }
    if (fCliente) out = out.filter((r) => normalizeText(r.cliente) === fCliente);
    if (fProducto) out = out.filter((r) => normalizeText(r.producto) === fProducto);
    if (fTransportadora) {
      out = out.filter((r) => normalizeText(r.transportadora) === fTransportadora);
    }
    if (fDestino) {
      out = out.filter(
        (r) => r.destino === fDestino
      );
    }
    const q = normalizeText(debouncedSearch).toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const fecha = normalizeText(r.fecha).toLowerCase();
        const fechaEstimadaEntrega = normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega).toLowerCase();
        const placa = normalizeText(r.placa).toLowerCase();
        const trailer = normalizeText(r.trailer).toLowerCase();
        const conductor = normalizeText(r.conductor).toLowerCase();
        const transportadora = normalizeText(r.transportadora).toLowerCase();
        const cliente = normalizeText(r.cliente).toLowerCase();
        const destino = normalizeText(r.destino).toLowerCase();
        const producto = normalizeText(r.producto).toLowerCase();
        const cantidad = String(r.cantidad ?? "").toLowerCase();
        return (
          fecha.includes(q) ||
          fechaEstimadaEntrega.includes(q) ||
          placa.includes(q) ||
          trailer.includes(q) ||
          conductor.includes(q) ||
          transportadora.includes(q) ||
          cliente.includes(q) ||
          destino.includes(q) ||
          producto.includes(q) ||
          cantidad.includes(q)
        );
      });
    }
    out.sort((a, b) => {
      const fechaA = normalizeText(a.fecha);
      const fechaB = normalizeText(b.fecha);
      if (fechaA !== fechaB) {
        return sortOrder === "desc"
          ? fechaB.localeCompare(fechaA)
          : fechaA.localeCompare(fechaB);
      }
      const createdA = normalizeText(a.createdAt);
      const createdB = normalizeText(b.createdAt);
      return sortOrder === "desc"
        ? createdB.localeCompare(createdA)
        : createdA.localeCompare(createdB);
    });
    return out;
  }, [rows, filters, debouncedSearch, sortOrder]);
  const copiarTablaPortapapeles = async () => {
    try {
      const headers = [
        "Fecha",
        "Fecha Estimada Entrega",
        "Hora",
        "Placa",
        "Trailer",
        "Conductor",
        "Transportadora",
        "Cliente",
        "Destino",
        "Producto",
        "Cantidad",
        "Checked",
      ];
      const rows = rowsFiltrados.map((r) => [
        normalizeText(r.fecha),
        normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega) === "NA" ? "Pendiente" : normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega),
        normalizeText(r.horaProgramada),
        normalizeText(r.placa),
        normalizeText(r.trailer),
        normalizeText(r.conductor),
        normalizeText(r.transportadora),
        normalizeText(r.cliente),
        String(r.destino ?? ""),
        normalizeText(r.producto),
        String(r.cantidad ?? ""),
        r?.cumplido ? "SI" : "NO",
      ]);
      const texto =
        headers.join("\t") +
        "\n" +
        rows.map((r) => r.join("\t")).join("\n");
      await navigator.clipboard.writeText(texto);
      Swal.fire({
        icon: "success",
        title: "Tabla copiada",
        text: "Puedes pegarla directamente en Excel",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
    }
  };
  const total = rows.length;
  const filtrados = rowsFiltrados.length;
  const totalCantidad = useMemo(() => {
    return (rows ?? []).reduce((acc, r) => acc + Number(r?.cantidad ?? 0), 0);
  }, [rows]);
  const filtradoCantidad = useMemo(() => {
    return (rowsFiltrados ?? []).reduce((acc, r) => acc + Number(r?.cantidad ?? 0), 0);
  }, [rowsFiltrados]);
  const kpiPorDia = useMemo(() => {
    const m = new Map();
    for (const r of rowsFiltrados ?? []) {
      const f = normalizeText(r.fecha);
      if (!isValidDateISO(f)) continue;
      const prev = m.get(f) || {
        fecha: f,
        viajes: 0,
        cantidad: 0,
      };
      prev.viajes += 1;
      prev.cantidad += Number(r?.cantidad ?? 0);
      m.set(f, prev);
    }
    return Array.from(m.entries())
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 8) // últimos 5 días
      .map(([, v]) => v)
      .reverse();
  }, [rowsFiltrados]);
  const top10Dias = kpiPorDia.slice(0, 10);
  const hasAnyFilter =
    !!debouncedSearch ||
    !!filters.fecha ||
    !!filters.fechaEstimadaEntrega ||
    !!filters.cliente ||
    !!filters.producto ||
    !!filters.transportadora ||
    !!filters.destino;

  const localCounter = useRef(DEFAULT_BLANK_ROWS);
  const newRow = useCallback(() => ({ __blankId: `excel-new-${localCounter.current++}` }), []);
  const [blankRows, setBlankRows] = useState(() => Array.from({ length: DEFAULT_BLANK_ROWS }, (_, i) => ({ __blankId: `excel-new-${i}` })));
  const [bottomRows, setBottomRows] = useState([]);
  const [changes, setChanges] = useState({});
  const [active, setActive] = useState({ r: 0, c: 0 });
  const [selection, setSelection] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const dragged = useRef(false);
  const mousePressedCell = useRef(null);
  const movedDuringDrag = useRef(false);
  const anchor = useRef({ r: 0, c: 0 });
  const scrollViewportRef = useRef(null);
  const scrollFrame = useRef(null);
  const lastScrollTop = useRef(0);
  const lastHovered = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const editStart = useRef(null);
  const editValue = useRef("");
  const editHandled = useRef(false);
  const byId = useMemo(() => new Map(rows.map((r) => [String(r._id), r])), [rows]);
  const view = useMemo(() => [
    ...blankRows.map((r) => ({ ...r, __gridKey: r.__blankId, __isNew: true })),
    ...rowsFiltrados.map((r) => ({ ...r, ...(changes[String(r._id)] || {}), __gridKey: String(r._id), __isNew: false })),
    ...bottomRows.map((r) => ({ ...r, __gridKey: r.__blankId, __isNew: true })),
  ], [blankRows, bottomRows, rowsFiltrados, changes]);
  const pendingNew = [...blankRows, ...bottomRows].filter(hasContent).length;
  const pendingExisting = Object.keys(changes).length;
  const dirtyCount = pendingNew + pendingExisting;
  // El cálculo de la vista virtual solo usa la posición actual. Todas las filas
  const firstVisible = Math.max(0, Math.min(Math.max(0, view.length - EXCEL_RENDER_COUNT), Math.floor(scrollPosition / EXCEL_ROW_HEIGHT) - EXCEL_OVERSCAN));
  const lastVisible = Math.min(view.length, firstVisible + EXCEL_RENDER_COUNT);
  const visibleRows = view.slice(firstVisible, lastVisible);
  const spacerTop = firstVisible * EXCEL_ROW_HEIGHT;
  const spacerBottom = (view.length - lastVisible) * EXCEL_ROW_HEIGHT;
  const catalogDataLists = useMemo(() => FIELDS.map(({ key }) => {
    const list = optionsFor(catalog, key);
    return list.length ? (
      <datalist id={`excel-options-${key}`} key={key}>
        {list.map((v, i) => <option key={`${i}-${v}`} value={v} />)}
      </datalist>
    ) : null;
  }), [catalog]);
  useEffect(() => {
    if (!dirtyCount) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyCount]);
  // Filas de captura SIEMPRE arriba: libres primero, registros nuevos después.
  useLayoutEffect(() => {
    if (editing || saving) return; // No mover la fila mientras se digita o guarda.
    const libres = blankRows.filter((r) => !hasContent(r));
    const diligenciadas = blankRows.filter(hasContent);
    const faltantes = Math.max(0, DEFAULT_BLANK_ROWS - libres.length);
    const ordenCorrecto = [...libres, ...diligenciadas];
    if (!faltantes && ordenCorrecto.every((r, i) => r.__blankId === blankRows[i]?.__blankId)) return;
    const actualizadas = [...Array.from({ length: faltantes }, newRow), ...ordenCorrecto];
    const indicePorId = new Map(actualizadas.map((r, i) => [r.__blankId, i]));
    const desplazamiento = actualizadas.length - blankRows.length;
    const recolocar = (pos) => {
      if (!pos) return pos;
      const origen = view[pos.r];
      const nuevoIndice = origen?.__isNew && indicePorId.has(origen.__gridKey)
        ? indicePorId.get(origen.__gridKey)
        : pos.r >= blankRows.length ? pos.r + desplazamiento : pos.r;
      return nuevoIndice === pos.r ? pos : { ...pos, r: nuevoIndice };
    };
    setActive((prev) => recolocar(prev));
    setSelection((prev) => prev ? { a: recolocar(prev.a), b: recolocar(prev.b) } : prev);
    anchor.current = recolocar(anchor.current);
    dragged.current = false;
    lastHovered.current = null;
    mousePressedCell.current = null;
    setBlankRows(actualizadas);
  }, [blankRows, editing, saving, newRow, view]);
  const isEditAllowed = (key) => key !== "fechaEstimadaEntrega" || canEditFechaEstimadaEntrega;
  useEffect(() => {
    const stop = () => { dragged.current = false; mousePressedCell.current = null; };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);
  const focusCell = (r, c) => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      const rowTop = r * EXCEL_ROW_HEIGHT;
      const rowBottom = rowTop + EXCEL_ROW_HEIGHT;
      let nextTop = viewport.scrollTop;
      if (rowTop < nextTop + EXCEL_HEADER_HEIGHT) nextTop = Math.max(0, rowTop - EXCEL_HEADER_HEIGHT);
      else if (rowBottom > nextTop + viewport.clientHeight) {
        nextTop = Math.max(0, rowBottom - viewport.clientHeight);
      }
      if (nextTop !== viewport.scrollTop) viewport.scrollTop = nextTop;
      setScrollPosition((prev) => prev === viewport.scrollTop ? prev : viewport.scrollTop);
    }
    const tryFocus = (attempts = 2) => window.requestAnimationFrame(() => {
      const cell = scrollViewportRef.current?.querySelector(`[data-excel-cell="${r}:${c}"]`);
      if (cell) cell.focus({ preventScroll: true });
      else if (attempts > 0) tryFocus(attempts - 1);
    });
    tryFocus();
  };
  const handleGridScroll = (event) => {
    lastScrollTop.current = event.currentTarget.scrollTop;
    const nextFirst = Math.max(0, Math.min(Math.max(0, view.length - EXCEL_RENDER_COUNT), Math.floor(lastScrollTop.current / EXCEL_ROW_HEIGHT) - EXCEL_OVERSCAN));
    if (editing && (active.r < nextFirst || active.r >= nextFirst + EXCEL_RENDER_COUNT)) {
      commitEditor();
      setEditing(null);
    }
    if (scrollFrame.current !== null) return;
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null;
      const top = lastScrollTop.current;
      setScrollPosition((prev) => Math.floor(prev / EXCEL_ROW_HEIGHT) === Math.floor(top / EXCEL_ROW_HEIGHT) ? prev : top);
    });
  };
  useEffect(() => () => {
    if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
  }, []);
  useEffect(() => {
    if (scrollViewportRef.current) scrollViewportRef.current.scrollTop = 0;
    setScrollPosition(0);
    lastHovered.current = null;
  }, [range, filters, debouncedSearch, sortOrder]);
  const conductorIndices = useMemo(() => {
    const placa = new Map();
    const conductor = new Map();
    conductoresRelacionados.forEach((registro) => {
      const nombre = normalizeText(`${registro?.nombres ?? ""} ${registro?.apellidos ?? ""}`);
      const vehiculo = normalizePlate(registro?.placaVehiculo);
      const remolque = normalizeText(registro?.carroseria);
      const rawEmpresa = registro?.nombreTransportadora ?? registro?.transportadora?.nombreTransportadora ?? registro?.transportadora?.nombre ?? registro?.transportadora;
      const empresa = typeof rawEmpresa === "string" ? normalizeText(rawEmpresa) : "";
      if (!nombre && !vehiculo) return;
      const vinculo = { placa: vehiculo, conductor: nombre, trailer: remolque, transportadora: empresa };
      if (vehiculo) {
        if (!placa.has(vehiculo)) placa.set(vehiculo, []);
        placa.get(vehiculo).push(vinculo);
      }
      if (nombre) {
        const nombreClave = normalizeUpper(nombre);
        if (!conductor.has(nombreClave)) conductor.set(nombreClave, []);
        conductor.get(nombreClave).push(vinculo);
      }
    });
    return { placa, conductor };
  }, [conductoresRelacionados]);
  const preferenciasCliente = useMemo(
    () => obtenerPreferenciasCliente(rows, catalog),
    [rows, catalog]
  );
  const camposFrecuentesCliente = useCallback(
    (cliente) => preferenciasCliente.get(normalizeUpper(cliente)) || {},
    [preferenciasCliente]
  );
  const camposRelacionados = useCallback((item, field, value) => {
    if (field !== "placa" && field !== "conductor") return {};
    const clave = field === "placa" ? normalizePlate(value) : normalizeUpper(value);
    let candidatos = conductorIndices[field].get(clave) || [];
    if (!candidatos.length) return {};
    const otro = field === "placa" ? "conductor" : "placa";
    const valorActual = otro === "placa" ? normalizePlate(item?.placa) : normalizeUpper(item?.conductor);
    if (valorActual && candidatos.length > 1) {
      const compatibles = candidatos.filter((c) => (otro === "placa" ? normalizePlate(c[otro]) : normalizeUpper(c[otro])) === valorActual);
      if (compatibles.length) candidatos = compatibles;
    }
    const completados = {};
    for (const campo of ["placa", "conductor", "trailer", "transportadora"]) {
      if (campo === field) continue;
      const distintos = new Map();
      for (const opcion of candidatos) {
        const dato = normalizeText(opcion[campo]);
        if (dato) distintos.set(normalizeUpper(dato), dato);
      }
      if (distintos.size === 1) completados[campo] = [...distintos.values()][0];
    }
    return completados;
  }, [conductorIndices]);
  const changeCell = useCallback((item, field, value, relacionados = {}) => {
    if (!item || !isEditAllowed(field)) return;
    // Las asociaciones automáticas solo aplican a filas nuevas.
    const valores = item.__isNew ? { ...relacionados, [field]: value } : { [field]: value };
    if (item.__isNew) {
      const updater = (prev) => prev.map((r) => r.__blankId === item.__gridKey ? { ...r, ...valores } : r);
      if (blankRows.some((r) => r.__blankId === item.__gridKey)) setBlankRows(updater);
      else setBottomRows(updater);
      return;
    }
    const original = byId.get(item.__gridKey);
    if (!original) return;
    setChanges((prev) => {
      const patch = { ...(prev[item.__gridKey] || {}) };
      Object.entries(valores).forEach(([campo, dato]) => {
        if (String(original[campo] ?? "") === String(dato ?? "")) delete patch[campo];
        else patch[campo] = dato;
      });
      const out = { ...prev };
      if (Object.keys(patch).length) out[item.__gridKey] = patch;
      else delete out[item.__gridKey];
      return out;
    });
  }, [blankRows, byId, canEditFechaEstimadaEntrega]);
  const discard = async () => {
    if (!dirtyCount || saving) return;
    const confirm = await Swal.fire({ icon: "warning", title: "¿Descartar cambios?", text: "Se perderán las modificaciones que aún no estén guardadas.", showCancelButton: true, confirmButtonText: "Descartar", cancelButtonText: "Volver" });
    if (!confirm.isConfirmed) return;
    setBlankRows(Array.from({ length: DEFAULT_BLANK_ROWS }, newRow));
    setBottomRows([]);
    setChanges({}); setEditing(null); setSelection(null);
  };
  const putAt = (item, field, value) => {
    if (!item || !isEditAllowed(field)) return;
    if (!item.__isNew) {
      // Registro de MongoDB: modificar exclusivamente la celda elegida.
      changeCell(item, field, value);
      return;
    }
    const relacionados = field === "cliente"
      ? normalizeUpper(item?.cliente) === normalizeUpper(value) ? {} : camposFrecuentesCliente(value)
      : camposRelacionados(item, field, value);
    changeCell(item, field, value, relacionados);
  };
  const selectCell = (e, r, c) => {
    if (saving) return;
    if (editing) { commitEditor(); setEditing(null); }
    const next = { r, c };
    if (e.shiftKey) setSelection({ a: anchor.current, b: next });
    else { anchor.current = next; setSelection({ a: next, b: next }); }
    setActive(next); dragged.current = true;
    focusCell(r, c);
  };
  const hoverCell = (r, c) => {
    if (!dragged.current || editing || saving) return;
    if (mousePressedCell.current &&
      (mousePressedCell.current.r !== r || mousePressedCell.current.c !== c)) {
      movedDuringDrag.current = true;
    }
    const last = lastHovered.current;
    if (last?.r === r && last?.c === c) return;
    lastHovered.current = { r, c };
    setSelection((prev) => {
      if (prev?.b?.r === r && prev?.b?.c === c) return prev;
      return { a: anchor.current, b: { r, c } };
    });
    setActive((prev) => prev.r === r && prev.c === c ? prev : { r, c });
  };
  const editCell = (r, c, seed) => {
    const col = FIELDS[c]; const item = view[r];
    if (!col || !item || !isEditAllowed(col.key) || saving) return;
    editStart.current = asCell(item, col.key);
    editValue.current = seed !== undefined ? seed : editStart.current;
    editHandled.current = false;
    setEditing(`${r}:${c}`); setActive({ r, c });
    setSelection({ a: { r, c }, b: { r, c } });
  };
  const commitEditor = () => {
    if (!editing || editHandled.current) return;
    editHandled.current = true;
    const row = view[active.r];
    const col = FIELDS[active.c];
    if (row && col) putAt(row, col.key, editValue.current);
  };
  const move = (r, c) => {
    let rr = r; let cc = c;
    if (cc >= FIELDS.length) { rr += 1; cc = 0; }
    if (cc < 0) { rr -= 1; cc = FIELDS.length - 1; }
    if (rr >= view.length) { setBottomRows((prev) => [...prev, newRow()]); }
    const nextR = Math.max(0, Math.min(view.length, rr));
    const nextC = Math.max(0, Math.min(FIELDS.length - 1, cc));
    setEditing(null);
    setActive({ r: nextR, c: nextC });
    anchor.current = { r: nextR, c: nextC };
    setSelection({ a: anchor.current, b: anchor.current });
    focusCell(nextR, nextC);
  };
  const selectedRect = selection ? rect(selection.a, selection.b) : rect(active, active);
  const inSelection = (r, c) => r >= selectedRect.top && r <= selectedRect.bottom && c >= selectedRect.left && c <= selectedRect.right;
  const selectedTSV = () => {
    const out = [];
    for (let r = selectedRect.top; r <= selectedRect.bottom; r++) {
      const record = view[r]; if (!record) continue;
      const values = [];
      for (let c = selectedRect.left; c <= selectedRect.right; c++) values.push(asCell(record, FIELDS[c].key));
      out.push(values.join("\t"));
    }
    return out.join("\r\n");
  };
  const handleCopy = (event) => {
    if (saving || editing) return;
    if (!view.length) return;
    event.preventDefault();
    event.clipboardData.setData("text/plain", selectedTSV());
  };
  const copySelection = async () => {
    try { await navigator.clipboard.writeText(selectedTSV()); }
    catch { Swal.fire("Portapapeles bloqueado", "Usa Ctrl+C sobre las celdas seleccionadas.", "info"); }
  };
  const pasteMatrix = (matrix) => {
    if (!matrix.length || saving || !view.length) return;
    if (matrix.length > MAX_PASTE_ROWS) {
      Swal.fire("Bloque muy grande", `Puedes pegar hasta ${MAX_PASTE_ROWS} filas por operación.`, "warning");
      return;
    }
    const start = selection?.a || active;
    let nextTop = [...blankRows], nextBottom = [...bottomRows];
    if (start.r < blankRows.length) {
      const needed = start.r + matrix.length - blankRows.length;
      if (needed > 0) nextTop.push(...Array.from({ length: needed }, newRow));
    } else {
      const needed = start.r + matrix.length - (blankRows.length + rowsFiltrados.length + bottomRows.length);
      if (needed > 0) nextBottom.push(...Array.from({ length: needed }, newRow));
    }
    const updatedView = [
      ...nextTop.map((r) => ({ ...r, __gridKey: r.__blankId, __isNew: true })),
      ...rowsFiltrados.map((r) => ({ ...r, ...(changes[String(r._id)] || {}), __gridKey: String(r._id), __isNew: false })),
      ...nextBottom.map((r) => ({ ...r, __gridKey: r.__blankId, __isNew: true })),
    ];
    const localChanges = { ...changes };
    const localTop = new Map(nextTop.map((r) => [r.__blankId, { ...r }]));
    const localBottom = new Map(nextBottom.map((r) => [r.__blankId, { ...r }]));
    const pegadosPorFila = new Map();
    matrix.forEach((line, i) => line.forEach((text, j) => {
      const colIndex = start.c + j;
      const item = updatedView[start.r + i];
      const col = FIELDS[colIndex];
      if (!item || !col || !isEditAllowed(col.key)) return;
      if (!pegadosPorFila.has(item.__gridKey)) pegadosPorFila.set(item.__gridKey, { item, campos: new Set() });
      pegadosPorFila.get(item.__gridKey).campos.add(col.key);
      if (item.__isNew) {
        const target = localTop.get(item.__gridKey) || localBottom.get(item.__gridKey);
        target[col.key] = text;
      } else {
        const original = byId.get(item.__gridKey);
        if (!original) return;
        const patch = { ...(localChanges[item.__gridKey] || {}) };
        if (String(original[col.key] ?? "") === String(text)) delete patch[col.key];
        else patch[col.key] = text;
        if (Object.keys(patch).length) localChanges[item.__gridKey] = patch;
        else delete localChanges[item.__gridKey];
      }
    }));
    // El pegado en registros históricos modifica solo las columnas explícitamente pegadas.
    // El autocompletado de columnas restantes es exclusivo de filas nuevas.
    pegadosPorFila.forEach(({ item, campos: camposPegados }, id) => {
      if (!item.__isNew) return;
      const selector = camposPegados.has("placa") ? "placa" : camposPegados.has("conductor") ? "conductor" : null;
      if (!selector && !camposPegados.has("cliente")) return;
      const local = localTop.get(id) || localBottom.get(id);
      if (!local) return;
      const habituales = camposPegados.has("cliente") ? camposFrecuentesCliente(local.cliente) : {};
      const vehiculo = selector ? camposRelacionados(local, selector, local[selector]) : {};
      Object.entries({ ...habituales, ...vehiculo }).forEach(([campo, dato]) => {
        if (!camposPegados.has(campo)) local[campo] = dato;
      });
    });
    setBlankRows(nextTop.map((r) => localTop.get(r.__blankId)));
    setBottomRows(nextBottom.map((r) => localBottom.get(r.__blankId)));
    setChanges(localChanges);
    setEditing(null);
    setSelection({ a: start, b: { r: start.r + matrix.length - 1, c: Math.min(FIELDS.length - 1, start.c + Math.max(...matrix.map((r) => r.length), 1) - 1) } });
  };
  const handlePaste = (event) => {
    if (saving) return;
    const content = event.clipboardData.getData("text/plain");
    if (!content) return;
    if (editing && !/[\t\r\n]/.test(content)) return;
    event.preventDefault();
    if (editing) editHandled.current = true;
    pasteMatrix(parseTSV(content));
  };
  const clearSelected = () => {
    const r = selectedRect;
    const updates = [];
    for (let i = r.top; i <= r.bottom; i++) for (let j = r.left; j <= r.right; j++) {
      const item = view[i]; if (item && isEditAllowed(FIELDS[j].key)) updates.push([item, FIELDS[j].key]);
    }
    const nextTop = blankRows.map((x) => ({ ...x }));
    const nextBottom = bottomRows.map((x) => ({ ...x }));
    const nextChanges = { ...changes };
    for (const [item, key] of updates) {
      if (item.__isNew) {
        const a = nextTop.find((x) => x.__blankId === item.__gridKey) || nextBottom.find((x) => x.__blankId === item.__gridKey);
        if (a) a[key] = "";
      } else {
        const original = byId.get(item.__gridKey);
        if (!original) continue;
        const patch = { ...(nextChanges[item.__gridKey] || {}) };
        if (!normalize(original[key])) delete patch[key]; else patch[key] = "";
        if (Object.keys(patch).length) nextChanges[item.__gridKey] = patch;
        else delete nextChanges[item.__gridKey];
      }
    }
    setBlankRows(nextTop); setBottomRows(nextBottom); setChanges(nextChanges);
  };
  const handleKeyDown = (e) => {
    if (saving) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!editing && e.shiftKey && (e.code === "Space" || e.key === " ")) {
      e.preventDefault();
      setSelection({ a: { r: active.r, c: 0 }, b: { r: active.r, c: FIELDS.length - 1 } });
      return;
    }
    if (editing) {
      if (e.key === "Escape") {
        e.preventDefault();
        editHandled.current = true;
        setEditing(null); focusCell(active.r, active.c);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        commitEditor();
        move(active.r + (e.key === "Enter" ? (e.shiftKey ? -1 : 1) : 0), active.c + (e.key === "Tab" ? (e.shiftKey ? -1 : 1) : 0));
      }
      return;
    }
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
      const deltas = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], Tab: [0, e.shiftKey ? -1 : 1] };
      const [dr, dc] = deltas[e.key];
      if (e.shiftKey && e.key !== "Tab") {
        const next = { r: Math.max(0, Math.min(view.length - 1, active.r + dr)), c: Math.max(0, Math.min(FIELDS.length - 1, active.c + dc)) };
        setActive(next); setSelection({ a: anchor.current, b: next }); focusCell(next.r, next.c);
      } else move(active.r + dr, active.c + dc);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault(); editCell(active.r, active.c);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault(); clearSelected();
    } else if (e.key.length === 1 && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault(); editCell(active.r, active.c, e.key);
    }
  };
  // La única adaptación de entrada es interpretar formatos numéricos copiados de Excel.
  const buildPayload = (item, idx) => {
    const label = item.__isNew ? `Fila nueva ${idx}` : `Registro ${item._id}`;
    const cantidad = numericQty(item.cantidad);
    if (cantidad === null) throw new Error(`${label}: la cantidad debe ser mayor a cero.`);
    const payload = {
      fecha: dateISO(item.fecha) || normalize(item.fecha),
      horaProgramada: normalize(item.horaProgramada),
      placa: normalize(item.placa),
      trailer: normalize(item.trailer),
      conductor: normalize(item.conductor),
      transportadora: normalize(item.transportadora),
      cliente: normalize(item.cliente),
      destino: item.destino ?? "",
      producto: normalize(item.producto),
      cantidad,
    };
    if (canEditFechaEstimadaEntrega) {
      const est = dateTime(item.fechaEstimadaEntrega);
      if (est === null) throw new Error(`${label}: formato de fecha estimada no válido.`);
      payload.fechaEstimadaEntrega = est;
    }
    return payload;
  };
  const saveAll = async () => {
    if (!dirtyCount || saving) return;
    const newEntries = [...blankRows, ...bottomRows].filter(hasContent);
    let oldEntries = [];
    let jobs;
    try {
      oldEntries = Object.entries(changes).map(([id, patch]) => {
        const original = byId.get(id);
        if (!original) throw new Error(`No se encontró el registro ${id} en el rango cargado. Actualiza la consulta antes de guardar.`);
        return { ...original, ...patch };
      });
      jobs = [
        ...newEntries.map((row, i) => ({ id: row.__blankId, type: "new", payload: buildPayload(row, i + 1) })),
        ...oldEntries.map((row, i) => ({ id: String(row._id), type: "existing", payload: buildPayload(row, i + 1) })),
      ];
    } catch (err) { Swal.fire({ icon: "warning", title: "Revisar datos", text: err.message }); return; }
    // Las filas nuevas deben usar valores oficiales. En las existentes se revisan solo campos editados,
    // para no bloquear correcciones de otros datos por valores históricos ajenos al catálogo.
    for (const job of jobs) {
      const patch = job.type === "existing" ? changes[job.id] || {} : null;
      for (const [campo, [catalogKey, etiqueta]] of Object.entries(CAMPOS_CATALOGO)) {
        if (patch && !Object.prototype.hasOwnProperty.call(patch, campo)) continue;
        const valor = String(job.payload[campo] ?? "").trim();
        if (!valor) continue;
        const opciones = catalog[catalogKey] || [];
        const exacto = opciones.find((op) => op === valor);
        const similar = exacto ?? opciones.find((op) => normalizeUpper(op) === normalizeUpper(valor));
        if (!similar) {
          await Swal.fire({
            icon: "warning", title: `Valor no válido: ${etiqueta}`,
            text: `${job.type === "new" ? "Fila nueva" : "Registro existente"}: «${valor}» no pertenece al catálogo oficial de ${etiqueta.toLowerCase()}. ${!opciones.length ? "El catálogo está vacío o no pudo cargarse; actualízalo antes de guardar." : "Selecciona una opción del catálogo antes de guardar."}`,
          });
          return;
        }
        job.payload[campo] = similar; // Guarda el nombre exactamente como llega del catálogo.
      }
    }
    if (validatePayload) {
      for (const job of jobs) {
        const valido = await validatePayload(job.payload);
        if (!valido) return;
      }
    }
    const ok = await Swal.fire({
      icon: "question", title: "¿Guardar cambios de la tabla?",
      html: `<b>${newEntries.length}</b> programaciones nuevas y <b>${oldEntries.length}</b> actualizaciones.<br/>Los campos de cumplimiento y estado no se modificarán.`,
      showCancelButton: true, confirmButtonText: "Guardar", cancelButtonText: "Revisar",
      confirmButtonColor: "#0B7A5A",
    });
    if (!ok.isConfirmed) return;
    setSaving(true);
    const completedNew = new Set(), completedExisting = new Set();
    let error = null;
    try {
      for (const job of jobs) {
        try {
          if (job.type === "new") {
            await axios.post(API_URL, job.payload, { withCredentials: true });
            completedNew.add(job.id);
          } else {
            await axios.put(`${API_URL}/${job.id}`, job.payload, { withCredentials: true });
            completedExisting.add(job.id);
          }
        } catch (e) { error = e; break; }
      }
      setBlankRows((prev) => {
        const keep = prev.filter((r) => !completedNew.has(r.__blankId));
        const empty = keep.filter((r) => !hasContent(r)).length;
        return [...Array.from({ length: Math.max(0, DEFAULT_BLANK_ROWS - empty) }, newRow), ...keep];
      });
      setBottomRows((prev) => prev.filter((r) => !completedNew.has(r.__blankId)));
      setChanges((prev) => {
        const result = { ...prev }; for (const id of completedExisting) delete result[id]; return result;
      });
      if (completedNew.size + completedExisting.size) {
        await fetchProgramacion(range);
        await fetchCatalogs();
      }
      if (error) {
        Swal.fire({ icon: "warning", title: "Guardado parcial", text: `Se guardaron ${completedNew.size + completedExisting.size} registros. Los restantes permanecen pendientes. Error: ${error?.response?.data?.message || error?.message || "Error de servidor"}` });
      } else {
        Swal.fire({ icon: "success", title: "Programaciones guardadas", text: `${jobs.length} registros procesados correctamente.`, timer: 1900, showConfirmButton: false });
      }
    } finally { setSaving(false); setEditing(null); setSelection(null); setActive({ r: 0, c: 0 }); }
  };
  const removeNew = (id) => {
    setBlankRows((prev) => {
      const next = prev.filter((r) => r.__blankId !== id);
      const emptyCount = next.filter((r) => !hasContent(r)).length;
      return [...Array.from({ length: Math.max(0, DEFAULT_BLANK_ROWS - emptyCount) }, newRow), ...next];
    });
    setBottomRows((prev) => prev.filter((r) => r.__blankId !== id));
    setEditing(null); setSelection(null);
  };
  return (
    <Box p={{ xs: 2, md: 0.5 }} mt={6}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent
          sx={{
            p: 1,
            "&:last-child": { pb: 1 },
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Programación diaria de despachos
              </Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip size="medium" label={`Total Registros: ${total}`} />
                <Chip
                  size="medium"
                  color={hasAnyFilter ? "primary" : "default"}
                  label={`Registros Filtrados: ${filtrados}`}
                />
                <Chip size="medium" label={`Total Volumen: ${formatNumber(totalCantidad)} L`} />
                <Chip
                  size="medium"
                  color={hasAnyFilter ? "success" : "default"}
                  label={`Volumen Filtrado: ${formatNumber(filtradoCantidad)} L`}
                />
                {debouncedSearch && <Chip size="medium" color="secondary" label={`Búsqueda Activa: "${debouncedSearch}"`} />}
                {catalogLoading && <Chip size="medium" color="warning" label="Cargando catálogos..." />}
                {!!catalogErrors.length && <Chip size="medium" color="warning" variant="outlined" label={`Catálogos sin conexión: ${catalogErrors.join(", ")}`} />}
              </Stack>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={handleOpenCreateModal}
                sx={{
                  whiteSpace: "nowrap",
                  bgcolor: "#0B7A5A",
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2,
                  boxShadow: "0 6px 14px rgba(11, 122, 90, 0.28)",
                  "&:hover": {
                    bgcolor: "#09684D",
                    boxShadow: "0 8px 18px rgba(11, 122, 90, 0.35)",
                  },
                }}
              >
                Nueva programación
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                size="small"
                onClick={() => setCargaMasivaOpen(true)}
                sx={{
                  whiteSpace: "nowrap",
                  color: "#0B7A5A",
                  borderColor: "#0B7A5A",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2,
                  "&:hover": {
                    color: "#09684D",
                    borderColor: "#09684D",
                    bgcolor: "rgba(11, 122, 90, 0.06)",
                  },
                }}
              >
                Carga masiva
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<BarChartIcon />}
                size="small"
                onClick={() =>
                  navigate(`/analitica-despachos?from=${range.from}&to=${range.to}`)
                }
                sx={{ whiteSpace: "nowrap" }}
              >
                Analítica BI
              </Button>
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por fecha, fecha estimada, placa, trailer, conductor, transportadora, cliente, destino, producto..."
                size="small"
                sx={{ minWidth: { xs: "100%", md: 520 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearch("")}
                        aria-label="Limpiar búsqueda"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{
              marginTop: 1,
              backgroundColor: "rgba(205, 226, 235, 0.46)",
              borderRadius: 2,
              padding: 0.8,
              marginLeft: 0,
              width: "100%",
            }}
          >
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: { xs: "wrap", md: "nowrap" },
                width: "100%",
              }}
            >
              <TextField
                size="small"
                type="date"
                label="Desde"
                name="from"
                value={range.from}
                onChange={handleRangeChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: { xs: "100%", md: 190 },   // ✅ ancho fijo en desktop
                  maxWidth: { md: 210 },
                  "& input[type='date']::-webkit-calendar-picker-indicator": {
                    filter: "invert(0)", // negro
                    opacity: 1,
                    cursor: "pointer",
                  },
                }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                name="to"
                value={range.to}
                onChange={handleRangeChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: { xs: "100%", md: 190 },
                  maxWidth: { md: 210 },
                  "& input[type='date']::-webkit-calendar-picker-indicator": {
                    filter: "invert(0)", // negro
                    opacity: 1,
                    cursor: "pointer",
                  },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  whiteSpace: "nowrap",
                  width: { xs: "100%", md: "auto" }, // ✅ en xs baja a otra línea si no cabe
                }}
              >
                <Button variant="contained" size="small" onClick={handleApplyRange}>
                  Consultar rango
                </Button>
                <Button variant="outlined" size="small" color="warning" onClick={handleResetRangeToDefault}>
                  Mes actual + anterior (Default)
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Fecha"
                name="fecha"
                value={filters.fecha}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {options.fechas.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Fecha Est. Entrega"
                name="fechaEstimadaEntrega"
                value={filters.fechaEstimadaEntrega}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {options.fechasEstimadasEntrega.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f === "NA" ? "Pendiente" : f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Cliente"
                name="cliente"
                value={filters.cliente}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {options.clientes.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Producto"
                name="producto"
                value={filters.producto}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {options.productos.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Transportadora"
                name="transportadora"
                value={filters.transportadora}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {options.transportadoras.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                options={options.destinos}
                value={filters.destino || null}
                autoHighlight
                forcePopupIcon
                selectOnFocus
                clearOnEscape
                getOptionLabel={(option) => option ?? ""}
                filterOptions={(options, state) => {
                  const busqueda = normalizarBusquedaCiudad(
                    state.inputValue
                  );
                  return options
                    .filter((ciudad) =>
                      normalizarBusquedaCiudad(ciudad).includes(busqueda)
                    )
                    .slice(0, 100);
                }}
                onChange={(event, newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    destino: newValue ?? "",
                  }));
                }}
                noOptionsText="No se encontraron ciudades"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Destino"
                    placeholder="Buscar ciudad"
                  />
                )}
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 1.0 }} />
          {kpiPorDia.length > 0 && (
            <Box sx={{ mt: 1, mb: 1.5 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                Resumen por día (se listarán los últimos 8 dias de la programacion según filtro actual)
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  alignItems: "center",
                }}
              >
                {top10Dias.map((d) => (
                  <Chip
                    key={d.fecha}
                    size="medium"
                    variant="outlined"
                    sx={{
                      height: 35,
                      borderRadius: "5px",
                      bgcolor: "#fff",
                      "& .MuiChip-label": {
                        px: 1,
                        py: 0,
                      },
                    }}
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <CalendarMonthIcon
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, lineHeight: 1 }}
                        >
                          {d.fecha}
                        </Typography>
                        <LocalShippingIcon
                          sx={{ fontSize: 14, color: "primary.main" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, lineHeight: 1 }}
                        >
                          {d.viajes}
                        </Typography>
                        <OpacityIcon
                          sx={{ fontSize: 14, color: "success.main" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 500, lineHeight: 1 }}
                        >
                          {formatNumber(d.cantidad)}L
                        </Typography>
                      </Box>
                    }
                  />
                ))}
                {kpiPorDia.length > 10 && (
                  <Chip
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 30,
                      borderRadius: "16px",
                      bgcolor: "#e9c3ff",
                      "& .MuiChip-label": {
                        px: 1,
                        py: 0,
                        fontWeight: 500,
                      },
                    }}
                    label={`+ ${kpiPorDia.length - 10} días más`}
                  />
                )}
              </Box>
            </Box>
          )}
          <Divider sx={{ my: 0.5 }} />
          <ProgramacionDespachoModal
            open={formModalOpen}
            editingId={editingId}
            form={form}
            catalog={catalog}
            catalogLoading={catalogLoading}
            canEditFechaEstimadaEntrega={canEditFechaEstimadaEntrega}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onClose={handleCloseFormModal}
          />
          <EstadoProgramacionModal
            open={estadoModalOpen}
            programacion={programacionSeleccionada}
            saving={guardandoEstado}
            onClose={handleCloseEstadoModal}
            onSave={handleSaveEstado}
          />
          <CargaMasivaProgramacionModal
            open={cargaMasivaOpen}
            onClose={() => setCargaMasivaOpen(false)}
            onSuccess={async () => {
              await fetchProgramacion(range);
              await fetchCatalogs();
            }}
          />
          <Box>
            <Paper elevation={0} sx={{ border: "1px solid #e4e7ec", backgroundColor: "rgba(205, 226, 235, 0.3)", borderRadius: 2, p: 1, mb: 1.2 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                spacing={1}
              >
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Tooltip title="Actualiza la Base de Datos con filtros actuales">
                    <Button
                      variant="outlined"
                      size="medium"
                      sx={{ color: "#C450DE" }}
                      onClick={async () => {
                        await fetchProgramacion(range);
                        await fetchCatalogs(true);
                        Swal.fire({
                          icon: "success",
                          title: "Actualizado",
                          text: "Datos refrescados.",
                          timer: 1200,
                          showConfirmButton: false,
                        });
                      }}
                    >
                      <RefreshIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Limpiar filtros">
                    <Button variant="outlined" onClick={clearFilters} size="medium">
                      <CleaningServicesIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      sortOrder === "desc"
                        ? "Orden actual: más recientes primero"
                        : "Orden actual: más antiguos primero"
                    }
                  >
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() =>
                        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                      }
                    >
                      <SwapVertIcon
                        sx={{ color: sortOrder === "desc" ? "#7BDE50" : "error.main" }}
                      />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Exportar Data">
                    <ExcelDownloadButton
                      data={rowsFiltrados}
                      filename="programacion_despacho.xlsx"
                      sheetName="Programacion"
                      variant="outlined"
                      buttonText=""
                      startIcon={
                        <img
                          src="/Icons/excelIcon.png"
                          alt="Excel"
                          style={{ width: 30, height: 25 }}
                        />
                      }
                    />
                  </Tooltip>
                </Stack>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="medium" label={`${pendingNew} nuevas · ${pendingExisting} editadas`} color={dirtyCount ? "warning" : "default"} />
                  <Button variant="contained" size="small" onClick={saveAll} startIcon={<SaveIcon />} disabled={!dirtyCount || saving} sx={{ bgcolor: "#0B7A5A", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "#09684D" } }}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button variant="outlined" size="small" color="inherit" onClick={discard} disabled={!dirtyCount || saving} startIcon={<CancelIcon />} sx={{ textTransform: "none" }}>Descartar</Button>
                  <Tooltip title="Copiar selección (también Ctrl+C)"><span><IconButton size="small" onClick={copySelection}><ContentCopyIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title="Pegar desde Excel: selecciona la primera celda y presiona Ctrl+V"><ContentPasteIcon fontSize="small" color="action" /></Tooltip>
                </Stack>
              </Stack>
            </Paper>
            <TableContainer component={Paper} elevation={2} tabIndex={-1} ref={scrollViewportRef} onScroll={handleGridScroll} onCopy={handleCopy} onPaste={handlePaste} onKeyDown={handleKeyDown}
              onContextMenu={(e) => {
                if (e.target.closest("input")) return;
                e.preventDefault();
                copiarTablaPortapapeles();
              }}
              sx={{ borderRadius: 2, overflow: "auto", maxHeight: "min(70vh, 680px)", outline: "none", "& .MuiTableCell-root": { fontSize: "11.8px" } }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1500, borderCollapse: "separate", borderSpacing: 0 }}>
                <TableHead>
                  <TableRow sx={{ "& .MuiTableCell-root": { whiteSpace: "nowrap" } }}>
                    {FIELDS.map((col) => <TableCell key={col.key} sx={{ minWidth: col.minWidth }}><strong>{col.title}</strong></TableCell>)}
                    <TableCell align="center"><strong>Checked</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{
                  "& .MuiTableRow-root": { transition: "background-color 0.18s ease", "&:nth-of-type(even)": { bgcolor: "rgba(17, 24, 39, 0.025)" }, "&:hover": { bgcolor: "rgba(25,118,210,0.08) !important" } },
                  "& .MuiTableCell-root": { fontSize: "11.8px", py: 0.65, px: 1, borderBottom: "1px solid rgba(224,224,224,0.8)", verticalAlign: "middle", position: "relative" },
                  "& .MuiIconButton-root": { p: 0.45 },
                }}>
                  {spacerTop > 0 && <TableRow aria-hidden="true" sx={{ height: spacerTop, pointerEvents: "none" }}><TableCell colSpan={13} sx={{ height: spacerTop, padding: "0 !important", borderBottom: "0 !important" }} /></TableRow>}
                  {visibleRows.map((item, relativeRow) => {
                    const r = firstVisible + relativeRow;
                    return (
                      <TableRow key={item.__gridKey} hover sx={{ height: EXCEL_ROW_HEIGHT, ...(item.__isNew ? { bgcolor: "rgba(11,122,90,0.038)" } : {}) }}>
                        {FIELDS.map((col, c) => {
                          const current = editing === `${r}:${c}`;
                          const allowed = isEditAllowed(col.key);
                          const raw = asCell(item, col.key);
                          const selected = inSelection(r, c);
                          const changed = item.__isNew ? raw !== "" : Object.prototype.hasOwnProperty.call(changes[item.__gridKey] || {}, col.key);
                          const dateDelivery = col.key === "fechaEstimadaEntrega";
                          return (
                            <TableCell key={`${item.__gridKey}-${col.key}`}
                              title={!allowed ? "Campo con edición restringida por rol" : raw}
                              onMouseDown={(e) => {
                                if (e.button !== 0 || current) return;
                                mousePressedCell.current = { r, c };
                                movedDuringDrag.current = false;
                                e.preventDefault();
                                selectCell(e, r, c);
                              }}
                              onMouseEnter={() => hoverCell(r, c)}
                              onMouseUp={(e) => {
                                const pressed = mousePressedCell.current;
                                mousePressedCell.current = null;
                                if (e.button !== 0 || current || e.shiftKey || movedDuringDrag.current ||
                                  !pressed || pressed.r !== r || pressed.c !== c) return;
                                editCell(r, c);
                              }}
                              sx={{
                                minWidth: col.minWidth, maxWidth: col.key === "cliente" ? 260 : col.minWidth + 50, p: "0 !important", bgcolor: selected ? "rgba(25,118,210,0.115) !important" : changed ? "rgba(255,193,7,0.10)" : undefined,
                                boxShadow: selected ? "inset 0 0 0 1px rgba(25,118,210,0.65)" : undefined, cursor: allowed ? "cell" : "not-allowed"
                              }}>
                              {current ? (
                                <Box sx={{ px: 0, width: "100%" }}>
                                  <Box component="input" autoFocus defaultValue={editValue.current} type="text" list={optionsFor(catalog, col.key).length ? `excel-options-${col.key}` : undefined}
                                    aria-label={`${col.title}, fila ${r + 1}`}
                                    onChange={(e) => {
                                      editValue.current = e.target.value;
                                      // En registros existentes, confirmar la edición al salir de la celda.
                                      // Nunca autocompletar ni cambiar otras celdas durante la digitación.
                                      if (item.__isNew) {
                                        if (col.key === "placa" || col.key === "conductor") {
                                          const clave = col.key === "placa" ? normalizePlate(editValue.current) : normalizeUpper(editValue.current);
                                          if (conductorIndices[col.key].has(clave)) putAt(item, col.key, editValue.current);
                                        } else if (col.key === "cliente" && catalog.clientes.some((v) => normalizeUpper(v) === normalizeUpper(editValue.current))) {
                                          putAt(item, col.key, editValue.current);
                                        }
                                      }
                                    }}
                                    onBlur={() => { commitEditor(); setEditing((prev) => prev === `${r}:${c}` ? null : prev); }}
                                    sx={{
                                      display: "block", width: "100%", height: 30, boxSizing: "border-box",
                                      fontFamily: "inherit", fontSize: "11.8px",
                                      fontWeight: ["fecha", "placa", "cliente", "cantidad"].includes(col.key) ? 700 : 400,
                                      textAlign: col.key === "cantidad" ? "right" : "left",
                                      border: 0, borderRadius: 0, outline: "none", boxShadow: "none",
                                      py: 0, px: 1, m: 0, bgcolor: "transparent", color: "#101828",
                                      appearance: "none", WebkitAppearance: "none",
                                      "&::-webkit-calendar-picker-indicator": { display: "none !important" },
                                      "&::-webkit-list-button": { display: "none !important" },
                                      "&::-ms-expand": { display: "none" },
                                      "&:focus": { border: 0, outline: "none", boxShadow: "none", bgcolor: "transparent" },
                                    }} />
                                </Box>
                              ) : (
                                <Box data-excel-cell={`${r}:${c}`} tabIndex={0} role="gridcell"
                                  aria-label={`${col.title}, fila ${r + 1}`} onFocus={() => setActive((prev) => prev.r === r && prev.c === c ? prev : { r, c })}
                                  sx={{
                                    display: "flex", alignItems: "center", minHeight: 30, px: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", outline: "none",
                                    justifyContent: col.key === "cantidad" ? "flex-end" : "flex-start", fontWeight: ["fecha", "placa", "cliente", "cantidad"].includes(col.key) ? 700 : 400,
                                    color: col.key === "horaProgramada" ? "primary.main" : undefined
                                  }}>
                                  {dateDelivery ? (
                                    raw && raw !== "NA" ? <Box component="span" sx={{ px: 1.2, py: 0.35, borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", color: "#1B5E20", bgcolor: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.35)" }}>{raw}</Box>
                                      : !item.__isNew ? <Box component="span" sx={{ px: 1.2, py: 0.35, borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", color: "#B71C1C", bgcolor: "rgba(244,67,54,0.12)", border: "1px solid rgba(244,67,54,0.35)" }}>Pendiente</Box> : ""
                                  ) : col.key === "cantidad" && raw && !changed ? Number(raw).toLocaleString("es-CO") : (raw || (item.__isNew ? "" : "—"))}
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell align="center"><Tooltip title={item.__isNew ? "Sin guardar" : item.cumplido ? "Despacho cumplido" : "Pendiente"}>
                          <CheckIcon sx={{ color: !item.__isNew && item.cumplido ? "#2e7d32" : "grey.300", fontSize: 22, filter: item.cumplido ? "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))" : undefined }} />
                        </Tooltip></TableCell>
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                          {item.__isNew ? (
                            <Tooltip title="Eliminar fila nueva"><IconButton color="error" disabled={saving} onClick={() => removeNew(item.__gridKey)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          ) : (
                            <>
                              <Tooltip title={`Gestionar estado: ${normalize(item.estado).toUpperCase() || "PROGRAMADO"}`}><IconButton disabled={saving} onClick={() => handleOpenEstadoModal(byId.get(item.__gridKey) || item)} aria-label="Gestionar estado" sx={{ color: getEstadoIconColor?.(item.estado) }}>{getEstadoIcon?.(item.estado)}</IconButton></Tooltip>
                              <Tooltip title="Editar en modal"><IconButton color="primary" disabled={saving} onClick={() => handleEdit(byId.get(item.__gridKey) || item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="Eliminar programación"><IconButton color="error" disabled={saving} onClick={() => handleDelete(item._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {spacerBottom > 0 && <TableRow aria-hidden="true" sx={{ height: spacerBottom, pointerEvents: "none" }}><TableCell colSpan={13} sx={{ height: spacerBottom, padding: "0 !important", borderBottom: "0 !important" }} /></TableRow>}
                  {!rowsFiltrados.length && <TableRow><TableCell colSpan={13} align="center"><Typography color="text.secondary" variant="caption">No hay programaciones en los filtros actuales; puedes registrar nuevas en las filas vacías superiores.</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
            {catalogDataLists}
            {dirtyCount > 0 && <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#b26a00", fontWeight: 700 }}>
              Tienes {dirtyCount} registro(s) con cambios sin guardar. No cierres la página hasta confirmarlos.
            </Typography>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default ProgramacionDespachoDiariaPage;
