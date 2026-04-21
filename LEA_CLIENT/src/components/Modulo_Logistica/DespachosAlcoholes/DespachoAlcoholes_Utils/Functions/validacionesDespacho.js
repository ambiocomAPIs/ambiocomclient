const ALERTAS = {
  error: {
    backgroundColor: "rgba(255, 82, 82, 0.18)",
    color: "#b71c1c",
    fontWeight: 700,
    border: "2px solid #ff1744",
  },
  warning: {
    backgroundColor: "rgba(255, 193, 7, 0.20)",
    color: "#8a6d00",
    fontWeight: 700,
    border: "2px solid #ff9100",
  },
  info: {
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    color: "#0d47a1",
    fontWeight: 700,
    border: "2px solid #42a5f5",
  },
  alerta: {
    backgroundColor: "rgba(255, 235, 59, 0.25)",
    color: "#61470e",
    fontWeight: 700,
    border: "2px solid #dac82c",
  },
  ok: {
    backgroundColor: "rgba(194, 67, 187, 0.15)",
    color: "#93279c",
    fontWeight: 600,
    border: "1px solid #e016ae",
  },
};

export const normalizarNumero = (valor) => {
  if (valor === null || valor === undefined) return null;

  const texto = String(valor).trim();

  // Campo vacío
  if (texto === "") return null;

  // Valor centinela usado como "sin dato"
  if (texto === "-1") return -1;

  let limpio = texto.replace(/\s/g, "");

  // Soporta formato tipo 1.234,56
  if (limpio.includes(",") && limpio.includes(".")) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (limpio.includes(",")) {
    limpio = limpio.replace(",", ".");
  }

  const num = Number(limpio);

  if (!Number.isFinite(num)) return null;

  return num;
};

const esVacioLogico = (valorOriginal, valorNormalizado) => {
  if (valorOriginal === null || valorOriginal === undefined) return true;
  if (String(valorOriginal).trim() === "") return true;
  if (valorNormalizado === null) return true;
  if (valorNormalizado === -1) return true;
  return false;
};

const esCero = (n) => n === 0;
const esPositivo = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
const esNumeroValido = (n) =>
  typeof n === "number" && Number.isFinite(n) && n !== -1;

const alertaDatoFaltante = (mensaje) => ({
  tipo: "warning",
  mensaje,
  sx: ALERTAS.warning,
});

const alertaDatoInvalido = (mensaje) => ({
  tipo: "error",
  mensaje,
  sx: ALERTAS.error,
});

