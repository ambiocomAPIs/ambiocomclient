import React, { useMemo, useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    Box,
    Typography,
    Divider,
    Checkbox,
    Tooltip,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import Autocomplete from "@mui/material/Autocomplete";
import { useTanques } from "../../../../../utils/Context/TanquesContext";

const DENSIDAD_KEY = "densidad";
const DENSIDAD_PUERTO = "densidad_puerto";
const DENSIDAD_MIN = 0.7;
const DENSIDAD_MAX = 0.9;

const TIME_KEYS = ["hora_ingreso", "hora_salida"];
const REQUIRED_FIELDS = ["fecha", "responsable", "observaciones"];
const ANALISTA_KEYS = ["analista_laboratorio"];
const INTEGER_ONLY_KEYS = ["cantidad_recibida", "bascula_ambiocom", "peso_enviado_neto_puerto",];
// const "flete_facturado" = "flete_facturado";

//LABELS para estado de la recepcion
const ESTADO_VEHICULO_OPTIONS = [
    { value: "APROBADO", label: "APROBADO" },
    { value: "RECHAZADO", label: "RECHAZADO" },
    { value: "PROCESO", label: "EN PROCESO" },
];

const parseHora = (h) => {
    if (!h || !String(h).includes(":")) return null;
    const [hh, mm] = String(h).split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
};

const calcularTiempoAmbiocom = (entrada, salida) => {
    const e = parseHora(entrada);
    const s = parseHora(salida);
    if (e === null || s === null) return "";

    let diff = s - e;
    if (diff < 0) diff += 24 * 60;

    const horas = String(Math.floor(diff / 60)).padStart(2, "0");
    const minutos = String(diff % 60).padStart(2, "0");
    return `${horas}:${minutos}`;
};

const normalizarTexto = (v) =>
    String(v ?? "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const pad2 = (n) => String(n).padStart(2, "0");

const buildTimeOptions = (stepMinutes = 1) => {
    const out = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += stepMinutes) {
            out.push(`${pad2(h)}:${pad2(m)}`);
        }
    }
    return out;
};

