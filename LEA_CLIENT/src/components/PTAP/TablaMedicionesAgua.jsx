import { useEffect, useState, useMemo } from "react";
import axios from "axios";

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
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import GraficaConsumoDiarioPTAP from "./utils_PTAP/GraficaConsumoDiario";
import ModalIngresoMedicionContadoresAgua from "./utils_PTAP/Modal_PTAP/ModalIngresoMedicionContadoresAgua";
import ExcelDownloadButton from "../../utils/Export_Data_General/ExcelDownloadData";

import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";

/* ================= CONFIG ================= */
const CONSUMO_ALTO = 10;

/* ================= TOOLTIP ================= */
const TooltipConsumo = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#1A237E",
    color: "#FFFFFF",
    fontSize: "0.75rem",
    borderRadius: 8,
    padding: "8px 12px",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#1A237E",
  },
}));

/* ================= ENDPOINTS ================= */
const API_MEDICIONES = "https://ambiocomserver.onrender.com/api/medidoresagua";
const API_COLUMNAS = "https://ambiocomserver.onrender.com/api/columnamedidoresagua";

/* ================= UTILS ================= */
const parseFecha = (fecha) => {
  const [d, m, y] = fecha.split("-");
  return new Date(y, m - 1, d);
};

const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const obtenerRangoDefault = () => {
  const hoy = new Date();

  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  return {
    desde: formatDateInput(desde),
    hasta: formatDateInput(hasta),
  };
};

