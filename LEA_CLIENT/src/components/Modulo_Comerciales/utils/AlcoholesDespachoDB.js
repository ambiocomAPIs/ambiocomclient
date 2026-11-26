const API_ALCOHOLES_DESPACHO =
  "https://ambiocomserver.onrender.com/api/alcoholesdespacho";

const CACHE_KEY = "ambiocom-alcoholes-despacho-v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

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

function getCachedAlcoholes() {
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

function setCachedAlcoholes(data) {
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

function normalizarAlcohol(row) {
  const nombre = row?.nombre || row?.tipoProducto || "";
  const tipoProducto = row?.tipoProducto || row?.nombre || "";
  const origen = row?.origen || "";

  if (!nombre) return null;

  return {
    _id: row?._id || "",
    value: row?._id || makeValue(nombre),
    keyProducto: makeValue(nombre),
    label: nombre,
    nombre,
    tipoProducto,
    origen,
    createdAt: row?.createdAt || "",
    updatedAt: row?.updatedAt || "",
  };
}

export async function obtenerAlcoholesDespacho({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getCachedAlcoholes();

    if (cached) {
      return {
        ok: true,
        source: "cache",
        data: cached,
      };
    }
  }

  try {
    const res = await fetch(API_ALCOHOLES_DESPACHO, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error consultando alcoholes: ${res.status}`);
    }

    const raw = await res.json();

    if (!Array.isArray(raw)) {
      throw new Error("La respuesta de alcoholes no es un array.");
    }

    const data = raw
      .map(normalizarAlcohol)
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label, "es"));

    setCachedAlcoholes(data);

    return {
      ok: true,
      source: "api",
      data,
    };
  } catch (error) {
    return {
      ok: false,
      source: "error",
      data: [],
      warning:
        error?.message || "No se pudieron consultar los alcoholes de despacho.",
    };
  }
}