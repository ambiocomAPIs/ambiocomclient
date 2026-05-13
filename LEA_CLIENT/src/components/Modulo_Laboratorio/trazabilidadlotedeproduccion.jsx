import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DownloadIcon from "@mui/icons-material/Download";
import Swal from "sweetalert2";

// import { useAuth } from "../../utils/Context/AuthContext/AuthContext";
// import { exportTrazabilidadLaboratorioExcel } from "./utils_laboratorio/ExportTrazabilidadLaboratorioExcel";

const API_URL = "https://ambiocomserver.onrender.com/api/trazabilidad-laboratorio";

const STORAGE_KEY = "tabla_trazabilidad_laboratorio";
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
  fontSize: 10,
  height: 31,
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
    fechaConsulta: "",
    fechaRegistro: "",
    compareMode: false,
    previousData: createInitialData(),
    registroId: null,

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

  if (
    normalizedRule.includes("min") ||
    normalizedRule.includes(">")
  ) {
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
  const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
  const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");
  const [compareMode, setCompareMode] = useState(draft.compareMode || false);
  const [previousData, setPreviousData] = useState(
    draft.previousData || createInitialData()
  );
  const [registroId, setRegistroId] = useState(draft.registroId || null);

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

  const [codigoInterno, setCodigoInterno] = useState(
    draft.codigoInterno || ""
  );
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
    const draftPayload = {
      fechaConsulta,
      fechaRegistro,
      compareMode,
      previousData,
      registroId,

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
    fechaConsulta,
    fechaRegistro,
    compareMode,
    previousData,
    registroId,

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
    id: registroId,
    formato: "4-LAB-032",
    version: "3",
    pagina: "3-3",
    tabla: "Trazabilidad de lote de producción",
    fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
    fechaGuardado: new Date().toISOString(),

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
      const payload = buildPayload();

      /*
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
      */

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      Swal.fire({
        icon: "success",
        title: registroId ? "Registro actualizado" : "Registro guardado",
        text: `Fecha de registro: ${payload.fechaRegistro}`,
        timer: 1800,
        showConfirmButton: false,
      });

      setOpen(true);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "No fue posible guardar la información.",
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

    /*
    const fecha = formatDateToDDMMYYYY(fechaConsulta);
    const json = await requestApi(`${API_URL}/by-date?fecha=${fecha}`);

    setData(json.data.analisisFisicoquimicoAlimentacion || createInitialData());
    setRegistroId(json.data._id || null);
    */

    Swal.fire({
      icon: "info",
      title: "Consulta pendiente",
      text: "El consumo al backend queda pendiente de conectar.",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleCompare = async () => {
    if (compareMode) {
      setCompareMode(false);
      setPreviousData(createInitialData());

      Swal.fire({
        icon: "info",
        title: "Modo comparación desactivado",
        timer: 1600,
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

    /*
    const fecha = formatDateToDDMMYYYY(fechaConsulta);
    const json = await requestApi(`${API_URL}/by-date?fecha=${fecha}`);
    setPreviousData(json.dataDiaAnterior || createInitialData());
    */

    setCompareMode(true);

    Swal.fire({
      icon: "info",
      title: "Comparación pendiente",
      text: "El consumo de comparación queda pendiente de conectar.",
      timer: 1800,
      showConfirmButton: false,
    });
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() => {
              /*
              exportTrazabilidadLaboratorioExcel({
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
                permittedRows,
              });
              */

              Swal.fire({
                icon: "info",
                title: "Exportación pendiente",
                text: "La función de exportar Excel queda pendiente de conectar.",
              });
            }}
          >
            Exportar Excel
          </Button>

          <TextField
            label="Fecha registro"
            type="date"
            size="small"
            value={fechaRegistro}
            disabled={!canEditTable}
            onChange={(e) => setFechaRegistro(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!canEditTable}
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
              <td colSpan={24} style={{ ...cellStyle, height: 25, borderLeft: "none", borderRight: "none" }} />
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

              <td colSpan={2} style={labelCell} >
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
                      {compareMode ? (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            minHeight: 24,
                          }}
                        >
                          <Box
                            sx={{
                              color: "red",
                              borderRight: "1px solid #000",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              px: "2px",
                              textAlign: "center",
                              wordBreak: "break-word",
                              backgroundColor: "#fdfdf4",
                            }}
                          >
                            {previousData[rowIndex]?.[`col_${colIndex}`] || ""}
                          </Box>

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
                        </Box>
                      ) : (
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
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {permittedRows.map((row, rowIndex) => (
              <tr key={`permitted-${rowIndex}`}>
                {row.map((value, colIndex) => (
                  <td key={colIndex} style={{ ...cellStyle, fontSize: 12 }}>
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