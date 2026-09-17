import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";

const API_URL = "https://ambiocomserver.onrender.com/api/despacho-alcoholes/rango";

/* ============================================================
   UTILIDADES
============================================================ */

const pad2 = (value) =>
    String(value).padStart(2, "0");

const formatDateInput = (date) => {
    return [
        date.getFullYear(),
        pad2(date.getMonth() + 1),
        pad2(date.getDate()),
    ].join("-");
};

const getDefaultRange = () => {
    const now = new Date();

    const from = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
    );

    const to = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
    );

    return {
        from: formatDateInput(from),
        to: formatDateInput(to),
    };
};

/* ============================================================
   CONVERSIÓN SEGURA DE NÚMEROS
============================================================ */

const toNullableNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        typeof value === "boolean"
    ) {
        return null;
    }

    const normalized = String(value)
        .replace(/\s/g, "")
        .replace(/,/g, ".");

    const number = Number(normalized);

    return Number.isFinite(number)
        ? number
        : null;
};

const firstText = (...values) => {
    const value = values.find(
        (item) =>
            item !== undefined &&
            item !== null &&
            String(item).trim() !== ""
    );

    return value !== undefined
        ? String(value).trim()
        : "";
};

const firstNumber = (...values) => {
    for (const value of values) {
        const number =
            toNullableNumber(value);

        if (number !== null) {
            return number;
        }
    }

    return null;
};

/* ============================================================
   FORMATO
============================================================ */

const numberFormatter =
    new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0,
    });

const decimalFormatter =
    new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const copFormatter =
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });

const copDecimalFormatter =
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const formatLitros = (value) =>
    `${numberFormatter.format(
        Number(value || 0)
    )} L`;

const formatCOP = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    return copFormatter.format(value);
};

const formatCOPLitro = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    return `${copDecimalFormatter.format(
        value
    )}/L`;
};

/* ============================================================
   NORMALIZACIÓN RURAL / URBANO
============================================================ */

const normalizeZona = (value) => {
    const text = String(
        value || ""
    )
        .trim()
        .toUpperCase();

    if (!text) {
        return "SIN CLASIFICAR";
    }

    if (
        text.includes("RURAL") ||
        text === "R"
    ) {
        return "RURAL";
    }

    if (
        text.includes("URB") ||
        text === "U"
    ) {
        return "URBANO";
    }

    return text;
};

/* ============================================================
   MAPEO DEL BACKEND
============================================================ */

/*
  IMPORTANTE:

  De los datos que me mostraste ya conocemos:

  volumen_contador_gravimetrico
  cliente
  transportadora

  Pero todavía necesitamos confirmar el nombre real de:

  1. valor monetario del flete
  2. destino
  3. rural / urbano

  Por eso esos campos quedan centralizados AQUÍ.
*/

