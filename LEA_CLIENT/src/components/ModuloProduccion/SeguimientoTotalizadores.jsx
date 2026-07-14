import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

const TOTALIZADORES_API_URL = "https://ambiocomserver.onrender.com/api/seguimiento-totalizadores";
const TANQUES_API_URL = "https://ambiocomserver.onrender.com/api/tanques";

const MONTHS_ES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

const TURNOS = ["Turno 1", "Turno 2", "Turno 3", "Turno 4", "Turno 5"];

const visualColumns = [
  { key: "fecha", label: "Fecha", editable: true, type: "date", w: 132 },
  { key: "turno", label: "Turno", editable: true, selectTurno: true, w: 105 },
  { key: "renInicio", label: "Inicio Turno", editable: true, w: 118 },
  { key: "renFinal", label: "Final turno", editable: true, w: 118 },
  { key: "renConsumo", label: "Consumo", formula: true, w: 110 },

  { key: "prodInicio", label: "Inicio Turno", editable: true, w: 118 },
  { key: "prodFinal", label: "Final turno", editable: true, w: 118 },
  { key: "prodTotal", label: "Producido", formula: true, w: 110 },

  { key: "tk402AInicio", label: "Inicio", editable: true, w: 88 },
  { key: "tk402AFinal", label: "Final", editable: true, w: 88 },
  { key: "tk402BInicio", label: "Inicio", editable: true, w: 88 },
  { key: "tk402BFinal", label: "Final", editable: true, w: 88 },
  { key: "tk402Total", label: "Total", formula: true, w: 115 },

  { key: "tanque1", label: "Tanque 1", editable: true, selectTanque: true, w: 145 },
  { key: "factor1", label: "Factor", editable: true, w: 92 },
  { key: "nivel1Inicio", label: "Inicio", editable: true, w: 92 },
  { key: "nivel1Final", label: "Final", editable: true, w: 92 },
  { key: "tanque2", label: "Tanque 2", editable: true, selectTanque: true, w: 145 },
  { key: "factor2", label: "Factor", editable: true, w: 92 },
  { key: "nivel2Inicio", label: "Inicio", editable: true, w: 92 },
  { key: "nivel2Final", label: "Final", editable: true, w: 92 },
  { key: "renNivelTotal", label: "Total", formula: true, w: 120 },

  { key: "ab801Inicio", label: "Inicio", editable: true, w: 100 },
  { key: "ab801Final", label: "Final", editable: true, w: 100 },
  { key: "ab801Total", label: "Total", formula: true, w: 115 },

  { key: "difProdTraslado", label: "Dif PROD/TK402", formula: true, w: 135 },
  { key: "errorTrasladoPct", label: "% ERROR PROD/TK402", formula: true, percent: true, w: 145 },
  { key: "difRenNiveles", label: "Dif REN/Niveles", formula: true, w: 135 },
  { key: "errorRenNivelesPct", label: "% ERROR REN/Niveles", formula: true, percent: true, w: 145 },
  { key: "difAcumRenProd", label: "Dif Acum REN/Prod.", formula: true, w: 145 },
  { key: "errorTotalizadoresPct", label: "% ERROR Totalizadores", formula: true, percent: true, w: 155 },

  { key: "fcPorTotalizador", label: "Fc por totalizador", formula: true, decimals: 4, w: 135 },
  { key: "fcRenNiveles", label: "Fc REN/Niveles", formula: true, decimals: 4, w: 135 },
];

const groupHeaders = [
  { label: "Flujómetro Totalizador REN", span: 5, className: "gBlue" },
  { label: "Flujómetro Totalizador Producción", span: 3, className: "gGreen" },
  { label: "TK402A", span: 2, className: "gYellow" },
  { label: "TK402B", span: 2, className: "gYellow" },
  { label: "Factor TK402", span: 1, className: "gYellow" },
  { label: "Consumo REN por diferencia de niveles", span: 9, className: "gPurple" },
  { label: "801A/B", span: 3, className: "gOrange" },
  { label: "Errores acumulados", span: 6, className: "gRed" },
  { label: "Factor de consumo", span: 2, className: "gTeal" },
];

const pad2 = (value) => String(value).padStart(2, "0");

const currentMonthKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}`;
};

const getMonthRange = (monthKey) => {
  const [yearText, monthText] = String(monthKey || currentMonthKey()).split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(lastDay)}`,
    days: lastDay,
  };
};

const getRegistroNombre = (monthKey) => {
  const [yearText, monthText] = String(monthKey || currentMonthKey()).split("-");
  const monthIndex = Number(monthText) - 1;
  const monthName = MONTHS_ES[monthIndex] || "MES";
  return `REGISTRO_PRODUCCION_${monthName}_${yearText}`;
};

const buildMonthOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return years.flatMap((year) =>
    MONTHS_ES.map((monthName, index) => {
      const key = `${year}-${pad2(index + 1)}`;
      return {
        key,
        label: `${monthName.charAt(0)}${monthName.slice(1).toLowerCase()} ${year}`,
        registro: getRegistroNombre(key),
      };
    })
  );
};

const previousMonthKey = (monthKey) => {
  const [yearText, monthText] = String(monthKey || currentMonthKey()).split("-");
  const date = new Date(Number(yearText), Number(monthText) - 2, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
};

const getTwoMonthWindow = (monthKey) => {
  const current = String(monthKey || currentMonthKey());
  const previous = previousMonthKey(current);
  const previousRange = getMonthRange(previous);
  const currentRange = getMonthRange(current);

  return {
    months: [previous, current],
    previous,
    current,
    from: previousRange.from,
    to: currentRange.to,
  };
};

const formatMonthLabel = (monthKey) => {
  const [yearText, monthText] = String(monthKey || currentMonthKey()).split("-");
  const monthName = MONTHS_ES[Number(monthText) - 1] || "MES";
  return `${monthName.charAt(0)}${monthName.slice(1).toLowerCase()} ${yearText}`;
};

const getRowMonth = (row = {}) => {
  const fecha = String(row?.fecha || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha.slice(0, 7) : "";
};

const normalizeTurnoValue = (value) => {
  const v = String(value || "").trim();
  if (!v) return "";

  const match = v.match(/^(?:turno\s*)?([1-5])$/i);
  if (match) return `Turno ${match[1]}`;

  return v;
};

const getTurnoNumero = (value) => {
  const turno = normalizeTurnoValue(value);
  const match = turno.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const isTurno12HorasValue = (value) => {
  const turno = normalizeTurnoValue(value);
  return turno === "Turno 4" || turno === "Turno 5";
};

const blankRow = (id, fecha = "") => ({
  id,
  fecha,
  turno: "",
  renInicio: "",
  renFinal: "",
  prodInicio: "",
  prodFinal: "",
  tk402AInicio: "",
  tk402AFinal: "",
  tk402BInicio: "",
  tk402BFinal: "",
  tanque1: "",
  factor1: "",
  nivel1Inicio: "",
  nivel1Final: "",
  tanque2: "",
  factor2: "",
  nivel2Inicio: "",
  nivel2Final: "",
  ab801Inicio: "",
  ab801Final: "",
});

const createRowsForMonth = (monthKey) => {
  const { days } = getMonthRange(monthKey);
  const [yearText, monthText] = String(monthKey || currentMonthKey()).split("-");

  return Array.from({ length: days * 3 }, (_, i) => {
    const day = Math.floor(i / 3) + 1;
    const fecha = `${yearText}-${monthText}-${pad2(day)}`;
    return blankRow(`r-${monthKey}-${day}-${(i % 3) + 1}`, fecha);
  });
};

const clearRowKeepingDate = (row) => ({
  ...blankRow(row?.id || `r-${Date.now()}-clear`, row?.fecha || ""),
});

const applyTurno12HorasRules = (sourceRows) => {
  const next = [...sourceRows];

  for (let start = 0; start < next.length; start += 3) {
    const dayRows = next.slice(start, start + 3);
    const hasTurno12Horas = dayRows.some((row) => isTurno12HorasValue(row?.turno));

    if (hasTurno12Horas && next[start + 2]) {
      next[start + 2] = clearRowKeepingDate(next[start + 2]);
    }
  }

  return next;
};

const showToast = (icon, title) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    timer: 2600,
    timerProgressBar: true,
    showConfirmButton: false,

    didOpen: (toast) => {
      toast.style.marginTop = "60px";
    },
  });
};

const normalizeRowsFromDias = (dias = [], monthKey) => {
  const baseRows = createRowsForMonth(monthKey);

  dias.forEach((dia) => {
    const diaGrupo = Number(dia?.diaGrupo || 0);
    const fechaDia = dia?.fecha || "";
    const startIndex = diaGrupo > 0 ? (diaGrupo - 1) * 3 : -1;

    if (startIndex < 0 || startIndex >= baseRows.length) return;

    (dia?.turnos || []).forEach((turno, index) => {
      const targetIndex = startIndex + index;
      if (!baseRows[targetIndex]) return;

      baseRows[targetIndex] = {
        ...baseRows[targetIndex],
        ...turno,
        id: turno?.idFrontend || turno?.id || baseRows[targetIndex].id,
        fecha: turno?.fecha || fechaDia || baseRows[targetIndex].fecha,
        turno: normalizeTurnoValue(turno?.turno),
      };
    });
  });

  return baseRows;
};

const normalizeRowsFromRegistro = (registro, monthKey, { fillWhenEmpty = true } = {}) => {
  const sourceRows = Array.isArray(registro?.rows) && registro.rows.length
    ? registro.rows
    : normalizeRowsFromDias(registro?.dias, monthKey);

  const baseRows = createRowsForMonth(monthKey);

  if (!Array.isArray(sourceRows) || sourceRows.length === 0) return fillWhenEmpty ? baseRows : [];

  const normalized = sourceRows.map((row, index) => ({
    ...blankRow(row?.id || row?.idFrontend || `r-${monthKey}-${index}`, row?.fecha || baseRows[index]?.fecha || ""),
    ...row,
    id: row?.id || row?.idFrontend || `r-${monthKey}-${index}`,
    turno: normalizeTurnoValue(row?.turno),
  }));

  const remainder = normalized.length % 3;
  if (remainder !== 0) {
    const faltantes = 3 - remainder;
    const fechaUltimoGrupo = normalized[normalized.length - 1]?.fecha || "";

    return [
      ...normalized,
      ...Array.from({ length: faltantes }, (_, index) =>
        blankRow(`r-${monthKey}-pad-${Date.now()}-${index}`, fechaUltimoGrupo)
      ),
    ];
  }

  return normalized;
};

const getErrorMessage = (error, fallback = "Ocurrió un error inesperado") =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const ROW_SAVE_KEYS = [
  "id",
  "fecha",
  "turno",
  "renInicio",
  "renFinal",
  "prodInicio",
  "prodFinal",
  "tk402AInicio",
  "tk402AFinal",
  "tk402BInicio",
  "tk402BFinal",
  "tanque1",
  "factor1",
  "nivel1Inicio",
  "nivel1Final",
  "tanque2",
  "factor2",
  "nivel2Inicio",
  "nivel2Final",
  "ab801Inicio",
  "ab801Final",
];

