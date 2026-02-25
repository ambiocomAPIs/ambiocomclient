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
const API_MEDICIONES = "https://ambiocomserver.onrender.com/api/ingresocarbonmadera";
const API_COLUMNAS = "https://ambiocomserver.onrender.com/api/columnaingresocarbonmadera";

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

export default function TablaIngresoCarbonMadera() {
  /* ================= STATE ================= */
  const [columnas, setColumnas] = useState([]);
  const [mediciones, setMediciones] = useState([]);

  const [openFila, setOpenFila] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openColumna, setOpenColumna] = useState(false);
  // const [openGrafica, setOpenGrafica] = useState(false); // Eliminado

  const [editId, setEditId] = useState(null);
  // const [verConsumo, setVerConsumo] = useState(false); // Eliminado

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    responsable: "",
    observaciones: "",
    lecturas: {},
  });

  const [nuevaColumna, setNuevaColumna] = useState({
    nombre: "",
    key: "",
    unidad: "Kg",
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
    if (!window.confirm("¿Eliminar este Ingreso?")) return;
    await axios.delete(`${API_MEDICIONES}/${id}`);
    obtenerMediciones();
  };

  /* ================= CRUD COLUMNAS ================= */
  const guardarColumna = async () => {
    console.log("Enviar columna:", nuevaColumna);

    await axios.post(API_COLUMNAS, nuevaColumna);
    setNuevaColumna({ nombre: "", key: "", unidad: "" });
    setOpenColumna(false);
    obtenerColumnas();
  };

  /* ================= ORDEN + FILTRO ================= */
  const medicionesOrdenadas = useMemo(() => {
    let data = [...mediciones].sort(
      (a, b) => parseFecha(a.fecha) - parseFecha(b.fecha)
    );

    if (fechaDesde) {
      data = data.filter((m) => parseFecha(m.fecha) >= new Date(fechaDesde));
    }
    if (fechaHasta) {
      data = data.filter((m) => parseFecha(m.fecha) <= new Date(fechaHasta));
    }
    return data;
  }, [mediciones, fechaDesde, fechaHasta]);

  /* ================= SOLO MEDIDAS REALES ================= */
  const medicionesLectura = useMemo(() => {
    return mediciones.map((m) => ({
      fecha: m.fecha,
      lecturas: m.lecturas,
    }));
  }, [mediciones]);

  /* ================= CALCULAR ACUMULADO ================= */

  const calcularAcumulado = (key) => {
    return mediciones.reduce((total, m) => {
      const valor = m.lecturas?.[key];
      return total + (typeof valor === "number" ? valor : 0);
    }, 0);
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
          Ingresos Diarios Carbon y Madera
        </Typography>
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
              <TableCell align="center">Fecha de Ingreso</TableCell>
              <TableCell align="center">Hora de Ingreso</TableCell>

              {columnas.map((c) => (
                <TableCell key={c.key} align="center">
                  {c.nombre}
                </TableCell>
              ))}

              <TableCell align="center">Observaciones</TableCell>
              <TableCell align="center">Responsable</TableCell>
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
                    {/* Ya no usamos renderConsumo, mostramos el valor directo */}
                    {row.lecturas[c.key] ?? ""}
                  </TableCell>
                ))}

                <TableCell align="center">{row.observaciones}</TableCell>
                <TableCell align="center">{row.responsable}</TableCell>

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
                <b>Ingreso acumulado</b>
              </TableCell>

              {columnas.map((c) => (
                <TableCell key={c.key} align="center">
                  <b>{calcularAcumulado(c.key)} Kg</b>
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
              hora: "",
              responsable: "",
              observaciones: "",
              lecturas: {},
            });
            setOpenFila(true);
          }}
        />
        <SpeedDialAction
          icon={<ViewColumnIcon />}
          tooltipTitle="Nuevo Ingreso"
          onClick={() => setOpenColumna(true)}
        />
      </SpeedDial>

      {/* ================= MODAL MEDICION ================= */}
      <Dialog open={openFila || openEditar} fullWidth maxWidth="sm">
        <DialogTitle>
          {openEditar ? "Editar Ingreso" : "Nuevo Ingreso"}
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

          {columnas.map((c) => {
            const esNumero = c.tipo === "number";

            return (
              <TextField
                key={c.key}
                label={`${c.nombre}${c.unidad ? ` (${c.unidad})` : ""}`}
                type={esNumero ? "number" : "text"}
                fullWidth
                margin="dense"
                value={form.lecturas?.[c.key] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lecturas: {
                      ...form.lecturas,
                      [c.key]: esNumero
                        ? Number(e.target.value)
                        : e.target.value,
                    },
                  })
                }
              />
            );
          })}

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
            label="Responsable"
            fullWidth
            margin="dense"
            value={form.responsable}
            onChange={(e) => setForm({ ...form, responsable: e.target.value })}
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
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenColumna(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarColumna}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
