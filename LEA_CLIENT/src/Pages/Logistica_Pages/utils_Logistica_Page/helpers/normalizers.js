export const normalizeText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const removeAccents = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const normalizeKey = (v) =>
  removeAccents(normalizeText(v))
    .toUpperCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeDateOnly = (v) => {
  const value = String(v ?? "").trim();
  if (!value) return "";

  return value.slice(0, 10);
};

export const hasOwn = (obj, key) =>
  !!obj && Object.prototype.hasOwnProperty.call(obj, key);

export const parseHoraToMinutes = (hora) => {
  const value = normalizeText(hora);
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);

  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return h * 60 + m;
};
