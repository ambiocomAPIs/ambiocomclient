import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ExcelDownloadButton from "../../../../utils/Export_Data_General/ExcelDownloadData";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    InputAdornment,
    Chip,
    Stack,
    MenuItem,
    IconButton,
    Button
} from "@mui/material";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const API_URL = "https://ambiocomserver.onrender.com/api/programaciondespacho";

const useDebouncedValue = (value, delay = 250) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
};

const normalizeText = (v) =>
    String(v ?? "")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const formatNumber = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return "0";
    return x.toLocaleString("es-CO");
};

const getApiErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Ocurrió un error inesperado."
    );
};

const ProgramacionDespachoReadOnlyPage = () => {
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 250);

    const [filters, setFilters] = useState({
        fecha: "",
        cliente: "",
        producto: "",
        transportadora: "",
        destino: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchProgramacion = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const res = await axios.get(API_URL);
            const list = Array.isArray(res.data) ? res.data : [];
            setRows(list);
        } catch (error) {
            console.error("Error al obtener programaciones:", error);
            setRows([]);
            setErrorMsg(getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgramacion();
    }, []);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            fecha: "",
            cliente: "",
            producto: "",
            transportadora: "",
            destino: "",
        });
        setSearch("");
    };

    const options = useMemo(() => {
        const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();

        return {
            fechas: uniq(rows.map((r) => normalizeText(r.fecha))),
            clientes: uniq(rows.map((r) => normalizeText(r.cliente))),
            productos: uniq(rows.map((r) => normalizeText(r.producto))),
            transportadoras: uniq(rows.map((r) => normalizeText(r.transportadora))),
            destinos: uniq(rows.map((r) => normalizeText(r.destino))),
        };
    }, [rows]);

    const rowsFiltrados = useMemo(() => {
        let out = [...rows];

        if (filters.fecha) {
            out = out.filter((r) => normalizeText(r.fecha) === normalizeText(filters.fecha));
        }

        if (filters.cliente) {
            out = out.filter((r) => normalizeText(r.cliente) === normalizeText(filters.cliente));
        }

        if (filters.producto) {
            out = out.filter((r) => normalizeText(r.producto) === normalizeText(filters.producto));
        }

        if (filters.transportadora) {
            out = out.filter(
                (r) => normalizeText(r.transportadora) === normalizeText(filters.transportadora)
            );
        }

        if (filters.destino) {
            out = out.filter((r) => normalizeText(r.destino) === normalizeText(filters.destino));
        }

        const q = normalizeText(debouncedSearch).toLowerCase();

        if (q) {
            out = out.filter((r) => {
                return [
                    r.fecha,
                    r.placa,
                    r.trailer,
                    r.conductor,
                    r.transportadora,
                    r.cliente,
                    r.destino,
                    r.producto,
                    r.cantidad,
                ]
                    .map((v) => normalizeText(v).toLowerCase())
                    .some((v) => v.includes(q));
            });
        }

        out.sort((a, b) => normalizeText(b.fecha).localeCompare(normalizeText(a.fecha)));

        return out;
    }, [rows, filters, debouncedSearch]);

    const total = rows.length;
    const filtrados = rowsFiltrados.length;

    return (
        <Box p={{ xs: 2, md: 4 }} mt={5}>
            <Card elevation={4} sx={{ borderRadius: 3 }}>
                <CardContent>
                    <Box
                        display="flex"
                        flexDirection={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", md: "center" }}
                        gap={2}
                    >
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Consulta programación de despachos Read Only
                            </Typography>

                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                <Chip size="small" label={`Total registros: ${total}`} />
                                <Chip size="small" color="primary" label={`Filtrados: ${filtrados}`} />
                                {loading && <Chip size="small" color="warning" label="Cargando..." />}
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexWrap: "wrap",
                            }}
                        >
                            <TextField
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                size="small"
                                sx={{ minWidth: { xs: "100%", md: 350 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: search ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearch("")}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 2,
                            mb: 3,
                            flexWrap: "wrap",
                        }}
                    >
                        {/* IZQUIERDA: FILTROS */}
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                flexWrap: "wrap",
                                alignItems: "center",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <TextField
                                select
                                size="small"
                                label="Fecha"
                                name="fecha"
                                value={filters.fecha}
                                onChange={handleFilterChange}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="">(Todas)</MenuItem>
                                {options.fechas.map((f) => (
                                    <MenuItem key={f} value={f}>
                                        {f}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Cliente"
                                name="cliente"
                                value={filters.cliente}
                                onChange={handleFilterChange}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="">(Todos)</MenuItem>
                                {options.clientes.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Producto"
                                name="producto"
                                value={filters.producto}
                                onChange={handleFilterChange}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="">(Todos)</MenuItem>
                                {options.productos.map((p) => (
                                    <MenuItem key={p} value={p}>
                                        {p}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Transportadora"
                                name="transportadora"
                                value={filters.transportadora}
                                onChange={handleFilterChange}
                                sx={{ width: 180 }}
                            >
                                <MenuItem value="">(Todas)</MenuItem>
                                {options.transportadoras.map((t) => (
                                    <MenuItem key={t} value={t}>
                                        {t}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                size="small"
                                label="Destino"
                                name="destino"
                                value={filters.destino}
                                onChange={handleFilterChange}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="">(Todos)</MenuItem>
                                {options.destinos.map((d) => (
                                    <MenuItem key={d} value={d}>
                                        {d}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {/* DERECHA: BOTONES */}
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexShrink: 0,
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={clearFilters}
                                sx={{
                                    minWidth: 40,
                                    width: 40,
                                    height: 40,
                                    p: 0,
                                }}
                            >
                                <CleaningServicesIcon />
                            </Button>

                            <ExcelDownloadButton
                                data={rowsFiltrados}
                                filename="programacion_despacho.xlsx"
                                sheetName="Programacion"
                                variant="contained"
                                buttonText="Exportar Excel"
                            />
                        </Box>
                    </Box>

                    {errorMsg && (
                        <Box mb={2}>
                            <Typography color="error" variant="body2">
                                {errorMsg}
                            </Typography>
                        </Box>
                    )}

                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell><strong>Placa</strong></TableCell>
                                    <TableCell><strong>Trailer</strong></TableCell>
                                    <TableCell><strong>Conductor</strong></TableCell>
                                    <TableCell><strong>Transportadora</strong></TableCell>
                                    <TableCell><strong>Cliente</strong></TableCell>
                                    <TableCell><strong>Destino</strong></TableCell>
                                    <TableCell><strong>Producto</strong></TableCell>
                                    <TableCell align="right"><strong>Cantidad</strong></TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {rowsFiltrados.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                            <Typography fontWeight="bold">No hay resultados</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Intenta cambiar los filtros o la búsqueda.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rowsFiltrados.map((r) => (
                                        <TableRow key={r._id || `${r.fecha}-${r.placa}-${r.cliente}`} hover>
                                            <TableCell>{normalizeText(r.fecha)}</TableCell>
                                            <TableCell>{normalizeText(r.placa)}</TableCell>
                                            <TableCell>{normalizeText(r.trailer)}</TableCell>
                                            <TableCell>{normalizeText(r.conductor)}</TableCell>
                                            <TableCell>{normalizeText(r.transportadora)}</TableCell>
                                            <TableCell>{normalizeText(r.cliente)}</TableCell>
                                            <TableCell>{normalizeText(r.destino)}</TableCell>
                                            <TableCell>{normalizeText(r.producto)}</TableCell>
                                            <TableCell align="right">{formatNumber(r.cantidad)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProgramacionDespachoReadOnlyPage;