import React, { useEffect, useState } from "react";
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
    TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Swal from "sweetalert2";

import { exportTrazabilidadRegistroLoteProduccionExcel  } from "./utils_laboratorio/exportTrazabilidadRegistroLoteProduccionExcel";

const API_URL = "https://ambiocomserver.onrender.com/api/trazabilidad-laboratorio-lote-produccion";
const DRAFT_STORAGE_KEY = "trazabilidad_lote_produccion_draft";

const EDIT_ALLOWED_ROLES = ["laboratorio", "developer"];

const TAB_KEYS = ["intermedios", "terminado", "despachos"];

const tanqueColumns = [
    { key: "codigoMuestra", label: "CODIGO DE\nMUESTRA", width: 105 },
    { key: "muestra", label: "MUESTRA", width: 95 },
    { key: "ga", label: "G.A % v/v", limit: "> 96% V/V", width: 90 },
    { key: "acetaldehido", label: "ACETALDEHIDO", limit: "< 2 ppm", width: 115 },
    { key: "metanol", label: "METANOL", limit: "Max 50\nppm", width: 85 },
    { key: "isopropanol", label: "ISOPROPANOL", width: 105 },
    { key: "propanol", label: "PROPANOL", width: 95 },
    { key: "ipaPropanol", label: "IPA +\nPROPANOL", limit: "Max 5.0 ppm", width: 90 },
    { key: "alcoholSup", label: "ALCOHOL\nSUP >3 C", limit: "0", width: 78 },
    { key: "esteres", label: "ESTERES", limit: "Max 25\nppm", width: 82 },
    { key: "acidez", label: "ACIDEZ", limit: "Max 10\nppm", width: 78 },
    { key: "totalCongeneres", label: "TOTAL\nCONGENERES", limit: "Max 35 ppm", width: 110 },
    { key: "color", label: "COLOR", width: 65 },
    { key: "olor", label: "OLOR", width: 65 },
    { key: "sabor", label: "SABOR", width: 70 },
    { key: "analista", label: "ANALISTA", width: 220 },
];

const despachosColumns = [
    { key: "fecha", label: "FECHA", width: 180 },
    { key: "cliente", label: "CLIENTE", width: 190 },
    { key: "placa", label: "PLACA", width: 160 },
    { key: "cantidad", label: "CANTIDAD", width: 165 },
    { key: "certificado", label: "No. DE CERTIFICADO", width: 130 },
    { key: "observaciones", label: "OBSERVACIONES", width: 130 },
];

const cellStyle = {
    border: "1px solid #000",
    padding: 0,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 10,
    height: 25,
    whiteSpace: "pre-line",
    lineHeight: 1.05,
    fontFamily: "Arial, sans-serif",
};

const grayCell = {
    ...cellStyle,
    background: "#d9d9d9",
    fontWeight: 800,
};

const sectionHeader = {
    ...cellStyle,
    background: "#d9d9d9",
    fontWeight: 900,
    fontSize: 18,
    height: 27,
};

const yellowLine = {
    ...cellStyle,
    background: "#ffff00",
    height: 6,
    borderTop: "1px solid #000",
    borderBottom: "1px solid #000",
};

function createRows(columns, amount = 3) {
    return Array.from({ length: amount }, () =>
        columns.reduce((acc, column) => {
            acc[column.key] = "";
            return acc;
        }, {})
    );
}

function createInitialComentarios() {
    return {
        intermedios: "",
        terminado: "",
        despachos: "",
    };
}

function createInitialMeta() {
    return {
        intermedios: {
            registroId: null,
            formMode: "create",
            registrosFecha: [],
            registroIndex: 0,
        },
        terminado: {
            registroId: null,
            formMode: "create",
            registrosFecha: [],
            registroIndex: 0,
        },
        despachos: {
            registroId: null,
            formMode: "create",
            registrosFecha: [],
            registroIndex: 0,
        },
    };
}

