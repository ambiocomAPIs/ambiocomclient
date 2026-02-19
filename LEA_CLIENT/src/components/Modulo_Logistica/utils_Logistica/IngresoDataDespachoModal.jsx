import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

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
  // "cantidad_recibida_cliente",
  "kilos_peso_neto",
  "diferencia_recibo_cliente_vnetofacturado",
];

const SELECT_KEYS = ["nombre_conductor", "cliente", "transportadora"];
const CACHE_PREFIX = "despacho_catalogo_";
const FORM_CACHE_PREFIX = "despacho_form_draft_";

const loadCache = (key) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // soporta {data, updatedAt} o array directo
    return Array.isArray(parsed) ? parsed : parsed?.data ?? [];
  } catch {
    return [];
  }
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
  } catch {}
};

const normalizeOption = (opt) => {
  // Ajusta aquí si tu backend trae otra forma
  // soporta: {id,nombre} | {value,label} | string
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

  // quitar espacios
  s = s.replace(/\s/g, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // el último símbolo es el decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // 1.234,56  → decimal es coma
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56  → decimal es punto
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // solo coma → decidir si es decimal o miles
    const parts = s.split(",");
    if (parts[1]?.length === 3) {
      // probablemente miles → 1,234
      s = parts.join("");
    } else {
      // decimal → 123,45
      s = s.replace(",", ".");
    }
  } else if (hasDot) {
    const parts = s.split(".");
    if (parts[1]?.length === 3) {
      // miles → 1.234
      s = parts.join("");
    }
    // si no, se asume decimal
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

    return round(diff / 60, 1); // horas con 1 decimales
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
    round(toNum(L.volumen_ambiocom_contador) - toNum(L.volumen_despachar), 3),

  dif_kilos_neto: (L) =>
    round(toNum(L.variacion_peso) - toNum(L.kilos_peso_neto), 3),

  diferencia_recibo_cliente_vnetofacturado: (L) =>
    round(toNum(L.cantidad_recibida_cliente) - toNum(L.volumen_despachar), 3),

  //aun no
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

  // cantidad_recibida_cliente: (L) => {
  //   const v = L.cantidad_recibida_cliente_real ?? L.cantidad_recibida_cliente;
  //   return v == null ? "" : v;
  // },
};

const recalcBloqueadas = (lecturas) => {
  const next = { ...(lecturas ?? {}) };
  for (const key of columnasBloqueadas) {
    const fn = FORMULAS[key];
    if (!fn) continue;
    const computed = fn(next);
    next[key] = computed;
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

  // ✅ Pásalas cuando conectes backend (pueden ser undefined por ahora)
  fetchConductores, // async () => [...]
  fetchClientes, // async () => [...]
  fetchTransportadoras, // async () => [...]
}) => {
  const [catalogos, setCatalogos] = useState({
    conductores: [],
    clientes: [],
    transportadoras: [],
  });

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const formCacheKey = `${FORM_CACHE_PREFIX}${
    form?.id ?? form?.id_despacho ?? "nuevo"
  }`;

  const handleChangeLectura = (key, value) => {
    setForm((prev) => ({
      ...prev,
      lecturas: {
        ...prev.lecturas,
        [key]: value,
      },
    }));
  };

  const getItems = (key) => {
    if (key === "nombre_conductor") return catalogos.conductores;
    if (key === "cliente") return catalogos.clientes;
    if (key === "transportadora") return catalogos.transportadoras;
    return [];
  };

  const refreshCatalogos = async () => {
    // si no hay funciones aún, no hacemos nada
    if (!fetchConductores || !fetchClientes || !fetchTransportadoras) return;

    // si no hay internet, evita el intento (igual podrías intentar y que falle)
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

      setCatalogos({ conductores, clientes, transportadoras });

      saveCache("conductores", conductores);
      saveCache("clientes", clientes);
      saveCache("transportadoras", transportadoras);
    } catch (e) {
      console.warn("Error refrescando catálogos, usando cache", e);
    }
  };

  // ✅ 1) cuando abre, cargar cache inmediatamente + refrescar si se puede
  useEffect(() => {
    if (!open) return;
  
    const conductores = loadCache("conductores");
    const clientes = loadCache("clientes");
    const transportadoras = loadCache("transportadoras");
  
    setCatalogos({ conductores, clientes, transportadoras });
  
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
  }, [open]);  

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      saveFormDraft(formCacheKey, form);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, formCacheKey]);

  // ✅ 2) listener online/offline para reintentar cuando vuelva el internet
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (open) refreshCatalogos();
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

      return {
        ...prev,
        lecturas: lecturasNext,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form?.lecturas]);

  const columnasOrdenadas = useMemo(() => columnas, [columnas]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <Grid container spacing={1} mt={1}>
          {/* 🔹 Campos dinámicos */}
          {columnasOrdenadas.map((c) => {
            const isDisabled = columnasBloqueadas.includes(c.key);
            const esSelect = SELECT_KEYS.includes(c.key);
            const items = esSelect ? getItems(c.key) : [];

            return (
              <Grid item xs={12} md={2} key={c.key}>
                {esSelect ? (
                  <Autocomplete
  freeSolo
  forcePopupIcon={true}   // 👈 esto obliga a mostrar la flecha
  options={items}
  getOptionLabel={(option) =>
    typeof option === "string" ? option : option.label
  }
  value={
    items.find((opt) => opt.value === form.lecturas?.[c.key]) ||
    form.lecturas?.[c.key] ||
    ""
  }
  onChange={(event, newValue) => {
    if (typeof newValue === "string") {
      handleChangeLectura(c.key, newValue);
    } else {
      handleChangeLectura(c.key, newValue?.value || "");
    }
  }}
  onInputChange={(event, newInputValue) => {
    handleChangeLectura(c.key, newInputValue);
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label={c.nombre}
      fullWidth
      disabled={isDisabled}
    />
  )}
/>

                ) : (
                  <TextField
                    fullWidth
                    label={c.nombre}
                    type="text"
                    value={form.lecturas?.[c.key] ?? ""}
                    onChange={(e) => handleChangeLectura(c.key, e.target.value)}
                    disabled={isDisabled}
                    sx={{
                      backgroundColor: isDisabled ? "#f5f5f5" : "inherit",
                    }}
                  />
                )}
              </Grid>
            );
          })}

          {/* 🔹 Campos fijos */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              value={form.observaciones || ""}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Responsable"
              value={form.responsable || ""}
              onChange={(e) =>
                setForm({ ...form, responsable: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              InputLabelProps={{ shrink: true }}
              value={form.fecha || ""}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            clearFormDraft(formCacheKey);
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
            clearFormDraft(formCacheKey);
            onSave();
          }}
        >
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngresoDataDespachoModal;
