import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

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

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  if (Number.isNaN(x)) return "0";
  return x.toLocaleString("es-CO");
};

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
  return dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd;
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

// ===== NUEVO: Rechazo / Cumplimiento (salió de planta) =====
const isVehiculoRechazado = (d) => {
  const v = normalizeText(d?.lecturas?.vehiculo_rechazado);
  return v.toUpperCase() === "SI";
};

const getDespachoInfo = (d) => ({
  fecha: normalizeText(d?.fecha),
  transportadora: normalizeKey(d?.lecturas?.transportadora),
  cliente: normalizeKey(d?.lecturas?.cliente),
  producto: normalizeKey(d?.lecturas?.producto),
  rechazado: isVehiculoRechazado(d),
});

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

const buildComparativo = ({ programaciones, despachos, tolerancia = 0 }) => {
  const progMap = aggregate(programaciones, keyProgramacion, (p) => p?.cantidad);
  const realMap = aggregate(despachos, keyDespacho, getDespachoCantidadRealPlanta);
  const plantaMap = aggregate(despachos, keyDespacho, getDespachoDifPlanta);
  const clienteDifMap = aggregate(despachos, keyDespacho, getDespachoDifCliente);

  const keys = new Set([
    ...progMap.keys(),
    ...realMap.keys(),
    ...plantaMap.keys(),
    ...clienteDifMap.keys(),
  ]);

  const out = [];
  for (const key of keys) {
    const [fecha, transportadora, cliente, producto] = key.split("|");
    if (!isValidDateISO(fecha)) continue;

    const p = progMap.get(key);
    const r = realMap.get(key);
    const pl = plantaMap.get(key);
    const dc = clienteDifMap.get(key);

    const viajesProgramados = p?.viajes ?? 0;
    const viajesReales = r?.viajes ?? 0;

    const cantidadProgramada = p?.cantidad ?? 0;
    const cantidadRealPlanta = r?.cantidad ?? 0;

    const diffCantidad = cantidadProgramada - cantidadRealPlanta;

    const diffPlanta = pl?.cantidad ?? 0;
    const diffCliente = dc?.cantidad ?? 0;

    const cumplimientoPct =
      cantidadProgramada > 0 ? (cantidadRealPlanta / cantidadProgramada) * 100 : 0;

    const tieneProgramacion = (viajesProgramados ?? 0) > 0;
    const tieneDespacho = (viajesReales ?? 0) > 0;

    let estadoProgramacion = "Sin datos";
    if (tieneProgramacion && tieneDespacho) estadoProgramacion = "Programado y despachado";
    else if (tieneProgramacion && !tieneDespacho) estadoProgramacion = "Programado (no despachado)";
    else if (!tieneProgramacion && tieneDespacho) estadoProgramacion = "No programado";
    else estadoProgramacion = "Sin datos";

    out.push({
      key,
      fecha,
      transportadora,
      cliente,
      producto,
      viajesProgramados,
      viajesReales,
      cantidadProgramada,
      cantidadRealPlanta,
      diffCantidad,
      diffPlanta,
      diffCliente,
      cumplimientoPct,
      tieneProgramacion,
      tieneDespacho,
      estadoProgramacion,
      cumplioViaje: viajesReales >= viajesProgramados && viajesProgramados > 0,
      cumplioCantidad:
        cantidadProgramada > 0 &&
        Math.abs(diffCantidad) <= Number(tolerancia ?? 0),
    });

  }

  out.sort((a, b) =>
    a.fecha === b.fecha
      ? a.transportadora.localeCompare(b.transportadora)
      : a.fecha.localeCompare(b.fecha)
  );

  return out;
};

