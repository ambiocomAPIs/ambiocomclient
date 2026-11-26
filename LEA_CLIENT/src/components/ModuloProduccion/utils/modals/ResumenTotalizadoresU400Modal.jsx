
import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Table,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TableContainer,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";

const MARINO = "#0b376d";
const AZUL = "#245ea8";
const BORDE = "#dbe3ef";

const COLUMNAS = [
  {
    key: "renConsumo",
    titulo: "Materia prima consumida",
    subtitulo: "Flujómetro totalizador REN",
    bg: "#e2ecf9",
    color: "#24548a",
    width: 175,
  },
  {
    key: "tanques",
    titulo: "Tanques REN",
    subtitulo: "Tanques registrados",
    bg: "#ebe5f4",
    color: "#69518c",
    width: 140,
  },
  {
    key: "renNivelTotal",
    titulo: "Consumo REN",
    subtitulo: "Diferencia de niveles",
    bg: "#ebe5f4",
    color: "#69518c",
    width: 155,
  },
  {
    key: "prodTotal",
    titulo: "Alcohol producido",
    subtitulo: "Totalizador producción",
    bg: "#e3efe8",
    color: "#35674f",
    width: 155,
  },
  {
    key: "fdeTotal",
    titulo: "Fuera de especificaciones",
    subtitulo: "Flujómetro FDE",
    bg: "#f5e5e7",
    color: "#a34b57",
    width: 155,
  },
  {
    key: "tk402Total",
    titulo: "Traslado jornaleros",
    subtitulo: "TK402A / TK402B",
    bg: "#f5eedb",
    color: "#8a7135",
    width: 150,
  },
  {
    key: "ab801Total",
    titulo: "Traslado producto final",
    subtitulo: "TK801A / TK801B",
    bg: "#f4e8de",
    color: "#98613b",
    width: 165,
  },
];

const FRONTERAS = [
  { titulo: "SUPPLY CHAIN", subtitulo: "Materia prima", span: 3, color: "#24548a", bg: "#f6f9fe", total: "#e2ecf9" },
  { titulo: "PRODUCCIÓN", subtitulo: "Transformación", span: 3, color: "#35674f", bg: "#f5faf7", total: "#e3efe8" },
  { titulo: "SUPPLY CHAIN", subtitulo: "Producto terminado", span: 1, color: "#98613b", bg: "#fcf8f4", total: "#f4e8de" },
];

const fronteraPorColumna = (key) =>
  ["renConsumo", "tanques", "renNivelTotal"].includes(key)
    ? FRONTERAS[0]
    : key === "ab801Total"
      ? FRONTERAS[2]
      : FRONTERAS[1];

const iniciaFrontera = (key) =>
  ["renConsumo", "prodTotal", "ab801Total"].includes(key);

const tieneValor = (value) =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));

