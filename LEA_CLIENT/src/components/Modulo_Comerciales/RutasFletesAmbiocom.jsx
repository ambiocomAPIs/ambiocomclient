import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
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

import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useAuth } from "../../utils/Context/AuthContext/AuthContext";
import RequireRole from "../../utils/Context/AuthContext/RequireRole";

void RequireRole;

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://ambiocomserver.onrender.com";

const API_URL = RAW_API_URL.replace(/\/$/, "");

const RUTAS_FLETES_ENDPOINT = "/api/rutas-fletes-ambiocom";
const TRANSPORTADORAS_LOGISTICA_ENDPOINT = "/api/transportadoraslogistica";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const DEFAULT_TRANSPORTADORAS = ["PANANTRA", "W CARGO", "SIERRA"];

const BASE_COLUMNS = [
  { key: "ciudadOrigen", label: "CIUDAD ORIGEN", width: 110 },
  { key: "departamentoOrigen", label: "DEPARTAMENTO ORIGEN", width: 150 },
  { key: "ciudadDestino", label: "CIUDAD DESTINO", width: 150 },
  { key: "departamentoDestino", label: "DEPARTAMENTO DESTINO", width: 155 },
  { key: "tipoVehiculo", label: "TIPO DE VEHÍCULO", width: 125 },
  { key: "especificacion", label: "ESPECIFICACIÓN", width: 145 },
  {
    key: "cantidadLitros",
    label: "CANTIDAD LITROS",
    width: 115,
    align: "right",
  },
  {
    key: "fleteUnitarioCotizado",
    label: "FLETE UNITARIO COTIZADO ($/Lt)",
    width: 145,
    align: "right",
  },
];

const FLETE_COLORS = [
  "#f7dfd0",
  "#d7f0ce",
  "#242424",
  "#f7dfd0",
  "#efc6e8",
  "#ffffff",
  "#ffffff",
  "#e8f0fe",
  "#fff7d6",
  "#eaf7f0",
];

const inputBaseStyle = {
  width: "100%",
  height: "100%",
  minHeight: 37,
  border: "none",
  outline: "none",
  background: "transparent",
  boxSizing: "border-box",
  padding: "7px 8px",
  fontSize: 12,
  fontFamily: "inherit",
};

const emptyRow = (transportadorasLength) => ({
  ciudadOrigen: "",
  departamentoOrigen: "",
  ciudadDestino: "",
  departamentoDestino: "",
  tipoVehiculo: "",
  especificacion: "",
  cantidadLitros: "",
  fleteUnitarioCotizado: "",
  fletes: Array.from({ length: transportadorasLength }, () => ""),
  observaciones: "",
});

const normalizeRows = (rows, transportadorasLength) => {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    return [emptyRow(transportadorasLength)];
  }

  return safeRows.map((row) => {
    const { transportadora, prioridad, ...cleanRow } = row || {};

    return {
      ...emptyRow(transportadorasLength),
      ...cleanRow,
      fletes: Array.from(
        { length: transportadorasLength },
        (_, index) => row?.fletes?.[index] ?? ""
      ),
    };
  });
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();

  if (!raw || raw === "-" || raw === "–" || raw === "—") return null;

  let clean = raw
    .replace(/\$/g, "")
    .replace(/COP/gi, "")
    .replace(/\s/g, "");

  const commaCount = (clean.match(/,/g) || []).length;
  const dotCount = (clean.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    const decimals = clean.split(",").at(-1);
    clean =
      decimals?.length === 3
        ? clean.replace(/,/g, "")
        : clean.replace(",", ".");
  } else if (dotCount > 0) {
    const decimals = clean.split(".").at(-1);
    clean = decimals?.length === 3 ? clean.replace(/\./g, "") : clean;
  }

  const parsed = Number(clean);

  return Number.isFinite(parsed) ? parsed : null;
};

const formatCOP = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";

  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const calcularFletePromedio = (row) => {
  const fletesValidos = (row.fletes ?? [])
    .map(toNumber)
    .filter((value) => value !== null && Number.isFinite(value));

  if (!fletesValidos.length) return null;

  return (
    fletesValidos.reduce((acc, value) => acc + value, 0) / fletesValidos.length
  );
};

