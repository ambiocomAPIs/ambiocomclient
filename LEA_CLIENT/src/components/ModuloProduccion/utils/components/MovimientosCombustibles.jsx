import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutline,
  FilterAlt,
  Inventory2,
  Refresh,
  Search,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import Swal from "sweetalert2";

import {
  calculateDailyCarbon,
  formatTon,
} from "./tablepatiocarbontipoexcel";

const API_INGRESOS_COMBUSTIBLES =
  "https://ambiocomserver.onrender.com/api/ingresos-combustibles";

const API_CONSUMOS_COMBUSTIBLES =
  "https://ambiocomserver.onrender.com/api/consumos-combustibles";

const MATERIAL_OPTIONS = ["Todos", "Carbón", "Madera", "Bagazo"];
const SOURCE_OPTIONS = [
  { value: "Todos", label: "Todas las fuentes" },
  { value: "ingresos-planta", label: "Ingresos planta" },
  { value: "consumo-diario", label: "Consumo diario" },
  { value: "ajuste-diario", label: "Ajuste diario" },
  { value: "ajuste-manual", label: "Ajuste manual" },
];

const toneMap = {
  Entrada: {
    bgcolor: "#dcfce7",
    color: "#166534",
    border: "#bbf7d0",
  },
  Salida: {
    bgcolor: "#fff7ed",
    color: "#9a3412",
    border: "#fed7aa",
  },
  Ajuste: {
    bgcolor: "#eff6ff",
    color: "#1e40af",
    border: "#bfdbfe",
  },
};

const sourceToneMap = {
  "ingresos-planta": {
    label: "Ingresos planta",
    bgcolor: "#ecfdf5",
    color: "#166534",
    border: "#bbf7d0",
  },
  "consumo-diario": {
    label: "Consumo diario",
    bgcolor: "#fff7ed",
    color: "#9a3412",
    border: "#fed7aa",
  },
  "ajuste-diario": {
    label: "Ajuste diario",
    bgcolor: "#eff6ff",
    color: "#1e40af",
    border: "#bfdbfe",
  },
  "ajuste-manual": {
    label: "Ajuste manual",
    bgcolor: "#fef3c7",
    color: "#854d0e",
    border: "#fde68a",
  },
};

const tableShellSx = {
  borderRadius: 4,
  borderColor: "#cbd5e1",
  overflow: "auto",
  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  "& table": {
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  "& th": {
    bgcolor: "#0f172a",
    color: "white",
    fontWeight: 900,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.35,
    whiteSpace: "nowrap",
    borderColor: "#334155",
  },
  "& td": {
    fontSize: 12,
    borderColor: "#e2e8f0",
    whiteSpace: "nowrap",
  },
  "& tbody tr:hover td": {
    bgcolor: "#f8fbff",
  },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    bgcolor: "#f8fafc",
    fontWeight: 800,
  },
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeDate = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return `${normalizedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return raw;
};

const normalizeActiveFlag = (value) => {
  if (value === false || value === 0) return false;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["false", "0", "no", "inactivo", "inactive", "oculto"].includes(normalized)) {
    return false;
  }

  return true;
};

const isMaterialActive = (item = {}) => normalizeActiveFlag(item.active);

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

const filterByDateRange = (row, dateRange) => {
  const fecha = normalizeDate(row.fecha);
  const desde = normalizeDate(dateRange?.desde);
  const hasta = normalizeDate(dateRange?.hasta);

  if (!fecha) return false;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;

  return true;
};

const sortMovements = (rows) =>
  [...rows].sort((a, b) => {
    const fechaCompare = String(a.fecha || "").localeCompare(String(b.fecha || ""));
    if (fechaCompare !== 0) return fechaCompare;

    return String(a.origen || "").localeCompare(String(b.origen || ""));
  });

const getSourceTone = (source) => sourceToneMap[source] || sourceToneMap["ajuste-manual"];
const getMovementTone = (tipo) => toneMap[tipo] || toneMap.Ajuste;

const buildIngresoMovements = (ingresosRows = [], dateRange = {}) => {
  return ingresosRows
    .map((row) => {
      const fecha = normalizeDate(row.fechaRecepcion || row.fecha || "");
      const material = String(row.tipoCombustible || row.material || "Carbón")
        .toLowerCase()
        .includes("madera")
        ? "Madera"
        : String(row.tipoCombustible || row.material || "")
            .toLowerCase()
            .includes("bagazo")
          ? "Bagazo"
          : "Carbón";

      const cantidadTon =
        row.pesoTonRecibidas !== undefined && row.pesoTonRecibidas !== ""
          ? toNumber(row.pesoTonRecibidas)
          : toNumber(row.pesoKgAmbiocom) / 1000;

      return {
        id: `ingreso-${row._id || row.mongoId || row.id || `${fecha}-${row.remision || row.numeroFactura || Math.random()}`}`,
        fecha,
        material,
        proveedor: row.mina || row.proveedor || material,
        tipo: "Entrada",
        cantidadTon,
        origen: "Ingresos planta combustibles",
        fuente: "ingresos-planta",
        lote: row.remision || row.lote || "",
        responsable: row.responsable || "",
        observacion: row.observacion || row.numeroFactura || "",
      };
    })
    .filter((row) => row.fecha && Number(row.cantidadTon || 0) > 0)
    .filter((row) => filterByDateRange(row, dateRange));
};

const buildDailyConsumptionMovements = (dailyRows = [], materials = [], dateRange = {}) => {
  const activeMaterials = materials.filter(isMaterialActive);
  const movements = [];

  dailyRows.forEach((row) => {
    const fecha = normalizeDate(row.fecha);

    if (!fecha) return;

    activeMaterials.forEach((materialItem) => {
      const result = calculateDailyCarbon(row.carbons?.[materialItem.id], materialItem);
      const material = materialItem.material || "Carbón";
      const proveedor = materialItem.name || material;

      if (Number(result.salida || 0) > 0) {
        movements.push({
          id: `consumo-${fecha}-${materialItem.id}`,
          fecha,
          material,
          proveedor,
          itemMaterialId: materialItem.id,
          tipo: "Salida",
          cantidadTon: Number(result.salida || 0),
          origen: "Consumo diario combustibles",
          fuente: "consumo-diario",
          lote: "",
          responsable: "Producción",
          observacion: "Salida calculada por paladas CV/CN",
        });
      }

      if (Number(result.ajuste || 0) !== 0) {
        movements.push({
          id: `ajuste-diario-${fecha}-${materialItem.id}`,
          fecha,
          material,
          proveedor,
          itemMaterialId: materialItem.id,
          tipo: "Ajuste",
          cantidadTon: Number(result.ajuste || 0),
          origen: "Consumo diario combustibles",
          fuente: "ajuste-diario",
          lote: "",
          responsable: "Producción",
          observacion: "Ajuste registrado en consumo diario",
        });
      }
    });
  });

  return movements.filter((row) => filterByDateRange(row, dateRange));
};


const buildStockSummaryFromConsumosRows = (dailyRows = [], materials = [], dateRange = {}) => {
  const activeMaterials = materials.filter(isMaterialActive);
  const previousFinalByMaterialItem = {};
  const lastFinalByMaterialItem = {};

  const initialStockByMaterial = {
    Carbón: 0,
    Madera: 0,
    Bagazo: 0,
    total: 0,
  };

  const sortedRows = [...dailyRows]
    .filter((row) => filterByDateRange({ fecha: row.fecha || row.id }, dateRange))
    .sort((a, b) =>
      String(normalizeDate(a.fecha || a.id)).localeCompare(
        String(normalizeDate(b.fecha || b.id))
      )
    );

  let lastStockByMaterial = { ...initialStockByMaterial };

  sortedRows.forEach((row) => {
    const finalPatioByMaterial = {
      Carbón: 0,
      Madera: 0,
      Bagazo: 0,
    };

    const salidaByMaterial = {
      Carbón: 0,
      Madera: 0,
      Bagazo: 0,
    };

    activeMaterials.forEach((materialItem) => {
      const data = row.carbons?.[materialItem.id] || {};
      const hasPreviousFinal = Object.prototype.hasOwnProperty.call(
        previousFinalByMaterialItem,
        materialItem.id
      );

      const result = calculateDailyCarbon(
        data,
        materialItem,
        hasPreviousFinal ? previousFinalByMaterialItem[materialItem.id] : undefined
      );

      previousFinalByMaterialItem[materialItem.id] = result.final;
      lastFinalByMaterialItem[materialItem.id] = {
        value: result.final,
        material: materialItem.material || "Carbón",
        stockMinimoTon: Number(materialItem.stockMinimoTon || 0),
        active: isMaterialActive(materialItem),
      };

      const material = materialItem.material || "Carbón";

      if (!finalPatioByMaterial[material]) finalPatioByMaterial[material] = 0;
      if (!salidaByMaterial[material]) salidaByMaterial[material] = 0;

      finalPatioByMaterial[material] += Number(result.final || 0);
      salidaByMaterial[material] += Number(result.salida || 0);
    });

    const totalMezcla =
      Number(salidaByMaterial.Carbón || 0) +
      Number(salidaByMaterial.Madera || 0) +
      Number(salidaByMaterial.Bagazo || 0);

    const totalTolvas =
      toNumber(row.tolvaPrincipal) + toNumber(row.tolvasAuxiliares);

    const tolvaCarbon =
      totalMezcla > 0 ? totalTolvas * (Number(salidaByMaterial.Carbón || 0) / totalMezcla) : 0;
    const tolvaMadera =
      totalMezcla > 0 ? totalTolvas * (Number(salidaByMaterial.Madera || 0) / totalMezcla) : 0;
    const tolvaBagazo =
      totalMezcla > 0 ? totalTolvas * (Number(salidaByMaterial.Bagazo || 0) / totalMezcla) : 0;

    lastStockByMaterial = {
      Carbón: Number(finalPatioByMaterial.Carbón || 0) + tolvaCarbon,
      Madera: Number(finalPatioByMaterial.Madera || 0) + tolvaMadera,
      Bagazo: Number(finalPatioByMaterial.Bagazo || 0) + tolvaBagazo,
      total:
        Number(finalPatioByMaterial.Carbón || 0) +
        Number(finalPatioByMaterial.Madera || 0) +
        Number(finalPatioByMaterial.Bagazo || 0) +
        tolvaCarbon +
        tolvaMadera +
        tolvaBagazo,
    };
  });

  const alertas = Object.values(lastFinalByMaterialItem).filter(
    (item) => isMaterialActive(item) && item.stockMinimoTon > 0 && Number(item.value || 0) < item.stockMinimoTon
  ).length;

  return {
    stockByMaterial: lastStockByMaterial,
    stockByItem: lastFinalByMaterialItem,
    alertas,
  };
};

const createManualAdjustment = async ({ dateRange, materials }) => {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = normalizeDate(dateRange?.desde) || today;
  const activeMaterials = materials.filter(isMaterialActive);
  const materialOptionsHtml = ["Carbón", "Madera", "Bagazo"]
    .map((material) => `<option value="${material}">${material}</option>`)
    .join("");
  const providerOptionsHtml = activeMaterials
    .map(
      (item) =>
        `<option value="${item.name}" data-material="${item.material || "Carbón"}">${item.name} · ${item.material || "Carbón"}</option>`
    )
    .join("");

  const result = await Swal.fire({
    icon: "question",
    title: "Agregar ajuste manual",
    html: `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
        <label style="font-size:12px; font-weight:800; color:#334155;">Fecha</label>
        <input id="swal-fecha" type="date" value="${defaultDate}" class="swal2-input" style="margin:0; width:100%;" />

        <label style="font-size:12px; font-weight:800; color:#334155;">Material</label>
        <select id="swal-material" class="swal2-input" style="margin:0; width:100%;">
          ${materialOptionsHtml}
        </select>

        <label style="font-size:12px; font-weight:800; color:#334155;">Item / proveedor</label>
        <select id="swal-proveedor-select" class="swal2-input" style="margin:0; width:100%;">
          <option value="">Seleccionar item configurado</option>
          ${providerOptionsHtml}
        </select>
        <input id="swal-proveedor" placeholder="O escribe un proveedor" class="swal2-input" style="margin:0; width:100%;" />

        <label style="font-size:12px; font-weight:800; color:#334155;">Cantidad toneladas</label>
        <input id="swal-cantidad" type="number" step="0.01" placeholder="Ej: -1.5 o 2.3" class="swal2-input" style="margin:0; width:100%;" />

        <label style="font-size:12px; font-weight:800; color:#334155;">Observación</label>
        <textarea id="swal-observacion" placeholder="Motivo del ajuste" class="swal2-textarea" style="margin:0; width:100%; min-height:80px;"></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Agregar ajuste",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    didOpen: () => {
      const select = document.getElementById("swal-proveedor-select");
      const proveedorInput = document.getElementById("swal-proveedor");
      const materialInput = document.getElementById("swal-material");

      select?.addEventListener("change", () => {
        const selected = select.options[select.selectedIndex];
        proveedorInput.value = select.value || "";
        if (selected?.dataset?.material) {
          materialInput.value = selected.dataset.material;
        }
      });
    },
    preConfirm: () => {
      const fecha = normalizeDate(document.getElementById("swal-fecha")?.value);
      const material = document.getElementById("swal-material")?.value || "Carbón";
      const proveedor = String(document.getElementById("swal-proveedor")?.value || "").trim();
      const cantidadTon = toNumber(document.getElementById("swal-cantidad")?.value);
      const observacion = String(document.getElementById("swal-observacion")?.value || "").trim();

      if (!fecha) {
        Swal.showValidationMessage("Selecciona una fecha.");
        return false;
      }

      if (!proveedor) {
        Swal.showValidationMessage("Selecciona o escribe el item/proveedor.");
        return false;
      }

      if (!cantidadTon) {
        Swal.showValidationMessage("La cantidad no puede ser cero.");
        return false;
      }

      return {
        id: `ajuste-manual-${Date.now()}`,
        fecha,
        material,
        proveedor,
        tipo: "Ajuste",
        cantidadTon,
        origen: "Ajuste manual de inventario",
        fuente: "ajuste-manual",
        lote: "",
        responsable: "Supervisor",
        observacion,
      };
    },
  });

  return result.isConfirmed ? result.value : null;
};

