import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Swal from "sweetalert2";

const API_URL = "https://ambiocomserver.onrender.com/api/trazabilidad-laboratorio-control-proceso";

const DRAFT_STORAGE_KEY = "control_calidad_proceso_destileria_draft";

const EDIT_ALLOWED_ROLES = ["laboratorio", "developer"];

const controlColumns = Array.from({ length: 18 }, (_, index) => `muestra_${index + 1}`);
const extraccionRows = Array.from({ length: 11 }, (_, index) => `extraccion_${index + 1}`);

const controlParametros = [
  { key: "hora", parametro: "HORA", metodo: "", limite: "" },
  { key: "fecha", parametro: "FECHA", metodo: "", limite: "" },
  { key: "codigoMuestra", parametro: "CODIGO DE MUESTRA", metodo: "", limite: "" },
  { key: "muestra", parametro: "MUESTRA", metodo: "", limite: "" },
  { key: "ga", parametro: "G.A % v/v", metodo: "DENSIMETRIA", limite: "Min 96.0 % v/v" },
  { key: "acetaldehido", parametro: "ACETALDEHIDO", metodo: "CROMATOGAFIA DE GASES", limite: "Max 2.0  mg/L" },
  { key: "metanol", parametro: "METANOL", metodo: "CROMATOGAFIA DE GASES", limite: "Max 50  mg/L" },
  { key: "isopropanol", parametro: "ISOPROPANOL", metodo: "CROMATOGAFIA DE GASES", limite: "" },
  { key: "propanol", parametro: "PROPANOL", metodo: "CROMATOGAFIA DE GASES", limite: "" },
  { key: "ipaPropanol", parametro: "IPA + PROPANOL", metodo: "CROMATOGAFIA DE GASES", limite: "Max 5.0  mg/L" },
  { key: "alcoholSup", parametro: "ALCOHOL SUP >3 C", metodo: "CROMATOGAFIA DE GASES", limite: "AUSENTES" },
  { key: "esteres", parametro: "ESTERES", metodo: "CROMATOGAFIA DE GASES", limite: "Max 25 mg/L" },
  { key: "naoh", parametro: "mL de NaOH GASTADOS", metodo: "", limite: "" },
  { key: "acidez", parametro: "ACIDEZ", metodo: "TITULOMETRIA", limite: "Max 10 mg/L" },
  { key: "totalCongeneres", parametro: "TOTAL CONGENERES", metodo: "CROMATOGAFIA DE GASES", limite: "Max 35  mg/L" },
  { key: "color", parametro: "COLOR", metodo: "", limite: "CUMPLE" },
  { key: "olor", parametro: "OLOR", metodo: "", limite: "CUMPLE" },
  { key: "analista", parametro: "ANALISTA", metodo: "", limite: "" },
  { key: "observaciones", parametro: "OBSERVACIONES", metodo: "", limite: "" },
];

const extraccionColumns = [
  { key: "fecha", label: "FECHA", limit: "" },
  { key: "hora", label: "HORA", limit: "" },
  { key: "codigoMuestra", label: "CODIGO DE MUESTRA", limit: "" },
  { key: "alimentacionAlcohol", label: "Alimentación de alcohol", limit: "Min 80 % v/v" },
  { key: "vinazas", label: "Vinazas", limit: "0.005" },
  { key: "flemazas", label: "Flemazas", limit: "0.005" },
  { key: "fondoHidro", label: "Fondo de Hidro", limit: "Max 35 %" },
  { key: "cabezaHidro", label: "Cabeza de Hidro", limit: "Max 95. %" },
  { key: "colasAltas", label: "Colas altas", limit: "Min 60 %" },
  { key: "colasBajas", label: "Colas bajas", limit: "Max 85 %" },
  { key: "extraneutro", label: "Extraneutro", limit: "Min 96,0  %" },
  { key: "tafias", label: "Tafias", limit: "70-96.5 %" },
  { key: "rectificado", label: "Rectificado", limit: "Min 96 %" },
  { key: "decantadorFusel", label: "Decantador de Fusel", limit: "Max 10 %" },
  { key: "analista", label: "ANALISTA", limit: "" },
  { key: "observaciones", label: "OBSERVACIONES", limit: "" },
];

const cellStyle = {
  border: "1px solid #000",
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 10,
  height: 23,
  whiteSpace: "pre-line",
  lineHeight: 1.05,
};

const grayCell = {
  ...cellStyle,
  background: "#d9d9d9",
  fontWeight: 800,
};

const sectionHeader = {
  ...cellStyle,
  background: "#d9d9d9",
  fontWeight: 900,
  fontSize: 14,
  height: 22,
};

const whiteHeader = {
  ...cellStyle,
  background: "#fff",
  fontWeight: 700,
  fontSize: 9,
  height: 38,
};

function createInitialControlData() {
  return controlParametros.reduce((acc, parametro) => {
    acc[parametro.key] = controlColumns.reduce((rowAcc, columnKey) => {
      rowAcc[columnKey] = "";
      return rowAcc;
    }, {});
    return acc;
  }, {});
}

function createInitialExtraccionesData() {
  return extraccionRows.map(() =>
    extraccionColumns.reduce((acc, column) => {
      acc[column.key] = "";
      return acc;
    }, {})
  );
}

function getInitialDraft() {
  return {
    activeTab: 0,
    observacionesGenerales: "",
    fechaConsulta: "",
    fechaRegistro: "",
    registroId: null,
    formMode: "create",
    encabezado: {
      fecha: "",
      tanque: "",
    },
    controlCalidad: createInitialControlData(),
    extracciones: createInitialExtraccionesData(),
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

function formatDateToDDMMYYYY(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}

function formatDDMMYYYYToInput(fecha) {
  if (!fecha) return "";
  const [day, month, year] = String(fecha).split("-");
  if (!day || !month || !year) return "";
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

function validateCellValue(value, rule) {
  if (!value || !rule) return true;

  const normalizedRule = normalizeText(rule);
  const numericValue = parseNumber(value);

  if (["cumple", "ausentes", "n.d", "nd", "n.a", "na"].includes(normalizedRule)) {
    return true;
  }

  if (numericValue === null) return true;

  if (normalizedRule.includes("max") || normalizedRule.includes("<")) {
    const max = parseNumber(rule);
    return max === null ? true : numericValue <= max;
  }

  if (normalizedRule.includes("min") || normalizedRule.includes(">")) {
    const min = parseNumber(rule);
    return min === null ? true : numericValue >= min;
  }

  if (/^\d+(\.\d+)?$/.test(normalizedRule)) {
    const exact = parseNumber(rule);
    return exact === null ? true : numericValue === exact;
  }

  return true;
}

function EditableInput({ value, onChange, disabled, outOfRange = false, fontSize = 9 }) {
  return (
    <TextField
      value={value || ""}
      disabled={disabled}
      onChange={onChange}
      variant="standard"
      fullWidth
      multiline
      InputProps={{ disableUnderline: true }}
      sx={{
        "& .MuiInputBase-root": {
          backgroundColor: outOfRange ? "#ffb3b3" : "#fff",
          minHeight: 22,
        },
        "& .MuiInputBase-input": {
          textAlign: "center",
          fontSize,
          padding: "2px 3px",
          lineHeight: 1.08,
        },
      }}
    />
  );
}

function FormHeader({
  pageLabel,
  observacionesGenerales,
  setObservacionesGenerales,
  canEditTable,
  loading,
}) {
  return (
    <>
      <tr>
        <td colSpan={3} rowSpan={5} style={{ ...cellStyle, height: 60 }}>
          <img
            src="/LogoCompany/logoambiocomsinfondo.png"
            alt="logo"
            style={{ width: 240, height: 75, objectFit: "contain" }}
          />
        </td>

        <td colSpan={15} rowSpan={5} style={{ ...cellStyle, fontWeight: 900, fontSize: 23 }}>
          TRAZABILIDAD DE LOTE DE PRODUCCION
        </td>

        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 13 }}>
          Código: 4-LAB-032
        </td>
      </tr>

      <tr>
        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 13 }}>
          Versión: 3
        </td>
      </tr>

      <tr>
        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 13 }}>
          Fecha de emisión
        </td>
      </tr>

      <tr>
        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 13 }}>
          12-may-26
        </td>
      </tr>

      <tr>
        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 13 }}>
          {pageLabel}
        </td>
      </tr>

      <tr>
        <td colSpan={21} style={{ ...cellStyle, height: 10, borderLeft: "none", borderRight: "none" }} />
      </tr>

      <tr>
        <td colSpan={3} style={grayCell}>
          OBSERVACIONES
        </td>

        <td colSpan={18} style={cellStyle}>
          <TextField
            value={observacionesGenerales}
            disabled={!canEditTable || loading}
            onChange={(event) => setObservacionesGenerales(event.target.value)}
            variant="standard"
            fullWidth
            multiline
            minRows={1}
            maxRows={2}
            placeholder="Digite las observaciones generales del registro..."
            InputProps={{ disableUnderline: true }}
            sx={{
              "& .MuiInputBase-root": {
                minHeight: 30,
                backgroundColor: "#fff",
                px: 1,
              },
              "& .MuiInputBase-input": {
                textAlign: "left",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.25,
              },
            }}
          />
        </td>
      </tr>

      <tr>
        <td colSpan={21} style={{ ...cellStyle, height: 12, borderLeft: "none", borderRight: "none" }} />
      </tr>
    </>
  );
}

function TopFields({ encabezado, setEncabezado, canEditTable }) {
  return (
    <>
      <tr>
        <td style={grayCell}>FECHA:</td>
        <td colSpan={4} style={cellStyle}>
          <EditableInput
            value={encabezado.fecha}
            disabled={!canEditTable}
            onChange={(event) =>
              setEncabezado((prev) => ({ ...prev, fecha: event.target.value }))
            }
          />
        </td>

        <td style={grayCell}>TANQUE</td>
        <td colSpan={15} style={cellStyle}>
          <EditableInput
            value={encabezado.tanque}
            disabled={!canEditTable}
            onChange={(event) =>
              setEncabezado((prev) => ({ ...prev, tanque: event.target.value }))
            }
          />
        </td>
      </tr>

      <tr>
        <td colSpan={21} style={{ ...cellStyle, height: 20, borderLeft: "none", borderRight: "none" }} />
      </tr>
    </>
  );
}

function ControlCalidadTable({
  encabezado,
  setEncabezado,
  data,
  updateControlCell,
  canEditTable,
  observacionesGenerales,
  setObservacionesGenerales,
  loading,
}) {
  return (
    <Paper sx={{ overflow: "auto", p: 0 }}>
      <table className="excelTable">
        <colgroup>
          <col style={{ width: 125 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 110 }} />
          {controlColumns.map((column) => (
            <col key={column} style={{ width: 65 }} />
          ))}
        </colgroup>

        <tbody>
          <FormHeader
            pageLabel="PAG 3-3"
            observacionesGenerales={observacionesGenerales}
            setObservacionesGenerales={setObservacionesGenerales}
            canEditTable={canEditTable}
            loading={loading}
          />

          <tr>
            <td colSpan={21} style={sectionHeader}>
              CONTROL DE CALIDAD EN PROCESO
            </td>
          </tr>

          <tr>
            <td colSpan={21} style={{ ...cellStyle, height: 10, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <TopFields encabezado={encabezado} setEncabezado={setEncabezado} canEditTable={canEditTable} />

          <tr>
            <td colSpan={21} style={sectionHeader}>
              MUESTRAS DE DESTILERIA
            </td>
          </tr>

          <tr>
            <td colSpan={21} style={{ ...cellStyle, height: 10, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr>
            <td style={grayCell}>PARAMETRO</td>
            <td style={grayCell}>METODO</td>
            <td style={grayCell}>LIMITE</td>
            {controlColumns.map((column, index) => (
              <td key={column} style={{ ...whiteHeader, fontSize: 8 }}>
                {index + 1}
              </td>
            ))}
          </tr>

          {controlParametros.map((row) => {
            if (row.key === "observaciones") {
              return (
                <tr key={row.key}>
                  <td style={{ ...cellStyle, fontWeight: 700 }}>
                    OBSERVACIONES
                  </td>

                  <td colSpan={20} style={cellStyle}>
                    <EditableInput
                      value={data?.[row.key]?.muestra_1 || ""}
                      disabled={!canEditTable}
                      onChange={(event) =>
                        updateControlCell(row.key, "muestra_1", event.target.value)
                      }
                    />
                  </td>
                </tr>
              );
            }

            return (
              <tr key={row.key}>
                <td style={{ ...cellStyle, fontWeight: 700 }}>
                  {row.parametro}
                </td>

                <td style={{ ...cellStyle, fontSize: 8 }}>
                  {row.metodo}
                </td>

                <td style={{ ...cellStyle, fontSize: 8 }}>
                  {row.limite}
                </td>

                {controlColumns.map((column) => {
                  const value = data?.[row.key]?.[column] || "";
                  const outOfRange = !validateCellValue(value, row.limite);

                  return (
                    <td key={`${row.key}-${column}`} style={cellStyle}>
                      <EditableInput
                        value={value}
                        disabled={!canEditTable}
                        outOfRange={outOfRange}
                        onChange={(event) =>
                          updateControlCell(row.key, column, event.target.value)
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Paper>
  );
}

function ExtraccionesTable({
  encabezado,
  setEncabezado,
  data,
  updateExtraccionCell,
  canEditTable,
  observacionesGenerales,
  setObservacionesGenerales,
  loading,
}) {
  return (
    <Paper sx={{ overflow: "auto", p: 0 }}>
      <table className="excelTable">
        <colgroup>
          <col style={{ width: 78 }} />
          <col style={{ width: 70 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 75 }} />
          <col style={{ width: 75 }} />
          <col style={{ width: 85 }} />
          <col style={{ width: 85 }} />
          <col style={{ width: 75 }} />
          <col style={{ width: 75 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 70 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 95 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 120 }} />
        </colgroup>

        <tbody>
          <FormHeader
            pageLabel="PAG 3-3"
            observacionesGenerales={observacionesGenerales}
            setObservacionesGenerales={setObservacionesGenerales}
            canEditTable={canEditTable}
            loading={loading}
          />

          <tr>
            <td colSpan={21} style={sectionHeader}>
              CONTROL DE CALIDAD EN PROCESO
            </td>
          </tr>

          <tr>
            <td colSpan={21} style={{ ...cellStyle, height: 20, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <TopFields encabezado={encabezado} setEncabezado={setEncabezado} canEditTable={canEditTable} />

          <tr>
            <td colSpan={21} style={sectionHeader}>
              EXTRACCIONES EN LA DESTILERIA
            </td>
          </tr>

          <tr>
            <td colSpan={21} style={{ ...cellStyle, height: 18, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr>
            <td style={grayCell}>METODO</td>
            <td colSpan={2} style={{ ...cellStyle, fontWeight: 700 }}>
              DENSIMETRIA
            </td>
            <td colSpan={18} style={{ ...cellStyle, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr>
            <td colSpan={21} style={{ ...cellStyle, height: 18, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr>
            {extraccionColumns.map((column) => (
              <td
                key={column.key}
                colSpan={column.key === "observaciones" ? 2 : 1}
                rowSpan={2}
                style={{ ...whiteHeader, fontSize: 8.5 }}
              >
                {column.label}
              </td>
            ))}
            <td colSpan={4} rowSpan={2} style={{ ...whiteHeader, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr />

          {data.map((row, rowIndex) => (
            <tr key={`extraccion-${rowIndex}`}>
              {extraccionColumns.map((column) => {
                const value = row[column.key] || "";
                const outOfRange = !validateCellValue(value, column.limit);

                return (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    colSpan={column.key === "observaciones" ? 2 : 1}
                    style={cellStyle}
                  >
                    <EditableInput
                      value={value}
                      disabled={!canEditTable}
                      outOfRange={outOfRange}
                      onChange={(event) =>
                        updateExtraccionCell(rowIndex, column.key, event.target.value)
                      }
                    />
                  </td>
                );
              })}
              <td colSpan={4} style={{ ...cellStyle, borderLeft: "none", borderRight: "none" }} />
            </tr>
          ))}

          <tr>
            <td style={grayCell}>LIMITES</td>
            <td style={cellStyle} />
            <td style={cellStyle} />
            {extraccionColumns.slice(3, 14).map((column) => (
              <td key={`limit-${column.key}`} style={{ ...cellStyle, fontSize: 8 }}>
                {column.limit}
              </td>
            ))}
            <td colSpan={7} style={{ ...cellStyle, borderLeft: "none", borderRight: "none" }} />
          </tr>

          <tr>
            <td colSpan={21} style={grayCell} />
          </tr>
        </tbody>
      </table>
    </Paper>
  );
}

export default function ControlCalidadProcesoDestileria() {
  const draft = getDraftData();

  // const { rol } = useAuth();
  // const canEditTable = EDIT_ALLOWED_ROLES.includes(rol);
  const canEditTable = true;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(draft.activeTab || 0);
  const [observacionesGenerales, setObservacionesGenerales] = useState(
    draft.observacionesGenerales || ""
  );

  const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
  const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");

  const [registroId, setRegistroId] = useState(draft.registroId || null);
  const [formMode, setFormMode] = useState(
    draft.formMode || (draft.registroId ? "edit" : "create")
  );

  const [encabezado, setEncabezado] = useState(
    draft.encabezado || { fecha: "", tanque: "" }
  );

  const [controlCalidad, setControlCalidad] = useState(
    draft.controlCalidad || createInitialControlData()
  );

  const [extracciones, setExtracciones] = useState(
    draft.extracciones || createInitialExtraccionesData()
  );

  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [registrosFecha, setRegistrosFecha] = useState([]);
  const [registroIndex, setRegistroIndex] = useState(0);

  const currentTitle = useMemo(
    () => activeTab === 0 ? "Control de calidad en proceso" : "Extracciones en la destilería",
    [activeTab]
  );

  useEffect(() => {
    const loadFechasDisponibles = async () => {
      try {
        const response = await axios.get(`${API_URL}/fechas`);
        setFechasDisponibles(response.data?.fechas || []);
      } catch (error) {
        console.error("Error cargando fechas disponibles:", error);
      }
    };

    loadFechasDisponibles();
  }, []);

  const refreshFechasDisponibles = async () => {
    try {
      const response = await axios.get(`${API_URL}/fechas`);
      setFechasDisponibles(response.data?.fechas || []);
    } catch (error) {
      console.error("Error actualizando fechas disponibles:", error);
    }
  };

  const isFechaDisponible = (date) => {
    if (!date || fechasDisponibles.length === 0) return false;
    return fechasDisponibles.includes(date.format("DD-MM-YYYY"));
  };

  useEffect(() => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        activeTab,
        observacionesGenerales,
        fechaConsulta,
        fechaRegistro,
        registroId,
        formMode,
        encabezado,
        controlCalidad,
        extracciones,
        updatedAt: new Date().toISOString(),
      })
    );
  }, [
    activeTab,
    observacionesGenerales,
    fechaConsulta,
    fechaRegistro,
    registroId,
    formMode,
    encabezado,
    controlCalidad,
    extracciones,
  ]);

  const updateControlCell = (rowKey, columnKey, value) => {
    if (!canEditTable) return;

    setControlCalidad((prev) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        [columnKey]: value,
      },
    }));
  };

  const updateExtraccionCell = (rowIndex, columnKey, value) => {
    if (!canEditTable) return;

    setExtracciones((prev) => {
      const copy = [...prev];
      copy[rowIndex] = {
        ...copy[rowIndex],
        [columnKey]: value,
      };
      return copy;
    });
  };

  const buildPayload = () => ({
    formato: "4-LAB-032",
    version: "3",
    pagina: "3-3",
    tabla: "Control de calidad en proceso / Extracciones en la destilería",
    fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
    fechaGuardado: new Date().toISOString(),
    observacionesGenerales,
    encabezado,
    controlCalidad,
    extracciones,
  });

  const loadRegistroSeleccionado = (records, index) => {
    const registro = records[index];
    if (!registro) return;

    setRegistroId(registro._id || registro.id || null);
    setFormMode("edit");
    setRegistroIndex(index);

    setFechaRegistro(formatDDMMYYYYToInput(registro.fechaRegistro));
    setObservacionesGenerales(registro.observacionesGenerales || "");
    setEncabezado(registro.encabezado || { fecha: "", tanque: "" });
    setControlCalidad(registro.controlCalidad || createInitialControlData());
    setExtracciones(registro.extracciones || createInitialExtraccionesData());
  };

  const goToPreviousRegistro = () => {
    if (registroIndex <= 0) return;
    loadRegistroSeleccionado(registrosFecha, registroIndex - 1);
  };

  const goToNextRegistro = () => {
    if (registroIndex >= registrosFecha.length - 1) return;
    loadRegistroSeleccionado(registrosFecha, registroIndex + 1);
  };

  const handleNewRegistro = () => {
    setRegistroId(null);
    setFormMode("create");
    setObservacionesGenerales("");
    setEncabezado({ fecha: "", tanque: "" });
    setControlCalidad(createInitialControlData());
    setExtracciones(createInitialExtraccionesData());
    setRegistroIndex(0);

    if (fechaConsulta) {
      setFechaRegistro(fechaConsulta);
    }

    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleSave = async () => {
    if (!canEditTable) {
      Swal.fire({
        icon: "warning",
        title: "Sin permisos",
        text: "No tienes permisos para modificar esta información.",
      });
      return;
    }

    if (!fechaRegistro) {
      Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Selecciona la fecha con la que se guardará el registro.",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload();
      const isEditingExistingRecord = formMode === "edit" && Boolean(registroId);

      const response = isEditingExistingRecord
        ? await axios.patch(`${API_URL}/${registroId}`, payload)
        : await axios.post(API_URL, payload);

      const savedData = response.data?.data || payload;
      const savedId = savedData?._id || savedData?.id || response.data?.id || null;

      setRegistroId(savedId);
      setFormMode("edit");
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      setRegistrosFecha((prev) => {
        const savedFecha = savedData.fechaRegistro || payload.fechaRegistro;
        const sameDateRecords = prev.filter(
          (item) => item.fechaRegistro === savedFecha
        );

        const existingIndex = sameDateRecords.findIndex((item) => {
          const itemId = item._id || item.id;
          return itemId === savedId;
        });

        if (existingIndex >= 0) {
          const updatedRecords = sameDateRecords.map((item) => {
            const itemId = item._id || item.id;
            return itemId === savedId ? savedData : item;
          });

          setRegistroIndex(existingIndex);
          return updatedRecords;
        }

        const updatedRecords = [...sameDateRecords, savedData];
        setRegistroIndex(updatedRecords.length - 1);
        return updatedRecords;
      });

      Swal.fire({
        icon: "success",
        title: isEditingExistingRecord ? "Registro actualizado" : "Registro guardado",
        text: `Fecha de registro: ${payload.fechaRegistro}`,
        timer: 1800,
        showConfirmButton: false,
      });

      setOpen(true);
      await refreshFechasDisponibles();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text:
          error.response?.data?.message ||
          error.message ||
          "No fue posible guardar la información.",
      });
    } finally {
      setLoading(false);
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
      setLoading(true);

      const fecha = formatDateToDDMMYYYY(fechaConsulta);

      const response = await axios.get(`${API_URL}/by-date`, {
        params: { fecha },
      });

      const records = Array.isArray(response.data?.data)
        ? response.data.data
        : response.data?.data
          ? [response.data.data]
          : [];

      setRegistrosFecha(records);
      setRegistroIndex(0);

      if (!records.length) {
        setRegistroId(null);
        setFormMode("create");
        setFechaRegistro(fechaConsulta);
        setObservacionesGenerales("");
        setEncabezado({ fecha: "", tanque: "" });
        setControlCalidad(createInitialControlData());
        setExtracciones(createInitialExtraccionesData());

        Swal.fire({
          icon: "info",
          title: "Sin registros",
          text: `No hay información guardada para ${fecha}. Puedes crear un nuevo registro.`,
          timer: 1800,
          showConfirmButton: false,
        });

        return;
      }

      loadRegistroSeleccionado(records, 0);

      Swal.fire({
        icon: "success",
        title: "Consulta ejecutada",
        text: `Se encontraron ${records.length} registro(s) para ${fecha}.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al consultar",
        text:
          error.response?.data?.message ||
          error.message ||
          "No fue posible consultar la información.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    Swal.fire({
      icon: "info",
      title: "Exportación pendiente",
      text: "La función de exportar Excel queda pendiente de conectar.",
    });
  };

  return (
    <Box sx={{ p: 1, mt: 6, bgcolor: "#f3f3f3", minHeight: "92vh" }}>
      <Box
        sx={{
          mb: 1.5,
          mt: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha consulta"
              value={fechaConsulta ? dayjs(fechaConsulta) : null}
              onChange={(value) => {
                setFechaConsulta(value ? value.format("YYYY-MM-DD") : "");
              }}
              shouldDisableDate={(date) => !isFechaDisponible(date)}
              disabled={loading || fechasDisponibles.length === 0}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 155 },
                },
              }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleExecuteByDate}
            disabled={!fechaConsulta || loading}
          >
            Ejecutar
          </Button>

          {registrosFecha.length > 1 && (
            <Box
              sx={{
                position: "fixed",
                bottom: 20,
                right: 25,
                zIndex: 9999,
                background: "#ffffffee",
                backdropFilter: "blur(8px)",
                border: "1px solid #dcdcdc",
                borderRadius: 3,
                px: 1,
                py: 0.8,
                boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={goToPreviousRegistro}
                  disabled={registroIndex === 0 || loading}
                  sx={{
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderRadius: 2,
                  }}
                >
                  <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
                </Button>

                <Chip
                  size="small"
                  color="primary"
                  label={`${registroIndex + 1} / ${registrosFecha.length}`}
                  sx={{ fontWeight: 700, minWidth: 58 }}
                />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={goToNextRegistro}
                  disabled={registroIndex >= registrosFecha.length - 1 || loading}
                  sx={{
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderRadius: 2,
                  }}
                >
                  <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
          >
            Exportar Excel
          </Button>

          <TextField
            label="Fecha registro"
            type="date"
            size="small"
            value={fechaRegistro}
            disabled={!canEditTable || loading}
            onChange={(event) => setFechaRegistro(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<NoteAddIcon />}
            onClick={handleNewRegistro}
            disabled={!canEditTable || loading}
          >
            Nuevo registro
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!canEditTable || loading}
          >
            {formMode === "edit" && registroId ? "Actualizar data" : "Guardar data"}
          </Button>
        </Box>
      </Box>

      {activeTab === 0 ? (
        <ControlCalidadTable
          encabezado={encabezado}
          setEncabezado={setEncabezado}
          data={controlCalidad}
          updateControlCell={updateControlCell}
          canEditTable={canEditTable}
          observacionesGenerales={observacionesGenerales}
          setObservacionesGenerales={setObservacionesGenerales}
          loading={loading}
        />
      ) : (
        <ExtraccionesTable
          encabezado={encabezado}
          setEncabezado={setEncabezado}
          data={extracciones}
          updateExtraccionCell={updateExtraccionCell}
          canEditTable={canEditTable}
          observacionesGenerales={observacionesGenerales}
          setObservacionesGenerales={setObservacionesGenerales}
          loading={loading}
        />
      )}

      <Box
        sx={{
          mt: 0.2,
          px: 1,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#e9edf2",
          borderTop: "1px solid #b8c2cc",
          borderLeft: "1px solid #c7d0d9",
          borderRight: "1px solid #c7d0d9",
          borderBottom: "1px solid #aab4bf",
          borderRadius: "0 0 6px 6px",
          width: "fit-content",
          minWidth: "100%",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <Button
          onClick={() => setActiveTab(0)}
          sx={{
            minWidth: 220,
            height: 34,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "none",
            borderRadius: "6px 6px 0 0",
            border: "1px solid #aeb7c2",
            borderBottom: activeTab === 0 ? "2px solid #fff" : "1px solid #aeb7c2",
            bgcolor: activeTab === 0 ? "#ffffff" : "#dfe5eb",
            color: activeTab === 0 ? "#0d47a1" : "#455a64",
            boxShadow: activeTab === 0 ? "0 -1px 4px rgba(0,0,0,0.08)" : "none",
            "&:hover": {
              bgcolor: activeTab === 0 ? "#ffffff" : "#d5dde5",
            },
          }}
        >
          Control de calidad en proceso
        </Button>

        <Button
          onClick={() => setActiveTab(1)}
          sx={{
            minWidth: 220,
            height: 34,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "none",
            borderRadius: "6px 6px 0 0",
            border: "1px solid #aeb7c2",
            borderBottom: activeTab === 1 ? "2px solid #fff" : "1px solid #aeb7c2",
            bgcolor: activeTab === 1 ? "#ffffff" : "#dfe5eb",
            color: activeTab === 1 ? "#0d47a1" : "#455a64",
            boxShadow: activeTab === 1 ? "0 -1px 4px rgba(0,0,0,0.08)" : "none",
            "&:hover": {
              bgcolor: activeTab === 1 ? "#ffffff" : "#d5dde5",
            },
          }}
        >
          Extracciones en la destilería
        </Button>
      </Box>

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

      <style>{`
        .excelTable {
          border-collapse: collapse;
          width: 100%;
          min-width: 1540px;
          background: #fff;
          table-layout: fixed;
          font-family: Arial, sans-serif;
        }
      `}</style>
    </Box>
  );
}