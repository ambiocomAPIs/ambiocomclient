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
  Checkbox,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Autocomplete from "@mui/material/Autocomplete";
//Contextos
import { useAuth } from "../../../../../utils/Context/AuthContext/AuthContext";
import { useTanques } from "../../../../../utils/Context/TanquesContext";

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

const PERSONAL_ANALISTA_KEY = "muestreador_analista_laboratorio"; // personal lab para el select
const PERSONAL_LOGISTICA_KEYS = [
  "operario_auxiliar_logistica",
  "responsable_despacho",
]; // personal logistica para el select

const SELECT_KEYS = [
  "nombre_conductor",
  "cliente",
  "transportadora",
  "producto",
  PERSONAL_ANALISTA_KEY,
  ...PERSONAL_LOGISTICA_KEYS,
];
const CACHE_PREFIX = "despacho_catalogo_";
const FORM_CACHE_PREFIX = "despacho_form_draft_";
const TIME_KEYS = ["hora_llegada", "hora_salida"];
const VEHICULO_RECHAZADO_KEY = "vehiculo_rechazado";
const VEHICULO_RECHAZADO_OPTIONS = [
  "SI",
  "NO",
  "EN TRANSITO",
  "EN CLIENTE",
  "APROBADO CON OBSERVACIONES",
  "RECHAZADO POR CLIENTE",
  "EN CARGUE",
];
const RESPONSABLE_RECIBO_ROLES = [
  "developer",
  "liderlogistica",
  "auxiliarlogistica2",
]; // permisos para editar responsable
const LLEGADA_DESTINO_KEY = "llegada_destino";
const LLEGADA_DESTINO_OPTIONS = ["PUNTUAL", "RETRASADO"]; // select para modal de registro de datos
const REQUIRED_FIELDS = ["fecha", "responsable", "observaciones"]; // campos obligatorios minimos para crear un registro

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
      toNum(L.densidadlab_alcohol_tanque) === 0
        ? 0.0001
        : toNum(L.peso_neto_contador_ambiocom) /
        toNum(L.densidadlab_alcohol_tanque),
      3
    ),

  peso_neto_contador_ambiocom: (L) =>
    round(
      toNum(L.final_contador_ambiocom) - toNum(L.inicio_contador_ambiocom),
      3
    ),

  volumen_ambiocom_contador: (L) =>
    round(
      toNum(L.final_volumen_ambiocom) - toNum(L.inicio_volumen_ambiocom),
      3
    ),

  tiempo_neto_cargue_despacho: (L) => {
    const a = parseHHMMToMinutes(L.hora_llegada);
    const b = parseHHMMToMinutes(L.hora_salida);
    if (a == null || b == null) return 0;
    const diff = b - a;
    if (diff < 0) return 0;
    return round(diff / 60, 1);
  },

  kilos_peso_neto: (L) =>
    round(toNum(L.kilos_peso_inicial) - toNum(L.kilos_peso_final), 3),

  variacion_peso: (L) =>
    round(
      toNum(L.peso_neto_bascula_ambiocom) -
      toNum(L.peso_neto_contador_ambiocom),
      3
    ),

  variación_volumen: (L) =>
    round(toNum(L.volumen_ambiocom_contador) - toNum(L.volumen_despachar), 3),

  dif_kilos_neto: (L) =>
    round(
      toNum(L.kilos_peso_inicial) -
      toNum(L.kilos_peso_final) -
      toNum(L.peso_neto_bascula_ambiocom),
      3
    ),

  diferencia_recibo_cliente_vnetofacturado: (L) =>
    round(toNum(L.cantidad_recibida_cliente) - toNum(L.volumen_despachar), 3),

  diferencia_recibo_cliente: (L) =>
    round(
      toNum(L.densidadlab_alcohol_tanque) === 0
        ? 0.0001
        : toNum(L.cantidad_recibida_cliente) - toNum(L.peso_neto_contador_ambiocom) /
        toNum(L.densidadlab_alcohol_tanque)
      ,
      3
    ),

  dif_v_netodif_v_desp_bascula_ambiocom: (L) =>
    round(
      toNum(L.cantidad_recibida_cliente) === 0
        ? 0.0001
        : toNum(L.volumen_ambiocom_contador) /
        toNum(L.cantidad_recibida_cliente),
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
}) => {
  const CLIENTES_URL = "https://ambiocomserver.onrender.com/api/clienteslogistica";
  const TRANSPORTADORAS_URL = "https://ambiocomserver.onrender.com/api/transportadoraslogistica";
  const PRODUCTOS_URL = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";

  // =============   Contextos   ===============================
  // rol real desde cookie/session (AuthContext)
  const { rol, loadingAuth, isAuth } = useAuth();
  const { tanques, loading: loadingTanques } = useTanques();
  //============================================================
  const roleNorm = String(rol || "")
    .toLowerCase()
    .trim();
  //evalua que roles pueden editar el campo
  const canEditResponsableRecibo =
    isAuth && RESPONSABLE_RECIBO_ROLES.includes(roleNorm);

  const [fieldErrors, setFieldErrors] = useState({});
  const [catalogos, setCatalogos] = useState({
    conductores: [],
    clientes: [],
    transportadoras: [],
    productos: [],
    personalAnalistas: [],
    personalLogistica: [],
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

  //tanques desde el contexto para el select

  const tanquesArray = useMemo(() => {
    // por si el contexto trae: []  o  {data: []}  o  {tanques: []}
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
        return { value: nombre, label: nombre };
      })
      .filter((o) => o.value);
  }, [tanquesArray]);

  // *****  Cuando son mezcla de tanques, crear un string con el nombre de los tanques **************
  const parseTanquesString = (v) => {
    // Acepta: "301/801A" o "M-301/801A"
    const s = String(v ?? "").trim();
    if (!s) return [];
    const withoutPrefix = s.startsWith("M-") ? s.slice(2) : s;
    return withoutPrefix
      .split("/")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const buildTanquesString = (names) => {
    const clean = (names ?? [])
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);

    if (clean.length === 0) return "";
    if (clean.length === 1) return clean[0];
    return `M-${clean.join("/")}`;
  };

  const selectedTanques = useMemo(() => {
    const names = parseTanquesString(form?.lecturas?.tanque_salida);
    const byValue = new Map(tanquesOptions.map((o) => [o.value, o]));
    return names.map((n) => byValue.get(n) ?? { value: n, label: n });
  }, [form?.lecturas?.tanque_salida, tanquesOptions]);
  // ****************************************************************
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
    if (key === PERSONAL_ANALISTA_KEY) return catalogos.personalAnalistas ?? [];
    if (PERSONAL_LOGISTICA_KEYS.includes(key))
      return catalogos.personalLogistica ?? [];
    return [];
  };

  // helper para validar digitacion en celdas con select
  const validateSelectValue = (key, inputValue, options) => {
    const text = String(inputValue ?? "").trim();
    if (!text) return "";

    const exists = (options ?? []).some(
      (opt) =>
        String(opt?.value ?? "").trim().toLowerCase() === text.toLowerCase() ||
        String(opt?.label ?? "").trim().toLowerCase() === text.toLowerCase()
    );

    return exists ? "" : "El valor debe ser seleccionado";
  };

  const setFieldError = (key, message) => {
    setFieldErrors((prev) => ({
      ...prev,
      [key]: message,
    }));
  };

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const refreshCatalogos = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      const [conductoresRaw, clientesRaw, transportadorasRaw] =
        await Promise.all([
          axios.get("https://ambiocomserver.onrender.com/api/conductores"),
          axios.get(CLIENTES_URL),
          axios.get(TRANSPORTADORAS_URL),
        ]);

      const conductores = (conductoresRaw.data ?? []).map((c) => {
        const nombre = String(`${c.nombres ?? ""} ${c.apellidos ?? ""}`).trim();

        return {
          value: nombre, // lo que guardas en lecturas.nombre_conductor
          label: `${nombre} - ${c.placaVehiculo ?? ""} - ${c.carroseria ?? ""
            }`.trim(),
          placa: String(c.placaVehiculo ?? "").trim(),
          remolque: String(c.remolque ?? c.placaRemolque ?? "").trim(), // ajusta al nombre real en tu API
          carroceria: String(c.carroseria ?? "").trim(),
        };
      });

      // ✅ SOLO el campo "cliente" (y quitar duplicados)
      const clientesDB = Array.isArray(clientesRaw.data)
        ? clientesRaw.data
        : [];
      const clientes = Array.from(
        new Set(
          clientesDB.map((x) => String(x?.cliente ?? "").trim()).filter(Boolean)
        )
      )
        .sort((a, b) => a.localeCompare(b, "es"))
        .map((name) => ({ value: name, label: name }));

      const transportadorasDB = Array.isArray(transportadorasRaw.data)
        ? transportadorasRaw.data
        : [];

      const transportadoras = Array.from(
        new Set(
          transportadorasDB
            .map((x) => String(x?.nombreTransportadora ?? "").trim())
            .filter(Boolean)
        )
      )
        .sort((a, b) => a.localeCompare(b, "es"))
        .map((name) => ({ value: name, label: name }));

      setCatalogos((prev) => ({
        ...prev,
        conductores,
        clientes,
        transportadoras,
      }));

      // si el conductor actual no existe, lo limpia (tu lógica)
      setForm((prev) => {
        const actual = prev?.lecturas?.nombre_conductor ?? "";
        const existe = conductores.some((c) => c.value === actual);
        if (existe) return prev;
        return {
          ...prev,
          lecturas: { ...prev.lecturas, nombre_conductor: "" },
        };
      });

      // ✅ cache
      saveCache("conductores", conductores);
      saveCache("clientes", clientes);
      saveCache("transportadoras", transportadoras);
    } catch (e) {
      console.warn("Error refrescando catálogos, usando cache", e);
    }
  };

  const refreshPersonal = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      const res = await axios.get("https://ambiocomserver.onrender.com/api/personal");
      const personal = Array.isArray(res.data) ? res.data : [];

      // OJO: usa exactamente los valores de tu BD
      const personalAnalistas = personal
        .filter((p) => String(p.area ?? "").trim() === "Laboratorio")
        .map((p) => {
          const n = String(p?.nombres ?? "").trim();
          return { value: n, label: n };
        })
        .filter((o) => o.value);

      const personalLogistica = personal
        .filter((p) => String(p.area ?? "").trim() === "Logistica")
        .map((p) => {
          const n = String(p?.nombres ?? "").trim();
          return { value: n, label: n };
        })
        .filter((o) => o.value);

      setCatalogos((prev) => ({
        ...prev,
        personalAnalistas,
        personalLogistica,
      }));

      setForm((prev) => {
        const lect = prev?.lecturas ?? {};
        const next = { ...lect };

        const exists = (opts, v) => (opts ?? []).some((o) => o.value === v);

        // analistas
        if (
          next[PERSONAL_ANALISTA_KEY] &&
          !exists(personalAnalistas, next[PERSONAL_ANALISTA_KEY])
        ) {
          next[PERSONAL_ANALISTA_KEY] = "";
        }

        // logistica
        for (const k of PERSONAL_LOGISTICA_KEYS) {
          if (next[k] && !exists(personalLogistica, next[k])) {
            next[k] = "";
          }
        }

        return { ...prev, lecturas: next };
      });
    } catch (e) {
      console.warn("Error refrescando personal", e);
    }
  };

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

    setCatalogos((prev) => ({
      ...prev,
      conductores,
      clientes,
      transportadoras,
      productos,
    }));

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
    refreshPersonal();
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

  useEffect(() => {
    if (!open) return;

    setForm((prev) => {
      const lecturas = prev?.lecturas ?? {};
      const actual = lecturas?.[LLEGADA_DESTINO_KEY];

      // Si ya tiene valor, no lo piso
      if (actual != null && String(actual).trim() !== "") return prev;

      return {
        ...prev,
        lecturas: {
          ...lecturas,
          [LLEGADA_DESTINO_KEY]: "PUNTUAL",
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // useEffect(() => {
  //   if (!open) return;
  //   const t = setTimeout(() => saveFormDraft(formCacheKey, form), 400);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [open, form, formCacheKey]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) return; // ✅ no guardar draft en edición
    if (!formCacheKey) return; // ✅ seguridad

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
    "operario_auxiliar_logistica", // responsable cargue
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
    "llegada_destino",
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
          {isEdit ? "Editar Despacho (Modo edición)" : "Registrar un Nuevo Despacho"}
          {!isOnline ? " (sin internet)" : ""}
        </Typography>

        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          Registro y control de despacho de alcoholes
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2.5,
          overflowY: "auto",
          backgroundColor: "#f8fafc",
        }}
      >        {/* ✅ mientras el AuthContext resuelve /me */}
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
              <></>
            )}

            <Grid container spacing={1} mt={1}>
              {/* ✅ 1) Fecha SIEMPRE primero */}
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha *"
                  InputLabelProps={{ shrink: true }}
                  value={form.fecha || ""}
                  onChange={(e) => {
                    setForm({ ...form, fecha: e.target.value });

                    if (e.target.value) {
                      clearFieldError("fecha");
                    }
                  }}
                  error={!!fieldErrors.fecha}
                  helperText={fieldErrors.fecha || ""}
                />
              </Grid>

              {buildRenderPlan(columnasOrdenadas).map((item, idx) => {
                if (item.type === "fixed_responsable") {
                  const isDisabled = !canEditResponsableRecibo;
                  const sxField = !isDisabled ? sxAllowed : sxDisabled;

                  const options = catalogos.personalLogistica ?? [];

                  const valueObj =
                    options.find(
                      (opt) => opt.value === (form.responsable ?? "")
                    ) || null;

                  return (
                    <Grid item xs={6} md={2} key={`fixed_responsable_${idx}`}>
                      <Autocomplete
                        disableClearable={false}
                        forcePopupIcon
                        options={options}
                        value={valueObj}
                        inputValue={form?.responsable__input ?? form?.responsable ?? ""}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) => option?.label ?? ""}
                        onChange={(event, newValue) => {
                          if (isDisabled) return;

                          setForm((prev) => ({
                            ...prev,
                            responsable: newValue?.value ?? "",
                            responsable__input: newValue?.label ?? newValue?.value ?? "",
                          }));

                          if (newValue?.value) {
                            clearFieldError("responsable");
                          } else {
                            setFieldError("responsable", "El responsable es obligatorio");
                          }
                        }}
                        onInputChange={(event, newInputValue, reason) => {
                          if (isDisabled) return;

                          setForm((prev) => ({
                            ...prev,
                            responsable__input: newInputValue,
                          }));

                          if (reason === "input") {
                            const msg = validateSelectValue("responsable", newInputValue, options);
                            if (msg) setFieldError("responsable", msg);
                            else clearFieldError("responsable");
                          }

                          if (reason === "clear") {
                            setForm((prev) => ({
                              ...prev,
                              responsable: "",
                              responsable__input: "",
                            }));
                            setFieldError("responsable", "El responsable es obligatorio");
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Responsable de recibo *"
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                            error={!!fieldErrors.responsable}
                            helperText={fieldErrors.responsable || " "}
                          />
                        )}
                      />
                    </Grid>
                  );
                }

                if (item.type === "fixed_observaciones") {
                  return (
                    <Grid item xs={12} key={`fixed_observaciones_${idx}`}>
                      <Box
                        sx={{
                          mt: 1,
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
                          Observaciones
                        </Typography>

                        <TextField
                          fullWidth
                          multiline
                          minRows={4}
                          label="Observaciones *"
                          value={form.observaciones ?? ""}
                          onChange={(e) => {
                            setForm({ ...form, observaciones: e.target.value });

                            if (e.target.value.trim()) {
                              clearFieldError("observaciones");
                            }
                          }}
                          error={!!fieldErrors.observaciones}
                          helperText={fieldErrors.observaciones || ""}
                          sx={{
                            "& .MuiInputBase-root": {
                              backgroundColor: "#fff",
                              alignItems: "flex-start",
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                }

                const c = item.col;

                const esSelect = SELECT_KEYS.includes(c.key);
                const esHora = TIME_KEYS.includes(c.key);
                const esVehiculoRechazado = c.key === VEHICULO_RECHAZADO_KEY; // evalua si fue rechazado
                const esLlegadaDestino = c.key === LLEGADA_DESTINO_KEY; // evalua si llego al destino el vehiculo
                const esTanqueSalida = c.key === "tanque_salida"; // evalua que la lista select se renderizara en la columna con esta key
                const items = esSelect ? getItems(c.key) : [];
                const esNombreConductor = c.key === "nombre_conductor";
                const isRequired = (key) => REQUIRED_FIELDS.includes(key); // campos requeridos

                const allowedByRole = canRoleEditColumn(c);
                const isDisabled = !allowedByRole;

                const sxField = allowedByRole ? sxAllowed : sxDisabled;

                return (
                  <Grid item xs={12} md={2} key={c.key}>
                    {esNombreConductor ? (
                      <Autocomplete
                        forcePopupIcon
                        options={catalogos.conductores || []}
                        value={
                          catalogos.conductores.find(
                            (opt) => opt.value === form.lecturas?.nombre_conductor
                          ) || null
                        }
                        inputValue={
                          form.lecturas?.nombre_conductor__input ??
                          form.lecturas?.nombre_conductor ??
                          ""
                        }
                        getOptionLabel={(option) => option?.label ?? ""}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        onChange={(event, newValue) => {
                          if (isDisabled) return;

                          const conductor = newValue || null;

                          setForm((prev) => ({
                            ...prev,
                            lecturas: {
                              ...prev.lecturas,
                              nombre_conductor: conductor?.value ?? "",
                              nombre_conductor__input:
                                conductor?.label ?? conductor?.value ?? "",
                              placa: conductor?.placa ?? "",
                              remolque: conductor?.carroceria ?? "",
                            },
                          }));

                          if (newValue) clearFieldError("nombre_conductor");
                          else setFieldError("nombre_conductor", "El valor debe ser seleccionado");
                        }}
                        onInputChange={(event, newInputValue, reason) => {
                          if (isDisabled) return;

                          handleChangeLectura("nombre_conductor__input", newInputValue);

                          if (reason === "input") {
                            const msg = validateSelectValue(
                              "nombre_conductor",
                              newInputValue,
                              catalogos.conductores || []
                            );

                            if (msg) setFieldError("nombre_conductor", msg);
                            else clearFieldError("nombre_conductor");
                          }

                          if (reason === "clear") {
                            setForm((prev) => ({
                              ...prev,
                              lecturas: {
                                ...prev.lecturas,
                                nombre_conductor: "",
                                nombre_conductor__input: "",
                                placa: "",
                                remolque: "",
                              },
                            }));
                            clearFieldError("nombre_conductor");
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Conductor"
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                            error={!!fieldErrors.nombre_conductor}
                            helperText={fieldErrors.nombre_conductor || " "}
                          />
                        )}
                      />
                    ) : esSelect ? (
                      <Autocomplete
                        forcePopupIcon
                        options={items}
                        getOptionLabel={(option) =>
                          typeof option === "string"
                            ? option
                            : option?.label ?? option?.value ?? ""
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        value={
                          items.find((opt) => opt.value === form.lecturas?.[c.key]) || null
                        }
                        inputValue={
                          String(form.lecturas?.[`${c.key}__input`] ?? "").trim() ||
                          String(form.lecturas?.[c.key] ?? "").trim()
                        }
                        onChange={(event, newValue) => {
                          if (isDisabled) return;

                          handleChangeLectura(c.key, newValue?.value ?? "");
                          handleChangeLectura(`${c.key}__input`, newValue?.label ?? newValue?.value ?? "");

                          if (newValue) clearFieldError(c.key);
                          else setFieldError(c.key, "El valor debe ser seleccionado");
                        }}
                        onInputChange={(event, newInputValue, reason) => {
                          if (isDisabled) return;

                          handleChangeLectura(`${c.key}__input`, newInputValue);

                          if (reason === "input") {
                            const msg = validateSelectValue(c.key, newInputValue, items);
                            if (msg) setFieldError(c.key, msg);
                            else clearFieldError(c.key);
                          }

                          if (reason === "clear") {
                            handleChangeLectura(c.key, "");
                            clearFieldError(c.key);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={c.nombre}
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                            error={!!fieldErrors[c.key]}
                            helperText={fieldErrors[c.key] || " "}
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
                    ) : esLlegadaDestino ? (
                      <Autocomplete
                        disableClearable
                        forcePopupIcon
                        options={LLEGADA_DESTINO_OPTIONS}
                        value={form.lecturas?.[c.key] ?? ""}
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
                    ) : esTanqueSalida ? (
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        forcePopupIcon
                        loading={loadingTanques}
                        options={tanquesOptions}
                        value={selectedTanques}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) =>
                          typeof option === "string"
                            ? option
                            : option.label ?? ""
                        }
                        onChange={(event, newValue) => {
                          if (isDisabled) return;

                          const names = (newValue ?? []).map((x) =>
                            typeof x === "string" ? x : x.value
                          );

                          handleChangeLectura(c.key, buildTanquesString(names));
                        }}
                        renderOption={(props, option, { selected }) => {
                          const icon = (
                            <CheckBoxOutlineBlankIcon fontSize="small" />
                          );
                          const checkedIcon = <CheckBoxIcon fontSize="small" />;
                          return (
                            <li {...props} key={option.value}>
                              <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={selected}
                              />
                              {option.label}
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={c.nombre}
                            fullWidth
                            disabled={isDisabled}
                            sx={sxField}
                            placeholder="Selecciona 1 o más tanques"
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

            const errors = {};

            if (!form.fecha) {
              errors.fecha = "La fecha es obligatoria";
            }

            if (!form.responsable) {
              errors.responsable = "El responsable es obligatorio";
            }

            if (!form.observaciones?.trim()) {
              errors.observaciones = "Las observaciones son obligatorias";
            }

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);

              setAlertState({
                open: true,
                severity: "warning",
                message: "Completa los campos obligatorios",
              });

              return;
            }

            const payload = {
              ...form,
              observaciones: String(form?.observaciones ?? "").trim(),
            };

            if (formCacheKey) clearFormDraft(formCacheKey);
            onSave(payload);
          }}
          disabled={loadingAuth || !isAuth || Object.values(fieldErrors).some(Boolean)}
        >
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngresoDataDespachoModal;
