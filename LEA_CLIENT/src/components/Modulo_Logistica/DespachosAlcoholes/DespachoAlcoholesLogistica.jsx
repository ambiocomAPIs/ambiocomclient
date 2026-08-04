import { memo, useCallback, useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Checkbox,
  ListItemText,
  Divider,
  Tooltip,
  List,
  ListItemButton,
  ListSubheader,
  Popover,
  Backdrop,
  CircularProgress,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BarChartIcon from "@mui/icons-material/BarChart";
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
import ClearIcon from "@mui/icons-material/Clear";
import SaveAsIcon from "@mui/icons-material/SaveAs";
import SummarizeIcon from "@mui/icons-material/Summarize";
import HistoryIcon from "@mui/icons-material/History";
import YouTubeIcon from "@mui/icons-material/YouTube";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonRemoveAlt1Icon from "@mui/icons-material/PersonRemoveAlt1";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ReportIcon from "@mui/icons-material/Report";
import AlarmOnIcon from "@mui/icons-material/AlarmOn";
import AlarmOffIcon from "@mui/icons-material/AlarmOff";
import UndoIcon from '@mui/icons-material/Undo';
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import CancelIcon from "@mui/icons-material/Cancel";
import FactoryIcon from '@mui/icons-material/Factory';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SearchIcon from "@mui/icons-material/Search";

import ExcelUploadButton from "../utils_Logistica/ExcelUploadButton";
import DownloadIcon from "@mui/icons-material/Download";
import ExcelDownloadButton from "../utils_Logistica/ExcelDownloadButton";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ChartBuilder from "../utils_Logistica/ChartBuilder";
import TutorialModalList from "../../../utils/modals/Modals_Tutorial/ModalTutorialList.jsx";


import ObservacionEstadoModal from "../utils_Logistica/Logistica_Modals/ObservacionEstadoModal.jsx";
import IngresoDataDespachoModal from "./DespachoAlcoholes_Utils/Modals/IngresoDataDespachoModal.jsx";
import ChecklistDespachosModal from "./DespachoAlcoholes_Utils/Modals/ProgramacionDespachoCheckListModal.jsx";

import { getCellValidation } from "./DespachoAlcoholes_Utils/Functions/validacionesDespacho.js";
import { useAuth } from "../../../utils/Context/AuthContext/AuthContext.jsx";

/* ================= ENDPOINTS ================= */
const API_DESPACHOS = "https://ambiocomserver.onrender.com/api/despacho-alcoholes";
const API_COLUMNAS = "https://ambiocomserver.onrender.com/api/columna-despacho-alcoholes";

const CELDAS_CON_VALIDACION = new Set([
  "volumen_despachar",
  "volumen_ambiocom_contador",
  "peso_neto_bascula_ambiocom",
  "peso_neto_contador_ambiocom",
  "kilos_peso_neto",
  "cantidad_recibida_cliente",
]);

const EMPTY_TEXT_VALUES = new Set(["", "null", "undefined", "nan"]);

const TOTAL_NUMBER_FORMATTER = new Intl.NumberFormat("es-CO", {
  useGrouping: true,
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const getRangoDefault = () => {
  const hoy = new Date();

  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  const toISO = (fecha) => fecha.toISOString().slice(0, 10);

  return {
    desde: toISO(desde),
    hasta: toISO(hasta),
  };
};


const CeldaDespachoMemo = memo(function CeldaDespachoMemo({
  columna,
  celda,
}) {
  const { valor, isEmptyGeneral, validacion } = celda;
  const tieneAlerta = Boolean(isEmptyGeneral || validacion?.mensaje);

  const contenido = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      {columna.key === "flete_facturado" ? (
        valor ? (
          <CheckCircleIcon sx={{ color: "#2e7d32" }} />
        ) : (
          <CancelIcon sx={{ color: "#d32f2f" }} />
        )
      ) : (
        valor ?? ""
      )}
    </Box>
  );

  return (
    <TableCell
      align="center"
      sx={{
        whiteSpace: "nowrap",
        width: "1%",
        background: isEmptyGeneral
          ? "repeating-linear-gradient(45deg, rgba(255, 0, 76, 0.2), rgba(255,0,255,0.2) 10px, rgba(255,255,0,0.2) 10px, rgba(255,255,0,0.2) 20px)"
          : undefined,
        boxShadow: isEmptyGeneral
          ? "inset 0 0 0 1px #d32f2f"
          : undefined,
        ...(validacion?.sx || {}),
      }}
    >
      {tieneAlerta ? (
        <Tooltip
          title={isEmptyGeneral ? "Dato faltante" : validacion?.mensaje || ""}
          placement="top"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: "12px",
                padding: "8px 12px",
                backgroundColor: "#263238",
                color: "#fff",
                borderRadius: "6px",
              },
            },
          }}
        >
          {contenido}
        </Tooltip>
      ) : (
        contenido
      )}
    </TableCell>
  );
});

