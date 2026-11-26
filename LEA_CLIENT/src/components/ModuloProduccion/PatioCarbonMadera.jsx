import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Download,
  FilterAlt,
  Forest,
  Inventory2,
  TrendingDown,
  TrendingUp,
  WarningAmber,
} from "@mui/icons-material";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import MonthlyExcelSheet, {
  calculateDailyCarbon,
  calculateMonthlyTotals,
  createMonthlySheet,
  currentMonthKey,
  formatTon,
  normalizeMonthlyRows,
} from "./utils/components/tablepatiocarbontipoexcel";

import IngresosCombustiblesPlanta from "./utils/components/IngresosCombustiblesPlanta";
import ConfiguracionMaterialesCombustibles from "./utils/components/ConfiguracionMaterialesCombustibles";
import MovimientosCombustibles from "./utils/components/MovimientosCombustibles";

const getMaterialChipSx = (material) => {
  const map = {
    Carbón: {
      bgcolor: "#eff6ff",
      color: "#1e40af",
      border: "#bfdbfe",
    },
    Madera: {
      bgcolor: "#ecfdf5",
      color: "#166534",
      border: "#bbf7d0",
    },
    Bagazo: {
      bgcolor: "#fff7ed",
      color: "#9a3412",
      border: "#fed7aa",
    },
  };

  const selected = map[material] || map.Carbón;

  return {
    fontWeight: 900,
    bgcolor: selected.bgcolor,
    color: selected.color,
    border: `1px solid ${selected.border}`,
  };
};

const getMaterialIcon = (material) => {
  if (material === "Madera") return <Forest />;
  return <Inventory2 />;
};

const API_MATERIALES_COMBUSTIBLES =
  "https://ambiocomserver.onrender.com/api/materiales-combustibles";

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

const normalizeMaterialCombustible = (row = {}) => {
  const codigo = String(row.codigo || row.id || row._id || "").trim();

  return {
    _id: row._id || row.mongoId || "",
    mongoId: row.mongoId || row._id || "",
    id: codigo,
    codigo,
    name: row.name || row.nombre || codigo || "Sin nombre",
    material: row.material || "Carbón",
    weightCV: Number(row.weightCV || 0),
    weightCN: Number(row.weightCN || 0),
    initialTon: Number(row.initialTon || 0),
    stockMinimoTon: Number(row.stockMinimoTon || 0),
    active: normalizeActiveFlag(row.active),
    observacion: row.observacion || "",
  };
};

const toneMap = {
  primary: {
    main: "#1e40af",
    dark: "#1e3a8a",
    soft: "#eff6ff",
    border: "#bfdbfe",
  },
  success: {
    main: "#166534",
    dark: "#14532d",
    soft: "#ecfdf5",
    border: "#bbf7d0",
  },
  warning: {
    main: "#9a3412",
    dark: "#7c2d12",
    soft: "#fff7ed",
    border: "#fed7aa",
  },
  error: {
    main: "#991b1b",
    dark: "#7f1d1d",
    soft: "#fef2f2",
    border: "#fecaca",
  },
  slate: {
    main: "#0f172a",
    dark: "#020617",
    soft: "#f8fafc",
    border: "#cbd5e1",
  },
};

const chartColors = {
  carbonEntrada: "#2563eb",
  carbonConsumo: "#dc2626",
  carbonAjuste: "#7c3aed",

  maderaEntrada: "#16a34a",
  maderaConsumo: "#ea580c",
  maderaAjuste: "#0891b2",

  bagazoEntrada: "#d97706",
  bagazoConsumo: "#a16207",
  bagazoAjuste: "#9333ea",

  stockOk: "#1d4ed8",
  stockLow: "#dc2626",
  stockMinimo: "#94a3b8",

  grid: "#e2e8f0",
  axis: "#475569",
};

const chartAxisSx = {
  fontSize: 12,
  fontWeight: 700,
  fill: chartColors.axis,
};

const legendStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
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

const formatChartValue = (value) => `${formatTon(value)} t`;

const hasSeriesValue = (rows = [], key) =>
  rows.some((row) => Math.abs(Number(row?.[key] || 0)) > 0.0001);

const resolveLegendColor = (entry = {}) => {
  const candidates = [entry.payload?.stroke, entry.color, entry.payload?.fill];

  return (
    candidates.find(
      (candidate) => candidate && !String(candidate).startsWith("url(")
    ) || "#64748b"
  );
};

