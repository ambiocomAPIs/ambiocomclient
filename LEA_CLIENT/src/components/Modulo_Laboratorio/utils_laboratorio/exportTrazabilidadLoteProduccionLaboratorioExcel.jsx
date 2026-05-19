import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const COLORS = {
  gray: "FFD9D9D9",
  white: "FFFFFFFF",
  black: "FF000000",
  red: "FFFFB3B3",
};

const border = {
  top: { style: "thin", color: { argb: COLORS.black } },
  left: { style: "thin", color: { argb: COLORS.black } },
  bottom: { style: "thin", color: { argb: COLORS.black } },
  right: { style: "thin", color: { argb: COLORS.black } },
};

const center = { vertical: "middle", horizontal: "center", wrapText: true };
const left = { vertical: "middle", horizontal: "left", wrapText: true };

const fill = (argb) => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const analysisColumns = [
  "CODIGO DE\nMUESTRA",
  "GRADO\nALCOHOLICO\n%v/v",
  "ACETAL",
  "METANOL",
  "IPA",
  "PROPANOL",
  "ETILACETATO",
  "2- BUTANOL",
  "ISOBUTANOL",
  "BUTANOL",
  "3-PENTANOL",
  "AMILICO 1",
  "AMILICO 2",
  "FURFURAL",
  "ISOAMILACETA\nTO",
  "ALCOHOLES\nSUPERIORE\nS",
  "ESTERES",
  "mL de NaOH\ngastados",
  "ACIDEZ",
  "TOTAL\nCONGENERES",
  "ORGANOLEPTIC\nO",
  "TANQUE",
  "ANALISTA",
  "OBSERVACIONES",
];

const permittedRows = [
  [
    "ORIGEN CAÑA",
    "Min 95",
    "Max 200",
    "Max 200",
    "Max 7.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Max 5.0",
    "",
    "Max 2000",
    "Max 10",
    "",
    "MAX 100",
    "Max 2700",
    "",
    "",
    "",
    "",
  ],
  [
    "ORIGEN MAIZ",
    "Min 99,5",
    "Max 5.0",
    "Max 10",
    "Max 7.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "N.D",
    "",
    "Max 10",
    "Max 300",
    "",
    "Max 10",
    "Max 35",
    "",
    "",
    "",
    "",
  ],
];

function styleCell(cell, options = {}) {
  cell.border = options.border === false ? undefined : border;
  cell.alignment = options.alignment || center;
  cell.font = options.font || { name: "Arial", size: 7 };
  cell.fill = fill(options.fill || COLORS.white);
}

function styleRange(sheet, rowStart, rowEnd, colStart = 1, colEnd = 24, options = {}) {
  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      styleCell(sheet.getRow(row).getCell(col), options);
    }
  }
}

function merge(sheet, range, value = "", options = {}) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = value;
  styleCell(cell, options);
}

