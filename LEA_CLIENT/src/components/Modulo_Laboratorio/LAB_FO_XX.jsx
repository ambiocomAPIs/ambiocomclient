import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";

import DownloadIcon from "@mui/icons-material/Download";
import { exportAnalisisAguaExcel } from "./utils_laboratorio/ExportAnalisisAguaExcel";

const API_URL = "https://ambiocomserver.onrender.com/api/agua-analisis";

const STORAGE_KEY = "tabla_agua_ambiocom";
const DRAFT_STORAGE_KEY = "tabla_agua_ambiocom_draft";

const analysisColumns = [
  "CODIGO DE\nMUESTRA",
  "TIPO DE",
  "COLOR\nAPARENTE\n(UPC)",
  "TURBIEDAD\n(UNT)",
  "CONDUCTIVIDAD\n(us/cm)",
  "pH",
  "mL EDTA",
  "Con. EDTA",
  "DUREZA\n(mg/L)",
  "mL HCl",
  "Con. HCl",
  "ALCALINIDAD\n(mg/L)",
  "mL FAS",
  "Con. FAS",
  "CLORO LIBRE\n(mg/L)",
  "SILICE\n(mg/L)",
  "RESIDUAL\nFOSFATOS\nppm",
  "SDT",
  "HIERRO\nppm",
  "NITRITOS ppm",
  "CUMPLE",
  "ANALISTA",
  "OBSERVACIONES",
];

const observableColumnNames = {
  2: "Color",
  3: "Turbiedad",
  4: "Conductividad",
  5: "pH",
  8: "Dureza",
  11: "Alcalinidad",
  14: "Cloro",
  15: "Silice",
  16: "Fosfatos",
  17: "SDT",
  18: "Hierro",
  19: "Nitritos",
};

const analysisCountableColumns = [2, 3, 4, 5, 8, 11, 14, 15, 16, 17, 18, 19];

const permittedRows = [
  ["01. AGUA DE PROCESO", "Max 15", "Max 2.0", "< 500", "6.5 - 8.0", "", "", "Max 200", "", "", "Max 200", "", "Máx 2,0", "< 70", "N.A", "N.A", "N.A", "N.A"],
  ["02. AGUA DE CALDERA ALIMENTACION", "Max 15", "N.A", "< 500", "5.5 - 7.5", "", "", "Max 10", "", "", "Max 200", "", "N.A", "< 5.0", "N.A", "Máx 150", "Máx 0,3", "N.A"],
  ["03. AGUA DE ENFRIAMIENTO", "Max 300", "N.A", "Max 2900", "7.0 - 10.0", "", "", "Max 200", "", "", "Max 500", "", "< 1.0", "N.A", "Min 10", "Máx 2000", "Máx 5,0", "Min 10"],
  ["04. AGUA POTABLE", "Max 15", "Max 2.0", "Max 1000", "6.5 - 9.0", "", "", "Max 300", "", "", "Max 200", "", "0.2 - 2.0", "N.A", "N.A", "N.A", "N.A", "N.A"],
  ["05. AGUA DE POZO", "Max 50", "Max 5.0", "< 500", "7.0 - 9.5", "", "", "Max 300", "", "", "Max 300", "", "N.A", "< 200", "N.A", "N.A", "N.A", "N.A"],
  ["06. TK 670", "Max 15", "Max 2.0", "<300", "6.0 - 9.0", "", "", "< 5.0", "", "", "Max 100", "", "< 1.0", "< 5.0", "N.A", "Máx 150", "Máx 0,3", "N.A"],
  ["07. PURGA EN LA CALDERA", "N.A", "Max 3.0", "Max 3600", "10.0 - 11.5", "", "", "< 5.0", "", "", "Max 700", "", "< 1.0", "Max 150", "N.A", "Máx 2500", "Máx 5,0", "Max 10"],
  ["08. ENTRADA A LA HIDROSELECTORA", "Max 20", "Max 2.0", "<300", "7.0 - 10.0", "", "", "< 30", "", "", "Max 150", "", "< 1.0", "Max 10", "N.A", "Máx 2500", "Máx 5,0", "Max 10"],
  ["09. ENTRADA A LA DESTILERIA", "Max 20", "Max 2.0", "<300", "7.0 - 10.0", "", "", "< 30", "", "", "Max 150", "", "Máx 2,0", "Max 10", "N.A", "Máx 2500", "Máx 5,0", "Max 10"],
  ["10. OSMOSIS", "Max 3", "Max 1.0", "<35", "7.0 - 8.0", "", "", "Max 10", "", "", "Max 150", "", "N.A", "N.A", "N.A", "N.A", "N.A", "N.A"],
];