const splitProviderLabel = (value = "", maxLength = 18, maxLines = 2) => {
  const words = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (!words.length) return [""];

  const lines = [];

  words.forEach((word) => {
    const current = lines[lines.length - 1] || "";
    const candidate = current ? `${current} ${word}` : word;

    if (!current || candidate.length <= maxLength) {
      lines[lines.length - 1] = candidate;
      return;
    }

    if (lines.length < maxLines) {
      lines.push(word);
      return;
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
  });

  return lines.slice(0, maxLines).map((line, index, array) => {
    if (index !== array.length - 1 || line.length <= maxLength + 3) return line;
    return `${line.slice(0, maxLength).trim()}…`;
  });
};

const formatInventoryLabel = (value) => {
  const number = Number(value || 0);
  if (Math.abs(number) < 0.005) return "";
  return `${formatTon(number)} t`;
};

function InventoryBarValueLabel({ x, y, width, height, value }) {
  const label = formatInventoryLabel(value);

  if (!label) return null;

  const safeX = Number(x || 0);
  const safeY = Number(y || 0);
  const safeWidth = Number(width || 0);
  const safeHeight = Number(height || 0);
  const isTinyBar = safeWidth < 42;

  return (
    <text
      x={safeX + safeWidth + 8}
      y={safeY + safeHeight / 2 + 4}
      textAnchor="start"
      fill={isTinyBar ? "#64748b" : "#0f172a"}
      fontSize={10.5}
      fontWeight={900}
    >
      {label}
    </text>
  );
}


function CenteredChartLegend({ payload = [] }) {
  const items = payload.filter((entry) => entry?.value);

  if (!items.length) return null;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 0.8,
        px: 1,
        pt: 0.25,
        pb: 1.25,
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        flexWrap: "nowrap",
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
        "&::-webkit-scrollbar": {
          height: 6,
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#cbd5e1",
          borderRadius: 999,
        },
      }}
    >
      {items.map((entry) => {
        const color = resolveLegendColor(entry);

        return (
          <Box
            key={`${entry.dataKey || entry.value}-${entry.value}`}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.65,
              flex: "0 0 auto",
              minWidth: "max-content",
              whiteSpace: "nowrap",
              px: 1.05,
              py: 0.45,
              borderRadius: 999,
              bgcolor: "rgba(248,250,252,.92)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 6px 16px rgba(15,23,42,.04)",
            }}
          >
            <Box
              sx={{
                width: 8.5,
                height: 8.5,
                borderRadius: 99,
                bgcolor: color,
                boxShadow: `0 0 0 2px rgba(255,255,255,.95), 0 0 0 3px ${color}22`,
              }}
            />

            <Typography
              component="span"
              sx={{
                ...legendStyle,
                fontSize: 11.5,
                lineHeight: 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
                color: "#0f172a",
              }}
            >
              {entry.value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function InventoryYAxisTick({ x, y, payload }) {
  const rawLabel = String(payload?.value || "Sin nombre").trim() || "Sin nombre";
  const lines = splitProviderLabel(rawLabel, 22, 3);
  const firstDy = lines.length === 1 ? 4 : lines.length === 2 ? -3 : -10;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-12}
        y={0}
        textAnchor="end"
        fill="#0f172a"
        fontSize={11.4}
        fontWeight={900}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${rawLabel}-${line}-${index}`}
            x={-12}
            dy={index === 0 ? firstDy : 12.5}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const validPayload = payload.filter(
    (item) => item?.value !== undefined && item?.value !== null
  );

  return (
    <Paper
      elevation={8}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid #dbe3ef",
        minWidth: 245,
        bgcolor: "rgba(255,255,255,.97)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography fontWeight={950} fontSize={13} color="#0f172a" mb={1}>
        Día {label}
      </Typography>

      <Stack gap={0.75}>
        {validPayload.map((entry) => (
          <Stack
            key={`${entry.name}-${entry.dataKey}`}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={0.8}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: 99,
                  bgcolor: entry.color,
                }}
              />

              <Typography fontSize={12} fontWeight={800} color="#475569">
                {entry.name}
              </Typography>
            </Stack>

            <Typography fontSize={12} fontWeight={950} color="#0f172a">
              {formatChartValue(entry.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function StockTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid #dbe3ef",
        minWidth: 220,
        bgcolor: "rgba(255,255,255,.97)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography fontWeight={950} fontSize={13} color="#0f172a" mb={1}>
        {label}
      </Typography>

      <Stack gap={0.75}>
        {payload.map((entry) => (
          <Stack
            key={`${entry.name}-${entry.dataKey}`}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={0.8}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: 99,
                  bgcolor: entry.color,
                }}
              />

              <Typography fontSize={12} fontWeight={800} color="#475569">
                {entry.name}
              </Typography>
            </Stack>

            <Typography fontSize={12} fontWeight={950} color="#0f172a">
              {formatChartValue(entry.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function calculateInventoryFromMonthly(rows, items) {
  const orderedRows = [...(rows || [])]
    .filter((row) => row?.fecha)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  return items.map((item) => {
    let previousFinal;
    let lastFinal = Number(item.initialTon || 0);
    let inicialPeriodo = Number(item.initialTon || 0);
    let hasCalculatedRow = false;

    const totals = orderedRows.reduce(
      (acc, row) => {
        const data = row.carbons?.[item.id];

        const hasPreviousFinal =
          previousFinal !== undefined && previousFinal !== null;

        const result = calculateDailyCarbon(
          data,
          item,
          hasPreviousFinal ? previousFinal : undefined
        );

        if (!hasCalculatedRow) {
          inicialPeriodo = Number(result.inicial || 0);
        }

        previousFinal = Number(result.final || 0);
        lastFinal = Number(result.final || 0);
        hasCalculatedRow = true;

        acc.entradas += Number(result.entrada || 0);
        acc.salidas += Number(result.salida || 0);
        acc.ajustes += Number(result.ajuste || 0);

        return acc;
      },
      {
        entradas: 0,
        salidas: 0,
        ajustes: 0,
      }
    );

    /*
      El stock actual ya no se reconstruye desde el inventario configurado.
      Se toma directamente el último FINAL calculado y encadenado del período
      para cada carbón, madera o bagazo.
    */
    const actualTon = hasCalculatedRow
      ? lastFinal
      : Number(item.initialTon || 0);

    const stockMinimoTon = Number(item.stockMinimoTon || 0);
    const diferenciaMinimo = actualTon - stockMinimoTon;

    const porcentajeMinimo =
      stockMinimoTon > 0
        ? (actualTon / stockMinimoTon) * 100
        : actualTon > 0
          ? 100
          : 0;

    const cobertura = Math.max(0, Math.min(100, porcentajeMinimo));

    return {
      id: item.id,
      material: item.material || "Carbón",
      proveedor:
        item.name || item.codigo || item.id || item.material || "Sin nombre",
      inicialTon: inicialPeriodo,
      stockMinimoTon,
      active: item.active,
      entradas: totals.entradas,
      salidas: totals.salidas,
      ajustes: totals.ajustes,
      actualTon,
      diferenciaMinimo,
      porcentajeMinimo,
      cobertura,
      fechaUltimoFinal:
        orderedRows.length > 0
          ? orderedRows[orderedRows.length - 1]?.fecha || ""
          : "",
    };
  });
}

function buildDailySeriesFromMovements(movements = [], dateRange = {}) {
  const desde = dateRange?.desde || "";
  const hasta = dateRange?.hasta || "";

  const grouped = movements
    .filter((movement) => {
      const fecha = movement?.fecha || "";

      if (!fecha) return false;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      return true;
    })
    .reduce((acc, movement) => {
      const fecha = movement.fecha;

      if (!acc[fecha]) {
        acc[fecha] = {
          fecha,
          entradaCarbon: 0,
          consumoCarbon: 0,
          ajusteCarbon: 0,
          entradaMadera: 0,
          consumoMadera: 0,
          ajusteMadera: 0,
          entradaBagazo: 0,
          consumoBagazo: 0,
          ajusteBagazo: 0,
        };
      }

      const cantidad = Number(movement.cantidadTon || 0);
      const material = movement.material || "Carbón";
      const tipo = movement.tipo || "Ajuste";

      if (material === "Carbón") {
        if (tipo === "Entrada") acc[fecha].entradaCarbon += cantidad;
        if (tipo === "Salida") acc[fecha].consumoCarbon += cantidad;
        if (tipo === "Ajuste") acc[fecha].ajusteCarbon += cantidad;
      }

      if (material === "Madera") {
        if (tipo === "Entrada") acc[fecha].entradaMadera += cantidad;
        if (tipo === "Salida") acc[fecha].consumoMadera += cantidad;
        if (tipo === "Ajuste") acc[fecha].ajusteMadera += cantidad;
      }

      if (material === "Bagazo") {
        if (tipo === "Entrada") acc[fecha].entradaBagazo += cantidad;
        if (tipo === "Salida") acc[fecha].consumoBagazo += cantidad;
        if (tipo === "Ajuste") acc[fecha].ajusteBagazo += cantidad;
      }

      return acc;
    }, {});

  return Object.values(grouped)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((row) => ({
      ...row,
      fechaCompleta: row.fecha,
      fecha: row.fecha.slice(5),
    }));
}

export default function ModuloSeguimientoCarbonMadera() {
  const initialMonth = currentMonthKey();
  const initialDateFrom = `${initialMonth}-01`;
  const initialDateTo = new Date().toISOString().slice(0, 10);

  const [tab, setTab] = useState(0);
  const [movements, setMovements] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [ingresosCombustiblesRows, setIngresosCombustiblesRows] = useState([]);
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [appliedDateFrom, setAppliedDateFrom] = useState(initialDateFrom);
  const [appliedDateTo, setAppliedDateTo] = useState(initialDateTo);
  const [queryVersion, setQueryVersion] = useState(0);
  const [carbons, setCarbons] = useState([]);

  const [monthlySheets, setMonthlySheets] = useState(() => ({
    [initialMonth]: createMonthlySheet(initialMonth, []),
  }));

  useEffect(() => {
    let isMounted = true;

    const loadMaterialesCombustibles = async () => {
      try {
        const response = await fetch(API_MATERIALES_COMBUSTIBLES);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `No se pudieron consultar los materiales. Estado ${response.status}`
          );
        }

        if (!isMounted) return;

        setCarbons((data.materiales || []).map(normalizeMaterialCombustible));
      } catch (error) {
        console.error("Error cargando materiales combustibles:", error);
      }
    };

    loadMaterialesCombustibles();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCarbons = useMemo(
    () => carbons.filter(isMaterialActive),
    [carbons]
  );

  const appliedDateRange = useMemo(
    () => ({
      desde: appliedDateFrom,
      hasta: appliedDateTo,
    }),
    [appliedDateFrom, appliedDateTo]
  );

  const handleMovementsChange = useCallback(
    (nextMovements = [], nextStockSummary = null) => {
      setMovements(Array.isArray(nextMovements) ? nextMovements : []);
      setStockSummary(nextStockSummary || null);
    },
    []
  );

  const handleInventorySummaryChange = useCallback((nextSummary) => {
    setInventorySummary((currentSummary) => {
      const normalizedNext = nextSummary || null;

      if (
        JSON.stringify(currentSummary) === JSON.stringify(normalizedNext)
      ) {
        return currentSummary;
      }

      return normalizedNext;
    });
  }, []);

  const monthRows = useMemo(() => {
    const existingRows =
      monthlySheets[monthKey] || createMonthlySheet(monthKey, activeCarbons);

    return normalizeMonthlyRows(existingRows, carbons);
  }, [activeCarbons, carbons, monthKey, monthlySheets]);

  const filteredMonthRows = useMemo(() => {
    return monthRows.filter((row) => {
      const fecha = row.fecha || "";

      if (!fecha) return false;
      if (appliedDateFrom && fecha < appliedDateFrom) return false;
      if (appliedDateTo && fecha > appliedDateTo) return false;

      return true;
    });
  }, [appliedDateFrom, appliedDateTo, monthRows]);

  const dailySeries = useMemo(
    () => buildDailySeriesFromMovements(movements, appliedDateRange),
    [movements, appliedDateRange]
  );

  const chartVisibility = useMemo(
    () => ({
      entradaCarbon: hasSeriesValue(dailySeries, "entradaCarbon"),
      consumoCarbon: hasSeriesValue(dailySeries, "consumoCarbon"),
      ajusteCarbon: hasSeriesValue(dailySeries, "ajusteCarbon"),
      entradaMadera: hasSeriesValue(dailySeries, "entradaMadera"),
      consumoMadera: hasSeriesValue(dailySeries, "consumoMadera"),
      ajusteMadera: hasSeriesValue(dailySeries, "ajusteMadera"),
      entradaBagazo: hasSeriesValue(dailySeries, "entradaBagazo"),
      consumoBagazo: hasSeriesValue(dailySeries, "consumoBagazo"),
      ajusteBagazo: hasSeriesValue(dailySeries, "ajusteBagazo"),
    }),
    [dailySeries]
  );

  const inventory = useMemo(() => {
    const fallbackInventory = calculateInventoryFromMonthly(
      filteredMonthRows,
      carbons
    );

    const summaryByItem = inventorySummary?.byItem || {};
    const hasFooterSummary = Object.keys(summaryByItem).length > 0;

    if (!hasFooterSummary) {
      return fallbackInventory;
    }

    const fallbackById = fallbackInventory.reduce((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});

    return carbons.map((item) => {
      const fallback = fallbackById[item.id] || {};
      const summary = summaryByItem[item.id];

      if (!summary) {
        return fallback;
      }

      const actualTon = Number(summary.final || 0);
      const stockMinimoTon = Number(item.stockMinimoTon || 0);
      const diferenciaMinimo = actualTon - stockMinimoTon;

      const porcentajeMinimo =
        stockMinimoTon > 0
          ? (actualTon / stockMinimoTon) * 100
          : actualTon > 0
            ? 100
            : 0;

      return {
        ...fallback,
        id: item.id,
        material: item.material || summary.material || "Carbón",
        proveedor:
          item.name ||
          item.codigo ||
          summary.proveedor ||
          item.id ||
          "Sin nombre",
        inicialTon: Number(summary.inicial || 0),
        stockMinimoTon,
        active: item.active,
        entradas: Number(summary.entradas || 0),
        salidas: Number(summary.salidas || 0),
        ajustes: Number(summary.ajustes || 0),

        // Fuente única: columna FINAL de la fila inferior de resumen.
        actualTon,
        diferenciaMinimo,
        porcentajeMinimo,
        cobertura: Math.max(0, Math.min(100, porcentajeMinimo)),
        fechaUltimoFinal: inventorySummary?.fechaUltimoRegistro || "",
      };
    });
  }, [carbons, filteredMonthRows, inventorySummary]);

  const inventoryChartRows = useMemo(
    () =>
      inventory
        .filter(
          (item) =>
            isMaterialActive(item) ||
            Number(item.actualTon || 0) !== 0 ||
            Number(item.stockMinimoTon || 0) !== 0
        )
        .sort((a, b) => {
          const lowA = a.actualTon < a.stockMinimoTon ? 0 : 1;
          const lowB = b.actualTon < b.stockMinimoTon ? 0 : 1;

          if (lowA !== lowB) return lowA - lowB;

          return String(a.proveedor || "").localeCompare(
            String(b.proveedor || "")
          );
        }),
    [inventory]
  );

  const inventoryChartHeight = useMemo(() => {
    const rowHeight = 52;
    const headerSpace = 112;
    return Math.max(460, Math.min(760, inventoryChartRows.length * rowHeight + headerSpace));
  }, [inventoryChartRows.length]);

  const monthlyTotals = useMemo(
    () => calculateMonthlyTotals(filteredMonthRows, activeCarbons),
    [activeCarbons, filteredMonthRows]
  );

  const totals = useMemo(() => {
    const inventoryByMaterial = inventory
      .filter(isMaterialActive)
      .reduce(
      (acc, item) => {
        const material = item.material || "Carbón";

        if (!acc[material]) {
          acc[material] = {
            stock: 0,
            entradas: 0,
            salidas: 0,
            ajustes: 0,
          };
        }

        acc[material].stock += Number(item.actualTon || 0);
        acc[material].entradas += Number(item.entradas || 0);
        acc[material].salidas += Number(item.salidas || 0);
        acc[material].ajustes += Number(item.ajustes || 0);

        return acc;
      },
      {
        Carbón: {
          stock: 0,
          entradas: 0,
          salidas: 0,
          ajustes: 0,
        },
        Madera: {
          stock: 0,
          entradas: 0,
          salidas: 0,
          ajustes: 0,
        },
        Bagazo: {
          stock: 0,
          entradas: 0,
          salidas: 0,
          ajustes: 0,
        },
      }
    );

    const movementTotalsByMaterial = movements
      .filter((movement) => {
        const fecha = movement.fecha || "";

        if (!fecha) return false;
        if (appliedDateFrom && fecha < appliedDateFrom) return false;
        if (appliedDateTo && fecha > appliedDateTo) return false;

        return true;
      })
      .reduce(
        (acc, movement) => {
          const material = movement.material || "Carbón";
          const cantidad = Number(movement.cantidadTon || 0);

          if (!acc[material]) {
            acc[material] = {
              entradas: 0,
              salidas: 0,
              ajustes: 0,
              stock: 0,
            };
          }

          if (movement.tipo === "Entrada") acc[material].entradas += cantidad;
          if (movement.tipo === "Salida") acc[material].salidas += cantidad;
          if (movement.tipo === "Ajuste") acc[material].ajustes += cantidad;

          acc[material].stock =
            acc[material].entradas +
            acc[material].ajustes -
            acc[material].salidas;

          return acc;
        },
        {
          Carbón: {
            entradas: 0,
            salidas: 0,
            ajustes: 0,
            stock: 0,
          },
          Madera: {
            entradas: 0,
            salidas: 0,
            ajustes: 0,
            stock: 0,
          },
          Bagazo: {
            entradas: 0,
            salidas: 0,
            ajustes: 0,
            stock: 0,
          },
        }
      );

    const footerStockByMaterial = inventorySummary?.stockByMaterial || {};
    const hasFooterStockSummary =
      Object.prototype.hasOwnProperty.call(footerStockByMaterial, "Carbón") ||
      Object.prototype.hasOwnProperty.call(footerStockByMaterial, "Madera") ||
      Object.prototype.hasOwnProperty.call(footerStockByMaterial, "Bagazo");

    const stockByMaterial = stockSummary?.stockByMaterial || {};
    const hasStockSummary =
      Object.prototype.hasOwnProperty.call(stockByMaterial, "Carbón") ||
      Object.prototype.hasOwnProperty.call(stockByMaterial, "Madera") ||
      Object.prototype.hasOwnProperty.call(stockByMaterial, "Bagazo");

    /*
     * Prioridad de stock:
     * 1. Fila resumen inferior de la tabla de consumos.
     * 2. Resumen de movimientos.
     * 3. Cálculo local de respaldo.
     */
    const stockCarbon = hasFooterStockSummary
      ? Number(footerStockByMaterial.Carbón || 0)
      : hasStockSummary
        ? Number(stockByMaterial.Carbón || 0)
        : Number(
            monthlyTotals?.inventarioFinalCarbon ??
              inventoryByMaterial.Carbón.stock ??
              0
          );

    const stockMadera = hasFooterStockSummary
      ? Number(footerStockByMaterial.Madera || 0)
      : hasStockSummary
        ? Number(stockByMaterial.Madera || 0)
        : Number(
            monthlyTotals?.inventarioFinalMadera ??
              inventoryByMaterial.Madera.stock ??
              0
          );

    const stockBagazo = hasFooterStockSummary
      ? Number(footerStockByMaterial.Bagazo || 0)
      : hasStockSummary
        ? Number(stockByMaterial.Bagazo || 0)
        : Number(
            monthlyTotals?.inventarioFinalBagazo ??
              inventoryByMaterial.Bagazo.stock ??
              0
          );

    const alertas = inventory.filter(
      (item) =>
        isMaterialActive(item) &&
        Number(item.stockMinimoTon || 0) > 0 &&
        Number(item.actualTon || 0) < Number(item.stockMinimoTon || 0)
    ).length;

    return {
      carbon: {
        entradas:
          inventoryByMaterial.Carbón.entradas +
          movementTotalsByMaterial.Carbón.entradas,
        salidas:
          inventoryByMaterial.Carbón.salidas +
          movementTotalsByMaterial.Carbón.salidas,
        ajustes:
          inventoryByMaterial.Carbón.ajustes +
          movementTotalsByMaterial.Carbón.ajustes,
        stock: stockCarbon,
      },
      madera: {
        entradas:
          inventoryByMaterial.Madera.entradas +
          movementTotalsByMaterial.Madera.entradas,
        salidas:
          inventoryByMaterial.Madera.salidas +
          movementTotalsByMaterial.Madera.salidas,
        ajustes:
          inventoryByMaterial.Madera.ajustes +
          movementTotalsByMaterial.Madera.ajustes,
        stock: stockMadera,
      },
      bagazo: {
        entradas:
          inventoryByMaterial.Bagazo.entradas +
          movementTotalsByMaterial.Bagazo.entradas,
        salidas:
          inventoryByMaterial.Bagazo.salidas +
          movementTotalsByMaterial.Bagazo.salidas,
        ajustes:
          inventoryByMaterial.Bagazo.ajustes +
          movementTotalsByMaterial.Bagazo.ajustes,
        stock: stockBagazo,
      },
      alertas,
    };
  }, [
    appliedDateFrom,
    appliedDateTo,
    inventory,
    inventorySummary,
    movements,
    monthlyTotals,
    stockSummary,
  ]);

  const handleExecuteDateRange = () => {
    const from = dateFrom && dateTo && dateFrom > dateTo ? dateTo : dateFrom;
    const to = dateFrom && dateTo && dateFrom > dateTo ? dateFrom : dateTo;

    setDateFrom(from);
    setDateTo(to);

    setAppliedDateFrom(from);
    setAppliedDateTo(to);
    setMovements([]);
    setStockSummary(null);
    setInventorySummary(null);

    if (from) {
      setMonthKey(from.slice(0, 7));
    }

    setQueryVersion((current) => current + 1);
  };

  const handleConsumosAfterSave = useCallback((persistedRows = []) => {
    if (!Array.isArray(persistedRows) || persistedRows.length === 0) return;

    const rowsByMonth = persistedRows.reduce((acc, row) => {
      const fecha = String(row?.fecha || row?.id || "").slice(0, 10);
      const targetMonth = fecha.slice(0, 7);

      if (!fecha || !targetMonth) return acc;

      if (!acc[targetMonth]) {
        acc[targetMonth] = [];
      }

      acc[targetMonth].push({
        ...row,
        id: fecha,
        fecha,
      });

      return acc;
    }, {});

    setMonthlySheets((current) => {
      const next = { ...current };

      Object.entries(rowsByMonth).forEach(([targetMonth, savedRows]) => {
        const currentRows = normalizeMonthlyRows(
          next[targetMonth] || createMonthlySheet(targetMonth, carbons),
          carbons
        );

        const savedByDate = savedRows.reduce((acc, row) => {
          acc[row.fecha] = row;
          return acc;
        }, {});

        const currentByDate = currentRows.reduce((acc, row) => {
          const fecha = String(row?.fecha || row?.id || "").slice(0, 10);
          if (fecha) acc[fecha] = row;
          return acc;
        }, {});

        const mergedDates = Array.from(
          new Set([...Object.keys(currentByDate), ...Object.keys(savedByDate)])
        ).sort();

        next[targetMonth] = mergedDates.map((fecha) => ({
          ...(currentByDate[fecha] || {}),
          ...(savedByDate[fecha] || {}),
          id: fecha,
          fecha,
          carbons: {
            ...(currentByDate[fecha]?.carbons || {}),
            ...(savedByDate[fecha]?.carbons || {}),
          },
        }));
      });

      return next;
    });

    setQueryVersion((current) => current + 1);
  }, [carbons]);

  const handleSheetChange = (rowId, path, value) => {
    setMonthlySheets((current) => {
      const rows = normalizeMonthlyRows(
        current[monthKey] || createMonthlySheet(monthKey, activeCarbons),
        carbons
      );

      const nextRows = rows.map((row) => {
        if (row.id !== rowId) return row;

        if (path.length === 1) {
          return {
            ...row,
            [path[0]]: value,
          };
        }

        const [, carbonId, field] = path;

        return {
          ...row,
          carbons: {
            ...row.carbons,
            [carbonId]: {
              ...row.carbons?.[carbonId],
              [field]: value,
            },
          },
        };
      });

      return {
        ...current,
        [monthKey]: nextRows,
      };
    });
  };

  const handleCreateCurrentMonth = () => {
    const targetMonth = currentMonthKey();

    setMonthKey(targetMonth);

    setMonthlySheets((current) => ({
      ...current,
      [targetMonth]:
        current[targetMonth] || createMonthlySheet(targetMonth, activeCarbons),
    }));
  };

  const handleCreateSelectedMonth = () => {
    setMonthlySheets((current) => ({
      ...current,
      [monthKey]:
        current[monthKey] || createMonthlySheet(monthKey, activeCarbons),
    }));
  };

  const handleSaveIngresosPlanta = (payload) => {
    console.log("Ingresos carbón/madera a planta:", payload);
    // Aquí conectas el POST/PUT hacia tu API cuando tengas el endpoint listo.
    // Ejemplo: await api.put("/api/ingresos-combustibles-planta", payload);
  };

  return (
    <Box
      sx={{
        bgcolor: "#f5f7fb",
        minHeight: "100vh",
        p: { xs: 1, md: 1 },
      }}
    >
      <Stack
        sx={{ mt: 7 }}
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={950}
            letterSpacing={-0.8}
            color="#0f172a"
          >
            Seguimiento de carbón, madera, bagazo e inventario
          </Typography>

          <Typography color="text.secondary" fontSize={14}>
            Control mensual de entradas, consumos, ajustes, stock mínimo y
            movimientos de patio.
          </Typography>
        </Box>

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            startIcon={<Download />}
            variant="outlined"
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 900,
            }}
          >
            Exportar
          </Button>

          <TextField
            label="Desde"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              width: 155,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "#ffffff",
                fontWeight: 800,
              },
            }}
          />

          <TextField
            label="Hasta"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              width: 155,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "#ffffff",
                fontWeight: 800,
              },
            }}
          />

          <Button
            startIcon={<FilterAlt />}
            variant="contained"
            onClick={handleExecuteDateRange}
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 900,
              minHeight: 40,
            }}
          >
            Ejecutar
          </Button>
        </Stack>
      </Stack>

      <Grid
        container
        columns={{ xs: 2, sm: 4, md: 8, lg: 16 }}
        spacing={1}
        mb={1.25}
        mt={-2}
      >
        <KpiCard
          title="Stock carbón"
          value={`${formatTon(totals.carbon.stock)} t`}
          icon={<Inventory2 sx={{ fontSize: 18 }} />}
          tone="primary"
        />

        <KpiCard
          title="Stock madera"
          value={`${formatTon(totals.madera.stock)} t`}
          icon={<Forest sx={{ fontSize: 18 }} />}
          tone="success"
        />

        <KpiCard
          title="Stock bagazo"
          value={`${formatTon(totals.bagazo.stock)} t`}
          icon={<Inventory2 sx={{ fontSize: 18 }} />}
          tone="warning"
        />

        <KpiCard
          title="Entrada carbón"
          value={`${formatTon(totals.carbon.entradas)} t`}
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          tone="primary"
        />

        <KpiCard
          title="Entrada madera"
          value={`${formatTon(totals.madera.entradas)} t`}
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          tone="success"
        />

        <KpiCard
          title="Consumo carbón"
          value={`${formatTon(totals.carbon.salidas)} t`}
          icon={<TrendingDown sx={{ fontSize: 18 }} />}
          tone="warning"
        />

        <KpiCard
          title="Consumo madera"
          value={`${formatTon(totals.madera.salidas)} t`}
          icon={<TrendingDown sx={{ fontSize: 18 }} />}
          tone="warning"
        />

        <KpiCard
          title="Alertas mínimo"
          value={totals.alertas}
          icon={<WarningAmber sx={{ fontSize: 18 }} />}
          tone="error"
        />
      </Grid>

      <Card
        sx={{
          borderRadius: 5,
          border: "1px solid #dbe3ef",
          boxShadow: "0 20px 60px rgba(15,23,42,.10)",
          overflow: "hidden",
          bgcolor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 1.25, md: 2 } }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              mb: 2,
              minHeight: 44,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 900,
                minHeight: 44,
                borderRadius: 3,
                mr: 0.5,
                color: "#475569",
              },
              "& .Mui-selected": {
                color: "#0f172a",
                bgcolor: "#eaf1fb",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab label="Dashboard" />
            <Tab label="Consumo Diario combustubles" />
            <Tab label="Ingresos planta combustubles" />
            <Tab label="Movimientos" />
            <Tab label="Inventario" />
            <Tab label="Configuración materiales" />
          </Tabs>

          <Divider sx={{ mb: 1 }} />

          {tab === 0 && (
            <Box
              sx={{
                minHeight: {
                  xs: "auto",
                  lg: "calc(100vh - 255px)",
                },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Grid
                container
                spacing={2}
                sx={{
                  flex: 1,
                  minHeight: {
                    xs: "auto",
                    lg: "calc(100vh - 255px)",
                  },
                }}
              >
                <Grid item xs={12}>
                  <Panel
                    title="Balance operativo diario"
                    subtitle="Entradas, consumos y ajustes del rango seleccionado"
                    height="100%"
                    action={
                      <Chip
                        label={`${appliedDateFrom} → ${appliedDateTo}`}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          bgcolor: "#eff6ff",
                          color: "#1e40af",
                          border: "1px solid #bfdbfe",
                        }}
                      />
                    }
                  >
                    <Box
                      sx={{
                        height: {
                          xs: 460,
                          md: 560,
                          xl: "calc(100vh - 370px)",
                        },
                        minHeight: {
                          xl: 520,
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={dailySeries}
                          margin={{
                            top: 54,
                            right: 28,
                            left: -6,
                            bottom: 8,
                          }}
                          barGap={6}
                          barCategoryGap="32%"
                        >
                          <defs>
                            <linearGradient
                              id="carbonEntradaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.carbonEntrada}
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.carbonEntrada}
                                stopOpacity={0.28}
                              />
                            </linearGradient>

                            <linearGradient
                              id="maderaEntradaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.maderaEntrada}
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.maderaEntrada}
                                stopOpacity={0.28}
                              />
                            </linearGradient>

                            <linearGradient
                              id="bagazoEntradaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.bagazoEntrada}
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.bagazoEntrada}
                                stopOpacity={0.28}
                              />
                            </linearGradient>

                            <linearGradient
                              id="carbonConsumoGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.carbonConsumo}
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.carbonConsumo}
                                stopOpacity={0.02}
                              />
                            </linearGradient>

                            <linearGradient
                              id="maderaConsumoGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.maderaConsumo}
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.maderaConsumo}
                                stopOpacity={0.02}
                              />
                            </linearGradient>

                            <linearGradient
                              id="bagazoConsumoGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={chartColors.bagazoConsumo}
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="100%"
                                stopColor={chartColors.bagazoConsumo}
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke={chartColors.grid}
                            strokeDasharray="4 8"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="fecha"
                            tick={chartAxisSx}
                            tickLine={false}
                            axisLine={{ stroke: "#cbd5e1" }}
                            minTickGap={14}
                            tickMargin={10}
                          />

                          <YAxis
                            tick={chartAxisSx}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatTon(value)}
                            width={58}
                          />

                          <RechartsTooltip content={<ChartTooltip />} />

                          <Legend
                            verticalAlign="top"
                            align="center"
                            height={52}
                            content={<CenteredChartLegend />}
                            wrapperStyle={{
                              width: "100%",
                              left: 0,
                              right: 0,
                              paddingBottom: 10,
                            }}
                          />

                          {chartVisibility.entradaCarbon && (
                            <Bar
                              dataKey="entradaCarbon"
                              name="Entrada carbón"
                              fill="url(#carbonEntradaGradient)"
                              radius={[9, 9, 0, 0]}
                              maxBarSize={22}
                            />
                          )}

                          {chartVisibility.entradaMadera && (
                            <Bar
                              dataKey="entradaMadera"
                              name="Entrada madera"
                              fill="url(#maderaEntradaGradient)"
                              radius={[9, 9, 0, 0]}
                              maxBarSize={22}
                            />
                          )}

                          {chartVisibility.entradaBagazo && (
                            <Bar
                              dataKey="entradaBagazo"
                              name="Entrada bagazo"
                              fill="url(#bagazoEntradaGradient)"
                              radius={[9, 9, 0, 0]}
                              maxBarSize={22}
                            />
                          )}

                          {chartVisibility.consumoCarbon && (
                            <Area
                              type="monotone"
                              dataKey="consumoCarbon"
                              name="Consumo carbón"
                              stroke={chartColors.carbonConsumo}
                              strokeWidth={3.1}
                              fill="url(#carbonConsumoGradient)"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}

                          {chartVisibility.consumoMadera && (
                            <Area
                              type="monotone"
                              dataKey="consumoMadera"
                              name="Consumo madera"
                              stroke={chartColors.maderaConsumo}
                              strokeWidth={3.1}
                              fill="url(#maderaConsumoGradient)"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}

                          {chartVisibility.consumoBagazo && (
                            <Area
                              type="monotone"
                              dataKey="consumoBagazo"
                              name="Consumo bagazo"
                              stroke={chartColors.bagazoConsumo}
                              strokeWidth={3.1}
                              fill="url(#bagazoConsumoGradient)"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}

                          {chartVisibility.ajusteCarbon && (
                            <Line
                              type="monotone"
                              dataKey="ajusteCarbon"
                              name="Ajuste carbón"
                              stroke={chartColors.carbonAjuste}
                              strokeWidth={3}
                              strokeDasharray="7 5"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}

                          {chartVisibility.ajusteMadera && (
                            <Line
                              type="monotone"
                              dataKey="ajusteMadera"
                              name="Ajuste madera"
                              stroke={chartColors.maderaAjuste}
                              strokeWidth={3}
                              strokeDasharray="7 5"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}

                          {chartVisibility.ajusteBagazo && (
                            <Line
                              type="monotone"
                              dataKey="ajusteBagazo"
                              name="Ajuste bagazo"
                              stroke={chartColors.bagazoAjuste}
                              strokeWidth={3}
                              strokeDasharray="7 5"
                              dot={false}
                              activeDot={{
                                r: 5.5,
                                strokeWidth: 2.2,
                                stroke: "#ffffff",
                              }}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Panel>
                </Grid>
              </Grid>
            </Box>
          )}

          {(tab === 1 || tab === 4) && (
            <Box sx={{ display: tab === 1 ? "block" : "none" }}>
              <MonthlyExcelSheet
                monthKey={monthKey}
                setMonthKey={setMonthKey}
                rows={filteredMonthRows}
                carbons={activeCarbons}
                totals={monthlyTotals}
                dateRange={appliedDateRange}
                ingresosQueryVersion={queryVersion}
                onChange={handleSheetChange}
                onCreateCurrentMonth={handleCreateCurrentMonth}
                onCreateSelectedMonth={handleCreateSelectedMonth}
                onInventorySummaryChange={handleInventorySummaryChange}
                onAfterSave={handleConsumosAfterSave}
              />
            </Box>
          )}

          {tab === 2 && (
            <IngresosCombustiblesPlanta
              dateRange={appliedDateRange}
              queryVersion={queryVersion}
              onRowsChange={setIngresosCombustiblesRows}
              onSave={handleSaveIngresosPlanta}
            />
          )}

          {/*
            En Dashboard el componente debe permanecer visible para su propia
            lógica interna y así entregar los movimientos a la gráfica.
            Su interfaz se oculta con el contenedor cuando tab === 0.
          */}
          <Box sx={{ display: tab === 3 ? "block" : "none" }}>
            <MovimientosCombustibles
              visible={tab === 0 || tab === 3}
              enabled={tab === 0 || tab === 3}
              dateRange={appliedDateRange}
              materials={carbons}
              refreshKey={queryVersion}
              onMovementsChange={handleMovementsChange}
            />
          </Box>

          {tab === 4 && <InventorySection rows={inventory} />}

          {tab === 5 && (
            <ConfiguracionMaterialesCombustibles
              onMaterialsChange={setCarbons}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function KpiCard({ title, value, icon, tone }) {
  const palette = toneMap[tone] || toneMap.slate;

  return (
    <Grid item xs={1} sm={2} md={2} lg={2}>
      <Card
        sx={{
          borderRadius: 4,
          height: "100%",
          border: `1px solid ${palette.border}`,
          bgcolor: palette.soft,
          boxShadow: "0 12px 28px rgba(15,23,42,.08)",
          overflow: "hidden",
          position: "relative",
          transition: "all .18s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 18px 36px rgba(15,23,42,.12)",
          },
          "&:before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            bgcolor: palette.main,
          },
        }}
      >
        <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box sx={{ minWidth: 0, pl: 0.5 }}>
              <Typography
                color="#475569"
                fontWeight={900}
                fontSize={11.5}
                noWrap
              >
                {title}
              </Typography>

              <Typography
                fontSize={18}
                lineHeight={1.1}
                fontWeight={950}
                mt={0.45}
                color={palette.dark}
                noWrap
              >
                {value}
              </Typography>
            </Box>

            <Box
              sx={{
                color: "white",
                bgcolor: palette.main,
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 18px rgba(15,23,42,.16)",
              }}
            >
              {icon}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function Panel({ title, subtitle, children, action, height = "auto" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4.5,
        p: { xs: 2, md: 2.4 },
        height,
        borderColor: "#dbe3ef",
        bgcolor: "#ffffff",
        boxShadow: "0 18px 45px rgba(15,23,42,.08)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",

        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(135deg, rgba(30,64,175,.06) 0%, rgba(22,101,52,.035) 42%, rgba(255,255,255,0) 78%)",
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
        mb={2}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Stack direction="row" gap={1.25} alignItems="flex-start">
          <Box
            sx={{
              width: 7,
              height: 46,
              borderRadius: 99,
              bgcolor: "#0f172a",
              flexShrink: 0,
              boxShadow: "0 8px 18px rgba(15,23,42,.18)",
            }}
          />

          <Box>
            <Typography
              variant="h6"
              fontWeight={950}
              color="#0f172a"
              letterSpacing={-0.25}
            >
              {title}
            </Typography>

            <Typography color="text.secondary" fontSize={13.5}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        {action}
      </Stack>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

function InventorySection({ rows = [] }) {
  const activeRows = rows.filter(isMaterialActive);

  const materialOrder = ["Carbón", "Madera", "Bagazo"];

  const groupedRows = materialOrder
    .map((material) => ({
      material,
      rows: activeRows.filter(
        (row) => (row.material || "Carbón") === material
      ),
    }))
    .filter((group) => group.rows.length > 0);

  const inventoryTotals = activeRows.reduce(
    (acc, row) => {
      const material = row.material || "Carbón";

      if (!acc[material]) {
        acc[material] = {
          actualTon: 0,
          stockMinimoTon: 0,
          bajoMinimo: 0,
        };
      }

      acc[material].actualTon += Number(row.actualTon || 0);
      acc[material].stockMinimoTon += Number(row.stockMinimoTon || 0);

      if (
        Number(row.stockMinimoTon || 0) > 0 &&
        Number(row.actualTon || 0) < Number(row.stockMinimoTon || 0)
      ) {
        acc[material].bajoMinimo += 1;
      }

      return acc;
    },
    {}
  );

  return (
    <Stack gap={2}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 4,
          borderColor: "#dbe3ef",
          bgcolor: "#f8fafc",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={1.5}
          mb={2}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={950}
              color="#0f172a"
              letterSpacing={-0.2}
            >
              Inventario final por material
            </Typography>

            <Typography color="text.secondary" fontSize={13.5}>
              Cada valor corresponde al último inventario final calculado para
              cada carbón, madera o bagazo dentro del rango consultado.
            </Typography>
          </Box>

          <Chip
            icon={<Inventory2 />}
            label={`${activeRows.length} materiales activos`}
            sx={{
              fontWeight: 900,
              bgcolor: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
            }}
          />
        </Stack>

        <Grid container spacing={1.5}>
          {groupedRows.map(({ material, rows: materialRows }) => {
            const summary = inventoryTotals[material] || {
              actualTon: 0,
              stockMinimoTon: 0,
              bajoMinimo: 0,
            };

            const difference =
              Number(summary.actualTon || 0) -
              Number(summary.stockMinimoTon || 0);

            const materialLow = summary.bajoMinimo > 0;
            const palette = materialLow ? toneMap.error : toneMap.success;

            return (
              <Grid item xs={12} md={4} key={material}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 3.5,
                    borderColor: palette.border,
                    bgcolor: palette.soft,
                    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
                  }}
                >
                  <CardContent sx={{ p: 1.7, "&:last-child": { pb: 1.7 } }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <Chip
                        icon={getMaterialIcon(material)}
                        label={material}
                        size="small"
                        sx={getMaterialChipSx(material)}
                      />

                      <Chip
                        label={
                          materialLow
                            ? `${summary.bajoMinimo} bajo mínimo`
                            : "Stock operativo"
                        }
                        size="small"
                        sx={{
                          fontWeight: 900,
                          bgcolor: palette.soft,
                          color: palette.dark,
                          border: `1px solid ${palette.border}`,
                        }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-end"
                      gap={2}
                      mt={1.5}
                    >
                      <Box>
                        <Typography
                          fontSize={11.5}
                          fontWeight={900}
                          color="#64748b"
                        >
                          STOCK FINAL
                        </Typography>

                        <Typography
                          fontSize={24}
                          lineHeight={1.05}
                          fontWeight={950}
                          color={palette.dark}
                        >
                          {formatTon(summary.actualTon)} t
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          fontSize={11.5}
                          fontWeight={900}
                          color="#64748b"
                        >
                          MÍNIMO TOTAL
                        </Typography>

                        <Typography
                          fontSize={17}
                          lineHeight={1.1}
                          fontWeight={950}
                          color="#334155"
                        >
                          {formatTon(summary.stockMinimoTon)} t
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography
                      mt={1.25}
                      fontSize={12}
                      fontWeight={900}
                      color={difference < 0 ? "#991b1b" : "#166534"}
                    >
                      {difference < 0
                        ? `Faltan ${formatTon(Math.abs(difference))} t para el mínimo`
                        : `Margen sobre el mínimo: ${formatTon(difference)} t`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {groupedRows.map(({ material, rows: materialRows }) => (
        <Paper
          key={material}
          variant="outlined"
          sx={{
            p: { xs: 1.4, md: 1.8 },
            borderRadius: 4,
            borderColor: "#dbe3ef",
            bgcolor: "#ffffff",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={1}
            mb={1.5}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip
                icon={getMaterialIcon(material)}
                label={material}
                sx={getMaterialChipSx(material)}
              />

              <Typography fontWeight={950} color="#0f172a">
                Stock actual y límite por {material.toLowerCase()}
              </Typography>
            </Stack>

            <Typography fontSize={12.5} fontWeight={800} color="#64748b">
              {materialRows.length} registro
              {materialRows.length === 1 ? "" : "s"} activo
              {materialRows.length === 1 ? "" : "s"}
            </Typography>
          </Stack>

          <Grid container spacing={1.25}>
            {materialRows.map((row) => {
              const minimum = Number(row.stockMinimoTon || 0);
              const current = Number(row.actualTon || 0);
              const difference = current - minimum;
              const isLow = minimum > 0 && current < minimum;
              const palette = isLow ? toneMap.error : toneMap.success;

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={`${material}-${row.proveedor}`}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3.5,
                      borderColor: palette.border,
                      bgcolor: "#ffffff",
                      boxShadow: "0 9px 22px rgba(15,23,42,.055)",
                      overflow: "hidden",
                      position: "relative",
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 5,
                        bgcolor: palette.main,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 1.5,
                        pl: 2,
                        "&:last-child": { pb: 1.5 },
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={1}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            fontWeight={950}
                            color="#0f172a"
                            noWrap
                            title={row.proveedor}
                          >
                            {row.proveedor}
                          </Typography>

                          <Typography
                            fontSize={11.5}
                            fontWeight={800}
                            color="#64748b"
                          >
                            Último inventario final
                          </Typography>
                        </Box>

                        <Chip
                          label={isLow ? "Bajo mínimo" : "Operativo"}
                          size="small"
                          sx={{
                            flexShrink: 0,
                            fontWeight: 900,
                            bgcolor: palette.soft,
                            color: palette.dark,
                            border: `1px solid ${palette.border}`,
                          }}
                        />
                      </Stack>

                      <Typography
                        fontSize={25}
                        lineHeight={1.1}
                        fontWeight={950}
                        color={palette.dark}
                        mt={1.2}
                      >
                        {formatTon(current)} t
                      </Typography>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mt={1}
                        mb={0.7}
                      >
                        <Typography
                          fontSize={12}
                          fontWeight={900}
                          color="#475569"
                        >
                          Límite mínimo
                        </Typography>

                        <Typography
                          fontSize={12}
                          fontWeight={950}
                          color="#0f172a"
                        >
                          {formatTon(minimum)} t
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={row.cobertura}
                        sx={{
                          height: 9,
                          borderRadius: 99,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 99,
                            bgcolor: palette.main,
                          },
                        }}
                      />

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                        mt={0.8}
                      >
                        <Typography
                          fontSize={11.5}
                          fontWeight={900}
                          color={difference < 0 ? "#991b1b" : "#166534"}
                        >
                          {difference < 0
                            ? `Déficit: ${formatTon(Math.abs(difference))} t`
                            : `Margen: ${formatTon(difference)} t`}
                        </Typography>

                        <Typography
                          fontSize={11.5}
                          fontWeight={900}
                          color="#64748b"
                        >
                          {minimum > 0
                            ? `${Math.round(row.porcentajeMinimo)}% del mínimo`
                            : "Sin límite"}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      ))}

      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={950}
          color="#0f172a"
          mb={1}
        >
          Detalle del inventario
        </Typography>

        <InventoryTable rows={rows} />
      </Box>
    </Stack>
  );
}

function InventoryTable({ rows }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={tableShellSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Material</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Inicial período</TableCell>
            <TableCell align="right">Entradas</TableCell>
            <TableCell align="right">Salidas</TableCell>
            <TableCell align="right">Ajustes</TableCell>
            <TableCell align="right">Último final</TableCell>
            <TableCell align="right">Límite mínimo</TableCell>
            <TableCell align="right">Margen / déficit</TableCell>
            <TableCell>Cobertura mínima</TableCell>
            <TableCell>Estado stock</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => {
            const minimum = Number(row.stockMinimoTon || 0);
            const current = Number(row.actualTon || 0);
            const difference = current - minimum;
            const isLow = minimum > 0 && current < minimum;
            const stockTone = isLow ? toneMap.error : toneMap.success;
            const ajusteNegative = Number(row.ajustes || 0) < 0;
            const material = row.material || "Carbón";

            return (
              <TableRow key={`${material}-${row.proveedor}`} hover>
                <TableCell>
                  <Chip
                    icon={getMaterialIcon(material)}
                    label={material}
                    size="small"
                    sx={getMaterialChipSx(material)}
                  />
                </TableCell>

                <TableCell>
                  <Typography fontWeight={900} color="#0f172a">
                    {row.proveedor}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={isMaterialActive(row) ? "Activo" : "Oculto"}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      bgcolor: isMaterialActive(row) ? "#dcfce7" : "#f1f5f9",
                      color: isMaterialActive(row) ? "#166534" : "#475569",
                    }}
                  />
                </TableCell>

                <TableCell align="right" sx={{ fontWeight: 800 }}>
                  {formatTon(row.inicialTon)} t
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#166534" }}
                >
                  {formatTon(row.entradas)} t
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#9a3412" }}
                >
                  {formatTon(row.salidas)} t
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 900,
                    color: ajusteNegative ? "#991b1b" : "#1e40af",
                    bgcolor: "#fefce8",
                  }}
                >
                  {formatTon(row.ajustes)} t
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    bgcolor: stockTone.soft,
                    color: stockTone.dark,
                  }}
                >
                  <Typography fontWeight={950}>
                    {formatTon(current)} t
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Typography fontWeight={900} color="#334155">
                    {formatTon(minimum)} t
                  </Typography>
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 950,
                    color: difference < 0 ? "#991b1b" : "#166534",
                  }}
                >
                  {difference < 0 ? "-" : "+"}
                  {formatTon(Math.abs(difference))} t
                </TableCell>

                <TableCell sx={{ minWidth: 210 }}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={row.cobertura}
                      sx={{
                        flex: 1,
                        height: 9,
                        borderRadius: 99,
                        bgcolor: "#e2e8f0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 99,
                          bgcolor: stockTone.main,
                        },
                      }}
                    />

                    <Typography
                      fontSize={12}
                      fontWeight={900}
                      color="#475569"
                      sx={{ minWidth: 50, textAlign: "right" }}
                    >
                      {minimum > 0
                        ? `${Math.round(row.porcentajeMinimo)}%`
                        : "N/A"}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip
                    label={
                      minimum <= 0
                        ? "Sin límite"
                        : isLow
                          ? "Bajo mínimo"
                          : "Operativo"
                    }
                    size="small"
                    sx={{
                      fontWeight: 900,
                      bgcolor:
                        minimum <= 0 ? "#f1f5f9" : stockTone.soft,
                      color:
                        minimum <= 0 ? "#475569" : stockTone.dark,
                      border: `1px solid ${
                        minimum <= 0 ? "#cbd5e1" : stockTone.border
                      }`,
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

