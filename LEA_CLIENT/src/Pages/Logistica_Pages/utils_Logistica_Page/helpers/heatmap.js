export const heatBg = (diff, merma = 0, row = null) => {
  const v = Number(diff ?? 0);
  const a = Math.abs(v);

  if (row) {
    const volGrav = Number(row?.cantidadRealPlanta ?? 0);
    const volCliente = Number(row?.volumenRecibidoCliente ?? 0);
    const volProg = Number(row?.cantidadProgramada ?? 0);

    const ceroPorFaltaDato =
      v === 0 &&
      (volGrav <= 0 || volCliente <= 0 || volProg <= 0);

    if (ceroPorFaltaDato) {
      return "rgb(209, 215, 219)";
    }
  }

  if (a <= merma) return "rgba(46,125,50,0.18)";
  if (a <= merma * 2) return "rgba(251,140,0,0.18)";
  return "rgba(211,47,47,0.18)";
};

export const heatBgKg = (diff, merma = 0, row = null) => {
  const v = Number(diff ?? 0);
  const a = Math.abs(v);

  if (row) {
    const pesoCliente = Number(row?.pesoNetoCliente ?? 0);
    const pesoAmbiocom = Number(row?.pesoNetoBasculaAmbiocom ?? 0);

    const ceroFalso =
      v === 0 &&
      (pesoCliente <= 0 || pesoAmbiocom <= 0);

    if (ceroFalso) {
      return "rgb(209, 215, 219)";
    }
  }

  if (a <= merma) return "rgba(46,125,50,0.18)";
  if (v > 0 && v > merma) return "rgba(248,168,77,0.66)";
  if (a <= merma * 2) return "rgba(255,235,59,0.25)";
  return "rgba(211,47,47,0.18)";
};

export const heatCumplimiento = (pct) => {
  const v = Number(pct ?? 0);
  if (v === 0) return "rgb(209, 215, 219)";
  if (v > 100) return "rgba(244,67,54,0.18)";
  if (v === 100) return "rgba(46,125,50,0.18)";
  if (v > 0 && v < 100) return "rgba(255,235,59,0.25)";

  return "transparent";
};
