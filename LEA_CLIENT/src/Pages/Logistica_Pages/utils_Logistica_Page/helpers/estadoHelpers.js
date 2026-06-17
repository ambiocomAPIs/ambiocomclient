import { normalizeKey, normalizeText } from "./normalizers";

export const getEstadoVehiculo = (d) =>
  normalizeText(d?.lecturas?.vehiculo_rechazado).toUpperCase();

export const isAprobado = (estado) => ["APROBADO AMBIOCOM"].includes(estado);
export const isAprobadoConObs = (estado) => ["APROBADO CON OBSERVACIONES"].includes(estado);
export const isRechazado = (estado) => ["RECHAZADO AMBIOCOM"].includes(estado);
export const isRechazadoCliente = (estado) => ["RECHAZADO POR CLIENTE"].includes(estado);
export const isEnProceso = (estado) => ["EN PLANTA", "EN TRANSITO", "EN CARGUE", "EN CLIENTE"].includes(estado);
export const isAprobadocliente = (estado) => ["APROBADO POR EL CLIENTE"].includes(estado);

export const getDespachoInfo = (d) => {
  const estado = getEstadoVehiculo(d);

  return {
    fecha: normalizeText(d?.fecha),
    transportadora: normalizeKey(d?.lecturas?.transportadora),
    cliente: normalizeKey(d?.lecturas?.cliente),
    producto: normalizeKey(d?.lecturas?.producto),
    placa: normalizeKey(d?.lecturas?.placa),

    estadoVehiculo: estado,

    rechazado: isRechazado(estado),
    rechazadoCliente: isRechazadoCliente(estado),

    aprobado: isAprobado(estado),
    aprobadoConObs: isAprobadoConObs(estado),

    enProceso: isEnProceso(estado),
    Aprobadocliente: isAprobadocliente(estado),
  };
};