async function loadLogoBase64() {
  const response = await fetch("/LogoCompany/logoambiocomsinfondo.png");
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function safeFileDate(value) {
  return String(value || "sin_fecha")
    .replaceAll("/", "-")
    .replaceAll(" ", "_");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(",", ".")
    .trim();
}

function parseNumber(value) {
  const match = String(value || "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function validateCellValue(value, rule) {
  if (!value || !rule) return true;

  const normalizedRule = normalizeText(rule);
  const numericValue = parseNumber(value);

  if (["n.d", "nd", "n.a", "na"].includes(normalizedRule)) return true;
  if (numericValue === null) return true;

  if (
    normalizedRule.includes("max") ||
    normalizedRule.includes("máx") ||
    normalizedRule.includes("<")
  ) {
    const max = parseNumber(rule);
    return max === null ? true : numericValue <= max;
  }

  if (normalizedRule.includes("min") || normalizedRule.includes(">")) {
    const min = parseNumber(rule);
    return min === null ? true : numericValue >= min;
  }

  return true;
}

function getRuleForCell(rowIndex, colIndex) {
  return permittedRows[rowIndex]?.[colIndex] || "";
}

function isCellOutOfRange(rowIndex, row, colIndex) {
  const rule = getRuleForCell(rowIndex, colIndex);
  const value = row?.[`col_${colIndex}`];

  if (!rule) return false;

  return !validateCellValue(value, rule);
}

function setupSheet(sheet) {
  sheet.views = [{ showGridLines: false }];

  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    paperSize: 9,
    horizontalCentered: true,
    margins: {
      left: 0.1,
      right: 0.1,
      top: 0.15,
      bottom: 0.15,
      header: 0.05,
      footer: 0.05,
    },
  };

  const widths = [
    9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 26,
  ];

  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

async function addHeader(workbook, sheet, observacionesGenerales = "") {
  styleRange(sheet, 1, 5, 1, 24);

  merge(sheet, "A1:D5", "");

  try {
    const logoBase64 = await loadLogoBase64();
    const logoId = workbook.addImage({
      base64: logoBase64,
      extension: "png",
    });

    sheet.addImage(logoId, {
      tl: { col: 0.85, row: 0.7 },
      ext: { width: 205, height: 58 },
    });
  } catch {
    sheet.getCell("A1").value = "Ambiocom";
  }

  merge(sheet, "E1:U5", "TRAZABILIDAD DE LOTE DE PRODUCCION", {
    font: { name: "Arial", bold: true, size: 16 },
  });

  merge(sheet, "V1:X1", "Código: 4-LAB-032", {
    font: { name: "Arial", bold: true, size: 8 },
  });
  merge(sheet, "V2:X2", "Versión: 3", {
    font: { name: "Arial", bold: true, size: 8 },
  });
  merge(sheet, "V3:X3", "Fecha de emisión", {
    font: { name: "Arial", bold: true, size: 8 },
  });
  merge(sheet, "V4:X4", "12-may-26", {
    font: { name: "Arial", bold: true, size: 8 },
  });
  merge(sheet, "V5:X5", "PAG 3-3", {
    font: { name: "Arial", bold: true, size: 8 },
  });

  [1, 2, 3, 4, 5].forEach((row) => {
    sheet.getRow(row).height = 15;
  });

  styleRange(sheet, 6, 6, 1, 24);
  sheet.getRow(6).height = 5;

  merge(sheet, "A7:D7", "OBSERVACIONES", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "E7:X7", observacionesGenerales || "", {
    alignment: left,
    font: { name: "Arial", bold: true, size: 7 },
  });

  sheet.getRow(7).height = 16;
}

function addTopData(sheet, encabezado = {}) {
  sheet.getRow(8).height = 5;
  styleRange(sheet, 8, 8, 1, 24);

  sheet.getCell("A9").value = "FECHA";
  styleCell(sheet.getCell("A9"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "B9:C9", encabezado.fecha || "", {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "E9:F9", "TIPO DE ALCOHOL", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "G9:K9", encabezado.tipoAlcohol || "", {
    font: { name: "Arial", size: 7 },
  });

  sheet.getCell("L9").value = "TANQUE";
  styleCell(sheet.getCell("L9"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "M9:N9", encabezado.tanque || "", {
    font: { name: "Arial", size: 7 },
  });

  styleRange(sheet, 9, 9, 1, 24);
  sheet.getRow(9).height = 14;

  sheet.getCell("A10").value = "LOTE";
  styleCell(sheet.getCell("A10"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "B10:C10", encabezado.lote || "", {
    font: { name: "Arial", size: 7 },
  });

  styleRange(sheet, 10, 10, 1, 24);
  sheet.getRow(10).height = 14;

  styleRange(sheet, 11, 11, 1, 24);
  sheet.getRow(11).height = 10;

  merge(sheet, "A12:C13", "FECHA INICIO LLENADO DEL\nTANQUE", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "D12:I13", encabezado.fechaInicioLlenado || "", {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "J12:J13", "", {});
  sheet.getCell("K12").value = "HORA";
  styleCell(sheet.getCell("K12"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  sheet.getCell("L12").value = encabezado.horaInicioLlenado || "";
  styleCell(sheet.getCell("L12"), {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "M12:X13", "", {});
  styleRange(sheet, 12, 13, 1, 24);
  sheet.getRow(12).height = 15;
  sheet.getRow(13).height = 15;

  merge(sheet, "A14:C15", "FECHA FINAL LLENADO DEL\nTANQUE", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "D14:I15", encabezado.fechaFinalLlenado || "", {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "J14:J15", "", {});
  sheet.getCell("K14").value = "HORA";
  styleCell(sheet.getCell("K14"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  sheet.getCell("L14").value = encabezado.horaFinalLlenado || "";
  styleCell(sheet.getCell("L14"), {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "M14:X15", "", {});
  styleRange(sheet, 14, 15, 1, 24);
  sheet.getRow(14).height = 15;
  sheet.getRow(15).height = 15;

  styleRange(sheet, 16, 16, 1, 24);
  sheet.getRow(16).height = 10;
}

function addMateriaPrima(sheet, materiaPrima = {}) {
  merge(sheet, "A17:X17", "MATERIA PRIMA", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });
  styleRange(sheet, 17, 17, 1, 24, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });
  sheet.getRow(17).height = 14;

  styleRange(sheet, 18, 18, 1, 24);
  sheet.getRow(18).height = 8;

  merge(sheet, "A19:B19", "CODIGO INTERNO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C19:E19", materiaPrima.codigoInterno || "", {
    font: { name: "Arial", size: 7 },
  });

  merge(sheet, "G19:H19", "FECHA DE RECIBO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "I19:K19", materiaPrima.fechaRecibo || "", {
    font: { name: "Arial", size: 7 },
  });
  merge(sheet, "L19:X19", "", {});
  styleRange(sheet, 19, 19, 1, 24);
  sheet.getRow(19).height = 13;

  merge(sheet, "A20:B20", "ORIGEN", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C20:E20", materiaPrima.origen || "", {
    font: { name: "Arial", size: 7 },
  });
  merge(sheet, "F20:X20", "", {});
  styleRange(sheet, 20, 20, 1, 24);
  sheet.getRow(20).height = 13;

  merge(sheet, "A21:B21", "PROVEEDOR", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C21:X21", materiaPrima.proveedor || "", {
    font: { name: "Arial", size: 7 },
  });
  styleRange(sheet, 21, 21, 1, 24);
  sheet.getRow(21).height = 13;

  merge(sheet, "A22:B22", "TIPO DE ALCOHOL", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C22:X22", materiaPrima.tipoAlcohol || "", {
    font: { name: "Arial", size: 7 },
  });
  styleRange(sheet, 22, 22, 1, 24);
  sheet.getRow(22).height = 13;

  merge(sheet, "A23:B23", "GRADO ALCOHOLICO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C23:E23", materiaPrima.gradoAlcoholico || "", {
    font: { name: "Arial", size: 7 },
  });
  merge(sheet, "F23:X23", "", {});
  styleRange(sheet, 23, 23, 1, 24);
  sheet.getRow(23).height = 13;

  merge(sheet, "A24:B24", "TANQUE DE ORIGEN", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C24:E24", materiaPrima.tanqueOrigen || "", {
    font: { name: "Arial", size: 7 },
  });
  merge(sheet, "F24:X24", "", {});
  styleRange(sheet, 24, 24, 1, 24);
  sheet.getRow(24).height = 13;

  merge(sheet, "A25:B25", "VOLUMEN ALIMENTADO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "C25:E25", materiaPrima.volumenAlimentado || "", {
    font: { name: "Arial", size: 7 },
  });
  merge(sheet, "F25:X25", "", {});
  styleRange(sheet, 25, 25, 1, 24);
  sheet.getRow(25).height = 13;

  styleRange(sheet, 26, 26, 1, 24);
  sheet.getRow(26).height = 10;
}

function addAnalisis(sheet, data = []) {
  merge(sheet, "A27:X27", "ANALISIS FISICOQUIMICO ALIMENTACION", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });

  styleRange(sheet, 27, 27, 1, 24, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });
  sheet.getRow(27).height = 14;

  analysisColumns.forEach((column, index) => {
    const cell = sheet.getRow(28).getCell(index + 1);
    cell.value = column;
    styleCell(cell, {
      font: { name: "Arial", size: 5 },
    });
  });

  styleRange(sheet, 28, 28, 1, 24);
  sheet.getRow(28).height = 28;

  const rows = Array.isArray(data) ? data : [];

  rows.forEach((row, rowIndex) => {
    const excelRow = 29 + rowIndex;

    analysisColumns.forEach((_, colIndex) => {
      const cell = sheet.getRow(excelRow).getCell(colIndex + 1);
      cell.value = row?.[`col_${colIndex}`] || "";
      styleCell(cell, {
        fill: isCellOutOfRange(rowIndex, row, colIndex) ? COLORS.red : COLORS.white,
        font: { name: "Arial", size: 7 },
      });
    });

    sheet.getRow(excelRow).height = 14;
  });

  const permittedStart = 29 + rows.length;

  permittedRows.forEach((row, rowIndex) => {
    const excelRow = permittedStart + rowIndex;

    row.forEach((value, colIndex) => {
      const cell = sheet.getRow(excelRow).getCell(colIndex + 1);
      cell.value = value || "";
      styleCell(cell, {
        font: { name: "Arial", size: 7 },
      });
    });

    styleRange(sheet, excelRow, excelRow, 1, 24);
    sheet.getRow(excelRow).height = 14;
  });
}

export async function exportTrazabilidadLoteProduccionLaboratorioExcel({
  observacionesGenerales = "",
  encabezado = {},
  materiaPrima = {},
  analisisFisicoquimicoAlimentacion = [],
  fechaRegistro = "",
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Ambiocom";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Trazabilidad Laboratorio");

  setupSheet(sheet);

  await addHeader(workbook, sheet, observacionesGenerales);
  addTopData(sheet, encabezado);
  addMateriaPrima(sheet, materiaPrima);
  addAnalisis(sheet, analisisFisicoquimicoAlimentacion);

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = border;
      cell.alignment = cell.alignment || center;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Trazabilidad_Lote_Produccion_Laboratorio_${safeFileDate(fechaRegistro)}.xlsx`
  );
}