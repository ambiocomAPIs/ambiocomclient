import { normalizeText } from "./normalizers";

export const isValidDateISO = (s) => {
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
    dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd
  );
};

export const pad2 = (n) => String(n).padStart(2, "0");

export const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

export const getDefaultRange = () => {
  const now = new Date();
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISODate(startPrevMonth), to: toISODate(endCurrentMonth) };
};
