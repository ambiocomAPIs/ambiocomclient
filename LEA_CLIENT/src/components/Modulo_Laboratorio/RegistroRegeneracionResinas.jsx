import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Snackbar,
    Stack,
    TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Swal from "sweetalert2";

import { exportAnalisisRegeneracionResinasExcel } from "./utils_laboratorio/ExportarExcelRegeneracionResinas";

const API_URL = "https://ambiocomserver.onrender.com/regeneracionresinas/api/analisis-agua";
const DRAFT_STORAGE_KEY = "analisis_agua_registro_draft";
const LOGO_SRC = "/LogoCompany/logoambiocomsinfondo.png";

const EDIT_ALLOWED_ROLES = ["laboratorio", "calidad", "developer"];

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

const defaultSamples = [
    "01. AGUA DE PROCESO",
    "02. AGUA DE CALDERA ALIMENTACION",
    "03. AGUA DE ENFRIAMIENTO",
    "04. AGUA POTABLE",
    "05. AGUA DE POZO",
    "06. TK 670",
];

const waterTypes = [
    {
        code: "01",
        name: "AGUA DE PROCESO",
        limits: {
            colorAparente: "Max 15",
            turbiedad: "Max 2.0",
            conductividad: "< 500",
            ph: "6.5 - 8.0",
            dureza: "Max 200",
            alcalinidad: "Max 200",
            cloroLibre: "Máx 2,0",
            silice: "< 70",
            fosfatos: "N.A",
            sdt: "N.A",
            hierro: "N.A",
            nitritos: "N.A",
        },
    },
    {
        code: "02",
        name: "AGUA DE CALDERA ALIMENTACION",
        limits: {
            colorAparente: "Max 15",
            turbiedad: "N.A",
            conductividad: "< 500",
            ph: "5.5 - 7.5",
            dureza: "Max 10",
            alcalinidad: "Max 200",
            cloroLibre: "N.A",
            silice: "< 5.0",
            fosfatos: "N.A",
            sdt: "Máx 150",
            hierro: "Máx 0,3",
            nitritos: "N.A",
        },
    },
    {
        code: "03",
        name: "AGUA DE ENFRIAMIENTO",
        limits: {
            colorAparente: "Max 300",
            turbiedad: "N.A",
            conductividad: "Max 2900",
            ph: "7.0 - 10.0",
            dureza: "Max 200",
            alcalinidad: "Max 500",
            cloroLibre: "< 1.0",
            silice: "N.A",
            fosfatos: "Min 10",
            sdt: "Máx 2000",
            hierro: "Máx 5,0",
            nitritos: "Min 10",
        },
    },
    {
        code: "04",
        name: "AGUA POTABLE",
        limits: {
            colorAparente: "Max 15",
            turbiedad: "Max 2.0",
            conductividad: "Max 1000",
            ph: "6.5 - 9.0",
            dureza: "Max 300",
            alcalinidad: "Max 200",
            cloroLibre: "0.2 - 2.0",
            silice: "N.A",
            fosfatos: "N.A",
            sdt: "N.A",
            hierro: "N.A",
            nitritos: "N.A",
        },
    },
    {
        code: "05",
        name: "AGUA DE POZO",
        limits: {
            colorAparente: "Max 50",
            turbiedad: "Max 5.0",
            conductividad: "< 500",
            ph: "7.0 - 9.5",
            dureza: "Max 300",
            alcalinidad: "Max 300",
            cloroLibre: "N.A",
            silice: "< 200",
            fosfatos: "N.A",
            sdt: "N.A",
            hierro: "N.A",
            nitritos: "N.A",
        },
    },
    {
        code: "06",
        name: "TK 670",
        limits: {
            colorAparente: "Max 15",
            turbiedad: "Max 2.0",
            conductividad: "<300",
            ph: "6.0 - 9.0",
            dureza: "< 5.0",
            alcalinidad: "Max 100",
            cloroLibre: "< 1.0",
            silice: "< 5.0",
            fosfatos: "N.A",
            sdt: "Máx 150",
            hierro: "Máx 0,3",
            nitritos: "N.A",
        },
    },
    {
        code: "07",
        name: "PURGA EN LA CALDERA",
        limits: {
            colorAparente: "N.A",
            turbiedad: "Max 3.0",
            conductividad: "Max 3600",
            ph: "10.0 - 11.5",
            dureza: "< 5.0",
            alcalinidad: "Max 700",
            cloroLibre: "< 1.0",
            silice: "Max 150",
            fosfatos: "N.A",
            sdt: "Máx 2500",
            hierro: "Máx 5,0",
            nitritos: "Max 10",
        },
    },
    {
        code: "08",
        name: "ENTRADA A LA HIDROSELECTORA",
        limits: {
            colorAparente: "Max 20",
            turbiedad: "Max 2.0",
            conductividad: "<300",
            ph: "7.0 - 10.0",
            dureza: "< 30",
            alcalinidad: "Max 150",
            cloroLibre: "< 1.0",
            silice: "Max 10",
            fosfatos: "N.A",
            sdt: "Máx 2500",
            hierro: "Máx 5,0",
            nitritos: "Max 10",
        },
    },
    {
        code: "09",
        name: "ENTRADA A LA DESTILERIA",
        limits: {
            colorAparente: "Max 20",
            turbiedad: "Max 2.0",
            conductividad: "<300",
            ph: "7.0 - 10.0",
            dureza: "< 30",
            alcalinidad: "Max 150",
            cloroLibre: "Máx 2,0",
            silice: "Max 10",
            fosfatos: "N.A",
            sdt: "Máx 2500",
            hierro: "Máx 5,0",
            nitritos: "Max 10",
        },
    },
    {
        code: "10",
        name: "OSMOSIS",
        limits: {
            colorAparente: "Max 3",
            turbiedad: "Max 1.0",
            conductividad: "<35",
            ph: "7.0 - 8.0",
            dureza: "Max 10",
            alcalinidad: "Max 150",
            cloroLibre: "N.A",
            silice: "N.A",
            fosfatos: "N.A",
            sdt: "N.A",
            hierro: "N.A",
            nitritos: "N.A",
        },
    },
];

