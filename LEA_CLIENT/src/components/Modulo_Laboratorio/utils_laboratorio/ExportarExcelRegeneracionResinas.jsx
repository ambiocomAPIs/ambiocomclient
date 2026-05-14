import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const redFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFB3B3" },
};

const grayFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" },
};

const whiteFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFFFF" },
};

const border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
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

const headerFont = {
    bold: true,
    size: 8,
};

const bodyFont = {
    size: 8,
};

const columnsWidth = [
    12, 22, 11, 11, 15, 8, 10, 10, 11, 10, 10, 13, 10, 10, 13, 10, 12, 9, 10,
    12, 10, 12, 34,
];

const columnKeys = [
    "codigoMuestra",
    "tipoMuestra",
    "colorAparente",
    "turbiedad",
    "conductividad",
    "ph",
    "mlEdta",
    "conEdta",
    "dureza",
    "mlHcl",
    "conHcl",
    "alcalinidad",
    "mlFas",
    "conFas",
    "cloroLibre",
    "silice",
    "fosfatos",
    "sdt",
    "hierro",
    "nitritos",
    "cumple",
    "analista",
    "observaciones",
];

const headerRow1 = [
    "CODIGO DE\nMUESTRA",
    "TIPO DE MUESTRA",
    "COLOR\nAPARENTE\n(UPC)",
    "TURBIEDAD\n(UNT)",
    "CONDUCTIVIDAD\n(us/cm)",
    "pH",
    "DUREZA",
    "",
    "",
    "ALCALINIDAD",
    "",
    "",
    "CLORO LIBRE",
    "",
    "",
    "SILICE\n(mg/L)",
    "RESIDUAL\nFOSFATOS\nppm",
    "SDT",
    "HIERRO\nppm",
    "NITRITOS ppm",
    "CUMPLE",
    "ANALISTA",
    "OBSERVACIONES",
];

const headerRow2 = [
    "",
    "",
    "",
    "",
    "",
    "",
    "mL EDTA",
    "Con. EDTA",
    "DUREZA\n(mg/L)",
    "mL HCl",
    "Con. HCl",
    "ALCALINIDAD\n(mg/L)",
    "mL FAS",
    "Con. FAS",
    "CLORO LIBRE\n(mg/L)",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
];

const observableColumnNames = {
    colorAparente: "Color",
    turbiedad: "Turbiedad",
    conductividad: "Conductividad",
    ph: "pH",
    dureza: "Dureza",
    alcalinidad: "Alcalinidad",
    cloroLibre: "Cloro libre",
    silice: "Sílice",
    fosfatos: "Fosfatos",
    sdt: "SDT",
    hierro: "Hierro",
    nitritos: "Nitritos",
};

const countableKeys = Object.keys(observableColumnNames);

function styleCell(cell, options = {}) {
    cell.border = border;
    cell.alignment = options.alignment || center;
    cell.font = options.font || bodyFont;

    if (options.fill) {
        cell.fill = options.fill;
    }
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

function getSampleCode(value) {
    const match = String(value || "").match(/\d+/);
    return match ? match[0].padStart(2, "0") : "";
}

function validateCellValue(value, rule) {
    if (!value || !rule) return true;

    const normalizedRule = normalizeText(rule);
    const numericValue = parseNumber(value);

    if (["n.a", "na", "n/a", "n.a."].includes(normalizedRule)) return true;
    if (numericValue === null) return true;

    if (normalizedRule.includes("max") || normalizedRule.includes("<")) {
        const max = parseNumber(rule);
        return max === null ? true : numericValue <= max;
    }

    if (normalizedRule.includes("min") || normalizedRule.includes(">")) {
        const min = parseNumber(rule);
        return min === null ? true : numericValue >= min;
    }

    if (normalizedRule.includes("-")) {
        const numbers = String(rule).replace(/,/g, ".").match(/-?\d+(\.\d+)?/g)?.map(Number);
        if (!numbers || numbers.length < 2) return true;
        const [min, max] = numbers;
        return numericValue >= min && numericValue <= max;
    }

    return true;
}

function getWaterTypeByRow(row, waterTypes = []) {
    const sampleCode = getSampleCode(row.tipoMuestra);
    const typeByCode = waterTypes.find((type) => type.code === sampleCode);
    if (typeByCode) return typeByCode;

    return waterTypes.find((type) => normalizeText(row.tipoMuestra).includes(normalizeText(type.name))) || null;
}

function getLimitForRow(row, key, waterTypes = []) {
    const type = getWaterTypeByRow(row, waterTypes);
    return type?.limits?.[key] || "";
}

function hasRuleForKey(row, key, waterTypes = []) {
    const rule = getLimitForRow(row, key, waterTypes);
    const normalizedRule = normalizeText(rule);
    return Boolean(rule) && !["n.a", "na", "n/a", "n.a."].includes(normalizedRule);
}

function isCellOutOfRange(row, key, waterTypes = []) {
    if (!countableKeys.includes(key)) return false;
    if (!hasRuleForKey(row, key, waterTypes)) return false;
    if (!row[key]) return false;

    return !validateCellValue(row[key], getLimitForRow(row, key, waterTypes));
}

function getRowCompliance(row, waterTypes = []) {
    const keysToValidate = countableKeys.filter((key) => hasRuleForKey(row, key, waterTypes));
    if (keysToValidate.length === 0) return "";

    const hasAnyValue = keysToValidate.some((key) => row[key]);
    if (!hasAnyValue) return "";

    return keysToValidate.some((key) => isCellOutOfRange(row, key, waterTypes)) ? "NO" : "SI";
}

function getRowObservations(row, waterTypes = []) {
    const invalidKeys = countableKeys.filter((key) => isCellOutOfRange(row, key, waterTypes));
    return invalidKeys.map((key) => observableColumnNames[key]).join(", ");
}

function getAnalysisSummary(rows = [], waterTypes = []) {
    let total = 0;
    let cumple = 0;
    let noCumple = 0;

    rows.forEach((row) => {
        countableKeys.forEach((key) => {
            const value = row[key];
            if (!value || parseNumber(value) === null || !hasRuleForKey(row, key, waterTypes)) return;

            total += 1;
            if (isCellOutOfRange(row, key, waterTypes)) noCumple += 1;
            else cumple += 1;
        });
    });

    const rate = total > 0 ? ((cumple / total) * 100).toFixed(2) : "0.00";
    return { total, cumple, noCumple, rate };
}

function getCellValue(row, key, waterTypes = []) {
    if (key === "cumple") return row.cumple || getRowCompliance(row, waterTypes);
    if (key === "observaciones") return row.observaciones || getRowObservations(row, waterTypes);
    return row?.[key] ?? "";
}

function getCellFill(row, key, waterTypes = []) {
    if (key === "cumple") return getRowCompliance(row, waterTypes) === "NO" ? redFill : whiteFill;
    if (key === "observaciones") return getRowObservations(row, waterTypes) ? redFill : whiteFill;
    return isCellOutOfRange(row, key, waterTypes) ? redFill : whiteFill;
}

function buildPermittedRows(waterTypes = []) {
    return waterTypes.map((type) => [
        `${type.code}. ${type.name}`,
        type.limits.colorAparente,
        type.limits.turbiedad,
        type.limits.conductividad,
        type.limits.ph,
        "",
        "",
        type.limits.dureza,
        "",
        "",
        type.limits.alcalinidad,
        "",
        type.limits.cloroLibre,
        type.limits.silice,
        type.limits.fosfatos,
        type.limits.sdt,
        type.limits.hierro,
        type.limits.nitritos,
    ]);
}

async function loadImageBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function safeFileDate(value) {
    return String(value || "sin_fecha").replaceAll("/", "-").replaceAll(" ", "_");
}

export async function exportAnalisisRegeneracionResinasExcel({
    rows = [],
    waterTypes = [],
    fechaRegistro = "",
    titulo = "ANALISIS TREN DE REGENERACION DE RESINAS",
    codigo = "LAB - FO - 027",
    version = "15",
    pagina = "1-1",
}) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Ambiocom";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Regeneracion Resinas", {
        views: [{ showGridLines: false }],
        pageSetup: {
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            paperSize: 9,
        },
    });

    columnsWidth.forEach((width, index) => {
        sheet.getColumn(index + 1).width = width;
    });

    try {
        const logoBase64 = await loadImageBase64("/LogoCompany/logoambiocomsinfondo.png");
        const logoId = workbook.addImage({ base64: logoBase64, extension: "png" });

        sheet.mergeCells("A1:C3");
        sheet.addImage(logoId, {
            tl: { col: 0.25, row: 0.2 },
            ext: { width: 220, height: 60 },
        });
    } catch (error) {
        sheet.mergeCells("A1:C3");
        sheet.getCell("A1").value = "AMBIÓCOM";
    }

    sheet.mergeCells("D1:T3");
    sheet.mergeCells("U1:W1");
    sheet.mergeCells("U2:W2");
    sheet.mergeCells("U3:W3");

    sheet.getCell("D1").value = titulo;
    sheet.getCell("U1").value = `Código: ${codigo}`;
    sheet.getCell("U2").value = `Versión: ${version}`;
    sheet.getCell("U3").value = `Página: ${pagina}`;

    styleCell(sheet.getCell("A1"), {
        font: { bold: true, size: 16, color: { argb: "FF1040D8" } },
    });

    styleCell(sheet.getCell("D1"), {
        font: { bold: true, size: 15 },
    });

    ["U1", "U2", "U3"].forEach((cellAddress) => {
        styleCell(sheet.getCell(cellAddress), {
            font: { bold: true, size: 10 },
            fill: whiteFill,
        });
    });

    for (let rowNumber = 1; rowNumber <= 3; rowNumber++) {
        sheet.getRow(rowNumber).height = rowNumber === 1 ? 24 : 23;
        for (let col = 1; col <= 23; col++) {
            styleCell(sheet.getRow(rowNumber).getCell(col));
        }
    }

    sheet.getRow(4).height = 8;
    for (let col = 1; col <= 23; col++) {
        styleCell(sheet.getRow(4).getCell(col));
    }

    const excelHeaderRow1 = sheet.getRow(5);
    const excelHeaderRow2 = sheet.getRow(6);

    headerRow1.forEach((header, index) => {
        const cell = excelHeaderRow1.getCell(index + 1);
        cell.value = header;
        styleCell(cell, { fill: grayFill, font: headerFont });
    });

    headerRow2.forEach((header, index) => {
        const cell = excelHeaderRow2.getCell(index + 1);
        cell.value = header;
        styleCell(cell, { fill: grayFill, font: headerFont });
    });

    sheet.mergeCells("A5:A6");
    sheet.mergeCells("B5:B6");
    sheet.mergeCells("C5:C6");
    sheet.mergeCells("D5:D6");
    sheet.mergeCells("E5:E6");
    sheet.mergeCells("F5:F6");
    sheet.mergeCells("G5:I5");
    sheet.mergeCells("J5:L5");
    sheet.mergeCells("M5:O5");
    sheet.mergeCells("P5:P6");
    sheet.mergeCells("Q5:Q6");
    sheet.mergeCells("R5:R6");
    sheet.mergeCells("S5:S6");
    sheet.mergeCells("T5:T6");
    sheet.mergeCells("U5:U6");
    sheet.mergeCells("V5:V6");
    sheet.mergeCells("W5:W6");

    for (let rowNumber = 5; rowNumber <= 6; rowNumber++) {
        sheet.getRow(rowNumber).height = 32;
        for (let col = 1; col <= 23; col++) {
            styleCell(sheet.getRow(rowNumber).getCell(col), {
                fill: grayFill,
                font: headerFont,
            });
        }
    }

    const firstDataRow = 7;

    rows.forEach((row, rowIndex) => {
        const excelRow = sheet.getRow(firstDataRow + rowIndex);
        excelRow.height = 24;

        columnKeys.forEach((key, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);
            const invalid = isCellOutOfRange(row, key, waterTypes);

            cell.value = getCellValue(row, key, waterTypes);

            styleCell(cell, {
                fill: getCellFill(row, key, waterTypes),
                font: {
                    ...bodyFont,
                    color: invalid ? { argb: "FF9C0006" } : { argb: "FF000000" },
                    bold: key === "cumple" && getRowCompliance(row, waterTypes) === "NO",
                },
            });
        });
    });

    const emptyRow = firstDataRow + rows.length;
    sheet.getRow(emptyRow).height = 12;
    for (let col = 1; col <= 23; col++) {
        const cell = sheet.getRow(emptyRow).getCell(col);
        cell.value = "";
        styleCell(cell);
    }

    const permittedHeaderRow = emptyRow + 1;

    sheet.mergeCells(`A${permittedHeaderRow}:B${permittedHeaderRow}`);
    sheet.mergeCells(`C${permittedHeaderRow}:T${permittedHeaderRow}`);
    sheet.mergeCells(`U${permittedHeaderRow}:W${permittedHeaderRow}`);

    sheet.getCell(`A${permittedHeaderRow}`).value = "TIPO DE MUESTRA";
    sheet.getCell(`C${permittedHeaderRow}`).value = "VALORES PERMITIDOS";

    ["A", "C", "U"].forEach((col) => {
        styleCell(sheet.getCell(`${col}${permittedHeaderRow}`), {
            fill: grayFill,
            font: { bold: true, size: 9 },
        });
    });

    const permittedRows = buildPermittedRows(waterTypes);
    const analysisSummary = getAnalysisSummary(rows, waterTypes);

    permittedRows.forEach((row, rowIndex) => {
        const rowNumber = permittedHeaderRow + 1 + rowIndex;

        sheet.mergeCells(`A${rowNumber}:B${rowNumber}`);

        const typeCell = sheet.getCell(`A${rowNumber}`);
        typeCell.value = row[0];
        styleCell(typeCell, {
            font: { bold: true, size: 7 },
        });

        const permittedValues = [
            row[1],
            row[2],
            row[3],
            row[4],
            "",
            "",
            row[7],
            "",
            "",
            row[10],
            "",
            "",
            row[12],
            row[13],
            row[14],
            row[15],
            row[16],
            row[17],
        ];

        permittedValues.forEach((value, valueIndex) => {
            const cell = sheet.getRow(rowNumber).getCell(valueIndex + 3);
            cell.value = value;
            styleCell(cell, {
                fill: valueIndex % 2 === 0 ? grayFill : whiteFill,
                font: { size: 7 },
            });
        });

        if (rowIndex === 1) {
            sheet.mergeCells(`U${rowNumber}:W${rowNumber + 1}`);
            const legendCell = sheet.getCell(`U${rowNumber}`);
            legendCell.value = "< Menor qué\n> Mayor qué";
            styleCell(legendCell, {
                font: { bold: true, size: 10 },
            });
        }

        if (rowIndex === 3) {
            sheet.mergeCells(`U${rowNumber}:W${rowNumber + 3}`);
            const summaryCell = sheet.getCell(`U${rowNumber}`);
            summaryCell.value =
                `Datos analizados: ${analysisSummary.total}\n` +
                `Cumplen: ${analysisSummary.cumple}\n` +
                `No cumplen: ${analysisSummary.noCumple}\n` +
                `Rate: ${analysisSummary.rate}%`;

            styleCell(summaryCell, {
                alignment: left,
                font: { bold: true, size: 9 },
            });
        }

        if (![1, 2, 3, 4, 5, 6].includes(rowIndex)) {
            sheet.mergeCells(`U${rowNumber}:W${rowNumber}`);
            styleCell(sheet.getCell(`U${rowNumber}`));
        }

        sheet.getRow(rowNumber).height = 24;
    });

    const equationRow = permittedHeaderRow + permittedRows.length + 2;

    sheet.mergeCells(`A${equationRow}:G${equationRow}`);
    sheet.mergeCells(`H${equationRow}:N${equationRow}`);
    sheet.mergeCells(`O${equationRow}:U${equationRow}`);
    sheet.mergeCells(`V${equationRow}:W${equationRow}`);

    sheet.getCell(`A${equationRow}`).value = "ECUACION DE ALCALINIDAD\nmg CaCO₃/L = ((HCl)(N) × Vol HCl(mL) / Vol Mtra(mL)) × 50000";
    sheet.getCell(`H${equationRow}`).value = "ECUACION PARA DUREZA\nmg CaCO₃/L = ((EDTA)(N) × Vol EDTA(mL) / Vol Mtra(mL)) × 50000";
    sheet.getCell(`O${equationRow}`).value = "ECUACION PARA CLORO RESIDUAL\nmg Cl como Cl₂/L = ((FAS)(N) × Vol FAS(mL) / Vol Mtra(mL)) × 35543";

    ["A", "H", "O", "V"].forEach((col) => {
        styleCell(sheet.getCell(`${col}${equationRow}`), {
            font: { bold: true, size: 8 },
        });
    });

    sheet.getRow(equationRow).height = 42;

    const footerRow = equationRow + 2;
    sheet.mergeCells(`A${footerRow}:W${footerRow}`);
    const footerCell = sheet.getCell(`A${footerRow}`);
    footerCell.value = `Fecha registro: ${fechaRegistro || ""}`;

    styleCell(footerCell, {
        alignment: left,
        font: { bold: true, size: 9 },
    });

    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = cell.alignment || center;
            cell.border = cell.border || border;
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([buffer]),
        `Analisis_Regeneracion_Resinas_${safeFileDate(fechaRegistro)}.xlsx`
    );
}
