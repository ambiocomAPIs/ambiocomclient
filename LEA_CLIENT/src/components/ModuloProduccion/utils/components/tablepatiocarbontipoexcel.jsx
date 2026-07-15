import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
} from "@mui/material";
import {
  Add,
  Inventory2,
  Visibility,
  LocalFireDepartment,
  Save,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import ResumenPatioCarbonModal from "../modals/ResumenPatioCarbonModal";


export const formatTon = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatPercent = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export const toSafeNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "").trim();

  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
};

const INGRESOS_COMBUSTIBLES_API_BASE_URL =
  "https://ambiocomserver.onrender.com/api/ingresos-combustibles";

const CONSUMOS_COMBUSTIBLES_API_BASE_URL =
  "https://ambiocomserver.onrender.com/api/consumos-combustibles";

const ingresosCombustiblesCache = new Map();

export const clearIngresosCombustiblesCache = () => {
  ingresosCombustiblesCache.clear();
};

const normalizeDateKey = (value) => String(value || "").slice(0, 10);

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeProveedorKey = (value) => {
  const normalized = normalizeKey(value);

  if (!normalized) return "";

  return normalized
    .split(" ")
    .filter(
      (token) =>
        ![
          "s",
          "sa",
          "sas",
          "sasd",
          "ltda",
          "cia",
          "compania",
          "y",
          "asociados",
        ].includes(token)
    )
    .join(" ")
    .trim();
};

const normalizeMaterialKey = (value) => {
  const key = normalizeKey(value);

  if (key.includes("madera")) return "madera";
  if (key.includes("bagazo")) return "bagazo";
  if (key.includes("carbon") || key.includes("carbón")) return "carbon";

  return key || "carbon";
};

const extractIngresosArray = (source) => {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.registros)) return source.registros;
  if (Array.isArray(source?.data)) return source.data;
  return [];
};

const getIngresoToneladas = (ingreso = {}) => {
  const toneladasDirectas = toSafeNumber(ingreso.pesoTonRecibidas);

  if (toneladasDirectas > 0) return toneladasDirectas;

  return toSafeNumber(ingreso.pesoKgAmbiocom) / 1000;
};

const buildAliasesMap = (aliases = {}) => {
  const map = {};

  Object.entries(aliases || {}).forEach(([from, to]) => {
    const fromKey = normalizeProveedorKey(from);
    const toKey = normalizeProveedorKey(to);

    if (fromKey && toKey) {
      map[fromKey] = toKey;
    }
  });

  return map;
};

const resolveProveedorKey = (value, aliasesMap = {}) => {
  const key = normalizeProveedorKey(value);
  return aliasesMap[key] || key;
};

const buildIngresosCombustiblesIndex = (ingresos = [], proveedorAliases = {}) => {
  const aliasesMap = buildAliasesMap(proveedorAliases);

  return extractIngresosArray(ingresos).reduce(
    (acc, ingreso) => {
      if (ingreso?.activo === false) return acc;

      const fecha = normalizeDateKey(ingreso.fechaRecepcion || ingreso.fecha);
      const material = normalizeMaterialKey(ingreso.tipoCombustible || ingreso.material);
      const proveedor = resolveProveedorKey(ingreso.mina || ingreso.proveedor, aliasesMap);
      const toneladas = getIngresoToneladas(ingreso);

      if (!fecha || !material || !proveedor || toneladas <= 0) return acc;

      const proveedorKey = `${fecha}|${material}|${proveedor}`;
      const materialKey = `${fecha}|${material}`;

      acc.byProveedor[proveedorKey] =
        (acc.byProveedor[proveedorKey] || 0) + toneladas;

      acc.byMaterial[materialKey] =
        (acc.byMaterial[materialKey] || 0) + toneladas;

      acc.tripsByProveedor[proveedorKey] =
        (acc.tripsByProveedor[proveedorKey] || 0) + 1;

      acc.tripsByMaterial[materialKey] =
        (acc.tripsByMaterial[materialKey] || 0) + 1;

      if (!acc.candidatesByDateMaterial[materialKey]) {
        acc.candidatesByDateMaterial[materialKey] = {};
      }

      acc.candidatesByDateMaterial[materialKey][proveedor] =
        (acc.candidatesByDateMaterial[materialKey][proveedor] || 0) + toneladas;

      acc.totalToneladas += toneladas;
      acc.totalViajes += 1;

      return acc;
    },
    {
      byProveedor: {},
      byMaterial: {},
      tripsByProveedor: {},
      tripsByMaterial: {},
      candidatesByDateMaterial: {},
      totalToneladas: 0,
      totalViajes: 0,
    }
  );
};

const getCarbonProveedorKeys = (carbon = {}, proveedorAliases = {}) => {
  const aliasesMap = buildAliasesMap(proveedorAliases);
  const sourceKeys = [carbon.name, carbon.proveedor, carbon.mina, ...(carbon.aliases || [])];

  return Array.from(
    new Set(
      sourceKeys
        .map((value) => resolveProveedorKey(value, aliasesMap))
        .filter(Boolean)
    )
  );
};

const getIngresoAutomaticoByCarbon = ({
  row,
  carbon,
  carbons,
  ingresosIndex,
  proveedorAliases,
}) => {
  const fecha = normalizeDateKey(row?.fecha);
  const material = normalizeMaterialKey(getMaterial(carbon));

  if (!fecha || !material || !ingresosIndex) {
    return { hasIngreso: false, toneladas: 0, viajes: 0, matchType: "none" };
  }

  const materialKey = `${fecha}|${material}`;
  const proveedorKeys = getCarbonProveedorKeys(carbon, proveedorAliases);

  for (const proveedorKey of proveedorKeys) {
    const key = `${fecha}|${material}|${proveedorKey}`;
    const toneladas = toSafeNumber(ingresosIndex.byProveedor[key]);

    if (toneladas > 0) {
      return {
        hasIngreso: true,
        toneladas,
        viajes: ingresosIndex.tripsByProveedor[key] || 0,
        matchType: "proveedor",
      };
    }
  }

  const candidates = ingresosIndex.candidatesByDateMaterial[materialKey] || {};

  for (const proveedorKey of proveedorKeys) {
    const looseMatches = Object.entries(candidates).filter(
      ([candidateKey]) =>
        candidateKey &&
        proveedorKey &&
        (candidateKey.includes(proveedorKey) || proveedorKey.includes(candidateKey))
    );

    if (looseMatches.length === 1) {
      const [matchedProveedorKey, toneladas] = looseMatches[0];
      const key = `${fecha}|${material}|${matchedProveedorKey}`;

      return {
        hasIngreso: true,
        toneladas: toSafeNumber(toneladas),
        viajes: ingresosIndex.tripsByProveedor[key] || 0,
        matchType: "proveedor-aproximado",
      };
    }
  }

  const activeSameMaterialItems = carbons.filter(
    (item) =>
      item.active !== false && normalizeMaterialKey(getMaterial(item)) === material
  );

  if (activeSameMaterialItems.length === 1) {
    const toneladas = toSafeNumber(ingresosIndex.byMaterial[materialKey]);

    if (toneladas > 0) {
      return {
        hasIngreso: true,
        toneladas,
        viajes: ingresosIndex.tripsByMaterial[materialKey] || 0,
        matchType: "material",
      };
    }
  }

  return { hasIngreso: false, toneladas: 0, viajes: 0, matchType: "none" };
};

const requestIngresosCombustiblesByRange = async ({
  apiBaseUrl,
  desde,
  hasta,
  force = false,
}) => {
  const baseUrl = apiBaseUrl || INGRESOS_COMBUSTIBLES_API_BASE_URL;
  const cacheKey = `${baseUrl}|${desde}|${hasta}`;

  if (!force && ingresosCombustiblesCache.has(cacheKey)) {
    return ingresosCombustiblesCache.get(cacheKey);
  }

  const query = new URLSearchParams({ desde, hasta }).toString();
  const response = await fetch(`${baseUrl}/rango?${query}`);
  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  ingresosCombustiblesCache.set(cacheKey, data);

  return data;
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
    data = { message: text };
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
};

const consumosCombustiblesCache = new Map();

export const clearConsumosCombustiblesCache = () => {
  consumosCombustiblesCache.clear();
};

const requestConsumosCombustiblesByRange = async ({
  apiBaseUrl,
  desde,
  hasta,
  force = false,
}) => {
  const baseUrl = apiBaseUrl || CONSUMOS_COMBUSTIBLES_API_BASE_URL;
  const cacheKey = `${baseUrl}|${desde}|${hasta}`;

  if (!force && consumosCombustiblesCache.has(cacheKey)) {
    return consumosCombustiblesCache.get(cacheKey);
  }

  const query = new URLSearchParams({ desde, hasta }).toString();
  const data = await requestJson(`${baseUrl}/rango?${query}`);

  consumosCombustiblesCache.set(cacheKey, data);

  return data;
};

