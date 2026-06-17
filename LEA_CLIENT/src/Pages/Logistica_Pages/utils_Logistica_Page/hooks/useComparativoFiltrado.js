import { useMemo } from "react";
import { normalizeText } from "../helpers/normalizers";

const useComparativoFiltrado = ({ comparativo, filters, debouncedSearch }) => {
  return useMemo(() => {
    let out = comparativo;

    const fFecha = normalizeText(filters.fecha);
    const fT = normalizeText(filters.transportadora);
    const fC = normalizeText(filters.cliente);
    const fP = normalizeText(filters.producto);

    if (fFecha) out = out.filter((r) => r.fecha === fFecha);
    if (fT) out = out.filter((r) => r.transportadora === fT);
    if (fC) out = out.filter((r) => r.cliente === fC);
    if (fP) out = out.filter((r) => r.producto === fP);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const hay = [
        r.fecha,
        r.transportadora,
        r.cliente,
        r.producto,
        r.placa,
        String(r.viajesProgramados),
        String(r.viajesRealizados),
        String(r.cantidadProgramada),
        String(r.cantidadRealPlanta),
        String(r.diffCantidad),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [comparativo, filters, debouncedSearch]);
};

export default useComparativoFiltrado;