const normalizeDespacho = (row) => {
    const lecturas =
        row?.lecturas || {};

    /* ============================
       LITROS GRAVIMÉTRICOS
    ============================ */

    const litrosGravimetricos =
        firstNumber(
            lecturas
                ?.volumen_contador_gravimetrico
        ) || 0;

    /* ============================
       VALOR DEL FLETE
  
       AJUSTAR AQUÍ SI EL CAMPO
       REAL TIENE OTRO NOMBRE
    ============================ */

    const valorFlete =
        firstNumber(
            lecturas?.valor_flete,
            lecturas?.valor_flete_factura,
            lecturas?.valor_flete_facturado,
            lecturas?.costo_flete,
            lecturas?.flete_valor
        );

    /* ============================
       DESTINO
  
       AJUSTAR AQUÍ SI ES NECESARIO
    ============================ */

    const destino =
        firstText(
            lecturas?.destino,
            lecturas?.ciudad_destino,
            lecturas?.municipio_destino,
            lecturas?.lugar_destino
        ) || "SIN DATO";

    /* ============================
       ZONA RURAL / URBANA
  
       AJUSTAR AQUÍ SI ES NECESARIO
    ============================ */

    const zona =
        normalizeZona(
            firstText(
                lecturas?.zona,
                lecturas?.tipo_zona,
                lecturas?.zona_destino,
                lecturas?.rural_urbano
            )
        );

    /* ============================
       DATOS YA CONFIRMADOS
    ============================ */

    const cliente =
        firstText(
            lecturas?.cliente
        ) || "SIN DATO";

    const transportadora =
        firstText(
            lecturas?.transportadora
        ) || "SIN DATO";

    const producto =
        firstText(
            lecturas?.producto
        ) || "SIN DATO";

    /* ============================
       FLETE / LITRO
    ============================ */

    const fletePorLitro =
        valorFlete !== null &&
            litrosGravimetricos > 0
            ? valorFlete /
            litrosGravimetricos
            : null;

    return {
        id:
            row?._id ||
            `${row?.fecha}-${Math.random()}`,

        fecha:
            row?.fecha || "",

        cliente,
        transportadora,
        destino,
        zona,
        producto,

        litrosGravimetricos,
        valorFlete,
        fletePorLitro,

        fleteFacturado:
            Boolean(
                lecturas?.flete_facturado
            ),

        placa:
            firstText(
                lecturas?.placa
            ) || "SIN DATO",

        remision:
            firstText(
                lecturas?.remision_factura
            ) || "SIN DATO",
    };
};

/* ============================================================
   KPI
============================================================ */

