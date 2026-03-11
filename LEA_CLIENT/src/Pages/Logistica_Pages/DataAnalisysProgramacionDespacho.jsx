import React, { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { LabelList } from "recharts";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Stack,
  MenuItem,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  IconButton,
} from "@mui/material";

import { ReferenceLine } from "recharts";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ReportIcon from "@mui/icons-material/Report";
import UndoIcon from "@mui/icons-material/Undo";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import PersonRemoveAlt1Icon from "@mui/icons-material/PersonRemoveAlt1";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_PROGRAMACION = "https://ambiocomserver.onrender.com/api/programaciondespacho";
const API_DESPACHOS = "https://ambiocomserver.onrender.com/api/despacho-alcoholes";

// Debounce simple
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// Helpers

//formato para eliminar decimales tipo 12334,99887778 y se vea 12334,9
const formatNumber1D = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "0,0";
  return x.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const normalizeText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const removeAccents = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeKey = (v) =>
  removeAccents(normalizeText(v))
    .toUpperCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatNumber = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "0,00";

  return x.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

const getEstadoVehiculo = (d) =>
  normalizeText(d?.lecturas?.vehiculo_rechazado).toUpperCase();

const isAprobado = (estado) => ["NO", "APROBADO"].includes(estado);
const isAprobadoConObs = (estado) =>
  ["APROBADO CON OBSERVACIONES"].includes(estado);
const isRechazado = (estado) => ["SI"].includes(estado); // RECHAZADO de planta
const isRechazadoCliente = (estado) =>
  ["RECHAZADO POR CLIENTE"].includes(estado);
const isEnProceso = (estado) => ["EN TRANSITO", "EN CARGUE"].includes(estado);

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

const getApiErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Ocurrió un error inesperado.";

const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

// mes anterior + mes actual
const getDefaultRange = () => {
  const now = new Date();
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISODate(startPrevMonth), to: toISODate(endCurrentMonth) };
};

// Heatmap (diff cantidad)
const heatBg = (diff, tol = 0) => {
  const v = Number(diff ?? 0);
  const a = Math.abs(v);
  if (a <= tol) return "rgba(46,125,50,0.18)"; // verde
  if (a <= tol * 2) return "rgba(251,140,0,0.18)"; // naranja
  return "rgba(211,47,47,0.18)"; // rojo
};
// heatmap para datos de diferencia de peso con cliente
const heatBgKg = (diff, tol = 0) => {
  const v = Number(diff ?? 0);
  const a = Math.abs(v);

  if (a <= tol) return "rgba(46,125,50,0.18)";      // verde = dentro de tolerancia
  if (v > 0 && v > tol) return "rgba(248, 168, 77, 0.66)";
  if (a <= tol * 2) return "rgba(255,235,59,0.25)";  // naranja
  return "rgba(211,47,47,0.18)";                    // rojo = fuera fuerte
};
//helper mapa de calor para %cumplimiento volumenes de despacho
const heatCumplimiento = (pct) => {
  const v = Number(pct ?? 0);
  if (v === 0) return "rgba(33,150,243,0.18)"; // azul frío
  if (v > 100) return "rgba(244,67,54,0.18)"; // rojo pálido
  if (v === 100) return "rgba(46,125,50,0.18)"; // verde
  if (v > 0 && v < 100) return "rgba(255,235,59,0.25)"; // amarillo

  return "transparent";
};

// Extractores (cruce)
const keyProgramacion = (p) => {
  const fecha = normalizeText(p?.fecha);
  const transportadora = normalizeKey(p?.transportadora);
  const cliente = normalizeKey(p?.cliente);
  const producto = normalizeKey(p?.producto);
  return `${fecha}|${transportadora}|${cliente}|${producto}`;
};

const keyDespacho = (d) => {
  const fecha = normalizeText(d?.fecha);
  const transportadora = normalizeKey(d?.lecturas?.transportadora);
  const cliente = normalizeKey(d?.lecturas?.cliente);
  const producto = normalizeKey(d?.lecturas?.producto);
  return `${fecha}|${transportadora}|${cliente}|${producto}`;
};

const getDespachoCantidadRealPlanta = (d) =>
  Number(d?.lecturas?.volumen_contador_gravimetrico ?? 0);

// Diferencia planta
const getDespachoDifPlanta = (d) => Number(d?.lecturas?.variación_volumen ?? 0);

// Diferencia cliente
const getDespachoDifCliente = (d) =>
  Number(d?.lecturas?.diferencia_recibo_cliente ?? 0);
// Diferencia bascula cliente-bascula ambiocom (Pesos netos)
const getDespachoDifKgCliente = (d) =>
  Number(d?.lecturas?.kilos_peso_neto ?? 0) -
  Number(d?.lecturas?.peso_neto_bascula_ambiocom ?? 0);

// Rechazo / Cumplimiento (salió de planta)

const getDespachoInfo = (d) => {
  const estado = getEstadoVehiculo(d);

  return {
    fecha: normalizeText(d?.fecha),
    transportadora: normalizeKey(d?.lecturas?.transportadora),
    cliente: normalizeKey(d?.lecturas?.cliente),
    producto: normalizeKey(d?.lecturas?.producto),
    estadoVehiculo: estado,

    rechazado: isRechazado(estado),
    rechazadoCliente: isRechazadoCliente(estado),

    aprobado: isAprobado(estado),
    aprobadoConObs: isAprobadoConObs(estado),

    enProceso: isEnProceso(estado),
  };
};

<<<<<<< HEAD
=======
// Agregación + Cruce
const aggregate = (rows, getKey, getCantidad) => {
  const m = new Map();
  for (const r of rows ?? []) {
    const key = getKey(r);
    if (!key || key.startsWith("|")) continue;

    const prev = m.get(key) || { viajes: 0, cantidad: 0 };
    prev.viajes += 1;
    prev.cantidad += Number(getCantidad(r) ?? 0);
    m.set(key, prev);
  }
  return m;
};

