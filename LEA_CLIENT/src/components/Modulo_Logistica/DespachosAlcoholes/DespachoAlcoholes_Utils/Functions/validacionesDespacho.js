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
        backgroundColor: "rgba(255, 235, 59, 0.25)", // amarillo real
        color: "#61470e",
        fontWeight: 700,
        border: "2px solid #dac82c",
    },

    ok: {
        backgroundColor: "rgba(194, 67, 187, 0.15)", // verde suave
        color: "#93279c",
        fontWeight: 600,
        border: "1px solid #e016ae",
    },
};

export const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === "") return null;

    const limpio = valor
        .toString()
        .trim()
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(/,/g, ".");

    const num = Number(limpio);
    return Number.isFinite(num) ? num : null;
};

export const getCellValidation = ({
    key,
    volumenFacturado,
    volumenDespachado,
    pesoAmbiocomContador,
    pesoAmbiocomBascula,
    pesoBasculaCliente,
    volumenDespachadoGravimetrico,
    volumenRecibidoCliente,
    Densidad
}) => {
    // 1) VALIDACIÓN DE VOLUMEN
    if (["volumen_despachar", "volumen_ambiocom_contador"].includes(key)) {
        const facturado = normalizarNumero(volumenFacturado);
        const despachado = normalizarNumero(volumenDespachado);

        if (facturado == null || despachado == null || despachado <= 0) {
            return null;
        }

        const min = despachado * 0.95;
        const max = despachado * 1.05;

        if (facturado < min || facturado > max) {
            return {
                tipo: "error",
                mensaje: `El volumen facturado ( ${facturado} L ) no coincide con el volumen despachado ( ${despachado} L ).`,
                sx: ALERTAS.error,
            };
        }

        return null;
    }

    // 2) VALIDACIÓN DE PESO
    if (["peso_neto_bascula_ambiocom", "peso_neto_contador_ambiocom"].includes(key)) {
        const ambiocom = normalizarNumero(pesoAmbiocomContador);
        const ambiocombascula = normalizarNumero(pesoAmbiocomBascula);

        if (ambiocom == null || ambiocombascula == null || ambiocombascula <= 0) {
            return null;
        }

        const min = ambiocombascula * 0.98;
        const max = ambiocombascula * 1.02;

        if (ambiocom < min || ambiocom > max) {
            return {
                tipo: "warning",
                mensaje: `El peso del flujómetro ( ${ambiocom} Kg ) no coincide con el peso de báscula ( ${ambiocombascula} Kg ).`,
                sx: ALERTAS.warning,
            };
        }

        return null;
    }

    // 3) VALIDACIÓN DE RECIBO CLIENTE PESO
    if (["peso_neto_bascula_ambiocom", "kilos_peso_neto"].includes(key)) {
        const ambiocom = normalizarNumero(pesoAmbiocomContador);
        const cliente = normalizarNumero(pesoBasculaCliente);

        if (ambiocom == null || cliente == null || ambiocom <= 0) {
            return null;
        }

        const tolerancia = ambiocom * 0.005; // 0.5%

        // const diferencia = Math.abs(ambiocom - cliente);
        const diferencia = Number(ambiocom - cliente);

        if (diferencia > tolerancia) {
            return {
                tipo: "warning",
                mensaje: `El peso del cliente: ( ${cliente} Kg ) No cumple con la tolerancia de ±0.5% respecto a báscula en ambiocom:( ${ambiocom} Kg ). Diferencia: ${diferencia} Kg`,
                sx: ALERTAS.alerta,
            };
        }

        return null;
    }

    // 4) VALIDACIÓN DE RECIBO CLIENTE VOLUMEN
    if (["volumen_contador_gravimetrico", "cantidad_recibida_cliente"].includes(key)) {
        const ambiocom = normalizarNumero(volumenDespachadoGravimetrico);
        const cliente = normalizarNumero(volumenRecibidoCliente);

        if (ambiocom == null || cliente == null || ambiocom <= 0) {
            return null;
        }

        const tolerancia = ambiocom * 0.005; // 0.5%

        // const diferencia = Math.abs(ambiocom - cliente);
        const diferencia = Number(ambiocom - cliente);

        if (diferencia > tolerancia) {
            return {
                tipo: "warning",
                mensaje: `El volumen del cliente: ( ${cliente} L ) No cumple con la tolerancia de ±0.5% respecto a Volumen Gravimétrico en ambiocom:( ${ambiocom} L ). Diferencia: ${diferencia} L, se despachó con una densidad : ${Densidad} Kg/m3`,
                sx: ALERTAS.ok,
            };
        }

        return null;
    }

    return null;
};