import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
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

import ExcelUploadButton from "../utils_Logistica/ExcelUploadButton";
import DownloadIcon from "@mui/icons-material/Download";
import ExcelDownloadButton from "../utils_Logistica/ExcelDownloadButton";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import IngresoDataDespachoModal from "../utils_Logistica/IngresoDataDespachoModal.jsx";
import ChartBuilder from "../utils_Logistica/ChartBuilder";

// Contexto usuario por roles
import { useAuth } from "../../../utils/Context/AuthContext/AuthContext.jsx";

/* ================= ENDPOINTS ================= */
const API_DESPACHOS = "https://ambiocomserver.onrender.com/api/despacho-alcoholes";
const API_COLUMNAS = "https://ambiocomserver.onrender.com/api/columna-despacho-alcoholes";

export default function TablaDespachosLogistica() {
  //refs del componente
  const tablaRef = useRef(null);
  const excelUploadRef = useRef(null);
  //use del contexto
  const { rol, loadingAuth } = useAuth();
  /* ================= STATE ================= */
  const [columnas, setColumnas] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [openFila, setOpenFila] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openColumna, setOpenColumna] = useState(false);
  const [editId, setEditId] = useState(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [density, setDensity] = useState(1);
  const [columnasVisibles, setColumnasVisibles] = useState(
    columnas.map((c) => c.key)
  ); // inicialmente todas visibles
  const [contextMenu, setContextMenu] = useState(null);
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [filtroActivo, setFiltroActivo] = useState(null); // key de columna con filtro abierto o null
  const [anchorFiltro, setAnchorFiltro] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState(true);
  const [ordenFechaAsc, setOrdenFechaAsc] = useState(false); // true de mas viejo primero
  const [modoInteligenteScroll, setModoInteligenteScroll] = useState(false);
  const [openCharts, setOpenCharts] = useState(false);

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

  /* ================= CARGA INICIAL ================= */
  useEffect(() => {
    obtenerColumnas();
    obtenerMediciones();
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

      // Si el click derecho fue sobre la "zona" de la tabla (aunque el target sea el backdrop)
      if (isPointInside(tabla, e.clientX, e.clientY)) {
        e.preventDefault(); // evita el menú de Chrome SIEMPRE dentro de la tabla
        setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
      }
    };

    // OJO: true = capture (clave para ganarle a MUI/backdrop)
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

      // Si el modo inteligente está apagado, dejamos el scroll normal
      if (!modoInteligenteScroll) return;
      // --- MODO INTELIGENTE ---
      // vertical mientras haya más vertical; si ya no se puede, horizontal
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;

      const canVertical = (goingDown && !atBottom) || (goingUp && !atTop);

      e.preventDefault(); // queremos controlar el scroll dentro de la tabla

      if (canVertical) {
        el.scrollTop += e.deltaY; // mueve vertical
      } else {
        el.scrollLeft += e.deltaY; // al llegar al límite, mueve horizontal
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

  //Verifica acceso al rol
  const canAccess = (roles) => {
    if (loadingAuth) return true;
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

  // Detectar click derecho para copiar tabla tipo SAP
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
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

  const obtenerMediciones = async () => {
    const { data } = await axios.get(API_DESPACHOS);
    setMediciones(data);
  };

  /* ================= CRUD MEDICIONES ================= */

  const handleGuardar = async () => {
    try {
      if (openEditar) {
        await actualizarMedicion();
      } else {
        await guardarMedicion();
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar la información", "error");
    }
  };

  const guardarMedicion = async () => {
    await axios.post(API_DESPACHOS, form);
    setOpenFila(false);
    obtenerMediciones();
  };

  const actualizarMedicion = async () => {
    await axios.put(`${API_DESPACHOS}/${editId}`, form);
    setOpenEditar(false);
    obtenerMediciones();
  };

  const eliminarMedicion = async (id) => {
    Swal.fire({
      title: "¿Eliminar este ingreso?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (!result.isConfirmed) return;
      axios.delete(`${API_DESPACHOS}/${id}`);
      obtenerMediciones();
    });
  };

  const parseHora = (h) => {
    if (!h || !h.includes(":")) return null;
    const [hh, mm] = h.split(":").map((x) => Number(x));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const calcularTiempoAmbiocom = (entrada, salida) => {
    const e = parseHora(entrada);
    const s = parseHora(salida);
    if (e === null || s === null) return "";
    let diff = s - e;
    if (diff < 0) diff += 24 * 60;
    const horas = String(Math.floor(diff / 60)).padStart(2, "0");
    const minutos = String(diff % 60).padStart(2, "0");
    return `${horas}:${minutos}`;
  };

  /* ================= CRUD COLUMNAS ================= */
  const guardarColumna = async () => {
    await axios.post(API_COLUMNAS, nuevaColumna);
    setNuevaColumna({ nombre: "", key: "", unidad: "", totalizable: false });
    setOpenColumna(false);
    obtenerColumnas();
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
      return ordenFechaAsc ? fa - fb : fb - fa; // funciona con el estado segun orden que se requiera
    });

    if (fechaDesde) {
      const fd = stringToDate(fechaDesde);
      data = data.filter((m) => stringToDate(m.fecha) >= fd);
    }

    if (fechaHasta) {
      const fh = stringToDate(fechaHasta);
      data = data.filter((m) => stringToDate(m.fecha) <= fh);
    }

    // Aplica filtros de columnas
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
  }, [mediciones, fechaDesde, fechaHasta, filtrosColumna, ordenFechaAsc]);

  //filtro de busqueda avanzada
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

  // /* ================= CALCULAR ACUMULADO ================= */
  // const calcularAcumulado = (columna) => {
  //   if (!columna.totalizable) return "";

  //   return medicionesFiltradas.reduce((total, m) => {
  //     const valor = m.lecturas?.[columna.key];
  //     const num = Number(valor);
  //     return total + (Number.isNaN(num) ? 0 : num);
  //   }, 0);
  // };
  /* ================= CALCULAR ACUMULADO por columna mapa ================= */

  const acumuladosPorColumna = useMemo(() => {
    const map = {};
    columnas.forEach((c) => {
      if (!c.totalizable) return;

      const total = medicionesFiltradas.reduce((sum, m) => {
        const num = Number(m.lecturas?.[c.key]);
        return sum + (Number.isNaN(num) ? 0 : num);
      }, 0);

      map[c.key] = new Intl.NumberFormat("es-CO", {
        useGrouping: true, // separador de miles
        minimumFractionDigits: 1, // SIEMPRE 1 decimal
        maximumFractionDigits: 2,
      }).format(total);
    });

    return map;
  }, [columnas, medicionesFiltradas]);

  /* ============= densidad del texto en latabla ================= */
  const tableDensityStyles = {
    fontSize: `${0.75 * density}rem`,
    padding: `${2 * density}px ${6 * density}px`,
    lineHeight: 1.1 * density,
    rowHeight: `${28 * density}px`,
  };

  // Funcion que genera el texto y copia al portapapeles
  const copiarTablaPortapapeles = () => {
    const headers = [
      "Fecha Registro",
      ...columnas
        .filter((c) => columnasVisibles.includes(c.key))
        .map((c) => c.nombre),
      "Observaciones",
      "Responsable",
    ];

    const rows = medicionesOrdenadas.map((row) => {
      return [
        row.fecha,
        ...columnas
          .filter((c) => columnasVisibles.includes(c.key))
          .map((c) => row.lecturas?.[c.key] ?? ""),
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

  //valores unico para filtro por columna
  const valoresUnicosFiltroActivo = useMemo(() => {
    if (!filtroActivo) return [];

    const set = new Set();

    // Solo toma datos para LISTAR en el menú (no afecta la tabla)
    mediciones.forEach((m) => {
      const v = m.lecturas?.[filtroActivo] ?? "";
      set.add(v.toString().trim());
    });

    const arr = Array.from(set);

    // vacío primero, luego alfabético
    arr.sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });

    return arr;
  }, [filtroActivo, mediciones]);

  // calcula el % de data faltante en una fila según las columnas visibles (para mostrar fondo rojo degradado)
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
        valor.toString().trim() === ""
      ) {
        faltantes++;
      }
    });

    return faltantes / columnasActivas.length; // retorna valor entre 0 y 1
  };

  // función para generar color dinámico según el % de datos faltantes en la fila (más rojo cuanto más falte)
  const obtenerColorFila = (porcentaje) => {
    if (porcentaje === 0) return "inherit";
    // Escalonado por rangos
    if (porcentaje >= 0.8) {
      return "rgba(255, 0, 0, 0.75)"; // rojo intenso
    }
    if (porcentaje >= 0.5) {
      return "rgba(255, 0, 0, 0.45)"; // rojo medio
    }
    if (porcentaje >= 0.3) {
      return "rgba(255, 0, 0, 0.25)"; // rojo leve
    }

    return "rgba(238, 173, 173, 0.71)"; // menos de 30% (muy suave)
  };

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
            minWidth: 0, // MUY importante para no romper flex
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
              borderBottom: "1px solid rgba(0,0,0,0.22)", // línea divisoria
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
            {/* OPCIÓN A o B para Excel (mira abajo) */}
            <ExcelDownloadButton
              data={medicionesOrdenadas}
              columnasVisibles={columnasVisibles}
              columnas={columnas}
              filename="RecepcionAlcoholes.xlsx"
            />
            <Divider orientation="vertical" flexItem />
            {/* Columnas filtro ocultar columnas */}
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
                  disableAutoFocusItem: true, // para que no enfoque al final del menu
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
              borderTop: "none", // evita doble borde
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
            }}
          >
            <Divider orientation="vertical" flexItem />
            <Tooltip title={"Ver Demo"}>
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
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
                }}
              >
                <YouTubeIcon sx={{ color: "red", fontSize: "1.9rem" }} />
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
              <LocalPrintshopIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <IconButton
              size="small"
              onClick={() => {
                setBusquedaActiva((prev) => {
                  const next = !prev;
                  if (!next) setBusquedaGlobal(""); // opcional: al apagar, limpia
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
          </Box>
        </Box>
      </Box>
      {/* ================= TABLA ================= */}
      <TableContainer
        ref={tablaRef}
        component={Paper}
        elevation={3}
        sx={{ maxHeight: "78vh", overflowX: "auto" }}
        onContextMenu={handleContextMenu}
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
              {columnas
                .filter((c) => columnasVisibles.includes(c.key))
                .map((c) => (
                  <TableCell
                    key={c.key}
                    align="center"
                    sx={{
                      whiteSpace: "nowrap",
                      width: "auto",
                      maxWidth: "none",
                      borderRight: "1px solid rgba(224, 224, 224, 1)",
                    }}
                  >
                    {c.nombre}
                    {filtrosVisibles && (
                      <IconButton
                        size="small"
                        sx={{
                          ml: 1,
                          "&:focus": { outline: "none", boxShadow: "none" },
                        }}
                        onClick={(e) => {
                          if (filtroActivo === c.key) {
                            setFiltroActivo(null);
                            setAnchorFiltro(null);
                          } else {
                            setFiltroActivo(c.key);
                            setAnchorFiltro(e.currentTarget);
                          }
                        }}
                      >
                        <FilterListIcon
                          color={filtrosColumna[c.key] ? "primary" : "inherit"}
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
                Responsable
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
            {medicionesFiltradas.map((row) => {
              const porcentajeFaltante = calcularPorcentajeFaltante(row);
              const colorFila = obtenerColorFila(porcentajeFaltante);

              return (
                <TableRow
                  key={row._id}
                  sx={{
                    backgroundColor:
                      porcentajeFaltante > 0 ? colorFila : "inherit",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 4,
                      backgroundColor:
                        porcentajeFaltante > 0 ? colorFila : "#fff",
                      borderRight: "1px solid rgba(224,224,224,1)",
                      minWidth: 110,
                    }}
                  >
                    <Tooltip title={"Editar Fila"}>
                      <IconButton
                        onClick={() => {
                          setEditId(row._id);
                          setForm({
                            ...row,
                            fecha: row.fecha || "",
                          });
                          setOpenEditar(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={puedeEliminar ? "Eliminar" : "No tienes permisos"}
                    >
                      <IconButton
                        disabled={!puedeEliminar}
                        sx={{ color: "#5E5E5E" }}
                        onClick={() => eliminarMedicion(row._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">{row.fecha}</TableCell>

                  {columnas
                    .filter((c) => columnasVisibles.includes(c.key))
                    .map((c) => {
                      const valor = row.lecturas?.[c.key] ?? "";

                      return (
                        <TableCell
                          key={c.key}
                          align="center"
                          sx={{
                            whiteSpace: "nowrap",
                            width: "1%",
                          }}
                        >
                          {valor}
                        </TableCell>
                      );
                    })}

                  <TableCell align="center">{row.observaciones}</TableCell>
                  <TableCell align="center">{row.responsable}</TableCell>
                </TableRow>
              );
            })}

            {/* ================= ACUMULADO ================= */}
            <TableRow>
              <TableCell colSpan={2}>
                <b>Acumulado Total</b>
              </TableCell>
              {columnas
                .filter((c) => columnasVisibles.includes(c.key))
                .map((c) => (
                  <TableCell key={c.key} align="center">
                    {c.totalizable ? (
                      <b>
                        {acumuladosPorColumna[c.key] ?? 0} {c.unidad || ""}
                      </b>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </TableCell>
                ))}

              <TableCell colSpan={3} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

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
              "https://ambiocomserver.onrender.com/api/recepcion-alcoholes/plantilla-excel",
              "_blank"
            );
          }}
        />
      </SpeedDial>

      {/* ================= MODAL Recepcion ================= */}

      <IngresoDataDespachoModal
        open={openFila || openEditar}
        onClose={() => {
          setOpenFila(false);
          setOpenEditar(false);
        }}
        onSave={handleGuardar}
        columnas={columnas}
        isEdit={openEditar}
        form={form}
        setForm={setForm}
        fetchConductores={() => api.get("/conductores").then((r) => r.data)}
        fetchClientes={() => api.get("/clientes").then((r) => r.data)}
        fetchTransportadoras={() =>
          api.get("/transportadoras").then((r) => r.data)
        }
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

      {/* Boton para carga masiva*/}
      <ExcelUploadButton
        ref={excelUploadRef}
        url="https://ambiocomserver.onrender.com/api/recepcion-alcoholes/carga-masiva"
        onSuccess={obtenerMediciones}
      />
    </Box>
  );
}