const FilaDespachoMemo = memo(function FilaDespachoMemo({
  analisis,
  columnasActivas,
  puedeEliminar,
  onEditar,
  onEliminar,
  onAbrirVehiculo,
  onAbrirLlegada,
  onAbrirPuntualidad,
  renderIconoVehiculo,
  renderIconoLlegadaDestino,
  renderIconoPuntualidadCliente,
}) {
  const {
    row,
    celdas,
    porcentajeFaltante,
    colorFila,
    alertaCliente,
  } = analisis;

  return (
    <TableRow
      sx={{
        backgroundColor: porcentajeFaltante > 0 ? colorFila : "inherit",
        transition: "background-color 0.3s ease",
      }}
    >
      <TableCell
        align="center"
        sx={{
          position: "sticky",
          left: 0,
          zIndex: 4,
          backgroundColor: "#dad9d9e3",
          borderRight: "1px solid rgba(224,224,224,1)",
          minWidth: 110,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 0.5,
            width: "100%",
          }}
        >
          <Tooltip
            title={
              alertaCliente === "high"
                ? "Alerta cliente: diferencia de volumen y/o peso por encima de la tolerancia"
                : alertaCliente === "low"
                  ? "Alerta cliente: diferencia de volumen y/o peso por debajo de la tolerancia"
                  : "Editar Fila"
            }
          >
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconButton onClick={() => onEditar(row)}>
                <EditIcon />
              </IconButton>

              {alertaCliente && (
                <NotificationImportantIcon
                  sx={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    fontSize: 18,
                    color: alertaCliente === "high" ? "#d32f2f" : "#f56200",
                    filter:
                      "drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)",
                    backgroundColor: "inherit",
                    borderRadius: "50%",
                    boxShadow: "0 0 0 2px rgba(0,0,0,0.11)",
                    animation: "blinkBell 1s ease-in-out infinite",
                    "@keyframes blinkBell": {
                      "0%": { transform: "scale(0.95)", opacity: 1 },
                      "50%": { transform: "scale(1.45)", opacity: 0.6 },
                      "100%": { transform: "scale(1)", opacity: 1 },
                    },
                  }}
                />
              )}
            </Box>
          </Tooltip>

          <Tooltip title={puedeEliminar ? "Eliminar" : "No tienes permisos"}>
            <IconButton
              disabled={!puedeEliminar}
              sx={{ color: "#5E5E5E" }}
              onClick={() => onEliminar(row._id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Box
            onClick={(e) => {
              e.stopPropagation();
              onAbrirVehiculo(row);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.18s ease",
              borderRadius: "50%",
              width: 30,
              height: 30,
              "&:hover": {
                backgroundColor: "rgba(25,118,210,0.08)",
                transform: "scale(1.08)",
              },
              "&:active": {
                transform: "scale(0.96)",
              },
            }}
          >
            {renderIconoVehiculo(row.lecturas?.vehiculo_rechazado)}
          </Box>

          <Box
            onDoubleClick={(e) => {
              e.stopPropagation();
              onAbrirLlegada(row);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            {renderIconoLlegadaDestino(row.lecturas?.llegada_destino)}
          </Box>

          <Box
            onDoubleClick={(e) => {
              e.stopPropagation();
              onAbrirPuntualidad(row);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            {renderIconoPuntualidadCliente(
              row.lecturas?.puntualidad_en_cliente
            )}
          </Box>
        </Box>
      </TableCell>

      <TableCell align="center">{row.fecha}</TableCell>

      {columnasActivas.map((columna) => (
        <CeldaDespachoMemo
          key={columna.key}
          columna={columna}
          celda={celdas[columna.key]}
        />
      ))}

      <TableCell align="center">{row.observaciones}</TableCell>
      <TableCell align="center">{row.responsable}</TableCell>
    </TableRow>
  );
});

const TablaResultadosMemo = memo(function TablaResultadosMemo({
  tablaRef,
  loadingMediciones,
  onContextMenu,
  filasAnalizadas,
  columnasActivas,
  filtrosVisibles,
  filtroActivo,
  filtrosColumna,
  onToggleFiltro,
  tableDensityStyles,
  acumuladosPorColumna,
  totalRegistrosVisibles,
  puedeEliminar,
  onEditar,
  onEliminar,
  onAbrirVehiculo,
  onAbrirLlegada,
  onAbrirPuntualidad,
  renderIconoVehiculo,
  renderIconoLlegadaDestino,
  renderIconoPuntualidadCliente,
}) {
  return (
    <TableContainer
      ref={tablaRef}
      component={Paper}
      elevation={3}
      aria-busy={loadingMediciones}
      sx={{
        maxHeight: "78vh",
        overflowX: "auto",
        minHeight: loadingMediciones ? 280 : undefined,
      }}
      onContextMenu={onContextMenu}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              align="center"
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 6,
                backgroundColor: "#fff",
                borderRight: "1px solid rgba(224,224,224,1)",
                minWidth: 110,
              }}
            >
              Acciones
            </TableCell>
            <TableCell
              align="center"
              sx={{
                whiteSpace: "nowrap",
                width: "auto",
                maxWidth: "none",
                borderRight: "1px solid rgba(224, 224, 224, 1)",
              }}
            >
              Fecha Registro
            </TableCell>

            {columnasActivas.map((columna) => (
              <TableCell
                key={columna.key}
                align="center"
                sx={{
                  whiteSpace: "nowrap",
                  width: "auto",
                  maxWidth: "none",
                  borderRight: "1px solid rgba(224, 224, 224, 1)",
                }}
              >
                {columna.nombre}
                {filtrosVisibles && (
                  <IconButton
                    size="small"
                    sx={{
                      ml: 1,
                      "&:focus": { outline: "none", boxShadow: "none" },
                    }}
                    onClick={(e) =>
                      onToggleFiltro(columna.key, e.currentTarget)
                    }
                  >
                    <FilterListIcon
                      color={
                        filtrosColumna[columna.key] ? "primary" : "inherit"
                      }
                      fontSize="small"
                    />
                  </IconButton>
                )}
              </TableCell>
            ))}

            <TableCell
              align="center"
              sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
            >
              Observaciones
            </TableCell>
            <TableCell
              align="center"
              sx={{ borderRight: "1px solid rgba(224, 224, 224, 1)" }}
            >
              Responsable de recibo
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody
          sx={{
            "& .MuiTableCell-root": {
              padding: tableDensityStyles.padding,
              lineHeight: tableDensityStyles.lineHeight,
              fontSize: tableDensityStyles.fontSize,
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            },
            "& .MuiTableRow-root": {
              height: tableDensityStyles.rowHeight,
            },
          }}
        >
          {filasAnalizadas.map((analisis) => (
            <FilaDespachoMemo
              key={analisis.row._id}
              analisis={analisis}
              columnasActivas={columnasActivas}
              puedeEliminar={puedeEliminar}
              onEditar={onEditar}
              onEliminar={onEliminar}
              onAbrirVehiculo={onAbrirVehiculo}
              onAbrirLlegada={onAbrirLlegada}
              onAbrirPuntualidad={onAbrirPuntualidad}
              renderIconoVehiculo={renderIconoVehiculo}
              renderIconoLlegadaDestino={renderIconoLlegadaDestino}
              renderIconoPuntualidadCliente={renderIconoPuntualidadCliente}
            />
          ))}

          {/* <TableRow>
            <TableCell colSpan={2}>
              <b>Acumulado Total</b>
            </TableCell>
            {columnasActivas.map((columna) => (
              <TableCell key={columna.key} align="center">
                {columna.totalizable ? (
                  <b>
                    {acumuladosPorColumna[columna.key] ?? 0}{" "}
                    {columna.unidad || ""}
                  </b>
                ) : (
                  <span style={{ opacity: 0.4 }}>—</span>
                )}
              </TableCell>
            ))}
            <TableCell colSpan={3} />
          </TableRow> */}
        </TableBody>
        {/* ================= FOOTER STICKY: TOTALES Y REGISTROS ================= */}
        <TableFooter>
          <TableRow>
            {/* Acciones + Fecha Registro */}
            <TableCell
              colSpan={2}
              sx={{
                position: "sticky",
                bottom: 0,
                left: 0,
                zIndex: 8,
                backgroundColor: "#e8eef7",
                borderTop: "2px solid #1A237E",
                borderRight: "1px solid rgba(224, 224, 224, 1)",
                boxShadow: "0 -3px 8px rgba(0, 0, 0, 0.12)",
                whiteSpace: "nowrap",
                padding: tableDensityStyles.padding,
                lineHeight: tableDensityStyles.lineHeight,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: tableDensityStyles.fontSize,
                    fontWeight: 800,
                    color: "#1A237E",
                  }}
                >
                  Totales
                </Typography>

                <Typography
                  component="span"
                  sx={{
                    fontSize: tableDensityStyles.fontSize,
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  {totalRegistrosVisibles} registro
                  {totalRegistrosVisibles === 1 ? "" : "s"}
                </Typography>
              </Box>
            </TableCell>

            {/* Columnas dinámicas */}
            {columnasActivas.map((columna) => (
              <TableCell
                key={`footer-total-${columna.key}`}
                align="center"
                sx={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 7,
                  backgroundColor: "#e8eef7",
                  borderTop: "2px solid #1A237E",
                  borderRight: "1px solid rgba(224, 224, 224, 1)",
                  boxShadow: "0 -3px 8px rgba(0, 0, 0, 0.12)",
                  whiteSpace: "nowrap",
                  padding: tableDensityStyles.padding,
                  lineHeight: tableDensityStyles.lineHeight,
                  fontSize: tableDensityStyles.fontSize,
                  fontWeight: 800,
                  color: "#1A237E",
                }}
              >
                {columna.totalizable ? (
                  <>
                    {acumuladosPorColumna[columna.key] ?? 0}{" "}
                    {columna.unidad || ""}
                  </>
                ) : (
                  <span style={{ opacity: 0.4 }}>—</span>
                )}
              </TableCell>
            ))}

            {/* Observaciones + Responsable */}
            <TableCell
              colSpan={2}
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 7,
                backgroundColor: "#e8eef7",
                borderTop: "2px solid #1A237E",
                boxShadow: "0 -3px 8px rgba(0, 0, 0, 0.12)",
                padding: tableDensityStyles.padding,
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
});

export default function TablaDespachosLogistica() {
  const rangoDefault = getRangoDefault();

  //refs del componente
  const tablaRef = useRef(null);
  const excelUploadRef = useRef(null);
  const youtubeBtnRef = useRef(null);
  const analisisFilasCacheRef = useRef(new Map());
  const firmasFilasRef = useRef(new WeakMap());
  //use del contexto
  const { rol, loadingAuth } = useAuth();
  /* ================= STATE ================= */
  const [columnas, setColumnas] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [loadingMediciones, setLoadingMediciones] = useState(true);
  const [openFila, setOpenFila] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openColumna, setOpenColumna] = useState(false);
  const [editId, setEditId] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(rangoDefault.desde);
  const [fechaHasta, setFechaHasta] = useState(rangoDefault.hasta);
  const [density, setDensity] = useState(1);
  const [columnasVisibles, setColumnasVisibles] = useState(columnas.map((c) => c.key));
  const [contextMenu, setContextMenu] = useState(null);
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [anchorFiltro, setAnchorFiltro] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState(true);
  const [ordenFechaAsc, setOrdenFechaAsc] = useState(false);
  const [modoInteligenteScroll, setModoInteligenteScroll] = useState(false);
  const [openCharts, setOpenCharts] = useState(false);
  const [openChecklist, setOpenChecklist] = useState(false);
  const [openTutorial, setOpenTutorial] = useState(false);
  const [openIntroTutorial, setOpenIntroTutorial] = useState(false);

  const [form, setForm] = useState({
    fecha: "",
    responsable: "",
    observaciones: "",
    lecturas: {},
  });

  const [nuevaColumna, setNuevaColumna] = useState({
    nombre: "",
    key: "",
    unidad: "",
    totalizable: false,
  });

  const [openObsVehiculo, setOpenObsVehiculo] = useState(false);
  const [obsVehiculoData, setObsVehiculoData] = useState({
    estado: "",
    observacion: "",
    fecha: "",
    placa: "",
    cliente: "",
    transportadora: "",
    producto: "",
    conductor: "",
  });

  /* ================= CARGA INICIAL ================= */
  useEffect(() => {
    obtenerColumnas();
    obtenerMediciones();
  }, []);

  useEffect(() => {
    const yaVisto = localStorage.getItem("tutorial_modulo_despachos_visto");

    if (!yaVisto) {
      const timer = setTimeout(() => {
        setOpenIntroTutorial(true);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (columnas.length > 0) {
      setColumnasVisibles(columnas.map((c) => c.key));
    }
  }, [columnas]);

  useEffect(() => {
    const isPointInside = (el, x, y) => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };

    const onGlobalContextMenu = (e) => {
      const tabla = tablaRef.current;
      if (!tabla) return;

      if (isPointInside(tabla, e.clientX, e.clientY)) {
        e.preventDefault();
        setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
      }
    };

    window.addEventListener("contextmenu", onGlobalContextMenu, true);
    return () =>
      window.removeEventListener("contextmenu", onGlobalContextMenu, true);
  }, []);

  // MODO INTELIGENTE SCROLL HORIZONTAL
  useEffect(() => {
    const el = tablaRef.current;
    if (!el) return;

    let over = false;

    const onEnter = () => {
      over = true;
    };
    const onLeave = () => {
      over = false;
    };

    const onWheel = (e) => {
      if (!over) return;
      if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        return;
      }

      if (!modoInteligenteScroll) return;
      // --- MODO INTELIGENTE ---
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;

      const canVertical = (goingDown && !atBottom) || (goingUp && !atTop);

      e.preventDefault();
      if (canVertical) {
        el.scrollTop += e.deltaY;
      } else {
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("wheel", onWheel);
    };
  }, [modoInteligenteScroll]);

  const canAccess = (roles) => {
    if (loadingAuth) return false;
    if (!roles) return true;
    if (roles.includes("*")) return true;

    const currentRole = (rol || "").toLowerCase().trim();
    const allowedRoles = roles.map((r) => (r || "").toLowerCase().trim());
    return allowedRoles.includes(currentRole);
  };

  const puedeEliminar = canAccess([
    "gerenciaA",
    "gerenciaG",
    "gerenciaOP",
    "developer",
    "liderlogistica",
  ]);

  const handleOpenClickVehiculo = useCallback((row) => {
    const estado = (row?.lecturas?.vehiculo_rechazado || "")
      .toString()
      .toUpperCase()
      .trim();

    const observacion = (row?.observaciones || "").toString().trim();

    setObsVehiculoData({
      row,
      estado,
      observacion: observacion || "Esta fila no tiene observación registrada",
      fecha: row?.fecha || "",
      placa: row?.lecturas?.placa || "",
      cliente: row?.lecturas?.cliente || "",
      transportadora: row?.lecturas?.transportadora || "",
      producto: row?.lecturas?.producto || "",
      conductor: row?.lecturas?.nombre_conductor || "",
      volumenFacturado: row?.lecturas?.volumen_despachar || "",
      volumenDespachado: row?.lecturas?.volumen_ambiocom_contador || "",
      pesoNeto: row?.lecturas?.peso_neto_bascula_ambiocom || "",
      remisionFactura: row?.lecturas?.remision_factura || "",
      ordenFabricacion: row?.lecturas?.orden_fabricacion || "",
    });

    setOpenObsVehiculo(true);
  }, []);

  const handleDblClickLlegadaATiempo = useCallback((row) => {
    const estado = (row?.lecturas?.llegada_destino || "")
      .toString()
      .toUpperCase()
      .trim();

    if (estado !== "PUNTUAL" && estado !== "RETRASADO") return;

    const observacion = (row?.observaciones || "").toString().trim();

    setObsVehiculoData({
      estado,
      observacion: observacion || "Esta fila no tiene observación registrada",
      fecha: row?.fecha || "",
      placa: row?.lecturas?.placa || "",
      cliente: row?.lecturas?.cliente || "",
    });

    setOpenObsVehiculo(true);

  }, []);

  const handleDblClickPuntualidadCliente = useCallback((row) => {
    const estado = (row?.lecturas?.puntualidad_en_cliente || "")
      .toString()
      .toUpperCase()
      .trim();

    if (estado !== "PUNTUAL" && estado !== "RETRASADO") return;

    const observacion = (row?.observaciones || "").toString().trim();

    setObsVehiculoData({
      estado,
      observacion: observacion || "Esta fila no tiene observación registrada",
      fecha: row?.fecha || "",
      placa: row?.lecturas?.placa || "",
      cliente: row?.lecturas?.cliente || "",
      transportadora: row?.lecturas?.transportadora || "",
      producto: row?.lecturas?.producto || "",
      conductor: row?.lecturas?.nombre_conductor || "",
    });

    setOpenObsVehiculo(true);
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
  }, []);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCerrarIntroTutorial = () => {
    localStorage.setItem("tutorial_modulo_despachos_visto", "true");
    setOpenIntroTutorial(false);
  };

  /* ================= API ================= */
  const obtenerColumnas = async () => {
    try {
      const { data } = await axios.get(API_COLUMNAS);
      setColumnas(data);
    } catch (e) {
      Swal.fire("Error", "No se pudieron cargar las columnas", "error");
    }
  };

  const obtenerMediciones = useCallback(async (
    desde = fechaDesde,
    hasta = fechaHasta
  ) => {
    setLoadingMediciones(true);

    try {
      const { data } = await axios.get(`${API_DESPACHOS}/rango`, {
        params: {
          from: desde,
          to: hasta,
        },
        withCredentials: true,
      });

      setMediciones(data);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudieron cargar los despachos", "error");
    } finally {
      setLoadingMediciones(false);
    }
  }, [fechaDesde, fechaHasta]);

  /* ================= CRUD MEDICIONES ================= */

  const handleGuardar = async (payload) => {
    try {
      const dataToSave = payload ?? form;
      if (openEditar) {
        await actualizarMedicion(dataToSave);
      } else {
        await guardarMedicion(dataToSave);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar la información", "error");
    }
  };

  const guardarMedicion = async (dataToSave) => {
    await axios.post(API_DESPACHOS, dataToSave, { withCredentials: true });
    setOpenFila(false);
    obtenerMediciones();
  };

  const actualizarMedicion = async (dataToSave) => {
    await axios.put(`${API_DESPACHOS}/${editId}`, dataToSave, {
      withCredentials: true,
    });

    setOpenEditar(false);
    obtenerMediciones();
  };

  const eliminarMedicion = useCallback(async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar este ingreso?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_DESPACHOS}/${id}`, { withCredentials: true });
      await obtenerMediciones();
      Swal.fire("Eliminado", "El registro fue eliminado correctamente", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar el registro", "error");
    }
  }, [obtenerMediciones]);

  const parseHora = (h) => {
    if (!h || !h.includes(":")) return null;
    const [hh, mm] = h.split(":").map((x) => Number(x));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const guardarColumna = async () => {
    try {
      await axios.post(API_COLUMNAS, nuevaColumna);
      setNuevaColumna({ nombre: "", key: "", unidad: "", totalizable: false });
      setOpenColumna(false);
      await obtenerColumnas();
      Swal.fire("Éxito", "Columna creada correctamente", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo crear la columna", "error");
    }
  };

  function stringToDate(fechaStr) {
    if (!fechaStr) return new Date(0);
    const [y, m, d] = fechaStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }

  function isoToDDMMYYYY(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${y}-${m}-${d}`;
  }

  //para busqueda avanzada
  const normalizar = (v) => (v ?? "").toString().toLowerCase().trim();

  /* ================= ORDEN + FILTRO ================= */
  const medicionesOrdenadas = useMemo(() => {
    let data = [...mediciones].sort((a, b) => {
      const fa = stringToDate(a.fecha);
      const fb = stringToDate(b.fecha);
      return ordenFechaAsc ? fa - fb : fb - fa;
    });

    Object.entries(filtrosColumna).forEach(([key, valorFiltro]) => {
      if (valorFiltro.trim() !== "") {
        data = data.filter((m) => {
          const valorCelda = m.lecturas?.[key] ?? "";
          return valorCelda
            .toString()
            .toLowerCase()
            .includes(valorFiltro.toLowerCase());
        });
      }
    });

    return data;
  }, [mediciones, filtrosColumna, ordenFechaAsc]);

  const medicionesFiltradas = useMemo(() => {
    const q = normalizar(busquedaGlobal);
    if (!q) return medicionesOrdenadas;

    return medicionesOrdenadas.filter((row) => {
      const valores = [
        row.fecha,
        row.observaciones,
        row.responsable,
        ...Object.values(row.lecturas || {}),
      ];

      return valores.some((v) => normalizar(v).includes(q));
    });
  }, [busquedaGlobal, medicionesOrdenadas]);

  const totalRegistrosVisibles = medicionesFiltradas.length;

  const columnasVisiblesSet = useMemo(
    () => new Set(columnasVisibles),
    [columnasVisibles]
  );

  const columnasActivas = useMemo(
    () => columnas.filter((c) => columnasVisiblesSet.has(c.key)),
    [columnas, columnasVisiblesSet]
  );

  /* ================= CALCULAR ACUMULADO por columna mapa ================= */

  const acumuladosPorColumna = useMemo(() => {
    const columnasTotalizables = columnas.filter((c) => c.totalizable);
    const totales = Object.fromEntries(
      columnasTotalizables.map((c) => [c.key, 0])
    );

    for (const medicion of medicionesFiltradas) {
      const lecturas = medicion?.lecturas ?? {};
      for (const columna of columnasTotalizables) {
        const num = Number(lecturas?.[columna.key]);
        if (!Number.isNaN(num)) totales[columna.key] += num;
      }
    }

    const map = {};
    for (const columna of columnasTotalizables) {
      map[columna.key] = TOTAL_NUMBER_FORMATTER.format(
        totales[columna.key]
      );
    }

    return map;
  }, [columnas, medicionesFiltradas]);

  /* ============= densidad del texto en latabla ================= */
  const tableDensityStyles = useMemo(
    () => ({
      fontSize: `${0.75 * density}rem`,
      padding: `${2 * density}px ${6 * density}px`,
      lineHeight: 1.1 * density,
      rowHeight: `${28 * density}px`,
    }),
    [density]
  );

  const copiarTablaPortapapeles = () => {
    const headers = [
      "Fecha Registro",
      ...columnasActivas.map((c) => c.nombre),
      "Observaciones",
      "Responsable de recibo",
    ];

    const rows = medicionesOrdenadas.map((row) => {
      return [
        row.fecha,
        ...columnasActivas.map((c) => row.lecturas?.[c.key] ?? ""),
        row.observaciones ?? "",
        row.responsable ?? "",
      ];
    });

    const textoParaCopiar =
      headers.join("\t") + "\n" + rows.map((r) => r.join("\t")).join("\n");

    navigator.clipboard
      .writeText(textoParaCopiar)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Copiado",
          text: "Tabla copiada al portapapeles. Ahora puedes pegar en Excel.",
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch(() => {
        alert(
          "Error al copiar al portapapeles. Intenta usar Ctrl+C manualmente."
        );
      });
  };

  const valoresUnicosFiltroActivo = useMemo(() => {
    if (!filtroActivo) return [];

    const set = new Set();

    mediciones.forEach((m) => {
      const v = m.lecturas?.[filtroActivo] ?? "";
      set.add(v.toString().trim());
    });

    const arr = Array.from(set);

    arr.sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });

    return arr;
  }, [filtroActivo, mediciones]);

  const calcularPorcentajeFaltante = (row) => {
    const columnasActivas = columnas.filter((c) =>
      columnasVisibles.includes(c.key)
    );
    if (columnasActivas.length === 0) return 0;
    let faltantes = 0;
    columnasActivas.forEach((c) => {
      const valor = row.lecturas?.[c.key];

      if (
        valor === undefined ||
        valor === null ||
        valor === "" ||
        (typeof valor === "string" && valor.trim() === "")) {
        faltantes++;
      }
    });

    return faltantes / columnasActivas.length;
  };

  const obtenerColorFila = (porcentaje) => {
    if (porcentaje === 0) return "inherit";
    if (porcentaje >= 0.8) {
      return "rgba(255, 0, 0, 0.75)";
    }
    if (porcentaje >= 0.5) {
      return "rgba(255, 0, 0, 0.45)";
    }
    if (porcentaje >= 0.3) {
      return "rgba(255, 0, 0, 0.25)";
    }

    return "rgba(238, 173, 173, 0.71)";
  };

  const renderIconoVehiculo = useCallback((estado) => {
    const valor = (estado || "").toString().toUpperCase().trim();

    const commonWrapper = (icon, title) => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Tooltip title={title}>{icon}</Tooltip>
      </Box>
    );
    if (valor === "EN PLANTA") {
      return commonWrapper(
        <FactoryIcon sx={{ color: "#9616ff" }} />,
        "Vehículo en planta"
      );
    }

    if (valor === "RECHAZADO AMBIOCOM") {
      return commonWrapper(
        <PersonRemoveAlt1Icon sx={{ color: "#9616ff" }} />,
        "Vehículo rechazado"
      );
    }

    if (valor === "APROBADO AMBIOCOM") {
      return commonWrapper(
        <ThumbUpAltIcon sx={{ color: "#47b69e" }} />,
        "Vehículo aprobado para cargue"
      );
    }
    if (valor === "EN CARGUE") {
      return commonWrapper(
        <LocalGasStationIcon sx={{ color: "#41acbd" }} />,
        "En Cargue"
      );
    }
    if (valor === "EN TRANSITO") {
      return commonWrapper(
        <TimelapseIcon sx={{ color: "#ffb516" }} />,
        "En Transito"
      );
    }
    if (valor === "EN CLIENTE") {
      return commonWrapper(
        <HowToRegIcon sx={{ color: "#3ed423" }} />,
        "Ya aprobado y en Destino"
      );
    }
    if (valor === "APROBADO POR EL CLIENTE") {
      return commonWrapper(
        <SentimentVerySatisfiedIcon sx={{ color: "#3ed423" }} />,
        "Ya aprobado y en Destino"
      );
    }

    if (valor === "APROBADO CON OBSERVACIONES") {
      return commonWrapper(
        <ReportIcon sx={{ color: "#ff2d16" }} />,
        "Aprobado con Observaciones"
      );
    }
    if (valor === "RECHAZADO POR CLIENTE") {
      return commonWrapper(
        <UndoIcon sx={{ color: "#ff2d16" }} />,
        "Rechazado por el Cliente"
      );
    }

    return null;
  }, []);

  const renderIconoLlegadaDestino = useCallback((estado) => {
    const valor = (estado ?? "").toString().toUpperCase().trim();

    const commonWrapper = (icon, title) => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Tooltip title={title} arrow>
          {icon}
        </Tooltip>
      </Box>
    );

    if (valor === "PUNTUAL") {
      return commonWrapper(
        <AlarmOnIcon sx={{ color: "#58555a" }} />,
        "Llegada a destino: Puntual"
      );
    }

    if (valor === "RETRASADO") {
      return commonWrapper(
        <AlarmOffIcon sx={{ color: "#ea5931" }} />,
        "Llegada a destino: Retrasado"
      );
    }

    return commonWrapper(
      <ReportIcon sx={{ color: "#9e9e9e" }} />,
      "Llegada a destino: Sin datos"
    );
  }, []);

  const renderIconoPuntualidadCliente = useCallback((estado) => {
    const valor = (estado ?? "").toString().toUpperCase().trim();

    const commonWrapper = (icon, title) => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Tooltip title={title} arrow>
          {icon}
        </Tooltip>
      </Box>
    );

    if (valor === "PUNTUAL" || valor === "CUMPLE") {
      return commonWrapper(
        <CheckCircleIcon sx={{ color: "#2e7d32" }} />,
        "Puntualidad en cliente: Cumple"
      );
    }

    if (valor === "RETRASADO" || valor === "NO CUMPLE") {
      return commonWrapper(
        <UnpublishedIcon sx={{ color: "#d32f2f" }} />,
        "Puntualidad en cliente: No cumple"
      );
    }

    return commonWrapper(
      <ReportIcon sx={{ color: "#9e9e9e" }} />,
      "Puntualidad en cliente: Sin datos"
    );
  }, []);

  const renderIconoCumplimientoCliente = (row) => {
    // ===== Volumen =====
    const volumenDespachar = Number(row?.lecturas?.volumen_despachar ?? 0);
    const diffVolumen = Number(
      row?.lecturas?.diferencia_recibo_cliente_vnetofacturado ?? 0
    );

    const tolVolumen =
      Number.isFinite(volumenDespachar) && volumenDespachar > 0
        ? volumenDespachar * 0.05
        : null;

    const estadoVolumen =
      tolVolumen == null || !Number.isFinite(diffVolumen)
        ? null
        : diffVolumen > tolVolumen
          ? "high"
          : diffVolumen < -tolVolumen
            ? "low"
            : null;

    // ===== Peso =====
    const pesoBase = Number(row?.lecturas?.peso_neto_bascula_ambiocom ?? 0);
    const diffPeso = Number(row?.lecturas?.dif_kilos_neto ?? 0);

    const tolPeso =
      Number.isFinite(pesoBase) && pesoBase > 0
        ? pesoBase * 0.05
        : null;

    const estadoPeso =
      tolPeso == null || !Number.isFinite(diffPeso)
        ? null
        : diffPeso > tolPeso
          ? "high"
          : diffPeso < -tolPeso
            ? "low"
            : null;

    // ===== Prioridad visual =====
    if (estadoVolumen === "high" || estadoPeso === "high") return "high";
    if (estadoVolumen === "low" || estadoPeso === "low") return "low";

    return null;
  };

  const columnasAnalisisKey = useMemo(
    () => columnasActivas.map((columna) => columna.key).join("|"),
    [columnasActivas]
  );

  const filasAnalizadas = useMemo(() => {
    const cacheAnterior = analisisFilasCacheRef.current;
    const cacheSiguiente = new Map();

    const resultado = medicionesFiltradas.map((row, index) => {
      const rowObject = row && typeof row === "object" ? row : {};
      let firmaDatos = firmasFilasRef.current.get(rowObject);

      if (!firmaDatos) {
        firmaDatos = JSON.stringify(rowObject);
        firmasFilasRef.current.set(rowObject, firmaDatos);
      }

      const cacheKey = String(
        rowObject._id ?? rowObject.id ?? `${rowObject.fecha ?? "fila"}-${index}`
      );
      const firmaCompleta = `${columnasAnalisisKey}::${firmaDatos}`;
      const cacheGuardado = cacheAnterior.get(cacheKey);

      if (cacheGuardado?.firma === firmaCompleta) {
        cacheSiguiente.set(cacheKey, cacheGuardado);
        return cacheGuardado.analisis;
      }

      const lecturas = rowObject?.lecturas ?? {};
      const celdas = {};
      let faltantes = 0;

      const validationPayload = {
        Densidad: lecturas?.densidadlab_alcohol_tanque,
        volumenFacturado: lecturas?.volumen_despachar,
        volumenDespachado: lecturas?.volumen_ambiocom_contador,
        volumenDespachadoGravimetrico:
          lecturas?.volumen_contador_gravimetrico,
        volumenRecibidoCliente: lecturas?.cantidad_recibida_cliente,
        pesoAmbiocomContador: lecturas?.peso_neto_contador_ambiocom,
        pesoAmbiocomBascula: lecturas?.peso_neto_bascula_ambiocom,
        pesoBasculaCliente: lecturas?.kilos_peso_neto,
      };

      for (const columna of columnasActivas) {
        const valor = lecturas?.[columna.key] ?? "";
        const isEmptyGeneral =
          valor === null ||
          valor === undefined ||
          valor === "" ||
          (typeof valor === "string" &&
            EMPTY_TEXT_VALUES.has(valor.trim().toLowerCase()));

        if (isEmptyGeneral) faltantes += 1;

        celdas[columna.key] = {
          valor,
          isEmptyGeneral,
          validacion: CELDAS_CON_VALIDACION.has(columna.key)
            ? getCellValidation({
              key: columna.key,
              ...validationPayload,
            })
            : null,
        };
      }

      const porcentajeFaltante =
        columnasActivas.length > 0 ? faltantes / columnasActivas.length : 0;

      const analisis = {
        row: rowObject,
        celdas,
        porcentajeFaltante,
        colorFila: obtenerColorFila(porcentajeFaltante),
        alertaCliente: renderIconoCumplimientoCliente(rowObject),
      };

      cacheSiguiente.set(cacheKey, {
        firma: firmaCompleta,
        analisis,
      });

      return analisis;
    });

    analisisFilasCacheRef.current = cacheSiguiente;
    return resultado;
  }, [medicionesFiltradas, columnasActivas, columnasAnalisisKey]);

  const handleEditarFila = useCallback((row) => {
    setEditId(row._id);
    setForm({
      ...row,
      fecha: row.fecha || "",
    });
    setOpenEditar(true);
  }, []);

  const handleToggleFiltroColumna = useCallback((key, anchorEl) => {
    setFiltroActivo((actual) => {
      if (actual === key) {
        setAnchorFiltro(null);
        return null;
      }

      setAnchorFiltro(anchorEl);
      return key;
    });
  }, []);

  /* ================= RENDER ================= */
  return (
    <Box sx={{ p: 0 }}>
      {/* ================= TITULO ================= */}
      <Box
        sx={{
          p: 0.1,
          mt: 6,
          borderRadius: 1,
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
          display: "flex",
          alignItems: "center",
          width: "100vw",
          maxWidth: "100%",
          gap: 2,
          flexWrap: "wrap", // para que en pantallas muy pequeñas se acomode
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/LogoCompany/logoambiocomsinfondo.png"
          alt="Logo"
          sx={{
            height: "auto",
            width: 220,
            mr: 5,
            mb: 1,
            objectFit: "contain",
          }}
        />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "#1A237E",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: "1.9rem",
              textAlign: "center",
            }}
          >
            DESPACHO DE ALCOHOLES
          </Typography>
        </Box>
        {/* ================= FILTROS ================= */}
        <Box
          sx={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            mr: 0,
            alignItems: "flex-end",
          }}
        >
          {/* FILA SUPERIOR: Excel + Columnas + Densidad */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              px: 1.2,
              py: 0.7,
              backgroundColor: "#e9edf2",
              border: "1px solid rgba(0,0,0,0.12)",
              borderBottom: "1px solid rgba(0,0,0,0.22)",
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          >
            <Divider orientation="vertical" flexItem />
            <Tooltip title={"Generar Informe"}>
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: modoInteligenteScroll
                    ? "#d3d8de"
                    : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: modoInteligenteScroll
                      ? "#c6ccd3"
                      : "#eef1f5",
                  },
                }}
              >
                <SummarizeIcon
                  sx={{ color: modoInteligenteScroll ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title={"Historicos informe"}>
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: modoInteligenteScroll
                    ? "#d3d8de"
                    : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: modoInteligenteScroll
                      ? "#c6ccd3"
                      : "#eef1f5",
                  },
                }}
              >
                <HistoryIcon
                  sx={{ color: modoInteligenteScroll ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title={"Historiar Informe"}>
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: modoInteligenteScroll
                    ? "#d3d8de"
                    : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: modoInteligenteScroll
                      ? "#c6ccd3"
                      : "#eef1f5",
                  },
                }}
              >
                <SaveAsIcon
                  sx={{ color: modoInteligenteScroll ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip
              title={
                modoInteligenteScroll
                  ? "Desactivar modo inteligente"
                  : "Activar modo inteligente"
              }
            >
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: modoInteligenteScroll
                    ? "#d3d8de"
                    : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: modoInteligenteScroll
                      ? "#c6ccd3"
                      : "#eef1f5",
                  },
                }}
              >
                <SwapHorizIcon
                  sx={{ color: modoInteligenteScroll ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title={ordenFechaAsc ? "Ver Recientes" : "Ver Antiguos"}>
              <IconButton
                size="small"
                onClick={() => setOrdenFechaAsc((prev) => !prev)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": { backgroundColor: "#eef1f5" },
                }}
              >
                {ordenFechaAsc ? (
                  <SortByAlphaIcon sx={{ color: "blue" }} />
                ) : (
                  <SortByAlphaIcon />
                )}
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />
            <Tooltip title="Copiar Tabla al portapapeles">
              <IconButton
                size="small"
                onClick={() => {
                  copiarTablaPortapapeles();
                  handleCloseContextMenu();
                }}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Descargar Plantilla Carga Masiva">
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    "https://ambiocomserver.onrender.com/api/despacho-alcoholes/plantilla-excel",
                    "_blank"
                  );
                }}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Carga Masiva">
              <IconButton
                size="small"
                onClick={() => excelUploadRef.current?.open()}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <DriveFolderUploadIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="análisis data">
              <IconButton
                size="small"
                onClick={() => setOpenCharts(true)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <StackedLineChartIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <ExcelDownloadButton
              data={medicionesOrdenadas}
              columnasVisibles={columnasVisibles}
              columnas={columnas}
              filename={`DespachoAlcoholes_hasta_${medicionesOrdenadas.length
                ? medicionesOrdenadas.reduce((max, r) => (r.fecha > max ? r.fecha : max), "")
                : "sin-fecha"
                }.xlsx`}
            />
            <Divider orientation="vertical" flexItem />
            <FormControl
              size="small"
              sx={{
                minWidth: 150,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
            >
              <Select
                multiple
                value={columnasVisibles}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value.includes("__ALL__")) {
                    setColumnasVisibles(columnas.map((c) => c.key));
                    return;
                  }
                  if (value.includes("__NONE__")) {
                    setColumnasVisibles([]);
                    return;
                  }
                  setColumnasVisibles(value);
                }}
                renderValue={(selected) => `Columnas (${selected.length})`}
                MenuProps={{
                  disableAutoFocusItem: true,
                  autoFocus: false,
                  PaperProps: {
                    sx: {
                      maxHeight: "80vh",
                    },
                  },
                }}
              >
                <MenuItem value="__ALL__">
                  <Checkbox
                    checked={columnasVisibles.length === columnas.length}
                  />
                  <ListItemText primary="Seleccionar todo" />
                </MenuItem>
                <MenuItem value="__NONE__">
                  <Checkbox checked={columnasVisibles.length === 0} />
                  <ListItemText primary="Deseleccionar todo" />
                </MenuItem>
                {columnas.map((c) => (
                  <MenuItem
                    key={c.key}
                    value={c.key}
                    dense
                    sx={{
                      borderRadius: 1.0,
                      mx: 1,
                      my: 0.1,
                      border: "1px solid",
                      borderColor: columnasVisibles.includes(c.key)
                        ? "primary.main"
                        : "rgba(0,0,0,0.10)",
                      backgroundColor: columnasVisibles.includes(c.key)
                        ? "rgba(25,118,210,0.08)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: columnasVisibles.includes(c.key)
                          ? "rgba(25,118,210,0.12)"
                          : "rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    <Checkbox
                      checked={columnasVisibles.includes(c.key)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={c.nombre}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: 600,
                        noWrap: true,
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider orientation="vertical" flexItem />
            <FormControl
              size="small"
              sx={{
                minWidth: 90,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
            >
              <Select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              >
                <MenuItem value={0.8}>Densa</MenuItem>
                <MenuItem value={1}>Normal</MenuItem>
                <MenuItem value={1.2}>Cómoda</MenuItem>
                <MenuItem value={1.4}>Media</MenuItem>
                <MenuItem value={1.6}>Grande</MenuItem>
              </Select>
            </FormControl>
            <Divider orientation="vertical" flexItem />
          </Box>
          {/* FILA INFERIOR: Filtro + Desde + Hasta */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              px: 1.2,
              py: 0.7,
              backgroundColor: "#e9edf2",
              border: "1px solid rgba(0,0,0,0.12)",
              borderTop: "none",
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
            }}
          >
            <Divider orientation="vertical" flexItem />
            <Tooltip title={"Ver Demo"}>
              <IconButton
                ref={youtubeBtnRef}
                size="small"
                onClick={() => setOpenTutorial(true)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: "white",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:focus": { outline: "none", boxShadow: "none" },
                  "&:hover": {
                    backgroundColor: modoInteligenteScroll
                      ? "#c6ccd3"
                      : "#eef1f5",
                  },
                  position: "relative",
                  zIndex: openIntroTutorial ? 1401 : "auto",
                  boxShadow: openIntroTutorial
                    ? "0 0 0 4px rgba(255,255,255,0.95), 0 0 0 10px rgba(255,0,0,0.25)"
                    : "none",
                  transform: openIntroTutorial ? "scale(1.12)" : "scale(1)",
                  transition: "all 0.25s ease",
                }}
              >
                <YouTubeIcon
                  sx={{
                    color: openTutorial ? "#b71c1c" : "red",
                    fontSize: "1.9rem",
                  }}
                />
              </IconButton>
            </Tooltip>
            {/* BUSQUEDA AVANZADA RENDER DE INPUT AQUI */}
            {busquedaActiva && (
              <>
                <Divider orientation="vertical" flexItem />
                <TextField
                  size="small"
                  label="Buscar en toda la tabla"
                  value={busquedaGlobal}
                  onChange={(e) => setBusquedaGlobal(e.target.value)}
                  placeholder="Escribe para buscar..."
                  sx={{
                    mt: 0.2,
                    minWidth: 120,
                    maxWidth: 190,
                    "& .MuiInputBase-root": {
                      height: 34,
                      backgroundColor: "#f6f7f9",
                      borderRadius: 1,
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </>
            )}
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Registrar Recepción">
              <IconButton
                size="small"
                onClick={() => {
                  setForm({
                    fecha: "",
                    responsable: "",
                    observaciones: "",
                    lecturas: {},
                  });
                  setOpenFila(true);
                }}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <LocalShippingIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => ""}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                border: "1px solid rgba(0,0,0,0.12)",
                "&:hover": {
                  backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                },
              }}
            >
              <BarChartIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <Tooltip placement="top" title="Ver programación">
              <IconButton
                size="small"
                onClick={() => setOpenChecklist(true)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: openChecklist ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: openChecklist ? "#c6ccd3" : "#eef1f5",
                  },
                }}
              >
                <ChecklistIcon sx={{ color: openChecklist ? "blue" : "none" }} />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => {
                setBusquedaActiva((prev) => {
                  const next = !prev;
                  if (!next) setBusquedaGlobal("");
                  return next;
                });
              }}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: busquedaActiva ? "#d3d8de" : "#f6f7f9",
                color: busquedaActiva ? "blue" : "none",
                border: "1px solid rgba(0,0,0,0.12)",
                "&:hover": {
                  backgroundColor: busquedaActiva ? "#c6ccd3" : "#eef1f5",
                },
              }}
            >
              <ManageSearchIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => setFiltrosVisibles(!filtrosVisibles)}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                border: "1px solid rgba(0,0,0,0.12)",
                "&:hover": {
                  backgroundColor: filtrosVisibles ? "#c6ccd3" : "#eef1f5",
                },
              }}
            >
              {filtrosVisibles ? (
                <FilterAltOffIcon
                  fontSize="small"
                  sx={{ color: filtrosVisibles ? "blue" : "none" }}
                />
              ) : (
                <FilterAltIcon fontSize="small" />
              )}
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <TextField
              type="date"
              label="Desde"
              size="small"
              value={fechaDesde}
              InputLabelProps={{ shrink: true }}
              sx={{
                mt: 0.5,
                minWidth: 135,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.82rem",
                },
              }}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <Divider orientation="vertical" flexItem />
            <TextField
              type="date"
              label="Hasta"
              size="small"
              value={fechaHasta}
              InputLabelProps={{ shrink: true }}
              sx={{
                mt: 0.5,
                minWidth: 135,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.82rem",
                },
              }}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            <Tooltip title="Ejecutar búsqueda">
              <IconButton
                size="small"
                onClick={() => obtenerMediciones()}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: "#f8f9f6",
                  border: "1px solid rgba(39, 21, 235, 0.12)",
                  "&:hover": {
                    backgroundColor: "#f5f1ee",
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      {/* ================= TABLA ================= */}
      <Box sx={{ position: "relative" }}>
        <TablaResultadosMemo
          tablaRef={tablaRef}
          loadingMediciones={loadingMediciones}
          onContextMenu={handleContextMenu}
          filasAnalizadas={filasAnalizadas}
          columnasActivas={columnasActivas}
          filtrosVisibles={filtrosVisibles}
          filtroActivo={filtroActivo}
          filtrosColumna={filtrosColumna}
          onToggleFiltro={handleToggleFiltroColumna}
          tableDensityStyles={tableDensityStyles}
          acumuladosPorColumna={acumuladosPorColumna}
          totalRegistrosVisibles={totalRegistrosVisibles}
          puedeEliminar={puedeEliminar}
          onEditar={handleEditarFila}
          onEliminar={eliminarMedicion}
          onAbrirVehiculo={handleOpenClickVehiculo}
          onAbrirLlegada={handleDblClickLlegadaATiempo}
          onAbrirPuntualidad={handleDblClickPuntualidadCliente}
          renderIconoVehiculo={renderIconoVehiculo}
          renderIconoLlegadaDestino={renderIconoLlegadaDestino}
          renderIconoPuntualidadCliente={renderIconoPuntualidadCliente}
        />
      </Box>

      {/* ================= SPEED DIAL ================= */}
      <SpeedDial
        ariaLabel="acciones"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Nuevo Ingreso"
          onClick={() => {
            setForm({
              fecha: "",
              responsable: "",
              observaciones: "",
              lecturas: {},
            });
            setOpenFila(true);
          }}
        />
        <SpeedDialAction
          icon={<ViewColumnIcon />}
          tooltipTitle="Nueva Columna"
          onClick={() => setOpenColumna(true)}
        />
        <SpeedDialAction
          icon={<UploadFileIcon />}
          tooltipTitle="Carga masiva Excel"
          onClick={() => {
            const input = document.getElementById("excelUpload");
            if (input) input.click();
          }}
        />
        <SpeedDialAction
          icon={<DownloadIcon />}
          tooltipTitle="Descargar plantilla Excel"
          onClick={() => {
            window.open(
              "https://ambiocomserver.onrender.com/api/despacho-alcoholes/plantilla-excel",
              "_blank"
            );
          }}
        />
      </SpeedDial>

      {/* ================= MODAL Recepcion ================= */}

      <IngresoDataDespachoModal
        key={
          openEditar
            ? `editar-${editId}`
            : openFila
              ? "nuevo"
              : "cerrado"
        }
        open={openFila || openEditar}
        onClose={() => {
          setOpenFila(false);
          setOpenEditar(false);
        }}
        onSave={handleGuardar}
        columnas={columnas}
        isEdit={openEditar}
        form={form}
        fetchConductores={() => api.get("/conductores").then((r) => r.data)}
        fetchClientes={() => api.get("/clientes").then((r) => r.data)}
        fetchTransportadoras={() =>
          api.get("/transportadoras").then((r) => r.data)
        }
      />
      {/* ================= MODAL DE OBSERVACIONES ================= */}
      <ObservacionEstadoModal
        context="modulo_despacho"
        open={openObsVehiculo}
        onClose={() => setOpenObsVehiculo(false)}
        data={obsVehiculoData}
        apiUrl={API_DESPACHOS}
        onUpdated={obtenerMediciones}
        title="Gestión de estado del vehículo"
        subtitle="Información completa del despacho"
      />
      {/* ================= MODAL COLUMNA ================= */}
      <Dialog open={openColumna} fullWidth maxWidth="xs">
        <DialogTitle>Nueva Columna</DialogTitle>

        <DialogContent>
          <TextField
            label="Nombre visible"
            fullWidth
            margin="dense"
            value={nuevaColumna.nombre}
            onChange={(e) =>
              setNuevaColumna({ ...nuevaColumna, nombre: e.target.value })
            }
          />
          <TextField
            label="Clave (ej: Energia_CON)"
            fullWidth
            margin="dense"
            value={nuevaColumna.key}
            onChange={(e) =>
              setNuevaColumna({ ...nuevaColumna, key: e.target.value })
            }
          />
          <TextField
            label="Unidad"
            fullWidth
            margin="dense"
            value={nuevaColumna.unidad}
            onChange={(e) =>
              setNuevaColumna({ ...nuevaColumna, unidad: e.target.value })
            }
          />

          <InputLabel id="totalizable-label" sx={{ mb: 1, mt: 1 }}>
            Totalizable
          </InputLabel>
          <Select
            value={String(nuevaColumna.totalizable)}
            fullWidth
            onChange={(e) =>
              setNuevaColumna({
                ...nuevaColumna,
                totalizable: e.target.value === "true",
              })
            }
          >
            <MenuItem value="true">Sí (sumar en acumulado)</MenuItem>
            <MenuItem value="false">
              No (No es una variable totalizable)
            </MenuItem>
          </Select>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenColumna(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarColumna}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu para filtrar tabla */}
      <Menu
        anchorEl={anchorFiltro}
        open={Boolean(filtroActivo)}
        onClose={() => {
          setFiltroActivo(null);
          setAnchorFiltro(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 0, minWidth: 280, maxWidth: 340 }}>
          <List
            dense
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: "background.paper",
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: "32px",
                  textAlign: "center",
                }}
              >
                Filter Data by Parameters
              </ListSubheader>
            }
            sx={{ maxHeight: 360, overflow: "auto" }}
          >
            {/* Limpiar (mantiene tu filtro tal cual: string) */}
            <ListItemButton
              onClick={() =>
                setFiltrosColumna((prev) => ({
                  ...prev,
                  [filtroActivo]: "",
                }))
              }
              sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <ListItemText
                primary="Limpiar filtro"
                primaryTypographyProps={{ fontSize: 13, fontWeight: 700 }}
              />
              <ClearIcon sx={{ fontSize: 18, opacity: 0.7 }} />
            </ListItemButton>

            {valoresUnicosFiltroActivo.map((valor) => {
              const label = valor === "" ? "(Vacío)" : valor;
              const selected = (filtrosColumna[filtroActivo] || "") === valor;

              return (
                <ListItemButton
                  key={valor || "__VACIO__"}
                  selected={selected}
                  onClick={() =>
                    setFiltrosColumna((prev) => ({
                      ...prev,
                      [filtroActivo]: valor,
                    }))
                  }
                >
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: 13, noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Menu>

      {/* Graficas dinámicas */}
      {openCharts && (
        <ChartBuilder
          rows={medicionesFiltradas}
          columnas={columnas}
          onClose={() => setOpenCharts(false)}
        />
      )}

      {/* //Menu para copiar tabla tipo SAP */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            copiarTablaPortapapeles();
            handleCloseContextMenu();
          }}
        >
          Copiar tabla
        </MenuItem>
      </Menu>
      {/* Modal checlist programacion despachos*/}
      <ChecklistDespachosModal
        open={openChecklist}
        onClose={() => setOpenChecklist(false)}
      />
      {/* Boton para carga masiva*/}
      <ExcelUploadButton
        ref={excelUploadRef}
        url="https://ambiocomserver.onrender.com/api/despacho-alcoholes/carga-masiva"
        onSuccess={obtenerMediciones}
      />
      {/* Modal tutoriales modulos*/}
      <TutorialModalList
        open={openTutorial}
        onClose={() => setOpenTutorial(false)}
        modulo="despachos"
      />

      {/* Loading general de la página durante la consulta de despachos */}
      <Backdrop
        open={loadingMediciones}
        role="status"
        aria-live="polite"
        aria-label="Cargando información de despachos"
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(245, 247, 250, 0.82)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          cursor: "wait",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.6,
            px: 2.6,
            py: 1.8,
            borderRadius: 1,
            border: "1px solid #b9c4cf",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            boxShadow: "0 6px 22px rgba(0, 0, 0, 0.20)",
          }}
        >
          <CircularProgress
            size={36}
            thickness={4.5}
            sx={{ color: "#0a6ed1" }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: "0.92rem",
                fontWeight: 700,
                color: "#1d2d3e",
                lineHeight: 1.25,
              }}
            >
              Cargando información...
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                fontSize: "0.77rem",
                color: "#526577",
                lineHeight: 1.25,
              }}
            >
              Procesando datos de despachos
            </Typography>
          </Box>
        </Paper>
      </Backdrop>

      {/* oscurecer componente y resaltar boton */}
      <Backdrop
        open={openIntroTutorial}
        sx={{
          zIndex: 1300,
          backgroundColor: "rgba(0,0,0,0.72)",
        }}
        onClick={handleCerrarIntroTutorial}
      />

      <Popover
        open={openIntroTutorial}
        anchorEl={youtubeBtnRef.current}
        slotProps={{
          root: {
            sx: {
              zIndex: 2000,
            },
          },
        }}
        onClose={handleCerrarIntroTutorial}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            zIndex: 1402,
            mt: 1.5,
            maxWidth: 320,
            p: 2,
            borderRadius: 2,
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            border: "1px solid rgba(0,0,0,0.08)",
            position: "relative",
            overflow: "visible",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -10,
              left: 24,
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid white",
            },
          },
        }}
        disableRestoreFocus
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", mb: 1 }}>
          Tutorial del módulo
        </Typography>

        <Typography sx={{ fontSize: "0.9rem", color: "#374151", mb: 2 }}>
          Aquí puedes visualizar cómo funciona la API y ver tutoriales operativos del módulo.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleCerrarIntroTutorial}
          >
            OK
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}