import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const COLORS = {
  gray: "FFD9D9D9",
  yellow: "FFFFFF00",
  white: "FFFFFFFF",
  black: "FF000000",
};

const thinBorder = {
  top: { style: "thin", color: { argb: COLORS.black } },
  left: { style: "thin", color: { argb: COLORS.black } },
  bottom: { style: "thin", color: { argb: COLORS.black } },
  right: { style: "thin", color: { argb: COLORS.black } },
};

const center = {
  vertical: "middle",
  horizontal: "center",
  wrapText: true,
};

const left = {
  vertical: "middle",
  horizontal: "left",
  wrapText: true,
};

const fill = (argb) => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const tanqueColumns = [
  { key: "codigoMuestra", label: "CODIGO DE\nMUESTRA", limit: "", width: 13 },
  { key: "muestra", label: "MUESTRA", limit: "", width: 12 },
  { key: "ga", label: "G.A % v/v", limit: "> 96% V/V", width: 11 },
  { key: "acetaldehido", label: "ACETALDEHIDO", limit: "< 2 ppm", width: 14 },
  { key: "metanol", label: "METANOL", limit: "Max 50\nppm", width: 11 },
  { key: "isopropanol", label: "ISOPROPANOL", limit: "", width: 13 },
  { key: "propanol", label: "PROPANOL", limit: "", width: 12 },
  { key: "ipaPropanol", label: "IPA +\nPROPANOL", limit: "Max 5.0 ppm", width: 12 },
  { key: "alcoholSup", label: "ALCOHOL\nSUP >3 C", limit: "0", width: 10 },
  { key: "esteres", label: "ESTERES", limit: "Max 25\nppm", width: 10 },
  { key: "acidez", label: "ACIDEZ", limit: "Max 10\nppm", width: 10 },
  { key: "totalCongeneres", label: "TOTAL\nCONGENERES", limit: "Max 35 ppm", width: 13 },
  { key: "color", label: "COLOR", limit: "", width: 8 },
  { key: "olor", label: "OLOR", limit: "", width: 8 },
  { key: "sabor", label: "SABOR", limit: "", width: 8 },
  { key: "analista", label: "ANALISTA", limit: "", width: 22 },
];

const despachosColumns = [
  { key: "fecha", label: "FECHA", start: 1, end: 3 },
  { key: "cliente", label: "CLIENTE", start: 4, end: 6 },
  { key: "placa", label: "PLACA", start: 7, end: 9 },
  { key: "cantidad", label: "CANTIDAD", start: 10, end: 12 },
  { key: "certificado", label: "No. DE CERTIFICADO", start: 13, end: 14 },
  { key: "observaciones", label: "OBSERVACIONES", start: 15, end: 18 },
];

function applyCell(cell, options = {}) {
  cell.border = thinBorder;
  cell.alignment = options.alignment || center;
  cell.font = options.font || { name: "Arial", size: 9 };
  cell.fill = fill(options.fill || COLORS.white);
}

function applyRange(sheet, rowStart, rowEnd, colStart = 1, colEnd = 18, options = {}) {
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      applyCell(sheet.getRow(r).getCell(c), options);
    }
  }
}

function merge(sheet, range, value = "", options = {}) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = value;
  applyCell(cell, options);
}

async function getLogoBase64() {
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

function setupPage(sheet) {
  sheet.views = [{ showGridLines: false }];

  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.25,
      bottom: 0.25,
      header: 0.1,
      footer: 0.1,
    },
  };
}