const analysisColumns = [
    { key: "codigoMuestra", label: "CODIGO DE\nMUESTRA", width: 72 },
    { key: "tipoMuestra", label: "TIPO DE MUESTRA", width: 150 },
    { key: "colorAparente", label: "COLOR\nAPARENTE\n(UPC)", width: 65 },
    { key: "turbiedad", label: "TURBIEDAD\n(UNT)", width: 67 },
    { key: "conductividad", label: "CONDUCTIVIDAD\n(us/cm)", width: 84 },
    { key: "ph", label: "pH", width: 67 },
    { key: "mlEdta", label: "mL EDTA", width: 64, group: "DUREZA" },
    { key: "conEdta", label: "Con. EDTA", width: 64, group: "DUREZA" },
    { key: "dureza", label: "DUREZA\n(mg/L)", width: 60, group: "DUREZA" },
    { key: "mlHcl", label: "mL HCl", width: 58, group: "ALCALINIDAD" },
    { key: "conHcl", label: "Con. HCl", width: 58, group: "ALCALINIDAD" },
    { key: "alcalinidad", label: "ALCALINIDAD\n(mg/L)", width: 74, group: "ALCALINIDAD" },
    { key: "mlFas", label: "mL FAS", width: 67, group: "CLORO LIBRE" },
    { key: "conFas", label: "Con. FAS", width: 74, group: "CLORO LIBRE" },
    { key: "cloroLibre", label: "CLORO LIBRE\n(mg/L)", width: 70, group: "CLORO LIBRE" },
    { key: "silice", label: "SILICE\n(mg/L)", width: 54 },
    { key: "fosfatos", label: "RESIDUAL\nFOSFATOS\nppm", width: 62 },
    { key: "sdt", label: "SDT", width: 52 },
    { key: "hierro", label: "HIERRO\nppm", width: 60 },
    { key: "nitritos", label: "NITRITOS ppm", width: 74 },
    { key: "cumple", label: "CUMPLE", width: 70 },
    { key: "analista", label: "ANALISTA", width: 68 },
    { key: "observaciones", label: "OBSERVACIONES", width: 194 },
];

const equationBlocks = [
    { title: "ECUACION DE ALCALINIDAD", formula: "mg CaCO₃/L = ((HCl)(N) × Vol HCl(mL) / Vol Mtra(mL)) × 50000" },
    { title: "ECUACION PARA DUREZA", formula: "mg CaCO₃/L = ((EDTA)(N) × Vol EDTA(mL) / Vol Mtra(mL)) × 50000" },
    { title: "ECUACION PARA CLORO RESIDUAL", formula: "mg Cl como Cl₂/L = ((FAS)(N) × Vol FAS(mL) / Vol Mtra(mL)) × 35543" },
];

const editableRows = 10;

