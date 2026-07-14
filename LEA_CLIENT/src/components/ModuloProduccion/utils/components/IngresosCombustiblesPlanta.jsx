import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ContentCopy,
  DeleteOutline,
  FilterAlt,
  FilterAltOff,
  Save,
} from "@mui/icons-material";

import Swal from "sweetalert2";

const API_BASE_URL = "https://ambiocomserver.onrender.com/api/ingresos-combustibles";

const EMPTY_FILTER_LABEL = "(Vacíos)";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `fila-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const todayIso = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const excelSerialToIsoDate = (value) => {
  const serial = Number(value);
  if (!Number.isFinite(serial) || serial < 1) return value;

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);

  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
};

const normalizeDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d+(\.\d+)?$/.test(raw)) return excelSerialToIsoDate(raw);

  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return `${normalizedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return raw;
};

const isValidIsoDate = (value) => {
  const raw = normalizeDate(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;

  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

const toApiDateString = (value) => {
  const fecha = normalizeDate(value);
  return fecha;
};

const normalizeNumberText = (value) => {
  const raw = String(value ?? "")
    .replace(/\$/g, "")
    .replace(/COP/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!raw) return "";

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  if (hasComma) {
    return raw.replace(/\./g, "").replace(",", ".");
  }

  if (hasDot) {
    const dotCount = (raw.match(/\./g) || []).length;
    const parts = raw.split(".");
    const lastPart = parts.at(-1) || "";

    if (dotCount > 1 || lastPart.length === 3) {
      return raw.replace(/\./g, "");
    }
  }

  return raw;
};

const toNumber = (value) => Number(normalizeNumberText(value) || 0);

const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value || 0));

const formatInteger = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const createBlankRow = (overrides = {}) => ({
  id: createId(),
  _id: "",
  frontendId: "",
  fechaRecepcion: todayIso(),
  mina: "",
  remision: "",
  numeroFactura: "",
  pesoMinaKg: "",
  tipoCombustible: "Carbón",
  pesoKgAmbiocom: "",
  precioUnitarioTon: "",
  iva: "",
  notaDebitoCredito: "",
  reportadoSap: "",
  observacion: "",
  ...overrides,
});

const normalizeApiRow = (row = {}) => {
  const mongoId = String(row._id || row.mongoId || "").trim();

  const rowId =
    row.id ||
    row.frontendId ||
    mongoId ||
    createId();

  const frontendId =
    row.frontendId ||
    (!isMongoId(rowId) ? rowId : "");

  return {
    ...createBlankRow({ fechaRecepcion: "" }),
    ...row,
    _id: mongoId,
    mongoId,
    id: rowId,
    frontendId,
    fechaRecepcion: normalizeDate(row.fechaRecepcion || ""),
    tipoCombustible: String(row.tipoCombustible || "").toLowerCase().includes("madera")
      ? "Madera"
      : "Carbón",
    pesoMinaKg: row.pesoMinaKg ?? "",
    pesoKgAmbiocom: row.pesoKgAmbiocom ?? "",
    precioUnitarioTon: row.precioUnitarioTon ?? "",
    iva: row.iva ?? "",
    notaDebitoCredito: row.notaDebitoCredito ?? "",
    reportadoSap: row.reportadoSap ?? "",
    observacion: row.observacion ?? "",
  };
};

const buildInitialRows = (initialRows = [], minRows = 12) => {
  const rows = Array.isArray(initialRows)
    ? initialRows.map((row) => normalizeApiRow(row))
    : [];

  while (rows.length < minRows) {
    rows.push(createBlankRow({ fechaRecepcion: "" }));
  }

  return rows;
};

const calculateRow = (row) => {
  const pesoMinaKg = toNumber(row.pesoMinaKg);
  const pesoKgAmbiocom = toNumber(row.pesoKgAmbiocom);
  const precioUnitarioTon = toNumber(row.precioUnitarioTon);
  const iva = toNumber(row.iva);
  const notaDebitoCredito = toNumber(row.notaDebitoCredito);

  const diferenciaKg = pesoKgAmbiocom - pesoMinaKg;
  const pesoTonRecibidas = pesoKgAmbiocom / 1000;
  const precioTotal = pesoTonRecibidas * precioUnitarioTon;
  const valorFacturado = precioTotal + iva + notaDebitoCredito;

  return {
    diferenciaKg,
    pesoTonRecibidas,
    precioTotal,
    valorFacturado,
  };
};

const isEmptyRow = (row) =>
  [
    "mina",
    "remision",
    "numeroFactura",
    "pesoMinaKg",
    "pesoKgAmbiocom",
    "precioUnitarioTon",
    "iva",
    "notaDebitoCredito",
    "reportadoSap",
    "observacion",
  ].every((field) => !String(row[field] ?? "").trim());

const cleanRows = (rows) => rows.filter((row) => !isEmptyRow(row));

const getMongoIdFromRow = (row = {}) => {
  const directMongoId = row._id || row.mongoId;

  if (isMongoId(directMongoId)) return String(directMongoId);

  if (isMongoId(row.id) && !row.frontendId) return String(row.id);

  return "";
};

const buildPayloadRow = (row) => {
  const mongoId = getMongoIdFromRow(row);
  const frontendId =
    row.frontendId ||
    (!mongoId && row.id ? row.id : "");

  const payload = {
    fechaRecepcion: toApiDateString(row.fechaRecepcion),
    mina: String(row.mina || "").trim(),
    remision: String(row.remision || "").trim(),
    numeroFactura: String(row.numeroFactura || "").trim(),
    pesoMinaKg: normalizeNumberText(row.pesoMinaKg),
    tipoCombustible: String(row.tipoCombustible || "").toLowerCase().includes("madera")
      ? "Madera"
      : "Carbón",
    pesoKgAmbiocom: normalizeNumberText(row.pesoKgAmbiocom),
    precioUnitarioTon: normalizeNumberText(row.precioUnitarioTon),
    iva: normalizeNumberText(row.iva),
    notaDebitoCredito: normalizeNumberText(row.notaDebitoCredito),
    reportadoSap: row.reportadoSap || "",
    observacion: String(row.observacion || "").trim(),
  };

  if (mongoId) {
    payload._id = mongoId;
    payload.mongoId = mongoId;
  }

  if (frontendId) {
    payload.frontendId = frontendId;
    payload.id = frontendId;
  }

  return payload;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
};

const showSwalLoading = (title = "Procesando...", text = "Por favor espera un momento.") => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

const showSuccessToast = (title) => {
  Swal.fire({
    icon: "success",
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.style.marginTop = "70px";
    },
  });
};

const columns = [
  { key: "fechaRecepcion", label: "Fecha Recepción", type: "date", editable: true, minWidth: 140 },
  { key: "mina", label: "Mina", type: "text", editable: true, minWidth: 210 },
  { key: "remision", label: "Remisión", type: "text", editable: true, minWidth: 130 },
  { key: "numeroFactura", label: "No. Factura", type: "text", editable: true, minWidth: 145 },
  { key: "pesoMinaKg", label: "Peso Mina", type: "number", editable: true, minWidth: 130, align: "right" },
  { key: "tipoCombustible", label: "Tipo de Combustible", type: "select", editable: true, minWidth: 165 },
  { key: "pesoKgAmbiocom", label: "Peso Kg Ambiocom", type: "number", editable: true, minWidth: 160, align: "right" },
  { key: "diferenciaKg", label: "Diferencia Kg", type: "calculated", editable: false, minWidth: 130, align: "right" },
  { key: "pesoTonRecibidas", label: "Peso Ton Recibidas", type: "calculated", editable: false, minWidth: 160, align: "right" },
  { key: "precioUnitarioTon", label: "Precio Unitario TN", type: "number", editable: true, minWidth: 160, align: "right" },
  { key: "precioTotal", label: "Precio Total", type: "calculated", editable: false, minWidth: 150, align: "right" },
  { key: "iva", label: "IVA", type: "number", editable: true, minWidth: 120, align: "right" },
  { key: "valorFacturado", label: "Valor Facturado", type: "calculated", editable: false, minWidth: 160, align: "right" },
  { key: "notaDebitoCredito", label: "Nota Débito/Crédito", type: "number", editable: true, minWidth: 170, align: "right" },
  { key: "reportadoSap", label: "Reportado en SAP", type: "selectSap", editable: true, minWidth: 160 },
  { key: "observacion", label: "Observación", type: "text", editable: true, minWidth: 230 },
];

const inputStyle = {
  width: "100%",
  height: 34,
  border: 0,
  outline: "none",
  background: "transparent",
  fontSize: 12,
  fontWeight: 700,
  boxSizing: "border-box",
};

function ExcelInput({ value, onChange, onFocus, type, align = "left", placeholder }) {
  return (
    <input
      type={type === "date" ? "date" : "text"}
      value={value ?? ""}
      placeholder={placeholder}
      inputMode={type === "number" ? "decimal" : undefined}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => {
        event.target.select();
        onFocus?.();
      }}
      style={{
        ...inputStyle,
        textAlign: align,
        padding: align === "right" ? "0 8px 0 4px" : "0 10px",
      }}
    />
  );
}

function ExcelSelect({ value, onChange, onFocus, children }) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      style={{
        ...inputStyle,
        cursor: "pointer",
        padding: "0 10px",
      }}
    >
      {children}
    </select>
  );
}

const editableCellSx = {
  p: 0.35,
  bgcolor: "#ffffff",
  borderColor: "#e2e8f0",
  "&:focus-within": {
    bgcolor: "#eef6ff",
    boxShadow: "inset 0 0 0 2px #2563eb",
  },
};

const calculatedCellSx = {
  bgcolor: "#f8fafc",
  borderColor: "#e2e8f0",
  fontWeight: 900,
  color: "#0f172a",
};

const footerCellSx = {
  bgcolor: "#f1f5f9",
  borderColor: "#cbd5e1",
  borderTop: "2px solid #94a3b8",
  fontWeight: 950,
  position: "sticky",
  bottom: 0,
  zIndex: 5,
};

const footerNumberCellSx = {
  ...footerCellSx,
  color: "#0f172a",
};

const toolbarIconSx = {
  width: 40,
  height: 40,
  borderRadius: 3,
  border: "1px solid #dbe3ef",
  bgcolor: "#ffffff",
  color: "#0f172a",
  "&:hover": {
    bgcolor: "#f8fafc",
  },
};

const summaryChipSx = {
  height: 34,
  borderRadius: 999,
  fontWeight: 900,
  "& .MuiChip-label": {
    px: 1.35,
    fontSize: 12.5,
    fontWeight: 900,
  },
};