async function addHeader(workbook, sheet, pageLabel, comentario) {
  applyRange(sheet, 1, 5, 1, 18);

  merge(sheet, "A1:D5", "", {
    font: { name: "Arial", bold: true, size: 12 },
  });

  try {
    const logoBase64 = await getLogoBase64();
    const logoId = workbook.addImage({
      base64: logoBase64,
      extension: "png",
    });

    sheet.addImage(logoId, {
      tl: { col: 1.25, row: 1.1 },
      ext: { width: 210, height: 65 },
    });
  } catch {
    sheet.getCell("A1").value = "Ambiocom";
  }

  merge(sheet, "E1:P5", "TRAZABILIDAD DE LOTE DE PRODUCCION", {
    font: { name: "Arial", bold: true, size: 18 },
  });

  merge(sheet, "Q1:R1", "Código: 4-LAB-032", {
    font: { name: "Arial", bold: true, size: 11 },
  });

  merge(sheet, "Q2:R2", "Versión: 3", {
    font: { name: "Arial", bold: true, size: 11 },
  });

  merge(sheet, "Q3:R3", "Fecha de emisión", {
    font: { name: "Arial", bold: true, size: 11 },
  });

  merge(sheet, "Q4:R4", "12-may-26", {
    font: { name: "Arial", bold: true, size: 11 },
  });

  merge(sheet, "Q5:R5", pageLabel, {
    font: { name: "Arial", bold: true, size: 11 },
  });

  [1, 2, 3, 4, 5].forEach((row) => {
    sheet.getRow(row).height = 22;
  });

  applyRange(sheet, 6, 6, 1, 18);
  sheet.getRow(6).height = 6;

  merge(sheet, "A7:D7", "COMENTARIO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  merge(sheet, "E7:R7", comentario || "", {
    alignment: left,
    font: { name: "Arial", bold: true, size: 8 },
  });

  applyRange(sheet, 7, 7, 1, 18);
  sheet.getRow(7).height = 18;

  applyRange(sheet, 8, 8, 1, 18);
  sheet.getRow(8).height = 14;
}

function setTanqueWidths(sheet) {
  tanqueColumns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width;
  });

  sheet.getColumn(17).width = 13;
  sheet.getColumn(18).width = 13;
}

function setDespachosWidths(sheet) {
  for (let i = 1; i <= 18; i++) {
    sheet.getColumn(i).width = 12;
  }
}