export const getCellValidation = ({
  key,
  volumenFacturado,
  volumenDespachado,
  pesoAmbiocomContador,
  pesoAmbiocomBascula,
  pesoBasculaCliente,
  volumenDespachadoGravimetrico,
  volumenRecibidoCliente,
  Densidad,
}) => {
  const facturado = normalizarNumero(volumenFacturado);
  const despachado = normalizarNumero(volumenDespachado);

  const pesoContador = normalizarNumero(pesoAmbiocomContador);
  const pesoBasculaAmb = normalizarNumero(pesoAmbiocomBascula);
  const pesoCliente = normalizarNumero(pesoBasculaCliente);

  const volGrav = normalizarNumero(volumenDespachadoGravimetrico);
  const volCliente = normalizarNumero(volumenRecibidoCliente);

  // =========================================================
  // 1) VALIDACIÓN DE VOLUMEN FACTURADO vs VOLUMEN DESPACHADO
  // =========================================================
  if (["volumen_despachar", "volumen_ambiocom_contador"].includes(key)) {
    // Falta el volumen facturado, pero sí hay volumen despachado
    if (esPositivo(despachado) && esVacioLogico(volumenFacturado, facturado)) {
      return alertaDatoFaltante(
        "Falta el volumen facturado: está vacío, nulo o en -1, pero sí existe volumen despachado."
      );
    }

    // El volumen facturado quedó en 0, pero sí hay volumen despachado
    if (esPositivo(despachado) && esCero(facturado)) {
      return alertaDatoFaltante(
        `El volumen facturado está en 0, pero sí existe volumen despachado (${despachado} L).`
      );
    }

    // Existe volumen facturado, pero falta el volumen despachado
    if (
      esNumeroValido(facturado) &&
      facturado > 0 &&
      esVacioLogico(volumenDespachado, despachado)
    ) {
      return alertaDatoFaltante(
        "Falta el volumen despachado: está vacío, nulo o en -1, pero sí existe volumen facturado."
      );
    }

    // El volumen despachado quedó en 0 y sí hay volumen facturado
    if (esNumeroValido(facturado) && facturado > 0 && esCero(despachado)) {
      return alertaDatoFaltante(
        `El volumen despachado está en 0, pero sí existe volumen facturado (${facturado} L).`
      );
    }

    // Ambos valores en 0 no son válidos en esta operación
    if (esCero(facturado) && esCero(despachado)) {
      return alertaDatoInvalido(
        "Volumen facturado y volumen despachado están ambos en 0. Debe existir al menos un volumen de referencia válido."
      );
    }

    // Si no hay dos números válidos, no se puede comparar tolerancia
    if (!esNumeroValido(facturado) || !esNumeroValido(despachado)) {
      return null;
    }

    // Si el despachado no es positivo, no se usa como base válida
    if (despachado <= 0) {
      return alertaDatoInvalido(
        "El volumen despachado no es válido para la comparación: debe ser mayor que 0."
      );
    }

    const min = despachado * 0.95;
    const max = despachado * 1.05;

    if (facturado < min || facturado > max) {
      return {
        tipo: "error",
        mensaje: `El volumen facturado (${facturado} L) no coincide con el volumen despachado (${despachado} L).`,
        sx: ALERTAS.error,
      };
    }

    return null;
  }

  // =========================================================
  // 2) VALIDACIÓN DE PESO FLUJÓMETRO vs PESO BÁSCULA AMBIOCOM
  // =========================================================
  if (["peso_neto_bascula_ambiocom", "peso_neto_contador_ambiocom"].includes(key)) {
    // Falta el peso por flujómetro, pero sí hay báscula Ambiocom
    if (
      esPositivo(pesoBasculaAmb) &&
      esVacioLogico(pesoAmbiocomContador, pesoContador)
    ) {
      return alertaDatoFaltante(
        "Falta el peso por flujómetro: está vacío, nulo o en -1, pero sí existe peso de báscula en Ambiocom."
      );
    }

    // El peso por flujómetro quedó en 0, pero sí hay báscula Ambiocom
    if (esPositivo(pesoBasculaAmb) && esCero(pesoContador)) {
      return alertaDatoFaltante(
        `El peso por flujómetro está en 0, pero sí existe peso de báscula en Ambiocom (${pesoBasculaAmb} Kg).`
      );
    }

    // Existe peso por flujómetro, pero falta báscula Ambiocom
    if (
      esNumeroValido(pesoContador) &&
      pesoContador > 0 &&
      esVacioLogico(pesoAmbiocomBascula, pesoBasculaAmb)
    ) {
      return alertaDatoFaltante(
        "Falta el peso de báscula Ambiocom: está vacío, nulo o en -1, pero sí existe peso por flujómetro."
      );
    }

    // La báscula Ambiocom quedó en 0, pero sí hay peso por flujómetro
    if (esNumeroValido(pesoContador) && pesoContador > 0 && esCero(pesoBasculaAmb)) {
      return alertaDatoFaltante(
        `El peso de báscula Ambiocom está en 0, pero sí existe peso por flujómetro (${pesoContador} Kg).`
      );
    }

    // Ambos valores en 0 no son válidos en esta operación
    if (esCero(pesoContador) && esCero(pesoBasculaAmb)) {
      return alertaDatoInvalido(
        "Peso por flujómetro y peso de báscula Ambiocom están ambos en 0. Debe existir un peso de referencia válido."
      );
    }

    // Si no hay dos números válidos, no se puede comparar tolerancia
    if (!esNumeroValido(pesoContador) || !esNumeroValido(pesoBasculaAmb)) {
      return null;
    }

    // La báscula Ambiocom debe ser positiva para comparar
    if (pesoBasculaAmb <= 0) {
      return alertaDatoInvalido(
        "El peso de báscula Ambiocom no es válido para la comparación: debe ser mayor que 0."
      );
    }

    const min = pesoBasculaAmb * 0.98;
    const max = pesoBasculaAmb * 1.02;

    if (pesoContador < min || pesoContador > max) {
      return {
        tipo: "warning",
        mensaje: `El peso del flujómetro (${pesoContador} Kg) no coincide con el peso de báscula (${pesoBasculaAmb} Kg).`,
        sx: ALERTAS.warning,
      };
    }

    return null;
  }

  // =========================================================
  // 3) VALIDACIÓN DE PESO NETO CLIENTE vs PESO AMBIOCOM
  // =========================================================
  if (["kilos_peso_neto"].includes(key)) {
    // Falta el peso neto del cliente, pero sí hay peso Ambiocom
    if (esPositivo(pesoContador) && esVacioLogico(pesoBasculaCliente, pesoCliente)) {
      return alertaDatoFaltante(
        "Falta el peso neto del cliente: está vacío, nulo o en -1, pero sí existe peso Ambiocom."
      );
    }

    // El peso neto del cliente quedó en 0, pero sí hay peso Ambiocom
    if (esPositivo(pesoContador) && esCero(pesoCliente)) {
      return alertaDatoFaltante(
        `El peso neto del cliente está en 0, pero sí existe peso Ambiocom (${pesoContador} Kg).`
      );
    }

    // Existe peso del cliente, pero falta peso Ambiocom
    if (
      esNumeroValido(pesoCliente) &&
      pesoCliente > 0 &&
      esVacioLogico(pesoAmbiocomContador, pesoContador)
    ) {
      return alertaDatoFaltante(
        "Falta el peso Ambiocom: está vacío, nulo o en -1, pero sí existe peso del cliente."
      );
    }

    // El peso Ambiocom quedó en 0, pero sí hay peso del cliente
    if (esNumeroValido(pesoCliente) && pesoCliente > 0 && esCero(pesoContador)) {
      return alertaDatoFaltante(
        `El peso Ambiocom está en 0, pero sí existe peso del cliente (${pesoCliente} Kg).`
      );
    }

    // Ambos valores en 0 no son válidos en esta operación
    if (esCero(pesoContador) && esCero(pesoCliente)) {
      return alertaDatoInvalido(
        "Peso Ambiocom y peso neto del cliente están ambos en 0. El cliente debe tener un peso recibido válido."
      );
    }

    // Si no hay dos números válidos, no se puede comparar tolerancia
    if (!esNumeroValido(pesoContador) || !esNumeroValido(pesoCliente)) {
      return null;
    }

    // El peso Ambiocom debe ser positivo para comparar
    if (pesoContador <= 0) {
      return alertaDatoInvalido(
        "El peso Ambiocom no es válido para la comparación: debe ser mayor que 0."
      );
    }

    const tolerancia = pesoContador * 0.005;
    const diferencia = Math.abs(pesoContador - pesoCliente);

    // Si la diferencia da 0 porque ambos números existen y son iguales, es válido y no se marca
    if (diferencia > tolerancia) {
      return {
        tipo: "warning",
        mensaje: `El peso del cliente (${pesoCliente} Kg) no cumple con la tolerancia de ±0.5% respecto a Ambiocom (${pesoContador} Kg). Diferencia: ${diferencia} Kg.`,
        sx: ALERTAS.alerta,
      };
    }

    return null;
  }

  // =========================================================
  // 4) VALIDACIÓN DE VOLUMEN CLIENTE vs VOLUMEN GRAVIMÉTRICO
  // =========================================================
  if (["cantidad_recibida_cliente"].includes(key)) {
    // Falta el volumen recibido por el cliente, pero sí hay volumen gravimétrico
    if (esPositivo(volGrav) && esVacioLogico(volumenRecibidoCliente, volCliente)) {
      return alertaDatoFaltante(
        "Falta la cantidad recibida por el cliente: está vacía, nula o en -1, pero sí existe volumen gravimétrico."
      );
    }

    // El volumen recibido por el cliente quedó en 0, pero sí hay volumen gravimétrico
    if (esPositivo(volGrav) && esCero(volCliente)) {
      return alertaDatoFaltante(
        `La cantidad recibida por el cliente está en 0, pero sí existe volumen gravimétrico (${volGrav} L).`
      );
    }

    // Existe volumen del cliente, pero falta volumen gravimétrico
    if (
      esNumeroValido(volCliente) &&
      volCliente > 0 &&
      esVacioLogico(volumenDespachadoGravimetrico, volGrav)
    ) {
      return alertaDatoFaltante(
        "Falta el volumen gravimétrico: está vacío, nulo o en -1, pero sí existe volumen recibido por el cliente."
      );
    }

    // El volumen gravimétrico quedó en 0, pero sí hay volumen del cliente
    if (esNumeroValido(volCliente) && volCliente > 0 && esCero(volGrav)) {
      return alertaDatoFaltante(
        `El volumen gravimétrico está en 0, pero sí existe volumen recibido por el cliente (${volCliente} L).`
      );
    }

    // Ambos valores en 0 no son válidos en esta operación
    if (esCero(volGrav) && esCero(volCliente)) {
      return alertaDatoInvalido(
        "Volumen gravimétrico y cantidad recibida por el cliente están ambos en 0. Debe existir un volumen recibido válido."
      );
    }

    // Si no hay dos números válidos, no se puede comparar tolerancia
    if (!esNumeroValido(volGrav) || !esNumeroValido(volCliente)) {
      return null;
    }

    // El volumen gravimétrico debe ser positivo para comparar
    if (volGrav <= 0) {
      return alertaDatoInvalido(
        "El volumen gravimétrico no es válido para la comparación: debe ser mayor que 0."
      );
    }

    const tolerancia = volGrav * 0.005;
    const diferencia = Math.abs(volGrav - volCliente).toFixed(1);

    // Si la diferencia da 0 porque ambos números existen y son iguales, es válido y no se marca
    if (diferencia > tolerancia) {
      return {
        tipo: "warning",
        mensaje: `El volumen del cliente (${volCliente} L) no cumple con la tolerancia de ±0.5% respecto al volumen gravimétrico (${volGrav} L). Diferencia: ${diferencia} L. Densidad: ${Densidad}.`,
        sx: ALERTAS.ok,
      };
    }

    return null;
  }

  return null;
};