const calcularCopL = (row, fletePromedio) => {
  const litros = toNumber(row.cantidadLitros);

  if (!litros || !fletePromedio) return null;

  return fletePromedio / litros;
};

const getFleteCellSx = (index) => {
  const bg = FLETE_COLORS[index % FLETE_COLORS.length];
  const dark = bg === "#242424";

  return {
    backgroundColor: bg,
    color: dark ? "#ffffff" : "#111827",
    "& .excel-cell-input": {
      color: dark ? "#ffffff" : "#111827",
      textAlign: "right",
    },
  };
};

const cellFocusSx = {
  p: 0,
  height: 38,
  border: "1px solid #d6dce8",
  "&:focus-within": {
    outline: "2px solid #1976d2",
    outlineOffset: "-2px",
    zIndex: 2,
    position: "relative",
  },
};

const ExcelInput = memo(function ExcelInput({
  rowIndex,
  field,
  value,
  align = "left",
  setInputRef,
  onChangeCell,
  onKeyDownCell,
  onPasteCell,
}) {
  return (
    <input
      ref={(node) => setInputRef(rowIndex, field, node)}
      className="excel-cell-input"
      value={value ?? ""}
      onChange={(event) => onChangeCell(rowIndex, field, event.target.value)}
      onKeyDown={(event) => onKeyDownCell(event, rowIndex, field)}
      onPaste={(event) => onPasteCell(event, rowIndex, field)}
      style={{ ...inputBaseStyle, textAlign: align }}
    />
  );
});

