import { useMemo } from "react";

const useFilterOptions = (comparativo) => {
  return useMemo(() => {
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      fechas: uniq(comparativo.map((r) => r.fecha)),
      transportadoras: uniq(comparativo.map((r) => r.transportadora)),
      clientes: uniq(comparativo.map((r) => r.cliente)),
      productos: uniq(comparativo.map((r) => r.producto)),
    };
  }, [comparativo]);
};

export default useFilterOptions;