async function buildTanqueSheet(workbook, sheet, config) {
  const { title, pageLabel, comentario, data = {}, terminado = false } = config;

  setupPage(sheet);
  setTanqueWidths(sheet);

  await addHeader(workbook, sheet, pageLabel, comentario);

  merge(sheet, "A9:R9", title, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 13 },
  });
  applyRange(sheet, 9, 9, 1, 18, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 13 },
  });
  sheet.getRow(9).height = 19;

  applyRange(sheet, 10, 10, 1, 18);
  sheet.getRow(10).height = 28;

  merge(sheet, "A11:C11", "ANALISIS DEL TANQUE", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 11 },
  });

  sheet.getCell("D11").value = data.tanque || "";
  applyCell(sheet.getCell("D11"), {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 10 },
  });

  sheet.getCell("E11").value = data.loteA || "";
  applyCell(sheet.getCell("E11"), {
    fill: COLORS.white,
    font: { name: "Arial", bold: true, size: 10 },
  });

  sheet.getCell("G11").value = data.loteB || "";
  applyCell(sheet.getCell("G11"), {
    fill: COLORS.white,
    font: { name: "Arial", bold: true, size: 10 },
  });

  applyRange(sheet, 11, 11, 1, 18);
  sheet.getRow(11).height = 22;

  tanqueColumns.slice(0, 12).forEach((column, index) => {
    const titleCell = sheet.getRow(12).getCell(index + 1);
    titleCell.value = column.label;
    applyCell(titleCell, {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 7 },
    });

    const limitCell = sheet.getRow(13).getCell(index + 1);
    limitCell.value = column.limit || "";
    applyCell(limitCell, {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 7 },
    });
  });

  merge(sheet, "M12:O12", "ORGANOLEPTICO", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 7 },
  });

  ["M13", "N13", "O13"].forEach((cell, index) => {
    sheet.getCell(cell).value = ["COLOR", "OLOR", "SABOR"][index];
    applyCell(sheet.getCell(cell), {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 7 },
    });
  });

  merge(sheet, "P12:P13", "ANALISTA", {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });

  merge(sheet, "Q12:R13", "", {
    fill: COLORS.white,
  });

  applyRange(sheet, 12, 13, 1, 18);
  sheet.getRow(12).height = 20;
  sheet.getRow(13).height = 18;

  const firstDataRow = 14;
  const rows = Array.isArray(data.rows) ? data.rows : [];

  rows.forEach((row, rowIndex) => {
    const excelRowNumber = firstDataRow + rowIndex;

    tanqueColumns.forEach((column, colIndex) => {
      const cell = sheet.getRow(excelRowNumber).getCell(colIndex + 1);
      cell.value = row[column.key] || "";
      applyCell(cell, {
        font: { name: "Arial", bold: true, size: 7 },
      });
    });

    applyCell(sheet.getRow(excelRowNumber).getCell(17));
    applyCell(sheet.getRow(excelRowNumber).getCell(18));
    sheet.getRow(excelRowNumber).height = 18;
  });

  const footerStart = firstDataRow + rows.length;

  if (terminado) {
    applyRange(sheet, footerStart, footerStart + 1, 1, 18);

    merge(sheet, `I${footerStart}:R${footerStart + 1}`, `OBSERVACIONES:\n${data.observaciones || ""}`, {
      alignment: left,
      font: { name: "Arial", bold: true, size: 7 },
    });

    const loteRow = footerStart + 2;

    merge(sheet, `A${loteRow}:B${loteRow}`, "LOTE  GENERADO", {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 10 },
    });

    merge(sheet, `C${loteRow}:F${loteRow}`, data.loteGenerado || "", {
      font: { name: "Arial", bold: true, size: 9 },
    });

    applyRange(sheet, loteRow, loteRow, 7, 8);

    sheet.getCell(`I${loteRow}`).value = "ESTADO";
    sheet.getCell(`L${loteRow}`).value = "SI";
    sheet.getCell(`N${loteRow}`).value = "NO";

    merge(sheet, `J${loteRow}:K${loteRow}`, data.estado || "");
    sheet.getCell(`M${loteRow}`).value = data.estadoSi || "";
    sheet.getCell(`O${loteRow}`).value = data.estadoNo || "";

    applyRange(sheet, loteRow, loteRow, 1, 18);

    ["I", "L", "N"].forEach((col) => {
      applyCell(sheet.getCell(`${col}${loteRow}`), {
        fill: COLORS.gray,
        font: { name: "Arial", bold: true, size: 9 },
      });
    });

    const jefeRow = loteRow + 2;

    merge(sheet, `A${jefeRow}:B${jefeRow}`, "JEFE DE LABORATORIO", {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 9 },
    });

    merge(sheet, `C${jefeRow}:H${jefeRow}`, data.jefeLaboratorio || "", {
      font: { name: "Arial", bold: true, size: 9 },
    });

    applyRange(sheet, jefeRow, jefeRow, 1, 18);
  } else {
    const estadoRow = footerStart;
    const destinoRow = footerStart + 1;

    sheet.getCell(`A${estadoRow}`).value = "ESTADO";
    sheet.getCell(`B${estadoRow}`).value = "CONFORME";
    sheet.getCell(`C${estadoRow}`).value = data.estadoConforme || "";

    merge(sheet, `D${estadoRow}:E${estadoRow}`, "NO CONFORME", {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 8 },
    });

    merge(sheet, `F${estadoRow}:H${estadoRow}`, data.estadoNoConforme || "");

    merge(sheet, `N${estadoRow}:R${destinoRow}`, `OBSERVACIONES:\n${data.observaciones || ""}`, {
      alignment: left,
      font: { name: "Arial", bold: true, size: 7 },
    });

    sheet.getCell(`A${destinoRow}`).value = "DESTINO:";
    merge(sheet, `B${destinoRow}:C${destinoRow}`, data.destino || "");
    merge(sheet, `D${destinoRow}:E${destinoRow}`, "ANALISTA", {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 8 },
    });
    merge(sheet, `F${destinoRow}:H${destinoRow}`, data.analista || "");

    applyRange(sheet, estadoRow, destinoRow, 1, 18);

    ["A", "B"].forEach((col) => {
      applyCell(sheet.getCell(`${col}${estadoRow}`), {
        fill: COLORS.gray,
        font: { name: "Arial", bold: true, size: 8 },
      });
    });

    applyCell(sheet.getCell(`A${destinoRow}`), {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 8 },
    });
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = thinBorder;
      cell.alignment = cell.alignment || center;
    });
  });
}

