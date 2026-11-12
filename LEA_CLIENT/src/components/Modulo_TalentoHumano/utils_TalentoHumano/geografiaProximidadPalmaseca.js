

export const SEDE_AMBIOCOM = Object.freeze({
  nombre: "AMBIOCOM — PALMASECA",
  lat: 3.535,
  lon: -76.381,
});

// DIVIPOLA municipio|nombre tal cual catálogo|lat|lon
const VALLE = `
76001|CALI|3.399043723|-76.57649259
76020|ALCALÁ|4.6788971|-75.78297932
76036|ANDALUCÍA|4.153314228|-76.16063341
76041|ANSERMANUEVO|4.795927292|-76.02963049
76054|ARGELIA|4.704287864|-76.14164999
76100|BOLÍVAR|4.393118861|-76.34982039
76109|BUENAVENTURA|3.493340766|-77.11872832
76111|GUADALAJARA DE BUGA|3.819854318|-75.98312419
76113|BUGALAGRANDE|4.196852991|-76.0896103
76122|CAICEDONIA|4.308997973|-75.83672567
76126|CALIMA|3.923271619|-76.64260484
76130|CANDELARIA|3.382091564|-76.38317663
76147|CARTAGO|4.70684716|-75.91790846
76233|DAGUA|3.649822218|-76.72039347
76243|EL ÁGUILA|4.917562873|-76.06601001
76246|EL CAIRO|4.756063701|-76.21502826
76248|EL CERRITO|3.656072873|-76.30841784
76250|EL DOVIO|4.539979729|-76.28762701
76275|FLORIDA|3.304104295|-76.16477307
76306|GINEBRA|3.74410441|-76.19082004
76318|GUACARÍ|3.759414991|-76.34518277
76364|JAMUNDÍ|3.213892389|-76.62760418
76377|LA CUMBRE|3.694303106|-76.58989905
76400|LA UNIÓN|4.537937391|-76.10328983
76403|LA VICTORIA|4.483511142|-75.96677303
76497|OBANDO|4.597588666|-75.9491997
76520|PALMIRA|3.558392876|-76.22779972
76563|PRADERA|3.42063665|-76.17841841
76606|RESTREPO|3.806494973|-76.53489853
76616|RIOFRÍO|4.109500298|-76.37105443
76622|ROLDANILLO|4.443571848|-76.16824249
76670|SAN PEDRO|3.98143244|-76.20836168
76736|SEVILLA|4.193411919|-75.88818163
76823|TORO|4.638421279|-76.08106176
76828|TRUJILLO|4.233268116|-76.34292699
76834|TULUÁ|4.02840797|-76.03250379
76845|ULLOA|4.707718947|-75.77835903
76863|VERSALLES|4.644242641|-76.25924483
76869|VIJES|3.74365889|-76.47064718
76890|YOTOCO|3.904130354|-76.39080435
76892|YUMBO|3.595913669|-76.5109879
76895|ZARZAL|4.35359875|-76.05065336
`;

