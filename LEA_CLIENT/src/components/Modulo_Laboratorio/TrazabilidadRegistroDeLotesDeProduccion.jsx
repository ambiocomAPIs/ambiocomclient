import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Paper,
    Snackbar,
    TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import Swal from "sweetalert2";

const API_URL = "https://ambiocomserver.onrender.com/api/trazabilidad-laboratorio-lote-produccion";

const STORAGE_KEY = "trazabilidad_lote_produccion";
const DRAFT_STORAGE_KEY = "trazabilidad_lote_produccion_draft";

const EDIT_ALLOWED_ROLES = ["laboratorio", "developer"];

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

function getInitialDraft() {
    return {
        activeTab: 0,
        fechaConsulta: "",
        fechaRegistro: "",
        registroId: null,
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
                    background: "#fff",
                },
                "& .MuiInputBase-input": {
                    textAlign: align,
                    fontSize,
                    padding: "2px 3px",
                    lineHeight: 1.08,
                    fontWeight: 600,
                },
            }}
        />
    );
}

function FormHeader({ pageLabel }) {
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
                    <FormHeader pageLabel={pageLabel} />

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
                                <td colSpan={2} style={{ ...grayCell, fontSize: 16 }}>LOTE&nbsp;&nbsp;GENERADO</td>
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

                                <td colSpan={2} style={{ ...grayCell, fontSize: 13 }}>NO CONFORME</td>

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

function DespachosTable({ data, setData, canEditTable }) {
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
                    <FormHeader pageLabel="PAG 3-3" />

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
                                            updateRowCell(
                                                rowIndex,
                                                column.key,
                                                event.target.value
                                            )
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
    const [activeTab, setActiveTab] = useState(draft.activeTab || 0);
    const [fechaConsulta, setFechaConsulta] = useState(draft.fechaConsulta || "");
    const [fechaRegistro, setFechaRegistro] = useState(draft.fechaRegistro || "");
    const [registroId, setRegistroId] = useState(draft.registroId || null);

    const [intermedios, setIntermedios] = useState(draft.intermedios || getInitialDraft().intermedios);
    const [terminado, setTerminado] = useState(draft.terminado || getInitialDraft().terminado);
    const [despachos, setDespachos] = useState(draft.despachos || getInitialDraft().despachos);

    useEffect(() => {
        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
                activeTab,
                fechaConsulta,
                fechaRegistro,
                registroId,
                intermedios,
                terminado,
                despachos,
                updatedAt: new Date().toISOString(),
            })
        );
    }, [activeTab, fechaConsulta, fechaRegistro, registroId, intermedios, terminado, despachos]);

    const buildPayload = () => ({
        id: registroId,
        formato: "4-LAB-032",
        version: "3",
        fechaRegistro: formatDateToDDMMYYYY(fechaRegistro),
        fechaGuardado: new Date().toISOString(),
        intermedios,
        terminado,
        despachos,
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
            const payload = buildPayload();

            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            localStorage.removeItem(DRAFT_STORAGE_KEY);

            Swal.fire({
                icon: "success",
                title: registroId ? "Registro actualizado" : "Registro guardado",
                text: `Fecha de registro: ${payload.fechaRegistro}`,
                timer: 1800,
                showConfirmButton: false,
            });

            setOpen(true);
        } catch (error) {
            Swal.fire("Error al guardar", error.message || "No fue posible guardar.", "error");
        }
    };

    const handleExecuteByDate = async () => {
        if (!fechaConsulta) {
            Swal.fire("Fecha requerida", "Selecciona una fecha para consultar.", "warning");
            return;
        }

        Swal.fire({
            icon: "info",
            title: "Consulta pendiente",
            text: "El consumo al backend queda pendiente de conectar.",
            timer: 1800,
            showConfirmButton: false,
        });
    };

    const handleExport = () => {
        Swal.fire({
            icon: "info",
            title: "Exportación pendiente",
            text: "La función de exportar Excel queda pendiente de conectar.",
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
                    <TextField
                        label="Fecha consulta"
                        type="date"
                        size="small"
                        value={fechaConsulta}
                        onChange={(event) => setFechaConsulta(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={handleExecuteByDate}
                        disabled={!fechaConsulta}
                    >
                        Ejecutar
                    </Button>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="contained" color="success" startIcon={<DownloadIcon />} onClick={handleExport}>
                        Exportar Excel
                    </Button>

                    <TextField
                        label="Fecha registro"
                        type="date"
                        size="small"
                        value={fechaRegistro}
                        disabled={!canEditTable}
                        onChange={(event) => setFechaRegistro(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!canEditTable}>
                        {registroId ? "Actualizar data" : "Guardar data"}
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
                />
            )}

            {activeTab === 1 && (
                <AnalisisTanqueTable
                    title="ANÁLISIS DE ALCOHOL EN TANQUES DE PRODUCTO TERMINADO"
                    pageLabel="PAG 1-1"
                    data={terminado}
                    setData={setTerminado}
                    canEditTable={canEditTable}
                    terminado
                />
            )}

            {activeTab === 2 && (
                <DespachosTable
                    data={despachos}
                    setData={setDespachos}
                    canEditTable={canEditTable}
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