export default function IngresosCombustiblesTablaExcel({
  initialRows = [],
  dateRange = { desde: "", hasta: "" },
  queryVersion = 0,
  onRowsChange,
}) {
  const [rows, setRows] = useState(() => buildInitialRows(initialRows));

  const [activeFilterKey, setActiveFilterKey] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [lastBackendRange, setLastBackendRange] = useState({
    desde: "",
    hasta: "",
  });

  const [copySnack, setCopySnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const focusedCellRef = useRef({ rowIndex: 0, colIndex: 0 });

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const calculatedById = useMemo(
    () => rows.reduce((acc, row) => ({ ...acc, [row.id]: calculateRow(row) }), {}),
    [rows]
  );

  const hydrateRowsFromApi = useCallback((registros = []) => {
    setRows(buildInitialRows(registros));
    setColumnFilters({});
    setActiveFilterKey(null);
    setFilterSearch("");
    setHasUnsavedChanges(false);
  }, []);

  useEffect(() => {
    onRowsChange?.(cleanRows(rows));
  }, [rows, onRowsChange]);

  const confirmDiscardUnsavedChanges = useCallback(async () => {
    if (!hasUnsavedChangesRef.current) return true;

    const result = await Swal.fire({
      icon: "warning",
      title: "Tienes cambios sin guardar",
      text: "Si continúas, los cambios editados en la tabla se perderán.",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    return result.isConfirmed;
  }, []);

  const loadRowsByParentRange = useCallback(
    async ({ withSwal = false, skipUnsavedConfirm = false } = {}) => {
      const desde = toApiDateString(dateRange?.desde);
      const hasta = toApiDateString(dateRange?.hasta);

      if (!desde || !hasta) {
        hydrateRowsFromApi([]);
        setLastBackendRange({
          desde: "",
          hasta: "",
        });
        return;
      }

      if (!isValidIsoDate(desde) || !isValidIsoDate(hasta)) {
        await Swal.fire({
          icon: "warning",
          title: "Formato de fecha inválido",
          text: "Las fechas deben venir desde el padre como string en formato YYYY-MM-DD.",
          confirmButtonText: "Entendido",
        });
        return;
      }

      if (desde > hasta) {
        await Swal.fire({
          icon: "warning",
          title: "Rango inválido",
          text: "La fecha desde no puede ser mayor que la fecha hasta.",
          confirmButtonText: "Entendido",
        });
        return;
      }

      if (!skipUnsavedConfirm) {
        const canContinue = await confirmDiscardUnsavedChanges();
        if (!canContinue) return;
      }

      try {
        setLoading(true);

        if (withSwal) {
          showSwalLoading(
            "Consultando por rango",
            "Cargando registros entre las fechas seleccionadas desde el filtro principal."
          );
        }

        const query = new URLSearchParams({
          desde,
          hasta,
        }).toString();

        const data = await requestJson(`${API_BASE_URL}/rango?${query}`);

        hydrateRowsFromApi(data.registros || []);

        setLastBackendRange({
          desde: data?.rango?.desde || desde,
          hasta: data?.rango?.hasta || hasta,
        });

        if (withSwal) {
          Swal.close();
          showSuccessToast("Consulta ejecutada");
        }
      } catch (error) {
        console.error("Error consultando ingresos combustibles por rango:", error);

        if (withSwal) Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudo ejecutar la consulta",
          text:
            error.message ||
            "Ocurrió un error consultando el rango seleccionado.",
          confirmButtonText: "Entendido",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      dateRange?.desde,
      dateRange?.hasta,
      confirmDiscardUnsavedChanges,
      hydrateRowsFromApi,
    ]
  );

  useEffect(() => {
    loadRowsByParentRange({
      withSwal: queryVersion > 0,
      skipUnsavedConfirm: queryVersion === 0,
    });
  }, [queryVersion, loadRowsByParentRange]);

  const getColumnFilterValue = useCallback((row, columnKey) => {
    const calculated = calculateRow(row);

    if (columnKey === "diferenciaKg") {
      return formatInteger(calculated.diferenciaKg) || EMPTY_FILTER_LABEL;
    }

    if (columnKey === "pesoTonRecibidas") {
      return formatNumber(calculated.pesoTonRecibidas, 2) || EMPTY_FILTER_LABEL;
    }

    if (columnKey === "precioTotal") {
      return formatMoney(calculated.precioTotal) || EMPTY_FILTER_LABEL;
    }

    if (columnKey === "valorFacturado") {
      return formatMoney(calculated.valorFacturado) || EMPTY_FILTER_LABEL;
    }

    if (columnKey === "fechaRecepcion") {
      const fecha = normalizeDate(row.fechaRecepcion);
      return fecha || EMPTY_FILTER_LABEL;
    }

    const value = String(row[columnKey] ?? "").trim();
    return value || EMPTY_FILTER_LABEL;
  }, []);

  const dateFilteredRows = useMemo(() => {
    return rows.map((row, originalIndex) => ({
      row,
      originalIndex,
    }));
  }, [rows]);

  const visibleRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters);

    if (!activeFilters.length) return dateFilteredRows;

    return dateFilteredRows.filter(({ row }) => {
      return activeFilters.every(([columnKey, selectedValues]) => {
        if (!Array.isArray(selectedValues)) return true;
        if (selectedValues.length === 0) return false;

        const value = getColumnFilterValue(row, columnKey);
        return selectedValues.includes(value);
      });
    });
  }, [dateFilteredRows, columnFilters, getColumnFilterValue]);

  const tableTotals = useMemo(() => {
    const sourceRows = cleanRows(visibleRows.map(({ row }) => row));

    return sourceRows.reduce(
      (acc, row) => {
        const calculated = calculatedById[row.id] || calculateRow(row);
        const tipoCombustible = String(row.tipoCombustible || "").trim();

        acc.registros += 1;
        acc.pesoMinaKg += toNumber(row.pesoMinaKg);
        acc.pesoKgAmbiocom += toNumber(row.pesoKgAmbiocom);
        acc.diferenciaKg += calculated.diferenciaKg;
        acc.pesoTonRecibidas += calculated.pesoTonRecibidas;
        acc.precioTotal += calculated.precioTotal;
        acc.iva += toNumber(row.iva);
        acc.valorFacturado += calculated.valorFacturado;
        acc.notaDebitoCredito += toNumber(row.notaDebitoCredito);

        if (tipoCombustible === "Carbón") {
          acc.totalCarbon += 1;
          acc.pesoKgAmbiocomCarbon += toNumber(row.pesoKgAmbiocom);
          acc.pesoTonRecibidasCarbon += calculated.pesoTonRecibidas;
        }

        if (tipoCombustible === "Madera") {
          acc.totalMadera += 1;
          acc.pesoKgAmbiocomMadera += toNumber(row.pesoKgAmbiocom);
          acc.pesoTonRecibidasMadera += calculated.pesoTonRecibidas;
        }

        if (row.reportadoSap === "Reportado") acc.reportados += 1;
        if (row.reportadoSap === "Pendiente") acc.pendientes += 1;

        return acc;
      },
      {
        registros: 0,
        pesoMinaKg: 0,
        pesoKgAmbiocom: 0,
        pesoKgAmbiocomCarbon: 0,
        pesoKgAmbiocomMadera: 0,
        diferenciaKg: 0,
        pesoTonRecibidas: 0,
        pesoTonRecibidasCarbon: 0,
        pesoTonRecibidasMadera: 0,
        precioTotal: 0,
        iva: 0,
        valorFacturado: 0,
        notaDebitoCredito: 0,
        totalCarbon: 0,
        totalMadera: 0,
        reportados: 0,
        pendientes: 0,
      }
    );
  }, [visibleRows, calculatedById]);

  const activeColumn = useMemo(
    () => columns.find((column) => column.key === activeFilterKey) || null,
    [activeFilterKey]
  );

  const columnFilterOptions = useMemo(() => {
    if (!activeFilterKey) return [];

    const uniqueValues = new Set();

    dateFilteredRows.forEach(({ row }) => {
      uniqueValues.add(getColumnFilterValue(row, activeFilterKey));
    });

    return Array.from(uniqueValues).sort((a, b) =>
      String(a).localeCompare(String(b), "es", {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [activeFilterKey, dateFilteredRows, getColumnFilterValue]);

  const currentSelectedValues = useMemo(() => {
    if (!activeFilterKey) return [];

    const hasOwnFilter = Object.prototype.hasOwnProperty.call(
      columnFilters,
      activeFilterKey
    );

    if (hasOwnFilter) return columnFilters[activeFilterKey] || [];

    return columnFilterOptions;
  }, [activeFilterKey, columnFilters, columnFilterOptions]);

  const filteredOptionsForModal = useMemo(() => {
    const search = filterSearch.trim().toLowerCase();

    if (!search) return columnFilterOptions;

    return columnFilterOptions.filter((value) =>
      String(value).toLowerCase().includes(search)
    );
  }, [columnFilterOptions, filterSearch]);

  const hasColumnFilters = Object.keys(columnFilters).length > 0;

  const updateCell = useCallback((rowId, key, value) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) return row;

        const column = columns.find((item) => item.key === key);

        if (column?.type === "number") {
          return { ...row, [key]: normalizeNumberText(value) };
        }

        if (column?.type === "date") {
          return { ...row, [key]: normalizeDate(value) };
        }

        if (key === "tipoCombustible") {
          const normalized = String(value || "").toLowerCase().includes("madera")
            ? "Madera"
            : "Carbón";

          return { ...row, [key]: normalized };
        }

        return { ...row, [key]: value };
      })
    );

    setHasUnsavedChanges(true);
  }, []);

  const addRow = useCallback(() => {
    const defaultDate = dateRange?.desde || todayIso();

    setRows((currentRows) => [
      ...currentRows,
      createBlankRow({
        fechaRecepcion: defaultDate,
      }),
    ]);

    setHasUnsavedChanges(true);
  }, [dateRange?.desde]);

  const deleteRow = useCallback(
    async (row) => {
      const mongoId = getMongoIdFromRow(row);
      const isPersisted = Boolean(mongoId);

      const result = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar registro?",
        text: isPersisted
          ? "Este registro se eliminará de la base de datos."
          : "Esta fila aún no está guardada. Se eliminará solo de la tabla.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      try {
        if (isPersisted) {
          showSwalLoading("Eliminando registro", "Actualizando la base de datos...");

          await requestJson(`${API_BASE_URL}/${mongoId}`, {
            method: "DELETE",
          });

          Swal.close();
          showSuccessToast("Registro eliminado");
        }

        setRows((currentRows) => {
          const nextRows = currentRows.filter((item) => item.id !== row.id);

          return nextRows.length
            ? nextRows
            : [createBlankRow({ fechaRecepcion: "" })];
        });

        if (!isPersisted) {
          setHasUnsavedChanges(true);
        }
      } catch (error) {
        console.error("Error eliminando registro:", error);
        Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudo eliminar",
          text: error.message || "Ocurrió un error eliminando el registro.",
          confirmButtonText: "Entendido",
        });
      }
    },
    []
  );

  const openColumnFilter = useCallback((columnKey) => {
    setActiveFilterKey(columnKey);
    setFilterSearch("");
  }, []);

  const closeColumnFilter = useCallback(() => {
    setActiveFilterKey(null);
    setFilterSearch("");
  }, []);

  const toggleColumnFilterValue = useCallback(
    (value) => {
      if (!activeFilterKey) return;

      setColumnFilters((currentFilters) => {
        const hasOwnFilter = Object.prototype.hasOwnProperty.call(
          currentFilters,
          activeFilterKey
        );

        const selectedValues = hasOwnFilter
          ? currentFilters[activeFilterKey] || []
          : columnFilterOptions;

        const exists = selectedValues.includes(value);

        const nextSelectedValues = exists
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value];

        const nextFilters = { ...currentFilters };

        if (nextSelectedValues.length === columnFilterOptions.length) {
          delete nextFilters[activeFilterKey];
        } else {
          nextFilters[activeFilterKey] = nextSelectedValues;
        }

        return nextFilters;
      });
    },
    [activeFilterKey, columnFilterOptions]
  );

  const selectAllColumnValues = useCallback(() => {
    if (!activeFilterKey) return;

    setColumnFilters((currentFilters) => {
      const nextFilters = { ...currentFilters };
      delete nextFilters[activeFilterKey];
      return nextFilters;
    });
  }, [activeFilterKey]);

  const selectNoColumnValues = useCallback(() => {
    if (!activeFilterKey) return;

    setColumnFilters((currentFilters) => ({
      ...currentFilters,
      [activeFilterKey]: [],
    }));
  }, [activeFilterKey]);

  const clearAllColumnFilters = useCallback(() => {
    setColumnFilters({});
  }, []);

  const getCellValueForCopy = useCallback(
    (row, column) => {
      const calculated = calculatedById[row.id] || calculateRow(row);

      if (column.key === "diferenciaKg") return calculated.diferenciaKg;
      if (column.key === "pesoTonRecibidas") return calculated.pesoTonRecibidas;
      if (column.key === "precioTotal") return calculated.precioTotal;
      if (column.key === "valorFacturado") return calculated.valorFacturado;

      return row[column.key] ?? "";
    },
    [calculatedById]
  );

  const copyTable = useCallback(async () => {
    const sourceRows = visibleRows.map(({ row }) => row);

    const headers = columns.map((column) => column.label);
    const body = cleanRows(sourceRows).map((row) =>
      columns.map((column) => getCellValueForCopy(row, column))
    );

    const text = [headers, ...body]
      .map((line) => line.map((value) => value ?? "").join("\t"))
      .join("\n");

    await navigator.clipboard?.writeText(text);
  }, [getCellValueForCopy, visibleRows]);

  const showCopySnack = useCallback((message, severity = "success") => {
    setCopySnack({
      open: true,
      message,
      severity,
    });
  }, []);

  const handleCopyTable = useCallback(async () => {
    try {
      await copyTable();
      showCopySnack("Tabla copiada al portapapeles", "success");
    } catch (error) {
      console.error("No se pudo copiar la tabla:", error);
      showCopySnack("No se pudo copiar la tabla", "error");
    }
  }, [copyTable, showCopySnack]);

  const handleRightClickCopyTable = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await handleCopyTable();
    },
    [handleCopyTable]
  );

  const closeCopySnack = useCallback((event, reason) => {
    if (reason === "clickaway") return;

    setCopySnack((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const pasteMatrix = useCallback((matrix) => {
    if (!matrix.length) return;

    const firstRowText = matrix[0].join(" ").toLowerCase();
    const hasHeaders = firstRowText.includes("fecha") || firstRowText.includes("mina");
    const dataRows = hasHeaders ? matrix.slice(1) : matrix;

    if (!dataRows.length) return;

    const { rowIndex: startRowIndex, colIndex: startColIndex } = focusedCellRef.current;

    setRows((currentRows) => {
      const nextRows = [...currentRows];

      while (nextRows.length < startRowIndex + dataRows.length) {
        nextRows.push(createBlankRow({ fechaRecepcion: "" }));
      }

      dataRows.forEach((sourceRow, sourceRowIndex) => {
        const targetRowIndex = startRowIndex + sourceRowIndex;
        const currentTargetRow =
          nextRows[targetRowIndex] || createBlankRow({ fechaRecepcion: "" });
        const nextTargetRow = { ...currentTargetRow };

        sourceRow.forEach((cellValue, sourceColIndex) => {
          const targetColumn = columns[startColIndex + sourceColIndex];
          if (!targetColumn || !targetColumn.editable) return;

          if (targetColumn.type === "number") {
            nextTargetRow[targetColumn.key] = normalizeNumberText(cellValue);
            return;
          }

          if (targetColumn.type === "date") {
            nextTargetRow[targetColumn.key] = normalizeDate(cellValue);
            return;
          }

          if (targetColumn.key === "tipoCombustible") {
            nextTargetRow[targetColumn.key] = String(cellValue || "")
              .toLowerCase()
              .includes("madera")
              ? "Madera"
              : "Carbón";
            return;
          }

          nextTargetRow[targetColumn.key] = cellValue;
        });

        nextRows[targetRowIndex] = nextTargetRow;
      });

      return nextRows;
    });

    setHasUnsavedChanges(true);
  }, []);

  const handlePaste = useCallback(
    (event) => {
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return;

      event.preventDefault();

      const matrix = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.length)
        .map((line) => line.split("\t"));

      pasteMatrix(matrix);
    },
    [pasteMatrix]
  );

  const reloadCurrentViewAfterSave = useCallback(async () => {
    const desde = toApiDateString(dateRange?.desde);
    const hasta = toApiDateString(dateRange?.hasta);

    if (!desde || !hasta) {
      hydrateRowsFromApi([]);
      setLastBackendRange({
        desde: "",
        hasta: "",
      });
      return;
    }

    const query = new URLSearchParams({
      desde,
      hasta,
    }).toString();

    const data = await requestJson(`${API_BASE_URL}/rango?${query}`);

    hydrateRowsFromApi(data.registros || []);

    setLastBackendRange({
      desde: data?.rango?.desde || desde,
      hasta: data?.rango?.hasta || hasta,
    });
  }, [dateRange?.desde, dateRange?.hasta, hydrateRowsFromApi]);

  const validateRowsBeforeSave = useCallback((sourceRows) => {
    if (!sourceRows.length) {
      return {
        ok: false,
        title: "No hay registros para guardar",
        text: "La tabla no tiene filas con información.",
      };
    }

    const rowWithoutDate = sourceRows.find((row) => !String(row.fechaRecepcion || "").trim());

    if (rowWithoutDate) {
      return {
        ok: false,
        title: "Hay registros sin fecha",
        text: "Todo registro con información debe tener fecha de recepción.",
      };
    }

    const rowWithInvalidDate = sourceRows.find((row) => !isValidIsoDate(row.fechaRecepcion));

    if (rowWithInvalidDate) {
      return {
        ok: false,
        title: "Hay fechas inválidas",
        text: "Las fechas deben tener formato YYYY-MM-DD. Ejemplo: 2026-07-02.",
      };
    }

    return {
      ok: true,
    };
  }, []);

  const saveRows = useCallback(async () => {
    const sourceRows = cleanRows(rows);
    const validation = validateRowsBeforeSave(sourceRows);

    if (!validation.ok) {
      await Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.text,
        confirmButtonText: "Entendido",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "¿Guardar registros?",
      text: `Se enviarán ${sourceRows.length} registros a la base de datos.`,
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      showSwalLoading("Guardando registros", "Enviando información al servidor...");

      const payloadRows = sourceRows.map(buildPayloadRow);

      const data = await requestJson(`${API_BASE_URL}/bulk`, {
        method: "PUT",
        body: JSON.stringify({
          rows: payloadRows,
        }),
      });

      await reloadCurrentViewAfterSave();

      Swal.close();

      const resultado = data?.resultado || {};

      await Swal.fire({
        icon: "success",
        title: "Registros guardados",
        html: `
          <div style="text-align:left">
            <b>Procesados:</b> ${resultado.procesados ?? sourceRows.length}<br/>
            <b>Insertados:</b> ${resultado.insertados ?? 0}<br/>
            <b>Actualizados:</b> ${resultado.actualizados ?? 0}<br/>
            <b>Upserts:</b> ${resultado.upserts ?? 0}
          </div>
        `,
        confirmButtonText: "Perfecto",
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error guardando registros:", error);
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: error.message || "Ocurrió un error guardando los registros.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setSaving(false);
    }
  }, [rows, validateRowsBeforeSave, reloadCurrentViewAfterSave]);

  return (
    <Stack gap={1} onPaste={handlePaste}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 4,
          borderColor: "#dbe3ef",
          bgcolor: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          gap={2}
        >
          <Box>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" fontWeight={950} color="#0f172a">
                Recepción carbón y madera
              </Typography>

              {loading && <CircularProgress size={18} />}
            </Stack>

            {lastBackendRange.desde && lastBackendRange.hasta && (
              <Typography
                fontSize={12.5}
                fontWeight={850}
                color="text.secondary"
                sx={{ mt: 0.4 }}
              >
                Rango consultado: {lastBackendRange.desde} a {lastBackendRange.hasta}
              </Typography>
            )}
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Chip
              label={`Viajes carbón: ${tableTotals.totalCarbon}`}
              sx={{
                ...summaryChipSx,
                bgcolor: "#eff6ff",
                color: "#1e3a8a",
              }}
            />

            <Chip
              label={`Viajes madera: ${tableTotals.totalMadera}`}
              sx={{
                ...summaryChipSx,
                bgcolor: "#ecfdf5",
                color: "#14532d",
              }}
            />

            <Chip
              label={`Recibido carbón: ${formatNumber(tableTotals.pesoTonRecibidasCarbon, 2)} t`}
              sx={{
                ...summaryChipSx,
                bgcolor: "#dbeafe",
                color: "#1e3a8a",
              }}
            />

            <Chip
              label={`Recibido madera: ${formatNumber(tableTotals.pesoTonRecibidasMadera, 2)} t`}
              sx={{
                ...summaryChipSx,
                bgcolor: "#dcfce7",
                color: "#14532d",
              }}
            />

            <Tooltip
              title={
                hasColumnFilters
                  ? "Limpiar filtros de columnas"
                  : "No hay filtros de columnas activos"
              }
            >
              <span>
                <IconButton
                  onClick={clearAllColumnFilters}
                  disabled={!hasColumnFilters || loading || saving}
                  sx={{
                    ...toolbarIconSx,
                    color: hasColumnFilters ? "#d97706" : "#94a3b8",
                  }}
                >
                  <FilterAltOff />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Agregar fila">
              <span>
                <IconButton
                  onClick={addRow}
                  disabled={loading || saving}
                  sx={{
                    ...toolbarIconSx,
                    bgcolor: "#16a34a",
                    color: "#ffffff",
                    borderColor: "#16a34a",
                    "&:hover": {
                      bgcolor: "#15803d",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "#bbf7d0",
                      color: "#ffffff",
                    },
                  }}
                >
                  <Add />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Copiar tabla">
              <IconButton
                onClick={handleCopyTable}
                sx={{
                  ...toolbarIconSx,
                  color: "#0f172a",
                }}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>

            <Tooltip title="Guardar en base de datos">
              <span>
                <IconButton
                  onClick={saveRows}
                  disabled={loading || saving}
                  sx={{
                    ...toolbarIconSx,
                    bgcolor: "#059669",
                    color: "#ffffff",
                    borderColor: "#059669",
                    "&:hover": {
                      bgcolor: "#047857",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "#a7f3d0",
                      color: "#ffffff",
                    },
                  }}
                >
                  {saving ? <CircularProgress size={18} sx={{ color: "#ffffff" }} /> : <Save />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        variant="outlined"
        onContextMenu={handleRightClickCopyTable}
        sx={{
          borderRadius: 4,
          maxHeight: 650,
          borderColor: "#cbd5e1",
          overflow: "auto",
          boxShadow: "0 14px 35px rgba(15,23,42,0.08)",
          "& table": {
            borderCollapse: "separate",
            borderSpacing: 0,
          },
          "& th": {
            fontWeight: 900,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.35,
            whiteSpace: "nowrap",
            borderColor: "#cbd5e1",
            borderRight: "1px solid rgba(255, 255, 255, 0.14)",
          },
          "& td": {
            fontSize: 12,
            borderColor: "#e2e8f0",
            whiteSpace: "nowrap",
            borderRight: "1px solid rgba(148, 163, 184, 0.28)",
          },
          "& th:last-of-type, & td:last-of-type": {
            borderRight: "none",
          },
          "& tbody tr:hover td": {
            bgcolor: "#f8fbff",
          },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  bgcolor: "#0f172a",
                  color: "white",
                  minWidth: 58,
                  left: 0,
                  position: "sticky",
                  zIndex: 7,
                  borderRight: "2px solid #94a3b8",
                }}
              >
                #
              </TableCell>

              {columns.map((column) => {
                const columnHasFilter = Object.prototype.hasOwnProperty.call(
                  columnFilters,
                  column.key
                );

                return (
                  <TableCell
                    key={column.key}
                    align={column.align || "left"}
                    onClick={() => openColumnFilter(column.key)}
                    sx={{
                      bgcolor:
                        column.type === "calculated"
                          ? "#334155"
                          : column.key === "tipoCombustible"
                            ? "#1e40af"
                            : "#0f172a",
                      color: "white",
                      minWidth: column.minWidth,
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": {
                        filter: "brightness(1.12)",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent={column.align === "right" ? "flex-end" : "space-between"}
                      gap={0.75}
                    >
                      <Box component="span">{column.label}</Box>

                      <Tooltip title="Filtrar columna">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            openColumnFilter(column.key);
                          }}
                          sx={{
                            color: "white",
                            p: 0.25,
                            bgcolor: columnHasFilter
                              ? "rgba(250, 204, 21, 0.32)"
                              : "rgba(255,255,255,0.08)",
                            "&:hover": {
                              bgcolor: columnHasFilter
                                ? "rgba(250, 204, 21, 0.45)"
                                : "rgba(255,255,255,0.18)",
                            },
                          }}
                        >
                          <FilterAlt sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  bgcolor: "#0f172a",
                  color: "white",
                  minWidth: 86,
                  position: "sticky",
                  right: 0,
                  zIndex: 7,
                  boxShadow: "-8px 0 18px rgba(15,23,42,0.08)",
                }}
              >
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  align="center"
                  sx={{
                    py: 4,
                    fontWeight: 800,
                    color: "text.secondary",
                    bgcolor: "#f8fafc",
                  }}
                >
                  {loading ? "Consultando registros..." : "No hay registros para los filtros seleccionados."}
                </TableCell>
              </TableRow>
            )}

            {visibleRows.map(({ row, originalIndex }, rowIndex) => {
              const calculated = calculatedById[row.id] || calculateRow(row);

              return (
                <TableRow key={row.id} hover>
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: "#f1f5f9",
                      fontWeight: 900,
                      left: 0,
                      position: "sticky",
                      zIndex: 3,
                      minWidth: 58,
                      borderRight: "2px solid #cbd5e1",
                    }}
                  >
                    {rowIndex + 1}
                  </TableCell>

                  {columns.map((column, colIndex) => {
                    const setFocus = () => {
                      focusedCellRef.current = { rowIndex: originalIndex, colIndex };
                    };

                    if (column.type === "calculated") {
                      let displayValue = "";
                      let customSx = calculatedCellSx;

                      if (column.key === "diferenciaKg") {
                        displayValue = formatInteger(calculated.diferenciaKg);
                        customSx = {
                          ...calculatedCellSx,
                          bgcolor: calculated.diferenciaKg < 0 ? "#fee2e2" : "#ecfdf5",
                          color: calculated.diferenciaKg < 0 ? "#991b1b" : "#166534",
                        };
                      }

                      if (column.key === "pesoTonRecibidas") {
                        displayValue = formatNumber(calculated.pesoTonRecibidas, 2);
                      }

                      if (column.key === "precioTotal") {
                        displayValue = formatMoney(calculated.precioTotal);
                      }

                      if (column.key === "valorFacturado") {
                        displayValue = formatMoney(calculated.valorFacturado);
                      }

                      return (
                        <TableCell
                          key={column.key}
                          align={column.align || "left"}
                          sx={{ ...customSx, minWidth: column.minWidth }}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    }

                    if (column.type === "select") {
                      return (
                        <TableCell
                          key={column.key}
                          sx={{
                            ...editableCellSx,
                            minWidth: column.minWidth,
                            bgcolor: row.tipoCombustible === "Madera" ? "#ecfdf5" : "#eff6ff",
                          }}
                        >
                          <ExcelSelect
                            value={row[column.key]}
                            onFocus={setFocus}
                            onChange={(value) => updateCell(row.id, column.key, value)}
                          >
                            <option value="Carbón">Carbón</option>
                            <option value="Madera">Madera</option>
                          </ExcelSelect>
                        </TableCell>
                      );
                    }

                    if (column.type === "selectSap") {
                      return (
                        <TableCell
                          key={column.key}
                          sx={{ ...editableCellSx, minWidth: column.minWidth }}
                        >
                          <ExcelSelect
                            value={row[column.key]}
                            onFocus={setFocus}
                            onChange={(value) => updateCell(row.id, column.key, value)}
                          >
                            <option value="">Seleccione</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Reportado">Reportado</option>
                            <option value="No aplica">No aplica</option>
                          </ExcelSelect>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={column.key}
                        align={column.align || "left"}
                        sx={{ ...editableCellSx, minWidth: column.minWidth }}
                      >
                        <ExcelInput
                          type={column.type}
                          align={column.align || "left"}
                          value={row[column.key]}
                          onFocus={setFocus}
                          onChange={(value) => updateCell(row.id, column.key, value)}
                        />
                      </TableCell>
                    );
                  })}

                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: "#ffffff",
                      borderColor: "#e2e8f0",
                      minWidth: 86,
                      position: "sticky",
                      right: 0,
                      zIndex: 2,
                      boxShadow: "-8px 0 18px rgba(15,23,42,0.06)",
                    }}
                  >
                    <Tooltip title="Eliminar fila">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={loading || saving}
                          onClick={() => deleteRow(row)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  ...footerCellSx,
                  left: 0,
                  zIndex: 8,
                  bgcolor: "#0f172a",
                  color: "#ffffff",
                  borderRight: "2px solid #94a3b8",
                }}
              >
                Σ
              </TableCell>

              <TableCell
                colSpan={4}
                sx={{
                  ...footerCellSx,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Acumulados · {tableTotals.registros} registros
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatInteger(tableTotals.pesoMinaKg)}
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...footerCellSx,
                  color: "#1e3a8a",
                  whiteSpace: "nowrap",
                }}
              >
                R.Carbón: {tableTotals.totalCarbon} · R.Madera: {tableTotals.totalMadera}
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatInteger(tableTotals.pesoKgAmbiocom)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerNumberCellSx,
                  bgcolor: tableTotals.diferenciaKg < 0 ? "#fee2e2" : "#dcfce7",
                  color: tableTotals.diferenciaKg < 0 ? "#991b1b" : "#166534",
                }}
              >
                {formatInteger(tableTotals.diferenciaKg)}
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatNumber(tableTotals.pesoTonRecibidas, 2)}
              </TableCell>

              <TableCell align="center" sx={footerCellSx}>
                —
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatMoney(tableTotals.precioTotal)}
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatMoney(tableTotals.iva)}
              </TableCell>

              <TableCell align="right" sx={footerNumberCellSx}>
                {formatMoney(tableTotals.valorFacturado)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerNumberCellSx,
                  color: tableTotals.notaDebitoCredito < 0 ? "#991b1b" : "#0f172a",
                }}
              >
                {formatMoney(tableTotals.notaDebitoCredito)}
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...footerCellSx,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                }}
              >
                Rep: {tableTotals.reportados} · Pend: {tableTotals.pendientes}
              </TableCell>

              <TableCell sx={footerCellSx} />

              <TableCell
                sx={{
                  ...footerCellSx,
                  right: 0,
                  zIndex: 8,
                  bgcolor: "#f1f5f9",
                  boxShadow: "-8px 0 18px rgba(15,23,42,0.08)",
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(activeFilterKey)}
        onClose={closeColumnFilter}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>
          Filtrar por {activeColumn?.label || ""}
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            value={filterSearch}
            onChange={(event) => setFilterSearch(event.target.value)}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
              },
            }}
          />

          <Stack
            sx={{
              maxHeight: 330,
              overflow: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              p: 1,
              bgcolor: "#f8fafc",
            }}
          >
            {filteredOptionsForModal.length === 0 && (
              <Typography
                align="center"
                color="text.secondary"
                fontWeight={800}
                sx={{ py: 3 }}
              >
                Sin valores disponibles.
              </Typography>
            )}

            {filteredOptionsForModal.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={currentSelectedValues.includes(option)}
                    onChange={() => toggleColumnFilterValue(option)}
                  />
                }
                label={
                  <Typography
                    fontSize={13}
                    fontWeight={option === EMPTY_FILTER_LABEL ? 900 : 700}
                    color={option === EMPTY_FILTER_LABEL ? "text.secondary" : "text.primary"}
                  >
                    {option}
                  </Typography>
                }
                sx={{
                  m: 0,
                  px: 0.5,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "#eef6ff",
                  },
                }}
              />
            ))}
          </Stack>

          <Typography color="text.secondary" fontSize={12.5} mt={1.25}>
            Mostrando {visibleRows.length} de {dateFilteredRows.length} registros según los filtros activos.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={selectAllColumnValues}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 850 }}
          >
            Todos
          </Button>

          <Button
            onClick={selectNoColumnValues}
            color="warning"
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 850 }}
          >
            Ninguno
          </Button>

          <Button
            onClick={closeColumnFilter}
            variant="contained"
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 850 }}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={hasUnsavedChanges}
        autoHideDuration={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity="warning"
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 3,
            fontWeight: 900,
            bgcolor: "#f97316",
            color: "#ffffff",
            boxShadow: "0 14px 35px rgba(15,23,42,0.22)",
            "& .MuiAlert-icon": {
              color: "#ffffff",
            },
          }}
        >
          Cambios pendientes por guardar. Guarda la información para sincronizarla con el backend.
        </Alert>
      </Snackbar>

      <Snackbar
        open={copySnack.open}
        autoHideDuration={2200}
        onClose={closeCopySnack}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeCopySnack}
          severity={copySnack.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 3,
            fontWeight: 850,
          }}
        >
          {copySnack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