const editableRows = 10;

const cellStyle = {
  border: "1px solid #000",
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 10,
  height: 26,
  whiteSpace: "pre-line",
};

const headerCell = {
  ...cellStyle,
  background: "#e7e7e7",
  fontWeight: 700,
};

const groupHeader = {
  ...cellStyle,
  background: "#d9d9d9",
  fontWeight: 800,
  height: 18,
};

function createInitialData() {
  return Array.from({ length: editableRows }, () =>
    analysisColumns.reduce((acc, col, index) => {
      acc[`col_${index}`] = "";
      return acc;
    }, {})
  );
}

function getInitialDraft() {
  return {
    data: createInitialData(),
    fechaConsulta: "",
    fechaRegistro: "",
    compareMode: false,
    previousDayData: createInitialData(),
    registroId: null,
  };
}

function getDraftData() {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    return draft ? JSON.parse(draft) : getInitialDraft();
  } catch {
    return getInitialDraft();
  }
}

function hasDraftData() {
  return Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
}

function formatDateToDDMMYYYY(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}

function formatDDMMYYYYToInput(fecha) {
  if (!fecha) return "";
  const [day, month, year] = fecha.split("-");
  return `${year}-${month}-${day}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(",", ".")
    .trim();
}

function parseNumber(value) {
  const match = String(value || "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getSampleCode(value) {
  const match = String(value || "").match(/\d+/);
  return match ? match[0].padStart(2, "0") : "";
}

function getPermittedRuleBySampleCode(sampleCode, colIndex) {
  const permittedRow = permittedRows.find(
    (row) => getSampleCode(row[0]) === sampleCode
  );

  if (!permittedRow) return "";

  const rulesByColumn = {
    2: permittedRow[1],
    3: permittedRow[2],
    4: permittedRow[3],
    5: permittedRow[4],
    8: permittedRow[7],
    11: permittedRow[10],
    14: permittedRow[12],
    15: permittedRow[13],
    16: permittedRow[14],
    17: permittedRow[15],
    18: permittedRow[16],
    19: permittedRow[17],
  };

  return rulesByColumn[colIndex] || "";
}

function validateCellValue(value, rule) {
  if (!value || !rule) return true;

  const normalizedRule = normalizeText(rule);
  const numericValue = parseNumber(value);

  if (normalizedRule === "n.a" || normalizedRule === "na") return true;
  if (numericValue === null) return true;

  if (
    normalizedRule.includes("max") ||
    normalizedRule.includes("máx") ||
    normalizedRule.includes("<")
  ) {
    const max = parseNumber(rule);
    if (max === null) return true;
    return numericValue <= max;
  }

  if (normalizedRule.includes("min")) {
    const min = parseNumber(rule);
    if (min === null) return true;
    return numericValue >= min;
  }

  if (normalizedRule.includes("-")) {
    const numbers = String(rule)
      .replace(",", ".")
      .match(/-?\d+(\.\d+)?/g)
      ?.map(Number);

    if (!numbers || numbers.length < 2) return true;

    const [min, max] = numbers;
    return numericValue >= min && numericValue <= max;
  }

  return true;
}

function isCellOutOfRange(row, colIndex) {
  if (colIndex <= 1 || colIndex === 20 || colIndex === 21 || colIndex === 22) {
    return false;
  }

  const sampleCode = getSampleCode(row.col_1);
  if (!sampleCode) return false;

  const rule = getPermittedRuleBySampleCode(sampleCode, colIndex);
  const value = row[`col_${colIndex}`];

  return !validateCellValue(value, rule);
}

function hasRuleForColumn(row, colIndex) {
  const sampleCode = getSampleCode(row.col_1);
  if (!sampleCode) return false;

  const rule = getPermittedRuleBySampleCode(sampleCode, colIndex);
  const normalizedRule = normalizeText(rule);

  return Boolean(rule) && normalizedRule !== "n.a" && normalizedRule !== "na";
}

function getRowCompliance(row) {
  const columnsToValidate = analysisColumns
    .map((_, index) => index)
    .filter((colIndex) => hasRuleForColumn(row, colIndex));

  if (columnsToValidate.length === 0) return "";

  const hasInvalidCell = columnsToValidate.some((colIndex) =>
    isCellOutOfRange(row, colIndex)
  );

  return hasInvalidCell ? "NO" : "SI";
}

function getRowObservations(row) {
  const invalidColumns = Object.keys(observableColumnNames)
    .map(Number)
    .filter((colIndex) => isCellOutOfRange(row, colIndex));

  if (invalidColumns.length === 0) return "";

  return invalidColumns
    .map((colIndex) => observableColumnNames[colIndex])
    .join(", ");
}

function getDataWithCompliance(data) {
  return data.map((row) => ({
    ...row,
    col_20: getRowCompliance(row),
    col_22: getRowObservations(row),
  }));
}

function isValidAnalyzedNumber(value) {
  const normalized = normalizeText(value);

  if (
    !normalized ||
    normalized === "n.a" ||
    normalized === "na" ||
    normalized === "-" ||
    normalized === "--"
  ) {
    return false;
  }

  return parseNumber(value) !== null;
}

function getAnalysisSummary(data) {
  let total = 0;
  let cumple = 0;
  let noCumple = 0;

  data.forEach((row) => {
    analysisCountableColumns.forEach((colIndex) => {
      const value = row[`col_${colIndex}`];

      if (!isValidAnalyzedNumber(value)) return;

      total += 1;

      if (isCellOutOfRange(row, colIndex)) {
        noCumple += 1;
      } else {
        cumple += 1;
      }
    });
  });

  const rate = total > 0 ? ((cumple / total) * 100).toFixed(2) : "0.00";

  return {
    total,
    cumple,
    noCumple,
    rate,
  };
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Error en la petición");
  }

  return json;
}

export default function TablaAguaAmbiocom() {
  const draft = getDraftData();

  const [data, setData] = useState(draft.data || createInitialData());
  const [open, setOpen] = useState(false);
  const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
  const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");
  const [compareMode, setCompareMode] = useState(draft.compareMode || false);
  const [previousDayData, setPreviousDayData] = useState(
    draft.previousDayData || createInitialData()
  );
  const [registroId, setRegistroId] = useState(draft.registroId || null);

  useEffect(() => {
    async function loadLatest() {
      if (hasDraftData()) return;

      try {
        const json = await requestApi(`${API_URL}/latest`);

        if (json?.data) {
          setData(json.data.data || createInitialData());
          setRegistroId(json.data._id || null);
          setFechaRegistro(formatDDMMYYYYToInput(json.data.fechaRegistro));
          setFechaConsulta(formatDDMMYYYYToInput(json.data.fechaRegistro));
        }
      } catch (error) {
        console.error("Error cargando último registro:", error);
      }
    }

    loadLatest();
  }, []);

  useEffect(() => {
    const draftPayload = {
      data,
      fechaConsulta,
      fechaRegistro,
      compareMode,
      previousDayData,
      registroId,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
  }, [
    data,
    fechaConsulta,
    fechaRegistro,
    compareMode,
    previousDayData,
    registroId,
  ]);

  const updateCell = (rowIndex, colIndex, value) => {
    if (colIndex === 20) return;

    setData((prev) => {
      const copy = [...prev];
      copy[rowIndex] = {
        ...copy[rowIndex],
        [`col_${colIndex}`]: value,
      };
      return copy;
    });
  };

  const handleCellKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const nextRow = rowIndex + 1;

      if (nextRow < data.length) {
        const nextInput = document.querySelector(
          `[data-cell="${nextRow}-${colIndex}"]`
        );

        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      }
    }
  };

  // const buildPayload = () => ({
  //   id: registroId,
  //   formato: "LAB-FO-027",
  //   version: "15",
  //   pagina: "1-1",
  //   tabla: "Análisis de agua",
  //   fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
  //   fechaGuardado: new Date().toISOString(),
  //   data: getDataWithCompliance(data),
  // });
  const buildPayload = () => {
    const summary = getAnalysisSummary(data);

    return {
      id: registroId,
      formato: "LAB-FO-027",
      version: "15",
      pagina: "1-1",
      tabla: "Análisis de agua",
      fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
      fechaGuardado: new Date().toISOString(),
      data: getDataWithCompliance(data),
      resumenAnalisis: {
        datosAnalizados: summary.total,
        cumplen: summary.cumple,
        noCumplen: summary.noCumple,
        rate: Number(summary.rate),
        rateTexto: `${summary.rate}%`,
      },
    };
  };

  const handleSave = async () => {
    if (!fechaRegistro) {
      Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Selecciona la fecha con la que se guardará el registro.",
      });
      return;
    }

    try {
      const payload = buildPayload();

      let json;

      if (registroId) {
        json = await requestApi(`${API_URL}/${registroId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        json = await requestApi(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (json?.id) {
          setRegistroId(json.id);
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      Swal.fire({
        icon: "success",
        title: registroId ? "Registro actualizado" : "Registro guardado",
        text: `Fecha de registro: ${payload.fechaRegistro}`,
        timer: 1800,
        showConfirmButton: false,
      });

      console.log("DATA GUARDADA:", json);
      setOpen(true);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "No fue posible guardar la información.",
      });
    }
  };

  const handleCompare = async () => {
    if (compareMode) {
      setCompareMode(false);
      setPreviousDayData(createInitialData());

      Swal.fire({
        icon: "info",
        title: "Modo comparación desactivado",
        timer: 1800,
        showConfirmButton: false,
      });

      return;
    }

    if (!fechaConsulta) {
      Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Selecciona una fecha de consulta para comparar.",
      });
      return;
    }

    try {
      const fechaActual = formatDateToDDMMYYYY(fechaConsulta);
      const json = await requestApi(`${API_URL}/by-date?fecha=${fechaActual}`);

      if (json?.actual?.data) {
        setData(json.actual.data);
        setRegistroId(json.actual._id || json.id || null);
        setFechaRegistro(formatDDMMYYYYToInput(json.actual.fechaRegistro));
      }

      if (json?.dataDiaAnterior) {
        setPreviousDayData(json.dataDiaAnterior);
      } else {
        setPreviousDayData(createInitialData());
      }

      setCompareMode(true);

      Swal.fire({
        icon: "success",
        title: "Modo comparación activado",
        text: `Comparando ${json.fechaAnterior} vs ${json.fechaActual}`,
        timer: 2000,
        showConfirmButton: false,
      });

      console.log("COMPARAR DATA:", json);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error al comparar",
        text:
          error.message || "No fue posible obtener la información para comparar.",
      });
    }
  };

  const handleExecuteByDate = async () => {
    if (!fechaConsulta) {
      Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Selecciona una fecha para consultar.",
      });
      return;
    }

    try {
      const fecha = formatDateToDDMMYYYY(fechaConsulta);
      const json = await requestApi(`${API_URL}/by-date?fecha=${fecha}`);

      if (json?.actual?.data) {
        setData(json.actual.data);
        setRegistroId(json.actual._id || json.id || null);
        setFechaRegistro(formatDDMMYYYYToInput(json.actual.fechaRegistro));
      } else if (json?.data) {
        setData(json.data);
        setRegistroId(json.id || null);
        setFechaRegistro(fechaConsulta);
      } else {
        setData(createInitialData());
        setRegistroId(null);
        setFechaRegistro(fechaConsulta);
      }

      if (json?.dataDiaAnterior) {
        setPreviousDayData(json.dataDiaAnterior);
      } else {
        setPreviousDayData(createInitialData());
      }

      Swal.fire({
        icon: "success",
        title: "Consulta ejecutada",
        text: `Fecha consultada: ${fecha}`,
        timer: 1800,
        showConfirmButton: false,
      });

      console.log("CONSULTAR POR FECHA:", json);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error al consultar",
        text: error.message || "No fue posible consultar la información.",
      });
    }
  };

  function getCellBackgroundByData(
    rowData,
    colIndex,
    isPrevious = false
  ) {
    const outOfRange = isCellOutOfRange(rowData, colIndex);

    if (!outOfRange) {
      return isPrevious ? "#fdfdf4" : "#fff";
    }

    return isPrevious
      ? "#ffe598"
      : "#ffb3b3";
  }

  const analysisSummary = getAnalysisSummary(data);

  return (
    <Box sx={{ p: 1.5, mt: 6, bgcolor: "#f3f3f3", minHeight: "88vh" }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Fecha consulta"
            type="date"
            size="small"
            value={fechaConsulta}
            onChange={(e) => setFechaConsulta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleExecuteByDate}
            disabled={!fechaConsulta}
          >
            Ejecutar
          </Button>

          <Button
            variant="outlined"
            color={compareMode ? "error" : "secondary"}
            startIcon={<CompareArrowsIcon />}
            onClick={handleCompare}
            disabled={!fechaConsulta}
          >
            {compareMode ? "Desactivar comparación" : "Comparar"}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() =>
              exportAnalisisAguaExcel({
                data,
                previousDayData,
                compareMode,
                permittedRows,
                analysisSummary,
                fechaRegistro,
                fechaConsulta,
                getRowCompliance,
                getRowObservations,
                isCellOutOfRange,
              })
            }
          >
            Exportar Excel
          </Button>
          <TextField
            label="Fecha registro"
            type="date"
            size="small"
            value={fechaRegistro}
            onChange={(e) => setFechaRegistro(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            {registroId ? "Actualizar data" : "Guardar data"}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ overflow: "auto", p: 0 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            background: "#fff",
            tableLayout: "fixed",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <colgroup>
            <col style={{ width: 72 }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 65 }} />
            <col style={{ width: 67 }} />
            <col style={{ width: 84 }} />
            <col style={{ width: 67 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 74 }} />
            <col style={{ width: 67 }} />
            <col style={{ width: 74 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 54 }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 74 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 194 }} />
          </colgroup>

          <tbody>
            <tr>
              <td
                colSpan={4}
                style={{
                  ...cellStyle,
                  height: 50,
                  borderRight: "1px dashed #aaa",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <img
                    src="/LogoCompany/logoambiocomsinfondo.png"
                    alt="logo"
                    style={{
                      width: 220,
                      height: 55,
                      objectFit: "contain",
                    }}
                  />
                </div>
              </td>

              <td
                colSpan={15}
                style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}
              >
                TRAZABILIDAD DE LOTE DE PRODUCCION
              </td>

              <td colSpan={4} style={{ ...cellStyle, fontSize: 12 }}>
                LAB - FO - 027
                <br />
                VERSION 15
                <br />
                PAG 1-1
              </td>
            </tr>

            <tr>
              <td colSpan={23} style={{ ...cellStyle, height: 16 }} />
            </tr>

            <tr>
              <td rowSpan={2} style={headerCell}>
                CODIGO DE{"\n"}MUESTRA
              </td>
              <td rowSpan={2} style={headerCell}>
                TIPO DE MUESTRA
              </td>
              <td rowSpan={2} style={headerCell}>
                COLOR{"\n"}APARENTE{"\n"}(UPC)
              </td>
              <td rowSpan={2} style={headerCell}>
                TURBIEDAD{"\n"}(UNT)
              </td>
              <td rowSpan={2} style={headerCell}>
                CONDUCTIVIDAD{"\n"}(us/cm)
              </td>
              <td rowSpan={2} style={headerCell}>
                pH
              </td>

              <td colSpan={3} style={groupHeader}>
                DUREZA
              </td>
              <td colSpan={3} style={groupHeader}>
                ALCALINIDAD
              </td>
              <td colSpan={3} style={groupHeader}>
                CLORO LIBRE
              </td>

              <td rowSpan={2} style={headerCell}>
                SILICE{"\n"}(mg/L)
              </td>
              <td rowSpan={2} style={headerCell}>
                RESIDUAL{"\n"}FOSFATOS{"\n"}ppm
              </td>
              <td rowSpan={2} style={headerCell}>
                SDT
              </td>
              <td rowSpan={2} style={headerCell}>
                HIERRO{"\n"}ppm
              </td>
              <td rowSpan={2} style={headerCell}>
                NITRITOS ppm
              </td>
              <td rowSpan={2} style={headerCell}>
                CUMPLE
              </td>
              <td rowSpan={2} style={headerCell}>
                ANALISTA
              </td>
              <td rowSpan={2} style={headerCell}>
                OBSERVACIONES
              </td>
            </tr>

            <tr>
              <td style={headerCell}>mL EDTA</td>
              <td style={headerCell}>Con. EDTA</td>
              <td style={headerCell}>DUREZA{"\n"}(mg/L)</td>
              <td style={headerCell}>mL HCl</td>
              <td style={headerCell}>Con. HCl</td>
              <td style={headerCell}>ALCALINIDAD{"\n"}(mg/L)</td>
              <td style={headerCell}>mL FAS</td>
              <td style={headerCell}>Con. FAS</td>
              <td style={headerCell}>CLORO LIBRE{"\n"}(mg/L)</td>
            </tr>

            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {analysisColumns.map((_, colIndex) => {
                  const currentCellBackground = getCellBackgroundByData(
                    row,
                    colIndex,
                    false
                  );

                  const previousCellBackground = getCellBackgroundByData(
                    previousDayData[rowIndex] || {},
                    colIndex,
                    true
                  );

                  const cellValue =
                    colIndex === 20
                      ? getRowCompliance(row)
                      : colIndex === 22
                        ? getRowObservations(row)
                        : row[`col_${colIndex}`];

                  return (
                    <td
                      key={colIndex}
                      style={{
                        ...cellStyle,
                        padding: 0,
                      }}
                    >
                      {compareMode ? (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            height: "100%",
                            minHeight: 26,
                          }}
                        >
                          <Box
                            sx={{
                              color: "red",
                              borderRight: "1px solid #000",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              px: "2px",
                              textAlign: "center",
                              wordBreak: "break-word",
                              backgroundColor: previousCellBackground,
                            }}
                          >
                            {colIndex === 20
                              ? getRowCompliance(previousDayData[rowIndex] || {})
                              : colIndex === 22
                                ? getRowObservations(previousDayData[rowIndex] || {})
                                : previousDayData[rowIndex]?.[`col_${colIndex}`] || ""}
                          </Box>

                          <TextField
                            value={cellValue}
                            disabled={colIndex === 20 || colIndex === 22}
                            inputProps={{
                              "data-cell": `${rowIndex}-${colIndex}`,
                            }}
                            onKeyDown={(e) =>
                              handleCellKeyDown(e, rowIndex, colIndex)
                            }
                            onChange={(e) =>
                              updateCell(rowIndex, colIndex, e.target.value)
                            }
                            variant="standard"
                            fullWidth
                            multiline
                            InputProps={{ disableUnderline: true }}
                            sx={{
                              "& .MuiInputBase-root": {
                                backgroundColor: currentCellBackground,
                                height: "100%",
                              },
                              "& .MuiInputBase-input": {
                                textAlign: "center",
                                fontSize: 10,
                                padding: "2px",
                                lineHeight: 1.1,
                                color:
                                  colIndex === 20 &&
                                    getRowCompliance(row) === "NO"
                                    ? "red"
                                    : "inherit",
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        <TextField
                          value={cellValue}
                          disabled={colIndex === 20 || colIndex === 22}
                          inputProps={{
                            "data-cell": `${rowIndex}-${colIndex}`,
                          }}
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, rowIndex, colIndex)
                          }
                          onChange={(e) =>
                            updateCell(rowIndex, colIndex, e.target.value)
                          }
                          variant="standard"
                          fullWidth
                          multiline
                          InputProps={{ disableUnderline: true }}
                          sx={{
                            "& .MuiInputBase-root": {
                              backgroundColor: currentCellBackground,
                            },
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                              fontSize: 10,
                              padding: "2px",
                              lineHeight: 1.1,
                            },
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <td colSpan={23} style={{ ...cellStyle, height: 40 }} />
            </tr>

            <tr>
              <td
                colSpan={2}
                style={{ ...groupHeader, textAlign: "left", paddingLeft: 8 }}
              >
                TIPO DE MUESTRA
              </td>
              <td colSpan={18} style={groupHeader}>
                VALORES PERMITIDOS
              </td>
              <td colSpan={3} style={{ ...cellStyle }} />
            </tr>

            {permittedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  colSpan={2}
                  style={{ ...cellStyle, fontSize: 8, fontWeight: 700 }}
                >
                  {row[0]}
                </td>

                {[
                  row[1],
                  row[2],
                  row[3],
                  row[4],
                  "",
                  "",
                  row[7],
                  "",
                  "",
                  row[10],
                  "",
                  "",
                  row[12],
                  row[13],
                  row[14],
                  row[15],
                  row[16],
                  row[17],
                ].map((value, index) => (
                  <td
                    key={index}
                    style={{
                      ...cellStyle,
                      background: index % 2 === 0 ? "#d9d9d9" : "#fff",
                      fontSize: 8,
                    }}
                  >
                    {value}
                  </td>
                ))}

                {rowIndex === 1 && (
                  <td
                    rowSpan={4}
                    colSpan={3}
                    style={{
                      ...cellStyle,
                      fontWeight: 800,
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {"< Menor qué"}
                    <br />
                    {"> Mayor qué"}
                    <br />
                    Datos analizados: {analysisSummary.total}
                    <br />
                    Cumplen: {analysisSummary.cumple}
                    <br />
                    No cumplen: {analysisSummary.noCumple}
                    <br />
                    Rate: {analysisSummary.rate}%
                  </td>
                )}

                {rowIndex !== 1 && rowIndex !== 2 && rowIndex !== 3 && rowIndex !== 4 && (
                  <td colSpan={3} style={cellStyle} />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>

      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert variant="filled" severity="success" onClose={() => setOpen(false)}>
          Data guardada correctamente.
        </Alert>
      </Snackbar>
    </Box>
  );
}