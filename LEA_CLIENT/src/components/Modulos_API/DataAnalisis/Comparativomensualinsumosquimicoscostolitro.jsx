import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Divider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  LabelList,
} from "recharts";
import axios from "axios";
import { Add, Whatshot, Opacity, AcUnit } from "@mui/icons-material";
import { Download, PictureAsPdf } from "@mui/icons-material";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Comparativomensualinsumosquimicoscostolitro = () => {
  const chartRef = useRef(null);

  const [produccionActual, setProduccionActual] = useState("");
  const [produccionAnterior, setProduccionAnterior] = useState("");
  const [mesDeCierre, setMesDeCierre] = useState("");
  const [mesComparar, setMesComparar] = useState("");
  const [tituloGrafico, setTituloGrafico] = useState("Gráfico Comparativo $/L OH");
  const [serieActual, setSerieActual] = useState("Nombre Serie Actual");
  const [serieAnterior, setSerieAnterior] = useState("Nombre Serie Anterior");
  const [consumo, setConsumo] = useState([]);

  // Snackbar confirmación
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  // Acumulados
  const [consumoCaldera, setConsumoCaldera] = useState(0);
  const [consumoAguas, setConsumoAguas] = useState(0);
  const [consumoTorre, setConsumoTorre] = useState(0);
  const [consumoCalderaComp, setConsumoCalderaComp] = useState(0);
  const [consumoAguasComp, setConsumoAguasComp] = useState(0);
  const [consumoTorreComp, setConsumoTorreComp] = useState(0);
  //graficas guardadas
  const [graficasGuardadas, setGraficasGuardadas] = useState([]);
  const [graficaSeleccionada, setGraficaSeleccionada] = useState(null);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    const fetchConsumo = async () => {
      try {
        const res = await axios.get("https://ambiocomserver.onrender.com/api/cierreMes/data");
        setConsumo(res.data);
      } catch (err) {
        console.error("Error al traer consumo:", err);
      }
    };
    fetchConsumo();
  }, []);

  // 1. Cargar todas las gráficas al inicio
  useEffect(() => {
    const fetchGraficas = async () => {
      try {
        const res = await axios.get(
          "https://ambiocomserver.onrender.com/api/graficainsumosoh/listarprecioporoh"
        );
        setGraficasGuardadas(res.data);
      } catch (err) {
        console.error("❌ Error al traer gráficas:", err);
      }
    };
    fetchGraficas();
  }, []);

  // 2. Cuando el usuario selecciona una gráfica, actualizamos los estados
  const handleSelectGrafica = (event, value) => {
    if (!value) return;

    setGraficaSeleccionada(value);

    // Cargar estados con los valores de la gráfica seleccionada
    setProduccionActual(value.produccionActual);
    setProduccionAnterior(value.produccionAnterior);
    setMesDeCierre(value.mesDeCierre);
    setMesComparar(value.mesComparar);
    setTituloGrafico(value.tituloGrafico);
    setSerieActual(value.serieActual);
    setSerieAnterior(value.serieAnterior);

    // Cargar consumos
    setConsumoCaldera(value.consumoCaldera);
    setConsumoAguas(value.consumoAguas);
    setConsumoTorre(value.consumoTorre);
    setConsumoCalderaComp(value.consumoCalderaComp);
    setConsumoAguasComp(value.consumoAguasComp);
    setConsumoTorreComp(value.consumoTorreComp);
  };

  // Calcular sumatorias mes seleccionado
  useEffect(() => {
    if (!mesDeCierre) return;
    const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mesDeCierre);
    if (mesSeleccionado?.dataMes) {
      const dataMes = mesSeleccionado.dataMes;
      setConsumoCaldera(
        dataMes
          .filter((i) => i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
      setConsumoAguas(
        dataMes
          .filter((i) => i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
      setConsumoTorre(
        dataMes
          .filter((i) => i.area.toLowerCase() === "torre de enfriamiento")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
    }
  }, [mesDeCierre, consumo]);

  // Calcular sumatorias mes comparar
  useEffect(() => {
    if (!mesComparar) return;
    const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mesComparar);
    if (mesSeleccionado?.dataMes) {
      const dataMes = mesSeleccionado.dataMes;
      setConsumoCalderaComp(
        dataMes
          .filter((i) => i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
      setConsumoAguasComp(
        dataMes
          .filter((i) => i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
      setConsumoTorreComp(
        dataMes
          .filter((i) => i.area.toLowerCase() === "torre de enfriamiento")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0)
      );
    }
  }, [mesComparar, consumo]);

  // Guardar datos
  const handleGuardar = async () => {
    try {
      const hoy = new Date();
      const fechaRegistro = hoy.toLocaleDateString("sv-SE", {
        timeZone: "America/Bogota",
      });
      // 👇 Aquí mandamos los datos al backend con axios
      await axios.post("https://ambiocomserver.onrender.com/api/graficainsumosoh/guardarprecioporoh", {
        produccionActual,
        produccionAnterior,
        mesDeCierre,
        mesComparar,
        tituloGrafico,
        serieActual,
        serieAnterior,
        fechaRegistro: fechaRegistro,
        // 👇 enviar sumatorias
        consumoCaldera,
        consumoAguas,
        consumoTorre,
        consumoCalderaComp,
        consumoAguasComp,
        consumoTorreComp,
      });

      // ✅ Si todo salió bien, mostramos confirmación
      setSnackbarMsg("✅ Datos guardados correctamente");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      // console.error("❌ Error al guardar:", error);
      setSnackbarMsg("❌ Error al guardar los datos");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // Descargar como Imagen
  const handleDownloadImage = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 3 }); // scale 3 = alta calidad
    const dataUrl = canvas.toDataURL("image/png", 1.0);

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${tituloGrafico}.png`;
    link.click();
  };

  // Descargar como PDF
  const handleDownloadPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png", 1.0);

    const pdf = new jsPDF("landscape", "mm", "a4"); // horizontal
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 20, pdfWidth, pdfHeight);
    pdf.save(`${tituloGrafico}.pdf`);
  };

  return (
    <Box sx={{ width: "98vw", minHeight: "100vh", p: 4, bgcolor: "#f9f9fb" }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        mb={4}
        mt={5}
      >
        Comparativo Mensual de Insumos Químicos $/L
      </Typography>

      {/* Ingresar Datos Producción */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3, width: "99%" }}
          >
            <Typography variant="h6">Ingresar Datos de Producción</Typography>

            <Box sx={{ width: 500, mt: 1 }}>
              <Autocomplete
                options={graficasGuardadas}
                getOptionLabel={(option) => option.tituloGrafico}
                onChange={handleSelectGrafica}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Visualiza gráficas guardadas"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Card sx={{ mb: 4, p: 2 }}>
            <CardContent>
              <Grid container spacing={2}>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Producción Anterior"
                    type="number"
                    value={produccionAnterior}
                    onChange={(e) => setProduccionAnterior(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Producción Actual"
                    type="number"
                    value={produccionActual}
                    onChange={(e) => setProduccionActual(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    label="Mes anterior o a Comparar"
                    value={mesComparar}
                    onChange={(e) => setMesComparar(e.target.value)}
                    fullWidth
                  >
                    {consumo.map((c) => (
                      <MenuItem key={c._id} value={c.MesDeCierre}>
                        {c.MesDeCierre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    label="Mes de Actual  o cierre"
                    value={mesDeCierre}
                    onChange={(e) => setMesDeCierre(e.target.value)}
                    fullWidth
                  >
                    {consumo.map((c) => (
                      <MenuItem key={c._id} value={c.MesDeCierre}>
                        {c.MesDeCierre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Título del Gráfico"
                    value={tituloGrafico}
                    onChange={(e) => setTituloGrafico(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nombre Serie Anterior"
                    value={serieAnterior}
                    onChange={(e) => setSerieAnterior(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nombre Serie Actual"
                    value={serieActual}
                    onChange={(e) => setSerieActual(e.target.value)}
                    fullWidth
                  />
                </Grid>

              </Grid>
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ px: 4, borderRadius: 3 }}
                  color="primary"
                  onClick={handleGuardar}
                >
                  Guardar Datos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Consumos */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Consumos Mensuales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Consumos Mes Seleccionado
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <Whatshot color="error" /> Caldera: {consumoCaldera}  <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <Opacity color="primary" /> Aguas: {consumoAguas}  <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <AcUnit color="info" /> Torre de Enfriamiento:{" "}
                        {consumoTorre}  <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Consumos Mes Comparar
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <Whatshot color="error" /> Caldera: {consumoCalderaComp}   <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <Opacity color="primary" /> Aguas: {consumoAguasComp}   <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <AcUnit color="info" /> Torre de Enfriamiento:{" "} 
                        {consumoTorreComp}  <strong style={{color: "green"}}>$COP</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Gráfico */}
      <Card sx={{ p: 2, position: "relative" }}>
        <CardContent>
          {/* 👉 Contenedor de botones flotantes con Glassmorphism */}
          <Box
            sx={{
              position: "absolute",
              top: 25,
              right: 30,
              display: "flex",
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<Download />}
              onClick={handleDownloadImage}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.6)", // 👈 más claro
                color: "#858181",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                textTransform: "none",
                fontSize: "0.75rem",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.35)",
                  color: "black",
                },
              }}
            >
              Imagen
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadPDF}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.6)", // 👈 más claro
                color: "#858181",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                textTransform: "none",
                fontSize: "0.75rem",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.35)",
                  color: "black",
                },
              }}
            >
              PDF
            </Button>
          </Box>

          {/* 👉 Contenido que se exporta */}
          <Box ref={chartRef} sx={{ width: "100%", bgcolor: "white", p: 2 }}>
            {/* ✅ Título centrado */}
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "'Roboto Slab', serif", // puedes usar otra fuente pro
                fontWeight: 600,
              }}
            >
              {tituloGrafico}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* 📊 Gráfico */}
            <Box sx={{ width: "100%", height: "60vh" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      area: "Caldera",
                      [serieActual]: produccionActual
                        ? consumoCaldera / Number(produccionActual)
                        : 0,
                      [serieAnterior]: produccionAnterior
                        ? consumoCalderaComp / Number(produccionAnterior)
                        : 0,
                    },
                    {
                      area: "Aguas",
                      [serieActual]: produccionActual
                        ? consumoAguas / Number(produccionActual)
                        : 0,
                      [serieAnterior]: produccionAnterior
                        ? consumoAguasComp / Number(produccionAnterior)
                        : 0,
                    },
                    {
                      area: "Torre de Enfriamiento",
                      [serieActual]: produccionActual
                        ? consumoTorre / Number(produccionActual)
                        : 0,
                      [serieAnterior]: produccionAnterior
                        ? consumoTorreComp / Number(produccionAnterior)
                        : 0,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area">
                    <Label
                      value="Áreas de Control"
                      offset={-18}
                      position="insideBottom"
                    />
                  </XAxis>
                  <YAxis tickFormatter={(value) => `${Number(value).toFixed(4)} $`}>
                    <Label
                      value="Consumo $ de Insumo por Litro de OH"
                      angle={-90}
                      offset={75}
                      position="insideLeft"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(value) => `${Number(value).toPrecision(6)} $`}
                    labelFormatter={(label) => `Área: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: -10,
                      marginLeft: 50,
                    }}
                    formatter={(value) => (
                      <span style={{ margin: "0 40px" }}>{value}</span> // 👈 separación lateral
                    )}
                  />
                  <Bar dataKey={serieActual} fill="#8884d8" name={serieActual}>
                    <LabelList
                      dataKey={serieActual}
                      position="top"
                      dy={-10}
                      formatter={(value) => {
                        if (value === 0) return "0";
                        return value >= 0.01
                          ? value.toFixed(2)
                          : value.toPrecision(6);
                      }}
                    />
                  </Bar>
                  <Bar
                    dataKey={serieAnterior}
                    fill="#82ca9d"
                    name={serieAnterior}
                  >
                    <LabelList
                      dataKey={serieAnterior}
                      position="top"
                      dy={-10}
                      formatter={(value) => {
                        if (value === 0) return "0";
                        return value >= 0.01
                          ? value.toFixed(2)
                          : value.toPrecision(6);
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Comparativomensualinsumosquimicoscostolitro;
