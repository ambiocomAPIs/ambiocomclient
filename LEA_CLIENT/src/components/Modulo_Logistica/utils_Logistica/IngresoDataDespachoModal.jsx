import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useAuth } from "../../../utils/Context/AuthContext/AuthContext";

const columnasBloqueadas = [
  "volumen_contador_gravimetrico",
  "volumen_ambiocom_contador",
  "diferencia_recibo_cliente",
  "dif_v_netodif_v_desp_bascula_ambiocom",
  "dif_kilos_neto",
  "peso_neto_contador_ambiocom",
  "variacion_peso",
  "variación_volumen",
  "tiempo_neto_cargue_despacho",
  "kilos_peso_neto",
  "diferencia_recibo_cliente_vnetofacturado",
];

const SELECT_KEYS = ["nombre_conductor", "cliente", "transportadora", "producto"];
const CACHE_PREFIX = "despacho_catalogo_";
const FORM_CACHE_PREFIX = "despacho_form_draft_";
const TIME_KEYS = ["hora_llegada", "hora_salida"];
const VEHICULO_RECHAZADO_KEY = "vehiculo_rechazado";
const VEHICULO_RECHAZADO_OPTIONS = ["SI", "NO", "EN TRANSITO", "APROBADO CON OBSERVACIONES", "EN CARGUE"];
const RESPONSABLE_RECIBO_ROLES = ["developer", "liderlogistica","auxiliarlogistica2"];  // permisos para editar responsable

// celdas que seran tipo select formato 8:00 15:30
const loadCacheMeta = (key) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return { data: [], updatedAt: 0 };

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { data: parsed, updatedAt: 0 };

    return {
      data: Array.isArray(parsed?.data) ? parsed.data : [],
      updatedAt: parsed?.updatedAt ?? 0,
      etag: parsed?.etag ?? null,
    };
  } catch {
    return { data: [], updatedAt: 0 };
  }
};

const saveCacheMeta = (key, payload) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (e) {
    console.warn("No se pudo guardar cache", key, e);
  }
};

const isStale = (updatedAt, minutes = 60) => {
  if (!updatedAt) return true;
  return Date.now() - updatedAt > minutes * 60 * 1000;
};

const saveCache = (key, data) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, updatedAt: Date.now() })
    );
  } catch (e) {
    console.warn("No se pudo guardar cache", key, e);
  }
};

const loadFormDraft = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveFormDraft = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo guardar draft", e);
  }
};

const clearFormDraft = (key) => {
  try {
    localStorage.removeItem(key);
  } catch { }
};

const normalizeOption = (opt) => {
  if (opt == null) return { value: "", label: "" };
  if (typeof opt === "string" || typeof opt === "number")
    return { value: String(opt), label: String(opt) };

  const value = opt.id ?? opt.value ?? opt.codigo ?? opt._id ?? "";
  const label = opt.nombre ?? opt.label ?? opt.descripcion ?? String(value);
  return { value: String(value), label: String(label) };
};

const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/\s/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf("."))
      s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    const parts = s.split(",");
    if (parts[1]?.length === 3) s = parts.join("");
    else s = s.replace(",", ".");
  } else if (hasDot) {
    const parts = s.split(".");
    if (parts[1]?.length === 3) s = parts.join("");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const round = (n, d = 3) => {
  const f = Math.pow(10, d);
  return Math.round((n + Number.EPSILON) * f) / f;
};

const parseHHMMToMinutes = (hhmm) => {
  const s = String(hhmm ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
};

const safeStr = (v) => (v == null ? "" : String(v));

const pad2 = (n) => String(n).padStart(2, "0");

const buildTimeOptions = (stepMinutes = 15) => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      out.push(`${h}:${pad2(m)}`);
    }
  }
  return out;
};

