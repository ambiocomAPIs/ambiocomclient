import React, { Fragment, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Divider, Chip, Stack, MenuItem, Tooltip,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, IconButton, Collapse
} from "@mui/material";


import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ReportIcon from "@mui/icons-material/Report";
import UndoIcon from "@mui/icons-material/Undo";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestoreIcon from '@mui/icons-material/Restore';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import PersonRemoveAlt1Icon from "@mui/icons-material/PersonRemoveAlt1";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";

import ResumenKpiRadarModal from "./utils_Logistica_Page/ResumenKpiRadarModal";
import ObservacionEstadoModal from "../../components/Modulo_Logistica/utils_Logistica/Logistica_Modals/ObservacionEstadoModal";

// purificacion del DOM en renderizado HTML
import DOMPurify from "dompurify";


import { formatNumber, formatNumber1D } from "./utils_Logistica_Page/helpers/formatters";
import { getDefaultRange } from "./utils_Logistica_Page/helpers/dateHelpers";
import { heatBg, heatBgKg, heatCumplimiento } from "./utils_Logistica_Page/helpers/heatmap";
import { getDespachoInfo } from "./utils_Logistica_Page/helpers/estadoHelpers";
import { normalizeKey, normalizeText, parseHoraToMinutes } from "./utils_Logistica_Page/helpers/normalizers";

import useDebouncedValue from "./utils_Logistica_Page/hooks/useDebouncedValue";
import useDespachosFetch from "./utils_Logistica_Page/hooks/useDespachosFetch";
import useComparativoBase from "./utils_Logistica_Page/hooks/useComparativoBase";
import useComparativoFiltrado from "./utils_Logistica_Page/hooks/useComparativoFiltrado";
import useFilterOptions from "./utils_Logistica_Page/hooks/useFilterOptions";

