import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { API_DESPACHOS, API_PROGRAMACION } from "../helpers/constants";
import { getDefaultRange, isValidDateISO } from "../helpers/dateHelpers";
import { getApiErrorMessage } from "../helpers/formatters";
import { normalizeText } from "../helpers/normalizers";

const useDespachosFetch = ({ range }) => {
  const [programaciones, setProgramaciones] = useState([]);
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (customRange) => {
    const effective = customRange ?? range ?? getDefaultRange();
    const from = normalizeText(effective.from);
    const to = normalizeText(effective.to);

    if (from && !isValidDateISO(from)) {
      await Swal.fire({
        icon: "warning",
        title: "Desde inválido",
        text: 'La fecha "Desde" debe ser YYYY-MM-DD.',
      });
      return;
    }
    if (to && !isValidDateISO(to)) {
      await Swal.fire({
        icon: "warning",
        title: "Hasta inválido",
        text: 'La fecha "Hasta" debe ser YYYY-MM-DD.',
      });
      return;
    }
    if (from && to && from > to) {
      await Swal.fire({
        icon: "warning",
        title: "Rango inválido",
        text: '"Desde" no puede ser mayor que "Hasta".',
      });
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Cargando análisis...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const resProg = await axios.get(`${API_PROGRAMACION}/rango`, {
        params: { from, to },
        withCredentials: true,
      });

      const resDesp = await axios.get(`${API_DESPACHOS}/rango`, {
        params: { from, to },
        withCredentials: true,
      });

      setProgramaciones(Array.isArray(resProg.data) ? resProg.data : []);
      setDespachos(Array.isArray(resDesp.data) ? resDesp.data : []);

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Datos cargados para análisis.",
        timer: 1100,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Error cargando",
        text: getApiErrorMessage(err),
      });
      setProgramaciones([]);
      setDespachos([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAll(getDefaultRange());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { programaciones, despachos, loading, fetchAll };
};

export default useDespachosFetch;
