// export const PROD = {
//   tafias: { n: "Tafias", pe: 0.868 },
//   ind9293: { n: "Industrial 92-93", pe: 0.5 },
//   ind99: { n: "Industrial 99", pe: 0.742 },
//   ind96: { n: "Industrial 96", pe: 0.712 },
//   ind94: { n: "Industrial 94", pe: 0.692 },
//   extraneutro: { n: "Extra neutro", pe: 0.81 },
//   anhidro: { n: "Anhidro ENA", pe: 0.84 },
//   encana: { n: "Extra neutro Caña", pe: 0.892 },
//   enmaiz: { n: "Extra neutro Maíz", pe: 0.81 },
//   rectn: { n: "Rectificado N", pe: 0.721 },
//   vodka: { n: "Vodka / Ginebra", pe: 0.937 },
//   rect: { n: "Rectificado", pe: 0.158 },
// };

export const RECIP = {
  garrafa: { n: "Garrafa 20L", cop: 50000, cap: 20 },
  tambor: { n: "Tambor plástico 200L", cop: 110000, cap: 200 },
  tamborM: { n: "Tambor metálico 200L", cop: 200000, cap: 200 },
  ibc: { n: "IBC 1000L", cop: 600000, cap: 1000 },
};

export const COM = {
  emily: {
    n: "Emily López",
    bg: "#FCE7F3",
    color: "#BE185D",
  },
  vanessa: {
    n: "Vanessa Sarmiento",
    bg: "#FEF3C7",
    color: "#92400E",
  },
  marcelo: {
    n: "Marcelo Garrido",
    bg: "#E8E7FE",
    color: "#1F1AE8",
  },
};

export const ESTADOS_DB = {
  enviada: {
    n: "Enviada",
    bg: "#E8E7FE",
    color: "#1F1AE8",
    iconKey: "send",
  },
  negociacion: {
    n: "En negociación",
    bg: "#FEF3C7",
    color: "#D97706",
    iconKey: "forum",
  },
  ganada: {
    n: "Ganada",
    bg: "#E5FBE9",
    color: "#13B82C",
    iconKey: "award",
  },
  perdida: {
    n: "Perdida",
    bg: "#FEE2E2",
    color: "#DC2626",
    iconKey: "cancel",
  },
};

export const ESTADO_ORDER = ["enviada", "negociacion", "ganada", "perdida"];

export const FLETES = {
  AMB: {
    BOGOTA: [6990000, 5600000, 3360000, 2500000],
    MEDELLIN: [6990000, 5600000, 3360000, 2500000],
    CALI: [1670000, 1200000, 950000, 800000],
    BARRANQUILLA: [10400000, 8320000, 6220000, 3500000],
    CARTAGENA: [10400000, 8320000, 5600000, 3500000],
    BUCARAMANGA: [9180000, 7350000, 4400000, 3200000],
    MANIZALES: [5000000, 3550000, 2300000, 1800000],
    PEREIRA: [3420000, 2750000, 1670000, 1400000],
    ARMENIA: [3420000, 2750000, 1670000, 1400000],
    IBAGUE: [5330000, 4100000, 2550000, 1900000],
    COTA: [7400000, 5920000, 3550000, 2700000],
    FONTIBON: [6990000, 5600000, 3360000, 2500000],
    ITAGUI: [6900000, 5600000, 3360000, 2500000],
    COPACABANA: [6990000, 5600000, 3360000, 2500000],
    SINCELEJO: [10400000, 8320000, 5450000, 3500000],
    SANTA_MARTA: [10400000, 8320000, 6000000, 3800000],
    TUNJA: [8600000, 6900000, 4200000, 3000000],
    TOCANICPA: [7480000, 5990000, 3600000, 2700000],
    CAUCA: [2900000, 2200000, 1350000, 1000000],
    BRICEÑO: [8600000, 6900000, 4200000, 3000000],
    PUERTO_TEJADA: [2730000, 2000000, 1350000, 900000],
  },
  BUN: {
    BOGOTA: [6990000, 5600000, 3360000, 2500000],
    MEDELLIN: [6990000, 5600000, 3360000, 2500000],
    CALI: [1670000, 1200000, 950000, 800000],
    BARRANQUILLA: [10800000, 10000000, null, 3800000],
    CARTAGENA: [11400000, null, null, 4000000],
    BUCARAMANGA: [7200000, 7100000, 6726500, 3200000],
    MANIZALES: [3600000, 3400000, 3750000, 1800000],
    PEREIRA: [2800000, 3300000, 3520000, 1600000],
    ARMENIA: [2800000, 3100000, 3520000, 1600000],
    IBAGUE: [5480000, 3800000, 3860000, 2000000],
    COTA: [5360000, null, null, 2200000],
    FONTIBON: [5360000, null, null, 2200000],
    ITAGUI: [5360000, 5650000, 5200000, 2200000],
    COPACABANA: [5360000, 5800000, 5200000, 2200000],
    SINCELEJO: [10680000, null, null, 4000000],
    SANTA_MARTA: [11600000, 10200000, 9750000, 4200000],
    TUNJA: [6200000, 6500000, 5800000, 2800000],
    TOCANICPA: [5680000, 5940000, 5350000, 2400000],
    CAUCA: [2400000, 2100000, 2900000, 1000000],
    BRICEÑO: [8320000, 6500000, null, 3200000],
    PUERTO_TEJADA: [1920000, 2000000, null, 900000],
  },
};