const formatoNumero = (value) =>
  tieneValor(value)
    ? Number(value).toLocaleString("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : "—";

const formatoFecha = (fecha) =>
  fecha ? String(fecha).split("-").reverse().join("/") : "—";

export default function ResumenTotalizadoresU400Modal({
  open,
  onClose,
  visibleGroups = [],
  visibleDailyTotals = [],
  totals = {},
  calc,
  getTanqueByValue,
  rowHasOperationalData,
  rangeFrom,
  rangeTo,
}) {
  const [modo, setModo] = useState("turnos");

  const grupos = visibleGroups.map((group) => ({
    ...group,
    items: group.items.filter(({ row }) =>
      rowHasOperationalData(row)
    ),
    totals:
      visibleDailyTotals.find((day) => day.key === group.key)
        ?.totals || {},
  }));

  const registros = grupos.flatMap((group) => group.items);

  const cantidadDias = new Set(
    grupos.map((group) => group.fecha).filter(Boolean)
  ).size;

  const cantidadTurnos = registros.length;

  const obtenerTanques = (rows = []) => {
    const nombres = rows.flatMap((row) =>
      [row.tanque1, row.tanque2]
        .filter((value) => String(value ?? "").trim())
        .map((value) =>
          String(getTanqueByValue(value)?.nombre ?? value).trim()
        )
    );

    return [...new Set(nombres)].join(" / ") || "—";
  };

  const tanquesPeriodo = obtenerTanques(
    registros.map(({ row }) => row)
  );

  const renderCelda = (col, value, tipo = "turno") => {
    const frontera = fronteraPorColumna(col.key);
    const esTanque = col.key === "tanques";
    const esTotal = tipo === "final";
    const esDiario = tipo === "dia";
    const esNegativo =
      !esTanque && tieneValor(value) && Number(value) < 0;

    return (
      <TableCell
        key={col.key}
        className={iniciaFrontera(col.key) ? "fronteraInicio" : undefined}
        align={esTanque ? "center" : "right"}
        sx={{
          fontSize: esTotal ? 13 : 12,
          fontWeight: esTotal ? 900 : esDiario ? 800 : 550,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: esTanque ? "normal" : "nowrap",
          overflowWrap: esTanque ? "anywhere" : "normal",
          verticalAlign: "middle",
          color: esNegativo
            ? esTotal
              ? "#ffb8bd"
              : "#b32635"
            : esTotal
              ? "#ffffff"
              : esTanque
                ? "#69518c"
                : esDiario
                  ? MARINO
                  : tieneValor(value)
                    ? "#34455d"
                    : "#a1adbc",
          bgcolor:
            esTotal ? frontera.color : esNegativo ? "#fce8ea" : esDiario ? frontera.total : frontera.bg,
        }}
      >
        {esTanque ? value || "—" : formatoNumero(value)}
      </TableCell>
    );
  };

  const renderValores = (values, tanques, tipo) =>
    COLUMNAS.map((col) =>
      renderCelda(
        col,
        col.key === "tanques" ? tanques : values?.[col.key],
        tipo
      )
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      aria-labelledby="resumen-u400-title"
      PaperProps={{
        sx: {
          width: { xs: "98%", md: "96%" },
          maxWidth: 1700,
          maxHeight: "94vh",
          m: 1,
          borderRadius: 3,
          bgcolor: "#f5f7fb",
          border: `1px solid ${BORDE}`,
          boxShadow: "0 24px 80px rgba(11,55,109,0.20)",
          overflow: "hidden",
        },
      }}
    >
      {/* ENCABEZADO PRINCIPAL */}

      <DialogTitle
        component="div"
        sx={{
          px: 2.5,
          py: 1.8,
          bgcolor: "#ffffff",
          borderTop: `4px solid ${MARINO}`,
          borderBottom: `1px solid ${BORDE}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 46,
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#eaf1fa",
              border: `1px solid ${BORDE}`,
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <AssessmentOutlinedIcon
              sx={{ color: MARINO, fontSize: 28 }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: AZUL,
                fontSize: 10,
                fontWeight: 850,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Control operativo · Unidad 400
            </Typography>

            <Typography
              id="resumen-u400-title"
              sx={{
                color: MARINO,
                fontSize: 21,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1.3,
              }}
            >
              Resumen de producción y consumos
            </Typography>

            <Typography
              sx={{ fontSize: 11.5, color: "#65758b", mt: 0.2 }}
            >
              Consolidado operativo de totalizadores y movimientos
            </Typography>
          </Box>

          <Tooltip title="Cerrar resumen" arrow>
            <IconButton
              onClick={onClose}
              aria-label="Cerrar resumen"
              size="small"
              sx={{
                color: "#65758b",
                border: `1px solid ${BORDE}`,
                bgcolor: "#f8fafc",
                borderRadius: 1.5,
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 1.2, md: 2 },
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* PERÍODO Y CONTROLES DE VISUALIZACIÓN */}

        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
          spacing={1.2}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <CalendarMonthOutlinedIcon
                sx={{ fontSize: 18, color: AZUL }}
              />

              <Typography
                sx={{ fontSize: 12.5, fontWeight: 800, color: MARINO }}
              >
                Período: {formatoFecha(rangeFrom)}
                {" — "}
                {formatoFecha(rangeTo)}
              </Typography>
            </Stack>

            <Typography
              sx={{ fontSize: 11.5, color: "#58709c", mt: 0.4 }}
            >
              {cantidadDias} día(s) con registros
              {" · "}
              {cantidadTurnos} turno(s)
              {" · "}
              Volúmenes expresados en litros
            </Typography>
          </Box>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={modo}
            onChange={(_, value) => {
              if (value !== null) setModo(value);
            }}
            aria-label="Modo de visualización"
            sx={{
              bgcolor: "#ffffff",
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.7,
                fontSize: 11.5,
                fontWeight: 750,
                textTransform: "none",
                borderColor: BORDE,
                color: "#58709c",
                gap: 0.7,
              },
              "& .Mui-selected": {
                bgcolor: "#e4eefb !important",
                color: `${MARINO} !important`,
              },
            }}
          >
            <ToggleButton value="turnos">
              <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
              Detalle por turnos
            </ToggleButton>

            <ToggleButton value="diario">
              <TableRowsOutlinedIcon sx={{ fontSize: 17 }} />
              Consolidado diario
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* TABLA CONSOLIDADA */}

        <TableContainer
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            maxHeight: "68vh",
            bgcolor: "#ffffff",
            border: `1px solid ${BORDE}`,
            borderRadius: 2,
            overflow: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#a9bed6 #f1f5f9",
          }}
        >
          <Table
            size="small"
            aria-label="Resumen operativo de totalizadores U400"
            sx={{
              minWidth: 1370,
              borderCollapse: "separate",
              borderSpacing: 0,
              "& .MuiTableCell-root": {
                px: 1.4,
                py: 1,
                borderBottom: "1px solid #e5ebf3",
                borderRight: "1px solid #edf1f6",
              },
              "& .MuiTableCell-root:last-child": {
                borderRight: 0,
              },
              "& .MuiTableHead-root": {
                position: "sticky",
                top: 0,
                zIndex: 4,
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                position: "static",
                py: 1,
                borderBottom: "1px solid #cad7e7",
              },
              "& .MuiTableCell-root.fronteraInicio": {
                borderLeft: "3px solid #a5b6c9",
              },
              "& .MuiTableFooter-root .MuiTableCell-root.fronteraInicio": {
                borderLeft: "3px solid #d5e0ec",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ bgcolor: MARINO, color: "#fff", fontSize: 11, fontWeight: 850, letterSpacing: 0.5 }}>
                  REGISTRO OPERATIVO
                </TableCell>
                {FRONTERAS.map((frontera) => (
                  <TableCell
                    key={frontera.subtitulo}
                    colSpan={frontera.span}
                    className="fronteraInicio"
                    align="center"
                    sx={{ bgcolor: frontera.color, color: "#fff" }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.6 }}>
                      {frontera.titulo}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, opacity: 0.9 }}>
                      {frontera.subtitulo}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{
                    bgcolor: MARINO,
                    color: "#ffffff",
                    minWidth: 105,
                    fontWeight: 850,
                    fontSize: 12,
                  }}
                >
                  Fecha
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    bgcolor: MARINO,
                    color: "#ffffff",
                    minWidth: 90,
                    fontWeight: 850,
                    fontSize: 12,
                  }}
                >
                  Turno
                </TableCell>

                {COLUMNAS.map((col) => (
                  <TableCell
                    key={col.key}
                    className={iniciaFrontera(col.key) ? "fronteraInicio" : undefined}
                    align="center"
                    sx={{
                      bgcolor: col.bg,
                      color: col.color,
                      minWidth: col.width,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 900,
                        lineHeight: 1.3,
                      }}
                    >
                      {col.titulo}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 550,
                        opacity: 0.85,
                        mt: 0.4,
                        lineHeight: 1.2,
                      }}
                    >
                      {col.subtitulo}
                      {col.key !== "tanques" && " (L)"}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {!grupos.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 6 }}>
                      <AssessmentOutlinedIcon
                        sx={{ fontSize: 42, color: "#a6b8cc", mb: 1 }}
                      />

                      <Typography
                        sx={{ fontSize: 14, fontWeight: 800, color: MARINO }}
                      >
                        No hay información registrada
                      </Typography>

                      <Typography
                        sx={{ fontSize: 12, color: "#65758b", mt: 0.5 }}
                      >
                        No se encontraron registros para el rango seleccionado.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {grupos.map((group, groupIndex) => {
                const tanquesDia = obtenerTanques(
                  group.items.map(({ row }) => row)
                );

                return (
                  <React.Fragment key={group.key}>
                    {/* REGISTROS INDIVIDUALES POR TURNO */}

                    {modo === "turnos" &&
                      group.items.map(({ row, originalIndex }, index) => {
                        const valores = Object.fromEntries(
                          COLUMNAS
                            .filter((col) => col.key !== "tanques")
                            .map((col) => [
                              col.key,
                              calc(row, col.key),
                            ])
                        );

                        return (
                          <TableRow
                            key={originalIndex}
                            hover
                            sx={{
                              bgcolor:
                                groupIndex % 2 === 0
                                  ? "#ffffff"
                                  : "#fafbfd",
                              "&:hover": {
                                bgcolor: "#edf4fc !important",
                              },
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 11.5,
                                fontWeight: index === 0 ? 800 : 500,
                                color: index === 0 ? MARINO : "#8796aa",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatoFecha(row.fecha)}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "#526984",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.turno || "Sin definir"}
                            </TableCell>

                            {renderValores(
                              valores,
                              obtenerTanques([row]),
                              "turno"
                            )}
                          </TableRow>
                        );
                      })}

                    {/* SUBTOTAL DIARIO */}

                    <TableRow
                      sx={{
                        bgcolor:
                          modo === "diario"
                            ? groupIndex % 2 === 0
                              ? "#ffffff"
                              : "#f4f7fc"
                            : "#e8eff9",
                        "& .MuiTableCell-root": {
                          borderTop:
                            modo === "turnos"
                              ? "1px solid #c6d7ec"
                              : undefined,
                          borderBottom: "1px solid #c6d7ec",
                          py: 1.15,
                        },
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          color: MARINO,
                          fontSize: 11.5,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatoFecha(group.fecha)}
                      </TableCell>

                      <TableCell align="center">
                        <Typography
                          sx={{
                            color: MARINO,
                            fontSize: 10.5,
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                        >
                          TOTAL DÍA
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 10,
                            color: "#58709c",
                            mt: 0.15,
                          }}
                        >
                          {group.items.length} turno(s)
                        </Typography>
                      </TableCell>

                      {renderValores(
                        group.totals,
                        tanquesDia,
                        "dia"
                      )}
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>

            {/* TOTAL FINAL FIJO */}

            {grupos.length > 0 && (
              <TableFooter
                sx={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 3,
                  bgcolor: MARINO,
                  boxShadow: "0 -4px 12px rgba(11,55,109,0.12)",
                }}
              >
                <TableRow
                  sx={{
                    bgcolor: MARINO,
                    "& .MuiTableCell-root": {
                      borderTop: "2px solid #4675b2",
                      borderRight: "1px solid #ffffff18",
                      borderBottom: 0,
                      py: 1.6,
                    },
                  }}
                >
                  <TableCell colSpan={2}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#ffffff",
                        fontWeight: 900,
                        letterSpacing: 0.4,
                      }}
                    >
                      TOTAL ACUMULADO
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "#c9dbee",
                        mt: 0.25,
                      }}
                    >
                      {cantidadDias} día(s) · {cantidadTurnos} turno(s)
                    </Typography>
                  </TableCell>

                  {renderValores(totals, tanquesPeriodo, "final")}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>

      </DialogContent>

      {/* PIE DEL MODAL */}

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.3,
          bgcolor: "#ffffff",
          borderTop: `1px solid ${BORDE}`,
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            color: "#7891b0",
            fontSize: 10,
            fontWeight: 750,
            letterSpacing: 0.5,
          }}
        >
          COCLÍ WEB · AMBIOCOM S.A.S.
        </Typography>

        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            bgcolor: MARINO,
            borderRadius: 1.7,
            px: 2.8,
            py: 0.8,
            textTransform: "none",
            fontWeight: 750,
            fontSize: 12,
            "&:hover": {
              bgcolor: "#174c89",
            },
          }}
        >
          Cerrar resumen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
