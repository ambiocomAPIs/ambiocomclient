const DIVIPOLA_URL = "https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=2000";

const CACHE_KEY = "ambiocom-destinos-colombia-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const DESTINOS_ESPECIALES_AMBIOCOM = [
  {
    tipo: "ZONA_ESPECIAL",
    value: "PALMASECA",
    label: "Palmaseca - Valle del Cauca",
    municipio: "Palmaseca",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "ZONA_FRANCA",
    value: "ZONA_FRANCA_PALMASECA",
    label: "Zona Franca Palmaseca - Palmira",
    municipio: "Palmira",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "ZONA_FRANCA",
    value: "ZONA_FRANCA_PACIFICO",
    label: "Zona Franca del Pacífico - Palmira",
    municipio: "Palmira",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "ZONA_INDUSTRIAL",
    value: "ZONA_INDUSTRIAL_YUMBO",
    label: "Zona Industrial Yumbo - Valle del Cauca",
    municipio: "Yumbo",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "ZONA_INDUSTRIAL",
    value: "ACOPI_YUMBO",
    label: "ACOPI Yumbo - Valle del Cauca",
    municipio: "Yumbo",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "PUERTO",
    value: "PUERTO_DE_BUENAVENTURA",
    label: "Puerto de Buenaventura - Valle del Cauca",
    municipio: "Buenaventura",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "PUERTO",
    value: "PUERTO_DE_CARTAGENA",
    label: "Puerto de Cartagena - Bolívar",
    municipio: "Cartagena",
    departamento: "Bolívar",
  },
  {
    tipo: "PUERTO",
    value: "PUERTO_DE_BARRANQUILLA",
    label: "Puerto de Barranquilla - Atlántico",
    municipio: "Barranquilla",
    departamento: "Atlántico",
  },
  {
    tipo: "PUERTO",
    value: "PUERTO_DE_SANTA_MARTA",
    label: "Puerto de Santa Marta - Magdalena",
    municipio: "Santa Marta",
    departamento: "Magdalena",
  },
  {
    tipo: "ESPECIAL",
    value: "OTRA_CIUDAD_COLOMBIA",
    label: "Otra ciudad de Colombia",
    municipio: "",
    departamento: "",
  },
  {
    tipo: "EXTERIOR",
    value: "CLIENTE_EXTERIOR",
    label: "Cliente en el exterior",
    municipio: "",
    departamento: "Exterior",
  },
  {
    tipo: "ESPECIAL",
    value: "OTRO_CLIENTE",
    label: "Otro cliente / destino no listado",
    municipio: "",
    departamento: "",
  },
];

const FALLBACK_MUNICIPIOS = [
  {
    tipo: "MUNICIPIO",
    value: "BOGOTA",
    label: "Bogotá - Bogotá D.C.",
    municipio: "Bogotá",
    departamento: "Bogotá D.C.",
  },
  {
    tipo: "MUNICIPIO",
    value: "CALI",
    label: "Cali - Valle del Cauca",
    municipio: "Cali",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "MUNICIPIO",
    value: "PALMIRA",
    label: "Palmira - Valle del Cauca",
    municipio: "Palmira",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "MUNICIPIO",
    value: "YUMBO",
    label: "Yumbo - Valle del Cauca",
    municipio: "Yumbo",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "MUNICIPIO",
    value: "BUENAVENTURA",
    label: "Buenaventura - Valle del Cauca",
    municipio: "Buenaventura",
    departamento: "Valle del Cauca",
  },
  {
    tipo: "MUNICIPIO",
    value: "MEDELLIN",
    label: "Medellín - Antioquia",
    municipio: "Medellín",
    departamento: "Antioquia",
  },
  {
    tipo: "MUNICIPIO",
    value: "BARRANQUILLA",
    label: "Barranquilla - Atlántico",
    municipio: "Barranquilla",
    departamento: "Atlántico",
  },
  {
    tipo: "MUNICIPIO",
    value: "CARTAGENA",
    label: "Cartagena - Bolívar",
    municipio: "Cartagena",
    departamento: "Bolívar",
  },
];

