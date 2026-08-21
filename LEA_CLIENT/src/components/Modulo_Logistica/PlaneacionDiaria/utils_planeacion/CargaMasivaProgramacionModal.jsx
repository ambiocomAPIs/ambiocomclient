import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const DEFAULT_API_URL =
  "https://ambiocomserver.onrender.com/api/programaciondespacho/carga-masiva";

const DEFAULT_TEMPLATE_URL =
  "/plantillas/Plantilla_Carga_Masiva_Programacion.xlsx";

const SWAL_Z_INDEX = 20000;

const showSwalAboveDialog = (options = {}) => {
  const originalDidOpen = options.didOpen;

  return Swal.fire({
    ...options,
    didOpen: (popup) => {
      const container = Swal.getContainer();

      if (container) {
        container.style.zIndex = String(SWAL_Z_INDEX);
      }

      if (typeof originalDidOpen === "function") {
        originalDidOpen(popup);
      }
    },
  });
};

/**
 * ÚNICAS columnas permitidas en el Excel.
 * El archivo puede cambiar el uso de mayúsculas/minúsculas o tener espacios
 * laterales, pero no puede tener columnas adicionales, faltantes o repetidas.
 */
const EXCEL_COLUMNS = [
  { header: "Fecha", field: "fecha" },

  // Fecha estimada viene separada en dos columnas en Excel.
  { header: "Fecha Est. Entrega", field: "fechaEstimadaFecha" },
  { header: "hora entrega", field: "fechaEstimadaHora" },

  // Se guarda como horaProgramada.
  { header: "Hora llegada", field: "horaProgramada" },

  { header: "Cliente", field: "cliente" },
  { header: "PLACA", field: "placa" },
  { header: "TRANSPORTADORA", field: "transportadora" },
  { header: "Tipo OH", field: "producto" },
  { header: "Destino", field: "destino" },
  { header: "Cantidad lts Pedido", field: "cantidad" },
];

const normalizeText = (value) =>
  String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHeader = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const EXPECTED_HEADER_LOOKUP = new Map(
  EXCEL_COLUMNS.map((column) => [normalizeHeader(column.header), column])
);

const pad2 = (value) => String(value).padStart(2, "0");

const isValidDateISO = (value) => {
  const text = normalizeText(value);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const dateToISO = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

const parseExcelDate = (value) => {
  if (value instanceof Date) {
    return dateToISO(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return "";
    }

    return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
  }

  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  if (isValidDateISO(text)) {
    return text;
  }

  // Convención colombiana: DD/MM/YYYY o DD-MM-YYYY.
  const match =
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/.exec(text);

  if (!match) {
    return "";
  }

  const day = Number(match[1]);
  const month = Number(match[2]);

  let year = Number(match[3]);

  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }

  const candidate = `${year}-${pad2(month)}-${pad2(day)}`;

  return isValidDateISO(candidate) ? candidate : "";
};

/**
 * Convierte las horas de Excel a HH:mm.
 *
 * Soporta:
 * 15:30
 * 15:30:00
 * 3:30 PM
 * 0.5 -> 12:00
 * Date de Excel
 */
const parseExcelTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  }

  // Excel almacena las horas como fracción de un día.
  // Ejemplo: 0.5 = 12:00.
  if (typeof value === "number" && Number.isFinite(value)) {
    const fraction = ((value % 1) + 1) % 1;

    const totalMinutes =
      Math.round(fraction * 24 * 60) % (24 * 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  const normalized = text
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .replace(/\b([ap])\s*m\b/g, "$1m")
    .trim();

  const match =
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/.exec(normalized);

  if (!match) {
    return "";
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3] || "";

  if (minutes < 0 || minutes > 59) {
    return "";
  }

  if (meridian) {
    if (hours < 1 || hours > 12) {
      return "";
    }

    if (meridian === "am" && hours === 12) {
      hours = 0;
    }

    if (meridian === "pm" && hours !== 12) {
      hours += 12;
    }
  } else if (hours < 0 || hours > 23) {
    return "";
  }

  return `${pad2(hours)}:${pad2(minutes)}`;
};

/**
 * Fecha Est. Entrega + hora entrega
 *
 * Ejemplo:
 * 04/08/2026 + 15:30
 *
 * Resultado:
 * 2026-08-04 15:30
 */
const buildFechaEstimadaEntrega = (dateValue, timeValue) => {
  const rawDate = normalizeText(dateValue);
  const rawTime = normalizeText(timeValue);

  // Si ambas vienen vacías, se conserva como pendiente.
  if (!rawDate && !rawTime) {
    return {
      value: "NA",
      error: "",
    };
  }

  const fecha = parseExcelDate(dateValue);
  const hora = parseExcelTime(timeValue);

  if (!fecha) {
    return {
      value: "",
      error: "Fecha Est. Entrega inválida o vacía",
    };
  }

  if (!hora) {
    return {
      value: "",
      error: "hora entrega inválida o vacía",
    };
  }

  return {
    value: `${fecha} ${hora}`,
    error: "",
  };
};

const parseNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  let text = normalizeText(value).replace(/\s/g, "");

  if (!text) {
    return Number.NaN;
  }

  // Formato colombiano: 40.000,5
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    // Formato inglés: 40,000.5
    text = text.replace(/,/g, "");
  } else {
    text = text.replace(",", ".");
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const isEmptyRow = (row = []) =>
  row.every((cell) => normalizeText(cell) === "");

const trimTrailingEmptyRows = (matrix) => {
  const copy = [...matrix];

  while (
    copy.length > 0 &&
    isEmptyRow(copy[copy.length - 1])
  ) {
    copy.pop();
  }

  return copy;
};

/**
 * Valida que la primera fila tenga exactamente las columnas esperadas.
 * No se aceptan columnas adicionales, faltantes, vacías ni repetidas.
 */
const validateAndBuildColumnMap = (headerRow = []) => {
  const effectiveHeaders = [...headerRow];

  // Eliminar únicamente celdas vacías ubicadas después de la última columna
  // utilizada. No se elimina ninguna columna con encabezado.
  while (
    effectiveHeaders.length > 0 &&
    normalizeText(
      effectiveHeaders[effectiveHeaders.length - 1]
    ) === ""
  ) {
    effectiveHeaders.pop();
  }

  const receivedNormalized =
    effectiveHeaders.map(normalizeHeader);

  const expectedNormalized =
    EXCEL_COLUMNS.map((column) =>
      normalizeHeader(column.header)
    );

  const emptyHeaderPositions =
    receivedNormalized
      .map((header, index) =>
        !header ? index + 1 : null
      )
      .filter(Boolean);

  const duplicates =
    receivedNormalized.filter(
      (header, index) =>
        header &&
        receivedNormalized.indexOf(header) !== index
    );

  const missing =
    EXCEL_COLUMNS.filter(
      (column) =>
        !receivedNormalized.includes(
          normalizeHeader(column.header)
        )
    ).map((column) => column.header);

  const extras =
    effectiveHeaders.filter((header) => {
      const normalized =
        normalizeHeader(header);

      return (
        normalized &&
        !expectedNormalized.includes(normalized)
      );
    });

  const messages = [];

  if (emptyHeaderPositions.length > 0) {
    messages.push(
      `Hay encabezados vacíos en las posiciones: ${emptyHeaderPositions.join(
        ", "
      )}.`
    );
  }

  if (missing.length > 0) {
    messages.push(
      `Faltan columnas: ${missing.join(", ")}.`
    );
  }

  if (extras.length > 0) {
    messages.push(
      `Hay columnas no permitidas: ${extras.join(", ")}.`
    );
  }

  if (duplicates.length > 0) {
    const names =
      Array.from(new Set(duplicates)).map((normalized) => {
        const match =
          effectiveHeaders.find(
            (header) =>
              normalizeHeader(header) === normalized
          );

        return match || normalized;
      });

    messages.push(
      `Hay columnas repetidas: ${names.join(", ")}.`
    );
  }

  if (
    effectiveHeaders.length !==
    EXCEL_COLUMNS.length
  ) {
    messages.push(
      `El archivo debe tener exactamente ${EXCEL_COLUMNS.length} columnas y contiene ${effectiveHeaders.length}.`
    );
  }

  if (messages.length > 0) {
    throw new Error(messages.join(" "));
  }

  const columnMap = {};

  effectiveHeaders.forEach((header, index) => {
    const definition =
      EXPECTED_HEADER_LOOKUP.get(
        normalizeHeader(header)
      );

    if (definition) {
      columnMap[definition.field] = index;
    }
  });

  return columnMap;
};

const getCell = (row, columnMap, field) => {
  const index = columnMap[field];

  return index === undefined
    ? ""
    : row[index];
};

const validateRow = (row) => {
  const errors = [];

  if (
    !row.fecha ||
    !isValidDateISO(row.fecha)
  ) {
    errors.push(
      "Fecha inválida o vacía"
    );
  }

  if (row.fechaEstimadaEntregaError) {
    errors.push(
      row.fechaEstimadaEntregaError
    );
  }

  // Hora llegada puede estar vacía.
  // Si escribieron algo pero no se pudo interpretar, se marca error.
  if (
    row.horaProgramadaRaw &&
    !row.horaProgramada
  ) {
    errors.push(
      "Hora llegada inválida"
    );
  }

  if (!row.cliente) {
    errors.push(
      "Cliente obligatorio"
    );
  }

  if (!row.producto) {
    errors.push(
      "Tipo OH obligatorio"
    );
  }

  if (!row.destino) {
    errors.push(
      "Destino obligatorio"
    );
  }

  // PLACA y TRANSPORTADORA pueden quedar vacías.

  if (
    !Number.isFinite(row.cantidad) ||
    row.cantidad <= 0
  ) {
    errors.push(
      "Cantidad lts Pedido debe ser mayor a cero"
    );
  }

  return errors;
};

const parseWorkbookRows = (matrix) => {
  const cleanMatrix =
    trimTrailingEmptyRows(matrix);

  if (cleanMatrix.length === 0) {
    throw new Error(
      "El archivo está vacío."
    );
  }

  const columnMap =
    validateAndBuildColumnMap(
      cleanMatrix[0]
    );

  const dataRows =
    cleanMatrix.slice(1);

  if (dataRows.length === 0) {
    throw new Error(
      "El archivo no contiene registros para previsualizar."
    );
  }

  return dataRows.map(
    (sourceRow, index) => {
      const excelRow =
        index + 2;

      /**
       * CONCATENACIÓN:
       *
       * Fecha Est. Entrega
       * +
       * hora entrega
       */
      const fechaEstimada =
        buildFechaEstimadaEntrega(
          getCell(
            sourceRow,
            columnMap,
            "fechaEstimadaFecha"
          ),
          getCell(
            sourceRow,
            columnMap,
            "fechaEstimadaHora"
          )
        );

      const horaProgramadaRaw =
        getCell(
          sourceRow,
          columnMap,
          "horaProgramada"
        );

      const row = {
        excelRow,

        fecha:
          parseExcelDate(
            getCell(
              sourceRow,
              columnMap,
              "fecha"
            )
          ),

        fechaEstimadaEntrega:
          fechaEstimada.value,

        fechaEstimadaEntregaError:
          fechaEstimada.error,

        horaProgramadaRaw,

        horaProgramada:
          parseExcelTime(
            horaProgramadaRaw
          ),

        cliente:
          normalizeText(
            getCell(
              sourceRow,
              columnMap,
              "cliente"
            )
          ),

        // Puede venir vacío.
        placa:
          normalizeText(
            getCell(
              sourceRow,
              columnMap,
              "placa"
            )
          ),

        // Puede venir vacío.
        transportadora:
          normalizeText(
            getCell(
              sourceRow,
              columnMap,
              "transportadora"
            )
          ),

        producto:
          normalizeText(
            getCell(
              sourceRow,
              columnMap,
              "producto"
            )
          ),

        destino:
          normalizeText(
            getCell(
              sourceRow,
              columnMap,
              "destino"
            )
          ),

        cantidad:
          parseNumber(
            getCell(
              sourceRow,
              columnMap,
              "cantidad"
            )
          ),
      };

      return {
        ...row,
        errors: validateRow(row),
      };
    }
  );
};

const formatNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("es-CO")
    : "—";
};

const CargaMasivaProgramacionModal = ({
  open,
  onClose,
  onSuccess,
  apiUrl = DEFAULT_API_URL,
  templateUrl = DEFAULT_TEMPLATE_URL,
}) => {
  const inputRef = useRef(null);

  const [fileName, setFileName] =
    useState("");

  const [rows, setRows] =
    useState([]);

  const [reading, setReading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [generalError, setGeneralError] =
    useState("");

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.errors.length === 0
      ),
    [rows]
  );

  const invalidRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.errors.length > 0
      ),
    [rows]
  );

  const totalLitros = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          (Number.isFinite(row.cantidad)
            ? Number(row.cantidad)
            : 0),
        0
      ),
    [rows]
  );

  const clearFile = () => {
    setFileName("");
    setRows([]);
    setGeneralError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (reading || uploading) {
      return;
    }

    clearFile();
    onClose?.();
  };

  const handleFileChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();

      if (
        !["xlsx", "xls"].includes(
          extension
        )
      ) {
        clearFile();

        setGeneralError(
          "Solo se permiten archivos Excel .xlsx o .xls."
        );

        return;
      }

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        clearFile();

        setGeneralError(
          "El archivo supera el tamaño máximo permitido de 8 MB."
        );

        return;
      }

      setReading(true);
      setGeneralError("");
      setRows([]);
      setFileName(file.name);

      try {
        const buffer =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(buffer, {
            type: "array",
            cellDates: true,
            dense: true,
          });

        /**
         * El Excel ahora puede tener:
         *
         * base
         * clientes
         *
         * Solamente procesamos base.
         */
        const baseSheetName =
          workbook.SheetNames.find(
            (name) =>
              normalizeHeader(name) ===
              "base"
          );

        const sheetName =
          baseSheetName ||
          workbook.SheetNames[0];

        if (!sheetName) {
          throw new Error(
            "El archivo no contiene hojas para procesar."
          );
        }

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        const matrix =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              header: 1,
              defval: "",
              raw: true,
              blankrows: true,
            }
          );

        const parsedRows =
          parseWorkbookRows(
            matrix
          );

        setRows(parsedRows);

        if (
          parsedRows.some(
            (row) =>
              row.errors.length > 0
          )
        ) {
          await showSwalAboveDialog({
            icon: "warning",
            title:
              "Archivo con errores",
            text:
              "La previsualización fue generada, pero la carga permanecerá bloqueada hasta corregir todas las filas.",
          });
        }
      } catch (error) {
        console.error(
          "Error leyendo Excel de programación:",
          error
        );

        const message =
          error?.message ||
          "No se pudo procesar el archivo Excel.";

        setGeneralError(message);
        setRows([]);

        await showSwalAboveDialog({
          icon: "error",
          title:
            "Excel no compatible",
          text: message,
        });
      } finally {
        setReading(false);
      }
    };

  /**
   * Payload final enviado al backend.
   *
   * fechaEstimadaEntrega queda:
   *
   * 2026-08-04 15:30
   */
  const buildApiPayload = (row) => ({
    fecha: row.fecha,

    fechaEstimadaEntrega:
      row.fechaEstimadaEntrega,

    horaProgramada:
      row.horaProgramada,

    cliente: row.cliente,

    // Estos pueden enviarse vacíos.
    placa: row.placa || "",

    transportadora:
      row.transportadora || "",

    producto: row.producto,

    destino: row.destino,

    cantidad: row.cantidad,
  });

  const handleUpload = async () => {
    if (rows.length === 0) {
      await showSwalAboveDialog({
        icon: "warning",
        title: "Sin registros",
        text:
          "Selecciona un archivo válido para continuar.",
        confirmButtonText:
          "Aceptar",
      });

      return;
    }

    if (invalidRows.length > 0) {
      await showSwalAboveDialog({
        icon: "error",
        title: "Carga bloqueada",
        html: `Existen <b>${invalidRows.length}</b> fila(s) con errores. No se enviará ningún registro hasta corregir el archivo completo.`,
        confirmButtonText:
          "Aceptar",
      });

      return;
    }

    const confirmation =
      await showSwalAboveDialog({
        icon: "question",
        title:
          "Confirmar carga masiva",
        html: `
          Se enviarán <b>${rows.length}</b> registros por un total de
          <b>${formatNumber(totalLitros)} L</b>.
          <br/><br/>
          El backend completará automáticamente los campos pendientes
          de la programación.
        `,
        showCancelButton: true,
        confirmButtonText:
          "Sí, cargar registros",
        cancelButtonText:
          "Cancelar",
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor:
          "#0B7A5A",
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    setUploading(true);

    try {
      const registros =
        rows.map(
          buildApiPayload
        );

      const response =
        await axios.post(
          apiUrl,
          {
            registros,
          },
          {
            withCredentials: true,
          }
        );

      const inserted =
        Number(
          response?.data?.insertados ??
            registros.length
        );

      clearFile();
      onClose?.();

      let refreshWarning = "";

      if (
        typeof onSuccess ===
        "function"
      ) {
        try {
          await onSuccess(
            response.data
          );
        } catch (
          refreshError
        ) {
          console.error(
            "La carga fue exitosa, pero no se pudo refrescar la tabla:",
            refreshError
          );

          refreshWarning = `
            <br/><br/>
            <small>
              Los registros sí fueron guardados, pero la tabla no pudo
              actualizarse automáticamente. Usa el botón de refrescar.
            </small>
          `;
        }
      }

      await showSwalAboveDialog({
        icon: "success",
        title:
          "Carga masiva completada",
        html: `
          Registros enviados: <b>${registros.length}</b>
          <br/>
          Registros insertados: <b>${inserted}</b>
          ${refreshWarning}
        `,
        confirmButtonText:
          "Aceptar",
        confirmButtonColor:
          "#0B7A5A",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    } catch (error) {
      console.error(
        "Error en carga masiva de programación:",
        error
      );

      const backendErrors =
        Array.isArray(
          error?.response?.data?.errores
        )
          ? error.response.data.errores
              .slice(0, 5)
              .map((item) => {
                const detail =
                  Array.isArray(
                    item?.errores
                  )
                    ? item.errores.join(
                        ", "
                      )
                    : "Error de validación";

                return `Fila ${
                  item?.fila ?? "—"
                }: ${detail}`;
              })
              .join("<br/>")
          : "";

      await showSwalAboveDialog({
        icon: "error",
        title:
          "No se pudo realizar la carga",
        html: `
          ${
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Ocurrió un error inesperado."
          }
          ${
            backendErrors
              ? `<br/><br/>${backendErrors}`
              : ""
          }
        `,
        confirmButtonText:
          "Aceptar",
        allowOutsideClick: false,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xl"
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
        }}
      >
        Carga masiva de programación
      </DialogTitle>

      {(reading || uploading) && (
        <LinearProgress />
      )}

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Se procesará la hoja{" "}
            <strong>base</strong> y debe
            contener exactamente estas
            columnas:
            <strong>
              {" "}
              Fecha, Fecha Est. Entrega,
              hora entrega, Hora llegada,
              Cliente, PLACA,
              TRANSPORTADORA, Tipo OH,
              Destino y Cantidad lts Pedido
            </strong>
            . PLACA y TRANSPORTADORA pueden
            venir vacías.
          </Alert>

          {/* <Alert severity="warning">
            No se descartan registros. Si una fila tiene un dato vacío o inválido,
            se mostrará en la previsualización y se bloqueará toda la carga.
          </Alert> */}

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleFileChange
              }
            />

            <Button
              variant="contained"
              startIcon={
                <UploadFileIcon />
              }
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                reading ||
                uploading
              }
            >
              Seleccionar Excel
            </Button>

            <Button
              component="a"
              href={templateUrl}
              download
              variant="outlined"
              startIcon={
                <DownloadIcon />
              }
              disabled={
                reading ||
                uploading
              }
            >
              Descargar plantilla
            </Button>

            {rows.length > 0 && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={
                  <DeleteSweepIcon />
                }
                onClick={
                  clearFile
                }
                disabled={
                  reading ||
                  uploading
                }
              >
                Limpiar archivo
              </Button>
            )}

            {fileName && (
              <Chip
                label={fileName}
                variant="outlined"
              />
            )}
          </Box>

          {generalError && (
            <Alert severity="error">
              {generalError}
            </Alert>
          )}

          {rows.length > 0 && (
            <>
              <Divider />

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                <Chip
                  label={`Filas detectadas: ${rows.length}`}
                />

                <Chip
                  color="success"
                  icon={
                    <CheckCircleIcon />
                  }
                  label={`Válidas: ${validRows.length}`}
                />

                <Chip
                  color="error"
                  icon={
                    <ErrorOutlineIcon />
                  }
                  label={`Con errores: ${invalidRows.length}`}
                />

                <Chip
                  color="primary"
                  label={`Volumen total: ${formatNumber(
                    totalLitros
                  )} L`}
                />
              </Stack>

              {invalidRows.length >
                0 && (
                <Alert severity="error">
                  La carga completa está
                  bloqueada. Corrige todas
                  las filas marcadas y
                  vuelve a seleccionar el
                  Excel.
                </Alert>
              )}

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  maxHeight: 520,
                  borderRadius: 2,
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Fila Excel
                      </TableCell>

                      <TableCell>
                        Estado
                      </TableCell>

                      <TableCell>
                        Fecha
                      </TableCell>

                      <TableCell>
                        Fecha Est. Entrega
                      </TableCell>

                      <TableCell>
                        Hora llegada
                      </TableCell>

                      <TableCell>
                        Cliente
                      </TableCell>

                      <TableCell>
                        Placa
                      </TableCell>

                      <TableCell>
                        Transportadora
                      </TableCell>

                      <TableCell>
                        Tipo OH
                      </TableCell>

                      <TableCell>
                        Destino
                      </TableCell>

                      <TableCell
                        align="right"
                      >
                        Cantidad lts Pedido
                      </TableCell>

                      <TableCell>
                        Errores
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row) => {
                      const isValid =
                        row.errors.length === 0;

                      return (
                        <TableRow
                          key={`${row.excelRow}-${row.fecha}-${row.cliente}-${row.placa}`}
                        >
                          <TableCell>
                            {row.excelRow}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              color={
                                isValid
                                  ? "success"
                                  : "error"
                              }
                              label={
                                isValid
                                  ? "Válida"
                                  : "Inválida"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {row.fecha ||
                              "—"}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                170,
                            }}
                          >
                            {row.fechaEstimadaEntrega ===
                            "NA"
                              ? "Pendiente"
                              : row.fechaEstimadaEntrega ||
                                "—"}
                          </TableCell>

                          <TableCell>
                            {row.horaProgramada ||
                              "—"}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                280,
                            }}
                          >
                            {row.cliente ||
                              "—"}
                          </TableCell>

                          <TableCell>
                            {row.placa ||
                              "—"}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                170,
                            }}
                          >
                            {row.transportadora ||
                              "—"}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                220,
                            }}
                          >
                            {row.producto ||
                              "—"}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                170,
                            }}
                          >
                            {row.destino ||
                              "—"}
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            {formatNumber(
                              row.cantidad
                            )}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth:
                                300,
                            }}
                          >
                            {isValid ? (
                              <Typography
                                variant="caption"
                                color="success.main"
                              >
                                Sin novedades
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                color="error.main"
                              >
                                {row.errors.join(
                                  " · "
                                )}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={
            reading ||
            uploading
          }
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          startIcon={
            <CloudUploadIcon />
          }
          onClick={handleUpload}
          disabled={
            reading ||
            uploading ||
            rows.length === 0 ||
            invalidRows.length > 0
          }
        >
          {uploading
            ? "Cargando..."
            : `Cargar ${rows.length} registro(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CargaMasivaProgramacionModal;