function getInitialDraft() {
    return {
        activeTab: 0,
        comentarios: createInitialComentarios(),
        meta: createInitialMeta(),
        fechaConsulta: "",
        fechaRegistro: "",
        intermedios: {
            tanque: "402",
            loteA: "",
            loteB: "",
            rows: createRows(tanqueColumns, 3),
            estadoConforme: "",
            estadoNoConforme: "",
            destino: "",
            analista: "",
            observaciones: "",
        },
        terminado: {
            tanque: "801",
            loteA: "",
            loteB: "",
            rows: createRows(tanqueColumns, 3),
            loteGenerado: "",
            estado: "",
            estadoSi: "",
            estadoNo: "",
            jefeLaboratorio: "",
            observaciones: "",
        },
        despachos: {
            rows: createRows(despachosColumns, 8),
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

function EditableInput({ value, onChange, disabled, fontSize = 10, align = "center" }) {
    return (
        <TextField
            value={value || ""}
            disabled={disabled}
            onChange={onChange}
            variant="standard"
            fullWidth
            multiline
            InputProps={{ disableUnderline: true }}
            sx={{
                "& .MuiInputBase-root": {
                    minHeight: 23,
                    background: disabled ? "#f5f5f5" : "#fff",
                    cursor: disabled ? "not-allowed" : "text",
                },
                "& .MuiInputBase-input": {
                    textAlign: align,
                    fontSize,
                    padding: "2px 3px",
                    lineHeight: 1.08,
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "text",
                },
                "& .Mui-disabled": {
                    WebkitTextFillColor: "#000",
                },
            }}
        />
    );
}

function FormHeader({ pageLabel, comentario, setComentario, canEditTable, loading }) {
    return (
        <>
            <tr>
                <td colSpan={4} rowSpan={5} style={{ ...cellStyle, height: 142 }}>
                    <img
                        src="/LogoCompany/logoambiocomsinfondo.png"
                        alt="logo"
                        style={{ width: 245, height: 80, objectFit: "contain" }}
                    />
                </td>

                <td colSpan={12} rowSpan={5} style={{ ...cellStyle, fontWeight: 900, fontSize: 27 }}>
                    TRAZABILIDAD DE LOTE DE PRODUCCION
                </td>

                <td colSpan={2} style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}>
                    Código: 4-LAB-032
                </td>
            </tr>

            <tr>
                <td colSpan={2} style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}>
                    Versión: 3
                </td>
            </tr>

            <tr>
                <td colSpan={2} style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}>
                    Fecha de emisión
                </td>
            </tr>

            <tr>
                <td colSpan={2} style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}>
                    12-may-26
                </td>
            </tr>

            <tr>
                <td colSpan={2} style={{ ...cellStyle, fontWeight: 900, fontSize: 16 }}>
                    {pageLabel}
                </td>
            </tr>

            <tr>
                <td colSpan={18} style={{ ...cellStyle, height: 10 }} />
            </tr>

            <tr>
                <td colSpan={4} style={grayCell}>
                    COMENTARIO
                </td>

                <td colSpan={14} style={cellStyle}>
                    <TextField
                        value={comentario}
                        disabled={!canEditTable || loading}
                        onChange={(event) => setComentario(event.target.value)}
                        variant="standard"
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={3}
                        placeholder="Digite el comentario de esta pestaña..."
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            "& .MuiInputBase-root": {
                                minHeight: 32,
                                backgroundColor: "#fff",
                                px: 1,
                            },
                            "& .MuiInputBase-input": {
                                textAlign: "left",
                                fontSize: 12,
                                fontWeight: 600,
                                lineHeight: 1.25,
                            },
                        }}
                    />
                </td>
            </tr>

            <tr>
                <td colSpan={18} style={{ ...cellStyle, height: 24 }} />
            </tr>
        </>
    );
}

