import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Box,
    TextField,
    Button,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Chip,
    Checkbox,
    FormControlLabel,
    Stack,
    InputLabel,
    FormControl,
    CircularProgress,
    Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";

const API_URL = "https://ambiocomserver.onrender.com/api/taskrequerimentdev";

export default function ListaAcordeon() {
    const [items, setItems] = useState([]);
    const [tipo, setTipo] = useState("Tarea");
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [prioridad, setPrioridad] = useState(3);

    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Filtros
    const [filtroTexto, setFiltroTexto] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroPrioridad, setFiltroPrioridad] = useState("");

    const formatearFechaLocal = (fecha) => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");
        const day = String(fecha.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const obtenerRangoPorDefecto = () => {
        const hoy = new Date();

        const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        return {
            fechaInicio: formatearFechaLocal(fechaInicio),
            fechaFin: formatearFechaLocal(fechaFin),
        };
    };

    const cargarItems = async () => {
        try {
            setLoading(true);
            setError("");

            const { fechaInicio, fechaFin } = obtenerRangoPorDefecto();

            const response = await axios.get(`${API_URL}/por-fecha`, {
                params: {
                    fechaInicio,
                    fechaFin,
                },
            });

            setItems(Array.isArray(response.data?.items) ? response.data.items : []);
        } catch (error) {
            console.error("Error cargando items:", error.response?.data || error.message);

            setError(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible cargar los requerimientos"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarItems();
    }, []);

    const agregarItem = async () => {
        if (!titulo.trim() || !descripcion.trim()) return;

        try {
            setGuardando(true);
            setError("");

            const payload = {
                tipo,
                titulo,
                descripcion,
                prioridad,
                completado: false,
            };

            await axios.post(API_URL, payload);

            setTipo("Tarea");
            setTitulo("");
            setDescripcion("");
            setPrioridad(3);

            await cargarItems();
        } catch (error) {
            console.error("Error creando item:", error.response?.data || error.message);

            setError(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible crear el requerimiento"
            );
        } finally {
            setGuardando(false);
        }
    };

    const toggleCompletado = async (id) => {
        try {
            setError("");

            await axios.patch(`${API_URL}/${id}/toggle`);
            await cargarItems();
        } catch (error) {
            console.error("Error actualizando estado:", error.response?.data || error.message);

            setError(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible actualizar el estado"
            );
        }
    };

    const eliminarItem = async (id) => {
        try {
            setError("");

            await axios.delete(`${API_URL}/${id}`);
            await cargarItems();
        } catch (error) {
            console.error("Error eliminando item:", error.response?.data || error.message);

            setError(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible eliminar el requerimiento"
            );
        }
    };

    const colorTipo = (tipo) => {
        switch (tipo) {
            case "Hallazgo":
                return "warning";
            case "Requerimiento":
                return "info";
            case "Seguridad":
                return "secondary";
            case "Reportado":
                return "error";
            default:
                return "success";
        }
    };

    const formatearFecha = (fechaIso) => {
        if (!fechaIso) return "";

        const fecha = new Date(fechaIso);

        return fecha.toLocaleString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const limpiarFiltros = () => {
        setFiltroTexto("");
        setFiltroTipo("");
        setFiltroEstado("");
        setFiltroPrioridad("");
    };

    const itemsFiltradosYOrdenados = useMemo(() => {
        return [...items]
            .filter((item) => {
                const textoBusqueda = filtroTexto.trim().toLowerCase();

                const matchTexto =
                    textoBusqueda === "" ||
                    item.titulo?.toLowerCase().includes(textoBusqueda) ||
                    item.descripcion?.toLowerCase().includes(textoBusqueda);

                const matchTipo = filtroTipo ? item.tipo === filtroTipo : true;

                const matchEstado =
                    filtroEstado === ""
                        ? true
                        : filtroEstado === "completado"
                            ? item.completado === true
                            : item.completado === false;

                const matchPrioridad = filtroPrioridad !== ""
                    ? item.prioridad === Number(filtroPrioridad)
                    : true;

                return matchTexto && matchTipo && matchEstado && matchPrioridad;
            })
            .sort((a, b) => {
                if (a.completado !== b.completado) {
                    return Number(a.completado) - Number(b.completado);
                }

                if (a.prioridad !== b.prioridad) {
                    return b.prioridad - a.prioridad;
                }

                return new Date(b.creadoEn) - new Date(a.creadoEn);
            });
    }, [items, filtroTexto, filtroTipo, filtroEstado, filtroPrioridad]);

    return (
        <Box
            sx={{
                width: "90%",
                mx: "auto",
                p: 2,
            }}
        >

            <Typography variant="body2" sx={{ mt: 5, mb: 1, color: "text.secondary" }}>
                Mostrando por defecto registros del mes actual y del mes anterior
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Formulario de creación */}
            <Box
                sx={{
                    p: 2,
                    mb: 0.5,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    bgcolor: "#fff",
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
            >
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={tipo}
                        label="Tipo"
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <MenuItem value="Tarea">Tarea</MenuItem>
                        <MenuItem value="Hallazgo">Hallazgo</MenuItem>
                        <MenuItem value="Requerimiento">Requerimiento</MenuItem>
                        <MenuItem value="Seguridad">Seguridad</MenuItem>
                        <MenuItem value="Reportado">Reportado</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    label="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    sx={{ flex: 1, minWidth: 220 }}
                />

                <TextField
                    size="small"
                    label="Descripción detallada"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    sx={{ flex: 2, minWidth: 280 }}
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                        value={prioridad}
                        label="Prioridad"
                        onChange={(e) => setPrioridad(Number(e.target.value))}
                    >
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    onClick={agregarItem}
                    disabled={guardando}
                    sx={{
                        minWidth: 48,
                        height: 40,
                        borderRadius: 2,
                    }}
                >
                    {guardando ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                </Button>

                <Button
                    variant="outlined"
                    onClick={cargarItems}
                    disabled={loading}
                    sx={{ height: 40, borderRadius: 2 }}
                >
                    Recargar
                </Button>
            </Box>

            {/* Filtros */}
            <Box
                sx={{
                    p: 1,
                    mb: 1.5,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    bgcolor: "#fff",
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
            >
                <TextField
                    size="small"
                    label="Buscar por título o descripción"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    sx={{ flex: 1, minWidth: 240 }}
                />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={filtroTipo}
                        label="Tipo"
                        onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Tarea">Tarea</MenuItem>
                        <MenuItem value="Hallazgo">Hallazgo</MenuItem>
                        <MenuItem value="Requerimiento">Requerimiento</MenuItem>
                        <MenuItem value="Seguridad">Seguridad</MenuItem>
                        <MenuItem value="Reportado">Reportado</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={filtroEstado}
                        label="Estado"
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="pendiente">Pendiente</MenuItem>
                        <MenuItem value="completado">Completado</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                        value={filtroPrioridad}
                        label="Prioridad"
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                    >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                        <MenuItem value={5}>5</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    onClick={limpiarFiltros}
                    sx={{ height: 40, borderRadius: 2 }}
                >
                    Limpiar filtros
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Stack spacing={2}>
                    {itemsFiltradosYOrdenados.map((item) => (
                        <Accordion
                            key={item._id}
                            sx={{
                                borderRadius: 3,
                                overflow: "hidden",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                "&:before": { display: "none" },
                                opacity: item.completado ? 0.9 : 1,
                                backgroundColor: item.completado ? "#e8f5e9" : "#fff", // verde suave
                                border: item.completado ? "1px solid #c8e6c9" : "1px solid #e0e0e0",
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        width: "100%",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Chip
                                        label={item.tipo}
                                        color={colorTipo(item.tipo)}
                                        size="small"
                                    />

                                    <Typography
                                        sx={{
                                            fontWeight: 600,
                                            textDecoration: item.completado ? "line-through" : "none",
                                        }}
                                    >
                                        {item.titulo}
                                    </Typography>

                                    <Chip
                                        label={`Prioridad ${item.prioridad}`}
                                        size="small"
                                        sx={{
                                            backgroundColor:
                                                item.prioridad === 5
                                                    ? "#2995d4"
                                                    : item.prioridad === 4
                                                        ? "#53c71d"
                                                        : item.prioridad === 3
                                                            ? "#e8f353"
                                                            : item.prioridad === 2
                                                                ? "#e9630a"
                                                                : item.prioridad === 1
                                                                    ? "#f32121"
                                                                    : "#9e9e9e",
                                            color:
                                                item.prioridad === 4 || item.prioridad === 3
                                                    ? "#383838"
                                                    : "#fff",
                                            fontWeight: 500,
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            ml: "auto",
                                            fontSize: "0.88rem",
                                        }}
                                    >
                                        {formatearFecha(item.creadoEn)}
                                    </Typography>
                                    <Chip
                                        label={item.completado ? "Hecho" : "Pendiente"}
                                        color={item.completado ? "success" : "default"}
                                        size="small"
                                    // sx={{ ml: "auto" }}
                                    />
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails>
                                <Typography sx={{ mb: 2, color: "text.secondary" }}>
                                    {item.descripcion}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{ mb: 2, color: "text.secondary", fontStyle: "italic" }}
                                >
                                    Creado: {formatearFecha(item.creadoEn)}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 2,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={item.completado}
                                                onChange={() => toggleCompletado(item._id)}
                                            />
                                        }
                                        label="Marcar como completado"
                                    />

                                    <Button
                                        color="error"
                                        variant="outlined"
                                        onClick={() => eliminarItem(item._id)}
                                    >
                                        Eliminar
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}

                    {!loading && itemsFiltradosYOrdenados.length === 0 && (
                        <Alert severity="info">
                            No hay requerimientos que coincidan con los filtros actuales.
                        </Alert>
                    )}
                </Stack>
            )}
        </Box>
    );
}