function normalizeText(value = "") {
  return String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeValue(value = "") {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickFirst(row, keys = []) {
  for (const key of keys) {
    if (row?.[key] != null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }

  return "";
}

function parseMunicipio(row) {
  const municipio = pickFirst(row, [
    "municipio",
    "nombre_municipio",
    "nom_mpio",
    "nom_municipio",
    "nombre_del_municipio",
  ]);

  const departamento = pickFirst(row, [
    "departamento",
    "nombre_departamento",
    "nom_depto",
    "nom_departamento",
    "nombre_del_departamento",
  ]);

  const codigoDepartamento = pickFirst(row, [
    "codigo_departamento",
    "cod_depto",
    "c_digo_departamento",
  ]);

  const codigoMunicipio = pickFirst(row, [
    "codigo_municipio",
    "cod_mpio",
    "c_digo_municipio",
  ]);

  if (!municipio) return null;

  const municipioClean = normalizeText(municipio);
  const departamentoClean = normalizeText(departamento);

  return {
    tipo: "MUNICIPIO",
    value: makeValue(municipioClean),
    label: departamentoClean
      ? `${municipioClean} - ${departamentoClean}`
      : municipioClean,
    municipio: municipioClean,
    departamento: departamentoClean,
    codigoDepartamento: String(codigoDepartamento || ""),
    codigoMunicipio: String(codigoMunicipio || ""),
  };
}

function sortDestinos(a, b) {
  const prioridad = {
    MUNICIPIO: 1,
    ZONA_ESPECIAL: 2,
    ZONA_INDUSTRIAL: 3,
    PARQUE_INDUSTRIAL: 4,
    ZONA_FRANCA: 5,
    ZONA_PORTUARIA: 6,
    PUERTO: 7,
    EXTERIOR: 8,
    ESPECIAL: 9,
  };

  const pa = prioridad[a.tipo] || 99;
  const pb = prioridad[b.tipo] || 99;

  if (pa !== pb) return pa - pb;

  return String(a.label).localeCompare(String(b.label), "es");
}

function mergeUnique(...arrays) {
  const map = new Map();

  arrays.flat().forEach((item) => {
    if (!item?.value) return;
    if (!map.has(item.value)) {
      map.set(item.value, item);
    }
  });

  return Array.from(map.values()).sort(sortDestinos);
}

function getCachedDestinos() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.timestamp || !Array.isArray(parsed?.data)) {
      return null;
    }

    const isValid = Date.now() - parsed.timestamp < CACHE_TTL_MS;

    return isValid ? parsed.data : null;
  } catch {
    return null;
  }
}

function setCachedDestinos(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // No hacer nada si localStorage falla.
  }
}

export async function obtenerDestinosColombia({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getCachedDestinos();

    if (cached) {
      return {
        ok: true,
        source: "cache",
        data: cached,
      };
    }
  }

  try {
    const res = await fetch(DIVIPOLA_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error consultando destinos: ${res.status}`);
    }

    const raw = await res.json();

    if (!Array.isArray(raw)) {
      throw new Error("La respuesta de destinos no es un array.");
    }

    const municipios = raw.map(parseMunicipio).filter(Boolean);

    if (municipios.length === 0) {
      throw new Error("No se encontraron municipios válidos.");
    }

    const data = mergeUnique(municipios, DESTINOS_ESPECIALES_AMBIOCOM);

    setCachedDestinos(data);

    return {
      ok: true,
      source: "datos_abiertos_divipola",
      data,
    };
  } catch (error) {
    const data = mergeUnique(FALLBACK_MUNICIPIOS, DESTINOS_ESPECIALES_AMBIOCOM);

    return {
      ok: false,
      source: "fallback",
      data,
      warning:
        error?.message || "No se pudieron consultar los destinos oficiales.",
    };
  }
}