import OtiffGeneralCollapsible from "./utils_Logistica_Page/graficas/OtiffGeneralCollapsible"
import LineChartProgramadoVsReal from "./utils_Logistica_Page/graficas/LineChartProgramadoVsReal";
import PieChartsAnalisis from "./utils_Logistica_Page/graficas/PieChartsAnalisis";
import BarChartDiffTransportadora from "./utils_Logistica_Page/graficas/BarChartDiffTransportadora";
import LineChartMermas from "./utils_Logistica_Page/graficas/LineChartMermas";
import BarChartCumplimiento from "./utils_Logistica_Page/graficas/BarChartCumplimiento";
// UI: módulo BI
const DataAnalisysProgramacionDespacho = () => {
  const navigate = useNavigate();

  const [range, setRange] = useState(() => getDefaultRange());
  const { programaciones, despachos, loading, fetchAll } = useDespachosFetch({ range });
  const [filtersElevated, setFiltersElevated] = useState(false);
  const [filters, setFilters] = useState({
    fecha: "",
    transportadora: "",
    cliente: "",
    producto: "",
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [tolerancia, setTolerancia] = useState(0.002);
  const [toleranciaKgCliente, setToleranciaKgCliente] = useState(30);
  const [openRadarModal, setOpenRadarModal] = useState(false);

  const [openObsEstado, setOpenObsEstado] = useState(false);
  const [obsEstadoData, setObsEstadoData] = useState({
    estado: "",
    observacion: "",
    fecha: "",
    cliente: "",
    transportadora: "",
    producto: "",
    conductor: "",
  });

  useEffect(() => {
    const onScroll = () => setFiltersElevated(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/principal");
  };

  const handleRangeChange = (e) => {
    setRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ fecha: "", transportadora: "", cliente: "", producto: "" });
    setSearch("");
  };

  const comparativoBase = useComparativoBase({ programaciones, despachos });

  const comparativo = useMemo(() => {
    return comparativoBase.map((r) => {

      const cumplioCantidadDespachada = r.cantidadProgramada > 0 && Math.abs(r.diffCantidad) <= Number(r.cantidadProgramada ?? 0) * Number(tolerancia);
      const toleranciaMermaCliente = Number(r.cantidadProgramada ?? 0) * tolerancia;   // (1)
      const superaMerma = Math.abs(r.diffCliente) > toleranciaMermaCliente;       // (2)
      const cumplioCantidadCliente = r.cantidadProgramada > 0 && !superaMerma;    // (3)
      const diffCliente_Facturado = Number(r.volumenRecibidoCliente ?? 0) - Number(r.cantidadProgramada ?? 0);

      const cumplioViaje = r.tieneProgramacion && r.tieneDespacho;


      const excluidoFechaEntrega = r.rechazado || r.rechazadoCliente || !r.tieneCampoFechaEstimadaEntrega || !r.tieneCampoFechaEntrega;   // si el vehiculo es rechazado no lo tendrá en cuenta
      const tieneFechasEntrega = !!r.fechaEstimadaEntrega && !!r.fechaEntrega;
      const cumplioFechaEntrega = !excluidoFechaEntrega && tieneFechasEntrega && r.fechaEntrega <= r.fechaEstimadaEntrega;
      const estadoFechaEntrega = r.rechazado || r.rechazadoCliente
        ? "Excluido por rechazo"
        : !r.tieneCampoFechaEstimadaEntrega || !r.tieneCampoFechaEntrega
          ? "Excluido por campo no existente"
          : !tieneFechasEntrega
            ? "Sin datos"
            : cumplioFechaEntrega
              ? "Cumple"
              : "No cumple";

      const estadoProgramacion =
        r.tieneProgramacion && !r.tieneDespacho && !r.rechazado
          ? "Programado (no despachado)"
          : !r.tieneProgramacion && r.tieneDespacho && !r.rechazado && !r.aprobadoConObs && !r.rechazadoCliente
            ? "No programado"
            : r.tieneProgramacion && r.tieneDespacho && r.rechazado
              ? "Rechazado Ambiocom"
              : r.tieneProgramacion && r.tieneDespacho && r.rechazadoCliente || !r.tieneProgramacion && r.tieneDespacho && r.rechazadoCliente
                ? "Rechazado por cliente"
                : r.tieneProgramacion && r.tieneDespacho && r.aprobadoConObs || !r.tieneProgramacion && r.tieneDespacho && r.aprobadoConObs
                  ? "Aprobado con observaciones"
                  : r.tieneProgramacion && r.tieneDespacho && r.aprobado
                    ? "Cumple"
                    : r.tieneProgramacion && r.tieneDespacho && r.enProceso || !r.tieneProgramacion && r.tieneDespacho && r.enProceso
                      ? "En proceso" :
                      r.Aprobadocliente ? "Aprobado En Cliente"
                        : "Sin datos";

      return {
        ...r,
        cumplioViaje,
        cumplioCantidadDespachada,
        cumplioCantidadCliente,
        cumplioToleranciaDespacho: cumplioCantidadDespachada,
        excluidoFechaEntrega,
        cumplioFechaEntrega,
        estadoFechaEntrega,
        estadoProgramacion,
        diffCliente_Facturado
      };
    });
  }, [comparativoBase, tolerancia]);

  const filterOptions = useFilterOptions(comparativo);

  const comparativoFiltrado = useComparativoFiltrado({
    comparativo,
    filters,
    debouncedSearch,
  });

  // ===== NUEVO: despachos filtrados (para cumplir/rechazar por viaje real) =====
  const despachosFiltrados = useMemo(() => {
    const rows = (despachos ?? []).map(getDespachoInfo);

    const fFecha = normalizeText(filters.fecha);
    const fT = normalizeKey(filters.transportadora);
    const fC = normalizeKey(filters.cliente);
    const fP = normalizeKey(filters.producto);

    let out = rows;

    if (fFecha) out = out.filter((r) => r.fecha === fFecha);
    if (filters.transportadora)
      out = out.filter((r) => r.transportadora === fT);
    if (filters.cliente) out = out.filter((r) => r.cliente === fC);
    if (filters.producto) out = out.filter((r) => r.producto === fP);

    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return out;

    return out.filter((r) => {
      const hay = [r.fecha, r.transportadora, r.cliente, r.producto, r.placa]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [despachos, filters, debouncedSearch]);

  // KPIs principales (comparativo)
  const kpis = useMemo(() => {

    const rows = comparativoFiltrado ?? [];
    // VIAJES
    const viajesProgramados = rows.reduce((acc, r) => acc + (r.viajesProgramados ?? 0), 0);
    const viajesRealizados = rows.reduce((acc, r) => acc + (r.viajesRealizados ?? 0), 0);
    // VOLUMENES
    const cantidadProgramada = rows.reduce((acc, r) => acc + (r.cantidadProgramada ?? 0), 0);
    const cantidadReal = rows.reduce((acc, r) => acc + (r.cantidadRealPlanta ?? 0), 0);
    // DIFERENCIAS
    const diffTotal = rows.reduce((acc, r) => acc + (r.diffCantidad ?? 0), 0);
    const diffPlantaTotal = rows.reduce((acc, r) => acc + (r.diffPlanta ?? 0), 0);
    const diffClienteTotal = rows.reduce((acc, r) => acc + (r.diffCliente ?? 0), 0);
    // CUMPLIMIENTO
    const cumplidosCantidad = rows.filter((r) => r.cumplioCantidadDespachada).length;
    const cumplidosViaje = rows.filter((r) => r.cumplioViaje).length;

    const pctCumplCant = rows.length ? (cumplidosCantidad / rows.length) * 100 : 0;
    const pctCumplViaje = rows.length ? (cumplidosViaje / rows.length) * 100 : 0;
    // cumplimiento fecha entrega vs fecha estimada entrega
    const rowsFechaEntregaEvaluables = rows.filter((r) => !r.rechazado && !r.rechazadoCliente && r.tieneCampoFechaEstimadaEntrega && r.tieneCampoFechaEntrega);
    const cumplidosFechaEntrega = rowsFechaEntregaEvaluables.filter((r) => {
      return (
        r.fechaEstimadaEntrega &&
        r.fechaEntrega &&
        r.fechaEntrega <= r.fechaEstimadaEntrega
      );
    }).length;
    const noCumplidosFechaEntrega = rowsFechaEntregaEvaluables.filter((r) => {
      return (
        !r.fechaEstimadaEntrega ||
        !r.fechaEntrega ||
        r.fechaEntrega > r.fechaEstimadaEntrega
      );
    }).length;
    const excluidosFechaEntrega = rows.filter(
      (r) =>
        r.rechazado ||
        r.rechazadoCliente ||
        !r.tieneCampoFechaEstimadaEntrega ||
        !r.tieneCampoFechaEntrega
    ).length;

    const pctCumplFechaEntrega = rowsFechaEntregaEvaluables.length
      ? (cumplidosFechaEntrega / rowsFechaEntregaEvaluables.length) * 100
      : 0;    // con este solo tiene en cuenta los que coinciden, con el de arriba castiga, asi no coincidan castiga el kpi oko

    return {
      filas: rows.length,
      viajesProgramados,
      viajesRealizados,
      cantidadProgramada,
      cantidadReal,
      diffTotal,
      diffPlantaTotal,
      diffClienteTotal,
      pctCumplCant,
      pctCumplViaje,
      cumplidosFechaEntrega,
      noCumplidosFechaEntrega,
      excluidosFechaEntrega,
      totalFechaEntrega: rowsFechaEntregaEvaluables.length,
      pctCumplFechaEntrega,
    };
  }, [comparativoFiltrado]);

  // ===== NUEVO: KPI viajes (salió de planta) usando vehiculo_rechazado =====
  const kpiVehiculos = useMemo(() => {
    const total = despachosFiltrados.length;
    const rechazados = despachosFiltrados.filter((d) => d.rechazado || d.rechazadoCliente).length;
    const cumplidos = total - rechazados;
    const pct = total ? (cumplidos / total) * 100 : 0;
    return { total, rechazados, cumplidos, pct };
  }, [despachosFiltrados]);

  // Series: Programado vs Real por día
  const seriesPorDia = useMemo(() => {
    const m = new Map();
    for (const r of comparativoFiltrado) {
      const prev = m.get(r.fecha) || {
        fecha: r.fecha,
        programado: 0,
        real: 0,
        diff: 0,
      };
      prev.programado += r.cantidadProgramada;
      prev.real += r.cantidadRealPlanta;
      prev.diff += r.diffCantidad;
      m.set(r.fecha, prev);
    }
    return Array.from(m.values()).sort((a, b) =>
      a.fecha.localeCompare(b.fecha)
    );
  }, [comparativoFiltrado]);

  // diferencias volumen vs kilos recibidos por cliente
  const seriesMermasDetallada = useMemo(() => {
    return [...comparativoFiltrado]
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        if (a.transportadora !== b.transportadora) {
          return a.transportadora.localeCompare(b.transportadora);
        }
        if (a.cliente !== b.cliente) {
          return a.cliente.localeCompare(b.cliente);
        }
        return a.producto.localeCompare(b.producto);
      })
      .map((r, idx) => ({
        id: `${r.fecha}-${r.placa}-${idx}`,
        fecha: r.fecha,
        item: `${r.fecha} #${idx + 1}`,

        placa: r.placa ?? "Sin placa",
        cliente: r.cliente,
        conductor: r.conductor ?? "Sin dato",
        producto: r.producto,
        transportadora: r.transportadora,

        volumenDespachado: Number(r.cantidadRealPlanta ?? 0),
        volumenRecibidoCliente: Number(r.volumenRecibidoCliente ?? 0),
        pesoNetoCliente: Number(r.pesoNetoCliente ?? 0),
        pesoNetoBasculaAmbiocom: Number(r.pesoNetoBasculaAmbiocom ?? 0),
        diffVolCliente: Number(r.diffCliente ?? 0),
        diffPesoCliente: Number(r.diffKgBasculaClienteAmbiocom ?? 0),

        estadoProgramacion: r.estadoProgramacion,
        rechazado: r.rechazado,
        rechazadoCliente: r.rechazadoCliente,
        aprobado: r.aprobado,
        aprobadoConObs: r.aprobadoConObs,
        enProceso: r.enProceso,
      }));
  }, [comparativoFiltrado]);

  const seriesMermasDetalladaFiltrada = useMemo(() => {
    return seriesMermasDetallada.filter(
      (r) => !r.rechazado && !r.rechazadoCliente
    );
  }, [seriesMermasDetallada]);

  // Series: Diferencia por transportadora (barras con colores) diferenciando positivos y negativos
  const seriesPosNegPorTransportadora = useMemo(() => {
    const m = new Map();

    for (const r of comparativoFiltrado) {
      const t = r.transportadora || "(SIN TRANSPORTADORA)";
      const diff = Number(r.diffCantidad ?? 0);

      const prev = m.get(t) || {
        transportadora: t,
        positivos: 0,
        negativos: 0,
      };

      if (diff > 0) prev.positivos += diff;
      if (diff < 0) prev.negativos += diff;

      m.set(t, prev);
    }

    // opcional: ordenar por impacto total (magnitud)
    return Array.from(m.values()).sort(
      (a, b) =>
        Math.abs(b.negativos) +
        b.positivos -
        (Math.abs(a.negativos) + a.positivos)
    );
  }, [comparativoFiltrado]);


  //doble click para abrir modal con informacion detallada del despacho
  const handleDblClickEstado = (row) => {
    setObsEstadoData({
      estado: row?.estadoProgramacion || row?.estadoVehiculo || "",
      observacion:
        row?.observacion || "Esta fila no tiene observación registrada",
      fecha: row?.fecha || "",
      cliente: row?.cliente || "",
      transportadora: row?.transportadora || "",
      producto: row?.producto || "",
      conductor: row?.conductor || "",
    });

    setOpenObsEstado(true);
  };

  // Color estable por transportadora (siempre el mismo) en la grafica barras comparativa de mermas
  const hashToColor = (str) => {
    const s = String(str ?? "");
    let hash = 0;
    for (let i = 0; i < s.length; i++)
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  const colorByTransportadora = useMemo(() => {
    const m = new Map();
    for (const x of seriesPosNegPorTransportadora) {
      m.set(x.transportadora, hashToColor(x.transportadora));
    }
    return m;
  }, [seriesPosNegPorTransportadora]);
  // **********************************************************************
  // Cumplimiento por transportadora (Cumplidos vs Rechazados)
  const seriesCumplimientoPorTransportadora = useMemo(() => {
    const m = new Map();

    for (const r of comparativoFiltrado) {
      if (r.viajesProgramados === 0) continue;

      const key = r.transportadora || "(SIN TRANSPORTADORA)";
      const prev = m.get(key) || {
        transportadora: key,
        programados: 0,
        cumplidos: 0,
        rechazadosAmbiocom: 0,
        rechazadosCliente: 0,
        pctCumpl: 0,
      };

      prev.programados += 1;

      if (r.rechazado) {
        prev.rechazadosAmbiocom += 1;
      } else if (r.rechazadoCliente) {
        prev.rechazadosCliente += 1;
      } else if (r.tieneProgramacion && r.tieneDespacho) {
        prev.cumplidos += 1;
      }
      // else if (r.viajesRealizados > 0 && r.aprobado) {
      //   prev.cumplidos += 1;
      // }
      m.set(key, prev);
    }

    const out = Array.from(m.values()).map((x) => ({
      ...x,
      pctCumpl: x.programados ? (x.cumplidos / x.programados) * 100 : 0,
    }));

    out.sort((a, b) => b.programados - a.programados);

    return out;
  }, [comparativoFiltrado]);

  //Flags para evaluar si existen rechazos o no y mostrarlos en la grafica de programacion, cumplimiento y rechazos
  const hasRechazosAmbiocom = useMemo(() => {
    return seriesCumplimientoPorTransportadora.some(
      (x) => Number(x.rechazadosAmbiocom ?? 0) > 0
    );
  }, [seriesCumplimientoPorTransportadora]);

  const hasRechazosCliente = useMemo(() => {
    return seriesCumplimientoPorTransportadora.some(
      (x) => Number(x.rechazadosCliente ?? 0) > 0
    );
  }, [seriesCumplimientoPorTransportadora]);

  const pieTransportadoras = useMemo(() => {
    const rows = comparativoFiltrado ?? [];

    const enProceso = rows.filter((r) =>
      [
        "EN PLANTA",
        "APROBADO AMBIOCOM",
        "EN CARGUE",
        "EN TRANSITO",
        "EN CLIENTE",
      ].includes(r.estadoVehiculo)
    ).length;

    const rechazado = rows.filter((r) =>
      [
        "RECHAZADO POR CLIENTE",
        "RECHAZADO AMBIOCOM",
      ].includes(r.estadoVehiculo)
    ).length;

    const cumple = rows.filter((r) =>
      [
        "APROBADO POR EL CLIENTE",
        "APROBADO CON OBSERVACIONES",
      ].includes(r.estadoVehiculo)
    ).length;

    return [
      { name: "En proceso", value: enProceso, color: "#8B5CF6" },
      { name: "Rechazado", value: rechazado, color: "#e53935" },
      { name: "Cumple", value: cumple, color: "#36b865" },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado]);

  // Pie: analisis sobre mermas y diferencias en peso
  const pieCumplimientoPeso = useMemo(() => {
    const rows = seriesMermasDetalladaFiltrada ?? [];
    const tolKg = Number(toleranciaKgCliente ?? 0);

    const enRango = rows.filter((r) => {
      const diffKg = Number(r.diffPesoCliente ?? 0);
      return diffKg >= -tolKg && diffKg <= tolKg;
    }).length;

    const porEncima = rows.filter((r) => Number(r.diffPesoCliente ?? 0) > tolKg).length;
    const porDebajo = rows.filter((r) => Number(r.diffPesoCliente ?? 0) < -tolKg).length;

    return [
      {
        name: `Range`,
        value: enRango,
        color: "#63af7f",
      },
      {
        name: `Upper`,
        value: porEncima,
        color: "#fd8d31",
      },
      {
        name: `Low`,
        value: porDebajo,
        color: "#e65d5b",
      },
    ].filter((x) => x.value > 0);
  }, [seriesMermasDetalladaFiltrada, toleranciaKgCliente]);

  // auqi mido la tolerancia por encima por debajo y en rango para graficas de piechart etc
  // const pieToleranciaRango = useMemo(() => {
  //   const rows = (comparativoFiltrado ?? []).filter(
  //     (r) => !r.rechazado && !r.rechazadoCliente    // no tiene en cuenta rechazados 
  //   );

  //   const tol = Number(tolerancia ?? 0);

  //   const inRange = rows.filter((r) => {
  //     const diff = Number(r.diffCantidad ?? 0);
  //     return diff >= -tol && diff <= tol;
  //   }).length;

  //   const above = rows.filter((r) => {
  //     const diff = Number(r.diffCantidad ?? 0);
  //     return diff > tol;
  //   }).length;

  //   const below = rows.filter((r) => {
  //     const diff = Number(r.diffCantidad ?? 0);
  //     return diff < -tol;
  //   }).length;

  //   return [
  //     {
  //       name: `En rango (${formatNumber(tol)}%)`,
  //       value: inRange,
  //       color: "#36b865",
  //     },
  //     {
  //       name: `Por encima (+>${formatNumber(tol)}%)`,
  //       value: above,
  //       color: "#ed6c02",
  //     },
  //     {
  //       name: `Por debajo (<-${formatNumber(tol)}%)`,
  //       value: below,
  //       color: "#e53935",
  //     },
  //   ].filter((x) => x.value > 0);
  // }, [comparativoFiltrado, tolerancia]);

  const pieToleranciaRango = useMemo(() => {
    const rows = (comparativoFiltrado ?? []).filter(
      (r) => !r.rechazado && !r.rechazadoCliente
    );

    const tol = Number(tolerancia ?? 0);
    const tolPct = (tol * 100).toFixed(2);

    const enRango = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      const base = Number(r.cantidadProgramada ?? 0);
      const limite = base * tol;

      return base > 0 && diff >= -limite && diff <= limite;
    }).length;

    const porEncima = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      const base = Number(r.cantidadProgramada ?? 0);
      const limite = base * tol;

      return base > 0 && diff > limite;
    }).length;

    const porDebajo = rows.filter((r) => {
      const diff = Number(r.diffCantidad ?? 0);
      const base = Number(r.cantidadProgramada ?? 0);
      const limite = base * tol;

      return base > 0 && diff < -limite;
    }).length;

    return [
      {
        name: `En rango (±${tolPct}%)`,
        value: enRango,
        color: "#36b865",
      },
      {
        name: `Por encima (+>${tolPct}%)`,
        value: porEncima,
        color: "#ed6c02",
      },
      {
        name: `Por debajo (<-${tolPct}%)`,
        value: porDebajo,
        color: "#e53935",
      },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado, tolerancia]);

  const pieCumpleVsNoCumple = useMemo(() => {
    const rows = comparativoFiltrado ?? [];

    const cumple = rows.filter(
      (r) => r.tieneProgramacion && r.tieneDespacho
    ).length;

    const noCumple = rows.length - cumple;

    return [
      { name: "Cumple Programación", value: cumple, color: "#36b865" },
      { name: "No cumple Programación", value: noCumple, color: "#e53935" },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado]);

  const pieCumpleVsNoCumpleHoraProgramada = useMemo(() => {
    const TOL_MIN = 15;

    const makeKeyProg = (p) => {
      const fecha = normalizeText(p?.fecha);
      const transportadora = normalizeKey(p?.transportadora);
      const cliente = normalizeKey(p?.cliente);
      const producto = normalizeKey(p?.producto);
      const placa = normalizeKey(p?.placa);

      return `${fecha}|${transportadora}|${cliente}|${producto}|${placa}`;
    };

    const makeKeyDesp = (d) => {
      const fecha = normalizeText(d?.fecha);
      const transportadora = normalizeKey(d?.transportadora ?? d?.lecturas?.transportadora);
      const cliente = normalizeKey(d?.cliente ?? d?.lecturas?.cliente);
      const producto = normalizeKey(d?.producto ?? d?.lecturas?.producto);
      const placa = normalizeKey(d?.placa ?? d?.lecturas?.placa);

      return `${fecha}|${transportadora}|${cliente}|${producto}|${placa}`;
    };

    const getHoraLlegada = (d) =>
      normalizeText(
        d?.hora_llegada ??
        d?.horaLlegada ??
        d?.lecturas?.hora_llegada ??
        d?.lecturas?.horaLlegada ??
        ""
      );

    const fFecha = normalizeText(filters.fecha);
    const fTransportadora = normalizeKey(filters.transportadora);
    const fCliente = normalizeKey(filters.cliente);
    const fProducto = normalizeKey(filters.producto);

    const despachosMap = new Map();

    for (const d of despachos ?? []) {
      const fecha = normalizeText(d?.fecha);
      const transportadora = normalizeKey(d?.transportadora ?? d?.lecturas?.transportadora);
      const cliente = normalizeKey(d?.cliente ?? d?.lecturas?.cliente);
      const producto = normalizeKey(d?.producto ?? d?.lecturas?.producto);

      if (fFecha && fecha !== fFecha) continue;
      if (filters.transportadora && transportadora !== fTransportadora) continue;
      if (filters.cliente && cliente !== fCliente) continue;
      if (filters.producto && producto !== fProducto) continue;

      const key = makeKeyDesp(d);
      const arr = despachosMap.get(key) || [];
      arr.push(d);
      despachosMap.set(key, arr);
    }

    const resumen = {
      cumple: 0,
      noCumple: 0,
      sinDatos: 0,
    };

    for (const p of programaciones ?? []) {
      const fecha = normalizeText(p?.fecha);
      const transportadora = normalizeKey(p?.transportadora);
      const cliente = normalizeKey(p?.cliente);
      const producto = normalizeKey(p?.producto);

      if (fFecha && fecha !== fFecha) continue;
      if (filters.transportadora && transportadora !== fTransportadora) continue;
      if (filters.cliente && cliente !== fCliente) continue;
      if (filters.producto && producto !== fProducto) continue;

      const key = makeKeyProg(p);
      const posiblesDespachos = despachosMap.get(key) || [];

      if (!posiblesDespachos.length) {
        resumen.sinDatos += 1;
        continue;
      }

      const d = posiblesDespachos.shift();

      const horaProgramadaMin = parseHoraToMinutes(p?.horaProgramada);
      const horaLlegadaMin = parseHoraToMinutes(getHoraLlegada(d));

      if (horaProgramadaMin === null || horaLlegadaMin === null) {
        resumen.sinDatos += 1;
        continue;
      }

      const diferenciaMin = horaLlegadaMin - horaProgramadaMin;

      if (diferenciaMin <= TOL_MIN) {
        resumen.cumple += 1;
      } else {
        resumen.noCumple += 1;
      }
    }

    return [
      {
        name: "Cumple Hora Programada",
        value: resumen.cumple,
        color: "#36b865",
      },
      {
        name: "No cumple Hora Programada",
        value: resumen.noCumple,
        color: "#e53935",
      },
      {
        name: "Sin datos",
        value: resumen.sinDatos,
        color: "#9ca3af",
      },
    ].filter((x) => x.value > 0);
  }, [programaciones, despachos, filters]);

  const hasAnyFilter =
    !!debouncedSearch ||
    !!filters.fecha ||
    !!filters.transportadora ||
    !!filters.cliente ||
    !!filters.producto;


  // resumen de kpis para resumen tipo radar
  // const radarSummaryData = useMemo(() => {
  //   const rowsNoRechazados = (comparativoFiltrado ?? []).filter(
  //     (r) => !r.rechazado && !r.rechazadoCliente
  //   );

  //   const tol = Number(tolerancia ?? 0);
  //   const tolKg = Number(toleranciaKgCliente ?? 0);

  //   const pctDespachosRealizados =
  //     kpis.viajesProgramados > 0
  //       ? (kpis.viajesRealizados / kpis.viajesProgramados) * 100
  //       : 0;

  //   const pctEnRangoVolumen = rowsNoRechazados.length
  //     ? (rowsNoRechazados.filter((r) => {
  //       const diff = Number(r.diffCantidad ?? 0);
  //       return diff >= -tol && diff <= tol;
  //     }).length /
  //       rowsNoRechazados.length) *
  //     100
  //     : 0;

  //   const rowsPeso = seriesMermasDetalladaFiltrada ?? [];
  //   const pctPesoEnRango = rowsPeso.length
  //     ? (rowsPeso.filter((r) => {
  //       const diffKg = Number(r.diffPesoCliente ?? 0);
  //       return diffKg >= -tolKg && diffKg <= tolKg;
  //     }).length /
  //       rowsPeso.length) *
  //     100
  //     : 0;

  //   return [
  //     {
  //       subject: "Cumpl. Volumen",
  //       value: Number(kpis.pctCumplCant ?? 0),
  //       meta: "Programado vs despachado según tolerancia de despacho",
  //     },
  //     {
  //       subject: "Cumpl. Despachos",
  //       value: Number(kpis.pctCumplViaje ?? 0),
  //       meta: "Programación vs despacho realizado",
  //     },
  //     {
  //       subject: "Vehículos OK",
  //       value: Number(kpiVehiculos.pct ?? 0),
  //       meta: "Vehículos aceptados sobre total despachado",
  //     },
  //     {
  //       subject: "Despachos ejecutados",
  //       value: Number(pctDespachosRealizados ?? 0),
  //       meta: "Viajes realizados sobre viajes programados",
  //     },
  //     {
  //       subject: "Volumen en rango",
  //       value: Number(pctEnRangoVolumen ?? 0),
  //       meta: `Dentro de ±${tolerancia} %`,
  //     },
  //     {
  //       subject: "Peso en rango",
  //       value: Number(pctPesoEnRango ?? 0),
  //       meta: `Dentro de ±${toleranciaKgCliente} Kg`,
  //     },
  //   ];
  // }, [
  //   comparativoFiltrado,
  //   kpis,
  //   kpiVehiculos,
  //   tolerancia,
  //   toleranciaKgCliente,
  //   seriesMermasDetalladaFiltrada,
  // ]);
  const radarSummaryData = useMemo(() => {
    const rowsNoRechazados = (comparativoFiltrado ?? []).filter(
      (r) => !r.rechazado && !r.rechazadoCliente
    );

    const tol = Number(tolerancia ?? 0);
    const tolKg = Number(toleranciaKgCliente ?? 0);
    const tolPct = (tol * 100).toFixed(2);

    const pctDespachosRealizados =
      kpis.viajesProgramados > 0
        ? (kpis.viajesRealizados / kpis.viajesProgramados) * 100
        : 0;

    const rowsClienteFactEvaluables = rowsNoRechazados.filter((r) => {
      const base = Number(r.cantidadProgramada ?? 0);
      const recibidoCliente = Number(r.volumenRecibidoCliente ?? 0);

      return base > 0 && recibidoCliente > 0;
    });

    const cumplidosClientFact = rowsClienteFactEvaluables.filter((r) => {
      const diffClienteFacturado = Number(
        r.diffClienteFacturado ??
        r.diffCliente_Facturado ??
        r.diffCliente ??
        0
      );

      const base = Number(r.cantidadProgramada ?? 0);
      const limite = base * tol;

      return Math.abs(diffClienteFacturado) <= limite;
    }).length;

    const pctEnRangoVolumen = rowsClienteFactEvaluables.length
      ? (cumplidosClientFact / rowsClienteFactEvaluables.length) * 100
      : 0;

    const rowsPeso = seriesMermasDetalladaFiltrada ?? [];

    const pctPesoEnRango = rowsPeso.length
      ? (rowsPeso.filter((r) => {
        const diffKg = Number(r.diffPesoCliente ?? 0);
        return diffKg >= -tolKg && diffKg <= tolKg;
      }).length /
        rowsPeso.length) *
      100
      : 0;

    return [
      {
        subject: "Cumpl. Volumen",
        value: Number(kpis.pctCumplCant ?? 0),
        meta: "Programado vs despachado según tolerancia de despacho",
      },
      {
        subject: "Cumpl. Despachos",
        value: Number(kpis.pctCumplViaje ?? 0),
        meta: "Programación vs despacho realizado",
      },
      {
        subject: "Vehículos OK",
        value: Number(kpiVehiculos.pct ?? 0),
        meta: "Vehículos aceptados sobre total despachado",
      },
      {
        subject: "Despachos ejecutados",
        value: Number(pctDespachosRealizados ?? 0),
        meta: "Viajes realizados sobre viajes programados",
      },
      {
        subject: "Client/Fact",
        value: Number(pctEnRangoVolumen ?? 0),
        meta: `Volumen recibido cliente vs facturado dentro de ±${tolPct}%`,
      },
      {
        subject: "Peso en rango",
        value: Number(pctPesoEnRango ?? 0),
        meta: `Dentro de ±${toleranciaKgCliente} Kg`,
      },
    ];
  }, [
    comparativoFiltrado,
    kpis,
    kpiVehiculos,
    tolerancia,
    toleranciaKgCliente,
    seriesMermasDetalladaFiltrada,
  ]);

  // resumen data radar
  const radarResumen = useMemo(() => {
    const rows = comparativoFiltrado ?? [];

    const estados = rows.reduce((acc, r) => {
      const estado = r.estadoProgramacion || "Sin datos";
      acc[estado] = (acc[estado] ?? 0) + 1;
      return acc;
    }, {});

    return {
      filas: kpis.filas,

      viajesProgramados: kpis.viajesProgramados,
      viajesRealizados: kpis.viajesRealizados,

      pctCumplCant: kpis.pctCumplCant,
      pctCumplViaje: kpis.pctCumplViaje,

      pctFechaEntrega: kpis.pctCumplFechaEntrega,
      totalFechaEntrega: kpis.totalFechaEntrega,
      cumplidosFechaEntrega: kpis.cumplidosFechaEntrega,
      noCumplidosFechaEntrega: kpis.noCumplidosFechaEntrega,
      excluidosFechaEntrega: kpis.excluidosFechaEntrega,

      pctVehiculos: kpiVehiculos.pct,

      estados,
    };
  }, [comparativoFiltrado, kpis, kpiVehiculos]);

  // kpi use memo cumplimiento fecha entrega
  const pieCumplimientoFechaEntrega = useMemo(() => {
    const rows = (comparativoFiltrado ?? []).filter(
      (r) =>
        !r.rechazado &&
        !r.rechazadoCliente &&
        r.tieneCampoFechaEstimadaEntrega &&
        r.tieneCampoFechaEntrega
    );

    const cumple = rows.filter((r) => {
      return (
        r.fechaEstimadaEntrega &&
        r.fechaEntrega &&
        r.fechaEntrega <= r.fechaEstimadaEntrega
      );
    }).length;

    const noCumple = rows.filter((r) => {
      return (
        r.fechaEstimadaEntrega &&
        r.fechaEntrega &&
        r.fechaEntrega > r.fechaEstimadaEntrega
      );
    }).length;

    const sinDatos = rows.filter((r) => {
      return !r.fechaEstimadaEntrega || !r.fechaEntrega;
    }).length;

    return [
      {
        name: "Cumple Fecha Entrega",
        value: cumple,
        color: "#36b865",
      },
      {
        name: "No Cumple Fecha Entrega",
        value: noCumple,
        color: "#e53935",
      },
      {
        name: "Sin datos - Castiga KPI",
        value: sinDatos,
        color: "#9ca3af",
      },
    ].filter((x) => x.value > 0);
  }, [comparativoFiltrado]);

  // =============================  CUSTOMER TOOLTIP RENDER  =====================================
  //tooltip personalizado para ver datos mas completos en grafica
  const CustomMermasTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const row = payload[0]?.payload;
    if (!row) return null;

    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 2,
          p: 1.5,
          boxShadow: 3,
          minWidth: 260,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}> Detalle del registro</Typography>
        <Typography variant="body2"> <strong>Estado:</strong> {row.estadoProgramacion || "Sin estado"} </Typography>
        <Typography variant="body2"> <strong>Fecha:</strong> {row.fecha} </Typography>
        <Typography variant="body2"><strong>Cliente:</strong> {row.cliente || "Sin dato"}</Typography>
        <Typography variant="body2"> <strong>Conductor:</strong> {row.conductor || "Sin dato"}</Typography>
        <Typography variant="body2"><strong>Vol. despachado Amb.:</strong> {formatNumber(row.volumenDespachado)} L </Typography>
        <Typography variant="body2"> <strong>Vol. recibido cliente:</strong> {formatNumber(row.volumenRecibidoCliente)} L</Typography>
        <Typography variant="body2"><strong>Peso neto Báscula Ambiocom:</strong> {formatNumber(row.pesoNetoBasculaAmbiocom)} Kg </Typography>
        <Typography variant="body2"> <strong>Peso neto Báscula cliente:</strong> {formatNumber(row.pesoNetoCliente)} Kg </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" sx={{ color: "#a755ca" }}> <strong>Diff peso cliente:</strong> {formatNumber(row.diffPesoCliente)} </Typography>
        <Typography variant="body2" sx={{ color: "#ed6c02" }}> <strong>Diff volumen cliente:</strong> {formatNumber(row.diffVolCliente)} </Typography>
      </Box>
    );
  };

  const renderTooltipDiffKg = (row) => (
    <Box
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 3,
        minWidth: 250,
        color: "#111",
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}> Detalle diferencia Báscula Ambiocom vs B.Cliente</Typography>
      <Typography variant="body2"><strong>Fecha:</strong> {row.fecha}</Typography>
      <Typography variant="body2"> <strong>Estado:</strong> {row.estadoProgramacion || "Sin estado"}</Typography>
      <Typography variant="body2"> <strong>Producto:</strong> {row.producto || "Sin estado"}</Typography>
      <Typography variant="body2"> <strong>Cliente:</strong> {row.cliente || "Sin dato"}</Typography>
      <Typography variant="body2"><strong>Conductor:</strong> {row.conductor || "Sin dato"}</Typography>
      <Typography variant="body2"><strong>Transportadora:</strong> {row.transportadora || "Sin dato"}</Typography>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2"><strong>Neto Ambiocom:</strong> {formatNumber(row.pesoNetoBasculaAmbiocom)} Kg
      </Typography>
      <Typography variant="body2"><strong>Neto cliente:</strong> {formatNumber(row.pesoNetoCliente)} Kg</Typography>
      <Typography variant="body2" sx={{ color: "#a755ca", fontWeight: 700 }}><strong>Diferencia:</strong> {formatNumber(row.diffKgBasculaClienteAmbiocom)} Kg</Typography>
    </Box>
  );

  const renderTooltipDiffVol = (row) => (
    <Box
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 3,
        minWidth: 250,
        color: "#111",
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}> Detalle diferencia en Litros Facturado vs recibido cliente</Typography>
      <Typography variant="body2"><strong>Fecha:</strong> {row.fecha}</Typography>
      <Typography variant="body2"> <strong>Estado:</strong> {row.estadoProgramacion || "Sin estado"}</Typography>
      <Typography variant="body2"> <strong>Producto:</strong> {row.producto || "Sin estado"}</Typography>
      <Typography variant="body2"> <strong>Cliente:</strong> {row.cliente || "Sin dato"}</Typography>
      <Typography variant="body2"><strong>Conductor:</strong> {row.conductor || "Sin dato"}</Typography>
      <Typography variant="body2"><strong>Transportadora:</strong> {row.transportadora || "Sin dato"}</Typography>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2"><strong>Volumen Gravimetrico:</strong> {formatNumber(row.cantidadRealPlanta)} L</Typography>
      <Typography variant="body2"><strong>Volumen Facturado:</strong> {formatNumber(row.cantidadProgramada)} L</Typography>
      <Typography variant="body2"><strong>Volumen Recibido cliente:</strong> {formatNumber(row.volumenRecibidoCliente)} L</Typography>
      <Typography variant="body2" sx={{ color: "#a755ca", fontWeight: 700 }}><strong>Diferencia:</strong> {formatNumber(row.diffCliente)} L</Typography>
    </Box>
  );

  return (
    <Box p={{ xs: 2, md: 4 }} mt={0}>
      <Card elevation={4} sx={{ borderRadius: 3, overflow: "visible" }}>
        <CardContent sx={{ overflow: "visible" }}>
          {/* TOP BAR */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Tooltip title="Volver al Inicio">
                <IconButton
                  onClick={handleBack}
                  color="primary"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>

              <Box>
                <Typography variant="h5" fontWeight="bold" lineHeight={1.1}>
                  Analítica BI: Programado vs Despachado y Indicadores de
                  Cumplimiento.
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 16 }}
                >
                  Rango: <b>{range.from}</b> → <b>{range.to}</b> · Tolerancia:{" "}
                  <b>{formatNumber(tolerancia)}</b> %
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap", // para que en mobile se apilen
              }}
            >
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en tabla (fecha, placa, transportadora, cliente, producto, cantidades...)"
                size="small"
                sx={{ flexGrow: 1, minWidth: { xs: "100%", md: 300, lg: 350 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearch("")}
                        aria-label="Limpiar búsqueda"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Tooltip title="Reset Filtros">
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={clearFilters}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <CleaningServicesIcon />
                </Button>
              </Tooltip>

              <Tooltip title="Resumen General KPI´s">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setOpenRadarModal(true)}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <DonutSmallIcon />
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* KPIs */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>

            <Tooltip title="Total de datos Analizados" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 240 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#E6D9FC",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Datos: ${kpis.filas}`}
              />
            </Tooltip>

            <Tooltip title="Despachos programados | Despachos Realizados" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 220 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                color={hasAnyFilter ? "primary" : "default"}
                label={`Desp. Prog: ${formatNumber(
                  kpis.viajesProgramados
                )} | Despachados: ${formatNumber(kpis.viajesRealizados)}`}
              />
            </Tooltip>

            <Tooltip title="Volumen Programado | Volumen Despachado" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#BBEDDA",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Vol. Progr: ${formatNumber(
                  kpis.cantidadProgramada
                )} L | Vol. Desp: ${formatNumber(kpis.cantidadReal)} L`}
              />
            </Tooltip>

            <Tooltip title="KPI Cumplimiento Volumen Programado vs Despachado" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                color={
                  Math.abs(kpis.diffTotal) <= tolerancia ? "success" : "warning"
                }
                label={`Diff Total: ${formatNumber(kpis.diffTotal)} L`}
                sx={{
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                  transition: "all 0.3s ease",
                  ...(Math.abs(kpis.diffTotal) > tolerancia && {
                    animation: "pulseGlow 1s infinite",
                  }),
                  "@keyframes pulseGlow": {
                    "0%": {
                      boxShadow: "0 0 0px rgba(255, 152, 0, 0.4)",
                      transform: "scale(1)",
                    },
                    "50%": {
                      boxShadow: "0 0 12px rgba(255, 152, 0, 0.9)",
                      transform: "scale(1.1)",
                    },
                    "100%": {
                      boxShadow: "0 0 0px rgba(255, 152, 0, 0.4)",
                      transform: "scale(1)",
                    },
                  },
                }}
              />
            </Tooltip>

            <Tooltip title="Diff Planta Σ" placement="top" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                label={`Diff Planta Σ: ${formatNumber(kpis.diffPlantaTotal)}`}
              />
            </Tooltip>

            <Tooltip title="Diff Cliente Σ" placement="top" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{ fontSize: { xs: 9, sm: 10, md: 12, lg: 12 } }}
                label={`Diff Cliente Σ: ${formatNumber(kpis.diffClienteTotal)}`}
              />
            </Tooltip>
            <Tooltip title="% de registros cuyo volumen despachado quedó dentro de la tolerancia configurada" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#CBDAF7",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`% Cump Vol.: ${kpis.pctCumplCant.toFixed(1)}%`}
              />
            </Tooltip>

            <Tooltip title="% de registros donde hubo programación y también despacho real" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 240 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#D7F5E8",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`% Cump Desp.: ${kpis.pctCumplViaje.toFixed(1)}%`}
              />
            </Tooltip>

            <Tooltip title="KPI de cumplimiento de Despachos respecto a la programacion diaria" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: 12, textAlign: "center", maxWidth: 260 } } }}>
              <Chip
                sx={{
                  backgroundColor: "#FFD8B8",
                  fontSize: { xs: 9, sm: 10, md: 12, lg: 12 },
                }}
                label={`Desp Prog.: ${formatNumber(
                  kpiVehiculos.total
                )} | Cumplen: ${formatNumber(
                  kpiVehiculos.cumplidos
                )} | Rechazos: ${formatNumber(
                  kpiVehiculos.rechazados
                )} | ${kpiVehiculos.pct.toFixed(1)}%`}
              />
            </Tooltip>

            {loading && (
              <Tooltip title="hola" placement="top">
                <Chip color="warning" label="Cargando..." />
              </Tooltip>
            )}

          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Filtros */}
          <Grid container spacing={2}>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <TextField
                size="small"
                type="date"
                label="Desde"
                name="from"
                value={range.from}
                onChange={handleRangeChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                name="to"
                value={range.to}
                onChange={handleRangeChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />

              <TextField
                size="small"
                label="Tolerancia KPi (%)"
                type="number"
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 190 } }}
              />

              <TextField
                size="small"
                label="Tolerancia Kg Diferencia Cliente"
                type="number"
                value={toleranciaKgCliente}
                onChange={(e) => setToleranciaKgCliente(Number(e.target.value))}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", md: 250 } }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => fetchAll(range)}
                >
                  Consultar
                </Button>
                <Tooltip title="Refrescar datasets con el rango actual">
                  <Button
                    variant="outlined"
                    size="small"
                    // startIcon={<RefreshIcon />}
                    onClick={() => fetchAll(range)}
                  >
                    <RefreshIcon />
                  </Button>
                </Tooltip>

                <Tooltip title="Restablecer Filtro mes actual y anterior">
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={() => {
                      const def = getDefaultRange();
                      setRange(def);
                      fetchAll(def);
                    }}
                  >
                    <RestoreIcon />
                  </Button>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Fecha"
                name="fecha"
                value={filters.fecha}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {filterOptions.fechas.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Transportadora"
                name="transportadora"
                value={filters.transportadora}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {filterOptions.transportadoras.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Cliente"
                name="cliente"
                value={filters.cliente}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {filterOptions.clientes.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Producto"
                name="producto"
                value={filters.producto}
                onChange={handleFilterChange}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {filterOptions.productos.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Gráficas con RECHA*/}
          <Grid container spacing={2}>

            <OtiffGeneralCollapsible
              comparativoFiltrado={comparativoFiltrado}
              tolerancia={tolerancia}
              pieCumpleVsNoCumpleHoraProgramada={pieCumpleVsNoCumpleHoraProgramada}
              pieCumplimientoFechaEntrega={pieCumplimientoFechaEntrega}
              range={range}
              formatNumber={formatNumber}
              formatNumber1D={formatNumber1D}
              metaOtiff={95}
            />

            <LineChartProgramadoVsReal
              seriesPorDia={seriesPorDia}
              formatNumber={formatNumber}
              formatNumber1D={formatNumber1D}
            />

            <PieChartsAnalisis
              tolerancia={tolerancia}
              toleranciaKgCliente={toleranciaKgCliente}
              pieCumplimientoPeso={pieCumplimientoPeso}
              pieTransportadoras={pieTransportadoras}
              pieToleranciaRango={pieToleranciaRango}
              pieCumpleVsNoCumple={pieCumpleVsNoCumple}
              pieCumpleVsNoCumpleHoraProgramada={pieCumpleVsNoCumpleHoraProgramada}
              pieCumplimientoFechaEntrega={pieCumplimientoFechaEntrega}
            />

            <BarChartDiffTransportadora
              seriesPosNegPorTransportadora={seriesPosNegPorTransportadora}
              colorByTransportadora={colorByTransportadora}
              formatNumber={formatNumber}
              formatNumber1D={formatNumber1D}
            />

            <LineChartMermas
              seriesMermasDetalladaFiltrada={seriesMermasDetalladaFiltrada}
              CustomMermasTooltip={CustomMermasTooltip}
              formatNumber1D={formatNumber1D}
            />

            <BarChartCumplimiento
              seriesCumplimientoPorTransportadora={seriesCumplimientoPorTransportadora}
              hasRechazosAmbiocom={hasRechazosAmbiocom}
              hasRechazosCliente={hasRechazosCliente}
              formatNumber={formatNumber}
              formatNumber1D={formatNumber1D}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Tabla comparativa + Heatmap */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Tabla comparativa (Heatmap por diferencia)
          </Typography>

          <TableContainer
            component={Paper}
            elevation={2}
            sx={{
              borderRadius: 2,
              overflow: "visible",
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                tableLayout: "fixed",
                "& thead th": {
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: "linear-gradient(135deg, #f8f8f8, #f3f3f3)",
                },
                "& tbody td": { fontSize: 13, py: 0.5 },
                "& tbody th": { fontSize: 10, py: 0.5 },
                "& th": {
                  fontSize: 12,
                  fontWeight: 400,
                  py: 0,
                },
              }}
            >
              <TableHead >
                <TableRow>
                  <TableCell align="center"
                    sx={{ width: "auto", minWidth: 120, maxWidth: 120 }}
                  >
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Transportadora</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Producto</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Placa</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Vehiculo Programado</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Vehiculo en Despacho</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Vechiculo en programación y vechiculo despachado (SI=100% ; NO= 0,0%)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Cumple Programación ?</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Cantidad Facturada</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Vol. Gravimetrico Despa</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="Diferencia entre el volumen gravimetrico y el volumen facturado, determina que tanto o menos se despacha a clientes (< 0 = por encima de lo facturado)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diferencia Facturado - Gravimétrico</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Volumen Programado vs Volumen Real Despachado (<100 = Despachado por encima de lo Facturado ; >100 = Despachado por debajo de lo facturado)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>KPI Despacho (Vp-Vd)</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Cantidad Facturada vs Vol. Despachado Gravimétrico, según tolerancia en el Despacho 0.2% "
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Cumple Cantidad Despachada ?</strong>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Diferencia Volumen Contador Despacho - Volumen Facturado"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Vol. recibido Cliente</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Diferencia Volumen Facturado Ambiocom - Volumen Recibido por el cliente"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diff Facturado-R.Cliente</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="Diferencia entre el peso neto Báscula Ambiocom vs Báscula Cliente"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Diff Kg B.Ambio-B.Cliente</strong>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Volumen recibido por el cliente vs Volumen Facturado Ambiocom"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Client/Fact</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI Estado del vehiculo (rechazo en planta o rechazo por el cliente)"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Vehiculo Rechazado ?</strong>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      placement="top"
                      title="KPI de estado en tiempo real del vehiculo (Rechazado por el cliente; rechazado en planta; En proceso = En Cargue o En Transito; Aprobado con observaciones; Cumple = Programado y Despachado; Programado pero no despachado; Despachado pero no Programado; No programado = despachado pero no estaba programado )"
                      slotProps={{
                        tooltip: { sx: { fontSize: 13, textAlign: "center" } },
                      }}
                    >
                      <strong>Estado Vehiculo</strong>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {comparativoFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={19} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">
                        No hay resultados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prueba cambiando rango, filtros o búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  comparativoFiltrado.map((r, idx) => {
                    const prev = comparativoFiltrado[idx - 1];
                    const nuevaFecha = !prev || prev.fecha !== r.fecha;

                    return (
                      <Fragment key={r.key}>
                        {nuevaFecha && (
                          <TableRow>
                            <TableCell
                              colSpan={19}
                              sx={{
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                                backgroundColor: "rgba(25, 118, 210, 0.08)",
                                fontWeight: "bold",
                                py: 1,
                              }}
                            >
                              📅 {r.fecha}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow hover>
                          <TableCell>{r.fecha}</TableCell>
                          <TableCell>{r.transportadora}</TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 260,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={r.cliente}
                          >
                            {r.cliente}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 260,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={r.producto}
                          >
                            {r.producto}
                          </TableCell>
                          <TableCell align="center">
                            {r.placa || "Sin placa"}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.viajesProgramados)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.viajesRealizados)}
                          </TableCell>
                          <TableCell align="center">
                            {(r.rechazado || r.rechazadoCliente) ? (
                              <Chip
                                size="small"
                                label="X"
                                sx={{
                                  backgroundColor: "#9E9E9E",
                                  color: "#fff",
                                  fontWeight: "bold",
                                  minWidth: 32,
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={r.cumplioViaje ? "SI" : "NO"}
                                color={r.cumplioViaje ? "success" : "error"}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.cantidadProgramada)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(r.cantidadRealPlanta)}
                          </TableCell>
                          <Tooltip placement="top" title={`Tolerancia en el Despacho: ${tolerancia}, diferencia desp/fact : ${r.diffCantidad}, volumen máximo merma : ${Number(r.cantidadProgramada) * Number(tolerancia)}`}>
                            <TableCell
                              align="right"
                              sx={{
                                backgroundColor: heatBg(
                                  r.diffCantidad,
                                  Number(r.cantidadProgramada) * Number(tolerancia)
                                ),
                              }}
                            >
                              {formatNumber(r.diffCantidad)}
                            </TableCell>
                          </Tooltip>
                          <TableCell
                            align="right"
                            sx={{
                              backgroundColor: heatCumplimiento(
                                r.cumplimientoPct
                              ),
                              fontWeight: 600,
                            }}
                          >
                            <Tooltip placement="top" title="porcentaje de cumplimiento, Volumen Programado vs Real Despachado" >
                              {r.cumplimientoPct.toFixed(1)}%
                            </Tooltip>
                          </TableCell>
                          <Tooltip
                            placement="top"
                            arrow
                            title={
                              <Box sx={{ p: 0.5, minWidth: 280 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.8 }}>
                                  Validación despacho vs facturado
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Tolerancia:</strong>{" "}
                                  {(Number(tolerancia ?? 0) * 100).toFixed(1)}%
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Volumen facturado:</strong>{" "}
                                  {Number(r.cantidadProgramada ?? 0).toFixed(1)} L
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Volumen despachado:</strong>{" "}
                                  {Number(r.cantidadRealPlanta ?? 0).toFixed(1)} L
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Diferencia facturado-despachado:</strong>{" "}
                                  {(
                                    Number(r.cantidadProgramada ?? 0) -
                                    Number(r.cantidadRealPlanta ?? 0)
                                  ).toFixed(1)}{" "}
                                  L
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Merma máxima:</strong>{" "}
                                  {(
                                    Number(r.cantidadProgramada ?? 0) *
                                    Number(tolerancia ?? 0)
                                  ).toFixed(1)}{" "}
                                  L
                                </Typography>

                                <Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.25)" }} />

                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color:
                                      Math.abs(
                                        Number(r.cantidadProgramada ?? 0) -
                                        Number(r.cantidadRealPlanta ?? 0)
                                      ) <=
                                        Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                        ? "#A7F3D0"
                                        : "#FCA5A5",
                                  }}
                                >
                                  {Math.abs(
                                    Number(r.cantidadProgramada ?? 0) -
                                    Number(r.cantidadRealPlanta ?? 0)
                                  ) <=
                                    Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                    ? "Cumple dentro de la merma permitida"
                                    : "No cumple: supera la merma permitida"}
                                </Typography>
                              </Box>
                            }
                          >
                            <TableCell align="center">
                              {(r.rechazado || r.rechazadoCliente) ? (
                                <Chip
                                  size="small"
                                  label="X"
                                  sx={{
                                    backgroundColor: "#9E9E9E",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    minWidth: 32,
                                  }}
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label={r.cumplioCantidadDespachada ? "SI" : "NO"}
                                  color={r.cumplioCantidadDespachada ? "success" : "error"}
                                />
                              )}
                            </TableCell>
                          </Tooltip>

                          <Tooltip
                            placement="top"
                            arrow
                            title={`Volumen recibido por el cliente: ${Number(
                              r.volumenRecibidoCliente ?? 0
                            ).toFixed(1)} L`}
                          >
                            <TableCell align="right">
                              {Number(r.volumenRecibidoCliente ?? 0).toFixed(1)} L
                            </TableCell>
                          </Tooltip>

                          <Tooltip
                            arrow
                            placement="top"
                            title={renderTooltipDiffVol(r)}
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: "transparent",
                                  boxShadow: "none",
                                  p: 0,
                                  maxWidth: "none",
                                },
                              },
                            }}
                          >
                            <TableCell
                              align="right"
                              sx={{
                                backgroundColor: heatBg(r.diffCliente_Facturado, Number(r.cantidadProgramada) * Number(tolerancia), r),
                                fontWeight: 600,
                              }}
                            >
                              {formatNumber(r.diffCliente_Facturado)}
                            </TableCell>
                          </Tooltip>

                          <TableCell
                            align="right"
                            sx={{
                              backgroundColor: heatBgKg(r.diffKgBasculaClienteAmbiocom, Number(r.cantidadProgramada) * Number(tolerancia), r),
                              fontWeight: 600,
                            }}
                          >
                            <Tooltip
                              arrow
                              placement="top"
                              title={renderTooltipDiffKg(r)}
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    backgroundColor: "transparent",
                                    boxShadow: "none",
                                    p: 0,
                                    maxWidth: "none",
                                  },
                                },
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-block",
                                  width: "100%",
                                  cursor: "help",
                                }}
                              >
                                {formatNumber(r.diffKgBasculaClienteAmbiocom)}
                              </Box>
                            </Tooltip>
                          </TableCell>

                          <Tooltip
                            placement="top"
                            arrow
                            title={
                              <Box sx={{ p: 0.5, minWidth: 260 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.8 }}>
                                  Validación merma cliente vs facturado
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Tolerancia:</strong> {(Number(tolerancia) * 100).toFixed(2)}%
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Volumen facturado:</strong>{" "}
                                  {formatNumber(r.cantidadProgramada)} L
                                </Typography>
                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Volumen recibido cliente:</strong>{" "}
                                  {formatNumber(r.volumenRecibidoCliente ?? 0)} L
                                </Typography>
                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Merma máxima:</strong>{" "}
                                  {formatNumber(Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0))} L
                                </Typography>

                                <Typography sx={{ fontSize: 12 }}>
                                  <strong>Dif. cliente vs facturado:</strong>{" "}
                                  {formatNumber(r.diffClienteFacturado ?? r.diffCliente_Facturado ?? 0)} L
                                </Typography>

                                <Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.25)" }} />

                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color:
                                      Math.abs(Number(r.diffClienteFacturado ?? r.diffCliente_Facturado ?? 0)) <=
                                        Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                        ? "#A7F3D0"
                                        : "#FCA5A5",
                                  }}
                                >
                                  {Math.abs(Number(r.diffClienteFacturado ?? r.diffCliente_Facturado ?? 0)) <=
                                    Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                    ? "Cumple dentro de la merma permitida"
                                    : "No cumple: supera la merma permitida"}
                                </Typography>
                              </Box>
                            }
                          >
                            <TableCell align="center">
                              {(r.rechazado || r.rechazadoCliente) ? (
                                <Chip
                                  size="small"
                                  label="X"
                                  sx={{
                                    backgroundColor: "#9E9E9E",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    minWidth: 32,
                                  }}
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label={
                                    Number(r.cantidadProgramada ?? 0) > 0 &&
                                      Number(r.volumenRecibidoCliente ?? 0) > 0 &&
                                      Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0) > 0 &&
                                      Math.abs(Number(r.diffCliente_Facturado ?? 0)) <=
                                      Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                      ? "SI"
                                      : "NO"
                                  }
                                  color={
                                    Number(r.cantidadProgramada ?? 0) > 0 &&
                                      Number(r.volumenRecibidoCliente ?? 0) > 0 &&
                                      Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0) > 0 &&
                                      Math.abs(Number(r.diffCliente_Facturado ?? 0)) <=
                                      Number(r.cantidadProgramada ?? 0) * Number(tolerancia ?? 0)
                                      ? "success"
                                      : "error"
                                  }
                                />
                              )}
                            </TableCell>
                          </Tooltip>

                          <TableCell align="center">
                            <Tooltip
                              arrow
                              placement="top"
                              title={
                                (r.rechazado || r.rechazadoCliente)
                                  ? "Vehículo Rechazado"
                                  : "Vehículo Aceptado"
                              }
                              slotProps={{
                                tooltip: {
                                  sx: { fontSize: 14, },
                                },
                              }}
                            >
                              <Chip
                                size="small"
                                icon={(r.rechazado || r.rechazadoCliente) ? <CancelIcon /> : <CheckIcon />}
                                color={(r.rechazado || r.rechazadoCliente) ? "error" : "success"}
                                sx={{
                                  width: 25,
                                  justifyContent: "center",
                                  "& .MuiChip-icon": {
                                    marginLeft: 1.5,
                                  },
                                }}
                              />
                            </Tooltip>
                          </TableCell>

                          <TableCell align="center" sx={{ width: 350 }}>
                            <Tooltip
                              arrow
                              placement="top"
                              title={r.estadoProgramacion}
                              slotProps={{
                                tooltip: {
                                  sx: {
                                    fontSize: 14,
                                  },
                                },
                              }}
                            >
                              <Chip
                                size="medium"
                                sx={{ cursor: "pointer", }}
                                onDoubleClick={(e) => { e.stopPropagation(); handleDblClickEstado(r); }}
                                // label={r.estadoProgramacion}
                                icon={
                                  r.estadoProgramacion === "Cumple" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.2}
                                    >
                                      <PlaylistAddCheckIcon fontSize="medium" sx={{ fontSize: 30, color: "#4DBD5B" }} />
                                      <LocalShippingIcon fontSize="small" sx={{ fontSize: 27, color: "#6384BF" }} />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "Programado (no despachado)" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.2}
                                    >
                                      <PlaylistAddCheckIcon fontSize="medium" sx={{ fontSize: 30, color: "#4DBD5B" }} />
                                      <LocalShippingIcon fontSize="small" sx={{ fontSize: 27, color: "#F07D8C" }} />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "No programado" ? (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.2}
                                    >
                                      <PlaylistRemoveIcon fontSize="medium" sx={{ fontSize: 30, color: "#E35542" }} />
                                      <LocalShippingIcon fontSize="small" sx={{ fontSize: 27, color: "#6384BF" }} />
                                    </Box>
                                  ) : r.estadoProgramacion ===
                                    "Rechazado por cliente" ? (
                                    <UndoIcon sx={{ fontSize: 26, color: "red !important", }} />
                                  ) : r.estadoProgramacion ===
                                    "Rechazado Ambiocom" ? (
                                    <PersonRemoveAlt1Icon sx={{ fontSize: 26, color: "#9E7CCF !important", }} />
                                  ) : r.estadoProgramacion ===
                                    "Aprobado con observaciones" ? (
                                    <ReportIcon
                                      sx={{
                                        fontSize: 26,
                                        color: "orange !important",
                                      }}
                                    />
                                  ) : r.estadoProgramacion === "En proceso" ? (
                                    <LocalGasStationIcon sx={{ fontSize: 26, color: "#64A7CC !important", }}
                                    />
                                  ) : r.estadoProgramacion === "Aprobado En Cliente" ? (
                                    <Box
                                      sx={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.2,
                                      }}
                                    >
                                      <PlaylistAddCheckIcon sx={{ fontSize: 30, color: "#4DBD5B" }} />
                                      <LocalShippingIcon sx={{ fontSize: 27, color: "#4DBD5B" }} />
                                      {/* Icono pequeño parpadeando */}
                                      <HowToRegIcon
                                        sx={{
                                          position: "absolute",
                                          top: -8,
                                          right: -5,
                                          fontSize: 23,
                                          color: "#000000",
                                          animation: "blinkIcon 0.8s infinite",

                                          "@keyframes blinkIcon": {
                                            "0%": { opacity: 1, transform: "scale(1)" },
                                            "50%": { opacity: 0.2, transform: "scale(0.9)" },
                                            "100%": { opacity: 1, transform: "scale(1)" },
                                          },
                                        }}
                                      />
                                    </Box>
                                  ) : (
                                    <RemoveCircleOutlineIcon />
                                  )
                                }
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </CardContent>
      </Card>

      <ResumenKpiRadarModal
        open={openRadarModal}
        onClose={() => setOpenRadarModal(false)}
        radarData={radarSummaryData}
        resumen={radarResumen}
      />

      {/* MODAL DE OBSERVACIONES */}
      <ObservacionEstadoModal
        open={openObsEstado}
        onClose={() => setOpenObsEstado(false)}
        data={obsEstadoData}
        title="Observación del estado"
        subtitle="Detalle de novedad / validación del despacho"
      />
    </Box>
  );
};

export default DataAnalisysProgramacionDespacho;