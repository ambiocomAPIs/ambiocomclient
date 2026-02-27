import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

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
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = "https://ambiocomserver.onrender.com/api/programaciondespacho";

const API_CONDUCTORES = "https://ambiocomserver.onrender.com/api/conductores";
const API_CLIENTES = "https://ambiocomserver.onrender.com/api/clienteslogistica";
const API_PRODUCTOS = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";
const API_DESTINOS = "https://ambiocomserver.onrender.com/api/destinos";
const API_TRANSPORTADORAS = "https://ambiocomserver.onrender.com/api/transportadoraslogistica";

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// aqui controlo los estilos de lo inputts de nueva programacion
const INPUT_SX_COMPACT = {
  "& .MuiInputBase-root": {
    height: 40,
    fontSize: 13,
  },
  "& .MuiInputBase-input": {
    padding: "8px 10px",
  },
  "& .MuiInputLabel-root": {
    fontSize: 15,
    top: "-3px",
  },
  "& .MuiInputLabel-shrink": {
    top: 0,
  },
};

// HELPERS (normalización)
const normalizeText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDestino = (v) => normalizeText(v).toUpperCase();
const normalizeUpper = (v) => normalizeText(v).toUpperCase();

const normalizePlate = (v) =>
  normalizeUpper(v)
    .replace(/\s+/g, "")
    .trim();

/** Valida formato ISO YYYY-MM-DD */
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

// ============================
// HELPERS FECHAS (rango por defecto: mes anterior + mes actual)
// ============================
const pad2 = (n) => String(n).padStart(2, "0");

// Convierte Date a YYYY-MM-DD (sin zonas raras)
const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const getDefaultRange = () => {
  const now = new Date();

  // primer día del mes actual
  const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // primer día del mes anterior
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // último día del mes actual (para incluir todo el mes, incluso programaciones futuras)
  const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: toISODate(startPrevMonth),
    to: toISODate(endCurrentMonth),
  };
};