export const getMonthDays = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthKey}-${day}`;
  });
};

const getMaterial = (item) => item?.material || "Carbón";

const isCarbon = (item) => getMaterial(item) === "Carbón";
const isWood = (item) => getMaterial(item) === "Madera";
const isBagazo = (item) => getMaterial(item) === "Bagazo";

const getMaterialColor = (item, index = 0) => {
  const material = getMaterial(item);

  if (material === "Carbón") {
    return index % 2 === 0 ? "#1e40af" : "#1e3a8a";
  }

  if (material === "Madera") {
    return "#166534";
  }

  if (material === "Bagazo") {
    return "#9a3412";
  }

  return "#0f172a";
};

export const createBlankDailyRow = (date, activeCarbons) => ({
  id: date,
  fecha: date,
  tolvaPrincipal: "",
  tolvasAuxiliares: "",
  observacion: "",
  carbons: activeCarbons.reduce((acc, carbon) => {
    acc[carbon.id] = {
      inicial: "",
      entrada: "",
      paladasCV: "",
      paladasCN: "",
      ajuste: "",
      consumo: "",
      final: "",
    };
    return acc;
  }, {}),
});

export const createMonthlySheet = () => [];

export const normalizeMonthlyRows = (rows, carbons) =>
  rows.map((row) => ({
    ...row,
    carbons: carbons.reduce((acc, carbon) => {
      acc[carbon.id] = row.carbons?.[carbon.id] || {
        inicial: "",
        entrada: "",
        paladasCV: "",
        paladasCN: "",
        ajuste: "",
        consumo: "",
        final: "",
      };
      return acc;
    }, {}),
  }));

const hasFilledValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const hasUsefulMonthlyRowData = (row = {}) => {
  if (hasFilledValue(row.tolvaPrincipal)) return true;
  if (hasFilledValue(row.tolvasAuxiliares)) return true;
  if (hasFilledValue(row.observacion)) return true;

  return Object.values(row.carbons || {}).some((carbon = {}) =>
    [
      carbon.inicial,
      carbon.entrada,
      carbon.paladasCV,
      carbon.paladasCN,
      carbon.ajuste,
      carbon.consumo,
      carbon.final,
    ].some(hasFilledValue)
  );
};

const isDateInsideRange = (date, desde, hasta) => {
  const fecha = normalizeDateKey(date);

  if (!fecha) return false;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;

  return true;
};

const setValueAtPath = (row, path = [], value) => {
  const updated = {
    ...row,
    carbons: { ...(row.carbons || {}) },
  };

  if (path[0] === "carbons") {
    const [, carbonId, field] = path;

    updated.carbons[carbonId] = {
      ...(updated.carbons[carbonId] || {}),
      [field]: value,
    };

    return updated;
  }

  return {
    ...updated,
    [path[0]]: value,
  };
};

export const calculateDailyCarbon = (data, carbon, inicialOverride) => {
  const inicial =
    inicialOverride !== undefined && inicialOverride !== null
      ? toSafeNumber(inicialOverride)
      : toSafeNumber(data?.inicial);

  const entrada = toSafeNumber(data?.entrada);
  const paladasCV = toSafeNumber(data?.paladasCV);
  const paladasCN = toSafeNumber(data?.paladasCN);
  const ajuste = toSafeNumber(data?.ajuste);

  const salida =
    paladasCV * toSafeNumber(carbon.weightCV) +
    paladasCN * toSafeNumber(carbon.weightCN);

  const final = inicial + entrada + ajuste - salida;

  return {
    inicial,
    entrada,
    paladasCV,
    paladasCN,
    ajuste,
    salida,
    final,
  };
};

export const calculateMonthlyTotals = (rows, activeCarbons) => {
  const previousFinalByCarbon = {};
  const lastFinalByCarbon = {};

  let lastTolvaAllocationByMaterial = {
    Carbón: 0,
    Madera: 0,
    Bagazo: 0,
  };

  const totals = rows.reduce(
    (acc, row) => {
      let totalCarbonDia = 0;
      let totalMaderaDia = 0;
      let totalBagazoDia = 0;

      activeCarbons.forEach((carbon) => {
        const data = row.carbons?.[carbon.id];

        const hasPreviousFinal = Object.prototype.hasOwnProperty.call(
          previousFinalByCarbon,
          carbon.id
        );

        const result = calculateDailyCarbon(
          data,
          carbon,
          hasPreviousFinal ? previousFinalByCarbon[carbon.id] : undefined
        );

        previousFinalByCarbon[carbon.id] = result.final;
        lastFinalByCarbon[carbon.id] = {
          value: result.final,
          material: getMaterial(carbon),
        };

        const material = getMaterial(carbon);

        acc.entradas += result.entrada;
        acc.salidas += result.salida;
        acc.paladasCV += result.paladasCV;
        acc.paladasCN += result.paladasCN;

        if (material === "Carbón") {
          acc.entradasCarbon += result.entrada;
          acc.ajusteCarbon += result.ajuste;
          acc.totalCarbon += result.salida;
          totalCarbonDia += result.salida;
        }

        if (material === "Madera") {
          acc.entradasMadera += result.entrada;
          acc.ajusteMadera += result.ajuste;
          acc.totalMadera += result.salida;
          totalMaderaDia += result.salida;
        }

        if (material === "Bagazo") {
          acc.entradasBagazo += result.entrada;
          acc.ajusteBagazo += result.ajuste;
          acc.totalBagazo += result.salida;
          totalBagazoDia += result.salida;
        }
      });

      const totalMezclaDia = totalCarbonDia + totalMaderaDia + totalBagazoDia;
      const totalTolvasDia =
        toSafeNumber(row.tolvaPrincipal) + toSafeNumber(row.tolvasAuxiliares);

      lastTolvaAllocationByMaterial = {
        Carbón:
          totalMezclaDia > 0
            ? totalTolvasDia * (totalCarbonDia / totalMezclaDia)
            : 0,
        Madera:
          totalMezclaDia > 0
            ? totalTolvasDia * (totalMaderaDia / totalMezclaDia)
            : 0,
        Bagazo:
          totalMezclaDia > 0
            ? totalTolvasDia * (totalBagazoDia / totalMezclaDia)
            : 0,
      };

      return acc;
    },
    {
      entradas: 0,
      entradasCarbon: 0,
      entradasMadera: 0,
      entradasBagazo: 0,
      ajusteCarbon: 0,
      ajusteMadera: 0,
      ajusteBagazo: 0,
      salidas: 0,
      inventarioFinal: 0,
      inventarioFinalCarbon: 0,
      inventarioFinalMadera: 0,
      inventarioFinalBagazo: 0,
      paladasCV: 0,
      paladasCN: 0,
      totalCarbon: 0,
      totalMadera: 0,
      totalBagazo: 0,
    }
  );

  Object.values(lastFinalByCarbon).forEach(({ value, material }) => {
    const final = toSafeNumber(value);

    totals.inventarioFinal += final;

    if (material === "Carbón") totals.inventarioFinalCarbon += final;
    if (material === "Madera") totals.inventarioFinalMadera += final;
    if (material === "Bagazo") totals.inventarioFinalBagazo += final;
  });

  totals.inventarioFinalCarbon += lastTolvaAllocationByMaterial.Carbón;
  totals.inventarioFinalMadera += lastTolvaAllocationByMaterial.Madera;
  totals.inventarioFinalBagazo += lastTolvaAllocationByMaterial.Bagazo;
  totals.inventarioFinal +=
    lastTolvaAllocationByMaterial.Carbón +
    lastTolvaAllocationByMaterial.Madera +
    lastTolvaAllocationByMaterial.Bagazo;

  return totals;
};

const inputBaseStyle = {
  width: "100%",
  height: 34,
  border: "1px solid transparent",
  outline: "none",
  background: "transparent",
  fontSize: 12,
  fontWeight: 700,
  boxSizing: "border-box",
  borderRadius: 8,
};

const ExcelInput = React.memo(function ExcelInput({
  value,
  onChange,
  onPaste,
  type = "text",
  placeholder = "",
  align = "right",
  step,
  readOnly = false,
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      step={step}
      readOnly={readOnly}
      onChange={(event) => {
        if (readOnly) return;
        onChange(event.target.value);
      }}
      onPaste={(event) => {
        if (readOnly || !onPaste) return;
        onPaste(event);
      }}
      onFocus={(event) => event.target.select()}
      style={{
        ...inputBaseStyle,
        textAlign: align,
        padding: align === "right" ? "0 8px 0 4px" : "0 10px",
        cursor: readOnly ? "not-allowed" : "text",
        background: readOnly ? "#f8fafc" : "transparent",
        color: readOnly ? "#334155" : undefined,
      }}
    />
  );
});

const formatFullDate = (date) => {
  const fullDate = normalizeDateKey(date);

  return fullDate || String(date || "");
};

function MonthlyExcelSheet({
  rows = [],
  carbons = [],
  totals = {},
  dateRange = { desde: "", hasta: "" },
  ingresosCombustibles = null,
  loadIngresosCombustibles = true,
  ingresosApiBaseUrl = INGRESOS_COMBUSTIBLES_API_BASE_URL,
  consumosApiBaseUrl = CONSUMOS_COMBUSTIBLES_API_BASE_URL,
  ingresosQueryVersion = 0,
  proveedorAliases = {},
  onChange,
  onSave,
  onAfterSave,
  onInventorySummaryChange,
}) {
  const [copySnack, setCopySnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [actionSnack, setActionSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });


  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingresosCombustiblesFromApi, setIngresosCombustiblesFromApi] =
    useState([]);
  const [serverRows, setServerRows] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [manualRows, setManualRows] = useState([]);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const externalIngresosRows = useMemo(
    () => extractIngresosArray(ingresosCombustibles),
    [ingresosCombustibles]
  );

  const shouldUseExternalIngresos = ingresosCombustibles !== null;

  const ingresosCombustiblesRows = shouldUseExternalIngresos
    ? externalIngresosRows
    : ingresosCombustiblesFromApi;

  const ingresosCombustiblesIndex = useMemo(
    () =>
      buildIngresosCombustiblesIndex(
        ingresosCombustiblesRows,
        proveedorAliases
      ),
    [ingresosCombustiblesRows, proveedorAliases]
  );

  const ingresoDatesInRange = useMemo(() => {
    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);

    return Array.from(
      new Set(
        ingresosCombustiblesRows
          .map((ingreso) =>
            normalizeDateKey(ingreso.fechaRecepcion || ingreso.fecha)
          )
          .filter((fecha) => isDateInsideRange(fecha, desde, hasta))
      )
    ).sort();
  }, [ingresosCombustiblesRows, dateRange?.desde, dateRange?.hasta]);

  const ingresoDateSet = useMemo(
    () => new Set(ingresoDatesInRange),
    [ingresoDatesInRange]
  );

  useEffect(() => {
    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);

    if (!desde || !hasta) {
      setServerRows([]);
      setManualRows([]);
      setHasUnsavedChanges(false);
      return;
    }

    let cancelled = false;

    const loadConsumos = async () => {
      try {
        setLoadingConsumos(true);

        const data = await requestConsumosCombustiblesByRange({
          apiBaseUrl: consumosApiBaseUrl,
          desde,
          hasta,
          force: ingresosQueryVersion > 0,
        });

        if (!cancelled) {
          setServerRows(Array.isArray(data?.registros) ? data.registros : []);
          setManualRows([]);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error("Error consultando consumos combustibles guardados:", error);

        if (!cancelled) {
          setServerRows([]);
          setManualRows([]);
          setActionSnack({
            open: true,
            message:
              "No se pudieron cargar los consumos guardados para el rango consultado.",
            severity: "error",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingConsumos(false);
        }
      }
    };

    loadConsumos();

    return () => {
      cancelled = true;
    };
  }, [
    dateRange?.desde,
    dateRange?.hasta,
    consumosApiBaseUrl,
    ingresosQueryVersion,
  ]);

  const sourceRowsByDate = useMemo(() => {
    return [...(Array.isArray(rows) ? rows : []), ...serverRows].reduce(
      (acc, row) => {
        const fecha = normalizeDateKey(row.fecha || row.id);

        if (fecha) {
          acc[fecha] = {
            ...row,
            id: fecha,
            fecha,
          };
        }

        return acc;
      },
      {}
    );
  }, [rows, serverRows]);

  const sourceRowDateSet = useMemo(
    () => new Set(Object.keys(sourceRowsByDate)),
    [sourceRowsByDate]
  );

  const manualRowsByDate = useMemo(() => {
    return manualRows.reduce((acc, row) => {
      const fecha = normalizeDateKey(row.fecha || row.id);

      if (fecha) {
        acc[fecha] = {
          ...row,
          id: fecha,
          fecha,
        };
      }

      return acc;
    }, {});
  }, [manualRows]);

  const rowsForCalculation = useMemo(() => {
    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);
    const dates = new Set();

    Object.values(sourceRowsByDate).forEach((row) => {
      const fecha = normalizeDateKey(row.fecha || row.id);

      if (!isDateInsideRange(fecha, desde, hasta)) return;
      if (hasUsefulMonthlyRowData(row) || ingresoDateSet.has(fecha)) {
        dates.add(fecha);
      }
    });

    Object.values(manualRowsByDate).forEach((row) => {
      const fecha = normalizeDateKey(row.fecha || row.id);

      if (isDateInsideRange(fecha, desde, hasta)) {
        dates.add(fecha);
      }
    });

    ingresoDatesInRange.forEach((fecha) => dates.add(fecha));

    return Array.from(dates)
      .sort()
      .map((fecha) => {
        const sourceRow = sourceRowsByDate[fecha];
        const manualRow = manualRowsByDate[fecha];
        const baseRow = sourceRow || createBlankDailyRow(fecha, carbons);

        return normalizeMonthlyRows(
          [
            {
              ...baseRow,
              ...manualRow,
              id: fecha,
              fecha,
              carbons: {
                ...(baseRow.carbons || {}),
                ...(manualRow?.carbons || {}),
              },
            },
          ],
          carbons
        )[0];
      });
  }, [
    sourceRowsByDate,
    manualRowsByDate,
    ingresoDatesInRange,
    ingresoDateSet,
    dateRange?.desde,
    dateRange?.hasta,
    carbons,
  ]);

  useEffect(() => {
    if (shouldUseExternalIngresos || !loadIngresosCombustibles) return;

    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);

    if (!desde || !hasta) {
      setIngresosCombustiblesFromApi([]);
      return;
    }

    let cancelled = false;

    const loadIngresos = async () => {
      try {
        const data = await requestIngresosCombustiblesByRange({
          apiBaseUrl: ingresosApiBaseUrl,
          desde,
          hasta,
          force: ingresosQueryVersion > 0,
        });

        if (!cancelled) {
          setIngresosCombustiblesFromApi(extractIngresosArray(data));
        }
      } catch (error) {
        console.error(
          "Error consultando ingresos combustibles para cruce:",
          error
        );

        if (!cancelled) {
          setIngresosCombustiblesFromApi([]);
          setActionSnack({
            open: true,
            message:
              "No se pudieron cargar los ingresos de combustibles para el cruce.",
            severity: "error",
          });
        }
      }
    };

    loadIngresos();

    return () => {
      cancelled = true;
    };
  }, [
    shouldUseExternalIngresos,
    loadIngresosCombustibles,
    dateRange?.desde,
    dateRange?.hasta,
    ingresosApiBaseUrl,
    ingresosQueryVersion,
  ]);

  const carbonItems = useMemo(
    () => carbons.filter((item) => item.active !== false && isCarbon(item)),
    [carbons]
  );

  const woodItems = useMemo(
    () => carbons.filter((item) => item.active !== false && isWood(item)),
    [carbons]
  );

  const bagazoItems = useMemo(
    () => carbons.filter((item) => item.active !== false && isBagazo(item)),
    [carbons]
  );

  const showBagazo = bagazoItems.length > 0;

  const showActionSnack = useCallback((message, severity = "success") => {
    setActionSnack({
      open: true,
      message,
      severity,
    });
  }, []);

  const closeActionSnack = useCallback((event, reason) => {
    if (reason === "clickaway") return;

    setActionSnack((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const openSummaryModal = useCallback(() => {
    setSummaryModalOpen(true);
  }, []);

  const closeSummaryModal = useCallback(() => {
    setSummaryModalOpen(false);
  }, []);

  const handleChangeCell = useCallback(
    (rowId, path, value) => {
      const fecha = normalizeDateKey(rowId);

      if (!fecha) return;

      setHasUnsavedChanges(true);

      if (sourceRowDateSet.has(fecha) && onChange) {
        onChange(fecha, path, value);
      }

      setManualRows((currentRows) => {
        const existingManualRow = currentRows.find(
          (row) => normalizeDateKey(row.fecha || row.id) === fecha
        );

        const existingSourceRow = sourceRowsByDate[fecha];
        const existingRow =
          existingManualRow || existingSourceRow || createBlankDailyRow(fecha, carbons);

        const updatedRow = setValueAtPath(
          {
            ...existingRow,
            id: fecha,
            fecha,
          },
          path,
          value
        );

        const withoutCurrent = currentRows.filter(
          (row) => normalizeDateKey(row.fecha || row.id) !== fecha
        );

        return [...withoutCurrent, updatedRow].sort((a, b) =>
          normalizeDateKey(a.fecha || a.id).localeCompare(
            normalizeDateKey(b.fecha || b.id)
          )
        );
      });
    },
    [sourceRowDateSet, sourceRowsByDate, onChange, carbons]
  );

  const parseExcelClipboardText = useCallback((text = "") => {
    const normalized = String(text || "").replace(/\r/g, "");
    const lines = normalized.split("\n");

    if (lines[lines.length - 1] === "") {
      lines.pop();
    }

    return lines
      .map((line) => line.split("\t").map((value) => value.trim()))
      .filter((line) => line.some((value) => value !== ""));
  }, []);

  const buildPasteColumnsForRow = useCallback(
    (row) => {
      const columns = [
        {
          path: ["tolvaPrincipal"],
          canPaste: true,
        },
        {
          path: ["tolvasAuxiliares"],
          canPaste: true,
        },
      ];

      carbons.forEach((carbon) => {
        const ingreso = row?.carbonIngresoMatches?.[carbon.id];
        const isAutomaticInitial = row?.originalIndex > 0;

        columns.push(
          {
            path: ["carbons", carbon.id, "inicial"],
            canPaste: !isAutomaticInitial,
          },
          {
            path: ["carbons", carbon.id, "entrada"],
            canPaste: !ingreso?.hasIngreso,
          },
          {
            path: ["carbons", carbon.id, "paladasCV"],
            canPaste: true,
          },
          {
            path: ["carbons", carbon.id, "paladasCN"],
            canPaste: true,
          },
          {
            path: ["carbons", carbon.id, "ajuste"],
            canPaste: true,
          }
        );
      });

      columns.push({
        path: ["observacion"],
        canPaste: true,
      });

      return columns;
    },
    [carbons]
  );



  const calculatedAllRows = useMemo(() => {
    let consumoAcumulado = 0;
    const previousFinalByCarbon = {};

    return rowsForCalculation.map((row, originalIndex) => {
      let totalEntradas = 0;
      let totalEntradaCarbon = 0;
      let totalEntradaMadera = 0;
      let totalEntradaBagazo = 0;

      let totalAjusteCarbon = 0;
      let totalAjusteMadera = 0;
      let totalAjusteBagazo = 0;

      let totalConsumo = 0;
      let totalFinalPatio = 0;
      let totalFinalCarbonPatio = 0;
      let totalFinalMaderaPatio = 0;
      let totalFinalBagazoPatio = 0;

      let totalCarbon = 0;
      let totalMadera = 0;
      let totalBagazo = 0;

      const carbonResults = {};

      const carbonIngresoMatches = {};

      carbons.forEach((carbon) => {
        const data = row.carbons?.[carbon.id] || {};
        const ingresoAutomatico = getIngresoAutomaticoByCarbon({
          row,
          carbon,
          carbons,
          ingresosIndex: ingresosCombustiblesIndex,
          proveedorAliases,
        });

        const dataForCalculation = ingresoAutomatico.hasIngreso
          ? {
              ...data,
              entrada: ingresoAutomatico.toneladas,
            }
          : data;

        const hasPreviousFinal = Object.prototype.hasOwnProperty.call(
          previousFinalByCarbon,
          carbon.id
        );

        const result = calculateDailyCarbon(
          dataForCalculation,
          carbon,
          hasPreviousFinal ? previousFinalByCarbon[carbon.id] : undefined
        );

        previousFinalByCarbon[carbon.id] = result.final;
        carbonResults[carbon.id] = result;
        carbonIngresoMatches[carbon.id] = ingresoAutomatico;

        const material = getMaterial(carbon);

        totalEntradas += result.entrada;
        totalConsumo += result.salida;
        totalFinalPatio += result.final;

        if (material === "Carbón") {
          totalEntradaCarbon += result.entrada;
          totalAjusteCarbon += result.ajuste;
          totalFinalCarbonPatio += result.final;
          totalCarbon += result.salida;
        }

        if (material === "Madera") {
          totalEntradaMadera += result.entrada;
          totalAjusteMadera += result.ajuste;
          totalFinalMaderaPatio += result.final;
          totalMadera += result.salida;
        }

        if (material === "Bagazo") {
          totalEntradaBagazo += result.entrada;
          totalAjusteBagazo += result.ajuste;
          totalFinalBagazoPatio += result.final;
          totalBagazo += result.salida;
        }
      });

      const totalMezcla = totalCarbon + totalMadera + totalBagazo;
      const totalTolvas =
        toSafeNumber(row.tolvaPrincipal) + toSafeNumber(row.tolvasAuxiliares);

      const carbonPercent =
        totalMezcla > 0 ? (totalCarbon / totalMezcla) * 100 : 0;

      const maderaPercent =
        totalMezcla > 0 ? (totalMadera / totalMezcla) * 100 : 0;

      const bagazoPercent =
        totalMezcla > 0 ? (totalBagazo / totalMezcla) * 100 : 0;

      const tolvaCarbon =
        totalMezcla > 0 ? totalTolvas * (totalCarbon / totalMezcla) : 0;

      const tolvaMadera =
        totalMezcla > 0 ? totalTolvas * (totalMadera / totalMezcla) : 0;

      const tolvaBagazo =
        totalMezcla > 0 ? totalTolvas * (totalBagazo / totalMezcla) : 0;

      const totalFinalCarbon = totalFinalCarbonPatio + tolvaCarbon;
      const totalFinalMadera = totalFinalMaderaPatio + tolvaMadera;
      const totalFinalBagazo = totalFinalBagazoPatio + tolvaBagazo;
      const totalFinal =
        totalFinalPatio + tolvaCarbon + tolvaMadera + tolvaBagazo;

      const mixPercentByItem = carbons.reduce((acc, carbon) => {
        const result = carbonResults[carbon.id];

        acc[carbon.id] =
          totalMezcla > 0
            ? (toSafeNumber(result?.salida) / totalMezcla) * 100
            : 0;

        return acc;
      }, {});

      consumoAcumulado += totalConsumo;

      return {
        ...row,
        originalIndex,
        carbonResults,
        carbonIngresoMatches,
        totalEntradas,
        totalEntradaCarbon,
        totalEntradaMadera,
        totalEntradaBagazo,
        totalAjusteCarbon,
        totalAjusteMadera,
        totalAjusteBagazo,
        totalConsumo,
        totalFinal,
        totalFinalPatio,
        totalFinalCarbon,
        totalFinalMadera,
        totalFinalBagazo,
        totalFinalCarbonPatio,
        totalFinalMaderaPatio,
        totalFinalBagazoPatio,
        totalCarbon,
        totalMadera,
        totalBagazo,
        totalMezcla,
        totalTolvas,
        carbonPercent,
        maderaPercent,
        bagazoPercent,
        tolvaCarbon,
        tolvaMadera,
        tolvaBagazo,
        mixPercentByItem,
        consumoAcumulado,
      };
    });
  }, [rowsForCalculation, carbons, ingresosCombustiblesIndex, proveedorAliases]);

  const calculatedRows = useMemo(() => {
    const desde = dateRange?.desde || "";
    const hasta = dateRange?.hasta || "";

    if (!desde && !hasta) return calculatedAllRows;

    return calculatedAllRows.filter((row) => {
      const fecha = String(row.fecha || "");

      if (!fecha) return false;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      return true;
    });
  }, [calculatedAllRows, dateRange]);

  const visibleDateSet = useMemo(
    () =>
      new Set(
        calculatedRows.map((row) => normalizeDateKey(row.fecha || row.id))
      ),
    [calculatedRows]
  );

  const handleAddManualRow = useCallback(async () => {
    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);

    if (!desde || !hasta) {
      await Swal.fire({
        icon: "warning",
        title: "Rango requerido",
        text: "Primero consulta un rango para poder agregar una fecha manual.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Agregar fecha",
      text: "Selecciona la fecha que deseas agregar al registro.",
      input: "date",
      inputValue: desde,
      inputAttributes: {
        min: desde,
        max: hasta,
      },
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      preConfirm: (value) => {
        const fecha = normalizeDateKey(value);

        if (!fecha) {
          Swal.showValidationMessage("Debes seleccionar una fecha.");
          return false;
        }

        if (!isDateInsideRange(fecha, desde, hasta)) {
          Swal.showValidationMessage(
            `La fecha debe estar entre ${desde} y ${hasta}.`
          );
          return false;
        }

        if (visibleDateSet.has(fecha)) {
          Swal.showValidationMessage("Esta fecha ya está visible en la tabla.");
          return false;
        }

        return fecha;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const fecha = normalizeDateKey(result.value);

    setManualRows((currentRows) => {
      if (
        currentRows.some(
          (row) => normalizeDateKey(row.fecha || row.id) === fecha
        )
      ) {
        return currentRows;
      }

      return [...currentRows, createBlankDailyRow(fecha, carbons)].sort(
        (a, b) =>
          normalizeDateKey(a.fecha || a.id).localeCompare(
            normalizeDateKey(b.fecha || b.id)
          )
      );
    });

    setHasUnsavedChanges(true);
    showActionSnack(`Fecha ${fecha} agregada manualmente.`, "success");
  }, [
    dateRange?.desde,
    dateRange?.hasta,
    visibleDateSet,
    carbons,
    showActionSnack,
  ]);

  const handlePasteFromExcel = useCallback(
    (event, startRowIndex, startColumnIndex) => {
      const clipboardText = event.clipboardData?.getData("text/plain") || "";

      if (!clipboardText.includes("\t") && !clipboardText.includes("\n")) {
        return;
      }

      const matrix = parseExcelClipboardText(clipboardText);

      if (matrix.length === 0) return;

      event.preventDefault();

      let updatedCells = 0;
      let protectedCells = 0;
      let outOfRangeCells = 0;

      matrix.forEach((clipboardRow, rowOffset) => {
        const targetRow = calculatedRows[startRowIndex + rowOffset];

        if (!targetRow) {
          outOfRangeCells += clipboardRow.length;
          return;
        }

        const columns = buildPasteColumnsForRow(targetRow);

        clipboardRow.forEach((cellValue, columnOffset) => {
          const targetColumn = columns[startColumnIndex + columnOffset];

          if (!targetColumn) {
            outOfRangeCells += 1;
            return;
          }

          if (!targetColumn.canPaste) {
            protectedCells += 1;
            return;
          }

          handleChangeCell(targetRow.id, targetColumn.path, cellValue);
          updatedCells += 1;
        });
      });

      if (updatedCells > 0) {
        showActionSnack(
          `Pegado desde Excel: ${updatedCells} celda(s) actualizada(s)${
            protectedCells ? `, ${protectedCells} protegida(s)` : ""
          }${outOfRangeCells ? `, ${outOfRangeCells} fuera de rango` : ""}.`,
          "success"
        );
        return;
      }

      showActionSnack(
        "No se pegaron datos. Las celdas destino son calculadas, automáticas o están fuera del rango visible.",
        "warning"
      );
    },
    [
      calculatedRows,
      buildPasteColumnsForRow,
      handleChangeCell,
      parseExcelClipboardText,
      showActionSnack,
    ]
  );

  const rowsToPersist = useMemo(() => {
    return calculatedRows
      .map((row) => ({
        fecha: normalizeDateKey(row.fecha),
        id: normalizeDateKey(row.fecha),
        tolvaPrincipal: row.tolvaPrincipal ?? "",
        tolvasAuxiliares: row.tolvasAuxiliares ?? "",
        observacion: row.observacion ?? "",

        // Cada material se guarda como una fila de Excel ya calculada:
        // datos base + resultado de las fórmulas del día.
        carbons: carbons.reduce((acc, carbon) => {
          const result = row.carbonResults?.[carbon.id] || {};

          acc[carbon.id] = {
            inicial: toSafeNumber(result.inicial),
            entrada: toSafeNumber(result.entrada),
            paladasCV: toSafeNumber(result.paladasCV),
            paladasCN: toSafeNumber(result.paladasCN),
            ajuste: toSafeNumber(result.ajuste),
            consumo: toSafeNumber(result.salida),
            final: toSafeNumber(result.final),
          };

          return acc;
        }, {}),

        // También se persisten las columnas calculadas del resumen del día.
        totales: {
          entradas: toSafeNumber(row.totalEntradas),
          entradaCarbon: toSafeNumber(row.totalEntradaCarbon),
          entradaMadera: toSafeNumber(row.totalEntradaMadera),
          entradaBagazo: toSafeNumber(row.totalEntradaBagazo),

          ajusteCarbon: toSafeNumber(row.totalAjusteCarbon),
          ajusteMadera: toSafeNumber(row.totalAjusteMadera),
          ajusteBagazo: toSafeNumber(row.totalAjusteBagazo),

          consumo: toSafeNumber(row.totalConsumo),
          consumoCarbon: toSafeNumber(row.totalCarbon),
          consumoMadera: toSafeNumber(row.totalMadera),
          consumoBagazo: toSafeNumber(row.totalBagazo),

          finalPatio: toSafeNumber(row.totalFinalPatio),
          finalCarbonPatio: toSafeNumber(row.totalFinalCarbonPatio),
          finalMaderaPatio: toSafeNumber(row.totalFinalMaderaPatio),
          finalBagazoPatio: toSafeNumber(row.totalFinalBagazoPatio),

          final: toSafeNumber(row.totalFinal),
          finalCarbon: toSafeNumber(row.totalFinalCarbon),
          finalMadera: toSafeNumber(row.totalFinalMadera),
          finalBagazo: toSafeNumber(row.totalFinalBagazo),

          tolvas: toSafeNumber(row.totalTolvas),
          tolvaCarbon: toSafeNumber(row.tolvaCarbon),
          tolvaMadera: toSafeNumber(row.tolvaMadera),
          tolvaBagazo: toSafeNumber(row.tolvaBagazo),

          porcentajeCarbon: toSafeNumber(row.carbonPercent),
          porcentajeMadera: toSafeNumber(row.maderaPercent),
          porcentajeBagazo: toSafeNumber(row.bagazoPercent),

          consumoAcumulado: toSafeNumber(row.consumoAcumulado),
          mixPercentByItem: row.mixPercentByItem || {},
        },
      }))
      .filter(hasUsefulMonthlyRowData);
  }, [calculatedRows, carbons]);

  const pendingAutomaticIncomeCount = useMemo(() => {
    return calculatedRows.reduce((acc, row) => {
      return (
        acc +
        carbons.filter((carbon) => {
          const ingreso = row.carbonIngresoMatches?.[carbon.id];
          if (!ingreso?.hasIngreso) return false;

          const rawEntrada = toSafeNumber(row.carbons?.[carbon.id]?.entrada);
          const calculatedEntrada = toSafeNumber(
            row.carbonResults?.[carbon.id]?.entrada
          );

          return Math.abs(rawEntrada - calculatedEntrada) > 0.005;
        }).length
      );
    }, 0);
  }, [calculatedRows, carbons]);

  const validatePersistedExcelRows = useCallback(
    (savedRows = []) => {
      const tolerance = 0.01;
      const savedByDate = savedRows.reduce((acc, row) => {
        const fecha = normalizeDateKey(row.fecha || row.id);
        if (fecha) acc[fecha] = row;
        return acc;
      }, {});

      const calculatedByDate = calculatedRows.reduce((acc, row) => {
        const fecha = normalizeDateKey(row.fecha || row.id);
        if (fecha) acc[fecha] = row;
        return acc;
      }, {});

      const requiredCarbonFields = [
        "inicial",
        "entrada",
        "paladasCV",
        "paladasCN",
        "ajuste",
        "consumo",
        "final",
      ];

      const requiredTotalFields = [
        "entradas",
        "entradaCarbon",
        "entradaMadera",
        "entradaBagazo",
        "ajusteCarbon",
        "ajusteMadera",
        "ajusteBagazo",
        "consumo",
        "consumoCarbon",
        "consumoMadera",
        "consumoBagazo",
        "finalPatio",
        "finalCarbonPatio",
        "finalMaderaPatio",
        "finalBagazoPatio",
        "final",
        "finalCarbon",
        "finalMadera",
        "finalBagazo",
        "tolvas",
        "tolvaCarbon",
        "tolvaMadera",
        "tolvaBagazo",
        "porcentajeCarbon",
        "porcentajeMadera",
        "porcentajeBagazo",
        "consumoAcumulado",
      ];

      const differences = [];

      rowsToPersist.forEach((expectedRow) => {
        const fecha = expectedRow.fecha;
        const savedRow = savedByDate[fecha];
        const calculatedRow = calculatedByDate[fecha];

        if (!savedRow) {
          differences.push({
            fecha,
            campo: "fila",
            detalle: "La fecha no fue devuelta por MongoDB después de guardar.",
          });
          return;
        }

        carbons.forEach((carbon) => {
          const savedCarbon = savedRow.carbons?.[carbon.id];

          if (!savedCarbon) {
            differences.push({
              fecha,
              material: carbon.name,
              campo: "material",
              detalle: "No se persistió el bloque del material.",
            });
            return;
          }

          requiredCarbonFields.forEach((field) => {
            const value = savedCarbon[field];

            if (
              value === null ||
              value === undefined ||
              value === "" ||
              !Number.isFinite(Number(value))
            ) {
              differences.push({
                fecha,
                material: carbon.name,
                campo: field,
                detalle: "La celda calculada no quedó persistida como número.",
              });
            }
          });

          const inicial = toSafeNumber(savedCarbon.inicial);
          const entrada = toSafeNumber(savedCarbon.entrada);
          const ajuste = toSafeNumber(savedCarbon.ajuste);
          const consumo = toSafeNumber(savedCarbon.consumo);
          const final = toSafeNumber(savedCarbon.final);
          const expectedFinal = inicial + entrada + ajuste - consumo;

          if (Math.abs(final - expectedFinal) > tolerance) {
            differences.push({
              fecha,
              material: carbon.name,
              campo: "final",
              esperado: expectedFinal,
              guardado: final,
              detalle: "El final persistido no cumple la fórmula.",
            });
          }

          const ingresoAutomatico =
            calculatedRow?.carbonIngresoMatches?.[carbon.id];

          if (ingresoAutomatico?.hasIngreso) {
            const expectedEntrada = toSafeNumber(
              calculatedRow?.carbonResults?.[carbon.id]?.entrada
            );

            if (Math.abs(entrada - expectedEntrada) > tolerance) {
              differences.push({
                fecha,
                material: carbon.name,
                campo: "entrada",
                esperado: expectedEntrada,
                guardado: entrada,
                detalle: "El ingreso automático no quedó actualizado.",
              });
            }
          }
        });

        requiredTotalFields.forEach((field) => {
          const value = savedRow.totales?.[field];

          if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(Number(value))
          ) {
            differences.push({
              fecha,
              campo: `totales.${field}`,
              detalle: "La columna de resumen no quedó persistida.",
            });
          }
        });
      });

      return differences;
    },
    [rowsToPersist, calculatedRows, carbons]
  );

  const handleSaveRows = useCallback(async () => {
    const desde = normalizeDateKey(dateRange?.desde);
    const hasta = normalizeDateKey(dateRange?.hasta);

    if (!desde || !hasta) {
      await Swal.fire({
        icon: "warning",
        title: "Rango requerido",
        text: "Debes consultar un rango válido antes de guardar.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (rowsToPersist.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin filas para guardar",
        text: "No hay fechas con ingresos, consumos o datos manuales dentro del rango consultado.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "¿Guardar tabla y recalcular?",
      html: `Se persistirán <b>${rowsToPersist.length}</b> fila(s), incluyendo inicial, entradas, paladas, ajustes, consumo, final y columnas de resumen.<br/><br/>El backend recalculará cronológicamente desde la primera fecha afectada hasta el último registro existente.<br/><br/>Cruces automáticos detectados: <b>${pendingAutomaticIncomeCount}</b>.`,
      showCancelButton: true,
      confirmButtonText: "Sí, guardar todo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      Swal.fire({
        title: "Guardando como hoja de cálculo",
        text: "Recalculando y persistiendo todas las celdas en MongoDB...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        rango: { desde, hasta },
        rows: rowsToPersist,
        visibleRows: rowsToPersist,
        replaceRange: false,
        ingresosCombustiblesAplicados: {
          registros: ingresosCombustiblesRows.length,
          viajes: ingresosCombustiblesIndex.totalViajes,
          toneladas: ingresosCombustiblesIndex.totalToneladas,
        },
      };

      const savedData = onSave
        ? await onSave(payload)
        : await requestJson(`${consumosApiBaseUrl}/rango`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });

      const query = new URLSearchParams({ desde, hasta }).toString();
      const verifiedData = await requestJson(
        `${consumosApiBaseUrl}/rango?${query}`
      );

      const persistedRows = verifiedData.registros || savedData?.registros || [];
      const differences = validatePersistedExcelRows(persistedRows);

      if (differences.length > 0) {
        Swal.close();
        await Swal.fire({
          icon: "warning",
          title: "Guardado con diferencias",
          html: `MongoDB respondió, pero se detectaron <b>${differences.length}</b> diferencia(s) en las celdas persistidas.<br/><br/>Revisa la consola para ver fecha, material y campo.`,
          confirmButtonText: "Entendido",
        });
        console.table(differences);
        return;
      }

      clearConsumosCombustiblesCache();
      setServerRows(persistedRows);
      setManualRows([]);
      setHasUnsavedChanges(false);
      onAfterSave?.(persistedRows);

      const recalculationText = savedData?.recalculados
        ? ` Se recalcularon ${savedData.recalculados} fecha(s) desde ${savedData.recalcularDesde} hasta ${savedData.recalcularHasta}.`
        : "";

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Tabla persistida correctamente",
        text: `Los datos base y calculados quedaron guardados con sus valores nuevos.${recalculationText}`,
        timer: 2600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error guardando consumos combustibles:", error);
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text:
          error.message ||
          "Ocurrió un error guardando y recalculando los consumos de combustibles.",
        confirmButtonText: "Entendido",
      });
    } finally {
      setSaving(false);
    }
  }, [
    dateRange?.desde,
    dateRange?.hasta,
    pendingAutomaticIncomeCount,
    rowsToPersist,
    ingresosCombustiblesRows.length,
    ingresosCombustiblesIndex.totalViajes,
    ingresosCombustiblesIndex.totalToneladas,
    onSave,
    consumosApiBaseUrl,
    validatePersistedExcelRows,
    onAfterSave,
  ]);

  const footerCarbonTotals = useMemo(() => {
    return carbons.reduce((acc, carbon) => {
      const carbonTotals = calculatedRows.reduce(
        (carbonAcc, row) => {
          const result =
            row.carbonResults?.[carbon.id] ||
            calculateDailyCarbon(row.carbons?.[carbon.id], carbon);

          carbonAcc.inicial = result.inicial;
          carbonAcc.entrada += result.entrada;
          carbonAcc.paladasCV += result.paladasCV;
          carbonAcc.paladasCN += result.paladasCN;
          carbonAcc.ajuste += result.ajuste;
          carbonAcc.salida += result.salida;
          carbonAcc.final = result.final;

          return carbonAcc;
        },
        {
          inicial: 0,
          entrada: 0,
          paladasCV: 0,
          paladasCN: 0,
          ajuste: 0,
          salida: 0,
          final: 0,
        }
      );

      acc[carbon.id] = carbonTotals;

      return acc;
    }, {});
  }, [calculatedRows, carbons]);

  const footerMixTotals = useMemo(() => {
    const totalCarbon = carbonItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.salida),
      0
    );

    const totalMadera = woodItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.salida),
      0
    );

    const totalBagazo = bagazoItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.salida),
      0
    );

    const entradasCarbon = carbonItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.entrada),
      0
    );

    const entradasMadera = woodItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.entrada),
      0
    );

    const entradasBagazo = bagazoItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.entrada),
      0
    );

    const ajusteCarbon = carbonItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.ajuste),
      0
    );

    const ajusteMadera = woodItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.ajuste),
      0
    );

    const ajusteBagazo = bagazoItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.ajuste),
      0
    );

    const finalCarbonPatio = carbonItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.final),
      0
    );

    const finalMaderaPatio = woodItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.final),
      0
    );

    const finalBagazoPatio = bagazoItems.reduce(
      (sum, item) => sum + toSafeNumber(footerCarbonTotals[item.id]?.final),
      0
    );

    const totalMezcla = totalCarbon + totalMadera + totalBagazo;
    const lastVisibleRow = calculatedRows[calculatedRows.length - 1];

    const finalCarbon =
      lastVisibleRow?.totalFinalCarbon !== undefined
        ? toSafeNumber(lastVisibleRow.totalFinalCarbon)
        : finalCarbonPatio;

    const finalMadera =
      lastVisibleRow?.totalFinalMadera !== undefined
        ? toSafeNumber(lastVisibleRow.totalFinalMadera)
        : finalMaderaPatio;

    const finalBagazo =
      lastVisibleRow?.totalFinalBagazo !== undefined
        ? toSafeNumber(lastVisibleRow.totalFinalBagazo)
        : finalBagazoPatio;

    const percentByItem = carbons.reduce((acc, item) => {
      acc[item.id] =
        totalMezcla > 0
          ? (toSafeNumber(footerCarbonTotals[item.id]?.salida) / totalMezcla) *
          100
          : 0;
      return acc;
    }, {});

    return {
      totalCarbon,
      totalMadera,
      totalBagazo,
      entradasCarbon,
      entradasMadera,
      entradasBagazo,
      ajusteCarbon,
      ajusteMadera,
      ajusteBagazo,
      finalCarbon,
      finalMadera,
      finalBagazo,
      finalCarbonPatio,
      finalMaderaPatio,
      finalBagazoPatio,
      totalTolvas: toSafeNumber(lastVisibleRow?.totalTolvas),
      tolvaCarbon: toSafeNumber(lastVisibleRow?.tolvaCarbon),
      tolvaMadera: toSafeNumber(lastVisibleRow?.tolvaMadera),
      tolvaBagazo: toSafeNumber(lastVisibleRow?.tolvaBagazo),
      totalMezcla,
      percentByItem,
      maderaPercent: totalMezcla > 0 ? (totalMadera / totalMezcla) * 100 : 0,
      bagazoPercent: totalMezcla > 0 ? (totalBagazo / totalMezcla) * 100 : 0,
    };
  }, [
    calculatedRows,
    footerCarbonTotals,
    carbons,
    carbonItems,
    woodItems,
    bagazoItems,
  ]);

  /*
   * Comparte con el componente padre exactamente los valores mostrados
   * en la fila inferior de resumen. De esta manera el módulo de inventario
   * no vuelve a calcular con filas incompletas ni pierde los datos cargados
   * internamente desde la API.
   */
  useEffect(() => {
    if (typeof onInventorySummaryChange !== "function") return;

    const byItem = carbons.reduce((acc, item) => {
      const itemTotals = footerCarbonTotals[item.id] || {};

      acc[item.id] = {
        id: item.id,
        material: getMaterial(item),
        proveedor:
          item.name || item.codigo || item.id || getMaterial(item) || "Sin nombre",
        inicial: toSafeNumber(itemTotals.inicial),
        entradas: toSafeNumber(itemTotals.entrada),
        paladasCV: toSafeNumber(itemTotals.paladasCV),
        paladasCN: toSafeNumber(itemTotals.paladasCN),
        ajustes: toSafeNumber(itemTotals.ajuste),
        salidas: toSafeNumber(itemTotals.salida),
        final: toSafeNumber(itemTotals.final),
      };

      return acc;
    }, {});

    const lastRow = calculatedRows[calculatedRows.length - 1];

    onInventorySummaryChange({
      byItem,
      stockByMaterial: {
        Carbón: toSafeNumber(footerMixTotals.finalCarbon),
        Madera: toSafeNumber(footerMixTotals.finalMadera),
        Bagazo: toSafeNumber(footerMixTotals.finalBagazo),
      },
      stockPatioByMaterial: {
        Carbón: toSafeNumber(footerMixTotals.finalCarbonPatio),
        Madera: toSafeNumber(footerMixTotals.finalMaderaPatio),
        Bagazo: toSafeNumber(footerMixTotals.finalBagazoPatio),
      },
      tolvasByMaterial: {
        Carbón: toSafeNumber(footerMixTotals.tolvaCarbon),
        Madera: toSafeNumber(footerMixTotals.tolvaMadera),
        Bagazo: toSafeNumber(footerMixTotals.tolvaBagazo),
      },
      rowsCount: calculatedRows.length,
      fechaUltimoRegistro: normalizeDateKey(lastRow?.fecha || lastRow?.id),
    });
  }, [
    onInventorySummaryChange,
    carbons,
    calculatedRows,
    footerCarbonTotals,
    footerMixTotals,
  ]);

  const closeCopySnack = useCallback((event, reason) => {
    if (reason === "clickaway") return;

    setCopySnack((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const showCopySnack = useCallback((message, severity = "success") => {
    setCopySnack({
      open: true,
      message,
      severity,
    });
  }, []);

  const copyTextToClipboard = useCallback(async (text) => {
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
  }, []);

  const copyTable = useCallback(async () => {
    const headers = [
      "Fecha",
      "Tolva principal",
      "Tolvas auxiliares",
      ...carbons.flatMap((carbon) => [
        `${carbon.name} Inicial`,
        `${carbon.name} Entrada`,
        `${carbon.name} Pal. CV`,
        `${carbon.name} Pal. CN`,
        `${carbon.name} Ajuste`,
        `${carbon.name} Consumo`,
        `${carbon.name} Final`,
      ]),
      ...carbonItems.map((carbon) => `% ${carbon.name}`),
      "% Madera",
      ...(showBagazo ? ["% Bagazo"] : []),
      "Total consumo carbón",
      "Total consumo madera",
      ...(showBagazo ? ["Total consumo bagazo"] : []),
      "Entrada carbón",
      "Entrada madera",
      ...(showBagazo ? ["Entrada bagazo"] : []),
      "Ajuste total carbón",
      "Ajuste total madera",
      ...(showBagazo ? ["Ajuste total bagazo"] : []),
      "Inv. final carbón",
      "Inv. final madera",
      ...(showBagazo ? ["Inv. final bagazo"] : []),
      "Cons. acum.",
      "Observación",
    ];

    const body = calculatedRows.map((row) => [
      row.fecha,
      row.tolvaPrincipal ?? "",
      row.tolvasAuxiliares ?? "",
      ...carbons.flatMap((carbon) => {
        const result =
          row.carbonResults?.[carbon.id] ||
          calculateDailyCarbon(row.carbons?.[carbon.id], carbon);

        return [
          result.inicial,
          result.entrada,
          result.paladasCV,
          result.paladasCN,
          result.ajuste,
          result.salida,
          result.final,
        ];
      }),
      ...carbonItems.map((carbon) => row.mixPercentByItem?.[carbon.id] || 0),
      row.maderaPercent || 0,
      ...(showBagazo ? [row.bagazoPercent || 0] : []),
      row.totalCarbon || 0,
      row.totalMadera || 0,
      ...(showBagazo ? [row.totalBagazo || 0] : []),
      row.totalEntradaCarbon || 0,
      row.totalEntradaMadera || 0,
      ...(showBagazo ? [row.totalEntradaBagazo || 0] : []),
      row.totalAjusteCarbon || 0,
      row.totalAjusteMadera || 0,
      ...(showBagazo ? [row.totalAjusteBagazo || 0] : []),
      row.totalFinalCarbon || 0,
      row.totalFinalMadera || 0,
      ...(showBagazo ? [row.totalFinalBagazo || 0] : []),
      row.consumoAcumulado || 0,
      row.observacion ?? "",
    ]);

    const footer = [
      "Totales del rango",
      "",
      "",
      ...carbons.flatMap((carbon) => {
        const carbonTotals = footerCarbonTotals[carbon.id] || {
          inicial: 0,
          entrada: 0,
          paladasCV: 0,
          paladasCN: 0,
          ajuste: 0,
          salida: 0,
          final: 0,
        };

        return [
          carbonTotals.inicial,
          carbonTotals.entrada,
          carbonTotals.paladasCV,
          carbonTotals.paladasCN,
          carbonTotals.ajuste,
          carbonTotals.salida,
          carbonTotals.final,
        ];
      }),
      ...carbonItems.map(
        (carbon) => footerMixTotals.percentByItem?.[carbon.id] || 0
      ),
      footerMixTotals.maderaPercent || 0,
      ...(showBagazo ? [footerMixTotals.bagazoPercent || 0] : []),
      footerMixTotals.totalCarbon || 0,
      footerMixTotals.totalMadera || 0,
      ...(showBagazo ? [footerMixTotals.totalBagazo || 0] : []),
      footerMixTotals.entradasCarbon || 0,
      footerMixTotals.entradasMadera || 0,
      ...(showBagazo ? [footerMixTotals.entradasBagazo || 0] : []),
      footerMixTotals.ajusteCarbon || 0,
      footerMixTotals.ajusteMadera || 0,
      ...(showBagazo ? [footerMixTotals.ajusteBagazo || 0] : []),
      footerMixTotals.finalCarbon || 0,
      footerMixTotals.finalMadera || 0,
      ...(showBagazo ? [footerMixTotals.finalBagazo || 0] : []),
      footerMixTotals.totalMezcla || 0,
      "",
    ];

    const text = [headers, ...body, footer]
      .map((line) => line.map((value) => value ?? "").join("\t"))
      .join("\n");

    await copyTextToClipboard(text);
  }, [
    calculatedRows,
    carbons,
    carbonItems,
    showBagazo,
    footerCarbonTotals,
    footerMixTotals,
    totals.salidas,
    copyTextToClipboard,
  ]);

  const handleRightClickCopyTable = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        await copyTable();
        showCopySnack("Tabla copiada al portapapeles", "success");
      } catch (error) {
        console.error("No se pudo copiar la tabla:", error);
        showCopySnack("No se pudo copiar la tabla", "error");
      }
    },
    [copyTable, showCopySnack]
  );

  const entradasCarbonTotal = Number(
    footerMixTotals.entradasCarbon ?? totals.entradasCarbon ?? 0
  );

  const entradasMaderaTotal = Number(
    footerMixTotals.entradasMadera ?? totals.entradasMadera ?? 0
  );

  const entradasBagazoTotal = Number(
    footerMixTotals.entradasBagazo ?? totals.entradasBagazo ?? 0
  );

  const ajusteCarbonTotal = Number(
    footerMixTotals.ajusteCarbon ?? totals.ajusteCarbon ?? 0
  );

  const ajusteMaderaTotal = Number(
    footerMixTotals.ajusteMadera ?? totals.ajusteMadera ?? 0
  );

  const ajusteBagazoTotal = Number(
    footerMixTotals.ajusteBagazo ?? totals.ajusteBagazo ?? 0
  );

  const inventarioFinalCarbonTotal = Number(
    footerMixTotals.finalCarbon ?? totals.inventarioFinalCarbon ?? 0
  );

  const inventarioFinalMaderaTotal = Number(
    footerMixTotals.finalMadera ?? totals.inventarioFinalMadera ?? 0
  );

  const inventarioFinalBagazoTotal = Number(
    footerMixTotals.finalBagazo ?? totals.inventarioFinalBagazo ?? 0
  );

  const summaryPercentageColumns =
    carbonItems.length + 1 + (showBagazo ? 1 : 0);

  const materialSummaryColumns = 2 + (showBagazo ? 1 : 0);
  const ajusteSummaryColumns = 2 + (showBagazo ? 1 : 0);
  const inventarioSummaryColumns = 2 + (showBagazo ? 1 : 0);
  const summaryTotalColumns =
    materialSummaryColumns * 2 +
    ajusteSummaryColumns +
    inventarioSummaryColumns +
    2;

  const summaryColSpan = summaryPercentageColumns + summaryTotalColumns;

  const editableCellSx = {
    p: 0.35,
    bgcolor: "#ffffff",
    borderColor: "#e2e8f0",
    minWidth: 96,
    "&:focus-within": {
      bgcolor: "#eef6ff",
      boxShadow: "inset 0 0 0 2px #2563eb",
    },
  };

  const textCellSx = {
    ...editableCellSx,
    minWidth: 150,
  };

  const calculatedCellSx = {
    bgcolor: "#f8fafc",
    fontWeight: 900,
    borderColor: "#e2e8f0",
    minWidth: 105,
    color: "#0f172a",
  };

  const chainedInitialCellSx = {
    ...calculatedCellSx,
    bgcolor: "#eef2ff",
    color: "#3730a3",
  };

  const percentCellSx = {
    bgcolor: "#f8fafc",
    fontWeight: 950,
    borderColor: "#e2e8f0",
    minWidth: 105,
    color: "#1e3a8a",
  };

  const carbonTotalCellSx = {
    bgcolor: "#eff6ff",
    fontWeight: 950,
    borderColor: "#bfdbfe",
    minWidth: 115,
    color: "#1e3a8a",
  };

  const maderaTotalCellSx = {
    bgcolor: "#ecfdf5",
    fontWeight: 950,
    borderColor: "#bbf7d0",
    minWidth: 115,
    color: "#14532d",
  };

  const bagazoTotalCellSx = {
    bgcolor: "#fff7ed",
    fontWeight: 950,
    borderColor: "#fed7aa",
    minWidth: 115,
    color: "#9a3412",
  };

  const entradaCarbonCellSx = {
    ...carbonTotalCellSx,
    bgcolor: "#dbeafe",
  };

  const entradaMaderaCellSx = {
    ...maderaTotalCellSx,
    bgcolor: "#dcfce7",
  };

  const entradaBagazoCellSx = {
    ...bagazoTotalCellSx,
    bgcolor: "#fed7aa",
  };

  const entradaAutomaticaCellSx = {
    ...editableCellSx,
    bgcolor: "#f0fdf4",
    borderColor: "#86efac",
    "&:focus-within": {
      bgcolor: "#dcfce7",
      boxShadow: "inset 0 0 0 2px #16a34a",
    },
  };

  const paladasCVCellSx = {
    ...editableCellSx,
  };

  const paladasCNCellSx = {
    ...editableCellSx,
  };

  const paladasCVHeaderCellSx = {
    bgcolor: "#f8fafc",
    color: "#334155",
    fontWeight: 900,
  };

  const paladasCNHeaderCellSx = {
    bgcolor: "#f8fafc",
    color: "#334155",
    fontWeight: 900,
  };


  const ajusteCarbonCellSx = {
    bgcolor: "#eff6ff",
    fontWeight: 950,
    borderColor: "#bfdbfe",
    minWidth: 130,
    color: "#1e3a8a",
  };

  const ajusteMaderaCellSx = {
    bgcolor: "#ecfdf5",
    fontWeight: 950,
    borderColor: "#bbf7d0",
    minWidth: 130,
    color: "#14532d",
  };

  const ajusteBagazoCellSx = {
    bgcolor: "#fff7ed",
    fontWeight: 950,
    borderColor: "#fed7aa",
    minWidth: 130,
    color: "#9a3412",
  };

  const inventarioCarbonCellSx = {
    bgcolor: "#eff6ff",
    fontWeight: 950,
    borderColor: "#bfdbfe",
    minWidth: 135,
    color: "#1e3a8a",
  };

  const inventarioMaderaCellSx = {
    bgcolor: "#ecfdf5",
    fontWeight: 950,
    borderColor: "#bbf7d0",
    minWidth: 135,
    color: "#14532d",
  };

  const inventarioBagazoCellSx = {
    bgcolor: "#fff7ed",
    fontWeight: 950,
    borderColor: "#fed7aa",
    minWidth: 135,
    color: "#9a3412",
  };

  const totalCellSx = {
    bgcolor: "#fff7ed",
    fontWeight: 900,
    borderColor: "#fed7aa",
    minWidth: 115,
    color: "#7c2d12",
  };

  const footerCellSx = {
    fontWeight: 900,
    bgcolor: "#f1f5f9",
    borderColor: "#cbd5e1",
    position: "sticky",
    bottom: 0,
    zIndex: 4,
  };

  const paladasCVFooterCellSx = {
    ...footerCellSx,
  };

  const paladasCNFooterCellSx = {
    ...footerCellSx,
  };

  const isSeparatedMaterialGroup = (item) => isCarbon(item) || isWood(item);

  const materialGroupBorderSx = (item, position = "middle") => {
    if (!isSeparatedMaterialGroup(item)) return {};

    return {
      ...(position === "start" || position === "both"
        ? { borderLeft: "2px solid #000 !important" }
        : {}),
      ...(position === "end" || position === "both"
        ? { borderRight: "1px solid #000 !important" }
        : {}),
    };
  };

  const withMaterialGroupBorder = (item, baseSx = {}, position = "middle") => ({
    ...baseSx,
    ...materialGroupBorderSx(item, position),
  });

  return (
    <Stack gap={0.5}>
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
            <Typography variant="h6" fontWeight={900} color="#0f172a">
              Registro de mezcla y consumo por fecha
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1}
            alignItems={{ sm: "center" }}
            flexWrap="wrap"
          >
            <Chip
              label={
                dateRange?.desde && dateRange?.hasta
                  ? `Rango consultado: ${dateRange.desde} a ${dateRange.hasta}`
                  : "Rango consultado sin aplicar"
              }
              sx={{
                height: 38,
                borderRadius: 999,
                fontWeight: 900,
                bgcolor: "#eff6ff",
                color: "#1e3a8a",
                border: "1px solid #bfdbfe",
                "& .MuiChip-label": {
                  px: 1.4,
                  fontSize: 12.5,
                  fontWeight: 900,
                },
              }}
            />

            <Button
              startIcon={<Visibility />}
              variant="outlined"
              onClick={openSummaryModal}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
                borderColor: "#bfdbfe",
                color: "#1e3a8a",
                bgcolor: "#eff6ff",
                "&:hover": {
                  borderColor: "#60a5fa",
                  bgcolor: "#dbeafe",
                },
              }}
            >
              Ver resumen
            </Button>

            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={handleAddManualRow}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
                borderColor: "#86efac",
                color: "#166534",
                bgcolor: "#f0fdf4",
                "&:hover": {
                  borderColor: "#22c55e",
                  bgcolor: "#dcfce7",
                },
              }}
            >
              Agregar fecha
            </Button>

            <Button
              startIcon={saving ? <CircularProgress size={17} /> : <Save />}
              variant="contained"
              onClick={handleSaveRows}
              disabled={saving || loadingConsumos}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "#059669",
                "&:hover": {
                  bgcolor: "#047857",
                },
                "&.Mui-disabled": {
                  bgcolor: "#a7f3d0",
                  color: "#ffffff",
                },
              }}
            >
              {saving ? "Guardando..." : loadingConsumos ? "Cargando..." : "Guardar"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" gap={1} flexWrap="wrap">
        {/* <Chip
          icon={<Inventory2 />}
          label={`Entrada carbón: ${formatTon(entradasCarbonTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#dbeafe", color: "#1e3a8a" }}
        />

        <Chip
          icon={<Inventory2 />}
          label={`Entrada madera: ${formatTon(entradasMaderaTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#dcfce7", color: "#14532d" }}
        />

        {showBagazo && (
          <Chip
            icon={<Inventory2 />}
            label={`Entrada bagazo: ${formatTon(entradasBagazoTotal)} t`}
            sx={{ fontWeight: 900, bgcolor: "#fed7aa", color: "#9a3412" }}
          />
        )}

        <Chip
          icon={<Inventory2 />}
          label={`Ajuste carbón: ${formatTon(ajusteCarbonTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#1e3a8a" }}
        />

        <Chip
          icon={<Inventory2 />}
          label={`Ajuste madera: ${formatTon(ajusteMaderaTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#ecfdf5", color: "#14532d" }}
        />

        {showBagazo && (
          <Chip
            icon={<Inventory2 />}
            label={`Ajuste bagazo: ${formatTon(ajusteBagazoTotal)} t`}
            sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#9a3412" }}
          />
        )}

        <Chip
          icon={<Inventory2 />}
          label={`Inv. final carbón: ${formatTon(inventarioFinalCarbonTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#1e3a8a" }}
        />

        <Chip
          icon={<Inventory2 />}
          label={`Inv. final madera: ${formatTon(inventarioFinalMaderaTotal)} t`}
          sx={{ fontWeight: 900, bgcolor: "#ecfdf5", color: "#14532d" }}
        />

        {showBagazo && (
          <Chip
            icon={<Inventory2 />}
            label={`Inv. final bagazo: ${formatTon(inventarioFinalBagazoTotal)} t`}
            sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#9a3412" }}
          />
        )}

        <Chip
          icon={<Inventory2 />}
          label={`Total Consumo carbón: ${formatTon(footerMixTotals.totalCarbon)} t`}
          sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#1e3a8a" }}
        />

        <Chip
          icon={<Inventory2 />}
          label={`Total Consumo madera: ${formatTon(footerMixTotals.totalMadera)} t`}
          sx={{ fontWeight: 900, bgcolor: "#ecfdf5", color: "#14532d" }}
        />

        {Number(footerMixTotals.totalBagazo || 0) > 0 && (
          <Chip
            icon={<Inventory2 />}
            label={`Total Consumo bagazo: ${formatTon(footerMixTotals.totalBagazo)} t`}
            sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#9a3412" }}
          />
        )} */}

        {/* <Chip
          icon={<LocalFireDepartment />}
          label={`Consumo total: ${formatTon(footerMixTotals.totalMezcla)} t`}
          sx={{ fontWeight: 800, bgcolor: "#fff7ed" }}
        /> */}
      </Stack>

      <TableContainer
        component={Paper}
        variant="outlined"
        onContextMenu={handleRightClickCopyTable}
        sx={{
          borderRadius: 4,
          maxHeight: 650,
          borderColor: "#cbd5e1",
          overflow: "auto",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",

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
            borderRight: "1px solid #e2e8f0",
          },

          "& td": {
            fontSize: 12,
            borderColor: "#e2e8f0",
            whiteSpace: "nowrap",
            borderRight: "1px solid #e2e8f0",
          },

          "& th:last-of-type, & td:last-of-type": {
            borderRight: 0,
          },

          "& .group-header th": {
            position: "sticky",
            top: 0,
            zIndex: 5,
            height: 38,
          },

          "& .sub-header th": {
            position: "sticky",
            top: 38,
            zIndex: 5,
            bgcolor: "#f8fafc",
            height: 38,
          },

          "& tbody tr:hover td": {
            bgcolor: "#f8fbff",
          },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow className="group-header">
              <TableCell
                rowSpan={2}
                sx={{
                  left: 0,
                  zIndex: 8,
                  position: "sticky",
                  bgcolor: "#0f172a",
                  color: "white",
                  minWidth: 125,
                  borderRight: "2px solid #94a3b8",
                }}
              >
                Fecha
              </TableCell>

              <TableCell
                colSpan={2}
                align="center"
                sx={{
                  bgcolor: "#1e40af",
                  color: "white",
                }}
              >
                Tolvas
              </TableCell>

              {carbons.map((carbon, index) => (
                <TableCell
                  key={carbon.id}
                  colSpan={7}
                  align="center"
                  sx={{
                    bgcolor: getMaterialColor(carbon, index),
                    color: "white",
                    ...materialGroupBorderSx(carbon, "both"),
                  }}
                >
                  {carbon.name} · {getMaterial(carbon)}
                </TableCell>
              ))}

              <TableCell
                colSpan={summaryColSpan}
                align="center"
                sx={{
                  bgcolor: "#9a3412",
                  color: "white",
                }}
              >
                Resumen del día / mezcla
              </TableCell>
            </TableRow>

            <TableRow className="sub-header">
              <TableCell sx={{ minWidth: 150 }}>Principal</TableCell>
              <TableCell sx={{ minWidth: 160 }}>Auxiliares</TableCell>

              {carbons.map((carbon) => (
                <React.Fragment key={`${carbon.id}-headers`}>
                  <TableCell
                    align="right"
                    sx={materialGroupBorderSx(carbon, "start")}
                  >
                    Inicial
                  </TableCell>
                  <TableCell align="right">Entrada</TableCell>
                  <TableCell align="right" sx={paladasCVHeaderCellSx}>
                    Pal. CV
                  </TableCell>
                  <TableCell align="right" sx={paladasCNHeaderCellSx}>
                    Pal. CN
                  </TableCell>
                  <TableCell align="right">Ajuste</TableCell>
                  <TableCell align="right">Consumo</TableCell>
                  <TableCell
                    align="right"
                    sx={materialGroupBorderSx(carbon, "end")}
                  >
                    Final
                  </TableCell>
                </React.Fragment>
              ))}

              {carbonItems.map((carbon) => (
                <TableCell key={`${carbon.id}-pct`} align="right">
                  % {carbon.name}
                </TableCell>
              ))}

              <TableCell align="right">% Madera</TableCell>

              {showBagazo && <TableCell align="right">% Bagazo</TableCell>}

              <TableCell align="right">Total Consumo carbón</TableCell>
              <TableCell align="right">Total Consumo madera</TableCell>

              {showBagazo && (
                <TableCell align="right">Total Consumo bagazo</TableCell>
              )}

              <TableCell align="right">Entrada carbón</TableCell>
              <TableCell align="right">Entrada madera</TableCell>

              {showBagazo && (
                <TableCell align="right">Entrada bagazo</TableCell>
              )}

              <TableCell align="right">Ajuste total carbón</TableCell>
              <TableCell align="right">Ajuste total madera</TableCell>

              {showBagazo && (
                <TableCell align="right">Ajuste total bagazo</TableCell>
              )}

              <TableCell align="right">Inv. final carbón</TableCell>
              <TableCell align="right">Inv. final madera</TableCell>

              {showBagazo && (
                <TableCell align="right">Inv. final bagazo</TableCell>
              )}

              <TableCell align="right">Cons. acum.</TableCell>
              <TableCell>Observación</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {calculatedRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3 + carbons.length * 7 + summaryColSpan}
                  align="center"
                  sx={{
                    py: 4,
                    fontWeight: 800,
                    color: "text.secondary",
                    bgcolor: "#f8fafc",
                  }}
                >
                  No hay registros para el rango seleccionado.
                </TableCell>
              </TableRow>
            )}

            {calculatedRows.map((row, rowIndex) => (
              <TableRow key={row.id} hover>
                <TableCell
                  sx={{
                    bgcolor: "#f1f5f9",
                    fontWeight: 900,
                    left: 0,
                    position: "sticky",
                    zIndex: 3,
                    minWidth: 125,
                    borderRight: "2px solid #cbd5e1",
                  }}
                >
                  {formatFullDate(row.fecha)}
                </TableCell>

                <TableCell sx={textCellSx}>
                  <ExcelInput
                    value={row.tolvaPrincipal}
                    align="left"
                    placeholder="Principal"
                    onChange={(value) =>
                      handleChangeCell(row.id, ["tolvaPrincipal"], value)
                    }
                    onPaste={(event) =>
                      handlePasteFromExcel(event, rowIndex, 0)
                    }
                  />
                </TableCell>

                <TableCell sx={textCellSx}>
                  <ExcelInput
                    value={row.tolvasAuxiliares}
                    align="left"
                    placeholder="Auxiliares"
                    onChange={(value) =>
                      handleChangeCell(row.id, ["tolvasAuxiliares"], value)
                    }
                    onPaste={(event) =>
                      handlePasteFromExcel(event, rowIndex, 1)
                    }
                  />
                </TableCell>

                {carbons.map((carbon, carbonIndex) => {
                  const data = row.carbons?.[carbon.id] || {};
                  const result =
                    row.carbonResults?.[carbon.id] ||
                    calculateDailyCarbon(data, carbon);
                  const pasteColumnIndex = 2 + carbonIndex * 5;

                  const isAutomaticInitial = row.originalIndex > 0;

                  return (
                    <React.Fragment key={`${row.id}-${carbon.id}`}>
                      <TableCell
                        sx={withMaterialGroupBorder(
                          carbon,
                          isAutomaticInitial
                            ? chainedInitialCellSx
                            : editableCellSx,
                          "start"
                        )}
                        align="right"
                      >
                        <ExcelInput
                          type="number"
                          step="0.01"
                          value={
                            isAutomaticInitial
                              ? Number(result.inicial || 0).toFixed(2)
                              : data.inicial
                          }
                          readOnly={isAutomaticInitial}
                          onChange={(value) =>
                            handleChangeCell(
                              row.id,
                              ["carbons", carbon.id, "inicial"],
                              value
                            )
                          }
                          onPaste={(event) =>
                            handlePasteFromExcel(
                              event,
                              rowIndex,
                              pasteColumnIndex
                            )
                          }
                        />
                      </TableCell>

                      <TableCell
                        sx={
                          row.carbonIngresoMatches?.[carbon.id]?.hasIngreso
                            ? entradaAutomaticaCellSx
                            : editableCellSx
                        }
                        align="right"
                      >
                        <ExcelInput
                          type="number"
                          step="0.01"
                          value={
                            row.carbonIngresoMatches?.[carbon.id]?.hasIngreso
                              ? Number(result.entrada || 0).toFixed(2)
                              : data.entrada
                          }
                          readOnly={
                            row.carbonIngresoMatches?.[carbon.id]?.hasIngreso
                          }
                          onChange={(value) =>
                            handleChangeCell(
                              row.id,
                              ["carbons", carbon.id, "entrada"],
                              value
                            )
                          }
                          onPaste={(event) =>
                            handlePasteFromExcel(
                              event,
                              rowIndex,
                              pasteColumnIndex + 1
                            )
                          }
                        />

                        {row.carbonIngresoMatches?.[carbon.id]?.hasIngreso && (
                          <Typography
                            component="div"
                            sx={{
                              mt: -0.4,
                              pb: 0.25,
                              pr: 1,
                              textAlign: "right",
                              fontSize: 10,
                              fontWeight: 900,
                              color: "#166534",
                              lineHeight: 1,
                            }}
                          >
                            {row.carbonIngresoMatches?.[carbon.id]?.viajes || 0} viaje(s)
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={paladasCVCellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="1"
                          value={data.paladasCV}
                          onChange={(value) =>
                            handleChangeCell(
                              row.id,
                              ["carbons", carbon.id, "paladasCV"],
                              value
                            )
                          }
                          onPaste={(event) =>
                            handlePasteFromExcel(
                              event,
                              rowIndex,
                              pasteColumnIndex + 2
                            )
                          }
                        />
                      </TableCell>

                      <TableCell sx={paladasCNCellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="1"
                          value={data.paladasCN}
                          onChange={(value) =>
                            handleChangeCell(
                              row.id,
                              ["carbons", carbon.id, "paladasCN"],
                              value
                            )
                          }
                          onPaste={(event) =>
                            handlePasteFromExcel(
                              event,
                              rowIndex,
                              pasteColumnIndex + 3
                            )
                          }
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          ...editableCellSx,
                          bgcolor: "#fffbeb",
                          "&:focus-within": {
                            bgcolor: "#fef3c7",
                            boxShadow: "inset 0 0 0 2px #f59e0b",
                          },
                        }}
                        align="right"
                      >
                        <ExcelInput
                          type="number"
                          step="0.01"
                          value={data.ajuste}
                          onChange={(value) =>
                            handleChangeCell(
                              row.id,
                              ["carbons", carbon.id, "ajuste"],
                              value
                            )
                          }
                          onPaste={(event) =>
                            handlePasteFromExcel(
                              event,
                              rowIndex,
                              pasteColumnIndex + 4
                            )
                          }
                        />
                      </TableCell>

                      <TableCell align="right" sx={calculatedCellSx}>
                        {formatTon(result.salida)}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={withMaterialGroupBorder(
                          carbon,
                          {
                            ...calculatedCellSx,
                            bgcolor: result.final < 0 ? "#fee2e2" : "#ecfdf5",
                            color: result.final < 0 ? "#991b1b" : "#065f46",
                          },
                          "end"
                        )}
                      >
                        {formatTon(result.final)}
                      </TableCell>
                    </React.Fragment>
                  );
                })}

                {carbonItems.map((carbon) => (
                  <TableCell
                    key={`${row.id}-${carbon.id}-pct`}
                    align="right"
                    sx={percentCellSx}
                  >
                    {formatPercent(row.mixPercentByItem[carbon.id])}%
                  </TableCell>
                ))}

                <TableCell align="right" sx={percentCellSx}>
                  {formatPercent(row.maderaPercent)}%
                </TableCell>

                {showBagazo && (
                  <TableCell align="right" sx={percentCellSx}>
                    {formatPercent(row.bagazoPercent)}%
                  </TableCell>
                )}

                <TableCell align="right" sx={carbonTotalCellSx}>
                  {formatTon(row.totalCarbon)}
                </TableCell>

                <TableCell align="right" sx={maderaTotalCellSx}>
                  {formatTon(row.totalMadera)}
                </TableCell>

                {showBagazo && (
                  <TableCell align="right" sx={bagazoTotalCellSx}>
                    {formatTon(row.totalBagazo)}
                  </TableCell>
                )}

                <TableCell align="right" sx={entradaCarbonCellSx}>
                  {formatTon(row.totalEntradaCarbon)}
                </TableCell>

                <TableCell align="right" sx={entradaMaderaCellSx}>
                  {formatTon(row.totalEntradaMadera)}
                </TableCell>

                {showBagazo && (
                  <TableCell align="right" sx={entradaBagazoCellSx}>
                    {formatTon(row.totalEntradaBagazo)}
                  </TableCell>
                )}

                <TableCell align="right" sx={ajusteCarbonCellSx}>
                  {formatTon(row.totalAjusteCarbon)}
                </TableCell>

                <TableCell align="right" sx={ajusteMaderaCellSx}>
                  {formatTon(row.totalAjusteMadera)}
                </TableCell>

                {showBagazo && (
                  <TableCell align="right" sx={ajusteBagazoCellSx}>
                    {formatTon(row.totalAjusteBagazo)}
                  </TableCell>
                )}

                <TableCell
                  align="right"
                  sx={{
                    ...inventarioCarbonCellSx,
                    bgcolor: row.totalFinalCarbon < 0 ? "#fee2e2" : "#eff6ff",
                    color: row.totalFinalCarbon < 0 ? "#991b1b" : "#1e3a8a",
                  }}
                >
                  {formatTon(row.totalFinalCarbon)}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    ...inventarioMaderaCellSx,
                    bgcolor: row.totalFinalMadera < 0 ? "#fee2e2" : "#ecfdf5",
                    color: row.totalFinalMadera < 0 ? "#991b1b" : "#14532d",
                  }}
                >
                  {formatTon(row.totalFinalMadera)}
                </TableCell>

                {showBagazo && (
                  <TableCell
                    align="right"
                    sx={{
                      ...inventarioBagazoCellSx,
                      bgcolor:
                        row.totalFinalBagazo < 0 ? "#fee2e2" : "#fff7ed",
                      color: row.totalFinalBagazo < 0 ? "#991b1b" : "#9a3412",
                    }}
                  >
                    {formatTon(row.totalFinalBagazo)}
                  </TableCell>
                )}

                <TableCell align="right" sx={totalCellSx}>
                  {formatTon(row.consumoAcumulado)}
                </TableCell>

                <TableCell sx={{ ...textCellSx, minWidth: 260 }}>
                  <ExcelInput
                    value={row.observacion}
                    align="left"
                    placeholder="Notas del día"
                    onChange={(value) =>
                      handleChangeCell(row.id, ["observacion"], value)
                    }
                    onPaste={(event) =>
                      handlePasteFromExcel(
                        event,
                        rowIndex,
                        2 + carbons.length * 5
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={3}
                sx={{
                  ...footerCellSx,
                  left: 0,
                  zIndex: 6,
                  borderRight: "2px solid #cbd5e1",
                }}
              >
                Totales del rango
              </TableCell>

              {carbons.map((carbon) => {
                const carbonTotals = footerCarbonTotals[carbon.id] || {
                  inicial: 0,
                  entrada: 0,
                  paladasCV: 0,
                  paladasCN: 0,
                  ajuste: 0,
                  salida: 0,
                  final: 0,
                };

                return (
                  <React.Fragment key={`${carbon.id}-footer`}>
                    <TableCell
                      align="right"
                      sx={withMaterialGroupBorder(carbon, footerCellSx, "start")}
                    >
                      {formatTon(carbonTotals.inicial)}
                    </TableCell>

                    <TableCell align="right" sx={footerCellSx}>
                      {formatTon(carbonTotals.entrada)}
                    </TableCell>

                    <TableCell align="right" sx={paladasCVFooterCellSx}>
                      {formatNumber(carbonTotals.paladasCV)}
                    </TableCell>

                    <TableCell align="right" sx={paladasCNFooterCellSx}>
                      {formatNumber(carbonTotals.paladasCN)}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        ...footerCellSx,
                        bgcolor: "#fef3c7",
                        color: carbonTotals.ajuste < 0 ? "#991b1b" : "#854d0e",
                      }}
                    >
                      {formatTon(carbonTotals.ajuste)}
                    </TableCell>

                    <TableCell align="right" sx={footerCellSx}>
                      {formatTon(carbonTotals.salida)}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={withMaterialGroupBorder(
                        carbon,
                        {
                          ...footerCellSx,
                          bgcolor:
                            carbonTotals.final < 0 ? "#fee2e2" : "#dcfce7",
                          color: carbonTotals.final < 0 ? "#991b1b" : "#166534",
                        },
                        "end"
                      )}
                    >
                      {formatTon(carbonTotals.final)}
                    </TableCell>
                  </React.Fragment>
                );
              })}

              {carbonItems.map((carbon) => (
                <TableCell
                  key={`${carbon.id}-footer-pct`}
                  align="right"
                  sx={footerCellSx}
                >
                  {formatPercent(footerMixTotals.percentByItem[carbon.id])}%
                </TableCell>
              ))}

              <TableCell align="right" sx={footerCellSx}>
                {formatPercent(footerMixTotals.maderaPercent)}%
              </TableCell>

              {showBagazo && (
                <TableCell align="right" sx={footerCellSx}>
                  {formatPercent(footerMixTotals.bagazoPercent)}%
                </TableCell>
              )}

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dbeafe",
                  color: "#1e3a8a",
                }}
              >
                {formatTon(footerMixTotals.totalCarbon)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dcfce7",
                  color: "#14532d",
                }}
              >
                {formatTon(footerMixTotals.totalMadera)}
              </TableCell>

              {showBagazo && (
                <TableCell
                  align="right"
                  sx={{
                    ...footerCellSx,
                    bgcolor: "#fed7aa",
                    color: "#9a3412",
                  }}
                >
                  {formatTon(footerMixTotals.totalBagazo)}
                </TableCell>
              )}

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dbeafe",
                  color: "#1e3a8a",
                }}
              >
                {formatTon(footerMixTotals.entradasCarbon)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dcfce7",
                  color: "#14532d",
                }}
              >
                {formatTon(footerMixTotals.entradasMadera)}
              </TableCell>

              {showBagazo && (
                <TableCell
                  align="right"
                  sx={{
                    ...footerCellSx,
                    bgcolor: "#fed7aa",
                    color: "#9a3412",
                  }}
                >
                  {formatTon(footerMixTotals.entradasBagazo)}
                </TableCell>
              )}

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dbeafe",
                  color: "#1e3a8a",
                }}
              >
                {formatTon(footerMixTotals.ajusteCarbon)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor: "#dcfce7",
                  color: "#14532d",
                }}
              >
                {formatTon(footerMixTotals.ajusteMadera)}
              </TableCell>

              {showBagazo && (
                <TableCell
                  align="right"
                  sx={{
                    ...footerCellSx,
                    bgcolor: "#fed7aa",
                    color: "#9a3412",
                  }}
                >
                  {formatTon(footerMixTotals.ajusteBagazo)}
                </TableCell>
              )}

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor:
                    footerMixTotals.finalCarbon < 0 ? "#fee2e2" : "#dbeafe",
                  color:
                    footerMixTotals.finalCarbon < 0 ? "#991b1b" : "#1e3a8a",
                }}
              >
                {formatTon(footerMixTotals.finalCarbon)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...footerCellSx,
                  bgcolor:
                    footerMixTotals.finalMadera < 0 ? "#fee2e2" : "#dcfce7",
                  color:
                    footerMixTotals.finalMadera < 0 ? "#991b1b" : "#14532d",
                }}
              >
                {formatTon(footerMixTotals.finalMadera)}
              </TableCell>

              {showBagazo && (
                <TableCell
                  align="right"
                  sx={{
                    ...footerCellSx,
                    bgcolor:
                      footerMixTotals.finalBagazo < 0 ? "#fee2e2" : "#fed7aa",
                    color:
                      footerMixTotals.finalBagazo < 0 ? "#991b1b" : "#9a3412",
                  }}
                >
                  {formatTon(footerMixTotals.finalBagazo)}
                </TableCell>
              )}

              <TableCell align="right" sx={footerCellSx}>
                {formatTon(footerMixTotals.totalMezcla)}
              </TableCell>

              <TableCell sx={footerCellSx} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <ResumenPatioCarbonModal
        open={summaryModalOpen}
        onClose={closeSummaryModal}
        rows={calculatedRows}
        carbonItems={carbonItems}
        showBagazo={showBagazo}
        footerMixTotals={footerMixTotals}
        dateRange={dateRange}
      />

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
          Cambios pendientes por guardar. Guarda la información para sincronizar este registro por fecha.
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

      <Snackbar
        open={actionSnack.open}
        autoHideDuration={2400}
        onClose={closeActionSnack}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeActionSnack}
          severity={actionSnack.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 3,
            fontWeight: 850,
          }}
        >
          {actionSnack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default React.memo(MonthlyExcelSheet);