const cellStyle = {
    border: "1px solid #000",
    padding: 0,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 10,
    height: 26,
    whiteSpace: "pre-line",
    lineHeight: 1.08,
    fontFamily: "Arial, sans-serif",
};

const headerCell = { ...cellStyle, background: "#e7e7e7", fontWeight: 700 };
const groupHeader = { ...cellStyle, background: "#d9d9d9", fontWeight: 800, height: 18 };

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

function formatDateToDDMMYYYY(dateValue) {
    if (!dateValue) return "";
    const [year, month, day] = dateValue.split("-");
    return `${day}-${month}-${year}`;
}

function formatDDMMYYYYToInput(fecha) {
    if (!fecha) return "";
    const [day, month, year] = String(fecha).split("-");
    if (!day || !month || !year) return "";
    return `${year}-${month}-${day}`;
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

function getWaterTypeByRow(row) {
    const sampleCode = getSampleCode(row.tipoMuestra);
    const typeByCode = waterTypes.find((type) => type.code === sampleCode);
    if (typeByCode) return typeByCode;

    const typeByText = waterTypes.find((type) => normalizeText(row.tipoMuestra).includes(normalizeText(type.name)));
    return typeByText || null;
}

function getLimitForRow(row, key) {
    const type = getWaterTypeByRow(row);
    return type?.limits?.[key] || "";
}

function hasRuleForKey(row, key) {
    const rule = getLimitForRow(row, key);
    const normalizedRule = normalizeText(rule);
    return Boolean(rule) && !["n.a", "na", "n/a", "n.a."].includes(normalizedRule);
}

function isCellOutOfRange(row, key) {
    if (!countableKeys.includes(key)) return false;
    if (!hasRuleForKey(row, key)) return false;
    if (!row[key]) return false;
    return !validateCellValue(row[key], getLimitForRow(row, key));
}

function getRowCompliance(row) {
    const keysToValidate = countableKeys.filter((key) => hasRuleForKey(row, key));
    if (keysToValidate.length === 0) return "";

    const hasAnyValue = keysToValidate.some((key) => row[key]);
    if (!hasAnyValue) return "";

    return keysToValidate.some((key) => isCellOutOfRange(row, key)) ? "NO" : "SI";
}

function getRowObservations(row) {
    const invalidKeys = countableKeys.filter((key) => isCellOutOfRange(row, key));
    return invalidKeys.map((key) => observableColumnNames[key]).join(", ");
}

function getAnalysisSummary(rows) {
    let total = 0;
    let cumple = 0;
    let noCumple = 0;

    rows.forEach((row) => {
        countableKeys.forEach((key) => {
            const value = row[key];
            if (!value || parseNumber(value) === null || !hasRuleForKey(row, key)) return;
            total += 1;
            if (isCellOutOfRange(row, key)) noCumple += 1;
            else cumple += 1;
        });
    });

    const rate = total > 0 ? ((cumple / total) * 100).toFixed(2) : "0.00";
    return { total, cumple, noCumple, rate };
}

function createEmptyRow(index = 0) {
    return analysisColumns.reduce(
        (acc, column) => {
            acc[column.key] = "";
            return acc;
        },
        {
            codigoMuestra: String(2435 + index).padStart(5, "0"),
            tipoMuestra: defaultSamples[index] || "",
            conEdta: "0.02N",
            conHcl: "0.1N",
            conFas: "0.0028N",
        }
    );
}

function createInitialData() {
    return Array.from({ length: editableRows }, (_, index) => createEmptyRow(index));
}

function getInitialDraft() {
    return {
        rows: createInitialData(),
        observacionesGenerales: "",
        fechaConsulta: "",
        fechaRegistro: "",
        registroId: null,
        formMode: "create",
        encabezado: {
            codigo: "LAB - FO - 027",
            version: "15",
            pagina: "1-1",
            titulo: "ANALISIS DE AGUA TREN DE REGENERACION DE RESINA",
        },
    };
}

function getDraftData() {
    try {
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        return draft ? JSON.parse(draft) : getInitialDraft();
    } catch {
        return getInitialDraft();
    }
}

function getCellBackground(row, columnKey) {
    if (columnKey === "cumple") return getRowCompliance(row) === "NO" ? "#ffb3b3" : "#fff";
    if (columnKey === "observaciones") return getRowObservations(row) ? "#ffb3b3" : "#fff";
    return isCellOutOfRange(row, columnKey) ? "#ffb3b3" : "#fff";
}

function EditableCell({ value, onChange, disabled, backgroundColor, rowIndex, columnKey, onKeyDown }) {
    return (
        <TextField
            value={value || ""}
            disabled={disabled}
            inputProps={{ "data-cell": `${rowIndex}-${columnKey}` }}
            onKeyDown={onKeyDown}
            onChange={onChange}
            variant="standard"
            fullWidth
            multiline
            InputProps={{ disableUnderline: true }}
            sx={{
                "& .MuiInputBase-root": { backgroundColor, minHeight: 26 },
                "& .MuiInputBase-input": {
                    textAlign: "center",
                    fontSize: 10,
                    padding: "2px",
                    lineHeight: 1.1,
                    color: backgroundColor === "#ffb3b3" ? "#b00000" : "inherit",
                    fontWeight: columnKey === "cumple" && value === "NO" ? 800 : 500,
                },
            }}
        />
    );
}

function handleCellKeyDown(event, rowIndex, columnKey, rowsLength) {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const nextRow = rowIndex + 1;
    if (nextRow >= rowsLength) return;

    const nextInput = document.querySelector(`[data-cell="${nextRow}-${columnKey}"]`);
    nextInput?.focus();
    nextInput?.select?.();
}

function AnalysisTable({
    rows,
    setRows,
    encabezado,
    observacionesGenerales,
    setObservacionesGenerales,
    canEditTable,
}) {
    const analysisSummary = useMemo(() => getAnalysisSummary(rows), [rows]);

    const updateCell = (rowIndex, key, value) => {
        if (key === "cumple" || key === "observaciones") return;

        setRows((prev) => {
            const copy = [...prev];
            copy[rowIndex] = { ...copy[rowIndex], [key]: value };
            return copy;
        });
    };

    return (
        <Paper sx={{ overflow: "auto", p: 0 }}>
            <table className="excelWaterTable">
                <colgroup>
                    {analysisColumns.map((column) => (
                        <col key={column.key} style={{ width: column.width }} />
                    ))}
                </colgroup>

                <tbody>
                    <tr style={{ height: 20 }}>
                        <td colSpan={3} rowSpan={3} style={{ ...cellStyle, height: 70 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
                                <img src={LOGO_SRC} alt="logo" style={{ width: 220, height: 60, objectFit: "contain" }} />
                            </Box>
                        </td>

                        <td colSpan={17} rowSpan={3} style={{ ...cellStyle, fontSize: 23, fontWeight: 800, letterSpacing: 1 }}>
                            ANALISIS TREN DE REGENERACION DE RESINAS
                        </td>

                        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 11, textAlign: "center", background: "#ffffff" }}>
                            Código: {encabezado.codigo || "---"}
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 11, textAlign: "center", background: "#ffffff" }}>
                            Versión: {encabezado.version || "---"}
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: 11, textAlign: "center", background: "#ffffff" }}>
                            Página: {encabezado.pagina || "---"}
                        </td>
                    </tr>

                    <tr><td colSpan={23} style={{ ...cellStyle, height: 8 }} /></tr>

                    <tr>
                        <td
                            colSpan={3}
                            style={{
                                ...headerCell,
                                height: 38,
                                fontSize: 12,
                                textAlign: "center",
                            }}
                        >
                            OBSERVACIONES
                        </td>

                        <td
                            colSpan={20}
                            style={{
                                ...cellStyle,
                                height: 38,
                                padding: 0,
                                background: "#ffffff",
                            }}
                        >
                            <TextField
                                value={observacionesGenerales || ""}
                                disabled={!canEditTable}
                                onChange={(event) => setObservacionesGenerales(event.target.value)}
                                variant="standard"
                                fullWidth
                                multiline
                                minRows={1}
                                maxRows={3}
                                placeholder="Digite las observaciones generales del registro..."
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    "& .MuiInputBase-root": {
                                        minHeight: 38,
                                        px: 1,
                                        alignItems: "center",
                                    },
                                    "& .MuiInputBase-input": {
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textAlign: "left",
                                        lineHeight: 1.25,
                                    },
                                }}
                            />
                        </td>
                    </tr>

                    <tr><td colSpan={23} style={{ ...cellStyle, height: 8 }} /></tr>

                    <tr>
                        {analysisColumns.slice(0, 6).map((column) => (
                            <td key={column.key} rowSpan={2} style={headerCell}>{column.label}</td>
                        ))}

                        <td colSpan={3} style={groupHeader}>DUREZA</td>
                        <td colSpan={3} style={groupHeader}>ALCALINIDAD</td>
                        <td colSpan={3} style={groupHeader}>CLORO LIBRE</td>

                        {analysisColumns.slice(15).map((column) => (
                            <td key={column.key} rowSpan={2} style={headerCell}>{column.label}</td>
                        ))}
                    </tr>

                    <tr>
                        {analysisColumns.slice(6, 15).map((column) => (
                            <td key={column.key} style={headerCell}>{column.label}</td>
                        ))}
                    </tr>

                    {rows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                            {analysisColumns.map((column) => {
                                const cellValue =
                                    column.key === "cumple"
                                        ? getRowCompliance(row)
                                        : column.key === "observaciones"
                                            ? getRowObservations(row)
                                            : row[column.key];

                                const backgroundColor = getCellBackground(row, column.key);

                                return (
                                    <td key={`${rowIndex}-${column.key}`} style={{ ...cellStyle, padding: 0 }}>
                                        <EditableCell
                                            value={cellValue}
                                            disabled={column.key === "cumple" || column.key === "observaciones"}
                                            backgroundColor={backgroundColor}
                                            rowIndex={rowIndex}
                                            columnKey={column.key}
                                            onKeyDown={(event) => handleCellKeyDown(event, rowIndex, column.key, rows.length)}
                                            onChange={(event) => updateCell(rowIndex, column.key, event.target.value)}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    <tr><td colSpan={23} style={{ ...cellStyle, height: 16 }} /></tr>

                    <tr>
                        <td colSpan={2} style={{ ...groupHeader, textAlign: "center" }}>TIPO DE MUESTRA</td>
                        <td colSpan={18} style={groupHeader}>VALORES PERMITIDOS</td>
                        <td colSpan={3} style={cellStyle} />
                    </tr>

                    {waterTypes.map((type, rowIndex) => (
                        <tr key={type.code}>
                            <td colSpan={2} style={{ ...cellStyle, fontSize: 8, fontWeight: 700 }}>
                                {type.code}. {type.name}
                            </td>

                            {[
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
                                "",
                                type.limits.cloroLibre,
                                type.limits.silice,
                                type.limits.fosfatos,
                                type.limits.sdt,
                                type.limits.hierro,
                                type.limits.nitritos,
                            ].map((value, index) => (
                                <td key={index} style={{ ...cellStyle, background: index % 2 === 0 ? "#d9d9d9" : "#fff", fontSize: 10 }}>
                                    {value}
                                </td>
                            ))}

                            {rowIndex === 1 && (
                                <td rowSpan={4} colSpan={3} style={{ ...cellStyle, fontWeight: 800, fontSize: 12, lineHeight: 1.6 }}>
                                    {"< Menor qué"}<br />{"> Mayor qué"}<br />
                                    Datos analizados: {analysisSummary.total}<br />
                                    Cumplen: {analysisSummary.cumple}<br />
                                    No cumplen: {analysisSummary.noCumple}<br />
                                    Rate: {analysisSummary.rate}%
                                </td>
                            )}

                            {rowIndex !== 1 && rowIndex !== 2 && rowIndex !== 3 && rowIndex !== 4 && (
                                <td colSpan={3} style={cellStyle} />
                            )}
                        </tr>
                    ))}

                    <tr>
                        {equationBlocks.map((item) => (
                            <td key={item.title} colSpan={7} style={{ ...cellStyle, height: 52 }}>
                                <Box sx={{ fontWeight: 900, fontSize: 11, borderBottom: "1px solid #111", py: 0.5 }}>
                                    {item.title}
                                </Box>
                                <Box sx={{ fontSize: 10, py: 0.7, fontWeight: 700 }}>
                                    {item.formula}
                                </Box>
                            </td>
                        ))}
                        <td colSpan={2} style={cellStyle} />
                    </tr>
                </tbody>
            </table>
        </Paper>
    );
}

export default function AnalisisAguaModule() {
    const draft = getDraftData();

    // const { rol } = useAuth();
    // const canEditTable = EDIT_ALLOWED_ROLES.includes(rol);
    const canEditTable = true;

    const [open, setOpen] = useState(false);
    const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
    const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");
    const [registroId, setRegistroId] = useState(draft.registroId || null);
    const [formMode, setFormMode] = useState(draft.formMode || (draft.registroId ? "edit" : "create"));
    const [encabezado] = useState(draft.encabezado || getInitialDraft().encabezado);
    const [rows, setRows] = useState(draft.rows || createInitialData());
    const [observacionesGenerales, setObservacionesGenerales] = useState(draft.observacionesGenerales || "");
    const [loading, setLoading] = useState(false);
    const [fechasDisponibles, setFechasDisponibles] = useState([]);

    const [registrosFecha, setRegistrosFecha] = useState([]);
    const [registroIndex, setRegistroIndex] = useState(0);

    const resumen = useMemo(() => getAnalysisSummary(rows), [rows]);

    useEffect(() => {
        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
                fechaConsulta,
                fechaRegistro,
                registroId,
                formMode,
                encabezado,
                rows,
                observacionesGenerales,
                updatedAt: new Date().toISOString(),
            })
        );
    }, [fechaConsulta, fechaRegistro, registroId, formMode, encabezado, rows, observacionesGenerales]);

    useEffect(() => {
        const loadFechasDisponibles = async () => {
            try {
                const response = await axios.get(`${API_URL}/fechas`);
                setFechasDisponibles(response.data?.fechas || []);
            } catch (error) {
                console.error("Error cargando fechas disponibles:", error);
            }
        };

        loadFechasDisponibles();
    }, []);

    useEffect(() => {
        const loadLatest = async () => {
            const hasDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (hasDraft) return;

            try {
                const response = await axios.get(`${API_URL}/latest`);
                const data = response.data?.data;

                if (!data) return;

                setRows(Array.isArray(data.rows) ? data.rows : createInitialData());
                setObservacionesGenerales(data.observaciones || "");
                setRegistroId(data._id || data.id || null);
                setFormMode("edit");
                setFechaRegistro(formatDDMMYYYYToInput(data.fechaRegistro));
                setFechaConsulta(formatDDMMYYYYToInput(data.fechaRegistro));
                setRegistrosFecha([data]);
                setRegistroIndex(0);
            } catch (error) {
                console.error("Error cargando último registro:", error);
            }
        };

        loadLatest();
    }, []);

    const isFechaDisponible = (date) => {
        if (!date || fechasDisponibles.length === 0) return false;
        return fechasDisponibles.includes(date.format("DD-MM-YYYY"));
    };

    const refreshFechasDisponibles = async () => {
        try {
            const response = await axios.get(`${API_URL}/fechas`);
            setFechasDisponibles(response.data?.fechas || []);
        } catch (error) {
            console.error("Error actualizando fechas disponibles:", error);
        }
    };

    const loadRegistroSeleccionado = (data, index) => {
        const registro = data[index];

        if (!registro) return;

        setRows(Array.isArray(registro.rows) ? registro.rows : createInitialData());
        setObservacionesGenerales(registro.observaciones || "");
        setRegistroId(registro._id || registro.id || null);
        setFormMode("edit");
        setFechaRegistro(formatDDMMYYYYToInput(registro.fechaRegistro));
        setRegistroIndex(index);
    };

    const goToPreviousRegistro = () => {
        if (registroIndex <= 0) return;
        loadRegistroSeleccionado(registrosFecha, registroIndex - 1);
    };

    const goToNextRegistro = () => {
        if (registroIndex >= registrosFecha.length - 1) return;
        loadRegistroSeleccionado(registrosFecha, registroIndex + 1);
    };

    const handleNewRegistro = () => {
        const initialRows = createInitialData();

        setRows(initialRows);
        setObservacionesGenerales("");
        setRegistroId(null);
        setFormMode("create");
        setRegistroIndex(0);

        if (fechaConsulta) {
            setFechaRegistro(fechaConsulta);
        }

        localStorage.removeItem(DRAFT_STORAGE_KEY);
    };

    const addRow = () => {
        if (!canEditTable) return;
        setRows((prev) => [...prev, createEmptyRow(prev.length)]);
    };

    const removeLastRow = () => {
        if (!canEditTable || rows.length <= 1) return;
        setRows((prev) => prev.slice(0, -1));
    };

    const clearDraft = () => {
        Swal.fire({
            title: "¿Limpiar formulario?",
            text: "Se borrará el borrador actual del análisis de agua.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, limpiar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (!result.isConfirmed) return;

            localStorage.removeItem(DRAFT_STORAGE_KEY);

            const initial = getInitialDraft();

            setFechaConsulta(initial.fechaConsulta);
            setFechaRegistro(initial.fechaRegistro);
            setRegistroId(null);
            setFormMode("create");
            setRows(initial.rows);
            setObservacionesGenerales(initial.observacionesGenerales || "");
            setRegistrosFecha([]);
            setRegistroIndex(0);
        });
    };

    const buildRowsWithComputedFields = () => rows.map((row) => ({
        ...row,
        cumple: getRowCompliance(row),
        observaciones: getRowObservations(row),
    }));

    const buildPayload = () => ({
        fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
        observaciones: observacionesGenerales || "",
        rows: buildRowsWithComputedFields(),
    });

    const handleSave = async () => {
        if (!canEditTable) {
            Swal.fire("Sin permisos", "No tienes permisos para modificar esta información.", "warning");
            return;
        }

        if (!fechaRegistro) {
            Swal.fire("Fecha requerida", "Selecciona la fecha con la que se guardará el registro.", "warning");
            return;
        }

        try {
            setLoading(true);

            const payload = buildPayload();

            let response;
            const isEditingExistingRecord = formMode === "edit" && Boolean(registroId);

            if (isEditingExistingRecord) {
                response = await axios.patch(`${API_URL}/${registroId}`, payload);
            } else {
                response = await axios.post(API_URL, payload);
            }

            const savedData = response.data?.data;
            const savedId = savedData?._id || response.data?.id || null;

            setRegistroId(savedId);
            setFormMode("edit");
            setRows(Array.isArray(savedData?.rows) ? savedData.rows : payload.rows);
            setObservacionesGenerales(savedData?.observaciones || payload.observaciones || "");
            localStorage.removeItem(DRAFT_STORAGE_KEY);

            if (savedData) {
                setRegistrosFecha((prev) => {
                    const savedFecha = savedData.fechaRegistro || payload.fechaRegistro;
                    const sameDateRecords = prev.filter((item) => item.fechaRegistro === savedFecha);

                    const existingIndex = sameDateRecords.findIndex((item) => {
                        const itemId = item._id || item.id;
                        return itemId === savedId;
                    });

                    if (existingIndex >= 0) {
                        const updatedRecords = sameDateRecords.map((item) => {
                            const itemId = item._id || item.id;
                            return itemId === savedId ? savedData : item;
                        });

                        setRegistroIndex(existingIndex);
                        return updatedRecords;
                    }

                    const updatedRecords = [...sameDateRecords, savedData];
                    setRegistroIndex(updatedRecords.length - 1);
                    return updatedRecords;
                });
            }

            Swal.fire({
                icon: "success",
                title: isEditingExistingRecord ? "Registro actualizado" : "Registro guardado",
                text: `Fecha de registro: ${payload.fechaRegistro}`,
                timer: 1800,
                showConfirmButton: false,
            });

            setOpen(true);
            await refreshFechasDisponibles();
        } catch (error) {
            const message = error.response?.data?.message || "No fue posible guardar la información.";
            Swal.fire("Error al guardar", message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteByDate = async () => {
        if (!fechaConsulta) {
            Swal.fire("Fecha requerida", "Selecciona una fecha para consultar.", "warning");
            return;
        }

        try {
            setLoading(true);

            const fecha = formatDateToDDMMYYYY(fechaConsulta);

            const response = await axios.get(`${API_URL}/by-date`, {
                params: { fecha },
            });

            const data = Array.isArray(response.data?.data)
                ? response.data.data
                : response.data?.data
                    ? [response.data.data]
                    : [];

            setRegistrosFecha(data);
            setRegistroIndex(0);

            if (!data.length) {
                setRows(createInitialData());
                setObservacionesGenerales("");
                setRegistroId(null);
                setFormMode("create");
                setFechaRegistro(fechaConsulta);

                Swal.fire({
                    icon: "info",
                    title: "Sin registros",
                    text: `No hay información guardada para ${fecha}. Puedes crear un nuevo registro.`,
                    timer: 1800,
                    showConfirmButton: false,
                });

                return;
            }

            loadRegistroSeleccionado(data, 0);

            Swal.fire({
                icon: "success",
                title: "Consulta ejecutada",
                text: `Se encontraron ${data.length} registro(s) para ${fecha}.`,
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (error) {
            const message = error.response?.data?.message || "No fue posible consultar la información.";
            Swal.fire("Error al consultar", message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await exportAnalisisRegeneracionResinasExcel({
                rows,
                observaciones: observacionesGenerales || "",
                waterTypes,
                fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
                titulo: encabezado.titulo,
                codigo: encabezado.codigo,
                version: encabezado.version,
                pagina: encabezado.pagina,
            });

            Swal.fire({
                icon: "success",
                title: "Excel generado",
                text: "El archivo se descargó correctamente.",
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Error exportando",
                text: "No fue posible generar el Excel.",
            });
        }
    };

    return (
        <Box sx={{ p: 1.5, mt: 6, bgcolor: "#f3f3f3", minHeight: "88vh" }}>
            <Paper sx={{ mb: 1, px: 1.2, py: 0.8, borderRadius: 2, boxShadow: "0 4px 14px rgba(0,0,0,0.08)", position: "relative" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
                    <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Consulta"
                                value={fechaConsulta ? dayjs(fechaConsulta) : null}
                                onChange={(value) => {
                                    setFechaConsulta(value ? value.format("YYYY-MM-DD") : "");
                                }}
                                shouldDisableDate={(date) => !isFechaDisponible(date)}
                                disabled={loading || fechasDisponibles.length === 0}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: 145 },
                                    },
                                }}
                            />
                        </LocalizationProvider>

                        <Button
                            size="medium"
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleExecuteByDate}
                            disabled={!fechaConsulta || loading}
                        >
                            Ejecutar
                        </Button>

                        {registrosFecha.length > 1 && (
                            <Box
                                sx={{
                                    position: "fixed",
                                    bottom: 20,
                                    right: 25,
                                    zIndex: 9999,
                                    background: "#ffffffee",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid #dcdcdc",
                                    borderRadius: 3,
                                    px: 1,
                                    py: 0.8,
                                    boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
                                }}
                            >
                                <Stack direction="row" spacing={0.7} alignItems="center">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={goToPreviousRegistro}
                                        disabled={registroIndex === 0 || loading}
                                        sx={{
                                            minWidth: 32,
                                            width: 32,
                                            height: 32,
                                            p: 0,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
                                    </Button>

                                    <Chip
                                        size="small"
                                        color="primary"
                                        label={`${registroIndex + 1} / ${registrosFecha.length}`}
                                        sx={{
                                            fontWeight: 700,
                                            minWidth: 58,
                                        }}
                                    />

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={goToNextRegistro}
                                        disabled={registroIndex >= registrosFecha.length - 1 || loading}
                                        sx={{
                                            minWidth: 32,
                                            width: 32,
                                            height: 32,
                                            p: 0,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        <Button
                            size="medium"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addRow}
                            disabled={!canEditTable || loading}
                        >
                            Agregar
                        </Button>

                        <Button
                            size="medium"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={removeLastRow}
                            disabled={!canEditTable || rows.length <= 1 || loading}
                        >
                            Quitar
                        </Button>

                        <Button
                            size="medium"
                            variant="outlined"
                            startIcon={<CleaningServicesIcon />}
                            onClick={clearDraft}
                            disabled={!canEditTable || loading}
                        >
                            Limpiar
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Box
                            sx={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 2,
                            }}
                        >
                            <Chip
                                size="medium"
                                color={formMode === "edit" ? "warning" : "info"}
                                label={formMode === "edit" ? "Modo: actualizar" : "Modo: nuevo"}
                                sx={{
                                    fontWeight: 800,
                                    fontSize: 13,
                                    px: 1.5,
                                }}
                            />
                        </Box>

                        <TextField
                            label="Registro"
                            type="date"
                            size="small"
                            value={fechaRegistro}
                            disabled={!canEditTable || loading}
                            onChange={(event) => {
                                setFechaRegistro(event.target.value);

                                if (formMode === "create") {
                                    setRegistroId(null);
                                }
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 145 }}
                        />

                        <Button
                            size="medium"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={!canEditTable || loading}
                        >
                            {formMode === "edit" ? "Actualizar" : "Guardar"}
                        </Button>

                        <Button
                            size="medium"
                            variant="outlined"
                            color="secondary"
                            startIcon={<NoteAddIcon />}
                            onClick={handleNewRegistro}
                            disabled={!canEditTable || loading}
                        >
                            Nuevo registro
                        </Button>

                        <Button
                            size="medium"
                            variant="contained"
                            color="success"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                            disabled={loading}
                        >
                            Excel
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <AnalysisTable
                rows={rows}
                setRows={setRows}
                encabezado={encabezado}
                observacionesGenerales={observacionesGenerales}
                setObservacionesGenerales={setObservacionesGenerales}
                canEditTable={canEditTable}
            />

            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert variant="filled" severity="success" onClose={() => setOpen(false)}>
                    Data guardada correctamente.
                </Alert>
            </Snackbar>

            <style>{`
                .excelWaterTable {
                    border-collapse: collapse;
                    width: 100%;
                    min-width: 1680px;
                    background: #fff;
                    table-layout: fixed;
                    font-family: Arial, sans-serif;
                }
            `}</style>
        </Box>
    );
}