const ProgramacionDespachoDiariaPage = () => {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // buscador global
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  // filtros tipo BI
  const [filters, setFilters] = useState({
    fecha: "",
    cliente: "",
    producto: "",
    transportadora: "",
    destino: "",
  });

  // ✅ filtro por rango (date pickers)
  const [range, setRange] = useState(() => getDefaultRange());

  // formulario
  const [form, setForm] = useState({
    fecha: "", // ISO YYYY-MM-DD (date picker)
    placa: "",
    trailer: "",
    conductor: "",
    transportadora: "",
    cliente: "",
    destino: "", // digitables
    producto: "",
    cantidad: "",
  });

  // OPCIONES DE SELECT (catálogos)
  const [catalog, setCatalog] = useState({
    placas: [],
    trailers: [],
    conductores: [],
    transportadoras: [],
    clientes: [],
    destinos: [],
    productos: [],
  });

  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchCatalogs = async () => {
    setCatalogLoading(true);
    try {
      const [
        resConductores,
        resClientes,
        resProductos,
        resDestinos,
        resTransportadoras,
      ] = await Promise.allSettled([
        axios.get(API_CONDUCTORES),
        axios.get(API_CLIENTES),
        axios.get(API_PRODUCTOS),
        axios.get(API_DESTINOS),
        axios.get(API_TRANSPORTADORAS),
      ]);

      const conductoresData =
        resConductores.status === "fulfilled" &&
          Array.isArray(resConductores.value.data)
          ? resConductores.value.data
          : [];

      const clientesData =
        resClientes.status === "fulfilled" &&
          Array.isArray(resClientes.value.data)
          ? resClientes.value.data
          : [];

      const productosData =
        resProductos.status === "fulfilled" &&
          Array.isArray(resProductos.value.data)
          ? resProductos.value.data
          : [];

      const destinosData =
        resDestinos.status === "fulfilled" &&
          Array.isArray(resDestinos.value.data)
          ? resDestinos.value.data
          : [];

      const transportadorasData =
        resTransportadoras.status === "fulfilled" &&
          Array.isArray(resTransportadoras.value.data)
          ? resTransportadoras.value.data
          : [];

      const placas = Array.from(
        new Set(
          conductoresData
            .map((c) => normalizePlate(c?.placaVehiculo))
            .filter(Boolean)
        )
      ).sort();

      const conductores = Array.from(
        new Set(
          conductoresData
            .map((c) =>
              normalizeText(`${c?.nombres ?? ""} ${c?.apellidos ?? ""}`)
            )
            .filter(Boolean)
        )
      ).sort();

      const trailers = Array.from(
        new Set(
          conductoresData
            .map((c) => normalizeText(`${c?.carroseria ?? ""}`))
            .filter(Boolean)
        )
      ).sort();

      const clientes = Array.from(
        new Set(clientesData.map((c) => normalizeText(c?.cliente)).filter(Boolean))
      ).sort();

      const productos = Array.from(
        new Set(
          productosData
            .map((p) => normalizeText(p?.tipoProducto || p?.nombre))
            .filter(Boolean)
        )
      ).sort();

      // destinos/transportadoras opcionales; aunque destino en el form sea digitables, los dejamos para filtros/tabla
      const destinos = Array.from(
        new Set(destinosData.map((d) => normalizeText(d?.destino || d?.nombre)).filter(Boolean))
      ).sort();

      const transportadoras = Array.from(
        new Set(
          transportadorasData
            .map((t) =>
              normalizeText(t?.nombreTransportadora || t?.nombre)
            )
            .filter(Boolean)
        )
      ).sort();

      setCatalog((prev) => ({
        ...prev,
        placas,
        conductores,
        clientes,
        productos,
        destinos,
        transportadoras,
        trailers,
      }));
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar algunos catálogos.",
      });
    } finally {
      setCatalogLoading(false);
    }
  };

  // OBTENER PROGRAMACIÓN (DB)
  // ✅ ahora por defecto consume el endpoint /rango (mes anterior + mes actual)
  const fetchProgramacion = async (customRange) => {
    try {
      const effective = customRange ?? range ?? getDefaultRange();
      const from = normalizeText(effective.from);
      const to = normalizeText(effective.to);

      const res = await axios.get(`${API_URL}/rango`, {
        params: { from, to },
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
    // ✅ primer consumo: mes actual y anterior
    fetchProgramacion(getDefaultRange());
  }, []);

  // OPTIONS DE FILTROS (dropdowns)
  const options = useMemo(() => {
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const safe = rows ?? [];
    return {
      fechas: uniq(safe.map((r) => normalizeText(r.fecha))).filter((f) =>
        isValidDateISO(f)
      ),
      clientes: uniq(safe.map((r) => normalizeText(r.cliente))),
      productos: uniq(safe.map((r) => normalizeText(r.producto))),
      transportadoras: uniq(safe.map((r) => normalizeText(r.transportadora))),
      destinos: uniq(safe.map((r) => normalizeText(r.destino))),
    };
  }, [rows]);

  // Completar catálogos faltantes desde rows (si endpoints no traen algo)
  useEffect(() => {
    const safe = rows ?? [];
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();

    const trailersFromRows = uniq(safe.map((r) => normalizeText(r.trailer)));
    const destinosFromRows = uniq(safe.map((r) => normalizeText(r.destino)));
    const transportadorasFromRows = uniq(
      safe.map((r) => normalizeText(r.transportadora))
    );
    const productosFromRows = uniq(safe.map((r) => normalizeText(r.producto)));
    const clientesFromRows = uniq(safe.map((r) => normalizeText(r.cliente)));
    const conductoresFromRows = uniq(safe.map((r) => normalizeText(r.conductor)));
    const placasFromRows = uniq(safe.map((r) => normalizePlate(r.placa)));

    setCatalog((prev) => ({
      placas: prev.placas.length ? prev.placas : placasFromRows,
      trailers: prev.trailers.length ? prev.trailers : trailersFromRows,
      conductores: prev.conductores.length ? prev.conductores : conductoresFromRows,
      transportadoras: prev.transportadoras.length
        ? prev.transportadoras
        : transportadorasFromRows,
      clientes: prev.clientes.length ? prev.clientes : clientesFromRows,
      destinos: prev.destinos.length ? prev.destinos : destinosFromRows,
      productos: prev.productos.length ? prev.productos : productosFromRows,
    }));
  }, [rows]);

  // FORM HANDLERS
  // const handleChange = (e) => {
  //   setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  // };
  const handleChange = (e) => {
    const { name, value } = e.target;
    // destino siempre se guarda en mayúsculas
    if (name === "destino") {
      setForm((prev) => ({ ...prev, [name]: normalizeDestino(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      fecha: "",
      placa: "",
      trailer: "",
      conductor: "",
      transportadora: "",
      cliente: "",
      destino: "",
      producto: "",
      cantidad: "",
    });
    setEditingId(null);
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      fecha: "",
      cliente: "",
      producto: "",
      transportadora: "",
      destino: "",
    });
  };

  // ✅ handlers para rango
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

  // VALIDACIÓN (Swal)
  const validatePayload = async (payload) => {
    if (!payload.fecha || !isValidDateISO(payload.fecha)) {
      await Swal.fire({
        icon: "warning",
        title: "Fecha inválida",
        text: 'La fecha debe tener formato "YYYY-MM-DD".',
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

  // CREAR / ACTUALIZAR (Swal)
  const handleSubmit = async () => {
    try {
      const payload = {
        fecha: normalizeText(form.fecha), // <- YYYY-MM-DD del date picker
        placa: normalizeText(form.placa),
        trailer: normalizeText(form.trailer),
        conductor: normalizeText(form.conductor),
        transportadora: normalizeText(form.transportadora),
        cliente: normalizeText(form.cliente),
        destino: normalizeText(form.destino), // <- digitable
        producto: normalizeText(form.producto),
        cantidad: Number(normalizeText(form.cantidad)),
      };

      const ok = await validatePayload(payload);
      if (!ok) return;

      Swal.fire({
        title: editingId ? "Actualizando..." : "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
      } else {
        await axios.post(API_URL, payload);
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
      // ✅ recarga usando el rango actual (no toda la DB)
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

    Swal.fire({
      icon: "info",
      title: "Modo edición",
      text: "Edita el registro y pulsa Actualizar.",
      timer: 1200,
      showConfirmButton: false,
    });
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

      await axios.delete(`${API_URL}/${id}`);

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "Programación eliminada correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      if (editingId === id) resetForm();

      // ✅ recarga usando el rango actual (no toda la DB)
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

  // FILTRO + BUSCADOR (rápido)
  const rowsFiltrados = useMemo(() => {
    const safe = rows ?? [];

    const fFecha = normalizeText(filters.fecha);
    const fCliente = normalizeText(filters.cliente);
    const fProducto = normalizeText(filters.producto);
    const fTransportadora = normalizeText(filters.transportadora);
    const fDestino = normalizeText(filters.destino);

    let out = safe;

    if (fFecha) out = out.filter((r) => normalizeText(r.fecha) === fFecha);
    if (fCliente) out = out.filter((r) => normalizeText(r.cliente) === fCliente);
    if (fProducto) out = out.filter((r) => normalizeText(r.producto) === fProducto);
    if (fTransportadora)
      out = out.filter((r) => normalizeText(r.transportadora) === fTransportadora);
    if (fDestino) out = out.filter((r) => normalizeText(r.destino) === fDestino);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const fecha = normalizeText(r.fecha).toLowerCase();
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
  }, [rows, filters, debouncedSearch]);

  // INDICADORES (chips)
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
      const prev = m.get(f) || { fecha: f, viajes: 0, cantidad: 0 };
      prev.viajes += 1;
      prev.cantidad += Number(r?.cantidad ?? 0);
      m.set(f, prev);
    }
    return Array.from(m.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([, v]) => v);
  }, [rowsFiltrados]);

  const top3Dias = kpiPorDia.slice(0, 3);

  const hasAnyFilter =
    !!debouncedSearch ||
    !!filters.fecha ||
    !!filters.cliente ||
    !!filters.producto ||
    !!filters.transportadora ||
    !!filters.destino;

  return (
    <Box p={{ xs: 2, md: 4 }} mt={5}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          {/* Header */}
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
              </Stack>
            </Box>

            {/* Buscador */}
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por fecha, placa, trailer, conductor, transportadora, cliente, destino, producto..."
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

          <Divider sx={{ my: 3 }} />

          {/* Filtros tipo BI */}
          <Grid container spacing={2}>
            {/*  RANGO DE FECHAS (endpoint /rango) */}
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

            {/* filtros existentes */}
            <Grid item xs={12} md={2.4}>
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

            <Grid item xs={12} md={2.4}>
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

            <Grid item xs={12} md={2.4}>
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

            <Grid item xs={12} md={2.4}>
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

            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Destino"
                name="destino"
                value={filters.destino}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {options.destinos.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button variant="outlined" onClick={clearFilters} size="small">
                  Limpiar filtros
                </Button>

                <Tooltip title="Actualiza la Base de Datos con filtros actuales">
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    size="small"
                    onClick={async () => {
                      await fetchProgramacion(range);
                      await fetchCatalogs();
                      Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: "Datos refrescados.",
                        timer: 1200,
                        showConfirmButton: false,
                      });
                    }}
                  >
                    Refrescar
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* KPIs rápidos por día */}
          {kpiPorDia.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Resumen por día (según filtro actual)
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {top3Dias.map((d) => (
                  <Chip
                    key={d.fecha}
                    size="small"
                    label={`${d.fecha}: ${d.viajes} viajes / ${formatNumber(d.cantidad)}`}
                  />
                ))}
                {kpiPorDia.length > 3 && <Chip size="small" label={`+ ${kpiPorDia.length - 3} días`} />}
              </Stack>
            </>
          )}

          {/* FORMULARIO (COMPACTO + SELECTS) */}
          <Typography sx={{ mb: 1, mt: -1.5 }} variant="h6" gutterBottom>
            {editingId ? "Editar programación" : "Nueva programación"}
          </Typography>

          <Grid container spacing={1}>
            {/* FECHA: DATE PICKER (guarda YYYY-MM-DD) */}
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                type="date"
                label="Fecha"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Placa"
                name="placa"
                value={form.placa}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.placas.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={1}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Trailer"
                name="trailer"
                value={form.trailer}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.trailers.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Conductor"
                name="conductor"
                value={form.conductor}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.conductores.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Transportadora"
                name="transportadora"
                value={form.transportadora}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.transportadoras.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Cliente"
                name="cliente"
                value={form.cliente}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.clientes.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* DESTINO: DIGITABLE */}
            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Destino"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                placeholder="Ej: ITAGUI"
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <TextField
                select
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Producto"
                name="producto"
                value={form.producto}
                onChange={handleChange}
              >
                <MenuItem value="">(Selecciona)</MenuItem>
                {catalog.productos.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={1}>
              <TextField
                fullWidth
                size="small"
                sx={INPUT_SX_COMPACT}
                label="Cantidad"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                placeholder="Ej: 40000"
                type="number"
                inputProps={{ inputMode: "numeric", min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={1}
              sx={{
                display: "flex",
                alignItems: "center", 
                justifyContent: "center" 
              }}>
              <Button
                variant="contained"
                color={editingId ? "warning" : "primary"}
                startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                onClick={handleSubmit}
                size="small"
              >
                {editingId ? "Actualizar" : "Registrar"}
              </Button>

              {editingId && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    resetForm();
                    await Swal.fire({
                      icon: "info",
                      title: "Edición cancelada",
                      timer: 1200,
                      showConfirmButton: false,
                    });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* TABLA */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Placa</strong></TableCell>
                  <TableCell><strong>Trailer</strong></TableCell>
                  <TableCell><strong>Conductor</strong></TableCell>
                  <TableCell><strong>Transportadora</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Destino</strong></TableCell>
                  <TableCell><strong>Producto</strong></TableCell>
                  <TableCell align="right"><strong>Cantidad</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rowsFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {hasAnyFilter
                          ? "Prueba cambiando la búsqueda o los filtros."
                          : "No hay programaciones registradas."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rowsFiltrados.map((r) => (
                    <TableRow key={r._id} hover>
                      <TableCell>{normalizeText(r.fecha)}</TableCell>
                      <TableCell>{normalizeText(r.placa)}</TableCell>
                      <TableCell>{normalizeText(r.trailer)}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 260,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.conductor)}
                      >
                        {normalizeText(r.conductor)}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 220,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.transportadora)}
                      >
                        {normalizeText(r.transportadora)}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 260,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.cliente)}
                      >
                        {normalizeText(r.cliente)}
                      </TableCell>
                      <TableCell>{normalizeText(r.destino)}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 260,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.producto)}
                      >
                        {normalizeText(r.producto)}
                      </TableCell>
                      <TableCell align="right">{formatNumber(r.cantidad)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleEdit(r)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(r._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgramacionDespachoDiariaPage;