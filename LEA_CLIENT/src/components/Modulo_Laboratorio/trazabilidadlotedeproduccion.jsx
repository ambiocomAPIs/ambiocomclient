import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Chip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Swal from "sweetalert2";
import { exportTrazabilidadLoteProduccionLaboratorioExcel } from "./utils_laboratorio/exportTrazabilidadLoteProduccionLaboratorioExcel";

const API_URL = "https://ambiocomserver.onrender.com/api/trazabilidadloteproduccionlaboratorio";
const DRAFT_STORAGE_KEY = "tabla_trazabilidad_laboratorio_draft";

const EDIT_ALLOWED_ROLES = ["laboratorio", "developer"];

const analysisColumns = [
  "CODIGO DE\nMUESTRA",
  "GRADO\nALCOHOLICO\n%v/v",
  "ACETAL",
  "METANOL",
  "IPA",
  "PROPANOL",
  "ETILACETATO",
  "2- BUTANOL",
  "ISOBUTANOL",
  "BUTANOL",
  "3-PENTANOL",
  "AMILICO 1",
  "AMILICO 2",
  "FURFURAL",
  "ISOAMILACETA\nTO",
  "ALCOHOLES\nSUPERIORE\nS",
  "ESTERES",
  "mL de NaOH\ngastados",
  "ACIDEZ",
  "TOTAL\nCONGENERES",
  "ORGANOLEPTIC\nO",
  "TANQUE",
  "ANALISTA",
  "OBSERVACIONES",
];

const permittedRows = [
  [
    "ORIGEN CAÑA",
    "Min 95",
    "Max 200",
    "Max 200",
    "Max 7.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Max 5.0",
    "",
    "Max 2000",
    "Max 10",
    "",
    "MAX 100",
    "Max 2700",
    "",
    "",
    "",
    "",
  ],
  [
    "ORIGEN MAIZ",
    "Min 99,5",
    "Max 5.0",
    "Max 10",
    "Max 7.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "N.D",
    "",
    "Max 10",
    "Max 300",
    "",
    "Max 10",
    "Max 35",
    "",
    "",
    "",
    "",
  ],
];

const editableRows = 2;

const cellStyle = {
  border: "1px solid #000",
  padding: 0,
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 11.5,
  height: 22,
  whiteSpace: "pre-line",
};

const headerCell = {
  ...cellStyle,
  background: "#fff",
  fontWeight: 500,
  fontSize: 8,
  height: 35,
};

const labelCell = {
  ...cellStyle,
  background: "#d9d9d9",
  fontWeight: 800,
};

const sectionHeader = {
  ...cellStyle,
  background: "#d9d9d9",
  fontWeight: 900,
  fontSize: 14,
  height: 18,
};

function createInitialData() {
  return Array.from({ length: editableRows }, () =>
    analysisColumns.reduce((acc, _, index) => {
      acc[`col_${index}`] = "";
      return acc;
    }, {})
  );
}

function getInitialDraft() {
  return {
    observacionesGenerales: "",
    fechaConsulta: "",
    fechaRegistro: "",
    registroId: null,
    formMode: "create",

    fecha: "",
    lote: "",
    tipoAlcohol: "",
    tanque: "",
    fechaInicioLlenado: "",
    horaInicioLlenado: "",
    fechaFinalLlenado: "",
    horaFinalLlenado: "",

    codigoInterno: "",
    fechaRecibo: "",
    origen: "",
    proveedor: "",
    tipoAlcoholMateriaPrima: "",
    gradoAlcoholico: "",
    tanqueOrigen: "",
    volumenAlimentado: "",

    data: createInitialData(),
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

  if (
    normalizedRule === "n.d" ||
    normalizedRule === "nd" ||
    normalizedRule === "n.a" ||
    normalizedRule === "na"
  ) {
    return true;
  }

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

  if (normalizedRule.includes("min") || normalizedRule.includes(">")) {
    const min = parseNumber(rule);
    if (min === null) return true;
    return numericValue >= min;
  }

  return true;
}

function getRuleForCell(rowIndex, colIndex) {
  return permittedRows[rowIndex]?.[colIndex] || "";
}

function isCellOutOfRange(rowIndex, row, colIndex) {
  const rule = getRuleForCell(rowIndex, colIndex);
  const value = row[`col_${colIndex}`];

  if (!rule) return false;

  return !validateCellValue(value, rule);
}

export default function TablaTrazabilidadLaboratorio() {
  const draft = getDraftData();

  // const { rol } = useAuth();
  // const canEditTable = EDIT_ALLOWED_ROLES.includes(rol);
  const canEditTable = true;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fechasDisponibles, setFechasDisponibles] = useState([]);

  const [observacionesGenerales, setObservacionesGenerales] = useState(
    draft.observacionesGenerales || ""
  );

  const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
  const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");

  const [registroId, setRegistroId] = useState(draft.registroId || null);
  const [formMode, setFormMode] = useState(
    draft.formMode || (draft.registroId ? "edit" : "create")
  );

  const [registrosFecha, setRegistrosFecha] = useState([]);
  const [registroIndex, setRegistroIndex] = useState(0);

  const [fecha, setFecha] = useState(draft.fecha || "");
  const [lote, setLote] = useState(draft.lote || "");
  const [tipoAlcohol, setTipoAlcohol] = useState(draft.tipoAlcohol || "");
  const [tanque, setTanque] = useState(draft.tanque || "");

  const [fechaInicioLlenado, setFechaInicioLlenado] = useState(
    draft.fechaInicioLlenado || ""
  );
  const [horaInicioLlenado, setHoraInicioLlenado] = useState(
    draft.horaInicioLlenado || ""
  );
  const [fechaFinalLlenado, setFechaFinalLlenado] = useState(
    draft.fechaFinalLlenado || ""
  );
  const [horaFinalLlenado, setHoraFinalLlenado] = useState(
    draft.horaFinalLlenado || ""
  );

  const [codigoInterno, setCodigoInterno] = useState(draft.codigoInterno || "");
  const [fechaRecibo, setFechaRecibo] = useState(draft.fechaRecibo || "");
  const [origen, setOrigen] = useState(draft.origen || "");
  const [proveedor, setProveedor] = useState(draft.proveedor || "");
  const [tipoAlcoholMateriaPrima, setTipoAlcoholMateriaPrima] = useState(
    draft.tipoAlcoholMateriaPrima || ""
  );
  const [gradoAlcoholico, setGradoAlcoholico] = useState(
    draft.gradoAlcoholico || ""
  );
  const [tanqueOrigen, setTanqueOrigen] = useState(draft.tanqueOrigen || "");
  const [volumenAlimentado, setVolumenAlimentado] = useState(
    draft.volumenAlimentado || ""
  );

  const [data, setData] = useState(draft.data || createInitialData());

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
    const draftPayload = {
      observacionesGenerales,
      fechaConsulta,
      fechaRegistro,
      registroId,
      formMode,

      fecha,
      lote,
      tipoAlcohol,
      tanque,
      fechaInicioLlenado,
      horaInicioLlenado,
      fechaFinalLlenado,
      horaFinalLlenado,

      codigoInterno,
      fechaRecibo,
      origen,
      proveedor,
      tipoAlcoholMateriaPrima,
      gradoAlcoholico,
      tanqueOrigen,
      volumenAlimentado,

      data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
  }, [
    observacionesGenerales,
    fechaConsulta,
    fechaRegistro,
    registroId,
    formMode,
    fecha,
    lote,
    tipoAlcohol,
    tanque,
    fechaInicioLlenado,
    horaInicioLlenado,
    fechaFinalLlenado,
    horaFinalLlenado,
    codigoInterno,
    fechaRecibo,
    origen,
    proveedor,
    tipoAlcoholMateriaPrima,
    gradoAlcoholico,
    tanqueOrigen,
    volumenAlimentado,
    data,
  ]);

  const updateCell = (rowIndex, colIndex, value) => {
    if (!canEditTable) return;

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
    if (e.key !== "Enter") return;

    e.preventDefault();

    const nextInput = document.querySelector(
      `[data-cell="${rowIndex + 1}-${colIndex}"]`
    );

    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
    }
  };

  const buildPayload = () => ({
    formato: "4-LAB-032",
    version: "3",
    pagina: "3-3",
    tabla: "Trazabilidad de lote de producción",
    fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
    fechaGuardado: new Date().toISOString(),
    observacionesGenerales,

    encabezado: {
      fecha,
      lote,
      tipoAlcohol,
      tanque,
      fechaInicioLlenado,
      horaInicioLlenado,
      fechaFinalLlenado,
      horaFinalLlenado,
    },

    materiaPrima: {
      codigoInterno,
      fechaRecibo,
      origen,
      proveedor,
      tipoAlcohol: tipoAlcoholMateriaPrima,
      gradoAlcoholico,
      tanqueOrigen,
      volumenAlimentado,
    },

    analisisFisicoquimicoAlimentacion: data,
  });

  const loadRegistroSeleccionado = (records, index) => {
    const registro = records[index];
    if (!registro) return;

    setObservacionesGenerales(registro.observacionesGenerales || "");
    setRegistroId(registro._id || registro.id || null);
    setFormMode("edit");
    setRegistroIndex(index);

    setFechaRegistro(formatDDMMYYYYToInput(registro.fechaRegistro));

    setFecha(registro.encabezado?.fecha || "");
    setLote(registro.encabezado?.lote || "");
    setTipoAlcohol(registro.encabezado?.tipoAlcohol || "");
    setTanque(registro.encabezado?.tanque || "");
    setFechaInicioLlenado(registro.encabezado?.fechaInicioLlenado || "");
    setHoraInicioLlenado(registro.encabezado?.horaInicioLlenado || "");
    setFechaFinalLlenado(registro.encabezado?.fechaFinalLlenado || "");
    setHoraFinalLlenado(registro.encabezado?.horaFinalLlenado || "");

    setCodigoInterno(registro.materiaPrima?.codigoInterno || "");
    setFechaRecibo(registro.materiaPrima?.fechaRecibo || "");
    setOrigen(registro.materiaPrima?.origen || "");
    setProveedor(registro.materiaPrima?.proveedor || "");
    setTipoAlcoholMateriaPrima(registro.materiaPrima?.tipoAlcohol || "");
    setGradoAlcoholico(registro.materiaPrima?.gradoAlcoholico || "");
    setTanqueOrigen(registro.materiaPrima?.tanqueOrigen || "");
    setVolumenAlimentado(registro.materiaPrima?.volumenAlimentado || "");

    setData(
      Array.isArray(registro.analisisFisicoquimicoAlimentacion)
        ? registro.analisisFisicoquimicoAlimentacion
        : createInitialData()
    );
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
    setObservacionesGenerales("");
    setRegistroId(null);
    setFormMode("create");
    setData(createInitialData());

    setFecha("");
    setLote("");
    setTipoAlcohol("");
    setTanque("");
    setFechaInicioLlenado("");
    setHoraInicioLlenado("");
    setFechaFinalLlenado("");
    setHoraFinalLlenado("");

    setCodigoInterno("");
    setFechaRecibo("");
    setOrigen("");
    setProveedor("");
    setTipoAlcoholMateriaPrima("");
    setGradoAlcoholico("");
    setTanqueOrigen("");
    setVolumenAlimentado("");

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
        setData(createInitialData());
        setObservacionesGenerales("");

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

  const renderSmallInput = (value, onChange, disabled = false) => (
    <TextField
      value={value}
      disabled={disabled || !canEditTable}
      onChange={onChange}
      variant="standard"
      fullWidth
      multiline
      InputProps={{ disableUnderline: true }}
      sx={{
        "& .MuiInputBase-root": {
          minHeight: 20,
          backgroundColor: "#fff",
        },
        "& .MuiInputBase-input": {
          textAlign: "center",
          fontSize: 10,
          padding: "1px 3px",
          lineHeight: 1.1,
        },
      }}
    />
  );

  return (
    <Box sx={{ p: 1.0, mt: 6.0, bgcolor: "#f3f3f3", minHeight: "92vh" }}>
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
            disabled={loading}
            onClick={() =>
              exportTrazabilidadLoteProduccionLaboratorioExcel({
                observacionesGenerales,
                fechaRegistro,
                encabezado: {
                  fecha,
                  lote,
                  tipoAlcohol,
                  tanque,
                  fechaInicioLlenado,
                  horaInicioLlenado,
                  fechaFinalLlenado,
                  horaFinalLlenado,
                },
                materiaPrima: {
                  codigoInterno,
                  fechaRecibo,
                  origen,
                  proveedor,
                  tipoAlcohol: tipoAlcoholMateriaPrima,
                  gradoAlcoholico,
                  tanqueOrigen,
                  volumenAlimentado,
                },
                analisisFisicoquimicoAlimentacion: data,
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
            disabled={!canEditTable || loading}
            onChange={(e) => setFechaRegistro(e.target.value)}
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
            {Array.from({ length: 24 }).map((_, index) => (
              <col
                key={index}
                style={{
                  width: index === 23 ? 190 : 65,
                }}
              />
            ))}
          </colgroup>

          <tbody>
            <tr>
              <td colSpan={4} rowSpan={5} style={{ ...cellStyle, height: 82 }}>
                <img
                  src="/LogoCompany/logoambiocomsinfondo.png"
                  alt="logo"
                  style={{ width: 220, height: 60, objectFit: "contain" }}
                />
              </td>

              <td
                colSpan={17}
                rowSpan={5}
                style={{ ...cellStyle, fontWeight: 900, fontSize: 21 }}
              >
                TRAZABILIDAD DE LOTE DE PRODUCCION
              </td>

              <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 14 }}>
                Código: 4-LAB-032
              </td>
            </tr>

            <tr>
              <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 14 }}>
                Versión: 3
              </td>
            </tr>

            <tr>
              <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 14 }}>
                Fecha de emisión
              </td>
            </tr>

            <tr>
              <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 14 }}>
                12-may-26
              </td>
            </tr>

            <tr>
              <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 14 }}>
                PAG 3-3
              </td>
            </tr>

            <tr>
              <td colSpan={24} style={{ ...cellStyle, height: 10, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td colSpan={4} style={labelCell}>
                OBSERVACIONES
              </td>

              <td colSpan={20} style={cellStyle}>
                <TextField
                  value={observacionesGenerales}
                  disabled={!canEditTable || loading}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
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
              <td colSpan={24} style={{ ...cellStyle, height: 10, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td style={labelCell}>FECHA</td>
              <td colSpan={2} style={cellStyle}>
                {renderSmallInput(fecha, (e) => setFecha(e.target.value))}
              </td>

              <td colSpan={1} style={{ border: "none" }} />

              <td colSpan={2} style={labelCell}>
                TIPO DE ALCOHOL
              </td>
              <td colSpan={5} style={cellStyle}>
                {renderSmallInput(tipoAlcohol, (e) => setTipoAlcohol(e.target.value))}
              </td>

              <td style={labelCell}>TANQUE</td>
              <td colSpan={2} style={cellStyle}>
                {renderSmallInput(tanque, (e) => setTanque(e.target.value))}
              </td>

              <td colSpan={10} style={{ border: "none" }} />
            </tr>

            <tr>
              <td style={labelCell}>LOTE</td>
              <td colSpan={2} style={cellStyle}>
                {renderSmallInput(lote, (e) => setLote(e.target.value))}
              </td>
              <td colSpan={21} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={24} style={{ ...cellStyle, height: 20, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td colSpan={3} rowSpan={2} style={labelCell}>
                FECHA INICIO LLENADO DEL{"\n"}TANQUE
              </td>
              <td colSpan={6} rowSpan={2} style={cellStyle}>
                {renderSmallInput(
                  fechaInicioLlenado,
                  (e) => setFechaInicioLlenado(e.target.value)
                )}
              </td>

              <td colSpan={1} style={{ border: "none" }} />

              <td style={labelCell}>HORA</td>
              <td colSpan={1} style={cellStyle}>
                {renderSmallInput(
                  horaInicioLlenado,
                  (e) => setHoraInicioLlenado(e.target.value)
                )}
              </td>

              <td colSpan={12} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={15} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={3} rowSpan={2} style={labelCell}>
                FECHA FINAL LLENADO DEL{"\n"}TANQUE
              </td>
              <td colSpan={6} rowSpan={2} style={cellStyle}>
                {renderSmallInput(
                  fechaFinalLlenado,
                  (e) => setFechaFinalLlenado(e.target.value)
                )}
              </td>

              <td colSpan={1} style={{ border: "none" }} />

              <td style={labelCell}>HORA</td>
              <td colSpan={1} style={cellStyle}>
                {renderSmallInput(
                  horaFinalLlenado,
                  (e) => setHoraFinalLlenado(e.target.value)
                )}
              </td>

              <td colSpan={12} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={15} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={24} style={{ ...cellStyle, height: 22, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td colSpan={24} style={sectionHeader}>
                MATERIA PRIMA
              </td>
            </tr>

            <tr>
              <td colSpan={24} style={{ ...cellStyle, height: 14, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                CODIGO INTERNO
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(codigoInterno, (e) => setCodigoInterno(e.target.value))}
              </td>

              <td style={{ border: "none" }} />

              <td colSpan={2} style={labelCell}>
                FECHA DE RECIBO
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(fechaRecibo, (e) => setFechaRecibo(e.target.value))}
              </td>

              <td colSpan={13} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                ORIGEN
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(origen, (e) => setOrigen(e.target.value))}
              </td>
              <td colSpan={19} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                PROVEEDOR
              </td>
              <td colSpan={22} style={cellStyle}>
                {renderSmallInput(proveedor, (e) => setProveedor(e.target.value))}
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                TIPO DE ALCOHOL
              </td>
              <td colSpan={22} style={cellStyle}>
                {renderSmallInput(
                  tipoAlcoholMateriaPrima,
                  (e) => setTipoAlcoholMateriaPrima(e.target.value)
                )}
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                GRADO ALCOHOLICO
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(gradoAlcoholico, (e) => setGradoAlcoholico(e.target.value))}
              </td>
              <td colSpan={19} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                TANQUE DE ORIGEN
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(tanqueOrigen, (e) => setTanqueOrigen(e.target.value))}
              </td>
              <td colSpan={19} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={2} style={labelCell}>
                VOLUMEN ALIMENTADO
              </td>
              <td colSpan={3} style={cellStyle}>
                {renderSmallInput(
                  volumenAlimentado,
                  (e) => setVolumenAlimentado(e.target.value)
                )}
              </td>
              <td colSpan={19} style={{ border: "none" }} />
            </tr>

            <tr>
              <td colSpan={24} style={{ ...cellStyle, height: 25, borderLeft: "none", borderRight: "none" }} />
            </tr>

            <tr>
              <td colSpan={24} style={sectionHeader}>
                ANALISIS FISICOQUIMICO ALIMENTACION
              </td>
            </tr>

            <tr>
              {analysisColumns.map((col, index) => (
                <td key={index} style={headerCell}>
                  {col}
                </td>
              ))}
            </tr>

            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {analysisColumns.map((_, colIndex) => {
                  const outOfRange = isCellOutOfRange(rowIndex, row, colIndex);
                  const cellValue = row[`col_${colIndex}`] || "";

                  return (
                    <td key={colIndex} style={cellStyle}>
                      <TextField
                        value={cellValue}
                        disabled={!canEditTable}
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
                            backgroundColor: outOfRange ? "#ffb3b3" : "#fff",
                            minHeight: 24,
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontSize: 9,
                            padding: "2px",
                            lineHeight: 1.1,
                          },
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {permittedRows.map((row, rowIndex) => (
              <tr key={`permitted-${rowIndex}`}>
                {row.map((value, colIndex) => (
                  <td key={colIndex} style={{ ...cellStyle, fontSize: 11 }}>
                    {value}
                  </td>
                ))}
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