// codigo|nombre|departamento|lat|lon
const REGIONALES = `
19001|POPAYÁN|CAUCA|2.4448|-76.6147
19100|BOLÍVAR|CAUCA|1.835|-76.97
19110|BUENOS AIRES|CAUCA|3.016|-76.643
19130|CAJIBÍO|CAUCA|2.622|-76.57
19137|CALDONO|CAUCA|2.797|-76.484
19142|CALOTO|CAUCA|3.035|-76.407
19212|CORINTO|CAUCA|3.173|-76.259
19256|EL TAMBO|CAUCA|2.454|-76.81
19300|GUACHENÉ|CAUCA|3.134|-76.393
19318|GUAPI|CAUCA|2.571|-77.886
19355|INZÁ|CAUCA|2.549|-76.064
19364|JAMBALÓ|CAUCA|2.792|-76.323
19418|LÓPEZ DE MICAY|CAUCA|2.85|-77.25
19450|MERCADERES|CAUCA|1.8|-77.17
19513|PADILLA|CAUCA|3.22|-76.313
19517|PÁEZ|CAUCA|2.73|-75.98
19532|PATÍA|CAUCA|2.07|-77.02
19548|PIENDAMÓ - TUNÍA|CAUCA|2.639|-76.53
19622|ROSAS|CAUCA|2.26|-76.74
19698|SANTANDER DE QUILICHAO|CAUCA|3.008|-76.485
19701|SANTA ROSA|CAUCA|1.52|-76.55
19743|SILVIA|CAUCA|2.616|-76.381
19760|SOTARÁ PAISPAMBA|CAUCA|2.26|-76.62
19807|TIMBÍO|CAUCA|2.35|-76.68
19821|TORIBÍO|CAUCA|2.956|-76.271
19845|VILLA RICA|CAUCA|3.176|-76.463
66001|PEREIRA|RISARALDA|4.814|-75.694
66170|DOSQUEBRADAS|RISARALDA|4.836|-75.67
66045|APÍA|RISARALDA|5.106|-75.943
66075|BALBOA|RISARALDA|4.952|-75.96
66088|BELÉN DE UMBRÍA|RISARALDA|5.2|-75.868
66318|GUÁTICA|RISARALDA|5.314|-75.8
66383|LA CELIA|RISARALDA|5.043|-76.015
66400|LA VIRGINIA|RISARALDA|4.898|-75.883
66440|MARSELLA|RISARALDA|4.936|-75.739
66594|QUINCHÍA|RISARALDA|5.339|-75.73
66682|SANTA ROSA DE CABAL|RISARALDA|4.869|-75.622
66687|SANTUARIO|RISARALDA|5.073|-75.964
63001|ARMENIA|QUINDÍO|4.534|-75.676
63111|BUENAVISTA|QUINDÍO|4.358|-75.74
63130|CALARCÁ|QUINDÍO|4.529|-75.642
63190|CIRCASIA|QUINDÍO|4.619|-75.636
63212|CÓRDOBA|QUINDÍO|4.392|-75.69
63272|FILANDIA|QUINDÍO|4.675|-75.658
63302|GÉNOVA|QUINDÍO|4.317|-75.792
63401|LA TEBAIDA|QUINDÍO|4.452|-75.786
63470|MONTENEGRO|QUINDÍO|4.568|-75.75
63548|PIJAO|QUINDÍO|4.335|-75.703
63594|QUIMBAYA|QUINDÍO|4.623|-75.763
63690|SALENTO|QUINDÍO|4.638|-75.571
73001|IBAGUÉ|TOLIMA|4.4389|-75.2322
73268|ESPINAL|TOLIMA|4.15|-74.885
73352|ICONONZO|TOLIMA|4.176|-74.533
73449|MELGAR|TOLIMA|4.205|-74.641
73555|PLANADAS|TOLIMA|3.1|-75.817
73616|RIOBLANCO|TOLIMA|3.53|-75.68
73622|RONCESVALLES|TOLIMA|4.013|-75.606
73624|ROVIRA|TOLIMA|4.238|-75.24
73675|SAN ANTONIO|TOLIMA|3.916|-75.482
73770|SUÁREZ|TOLIMA|4.048|-74.834
`;

// localidad|municipio padre|lat|lon
// Las coordenadas son orientativas, no puntos catastrales.
const LOCALIDADES_WEBFLOW = `
AMAIME|PALMIRA|3.61|-76.20
ARROYOHONDO|YUMBO|3.55|-76.49
BORRERO AYERBE|DAGUA|3.622|-76.66
BUCHITOLO|CANDELARIA|3.367|-76.397
COSTA RICA|GINEBRA|3.727|-76.325
DAPA|YUMBO|3.585|-76.56
EL BOLO|PALMIRA|3.474|-76.294
EL BOLO LA ITALIA|PALMIRA|3.461|-76.333
EL BOLO SAN ISIDRO|PALMIRA|3.461|-76.311
EL CABUYAL|CANDELARIA|3.332|-76.347
EL CARMELO|CANDELARIA|3.413|-76.412
EL HORMIGUERO|CALI|3.327|-76.511
EL PLACER|EL CERRITO|3.608|-76.322
EL QUEREMAL|DAGUA|3.54|-76.70
EL TIPLE|CANDELARIA|3.312|-76.456
FELIDIA|CALI|3.466|-76.66
GOLONDRINAS|CALI|3.507|-76.548
GUAYABAL|PALMIRA|3.61|-76.36
JUANCHITO|CANDELARIA|3.435|-76.45
LA ACEQUIA|PALMIRA|3.54|-76.43
LA BUITRERA|CALI|3.365|-76.605
LA BUITRERA|PALMIRA|3.524|-76.258
LA CASTILLA|CALI|3.48|-76.606
LA DOLORES|PALMIRA|3.51|-76.421
LA ELVIRA|CALI|3.48|-76.64
LA PAILA|ZARZAL|4.321|-76.07
LA PAZ|CALI|3.46|-76.593
LA REGINA|CANDELARIA|3.387|-76.393
LA TORRE|PALMIRA|3.573|-76.45
LOBOGUERRERO|DAGUA|3.75|-76.675
MONTEBELLO|CALI|3.488|-76.569
MULALÓ|YUMBO|3.62|-76.46
NAVARRO|CALI|3.41|-76.472
PALMASECA|PALMIRA|3.535|-76.381
PANCE|CALI|3.312|-76.628
PILES|PALMIRA|3.61|-76.445
POTRERITO|JAMUNDÍ|3.22|-76.61
PRESIDENTE|SAN PEDRO|4.11|-76.15
QUINAMAYÓ|JAMUNDÍ|3.13|-76.57
ROBLES|JAMUNDÍ|3.13|-76.65
ROZO|PALMIRA|3.58|-76.43
SANTA ELENA|EL CERRITO|3.649|-76.357
SONSO|GUACARÍ|3.736|-76.386
TABLONES|PALMIRA|3.647|-76.245
TIENDANUEVA|PALMIRA|3.575|-76.275
TIMBA|JAMUNDÍ|3.10|-76.66
VILLACARMELO|CALI|3.35|-76.62
VILLAGORGONA|CANDELARIA|3.394|-76.349
`;

const parseRows = (raw) =>
  raw.trim().split("\n").map((row) => row.split("|"));

export const MUNICIPIOS_VALLE = parseRows(VALLE).map(
  ([codigo, nombre, lat, lon]) => ({
    codigo,
    nombre,
    departamento: "VALLE DEL CAUCA",
    municipio: nombre,
    tipo: "municipio",
    lat: Number(lat),
    lon: Number(lon),
    label: `${nombre} — VALLE DEL CAUCA`,
  })
);

export const MUNICIPIOS_ALEDANOS = parseRows(REGIONALES).map(
  ([codigo, nombre, departamento, lat, lon]) => ({
    codigo,
    nombre,
    departamento,
    municipio: nombre,
    tipo: "municipio",
    lat: Number(lat),
    lon: Number(lon),
    label: `${nombre} — ${departamento}`,
  })
);

export const CORREGIMIENTOS_VALLE = parseRows(
  LOCALIDADES_WEBFLOW
).map(([nombre, municipio, lat, lon], index) => ({
  codigo: `LOCAL-${String(index + 1).padStart(3, "0")}`,
  nombre,
  municipio,
  departamento: "VALLE DEL CAUCA",
  tipo: "localidad",
  lat: Number(lat),
  lon: Number(lon),
  label: `${nombre} — ${municipio} — VALLE DEL CAUCA`,
}));

export const CATALOGO_PROXIMIDAD = Object.freeze([
  ...MUNICIPIOS_VALLE,
  ...MUNICIPIOS_ALEDANOS,
  ...CORREGIMIENTOS_VALLE,
]);

const normalizar = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const llave = (texto) =>
  normalizar(texto)
    .replace(/[^A-Z0-9]/g, "")
    .trim();

const mapaLabels = new Map();
const mapaNombres = new Map();
const ambiguos = new Set();

for (const lugar of CATALOGO_PROXIMIDAD) {
  mapaLabels.set(llave(lugar.label), lugar);

  const key = llave(lugar.nombre);

  if (mapaNombres.has(key)) {
    ambiguos.add(key);
  } else {
    mapaNombres.set(key, lugar);
  }
}

const ALIAS = {
  BUGA: "GUADALAJARA DE BUGA — VALLE DEL CAUCA",
  GUADALAJARADEBUGA: "GUADALAJARA DE BUGA — VALLE DEL CAUCA",
  SANTIAGODECALI: "CALI — VALLE DEL CAUCA",
  CALIMAELDARIEN: "CALIMA — VALLE DEL CAUCA",
  DARIEN: "CALIMA — VALLE DEL CAUCA",
  PIENDAMO: "PIENDAMÓ - TUNÍA — CAUCA",
  PAISPAMBA: "SOTARÁ PAISPAMBA — CAUCA",
  VILLAGORGONA: "VILLAGORGONA — CANDELARIA — VALLE DEL CAUCA",
};

export function resolverLugar(
  residencia,
  municipioPadre = ""
) {
  const texto = String(residencia ?? "").trim();
  if (!texto) return null;

  const key = llave(texto);

  // 1. Coincidencia exacta con el texto del select Webflow.
  if (mapaLabels.has(key)) {
    return mapaLabels.get(key);
  }

  // 2. Alias conocidos.
  if (ALIAS[key]) {
    return mapaLabels.get(llave(ALIAS[key])) || null;
  }

  // 3. Si llega solo el nombre, usarlo únicamente si es único.
  const nombreKey = llave(texto);

  if (!ambiguos.has(nombreKey) && mapaNombres.has(nombreKey)) {
    return mapaNombres.get(nombreKey);
  }

  // 4. Resolver una localidad repetida usando el municipio padre.
  if (municipioPadre) {
    const coincidencias = CATALOGO_PROXIMIDAD.filter(
      (l) =>
        llave(l.nombre) === nombreKey &&
        llave(l.municipio) === llave(municipioPadre)
    );
    if (coincidencias.length === 1) return coincidencias[0];
  }

  // 5. Evitar atribuir coordenadas a lugares ambiguos.
  return null;
}

const toRad = (grados) => (grados * Math.PI) / 180;

export function distanciaHaversineKm(a, b) {
  if (
    !a || !b ||
    !Number.isFinite(a.lat) ||
    !Number.isFinite(a.lon) ||
    !Number.isFinite(b.lat) ||
    !Number.isFinite(b.lon)
  ) {
    return null;
  }

  const R = 6371.0088;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function escalaCercania(km) {
  if (km === null || !Number.isFinite(km)) {
    return {
      etiqueta: "Sin clasificar",
      nivel: 99,
      color: "#64748B",
      fondo: "#F1F5F9",
      borde: "#E2E8F0",
    };
  }

  if (km <= 15) {
    return {
      etiqueta: "Muy cerca",
      nivel: 1,
      color: "#13734B",
      fondo: "#DCFCE7",
      borde: "#86EFAC",
    };
  }

  if (km <= 35) {
    return {
      etiqueta: "Cerca",
      nivel: 2,
      color: "#317D62",
      fondo: "#E8F6E9",
      borde: "#B8E5C3",
    };
  }

  if (km <= 65) {
    return {
      etiqueta: "Distancia media",
      nivel: 3,
      color: "#946200",
      fondo: "#FFF4CE",
      borde: "#F8D67A",
    };
  }

  if (km <= 120) {
    return {
      etiqueta: "Lejos",
      nivel: 4,
      color: "#AA571B",
      fondo: "#FFEDD5",
      borde: "#FDBA74",
    };
  }

  return {
    etiqueta: "Muy lejos",
    nivel: 5,
    color: "#A73442",
    fondo: "#FDE7E9",
    borde: "#F5A6AE",
  };
}

export function analizarResidencia(
  residencia,
  municipioPadre = ""
) {
  const lugar = resolverLugar(residencia, municipioPadre);

  if (!lugar) {
    return {
      lugar: null,
      km: null,
      ...escalaCercania(null),
    };
  }

  const distancia = distanciaHaversineKm(
    SEDE_AMBIOCOM,
    lugar
  );

  const km = distancia === null
    ? null
    : Math.round(distancia * 10) / 10;

  return {
    lugar,
    km,
    ...escalaCercania(km),
  };
}
