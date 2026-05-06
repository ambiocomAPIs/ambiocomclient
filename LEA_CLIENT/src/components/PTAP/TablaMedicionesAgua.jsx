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
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import GraficaConsumoDiarioPTAP from "./utils_PTAP/GraficaConsumoDiario";
import ModalIngresoMedicionContadoresAgua from "./utils_PTAP/Modal_PTAP/ModalIngresoMedicionContadoresAgua";

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

const isoToDDMMYYYY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

export default function TablaMedicionesAgua() {
  /* ================= STATE ================= */
  const [columnas, setColumnas] = useState([]);
  const [mediciones, setMediciones] = useState([]);

  const [openFila, setOpenFila] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openColumna, setOpenColumna] = useState(false);
  const [openGrafica, setOpenGrafica] = useState(false);

  const [editId, setEditId] = useState(null);
  const [verConsumo, setVerConsumo] = useState(false);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [ordenAZ, setOrdenAZ] = useState(false);

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
    obtenerMediciones();
  }, []);

  /* ================= API ================= */
  const obtenerColumnas = async () => {
    const { data } = await axios.get(API_COLUMNAS);
    setColumnas(data);
  };

  const obtenerMediciones = async () => {
    const { data } = await axios.get(API_MEDICIONES);
    setMediciones(data);
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
    setNuevaColumna({ nombre: "", key: "", unidad: "m³" });
    setOpenColumna(false);
    obtenerColumnas();
  };

  /* ================= ORDEN + FILTRO ================= */
  const medicionesOrdenadas = useMemo(() => {
    let data = [...mediciones];

    if (fechaDesde) {
      data = data.filter((m) => parseFecha(m.fecha) >= new Date(fechaDesde));
    }

    if (fechaHasta) {
      data = data.filter((m) => parseFecha(m.fecha) <= new Date(fechaHasta));
    }

    data.sort((a, b) => {
      const fechaA = parseFecha(a.fecha);
      const fechaB = parseFecha(b.fecha);

      return ordenAZ
        ? fechaA - fechaB
        : fechaB - fechaA;
    });

    return data;
  }, [mediciones, fechaDesde, fechaHasta, ordenAZ]);

  /* ================= RENDER CONSUMO ================= */
  const renderConsumo = (row, index, key) => {
    const actual = row.lecturas[key] ?? 0;

    const medicionesCronologicas = [...medicionesOrdenadas].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );

    const indexCronologico = medicionesCronologicas.findIndex(
      (m) => m._id === row._id
    );

    if (indexCronologico === 0) {
      return verConsumo ? (
        <Typography sx={{ fontWeight: 700, color: "#757575" }}>0</Typography>
      ) : (
        actual
      );
    }

    const anterior = medicionesCronologicas[indexCronologico - 1].lecturas[key] ?? 0;
    const diff = actual - anterior;

    const color =
      diff === 0 ? "#757575" : diff > CONSUMO_ALTO ? "#C62828" : "#2E7D32";

    if (!verConsumo) {
      return (
        <TooltipConsumo title={`Consumo diario: ${diff} m³`}>
          <span>{actual}</span>
        </TooltipConsumo>
      );
    }

    return <Typography sx={{ fontWeight: 700, color }}>{diff}</Typography>;
  };

  /* ================= ACUMULADO ================= */
  const calcularAcumulado = (key) => {
    let total = 0;

    medicionesOrdenadas.forEach((row, i) => {
      if (i === 0) return;

      const actual = row.lecturas[key] ?? 0;
      const anterior = medicionesOrdenadas[i - 1].lecturas[key] ?? 0;
      const diff = actual - anterior;

      if (diff > 0) total += diff;
    });

    return total;
  };

  const medicionesParaGrafica = useMemo(() => {
    return [...medicionesOrdenadas].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );
  }, [medicionesOrdenadas]);

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
                mt: -1
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

          <Stack direction="row" spacing={1} flexWrap="wrap">
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
          </Stack>
        </Box>
      </Paper>

      {/* ================= TABLA ================= */}
      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          maxHeight: "68vh",
          overflow: "auto",
          borderRadius: 4,
          border: "1px solid #DDE3EA",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
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

              {columnas.map((c) => (
                <TableCell key={c.key} align="center">
                  {c.nombre} ({c.unidad})
                </TableCell>
              ))}

              <TableCell align="center">Observaciones</TableCell>
              <TableCell align="center">Operador</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {medicionesOrdenadas.map((row, i) => (
              <TableRow key={row._id}>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {row.fecha}
                </TableCell>

                <TableCell align="center">{row.hora}</TableCell>

                {columnas.map((c) => (
                  <TableCell key={c.key} align="center">
                    {renderConsumo(row, i, c.key)}
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

                <TableCell align="center">{row.operador || "-"}</TableCell>

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

              {columnas.map((c) => (
                <TableCell key={c.key} align="center">
                  {calcularAcumulado(c.key)} m³
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
      <Dialog open={openColumna} fullWidth maxWidth="xs">
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
              setNuevaColumna({ ...nuevaColumna, nombre: e.target.value })
            }
          />

          <TextField
            label="Clave (ej: pozo3)"
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
          />
        </Box>
      </Dialog>
    </Box>
  );
}