const EditableRow = memo(function EditableRow({
  row,
  rowIndex,
  transportadoras,
  setInputRef,
  onChangeCell,
  onKeyDownCell,
  onPasteCell,
  onDeleteRow,
  disabledActions,
}) {
  const fletePromedio = useMemo(() => calcularFletePromedio(row), [row]);

  const copL = useMemo(
    () => calcularCopL(row, fletePromedio),
    [row, fletePromedio]
  );

  return (
    <TableRow
      hover
      sx={{
        "& td": {
          border: "1px solid #d6dce8",
        },
      }}
    >
      {BASE_COLUMNS.map((column) => {
        const isDestino = column.key === "ciudadDestino";

        return (
          <TableCell
            key={column.key}
            align={column.align || "left"}
            sx={{
              ...cellFocusSx,
              width: column.width,
              minWidth: column.width,
              backgroundColor: isDestino ? "#151515" : "#ffffff",
              color: isDestino ? "#ffffff" : "#111827",
              "& .excel-cell-input": {
                color: isDestino ? "#ffffff" : "#111827",
              },
            }}
          >
            <ExcelInput
              rowIndex={rowIndex}
              field={column.key}
              value={row[column.key]}
              align={column.align || "left"}
              setInputRef={setInputRef}
              onChangeCell={onChangeCell}
              onKeyDownCell={onKeyDownCell}
              onPasteCell={onPasteCell}
            />
          </TableCell>
        );
      })}

      {transportadoras.map((_, fleteIndex) => (
        <TableCell
          key={`flete-${rowIndex}-${fleteIndex}`}
          sx={{
            ...cellFocusSx,
            ...getFleteCellSx(fleteIndex),
            width: 130,
            minWidth: 130,
          }}
        >
          <ExcelInput
            rowIndex={rowIndex}
            field={`flete_${fleteIndex}`}
            value={row.fletes?.[fleteIndex] ?? ""}
            align="right"
            setInputRef={setInputRef}
            onChangeCell={onChangeCell}
            onKeyDownCell={onKeyDownCell}
            onPasteCell={onPasteCell}
          />
        </TableCell>
      ))}

      <TableCell
        align="right"
        sx={{
          width: 125,
          minWidth: 125,
          backgroundColor: "#f8fafc",
          fontWeight: 800,
          color: "#0f172a",
          px: 1,
          border: "1px solid #d6dce8",
        }}
      >
        {fletePromedio !== null ? formatCOP(fletePromedio) : ""}
      </TableCell>

      <TableCell
        align="right"
        sx={{
          width: 105,
          minWidth: 105,
          backgroundColor: "#eef6ff",
          fontWeight: 900,
          color: "#075985",
          px: 1,
          border: "1px solid #d6dce8",
        }}
      >
        {copL !== null ? formatNumber(copL, 2) : ""}
      </TableCell>

      <TableCell
        sx={{
          ...cellFocusSx,
          width: 210,
          minWidth: 210,
          backgroundColor: "#ffffff",
        }}
      >
        <ExcelInput
          rowIndex={rowIndex}
          field="observaciones"
          value={row.observaciones}
          align="left"
          setInputRef={setInputRef}
          onChangeCell={onChangeCell}
          onKeyDownCell={onKeyDownCell}
          onPasteCell={onPasteCell}
        />
      </TableCell>

      <TableCell
        align="center"
        sx={{
          width: 80,
          minWidth: 80,
          backgroundColor: "#ffffff",
          border: "1px solid #d6dce8",
        }}
      >
        <Tooltip title="Eliminar fila">
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={disabledActions}
              onClick={() => onDeleteRow(rowIndex)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

const RutasFletesAmbiocomOptimizado = () => {
  const { loadingAuth, isAuth, refreshMe } = useAuth();

  const [matrizId, setMatrizId] = useState(null);

  const [transportadoras, setTransportadoras] = useState(
    DEFAULT_TRANSPORTADORAS
  );

  const [transportadoraOptions, setTransportadoraOptions] = useState([]);
  const [loadingTransportadoras, setLoadingTransportadoras] = useState(false);

  const [rows, setRows] = useState(() =>
    normalizeRows(
      [emptyRow(DEFAULT_TRANSPORTADORAS.length)],
      DEFAULT_TRANSPORTADORAS.length
    )
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const inputRefs = useRef({});

  const fieldOrder = useMemo(
    () => [
      ...BASE_COLUMNS.map((column) => column.key),
      ...transportadoras.map((_, index) => `flete_${index}`),
      "observaciones",
    ],
    [transportadoras]
  );

  const promedioGlobal = useMemo(() => {
    const valores = rows
      .map(calcularFletePromedio)
      .filter((value) => value !== null && Number.isFinite(value));

    if (!valores.length) return null;

    return valores.reduce((acc, value) => acc + value, 0) / valores.length;
  }, [rows]);

  const opcionesTransportadorasAutocomplete = useMemo(() => {
    const opciones = [...transportadoraOptions, ...transportadoras]
      .filter(Boolean)
      .map((item) => String(item).trim().toUpperCase())
      .filter(Boolean);

    return [...new Set(opciones)].sort((a, b) => a.localeCompare(b));
  }, [transportadoraOptions, transportadoras]);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const normalizarOpcionesTransportadoras = useCallback((payload) => {
    const arrayTransportadoras = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.transportadoras)
      ? payload.transportadoras
      : Array.isArray(payload?.data?.transportadoras)
      ? payload.data.transportadoras
      : [];

    const nombres = arrayTransportadoras
      .map((item) => item?.nombreTransportadora)
      .filter(Boolean)
      .map((nombre) => String(nombre).trim().toUpperCase())
      .filter(Boolean);

    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b));
  }, []);

  const cargarTransportadoras = useCallback(async () => {
    if (loadingAuth || !isAuth) return [];

    try {
      setLoadingTransportadoras(true);

      const { data: result } = await api.get(
        TRANSPORTADORAS_LOGISTICA_ENDPOINT
      );

      const opciones = normalizarOpcionesTransportadoras(result);

      setTransportadoraOptions(opciones);

      return opciones;
    } catch (error) {
      console.error("Error cargando transportadoras:", error);

      if (error?.response?.status === 401) {
        await refreshMe?.();
        return [];
      }

      showSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "No fue posible cargar las transportadoras.",
        "error"
      );

      return [];
    } finally {
      setLoadingTransportadoras(false);
    }
  }, [
    loadingAuth,
    isAuth,
    refreshMe,
    showSnackbar,
    normalizarOpcionesTransportadoras,
  ]);

  const cargarMatriz = useCallback(async () => {
    if (loadingAuth || !isAuth) return;

    try {
      setLoading(true);

      const { data: result } = await api.get(RUTAS_FLETES_ENDPOINT);

      const data = result?.data || {};

      const nextTransportadoras =
        Array.isArray(data.transportadoras) && data.transportadoras.length
          ? data.transportadoras
          : DEFAULT_TRANSPORTADORAS;

      const nextRows = normalizeRows(
        data.rows || [],
        nextTransportadoras.length
      );

      setMatrizId(data._id || null);
      setTransportadoras(nextTransportadoras);
      setRows(nextRows);
      setHasChanges(false);

      showSnackbar("Matriz cargada correctamente.", "success");
    } catch (error) {
      console.error("Error cargando matriz de rutas y fletes:", error);

      if (error?.response?.status === 401) {
        await refreshMe?.();
        return;
      }

      showSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "No fue posible cargar la matriz de rutas y fletes.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [loadingAuth, isAuth, refreshMe, showSnackbar]);

  const guardarMatriz = useCallback(async () => {
    if (loadingAuth || !isAuth) return;

    try {
      setSaving(true);

      const { data: result } = await api.put(
        `${RUTAS_FLETES_ENDPOINT}/actual`,
        {
          rows,
          transportadoras,
        }
      );

      const data = result?.data || {};

      const nextTransportadoras =
        Array.isArray(data.transportadoras) && data.transportadoras.length
          ? data.transportadoras
          : transportadoras;

      const nextRows = normalizeRows(
        data.rows || rows,
        nextTransportadoras.length
      );

      setMatrizId(data._id || matrizId);
      setTransportadoras(nextTransportadoras);
      setRows(nextRows);
      setHasChanges(false);

      showSnackbar("Matriz guardada correctamente.", "success");
    } catch (error) {
      console.error("Error guardando matriz de rutas y fletes:", error);

      if (error?.response?.status === 401) {
        await refreshMe?.();
        return;
      }

      showSnackbar(
        error?.response?.data?.message ||
          error.message ||
          "No fue posible guardar la matriz de rutas y fletes.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }, [
    loadingAuth,
    isAuth,
    refreshMe,
    rows,
    transportadoras,
    matrizId,
    showSnackbar,
  ]);

  const recargarDatos = useCallback(async () => {
    await cargarTransportadoras();
    await cargarMatriz();
  }, [cargarTransportadoras, cargarMatriz]);

  useEffect(() => {
    if (!loadingAuth && isAuth) {
      cargarTransportadoras();
      cargarMatriz();
    }
  }, [loadingAuth, isAuth, cargarTransportadoras, cargarMatriz]);

  const setInputRef = useCallback((rowIndex, field, node) => {
    const key = `${rowIndex}-${field}`;

    if (node) {
      inputRefs.current[key] = node;
    } else {
      delete inputRefs.current[key];
    }
  }, []);

  const emitRowsChange = useCallback((updater) => {
    setRows((prevRows) => {
      const nextRows =
        typeof updater === "function" ? updater(prevRows) : updater;

      return nextRows;
    });

    setHasChanges(true);
  }, []);

  const emitTransportadorasChange = useCallback((updater) => {
    setTransportadoras((prevTransportadoras) => {
      const nextTransportadoras =
        typeof updater === "function" ? updater(prevTransportadoras) : updater;

      return nextTransportadoras;
    });

    setHasChanges(true);
  }, []);

  const setCellValue = useCallback(
    (rowIndex, field, value) => {
      emitRowsChange((prevRows) =>
        prevRows.map((row, index) => {
          if (index !== rowIndex) return row;

          if (field.startsWith("flete_")) {
            const fleteIndex = Number(field.replace("flete_", ""));
            const nextFletes = [...(row.fletes ?? [])];

            nextFletes[fleteIndex] = value;

            return {
              ...row,
              fletes: nextFletes,
            };
          }

          return {
            ...row,
            [field]: value,
          };
        })
      );
    },
    [emitRowsChange]
  );

  const focusCell = useCallback(
    (rowIndex, fieldIndex) => {
      const field = fieldOrder[fieldIndex];

      if (!field) return;

      const key = `${rowIndex}-${field}`;

      requestAnimationFrame(() => {
        const node = inputRefs.current[key];

        node?.focus?.();
        node?.select?.();
      });
    },
    [fieldOrder]
  );

  const moveFocus = useCallback(
    (rowIndex, field, direction = 1) => {
      const currentIndex = fieldOrder.indexOf(field);

      if (currentIndex < 0) return;

      let nextFieldIndex = currentIndex + direction;
      let nextRowIndex = rowIndex;

      if (nextFieldIndex >= fieldOrder.length) {
        nextFieldIndex = 0;
        nextRowIndex = Math.min(rowIndex + 1, rows.length - 1);
      }

      if (nextFieldIndex < 0) {
        nextFieldIndex = fieldOrder.length - 1;
        nextRowIndex = Math.max(rowIndex - 1, 0);
      }

      focusCell(nextRowIndex, nextFieldIndex);
    },
    [fieldOrder, focusCell, rows.length]
  );

  const handleKeyDown = useCallback(
    (event, rowIndex, field) => {
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        moveFocus(rowIndex, field, event.shiftKey ? -1 : 1);
      }
    },
    [moveFocus]
  );

  const handlePaste = useCallback(
    (event, rowIndex, field) => {
      const text = event.clipboardData.getData("text");

      if (!text.includes("\t") && !text.includes("\n")) return;

      event.preventDefault();

      const startColIndex = fieldOrder.indexOf(field);

      if (startColIndex < 0) return;

      const matrix = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.length)
        .map((line) => line.split("\t"));

      emitRowsChange((prevRows) => {
        const nextRows = prevRows.map((row) => ({
          ...row,
          fletes: [...(row.fletes ?? [])],
        }));

        matrix.forEach((line, rOffset) => {
          const targetRowIndex = rowIndex + rOffset;

          if (!nextRows[targetRowIndex]) return;

          line.forEach((cellValue, cOffset) => {
            const targetField = fieldOrder[startColIndex + cOffset];

            if (!targetField) return;

            if (targetField.startsWith("flete_")) {
              const fleteIndex = Number(targetField.replace("flete_", ""));

              nextRows[targetRowIndex].fletes[fleteIndex] = cellValue;
            } else {
              nextRows[targetRowIndex][targetField] = cellValue;
            }
          });
        });

        return nextRows;
      });
    },
    [emitRowsChange, fieldOrder]
  );

  const updateTransportadora = useCallback(
    (index, value) => {
      emitTransportadorasChange((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index ? String(value || "").toUpperCase() : item
        )
      );
    },
    [emitTransportadorasChange]
  );

  const addTransportadora = useCallback(() => {
    emitTransportadorasChange((prev) => [
      ...prev,
      `TRANSPORTADORA ${prev.length + 1}`,
    ]);

    emitRowsChange((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        fletes: [...(row.fletes ?? []), ""],
      }))
    );
  }, [emitRowsChange, emitTransportadorasChange]);

  const removeLastTransportadora = useCallback(() => {
    if (transportadoras.length <= 1) return;

    emitTransportadorasChange((prev) => prev.slice(0, -1));

    emitRowsChange((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        fletes: (row.fletes ?? []).slice(0, -1),
      }))
    );
  }, [emitRowsChange, emitTransportadorasChange, transportadoras.length]);

  const addRow = useCallback(() => {
    emitRowsChange((prevRows) => [
      ...prevRows,
      emptyRow(transportadoras.length),
    ]);
  }, [emitRowsChange, transportadoras.length]);

  const deleteRow = useCallback(
    async (rowIndex) => {
      if (!Number.isInteger(rowIndex) || rowIndex < 0) return;

      if (rows.length <= 1) {
        showSnackbar("Debe quedar al menos una fila en la matriz.", "warning");
        return;
      }

      const result = await Swal.fire({
        title: "¿Eliminar fila?",
        text: "Esta acción quitará la fila de la matriz.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      emitRowsChange((prevRows) =>
        prevRows.filter((_, index) => index !== rowIndex)
      );

      Swal.fire({
        title: "Fila eliminada",
        text: "Recuerda guardar la matriz para confirmar el cambio.",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });
    },
    [emitRowsChange, rows.length, showSnackbar]
  );

  const deleteLastRow = useCallback(() => {
    deleteRow(rows.length - 1);
  }, [deleteRow, rows.length]);

  const copyTable = useCallback(async () => {
    const headers = [
      ...BASE_COLUMNS.map((column) => column.label),
      ...transportadoras.map((name) => name || "SIN TRANSPORTADORA"),
      "Flete PROM",
      "COP/L",
      "OBSERVACIONES",
    ];

    const body = rows.map((row) => {
      const fletePromedio = calcularFletePromedio(row);
      const copL = calcularCopL(row, fletePromedio);

      return [
        ...BASE_COLUMNS.map((column) => row[column.key] ?? ""),
        ...transportadoras.map((_, index) => row.fletes?.[index] ?? ""),
        fletePromedio !== null ? Math.round(fletePromedio) : "",
        copL !== null ? Number(copL.toFixed(2)) : "",
        row.observaciones ?? "",
      ];
    });

    const tsv = [headers, ...body]
      .map((line) =>
        line.map((cell) => String(cell ?? "").replace(/\n/g, " ")).join("\t")
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      const textarea = document.createElement("textarea");

      textarea.value = tsv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    showSnackbar(
      "Tabla copiada al portapapeles. Puedes pegarla en Excel.",
      "success"
    );
  }, [rows, transportadoras, showSnackbar]);

  const handleTableRightClick = useCallback(
    (event) => {
      event.preventDefault();
      copyTable();
    },
    [copyTable]
  );

  const disabledActions = loading || saving;

  if (loadingAuth) {
    return null;
  }

  if (!isAuth) {
    return null;
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7fb",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Cargando matriz de rutas y fletes...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        marginTop: 5,
        p: { xs: 1.5, md: 2.5 },
        backgroundColor: "#f5f7fb",
        minHeight: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #d9e2ef",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#172554" }}>
              Rutas, despachos y recibos Ambiocom
            </Typography>

            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Celdas digitables tipo Excel · Click derecho sobre la tabla para
              copiarla completa.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Rutas: ${rows.length}`}
              color="primary"
              variant="outlined"
            />

            <Chip
              label={`Transportadoras: ${transportadoras.length}`}
              color="primary"
              variant="outlined"
            />

            <Chip
              label={`Flete prom. global: ${
                promedioGlobal ? formatCOP(promedioGlobal) : "Sin datos"
              }`}
              color="success"
              variant="outlined"
            />

            <Chip
              label={
                hasChanges ? "Cambios sin guardar" : "Sin cambios pendientes"
              }
              color={hasChanges ? "warning" : "default"}
              variant={hasChanges ? "filled" : "outlined"}
            />
          </Box>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ mb: 1, fontWeight: 700, color: "#334155" }}
        >
          Transportadoras visibles en la tabla
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
            gap: 1,
          }}
        >
          {transportadoras.map((name, index) => (
            <Autocomplete
              key={`transportadora-${index}`}
              freeSolo
              size="small"
              value={name || ""}
              options={opcionesTransportadorasAutocomplete}
              loading={loadingTransportadoras}
              disabled={disabledActions}
              noOptionsText="Sin transportadoras"
              onChange={(_, newValue) =>
                updateTransportadora(index, newValue || "")
              }
              onInputChange={(_, newInputValue) =>
                updateTransportadora(index, newInputValue || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Transportadora ${index + 1}`}
                  placeholder={
                    loadingTransportadoras
                      ? "Cargando transportadoras..."
                      : "Escribe o selecciona"
                  }
                />
              )}
            />
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mt: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              color="success"
              onClick={addTransportadora}
              disabled={disabledActions}
            >
              Agregar transportadora
            </Button>

            <Button
              startIcon={<DeleteOutlineIcon />}
              variant="outlined"
              color="error"
              onClick={removeLastTransportadora}
              disabled={transportadoras.length <= 1 || disabledActions}
            >
              Quitar última transportadora
            </Button>

            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={addRow}
              disabled={disabledActions}
            >
              Agregar fila
            </Button>

            <Button
              startIcon={<DeleteOutlineIcon />}
              variant="outlined"
              color="error"
              onClick={deleteLastRow}
              disabled={rows.length <= 1 || disabledActions}
            >
              Quitar última fila
            </Button>

            <Tooltip title="Copiar data de la tabla">
              <span>
                <IconButton
                  color="primary"
                  onClick={copyTable}
                  disabled={disabledActions}
                >
                  <ContentCopyIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: "auto" }}>
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              onClick={guardarMatriz}
              disabled={disabledActions}
            >
              {saving ? "Guardando..." : "Guardar matriz"}
            </Button>

            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={recargarDatos}
              disabled={disabledActions}
            >
              Recargar
            </Button>
          </Box>
        </Box>
      </Paper>

      <TableContainer
        component={Paper}
        onContextMenu={handleTableRightClick}
        sx={{
          borderRadius: 3,
          border: "1px solid #d9e2ef",
          maxHeight: "72vh",
          overflow: "auto",
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{ minWidth: 2030, tableLayout: "fixed" }}
        >
          <TableHead>
            
            <TableRow>
              {BASE_COLUMNS.map((column) => (
                <TableCell
                  key={column.key}
                  rowSpan={2}
                  align={column.align || "center"}
                  sx={{
                    width: column.width,
                    minWidth: column.width,
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 11,
                    border: "1px solid #334155",
                    textAlign: "center",
                    whiteSpace: "normal",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}

              {transportadoras.map((name, index) => {
                const bg = FLETE_COLORS[index % FLETE_COLORS.length];
                const dark = bg === "#242424";

                return (
                  <TableCell
                    key={`head-t-${index}`}
                    align="center"
                    sx={{
                      width: 130,
                      minWidth: 130,
                      backgroundColor: bg,
                      color: dark ? "#ffffff" : "#111827",
                      fontWeight: 900,
                      fontSize: 11,
                      border: "1px solid #334155",
                    }}
                  >
                    {name || `TRANSPORTADORA ${index + 1}`}
                  </TableCell>
                );
              })}

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  width: 125,
                  minWidth: 125,
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid #334155",
                }}
              >
                Flete PROM
              </TableCell>

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  width: 105,
                  minWidth: 105,
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid #334155",
                }}
              >
                COP/L
              </TableCell>

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  width: 210,
                  minWidth: 210,
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid #334155",
                }}
              >
                OBSERVACIONES
              </TableCell>

              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  width: 120,
                  minWidth: 80,
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid #334155",
                }}
              >
                ACCIONES
              </TableCell>
            </TableRow>

            <TableRow>
              {transportadoras.map((_, index) => (
                <TableCell
                  key={`head-flete-${index}`}
                  align="center"
                  sx={{
                    width: 130,
                    minWidth: 130,
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 10,
                    border: "1px solid #334155",
                    whiteSpace: "normal",
                  }}
                >
                  FLETE COTIZADO POR CUPO ($)
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, rowIndex) => (
              <EditableRow
                key={row._id || row.id || `row-${rowIndex}`}
                row={row}
                rowIndex={rowIndex}
                transportadoras={transportadoras}
                setInputRef={setInputRef}
                onChangeCell={setCellValue}
                onKeyDownCell={handleKeyDown}
                onPasteCell={handlePaste}
                onDeleteRow={deleteRow}
                disabledActions={disabledActions}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RutasFletesAmbiocomOptimizado;