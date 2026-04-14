import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Stack,
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";

import {
  AddCircleOutline,
  Search,
  CalendarMonth,
  Close,
  WaterDrop,
  Timeline,
} from "@mui/icons-material";

import SpeedDialComponent from "../../utils/speedDial/SpeedDial";
import ExcelStyleFooter from "../../utils/Footers/ExcelStyleFooter";
import ReportarNivelesTanquesJornaleros from "./utils_seguimientoTanquesJornaleros/modals_seguimientoTanquesJornaleros/ReportarNivelesTanquesJornaleros";
import DetallesMovimientosDeTanquesJornaleros from "./utils_seguimientoTanquesJornaleros/modals_seguimientoTanquesJornaleros/DetallesMovimientosDeTanquesJornaleros";
import GraficoNivelesTanquesPorDiaModal from "../TanquesVistaNiveles/GraficaNivelesDiariosPorMes/GraficaNivelesDiarioTanquesJornalerosComponente";
// loading component
import EnterpriseLoadingScreen from "../../utils/Loaders_Component/EnterpriseLoadingScreen";

const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "94%", sm: 500 },
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  borderRadius: "18px",
  boxShadow: 24,
  p: 0,
};

const styleModalFullScreen = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  bgcolor: "#f4f7fb",
  boxShadow: 24,
  p: { xs: 1, sm: 2 },
  overflow: "hidden",
};

const cardStyle = {
  flex: 1,
  p: 1.2,
  borderRadius: 3,
  bgcolor: "#f8fafc",
  border: "1px solid #e5e7eb",
  minWidth: 90,
};

function SeguimientoTKJornaleros({ NivelesTanquesContext }) {
  // console.log("tanques context:", NivelesTanquesContext);  

  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [tanqueOrigen, setTanqueOrigen] = useState("");
  const [tanqueDestino, setTanqueDestino] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [responsable, setResponsable] = useState("");
  const [cliente, setCliente] = useState("");
  const [factura, setFactura] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [tanques, setTanques] = useState([]);
  const [filteredTanques, setFilteredTanques] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [loading, setLoadingData] = useState("");
  const [tanquesPlanta, setInfoDetailsTanquesPlanta] = useState([]); // viene de tanque list, lista de tanques CRUD

  const [
    modalVerRegistrarMovimientoTanqueJornaleroIsOpen,
    setModalVerRegistrarMovimientoTanqueJornaleroIsOpen,
  ] = useState(false);
  const [
    modalReportarNivelesTanquesJornalerosIsOpen,
    setModalReportarNivelesTanquesJornalerosIsOpen,
  ] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [
    modalVerMovimientosTanquesJornalerosIsOpen,
    setModalVerMovimientosTanquesJornalerosIsOpen,
  ] = useState(false);
  const [
    modalOpenModalGraficoNivelesModalIsOpen,
    setopenModalGraficoNivelesModalIsOpen,
  ] = useState(false);
  const [usuario, setUsuario] = useState(null);

  const navigate = useNavigate();
  const hoy = new Date().toLocaleDateString("es-ES");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("usuario");
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }
  }, []);

  const handleClose = () => {
    setTipoMovimiento("");
    setTanqueOrigen("");
    setTanqueDestino("");
    setCantidad("");
    setResponsable("");
    setCliente("");
    setFactura("");
    setObservaciones("");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchTanques = async () => {
      try {
        const res = await axios.get("https://ambiocomserver.onrender.com/api/tanques",{withCredentials:true});
        setInfoDetailsTanquesPlanta(res.data || []);
      } catch (error) {
        console.error("Error al consultar tanques:", error);
        setInfoDetailsTanquesPlanta([]);
      }
    };

    fetchTanques();
  }, []);

  useEffect(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const fechaFormateada = `${año}-${mes}-${dia}`;
    setFechaFiltro(fechaFormateada);
  }, []);

  useEffect(() => {
    if (NivelesTanquesContext.length > 0) {
      setTanques(NivelesTanquesContext);
      setFilteredTanques(NivelesTanquesContext);
    }
  }, [NivelesTanquesContext]);

  useEffect(() => {
    if (Array.isArray(filteredTanques) && filteredTanques.length > 0) {
      setLoadingData(false);
    } else {
      setLoadingData(true);
    }
  }, [filteredTanques]);

  useEffect(() => {
    if (Array.isArray(tanques) && tanques.length > 0) {
      setLoadingData(false);
    } else {
      setLoadingData(true);
    }
  }, [tanques]);

  useEffect(() => {
    const filtered = tanques.filter((t) => {
      const fechaRegistro = t.FechaRegistro;
      return fechaFiltro ? fechaRegistro === fechaFiltro : true;
    });

    if (searchQuery === "") {
      setFilteredTanques(filtered);
    } else {
      setFilteredTanques(
        filtered.filter((t) =>
          t?.NombreTanque?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, tanques, fechaFiltro]);

  useEffect(() => {
    if (usuario === null) return;

    const rolesPermitidos = ["logistica", "gerente", "supervisor", "developer"];
    if (!rolesPermitidos.includes(usuario.rol)) {
      navigate("/");
    }
  }, [usuario, navigate]);

  const tanquesMap = React.useMemo(() => {
    const mapa = {};

    tanquesPlanta.forEach((item) => {
      mapa[item.NombreTanque] = {
        factor: Number(item.Factor),
        capacidad: Number(item.VolumenTotal),
      };
    });

    return mapa;
  }, [tanquesPlanta]);

  const openModalFromFooterRegistrarMovimientoTanqueJornalero = () =>
    setModalVerRegistrarMovimientoTanqueJornaleroIsOpen(true);
  const closeModalVerRegistrarMovimientoTanqueJornaleroIsOpen = () =>
    setModalVerRegistrarMovimientoTanqueJornaleroIsOpen(false);

  const openModalReportarNivelesTanquesJornalerosIsOpen = () =>
    setModalReportarNivelesTanquesJornalerosIsOpen(true);
  const closeModalReportarNivelesTanquesJornalerosIsOpen = () =>
    setModalReportarNivelesTanquesJornalerosIsOpen(false);

  const openModalVerMovimientosTanquesJornaleros = () =>
    setModalVerMovimientosTanquesJornalerosIsOpen(true);
  const closeModalVerMovimientosTanquesJornaleros = () =>
    setModalVerMovimientosTanquesJornalerosIsOpen(false);

  const openModalGraficoNivelesModalIsOpen = () =>
    setopenModalGraficoNivelesModalIsOpen(true);
  const closeModalGraficoNivelesModalIsOpen = () =>
    setopenModalGraficoNivelesModalIsOpen(false);

  const handleSaveMovement = () => {
    const data = {
      tipoDeMovimiento: tipoMovimiento,
      tanqueOrigen:
        tipoMovimiento === "movimiento" || tipoMovimiento === "despacho"
          ? tanqueOrigen
          : null,
      tanqueDestino:
        tipoMovimiento === "movimiento" || tipoMovimiento === "carga"
          ? tanqueDestino
          : null,
      cantidad: parseFloat(cantidad),
      responsable,
      cliente: tipoMovimiento === "despacho" ? cliente : null,
      detalleFactura: tipoMovimiento === "despacho" ? factura : null,
      observaciones,
    };

    axios
      .post("https://ambiocomserver.onrender.com/api/reportar/operacionesdetanques", data)
      .then((response) => {
        setSnackbarOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
        handleClose();
      })
      .catch((error) => {
        console.error("Error al registrar movimiento:", error);
      });
  };

  const rolesPermitidos = ["logistica", "gerente", "supervisor", "developer"];
  if (!rolesPermitidos.includes(usuario?.rol)) {
    return null;
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2.5, md: 3 },
        pt: 2,
        pb: 10,
        minHeight: "100vh",
        bgcolor: "#f4f7fb",
      }}
    >
      <Box
        sx={{
          mb: 1.3,
          mt: 5,
          borderRadius: 3,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #2563eb 100%)",
          color: "#fff",
          boxShadow: "0 18px 35px rgba(15,23,42,0.18)",
        }}
      >
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 850,
                    fontSize: { xs: "1.5rem", md: "2rem" },
                    lineHeight: 1.1,
                  }}
                >
                  Niveles de Tanques Jornaleros
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<WaterDrop sx={{ color: "#fff !important" }} />}
                    label={`Tanques visibles: ${filteredTanques.length}`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.14)",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    icon={<CalendarMonth sx={{ color: "#fff !important" }} />}
                    label={`Fecha: ${fechaFiltro || "Sin filtro"}`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.14)",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                justifyContent={{ xs: "stretch", md: "flex-end" }}
              >
                <Button
                  variant="contained"
                  startIcon={<Timeline />}
                  onClick={openModalGraficoNivelesModalIsOpen}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 800,
                    px: 2.2,
                    bgcolor: "#ffffff",
                    color: "#0f172a",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#e2e8f0",
                      boxShadow: "none",
                    },
                  }}
                >
                  Ver gráfico
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddCircleOutline />}
                  onClick={() => navigate("/cargamasivatanquesjornaleros")}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 800,
                    px: 2.2,
                    bgcolor: "#22c55e",
                    color: "#fff",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#16a34a",
                      boxShadow: "none",
                    },
                  }}
                >
                  Carga Masiva
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1.2,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha"
              type="date"
              fullWidth
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Filtrar tanque"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Vista operativa del día seleccionado. Aqui se visualizará los
                Niveles de los tanques en el dia consultado.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Stack spacing={2}>
        {loading ? (
          <EnterpriseLoadingScreen size={100} />
        ) : filteredTanques.length > 0 ? (
          filteredTanques.map((tanque, index) => {
            // const infoTanque = InformacionTanques[tanque.NombreTanque];
            // if (!infoTanque) return null;

            // const capacidad = infoTanque[0];
            // const factor = tanque.Factor;
            // const volumen = tanque.NivelTanque * factor;
            // const porcentaje = Math.min(
            //   (tanque.NivelTanque / (capacidad / 100)) * 100,
            //   100
            // );

            const infoTanque = tanquesMap[tanque.NombreTanque];
            // console.log("infotanque:", infoTanque);
            if (!infoTanque) return null;

            const nivel = Number(tanque.NivelTanque || 0);
            const factor = infoTanque.factor;
            const capacidad = infoTanque.capacidad;
            const volumen = nivel * factor;

            const porcentaje = capacidad > 0
              ? Math.min((volumen / capacidad) * 100, 100)
              : 0;

            return (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                }}
              >
                <Grid
                  container
                  spacing={2}
                  alignItems="center"
                  wrap="nowrap" // 👈 CLAVE
                >
                  {/* NOMBRE TANQUE */}
                  <Grid item md={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        TK-{tanque.NombreTanque}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Registro del tanque
                      </Typography>
                    </Box>
                  </Grid>

                  {/* PROGRESO */}
                  <Grid item md={5}>
                    <Stack spacing={0.8}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Nivel de ocupación
                        </Typography>
                        <Chip
                          label={`${porcentaje.toFixed(1)}%`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor:
                              porcentaje >= 80
                                ? "#dcfce7"
                                : porcentaje >= 40
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              porcentaje >= 80
                                ? "#166534"
                                : porcentaje >= 40
                                  ? "#92400e"
                                  : "#991b1b",
                          }}
                        />
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={porcentaje}
                        sx={{
                          height: 14,
                          borderRadius: 999,
                          backgroundColor: "#e5e7eb",

                          "& .MuiLinearProgress-bar": {
                            backgroundColor:
                              porcentaje >= 80
                                ? "#22c55e"   // verde
                                : porcentaje >= 40
                                  ? "#f59e0b"   // amarillo
                                  : "#ef4444",  // rojo
                          },
                        }}
                      />
                    </Stack>
                  </Grid>

                  {/* CHIPS */}
                  <Grid item md={5}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.2,
                        flexWrap: "nowrap", // 👈 evita salto de línea
                        justifyContent: "space-between",
                      }}
                    >
                      {/* NIVEL */}
                      <Box sx={cardStyle}>
                        <Typography variant="caption">Nivel</Typography>
                        <Typography fontWeight={800}>
                          {tanque.NivelTanque} m
                        </Typography>
                      </Box>

                      {/* CAPACIDAD */}
                      <Box sx={cardStyle}>
                        <Typography variant="caption">Capacidad</Typography>
                        <Typography fontWeight={800}>
                          {capacidad.toLocaleString("es-CO")} L
                        </Typography>
                      </Box>

                      {/* FACTOR */}
                      <Box sx={cardStyle}>
                        <Typography variant="caption">Factor</Typography>
                        <Typography fontWeight={800}>
                          {factor} L/m
                        </Typography>
                      </Box>

                      {/* VOLUMEN */}
                      <Box sx={cardStyle}>
                        <Typography variant="caption">Volumen Actual</Typography>

                        <Typography fontWeight={800}>
                          {volumen.toLocaleString("es-CO")} L
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            );
          })
        ) : (
          <Paper
            elevation={0}
            sx={{
              height: "55vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 4,
              border: "1px dashed #cbd5e1",
              bgcolor: "#fff",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <WaterDrop sx={{ fontSize: 52, color: "#94a3b8", mb: 1 }} />
              <Typography variant="h6" fontWeight={800}>
                No hay datos para el día seleccionado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Cambia la fecha o el filtro para revisar otros registros.
              </Typography>
            </Box>
          </Paper>
        )}
      </Stack>

      <Modal
        open={modalVerRegistrarMovimientoTanqueJornaleroIsOpen}
        onClose={closeModalVerRegistrarMovimientoTanqueJornaleroIsOpen}
      >
        <Box sx={styleModal}>
          <Box
            sx={{
              px: 3,
              py: 2.2,
              background:
                "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Nueva operación de tanques
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {hoy}
              </Typography>
            </Box>

            <IconButton
              onClick={closeModalVerRegistrarMovimientoTanqueJornaleroIsOpen}
              sx={{ color: "#fff" }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="tipo-movimiento-label">
                  Tipo de Movimiento
                </InputLabel>
                <Select
                  labelId="tipo-movimiento-label"
                  value={tipoMovimiento}
                  label="Tipo de Movimiento"
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="despacho">Despacho</MenuItem>
                  <MenuItem value="movimiento">Movimiento entre Tanques</MenuItem>
                  <MenuItem value="carga">Carga de Tanque</MenuItem>
                </Select>
              </FormControl>

              {(tipoMovimiento === "movimiento" ||
                tipoMovimiento === "despacho") && (
                  <FormControl fullWidth>
                    <InputLabel id="tanque-origen-label">Tanque Origen</InputLabel>
                    <Select
                      labelId="tanque-origen-label"
                      value={tanqueOrigen}
                      label="Tanque Origen"
                      onChange={(e) => setTanqueOrigen(e.target.value)}
                      sx={{ borderRadius: 3 }}
                    >
                      {[
                        ...new Map(tanques.map((t) => [t.NombreTanque, t])).values(),
                      ].map((t) => (
                        <MenuItem key={t.NombreTanque} value={t.NombreTanque}>
                          TK-{t.NombreTanque}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

              {(tipoMovimiento === "movimiento" || tipoMovimiento === "carga") && (
                <FormControl fullWidth>
                  <InputLabel id="tanque-destino-label">Tanque Destino</InputLabel>
                  <Select
                    labelId="tanque-destino-label"
                    value={tanqueDestino}
                    label="Tanque Destino"
                    onChange={(e) => setTanqueDestino(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    {[
                      ...new Map(tanques.map((t) => [t.NombreTanque, t])).values(),
                    ].map((t) => (
                      <MenuItem key={t.NombreTanque} value={t.NombreTanque}>
                        TK-{t.NombreTanque}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Cantidad (L)"
                type="number"
                fullWidth
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                  },
                }}
              />

              <TextField
                label="Responsable"
                fullWidth
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                  },
                }}
              />

              {tipoMovimiento === "despacho" && (
                <>
                  <TextField
                    label="Cliente"
                    fullWidth
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                      },
                    }}
                  />
                  <TextField
                    label="Detalle de Factura"
                    fullWidth
                    value={factura}
                    onChange={(e) => setFactura(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                      },
                    }}
                  />
                </>
              )}

              <TextField
                label="Observaciones"
                fullWidth
                multiline
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                  },
                }}
              />

              <Divider />

              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleSaveMovement}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  fontWeight: 800,
                  boxShadow: "none",
                }}
              >
                Guardar Movimiento
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%", borderRadius: 3 }}
          variant="filled"
        >
          Movimiento registrado correctamente
        </Alert>
      </Snackbar>

      <ReportarNivelesTanquesJornaleros
        open={modalReportarNivelesTanquesJornalerosIsOpen}
        onClose={closeModalReportarNivelesTanquesJornalerosIsOpen}
      />

      <DetallesMovimientosDeTanquesJornaleros
        open={modalVerMovimientosTanquesJornalerosIsOpen}
        onClose={closeModalVerMovimientosTanquesJornaleros}
      />

      <Modal
        open={modalOpenModalGraficoNivelesModalIsOpen}
        onClose={closeModalGraficoNivelesModalIsOpen}
      >
        <Box sx={styleModalFullScreen}>
          <Paper
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #dbe2e8",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 1.3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                bgcolor: "#fff",
                background: "linear-gradient(135deg, rgba(175, 235, 168, 0.65) 0%, rgba(187,222,251,0.95) 100%)",
              }}
            >
              <Typography variant="h5" fontWeight={900}>
                Gráfico de Niveles Diarios de Tanques
              </Typography>

              <Button
                variant="contained"
                color="error"
                onClick={closeModalGraficoNivelesModalIsOpen}
                sx={{ borderRadius: 3, boxShadow: "none" }}
              >
                Cerrar
              </Button>
            </Box>

            <Box sx={{ height: "calc(100% - 50px)" }}>
              <GraficoNivelesTanquesPorDiaModal
                NivelesTanquesContext={NivelesTanquesContext}
              />
            </Box>
          </Paper>
        </Box>
      </Modal>

      <ExcelStyleFooter
        moduloActivo={"tanquesjornaleros"}
        openModalGraficoNivelesModalOpen={openModalGraficoNivelesModalIsOpen}
        openModalFromFooterRegistrarMovimientoTanqueJornalero={
          openModalFromFooterRegistrarMovimientoTanqueJornalero
        }
        openModalReportarNivelesTanquesJornaleros={
          openModalReportarNivelesTanquesJornalerosIsOpen
        }
      />

      {/* <SpeedDialComponent
        VerMovimientosTanquesJornaleros={
          openModalVerMovimientosTanquesJornaleros
        }
        sx={{
          position: "fixed",
          top: 16,
          right: 35,
          zIndex: 1300,
          "&:focus, &:active": {
            outline: "none",
          },
        }}
      /> */}
    </Box>
  );
}

export default SeguimientoTKJornaleros;