const FORMULAS = {
  volumen_contador_gravimetrico: (L) =>
    round(
      toNum(L.peso_neto_contador_ambiocom) /
      toNum(L.densidadlab_alcohol_tanque),
      3
    ),

  peso_neto_contador_ambiocom: (L) =>
    round(
      toNum(L.final_contador_ambiocom) - toNum(L.inicio_contador_ambiocom),
      3
    ),

  volumen_ambiocom_contador: (L) =>
    round(toNum(L.final_volumen_ambiocom) - L.inicio_volumen_ambiocom, 3),

  tiempo_neto_cargue_despacho: (L) => {
    const a = parseHHMMToMinutes(L.hora_llegada);
    const b = parseHHMMToMinutes(L.hora_salida);
    if (a == null || b == null) return "";
    const diff = b - a;
    if (diff < 0) return "";
    return round(diff / 60, 1);
  },

  kilos_peso_neto: (L) =>
    round(toNum(L.kilos_peso_final) - toNum(L.kilos_peso_inicial), 3),

  variacion_peso: (L) =>
    round(
      toNum(L.peso_neto_bascula_ambiocom) -
      toNum(L.peso_neto_contador_ambiocom),
      3
    ),

  variación_volumen: (L) =>
    round(
      toNum(L.volumen_ambiocom_contador) - toNum(L.volumen_despachar),
      3
    ),

  dif_kilos_neto: (L) =>
    round(toNum(L.variacion_peso) - toNum(L.kilos_peso_neto), 3),

  diferencia_recibo_cliente_vnetofacturado: (L) =>
    round(toNum(L.cantidad_recibida_cliente) - toNum(L.volumen_despachar), 3),

  diferencia_recibo_cliente: (L) =>
    round(
      toNum(L.cantidad_recibida_cliente_real) - toNum(L.cantidad_facturada),
      3
    ),

  dif_v_netodif_v_desp_bascula_ambiocom: (L) =>
    round(
      toNum(L.volumen_neto_diferencia) -
      toNum(L.volumen_despacho_bascula_ambiocom),
      3
    ),
};

const recalcBloqueadas = (lecturas) => {
  const next = { ...(lecturas ?? {}) };
  for (const key of columnasBloqueadas) {
    const fn = FORMULAS[key];
    if (!fn) continue;
    next[key] = fn(next);
  }
  return next;
};