export const PDV_VOLS = [40000, 80000, 120000, 160000, 200000];

export const PDV_TAB = {
  tafias: [1.0, 0.991, 0.974, 0.957, 0.948],
  ind9293: [0.58, 0.575, 0.565, 0.555, 0.55],
  ind99: [0.861, 0.853, 0.838, 0.824, 0.816],
  ind96: [0.826, 0.819, 0.805, 0.79, 0.783],
  ind94: [0.803, 0.796, 0.782, 0.768, 0.761],
  extraneutro: [0.939, 0.931, 0.915, 0.899, 0.891],
  anhidro: [0.974, 0.966, 0.949, 0.932, 0.924],
  encana: [1.035, 1.026, 1.017, 1.008, 0.981],
  enmaiz: [1.012, 1.004, 0.996, 0.988, 0.98],
  rectn: [0.837, 0.83, 0.822, 0.815, 0.779],
  vodka: [1.171, 1.162, 1.152, 1.143, 1.133],
  rect: [null, null, null, null, null],
};

export const TIPO_LBL = {
  ct05: "Carrotanque 5.000 L",
  ct10: "Carrotanque 10.000 L",
  ct15: "Carrotanque 15.000 L",
  ct20: "Carrotanque 20.000 L",
  ct30: "Carrotanque 30.000 L",
  ct35: "Carrotanque 35.000 L",
  ct40: "Carrotanque 40.000 L",
  seco: "Furgón + recipientes",
};

export const TIPO_SHORT = {
  ct10: "CT 10K",
  ct20: "CT 20K",
  ct40: "CT 40K",
  seco: "Furgón",
};

// export const CIUDADES = [
//   "BOGOTA",
//   "MEDELLIN",
//   "CALI",
//   "BARRANQUILLA",
//   "CARTAGENA",
//   "BUCARAMANGA",
//   "MANIZALES",
//   "PEREIRA",
//   "ARMENIA",
//   "IBAGUE",
//   "COTA",
//   "FONTIBON",
//   "ITAGUI",
//   "COPACABANA",
//   "SINCELEJO",
//   "SANTA_MARTA",
//   "TUNJA",
//   "TOCANICPA",
//   "CAUCA",
//   "BRICEÑO",
//   "PUERTO_TEJADA",
// ];

// export const DEFAULT_FORM = {
//   comercial: "",
//   cliente: "",
//   producto: "tafias",
//   sector: "otros",
//   volMensual: 40000,
//   origen: "AMB",
//   ciudad: "",
//   tipoDespacho: "ct10",
//   volumen: 10000,
//   recipiente: "garrafa",
//   amort: 6,
//   cantRecip: 50,
//   trm: 4200,
//   pe: "",
//   pventa: "",
// };

export const DEFAULT_FORM = {
  comercial: "",
  cliente: "",
  producto: "",
  sector: "otros",
  volMensual: 40000,
  origen: "AMB",
  ciudad: "",
  tipoDespacho: "ct10",
  volumen: 10000,
  recipiente: "garrafa",
  amort: 6,
  cantRecip: 50,
  trm: 4200,
  pe: "",
  pventa: "",
};