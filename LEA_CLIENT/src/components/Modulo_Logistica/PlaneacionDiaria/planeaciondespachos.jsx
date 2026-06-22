import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";

import { useAuth } from "../../../utils/Context/AuthContext/AuthContext";

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

import ProgramacionDespachoModal from "./utils_planeacion/ProgramacionDespachoModal";

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

// const normalizeFechaEstimadaEntrega = (value) => {
//   const v = normalizeText(value).toUpperCase();
//   return v || "NA";
// };

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


// HELPERS FECHAS (rango por defecto: mes anterior + mes actual)
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

  const navigate = useNavigate();

  const { rol } = useAuth();

  const canEditFechaEstimadaEntrega = ["developer", "comercial"].includes(normalizeText(rol).toLowerCase());

  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [search, setSearch] = useState("");   // buscador global
  const [sortOrder, setSortOrder] = useState("desc");
  const debouncedSearch = useDebouncedValue(search, 250);

  // filtros tipo BI
  const [filters, setFilters] = useState({
    fecha: "",
    fechaEstimadaEntrega: "",
    cliente: "",
    producto: "",
    transportadora: "",
    destino: "",
  });

  // filtro por rango (date pickers)
  const [range, setRange] = useState(() => getDefaultRange());

  // formulario
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
        axios.get(API_CLIENTES, { withCredentials: true }),
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
    // primer consumo: mes actual y anterior
    fetchProgramacion(getDefaultRange());
  }, []);

  // OPTIONS DE FILTROS (dropdowns)
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

  // handlers para rango
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
        horaProgramada: normalizeText(form.horaProgramada),
        placa: normalizeText(form.placa),
        trailer: normalizeText(form.trailer),
        conductor: normalizeText(form.conductor),
        transportadora: normalizeText(form.transportadora),
        cliente: normalizeText(form.cliente),
        destino: normalizeText(form.destino), // <- digitable
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

      //recarga usando el rango actual (no toda la DB)
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
    const fFechaEstimadaEntrega = normalizeFechaEstimadaEntrega(filters.fechaEstimadaEntrega);
    const fCliente = normalizeText(filters.cliente);
    const fProducto = normalizeText(filters.producto);
    const fTransportadora = normalizeText(filters.transportadora);
    const fDestino = normalizeText(filters.destino);

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
    if (fDestino) out = out.filter((r) => normalizeText(r.destino) === fDestino);

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
        normalizeText(r.destino),
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
      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // más reciente primero
      .slice(0, 8) // últimos 5 días
      .map(([, v]) => v)
      .reverse(); // opcional: para mostrar del más viejo al más reciente
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

  return (
    <Box p={{ xs: 2, md: 1 }} mt={6}>
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

            {/* filtros existentes */}
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

            <Grid item xs={12} md={2}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  height: "100%",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  flexWrap: "nowrap",
                }}
              >
                <Tooltip title="Actualiza la Base de Datos con filtros actuales">
                  <Button
                    variant="outlined"
                    size="medium"
                    sx={{ color: "#C450DE" }}
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
                  {/* // modulo exportar excel en el mismo boton. */}
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
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* KPIs rápidos por día */}
          {kpiPorDia.length > 0 && (
            <Box sx={{ mt: 1, mb: 2.5 }}>
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
          <Divider sx={{ my: 3 }} />

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

          {/* TABLA */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}
            onContextMenu={(e) => {
              e.preventDefault();
              copiarTablaPortapapeles();
            }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="left"><strong>Fecha</strong></TableCell>
                  <TableCell align="left"><strong>Fecha Est. Entrega</strong></TableCell>
                  <TableCell align="left"><strong>Hora</strong></TableCell>
                  <TableCell align="left"><strong>Placa</strong></TableCell>
                  <TableCell align="left"><strong>Trailer</strong></TableCell>
                  <TableCell align="left"><strong>Conductor</strong></TableCell>
                  <TableCell align="left"><strong>Transportadora</strong></TableCell>
                  <TableCell align="left"><strong>Cliente</strong></TableCell>
                  <TableCell align="left"><strong>Destino</strong></TableCell>
                  <TableCell align="left"><strong>Producto</strong></TableCell>
                  <TableCell align="left"><strong>Cantidad</strong></TableCell>
                  <TableCell align="left"><strong>Checked</strong></TableCell>
                  <TableCell align="left"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                sx={{
                  "& .MuiTableRow-root": {
                    transition: "background-color 0.18s ease",
                    "&:nth-of-type(even)": {
                      backgroundColor: "rgba(17, 24, 39, 0.025)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.08) !important",
                    },
                  },
                  "& .MuiTableCell-root": {
                    fontSize: "11.8px",
                    py: 0.65,
                    px: 1,
                    borderBottom: "1px solid rgba(224, 224, 224, 0.8)",
                    color: "text.primary",
                    verticalAlign: "middle",
                  },
                  "& .MuiIconButton-root": {
                    p: 0.45,
                  },
                }}
              >
                {rowsFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center" sx={{ py: 5 }}>
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
                      <TableCell sx={{ minWidth: 105, whiteSpace: "nowrap", fontWeight: 600 }}>
                        {normalizeText(r.fecha)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140, whiteSpace: "nowrap" }}>
                        {normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega) === "NA" ? (
                          <Box
                            component="span"
                            sx={{
                              display: "inline-block",
                              px: 1.2,
                              py: 0.35,
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              color: "#B71C1C",
                              backgroundColor: "rgba(244, 67, 54, 0.12)",
                              border: "1px solid rgba(244, 67, 54, 0.35)",
                            }}
                          >
                            Pendiente
                          </Box>
                        ) : (
                          <Box
                            component="span"
                            sx={{
                              display: "inline-block",
                              px: 1.2,
                              py: 0.35,
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              color: "#1B5E20",
                              backgroundColor: "rgba(76, 175, 80, 0.12)",
                              border: "1px solid rgba(76, 175, 80, 0.35)",
                            }}
                          >
                            {normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega)}
                          </Box>
                        )}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600, color: "primary.main" }}>
                        {normalizeText(r.horaProgramada) || "—"}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                        {normalizeText(r.placa) || "—"}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {normalizeText(r.trailer) || "—"}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 230,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.conductor)}
                      >
                        {normalizeText(r.conductor) || "—"}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 210,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.transportadora)}
                      >
                        {normalizeText(r.transportadora) || "—"}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 240,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 600,
                        }}
                        title={normalizeText(r.cliente)}
                      >
                        {normalizeText(r.cliente) || "—"}
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {normalizeText(r.destino) || "—"}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 230,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={normalizeText(r.producto)}
                      >
                        {normalizeText(r.producto) || "—"}
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                        {formatNumber(r.cantidad)}
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip
                          placement="top"
                          title={Boolean(r?.cumplido) ? "Despacho cumplido" : "Pendiente"}
                        >
                          <CheckIcon
                            sx={{
                              color: Boolean(r?.cumplido) ? "#2e7d32" : "grey.300",
                              fontSize: 22,
                              filter: Boolean(r?.cumplido)
                                ? "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))"
                                : "inherit",
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton color="primary" onClick={() => handleEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(r._id)}>
                          <DeleteIcon fontSize="small" />
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