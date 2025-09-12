import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
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
  Checkbox,
  FormControlLabel,
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
import {
  Download,
  PictureAsPdf,
  CheckBoxOutlineBlank,
  CheckBox,
} from "@mui/icons-material";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const Comparativomensualinsumosquimicoscostolitro = () => {
  const chartRef = useRef(null);

  const [produccionActual, setProduccionActual] = useState("");
  const [produccionAnterior, setProduccionAnterior] = useState("");
  const [mesDeCierre, setMesDeCierre] = useState([]); // ahora array
  const [mesComparar, setMesComparar] = useState([]); // ahora array
  const [tituloGrafico, setTituloGrafico] = useState(
    "Gráfico Comparativo $/L OH"
  );
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
  //check apra mostrar en la grafica los valores de produccion
  const [mostrarProduccion, setMostrarProduccion] = useState(false);

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

    setProduccionActual(value.produccionActual);
    setProduccionAnterior(value.produccionAnterior);

    // 👇 ajustar a arrays si es string
    setMesDeCierre(
      Array.isArray(value.mesDeCierre) ? value.mesDeCierre : [value.mesDeCierre]
    );
    setMesComparar(
      Array.isArray(value.mesComparar) ? value.mesComparar : [value.mesComparar]
    );

    setTituloGrafico(value.tituloGrafico);
    setSerieActual(value.serieActual);
    setSerieAnterior(value.serieAnterior);

    setConsumoCaldera(value.consumoCaldera);
    setConsumoAguas(value.consumoAguas);
    setConsumoTorre(value.consumoTorre);
    setConsumoCalderaComp(value.consumoCalderaComp);
    setConsumoAguasComp(value.consumoAguasComp);
    setConsumoTorreComp(value.consumoTorreComp);
  };

  // Calcular sumatorias meses seleccionados (Actual)
  useEffect(() => {
    if (!mesDeCierre || mesDeCierre.length === 0) return;
    let cal = 0,
      agu = 0,
      tor = 0;
    mesDeCierre.forEach((mes) => {
      const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mes);
      if (mesSeleccionado?.dataMes) {
        const dataMes = mesSeleccionado.dataMes;
        cal += dataMes
          .filter((i) => i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
        agu += dataMes
          .filter((i) => i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
        tor += dataMes
          .filter((i) => i.area.toLowerCase() === "torre de enfriamiento")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
      }
    });
    setConsumoCaldera(cal);
    setConsumoAguas(agu);
    setConsumoTorre(tor);
  }, [mesDeCierre, consumo]);

  // Calcular sumatorias meses seleccionados (Comparar)
  useEffect(() => {
    if (!mesComparar || mesComparar.length === 0) return;
    let cal = 0,
      agu = 0,
      tor = 0;
    mesComparar.forEach((mes) => {
      const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mes);
      if (mesSeleccionado?.dataMes) {
        const dataMes = mesSeleccionado.dataMes;
        cal += dataMes
          .filter((i) => i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
        agu += dataMes
          .filter((i) => i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
        tor += dataMes
          .filter((i) => i.area.toLowerCase() === "torre de enfriamiento")
          .reduce((a, i) => a + (i.GastoMensual || 0), 0);
      }
    });
    setConsumoCalderaComp(cal);
    setConsumoAguasComp(agu);
    setConsumoTorreComp(tor);
  }, [mesComparar, consumo]);

  // Guardar datos
  const handleGuardar = async () => {
    try {
      const hoy = new Date();
      const fechaRegistro = hoy.toLocaleDateString("sv-SE", {
        timeZone: "America/Bogota",
      });
      await axios.post(
        "https://ambiocomserver.onrender.com/api/graficainsumosoh/guardarprecioporoh",
        {
          produccionActual,
          produccionAnterior,
          mesDeCierre,
          mesComparar,
          tituloGrafico,
          serieActual,
          serieAnterior,
          fechaRegistro,
          consumoCaldera,
          consumoAguas,
          consumoTorre,
          consumoCalderaComp,
          consumoAguasComp,
          consumoTorreComp,
        }
      );
      setSnackbarMsg("✅ Datos guardados correctamente");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMsg("❌ Error al guardar los datos");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // Descargar como Imagen
  const handleDownloadImage = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 3 });
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
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 20, pageWidth, pdfHeight);
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
                {/* 👉 Mes Comparar con check */}
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    multiple
                    options={consumo.map((c) => c.MesDeCierre)}
                    disableCloseOnSelect
                    value={mesComparar}
                    onChange={(e, val) => setMesComparar(val)}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Mes anterior o a Comparar"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                {/* 👉 Mes Actual con check */}
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    multiple
                    options={consumo.map((c) => c.MesDeCierre)}
                    disableCloseOnSelect
                    value={mesDeCierre}
                    onChange={(e, val) => setMesDeCierre(val)}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Mes de Actual o Cierre"
                        fullWidth
                      />
                    )}
                  />
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
                    Consumos Mes Anterior Comparar
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography>
                    <Whatshot color="error" /> Caldera: {consumoCalderaComp}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                  <Typography>
                    <Opacity color="primary" /> Aguas: {consumoAguasComp}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                  <Typography>
                    <AcUnit color="info" /> Torre de Enfriamiento:{" "}
                    {consumoTorreComp}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Consumos Mes Actual Seleccionado
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography>
                    <Whatshot color="error" /> Caldera: {consumoCaldera}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                  <Typography>
                    <Opacity color="primary" /> Aguas: {consumoAguas}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                  <Typography>
                    <AcUnit color="info" /> Torre de Enfriamiento:{" "}
                    {consumoTorre}{" "}
                    <strong style={{ color: "green" }}>$COP</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Gráfico */}
      <Card sx={{ p: 2, position: "relative" }}>
        <CardContent>
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
                bgcolor: "rgba(255, 255, 255, 0.6)",
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
                bgcolor: "rgba(255, 255, 255, 0.6)",
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
          {/* Check box   para visualizar produccion */}
          <Box
            sx={{
              position: "absolute",
              top: 25,
              right: "auto",
              left: 50,
              display: "flex",
              gap: 1.5,
              zIndex: 9999, // para que no quede oculto

            }}
          >
          <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mostrarProduccion}
                    onChange={(e) => setMostrarProduccion(e.target.checked)}
                  />
                }
                label="Mostrar datos de producción"
              />
            </Grid>
            </Box>

          <Box ref={chartRef} sx={{ width: "100%", bgcolor: "white", p: 2 }}>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }}
            >
              {tituloGrafico}
            </Typography>
            {/* Mostrar Producción si está activo */}
            {mostrarProduccion && (
              <Typography
                align="center"
                variant="subtitle1"
                gutterBottom
                sx={{ color: "gray", fontWeight: 500 }}
              >
                Producción Anterior:{" "} {Number(produccionAnterior).toLocaleString()} L 
                |
                Producción Actual: {Number(produccionActual).toLocaleString()} L
              </Typography>
            )}
            <Divider sx={{ mb: 2 }} />
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
                  <YAxis
                    tickFormatter={(value) => `${Number(value).toFixed(2)} $`}
                  >
                    <Label
                      value="Consumo $ de Insumo por Litro de OH"
                      angle={-90}
                      offset={75}
                      position="insideLeft"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(value) => `${Number(value).toPrecision(2)} $`}
                    labelFormatter={(label) => `Área: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: -18,
                      marginLeft: 50,
                    }}
                  />
                  <Bar dataKey={serieActual} fill="#8884d8" name={serieActual}>
                    <LabelList
                      dataKey={serieActual}
                      position="top"
                      dy={-10}
                      formatter={(value) =>
                        value === 0
                          ? "0"
                          : value >= 0.01
                          ? value.toFixed(2)
                          : value.toPrecision(2)
                      }
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
                      formatter={(value) =>
                        value === 0
                          ? "0"
                          : value >= 0.01
                          ? value.toFixed(2)
                          : value.toPrecision(2)
                      }
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