const MOVEMENTS_COPY_HEADERS = [
  "Fecha",
  "Material",
  "Proveedor / item",
  "Tipo",
  "Cantidad toneladas",
  "Origen",
  "Fuente",
  "Lote / remisión",
  "Responsable",
  "Observación",
];

const buildMovementsCopyText = (rows = []) => {
  const body = rows.map((row) => [
    row.fecha ?? "",
    row.material ?? "",
    row.proveedor ?? "",
    row.tipo ?? "",
    row.cantidadTon ?? 0,
    row.origen ?? "",
    sourceToneMap[row.fuente]?.label || row.fuente || "",
    row.lote ?? "",
    row.responsable ?? "",
    row.observacion ?? "",
  ]);

  return [MOVEMENTS_COPY_HEADERS, ...body]
    .map((line) => line.map((value) => value ?? "").join("	"))
    .join("\n");
};

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("No se pudo copiar la tabla.");
  }
};

export default function MovimientosCombustibles({
  visible = true,
  enabled = visible,
  dateRange = { desde: "", hasta: "" },
  materials = [],
  refreshKey = 0,
  onMovementsChange,
}) {
  const [materialFilter, setMaterialFilter] = useState("Todos");
  const [sourceFilter, setSourceFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [manualAdjustments, setManualAdjustments] = useState([]);
  const [backendIngresosRows, setBackendIngresosRows] = useState([]);
  const [backendConsumosRows, setBackendConsumosRows] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const lastLoadedKeyRef = useRef("");

  const loadMovimientosFromBackend = useCallback(
    async ({ withToast = false, force = false, reloadKey = "" } = {}) => {
      const desde = normalizeDate(dateRange?.desde);
      const hasta = normalizeDate(dateRange?.hasta);

      if (!desde || !hasta) {
        setBackendIngresosRows([]);
        setBackendConsumosRows([]);
        lastLoadedKeyRef.current = "";
        return;
      }

      const currentLoadKey = `${desde}|${hasta}|${reloadKey}`;

      if (!force && lastLoadedKeyRef.current === currentLoadKey) {
        return;
      }

      try {
        setLoadingMovimientos(true);

        const query = new URLSearchParams({
          desde,
          hasta,
        }).toString();

        const [ingresosData, consumosData] = await Promise.all([
          requestJson(`${API_INGRESOS_COMBUSTIBLES}/rango?${query}`),
          requestJson(`${API_CONSUMOS_COMBUSTIBLES}/rango?${query}`),
        ]);

        setBackendIngresosRows(Array.isArray(ingresosData?.registros) ? ingresosData.registros : []);
        setBackendConsumosRows(Array.isArray(consumosData?.registros) ? consumosData.registros : []);
        lastLoadedKeyRef.current = currentLoadKey;

        if (withToast) {
          Swal.fire({
            icon: "success",
            title: "Movimientos actualizados",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.style.marginTop = "70px";
              toast.style.marginRight = "12px";
            },
          });
        }
      } catch (error) {
        console.error("Error consultando movimientos de combustibles:", error);

        Swal.fire({
          icon: "error",
          title: "No se pudieron consultar los movimientos",
          text:
            error.message ||
            "Ocurrió un error cargando ingresos y consumos de combustibles.",
          confirmButtonText: "Entendido",
        });
      } finally {
        setLoadingMovimientos(false);
      }
    },
    [dateRange?.desde, dateRange?.hasta]
  );

  useEffect(() => {
    if (!enabled) return;

    loadMovimientosFromBackend({ reloadKey: refreshKey });
  }, [enabled, loadMovimientosFromBackend, refreshKey]);

  const ingresoMovements = useMemo(
    () => buildIngresoMovements(backendIngresosRows, dateRange),
    [backendIngresosRows, dateRange]
  );

  const dailyMovements = useMemo(
    () => buildDailyConsumptionMovements(backendConsumosRows, materials, dateRange),
    [backendConsumosRows, materials, dateRange]
  );

  const stockSummary = useMemo(
    () => buildStockSummaryFromConsumosRows(backendConsumosRows, materials, dateRange),
    [backendConsumosRows, materials, dateRange]
  );

  const allMovements = useMemo(
    () => sortMovements([...ingresoMovements, ...dailyMovements, ...manualAdjustments]),
    [dailyMovements, ingresoMovements, manualAdjustments]
  );

  useEffect(() => {
    onMovementsChange?.(allMovements, stockSummary);
  }, [allMovements, onMovementsChange, stockSummary]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return allMovements.filter((row) => {
      const matchesDate = filterByDateRange(row, dateRange);
      const matchesMaterial = materialFilter === "Todos" || row.material === materialFilter;
      const matchesSource = sourceFilter === "Todos" || row.fuente === sourceFilter;
      const searchable = normalizeText(
        `${row.fecha} ${row.material} ${row.proveedor} ${row.tipo} ${row.origen} ${row.lote} ${row.responsable} ${row.observacion}`
      );

      return (
        matchesDate &&
        matchesMaterial &&
        matchesSource &&
        searchable.includes(normalizedSearch)
      );
    });
  }, [allMovements, dateRange, materialFilter, search, sourceFilter]);

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const materialKey = row.material || "Carbón";
        const tipoKey = row.tipo || "Ajuste";
        const cantidad = Number(row.cantidadTon || 0);

        if (!acc[materialKey]) {
          acc[materialKey] = {
            Entrada: 0,
            Salida: 0,
            Ajuste: 0,
          };
        }

        acc[materialKey][tipoKey] += cantidad;
        acc.total += cantidad;

        return acc;
      },
      {
        Carbón: { Entrada: 0, Salida: 0, Ajuste: 0 },
        Madera: { Entrada: 0, Salida: 0, Ajuste: 0 },
        Bagazo: { Entrada: 0, Salida: 0, Ajuste: 0 },
        total: 0,
      }
    );
  }, [filteredRows]);

  const handleAddManualAdjustment = useCallback(async () => {
    const nextAdjustment = await createManualAdjustment({
      dateRange,
      materials,
    });

    if (!nextAdjustment) return;

    setManualAdjustments((current) => [...current, nextAdjustment]);

    Swal.fire({
      icon: "success",
      title: "Ajuste agregado",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.style.marginTop = "70px";
        toast.style.marginRight = "12px";
      },
    });
  }, [dateRange, materials]);

  const handleDeleteManualAdjustment = useCallback(async (row) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar ajuste manual?",
      text: "Este ajuste solo se eliminará de la vista actual.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setManualAdjustments((current) => current.filter((item) => item.id !== row.id));
  }, []);

  const handleRightClickCopyTable = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (filteredRows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin datos para copiar",
          text: "No hay movimientos visibles para copiar a Excel.",
          timer: 1700,
          showConfirmButton: false,
        });
        return;
      }

      try {
        await copyTextToClipboard(buildMovementsCopyText(filteredRows));

        Swal.fire({
          icon: "success",
          title: "Tabla copiada a Excel",
          text: `${filteredRows.length} movimiento(s) copiado(s) al portapapeles.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.style.marginTop = "70px";
            toast.style.marginRight = "12px";
          },
        });
      } catch (error) {
        console.error("No se pudo copiar la tabla de movimientos:", error);

        Swal.fire({
          icon: "error",
          title: "No se pudo copiar",
          text: error.message || "Ocurrió un error copiando la tabla.",
          confirmButtonText: "Entendido",
        });
      }
    },
    [filteredRows]
  );

  if (!visible) return null;

  return (
    <Stack gap={2}>
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
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ lg: "center" }}
          gap={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={950} color="#0f172a">
              Movimientos consolidados de combustibles
            </Typography>

            <Typography color="text.secondary" fontSize={13.5}>
              Entradas desde ingresos planta, salidas desde consumo diario y ajustes manuales de inventario.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1} flexWrap="wrap">
            <TextField
              label="Buscar proveedor, lote, origen o responsable"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 320 }, ...fieldSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160, ...fieldSx }}>
              <InputLabel>Material</InputLabel>
              <Select
                value={materialFilter}
                label="Material"
                onChange={(event) => setMaterialFilter(event.target.value)}
                startAdornment={<FilterAlt sx={{ mr: 1 }} fontSize="small" />}
              >
                {MATERIAL_OPTIONS.map((material) => (
                  <MenuItem key={material} value={material}>
                    {material}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 190, ...fieldSx }}>
              <InputLabel>Fuente</InputLabel>
              <Select
                value={sourceFilter}
                label="Fuente"
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Actualizar ingresos y consumos desde la base de datos">
              <span>
                <Button
                  startIcon={<Refresh />}
                  variant="outlined"
                  onClick={() => loadMovimientosFromBackend({ withToast: true, force: true, reloadKey: refreshKey })}
                  disabled={loadingMovimientos}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  {loadingMovimientos ? "Actualizando..." : "Refrescar"}
                </Button>
              </span>
            </Tooltip>


            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleAddManualAdjustment}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
              }}
            >
              Agregar ajuste
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip
          icon={<TrendingUp />}
          label={`Entrada carbón: ${formatTon(summary.Carbón.Entrada)} t`}
          sx={{ fontWeight: 900, bgcolor: "#dbeafe", color: "#1e3a8a" }}
        />
        <Chip
          icon={<TrendingUp />}
          label={`Entrada madera: ${formatTon(summary.Madera.Entrada)} t`}
          sx={{ fontWeight: 900, bgcolor: "#dcfce7", color: "#14532d" }}
        />
        <Chip
          icon={<TrendingDown />}
          label={`Salida carbón: ${formatTon(summary.Carbón.Salida)} t`}
          sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#9a3412" }}
        />
        <Chip
          icon={<TrendingDown />}
          label={`Salida madera: ${formatTon(summary.Madera.Salida)} t`}
          sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#9a3412" }}
        />
        <Chip
          icon={<Inventory2 />}
          label={`Ajustes: ${formatTon(summary.Carbón.Ajuste + summary.Madera.Ajuste + summary.Bagazo.Ajuste)} t`}
          sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#1e40af" }}
        />
      </Stack>

      <Tooltip title="Click derecho para copiar la tabla a Excel" placement="top-start">
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={tableShellSx}
          onContextMenu={handleRightClickCopyTable}
        >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Proveedor / item</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Fuente</TableCell>
              <TableCell>Lote / remisión</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Observación</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  align="center"
                  sx={{
                    py: 4,
                    fontWeight: 800,
                    color: "text.secondary",
                    bgcolor: "#f8fafc",
                  }}
                >
                  No hay movimientos para el rango seleccionado.
                </TableCell>
              </TableRow>
            )}

            {filteredRows.map((row) => {
              const movementTone = getMovementTone(row.tipo);
              const sourceTone = getSourceTone(row.fuente);
              const isManual = row.fuente === "ajuste-manual";

              return (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 900 }}>{row.fecha}</TableCell>

                  <TableCell>
                    <Chip
                      label={row.material}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        bgcolor:
                          row.material === "Madera"
                            ? "#ecfdf5"
                            : row.material === "Bagazo"
                              ? "#fff7ed"
                              : "#eff6ff",
                        color:
                          row.material === "Madera"
                            ? "#166534"
                            : row.material === "Bagazo"
                              ? "#9a3412"
                              : "#1e40af",
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 850 }}>{row.proveedor}</TableCell>

                  <TableCell>
                    <Chip
                      label={row.tipo}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        bgcolor: movementTone.bgcolor,
                        color: movementTone.color,
                        border: `1px solid ${movementTone.border}`,
                      }}
                    />
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 950,
                      color: Number(row.cantidadTon || 0) < 0 ? "#991b1b" : "#0f172a",
                    }}
                  >
                    {formatTon(row.cantidadTon)} t
                  </TableCell>

                  <TableCell>{row.origen}</TableCell>

                  <TableCell>
                    <Chip
                      label={sourceTone.label}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        bgcolor: sourceTone.bgcolor,
                        color: sourceTone.color,
                        border: `1px solid ${sourceTone.border}`,
                      }}
                    />
                  </TableCell>

                  <TableCell>{row.lote}</TableCell>
                  <TableCell>{row.responsable}</TableCell>
                  <TableCell sx={{ minWidth: 230 }}>{row.observacion}</TableCell>

                  <TableCell align="center">
                    {isManual ? (
                      <Tooltip title="Eliminar ajuste manual">
                        <Button
                          size="small"
                          startIcon={<DeleteOutline />}
                          color="error"
                          onClick={() => handleDeleteManualAdjustment(row)}
                          sx={{
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 900,
                          }}
                        >
                          Eliminar
                        </Button>
                      </Tooltip>
                    ) : (
                      <Typography fontSize={12} fontWeight={800} color="text.secondary">
                        Automático
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </TableContainer>
      </Tooltip>
    </Stack>
  );
}
