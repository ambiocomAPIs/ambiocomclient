import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton,
    Tooltip
} from "@mui/material";

import {
    Add,
    DeleteOutline,
    Download,
    EditOutlined,
    FilterAlt,
    Search,
} from "@mui/icons-material";

import YouTubeIcon from "@mui/icons-material/YouTube";

import ExcelDownloadButton from "../../utils/Export_Data_General/ExcelDownloadData";
import RegistroModal from "./utils_PTAP/Modal_PTAP/RegistroRegeneracionModal";

const API_URL = "https://ambiocomserver.onrender.com/api/regeneraciones-resinas";

const siNoOptions = ["No", "Si"];

const valorSeguro = (valor, fallback = "-") => valor ?? fallback;

const extraerNumero = (valor) => {
    if (valor === null || valor === undefined || valor === "") return null;

    const numero = Number(
        String(valor)
            .replace(",", ".")
            .replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(numero) ? numero : null;
};

const promedio = (valores) => {
    const validos = valores.filter((valor) => valor !== null);
    if (validos.length === 0) return "-";

    const resultado =
        validos.reduce((acumulado, valor) => acumulado + valor, 0) /
        validos.length;

    return resultado.toFixed(2);
};

const suma = (valores) => {
    const validos = valores.filter((valor) => valor !== null);
    if (validos.length === 0) return "-";

    return validos.reduce((acumulado, valor) => acumulado + valor, 0).toFixed(2);
};

const formInicial = {
    fecha: "",
    responsable: "",
    phCation: "",
    durezaCation: "",
    acidoSulfurico: "",
    phAnion: "",
    conductividad: "",
    consumoSoda: "",
    estadoCation: "No",
    estadoAnion: "No",
    reporteCicoq: "No",
    correoNotificado: "No",
    observaciones: "Ninguna",
    phCarbon: "",
    conductividadCarbon: "",
    durezaCarbon: "",
    siliceCarbon: "",
    tdsCarbon: "",
    alcalinidadCarbon: "",
    siliceAnion: "",
    tdsAnion: "",
    alcalinidadAnion: "",
};

const convertirRegistroAForm = (registro) => ({
    fecha: registro?.fecha ? String(registro.fecha).slice(0, 10) : "",
    responsable: registro?.responsable ?? "",

    phCarbon: registro?.carbonActivado?.ph ?? "",
    conductividadCarbon: registro?.carbonActivado?.conductividad ?? "",
    durezaCarbon: registro?.carbonActivado?.dureza ?? "",
    siliceCarbon: registro?.carbonActivado?.silice ?? "",
    tdsCarbon: registro?.carbonActivado?.tds ?? "",
    alcalinidadCarbon: registro?.carbonActivado?.alcalinidad ?? "",

    phCation: registro?.cation?.ph ?? "",
    durezaCation: registro?.cation?.dureza ?? "",
    acidoSulfurico: registro?.cation?.acidoSulfurico ?? "",

    phAnion: registro?.anion?.ph ?? "",
    conductividad: registro?.anion?.conductividad ?? "",
    siliceAnion: registro?.anion?.silice ?? "",
    tdsAnion: registro?.anion?.tds ?? "",
    alcalinidadAnion: registro?.anion?.alcalinidad ?? "",
    consumoSoda: registro?.anion?.consumoSoda ?? "",

    estadoCation: registro?.estadoCation ?? "No",
    estadoAnion: registro?.estadoAnion ?? "No",
    reporteCicoq: registro?.reporteCicoq ?? "No",
    correoNotificado: registro?.correoNotificado ?? "No",
    observaciones: registro?.observaciones ?? "Ninguna",
});

const construirPayloadDesdeForm = (formulario) => ({
    fecha: formulario.fecha,
    responsable: formulario.responsable,

    carbonActivado: {
        ph: formulario.phCarbon,
        conductividad: formulario.conductividadCarbon,
        dureza: formulario.durezaCarbon,
        silice: formulario.siliceCarbon,
        tds: formulario.tdsCarbon,
        alcalinidad: formulario.alcalinidadCarbon,
    },

    cation: {
        ph: formulario.phCation,
        dureza: formulario.durezaCation,
        acidoSulfurico: formulario.acidoSulfurico,
    },

    anion: {
        ph: formulario.phAnion,
        conductividad: formulario.conductividad,
        silice: formulario.siliceAnion,
        tds: formulario.tdsAnion,
        alcalinidad: formulario.alcalinidadAnion,
        consumoSoda: formulario.consumoSoda,
    },

    estadoCation: formulario.estadoCation,
    estadoAnion: formulario.estadoAnion,
    reporteCicoq: formulario.reporteCicoq,
    correoNotificado: formulario.correoNotificado,
    observaciones: formulario.observaciones,
});

const getChipColor = (valor) => {
    if (valor === "OK" || valor === "Sí" || valor === "Si") return "success";
    if (valor === "Revisar") return "warning";
    if (valor === "No") return "error";
    return "default";
};

const baseHeaderSx = {
    color: "#fff",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
    borderRight: "1px solid rgba(255,255,255,0.25)",
};

const stickyTopHeaderSx = {
    ...baseHeaderSx,
    top: 0,
    zIndex: 4,
};

const stickySubHeaderSx = {
    ...baseHeaderSx,
    top: 38,
    zIndex: 3,
    fontSize: 12,
};

const generalHeaderSx = {
    ...stickyTopHeaderSx,
    bgcolor: "#263238",
};

const carbonHeaderSx = {
    ...stickyTopHeaderSx,
    bgcolor: "#5c15c0",
};

const cationHeaderSx = {
    ...stickyTopHeaderSx,
    bgcolor: "#1565c0",
};

const carbonSubHeaderSx = {
    ...stickySubHeaderSx,
    bgcolor: "#8b1ee5",
};

const cationSubHeaderSx = {
    ...stickySubHeaderSx,
    bgcolor: "#1e88e5",
};

const anionHeaderSx = {
    ...stickyTopHeaderSx,
    bgcolor: "#00897b",
};

const anionSubHeaderSx = {
    ...stickySubHeaderSx,
    bgcolor: "#26a69a",
};

const seguimientoHeaderSx = {
    ...stickyTopHeaderSx,
    bgcolor: "#6a1b9a",
};

export default function RegeneracionesTrenTabla() {
    const [registros, setRegistros] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [form, setForm] = useState(formInicial);
    const [filtrosFecha, setFiltrosFecha] = useState({
        fechaDesde: "",
        fechaHasta: "",
    });
    const [buscando, setBuscando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [registroEditandoId, setRegistroEditandoId] = useState(null);
    const [registroAEliminar, setRegistroAEliminar] = useState(null);
    const [notificacion, setNotificacion] = useState({
        open: false,
        severity: "success",
        message: "",
    });

    const cargarRegistros = async (params = {}) => {
        try {
            setBuscando(true);

            const query = new URLSearchParams();

            if (params.fechaDesde) query.append("fechaDesde", params.fechaDesde);
            if (params.fechaHasta) query.append("fechaHasta", params.fechaHasta);

            const url = query.toString() ? `${API_URL}?${query.toString()}` : API_URL;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Error consultando regeneraciones");
            }

            const result = await response.json();

            setRegistros(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error cargando regeneraciones:", error);
            setRegistros([]);
        } finally {
            setBuscando(false);
        }
    };

    useEffect(() => {
        cargarRegistros();
    }, []);

    const registrosFiltrados = useMemo(() => registros, [registros]);

    const registrosPorFecha = useMemo(() => registrosFiltrados, [registrosFiltrados]);

    const resumen = useMemo(() => {
        return {
            // 🔵 CARBON
            promedioPhCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.ph))
            ),
            promedioConductividadCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.conductividad))
            ),
            promedioDurezaCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.dureza))
            ),
            promedioSiliceCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.silice))
            ),
            promedioTdsCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.tds))
            ),
            promedioAlcalinidadCarbon: promedio(
                registrosPorFecha.map(r => extraerNumero(r.carbonActivado?.alcalinidad))
            ),

            // 🔵 CATION
            promedioPhCation: promedio(
                registrosPorFecha.map(r => extraerNumero(r.cation?.ph))
            ),
            promedioDurezaCation: promedio(
                registrosPorFecha.map(r => extraerNumero(r.cation?.dureza))
            ),
            totalAcidoSulfurico: suma(
                registrosPorFecha.map(r => extraerNumero(r.cation?.acidoSulfurico))
            ),

            // 🔵 ANION
            promedioPhAnion: promedio(
                registrosPorFecha.map(r => extraerNumero(r.anion?.ph))
            ),
            promedioConductividad: promedio(
                registrosPorFecha.map(r => extraerNumero(r.anion?.conductividad))
            ),
            promedioSiliceAnion: promedio(
                registrosPorFecha.map(r => extraerNumero(r.anion?.silice))
            ),
            promedioTdsAnion: promedio(
                registrosPorFecha.map(r => extraerNumero(r.anion?.tds))
            ),
            promedioAlcalinidadAnion: promedio(
                registrosPorFecha.map(r => extraerNumero(r.anion?.alcalinidad))
            ),
            totalSoda: suma(
                registrosPorFecha.map(r => extraerNumero(r.anion?.consumoSoda))
            ),
        };
    }, [registrosPorFecha]);

    const handleFiltroFechaChange = (campo, valor) => {
        setFiltrosFecha((prev) => ({ ...prev, [campo]: valor }));
    };

    const ejecutarBusquedaPorFecha = async () => {
        await cargarRegistros({
            fechaDesde: filtrosFecha.fechaDesde,
            fechaHasta: filtrosFecha.fechaHasta,
        });
    };

    const mostrarNotificacion = (message, severity = "success") => {
        setNotificacion({
            open: true,
            severity,
            message,
        });
    };

    const cerrarNotificacion = (_, reason) => {
        if (reason === "clickaway") return;

        setNotificacion((prev) => ({
            ...prev,
            open: false,
        }));
    };

    const abrirModal = () => {
        setRegistroEditandoId(null);
        setForm({ ...formInicial });
        setOpenModal(true);
    };

    const abrirModalEditar = (registro) => {
        const id = registro?._id || registro?.id;

        if (!id) {
            mostrarNotificacion(
                "No fue posible identificar el registro seleccionado.",
                "error"
            );
            return;
        }

        setRegistroEditandoId(id);
        setForm(convertirRegistroAForm(registro));
        setOpenModal(true);
    };

    const cerrarModal = () => {
        if (guardando) return;

        setOpenModal(false);
        setRegistroEditandoId(null);
        setForm({ ...formInicial });
    };

    const recargarRangoActual = async () => {
        await cargarRegistros({
            fechaDesde: filtrosFecha.fechaDesde,
            fechaHasta: filtrosFecha.fechaHasta,
        });
    };

    const guardarRegistro = async () => {
        if (guardando) return;

        if (!form.fecha || !form.responsable?.trim()) {
            mostrarNotificacion(
                "La fecha y el responsable son obligatorios.",
                "warning"
            );
            return;
        }

        try {
            setGuardando(true);

            const esEdicion = Boolean(registroEditandoId);
            const url = esEdicion
                ? `${API_URL}/${registroEditandoId}`
                : API_URL;

            const response = await fetch(url, {
                method: esEdicion ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(construirPayloadDesdeForm(form)),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    (esEdicion
                        ? "Error actualizando la regeneración."
                        : "Error creando la regeneración.")
                );
            }

            setOpenModal(false);
            setRegistroEditandoId(null);
            setForm({ ...formInicial });

            await recargarRangoActual();

            mostrarNotificacion(
                esEdicion
                    ? "Registro actualizado correctamente."
                    : "Registro creado correctamente.",
                "success"
            );
        } catch (error) {
            console.error("Error guardando regeneración:", error);
            mostrarNotificacion(
                error.message || "No fue posible guardar el registro.",
                "error"
            );
        } finally {
            setGuardando(false);
        }
    };

    const solicitarEliminarRegistro = (registro) => {
        setRegistroAEliminar(registro);
    };

    const cerrarConfirmacionEliminar = () => {
        if (eliminando) return;
        setRegistroAEliminar(null);
    };

    const confirmarEliminarRegistro = async () => {
        const id = registroAEliminar?._id || registroAEliminar?.id;

        if (!id) {
            mostrarNotificacion(
                "No fue posible identificar el registro a eliminar.",
                "error"
            );
            setRegistroAEliminar(null);
            return;
        }

        try {
            setEliminando(true);

            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message || "Error eliminando la regeneración."
                );
            }

            setRegistroAEliminar(null);
            await recargarRangoActual();

            mostrarNotificacion(
                "Registro eliminado correctamente.",
                "success"
            );
        } catch (error) {
            console.error("Error eliminando regeneración:", error);
            mostrarNotificacion(
                error.message || "No fue posible eliminar el registro.",
                "error"
            );
        } finally {
            setEliminando(false);
        }
    };

    const totalRegistros = registrosPorFecha.length;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, mt: 5 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    mb: 2,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={1.2}
                >
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight={800}>
                            Tren desmineralizador
                        </Typography>
                        <Typography variant="h5" fontWeight={800}>
                            Registro, seguimiento y control de regeneraciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Control operativo de parámetros, consumos, reportes y notificaciones.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <IconButton color="error">
                            <Tooltip title="Como Funciona ?">
                                <YouTubeIcon />
                            </Tooltip>
                        </IconButton>

                        <ExcelDownloadButton
                            data={registrosPorFecha}
                            filename="regeneraciones-tren-desmineralizador.xlsx"
                            sheetName="Regeneraciones"
                            buttonText="Exportar Excel"
                            variant="outlined"
                            color="success"
                            startIcon={<Download />}
                            disabled={registrosPorFecha.length === 0}
                        />

                        <Button variant="contained" startIcon={<Add />} onClick={abrirModal}>
                            Nuevo registro
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    px: 2,
                    py: 1.5,
                    mb: 2,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                    spacing={1.5}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <FilterAlt color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={800}>
                            Buscar por fecha
                        </Typography>
                        <Chip size="small" label={`${totalRegistros} registros`} />
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        <TextField
                            size="small"
                            type="date"
                            label="Desde"
                            InputLabelProps={{ shrink: true }}
                            value={filtrosFecha.fechaDesde}
                            onChange={(e) =>
                                handleFiltroFechaChange("fechaDesde", e.target.value)
                            }
                            sx={{ width: { xs: "100%", sm: 170 } }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="Hasta"
                            InputLabelProps={{ shrink: true }}
                            value={filtrosFecha.fechaHasta}
                            onChange={(e) =>
                                handleFiltroFechaChange("fechaHasta", e.target.value)
                            }
                            sx={{ width: { xs: "100%", sm: 170 } }}
                        />

                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={ejecutarBusquedaPorFecha}
                            disabled={buscando}
                            sx={{ height: 40, minWidth: 130 }}
                        >
                            {buscando ? "Buscando..." : "Ejecutar"}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                    borderRadius: 4,
                    maxHeight: 620,
                    overflow: "auto",
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Table stickyHeader size="small" sx={{ minWidth: 1600 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell rowSpan={2} align="center" sx={{ ...generalHeaderSx, minWidth: 110 }}>
                                Fecha
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ ...generalHeaderSx, minWidth: 170 }}>
                                Responsable
                            </TableCell>

                            <TableCell colSpan={6} align="center" sx={carbonHeaderSx}>
                                Tren Carbón Activado
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={cationHeaderSx}>
                                Tren Catiónico
                            </TableCell>

                            <TableCell colSpan={6} align="center" sx={anionHeaderSx}>
                                Tren Aniónico
                            </TableCell>

                            <TableCell rowSpan={3} align="center" sx={{ ...seguimientoHeaderSx, minWidth: 110 }}>
                                Catión
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ ...seguimientoHeaderSx, minWidth: 110 }}>
                                Anión
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ ...seguimientoHeaderSx, minWidth: 140 }}>
                                Reporte CICOQ
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ ...seguimientoHeaderSx, minWidth: 160 }}>
                                Correo notificado
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ ...seguimientoHeaderSx, minWidth: 260 }}>
                                Observaciones
                            </TableCell>

                            <TableCell
                                rowSpan={2}
                                align="center"
                                sx={{ ...generalHeaderSx, minWidth: 115 }}
                            >
                                Acciones
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 110 }}>
                                pH Carbón
                            </TableCell>

                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 110 }}>
                                Conductividad
                            </TableCell>

                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 140 }}>
                                Dureza Carbón
                            </TableCell>

                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 180 }}>
                                Sílice Carbón
                            </TableCell>

                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 180 }}>
                                TDS
                            </TableCell>

                            <TableCell align="center" sx={{ ...carbonSubHeaderSx, minWidth: 180 }}>
                                Alcalinidad
                            </TableCell>

                            {/* cation */}

                            <TableCell align="center" sx={{ ...cationSubHeaderSx, minWidth: 110 }}>
                                pH catión
                            </TableCell>

                            <TableCell align="center" sx={{ ...cationSubHeaderSx, minWidth: 140 }}>
                                Dureza catión
                            </TableCell>

                            <TableCell align="center" sx={{ ...cationSubHeaderSx, minWidth: 180 }}>
                                Ácido sulfúrico
                            </TableCell>

                            {/* anion */}

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 110 }}>
                                pH anión
                            </TableCell>

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 150 }}>
                                Conductividad
                            </TableCell>

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 150 }}>
                                Silice
                            </TableCell>

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 150 }}>
                                TDS
                            </TableCell>

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 150 }}>
                                Alcalinidad
                            </TableCell>

                            <TableCell align="center" sx={{ ...anionSubHeaderSx, minWidth: 150 }}>
                                Consumo de soda
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {registrosPorFecha.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={23} align="center" sx={{ py: 6 }}>
                                    <Typography fontWeight={700}>
                                        No hay registros para mostrar
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Ajusta los filtros o crea un nuevo registro.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrosPorFecha.map((registro) => (
                                <TableRow
                                    key={registro._id || registro.id}
                                    hover
                                    sx={{
                                        "&:nth-of-type(even)": {
                                            bgcolor: "grey.50",
                                        },
                                        "&:hover": {
                                            bgcolor: "primary.50",
                                        },
                                    }}
                                >
                                    <TableCell>{valorSeguro(registro.fecha)}</TableCell>
                                    <TableCell>{valorSeguro(registro.responsable)}</TableCell>

                                    {/* Tren Carbón Activado */}
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.ph)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.conductividad)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.dureza)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.silice)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.tds)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.carbonActivado?.alcalinidad)}
                                    </TableCell>

                                    {/* Tren Catiónico */}
                                    <TableCell align="center">
                                        {valorSeguro(registro.cation?.ph)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.cation?.dureza)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.cation?.acidoSulfurico)}
                                    </TableCell>

                                    {/* Tren Aniónico */}
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.ph)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.conductividad)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.silice)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.tds)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.alcalinidad)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {valorSeguro(registro.anion?.consumoSoda)}
                                    </TableCell>
                                    {/* ESTADOS */}
                                    <TableCell align="center">
                                        <Chip
                                            size="small"
                                            label={valorSeguro(registro.estadoCation)}
                                            color={getChipColor(registro.estadoCation)}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            size="small"
                                            label={valorSeguro(registro.estadoAnion)}
                                            color={getChipColor(registro.estadoAnion)}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            size="small"
                                            label={valorSeguro(registro.reporteCicoq)}
                                            color={getChipColor(registro.reporteCicoq)}
                                            variant={registro.reporteCicoq === "No" ? "outlined" : "filled"}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            size="small"
                                            label={valorSeguro(registro.correoNotificado)}
                                            color={getChipColor(registro.correoNotificado)}
                                            variant={registro.correoNotificado === "No" ? "outlined" : "filled"}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        {valorSeguro(registro.observaciones)}
                                    </TableCell>

                                    <TableCell align="center">
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            <Tooltip title="Editar registro" arrow>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => abrirModalEditar(registro)}
                                                    disabled={guardando || eliminando}
                                                    aria-label={`Editar registro del ${valorSeguro(registro.fecha)}`}
                                                >
                                                    <EditOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Eliminar registro" arrow>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => solicitarEliminarRegistro(registro)}
                                                    disabled={guardando || eliminando}
                                                    aria-label={`Eliminar registro del ${valorSeguro(registro.fecha)}`}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} align="center">
                                <strong>RESUMEN</strong>
                            </TableCell>

                            {/* 🔵 CARBON */}
                            <TableCell align="center">Prom: {resumen.promedioPhCarbon}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioConductividadCarbon}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioDurezaCarbon}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioSiliceCarbon}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioTdsCarbon}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioAlcalinidadCarbon}</TableCell>

                            {/* 🔵 CATION */}
                            <TableCell align="center">Prom: {resumen.promedioPhCation}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioDurezaCation}</TableCell>
                            <TableCell align="center">Total: {resumen.totalAcidoSulfurico} Kg</TableCell>

                            {/* 🔵 ANION */}
                            <TableCell align="center">Prom: {resumen.promedioPhAnion}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioConductividad}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioSiliceAnion}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioTdsAnion}</TableCell>
                            <TableCell align="center">Prom: {resumen.promedioAlcalinidadAnion}</TableCell>
                            <TableCell align="center">Total: {resumen.totalSoda} Kg</TableCell>

                            {/* 🔵 SEGUIMIENTO */}
                            <TableCell colSpan={6} align="center">
                                Cálculo basado en los registros filtrados
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            <RegistroModal
                open={openModal}
                onClose={cerrarModal}
                onSave={guardarRegistro}
                form={form}
                setForm={setForm}
                estadoOptions={siNoOptions}
                siNoOptions={siNoOptions}
            />

            <Dialog
                open={Boolean(registroAEliminar)}
                onClose={cerrarConfirmacionEliminar}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Eliminar registro
                </DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        ¿Seguro que deseas eliminar el registro del{" "}
                        <strong>
                            {valorSeguro(registroAEliminar?.fecha)}
                        </strong>
                        {" "}correspondiente a{" "}
                        <strong>
                            {valorSeguro(registroAEliminar?.responsable)}
                        </strong>
                        ? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={cerrarConfirmacionEliminar}
                        disabled={eliminando}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmarEliminarRegistro}
                        disabled={eliminando}
                        startIcon={
                            eliminando
                                ? <CircularProgress size={18} color="inherit" />
                                : <DeleteOutline />
                        }
                    >
                        {eliminando ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notificacion.open}
                autoHideDuration={4000}
                onClose={cerrarNotificacion}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={cerrarNotificacion}
                    severity={notificacion.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {notificacion.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}