>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
const buildComparativoBase = ({ programaciones, despachos }) => {
  const group = (rows, getKey) => {
    const m = new Map();
    for (const r of rows ?? []) {
      const k = getKey(r);
      if (!k || k.startsWith("|")) continue;
      const arr = m.get(k) || [];
      arr.push(r);
      m.set(k, arr);
    }
    return m;
  };

  const progG = group(programaciones, keyProgramacion);
  const despG = group(despachos, keyDespacho);

  const keys = new Set([...progG.keys(), ...despG.keys()]);
  const out = [];

  for (const key of keys) {
    const [fecha, transportadora, cliente, producto] = key.split("|");
    if (!isValidDateISO(fecha)) continue;

    const progs = progG.get(key) || [];
    const desps = despG.get(key) || [];
    const n = Math.max(progs.length, desps.length);

    for (let i = 0; i < n; i++) {
      const p = progs[i] || null;
      const d = desps[i] || null;

      const cantidadProgramada = Number(p?.cantidad ?? 0);
      const cantidadRealPlanta = Number(getDespachoCantidadRealPlanta(d) ?? 0);

      const estadoVehiculo = d ? getEstadoVehiculo(d) : "";
      const rechazado = d ? isRechazado(estadoVehiculo) : false;
      const rechazadoCliente = d ? isRechazadoCliente(estadoVehiculo) : false;
      const aprobado = d ? isAprobado(estadoVehiculo) : false;
      const aprobadoConObs = d ? isAprobadoConObs(estadoVehiculo) : false;
      const enProceso = d ? isEnProceso(estadoVehiculo) : false;

      const diffCantidad = cantidadRealPlanta - cantidadProgramada;
      const diffPlanta = Number(getDespachoDifPlanta(d) ?? 0);
      const diffCliente = Number(getDespachoDifCliente(d) ?? 0);
<<<<<<< HEAD
      const diffKgBasculaClienteAmbiocom = Number(getDespachoDifKgCliente(d) ?? 0);
=======
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec

      const cumplimientoPct =
        cantidadProgramada > 0
          ? (cantidadRealPlanta / cantidadProgramada) * 100
          : 0;

      out.push({
        key: `${key}|${i}`,
        fecha,
        transportadora,
        cliente,
        producto,
<<<<<<< HEAD
        conductor: normalizeText(d?.lecturas?.nombre_conductor),
=======
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
        viajesProgramados: p ? 1 : 0,
        viajesRealizados: d ? 1 : 0,
        cantidadProgramada,
        cantidadRealPlanta,
        volumenRecibidoCliente: Number(d?.lecturas?.cantidad_recibida_cliente ?? 0),
        pesoNetoCliente: Number(d?.lecturas?.kilos_peso_neto ?? 0),
        pesoNetoBasculaAmbiocom: Number(d?.lecturas?.peso_neto_bascula_ambiocom ?? 0),
        diffCantidad,
        diffPlanta,
        diffCliente,
        diffKgBasculaClienteAmbiocom,
        cumplimientoPct,
        tieneProgramacion: !!p,
        tieneDespacho: !!d,
        rechazado,
        rechazadoCliente,
        aprobado,
        aprobadoConObs,
        enProceso,
        estadoVehiculo,
      });
    }
  }

  out.sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
    if (a.transportadora !== b.transportadora) {
      return a.transportadora.localeCompare(b.transportadora);
    }
    if (a.cliente !== b.cliente) {
      return a.cliente.localeCompare(b.cliente);
    }
    return a.producto.localeCompare(b.producto);
  });

  return out;
};
// UI: módulo BI
const AnalisisDespachosBIPage = () => {
  const navigate = useNavigate();

  const [range, setRange] = useState(() => getDefaultRange());
  const [programaciones, setProgramaciones] = useState([]);
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersElevated, setFiltersElevated] = useState(false);
  const [filters, setFilters] = useState({
    fecha: "",
    transportadora: "",
    cliente: "",
    producto: "",
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [tolerancia, setTolerancia] = useState(200);
  const [toleranciaDespacho, setToleranciaDespacho] = useState(30);
  const [toleranciaKgCliente, setToleranciaKgCliente] = useState(30);

  useEffect(() => {
    const onScroll = () => setFiltersElevated(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/principal");
  };

  const handleRangeChange = (e) => {
    setRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ fecha: "", transportadora: "", cliente: "", producto: "" });
    setSearch("");
  };

  const fetchAll = async (customRange) => {
    const effective = customRange ?? range ?? getDefaultRange();
    const from = normalizeText(effective.from);
    const to = normalizeText(effective.to);

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

    setLoading(true);
    Swal.fire({
      title: "Cargando análisis...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const resProg = await axios.get(`${API_PROGRAMACION}/rango`, {
        params: { from, to },
      });

      const resDesp = await axios.get(`${API_DESPACHOS}/rango`, {
        params: { from, to },
      });

      setProgramaciones(Array.isArray(resProg.data) ? resProg.data : []);
      setDespachos(Array.isArray(resDesp.data) ? resDesp.data : []);

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Datos cargados para análisis.",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Error cargando",
        text: getApiErrorMessage(err),
      });
      setProgramaciones([]);
      setDespachos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(getDefaultRange());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comparativoBase = useMemo(() => {
    return buildComparativoBase({
      programaciones,
      despachos,
    });
  }, [programaciones, despachos]);

  const comparativo = useMemo(() => {
    return comparativoBase.map((r) => {
      const cumplioCantidadDespachada =
        r.cantidadProgramada > 0 &&
        Math.abs(r.diffCantidad) <= Number(toleranciaDespacho ?? 0);

      const cumplioCantidadCliente =
        r.cantidadProgramada > 0 &&
        Math.abs(r.diffCliente) <= Number(tolerancia ?? 0);

      const cumplioViaje = r.tieneProgramacion && r.tieneDespacho;

      const estadoProgramacion =
        r.tieneProgramacion && !r.tieneDespacho && !r.rechazado
          ? "Programado (no despachado)"
          : !r.tieneProgramacion && r.tieneDespacho && !r.rechazado && !r.aprobadoConObs && !r.rechazadoCliente
            ? "No programado"
            : r.tieneProgramacion && r.tieneDespacho && r.rechazado
              ? "Rechazado Ambiocom"
              : r.tieneProgramacion && r.tieneDespacho && r.rechazadoCliente || !r.tieneProgramacion && r.tieneDespacho && r.rechazadoCliente
                ? "Rechazado por cliente"
                : r.tieneProgramacion && r.tieneDespacho && r.aprobadoConObs || !r.tieneProgramacion && r.tieneDespacho && r.aprobadoConObs
                  ? "Aprobado con observaciones"
                  : r.tieneProgramacion && r.tieneDespacho && r.aprobado
                    ? "Cumple"
                    : r.tieneProgramacion && r.tieneDespacho && r.enProceso || !r.tieneProgramacion && r.tieneDespacho && r.enProceso
                      ? "En proceso"
                      : "Sin datos";

      return {
        ...r,
        cumplioViaje,
        cumplioCantidadDespachada,
        cumplioCantidadCliente,
        cumplioToleranciaDespacho: cumplioCantidadDespachada,
        estadoProgramacion,
      };
    });
  }, [comparativoBase, tolerancia, toleranciaDespacho]);

  const filterOptions = useMemo(() => {
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      fechas: uniq(comparativo.map((r) => r.fecha)),
      transportadoras: uniq(comparativo.map((r) => r.transportadora)),
      clientes: uniq(comparativo.map((r) => r.cliente)),
      productos: uniq(comparativo.map((r) => r.producto)),
    };
  }, [comparativo]);

  const comparativoFiltrado = useMemo(() => {
    let out = comparativo;

    const fFecha = normalizeText(filters.fecha);
    const fT = normalizeText(filters.transportadora);
    const fC = normalizeText(filters.cliente);
    const fP = normalizeText(filters.producto);

    if (fFecha) out = out.filter((r) => r.fecha === fFecha);
    if (fT) out = out.filter((r) => r.transportadora === fT);
    if (fC) out = out.filter((r) => r.cliente === fC);
    if (fP) out = out.filter((r) => r.producto === fP);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const hay = [
        r.fecha,
        r.transportadora,
        r.cliente,
        r.producto,
        String(r.viajesProgramados),
        String(r.viajesRealizados),
        String(r.cantidadProgramada),
        String(r.cantidadRealPlanta),
        String(r.diffCantidad),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [comparativo, filters, debouncedSearch]);

  // ===== NUEVO: despachos filtrados (para cumplir/rechazar por viaje real) =====
  const despachosFiltrados = useMemo(() => {
    const rows = (despachos ?? []).map(getDespachoInfo);

    const fFecha = normalizeText(filters.fecha);
    const fT = normalizeKey(filters.transportadora);
    const fC = normalizeKey(filters.cliente);
    const fP = normalizeKey(filters.producto);

    let out = rows;

    if (fFecha) out = out.filter((r) => r.fecha === fFecha);
    if (filters.transportadora)
      out = out.filter((r) => r.transportadora === fT);
    if (filters.cliente) out = out.filter((r) => r.cliente === fC);
    if (filters.producto) out = out.filter((r) => r.producto === fP);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const hay = [r.fecha, r.transportadora, r.cliente, r.producto]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [despachos, filters, debouncedSearch]);

  // KPIs principales (comparativo)
  const kpis = useMemo(() => {
    const rows = comparativoFiltrado ?? [];
    // VIAJES
    const viajesProgramados = rows.reduce((acc, r) => acc + (r.viajesProgramados ?? 0), 0);
    const viajesRealizados = rows.reduce((acc, r) => acc + (r.viajesRealizados ?? 0), 0);
    // VOLUMENES
    const cantidadProgramada = rows.reduce((acc, r) => acc + (r.cantidadProgramada ?? 0), 0);
    const cantidadReal = rows.reduce((acc, r) => acc + (r.cantidadRealPlanta ?? 0), 0);
    // DIFERENCIAS
    const diffTotal = rows.reduce((acc, r) => acc + (r.diffCantidad ?? 0), 0);
<<<<<<< HEAD
    const diffPlantaTotal = rows.reduce((acc, r) => acc + (r.diffPlanta ?? 0), 0);
    const diffClienteTotal = rows.reduce((acc, r) => acc + (r.diffCliente ?? 0), 0);
    // CUMPLIMIENTO
=======
    const diffPlantaTotal = rows.reduce(
      (acc, r) => acc + (r.diffPlanta ?? 0),
      0
    );
    const diffClienteTotal = rows.reduce(
      (acc, r) => acc + (r.diffCliente ?? 0),
      0
    );

>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
    const cumplidosCantidad = rows.filter((r) => r.cumplioCantidadDespachada).length;
    const cumplidosViaje = rows.filter((r) => r.cumplioViaje).length;

    const pctCumplCant = rows.length ? (cumplidosCantidad / rows.length) * 100 : 0;
    const pctCumplViaje = rows.length ? (cumplidosViaje / rows.length) * 100 : 0;

    return {
      filas: rows.length,
      viajesProgramados,
      viajesRealizados,
      cantidadProgramada,
      cantidadReal,
      diffTotal,
      diffPlantaTotal,
      diffClienteTotal,
      pctCumplCant,
      pctCumplViaje,
    };
  }, [comparativoFiltrado]);

  // ===== NUEVO: KPI viajes (salió de planta) usando vehiculo_rechazado =====
  const kpiVehiculos = useMemo(() => {
    const total = despachosFiltrados.length;
    const rechazados = despachosFiltrados.filter((d) => d.rechazado).length;
    const cumplidos = total - rechazados;
    const pct = total ? (cumplidos / total) * 100 : 0;
    return { total, rechazados, cumplidos, pct };
  }, [despachosFiltrados]);

  // Series: Programado vs Real por día
  const seriesPorDia = useMemo(() => {
    const m = new Map();
    for (const r of comparativoFiltrado) {
      const prev = m.get(r.fecha) || {
        fecha: r.fecha,
        programado: 0,
        real: 0,
        diff: 0,
      };
      prev.programado += r.cantidadProgramada;
      prev.real += r.cantidadRealPlanta;
      prev.diff += r.diffCantidad;
      m.set(r.fecha, prev);
    }
    return Array.from(m.values()).sort((a, b) =>
      a.fecha.localeCompare(b.fecha)
    );
  }, [comparativoFiltrado]);

  // diferencias volumen vs kilos recibidos por cliente
  const seriesMermasDetallada = useMemo(() => {
    return [...comparativoFiltrado]
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        if (a.transportadora !== b.transportadora) {
          return a.transportadora.localeCompare(b.transportadora);
        }
        if (a.cliente !== b.cliente) {
          return a.cliente.localeCompare(b.cliente);
        }
        return a.producto.localeCompare(b.producto);
      })
      .map((r, idx) => ({
        id: `${r.fecha}-${idx}`,
        fecha: r.fecha,
        item: `${r.fecha} #${idx + 1}`,

        cliente: r.cliente,
        conductor: r.conductor ?? "Sin dato",
        producto: r.producto,
        transportadora: r.transportadora,

        volumenDespachado: Number(r.cantidadRealPlanta ?? 0),
        volumenRecibidoCliente: Number(r.volumenRecibidoCliente ?? 0),
        pesoNetoCliente: Number(r.pesoNetoCliente ?? 0),
        pesoNetoBasculaAmbiocom: Number(r.pesoNetoBasculaAmbiocom ?? 0),
        diffVolCliente: Number(r.diffCliente ?? 0),
        diffPesoCliente: Number(r.diffKgBasculaClienteAmbiocom ?? 0),

        estadoProgramacion: r.estadoProgramacion,
        rechazado: r.rechazado,
        rechazadoCliente: r.rechazadoCliente,
        aprobado: r.aprobado,
        aprobadoConObs: r.aprobadoConObs,
        enProceso: r.enProceso,
      }));
  }, [comparativoFiltrado]);

  const seriesMermasDetalladaFiltrada = useMemo(() => {
    return seriesMermasDetallada.filter(
      (r) => !r.rechazado && !r.rechazadoCliente
    );
  }, [seriesMermasDetallada]);

  // Series: Diferencia por transportadora (barras con colores) diferenciando positivos y negativos
  const seriesPosNegPorTransportadora = useMemo(() => {
    const m = new Map();

    for (const r of comparativoFiltrado) {
      const t = r.transportadora || "(SIN TRANSPORTADORA)";
      const diff = Number(r.diffCantidad ?? 0);

      const prev = m.get(t) || {
        transportadora: t,
        positivos: 0,
        negativos: 0,
      };

      if (diff > 0) prev.positivos += diff;
      if (diff < 0) prev.negativos += diff;

      m.set(t, prev);
    }

    // opcional: ordenar por impacto total (magnitud)
    return Array.from(m.values()).sort(
      (a, b) =>
        Math.abs(b.negativos) +
        b.positivos -
        (Math.abs(a.negativos) + a.positivos)
    );
  }, [comparativoFiltrado]);

  // Color estable por transportadora (siempre el mismo) en la grafica barras comparativa de mermas
  const hashToColor = (str) => {
    const s = String(str ?? "");
    let hash = 0;
    for (let i = 0; i < s.length; i++)
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  const colorByTransportadora = useMemo(() => {
    const m = new Map();
    for (const x of seriesPosNegPorTransportadora) {
      m.set(x.transportadora, hashToColor(x.transportadora));
    }
    return m;
  }, [seriesPosNegPorTransportadora]);
  // **********************************************************************
  // Cumplimiento por transportadora (Cumplidos vs Rechazados)
  const seriesCumplimientoPorTransportadora = useMemo(() => {
    const m = new Map();

    for (const r of comparativoFiltrado) {
      if (r.viajesProgramados === 0) continue;

      const key = r.transportadora || "(SIN TRANSPORTADORA)";
      const prev = m.get(key) || {
        transportadora: key,
        programados: 0,
        cumplidos: 0,
        rechazadosAmbiocom: 0,
        rechazadosCliente: 0,
        pctCumpl: 0,
      };

      prev.programados += 1;

      if (r.rechazado) {
        prev.rechazadosAmbiocom += 1;
      } else if (r.rechazadoCliente) {
        prev.rechazadosCliente += 1;
      } else if (r.viajesRealizados > 0 && r.aprobado) {
        prev.cumplidos += 1;
      }

      m.set(key, prev);
    }

    const out = Array.from(m.values()).map((x) => ({
      ...x,
      pctCumpl: x.programados ? (x.cumplidos / x.programados) * 100 : 0,
    }));

    out.sort((a, b) => b.programados - a.programados);

    return out;
  }, [comparativoFiltrado]);

  //Flags para evaluar si existen rechazos o no y mostrarlos en la grafica de programacion, cumplimiento y rechazos
  const hasRechazosAmbiocom = useMemo(() => {
    return seriesCumplimientoPorTransportadora.some(
      (x) => Number(x.rechazadosAmbiocom ?? 0) > 0
    );
  }, [seriesCumplimientoPorTransportadora]);

  const hasRechazosCliente = useMemo(() => {
    return seriesCumplimientoPorTransportadora.some(
      (x) => Number(x.rechazadosCliente ?? 0) > 0
    );
  }, [seriesCumplimientoPorTransportadora]);

  const pieTransportadoras = useMemo(() => {
    const rows = comparativoFiltrado ?? [];
    // solo programados
    const prog = rows.filter((r) => (r.viajesProgramados ?? 0) > 0);
    // Programados pendientes: programado y NO despachado
    const pendientes = prog.filter(
      (r) => (r.viajesRealizados ?? 0) === 0
    ).length;
    // Despachados programados: programado y despachado
    const despProg = prog.filter((r) => (r.viajesRealizados ?? 0) > 0);

    const cumplen = despProg.filter((r) => r.aprobado).length;
    const conObs = despProg.filter((r) => r.aprobadoConObs).length;
    const rechazados = despProg.filter((r) => r.rechazado).length;
    const rechazadosCliente = despProg.filter((r) => r.rechazadoCliente).length;
    const enProceso = despProg.filter((r) => r.enProceso).length;

    return [
      { name: "Programados (pendientes)", value: pendientes, color: "#1976d2" },
      { name: "Cumple", value: cumplen, color: "#36b865" },
      { name: "Aprobado con obs", value: conObs, color: "#F59E0B" },
      { name: "Rechazado Ambiocom", value: rechazados, color: "#e53935" },
      { name: "Rechazado por cliente", value: rechazadosCliente, color: "#6B7280", },
      { name: "En proceso", value: enProceso, color: "#8B5CF6" },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado]);

<<<<<<< HEAD
  // Pie: analisis sobre mermas y diferencias en peso
  const pieCumplimientoPeso = useMemo(() => {
    const rows = seriesMermasDetalladaFiltrada ?? [];
    const tolKg = Number(toleranciaKgCliente ?? 0);
=======
  // Pie: Cumple vs No cumple (cantidad)
  const pieCumplimiento = useMemo(() => {
    const rows = comparativoFiltrado ?? [];
    const ok = rows.filter((r) => r.cumplioCantidadCliente).length;
    const no = rows.length - ok;
    return [
      { name: "Cumple", value: ok },
      { name: "No cumple", value: no },
    ];
  }, [comparativoFiltrado]);
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec

    const enRango = rows.filter((r) => {
      const diffKg = Number(r.diffPesoCliente ?? 0);
      return diffKg >= -tolKg && diffKg <= tolKg;
    }).length;

    const porEncima = rows.filter((r) => Number(r.diffPesoCliente ?? 0) > tolKg).length;
    const porDebajo = rows.filter((r) => Number(r.diffPesoCliente ?? 0) < -tolKg).length;

    return [
      {
        name: `Range`,
        value: enRango,
        color: "#63af7f",
      },
      {
        name: `Upper`,
        value: porEncima,
        color: "#fd8d31",
      },
      {
        name: `Low`,
        value: porDebajo,
        color: "#e65d5b",
      },
    ].filter((x) => x.value > 0);
  }, [seriesMermasDetalladaFiltrada, toleranciaKgCliente]);

  // auqi mido la tolerancia por encima por debajo y en rango para graficas de piechart etc
  const pieToleranciaRango = useMemo(() => {
    const rows = (comparativoFiltrado ?? []).filter(
      (r) => !r.rechazado && !r.rechazadoCliente    // no tiene en cuenta rechazados 
    );

    const tol = Number(tolerancia ?? 0);

    const inRange = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      return diff >= -tol && diff <= tol;
    }).length;

    const above = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      return diff > tol;
    }).length;

    const below = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      return diff < -tol;
    }).length;

    return [
      {
        name: `En rango (-${formatNumber(tol)} a ${formatNumber(tol)})`,
        value: inRange,
        color: "#36b865",
      },
      {
        name: `Por encima (+>${formatNumber(tol)})`,
        value: above,
        color: "#ed6c02",
      },
      {
        name: `Por debajo (<-${formatNumber(tol)})`,
        value: below,
        color: "#e53935",
      },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado, tolerancia]);

  const hasAnyFilter =
    !!debouncedSearch ||
    !!filters.fecha ||
    !!filters.transportadora ||
    !!filters.cliente ||
    !!filters.producto;

  // =============================  CUSTOMER TOOLTIP RENDER  =====================================
  //tooltip personalizado para ver datos mas completos en grafica
  const CustomMermasTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const row = payload[0]?.payload;
    if (!row) return null;

    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 1.5,
          boxShadow: 3,
          minWidth: 260,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}> Detalle del registro</Typography>
        <Typography variant="body2"> <strong>Estado:</strong> {row.estadoProgramacion || "Sin estado"} </Typography>
        <Typography variant="body2"> <strong>Fecha:</strong> {row.fecha} </Typography>
        <Typography variant="body2"><strong>Cliente:</strong> {row.cliente || "Sin dato"}</Typography>
        <Typography variant="body2"> <strong>Conductor:</strong> {row.conductor || "Sin dato"}</Typography>
        <Typography variant="body2"><strong>Vol. despachado Amb.:</strong> {formatNumber(row.volumenDespachado)} L </Typography>
        <Typography variant="body2"> <strong>Vol. recibido cliente:</strong> {formatNumber(row.volumenRecibidoCliente)} L</Typography>
        <Typography variant="body2"><strong>Peso neto Báscula Ambiocom:</strong> {formatNumber(row.pesoNetoBasculaAmbiocom)} Kg </Typography>
        <Typography variant="body2"> <strong>Peso neto Báscula cliente:</strong> {formatNumber(row.pesoNetoCliente)} Kg </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" sx={{ color: "#a755ca" }}> <strong>Diff peso cliente:</strong> {formatNumber(row.diffPesoCliente)} </Typography>
        <Typography variant="body2" sx={{ color: "#ed6c02" }}> <strong>Diff volumen cliente:</strong> {formatNumber(row.diffVolCliente)} </Typography>
      </Box>
    );
  };

  const renderTooltipDiffKg = (row) => (
    <Box
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 3,
        minWidth: 250,
        color: "#111",
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}> Detalle diferencia Kg</Typography>
      <Typography variant="body2"><strong>Fecha:</strong> {row.fecha}</Typography>
      <Typography variant="body2"> <strong>Estado:</strong> {row.estadoProgramacion || "Sin estado"}</Typography>
      <Typography variant="body2"><strong>Conductor:</strong> {row.conductor || "Sin dato"}</Typography>
      <Typography variant="body2"><strong>Transportadora:</strong> {row.transportadora || "Sin dato"}</Typography>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2"><strong>Neto Ambiocom:</strong> {formatNumber(row.pesoNetoBasculaAmbiocom)} Kg
      </Typography>
      <Typography variant="body2"><strong>Neto cliente:</strong> {formatNumber(row.pesoNetoCliente)} Kg</Typography>
      <Typography variant="body2" sx={{ color: "#a755ca", fontWeight: 700 }}><strong>Diferencia:</strong> {formatNumber(row.diffKgBasculaClienteAmbiocom)} Kg</Typography>
    </Box>
  );

  return (
    <Box p={{ xs: 2, md: 4 }} mt={0}>
      <Card elevation={4} sx={{ borderRadius: 3, overflow: "visible" }}>
        <CardContent sx={{ overflow: "visible" }}>
          {/* TOP BAR */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Tooltip title="Volver al Inicio">
                <IconButton
                  onClick={handleBack}
                  color="primary"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>

              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.1}>
                  Analítica BI: Programado vs Despachado y Indicadores de
                  Cumplimiento.
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 16 }}
                >
                  Rango: <b>{range.from}</b> → <b>{range.to}</b> · Tolerancia:{" "}
                  <b>{formatNumber(tolerancia)}</b> L
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap", // para que en mobile se apilen
              }}
            >
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en tabla (fecha, transportadora, cliente, producto, cantidades...)"
                size="small"
                sx={{ flexGrow: 1, minWidth: { xs: "100%", md: 300, lg: 350 } }}
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

              <Button
                variant="outlined"
                size="medium"
                onClick={clearFilters}
                sx={{ whiteSpace: "nowrap" }}
              >
                Limpiar filtros
              </Button>
            </Box>
          </Box>

          {/* KPIs */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>

            <Tooltip title="Total de datos Analizados" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 240 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#E6D9FC",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Datos: ${kpis.filas}`}
              />
            </Tooltip>

            <Tooltip title="Despachos programados | Despachos Realizados" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 220 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                color={hasAnyFilter ? "primary" : "default"}
                label={`Desp. Prog: ${formatNumber(
                  kpis.viajesProgramados
                )} | Despachados: ${formatNumber(kpis.viajesRealizados)}`}
              />
            </Tooltip>

            <Tooltip title="Volumen Programado | Volumen Despachado" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#BBEDDA",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Vol. Progr: ${formatNumber(
                  kpis.cantidadProgramada
                )} L | Vol. Desp: ${formatNumber(kpis.cantidadReal)} L`}
              />
            </Tooltip>

            <Tooltip title="KPI Cumplimiento Volumen Programado vs Despachado" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                color={
                  Math.abs(kpis.diffTotal) <= tolerancia ? "success" : "warning"
                }
                label={`Diff Total: ${formatNumber(kpis.diffTotal)} L`}
                sx={{
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                  transition: "all 0.3s ease",
                  ...(Math.abs(kpis.diffTotal) > tolerancia && {
                    animation: "pulseGlow 1s infinite",
                  }),
                  "@keyframes pulseGlow": {
                    "0%": {
                      boxShadow: "0 0 0px rgba(255, 152, 0, 0.4)",
                      transform: "scale(1)",
                    },
                    "50%": {
                      boxShadow: "0 0 12px rgba(255, 152, 0, 0.9)",
                      transform: "scale(1.1)",
                    },
                    "100%": {
                      boxShadow: "0 0 0px rgba(255, 152, 0, 0.4)",
                      transform: "scale(1)",
                    },
                  },
                }}
              />
            </Tooltip>

            <Tooltip title="Diff Planta Σ" placement="top" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                label={`Diff Planta Σ: ${formatNumber(kpis.diffPlantaTotal)}`}
              />
            </Tooltip>

            <Tooltip title="Diff Cliente Σ" placement="top" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                label={`Diff Cliente Σ: ${formatNumber(kpis.diffClienteTotal)}`}
              />
            </Tooltip>
            <Tooltip title="% de registros cuyo volumen despachado quedó dentro de la tolerancia configurada" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#CBDAF7",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`% Cump Vol.: ${kpis.pctCumplCant.toFixed(1)}%`}
              />
            </Tooltip>

            <Tooltip title="% de registros donde hubo programación y también despacho real" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 240 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#D7F5E8",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`% Cump Desp.: ${kpis.pctCumplViaje.toFixed(1)}%`}
              />
            </Tooltip>

            <Tooltip title="KPI de cumplimiento de Despachos respecto a la programacion diaria" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#FFD8B8",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Desp Prog.: ${formatNumber(
                  kpiVehiculos.total
                )} | Cumplen: ${formatNumber(
                  kpiVehiculos.cumplidos
                )} | Rechazos: ${formatNumber(
                  kpiVehiculos.rechazados
                )} | ${kpiVehiculos.pct.toFixed(1)}%`}
              />
            </Tooltip>

            {loading && (
              <Tooltip title="hola" placement="top">
                <Chip color="warning" label="Cargando..." />
              </Tooltip>
            )}

          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Filtros */}
          <Grid container spacing={2}>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
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
                sx={{ width: { xs: "100%", md: 190 } }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                name="to"
                value={range.to}
                onChange={handleRangeChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />

              <TextField
                size="small"
                label="Tolerancia KPi (L)"
                type="number"
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />

              <TextField
                size="small"
                label="Tolerancia en el despacho (L)"
                type="number"
                value={toleranciaDespacho}
                onChange={(e) => setToleranciaDespacho(Number(e.target.value))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 220 } }}
              />
              <TextField
                size="small"
                label="Tolerancia Kg Diferencia Cliente"
                type="number"
                value={toleranciaKgCliente}
                onChange={(e) => setToleranciaKgCliente(Number(e.target.value))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 250 } }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => fetchAll(range)}
                >
                  Consultar
                </Button>
                <Tooltip title="Recarga datasets con el rango actual">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchAll(range)}
                  >
                    Refrescar
                  </Button>
                </Tooltip>

                <Tooltip title="Restablecer Filtro mes actual y anterior">
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={() => {
                      const def = getDefaultRange();
                      setRange(def);
                      fetchAll(def);
                    }}
                  >
                    Default (actual / anterior)
                  </Button>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
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
                {filterOptions.fechas.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
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
                {filterOptions.transportadoras.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
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
                {filterOptions.clientes.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
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
                {filterOptions.productos.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Gráficas con RECHA*/}
          <Grid container spacing={2}>
            {/* Line */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Typography fontWeight="bold" sx={{ mb: 1 }}>
                    KPI (V.Real-V.Programado) Volumen Real Despachado vs Volumen
                    Programado/Facturado (por día)
                  </Typography>
                  <Chip
                    size="medium"
                    variant="outlined"
                    label="Lineal Charts KPI"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  />
                </Box>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={seriesPorDia}
                    margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis
                      tickFormatter={(v) => formatNumber1D(v)}
                      domain={[
                        (dataMin) => dataMin - 20000,
                        (dataMax) => dataMax * 1.25,
                      ]}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#111827"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      ifOverflow="extendDomain"
                    />

                    <RTooltip formatter={(v) => formatNumber(v)} />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="programado"
                      stroke="#1976d2"
                      strokeWidth={2}
                      label={{
                        position: "top",
                        fontSize: 12,
                        formatter: (v) => formatNumber(v),
                      }}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke="#2e7d32"
                      strokeWidth={4}
                      label={{
                        position: "top",
                        fontSize: 12,
                        formatter: (v) => formatNumber(v),
                      }}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="natural"
                      dataKey="diff"
                      stroke="#ed6c02"
                      strokeWidth={2}
                      label={{
                        position: "top",
                        fontSize: 12,
                        formatter: (v) => formatNumber(v),
                      }}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Pie chart */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight="bold"
                      sx={{ fontWeight: 800, fontSize: { xs: 14, md: 16 } }}
                    >
                      (KPI) Analisis de Cumplimiento de Programación por
                      transportadora y Diferencias en Volumen.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Regla: Se analizan según cruce de información entre la
                      programación y los despachos reales, si un vehiculo o
                      Transportadora NO ESTÁ PROGRAMADO no será renderizado en
<<<<<<< HEAD
                      el gráfico. <strong>NOTA: Los Rechazos son excluidos de este análisis.</strong>
=======
                      el gráfico.
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
                    </Typography>
                  </Box>
                  <Chip
                    size="medium"
                    variant="outlined"
                    label="Pie Charts"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  />
                </Box>
                <Divider
                  sx={{
                    my: 2,
                    mb: 1,
                    width: "90vw",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                />
                <Grid container spacing={2} justifyContent="center">
                  {/* Pie 1 */}
                  <Grid item xs={12} md={3}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, textAlign: "center" }}
                      fontWeight="bold"
                    >
<<<<<<< HEAD
                      KPI cumplimiento por peso neto (Báscula Ambiocom vs Cliente) Según Tolerancia: ±{`${toleranciaKgCliente} Kg`}.
=======
                      KPI Cumplimiento Facturado vs Recibido por el cliente
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
                    </Typography>

                    <ResponsiveContainer width="100%" height={285}>
                      <PieChart >
                        <Pie
                          data={pieCumplimientoPeso}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={83}
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {pieCumplimientoPeso.map((entry, idx) => (
                            <Cell key={`cell-1-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>

                  {/* Pie 2 */}
                  <Grid item xs={12} md={5}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, textAlign: "center" }}
                      fontWeight="bold"
                    >
                      Resumen Cumplimiento de la programacion (Transportadoras)
                    </Typography>

                    <ResponsiveContainer width="100%" height={285}>
                      <PieChart>
                        <Pie
                          data={pieTransportadoras}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={90}
                          // label={({ name, value }) => `${name}: ${value}`}
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {pieTransportadoras.map((entry, idx) => (
                            <Cell key={`cell-2-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>

                  {/* Pie 3 */}
                  <Grid item xs={12} md={4}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, textAlign: "center" }}
                      fontWeight="bold"
                    >
                      Estado de cumplimiento según tolerancia: ±{`${tolerancia} L`} (En Rango / por
                      encima / Merma)
                    </Typography>

                    <ResponsiveContainer width="100%" height={285}>
                      <PieChart>
                        <Pie
                          data={pieToleranciaRango}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={90}
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {pieToleranciaRango.map((entry, idx) => (
                            <Cell key={`cell-tol-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            {/* Bar: diff por transportadora */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(180deg, rgba(17,24,39,0.03) 0%, rgba(17,24,39,0.00) 60%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{ fontWeight: 800, fontSize: { xs: 14, md: 16 } }}
                    >
                      KPI acumulado Diferencia (Volumen Programado -Volumen
                      Cliente) por transportadora
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Regla: Los acumulados positivos y negativos se visualizan
                      por transportadora para analizar las variaciones de
                      volumen de cada ítem.
                    </Typography>
                  </Box>

                  <Chip
                    size="medium"
                    variant="outlined"
                    label="Divergent Chart Analisys"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* ✅ Más alto para que se “llene” el área */}
                <ResponsiveContainer width="100%" height={520}>
                  <BarChart
                    data={seriesPosNegPorTransportadora}
                    margin={{ top: 16, right: 18, left: 10, bottom: 52 }} // ✅ menos bottom
                    barCategoryGap="12%" // ✅ barras más anchas
                    barGap={4}
                  >
                    {/* Patrón para NEGATIVOS (rayado) */}
                    <defs>
                      <pattern
                        id="negStripes"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                        patternTransform="rotate(45)"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          stroke="rgba(17,24,39,0.55)"
                          strokeWidth="2"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="transportadora"
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />

                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => formatNumber(v)}
                      domain={[
                        (dataMin) => dataMin * 1.25,
                        (dataMax) => dataMax * 1.15,
                      ]}
                    />
                    {/* Eje cero */}
                    <ReferenceLine
                      y={0}
                      stroke="#111827"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <RTooltip
                      formatter={(v, name) => [`${formatNumber(v)} L`, name]}
                      labelFormatter={(label) => `Transportadora: ${label}`}
                      cursor={{ fill: "rgba(17,24,39,0.06)" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 6 }} />
                    {/* ===================== POSITIVOS ===================== */}
                    <Bar
                      dataKey="positivos"
                      name="Positivos"
                      radius={[3, 10, 0, 0]}
                      stroke="rgba(17,24,39,0.35)"
                      strokeWidth={0.6}
                      maxBarSize={64}
                    >
                      <LabelList
                        dataKey="positivos"
                        position="top"
                        formatter={(v) => (v ? `${formatNumber(v)}` : "")}
                        style={{
                          fontSize: 12,
                          fill: "#111827",
                          fontWeight: 700,
                        }}
                      />
                      {seriesPosNegPorTransportadora.map((d, i) => (
                        <Cell
                          key={`pos-${i}`}
                          fill={colorByTransportadora.get(d.transportadora)}
                          fillOpacity={1}
                        />
                      ))}
                    </Bar>

                    {/* ===================== NEGATIVOS ===================== */}
                    <Bar
                      dataKey="negativos"
                      name="Negativos"
                      radius={[10, 3, 0, 0]}
                      stroke="rgba(17, 24, 39, 0.84)"
                      strokeWidth={0.6}
                      maxBarSize={64}
                    >
                      <LabelList
                        dataKey="negativos"
                        position="bottom"
                        offset={10}
                        formatter={(v) => (v ? `${formatNumber(v)}` : "")}
                        style={{
                          fontSize: 12,
                          fill: "#111827",
                          fontWeight: 700,
                        }}
                      />
                      {seriesPosNegPorTransportadora.map((d, i) => (
                        <Cell
                          key={`neg-${i}`}
                          fill={colorByTransportadora.get(d.transportadora)}
                          fillOpacity={0.58}
                        />
                      ))}
                    </Bar>

                    {/* Capa “rayada” sobre los negativos */}
                    <Bar dataKey="negativos" hide>
                      {seriesPosNegPorTransportadora.map((_, i) => (
                        <Cell key={`neg-stripe-${i}`} fill="url(#negStripes)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            {/* Grafina lineal kilos s volumen */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography fontWeight="bold" sx={{ mb: 1 }}>
                      Análisis de Variaciones de Volumen y Peso en Báscula (Mermas Reportadas por el Cliente)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Regla: Se analizan todos los datos filtrados programados y no programados a excepcion
                      de aquellos que fueron rechazados en ambiocom o rechazados por el cliente.
                    </Typography>
                  </Box>
                  <Chip
                    size="medium"
                    variant="outlined"
                    label="Lineal Charts KPI"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  />
                </Box>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={seriesMermasDetalladaFiltrada}
                    margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="item" hide />
                    <YAxis
                      tickFormatter={(v) => formatNumber1D(v)}
                      domain={[
                        (dataMin) => dataMin - 5000,
                        (dataMax) => dataMax + 5000,
                      ]}
                    />

                    <ReferenceLine
                      y={0}
                      stroke="#111827"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      ifOverflow="extendDomain"
                    />

                    <RTooltip
                      content={<CustomMermasTooltip />}
                      offset={20}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ transform: "translateY(-110%)" }}
                      cursor={{ stroke: "#9CA3AF", strokeWidth: 1 }}
                    />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="diffVolCliente"
                      name="Diff volumen cliente"
                      stroke="#ed6c02"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="diffPesoCliente"
                      name="Diff peso cliente"
                      stroke="#9f5bbc"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            {/* Bar apilado Cumplidos vs Rechazados por transportadora */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography fontWeight="bold" sx={{ mb: 0 }}>
                      KPI cumplimiento de la programación por transportadora
                      (Cumplidos vs Rechazados)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Regla: Se analizan según cruce de información entre la
                      programación y los despachos reales, si un vehiculo o
                      Transportadora NO ESTÁ PROGRAMADO no será renderizado en
                      el gráfico.
                    </Typography>
                  </Box>
                  <Chip
                    size="medium"
                    variant="outlined"
                    label="KPI Chart Cumplimiento por transportadora"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  />
                </Box>

                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={seriesCumplimientoPorTransportadora}
                    margin={{ top: 10, right: 15, left: 5, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="transportadora"
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(v) => formatNumber1D(v)} />
                    <RTooltip
                      formatter={(val, name) => {
                        const map = {
                          programados: "Programados",
                          cumplidos: "Cumplidos",
                          rechazadosAmbiocom: "Rechazados Ambiocom",
                          rechazadosCliente: "Rechazados Cliente",
                          Programados: "Programados",
                          Cumplidos: "Cumplidos",
                          "Rechazados Ambiocom": "Rechazados Ambiocom",
                          "Rechazados Cliente": "Rechazados Cliente",
                        };

                        return [formatNumber(val), map[name] ?? String(name)];
                      }}
                    />
                    <Legend />

                    {/* PROGRAMADOS */}
                    <Bar
                      dataKey="programados"
                      name="Programados"
                      fill="#4f51cb"
                      radius={[6, 6, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 12,
                        formatter: (v) => `Programados: ${formatNumber(v)}`,
                      }}
                    />

                    {/* CUMPLIDOS */}
                    <Bar
                      dataKey="cumplidos"
                      name="Cumplidos"
                      fill="#70a189"
                      radius={[6, 6, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 12,
                        formatter: (v) => `Cumple: ${formatNumber(v)}`,
                      }}
                    />

                    {/* RECHAZADOS AMBIOCOM */}
                    {hasRechazosAmbiocom && (
                      <Bar
                        dataKey="rechazadosAmbiocom"
                        name="Rechazados Ambiocom"
                        stackId="rechazos"
                        fill="#EF4444"
                        radius={[6, 6, 0, 0]}
                        label={{
                          position: "top",
                          fill: "#111827",
                          fontSize: 12,
                          formatter: (v) => (v ? `Rechazo Amb.: ${formatNumber(v)}` : ""),
                        }}
                      />
                    )}

                    {/* RECHAZADOS CLIENTE */}
                    {hasRechazosCliente && (
                      <Bar
                        dataKey="rechazadosCliente"
                        name="Rechazados Cliente"
                        stackId="rechazos"
                        fill="#F59E0B"
                        radius={[6, 6, 0, 0]}
                        label={{
                          position: "top",
                          fill: "#111827",
                          fontSize: 12,
                          formatter: (v) => (v ? `Rechazo Clie.: ${formatNumber(v)}` : ""),
                        }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Tabla comparativa + Heatmap */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Tabla comparativa (Heatmap por diferencia)
          </Typography>

          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              borderRadius: 2,
              overflow: "visible",
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                tableLayout: "fixed",
                "& thead th": {
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: "linear-gradient(135deg, #f8f8f8, #f3f3f3)",
                },
                "& tbody td": { fontSize: 13, py: 0.5 },
                "& tbody th": { fontSize: 10, py: 0.5 },
                "& th": {
                  fontSize: 12,
                  fontWeight: 400,
                  py: 0,
                },
              }}
            >
              <TableHead >
                <TableRow>
                  <TableCell align="center"
                    sx={{ width: "auto", minWidth: 120, maxWidth: 120 }}
                  >
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Transportadora</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Producto</strong>
                  </TableCell>

                  <TableCell align="center">
                    <strong>Vehiculo Programado</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Vehiculo Despachado</strong>
                  </TableCell>

                  <TableCell align="center">
                    <strong>Cantidad Programada</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Cant Despa Gravimetrico</strong>
                  </TableCell>
<<<<<<< HEAD
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="Diferencia entre el volumen gravimetrico y el volumen facturado, determina que tanto o menos se despacha a clientes (< 0 = por encima de lo facturado)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diferencia Gravimetrico - Facturado</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Diferencia Volumen Contador Despacho - Volumen Facturado"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diff V.Ambiocom Cont-Fact</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Diferencia Volumen Facturado Ambiocom - Volumen Recibido por el cliente"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diff V.Cliente Fact-RClie</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="Diferencia entre el peso neto Báscula Ambiocom vs Báscula Cliente"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diff Kg B.Ambio-B.Cliente</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Volumen Programado vs Volumen Real Despachado (<100 = Despachado por encima de lo Facturado ; >100 = Despachado por debajo de lo facturado)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>KPI Despacho (Vp-Vd)</strong>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Vechiculo en programación y vechiculo despachado (SI=100% ; NO= 0,0%)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Cumple Despachos Programados ?</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Cantidad programada vs Despachada según tolerancia en el Despacho"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Cumple Cantidad Despachada ?</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Volumen recibido por el cliente vs Volumen Facturado Ambiocom"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Client/Desp</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Estado del vehiculo (rechazo en planta o rechazo por el cliente)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Vehiculo Rechazado ?</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI de estado en tiempo real del vehiculo (Rechazado por el cliente; rechazado en planta; En proceso = En Cargue o En Transito; Aprobado con observaciones; Cumple = Programado y Despachado; Programado pero no despachado; Despachado pero no Programado; No programado = despachado pero no estaba programado )"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Estado Vehiculo</strong>
                    </Tooltip>
                  </TableCell>
=======
                  <Tooltip
                    placement="top"
                    title="Diferencia entre el volumen gravimetrico y el volumen facturado, determina que tanto o menos se despacha a clientes (< 0 = por encima de lo facturado)"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Diferencia Gravimetrico - Facturado</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Diferencia Volumen Contador Despacho - Volumen Facturado"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Diff V.Ambio</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Diferencia Volumen Facturado Ambiocom - Volumen Recibido por el cliente"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Diff V.Cliente</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Volumen Facturado vs Volumen Real Despachado (<100 = Despachado por encima de lo Facturado ; >100 = Despachado por debajo de lo facturado)"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>KPI Despacho (Vp-Vd)</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Vechiculo en programación y vechiculo despachado (SI=100% ; NO= 0,0%)"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Cumple Despachos Programados ?</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Cantidad programada vs Despachada según tolerancia en el Despacho"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Cumple Cantidad Despachada ?</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Volumen recibido por el cliente vs Volumen Facturado Ambiocom"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Client/Desp</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI Estado del vehiculo (rechazo en planta o rechazo por el cliente)"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Vehiculo Rechazado ?</strong>
                    </TableCell>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title="KPI de estado en tiempo real del vehiculo (Rechazado por el cliente; rechazado en planta; En proceso = En Cargue o En Transito; Aprobado con observaciones; Cumple = Programado y Despachado; Programado pero no despachado; Despachado pero no Programado; No programado = despachado pero no estaba programado )"
                    slotProps={{
                      tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                    }}
                  >
                    <TableCell align="center">
                      <strong>Estado Vehiculo</strong>
                    </TableCell>
                  </Tooltip>
>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
                </TableRow>
              </TableHead>

              <TableBody>
                {comparativoFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">
                        No hay resultados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prueba cambiando rango, filtros o búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  comparativoFiltrado.map((r, idx) => {
                    const prev = comparativoFiltrado[idx - 1];
                    const nuevaFecha = !prev || prev.fecha !== r.fecha;

                    return (
                      <Fragment key={r.key}>
                        {nuevaFecha && (
                          <TableRow>
                            <TableCell
                              colSpan={18}
                              sx={{
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                                backgroundColor: "rgba(25, 118, 210, 0.08)",
                                fontWeight: "bold",
                                py: 1,
                              }}
                            >
                              📅 {r.fecha}
                            </TableCell>
                          </TableRow>
                        )}

                        <TableRow hover>
                          <TableCell>{r.fecha}</TableCell>
                          <TableCell>{r.transportadora}</TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 260,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={r.cliente}
                          >
                            {r.cliente}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 260,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={r.producto}
                          >
                            {r.producto}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(r.viajesProgramados)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.viajesRealizados)}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(r.cantidadProgramada)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.cantidadRealPlanta)}
                          </TableCell>
                          <Tooltip placement="top" title={`Tolerancia en el Despacho: ${toleranciaDespacho}`}>
                            <TableCell
                              align="right"
                              sx={{
                                backgroundColor: heatBg(
                                  r.diffCantidad,
                                  tolerancia
                                ),
                              }}
                            >
                              {formatNumber(r.diffCantidad)}
                            </TableCell>
                          </Tooltip>

                          <TableCell align="right">
                            {formatNumber(r.diffPlanta)}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(r.diffCliente)}
                          </TableCell>
<<<<<<< HEAD
                          <TableCell
                            align="right"
                            sx={{
                              backgroundColor: heatBgKg(
                                r.diffKgBasculaClienteAmbiocom,
                                toleranciaKgCliente
                              ),
                              fontWeight: 600,
                            }}
                          >
                            <Tooltip
                              arrow
                              placement="top"
                              title={renderTooltipDiffKg(r)}
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: "transparent",
                                    boxShadow: "none",
                                    p: 0,
                                    maxWidth: "none",
                                  },
                                },
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-block",
                                  width: "100%",
                                  cursor: "help",
                                }}
                              >
                                {formatNumber(r.diffKgBasculaClienteAmbiocom)}
                              </Box>
                            </Tooltip>
                          </TableCell>
=======

>>>>>>> 0fc2086be501d2a9da917848659f272099357eec
                          <TableCell
                            align="right"
                            sx={{
                              backgroundColor: heatCumplimiento(
                                r.cumplimientoPct
                              ),
                              fontWeight: 600,
                            }}
                          >
                            {r.cumplimientoPct.toFixed(1)}%
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={r.cumplioViaje ? "SI" : "NO"}
                              color={r.cumplioViaje ? "success" : "error"}
                            />
                          </TableCell>
                          <Tooltip placement="top" title={`Tolerancia en el Despacho: ${toleranciaDespacho}`}>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={r.cumplioCantidadDespachada ? "SI" : "NO"}
                                color={
                                  r.cumplioCantidadDespachada
                                    ? "success"
                                    : "error"
                                }
                              />
                            </TableCell>
                          </Tooltip>

                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={r.cumplioCantidadCliente ? "SI" : "NO"}
                              color={
                                r.cumplioCantidadCliente ? "success" : "error"
                              }
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip
                              arrow
                              placement="top"
                              title={
                                r.rechazado
                                  ? "Vehículo Rechazado"
                                  : "Vehículo Aceptado"
                              }
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    fontSize: 14,
                                  },
                                },
                              }}
                            >
                              <Chip
                                size="small"
                                icon={
                                  r.rechazado ? <CancelIcon /> : <CheckIcon />
                                }
                                color={r.rechazado ? "error" : "success"}
                                sx={{
                                  width: 25,
                                  justifyContent: "center",
                                  "& .MuiChip-icon": {
                                    marginLeft: 1.5,
                                  },
                                }}
                              />
                            </Tooltip>
                          </TableCell>

                          <TableCell align="center" sx={{ width: 350 }}>
                            <Tooltip
                              arrow
                              placement="top"
                              title={r.estadoProgramacion}
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    fontSize: 14,
                                  },
                                },
                              }}
                            >
                              <Chip
                                size="medium"
                                // label={r.estadoProgramacion}
                                icon={
                                  r.estadoProgramacion === "Cumple" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.5}
                                    >
                                      <PlaylistAddCheckIcon
                                        fontSize="medium"
                                        sx={{ fontSize: 30, color: "#4DBD5B" }}
                                      />
                                      <LocalShippingIcon
                                        fontSize="small"
                                        sx={{ fontSize: 27, color: "#6384BF" }}
                                      />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "Programado (no despachado)" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.5}
                                    >
                                      <PlaylistAddCheckIcon
                                        fontSize="medium"
                                        sx={{ fontSize: 30, color: "#4DBD5B" }}
                                      />
                                      <LocalShippingIcon
                                        fontSize="small"
                                        sx={{ fontSize: 27, color: "#F07D8C" }}
                                      />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "No programado" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.5}
                                    >
                                      <PlaylistRemoveIcon
                                        fontSize="medium"
                                        sx={{ fontSize: 30, color: "#E35542" }}
                                      />
                                      <LocalShippingIcon
                                        fontSize="small"
                                        sx={{ fontSize: 27, color: "#248F4A" }}
                                      />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "Rechazado por cliente" ? (
                                    <UndoIcon
                                      sx={{
                                        fontSize: 26,
                                        color: "red !important",
                                      }}
                                    />
                                  ) : r.estadoProgramacion ===
                                    "Rechazado Ambiocom" ? (
                                    <PersonRemoveAlt1Icon
                                      sx={{
                                        fontSize: 26,
                                        color: "#9E7CCF !important",
                                      }}
                                    />
                                  ) : r.estadoProgramacion ===
                                    "Aprobado con observaciones" ? (
                                    <ReportIcon
                                      sx={{
                                        fontSize: 26,
                                        color: "orange !important",
                                      }}
                                    />
                                  ) : r.estadoProgramacion === "En proceso" ? (
                                    <LocalGasStationIcon
                                      sx={{
                                        fontSize: 26,
                                        color: "#64A7CC !important",
                                      }}
                                    />
                                  ) : (
                                    <LocalGasStationIcon />
                                  )
                                }
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Nota: este módulo asume que <b>programación</b> se consulta en{" "}
              <code>{`${API_PROGRAMACION}/rango?from&to`}</code> y{" "}
              <b>despachos</b> en{" "}
              <code>{`${API_DESPACHOS}/rango?from&to`}</code>.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalisisDespachosBIPage;
