import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const COLORS = {
  gray: "FFD9D9D9",
  white: "FFFFFFFF",
  black: "FF000000",
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

const controlColumns = Array.from({ length: 18 }, (_, i) => `muestra_${i + 1}`);

const controlParametros = [
  { key: "hora", parametro: "HORA", metodo: "", limite: "" },
  { key: "fecha", parametro: "FECHA", metodo: "", limite: "" },
  { key: "codigoMuestra", parametro: "CODIGO DE MUESTRA", metodo: "", limite: "" },
  { key: "muestra", parametro: "MUESTRA", metodo: "", limite: "" },
  { key: "ga", parametro: "G.A % v/v", metodo: "DENSIMETRIA", limite: "Min 96.0 % v/v" },
  { key: "acetaldehido", parametro: "ACETALDEHIDO", metodo: "CROMATOGRAFIA DE GASES", limite: "Max 2.0 mg/L" },
  { key: "metanol", parametro: "METANOL", metodo: "CROMATOGRAFIA DE GASES", limite: "Max 50 mg/L" },
  { key: "isopropanol", parametro: "ISOPROPANOL", metodo: "CROMATOGRAFIA DE GASES", limite: "" },
  { key: "propanol", parametro: "PROPANOL", metodo: "CROMATOGRAFIA DE GASES", limite: "" },
  { key: "ipaPropanol", parametro: "IPA + PROPANOL", metodo: "CROMATOGRAFIA DE GASES", limite: "Max 5.0 mg/L" },
  { key: "alcoholSup", parametro: "ALCOHOL SUP >3 C", metodo: "CROMATOGRAFIA DE GASES", limite: "AUSENTES" },
  { key: "esteres", parametro: "ESTERES", metodo: "CROMATOGRAFIA DE GASES", limite: "Max 25 mg/L" },
  { key: "naoh", parametro: "mL de NaOH GASTADOS", metodo: "", limite: "" },
  { key: "acidez", parametro: "ACIDEZ", metodo: "TITULOMETRIA", limite: "Max 10 mg/L" },
  { key: "totalCongeneres", parametro: "TOTAL CONGENERES", metodo: "CROMATOGRAFIA DE GASES", limite: "Max 35 mg/L" },
  { key: "color", parametro: "COLOR", metodo: "", limite: "CUMPLE" },
  { key: "olor", parametro: "OLOR", metodo: "", limite: "CUMPLE" },
  { key: "analista", parametro: "ANALISTA", metodo: "", limite: "" },
  { key: "observaciones", parametro: "OBSERVACIONES", metodo: "", limite: "" },
];

const extraccionColumns = [
  { key: "fecha", label: "FECHA", limit: "" },
  { key: "hora", label: "HORA", limit: "" },
  { key: "codigoMuestra", label: "CODIGO DE MUESTRA", limit: "" },
  { key: "alimentacionAlcohol", label: "Alimentación de alcohol", limit: "Min 80 % v/v" },
  { key: "vinazas", label: "Vinazas", limit: "0.005" },
  { key: "flemazas", label: "Flemazas", limit: "0.005" },
  { key: "fondoHidro", label: "Fondo de Hidro", limit: "Max 35 %" },
  { key: "cabezaHidro", label: "Cabeza de Hidro", limit: "Max 95 %" },
  { key: "colasAltas", label: "Colas altas", limit: "Min 60 %" },
  { key: "colasBajas", label: "Colas bajas", limit: "Max 85 %" },
  { key: "extraneutro", label: "Extraneutro", limit: "Min 96,0 %" },
  { key: "tafias", label: "Tafias", limit: "70-96.5 %" },
  { key: "rectificado", label: "Rectificado", limit: "Min 96 %" },
  { key: "decantadorFusel", label: "Decantador de Fusel", limit: "Max 10 %" },
  { key: "analista", label: "ANALISTA", limit: "" },
  { key: "observaciones", label: "OBSERVACIONES", limit: "" },
];

function colLetter(number) {
  let letter = "";
  while (number > 0) {
    const temp = (number - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    number = (number - temp - 1) / 26;
  }
  return letter;
}

function styleCell(cell, options = {}) {
  cell.border = border;
  cell.alignment = options.alignment || center;
  cell.font = options.font || { name: "Arial", size: 8 };
  cell.fill = fill(options.fill || COLORS.white);
}

function styleRange(sheet, rowStart, rowEnd, colStart = 1, colEnd = 21, options = {}) {
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
  return String(value || "sin_fecha").replaceAll("/", "-").replaceAll(" ", "_");
}

function setupSheet(sheet) {
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    margins: {
      left: 0.12,
      right: 0.12,
      top: 0.18,
      bottom: 0.18,
      header: 0.05,
      footer: 0.05,
    },
  };
}

function applyColumns(sheet) {
  const widths = [
    12, 15, 13,
    8, 8, 8, 8, 8, 8, 8, 8, 8,
    8, 8, 8, 8, 8, 8,
    9, 9, 22,
  ];

  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

async function addHeader(workbook, sheet, pageLabel, observacionesGenerales = "") {
  setupSheet(sheet);
  applyColumns(sheet);

  styleRange(sheet, 1, 5, 1, 21);

  merge(sheet, "A1:C5", "");
  try {
    const logoBase64 = await loadLogoBase64();
    const logoId = workbook.addImage({ base64: logoBase64, extension: "png" });
    sheet.addImage(logoId, {
      tl: { col: 0.5, row: 0.75 },
      ext: { width: 220, height: 64 },
    });
  } catch {
    sheet.getCell("A1").value = "Ambiocom";
  }

  merge(sheet, "D1:R5", "TRAZABILIDAD DE LOTE DE PRODUCCION", {
    font: { name: "Arial", bold: true, size: 18 },
  });

  merge(sheet, "S1:U1", "Código: 4-LAB-032", {
    font: { name: "Arial", bold: true, size: 9 },
  });
  merge(sheet, "S2:U2", "Versión: 3", {
    font: { name: "Arial", bold: true, size: 9 },
  });
  merge(sheet, "S3:U3", "Fecha de emisión", {
    font: { name: "Arial", bold: true, size: 9 },
  });
  merge(sheet, "S4:U4", "12-may-26", {
    font: { name: "Arial", bold: true, size: 9 },
  });
  merge(sheet, "S5:U5", pageLabel, {
    font: { name: "Arial", bold: true, size: 9 },
  });

  [1, 2, 3, 4, 5].forEach((r) => {
    sheet.getRow(r).height = 18;
  });

  styleRange(sheet, 6, 6, 1, 21);
  sheet.getRow(6).height = 6;

  merge(sheet, "A7:C7", "OBSERVACIONES", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "D7:U7", observacionesGenerales || "", {
    alignment: left,
    font: { name: "Arial", bold: true, size: 8 },
  });

  styleRange(sheet, 8, 8, 1, 21);
  sheet.getRow(7).height = 18;
  sheet.getRow(8).height = 7;
}

async function buildControlCalidadSheet(workbook, sheet, {
  encabezado = {},
  controlCalidad = {},
  observacionesGenerales = "",
}) {
  await addHeader(workbook, sheet, "PAG 3-3", observacionesGenerales);

  merge(sheet, "A9:U9", "CONTROL DE CALIDAD EN PROCESO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  styleRange(sheet, 9, 9, 1, 21, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  sheet.getRow(9).height = 17;

  styleRange(sheet, 10, 10, 1, 21);
  sheet.getRow(10).height = 8;

  sheet.getCell("A11").value = "FECHA:";
  styleCell(sheet.getCell("A11"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "B11:F11", encabezado.fecha || "", {
    font: { name: "Arial", size: 7 },
  });

  sheet.getCell("G11").value = "TANQUE";
  styleCell(sheet.getCell("G11"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "H11:U11", encabezado.tanque || "", {
    font: { name: "Arial", size: 7 },
  });

  styleRange(sheet, 11, 11, 1, 21);
  sheet.getRow(11).height = 17;

  styleRange(sheet, 12, 12, 1, 21);
  sheet.getRow(12).height = 8;

  merge(sheet, "A13:U13", "MUESTRAS DE DESTILERIA", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  styleRange(sheet, 13, 13, 1, 21, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  sheet.getRow(13).height = 17;

  styleRange(sheet, 14, 14, 1, 21);
  sheet.getRow(14).height = 7;

  sheet.getCell("A15").value = "PARAMETRO";
  sheet.getCell("B15").value = "METODO";
  sheet.getCell("C15").value = "LIMITE";

  ["A15", "B15", "C15"].forEach((cell) => {
    styleCell(sheet.getCell(cell), {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 7 },
    });
  });

  controlColumns.forEach((column, index) => {
    const cell = sheet.getRow(15).getCell(index + 4);
    cell.value = index + 1;
    styleCell(cell, {
      font: { name: "Arial", bold: true, size: 7 },
    });
  });

  styleRange(sheet, 15, 15, 1, 21);
  sheet.getRow(15).height = 22;

  let rowNumber = 16;

  controlParametros.forEach((parametro) => {
    if (parametro.key === "observaciones") {
      sheet.getCell(`A${rowNumber}`).value = "OBSERVACIONES";
      styleCell(sheet.getCell(`A${rowNumber}`), {
        font: { name: "Arial", bold: true, size: 7 },
      });

      merge(
        sheet,
        `B${rowNumber}:U${rowNumber}`,
        controlCalidad?.[parametro.key]?.muestra_1 || "",
        {
          alignment: center,
          font: { name: "Arial", bold: true, size: 7 },
        }
      );

      styleRange(sheet, rowNumber, rowNumber, 1, 21);
      sheet.getRow(rowNumber).height = 20;
      rowNumber += 1;
      return;
    }

    sheet.getCell(`A${rowNumber}`).value = parametro.parametro;
    sheet.getCell(`B${rowNumber}`).value = parametro.metodo;
    sheet.getCell(`C${rowNumber}`).value = parametro.limite;

    styleCell(sheet.getCell(`A${rowNumber}`), {
      font: { name: "Arial", bold: true, size: 7 },
    });
    styleCell(sheet.getCell(`B${rowNumber}`), {
      font: { name: "Arial", size: 6 },
    });
    styleCell(sheet.getCell(`C${rowNumber}`), {
      font: { name: "Arial", size: 6 },
    });

    controlColumns.forEach((column, index) => {
      const cell = sheet.getRow(rowNumber).getCell(index + 4);
      cell.value = controlCalidad?.[parametro.key]?.[column] || "";
      styleCell(cell, {
        font: { name: "Arial", size: 7 },
      });
    });

    styleRange(sheet, rowNumber, rowNumber, 1, 21);
    sheet.getRow(rowNumber).height = 18;
    rowNumber += 1;
  });
}

async function buildExtraccionesSheet(workbook, sheet, {
  encabezado = {},
  extracciones = [],
  observacionesGenerales = "",
}) {
  await addHeader(workbook, sheet, "PAG 3-3", observacionesGenerales);

  merge(sheet, "A9:U9", "CONTROL DE CALIDAD EN PROCESO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  styleRange(sheet, 9, 9, 1, 21, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  sheet.getRow(9).height = 17;

  styleRange(sheet, 10, 10, 1, 21);
  sheet.getRow(10).height = 8;

  sheet.getCell("A11").value = "FECHA:";
  styleCell(sheet.getCell("A11"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "B11:F11", encabezado.fecha || "", {
    font: { name: "Arial", size: 7 },
  });

  sheet.getCell("G11").value = "TANQUE";
  styleCell(sheet.getCell("G11"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });
  merge(sheet, "H11:U11", encabezado.tanque || "", {
    font: { name: "Arial", size: 7 },
  });

  styleRange(sheet, 11, 11, 1, 21);
  sheet.getRow(11).height = 17;

  styleRange(sheet, 12, 12, 1, 21);
  sheet.getRow(12).height = 8;

  merge(sheet, "A13:U13", "EXTRACCIONES EN LA DESTILERIA", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  styleRange(sheet, 13, 13, 1, 21, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });
  sheet.getRow(13).height = 17;

  styleRange(sheet, 14, 14, 1, 21);
  sheet.getRow(14).height = 8;

  sheet.getCell("A15").value = "METODO";
  styleCell(sheet.getCell("A15"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "B15:C15", "DENSIMETRIA", {
    font: { name: "Arial", bold: true, size: 7 },
  });
  styleRange(sheet, 15, 15, 1, 21);
  sheet.getRow(15).height = 17;

  styleRange(sheet, 16, 16, 1, 21);
  sheet.getRow(16).height = 10;

  const headerRow = 17;

  let excelCol = 1;
  extraccionColumns.forEach((column) => {
    const span = column.key === "observaciones" ? 2 : 1;
    const start = excelCol;
    const end = excelCol + span - 1;

    merge(
      sheet,
      `${colLetter(start)}${headerRow}:${colLetter(end)}${headerRow + 1}`,
      column.label,
      {
        font: { name: "Arial", bold: true, size: 6 },
      }
    );

    excelCol += span;
  });

  merge(sheet, "R17:U18", "", {});
  styleRange(sheet, 17, 18, 1, 21);
  sheet.getRow(17).height = 19;
  sheet.getRow(18).height = 19;

  const rows = Array.isArray(extracciones) ? extracciones : [];
  const firstRow = 19;

  rows.forEach((row, rowIndex) => {
    let col = 1;
    const excelRow = firstRow + rowIndex;

    extraccionColumns.forEach((column) => {
      if (column.key === "observaciones") {
        merge(
          sheet,
          `${colLetter(col)}${excelRow}:${colLetter(col + 1)}${excelRow}`,
          row[column.key] || "",
          {
            font: { name: "Arial", size: 7 },
          }
        );
        col += 2;
      } else {
        const cell = sheet.getRow(excelRow).getCell(col);
        cell.value = row[column.key] || "";
        styleCell(cell, {
          font: { name: "Arial", size: 7 },
        });
        col += 1;
      }
    });

    merge(sheet, `R${excelRow}:U${excelRow}`, "", {});
    styleRange(sheet, excelRow, excelRow, 1, 21);
    sheet.getRow(excelRow).height = 18;
  });

  const limitsRow = firstRow + rows.length;

  sheet.getCell(`A${limitsRow}`).value = "LIMITES";
  styleCell(sheet.getCell(`A${limitsRow}`), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  extraccionColumns.slice(3, 14).forEach((column, index) => {
    const cell = sheet.getRow(limitsRow).getCell(index + 4);
    cell.value = column.limit || "";
    styleCell(cell, {
      font: { name: "Arial", size: 6 },
    });
  });

  merge(sheet, `O${limitsRow}:U${limitsRow}`, "", {});
  styleRange(sheet, limitsRow, limitsRow, 1, 21);
  sheet.getRow(limitsRow).height = 18;

  const grayRow = limitsRow + 1;
  styleRange(sheet, grayRow, grayRow, 1, 21, {
    fill: COLORS.gray,
  });
  sheet.getRow(grayRow).height = 14;
}

export async function exportControlCalidadProcesoDestileriaExcel({
  encabezado = {},
  controlCalidad = {},
  extracciones = [],
  observacionesGenerales = "",
  fechaRegistro = "",
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Ambiocom";
  workbook.created = new Date();

  const controlSheet = workbook.addWorksheet("Control Calidad");
  const extraccionesSheet = workbook.addWorksheet("Extracciones");

  await buildControlCalidadSheet(workbook, controlSheet, {
    encabezado,
    controlCalidad,
    observacionesGenerales,
  });

  await buildExtraccionesSheet(workbook, extraccionesSheet, {
    encabezado,
    extracciones,
    observacionesGenerales,
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Control_Calidad_Proceso_Destileria_${safeFileDate(fechaRegistro)}.xlsx`
  );
}