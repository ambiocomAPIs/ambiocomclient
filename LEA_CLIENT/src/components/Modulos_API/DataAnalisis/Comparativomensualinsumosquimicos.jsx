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
  Checkbox,
  ListItemText,
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
import { Download, PictureAsPdf } from "@mui/icons-material";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Comparativomensualinsumosquimicos = () => {
  const chartRef = useRef(null);

  const [produccionActual, setProduccionActual] = useState("");
  const [produccionAnterior, setProduccionAnterior] = useState("");
  // ahora arrays para poder seleccionar uno o varios meses
  const [mesDeCierre, setMesDeCierre] = useState([]);
  const [mesComparar, setMesComparar] = useState([]);
  const [tituloGrafico, setTituloGrafico] = useState(
    "Gráfico Comparativo Kg/L OH"
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
        setConsumo(res.data || []);
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
          "https://ambiocomserver.onrender.com/api/graficainsumosoh/listarkilosporoh"
        );
        setGraficasGuardadas(res.data || []);
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

    // mantener compatibilidad si value.mesDeCierre/mesComparar vienen como string o array
    setProduccionActual(value.produccionActual);
    setProduccionAnterior(value.produccionAnterior);
    setMesDeCierre(
      Array.isArray(value.mesDeCierre)
        ? value.mesDeCierre
        : value.mesDeCierre
        ? [value.mesDeCierre]
        : []
    );
    setMesComparar(
      Array.isArray(value.mesComparar)
        ? value.mesComparar
        : value.mesComparar
        ? [value.mesComparar]
        : []
    );
    setTituloGrafico(value.tituloGrafico);
    setSerieActual(value.serieActual);
    setSerieAnterior(value.serieAnterior);

    // Cargar consumos (si vienen guardados)
    setConsumoCaldera(value.consumoCaldera ?? 0);
    setConsumoAguas(value.consumoAguas ?? 0);
    setConsumoTorre(value.consumoTorre ?? 0);
    setConsumoCalderaComp(value.consumoCalderaComp ?? 0);
    setConsumoAguasComp(value.consumoAguasComp ?? 0);
    setConsumoTorreComp(value.consumoTorreComp ?? 0);
  };

  // Calcular sumatorias meses seleccionados (Mes de Cierre) — acumula todos los meses seleccionados por área
  useEffect(() => {
    // si no hay selección, reset a 0
    if (
      !mesDeCierre ||
      (Array.isArray(mesDeCierre) && mesDeCierre.length === 0)
    ) {
      setConsumoCaldera(0);
      setConsumoAguas(0);
      setConsumoTorre(0);
      return;
    }

    const meses = Array.isArray(mesDeCierre) ? mesDeCierre : [mesDeCierre];

    let totalCaldera = 0;
    let totalAguas = 0;
    let totalTorre = 0;

    meses.forEach((mes) => {
      const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mes);
      if (mesSeleccionado?.dataMes) {
        const dataMes = mesSeleccionado.dataMes;
        totalCaldera += dataMes
          .filter((i) => i.area && i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
        totalAguas += dataMes
          .filter((i) => i.area && i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
        totalTorre += dataMes
          .filter(
            (i) => i.area && i.area.toLowerCase() === "torre de enfriamiento"
          )
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
      }
    });

    setConsumoCaldera(totalCaldera);
    setConsumoAguas(totalAguas);
    setConsumoTorre(totalTorre);
  }, [mesDeCierre, consumo]);

  // Calcular sumatorias meses seleccionados (Mes Comparar) — acumula todos los meses seleccionados por área
  useEffect(() => {
    if (
      !mesComparar ||
      (Array.isArray(mesComparar) && mesComparar.length === 0)
    ) {
      setConsumoCalderaComp(0);
      setConsumoAguasComp(0);
      setConsumoTorreComp(0);
      return;
    }

    const meses = Array.isArray(mesComparar) ? mesComparar : [mesComparar];

    let totalCaldera = 0;
    let totalAguas = 0;
    let totalTorre = 0;

    meses.forEach((mes) => {
      const mesSeleccionado = consumo.find((c) => c.MesDeCierre === mes);
      if (mesSeleccionado?.dataMes) {
        const dataMes = mesSeleccionado.dataMes;
        totalCaldera += dataMes
          .filter((i) => i.area && i.area.toLowerCase() === "caldera")
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
        totalAguas += dataMes
          .filter((i) => i.area && i.area.toLowerCase() === "aguas")
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
        totalTorre += dataMes
          .filter(
            (i) => i.area && i.area.toLowerCase() === "torre de enfriamiento"
          )
          .reduce((a, i) => a + (i.ConsumoMensual || 0), 0);
      }
    });

    setConsumoCalderaComp(totalCaldera);
    setConsumoAguasComp(totalAguas);
    setConsumoTorreComp(totalTorre);
  }, [mesComparar, consumo]);

  // Guardar datos
  const handleGuardar = async () => {
    try {
      const hoy = new Date();
      const fechaRegistro = hoy.toLocaleDateString("sv-SE", {
        timeZone: "America/Bogota",
      });
      // 👇 Aquí mandamos los datos al backend con axios
      await axios.post(
        "https://ambiocomserver.onrender.com/api/graficainsumosoh/guardarkilosporoh",
        {
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
        }
      );

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
        Comparativo Mensual de Insumos Químicos Kg/L
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
                    type="Number"
                    value={produccionAnterior}
                    onChange={(e) => setProduccionAnterior(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Producción Actual"
                    type="Number"
                    value={produccionActual}
                    onChange={(e) => setProduccionActual(e.target.value)}
                    fullWidth
                  />
                </Grid>

                {/* Mes Comparar - multi select con checkboxes */}
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        Array.isArray(selected)
                          ? selected.join(", ")
                          : selected,
                    }}
                    label="Mes anterior o a Comparar"
                    value={mesComparar}
                    onChange={(e) => setMesComparar(e.target.value)}
                    fullWidth
                  >
                    {consumo.map((c) => (
                      <MenuItem key={c._id} value={c.MesDeCierre}>
                        <Checkbox
                          checked={mesComparar.indexOf(c.MesDeCierre) > -1}
                        />
                        <ListItemText primary={c.MesDeCierre} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Mes Actual - multi select con checkboxes */}
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        Array.isArray(selected)
                          ? selected.join(", ")
                          : selected,
                    }}
                    label="Mes de Actual  o cierre"
                    value={mesDeCierre}
                    onChange={(e) => setMesDeCierre(e.target.value)}
                    fullWidth
                  >
                    {consumo.map((c) => (
                      <MenuItem key={c._id} value={c.MesDeCierre}>
                        <Checkbox
                          checked={mesDeCierre.indexOf(c.MesDeCierre) > -1}
                        />
                        <ListItemText primary={c.MesDeCierre} />
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
                    Consumos Mes(es) Anteriores (Acumulado)
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <Whatshot color="error" /> Caldera: {consumoCalderaComp}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <Opacity color="primary" /> Aguas: {consumoAguasComp}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <AcUnit color="info" /> Torre de Enfriamiento:{" "}
                        {consumoTorreComp}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
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
                    Consumos Mes(es) Actual Seleccionados
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <Whatshot color="error" /> Caldera: {consumoCaldera}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <Opacity color="primary" /> Aguas: {consumoAguas}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <AcUnit color="info" /> Torre de Enfriamiento:{" "}
                        {consumoTorre}{" "}
                        <strong style={{ color: "green" }}>Kg</strong>
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
          {/* 👉 Botones flotantes */}
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

          {/* 👉 Contenido exportable */}
          <Box ref={chartRef} sx={{ width: "100%", bgcolor: "white", p: 2 }}>
            {/* ✅ Título centrado */}
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "'Roboto Slab', serif",
                fontWeight: 600,
              }}
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
                Producción Anterior:{" "}
                {Number(produccionAnterior).toLocaleString()} L | Producción
                Actual: {Number(produccionActual).toLocaleString()} L
              </Typography>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* 📊 Gráfico (mismo cálculo de siempre: consumo / producción si existe) */}
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
                    tickFormatter={(value) => `${Number(value).toFixed(6)} Kg`}
                  >
                    <Label
                      value="Consumo Kg de Insumo por Litro de OH"
                      angle={-90}
                      offset={75}
                      position="insideLeft"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(value) => `${Number(value).toPrecision(6)} Kg`}
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
                    formatter={(value) => (
                      <span style={{ margin: "0 40px" }}>{value}</span>
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

export default Comparativomensualinsumosquimicos;
