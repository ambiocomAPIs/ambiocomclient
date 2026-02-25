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
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import GraficaConsumoDiarioPTAP from "./utils_PTAP/GraficaConsumoDiario";

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
    let data = [...mediciones].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );

    if (fechaDesde) {
      data = data.filter(
        (m) => parseFecha(m.fecha) >= new Date(fechaDesde)
      );
    }
    if (fechaHasta) {
      data = data.filter(
        (m) => parseFecha(m.fecha) <= new Date(fechaHasta)
      );
    }
    return data;
  }, [mediciones, fechaDesde, fechaHasta]);

  /* ================= RENDER CONSUMO ================= */

  // const renderConsumo = (row, index, key) => {
  //   const actual = row.lecturas[key] ?? 0;
  //   const anterior =
  //     index === 0 ? 0 : medicionesOrdenadas[index - 1].lecturas[key] ?? 0;

  //   const diff = actual - anterior;

  //   const color =
  //     diff === 0 ? "#757575" : diff > CONSUMO_ALTO ? "#C62828" : "#2E7D32";

  //   if (!verConsumo) {
  //     if (index === 0) return actual;
  //     return (
  //       <TooltipConsumo title={`Consumo diario: ${diff} m³`}>
  //         <span>{actual}</span>
  //       </TooltipConsumo>
  //     );
  //   }

  //   return (
  //     <Typography sx={{ fontWeight: 600, color }}>
  //       {index === 0 ? 0 : diff}
  //     </Typography>
  //   );
  // };

  const renderConsumo = (row, index, key) => {
    const actual = row.lecturas[key] ?? 0;
  
    // 🔴 si es el último día, no hay consumo
    if (index === medicionesOrdenadas.length - 1) {
      return verConsumo ? (
        <Typography sx={{ fontWeight: 600, color: "#757575" }}>0</Typography>
      ) : (
        actual
      );
    }
  
    const siguiente =
      medicionesOrdenadas[index + 1].lecturas[key] ?? 0;
  
    const diff = siguiente - actual;
  
    const color =
      diff === 0 ? "#757575" : diff > CONSUMO_ALTO ? "#C62828" : "#2E7D32";
  
    if (!verConsumo) {
      return (
        <TooltipConsumo title={`Consumo diario: ${diff} m³`}>
          <span>{actual}</span>
        </TooltipConsumo>
      );
    }
  
    return (
      <Typography sx={{ fontWeight: 600, color }}>
        {diff}
      </Typography>
    );
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

  /* ================= RENDER ================= */
  return (
    <Box sx={{ p: 3 }}>
      {/* ================= TITULO ================= */}
      <Box
        sx={{
          mt: 5,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" sx={{ color: "#1A237E" }}>
          Medición diaria de contadores de agua
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={verConsumo ? "contained" : "outlined"}
            startIcon={<WaterDropIcon />}
            onClick={() => setVerConsumo(!verConsumo)}
          >
            {verConsumo ? "Ver lecturas" : "Ver consumo diario"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ShowChartIcon />}
            onClick={() => setOpenGrafica(true)}
          >
            Gráfica
          </Button>
        </Box>
      </Box>

      {/* ================= FILTROS ================= */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          type="date"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
        <TextField
          type="date"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
      </Box>

      {/* ================= TABLA ================= */}
      <TableContainer component={Paper} elevation={3}>
        <Table size="small" stickyHeader>
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
                <TableCell align="center">{row.fecha}</TableCell>
                <TableCell align="center">{row.hora}</TableCell>

                {columnas.map((c) => (
                  <TableCell key={c.key} align="center">
                    {renderConsumo(row, i, c.key)}
                  </TableCell>
                ))}

                <TableCell align="center">{row.observaciones}</TableCell>
                <TableCell align="center">{row.operador}</TableCell>

                <TableCell align="center">
                  <IconButton
                    onClick={() => {
                      setEditId(row._id);
                      setForm(row);
                      setOpenEditar(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => eliminarMedicion(row._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {/* ================= ACUMULADO ================= */}
            <TableRow>
              <TableCell colSpan={2}>
                <b>Consumo acumulado</b>
              </TableCell>

              {columnas.map((c) => (
                <TableCell key={c.key} align="center">
                  <b>{calcularAcumulado(c.key)} m³</b>
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

      {/* ================= MODAL MEDICION ================= */}
      <Dialog open={openFila || openEditar} fullWidth maxWidth="sm">
        <DialogTitle>
          {openEditar ? "Editar medición" : "Nueva medición"}
        </DialogTitle>

        <DialogContent>
          <TextField
            type="date"
            label="Fecha"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            onChange={(e) =>
              setForm({ ...form, fecha: isoToDDMMYYYY(e.target.value) })
            }
          />

          <TextField
            label="Hora"
            fullWidth
            margin="dense"
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: e.target.value })}
          />

          {columnas.map((c) => (
            <TextField
              key={c.key}
              label={`${c.nombre} (${c.unidad})`}
              type="number"
              fullWidth
              margin="dense"
              value={form.lecturas[c.key] || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  lecturas: {
                    ...form.lecturas,
                    [c.key]: Number(e.target.value),
                  },
                })
              }
            />
          ))}

          <TextField
            label="Observaciones"
            fullWidth
            margin="dense"
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
          />

          <TextField
            label="Operador"
            fullWidth
            margin="dense"
            value={form.operador}
            onChange={(e) =>
              setForm({ ...form, operador: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpenFila(false);
              setOpenEditar(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={openEditar ? actualizarMedicion : guardarMedicion}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= MODAL COLUMNA ================= */}
      <Dialog open={openColumna} fullWidth maxWidth="xs">
        <DialogTitle>Nuevo medidor</DialogTitle>

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

        <DialogActions>
          <Button onClick={() => setOpenColumna(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarColumna}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      {/* ================= MODAL GRAFICA ================= */}
      <Dialog
        open={openGrafica}
        onClose={() => setOpenGrafica(false)}
        fullScreen                 // 🔴 CLAVE: usa todo el viewport
        PaperProps={{
          sx: {
            overflow: "hidden",     // ❌ sin scroll
            backgroundColor: "#fff",
          },
        }}
      >
        {/* ===== HEADER CONTROLADO ===== */}
        <Box
          sx={{
            height: 48,
            px: 2,
            position: "relative",  
            display: "flex",
            alignItems: "center",
            justifyContent: "center",     
            borderBottom: "1px solid #E0E0E0",
            flexShrink: 0,
            backgroundColor:"#ACEEFC"
          }}
        >
          {/* TITULO CENTRADO */}
          <Typography sx={{ fontWeight: 960 }}>
            Gráfica de consumo diario
          </Typography>

          {/* BOTON DERECHA */}
          <Button
            onClick={() => setOpenGrafica(false)}
            sx={{
              position: "absolute",
              right: 16,
            }}
          >
            Cerrar
          </Button>
        </Box>


        {/* ===== CONTENIDO SIN PADDING ===== */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",      // 🔴 CLAVE
          }}
        >
          <GraficaConsumoDiarioPTAP
            mediciones={medicionesOrdenadas}
            columnas={columnas}
          />
        </Box>
      </Dialog>

    </Box>
  );
}