async function buildDespachosSheet(workbook, sheet, { comentario, data = {} }) {
  setupPage(sheet);
  setDespachosWidths(sheet);

  await addHeader(workbook, sheet, "PAG 3-3", comentario);

  applyRange(sheet, 9, 9, 1, 18, {
    fill: COLORS.yellow,
  });
  sheet.getRow(9).height = 5;

  merge(sheet, "A10:R10", "DESPACHOS", {
    alignment: left,
    font: { name: "Arial", bold: true, size: 12 },
  });
  sheet.getRow(10).height = 20;

  applyRange(sheet, 11, 11, 1, 18);
  sheet.getRow(11).height = 14;

  despachosColumns.forEach((column) => {
    merge(sheet, `${columnLetter(column.start)}12:${columnLetter(column.end)}12`, column.label, {
      fill: COLORS.gray,
      font: { name: "Arial", bold: true, size: 9 },
    });
  });

  applyRange(sheet, 12, 12, 1, 18, {
    fill: COLORS.gray,
    font: { name: "Arial", bold: true, size: 9 },
  });
  sheet.getRow(12).height = 20;

  const rows = Array.isArray(data.rows) ? data.rows : [];

  rows.forEach((row, rowIndex) => {
    const excelRow = 13 + rowIndex;

    despachosColumns.forEach((column) => {
      merge(
        sheet,
        `${columnLetter(column.start)}${excelRow}:${columnLetter(column.end)}${excelRow}`,
        row[column.key] || "",
        {
          font: { name: "Arial", bold: true, size: 8 },
        }
      );
    });

    applyRange(sheet, excelRow, excelRow, 1, 18);
    sheet.getRow(excelRow).height = 18;
  });
}

function columnLetter(number) {
  let temp = "";
  let letter = "";

  while (number > 0) {
    temp = (number - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    number = (number - temp - 1) / 26;
  }

  return letter;
}

export async function exportTrazabilidadRegistroLoteProduccionExcel({
  intermedios = {},
  terminado = {},
  despachos = {},
  comentarios = {},
  fechaRegistro = "",
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Ambiocom";
  workbook.created = new Date();

  const intermediosSheet = workbook.addWorksheet("Tanques intermedios");
  const terminadoSheet = workbook.addWorksheet("Producto terminado");
  const despachosSheet = workbook.addWorksheet("Despachos");

  await buildTanqueSheet(workbook, intermediosSheet, {
    title: "ANÁLISIS DE PRODUCTO EN TANQUES INTERMEDIOS DE FINAL",
    pageLabel: "PAG 3-3",
    comentario: comentarios.intermedios || "",
    data: intermedios,
  });

  await buildTanqueSheet(workbook, terminadoSheet, {
    title: "ANÁLISIS DE ALCOHOL EN TANQUES DE PRODUCTO TERMINADO",
    pageLabel: "PAG 1-1",
    comentario: comentarios.terminado || "",
    data: terminado,
    terminado: true,
  });

  await buildDespachosSheet(workbook, despachosSheet, {
    comentario: comentarios.despachos || "",
    data: despachos,
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Trazabilidad_Lote_Produccion_${safeFileDate(fechaRegistro)}.xlsx`
  );
}