// UI: módulo BI
const AnalisisDespachosBIPage = () => {
  const navigate = useNavigate();

  const [range, setRange] = useState(() => getDefaultRange());
  const [programaciones, setProgramaciones] = useState([]);
  const [despachos, setDespachos] = useState([]);

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    fecha: "",
    transportadora: "",
    cliente: "",
    producto: "",
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [tolerancia, setTolerancia] = useState(100);

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

  const comparativo = useMemo(() => {
    return buildComparativo({
      programaciones,
      despachos,
      tolerancia,
    });
  }, [programaciones, despachos, tolerancia]);

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
        String(r.viajesReales),
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
    if (filters.transportadora) out = out.filter((r) => r.transportadora === fT);
    if (filters.cliente) out = out.filter((r) => r.cliente === fC);
    if (filters.producto) out = out.filter((r) => r.producto === fP);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const hay = [r.fecha, r.transportadora, r.cliente, r.producto].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [despachos, filters, debouncedSearch]);

  // KPIs principales (comparativo)
  const kpis = useMemo(() => {
    const rows = comparativoFiltrado ?? [];

    const viajesProgramados = rows.reduce((acc, r) => acc + (r.viajesProgramados ?? 0), 0);
    const viajesReales = rows.reduce((acc, r) => acc + (r.viajesReales ?? 0), 0);

    const cantidadProgramada = rows.reduce((acc, r) => acc + (r.cantidadProgramada ?? 0), 0);
    const cantidadReal = rows.reduce((acc, r) => acc + (r.cantidadRealPlanta ?? 0), 0);

    const diffTotal = rows.reduce((acc, r) => acc + (r.diffCantidad ?? 0), 0);
    const diffPlantaTotal = rows.reduce((acc, r) => acc + (r.diffPlanta ?? 0), 0);
    const diffClienteTotal = rows.reduce((acc, r) => acc + (r.diffCliente ?? 0), 0);

    const cumplidosCantidad = rows.filter((r) => r.cumplioCantidad).length;
    const cumplidosViaje = rows.filter((r) => r.cumplioViaje).length;

    const pctCumplCant = rows.length ? (cumplidosCantidad / rows.length) * 100 : 0;
    const pctCumplViaje = rows.length ? (cumplidosViaje / rows.length) * 100 : 0;

    return {
      filas: rows.length,
      viajesProgramados,
      viajesReales,
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
      const prev = m.get(r.fecha) || { fecha: r.fecha, programado: 0, real: 0, diff: 0 };
      prev.programado += r.cantidadProgramada;
      prev.real += r.cantidadRealPlanta;
      prev.diff += r.diffCantidad;
      m.set(r.fecha, prev);
    }
    return Array.from(m.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [comparativoFiltrado]);

  // Series: Diferencia por transportadora (barras con colores)
  const seriesPorTransportadora = useMemo(() => {
    const m = new Map();
    for (const r of comparativoFiltrado) {
      const key = r.transportadora || "(SIN TRANSPORTADORA)";
      const prev = m.get(key) || { transportadora: key, diff: 0, programado: 0, real: 0 };
      prev.diff += r.diffCantidad;
      prev.programado += r.cantidadProgramada;
      prev.real += r.cantidadRealPlanta;
      m.set(key, prev);
    }
    return Array.from(m.values()).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [comparativoFiltrado]);

  // ===== NUEVO: Cumplimiento por transportadora (Cumplidos vs Rechazados) =====
  const seriesCumplimientoPorTransportadora = useMemo(() => {
    const m = new Map();

    for (const d of despachosFiltrados) {
      const key = d.transportadora || "(SIN TRANSPORTADORA)";
      const prev = m.get(key) || {
        transportadora: key,
        viajes: 0,
        cumplidos: 0,
        rechazados: 0,
        pctCumpl: 0,
      };

      prev.viajes += 1;
      if (d.rechazado) prev.rechazados += 1;
      else prev.cumplidos += 1;

      m.set(key, prev);
    }

    const out = Array.from(m.values()).map((x) => ({
      ...x,
      pctCumpl: x.viajes ? (x.cumplidos / x.viajes) * 100 : 0,
    }));

    out.sort((a, b) => b.viajes - a.viajes);
    return out;
  }, [despachosFiltrados]);

  // Pie: Cumple vs No cumple (cantidad)
  const pieCumplimiento = useMemo(() => {
    const rows = comparativoFiltrado ?? [];
    const ok = rows.filter((r) => r.cumplioCantidad).length;
    const no = rows.length - ok;
    return [
      { name: "Cumple", value: ok },
      { name: "No cumple", value: no },
    ];
  }, [comparativoFiltrado]);

  const hasAnyFilter =
    !!debouncedSearch || !!filters.fecha || !!filters.transportadora || !!filters.cliente || !!filters.producto;

  const barColors = [
    "#3B82F6",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#14B8A6",
    "#EC4899",
    "#6366F1",
  ];

  return (
    <Box p={{ xs: 2, md: 4 }} mt={0}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
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
              <Tooltip title="Volver">
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
                  Analítica BI: Programado vs Despachado y Cumplimiento de Transportadoras
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rango: <b>{range.from}</b> → <b>{range.to}</b> · Tolerancia: <b>{formatNumber(tolerancia)}</b> L
                </Typography>
              </Box>
            </Box>

            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en tabla (fecha, transportadora, cliente, producto, cantidades...)"
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
                    <IconButton size="small" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* KPIs */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip label={`Filas: ${kpis.filas}`} />
            <Chip
              color={hasAnyFilter ? "primary" : "default"}
              label={`Viajes Prog: ${formatNumber(kpis.viajesProgramados)} | Reales: ${formatNumber(kpis.viajesReales)}`}
            />
            <Chip
              label={`Vol Prog: ${formatNumber(kpis.cantidadProgramada)} L | Real: ${formatNumber(kpis.cantidadReal)} L`}
            />
            <Chip
              color={Math.abs(kpis.diffTotal) <= tolerancia ? "success" : "warning"}
              label={`Diff Total: ${formatNumber(kpis.diffTotal)} L`}
            />
            <Chip label={`Diff Planta Σ: ${formatNumber(kpis.diffPlantaTotal)}`} />
            <Chip label={`Diff Cliente Σ: ${formatNumber(kpis.diffClienteTotal)}`} />
            <Chip
              color="info"
              label={`% Cumpl Cant: ${kpis.pctCumplCant.toFixed(1)}% | % Cumpl Viaje: ${kpis.pctCumplViaje.toFixed(1)}%`}
            />

            {/* NUEVO: KPI de salidas/rechazos por vehiculo_rechazado */}
            <Chip
              color={kpiVehiculos.rechazados > 0 ? "warning" : "success"}
              label={`Viajes (Despachos): ${formatNumber(kpiVehiculos.total)} | Cumplen: ${formatNumber(
                kpiVehiculos.cumplidos
              )} | Rechazos: ${formatNumber(kpiVehiculos.rechazados)} | ${kpiVehiculos.pct.toFixed(1)}%`}
            />

            {loading && <Chip color="warning" label="Cargando..." />}
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
                label="Tolerancia (L)"
                type="number"
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value ?? 0))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained" size="small" onClick={() => fetchAll(range)}>
                  Consultar
                </Button>

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
                  Default (mes actual + anterior)
                </Button>

                <Tooltip title="Recarga datasets con el rango actual">
                  <Button variant="text" size="small" startIcon={<RefreshIcon />} onClick={() => fetchAll(range)}>
                    Refrescar
                  </Button>
                </Tooltip>

                <Button variant="outlined" size="small" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Fecha" name="fecha" value={filters.fecha} onChange={handleFilterChange}>
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
              <TextField select fullWidth size="small" label="Cliente" name="cliente" value={filters.cliente} onChange={handleFilterChange}>
                <MenuItem value="">(Todos)</MenuItem>
                {filterOptions.clientes.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Producto" name="producto" value={filters.producto} onChange={handleFilterChange}>
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

          {/* Gráficas */}
          <Grid container spacing={2}>
            {/* Line */}
            <Grid item xs={12} md={7}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Programado vs Real (por día)
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={seriesPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="programado" />
                    <Line type="monotone" dataKey="real" />
                    <Line type="monotone" dataKey="diff" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Pie */}
            <Grid item xs={12} md={5}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Cumplimiento (Cantidad, según tolerancia)
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieCumplimiento}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieCumplimiento.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.name === "Cumple" ? "#36b865" : "#2249e6"} />
                      ))}
                    </Pie>
                    <RTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Bar: diff por transportadora */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Diferencia (Programado - Real) por transportadora
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={seriesPorTransportadora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="transportadora" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Bar
                      dataKey="diff"
                      label={{
                        position: "inside",
                        fill: "#FFFFFF",
                        fontSize: 12,
                      }}
                    >
                      {seriesPorTransportadora.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Bar apilado Cumplidos vs Rechazados por transportadora */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Programación por transportadora: Programados vs Cumplidos vs Rechazados
                </Typography>

                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={seriesCumplimientoPorTransportadora}
                    margin={{ top: 25, right: 20, left: 10, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="transportadora"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />

                    <RTooltip
                      formatter={(val, name) => {
                        const nombre =
                          name === "programados"
                            ? "Programados"
                            : name === "cumplidos"
                              ? "Cumplidos"
                              : "Rechazados";
                        return [formatNumber(val), nombre];
                      }}
                    />

                    <Legend />

                    {/* PROGRAMADOS */}
                    <Bar
                      dataKey="programados"
                      name="Programados"
                      fill="#4f51cb"
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 12,
                        formatter: (v) => `Prog: ${formatNumber(v)}`,
                      }}
                    />

                    {/* CUMPLIDOS */}
                    <Bar
                      dataKey="cumplidos"
                      name="Cumplidos"
                      fill="#a4aea9"
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 12,
                        formatter: (v) => `Cumple: ${formatNumber(v)}`,
                      }}
                    />

                    {/* RECHAZADOS */}
                    <Bar
                      dataKey="rechazados"
                      name="Rechazados"
                      fill="#EF4444"
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 12,
                        formatter: (v) => `Rechazo: ${formatNumber(v)}`,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Regla: si <b>vehiculo_rechazado</b> es <b>"SI"</b> → Rechazado. Si es distinto → Cumplido (salió de planta).
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Tabla comparativa + Heatmap */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Tabla comparativa (Heatmap por diferencia)
          </Typography>

          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Transportadora</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Producto</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>Viajes Prog</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Viajes Reales</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>Cant Prog</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Cant Real Planta</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>Diff Cant</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Diff Planta</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Diff Cliente</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>% Cumpl</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>OK Viaje ?</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>OK Cant ?</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Estado Vehiculo</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {comparativoFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prueba cambiando rango, filtros o búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  comparativoFiltrado.map((r) => (
                    <TableRow key={r.key} hover>
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

                      <TableCell align="right">{formatNumber(r.viajesProgramados)}</TableCell>
                      <TableCell align="right">{formatNumber(r.viajesReales)}</TableCell>

                      <TableCell align="right">{formatNumber(r.cantidadProgramada)}</TableCell>
                      <TableCell align="right">{formatNumber(r.cantidadRealPlanta)}</TableCell>

                      <TableCell align="right" sx={{ backgroundColor: heatBg(r.diffCantidad, tolerancia) }}>
                        {formatNumber(r.diffCantidad)}
                      </TableCell>

                      <TableCell align="right">{formatNumber(r.diffPlanta)}</TableCell>
                      <TableCell align="right">{formatNumber(r.diffCliente)}</TableCell>

                      <TableCell align="right">{r.cumplimientoPct.toFixed(1)}%</TableCell>

                      <TableCell align="center">
                        <Chip size="small" label={r.cumplioViaje ? "SI" : "NO"} color={r.cumplioViaje ? "success" : "default"} />
                      </TableCell>

                      <TableCell align="center">
                        <Chip size="small" label={r.cumplioCantidad ? "SI" : "NO"} color={r.cumplioCantidad ? "success" : "error"} />
                      </TableCell>
                      <TableCell align="center" sx={{width:350}}>
                        <Chip
                          size="small"
                          label={r.estadoProgramacion}
                          color={
                            r.estadoProgramacion === "Programado y despachado"
                              ? "success"
                              : r.estadoProgramacion === "Programado (no despachado)"
                                ? "warning"
                                : r.estadoProgramacion === "No programado"
                                  ? "error"
                                  : "default"
                          }
                          variant={r.estadoProgramacion === "No programado" ? "filled" : "outlined"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Nota: este módulo asume que <b>programación</b> se consulta en <code>{`${API_PROGRAMACION}/rango?from&to`}</code> y{" "}
              <b>despachos</b> en <code>{`${API_DESPACHOS}/rango?from&to`}</code>.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalisisDespachosBIPage;