import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelDownloadButton from "../../../../utils/Export_Data_General/ExcelDownloadData";
import {
    Box,
    Card,
    CardContent,
    Typography,
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
    Button,
    Tooltip,
} from "@mui/material";

import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import OpacityIcon from "@mui/icons-material/Opacity";
import CheckIcon from "@mui/icons-material/Check";
import SaveIcon from "@mui/icons-material/Save";

import { useAuth } from "../../../../utils/Context/AuthContext/AuthContext";

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

const normalizeFechaEstimadaEntrega = (value) => {
    const v = normalizeText(value).toUpperCase();
    return v || "NA";
};

const displayFechaEstimadaEntrega = (value) => {
    const v = normalizeFechaEstimadaEntrega(value);
    return v === "NA" ? "" : v;
};

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

const pad2 = (n) => String(n).padStart(2, "0");

const toISODate = (d) => {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
};

const isValidDateISO = (s) => {
    const v = normalizeText(s);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);

    if (!m) return false;

    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);

    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;

    const dt = new Date(yyyy, mm - 1, dd);

    return (
        dt.getFullYear() === yyyy &&
        dt.getMonth() === mm - 1 &&
        dt.getDate() === dd
    );
};

const getDefaultRange = () => {
    const now = new Date();

    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        from: toISODate(startPrevMonth),
        to: toISODate(endCurrentMonth),
    };
};

const ProgramacionDespachoReadOnlyPage = () => {
    const { rol } = useAuth();

    const canEditFechaEstimadaEntrega = ["developer", "comercial"].includes(
        normalizeText(rol).toLowerCase()
    );

    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 250);

    const [filters, setFilters] = useState({
        fecha: "",
        fechaEstimadaEntrega: "",
        cliente: "",
        producto: "",
        transportadora: "",
        destino: "",
    });

    const [range, setRange] = useState(() => getDefaultRange());

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [fechaEstimadaDraft, setFechaEstimadaDraft] = useState({});
    const [savingFechaId, setSavingFechaId] = useState(null);

    const fetchProgramacion = async (customRange) => {
        try {
            setLoading(true);
            setErrorMsg("");

            const effective = customRange ?? range ?? getDefaultRange();

            const from = normalizeText(effective.from);
            const to = normalizeText(effective.to);

            const res = await axios.get(`${API_URL}/rango`, {
                params: { from, to },
                withCredentials: true,
            });

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
        fetchProgramacion(getDefaultRange());
    }, []);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleRangeChange = (e) => {
        setRange((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleApplyRange = async () => {
        const from = normalizeText(range.from);
        const to = normalizeText(range.to);

        if (from && !isValidDateISO(from)) {
            setErrorMsg('La fecha "Desde" debe tener formato YYYY-MM-DD.');
            return;
        }

        if (to && !isValidDateISO(to)) {
            setErrorMsg('La fecha "Hasta" debe tener formato YYYY-MM-DD.');
            return;
        }

        if (from && to && from > to) {
            setErrorMsg('"Desde" no puede ser mayor que "Hasta".');
            return;
        }

        await fetchProgramacion({ from, to });
    };

    const handleResetRangeToDefault = async () => {
        const def = getDefaultRange();
        setRange(def);
        await fetchProgramacion(def);
    };

    const clearFilters = () => {
        setFilters({
            fecha: "",
            fechaEstimadaEntrega: "",
            cliente: "",
            producto: "",
            transportadora: "",
            destino: "",
        });
        setSearch("");
    };

    const handleDraftFechaChange = (id, value) => {
        setFechaEstimadaDraft((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const getDraftFechaValue = (row) => {
        const id = row?._id;

        if (!id) return "";

        if (Object.prototype.hasOwnProperty.call(fechaEstimadaDraft, id)) {
            return fechaEstimadaDraft[id];
        }

        return displayFechaEstimadaEntrega(row.fechaEstimadaEntrega);
    };

    const handleSaveFechaEstimada = async (row) => {
        try {
            const id = row?._id;

            if (!id) {
                await Swal.fire({
                    icon: "warning",
                    title: "Registro inválido",
                    text: "No se encontró el ID de la programación.",
                });
                return;
            }

            if (!canEditFechaEstimadaEntrega) {
                await Swal.fire({
                    icon: "warning",
                    title: "Sin permisos",
                    text: "Solo comercial o developer pueden actualizar la fecha estimada de entrega.",
                });
                return;
            }

            const rawValue = getDraftFechaValue(row);
            const value = normalizeFechaEstimadaEntrega(rawValue);

            if (value !== "NA" && !isValidDateISO(value)) {
                await Swal.fire({
                    icon: "warning",
                    title: "Fecha inválida",
                    text: 'La fecha estimada debe tener formato "YYYY-MM-DD".',
                });
                return;
            }

            const currentValue = normalizeFechaEstimadaEntrega(
                row.fechaEstimadaEntrega
            );

            if (value === currentValue) {
                await Swal.fire({
                    icon: "info",
                    title: "Sin cambios",
                    text: "La fecha estimada no cambió.",
                    timer: 1200,
                    showConfirmButton: false,
                });
                return;
            }

            const confirm = await Swal.fire({
                icon: "question",
                title: "Actualizar fecha estimada",
                text:
                    value === "NA"
                        ? "La fecha quedará como pendiente."
                        : `Se asignará la fecha estimada ${value}.`,
                showCancelButton: true,
                confirmButtonText: "Sí, guardar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#1976d2",
            });

            if (!confirm.isConfirmed) return;

            setSavingFechaId(id);
            setErrorMsg("");

            await axios.patch(
                `${API_URL}/${id}/fecha-estimada-entrega`,
                { fechaEstimadaEntrega: value },
                { withCredentials: true }
            );

            setRows((prev) =>
                prev.map((item) =>
                    item._id === id
                        ? {
                              ...item,
                              fechaEstimadaEntrega: value,
                          }
                        : item
                )
            );

            setFechaEstimadaDraft((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });

            await Swal.fire({
                icon: "success",
                title: "Fecha actualizada",
                text: "La fecha estimada de entrega fue actualizada correctamente.",
                timer: 1300,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error actualizando fecha estimada:", error);

            const msg = getApiErrorMessage(error);
            setErrorMsg(msg);

            await Swal.fire({
                icon: "error",
                title: "No se pudo actualizar",
                text: msg,
            });
        } finally {
            setSavingFechaId(null);
        }
    };

    const options = useMemo(() => {
        const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

        const safe = rows ?? [];

        return {
            fechas: uniq(safe.map((r) => normalizeText(r.fecha)))
                .filter((f) => isValidDateISO(f))
                .sort(),

            fechasEstimadasEntrega: uniq(
                safe.map((r) => normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega))
            ).sort((a, b) => {
                if (a === "NA") return -1;
                if (b === "NA") return 1;
                return a.localeCompare(b);
            }),

            clientes: uniq(safe.map((r) => normalizeText(r.cliente))).sort(),
            productos: uniq(safe.map((r) => normalizeText(r.producto))).sort(),
            transportadoras: uniq(
                safe.map((r) => normalizeText(r.transportadora))
            ).sort(),
            destinos: uniq(safe.map((r) => normalizeText(r.destino))).sort(),
        };
    }, [rows]);

    const rowsFiltrados = useMemo(() => {
        const safe = rows ?? [];
        let out = [...safe];

        const fFecha = normalizeText(filters.fecha);
        const fFechaEstimadaEntrega = normalizeFechaEstimadaEntrega(
            filters.fechaEstimadaEntrega
        );
        const fCliente = normalizeText(filters.cliente);
        const fProducto = normalizeText(filters.producto);
        const fTransportadora = normalizeText(filters.transportadora);
        const fDestino = normalizeText(filters.destino);

        if (fFecha) {
            out = out.filter((r) => normalizeText(r.fecha) === fFecha);
        }

        if (filters.fechaEstimadaEntrega) {
            out = out.filter(
                (r) =>
                    normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega) ===
                    fFechaEstimadaEntrega
            );
        }

        if (fCliente) {
            out = out.filter((r) => normalizeText(r.cliente) === fCliente);
        }

        if (fProducto) {
            out = out.filter((r) => normalizeText(r.producto) === fProducto);
        }

        if (fTransportadora) {
            out = out.filter(
                (r) => normalizeText(r.transportadora) === fTransportadora
            );
        }

        if (fDestino) {
            out = out.filter((r) => normalizeText(r.destino) === fDestino);
        }

        const q = normalizeText(debouncedSearch).toLowerCase();

        if (q) {
            out = out.filter((r) => {
                const fecha = normalizeText(r.fecha).toLowerCase();
                const fechaEstimadaEntrega = normalizeFechaEstimadaEntrega(
                    r.fechaEstimadaEntrega
                ).toLowerCase();
                const horaProgramada = normalizeText(r.horaProgramada).toLowerCase();
                const placa = normalizeText(r.placa).toLowerCase();
                const trailer = normalizeText(r.trailer).toLowerCase();
                const conductor = normalizeText(r.conductor).toLowerCase();
                const transportadora = normalizeText(r.transportadora).toLowerCase();
                const cliente = normalizeText(r.cliente).toLowerCase();
                const destino = normalizeText(r.destino).toLowerCase();
                const producto = normalizeText(r.producto).toLowerCase();
                const cantidad = String(r.cantidad ?? "").toLowerCase();
                const checked = r?.cumplido ? "si cumplido checked" : "no pendiente";

                return (
                    fecha.includes(q) ||
                    fechaEstimadaEntrega.includes(q) ||
                    horaProgramada.includes(q) ||
                    placa.includes(q) ||
                    trailer.includes(q) ||
                    conductor.includes(q) ||
                    transportadora.includes(q) ||
                    cliente.includes(q) ||
                    destino.includes(q) ||
                    producto.includes(q) ||
                    cantidad.includes(q) ||
                    checked.includes(q)
                );
            });
        }

        out.sort((a, b) => {
            const fechaA = normalizeText(a.fecha);
            const fechaB = normalizeText(b.fecha);

            if (fechaA !== fechaB) {
                return fechaB.localeCompare(fechaA);
            }

            const createdA = normalizeText(a.createdAt);
            const createdB = normalizeText(b.createdAt);

            return createdB.localeCompare(createdA);
        });

        return out;
    }, [rows, filters, debouncedSearch]);

    const total = rows.length;
    const filtrados = rowsFiltrados.length;

    const totalCantidad = useMemo(() => {
        return (rows ?? []).reduce((acc, r) => acc + Number(r?.cantidad ?? 0), 0);
    }, [rows]);

    const filtradoCantidad = useMemo(() => {
        return (rowsFiltrados ?? []).reduce(
            (acc, r) => acc + Number(r?.cantidad ?? 0),
            0
        );
    }, [rowsFiltrados]);

    const kpiPorDia = useMemo(() => {
        const m = new Map();

        for (const r of rowsFiltrados ?? []) {
            const f = normalizeText(r.fecha);

            if (!isValidDateISO(f)) continue;

            const prev = m.get(f) || {
                fecha: f,
                viajes: 0,
                cantidad: 0,
            };

            prev.viajes += 1;
            prev.cantidad += Number(r?.cantidad ?? 0);

            m.set(f, prev);
        }

        return Array.from(m.entries())
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .slice(0, 8)
            .map(([, v]) => v)
            .reverse();
    }, [rowsFiltrados]);

    const hasAnyFilter =
        !!debouncedSearch ||
        !!filters.fecha ||
        !!filters.fechaEstimadaEntrega ||
        !!filters.cliente ||
        !!filters.producto ||
        !!filters.transportadora ||
        !!filters.destino;

    const exportData = useMemo(() => {
        return rowsFiltrados.map((r) => ({
            Fecha: normalizeText(r.fecha),
            "Fecha Estimada Entrega":
                normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega) === "NA"
                    ? "Pendiente"
                    : normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega),
            Hora: normalizeText(r.horaProgramada),
            Placa: normalizeText(r.placa),
            Trailer: normalizeText(r.trailer),
            Conductor: normalizeText(r.conductor),
            Transportadora: normalizeText(r.transportadora),
            Cliente: normalizeText(r.cliente),
            Destino: normalizeText(r.destino),
            Producto: normalizeText(r.producto),
            Cantidad: Number(r.cantidad ?? 0),
            Checked: r?.cumplido ? "SI" : "NO",
        }));
    }, [rowsFiltrados]);

    return (
        <Box p={{ xs: 0, md: 0 }} mt={8}>
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
                                Consulta programación de despachos Comercial
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Vista comercial de consulta. Solo permite actualizar la
                                fecha estimada de entrega.
                            </Typography>

                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                <Chip size="small" label={`Total registros: ${total}`} />

                                <Chip
                                    size="small"
                                    color={hasAnyFilter ? "primary" : "default"}
                                    label={`Filtrados: ${filtrados}`}
                                />

                                <Chip
                                    size="small"
                                    label={`Total volumen: ${formatNumber(totalCantidad)} L`}
                                />

                                <Chip
                                    size="small"
                                    color={hasAnyFilter ? "success" : "default"}
                                    label={`Volumen filtrado: ${formatNumber(filtradoCantidad)} L`}
                                />

                                {canEditFechaEstimadaEntrega && (
                                    <Chip
                                        size="small"
                                        color="info"
                                        label="Edición habilitada: Fecha estimada"
                                    />
                                )}

                                {loading && (
                                    <Chip size="small" color="warning" label="Cargando..." />
                                )}
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
                                placeholder="Buscar por fecha, fecha estimada, hora, placa, conductor, cliente, destino, producto..."
                                size="small"
                                sx={{ minWidth: { xs: "100%", md: 520 } }}
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
                            gap: 2,
                            alignItems: "center",
                            flexWrap: { xs: "wrap", md: "nowrap" },
                            mb: 3,
                        }}
                    >
                        <TextField
                            size="small"
                            type="date"
                            label="Desde"
                            name="from"
                            value={range.from}
                            onChange={handleRangeChange}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                width: { xs: "100%", md: 190 },
                                "& input[type='date']::-webkit-calendar-picker-indicator": {
                                    filter: "invert(0)",
                                    opacity: 1,
                                    cursor: "pointer",
                                },
                            }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="Hasta"
                            name="to"
                            value={range.to}
                            onChange={handleRangeChange}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                width: { xs: "100%", md: 190 },
                                "& input[type='date']::-webkit-calendar-picker-indicator": {
                                    filter: "invert(0)",
                                    opacity: 1,
                                    cursor: "pointer",
                                },
                            }}
                        />

                        <Button variant="contained" size="small" onClick={handleApplyRange}>
                            Consultar rango
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={handleResetRangeToDefault}
                        >
                            Mes actual + anterior
                        </Button>
                    </Box>

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
                                label="Fecha Est. Entrega"
                                name="fechaEstimadaEntrega"
                                value={filters.fechaEstimadaEntrega}
                                onChange={handleFilterChange}
                                sx={{ width: 180 }}
                            >
                                <MenuItem value="">(Todas)</MenuItem>
                                {options.fechasEstimadasEntrega.map((f) => (
                                    <MenuItem key={f} value={f}>
                                        {f === "NA" ? "Pendiente" : f}
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
                                sx={{ width: 180 }}
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
                                sx={{ width: 180 }}
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
                                sx={{ width: 190 }}
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

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexShrink: 0,
                            }}
                        >
                            <Tooltip title="Actualizar datos">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => fetchProgramacion(range)}
                                    sx={{
                                        minWidth: 40,
                                        width: 40,
                                        height: 40,
                                        p: 0,
                                    }}
                                >
                                    <RefreshIcon />
                                </Button>
                            </Tooltip>

                            <Tooltip title="Limpiar filtros">
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
                            </Tooltip>

                            <ExcelDownloadButton
                                data={exportData}
                                filename="programacion_despacho_comercial.xlsx"
                                sheetName="Programacion"
                                variant="contained"
                                buttonText="Exportar Excel"
                            />
                        </Box>
                    </Box>

                    {kpiPorDia.length > 0 && (
                        <Box sx={{ mt: 1, mb: 2.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Resumen por día según filtro actual
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                    alignItems: "center",
                                }}
                            >
                                {kpiPorDia.map((d) => (
                                    <Chip
                                        key={d.fecha}
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                            height: 35,
                                            borderRadius: "5px",
                                            bgcolor: "#fff",
                                            "& .MuiChip-label": {
                                                px: 1,
                                                py: 0,
                                            },
                                        }}
                                        label={
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.8,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <CalendarMonthIcon
                                                    sx={{ fontSize: 14, color: "text.secondary" }}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 500, lineHeight: 1 }}
                                                >
                                                    {d.fecha}
                                                </Typography>

                                                <LocalShippingIcon
                                                    sx={{ fontSize: 14, color: "primary.main" }}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 500, lineHeight: 1 }}
                                                >
                                                    {d.viajes}
                                                </Typography>

                                                <OpacityIcon
                                                    sx={{ fontSize: 14, color: "success.main" }}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 500, lineHeight: 1 }}
                                                >
                                                    {formatNumber(d.cantidad)}L
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

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
                                    <TableCell align="left">
                                        <strong>Fecha</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Fecha Est. Entrega</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Hora</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Placa</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Trailer</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Conductor</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Transportadora</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Cliente</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Destino</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Producto</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Cantidad</strong>
                                    </TableCell>
                                    <TableCell align="left">
                                        <strong>Checked</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody
                                sx={{
                                    "& .MuiTableRow-root": {
                                        transition: "background-color 0.18s ease",
                                        "&:nth-of-type(even)": {
                                            backgroundColor: "rgba(17, 24, 39, 0.025)",
                                        },
                                        "&:hover": {
                                            backgroundColor: "rgba(25, 118, 210, 0.08) !important",
                                        },
                                    },
                                    "& .MuiTableCell-root": {
                                        fontSize: "11.8px",
                                        py: 0.65,
                                        px: 1,
                                        borderBottom: "1px solid rgba(224, 224, 224, 0.8)",
                                        color: "text.primary",
                                        verticalAlign: "middle",
                                    },
                                }}
                            >
                                {rowsFiltrados.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} align="center" sx={{ py: 5 }}>
                                            <Typography fontWeight="bold">No hay resultados</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Intenta cambiar los filtros o la búsqueda.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rowsFiltrados.map((r) => {
                                        const currentFecha =
                                            normalizeFechaEstimadaEntrega(r.fechaEstimadaEntrega);

                                        const draftFecha = getDraftFechaValue(r);

                                        const hasDraftChange =
                                            normalizeFechaEstimadaEntrega(draftFecha) !== currentFecha;

                                        return (
                                            <TableRow
                                                key={r._id || `${r.fecha}-${r.placa}-${r.cliente}`}
                                                hover
                                            >
                                                <TableCell
                                                    sx={{
                                                        minWidth: 105,
                                                        whiteSpace: "nowrap",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {normalizeText(r.fecha) || "—"}
                                                </TableCell>

                                                <TableCell sx={{ minWidth: 210, whiteSpace: "nowrap" }}>
                                                    {canEditFechaEstimadaEntrega ? (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 0.7,
                                                            }}
                                                        >
                                                            <TextField
                                                                size="small"
                                                                type="date"
                                                                value={draftFecha}
                                                                onChange={(e) =>
                                                                    handleDraftFechaChange(
                                                                        r._id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                InputLabelProps={{ shrink: true }}
                                                                sx={{
                                                                    width: 145,
                                                                    "& .MuiInputBase-root": {
                                                                        height: 32,
                                                                        fontSize: 12,
                                                                    },
                                                                    "& .MuiInputBase-input": {
                                                                        py: 0.5,
                                                                        px: 1,
                                                                    },
                                                                    "& input[type='date']::-webkit-calendar-picker-indicator":
                                                                        {
                                                                            filter: "invert(0)",
                                                                            opacity: 1,
                                                                            cursor: "pointer",
                                                                        },
                                                                }}
                                                            />

                                                            <Tooltip
                                                                title={
                                                                    hasDraftChange
                                                                        ? "Guardar fecha estimada"
                                                                        : "Sin cambios"
                                                                }
                                                            >
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() =>
                                                                            handleSaveFechaEstimada(r)
                                                                        }
                                                                        disabled={
                                                                            savingFechaId === r._id ||
                                                                            !hasDraftChange
                                                                        }
                                                                        sx={{
                                                                            border: "1px solid rgba(25, 118, 210, 0.35)",
                                                                            width: 30,
                                                                            height: 30,
                                                                            bgcolor: hasDraftChange
                                                                                ? "rgba(25, 118, 210, 0.08)"
                                                                                : "transparent",
                                                                        }}
                                                                    >
                                                                        <SaveIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Box>
                                                    ) : currentFecha === "NA" ? (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: "inline-block",
                                                                px: 1.2,
                                                                py: 0.35,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: "0.78rem",
                                                                color: "#B71C1C",
                                                                backgroundColor:
                                                                    "rgba(244, 67, 54, 0.12)",
                                                                border:
                                                                    "1px solid rgba(244, 67, 54, 0.35)",
                                                            }}
                                                        >
                                                            Pendiente
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: "inline-block",
                                                                px: 1.2,
                                                                py: 0.35,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: "0.78rem",
                                                                color: "#1B5E20",
                                                                backgroundColor:
                                                                    "rgba(76, 175, 80, 0.12)",
                                                                border:
                                                                    "1px solid rgba(76, 175, 80, 0.35)",
                                                            }}
                                                        >
                                                            {currentFecha}
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                        fontWeight: 600,
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {normalizeText(r.horaProgramada) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {normalizeText(r.placa) || "—"}
                                                </TableCell>

                                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                    {normalizeText(r.trailer) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        maxWidth: 230,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                    title={normalizeText(r.conductor)}
                                                >
                                                    {normalizeText(r.conductor) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        maxWidth: 210,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                    title={normalizeText(r.transportadora)}
                                                >
                                                    {normalizeText(r.transportadora) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        maxWidth: 240,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        fontWeight: 600,
                                                    }}
                                                    title={normalizeText(r.cliente)}
                                                >
                                                    {normalizeText(r.cliente) || "—"}
                                                </TableCell>

                                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                                    {normalizeText(r.destino) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        maxWidth: 230,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                    title={normalizeText(r.producto)}
                                                >
                                                    {normalizeText(r.producto) || "—"}
                                                </TableCell>

                                                <TableCell
                                                    align="left"
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {formatNumber(r.cantidad)}
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Tooltip
                                                        placement="top"
                                                        title={
                                                            Boolean(r?.cumplido)
                                                                ? "Despacho cumplido"
                                                                : "Pendiente"
                                                        }
                                                    >
                                                        <CheckIcon
                                                            sx={{
                                                                color: Boolean(r?.cumplido)
                                                                    ? "#2e7d32"
                                                                    : "grey.300",
                                                                fontSize: 22,
                                                                filter: Boolean(r?.cumplido)
                                                                    ? "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))"
                                                                    : "inherit",
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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