function AnalisisTanqueTable({
    title,
    pageLabel,
    data,
    setData,
    canEditTable,
    loading,
    comentario,
    setComentario,
    terminado = false,
}) {
    const updateField = (key, value) => {
        if (!canEditTable) return;
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateRowCell = (rowIndex, key, value) => {
        if (!canEditTable) return;

        setData((prev) => {
            const rows = [...prev.rows];

            rows[rowIndex] = {
                ...rows[rowIndex],
                [key]: value,
            };

            return {
                ...prev,
                rows,
            };
        });
    };

    return (
        <Paper sx={{ overflow: "auto", p: 0 }}>
            <table className="excelTable">
                <colgroup>
                    {tanqueColumns.map((column) => (
                        <col key={column.key} style={{ width: column.width }} />
                    ))}
                    <col style={{ width: 110 }} />
                    <col style={{ width: 110 }} />
                </colgroup>

                <tbody>
                    <FormHeader
                        pageLabel={pageLabel}
                        comentario={comentario}
                        setComentario={setComentario}
                        canEditTable={canEditTable}
                        loading={loading}
                    />

                    <tr>
                        <td colSpan={18} style={sectionHeader}>
                            {title}
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={18} style={{ ...cellStyle, height: 50, borderLeft: "none", borderRight: "none" }} />
                    </tr>

                    <tr>
                        <td colSpan={3} style={{ ...grayCell, fontSize: 18 }}>
                            ANALISIS DEL TANQUE
                        </td>

                        <td style={{ ...grayCell, fontSize: 18 }}>
                            <EditableInput
                                value={data.tanque}
                                disabled={!canEditTable}
                                fontSize={16}
                                onChange={(event) => updateField("tanque", event.target.value)}
                            />
                        </td>

                        <td style={{ ...grayCell, fontSize: 18 }}>
                            <EditableInput
                                value={data.loteA}
                                disabled={!canEditTable}
                                fontSize={16}
                                onChange={(event) => updateField("loteA", event.target.value)}
                            />
                        </td>

                        <td style={cellStyle} />

                        <td style={{ ...grayCell, fontSize: 18 }}>
                            <EditableInput
                                value={data.loteB}
                                disabled={!canEditTable}
                                fontSize={16}
                                onChange={(event) => updateField("loteB", event.target.value)}
                            />
                        </td>

                        <td colSpan={11} style={cellStyle} />
                    </tr>

                    <tr>
                        {tanqueColumns.slice(0, 12).map((column) => (
                            <td key={column.key} style={{ ...grayCell, fontSize: 13 }}>
                                {column.label}
                            </td>
                        ))}

                        <td colSpan={3} style={{ ...grayCell, fontSize: 13 }}>
                            ORGANOLEPTICO
                        </td>

                        <td rowSpan={2} style={{ ...grayCell, fontSize: 13 }}>
                            ANALISTA
                        </td>

                        <td rowSpan={2} colSpan={2} style={cellStyle} />
                    </tr>

                    <tr>
                        {tanqueColumns.slice(0, 12).map((column) => (
                            <td key={`limit-${column.key}`} style={{ ...grayCell, fontSize: 13 }}>
                                {column.limit || ""}
                            </td>
                        ))}

                        <td style={{ ...grayCell, fontSize: 13 }}>COLOR</td>
                        <td style={{ ...grayCell, fontSize: 13 }}>OLOR</td>
                        <td style={{ ...grayCell, fontSize: 13 }}>SABOR</td>
                    </tr>

                    {data.rows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                            {tanqueColumns.map((column) => (
                                <td key={`${rowIndex}-${column.key}`} style={cellStyle}>
                                    <EditableInput
                                        value={row[column.key]}
                                        disabled={!canEditTable}
                                        onChange={(event) =>
                                            updateRowCell(rowIndex, column.key, event.target.value)
                                        }
                                    />
                                </td>
                            ))}
                            <td colSpan={2} style={cellStyle} />
                        </tr>
                    ))}

                    {terminado ? (
                        <>
                            <tr>
                                <td colSpan={8} style={cellStyle} />

                                <td colSpan={10} rowSpan={2} style={{ ...cellStyle, textAlign: "left", padding: 4 }}>
                                    <Box sx={{ fontWeight: 900, mb: 0.5 }}>OBSERVACIONES:</Box>
                                    <EditableInput
                                        value={data.observaciones}
                                        disabled={!canEditTable}
                                        align="left"
                                        onChange={(event) => updateField("observaciones", event.target.value)}
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td colSpan={8} style={cellStyle} />
                            </tr>

                            <tr>
                                <td colSpan={2} style={{ ...grayCell, fontSize: 16 }}>
                                    LOTE&nbsp;&nbsp;GENERADO
                                </td>
                                <td colSpan={4} style={cellStyle}>
                                    <EditableInput
                                        value={data.loteGenerado}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("loteGenerado", event.target.value)}
                                    />
                                </td>

                                <td colSpan={2} style={cellStyle} />

                                <td style={{ ...grayCell, fontSize: 16 }}>ESTADO</td>
                                <td colSpan={2} style={cellStyle}>
                                    <EditableInput
                                        value={data.estado}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("estado", event.target.value)}
                                    />
                                </td>

                                <td style={{ ...grayCell, fontSize: 16 }}>SI</td>
                                <td style={cellStyle}>
                                    <EditableInput
                                        value={data.estadoSi}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("estadoSi", event.target.value)}
                                    />
                                </td>

                                <td style={{ ...grayCell, fontSize: 16 }}>NO</td>
                                <td style={cellStyle}>
                                    <EditableInput
                                        value={data.estadoNo}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("estadoNo", event.target.value)}
                                    />
                                </td>

                                <td colSpan={3} style={cellStyle} />
                            </tr>

                            <tr>
                                <td colSpan={18} style={{ ...cellStyle, height: 24 }} />
                            </tr>

                            <tr>
                                <td colSpan={2} style={{ ...grayCell, fontSize: 15 }}>
                                    JEFE DE LABORATORIO
                                </td>
                                <td colSpan={6} style={cellStyle}>
                                    <EditableInput
                                        value={data.jefeLaboratorio}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("jefeLaboratorio", event.target.value)}
                                    />
                                </td>
                                <td colSpan={10} style={cellStyle} />
                            </tr>
                        </>
                    ) : (
                        <>
                            <tr>
                                <td style={{ ...grayCell, fontSize: 13 }}>ESTADO</td>
                                <td style={{ ...grayCell, fontSize: 13 }}>CONFORME</td>
                                <td style={cellStyle}>
                                    <EditableInput
                                        value={data.estadoConforme}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("estadoConforme", event.target.value)}
                                    />
                                </td>

                                <td colSpan={2} style={{ ...grayCell, fontSize: 13 }}>
                                    NO CONFORME
                                </td>

                                <td colSpan={3} style={cellStyle}>
                                    <EditableInput
                                        value={data.estadoNoConforme}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("estadoNoConforme", event.target.value)}
                                    />
                                </td>

                                <td colSpan={5} style={cellStyle} />

                                <td colSpan={5} rowSpan={2} style={{ ...cellStyle, textAlign: "left", padding: 4 }}>
                                    <Box sx={{ fontWeight: 900, mb: 0.5 }}>OBSERVACIONES:</Box>
                                    <EditableInput
                                        value={data.observaciones}
                                        disabled={!canEditTable}
                                        align="left"
                                        onChange={(event) => updateField("observaciones", event.target.value)}
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td style={{ ...grayCell, fontSize: 13 }}>DESTINO:</td>
                                <td colSpan={2} style={cellStyle}>
                                    <EditableInput
                                        value={data.destino}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("destino", event.target.value)}
                                    />
                                </td>

                                <td colSpan={2} style={{ ...grayCell, fontSize: 13 }}>ANALISTA</td>
                                <td colSpan={3} style={cellStyle}>
                                    <EditableInput
                                        value={data.analista}
                                        disabled={!canEditTable}
                                        onChange={(event) => updateField("analista", event.target.value)}
                                    />
                                </td>

                                <td colSpan={5} style={cellStyle} />
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </Paper>
    );
}

function DespachosTable({ data, setData, canEditTable, loading, comentario, setComentario }) {
    const updateRowCell = (rowIndex, key, value) => {
        if (!canEditTable) return;

        setData((prev) => {
            const rows = [...prev.rows];

            rows[rowIndex] = {
                ...rows[rowIndex],
                [key]: value,
            };

            return {
                ...prev,
                rows,
            };
        });
    };

    const despachoColSpans = {
        fecha: 3,
        cliente: 3,
        placa: 3,
        cantidad: 3,
        certificado: 2,
        observaciones: 4,
    };

    return (
        <Paper sx={{ overflow: "auto", p: 0 }}>
            <table className="excelTable">
                <colgroup>
                    {Array.from({ length: 18 }, (_, index) => (
                        <col key={index} style={{ width: 90 }} />
                    ))}
                </colgroup>

                <tbody>
                    <FormHeader
                        pageLabel="PAG 3-3"
                        comentario={comentario}
                        setComentario={setComentario}
                        canEditTable={canEditTable}
                        loading={loading}
                    />

                    <tr>
                        <td colSpan={18} style={yellowLine} />
                    </tr>

                    <tr>
                        <td
                            colSpan={18}
                            style={{
                                ...cellStyle,
                                fontWeight: 900,
                                fontSize: 18,
                                textAlign: "left",
                                height: 32,
                                paddingLeft: 10,
                            }}
                        >
                            DESPACHOS
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={18} style={{ ...cellStyle, height: 24 }} />
                    </tr>

                    <tr>
                        {despachosColumns.map((column) => (
                            <td
                                key={column.key}
                                colSpan={despachoColSpans[column.key]}
                                style={{
                                    ...grayCell,
                                    fontSize: 15,
                                }}
                            >
                                {column.label}
                            </td>
                        ))}
                    </tr>

                    {data.rows.map((row, rowIndex) => (
                        <tr key={`despacho-${rowIndex}`}>
                            {despachosColumns.map((column) => (
                                <td
                                    key={`${rowIndex}-${column.key}`}
                                    colSpan={despachoColSpans[column.key]}
                                    style={{
                                        ...cellStyle,
                                        height: 28,
                                    }}
                                >
                                    <EditableInput
                                        value={row[column.key]}
                                        disabled={!canEditTable}
                                        onChange={(event) =>
                                            updateRowCell(rowIndex, column.key, event.target.value)
                                        }
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Paper>
    );
}

export default function TrazabilidadLoteProduccion() {
    const draft = getDraftData();

    // const { rol } = useAuth();
    // const canEditTable = EDIT_ALLOWED_ROLES.includes(rol);
    const canEditTable = true;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState(draft.activeTab || 0);
    const [comentarios, setComentarios] = useState(
        draft.comentarios || createInitialComentarios()
    );

    const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
    const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");

    const [meta, setMeta] = useState(draft.meta || createInitialMeta());

    const [intermedios, setIntermedios] = useState(
        draft.intermedios || getInitialDraft().intermedios
    );
    const [terminado, setTerminado] = useState(
        draft.terminado || getInitialDraft().terminado
    );
    const [despachos, setDespachos] = useState(
        draft.despachos || getInitialDraft().despachos
    );

    const [fechasDisponibles, setFechasDisponibles] = useState([]);

    const activeKey = TAB_KEYS[activeTab];
    const activeMeta = meta[activeKey] || createInitialMeta()[activeKey];

    const updateComentario = (key, value) => {
        setComentarios((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateMeta = (key, patch) => {
        setMeta((prev) => ({
            ...prev,
            [key]: {
                ...(prev[key] || createInitialMeta()[key]),
                ...patch,
            },
        }));
    };

    const getDataByKey = (key) => {
        if (key === "intermedios") return intermedios;
        if (key === "terminado") return terminado;
        return despachos;
    };

    const setDataByKey = (key, value) => {
        if (key === "intermedios") setIntermedios(value);
        if (key === "terminado") setTerminado(value);
        if (key === "despachos") setDespachos(value);
    };

    const getInitialDataByKey = (key) => {
        const initial = getInitialDraft();
        return initial[key];
    };

    const refreshFechasDisponibles = async (key = activeKey) => {
        try {
            const response = await axios.get(`${API_URL}/fechas`, {
                params: { tipoPestana: key },
            });

            setFechasDisponibles(response.data?.fechas || []);
        } catch (error) {
            console.error("Error actualizando fechas disponibles:", error);
        }
    };

    useEffect(() => {
        refreshFechasDisponibles(activeKey);
    }, [activeKey]);

    const isFechaDisponible = (date) => {
        if (!date || fechasDisponibles.length === 0) return false;
        return fechasDisponibles.includes(date.format("DD-MM-YYYY"));
    };

    useEffect(() => {
        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
                activeTab,
                comentarios,
                fechaConsulta,
                fechaRegistro,
                meta,
                intermedios,
                terminado,
                despachos,
                updatedAt: new Date().toISOString(),
            })
        );
    }, [
        activeTab,
        comentarios,
        fechaConsulta,
        fechaRegistro,
        meta,
        intermedios,
        terminado,
        despachos,
    ]);

    const buildPayload = () => ({
        formato: "4-LAB-032",
        version: "3",
        tabla: "Trazabilidad de lote de producción",
        fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
        fechaGuardado: new Date().toISOString(),
        tipoPestana: activeKey,
        comentario: comentarios[activeKey] || "",
        data: getDataByKey(activeKey),
    });

    const loadRegistroSeleccionado = (records, index, key = activeKey) => {
        const registro = records[index];
        if (!registro) return;

        updateMeta(key, {
            registroId: registro._id || registro.id || null,
            formMode: "edit",
            registrosFecha: records,
            registroIndex: index,
        });

        setFechaRegistro(formatDDMMYYYYToInput(registro.fechaRegistro));

        setComentarios((prev) => ({
            ...prev,
            [key]: registro.comentario || "",
        }));

        setDataByKey(key, registro.data || getInitialDataByKey(key));
    };

    const goToPreviousRegistro = () => {
        if (activeMeta.registroIndex <= 0) return;
        loadRegistroSeleccionado(
            activeMeta.registrosFecha,
            activeMeta.registroIndex - 1,
            activeKey
        );
    };

    const goToNextRegistro = () => {
        if (activeMeta.registroIndex >= activeMeta.registrosFecha.length - 1) return;
        loadRegistroSeleccionado(
            activeMeta.registrosFecha,
            activeMeta.registroIndex + 1,
            activeKey
        );
    };

    const handleNewRegistro = () => {
        updateMeta(activeKey, {
            registroId: null,
            formMode: "create",
            registroIndex: 0,
        });

        setComentarios((prev) => ({
            ...prev,
            [activeKey]: "",
        }));

        setDataByKey(activeKey, getInitialDataByKey(activeKey));

        if (fechaConsulta) {
            setFechaRegistro(fechaConsulta);
        }

        localStorage.removeItem(DRAFT_STORAGE_KEY);
    };

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
            const isEditingExistingRecord =
                activeMeta.formMode === "edit" && Boolean(activeMeta.registroId);

            const response = isEditingExistingRecord
                ? await axios.patch(`${API_URL}/${activeMeta.registroId}`, payload)
                : await axios.post(API_URL, payload);

            const savedData = response.data?.data || payload;
            const savedId = savedData?._id || savedData?.id || response.data?.id || null;

            const prevRecords = activeMeta.registrosFecha || [];
            const savedFecha = savedData.fechaRegistro || payload.fechaRegistro;

            const sameDateRecords = prevRecords.filter(
                (item) => item.fechaRegistro === savedFecha && item.tipoPestana === activeKey
            );

            const existingIndex = sameDateRecords.findIndex((item) => {
                const itemId = item._id || item.id;
                return itemId === savedId;
            });

            let updatedRecords = [];

            if (existingIndex >= 0) {
                updatedRecords = sameDateRecords.map((item) => {
                    const itemId = item._id || item.id;
                    return itemId === savedId ? savedData : item;
                });
            } else {
                updatedRecords = [...sameDateRecords, savedData];
            }

            const newIndex =
                existingIndex >= 0 ? existingIndex : updatedRecords.length - 1;

            updateMeta(activeKey, {
                registroId: savedId,
                formMode: "edit",
                registrosFecha: updatedRecords,
                registroIndex: newIndex,
            });

            localStorage.removeItem(DRAFT_STORAGE_KEY);

            Swal.fire({
                icon: "success",
                title: isEditingExistingRecord ? "Registro actualizado" : "Registro guardado",
                text: `Fecha de registro: ${payload.fechaRegistro}`,
                timer: 1800,
                showConfirmButton: false,
            });

            setOpen(true);
            await refreshFechasDisponibles(activeKey);
        } catch (error) {
            Swal.fire(
                "Error al guardar",
                error.response?.data?.message || error.message || "No fue posible guardar.",
                "error"
            );
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
                params: {
                    fecha,
                    tipoPestana: activeKey,
                },
            });

            const records = Array.isArray(response.data?.data)
                ? response.data.data
                : response.data?.data
                    ? [response.data.data]
                    : [];

            updateMeta(activeKey, {
                registrosFecha: records,
                registroIndex: 0,
            });

            if (!records.length) {
                updateMeta(activeKey, {
                    registroId: null,
                    formMode: "create",
                });

                setFechaRegistro(fechaConsulta);
                setComentarios((prev) => ({
                    ...prev,
                    [activeKey]: "",
                }));
                setDataByKey(activeKey, getInitialDataByKey(activeKey));

                Swal.fire({
                    icon: "info",
                    title: "Sin registros",
                    text: `No hay información guardada para ${fecha} en esta pestaña. Puedes crear un nuevo registro.`,
                    timer: 1800,
                    showConfirmButton: false,
                });

                return;
            }

            loadRegistroSeleccionado(records, 0, activeKey);

            Swal.fire({
                icon: "success",
                title: "Consulta ejecutada",
                text: `Se encontraron ${records.length} registro(s) para ${fecha} en esta pestaña.`,
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire(
                "Error al consultar",
                error.response?.data?.message || error.message || "No fue posible consultar la información.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        exportTrazabilidadRegistroLoteProduccionExcel  ({
            intermedios,
            terminado,
            despachos,
            comentarios,
            fechaRegistro,
        });
    };

    const tabs = [
        "Tanques intermedios de final",
        "Producto terminado",
        "Despachos",
    ];

    return (
        <Box sx={{ p: 1, mt: 6, bgcolor: "#f3f3f3", minHeight: "92vh" }}>
            <Box
                sx={{
                    mb: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Fecha consulta"
                            value={fechaConsulta ? dayjs(fechaConsulta) : null}
                            onChange={(value) => {
                                setFechaConsulta(value ? value.format("YYYY-MM-DD") : "");
                            }}
                            shouldDisableDate={(date) => !isFechaDisponible(date)}
                            disabled={loading || fechasDisponibles.length === 0}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: { width: 155 },
                                },
                            }}
                        />
                    </LocalizationProvider>

                    <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={handleExecuteByDate}
                        disabled={!fechaConsulta || loading}
                    >
                        Ejecutar
                    </Button>

                    {activeMeta.registrosFecha.length > 1 && (
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={goToPreviousRegistro}
                                    disabled={activeMeta.registroIndex === 0 || loading}
                                    sx={{ minWidth: 32, width: 32, height: 32, p: 0, borderRadius: 2 }}
                                >
                                    <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
                                </Button>

                                <Chip
                                    size="small"
                                    color="primary"
                                    label={`${activeMeta.registroIndex + 1} / ${activeMeta.registrosFecha.length}`}
                                    sx={{ fontWeight: 700, minWidth: 58 }}
                                />

                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={goToNextRegistro}
                                    disabled={
                                        activeMeta.registroIndex >= activeMeta.registrosFecha.length - 1 || loading
                                    }
                                    sx={{ minWidth: 32, width: 32, height: 32, p: 0, borderRadius: 2 }}
                                >
                                    <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={loading}
                    >
                        Exportar Excel
                    </Button>

                    <TextField
                        label="Fecha registro"
                        type="date"
                        size="small"
                        value={fechaRegistro}
                        disabled={!canEditTable || loading}
                        onChange={(event) => setFechaRegistro(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<NoteAddIcon />}
                        onClick={handleNewRegistro}
                        disabled={!canEditTable || loading}
                    >
                        Nuevo registro
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!canEditTable || loading}
                    >
                        {activeMeta.formMode === "edit" && activeMeta.registroId
                            ? "Actualizar data"
                            : "Guardar data"}
                    </Button>
                </Box>
            </Box>

            {activeTab === 0 && (
                <AnalisisTanqueTable
                    title="ANÁLISIS DE PRODUCTO EN TANQUES INTERMEDIOS DE FINAL"
                    pageLabel="PAG 3-3"
                    data={intermedios}
                    setData={setIntermedios}
                    canEditTable={canEditTable}
                    loading={loading}
                    comentario={comentarios.intermedios}
                    setComentario={(value) => updateComentario("intermedios", value)}
                />
            )}

            {activeTab === 1 && (
                <AnalisisTanqueTable
                    title="ANÁLISIS DE ALCOHOL EN TANQUES DE PRODUCTO TERMINADO"
                    pageLabel="PAG 1-1"
                    data={terminado}
                    setData={setTerminado}
                    canEditTable={canEditTable}
                    loading={loading}
                    comentario={comentarios.terminado}
                    setComentario={(value) => updateComentario("terminado", value)}
                    terminado
                />
            )}

            {activeTab === 2 && (
                <DespachosTable
                    data={despachos}
                    setData={setDespachos}
                    canEditTable={canEditTable}
                    loading={loading}
                    comentario={comentarios.despachos}
                    setComentario={(value) => updateComentario("despachos", value)}
                />
            )}

            <Box
                sx={{
                    mt: 0.2,
                    px: 1,
                    py: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "#e9edf2",
                    borderTop: "1px solid #b8c2cc",
                    borderLeft: "1px solid #c7d0d9",
                    borderRight: "1px solid #c7d0d9",
                    borderBottom: "1px solid #aab4bf",
                    borderRadius: "0 0 6px 6px",
                    width: "fit-content",
                    minWidth: "100%",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
            >
                {tabs.map((tab, index) => (
                    <Button
                        key={tab}
                        onClick={() => setActiveTab(index)}
                        sx={{
                            minWidth: index === 2 ? 150 : 260,
                            height: 34,
                            fontWeight: 800,
                            fontSize: 12,
                            textTransform: "none",
                            borderRadius: "6px 6px 0 0",
                            border: "1px solid #aeb7c2",
                            borderBottom: activeTab === index ? "2px solid #fff" : "1px solid #aeb7c2",
                            bgcolor: activeTab === index ? "#ffffff" : "#dfe5eb",
                            color: activeTab === index ? "#0d47a1" : "#455a64",
                            boxShadow: activeTab === index ? "0 -1px 4px rgba(0,0,0,0.08)" : "none",
                            "&:hover": {
                                bgcolor: activeTab === index ? "#ffffff" : "#d5dde5",
                            },
                        }}
                    >
                        {tab}
                    </Button>
                ))}
            </Box>

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
        .excelTable {
          border-collapse: collapse;
          width: 100%;
          min-width: 1600px;
          background: #fff;
          table-layout: fixed;
          font-family: Arial, sans-serif;
        }
      `}</style>
        </Box>
    );
}