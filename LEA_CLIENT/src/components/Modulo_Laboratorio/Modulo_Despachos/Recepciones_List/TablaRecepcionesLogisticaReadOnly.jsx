import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  Tooltip,
  Menu,
} from "@mui/material";

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
import ClearIcon from "@mui/icons-material/Clear";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import ExcelDownloadButton from "../../../../utils/Export_Data_General/ExcelDownloadData";

const API_RECEPCION = "https://ambiocomserver.onrender.com/api/recepcion-alcoholes";
const API_COLUMNAS = "https://ambiocomserver.onrender.com/api/columna-recepcion-alcoholes";

export default function TablaRecepcionVehiculosReadOnly() {
  const [columnas, setColumnas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [density, setDensity] = useState(1);
  const [columnasVisibles, setColumnasVisibles] = useState([]);
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [filtrosColumna, setFiltrosColumna] = useState({});
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [anchorFiltro, setAnchorFiltro] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState(true);
  const [ordenFechaAsc, setOrdenFechaAsc] = useState(false);
  const [modoInteligenteScroll, setModoInteligenteScroll] = useState(false);

  useEffect(() => {
    obtenerColumnas();
    obtenerRegistros();
  }, []);

  useEffect(() => {
    if (columnas.length > 0) {
      setColumnasVisibles(columnas.map((c) => c.key));
    }
  }, [columnas]);

  const obtenerColumnas = async () => {
    try {
      const { data } = await axios.get(API_COLUMNAS);
      setColumnas(data);
    } catch {
      Swal.fire("Error", "No se pudieron cargar las columnas", "error");
    }
  };

  const obtenerRegistros = async () => {
    try {
      const { data } = await axios.get(API_RECEPCION);
      setRegistros(Array.isArray(data) ? data : []);
    } catch {
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    }
  };

  function stringToDate(fechaStr) {
    if (!fechaStr) return new Date(0);
    const [y, m, d] = fechaStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }

  const normalizar = (v) => (v ?? "").toString().toLowerCase().trim();

  const registrosOrdenados = useMemo(() => {
    let data = [...registros].sort((a, b) => {
      const fa = stringToDate(a.fecha);
      const fb = stringToDate(b.fecha);
      return ordenFechaAsc ? fa - fb : fb - fa;
    });

    if (fechaDesde) {
      const fd = stringToDate(fechaDesde);
      data = data.filter((r) => stringToDate(r.fecha) >= fd);
    }

    if (fechaHasta) {
      const fh = stringToDate(fechaHasta);
      data = data.filter((r) => stringToDate(r.fecha) <= fh);
    }

    Object.entries(filtrosColumna).forEach(([key, valorFiltro]) => {
      if (valorFiltro.trim() !== "") {
        data = data.filter((r) => {
          const valorCelda = r.lecturas?.[key] ?? "";
          return valorCelda
            .toString()
            .toLowerCase()
            .includes(valorFiltro.toLowerCase());
        });
      }
    });

    return data;
  }, [registros, fechaDesde, fechaHasta, filtrosColumna, ordenFechaAsc]);

  const registrosFiltrados = useMemo(() => {
    const q = normalizar(busquedaGlobal);
    if (!q) return registrosOrdenados;

    return registrosOrdenados.filter((row) => {
      const valores = [
        row.fecha,
        row.observaciones,
        row.responsable,
        ...Object.values(row.lecturas || {}),
      ];

      return valores.some((v) => normalizar(v).includes(q));
    });
  }, [busquedaGlobal, registrosOrdenados]);

  const acumuladosPorColumna = useMemo(() => {
    const map = {};

    columnas.forEach((c) => {
      if (!c.totalizable) return;

      const total = registrosFiltrados.reduce((sum, r) => {
        const num = Number(r.lecturas?.[c.key]);
        return sum + (Number.isNaN(num) ? 0 : num);
      }, 0);

      map[c.key] = new Intl.NumberFormat("es-CO", {
        useGrouping: true,
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(total);
    });

    return map;
  }, [columnas, registrosFiltrados]);

  const tableDensityStyles = {
    fontSize: `${0.75 * density}rem`,
    padding: `${2 * density}px ${6 * density}px`,
    lineHeight: 1.1 * density,
    rowHeight: `${28 * density}px`,
  };

  const copiarTablaPortapapeles = () => {
    const headers = [
      "Fecha Registro",
      ...columnas
        .filter((c) => columnasVisibles.includes(c.key))
        .map((c) => c.nombre),
      "Observaciones",
      "Responsable de recepción",
    ];

    const rows = registrosFiltrados.map((row) => [
      row.fecha,
      ...columnas
        .filter((c) => columnasVisibles.includes(c.key))
        .map((c) => row.lecturas?.[c.key] ?? ""),
      row.observaciones ?? "",
      row.responsable ?? "",
    ]);

    const textoParaCopiar =
      headers.join("\t") + "\n" + rows.map((r) => r.join("\t")).join("\n");

    navigator.clipboard.writeText(textoParaCopiar).then(() => {
      Swal.fire({
        icon: "success",
        title: "Copiado",
        text: "Tabla copiada al portapapeles.",
        timer: 1400,
        showConfirmButton: false,
      });
    });
  };

  const valoresUnicosFiltroActivo = useMemo(() => {
    if (!filtroActivo) return [];

    const set = new Set();

    registros.forEach((r) => {
      const v = r.lecturas?.[filtroActivo] ?? "";
      set.add(v.toString().trim());
    });

    const arr = Array.from(set);

    arr.sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });

    return arr;
  }, [filtroActivo, registros]);

  const calcularPorcentajeFaltante = (row) => {
    const columnasActivas = columnas.filter((c) =>
      columnasVisibles.includes(c.key)
    );
    if (columnasActivas.length === 0) return 0;

    let faltantes = 0;
    columnasActivas.forEach((c) => {
      const valor = row.lecturas?.[c.key];
      if (
        valor === undefined ||
        valor === null ||
        valor === "" ||
        (typeof valor === "string" && valor.trim() === "")
      ) {
        faltantes++;
      }
    });

    return faltantes / columnasActivas.length;
  };

  const obtenerColorFila = (porcentaje) => {
    if (porcentaje === 0) return "inherit";
    if (porcentaje >= 0.8) return "rgba(255, 0, 0, 0.75)";
    if (porcentaje >= 0.5) return "rgba(255, 0, 0, 0.45)";
    if (porcentaje >= 0.3) return "rgba(255, 0, 0, 0.25)";
    return "rgba(238, 173, 173, 0.71)";
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          p: 0.1,
          mt: 6,
          borderRadius: 1,
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
          display: "flex",
          alignItems: "center",
          width: "100vw",
          maxWidth: "100%",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box
          component="img"
          src="/LogoCompany/logoambiocomsinfondo.png"
          alt="Logo"
          sx={{
            height: "auto",
            width: 220,
            mr: 5,
            mb: 1,
            objectFit: "contain",
          }}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "#1A237E",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: "1.9rem",
              textAlign: "center",
            }}
          >
            RECEPCIÓN DE VEHÍCULOS READ ONLY
          </Typography>
        </Box>

        <Box
          sx={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            mr: 0,
            alignItems: "flex-end",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              px: 1.2,
              py: 0.7,
              backgroundColor: "#e9edf2",
              border: "1px solid rgba(0,0,0,0.12)",
              borderBottom: "1px solid rgba(0,0,0,0.22)",
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          >
            <Tooltip title="Scroll horizontal inteligente">
              <IconButton
                size="small"
                onClick={() => setModoInteligenteScroll((p) => !p)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: modoInteligenteScroll ? "#d3d8de" : "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <SwapHorizIcon
                  sx={{ color: modoInteligenteScroll ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title={ordenFechaAsc ? "Ver recientes" : "Ver antiguos"}>
              <IconButton
                size="small"
                onClick={() => setOrdenFechaAsc((prev) => !prev)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <SortByAlphaIcon
                  sx={{ color: ordenFechaAsc ? "blue" : "inherit" }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Copiar tabla">
              <IconButton
                size="small"
                onClick={copiarTablaPortapapeles}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor: "#f6f7f9",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>

            <ExcelDownloadButton
              data={registrosFiltrados}
              columnasVisibles={columnasVisibles}
              columnas={columnas}
              buttonText="Exportar tabla Excel"
              filename={`RecepcionVehiculos_${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: 150,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
            >
              <Select
                multiple
                value={columnasVisibles}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value.includes("__ALL__")) {
                    setColumnasVisibles(columnas.map((c) => c.key));
                    return;
                  }
                  if (value.includes("__NONE__")) {
                    setColumnasVisibles([]);
                    return;
                  }
                  setColumnasVisibles(value);
                }}
                renderValue={(selected) => `Columnas (${selected.length})`}
              >
                <MenuItem value="__ALL__">
                  <Checkbox checked={columnasVisibles.length === columnas.length} />
                  <ListItemText primary="Seleccionar todo" />
                </MenuItem>
                <MenuItem value="__NONE__">
                  <Checkbox checked={columnasVisibles.length === 0} />
                  <ListItemText primary="Deseleccionar todo" />
                </MenuItem>

                {columnas.map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    <Checkbox checked={columnasVisibles.includes(c.key)} size="small" />
                    <ListItemText primary={c.nombre} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                minWidth: 90,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
            >
              <Select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              >
                <MenuItem value={0.8}>Densa</MenuItem>
                <MenuItem value={1}>Normal</MenuItem>
                <MenuItem value={1.2}>Cómoda</MenuItem>
                <MenuItem value={1.4}>Media</MenuItem>
                <MenuItem value={1.6}>Grande</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              px: 1.2,
              py: 0.7,
              backgroundColor: "#e9edf2",
              border: "1px solid rgba(0,0,0,0.12)",
              borderTop: "none",
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
            }}
          >
            {busquedaActiva && (
              <TextField
                size="small"
                label="Buscar en toda la tabla"
                value={busquedaGlobal}
                onChange={(e) => setBusquedaGlobal(e.target.value)}
                placeholder="Escribe para buscar..."
                sx={{
                  mt: 0.2,
                  minWidth: 180,
                  maxWidth: 220,
                  "& .MuiInputBase-root": {
                    height: 34,
                    backgroundColor: "#f6f7f9",
                    borderRadius: 1,
                  },
                }}
              />
            )}

            <IconButton
              size="small"
              onClick={() => {
                setBusquedaActiva((prev) => {
                  const next = !prev;
                  if (!next) setBusquedaGlobal("");
                  return next;
                });
              }}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: busquedaActiva ? "#d3d8de" : "#f6f7f9",
                color: busquedaActiva ? "blue" : "inherit",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              <ManageSearchIcon />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => setFiltrosVisibles(!filtrosVisibles)}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: filtrosVisibles ? "#d3d8de" : "#f6f7f9",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              {filtrosVisibles ? (
                <FilterAltOffIcon fontSize="small" sx={{ color: "blue" }} />
              ) : (
                <FilterAltIcon fontSize="small" />
              )}
            </IconButton>

            <TextField
              type="date"
              label="Desde"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                mt: 0.5,
                minWidth: 135,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
              onChange={(e) => setFechaDesde(e.target.value)}
            />

            <TextField
              type="date"
              label="Hasta"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                mt: 0.5,
                minWidth: 135,
                "& .MuiInputBase-root": {
                  height: 34,
                  backgroundColor: "#f6f7f9",
                  borderRadius: 1,
                },
              }}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </Box>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          maxHeight: "78vh",
          overflowX: "auto",
          ...(modoInteligenteScroll && {
            scrollBehavior: "smooth",
          }),
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center">Fecha Registro</TableCell>

              {columnas
                .filter((c) => columnasVisibles.includes(c.key))
                .map((c) => (
                  <TableCell
                    key={c.key}
                    align="center"
                    sx={{
                      whiteSpace: "nowrap",
                      borderRight: "1px solid rgba(224, 224, 224, 1)",
                    }}
                  >
                    {c.nombre}
                    {filtrosVisibles && (
                      <IconButton
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={(e) => {
                          if (filtroActivo === c.key) {
                            setFiltroActivo(null);
                            setAnchorFiltro(null);
                          } else {
                            setFiltroActivo(c.key);
                            setAnchorFiltro(e.currentTarget);
                          }
                        }}
                      >
                        <FilterListIcon
                          color={filtrosColumna[c.key] ? "primary" : "inherit"}
                          fontSize="small"
                        />
                      </IconButton>
                    )}
                  </TableCell>
                ))}

              <TableCell align="center">Observaciones</TableCell>
              <TableCell align="center">Responsable de recepción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              "& .MuiTableCell-root": {
                padding: tableDensityStyles.padding,
                lineHeight: tableDensityStyles.lineHeight,
                fontSize: tableDensityStyles.fontSize,
                whiteSpace: "nowrap",
                verticalAlign: "middle",
              },
              "& .MuiTableRow-root": {
                height: tableDensityStyles.rowHeight,
              },
            }}
          >
            {registrosFiltrados.map((row) => {
              const porcentajeFaltante = calcularPorcentajeFaltante(row);
              const colorFila = obtenerColorFila(porcentajeFaltante);

              return (
                <TableRow
                  key={row._id}
                  sx={{
                    backgroundColor: porcentajeFaltante > 0 ? colorFila : "inherit",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <TableCell align="center">{row.fecha}</TableCell>

                  {columnas
                    .filter((c) => columnasVisibles.includes(c.key))
                    .map((c) => {
                      const valor = row.lecturas?.[c.key] ?? "";

                      return (
                        <TableCell
                          key={c.key}
                          align="center"
                          sx={{ whiteSpace: "nowrap", width: "1%" }}
                        >
                          {valor}
                        </TableCell>
                      );
                    })}

                  <TableCell align="center">{row.observaciones}</TableCell>
                  <TableCell align="center">{row.responsable}</TableCell>
                </TableRow>
              );
            })}

            <TableRow>
              <TableCell>
                <b>Acumulado Total</b>
              </TableCell>

              {columnas
                .filter((c) => columnasVisibles.includes(c.key))
                .map((c) => (
                  <TableCell key={c.key} align="center">
                    {c.totalizable ? (
                      <b>
                        {acumuladosPorColumna[c.key] ?? 0} {c.unidad || ""}
                      </b>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </TableCell>
                ))}

              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorFiltro}
        open={Boolean(filtroActivo)}
        onClose={() => {
          setFiltroActivo(null);
          setAnchorFiltro(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 0, minWidth: 280, maxWidth: 340 }}>
          <MenuItem
            onClick={() =>
              setFiltrosColumna((prev) => ({
                ...prev,
                [filtroActivo]: "",
              }))
            }
          >
            <ListItemText primary="Limpiar filtro" />
            <ClearIcon sx={{ fontSize: 18, opacity: 0.7 }} />
          </MenuItem>

          <Divider />

          {valoresUnicosFiltroActivo.map((valor) => {
            const label = valor === "" ? "(Vacío)" : valor;

            return (
              <MenuItem
                key={valor || "__VACIO__"}
                onClick={() =>
                  setFiltrosColumna((prev) => ({
                    ...prev,
                    [filtroActivo]: valor,
                  }))
                }
              >
                {label}
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </Box>
  );
}