const limpiarValorCopiado = (valor) =>
  String(valor ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();

export default function TablaMedicionesAgua() {
  const rangoDefault = obtenerRangoDefault();

  /* ================= STATE ================= */
  const [columnas, setColumnas] = useState([]);
  const [mediciones, setMediciones] = useState([]);

  const [openFila, setOpenFila] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openColumna, setOpenColumna] = useState(false);
  const [openGrafica, setOpenGrafica] = useState(false);

  const [editId, setEditId] = useState(null);
  const [verConsumo, setVerConsumo] = useState(false);

  const [fechaDesde, setFechaDesde] = useState(rangoDefault.desde);
  const [fechaHasta, setFechaHasta] = useState(rangoDefault.hasta);
  const [cargando, setCargando] = useState(false);

  const [ordenAZ, setOrdenAZ] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    mensaje: "",
    severidad: "success",
  });

  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    operador: "",
    observaciones: "",
    lecturas: {},
  });

  const [nuevaColumna, setNuevaColumna] = useState({
    nombre: "",
    key: "",
    unidad: "m³",
  });

  /* ================= CARGA INICIAL ================= */
  useEffect(() => {
    obtenerColumnas();

    const rango = obtenerRangoDefault();
    obtenerMediciones(rango.desde, rango.hasta);
  }, []);

  /* ================= API ================= */
  const obtenerColumnas = async () => {
    const { data } = await axios.get(API_COLUMNAS);
    setColumnas(data);
  };

  const obtenerMediciones = async (
    desde = fechaDesde,
    hasta = fechaHasta
  ) => {
    setCargando(true);

    try {
      const { data } = await axios.get(API_MEDICIONES, {
        params: {
          desde,
          hasta,
        },
        withCredentials: true,
      });

      setMediciones(data);
    } finally {
      setCargando(false);
    }
  };

  /* ================= CRUD MEDICIONES ================= */
  const guardarMedicion = async () => {
    await axios.post(API_MEDICIONES, form);
    setOpenFila(false);
    obtenerMediciones();
  };

  const actualizarMedicion = async () => {
    await axios.put(`${API_MEDICIONES}/${editId}`, form);
    setOpenEditar(false);
    obtenerMediciones();
  };

  const eliminarMedicion = async (id) => {
    if (!window.confirm("¿Eliminar esta medición?")) return;

    await axios.delete(`${API_MEDICIONES}/${id}`);
    obtenerMediciones();
  };

  /* ================= CRUD COLUMNAS ================= */
  const guardarColumna = async () => {
    await axios.post(API_COLUMNAS, nuevaColumna);

    setNuevaColumna({
      nombre: "",
      key: "",
      unidad: "m³",
    });

    setOpenColumna(false);
    obtenerColumnas();
  };

  /* ================= ORDEN + FILTRO ================= */
  const medicionesOrdenadas = useMemo(() => {
    const data = [...mediciones];

    data.sort((a, b) => {
      const fechaA = parseFecha(a.fecha);
      const fechaB = parseFecha(b.fecha);

      return ordenAZ ? fechaA - fechaB : fechaB - fechaA;
    });

    return data;
  }, [mediciones, ordenAZ]);

  const medicionesCronologicas = useMemo(() => {
    return [...medicionesOrdenadas].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );
  }, [medicionesOrdenadas]);

  /* ================= CONSUMO POR FILA ================= */
  const calcularConsumoFila = (row, key) => {
    const indexCronologico = medicionesCronologicas.findIndex(
      (medicion) => medicion._id === row._id
    );

    if (indexCronologico <= 0) return 0;

    const actual = Number(row.lecturas?.[key] ?? 0);
    const anterior = Number(
      medicionesCronologicas[indexCronologico - 1]?.lecturas?.[key] ?? 0
    );

    return actual - anterior;
  };

  /* ================= RENDER CONSUMO ================= */
  const renderConsumo = (row, index, key) => {
    const actual = row.lecturas?.[key] ?? 0;

    const indexCronologico = medicionesCronologicas.findIndex(
      (medicion) => medicion._id === row._id
    );

    if (indexCronologico === 0) {
      return verConsumo ? (
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            color: "#757575",
          }}
        >
          0
        </Typography>
      ) : (
        actual
      );
    }

    const diff = calcularConsumoFila(row, key);

    const color =
      diff === 0
        ? "#757575"
        : diff > CONSUMO_ALTO
          ? "#C62828"
          : "#2E7D32";

    if (!verConsumo) {
      return (
        <TooltipConsumo title={`Consumo diario: ${diff} m³`}>
          <span>{actual}</span>
        </TooltipConsumo>
      );
    }

    return (
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          color,
        }}
      >
        {diff}
      </Typography>
    );
  };

  /* ================= ACUMULADO ================= */
  const calcularAcumulado = (key) => {
    let total = 0;

    medicionesCronologicas.forEach((row, index) => {
      if (index === 0) return;

      const actual = Number(row.lecturas?.[key] ?? 0);
      const anterior = Number(
        medicionesCronologicas[index - 1]?.lecturas?.[key] ?? 0
      );

      const diff = actual - anterior;

      if (diff > 0) {
        total += diff;
      }
    });

    return total;
  };

  /* ================= TOTAL CONSUMO PLANTA ================= */
  const consumoTotalPlanta = useMemo(() => {
    return columnas.reduce(
      (total, columna) => total + calcularAcumulado(columna.key),
      0
    );
  }, [columnas, medicionesCronologicas]);

  /* ================= DATOS PARA GRÁFICA ================= */
  const medicionesParaGrafica = useMemo(() => {
    return [...medicionesOrdenadas].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );
  }, [medicionesOrdenadas]);

  /* ================= DATOS PARA EXCEL ================= */
  const datosParaExcel = useMemo(() => {
    const filas = medicionesOrdenadas.map((row) => {
      const filaExcel = {
        Fecha: row.fecha || "",
        Hora: row.hora || "",
      };

      columnas.forEach((columna) => {
        const nombreColumna = `${columna.nombre} (${columna.unidad})`;

        filaExcel[nombreColumna] = verConsumo
          ? calcularConsumoFila(row, columna.key)
          : row.lecturas?.[columna.key] ?? 0;
      });

      filaExcel.Observaciones = row.observaciones || "";
      filaExcel.Operador = row.operador || "";

      return filaExcel;
    });

    const filaAcumulados = {
      Fecha: "CONSUMO ACUMULADO",
      Hora: "",
    };

    columnas.forEach((columna) => {
      const nombreColumna = `${columna.nombre} (${columna.unidad})`;
      filaAcumulados[nombreColumna] = calcularAcumulado(columna.key);
    });

    filaAcumulados.Observaciones = `Consumo total planta: ${consumoTotalPlanta} m³`;
    filaAcumulados.Operador = "";

    return [...filas, filaAcumulados];
  }, [
    medicionesOrdenadas,
    medicionesCronologicas,
    columnas,
    verConsumo,
    consumoTotalPlanta,
  ]);

  /* ================= COPIAR TABLA ================= */
  const copiarTextoAlPortapapeles = async (texto) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copiado = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copiado) {
      throw new Error("No fue posible copiar la tabla.");
    }
  };

  const copiarTabla = async (event) => {
    event.preventDefault();

    try {
      if (!medicionesOrdenadas.length) {
        setSnackbar({
          open: true,
          mensaje: "No hay información para copiar.",
          severidad: "warning",
        });
        return;
      }

      const encabezados = [
        "Fecha",
        "Hora",
        ...columnas.map(
          (columna) => `${columna.nombre} (${columna.unidad})`
        ),
        "Observaciones",
        "Operador",
      ];

      const filas = medicionesOrdenadas.map((row) => {
        const valoresMedidores = columnas.map((columna) =>
          verConsumo
            ? calcularConsumoFila(row, columna.key)
            : row.lecturas?.[columna.key] ?? 0
        );

        return [
          row.fecha || "",
          row.hora || "",
          ...valoresMedidores,
          row.observaciones || "",
          row.operador || "",
        ];
      });

      const filaAcumulado = [
        "CONSUMO ACUMULADO",
        "",
        ...columnas.map((columna) => calcularAcumulado(columna.key)),
        `Consumo total planta: ${consumoTotalPlanta} m³`,
        "",
      ];

      const textoTabla = [encabezados, ...filas, filaAcumulado]
        .map((fila) =>
          fila.map((valor) => limpiarValorCopiado(valor)).join("\t")
        )
        .join("\n");

      await copiarTextoAlPortapapeles(textoTabla);

      setSnackbar({
        open: true,
        mensaje: "Tabla copiada correctamente. Ya puedes pegarla en Excel.",
        severidad: "success",
      });
    } catch (error) {
      console.error("Error al copiar la tabla:", error);

      setSnackbar({
        open: true,
        mensaje: "No fue posible copiar la tabla.",
        severidad: "error",
      });
    }
  };

  /* ================= RENDER ================= */
  return (
    <Box
      sx={{
        mt: 1,
        p: 1.1,
        minHeight: "97vh",
        backgroundColor: "#F4F6F8",
      }}
    >
      {/* ================= HEADER ================= */}
      <Paper
        elevation={0}
        sx={{
          mt: 5,
          mb: 1,
          p: 2,
          borderRadius: 4,
          border: "1px solid #E0E0E0",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F5FBFF 45%, #EAF7FF 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 1,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#1A237E",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                mt: -1,
              }}
            >
              Medición diaria de contadores de agua
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.6,
                mb: -1.2,
                color: "#607D8B",
              }}
            >
              Registro, seguimiento y análisis diario de lecturas y consumos.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${medicionesOrdenadas.length} registros`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />

            <Chip
              label={`${columnas.length} medidores`}
              color="info"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />

            <Chip
              icon={<WaterDropIcon />}
              label={`Consumo total planta: ${consumoTotalPlanta} m³`}
              color="success"
              variant="outlined"
              sx={{
                fontWeight: 800,
                backgroundColor: "#F1F8E9",
              }}
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* ================= FILTROS + ACCIONES ================= */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: -0.8,
            mb: -0.6,
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="date"
              label="Desde"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              sx={{
                backgroundColor: "#FFFFFF",
                minWidth: 170,
              }}
            />

            <TextField
              type="date"
              label="Hasta"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              sx={{
                backgroundColor: "#FFFFFF",
                minWidth: 170,
              }}
            />

            <Button
              variant="contained"
              onClick={() => obtenerMediciones()}
              disabled={cargando || !fechaDesde || !fechaHasta}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                backgroundColor: "#1A237E",
                minWidth: 120,
              }}
            >
              {cargando ? "Consultando..." : "Ejecutar"}
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setOrdenAZ(!ordenAZ)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                backgroundColor: "#FFFFFF",
              }}
            >
              {ordenAZ
                ? "Orden: A-Z (Antiguas primero)"
                : "Orden: Z-A (Recientes primero)"}
            </Button>

            <Button
              variant={verConsumo ? "contained" : "outlined"}
              startIcon={<WaterDropIcon />}
              onClick={() => setVerConsumo(!verConsumo)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              {verConsumo ? "Ver lecturas" : "Ver consumo diario"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ShowChartIcon />}
              onClick={() => setOpenGrafica(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                backgroundColor: "#FFFFFF",
              }}
            >
              Gráfica
            </Button>

            <ExcelDownloadButton
              data={datosParaExcel}
              filename={`mediciones_agua_${fechaDesde}_${fechaHasta}.xlsx`}
              sheetName="Mediciones agua"
              buttonText="Exportar Excel"
              variant="contained"
              color="success"
              size="medium"
              disabled={cargando}
            />
          </Stack>
        </Box>
      </Paper>

      {/* ================= TABLA ================= */}
      <TableContainer
        component={Paper}
        elevation={3}
        onContextMenu={copiarTabla}
        title="Haz clic derecho para copiar la tabla"
        sx={{
          maxHeight: "68vh",
          overflow: "auto",
          borderRadius: 4,
          border: "1px solid #DDE3EA",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          cursor: "context-menu",
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            minWidth: 1200,

            "& thead th": {
              backgroundColor: "#1A237E",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.76rem",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              whiteSpace: "nowrap",
              borderBottom: "none",
              py: 1.4,
              zIndex: 3,
            },

            "& tbody td": {
              fontSize: "0.83rem",
              whiteSpace: "nowrap",
              borderBottom: "1px solid #ECEFF1",
              color: "#263238",
              py: 1,
            },

            "& tbody tr:nth-of-type(even)": {
              backgroundColor: "#F8FAFC",
            },

            "& tbody tr:hover": {
              backgroundColor: "#EAF4FF",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center">Fecha</TableCell>
              <TableCell align="center">Hora</TableCell>

              {columnas.map((columna) => (
                <TableCell key={columna.key} align="center">
                  {columna.nombre} ({columna.unidad})
                </TableCell>
              ))}

              <TableCell align="center">Observaciones</TableCell>
              <TableCell align="center">Operador</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {medicionesOrdenadas.map((row, index) => (
              <TableRow key={row._id}>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {row.fecha}
                </TableCell>

                <TableCell align="center">{row.hora}</TableCell>

                {columnas.map((columna) => (
                  <TableCell key={columna.key} align="center">
                    {renderConsumo(row, index, columna.key)}
                  </TableCell>
                ))}

                <TableCell
                  align="center"
                  sx={{
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.observaciones || "-"}
                </TableCell>

                <TableCell align="center">
                  {row.operador || "-"}
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    size="small"
                    sx={{
                      color: "#1565C0",
                      backgroundColor: "#E3F2FD",
                      mr: 0.8,
                      "&:hover": {
                        backgroundColor: "#BBDEFB",
                      },
                    }}
                    onClick={() => {
                      setEditId(row._id);
                      setForm(row);
                      setOpenEditar(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={{
                      color: "#C62828",
                      backgroundColor: "#FFEBEE",
                      "&:hover": {
                        backgroundColor: "#FFCDD2",
                      },
                    }}
                    onClick={() => eliminarMedicion(row._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {/* ================= ACUMULADO ================= */}
            <TableRow
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 2,
                backgroundColor: "#E3F2FD",

                "& td": {
                  fontWeight: 900,
                  color: "#1A237E",
                  borderTop: "2px solid #90CAF9",
                  borderBottom: "none",
                  py: 1.3,
                },
              }}
            >
              <TableCell colSpan={2}>Consumo acumulado</TableCell>

              {columnas.map((columna) => (
                <TableCell key={columna.key} align="center">
                  {calcularAcumulado(columna.key)} m³
                </TableCell>
              ))}

              <TableCell
                colSpan={3}
                align="center"
                sx={{
                  backgroundColor: "#C8E6C9",
                  color: "#1B5E20 !important",
                }}
              >
                Total planta: {consumoTotalPlanta} m³
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= SPEED DIAL ================= */}
      <SpeedDial
        ariaLabel="acciones"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          "& .MuiFab-primary": {
            backgroundColor: "#1A237E",
            "&:hover": {
              backgroundColor: "#0D164F",
            },
          },
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Nueva medición"
          onClick={() => {
            setForm({
              fecha: "",
              hora: "",
              operador: "",
              observaciones: "",
              lecturas: {},
            });

            setOpenFila(true);
          }}
        />

        <SpeedDialAction
          icon={<ViewColumnIcon />}
          tooltipTitle="Nuevo medidor"
          onClick={() => setOpenColumna(true)}
        />
      </SpeedDial>

      {/* ================= MODAL MEDICIÓN ================= */}
      <ModalIngresoMedicionContadoresAgua
        open={openFila || openEditar}
        openEditar={openEditar}
        form={form}
        setForm={setForm}
        columnas={columnas}
        onClose={() => {
          setOpenFila(false);
          setOpenEditar(false);
        }}
        onGuardar={openEditar ? actualizarMedicion : guardarMedicion}
      />

      {/* ================= MODAL COLUMNA ================= */}
      <Dialog
        open={openColumna}
        onClose={() => setOpenColumna(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A237E" }}>
          Nuevo medidor
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            label="Nombre visible"
            fullWidth
            margin="dense"
            value={nuevaColumna.nombre}
            onChange={(e) =>
              setNuevaColumna({
                ...nuevaColumna,
                nombre: e.target.value,
              })
            }
          />

          <TextField
            label="Clave (ej: pozo3)"
            fullWidth
            margin="dense"
            value={nuevaColumna.key}
            onChange={(e) =>
              setNuevaColumna({
                ...nuevaColumna,
                key: e.target.value,
              })
            }
          />

          <TextField
            label="Unidad"
            fullWidth
            margin="dense"
            value={nuevaColumna.unidad}
            onChange={(e) =>
              setNuevaColumna({
                ...nuevaColumna,
                unidad: e.target.value,
              })
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenColumna(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={guardarColumna}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              backgroundColor: "#1A237E",
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= MODAL GRÁFICA ================= */}
      <Dialog
        open={openGrafica}
        onClose={() => setOpenGrafica(false)}
        fullScreen
        PaperProps={{
          sx: {
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <Box
          sx={{
            height: 56,
            px: 2,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #DDE3EA",
            flexShrink: 0,
            backgroundColor: "#E3F2FD",
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              color: "#1A237E",
              letterSpacing: "0.3px",
            }}
          >
            Gráfica de consumo diario
          </Typography>

          <Button
            onClick={() => setOpenGrafica(false)}
            sx={{
              position: "absolute",
              right: 16,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Cerrar
          </Button>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: "#FAFAFA",
          }}
        >
          <GraficaConsumoDiarioPTAP
            mediciones={medicionesParaGrafica}
            columnas={columnas}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
          />
        </Box>
      </Dialog>

      {/* ================= SNACKBAR ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severidad}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{
            width: "100%",
            fontWeight: 700,
          }}
        >
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