const IngresoDataRecepcionModal = ({
    open,
    onClose,
    onSave,
    columnas = [],
    form,
    setForm,
    isEdit = false,
}) => {
    const [colaboradoresLogistica, setColaboradoresLogistica] = useState([]);
    const [colaboradoresLaboratorio, setColaboradoresLaboratorio] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [transportadoras, setTransportadoras] = useState([]);
    const [productos, setProductos] = useState([]);
    const timeOptions = useMemo(() => buildTimeOptions(1), []);
    const [fieldErrors, setFieldErrors] = useState({});

    const { tanques } = useTanques();

    useEffect(() => {
        if (!open) return;

        const cargarDataMenuItemsSelect = async () => {
            try {
                const [{ data: personalData }, { data: conductoresData }, { data: transportadorasData }, { data: productosData }] = await Promise.all([
                    axios.get("https://ambiocomserver.onrender.com/api/personal"),
                    axios.get("https://ambiocomserver.onrender.com/api/conductores"),
                    axios.get("https://ambiocomserver.onrender.com/api/transportadoraslogistica"),
                    axios.get("https://ambiocomserver.onrender.com/api/alcoholesdespacho"),
                ]);

                const base = (Array.isArray(personalData) ? personalData : [])
                    .map((item) => {
                        const nombre = `${item?.nombres ?? ""} ${item?.apellidos ?? ""}`.trim();
                        return {
                            area: normalizarTexto(item?.area),
                            value: nombre,
                            label: nombre,
                        };
                    })
                    .filter((x) => x.value);

                const listaLogistica = base
                    .filter((x) => x.area === "LOGISTICA")
                    .sort((a, b) => a.label.localeCompare(b.label, "es"));

                const listaLaboratorio = base
                    .filter((x) => x.area === "LABORATORIO")
                    .sort((a, b) => a.label.localeCompare(b.label, "es"));

                const listaConductores = (Array.isArray(conductoresData) ? conductoresData : []).map((c) => {
                    const nombre = String(`${c?.nombres ?? ""} ${c?.apellidos ?? ""}`).trim();

                    return {
                        value: nombre,
                        label: `${nombre} - ${c?.placaVehiculo ?? ""} - ${c?.carroseria ?? ""}`.trim(),
                        placa: String(c?.placaVehiculo ?? "").trim(),
                        remolque: String(c?.remolque ?? c?.carroseria ?? "").trim(),
                    };
                });

                const listaTransportadoras = Array.from(
                    new Set(
                        (Array.isArray(transportadorasData) ? transportadorasData : [])
                            .map((x) => String(x?.nombreTransportadora ?? "").trim())
                            .filter(Boolean)
                    )
                )
                    .sort((a, b) => a.localeCompare(b, "es"))
                    .map((nombre) => ({
                        value: nombre,
                        label: nombre,
                    }));

                const listaProductos = (Array.isArray(productosData) ? productosData : [])
                    .map((p) => {
                        const nombre = String(
                            p?.producto ?? p?.nombreProducto ?? p?.nombre ?? ""
                        ).trim();

                        return {
                            value: nombre,
                            label: nombre,
                        };
                    })
                    .filter((x) => x.value)
                    .sort((a, b) => a.label.localeCompare(b.label, "es"));

                setColaboradoresLogistica(listaLogistica);
                setColaboradoresLaboratorio(listaLaboratorio);
                setConductores(listaConductores);
                setTransportadoras(listaTransportadoras);
                setProductos(listaProductos);
            } catch (error) {
                console.error("Error cargando personal/conductores:", error);
                setColaboradoresLogistica([]);
                setColaboradoresLaboratorio([]);
                setConductores([]);
                setTransportadoras([]);
                setProductos([]);
            }
        };

        cargarDataMenuItemsSelect();
    }, [open]);

    //CON ESTE effecto pongo por default el estado de En Proceso
    useEffect(() => {
        if (!open) return;
        if (isEdit) return;

        setForm((prev) => {
            const lecturas = prev?.lecturas ?? {};
            const actual = lecturas?.estado_vehiculo;

            if (actual != null && String(actual).trim() !== "") return prev;

            return {
                ...prev,
                lecturas: {
                    ...lecturas,
                    estado_vehiculo: "PROCESO",
                },
            };
        });
    }, [open, isEdit, setForm]);

    // funcion para validar el rango de la densidad y mostrar un helper
    const validateDensidad = (value) => {
        const text = String(value ?? "").trim();
        if (!text) return "";

        const n = Number(text.replace(",", "."));

        if (!Number.isFinite(n)) return "La densidad debe ser numérica";
        if (n < DENSIDAD_MIN || n > DENSIDAD_MAX) {
            return `El rango debe estar entre ${DENSIDAD_MIN} y ${DENSIDAD_MAX}`;
        }

        return "";
    };

    //memo para contexto de tanques 
    const tanquesArray = useMemo(() => {
        if (Array.isArray(tanques)) return tanques;
        if (Array.isArray(tanques?.data)) return tanques.data;
        if (Array.isArray(tanques?.tanques)) return tanques.tanques;
        return [];
    }, [tanques]);

    const tanquesOptions = useMemo(() => {
        return tanquesArray
            .map((t) => {
                const nombre = String(
                    t?.NombreTanque ?? t?.nombreTanque ?? t?.nombre_tanque ?? ""
                ).trim();

                const factor = String(
                    t?.factor ?? t?.Factor ?? t?.factorTanque ?? ""
                ).trim();

                return {
                    value: nombre,
                    label: factor ? `${nombre} - Factor: ${factor} L/cm` : nombre,
                    factor: Number(factor || 0),
                };
            })
            .filter((o) => o.value);
    }, [tanquesArray]);

    const handleChangeLectura = (key, value) => {
        setForm((prev) => {
            const nuevasLecturas = {
                ...(prev?.lecturas || {}),
                [key]: value,
            };

            const horaEntrada = nuevasLecturas["hora_ingreso"];
            const horaSalida = nuevasLecturas["hora_salida"];

            if (horaEntrada && horaSalida) {
                nuevasLecturas["tiempo_ambiocom"] = calcularTiempoAmbiocom(
                    horaEntrada,
                    horaSalida
                );
            }

            const nivelInicial = Number(nuevasLecturas?.nivel_inicial ?? 0);
            const nivelFinal = Number(nuevasLecturas?.nivel_final ?? 0);
            const factorTanque = Number(nuevasLecturas?.factor_tanque_recepcion ?? 0);

            if (
                ["nivel_inicial", "nivel_final", "tanque_recepcion"].includes(key) ||
                nuevasLecturas?.factor_tanque_recepcion !== undefined
            ) {
                nuevasLecturas["Volumen_Recepcionado"] = Number(
                    ((nivelFinal - nivelInicial) * factorTanque).toFixed(3)
                );
            }

            const basculaCliente = Number(nuevasLecturas?.peso_enviado_neto_puerto ?? 0);
            const basculaAmbiocom = Number(nuevasLecturas?.bascula_ambiocom ?? 0);

            if (["peso_enviado_neto_puerto", "bascula_ambiocom"].includes(key)) {
                nuevasLecturas["diferencia_peso"] = Number(
                    (basculaAmbiocom - basculaCliente).toFixed(3)
                );
            }

            const pesoProveedor = Number(nuevasLecturas?.peso_enviado_neto_puerto ?? 0);
            const densidadPuerto = Number(nuevasLecturas?.densidad_puerto ?? 0);

            if (["peso_enviado_neto_puerto", "densidad_puerto"].includes(key)) {
                nuevasLecturas["volumen_gravimetrico_proveedor"] =
                    densidadPuerto > 0
                        ? Number((pesoProveedor / densidadPuerto).toFixed(3))
                        : "";
            }

            const volumenRecibidoAmbiocom = Number(nuevasLecturas?.Volumen_Recepcionado ?? 0);
            const VolumenRecibidoDelCliente = Number(nuevasLecturas?.cantidad_recibida ?? 0);

            if (["Volumen_Recepcionado", "cantidad_recibida"].includes(key)) {
                nuevasLecturas["diferencia_volumen"] = Number(
                    (volumenRecibidoAmbiocom - VolumenRecibidoDelCliente).toFixed(3)
                );
            }

            if (["Volumen_Recepcionado", "cantidad_recibida"].includes(key)) {
                nuevasLecturas["error_volumen"] = Number(
                    (volumenRecibidoAmbiocom / VolumenRecibidoDelCliente).toFixed(3)
                );
            }
            if (["peso_enviado_neto_puerto", "bascula_ambiocom"].includes(key)) {
                nuevasLecturas["error_en_peso"] = Number(
                    (basculaAmbiocom / basculaCliente).toFixed(3)
                );
            }
            return {
                ...prev,
                lecturas: nuevasLecturas,
            };
        });
    };

    const handleGuardar = () => {
        const errors = {};

        const densidadError = validateDensidad(form?.lecturas?.[DENSIDAD_KEY]);
        if (densidadError) {
            errors[DENSIDAD_KEY] = densidadError;
        }

        const densidadPuertoError = validateDensidad(form?.lecturas?.["densidad_puerto"]);
        if (densidadPuertoError) {
            errors["densidad_puerto"] = densidadPuertoError;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const payload = {
            ...form,
            observaciones: String(form?.observaciones ?? "").trim(),
        };

        onSave(payload);
    };

    const getGridSize = (columna) => {
        const key = String(columna?.key || "").toLowerCase();

        if (key.includes("observ")) return { xs: 12, md: 12 };
        if (TIME_KEYS.includes(columna.key)) return { xs: 12, sm: 6, md: 4, lg: 3 };
        if (key.includes("responsable")) return { xs: 12, sm: 6, md: 6, lg: 4 };
        if (key.includes("fecha")) return { xs: 12, sm: 6, md: 4, lg: 3 };
        if (key.includes("hora")) return { xs: 12, sm: 6, md: 4, lg: 3 };
        if (key.includes("tiempo")) return { xs: 12, sm: 6, md: 4, lg: 3 };

        return { xs: 12, sm: 6, md: 4, lg: 3 };
    };

    const sanitizeIntegerInput = (value) => {
        return String(value ?? "").replace(/\D/g, "");
    };

    const responsableSeleccionado =
        colaboradoresLogistica.find(
            (c) => c.value === (form?.responsable ?? "")
        ) || null;

    const conductorSeleccionado =
        conductores.find(
            (c) => c.value === (form?.lecturas?.nombre_conductor ?? "")
        ) || null;

    const transportadoraSeleccionada =
        transportadoras.find(
            (t) => t.value === (form?.lecturas?.transportadora ?? "")
        ) || null;

    const productoSeleccionado =
        productos.find(
            (p) => p.value === (form?.lecturas?.producto ?? "")
        ) || null;

    const tanqueRecepcionSeleccionado =
        tanquesOptions.find(
            (t) => t.value === (form?.lecturas?.tanque_recepcion ?? "")
        ) || null;

    const faltaRemisionFactura = !String(form?.lecturas?.remision ?? "").trim();

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") return;
                onClose();
            }}
            fullWidth
            maxWidth="xl"
            scroll="paper"
            sx={{
                "& .MuiDialog-paper": {
                    width: "99%",
                    maxWidth: "1400px",
                    height: "90vh",
                    borderRadius: 2,
                    overflow: "hidden",
                },
            }}
        >
            <DialogTitle
                sx={{
                    pb: 1,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    background:
                        "linear-gradient(135deg, rgba(175, 235, 168, 0.65) 0%, rgba(187,222,251,0.95) 100%)",
                    flexShrink: 0,
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    {isEdit
                        ? "Editar Ingreso (Modo edición)"
                        : "Registrar Nuevo Ingreso a planta"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Registro de compra y recepción de alcoholes
                </Typography>
            </DialogTitle>

            <DialogContent
                sx={{
                    pt: 2.5,
                    overflowY: "auto",
                    backgroundColor: "#f8fafc",
                }}
            >
                <Box
                    sx={{
                        mb: 1,
                        mt: 1,
                        p: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        backgroundColor: "#fafbfc",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, fontWeight: 700, color: "#1A237E" }}
                    >
                        Datos generales
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha"
                                InputLabelProps={{ shrink: true }}
                                value={form?.fecha || ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        fecha: e.target.value,
                                    }))
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={8} lg={5}>
                            <Autocomplete
                                options={colaboradoresLogistica}
                                value={responsableSeleccionado}
                                onChange={(event, newValue) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        responsable: newValue?.value ?? "",
                                    }))
                                }
                                getOptionLabel={(option) => option?.label ?? ""}
                                isOptionEqualToValue={(option, value) =>
                                    option.value === value.value
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Responsable"
                                        placeholder="Selecciona colaborador de logística"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={4}>
                            <Autocomplete
                                options={conductores}
                                value={conductorSeleccionado}
                                inputValue={
                                    form?.lecturas?.nombre_conductor__input ??
                                    form?.lecturas?.nombre_conductor ??
                                    ""
                                }
                                getOptionLabel={(option) => option?.label ?? ""}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                onChange={(event, newValue) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        lecturas: {
                                            ...(prev?.lecturas || {}),
                                            nombre_conductor: newValue?.value ?? "",
                                            nombre_conductor__input: newValue?.label ?? newValue?.value ?? "",
                                            placa: newValue?.placa ?? "",
                                            remolque: newValue?.remolque ?? "",
                                        },
                                    }))
                                }
                                onInputChange={(event, newInputValue, reason) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        lecturas: {
                                            ...(prev?.lecturas || {}),
                                            nombre_conductor__input: newInputValue,
                                            ...(reason === "clear"
                                                ? {
                                                    nombre_conductor: "",
                                                    placa: "",
                                                    remolque: "",
                                                }
                                                : {}),
                                        },
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Conductor"
                                        placeholder="Selecciona conductor"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <TextField
                                fullWidth
                                label="Placa"
                                value={form?.lecturas?.placa ?? ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={2}>
                            <TextField
                                fullWidth
                                label="Remolque"
                                value={form?.lecturas?.remolque ?? ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={3}>
                            <Autocomplete
                                options={transportadoras}
                                value={transportadoraSeleccionada}
                                inputValue={
                                    form?.lecturas?.transportadora__input ??
                                    form?.lecturas?.transportadora ??
                                    ""
                                }
                                getOptionLabel={(option) => option?.label ?? ""}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                onChange={(event, newValue) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        lecturas: {
                                            ...(prev?.lecturas || {}),
                                            transportadora: newValue?.value ?? "",
                                            transportadora__input: newValue?.label ?? newValue?.value ?? "",
                                        },
                                    }))
                                }
                                onInputChange={(event, newInputValue, reason) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        lecturas: {
                                            ...(prev?.lecturas || {}),
                                            transportadora__input: newInputValue,
                                            ...(reason === "clear"
                                                ? {
                                                    transportadora: "",
                                                }
                                                : {}),
                                        },
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Transportadora"
                                        placeholder="Selecciona transportadora"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <Autocomplete
                                options={tanquesOptions}
                                value={tanqueRecepcionSeleccionado}
                                inputValue={
                                    form?.lecturas?.tanque_recepcion__input ??
                                    form?.lecturas?.tanque_recepcion ??
                                    ""
                                }
                                getOptionLabel={(option) => option?.label ?? ""}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                onChange={(event, newValue) =>
                                    setForm((prev) => {
                                        const lecturas = {
                                            ...(prev?.lecturas || {}),
                                            tanque_recepcion: newValue?.value ?? "",
                                            tanque_recepcion__input: newValue?.label ?? newValue?.value ?? "",
                                            factor_tanque_recepcion: newValue?.factor ?? "",
                                        };

                                        const nivelInicial = Number(lecturas?.nivel_inicial ?? 0);
                                        const nivelFinal = Number(lecturas?.nivel_final ?? 0);
                                        const factor = Number(newValue?.factor ?? 0);

                                        lecturas["Volumen_Recepcionado"] = Number(
                                            ((nivelFinal - nivelInicial) * factor).toFixed(3)
                                        );

                                        return {
                                            ...prev,
                                            lecturas,
                                        };
                                    })}
                                onInputChange={(event, newInputValue, reason) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        lecturas: {
                                            ...(prev?.lecturas || {}),
                                            tanque_recepcion__input: newInputValue,
                                            ...(reason === "clear"
                                                ? {
                                                    tanque_recepcion: "",
                                                }
                                                : {}),
                                        },
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Tanque de recepción"
                                        placeholder="Selecciona tanque"
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                </Box>

                <Box
                    sx={{
                        p: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, fontWeight: 700, color: "#1A237E" }}
                    >
                        Variables del ingreso
                    </Typography>

                    <Grid container spacing={2}>
                        {columnas.map((c) => {
                            const esNumero = c.tipo === "number";
                            const esTiempoCalculado = c.key?.toLowerCase().includes("tiempo");
                            const esHora = TIME_KEYS.includes(c.key);
                            const esObligatorio = REQUIRED_FIELDS.includes(c.key);
                            const esAnalista = ANALISTA_KEYS.includes(c.key);
                            const size = getGridSize(c);
                            const esVolumenRecepcionado = c.key === "Volumen_Recepcionado";
                            const esVolumenGravimetricoProveedor = c.key === "volumen_gravimetrico_proveedor";
                            const esDiferenciaPeso = c.key === "diferencia_peso";
                            const esDiferenciaVolumen = c.key === "diferencia_volumen";
                            const esErrorPeso = c.key === "error_en_peso";
                            const esErrorVolumen = c.key === "error_volumen";
                            const esEstadoVehiculo = c.key === "estado_vehiculo";
                            const esFleteFacturado = c.key === "flete_facturado";
                            const esProducto = c.key === "producto";

                            if (["nombre_conductor", "placa", "remolque", "transportadora", "tanque_recepcion"].includes(c.key)) {
                                return null;
                            }

                            if (esAnalista) {
                                const analistaSeleccionado =
                                    colaboradoresLaboratorio.find(
                                        (x) => x.value === (form?.lecturas?.[c.key] ?? "")
                                    ) || null;

                                return (
                                    <Grid item {...size} key={c.key}>
                                        <Autocomplete
                                            options={colaboradoresLaboratorio}
                                            value={analistaSeleccionado}
                                            onChange={(event, newValue) =>
                                                handleChangeLectura(c.key, newValue?.value ?? "")
                                            }
                                            getOptionLabel={(option) => option?.label ?? ""}
                                            isOptionEqualToValue={(option, value) =>
                                                option.value === value.value
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    label={`${c.nombre}${esObligatorio ? " *" : ""}${c.unidad ? ` (${c.unidad})` : ""
                                                        }`}
                                                    placeholder="Selecciona analista de laboratorio"
                                                />
                                            )}
                                        />
                                    </Grid>
                                );
                            }

                            if (esProducto) {
                                return (
                                    <Grid item {...size} key={c.key}>
                                        <Autocomplete
                                            options={productos}
                                            value={productoSeleccionado}
                                            inputValue={
                                                form?.lecturas?.producto__input ??
                                                form?.lecturas?.producto ??
                                                ""
                                            }
                                            getOptionLabel={(option) => option?.label ?? ""}
                                            isOptionEqualToValue={(option, value) =>
                                                option.value === value.value
                                            }
                                            onChange={(event, newValue) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    lecturas: {
                                                        ...(prev?.lecturas || {}),
                                                        producto: newValue?.value ?? "",
                                                        producto__input: newValue?.label ?? newValue?.value ?? "",
                                                    },
                                                }))
                                            }
                                            onInputChange={(event, newInputValue, reason) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    lecturas: {
                                                        ...(prev?.lecturas || {}),
                                                        producto__input: newInputValue,
                                                        ...(reason === "clear"
                                                            ? { producto: "" }
                                                            : {}),
                                                    },
                                                }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    label={`${c.nombre}${esObligatorio ? " *" : ""}`}
                                                    placeholder="Selecciona producto"
                                                />
                                            )}
                                        />
                                    </Grid>
                                );
                            }

                            if (esFleteFacturado) {
                                return (
                                    <Grid item {...size} key={c.key}>
                                        <Tooltip
                                            title={faltaRemisionFactura ? "Debe registrar remisión o factura asociada" : ""}
                                        >
                                            <Box
                                                sx={{
                                                    border: "1px solid rgba(0,0,0,0.23)",
                                                    borderRadius: 1,
                                                    px: 2,
                                                    minHeight: 56,
                                                    height: 56,
                                                    boxSizing: "border-box",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    backgroundColor: "#fff",
                                                    position: "relative",
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: "rgba(0,0,0,0.7)", fontWeight: 500 }}
                                                >
                                                    {c.nombre} ?
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        position: "relative",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={Boolean(form?.lecturas?.[c.key])}
                                                        onChange={(e) =>
                                                            handleChangeLectura(c.key, e.target.checked)
                                                        }
                                                        disabled={faltaRemisionFactura}
                                                    />

                                                    {faltaRemisionFactura && (
                                                        <WarningAmberRoundedIcon
                                                            sx={{
                                                                position: "absolute",
                                                                top: -5,
                                                                right: -14,
                                                                fontSize: 22,
                                                                color: "error.main",
                                                                backgroundColor: "#fff",
                                                                borderRadius: "50%",
                                                                zIndex: 2,
                                                                pointerEvents: "none",
                                                                animation: "alertBlink 1s infinite",
                                                                "@keyframes alertBlink": {
                                                                    "0%": { opacity: 1, transform: "scale(1)" },
                                                                    "50%": { opacity: 0.20, transform: "scale(1.18)" },
                                                                    "100%": { opacity: 1, transform: "scale(1)" },
                                                                },
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Tooltip>
                                    </Grid>
                                );
                            }
                            if (esHora) {
                                return (
                                    <Grid item {...size} key={c.key}>
                                        <Autocomplete
                                            freeSolo
                                            forcePopupIcon
                                            options={timeOptions}
                                            value={form?.lecturas?.[c.key] ?? ""}
                                            onChange={(event, newValue) => {
                                                handleChangeLectura(c.key, newValue ?? "");
                                            }}
                                            onInputChange={(event, newInputValue) => {
                                                handleChangeLectura(c.key, newInputValue);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    label={`${c.nombre}${esObligatorio ? " *" : ""}${c.unidad ? ` (${c.unidad})` : ""
                                                        }`}
                                                />
                                            )}
                                        />
                                    </Grid>
                                );
                            }

                            if (esEstadoVehiculo) {
                                const estadoSeleccionado =
                                    ESTADO_VEHICULO_OPTIONS.find(
                                        (x) => x.value === (form?.lecturas?.[c.key] ?? "")
                                    ) || null;

                                return (
                                    <Grid item {...size} key={c.key}>
                                        <Autocomplete
                                            options={ESTADO_VEHICULO_OPTIONS}
                                            value={estadoSeleccionado}
                                            onChange={(event, newValue) =>
                                                handleChangeLectura(c.key, newValue?.value ?? "")
                                            }
                                            getOptionLabel={(option) => option?.label ?? ""}
                                            isOptionEqualToValue={(option, value) =>
                                                option.value === value.value
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    label={`${c.nombre}${esObligatorio ? " *" : ""}`}
                                                    placeholder="Selecciona estado del vehículo"
                                                />
                                            )}
                                        />
                                    </Grid>
                                );
                            }

                            return (
                                <Grid item {...size} key={c.key}>
                                    <TextField
                                        fullWidth
                                        label={`${c.nombre}${esObligatorio ? " *" : ""}${c.unidad ? ` (${c.unidad})` : ""}`}
                                        type={esNumero ? "number" : "text"}
                                        value={form?.lecturas?.[c.key] ?? ""}
                                        disabled={esTiempoCalculado || esVolumenRecepcionado || esVolumenGravimetricoProveedor || esDiferenciaPeso || esDiferenciaVolumen || esErrorPeso || esErrorVolumen}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            value = value.replace(",", "."); // cambiar , por punto
                                            if (INTEGER_ONLY_KEYS.includes(c.key)) {
                                                value = sanitizeIntegerInput(value);
                                            }

                                            handleChangeLectura(c.key, value);

                                            if (c.key === DENSIDAD_KEY || c.key === DENSIDAD_PUERTO) {
                                                const msg = validateDensidad(value);

                                                setFieldErrors((prev) => {
                                                    const copy = { ...prev };
                                                    if (msg) copy[c.key] = msg;
                                                    else delete copy[c.key];
                                                    return copy;
                                                });
                                            }
                                        }}
                                        error={!!fieldErrors[c.key]}
                                        helperText={
                                            fieldErrors[c.key]
                                        }
                                        sx={{
                                            "& .MuiInputBase-root": {
                                                backgroundColor: esTiempoCalculado || esVolumenRecepcionado || esVolumenGravimetricoProveedor || esDiferenciaPeso || esDiferenciaVolumen || esErrorPeso || esErrorVolumen
                                                    ? "rgba(0,0,0,0.03)"
                                                    : "#fff",
                                            },
                                        }}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, fontWeight: 700, color: "#1A237E" }}
                    >
                        Observaciones
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Observaciones"
                                value={form?.observaciones ?? ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        observaciones: e.target.value,
                                    }))
                                }
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                    justifyContent: "space-between",
                    backgroundColor: "#fff",
                    flexShrink: 0,
                }}
            >
                <Button onClick={onClose}>Cancelar</Button>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                        variant="contained"
                        color="warning"
                        disabled={isEdit}
                        onClick={() =>
                            setForm({
                                fecha: "",
                                responsable: "",
                                observaciones: "",
                                lecturas: {},
                            })
                        }
                    >
                        Limpiar
                    </Button>

                    <Button variant="contained" onClick={handleGuardar} disabled={Object.values(fieldErrors).some(Boolean)}>
                        {isEdit ? "Actualizar" : "Guardar"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default IngresoDataRecepcionModal;