const IngresoDataDespachoModal = ({
  open,
  onClose,
  onSave,
  columnas = [],
  form,
  setForm,
  isEdit = false,
  fetchConductores,
  fetchClientes,
  fetchTransportadoras,
}) => {
  // rol real desde cookie/session (AuthContext)
  const { rol, loadingAuth, isAuth } = useAuth();
  const roleNorm = String(rol || "").toLowerCase().trim();
  //evalua que roles pueden editar el campo
  const canEditResponsableRecibo = isAuth && RESPONSABLE_RECIBO_ROLES.includes(roleNorm);

  const [catalogos, setCatalogos] = useState({
    conductores: [],
    clientes: [],
    transportadoras: [],
    productos: [],
  });

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // const formCacheKey = `${FORM_CACHE_PREFIX}${form?.id ?? form?.id_despacho ?? "nuevo"}`;
  const formCacheKey = !isEdit
    ? `${FORM_CACHE_PREFIX}${form?.id ?? form?.id_despacho ?? "nuevo"}`
    : null;

  const timeOptions = useMemo(() => buildTimeOptions(15), []);

  const handleChangeLectura = (key, value) => {
    setForm((prev) => ({
      ...prev,
      lecturas: {
        ...prev.lecturas,
        [key]: value,
      },
    }));
  };

  const canRoleEditColumn = (col) => {
    // no auth / sin rol => bloquea todo
    if (!isAuth || !roleNorm) return false;

    // calculadas => siempre bloqueadas
    if (columnasBloqueadas.includes(col.key)) return false;

    // rolesDigitables viene de tu colección de columnas
    const roles = Array.isArray(col.rolesDigitables) ? col.rolesDigitables : [];
    return roles.map((r) => String(r).toLowerCase().trim()).includes(roleNorm);
  };

  const getItems = (key) => {
    if (key === "nombre_conductor") return catalogos.conductores;
    if (key === "cliente") return catalogos.clientes;
    if (key === "transportadora") return catalogos.transportadoras;
    if (key === "producto") return catalogos.productos;
    return [];
  };

  const refreshCatalogos = async () => {
    if (!fetchConductores || !fetchClientes || !fetchTransportadoras) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      const [conductoresRaw, clientesRaw, transportadorasRaw] =
        await Promise.all([
          fetchConductores(),
          fetchClientes(),
          fetchTransportadoras(),
        ]);

      const conductores = (conductoresRaw ?? []).map(normalizeOption);
      const clientes = (clientesRaw ?? []).map(normalizeOption);
      const transportadoras = (transportadorasRaw ?? []).map(normalizeOption);

      setCatalogos((prev) => ({
        ...prev,
        conductores,
        clientes,
        transportadoras,
      }));

      saveCache("conductores", conductores);
      saveCache("clientes", clientes);
      saveCache("transportadoras", transportadoras);
    } catch (e) {
      console.warn("Error refrescando catálogos, usando cache", e);
    }
  };

  const PRODUCTOS_URL = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";

  const mapProductosToOptions = (arr) =>
    (arr ?? []).map((p) => ({
      value: String(p?.tipoProducto ?? ""),
      label: String(p?.tipoProducto ?? ""),
    }));

  const refreshProductosTTL = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const cached = loadCacheMeta("productos");
    if (!isStale(cached.updatedAt, 60) && cached.data.length) return;

    try {
      const res = await axios.get(PRODUCTOS_URL);
      const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const productos = mapProductosToOptions(raw);

      setCatalogos((prev) => ({ ...prev, productos }));
      saveCacheMeta("productos", { data: productos, updatedAt: Date.now() });
    } catch (e) {
      console.warn("No pude refrescar productos, usando cache", e);
    }
  };

  useEffect(() => {
    if (!open) return;

    const conductores = loadCacheMeta("conductores").data;
    const clientes = loadCacheMeta("clientes").data;
    const transportadoras = loadCacheMeta("transportadoras").data;
    const productos = loadCacheMeta("productos").data;

    setCatalogos({ conductores, clientes, transportadoras, productos });

    if (!isEdit) {
      const draft = loadFormDraft(formCacheKey);
      if (draft) {
        setForm((prev) => ({
          ...prev,
          ...draft,
          lecturas: {
            ...(prev?.lecturas ?? {}),
            ...(draft?.lecturas ?? {}),
          },
        }));
      }
    }

    refreshCatalogos();
    refreshProductosTTL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "EN CARGUE" para vehiculo_rechazado en NUEVO
  useEffect(() => {
    if (!open) return;
    if (isEdit) return;

    setForm((prev) => {
      const lecturas = prev?.lecturas ?? {};
      const actual = lecturas?.[VEHICULO_RECHAZADO_KEY];

      // Si ya tiene valor (por draft o usuario), no lo piso
      if (actual != null && String(actual).trim() !== "") return prev;

      return {
        ...prev,
        lecturas: {
          ...lecturas,
          [VEHICULO_RECHAZADO_KEY]: "EN CARGUE",
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  // useEffect(() => {
  //   if (!open) return;
  //   const t = setTimeout(() => saveFormDraft(formCacheKey, form), 400);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [open, form, formCacheKey]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) return;            // ✅ no guardar draft en edición
    if (!formCacheKey) return;     // ✅ seguridad

    const t = setTimeout(() => saveFormDraft(formCacheKey, form), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, formCacheKey, isEdit]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (open) refreshCatalogos();
      if (open) refreshProductosTTL();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setForm((prev) => {
      const lecturasPrev = prev?.lecturas ?? {};
      const lecturasNext = recalcBloqueadas(lecturasPrev);

      let changed = false;
      for (const k of columnasBloqueadas) {
        if (safeStr(lecturasPrev?.[k]) !== safeStr(lecturasNext?.[k])) {
          changed = true;
          break;
        }
      }
      if (!changed) return prev;

      return { ...prev, lecturas: lecturasNext };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form?.lecturas]);

  const columnasOrdenadas = useMemo(() => columnas, [columnas]);

  const sxAllowed = {
    "& .MuiOutlinedInput-root fieldset": {
      borderWidth: 2,
      borderColor: "orange",
    },
    "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "orange" },
    "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "orange" },
  };

  const sxDisabled = { backgroundColor: "#f5f5f5" };

  const COLUMN_RENDER_ORDER = [
    "transportadora",
    "nombre_conductor",
    "placa",
    "remolque",
    "hora_llegada",
    "cliente",
    "producto",
    "__RESPONSABLE_RECIBO__",
    "operario_auxiliar_logistica",  // responsable cargue
    "volumen_despachar",
    "tanque_salida",
    "grado_alcoholico_lab",
    "densidadlab_alcohol_tanque",
    "vehiculo_rechazado",
    "agua_tratada",
    "brazo_despacho",
    "inicio_contador_ambiocom",
    "final_contador_ambiocom",
    "peso_neto_contador_ambiocom",
    "volumen_contador_gravimetrico",
    "inicio_volumen_ambiocom",
    "final_volumen_ambiocom",
    "volumen_ambiocom_contador",
    "temperatura_despacho_contador_ambiocom",
    "muestreador_analista_laboratorio",
    "numeracion_precintos_instalados",
    "peso_neto_bascula_ambiocom",
    "variacion_peso",
    "variación_volumen",
    "tiquete_bascula",
    "hora_salida",
    "responsable_despacho",
    "tiempo_neto_cargue_despacho",
    "orden_fabricacion",
    "remision_factura",
    "número_tornagia",
    "cantidad_recibida_cliente",
    "kilos_peso_inicial",
    "kilos_peso_final",
    "kilos_peso_neto",
    "diferencia_recibo_cliente_vnetofacturado",
    "diferencia_recibo_cliente",
    "dif_v_netodif_v_desp_bascula_ambiocom",
    "dif_kilos_neto",
    "costo_transporte",
    "factura_proveedor",
    "entrada_orden_compra",
    "__OBSERVACIONES__",
  ];

  const buildRenderPlan = (cols) => {
    const byKey = new Map((cols ?? []).map((c) => [c.key, c]));
    const used = new Set();

    const plan = [];

    // Primero, todo lo definido en tu secuencia
    for (const k of COLUMN_RENDER_ORDER) {
      if (k === "__RESPONSABLE_RECIBO__") {
        plan.push({ type: "fixed_responsable" });
        continue;
      }
      if (k === "__OBSERVACIONES__") {
        plan.push({ type: "fixed_observaciones" });
        continue;
      }

      const col = byKey.get(k);
      if (col) {
        plan.push({ type: "col", col });
        used.add(k);
      }
    }

    // si hay columnas nuevas, que no estan definidas en la secuencia, listar despues de..
    for (const c of cols ?? []) {
      if (!used.has(c.key)) plan.push({ type: "col", col: c });
    }

    return plan;
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          width: "80%",
          maxWidth: "none",
          margin: "auto",
        },
      }}
    >
      <DialogTitle>
        {isEdit ? "Editar Despacho" : "Nuevo Despacho"}
        {!isOnline ? " (sin internet)" : ""}
      </DialogTitle>

      <DialogContent>
        {/* ✅ mientras el AuthContext resuelve /me */}
        {loadingAuth ? (
          <Box py={2}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Cargando sesión...
            </Typography>
          </Box>
        ) : (
          <>
            {!isAuth || !roleNorm ? (
              <Box py={2}>
                <Typography variant="body2" color="error">
                  No hay sesión válida. No se puede editar.
                </Typography>
              </Box>
            ) : (
              <Box pb={1}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Rol logueado: <b>{roleNorm}</b>
                </Typography>
              </Box>
            )}

            <Grid container spacing={1} mt={1}>
              {/* ✅ 1) Fecha SIEMPRE primero */}
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={form.fecha || ""}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </Grid>

              {/* ✅ 2) Render ordenado según la secuencia */}
              {buildRenderPlan(columnasOrdenadas).map((item, idx) => {
                if (item.type === "fixed_responsable") {
                  const isDisabled = !canEditResponsableRecibo;
                  const sxField = !isDisabled ? sxAllowed : sxDisabled;
                  return (
                    <Grid item xs={6} md={2} key={`fixed_responsable_${idx}`}>
                      <TextField
                        fullWidth
                        label="Responsable de recibo"
                        value={form.responsable || ""}
                        onChange={(e) => {
                          if (isDisabled) return;
                          setForm({ ...form, responsable: e.target.value });
                        }}
                        disabled={isDisabled}
                        sx={sxField}
                      />
                    </Grid>
                  );
                }

                if (item.type === "fixed_observaciones") {
                  return (
                    <Grid item xs={12} md={12} key={`fixed_observaciones_${idx}`}>
                      <TextField
                        fullWidth
                        label="Observaciones"
                        value={form.observaciones || ""}
                        onChange={(e) =>
                          setForm({ ...form, observaciones: e.target.value })
                        }
                      />
                    </Grid>
                  );
                }

                const c = item.col;

                const esSelect = SELECT_KEYS.includes(c.key);
                const esHora = TIME_KEYS.includes(c.key);
                const esVehiculoRechazado = c.key === VEHICULO_RECHAZADO_KEY;
                const items = esSelect ? getItems(c.key) : [];

                const allowedByRole = canRoleEditColumn(c);
                const isDisabled = !allowedByRole;

                const sxField = allowedByRole ? sxAllowed : sxDisabled;

                return (
                  <Grid item xs={12} md={2} key={c.key}>
                    {esSelect ? (
                      <Autocomplete
                        freeSolo
                        forcePopupIcon
                        options={items}
                        getOptionLabel={(option) =>
                          typeof option === "string"
                            ? option
                            : option.label ?? option.value ?? ""
                        }
                        value={
                          items.find((opt) => opt.value === form.lecturas?.[c.key]) ||
                          form.lecturas?.[c.key] ||
                          ""
                        }
                        onChange={(event, newValue) => {
                          if (isDisabled) return;
                          if (typeof newValue === "string")
                            handleChangeLectura(c.key, newValue);
                          else handleChangeLectura(c.key, newValue?.value || "");
                        }}
                        onInputChange={(event, newInputValue) => {
                          if (isDisabled) return;
                          handleChangeLectura(c.key, newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={c.nombre}
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                          />
                        )}
                      />
                    ) : esHora ? (
                      <Autocomplete
                        freeSolo
                        forcePopupIcon
                        options={timeOptions}
                        value={form.lecturas?.[c.key] ?? ""}
                        onChange={(event, newValue) => {
                          if (isDisabled) return;
                          handleChangeLectura(c.key, newValue ?? "");
                        }}
                        onInputChange={(event, newInputValue) => {
                          if (isDisabled) return;
                          handleChangeLectura(c.key, newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={c.nombre}
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                          />
                        )}
                      />
                    ) : esVehiculoRechazado ? (
                      <Autocomplete
                        disableClearable
                        forcePopupIcon
                        options={VEHICULO_RECHAZADO_OPTIONS}
                        value={form.lecturas?.[c.key] ?? "EN CARGUE"}
                        onChange={(event, newValue) => {
                          if (isDisabled) return;
                          handleChangeLectura(c.key, newValue ?? "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={c.nombre}
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                          />
                        )}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label={c.nombre}
                        type="text"
                        value={form.lecturas?.[c.key] ?? ""}
                        onChange={(e) => {
                          if (isDisabled) return;
                          handleChangeLectura(c.key, e.target.value);
                        }}
                        disabled={isDisabled}
                        sx={sxField}
                      />
                    )}
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>

        <Button
          disabled={isEdit}
          variant="contained"
          color="warning"
          onClick={() => {
            if (formCacheKey) clearFormDraft(formCacheKey);
            setForm((prev) => ({
              ...prev,
              lecturas: recalcBloqueadas({}),
              observaciones: "",
              responsable: "",
              fecha: "",
            }));
          }}
        >
          Limpiar
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            if (formCacheKey) clearFormDraft(formCacheKey);
            onSave();
          }}
          disabled={loadingAuth || !isAuth} // opcional: bloquear guardar sin sesión
        >
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngresoDataDespachoModal;