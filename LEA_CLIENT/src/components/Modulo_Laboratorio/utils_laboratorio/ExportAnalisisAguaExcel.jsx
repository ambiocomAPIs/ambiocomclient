import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const redFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFB3B3" },
};

const yellowFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFE598" },
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

const headerFont = {
    bold: true,
    size: 8,
};

const bodyFont = {
    size: 8,
};

const columnsWidth = [
    12, 16, 11, 11, 15, 8, 10, 10, 11, 10, 10, 13, 10, 10, 13, 10, 12, 9, 10,
    12, 10, 12, 32,
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

function styleCell(cell, options = {}) {
    cell.border = border;
    cell.alignment = options.alignment || center;
    cell.font = options.font || bodyFont;

    if (options.fill) {
        cell.fill = options.fill;
    }
}

function getValueByColumn({
    row,
    colIndex,
    getRowCompliance,
    getRowObservations,
}) {
    if (colIndex === 20) return getRowCompliance(row);
    if (colIndex === 22) return getRowObservations(row);
    return row?.[`col_${colIndex}`] || "";
}

function getCompareValue({
    currentRow,
    previousRow,
    colIndex,
    getRowCompliance,
    getRowObservations,
}) {
    const previousValue = getValueByColumn({
        row: previousRow || {},
        colIndex,
        getRowCompliance,
        getRowObservations,
    });

    const currentValue = getValueByColumn({
        row: currentRow || {},
        colIndex,
        getRowCompliance,
        getRowObservations,
    });

    if (!previousValue && !currentValue) return "";

    return `Ant: ${previousValue}\nAct: ${currentValue}`;
}

function getCellFill({ currentInvalid, previousInvalid, compareMode }) {
    if (!compareMode) {
        return currentInvalid ? redFill : whiteFill;
    }

    if (previousInvalid && currentInvalid) {
        return {
            type: "gradient",
            gradient: "angle",
            degree: 0,
            stops: [
                { position: 0, color: { argb: "FFFFE598" } },
                { position: 0.5, color: { argb: "FFFFE598" } },
                { position: 0.5, color: { argb: "FFFFB3B3" } },
                { position: 1, color: { argb: "FFFFB3B3" } },
            ],
        };
    }

    if (previousInvalid) return yellowFill;
    if (currentInvalid) return redFill;

    return whiteFill;
}

async function loadImageBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            resolve(reader.result.split(",")[1]);
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function exportAnalisisAguaExcel({
    data = [],
    previousDayData = [],
    compareMode = false,
    permittedRows = [],
    analysisSummary = {
        total: 0,
        cumple: 0,
        noCumple: 0,
        rate: "0.00",
    },
    fechaRegistro = "",
    fechaConsulta = "",
    getRowCompliance,
    getRowObservations,
    isCellOutOfRange,
}) {
    const workbook = new ExcelJS.Workbook();

    const logoBase64 = await loadImageBase64(
        "/LogoCompany/logoambiocomsinfondo.png"
    );

    const logoId = workbook.addImage({
        base64: logoBase64,
        extension: "png",
    });

    workbook.creator = "Ambiocom";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
        compareMode ? "Comparativo Agua" : "Analisis Agua",
        {
            views: [{ showGridLines: false }],
            pageSetup: {
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
        }
    );

    columnsWidth.forEach((width, index) => {
        sheet.getColumn(index + 1).width = compareMode ? width + 4 : width;
    });

    sheet.mergeCells("A1:D2");
    sheet.addImage(logoId, {
        tl: { col: 0.50, row: 0.15 },
        ext: { width: 240, height: 60 },
    });
    sheet.mergeCells("E1:S2");
    sheet.mergeCells("T1:W2");

    styleCell(sheet.getCell("A1"), {
        font: {
            bold: true,
            size: 18,
            color: { argb: "FF1040D8" },
        },
    });

    // sheet.getCell("A1").value = "Ambiocom\nDestilería San Martín";

    styleCell(sheet.getCell("E1"), {
        font: {
            bold: true,
            size: 15,
        },
    });

    sheet.getCell("E1").value = compareMode
        ? "TRAZABILIDAD DE LOTE DE PRODUCCION - COMPARATIVO"
        : "TRAZABILIDAD DE LOTE DE PRODUCCION";

    styleCell(sheet.getCell("T1"), {
        font: {
            bold: true,
            size: 10,
        },
    });

    sheet.getCell("T1").value = "LAB - FO - 027\nVERSION 15\nPAG 1-1";

    sheet.getRow(1).height = 28;
    sheet.getRow(2).height = 28;
    sheet.getRow(3).height = 8;

    for (let col = 1; col <= 23; col++) {
        styleCell(sheet.getRow(3).getCell(col));
    }

    const excelHeaderRow1 = sheet.getRow(4);
    const excelHeaderRow2 = sheet.getRow(5);

    headerRow1.forEach((header, index) => {
        const cell = excelHeaderRow1.getCell(index + 1);
        cell.value = header;
        styleCell(cell, {
            fill: grayFill,
            font: headerFont,
        });
    });

    headerRow2.forEach((header, index) => {
        const cell = excelHeaderRow2.getCell(index + 1);
        cell.value = header;
        styleCell(cell, {
            fill: grayFill,
            font: headerFont,
        });
    });

    sheet.mergeCells("A4:A5");
    sheet.mergeCells("B4:B5");
    sheet.mergeCells("C4:C5");
    sheet.mergeCells("D4:D5");
    sheet.mergeCells("E4:E5");
    sheet.mergeCells("F4:F5");
    sheet.mergeCells("G4:I4");
    sheet.mergeCells("J4:L4");
    sheet.mergeCells("M4:O4");
    sheet.mergeCells("P4:P5");
    sheet.mergeCells("Q4:Q5");
    sheet.mergeCells("R4:R5");
    sheet.mergeCells("S4:S5");
    sheet.mergeCells("T4:T5");
    sheet.mergeCells("U4:U5");
    sheet.mergeCells("V4:V5");
    sheet.mergeCells("W4:W5");

    for (let rowNumber = 4; rowNumber <= 5; rowNumber++) {
        sheet.getRow(rowNumber).height = 32;
        for (let col = 1; col <= 23; col++) {
            styleCell(sheet.getRow(rowNumber).getCell(col), {
                fill: grayFill,
                font: headerFont,
            });
        }
    }

    const firstDataRow = 6;

    data.forEach((row, rowIndex) => {
        const excelRow = sheet.getRow(firstDataRow + rowIndex);
        excelRow.height = compareMode ? 36 : 24;

        for (let colIndex = 0; colIndex < 23; colIndex++) {
            const cell = excelRow.getCell(colIndex + 1);

            const currentInvalid = isCellOutOfRange(row, colIndex);
            const previousInvalid = isCellOutOfRange(
                previousDayData[rowIndex] || {},
                colIndex
            );

            cell.value = compareMode
                ? getCompareValue({
                    currentRow: row,
                    previousRow: previousDayData[rowIndex] || {},
                    colIndex,
                    getRowCompliance,
                    getRowObservations,
                })
                : getValueByColumn({
                    row,
                    colIndex,
                    getRowCompliance,
                    getRowObservations,
                });

            styleCell(cell, {
                fill: getCellFill({
                    currentInvalid,
                    previousInvalid,
                    compareMode,
                }),
                font: {
                    ...bodyFont,
                    color:
                        compareMode && previousInvalid && !currentInvalid
                            ? { argb: "FF9C6500" }
                            : currentInvalid
                                ? { argb: "FF9C0006" }
                                : { argb: "FF000000" },
                },
            });
        }
    });

    const emptyRow = firstDataRow + data.length;

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
            font: {
                bold: true,
                size: 9,
            },
        });
    });

    permittedRows.forEach((row, rowIndex) => {
        const rowNumber = permittedHeaderRow + 1 + rowIndex;

        sheet.mergeCells(`A${rowNumber}:B${rowNumber}`);

        const typeCell = sheet.getCell(`A${rowNumber}`);
        typeCell.value = row[0];
        styleCell(typeCell, {
            font: {
                bold: true,
                size: 7,
            },
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
                font: {
                    size: 7,
                },
            });
        });

        if (rowIndex === 1) {
            sheet.mergeCells(`U${rowNumber}:W${rowNumber + 1}`);

            const legendCell = sheet.getCell(`U${rowNumber}`);
            legendCell.value = "< Menor qué\n> Mayor qué";
            styleCell(legendCell, {
                font: {
                    bold: true,
                    size: 10,
                },
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
                alignment: {
                    vertical: "middle",
                    horizontal: "left",
                    wrapText: true,
                },
                font: {
                    bold: true,
                    size: 9,
                },
            });
        }

        if (![1, 2, 3, 4, 5, 6].includes(rowIndex)) {
            sheet.mergeCells(`U${rowNumber}:W${rowNumber}`);
            styleCell(sheet.getCell(`U${rowNumber}`));
        }

        sheet.getRow(rowNumber).height = 24;
    });

    if (compareMode) {
        const legendRow = permittedHeaderRow + permittedRows.length + 3;

        sheet.mergeCells(`A${legendRow}:W${legendRow}`);

        const legend = sheet.getCell(`A${legendRow}`);

        legend.value =
            "Comparativo: Ant = Día anterior / Act = Día actual. Amarillo = incumplimiento día anterior. Rojo = incumplimiento día actual.";

        styleCell(legend, {
            alignment: {
                vertical: "middle",
                horizontal: "center",
                wrapText: true,
            },
            font: {
                bold: true,
                size: 10,
            },
            fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
            },
        });
    }

    const footerRow = permittedHeaderRow + permittedRows.length + 5;

    sheet.mergeCells(`A${footerRow}:W${footerRow}`);

    const footerCell = sheet.getCell(`A${footerRow}`);

    footerCell.value = `Fecha registro: ${fechaRegistro || ""}${fechaConsulta ? ` | Fecha consulta: ${fechaConsulta}` : ""
        }`;

    styleCell(footerCell, {
        alignment: {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
        },
        font: {
            bold: true,
            size: 9,
        },
    });

    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = cell.alignment || center;
            cell.border = cell.border || border;
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = compareMode
        ? `Analisis_Agua_Comparativo_${fechaRegistro || "sin_fecha"}.xlsx`
        : `Analisis_Agua_${fechaRegistro || "sin_fecha"}.xlsx`;

    saveAs(new Blob([buffer]), fileName);
}