function KpiCard({
    title,
    value,
    subtitle,
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                border:
                    "1px solid #d0d5dd",
                borderRadius: 2,
                px: 2,
                py: 1.6,
                minWidth: 0,
                bgcolor: "#ffffff",
            }}
        >
            <Typography
                sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#667085",
                    textTransform:
                        "uppercase",
                }}
            >
                {title}
            </Typography>

            <Typography
                sx={{
                    mt: 0.6,
                    fontSize: 23,
                    fontWeight: 800,
                    color: "#003f8f",
                    lineHeight: 1.1,
                }}
            >
                {value}
            </Typography>

            {subtitle && (
                <Typography
                    sx={{
                        mt: 0.5,
                        fontSize: 10,
                        color: "#667085",
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Paper>
    );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function AnalisisFletesHistoricos() {
    const defaultRange =
        useMemo(
            () => getDefaultRange(),
            []
        );

    /* ============================================================
       FECHAS
    ============================================================ */

    const [from, setFrom] =
        useState(defaultRange.from);

    const [to, setTo] =
        useState(defaultRange.to);

    /* ============================================================
       DATOS
    ============================================================ */

    const [despachos, setDespachos] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    /* ============================================================
       FILTROS
    ============================================================ */

    const [
        filtroCliente,
        setFiltroCliente,
    ] = useState("TODOS");

    const [
        filtroTransportadora,
        setFiltroTransportadora,
    ] = useState("TODAS");

    const [
        filtroDestino,
        setFiltroDestino,
    ] = useState("TODOS");

    const [
        filtroZona,
        setFiltroZona,
    ] = useState("TODAS");

    const [
        filtroProducto,
        setFiltroProducto,
    ] = useState("TODOS");

    /* ============================================================
       CONSULTAR API
    ============================================================ */

    const consultar = async () => {
        if (!from || !to) {
            setError(
                "Debe seleccionar ambas fechas."
            );
            return;
        }

        if (from > to) {
            setError(
                "La fecha inicial no puede ser mayor que la fecha final."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            const url =
                `${API_URL}` +
                `?from=${encodeURIComponent(
                    from
                )}` +
                `&to=${encodeURIComponent(
                    to
                )}`;

            const response =
                await fetch(url, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                });

            const payload =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    payload?.message ||
                    "No fue posible consultar los despachos."
                );
            }

            /*
              Soporta varias posibles
              estructuras del backend:
            */

            const rows =
                Array.isArray(payload)
                    ? payload
                    : Array.isArray(
                        payload?.data
                    )
                        ? payload.data
                        : Array.isArray(
                            payload?.despachos
                        )
                            ? payload.despachos
                            : Array.isArray(
                                payload?.registros
                            )
                                ? payload.registros
                                : [];

            const normalized =
                rows.map(
                    normalizeDespacho
                );

            setDespachos(normalized);
        } catch (err) {
            console.error(
                "[ANÁLISIS FLETES]",
                err
            );

            setDespachos([]);

            setError(
                err?.message ||
                "Error consultando información."
            );
        } finally {
            setLoading(false);
        }
    };

    /* ============================================================
       CONSULTA INICIAL
    ============================================================ */

    useEffect(() => {
        consultar();

        // Se ejecuta únicamente
        // al montar el componente.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ============================================================
       OPCIONES DINÁMICAS
    ============================================================ */

    const clientes =
        useMemo(() => {
            return [
                ...new Set(
                    despachos.map(
                        (item) =>
                            item.cliente
                    )
                ),
            ].sort();
        }, [despachos]);

    const transportadoras =
        useMemo(() => {
            return [
                ...new Set(
                    despachos.map(
                        (item) =>
                            item.transportadora
                    )
                ),
            ].sort();
        }, [despachos]);

    const destinos =
        useMemo(() => {
            return [
                ...new Set(
                    despachos.map(
                        (item) =>
                            item.destino
                    )
                ),
            ].sort();
        }, [despachos]);

    const zonas =
        useMemo(() => {
            return [
                ...new Set(
                    despachos.map(
                        (item) =>
                            item.zona
                    )
                ),
            ].sort();
        }, [despachos]);

    const productos =
        useMemo(() => {
            return [
                ...new Set(
                    despachos.map(
                        (item) =>
                            item.producto
                    )
                ),
            ].sort();
        }, [despachos]);

    /* ============================================================
       FILTRO DINÁMICO
    ============================================================ */

    const despachosFiltrados =
        useMemo(() => {
            return despachos.filter(
                (item) => {
                    if (
                        filtroCliente !==
                        "TODOS" &&
                        item.cliente !==
                        filtroCliente
                    ) {
                        return false;
                    }

                    if (
                        filtroTransportadora !==
                        "TODAS" &&
                        item.transportadora !==
                        filtroTransportadora
                    ) {
                        return false;
                    }

                    if (
                        filtroDestino !==
                        "TODOS" &&
                        item.destino !==
                        filtroDestino
                    ) {
                        return false;
                    }

                    if (
                        filtroZona !==
                        "TODAS" &&
                        item.zona !==
                        filtroZona
                    ) {
                        return false;
                    }

                    if (
                        filtroProducto !==
                        "TODOS" &&
                        item.producto !==
                        filtroProducto
                    ) {
                        return false;
                    }

                    return true;
                }
            );
        }, [
            despachos,
            filtroCliente,
            filtroTransportadora,
            filtroDestino,
            filtroZona,
            filtroProducto,
        ]);

    /* ============================================================
       MÉTRICAS
    ============================================================ */

    const metricas =
        useMemo(() => {
            const totalDespachos =
                despachosFiltrados.length;

            const totalLitros =
                despachosFiltrados.reduce(
                    (acc, item) =>
                        acc +
                        item.litrosGravimetricos,
                    0
                );

            const conFlete =
                despachosFiltrados.filter(
                    (item) =>
                        item.valorFlete !== null &&
                        item.valorFlete >= 0 &&
                        item.litrosGravimetricos >
                        0
                );

            const totalFlete =
                conFlete.reduce(
                    (acc, item) =>
                        acc +
                        item.valorFlete,
                    0
                );

            const litrosConFlete =
                conFlete.reduce(
                    (acc, item) =>
                        acc +
                        item.litrosGravimetricos,
                    0
                );

            /*
              PROMEDIO PONDERADO
      
              Sumatoria flete /
              sumatoria litros
            */

            const promedioFleteLitro =
                litrosConFlete > 0
                    ? totalFlete /
                    litrosConFlete
                    : null;

            const promedioFleteDespacho =
                conFlete.length > 0
                    ? totalFlete /
                    conFlete.length
                    : null;

            const costosLitro =
                conFlete
                    .map(
                        (item) =>
                            item.fletePorLitro
                    )
                    .filter(
                        (value) =>
                            value !== null
                    );

            const minimoFleteLitro =
                costosLitro.length
                    ? Math.min(
                        ...costosLitro
                    )
                    : null;

            const maximoFleteLitro =
                costosLitro.length
                    ? Math.max(
                        ...costosLitro
                    )
                    : null;

            return {
                totalDespachos,
                totalLitros,
                totalFlete,
                promedioFleteLitro,
                promedioFleteDespacho,
                minimoFleteLitro,
                maximoFleteLitro,
                registrosConFlete:
                    conFlete.length,
            };
        }, [despachosFiltrados]);

    /* ============================================================
       AGRUPACIÓN POR DESTINO
    ============================================================ */

    const resumenDestinos =
        useMemo(() => {
            const map =
                new Map();

            despachosFiltrados.forEach(
                (item) => {
                    if (
                        !map.has(
                            item.destino
                        )
                    ) {
                        map.set(
                            item.destino,
                            {
                                destino:
                                    item.destino,

                                despachos: 0,

                                litros: 0,

                                flete: 0,

                                litrosConFlete: 0,

                                registrosConFlete:
                                    0,

                                zonas:
                                    new Set(),

                                transportadoras:
                                    new Set(),
                            }
                        );
                    }

                    const group =
                        map.get(
                            item.destino
                        );

                    group.despachos += 1;

                    group.litros +=
                        item.litrosGravimetricos;

                    group.zonas.add(
                        item.zona
                    );

                    group.transportadoras.add(
                        item.transportadora
                    );

                    if (
                        item.valorFlete !==
                        null &&
                        item.litrosGravimetricos >
                        0
                    ) {
                        group.flete +=
                            item.valorFlete;

                        group.litrosConFlete +=
                            item.litrosGravimetricos;

                        group.registrosConFlete +=
                            1;
                    }
                }
            );

            return Array.from(
                map.values()
            )
                .map((item) => ({
                    ...item,

                    zonas: Array.from(
                        item.zonas
                    ).join(", "),

                    transportadoras:
                        Array.from(
                            item.transportadoras
                        ).join(", "),

                    fleteLitro:
                        item.litrosConFlete >
                            0
                            ? item.flete /
                            item.litrosConFlete
                            : null,
                }))
                .sort(
                    (a, b) =>
                        (b.fleteLitro ||
                            0) -
                        (a.fleteLitro ||
                            0)
                );
        }, [despachosFiltrados]);

    /* ============================================================
       AGRUPACIÓN RURAL / URBANO
    ============================================================ */

    const resumenZonas =
        useMemo(() => {
            const map =
                new Map();

            despachosFiltrados.forEach(
                (item) => {
                    if (!map.has(item.zona)) {
                        map.set(
                            item.zona,
                            {
                                zona: item.zona,
                                despachos: 0,
                                litros: 0,
                                flete: 0,
                                litrosConFlete: 0,
                            }
                        );
                    }

                    const group =
                        map.get(item.zona);

                    group.despachos += 1;

                    group.litros +=
                        item.litrosGravimetricos;

                    if (
                        item.valorFlete !==
                        null &&
                        item.litrosGravimetricos >
                        0
                    ) {
                        group.flete +=
                            item.valorFlete;

                        group.litrosConFlete +=
                            item.litrosGravimetricos;
                    }
                }
            );

            return Array.from(
                map.values()
            ).map((item) => ({
                ...item,

                fleteLitro:
                    item.litrosConFlete >
                        0
                        ? item.flete /
                        item.litrosConFlete
                        : null,
            }));
        }, [despachosFiltrados]);

    /* ============================================================
       LIMPIAR FILTROS
    ============================================================ */

    const limpiarFiltros = () => {
        setFiltroCliente("TODOS");

        setFiltroTransportadora(
            "TODAS"
        );

        setFiltroDestino("TODOS");

        setFiltroZona("TODAS");

        setFiltroProducto("TODOS");
    };

    /* ============================================================
       ¿EXISTEN DATOS MONETARIOS?
    ============================================================ */

    const tieneDatosFlete =
        despachos.some(
            (item) =>
                item.valorFlete !== null
        );

    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <Box
            sx={{
                p: 2,
                bgcolor: "#f5f7fa",
                minHeight: "100%",
            }}
        >
            {/* ======================================================
          TÍTULO
      ====================================================== */}

            <Box sx={{ mb: 2 }}>
                <Typography
                    sx={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#003f8f",
                    }}
                >
                    ANÁLISIS HISTÓRICO DE FLETES
                </Typography>

                <Typography
                    sx={{
                        fontSize: 11,
                        color: "#667085",
                        mt: 0.4,
                    }}
                >
                    Análisis de costo logístico
                    por despacho y litro
                    gravimétrico.
                </Typography>
            </Box>

            {/* ======================================================
          FECHAS
      ====================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 1.5,
                    border:
                        "1px solid #d0d5dd",
                }}
            >
                <Stack
                    direction="row"
                    spacing={1.2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                >
                    <TextField
                        label="Desde"
                        type="date"
                        size="small"
                        value={from}
                        onChange={(event) =>
                            setFrom(
                                event.target.value
                            )
                        }
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        sx={{ width: 175 }}
                    />

                    <TextField
                        label="Hasta"
                        type="date"
                        size="small"
                        value={to}
                        onChange={(event) =>
                            setTo(
                                event.target.value
                            )
                        }
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        sx={{ width: 175 }}
                    />

                    <Button
                        variant="contained"
                        startIcon={
                            loading ? (
                                <CircularProgress
                                    size={15}
                                    color="inherit"
                                />
                            ) : (
                                <RefreshRoundedIcon />
                            )
                        }
                        onClick={consultar}
                        disabled={loading}
                        sx={{
                            height: 40,
                            fontWeight: 700,
                        }}
                    >
                        {loading
                            ? "CONSULTANDO..."
                            : "CONSULTAR"}
                    </Button>

                    <Divider
                        orientation="vertical"
                        flexItem
                    />

                    <Chip
                        label={`${despachos.length} registros cargados`}
                        size="small"
                    />
                </Stack>
            </Paper>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 1.5 }}
                >
                    {error}
                </Alert>
            )}

            {!loading &&
                despachos.length > 0 &&
                !tieneDatosFlete && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1.5 }}
                    >
                        Los despachos fueron
                        cargados correctamente,
                        pero no se encontró el
                        campo monetario del
                        flete. Debemos confirmar
                        el nombre exacto del
                        campo que contiene el
                        valor facturado o costo
                        del transporte.
                    </Alert>
                )}

            {/* ======================================================
          FILTROS
      ====================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 1.5,
                    border:
                        "1px solid #d0d5dd",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#344054",
                        mb: 1,
                    }}
                >
                    FILTROS DINÁMICOS
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(5, minmax(160px, 1fr)) 130px",
                        gap: 1,
                    }}
                >
                    <TextField
                        select
                        size="small"
                        label="Cliente"
                        value={filtroCliente}
                        onChange={(event) =>
                            setFiltroCliente(
                                event.target.value
                            )
                        }
                    >
                        <MenuItem value="TODOS">
                            TODOS
                        </MenuItem>

                        {clientes.map(
                            (item) => (
                                <MenuItem
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </MenuItem>
                            )
                        )}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Transportadora"
                        value={
                            filtroTransportadora
                        }
                        onChange={(event) =>
                            setFiltroTransportadora(
                                event.target.value
                            )
                        }
                    >
                        <MenuItem value="TODAS">
                            TODAS
                        </MenuItem>

                        {transportadoras.map(
                            (item) => (
                                <MenuItem
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </MenuItem>
                            )
                        )}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Destino"
                        value={filtroDestino}
                        onChange={(event) =>
                            setFiltroDestino(
                                event.target.value
                            )
                        }
                    >
                        <MenuItem value="TODOS">
                            TODOS
                        </MenuItem>

                        {destinos.map(
                            (item) => (
                                <MenuItem
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </MenuItem>
                            )
                        )}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Zona"
                        value={filtroZona}
                        onChange={(event) =>
                            setFiltroZona(
                                event.target.value
                            )
                        }
                    >
                        <MenuItem value="TODAS">
                            TODAS
                        </MenuItem>

                        {zonas.map((item) => (
                            <MenuItem
                                key={item}
                                value={item}
                            >
                                {item}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Producto"
                        value={filtroProducto}
                        onChange={(event) =>
                            setFiltroProducto(
                                event.target.value
                            )
                        }
                    >
                        <MenuItem value="TODOS">
                            TODOS
                        </MenuItem>

                        {productos.map(
                            (item) => (
                                <MenuItem
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </MenuItem>
                            )
                        )}
                    </TextField>

                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={
                            <FilterAltOffRoundedIcon />
                        }
                        onClick={limpiarFiltros}
                    >
                        LIMPIAR
                    </Button>
                </Box>
            </Paper>

            {/* ======================================================
          KPIs
      ====================================================== */}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(6, minmax(0, 1fr))",
                    gap: 1.2,
                    mb: 1.5,
                }}
            >
                <KpiCard
                    title="Despachos"
                    value={
                        numberFormatter.format(
                            metricas.totalDespachos
                        )
                    }
                    subtitle="Registros filtrados"
                />

                <KpiCard
                    title="Litros gravimétricos"
                    value={formatLitros(
                        metricas.totalLitros
                    )}
                    subtitle="Volumen histórico"
                />

                <KpiCard
                    title="Flete total"
                    value={
                        metricas.registrosConFlete
                            ? formatCOP(
                                metricas.totalFlete
                            )
                            : "—"
                    }
                    subtitle="Costo transporte"
                />

                <KpiCard
                    title="Flete promedio / despacho"
                    value={formatCOP(
                        metricas.promedioFleteDespacho
                    )}
                    subtitle="Promedio por viaje"
                />

                <KpiCard
                    title="Flete ponderado / litro"
                    value={formatCOPLitro(
                        metricas.promedioFleteLitro
                    )}
                    subtitle="Indicador principal"
                />

                <KpiCard
                    title="Rango histórico $/L"
                    value={
                        metricas.minimoFleteLitro !==
                            null
                            ? `${decimalFormatter.format(
                                metricas.minimoFleteLitro
                            )} - ${decimalFormatter.format(
                                metricas.maximoFleteLitro
                            )}`
                            : "—"
                    }
                    subtitle="Mínimo - máximo"
                />
            </Box>

            {/* ======================================================
          RESUMEN RURAL / URBANO
      ====================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 1.5,
                    border:
                        "1px solid #d0d5dd",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#003f8f",
                        mb: 1,
                    }}
                >
                    COMPARATIVO POR TIPO DE ZONA
                </Typography>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    Zona
                                </TableCell>

                                <TableCell align="right">
                                    Despachos
                                </TableCell>

                                <TableCell align="right">
                                    Litros
                                </TableCell>

                                <TableCell align="right">
                                    Flete total
                                </TableCell>

                                <TableCell align="right">
                                    Flete ponderado / L
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {resumenZonas.map(
                                (row) => (
                                    <TableRow
                                        key={row.zona}
                                    >
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={row.zona}
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            {
                                                row.despachos
                                            }
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatLitros(
                                                row.litros
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            {row.litrosConFlete >
                                                0
                                                ? formatCOP(
                                                    row.flete
                                                )
                                                : "—"}
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 800,
                                                color:
                                                    "#003f8f",
                                            }}
                                        >
                                            {formatCOPLitro(
                                                row.fleteLitro
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ======================================================
          RESUMEN POR DESTINO
      ====================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 1.5,
                    border:
                        "1px solid #d0d5dd",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#003f8f",
                        mb: 1,
                    }}
                >
                    HISTÓRICO POR DESTINO
                </Typography>

                <TableContainer
                    sx={{
                        maxHeight: 330,
                    }}
                >
                    <Table
                        stickyHeader
                        size="small"
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    Destino
                                </TableCell>

                                <TableCell>
                                    Zona
                                </TableCell>

                                <TableCell align="right">
                                    Despachos
                                </TableCell>

                                <TableCell align="right">
                                    Litros
                                </TableCell>

                                <TableCell align="right">
                                    Flete total
                                </TableCell>

                                <TableCell align="right">
                                    $ / L gravimétrico
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {resumenDestinos.map(
                                (row) => (
                                    <TableRow
                                        key={
                                            row.destino
                                        }
                                        hover
                                    >
                                        <TableCell>
                                            {row.destino}
                                        </TableCell>

                                        <TableCell>
                                            {row.zonas}
                                        </TableCell>

                                        <TableCell align="right">
                                            {
                                                row.despachos
                                            }
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatLitros(
                                                row.litros
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            {row.registrosConFlete
                                                ? formatCOP(
                                                    row.flete
                                                )
                                                : "—"}
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 800,
                                                color:
                                                    "#003f8f",
                                            }}
                                        >
                                            {formatCOPLitro(
                                                row.fleteLitro
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}

                            {!loading &&
                                resumenDestinos.length ===
                                0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            align="center"
                                        >
                                            No existen datos
                                            para los filtros
                                            seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ======================================================
          DETALLE DE DESPACHOS
      ====================================================== */}

            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    border:
                        "1px solid #d0d5dd",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#003f8f",
                        mb: 1,
                    }}
                >
                    DETALLE HISTÓRICO DE DESPACHOS
                </Typography>

                <TableContainer
                    sx={{
                        maxHeight: 420,
                    }}
                >
                    <Table
                        stickyHeader
                        size="small"
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    Fecha
                                </TableCell>

                                <TableCell>
                                    Cliente
                                </TableCell>

                                <TableCell>
                                    Destino
                                </TableCell>

                                <TableCell>
                                    Zona
                                </TableCell>

                                <TableCell>
                                    Transportadora
                                </TableCell>

                                <TableCell>
                                    Placa
                                </TableCell>

                                <TableCell align="right">
                                    Litros grav.
                                </TableCell>

                                <TableCell align="right">
                                    Flete
                                </TableCell>

                                <TableCell align="right">
                                    $ / L
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {despachosFiltrados.map(
                                (row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                    >
                                        <TableCell>
                                            {row.fecha}
                                        </TableCell>

                                        <TableCell>
                                            {row.cliente}
                                        </TableCell>

                                        <TableCell>
                                            {row.destino}
                                        </TableCell>

                                        <TableCell>
                                            {row.zona}
                                        </TableCell>

                                        <TableCell>
                                            {
                                                row.transportadora
                                            }
                                        </TableCell>

                                        <TableCell>
                                            {row.placa}
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatLitros(
                                                row.litrosGravimetricos
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            {formatCOP(
                                                row.valorFlete
                                            )}
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                            }}
                                        >
                                            {formatCOPLitro(
                                                row.fletePorLitro
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}