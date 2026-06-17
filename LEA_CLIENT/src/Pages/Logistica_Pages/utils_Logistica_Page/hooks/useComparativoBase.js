import { useMemo } from "react";

import { isValidDateISO } from "../helpers/dateHelpers";
import {
  hasOwn,
  normalizeDateOnly,
  normalizeKey,
  normalizeText,
} from "../helpers/normalizers";
import {
  getEstadoVehiculo,
  isAprobado,
  isAprobadoConObs,
  isAprobadocliente,
  isEnProceso,
  isRechazado,
  isRechazadoCliente,
} from "../helpers/estadoHelpers";

const getPlacaProgramacion = (p) =>
  normalizeKey(
    p?.placa ??
    p?.placaVehiculo ??
    p?.vehiculo ??
    p?.tractomula ??
    ""
  );

const getPlacaDespacho = (d) =>
  normalizeKey(
    d?.placa ??
    d?.placaVehiculo ??
    d?.vehiculo ??
    d?.lecturas?.placa ??
    d?.lecturas?.placaVehiculo ??
    d?.lecturas?.vehiculo ??
    d?.lecturas?.tractomula ??
    ""
  );

const keyProgramacion = (p) => {
  const fecha = normalizeText(p?.fecha);
  const transportadora = normalizeKey(p?.transportadora);
  const cliente = normalizeKey(p?.cliente);
  const producto = normalizeKey(p?.producto);
  const placa = normalizeKey(p?.placa);

  return `${fecha}|${transportadora}|${cliente}|${producto}|${placa}`;
};

const keyDespacho = (d) => {
  const fecha = normalizeText(d?.fecha);
  const transportadora = normalizeKey(d?.lecturas?.transportadora);
  const cliente = normalizeKey(d?.lecturas?.cliente);
  const producto = normalizeKey(d?.lecturas?.producto);
  const placa = normalizeKey(d?.lecturas?.placa);

  return `${fecha}|${transportadora}|${cliente}|${producto}|${placa}`;
};

const getDespachoCantidadRealPlanta = (d) =>
  Number(d?.lecturas?.volumen_contador_gravimetrico ?? 0);

const getDespachoDifPlanta = (d) =>
  Number(d?.lecturas?.variación_volumen ?? 0);

const getDespachoDifCliente = (d) =>
  Number(d?.lecturas?.diferencia_recibo_cliente ?? 0);

const getDespachoDifKgCliente = (d) =>
  Number(d?.lecturas?.kilos_peso_neto ?? 0) -
  Number(d?.lecturas?.peso_neto_bascula_ambiocom ?? 0);

const buildComparativoBase = ({ programaciones, despachos }) => {
  const group = (rows, getKey) => {
    const m = new Map();

    for (const r of rows ?? []) {
      const k = getKey(r);

      // evita registros sin fecha válida o llave totalmente vacía
      if (!k || k.startsWith("|")) continue;

      const arr = m.get(k) || [];
      arr.push(r);
      m.set(k, arr);
    }

    return m;
  };

  const progG = group(programaciones, keyProgramacion);
  const despG = group(despachos, keyDespacho);

  const keys = new Set([...progG.keys(), ...despG.keys()]);
  const out = [];

  for (const key of keys) {
    const [fecha, transportadora, cliente, producto, placa] = key.split("|");
    if (!isValidDateISO(fecha)) continue;

    const progs = progG.get(key) || [];
    const desps = despG.get(key) || [];
    const n = Math.max(progs.length, desps.length);

    for (let i = 0; i < n; i++) {
      const p = progs[i] || null;
      const d = desps[i] || null;

      const cantidadProgramada = Number(p?.cantidad ?? 0);
      const cantidadRealPlanta = Number(getDespachoCantidadRealPlanta(d) ?? 0);

      const estadoVehiculo = d ? getEstadoVehiculo(d) : "";

      const rechazado = d ? isRechazado(estadoVehiculo) : false;
      const rechazadoCliente = d ? isRechazadoCliente(estadoVehiculo) : false;
      const aprobado = d ? isAprobado(estadoVehiculo) : false;
      const aprobadoConObs = d ? isAprobadoConObs(estadoVehiculo) : false;
      const enProceso = d ? isEnProceso(estadoVehiculo) : false;
      const Aprobadocliente = d ? isAprobadocliente(estadoVehiculo) : false;

      const diffCantidad = cantidadProgramada - cantidadRealPlanta;
      const diffPlanta = Number(getDespachoDifPlanta(d) ?? 0);
      const diffCliente = Number(getDespachoDifCliente(d) ?? 0);
      const diffKgBasculaClienteAmbiocom = Number(
        getDespachoDifKgCliente(d) ?? 0
      );

      const cumplimientoPct =
        cantidadProgramada > 0
          ? (cantidadRealPlanta / cantidadProgramada) * 100
          : 0;

      const tieneCampoFechaEstimadaEntrega = hasOwn(
        p,
        "fechaEstimadaEntrega"
      );

      const tieneCampoFechaEntrega =
        hasOwn(d?.lecturas, "fecha_entrega") || hasOwn(d, "fecha_entrega");

      out.push({
        key: `${key}|${i}`,

        fecha,
        transportadora,
        cliente,
        producto,
        placa,

        tieneCampoFechaEstimadaEntrega,
        tieneCampoFechaEntrega,

        fechaEstimadaEntrega: normalizeDateOnly(p?.fechaEstimadaEntrega),
        fechaEntrega: normalizeDateOnly(
          d?.lecturas?.fecha_entrega ?? d?.fecha_entrega
        ),

        horaProgramada: normalizeText(p?.horaProgramada),
        horaLlegada: normalizeText(
          d?.lecturas?.hora_llegada ?? d?.hora_llegada
        ),

        conductor: normalizeText(d?.lecturas?.nombre_conductor),

        observacion: normalizeText(
          d?.observaciones ??
          d?.lecturas?.observaciones ??
          d?.lecturas?.observacion ??
          ""
        ),

        viajesProgramados: p ? 1 : 0,
        viajesRealizados: d ? 1 : 0,

        cantidadProgramada,
        cantidadRealPlanta,

        volumenRecibidoCliente: Number(
          d?.lecturas?.cantidad_recibida_cliente ?? 0
        ),

        pesoNetoCliente: Number(d?.lecturas?.kilos_peso_neto ?? 0),
        pesoNetoBasculaAmbiocom: Number(
          d?.lecturas?.peso_neto_bascula_ambiocom ?? 0
        ),

        diffCantidad,
        diffPlanta,
        diffCliente,
        diffKgBasculaClienteAmbiocom,
        cumplimientoPct,

        tieneProgramacion: !!p,
        tieneDespacho: !!d,

        rechazado,
        rechazadoCliente,
        aprobado,
        aprobadoConObs,
        enProceso,
        Aprobadocliente,
        estadoVehiculo,
      });
    }
  }

  out.sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);

    if (a.transportadora !== b.transportadora) {
      return a.transportadora.localeCompare(b.transportadora);
    }

    if (a.cliente !== b.cliente) {
      return a.cliente.localeCompare(b.cliente);
    }

    if (a.producto !== b.producto) {
      return a.producto.localeCompare(b.producto);
    }

    return String(a.placa ?? "").localeCompare(String(b.placa ?? ""));
  });

  return out;
};

const useComparativoBase = ({ programaciones, despachos }) => {
  return useMemo(() => {
    return buildComparativoBase({ programaciones, despachos });
  }, [programaciones, despachos]);
};

export default useComparativoBase;