const normalizeRowForSave = (row = {}) =>
  ROW_SAVE_KEYS.reduce((acc, key) => {
    acc[key] = row?.[key] ?? "";
    return acc;
  }, {});

const ROW_OPERATIONAL_KEYS = ROW_SAVE_KEYS.filter((key) => key !== "id" && key !== "fecha");

const rowHasOperationalData = (row = {}) =>
  ROW_OPERATIONAL_KEYS.some((key) => {
    const value = row?.[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

const dayGroupHasOperationalData = (groupRows = []) => groupRows.some(rowHasOperationalData);

const normalizeRowsForSave = (sourceRows = []) => {
  const output = [];

  for (let start = 0; start < sourceRows.length; start += 3) {
    const groupRows = sourceRows.slice(start, start + 3);

    if (dayGroupHasOperationalData(groupRows)) {
      output.push(...groupRows.map(normalizeRowForSave));
    }
  }

  return output;
};

const buildSaveSignature = (payload) => {
  try {
    return JSON.stringify({
      mes: payload?.mes,
      factor402: payload?.factor402,
      factor801: payload?.factor801,
      rows: payload?.rows || [],
    });
  } catch (_) {
    return `${payload?.mes || "sin-mes"}-${Date.now()}`;
  }
};

const buildMonthSavePayload = ({ month, rows, factor402, factor801 }) => {
  const monthRange = getMonthRange(month);

  return {
    registroNombre: getRegistroNombre(month),
    mes: month,
    anio: Number(month.split("-")[0]),
    mesNumero: Number(month.split("-")[1]),
    fechaInicioMes: monthRange.from,
    fechaFinMes: monthRange.to,
    factor402: factor402 ?? "9620",
    factor801: factor801 ?? "139982",
    rows: normalizeRowsForSave(rows),
    updatedAt: new Date().toISOString(),
  };
};

const KPI_TOOLTIPS = {
  renConsumo: {
    title: "Acumulado REN por totalizador",
    description:
      "Suma el consumo REN de todos los días visibles dentro del rango seleccionado.",
    formula: "Σ (lectura final REN − lectura inicial REN)",
  },
  prodTotal: {
    title: "Acumulado de producción",
    description:
      "Suma la producción registrada por el totalizador durante los días incluidos en el filtro.",
    formula: "Σ (lectura final de producción − lectura inicial)",
  },
  tk402Total: {
    title: "Acumulado TK402A/B",
    description:
      "Suma el volumen calculado diariamente con las variaciones de TK402A y TK402B, utilizando el factor correspondiente a cada mes.",
    formula: "Σ [(ΔTK402A + ΔTK402B) × factor TK402]",
  },
  ab801Total: {
    title: "Acumulado de traslado 801A/B",
    description:
      "Suma el volumen trasladado calculado con la diferencia del totalizador 801A/B y el factor configurado para cada mes.",
    formula: "Σ [(lectura final − lectura inicial) × factor 801]",
  },
  difRenNiveles: {
    title: "Diferencia REN frente a niveles",
    description:
      "Compara el consumo acumulado del totalizador REN con el consumo acumulado calculado por diferencia de niveles.",
    formula: "REN totalizador − REN por niveles",
  },
  errorRenNivelesPct: {
    title: "Error porcentual REN/Niveles",
    description:
      "Mide qué proporción representa la diferencia entre el totalizador REN y los niveles respecto al consumo REN acumulado.",
    formula: "|REN − niveles| ÷ |REN|",
  },
  errorTrasladoPct: {
    title: "Error porcentual Producción/TK402",
    description:
      "Compara la producción acumulada del totalizador con el volumen acumulado calculado en TK402A/B.",
    formula: "|Producción − TK402| ÷ |Producción|",
  },
  errorTotalizadoresPct: {
    title: "Error entre totalizadores",
    description:
      "Mide la diferencia acumulada entre REN y Producción frente al volumen total combinado de ambos totalizadores.",
    formula: "|Producción − REN| ÷ (|REN| + |Producción|)",
  },
  fcPorTotalizador: {
    title: "Factor de consumo por totalizador",
    description:
      "Relaciona el volumen acumulado de TK402A/B con la producción acumulada del totalizador.",
    formula: "TK402A/B ÷ Producción",
  },
  fcRenNiveles: {
    title: "Factor REN frente a niveles",
    description:
      "Relaciona el consumo acumulado calculado por niveles con el consumo acumulado del totalizador REN.",
    formula: "REN por niveles ÷ REN totalizador",
  },
};

const NEGATIVE_OPERATIONAL_KEYS = [
  "renConsumo",
  "prodTotal",
  "tk402Total",
  "renNivelTotal",
  "ab801Total",
];

const NEGATIVE_OPERATIONAL_LABELS = {
  renConsumo: "Consumo REN",
  prodTotal: "Producción",
  tk402Total: "TK402A/B",
  renNivelTotal: "REN por niveles",
  ab801Total: "Traslado 801A/B",
};

const NEGATIVE_PAIR_RULES = [
  {
    section: "Totalizador REN",
    startKey: "renInicio",
    endKey: "renFinal",
    mode: "finalMinusStart",
    formulaKey: "renConsumo",
  },
  {
    section: "Totalizador de producción",
    startKey: "prodInicio",
    endKey: "prodFinal",
    mode: "finalMinusStart",
    formulaKey: "prodTotal",
  },
  {
    section: "TK402A",
    startKey: "tk402AInicio",
    endKey: "tk402AFinal",
    mode: "finalMinusStart",
    formulaKey: "tk402Total",
  },
  {
    section: "TK402B",
    startKey: "tk402BInicio",
    endKey: "tk402BFinal",
    mode: "finalMinusStart",
    formulaKey: "tk402Total",
  },
  {
    section: "Nivel del tanque 1",
    startKey: "nivel1Inicio",
    endKey: "nivel1Final",
    mode: "startMinusFinal",
    formulaKey: "renNivelTotal",
  },
  {
    section: "Nivel del tanque 2",
    startKey: "nivel2Inicio",
    endKey: "nivel2Final",
    mode: "startMinusFinal",
    formulaKey: "renNivelTotal",
  },
  {
    section: "Totalizador 801A/B",
    startKey: "ab801Inicio",
    endKey: "ab801Final",
    mode: "finalMinusStart",
    formulaKey: "ab801Total",
  },
];

export default function SeguimientoTotalizadoresU400({
  totalizadoresApiUrl = TOTALIZADORES_API_URL,
  tanquesApiUrl = TANQUES_API_URL,
}) {
  const initialMonth = useMemo(() => currentMonthKey(), []);
  const initialWindow = useMemo(() => getTwoMonthWindow(initialMonth), [initialMonth]);
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [factorEditMonth, setFactorEditMonth] = useState(initialMonth);
  const [rangeFrom, setRangeFrom] = useState(initialWindow.from);
  const [rangeTo, setRangeTo] = useState(initialWindow.to);
  const [rows, setRows] = useState(() => [
    ...createRowsForMonth(initialWindow.previous),
    ...createRowsForMonth(initialWindow.current),
  ]);
  const [factorsByMonth, setFactorsByMonth] = useState(() => ({
    [initialWindow.previous]: { factor402: "9620", factor801: "139982" },
    [initialWindow.current]: { factor402: "9620", factor801: "139982" },
  }));
  const [tanques, setTanques] = useState([]);
  const [tanquesLoading, setTanquesLoading] = useState(false);
  const [tanquesError, setTanquesError] = useState("");
  const [registroLoading, setRegistroLoading] = useState(false);
  const [saveState, setSaveState] = useState("Cargando registros...");
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [kpisExpanded, setKpisExpanded] = useState(true);

  const saveTimer = useRef(null);
  const hasLoadedRef = useRef(false);
  const lastAutoSaveErrorRef = useRef("");
  const lastSavedSignaturesRef = useRef({});
  const pendingPayloadsRef = useRef([]);
  const pendingSignaturesRef = useRef({});
  const isSavingRef = useRef(false);
  const saveAgainAfterCurrentRef = useRef(false);

  const twoMonthWindow = useMemo(() => getTwoMonthWindow(selectedMonth), [selectedMonth]);
  const windowMonths = twoMonthWindow.months;
  const windowRange = useMemo(
    () => ({ from: twoMonthWindow.from, to: twoMonthWindow.to }),
    [twoMonthWindow.from, twoMonthWindow.to]
  );

  const registroNombre = useMemo(
    () => `VENTANA_${getRegistroNombre(twoMonthWindow.previous)}__${getRegistroNombre(twoMonthWindow.current)}`,
    [twoMonthWindow.previous, twoMonthWindow.current]
  );

  const editedMonthFactors = factorsByMonth[factorEditMonth] || {
    factor402: "9620",
    factor801: "139982",
  };
  const factor402 = editedMonthFactors.factor402;
  const factor801 = editedMonthFactors.factor801;

  const updateFactorForMonth = useCallback((month, key, value) => {
    setFactorsByMonth((prev) => ({
      ...prev,
      [month]: {
        factor402: prev?.[month]?.factor402 ?? "9620",
        factor801: prev?.[month]?.factor801 ?? "139982",
        [key]: value,
      },
    }));
  }, []);

  const n = (value) => {
    if (value === null || value === undefined || value === "") return null;
    let s = String(value).trim().replace(/\s/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const number = Number(s);
    return Number.isFinite(number) ? number : null;
  };

  const fmt = (value, decimals = 2) => {
    if (value === "" || value === null || value === undefined || Number.isNaN(value)) return "";
    return Number(value).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const fmtPct = (value, decimals = 2) => {
    if (value === "" || value === null || value === undefined || Number.isNaN(value)) return "";
    return Number(value).toLocaleString("es-CO", {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const fmtFormula = (value, col, decimalsFallback = 2) => {
    if (col.percent) return fmtPct(value);
    return fmt(value, col.decimals ?? decimalsFallback);
  };

  const safeRatio = (numerator, denominator) => {
    const num = Number(numerator || 0);
    const den = Number(denominator || 0);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return "";
    return num / den;
  };

  const getFactorsForRow = useCallback(
    (row) => {
      const month = getRowMonth(row);
      return (
        factorsByMonth[month] ||
        factorsByMonth[selectedMonth] || {
          factor402: "9620",
          factor801: "139982",
        }
      );
    },
    [factorsByMonth, selectedMonth]
  );

  const tanqueOptions = useMemo(() => {
    const source = Array.isArray(tanques) ? tanques : [];

    return source
      .map((tanque, index) => {
        const nombre = String(tanque?.NombreTanque ?? "").trim();
        const factor = String(tanque?.Factor ?? "").trim();

        return {
          id: String(tanque?._id ?? `tanque-${index}`),
          nombre,
          factor,
        };
      })
      .filter((tanque) => tanque.nombre)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }));
  }, [tanques]);

  const getTanqueByValue = useCallback(
    (value) => {
      const v = String(value || "").trim().toLowerCase();
      if (!v) return null;

      return (
        tanqueOptions.find((t) => String(t.nombre).trim().toLowerCase() === v) ||
        tanqueOptions.find((t) => String(t.id).trim().toLowerCase() === v) ||
        null
      );
    },
    [tanqueOptions]
  );

  useEffect(() => {
    const controller = new AbortController();

    const cargarRegistros = async () => {
      const monthsToLoad = getTwoMonthWindow(selectedMonth).months;
      const activeWindow = getTwoMonthWindow(selectedMonth);

      hasLoadedRef.current = false;
      clearTimeout(saveTimer.current);
      pendingPayloadsRef.current = [];
      pendingSignaturesRef.current = {};

      try {
        setRegistroLoading(true);
        setSaveState("Cargando mes anterior y mes seleccionado...");
        setFactorEditMonth(selectedMonth);

        const response = await axios.get(
          `${totalizadoresApiUrl}/ventana/${selectedMonth}`,
          {
            withCredentials: true,
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        );

        if (!response.data?.ok) {
          throw new Error(
            response.data?.message || "No se pudo consultar la ventana de meses"
          );
        }

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const itemsByMonth = new Map(
          items.map((item) => [String(item?.mes || ""), item])
        );

        const loadedRows = [];
        const loadedFactors = {};
        const missingMonths = [];

        monthsToLoad.forEach((month) => {
          const item = itemsByMonth.get(month);
          const existsInMongo = item?.exists === true;
          const registro = item?.data || {
            mes: month,
            registroNombre: getRegistroNombre(month),
            factor402: "9620",
            factor801: "139982",
            rows: [],
            dias: [],
          };

          if (!existsInMongo) missingMonths.push(month);

          const monthRows = applyTurno12HorasRules(
            normalizeRowsFromRegistro(registro, month, {
              fillWhenEmpty: true,
            })
          );

          loadedRows.push(...monthRows);
          loadedFactors[month] = {
            factor402: String(registro?.factor402 ?? "9620"),
            factor801: String(registro?.factor801 ?? "139982"),
          };
        });

        const initialPayloads = monthsToLoad.map((month) =>
          buildMonthSavePayload({
            month,
            rows: loadedRows.filter((row) => getRowMonth(row) === month),
            factor402: loadedFactors[month]?.factor402,
            factor801: loadedFactors[month]?.factor801,
          })
        );

        lastSavedSignaturesRef.current = Object.fromEntries(
          initialPayloads.map((payload) => [payload.mes, buildSaveSignature(payload)])
        );
        lastAutoSaveErrorRef.current = "";

        setRows(loadedRows);
        setFactorsByMonth(loadedFactors);
        setRangeFrom(response.data?.desde || activeWindow.from);
        setRangeTo(response.data?.hasta || activeWindow.to);
        setSaveState(
          missingMonths.length
            ? `Ventana cargada · ${missingMonths.length} mes(es) sin registro`
            : "Mes anterior y mes seleccionado cargados desde BD"
        );

        hasLoadedRef.current = true;

        if (missingMonths.length) {
          showToast(
            "info",
            `Sin registro: ${missingMonths.map(formatMonthLabel).join(" y ")}. Se creará al diligenciar datos.`
          );
        }
      } catch (error) {
        const canceled =
          axios.isCancel?.(error) ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          controller.signal.aborted;

        if (canceled) return;

        hasLoadedRef.current = false;
        const fallbackRows = monthsToLoad.flatMap((month) => createRowsForMonth(month));
        const fallbackFactors = Object.fromEntries(
          monthsToLoad.map((month) => [month, { factor402: "9620", factor801: "139982" }])
        );

        setRows(fallbackRows);
        setFactorsByMonth(fallbackFactors);
        setRangeFrom(activeWindow.from);
        setRangeTo(activeWindow.to);
        setSaveState("Sin conexión con BD");

        Swal.fire({
          icon: "error",
          title: "No se pudieron cargar los dos meses",
          text: getErrorMessage(error, "Verifica la conexión con el servidor."),
        });
      } finally {
        if (!controller.signal.aborted) setRegistroLoading(false);
      }
    };

    cargarRegistros();
    return () => controller.abort();
  }, [selectedMonth, totalizadoresApiUrl]);

  useEffect(() => {
    const controller = new AbortController();

    const cargarTanques = async () => {
      try {
        setTanquesLoading(true);
        setTanquesError("");

        const response = await axios.get(tanquesApiUrl, {
          withCredentials: true,
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const data = response.data;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setTanques(list);

      } catch (error) {
        const canceled =
          axios.isCancel?.(error) ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          controller.signal.aborted;

        if (!canceled) {
          console.error("Error cargando tanques:", error);

          const status = error?.response?.status;
          setTanquesError(status === 401 ? "401: sesión no autorizada para consultar tanques" : "No se pudieron cargar los tanques");
          setTanques([]);
        }
      } finally {
        if (!controller.signal.aborted) setTanquesLoading(false);
      }
    };

    cargarTanques();
    return () => controller.abort();
  }, [tanquesApiUrl]);

  const roundCalc = (value, decimals = 6) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    const factor = 10 ** decimals;
    return Math.round((number + Number.EPSILON) * factor) / factor;
  };

  const hasCalculatedValue = (value) =>
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value));

  const diff = (row, a, b) => {
    const start = n(row[a]);
    const end = n(row[b]);

    // Un totalizador solo se puede calcular cuando existen las dos lecturas.
    // Antes, una lectura final vacía se tomaba como cero y generaba negativos falsos.
    if (start === null || end === null) return "";

    return roundCalc(end - start);
  };

  const calc = (row, key) => {
    if (key === "renConsumo") return diff(row, "renInicio", "renFinal");
    if (key === "prodTotal") return diff(row, "prodInicio", "prodFinal");
    if (key === "tk402Total") {
      const a = diff(row, "tk402AInicio", "tk402AFinal");
      const b = diff(row, "tk402BInicio", "tk402BFinal");
      const factor402Row = n(getFactorsForRow(row).factor402);

      if (!hasCalculatedValue(a) && !hasCalculatedValue(b)) return "";
      if (factor402Row === null) return "";

      return roundCalc(
        (
          (hasCalculatedValue(a) ? Number(a) : 0) +
          (hasCalculatedValue(b) ? Number(b) : 0)
        ) * factor402Row
      );
    }
    if (key === "renNivelTotal") {
      const f1 = n(row.factor1);
      const i1 = n(row.nivel1Inicio);
      const e1 = n(row.nivel1Final);
      const f2 = n(row.factor2);
      const i2 = n(row.nivel2Inicio);
      const e2 = n(row.nivel2Final);

      const total1 =
        f1 !== null && i1 !== null && e1 !== null
          ? roundCalc((i1 - e1) * f1)
          : null;

      const total2 =
        f2 !== null && i2 !== null && e2 !== null
          ? roundCalc((i2 - e2) * f2)
          : null;

      // Cero es un resultado válido; únicamente queda vacío si ninguno está completo.
      if (total1 === null && total2 === null) return "";

      return roundCalc((total1 ?? 0) + (total2 ?? 0));
    }
    if (key === "ab801Total") {
      const total = diff(row, "ab801Inicio", "ab801Final");
      const factor801Row = n(getFactorsForRow(row).factor801);

      if (!hasCalculatedValue(total) || factor801Row === null) return "";

      return roundCalc(Number(total) * factor801Row);
    }
    if (key === "difProdTraslado") {
      const prod = calc(row, "prodTotal");
      const tk402 = calc(row, "tk402Total");

      if (!hasCalculatedValue(prod) || !hasCalculatedValue(tk402)) return "";

      return roundCalc(Number(prod) - Number(tk402));
    }
    if (key === "errorTrasladoPct") {
      const prod = calc(row, "prodTotal");
      const tk402 = calc(row, "tk402Total");

      if (!hasCalculatedValue(prod) || !hasCalculatedValue(tk402)) return "";

      return safeRatio(
        Math.abs(Number(prod) - Number(tk402)),
        Math.abs(Number(prod))
      );
    }
    if (key === "difRenNiveles") {
      const ren = calc(row, "renConsumo");
      const renNiveles = calc(row, "renNivelTotal");

      if (!hasCalculatedValue(ren) || !hasCalculatedValue(renNiveles)) return "";

      return roundCalc(Number(ren) - Number(renNiveles));
    }
    if (key === "errorRenNivelesPct") {
      const ren = calc(row, "renConsumo");
      const renNiveles = calc(row, "renNivelTotal");

      if (!hasCalculatedValue(ren) || !hasCalculatedValue(renNiveles)) return "";

      return safeRatio(
        Math.abs(Number(ren) - Number(renNiveles)),
        Math.abs(Number(ren))
      );
    }
    if (key === "fcPorTotalizador") {
      const prod = calc(row, "prodTotal");
      const tk402 = calc(row, "tk402Total");

      if (!hasCalculatedValue(prod) || !hasCalculatedValue(tk402)) return "";

      return safeRatio(Number(tk402), Number(prod));
    }
    if (key === "fcRenNiveles") {
      const ren = calc(row, "renConsumo");
      const renNiveles = calc(row, "renNivelTotal");

      if (!hasCalculatedValue(ren) || !hasCalculatedValue(renNiveles)) return "";

      return safeRatio(Number(renNiveles), Number(ren));
    }
    if (key === "difAcumRenProd") {
      const ren = calc(row, "renConsumo");
      const prod = calc(row, "prodTotal");

      if (!hasCalculatedValue(ren) || !hasCalculatedValue(prod)) return "";

      return roundCalc(Math.abs(Number(prod) - Number(ren)));
    }
    if (key === "errorTotalizadoresPct") {
      const ren = calc(row, "renConsumo");
      const prod = calc(row, "prodTotal");

      if (!hasCalculatedValue(ren) || !hasCalculatedValue(prod)) return "";

      return safeRatio(
        Math.abs(Number(prod) - Number(ren)),
        Math.abs(Number(ren)) + Math.abs(Number(prod))
      );
    }
    return "";
  };

  useEffect(() => {
    if (!tanqueOptions.length) return;

    setRows((prev) => {
      let changed = false;

      const next = prev.map((row) => {
        let updated = row;

        const syncTanque = (tanqueKey, factorKey) => {
          const tanque = getTanqueByValue(updated[tanqueKey]);
          if (!tanque) return;

          if (updated[tanqueKey] !== tanque.nombre || updated[factorKey] !== tanque.factor) {
            updated = {
              ...updated,
              [tanqueKey]: tanque.nombre,
              [factorKey]: tanque.factor,
            };
            changed = true;
          }
        };

        syncTanque("tanque1", "factor1");
        syncTanque("tanque2", "factor2");
        return updated;
      });

      return changed ? next : prev;
    });
  }, [getTanqueByValue, tanqueOptions.length]);

  const setCell = (rowIndex, key, value) => {
    const cellValue = key === "turno" ? normalizeTurnoValue(value) : value;

    setRows((prev) => {
      let next = prev.map((r, i) => (i === rowIndex ? { ...r, [key]: cellValue } : r));

      if (key === "fecha") {
        if (cellValue && (cellValue < windowRange.from || cellValue > windowRange.to)) {
          showToast("warning", "La fecha debe estar dentro de la ventana de dos meses.");
          return prev;
        }

        const groupStart = Math.floor(rowIndex / 3) * 3;
        for (let index = groupStart; index < groupStart + 3; index += 1) {
          if (next[index]) next[index] = { ...next[index], fecha: cellValue };
        }
      }

      if (key === "tanque1" || key === "tanque2") {
        const factorKey = key === "tanque1" ? "factor1" : "factor2";
        const tanque = getTanqueByValue(cellValue);
        next[rowIndex] = {
          ...next[rowIndex],
          [key]: tanque?.nombre ?? cellValue,
          [factorKey]: tanque?.factor ?? "",
        };
      }

      const autoMap = {
        renFinal: "renInicio",
        prodFinal: "prodInicio",
        tk402AFinal: "tk402AInicio",
        tk402BFinal: "tk402BInicio",
        nivel1Final: "nivel1Inicio",
        nivel2Final: "nivel2Inicio",
        ab801Final: "ab801Inicio",
      };

      const nextKey = autoMap[key];
      if (nextKey) {
        const groupStart = Math.floor(rowIndex / 3) * 3;
        const dayRows = next.slice(groupStart, groupStart + 3);
        const is12HoursDay = dayRows.some((item) => isTurno12HorasValue(item?.turno));
        let targetIndex = rowIndex + 1;

        if (is12HoursDay && targetIndex === groupStart + 2) {
          targetIndex = groupStart + 3;
        }

        const targetRow = next[targetIndex];
        if (targetRow && !targetRow[nextKey]) {
          next[targetIndex] = { ...targetRow, [nextKey]: cellValue };
        }
      }

      if (key === "turno" && isTurno12HorasValue(cellValue)) {
        const groupStart = Math.floor(rowIndex / 3) * 3;
        const thirdRowIndex = groupStart + 2;

        if (next[thirdRowIndex]) {
          next[thirdRowIndex] = clearRowKeepingDate(next[thirdRowIndex]);
        }
      }

      next = applyTurno12HorasRules(next);
      return next;
    });
  };

  const baseFormulaKeys = ["renConsumo", "prodTotal", "tk402Total", "renNivelTotal", "ab801Total"];

  const addErrorMetrics = (base) => {
    const hasProdTk402 =
      hasCalculatedValue(base.prodTotal) &&
      hasCalculatedValue(base.tk402Total);

    const hasRenNiveles =
      hasCalculatedValue(base.renConsumo) &&
      hasCalculatedValue(base.renNivelTotal);

    const hasRenProd =
      hasCalculatedValue(base.renConsumo) &&
      hasCalculatedValue(base.prodTotal);

    const difProdTraslado = hasProdTk402
      ? roundCalc(Number(base.prodTotal) - Number(base.tk402Total))
      : "";

    const difRenNiveles = hasRenNiveles
      ? roundCalc(Number(base.renConsumo) - Number(base.renNivelTotal))
      : "";

    const difAcumRenProd = hasRenProd
      ? roundCalc(Math.abs(Number(base.prodTotal) - Number(base.renConsumo)))
      : "";

    return {
      ...base,
      difProdTraslado,
      errorTrasladoPct: hasProdTk402
        ? safeRatio(
            Math.abs(Number(base.prodTotal) - Number(base.tk402Total)),
            Math.abs(Number(base.prodTotal))
          )
        : "",
      difRenNiveles,
      errorRenNivelesPct: hasRenNiveles
        ? safeRatio(
            Math.abs(Number(base.renConsumo) - Number(base.renNivelTotal)),
            Math.abs(Number(base.renConsumo))
          )
        : "",
      difAcumRenProd,
      errorTotalizadoresPct: hasRenProd
        ? safeRatio(
            difAcumRenProd,
            Math.abs(Number(base.renConsumo)) + Math.abs(Number(base.prodTotal))
          )
        : "",
      fcPorTotalizador: hasProdTk402
        ? safeRatio(Number(base.tk402Total), Number(base.prodTotal))
        : "",
      fcRenNiveles: hasRenNiveles
        ? safeRatio(Number(base.renNivelTotal), Number(base.renConsumo))
        : "",
    };
  };

  const sumRows = (sourceRows) => {
    const sums = {
      renConsumo: 0,
      prodTotal: 0,
      tk402Total: 0,
      renNivelTotal: 0,
      ab801Total: 0,
    };

    const validCounts = {
      renConsumo: 0,
      prodTotal: 0,
      tk402Total: 0,
      renNivelTotal: 0,
      ab801Total: 0,
    };

    sourceRows.forEach((row) => {
      baseFormulaKeys.forEach((key) => {
        const value = calc(row, key);

        if (hasCalculatedValue(value)) {
          sums[key] = roundCalc(sums[key] + Number(value));
          validCounts[key] += 1;
        }
      });
    });

    const base = baseFormulaKeys.reduce((acc, key) => {
      acc[key] = validCounts[key] > 0 ? roundCalc(sums[key]) : "";
      return acc;
    }, {});

    return addErrorMetrics(base);
  };

  /**
   * Acumula exclusivamente los TOTAL DÍA ya calculados.
   *
   * Flujo:
   * 1. Cada grupo visible se totaliza por fecha.
   * 2. Los totales diarios se acumulan dentro del rango Desde/Hasta.
   * 3. Si el rango está restablecido, se acumulan completos el mes anterior
   *    y el mes principal.
   *
   * No vuelve a interpretar lecturas inicio/final en esta etapa; únicamente
   * suma los resultados diarios, igual que una suma de la columna TOTAL DÍA
   * en Excel.
   */
  const sumDailyTotals = (dailyTotals = []) => {
    const sums = {
      renConsumo: 0,
      prodTotal: 0,
      tk402Total: 0,
      renNivelTotal: 0,
      ab801Total: 0,
    };

    const validCounts = {
      renConsumo: 0,
      prodTotal: 0,
      tk402Total: 0,
      renNivelTotal: 0,
      ab801Total: 0,
    };

    dailyTotals.forEach((dayTotal) => {
      baseFormulaKeys.forEach((key) => {
        const value = dayTotal?.[key];

        if (hasCalculatedValue(value)) {
          sums[key] = roundCalc(sums[key] + Number(value));
          validCounts[key] += 1;
        }
      });
    });

    const base = baseFormulaKeys.reduce((acc, key) => {
      acc[key] = validCounts[key] > 0 ? roundCalc(sums[key]) : "";
      return acc;
    }, {});

    return addErrorMetrics(base);
  };

  const buildTurnoPayload = (row, { diaGrupo, modalidadTurno, posicionTurnoDia, fechaGrupo }) => {
    const turno = normalizeTurnoValue(row.turno);
    const turnoNumero = getTurnoNumero(turno);
    const fecha = row.fecha || fechaGrupo || "";

    const formulas = visualColumns
      .filter((col) => col.formula)
      .reduce((acc, col) => {
        const value = calc(row, col.key);
        acc[col.key] = value === "" ? null : Number(value);
        return acc;
      }, {});

    return {
      ...row,
      ...formulas,
      turno,
      turnoNumero,
      fecha,
      claveFila: fecha && turnoNumero ? `${fecha}_TURNO_${turnoNumero}` : "",
      diaGrupo,
      modalidadTurno,
      posicionTurnoDia,
      activo: !(modalidadTurno === "12H" && posicionTurnoDia === 3),
    };
  };

  const buildGroups = useCallback(
    ({ applyDateFilter = false } = {}) => {
      const from = rangeFrom || windowRange.from;
      const to = rangeTo || windowRange.to;
      const groups = [];

      for (let start = 0; start < rows.length; start += 3) {
        const groupItems = rows.slice(start, start + 3).map((row, offset) => ({
          row,
          originalIndex: start + offset,
          posicionTurnoDia: offset + 1,
        }));

        const modalidadTurno = groupItems.some(({ row }) => isTurno12HorasValue(row.turno)) ? "12H" : "8H";

        const activeItems = groupItems
          .filter((item) => !(modalidadTurno === "12H" && item.posicionTurnoDia === 3))
          .filter(({ row }) => {
            if (!applyDateFilter) return true;
            if (!row.fecha) return false;
            if (from && row.fecha < from) return false;
            if (to && row.fecha > to) return false;
            return true;
          });

        if (activeItems.length) {
          groups.push({
            key: `grupo-${start}`,
            startIndex: start,
            diaGrupo: Math.floor(start / 3) + 1,
            modalidadTurno,
            items: activeItems,
            fecha: activeItems.find(({ row }) => row.fecha)?.row.fecha || groupItems.find(({ row }) => row.fecha)?.row.fecha || "",
          });
        }
      }

      return groups;
    },
    [rows, rangeFrom, rangeTo, windowRange.from, windowRange.to]
  );

  const visibleGroups = useMemo(
    () => buildGroups({ applyDateFilter: true }),
    [buildGroups]
  );

  const activeMonthGroups = useMemo(
    () => buildGroups({ applyDateFilter: false }),
    [buildGroups]
  );

  const visibleRows = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups]
  );

  const filteredRows = useMemo(
    () => visibleRows.map((item) => item.row),
    [visibleRows]
  );

  const activeMonthRows = useMemo(
    () => activeMonthGroups.flatMap((group) => group.items.map((item) => item.row)),
    [activeMonthGroups]
  );

  // Total calculado por cada fecha visible.
  const visibleDailyTotals = useMemo(
    () =>
      visibleGroups.map((group) => ({
        key: group.key,
        fecha: group.fecha,
        totals: sumRows(group.items.map((item) => item.row)),
      })),
    [visibleGroups, factorsByMonth, getFactorsForRow]
  );

  const rowsNormalizadas = useMemo(() => {
    const output = [];

    for (let start = 0; start < rows.length; start += 3) {
      const groupRows = rows.slice(start, start + 3);
      const modalidadTurno = groupRows.some((row) => isTurno12HorasValue(row.turno)) ? "12H" : "8H";
      const fechaGrupo = groupRows.find((row) => row.fecha)?.fecha || "";
      const diaGrupo = Math.floor(start / 3) + 1;

      groupRows.forEach((row, offset) => {
        output.push(
          buildTurnoPayload(row, {
            diaGrupo,
            modalidadTurno,
            posicionTurnoDia: offset + 1,
            fechaGrupo,
          })
        );
      });
    }

    return output;
  }, [rows, factorsByMonth, getFactorsForRow]);

  const rowsActivas = useMemo(() => rowsNormalizadas.filter((row) => row.activo), [rowsNormalizadas]);

  const diasPayload = useMemo(
    () =>
      activeMonthGroups.map((group) => ({
        diaGrupo: group.diaGrupo,
        fecha: group.fecha,
        modalidadTurno: group.modalidadTurno,
        turnos: group.items.map((item) =>
          buildTurnoPayload(item.row, {
            diaGrupo: group.diaGrupo,
            modalidadTurno: group.modalidadTurno,
            posicionTurnoDia: item.posicionTurnoDia,
            fechaGrupo: group.fecha,
          })
        ),
        totals: sumRows(group.items.map((item) => item.row)),
      })),
    [activeMonthGroups, factorsByMonth, getFactorsForRow]
  );

  const totals = useMemo(
    () => sumDailyTotals(visibleDailyTotals.map((day) => day.totals)),
    [visibleDailyTotals]
  );

  const negativeValidation = useMemo(() => {
    const inputCells = {};
    const formulaCells = {};
    const dailyCells = {};
    const accumulatedCells = {};
    const rowsWithAlert = {};
    const incidents = [];

    visibleGroups.forEach((group) => {
      group.items.forEach(({ row, originalIndex }) => {
        NEGATIVE_PAIR_RULES.forEach((rule) => {
          const start = n(row?.[rule.startKey]);
          const end = n(row?.[rule.endKey]);

          if (start === null || end === null) return;

          const variation =
            rule.mode === "startMinusFinal"
              ? start - end
              : end - start;

          if (!Number.isFinite(variation) || variation >= 0) return;

          const turnoLabel = normalizeTurnoValue(row?.turno) || "turno sin definir";
          const fechaLabel = row?.fecha || group.fecha || "fecha sin definir";
          const expected =
            rule.mode === "startMinusFinal"
              ? "Para calcular consumo por niveles, el nivel inicial debería ser mayor o igual al nivel final."
              : "La lectura final debería ser mayor o igual a la lectura inicial.";

          const alert = {
            title: `Posible inconsistencia · ${rule.section}`,
            description: `${fechaLabel} · ${turnoLabel}. Inicio: ${fmt(
              start,
              4
            )}; final: ${fmt(end, 4)}. La variación resultante es ${fmt(
              variation,
              4
            )}.`,
            formula: expected,
            section: rule.section,
            fecha: fechaLabel,
            turno: turnoLabel,
            variation,
          };

          inputCells[`${originalIndex}:${rule.startKey}`] = alert;
          inputCells[`${originalIndex}:${rule.endKey}`] = alert;
          rowsWithAlert[originalIndex] = true;

          incidents.push({
            ...alert,
            originalIndex,
          });
        });

        NEGATIVE_OPERATIONAL_KEYS.forEach((key) => {
          const value = calc(row, key);

          if (!hasCalculatedValue(value) || Number(value) >= 0) return;

          formulaCells[`${originalIndex}:${key}`] = {
            title: `Resultado negativo · ${NEGATIVE_OPERATIONAL_LABELS[key]}`,
            description: `${row?.fecha || group.fecha || "Fecha sin definir"} · ${
              normalizeTurnoValue(row?.turno) || "turno sin definir"
            }. Resultado calculado: ${fmt(value, 4)}.`,
            formula: "Revise las lecturas de origen resaltadas en rojo en esta misma fila.",
          };

          rowsWithAlert[originalIndex] = true;
        });
      });

      const dayTotal =
        visibleDailyTotals.find((day) => day.key === group.key)?.totals || {};

      NEGATIVE_OPERATIONAL_KEYS.forEach((key) => {
        const value = dayTotal?.[key];

        if (!hasCalculatedValue(value) || Number(value) >= 0) return;

        dailyCells[`${group.key}:${key}`] = {
          title: `Total diario negativo · ${NEGATIVE_OPERATIONAL_LABELS[key]}`,
          description: `${group.fecha || "Fecha sin definir"}. La suma de los turnos del día da ${fmt(
            value,
            4
          )}.`,
          formula: "Revise las filas rojas incluidas en este TOTAL DÍA.",
        };
      });
    });

    NEGATIVE_OPERATIONAL_KEYS.forEach((key) => {
      const value = totals?.[key];

      if (!hasCalculatedValue(value) || Number(value) >= 0) return;

      accumulatedCells[key] = {
        title: `Acumulado negativo · ${NEGATIVE_OPERATIONAL_LABELS[key]}`,
        description: `El acumulado del rango visible es ${fmt(value, 4)}.`,
        formula: `${rangeFrom || windowRange.from} → ${rangeTo || windowRange.to}`,
      };
    });

    const affectedDays = new Set(incidents.map((item) => item.fecha)).size;
    const affectedRows = Object.keys(rowsWithAlert).length;
    const negativeDailyTotals = Object.keys(dailyCells).length;

    return {
      inputCells,
      formulaCells,
      dailyCells,
      accumulatedCells,
      rowsWithAlert,
      incidents,
      incidentCount: incidents.length,
      affectedDays,
      affectedRows,
      negativeDailyTotals,
    };
  }, [
    visibleGroups,
    visibleDailyTotals,
    totals,
    factorsByMonth,
    getFactorsForRow,
    rangeFrom,
    rangeTo,
    windowRange.from,
    windowRange.to,
  ]);

  const savePayloads = useMemo(
    () =>
      windowMonths.map((month) => {
        const monthFactors = factorsByMonth[month] || {
          factor402: "9620",
          factor801: "139982",
        };

        return buildMonthSavePayload({
          month,
          rows: rows.filter((row) => getRowMonth(row) === month),
          factor402: monthFactors.factor402,
          factor801: monthFactors.factor801,
        });
      }),
    [rows, factorsByMonth, windowMonths]
  );

  const saveSignatures = useMemo(
    () => Object.fromEntries(savePayloads.map((payload) => [payload.mes, buildSaveSignature(payload)])),
    [savePayloads]
  );

  const saveSignatureBundle = useMemo(() => JSON.stringify(saveSignatures), [saveSignatures]);

  const hasUnsavedPayloads = useCallback((signatures) => {
    return Object.entries(signatures || {}).some(
      ([month, signature]) => signature !== lastSavedSignaturesRef.current?.[month]
    );
  }, []);

  const saveLatestPayloads = useCallback(async () => {
    const payloads = pendingPayloadsRef.current || [];
    const signatures = pendingSignaturesRef.current || {};

    const dirtyPayloads = payloads.filter(
      (payload) => signatures[payload.mes] !== lastSavedSignaturesRef.current?.[payload.mes]
    );

    if (!dirtyPayloads.length) {
      if (!isSavingRef.current) setSaveState("Autoguardado en BD");
      return;
    }

    if (isSavingRef.current) {
      saveAgainAfterCurrentRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setSaveState(`Guardando ${dirtyPayloads.length} mes(es) en BD...`);

    try {
      const response = await axios.put(
        `${totalizadoresApiUrl}/autosave-ventana`,
        {
          mesPrincipal: selectedMonth,
          registros: dirtyPayloads.map((payload) => ({
            ...payload,
            updatedAt: new Date().toISOString(),
          })),
        },
        {
          withCredentials: true,
          headers: { Accept: "application/json" },
        }
      );

      if (!response.data?.ok) {
        throw new Error(
          response.data?.message || "No se pudo autoguardar la ventana"
        );
      }

      lastSavedSignaturesRef.current = dirtyPayloads.reduce(
        (acc, payload) => ({
          ...acc,
          [payload.mes]: signatures[payload.mes],
        }),
        { ...lastSavedSignaturesRef.current }
      );

      lastAutoSaveErrorRef.current = "";
      setSaveState("Autoguardado en BD");
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudo autoguardar el mes principal y el mes anterior."
      );

      setSaveState("Error guardando BD");

      if (lastAutoSaveErrorRef.current !== message) {
        lastAutoSaveErrorRef.current = message;
        showToast("error", message);
      }
    } finally {
      isSavingRef.current = false;

      if (saveAgainAfterCurrentRef.current) {
        saveAgainAfterCurrentRef.current = false;

        if (hasUnsavedPayloads(pendingSignaturesRef.current)) {
          setTimeout(() => {
            saveLatestPayloads();
          }, 0);
        }
      }
    }
  }, [hasUnsavedPayloads, selectedMonth, totalizadoresApiUrl]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;

    pendingPayloadsRef.current = savePayloads;
    pendingSignaturesRef.current = saveSignatures;

    if (!hasUnsavedPayloads(saveSignatures)) return;

    setSaveState("Cambios pendientes...");
    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveLatestPayloads();
    }, 500);

    return () => clearTimeout(saveTimer.current);
  }, [savePayloads, saveSignatures, saveSignatureBundle, hasUnsavedPayloads, saveLatestPayloads]);

  const flushPendingSave = useCallback(() => {
    if (!hasLoadedRef.current) return;

    pendingPayloadsRef.current = savePayloads;
    pendingSignaturesRef.current = saveSignatures;

    if (!hasUnsavedPayloads(saveSignatures)) return;

    clearTimeout(saveTimer.current);
    saveLatestPayloads();
  }, [savePayloads, saveSignatures, hasUnsavedPayloads, saveLatestPayloads]);

  const resetRangeToWindow = () => {
    setRangeFrom(windowRange.from);
    setRangeTo(windowRange.to);
  };

  const getNextSuggestedDate = useCallback(() => {
    const existingSet = new Set(rows.map((row) => row?.fecha).filter(Boolean));
    const cursor = new Date(`${windowRange.from}T00:00:00`);
    const limit = new Date(`${windowRange.to}T00:00:00`);

    while (cursor <= limit) {
      const candidate = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`;
      if (!existingSet.has(candidate)) return candidate;
      cursor.setDate(cursor.getDate() + 1);
    }

    return windowRange.to;
  }, [rows, windowRange.from, windowRange.to]);

  const addDay = useCallback(async () => {
    if (registroLoading) return;

    const existingDates = new Set(rows.map((row) => row?.fecha).filter(Boolean));
    const suggestedDate = getNextSuggestedDate();

    const result = await Swal.fire({
      icon: "question",
      title: "Agregar día",
      text: "Selecciona la fecha que deseas agregar al registro.",
      input: "date",
      inputValue: suggestedDate,
      inputAttributes: {
        min: windowRange.from,
        max: windowRange.to,
      },
      showCancelButton: true,
      confirmButtonText: "Agregar día",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1976d2",
      inputValidator: (value) => {
        if (!value) return "Selecciona una fecha.";
        if (value < windowRange.from || value > windowRange.to) {
          return "La fecha debe pertenecer al mes anterior o al mes seleccionado.";
        }
        if (existingDates.has(value)) {
          return "Ese día ya existe en la tabla.";
        }
        return null;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const fechaDia = result.value;
    const baseId = `r-${selectedMonth}-${fechaDia}-manual-${Date.now()}`;
    const dayRows = [1, 2, 3].map((turnoIndex) => blankRow(`${baseId}-${turnoIndex}`, fechaDia));

    setRows((prev) => {
      let insertAt = prev.length;

      for (let start = 0; start < prev.length; start += 3) {
        const groupDate = prev[start]?.fecha || "";
        if (groupDate && groupDate > fechaDia) {
          insertAt = start;
          break;
        }
      }

      const next = [...prev.slice(0, insertAt), ...dayRows, ...prev.slice(insertAt)];
      return applyTurno12HorasRules(next);
    });

    if (!rangeFrom || fechaDia < rangeFrom) setRangeFrom(fechaDia);
    if (!rangeTo || fechaDia > rangeTo) setRangeTo(fechaDia);

    setSaveState("Día agregado · diligencia información");
    showToast("success", `Día ${fechaDia} agregado`);
  }, [getNextSuggestedDate, rangeFrom, rangeTo, registroLoading, rows, selectedMonth, windowRange.from, windowRange.to]);

  const deleteDay = useCallback(
    async (group) => {
      if (registroLoading) return;

      const startIndex = Number(group?.startIndex ?? -1);
      if (startIndex < 0) return;

      const rowsDelDia = rows.slice(startIndex, startIndex + 3);
      const fechaDia = group?.fecha || rowsDelDia.find((row) => row?.fecha)?.fecha || "sin fecha";
      const tieneDatos = dayGroupHasOperationalData(rowsDelDia);

      const result = await Swal.fire({
        icon: tieneDatos ? "warning" : "question",
        title: "¿Eliminar este día?",
        html: `
          <div style="text-align:left">
            <b>Fecha:</b> ${fechaDia}<br/><br/>
            Se eliminarán las 3 filas asociadas al día seleccionado.<br/>
            ${tieneDatos ? "<b>Advertencia:</b> este día contiene información diligenciada." : "Este día no contiene datos operativos."}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar día",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d32f2f",
      });

      if (!result.isConfirmed) return;

      setRows((prev) => prev.filter((_, index) => index < startIndex || index >= startIndex + 3));
      setSaveState("Día eliminado · guardando...");
      showToast("success", `Día ${fechaDia} eliminado`);
    },
    [registroLoading, rows]
  );

  const normalizeDate = (value) => {
    const v = String(value || "").trim();
    const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return v;
  };

  const pasteFromExcel = (event, rowIndex, colIndex) => {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();

    const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.length);
    setRows((prev) => {
      const next = [...prev];
      lines.forEach((line, rOffset) => {
        const targetRow = rowIndex + rOffset;
        if (!next[targetRow]) next[targetRow] = blankRow(`r-${selectedMonth}-${Date.now()}-${targetRow}`);

        line.split("\t").forEach((cell, cOffset) => {
          const col = visualColumns[colIndex + cOffset];
          if (!col || col.formula) return;

          const value = col.type === "date" ? normalizeDate(cell) : col.selectTurno ? normalizeTurnoValue(cell) : cell;

          if (col.type === "date" && value && (value < windowRange.from || value > windowRange.to)) {
            return;
          }

          next[targetRow] = { ...next[targetRow], [col.key]: value };

          if (col.type === "date") {
            const groupStart = Math.floor(targetRow / 3) * 3;
            for (let index = groupStart; index < groupStart + 3; index += 1) {
              if (next[index]) next[index] = { ...next[index], fecha: value };
            }
          }

          if (col.key === "tanque1" || col.key === "tanque2") {
            const factorKey = col.key === "tanque1" ? "factor1" : "factor2";
            const tanque = getTanqueByValue(value);
            next[targetRow] = {
              ...next[targetRow],
              [col.key]: tanque?.nombre ?? value,
              [factorKey]: tanque?.factor ?? "",
            };
          }
        });
      });
      return applyTurno12HorasRules(next);
    });
  };

  const copyTable = async () => {
    try {
      const header = visualColumns.map((c) => c.label).join("\t");
      const body = [];

      visibleGroups.forEach((group) => {
        group.items.forEach(({ row }) => {
          body.push(
            visualColumns
              .map((col) => (col.formula ? calc(row, col.key) : row[col.key] ?? ""))
              .join("\t")
          );
        });

        const groupTotals = sumRows(group.items.map((item) => item.row));
        body.push(
          visualColumns
            .map((col) => (groupTotals[col.key] !== undefined ? groupTotals[col.key] : ""))
            .join("\t")
        );
      });

      body.push(
        visualColumns
          .map((col) => (totals[col.key] !== undefined ? totals[col.key] : ""))
          .join("\t")
      );

      await navigator.clipboard.writeText([registroNombre, header, ...body].join("\n"));
      setSaveState("Tabla copiada");
      showToast("success", "Tabla copiada para Excel");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo copiar la tabla",
        text: getErrorMessage(error),
      });
    }
  };

  const renderInput = (row, rowIndex, col, colIndex) => {
    const inputAlert = negativeValidation.inputCells[`${rowIndex}:${col.key}`];

    if (col.selectTurno) {
      return (
        <select
          value={row[col.key] ?? ""}
          onChange={(e) => setCell(rowIndex, col.key, e.target.value)}
          onPaste={(e) => pasteFromExcel(e, rowIndex, colIndex)}
          onBlur={flushPendingSave}
          className="excelInput excelSelect"
          disabled={registroLoading}
        >
          <option value="">Seleccione</option>
          {TURNOS.map((turno) => (
            <option key={turno} value={turno}>
              {turno}
            </option>
          ))}
        </select>
      );
    }

    if (col.selectTanque) {
      const selectedTanque = getTanqueByValue(row[col.key]);
      const currentValue = selectedTanque?.nombre ?? row[col.key] ?? "";
      const exists = tanqueOptions.some((t) => t.nombre === currentValue);

      return (
        <select
          value={currentValue}
          onChange={(e) => setCell(rowIndex, col.key, e.target.value)}
          onPaste={(e) => pasteFromExcel(e, rowIndex, colIndex)}
          onBlur={flushPendingSave}
          className="excelInput excelSelect"
          title={selectedTanque?.factor ? `Factor: ${selectedTanque.factor}` : ""}
          disabled={registroLoading}
        >
          <option value="">Seleccione</option>
          {currentValue && !exists && <option value={currentValue}>{currentValue}</option>}
          {tanqueOptions.map((tanque) => (
            <option key={`${tanque.id}-${tanque.nombre}`} value={tanque.nombre}>
              {tanque.factor ? `${tanque.nombre} · Factor ${tanque.factor}` : tanque.nombre}
            </option>
          ))}
        </select>
      );
    }

    const input = (
      <input
        value={row[col.key] ?? ""}
        type={col.type === "date" ? "date" : "text"}
        inputMode={col.type === "date" ? undefined : "decimal"}
        min={col.type === "date" ? windowRange.from : undefined}
        max={col.type === "date" ? windowRange.to : undefined}
        onChange={(e) => setCell(rowIndex, col.key, e.target.value)}
        onPaste={(e) => pasteFromExcel(e, rowIndex, colIndex)}
        onBlur={flushPendingSave}
        onFocus={(e) => e.currentTarget.select()}
        className={`excelInput ${inputAlert ? "negativeInput" : ""}`}
        aria-invalid={Boolean(inputAlert)}
        disabled={registroLoading}
      />
    );

    if (!inputAlert) return input;

    return (
      <ProfessionalTooltip
        title={inputAlert.title}
        description={inputAlert.description}
        formula={inputAlert.formula}
        placement="top"
      >
        <span className="inputAlertWrapper">{input}</span>
      </ProfessionalTooltip>
    );
  };

  const renderTotalRow = (group) => {
    const groupTotals =
      visibleDailyTotals.find((day) => day.key === group.key)?.totals ||
      sumRows(group.items.map((item) => item.row));

    return (
      <tr className="totalRow" key={`total-${group.startIndex}`}>
        {visualColumns.map((col, colIndex) => {
          const value = groupTotals[col.key] !== undefined ? groupTotals[col.key] : "";
          const dailyAlert = negativeValidation.dailyCells[`${group.key}:${col.key}`];
          const groupHasNegative = NEGATIVE_OPERATIONAL_KEYS.some(
            (key) => negativeValidation.dailyCells[`${group.key}:${key}`]
          );

          return (
            <td
              key={col.key}
              style={{ minWidth: col.w }}
              className={[
                col.formula ? "formulaCell" : "",
                dailyAlert ? "negativeDailyCell" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {colIndex === 0 ? (
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                  <span>{groupHasNegative ? "⚠ TOTAL DÍA" : "TOTAL DÍA"}</span>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={() => deleteDay(group)}
                    disabled={registroLoading}
                    sx={{ minWidth: 0, px: 0.75, py: 0.1, fontSize: 10, lineHeight: 1.1, fontWeight: 900 }}
                  >
                    Eliminar
                  </Button>
                </Stack>
              ) : dailyAlert ? (
                <ProfessionalTooltip
                  title={dailyAlert.title}
                  description={dailyAlert.description}
                  formula={dailyAlert.formula}
                  placement="top"
                >
                  <span className="alertCellContent">{fmtFormula(value, col)}</span>
                </ProfessionalTooltip>
              ) : (
                fmtFormula(value, col)
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: "#f5f7fb", minHeight: "100vh" }}>
      <Paper
        elevation={0}
        sx={{
          p: headerExpanded
            ? { xs: 1.5, md: 2 }
            : { xs: 1.1, md: 1.35 },
          borderRadius: 3.5,
          border: "1px solid #dbe3ef",
          bgcolor: "#ffffff",
          mb: 1.25,
          mt: 4.5,
          boxShadow: "0 8px 24px rgba(15, 42, 78, 0.045)",
        }}
      >
        <Stack spacing={1.5}>
          {/* Encabezado principal y estados */}
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Box sx={{ minWidth: 260 }}>
              <Typography
                variant="h5"
                fontWeight={900}
                color="#0b376d"
                lineHeight={1.08}
                sx={{ letterSpacing: "-0.3px" }}
              >
                Seguimiento Totalizadores U400
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ display: "block", mt: 0.55 }}
              >
                Ventana operativa: {formatMonthLabel(twoMonthWindow.previous)} —{" "}
                {formatMonthLabel(twoMonthWindow.current)}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              justifyContent={{ xs: "flex-start", lg: "flex-end" }}
              flexWrap="wrap"
              useFlexGap
            >
              <ProfessionalTooltip
                title="Estado de sincronización"
                description={
                  registroLoading
                    ? "El módulo está consultando la información guardada en MongoDB."
                    : `Estado actual: ${saveState}. Los cambios se guardan automáticamente.`
                }
                formula="Una sola operación de autoguardado para los meses modificados"
              >
                <Chip
                  size="small"
                  label={registroLoading ? "Cargando registro..." : saveState}
                  color={
                    saveState.startsWith("Guardando") || registroLoading
                      ? "warning"
                      : saveState === "Error guardando BD" ||
                          saveState === "Sin conexión con BD"
                        ? "error"
                        : "success"
                  }
                  variant="outlined"
                  sx={{
                    cursor: "help",
                    fontWeight: 750,
                    bgcolor: "#ffffff",
                  }}
                />
              </ProfessionalTooltip>

              <ProfessionalTooltip
                title="Catálogo de tanques"
                description={
                  tanquesError
                    ? `No fue posible consultar el catálogo: ${tanquesError}.`
                    : `Se encuentran disponibles ${tanqueOptions.length} tanques para seleccionar en las columnas de consumo por niveles.`
                }
                formula="El factor del tanque se carga automáticamente al seleccionarlo"
              >
                <Chip
                  size="small"
                  label={
                    tanquesLoading
                      ? "Cargando tanques..."
                      : tanquesError || `${tanqueOptions.length} tanques`
                  }
                  color={tanquesError ? "warning" : "primary"}
                  variant="outlined"
                  sx={{
                    cursor: "help",
                    fontWeight: 750,
                    bgcolor: "#ffffff",
                  }}
                />
              </ProfessionalTooltip>

              <ProfessionalTooltip
                title="Ventana de análisis"
                description={`La tabla contiene ${formatMonthLabel(
                  twoMonthWindow.previous
                )} y ${formatMonthLabel(
                  twoMonthWindow.current
                )}. Los acumulados responden al rango Desde/Hasta actualmente visible.`}
                formula={`${rangeFrom || windowRange.from} → ${
                  rangeTo || windowRange.to
                }`}
              >
                <Chip
                  size="small"
                  label={`${formatMonthLabel(
                    twoMonthWindow.previous
                  )} + ${formatMonthLabel(twoMonthWindow.current)}`}
                  color="secondary"
                  variant="outlined"
                  sx={{
                    cursor: "help",
                    fontWeight: 750,
                    bgcolor: "#ffffff",
                  }}
                />
              </ProfessionalTooltip>

              <ProfessionalTooltip
                title={
                  negativeValidation.incidentCount
                    ? "Validación operativa con alertas"
                    : "Validación operativa correcta"
                }
                description={
                  negativeValidation.incidentCount
                    ? `Se detectaron ${negativeValidation.incidentCount} secuencias de lectura inconsistentes en ${negativeValidation.affectedRows} fila(s) y ${negativeValidation.affectedDays} día(s) del rango visible. Las celdas rojas muestran el origen del cálculo.`
                    : "No se detectaron consumos operativos negativos en las lecturas visibles."
                }
                formula={
                  negativeValidation.incidentCount
                    ? `${negativeValidation.negativeDailyTotals} TOTAL DÍA negativo(s) derivados de las lecturas marcadas`
                    : `${rangeFrom || windowRange.from} → ${
                        rangeTo || windowRange.to
                      }`
                }
              >
                <Chip
                  size="small"
                  label={
                    negativeValidation.incidentCount
                      ? `${negativeValidation.incidentCount} alerta(s) negativa(s)`
                      : "Sin valores negativos"
                  }
                  color={negativeValidation.incidentCount ? "error" : "success"}
                  variant={
                    negativeValidation.incidentCount ? "filled" : "outlined"
                  }
                  sx={{
                    cursor: "help",
                    fontWeight: 850,
                    ...(negativeValidation.incidentCount
                      ? {
                          boxShadow:
                            "0 4px 12px rgba(211, 47, 47, 0.18)",
                        }
                      : {
                          bgcolor: "#ffffff",
                        }),
                  }}
                />
              </ProfessionalTooltip>

              <Tooltip
                arrow
                title={
                  headerExpanded
                    ? "Ocultar filtros, factores y acciones"
                    : "Mostrar filtros, factores y acciones"
                }
              >
                <IconButton
                  size="small"
                  onClick={() => setHeaderExpanded((prev) => !prev)}
                  aria-label={
                    headerExpanded
                      ? "Contraer encabezado"
                      : "Expandir encabezado"
                  }
                  sx={{
                    width: 30,
                    height: 30,
                    ml: 0.25,
                    border: "1px solid #c9d5e5",
                    bgcolor: headerExpanded ? "#f8fafc" : "#eef5ff",
                    color: "#245ea8",
                    "&:hover": {
                      bgcolor: "#e8f1fd",
                      borderColor: "#8fb4e3",
                    },
                  }}
                >
                  {headerExpanded ? (
                    <KeyboardArrowUpRoundedIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Collapse in={headerExpanded} timeout="auto" unmountOnExit>
            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              <Divider sx={{ borderColor: "#e6ebf2" }} />

          {/* Controles organizados por función */}
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={1.25}
            alignItems="stretch"
          >
            {/* Consulta */}
            <Box
              sx={{
                flex: 1.35,
                minWidth: 0,
                p: 1.25,
                borderRadius: 2.5,
                border: "1px solid #e0e7f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: 0.8,
                  color: "#51657d",
                  fontWeight: 900,
                  fontSize: 10.5,
                  lineHeight: 1,
                  letterSpacing: 0.8,
                }}
              >
                Consulta y rango
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  select
                  size="small"
                  label="Mes principal"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ minWidth: { xs: "100%", sm: 185 } }}
                  disabled={registroLoading}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.key} value={option.key}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Desde"
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value &&
                      (value < windowRange.from || value > windowRange.to)
                    )
                      return;
                    setRangeFrom(value);
                    if (value && rangeTo && value > rangeTo) {
                      setRangeTo(value);
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: windowRange.from,
                    max: windowRange.to,
                  }}
                  sx={{ minWidth: { xs: "100%", sm: 150 } }}
                  disabled={registroLoading}
                />

                <TextField
                  size="small"
                  label="Hasta"
                  type="date"
                  value={rangeTo}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value &&
                      (value < windowRange.from || value > windowRange.to)
                    )
                      return;
                    setRangeTo(value);
                    if (value && rangeFrom && value < rangeFrom) {
                      setRangeFrom(value);
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: windowRange.from,
                    max: windowRange.to,
                  }}
                  sx={{ minWidth: { xs: "100%", sm: 150 } }}
                  disabled={registroLoading}
                />

                <Tooltip arrow title="Restablecer el rango completo de los dos meses">
                  <span>
                    <IconButton
                      onClick={resetRangeToWindow}
                      disabled={registroLoading}
                      aria-label="Restablecer rango"
                      sx={{
                        width: 40,
                        height: 40,
                        border: "1px solid #b9c8dc",
                        bgcolor: "#ffffff",
                        color: "#245ea8",
                        flexShrink: 0,
                        "&:hover": {
                          bgcolor: "#eef5ff",
                          borderColor: "#75a4df",
                        },
                      }}
                    >
                      <RestartAltRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>

            {/* Factores */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                p: 1.25,
                borderRadius: 2.5,
                border: "1px solid #e0e7f0",
                bgcolor: "#fbfaf7",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: 0.8,
                  color: "#6b6252",
                  fontWeight: 900,
                  fontSize: 10.5,
                  lineHeight: 1,
                  letterSpacing: 0.8,
                }}
              >
                Factores por mes
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  select
                  size="small"
                  label="Factores de"
                  value={factorEditMonth}
                  onChange={(e) => setFactorEditMonth(e.target.value)}
                  sx={{ minWidth: { xs: "100%", sm: 165 } }}
                  disabled={registroLoading}
                >
                  {windowMonths.map((month) => (
                    <MenuItem key={month} value={month}>
                      {formatMonthLabel(month)}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Factor TK402"
                  value={factor402}
                  onChange={(e) =>
                    updateFactorForMonth(
                      factorEditMonth,
                      "factor402",
                      e.target.value
                    )
                  }
                  sx={{ minWidth: { xs: "100%", sm: 135 } }}
                  disabled={registroLoading}
                />

                <TextField
                  size="small"
                  label="Factor 801A/B"
                  value={factor801}
                  onChange={(e) =>
                    updateFactorForMonth(
                      factorEditMonth,
                      "factor801",
                      e.target.value
                    )
                  }
                  sx={{ minWidth: { xs: "100%", sm: 145 } }}
                  disabled={registroLoading}
                />
              </Stack>
            </Box>

            {/* Acciones */}
            <Box
              sx={{
                minWidth: { xs: "100%", xl: 142 },
                p: 1.25,
                borderRadius: 2.5,
                border: "1px solid #e0e7f0",
                bgcolor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: 0.8,
                  color: "#51657d",
                  fontWeight: 900,
                  fontSize: 10.5,
                  lineHeight: 1,
                  letterSpacing: 0.8,
                }}
              >
                Acciones
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip
                  arrow
                  title="Copiar la tabla visible en formato compatible con Excel"
                >
                  <span>
                    <IconButton
                      onClick={copyTable}
                      disabled={registroLoading}
                      aria-label="Copiar tabla"
                      sx={{
                        width: 40,
                        height: 40,
                        border: "1px solid #1976d2",
                        bgcolor: "#1976d2",
                        color: "#ffffff",
                        boxShadow:
                          "0 5px 12px rgba(25, 118, 210, 0.18)",
                        "&:hover": {
                          bgcolor: "#125da8",
                        },
                      }}
                    >
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip arrow title="Agregar un día manualmente">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={addDay}
                      disabled={registroLoading}
                      aria-label="Agregar día"
                      sx={{
                        width: 40,
                        height: 40,
                        border: "1px solid #1976d2",
                        bgcolor: "#ffffff",
                        color: "#1976d2",
                        "&:hover": {
                          bgcolor: "#eef6ff",
                        },
                      }}
                    >
                      <AddCircleOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>
          </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mb: 1.25,
          px: 1.4,
          py: 1,
          borderRadius: 2.75,
          border: "1px solid #dde3ef",
          bgcolor: "#ffffff",
          boxShadow: "0 5px 16px rgba(15, 42, 78, 0.035)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={900}
              color="#17324d"
              lineHeight={1.15}
            >
              Indicadores del rango
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              {rangeFrom || windowRange.from} — {rangeTo || windowRange.to}
            </Typography>
          </Box>

          <Tooltip
            arrow
            title={
              kpisExpanded
                ? "Ocultar indicadores para ampliar la tabla"
                : "Mostrar indicadores del rango"
            }
          >
            <IconButton
              size="small"
              onClick={() => setKpisExpanded((prev) => !prev)}
              aria-label={
                kpisExpanded
                  ? "Contraer indicadores"
                  : "Expandir indicadores"
              }
              sx={{
                width: 32,
                height: 32,
                border: "1px solid #c9d5e5",
                bgcolor: kpisExpanded ? "#f8fafc" : "#eef5ff",
                color: "#245ea8",
                "&:hover": {
                  bgcolor: "#e8f1fd",
                  borderColor: "#8fb4e3",
                },
              }}
            >
              {kpisExpanded ? (
                <KeyboardArrowUpRoundedIcon fontSize="small" />
              ) : (
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={kpisExpanded} timeout="auto" unmountOnExit>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.0}
            sx={{
              mt: 1.1,
              overflowX: "auto",
              pb: 0.35,
            }}
          >
        <Kpi
          title="Acum REN Totalizador"
          value={fmt(totals.renConsumo, 2)}
          tooltip={KPI_TOOLTIPS.renConsumo}
          alert={negativeValidation.accumulatedCells.renConsumo}
        />
        <Kpi
          title="Acum Prod Totalizador"
          value={fmt(totals.prodTotal, 2)}
          tooltip={KPI_TOOLTIPS.prodTotal}
          alert={negativeValidation.accumulatedCells.prodTotal}
        />
        <Kpi
          title="Acum TK402A/B"
          value={fmt(totals.tk402Total, 2)}
          tooltip={KPI_TOOLTIPS.tk402Total}
          alert={negativeValidation.accumulatedCells.tk402Total}
        />
        {/* <Kpi title="Acumulado REN niveles" value={fmt(totals.renNivelTotal, 2)} /> */}
        <Kpi
          title="Acum Traslado 801A/B"
          value={fmt(totals.ab801Total, 2)}
          tooltip={KPI_TOOLTIPS.ab801Total}
          alert={negativeValidation.accumulatedCells.ab801Total}
        />
        <Kpi
          title="Dif REN/Niveles"
          value={fmt(totals.difRenNiveles, 2)}
          tooltip={KPI_TOOLTIPS.difRenNiveles}
        />
        <Kpi
          title="% ERROR REN/Niveles"
          value={fmtPct(totals.errorRenNivelesPct)}
          tooltip={KPI_TOOLTIPS.errorRenNivelesPct}
        />
        <Kpi
          title="% ERROR PROD/TK402"
          value={fmtPct(totals.errorTrasladoPct)}
          tooltip={KPI_TOOLTIPS.errorTrasladoPct}
        />
        <Kpi
          title="% ERROR Totalizadores"
          value={fmtPct(totals.errorTotalizadoresPct)}
          tooltip={KPI_TOOLTIPS.errorTotalizadoresPct}
        />
        <Kpi
          title="Fc por totalizador"
          value={fmt(totals.fcPorTotalizador, 4)}
          tooltip={KPI_TOOLTIPS.fcPorTotalizador}
        />
        <Kpi
          title="Fc REN/Niveles"
          value={fmt(totals.fcRenNiveles, 4)}
          tooltip={KPI_TOOLTIPS.fcRenNiveles}
        />
          </Stack>
        </Collapse>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #dde3ef", overflow: "hidden" }}>
        <Box
          className="tableWrap"
          sx={{
            maxHeight:
              headerExpanded && kpisExpanded
                ? "calc(100vh - 455px)"
                : headerExpanded
                  ? "calc(100vh - 330px)"
                  : kpisExpanded
                    ? "calc(100vh - 335px)"
                    : "calc(100vh - 215px)",
            transition: "max-height 220ms ease",
          }}
        >
          <table className="excelTable">
            <thead>
              <tr>
                {groupHeaders.map((g) => (
                  <th key={g.label} colSpan={g.span} className={`groupHeader ${g.className}`}>
                    {g.label === "Factor TK402"
                      ? "Factor TK402 por mes"
                      : g.label === "801A/B"
                        ? "801A/B · factor por mes"
                        : g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {visualColumns.map((col) => (
                  <th key={col.key} style={{ minWidth: col.w }} className={col.formula ? "formulaHead" : ""}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={visualColumns.length} className="emptyCell">
                    {registroLoading ? "Cargando información del mes..." : "No hay filas para el rango seleccionado."}
                  </td>
                </tr>
              )}

              {visibleGroups.map((group) => (
                <React.Fragment key={group.key}>
                  {group.items.map(({ row, originalIndex }) => (
                    <tr
                      key={row.id || originalIndex}
                      className={
                        negativeValidation.rowsWithAlert[originalIndex]
                          ? "rowWithNegativeAlert"
                          : ""
                      }
                    >
                      {visualColumns.map((col, colIndex) => {
                        const formulaAlert =
                          negativeValidation.formulaCells[
                            `${originalIndex}:${col.key}`
                          ];
                        const value = col.formula ? calc(row, col.key) : "";

                        return (
                          <td
                            key={col.key}
                            style={{ minWidth: col.w }}
                            className={[
                              col.formula ? "formulaCell" : "editableCell",
                              formulaAlert ? "negativeFormulaCell" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {col.formula ? (
                              formulaAlert ? (
                                <ProfessionalTooltip
                                  title={formulaAlert.title}
                                  description={formulaAlert.description}
                                  formula={formulaAlert.formula}
                                  placement="top"
                                >
                                  <span className="alertCellContent">
                                    {fmtFormula(value, col)}
                                  </span>
                                </ProfessionalTooltip>
                              ) : (
                                fmtFormula(value, col)
                              )
                            ) : (
                              renderInput(row, originalIndex, col, colIndex)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {renderTotalRow(group)}
                </React.Fragment>
              ))}

              <tr className="accRow">
                {visualColumns.map((col, index) => {
                  const accumulatedAlert =
                    negativeValidation.accumulatedCells[col.key];

                  return (
                    <td
                      key={col.key}
                      style={{ minWidth: col.w }}
                      className={[
                        col.formula ? "formulaCell" : "",
                        accumulatedAlert ? "negativeAccumulatedCell" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {index === 0 ? (
                        "ACUMULADO"
                      ) : accumulatedAlert ? (
                        <ProfessionalTooltip
                          title={accumulatedAlert.title}
                          description={accumulatedAlert.description}
                          formula={accumulatedAlert.formula}
                          placement="top"
                        >
                          <span className="alertCellContent">
                            {fmtFormula(totals[col.key], col)}
                          </span>
                        </ProfessionalTooltip>
                      ) : totals[col.key] !== undefined ? (
                        fmtFormula(totals[col.key], col)
                      ) : (
                        ""
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </Box>
      </Paper>

      <style>{`
        .tableWrap {
          max-height: calc(100vh - 330px);
          overflow: auto;
          background: white;
        }
        .excelTable {
          border-collapse: collapse;
          width: max-content;
          min-width: 100%;
          font-size: 12px;
        }
        .excelTable th,
        .excelTable td {
          border: 1px solid #cfd8e3;
          height: 34px;
          padding: 0;
          text-align: center;
          white-space: nowrap;
        }
        .excelTable thead th {
          position: sticky;
          top: 0;
          z-index: 5;
          color: #102a43;
          font-weight: 800;
        }
        .excelTable thead tr:nth-of-type(2) th {
          top: 34px;
          background: #eef3f8;
        }
        .groupHeader {
          height: 34px;
          letter-spacing: .2px;
        }
        .gBlue { background: #dcecff; }
        .gGreen { background: #ddf6e7; }
        .gYellow { background: #fff2cc; }
        .gPurple { background: #eadffd; }
        .gOrange { background: #ffe2cc; }
        .gRed { background: #ffe4e6; }
        .gTeal { background: #d9f7f2; }
        .formulaHead { background: #e8edf5 !important; }
        .excelInput {
          width: 100%;
          height: 33px;
          border: 0;
          outline: none;
          padding: 0 8px;
          text-align: center;
          font: inherit;
          background: #fff;
          box-sizing: border-box;
        }
        .excelInput:disabled {
          background: #f1f5f9;
          color: #64748b;
        }
        .excelSelect {
          cursor: pointer;
          text-align-last: center;
        }
        .excelInput:focus {
          background: #fffbe6;
          box-shadow: inset 0 0 0 2px #1976d2;
        }
        .formulaCell {
          background: #f3f6fa;
          color: #17324d;
          font-weight: 700;
          padding: 0 8px !important;
        }
        .inputAlertWrapper {
          display: block;
          width: 100%;
          height: 100%;
        }
        .negativeInput {
          background: #fff1f2 !important;
          color: #991b1b !important;
          font-weight: 800 !important;
          box-shadow: inset 0 0 0 1.5px #ef4444 !important;
          cursor: help;
        }
        .negativeInput:focus {
          background: #ffe4e6 !important;
          box-shadow: inset 0 0 0 2px #dc2626 !important;
        }
        .negativeFormulaCell {
          background: #fee2e2 !important;
          color: #991b1b !important;
          box-shadow: inset 0 0 0 1.5px #ef4444;
        }
        .negativeDailyCell {
          background: #fecaca !important;
          color: #7f1d1d !important;
          box-shadow: inset 0 0 0 1.5px #dc2626;
        }
        .negativeAccumulatedCell {
          background: #7f1d1d !important;
          color: #ffffff !important;
          box-shadow: inset 0 0 0 2px #fca5a5;
        }
        .alertCellContent {
          display: flex;
          width: 100%;
          min-height: 33px;
          align-items: center;
          justify-content: center;
          cursor: help;
          font-weight: 900;
        }
        .rowWithNegativeAlert td:first-child {
          border-left: 4px solid #ef4444 !important;
        }
        .totalRow td {
          background: #eaf2ff;
          color: #0b376d;
          font-weight: 800;
        }
        .accRow td {
          position: sticky;
          bottom: 0;
          z-index: 4;
          background: #17324d;
          color: white;
          font-weight: 900;
          height: 38px;
        }
        .editableCell:hover .excelInput {
          background: #f8fbff;
        }
        .emptyCell {
          height: 54px !important;
          color: #64748b;
          font-weight: 700;
          background: #f8fafc;
        }
      `}</style>
    </Box>
  );
}

function ProfessionalTooltip({
  title,
  description,
  formula,
  children,
  placement = "bottom",
}) {
  return (
    <Tooltip
      arrow
      placement={placement}
      enterDelay={250}
      enterNextDelay={100}
      leaveDelay={80}
      title={
        <Box sx={{ maxWidth: 310, py: 0.35 }}>
          <Typography
            component="div"
            sx={{
              fontSize: 12.5,
              lineHeight: 1.25,
              fontWeight: 800,
              color: "#ffffff",
              mb: 0.65,
            }}
          >
            {title}
          </Typography>

          <Typography
            component="div"
            sx={{
              fontSize: 11.5,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {description}
          </Typography>

          {formula && (
            <Box
              sx={{
                mt: 1,
                px: 1,
                py: 0.7,
                borderRadius: 1.25,
                bgcolor: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Typography
                component="div"
                sx={{
                  fontSize: 10,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.45,
                  color: "rgba(255,255,255,0.62)",
                  mb: 0.35,
                }}
              >
                Cálculo / alcance
              </Typography>
              <Typography
                component="div"
                sx={{
                  fontSize: 11,
                  lineHeight: 1.35,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {formula}
              </Typography>
            </Box>
          )}
        </Box>
      }
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: "#172b4d",
            px: 1.35,
            py: 1.15,
            borderRadius: 2,
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.24)",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        },
        arrow: {
          sx: {
            color: "#172b4d",
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
}

function Kpi({ title, value, tooltip, alert }) {
  const activeTooltip = alert || tooltip;

  const card = (
    <Paper
      elevation={0}
      sx={{
        minWidth: 170,
        flex: 1,
        p: 1.5,
        borderRadius: 2.5,
        border: alert ? "1px solid #ef4444" : "1px solid #dde3ef",
        bgcolor: alert ? "#fff1f2" : "#ffffff",
        cursor: activeTooltip ? "help" : "default",
        boxShadow: alert ? "0 6px 18px rgba(220, 38, 38, 0.10)" : "none",
        transition:
          "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
        "&:hover": activeTooltip
          ? {
              transform: "translateY(-1px)",
              borderColor: alert ? "#dc2626" : "#b9c8dc",
              boxShadow: alert
                ? "0 8px 22px rgba(220, 38, 38, 0.16)"
                : "0 6px 18px rgba(30, 64, 175, 0.08)",
            }
          : undefined,
      }}
    >
      <Typography
        variant="caption"
        color={alert ? "#991b1b" : "text.secondary"}
        fontWeight={800}
      >
        {alert ? "⚠ " : ""}
        {title}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={900}
        color={alert ? "#991b1b" : "#12345b"}
        lineHeight={1.2}
      >
        {value || "0"}
      </Typography>
    </Paper>
  );

  if (!activeTooltip) return card;

  return (
    <ProfessionalTooltip
      title={activeTooltip.title}
      description={activeTooltip.description}
      formula={activeTooltip.formula}
      placement="top"
    >
      {card}
    </ProfessionalTooltip>
  );
}
