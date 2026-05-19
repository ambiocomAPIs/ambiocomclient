import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Button,
  TableFooter,
} from "@mui/material";
import {
  Add,
  Inventory2,
  LocalShipping,
  TrendingDown,
  TrendingUp,
  WarningAmber,
  Forest,
  FilterAlt,
  Download,
} from "@mui/icons-material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const initialMovements = [
  {
    id: 1,
    fecha: "2026-02-01",
    material: "Carbón",
    proveedor: "Granucar",
    tipo: "Entrada",
    cantidadTon: 32.4,
    origen: "Compra",
    lote: "GR-0201",
    responsable: "Operador Patio",
    observacion: "Recepción validada",
  },
  {
    id: 2,
    fecha: "2026-02-01",
    material: "Carbón",
    proveedor: "ATECO",
    tipo: "Salida",
    cantidadTon: 18.7,
    origen: "Consumo tolva",
    lote: "AT-0201",
    responsable: "Producción",
    observacion: "Dosificación diaria",
  },
  {
    id: 3,
    fecha: "2026-02-02",
    material: "Madera",
    proveedor: "Urbaser",
    tipo: "Entrada",
    cantidadTon: 12.8,
    origen: "Recepción patio",
    lote: "UR-0202",
    responsable: "Logística",
    observacion: "Humedad pendiente",
  },
  {
    id: 4,
    fecha: "2026-02-02",
    material: "Carbón",
    proveedor: "Carbomax",
    tipo: "Ajuste",
    cantidadTon: -1.5,
    origen: "Inventario físico",
    lote: "CB-0202",
    responsable: "Supervisor",
    observacion: "Diferencia por medición",
  },
  {
    id: 5,
    fecha: "2026-02-03",
    material: "Madera",
    proveedor: "Urbaser",
    tipo: "Salida",
    cantidadTon: 7.1,
    origen: "Consumo horno",
    lote: "UR-0202",
    responsable: "Producción",
    observacion: "Consumo turno A",
  },
];

const inventorySeed = [
  { material: "Carbón", proveedor: "Granucar", inicialTon: 51.9, stockMinimoTon: 25 },
  { material: "Carbón", proveedor: "ATECO", inicialTon: 35.46, stockMinimoTon: 20 },
  { material: "Carbón", proveedor: "Carbomax", inicialTon: 25.98, stockMinimoTon: 15 },
  { material: "Carbón", proveedor: "Casvilla Córdoba", inicialTon: 64.05, stockMinimoTon: 25 },
  { material: "Madera", proveedor: "Urbaser", inicialTon: 4.56, stockMinimoTon: 10 },
];

const formatTon = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

function calculateInventory(movements) {
  return inventorySeed.map((item) => {
    const related = movements.filter(
      (movement) =>
        movement.material === item.material && movement.proveedor === item.proveedor
    );

    const entradas = related
      .filter((movement) => movement.tipo === "Entrada")
      .reduce((total, movement) => total + movement.cantidadTon, 0);

    const salidas = related
      .filter((movement) => movement.tipo === "Salida")
      .reduce((total, movement) => total + movement.cantidadTon, 0);

    const ajustes = related
      .filter((movement) => movement.tipo === "Ajuste")
      .reduce((total, movement) => total + movement.cantidadTon, 0);

    const actualTon = item.inicialTon + entradas - salidas + ajustes;
    const cobertura = Math.max(0, Math.min(100, (actualTon / item.stockMinimoTon) * 100));

    return { ...item, entradas, salidas, ajustes, actualTon, cobertura };
  });
}

function buildDailySeries(movements) {
  const days = [...new Set(movements.map((movement) => movement.fecha))].sort();

  return days.map((fecha) => {
    const dayMovements = movements.filter((movement) => movement.fecha === fecha);
    return {
      fecha: fecha.slice(5),
      entradas: dayMovements
        .filter((movement) => movement.tipo === "Entrada")
        .reduce((total, movement) => total + movement.cantidadTon, 0),
      salidas: dayMovements
        .filter((movement) => movement.tipo === "Salida")
        .reduce((total, movement) => total + movement.cantidadTon, 0),
      ajustes: dayMovements
        .filter((movement) => movement.tipo === "Ajuste")
        .reduce((total, movement) => total + movement.cantidadTon, 0),
    };
  });
}

export default function ModuloSeguimientoCarbonMadera() {
  const [tab, setTab] = useState(0);
  const [materialFilter, setMaterialFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [movements, setMovements] = useState(initialMovements);

  const handleSheetChange = (rowId, field, value) => {
    setMovements((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: field === "cantidadTon" ? Number(value || 0) : value,
            }
          : row
      )
    );
  };

  const handleAddSheetRow = () => {
    setMovements((currentRows) => [
      ...currentRows,
      {
        id: Date.now(),
        fecha: new Date().toISOString().slice(0, 10),
        material: "Carbón",
        proveedor: "Granucar",
        tipo: "Entrada",
        cantidadTon: 0,
        origen: "",
        lote: "",
        responsable: "",
        observacion: "",
      },
    ]);
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesMaterial =
        materialFilter === "Todos" || movement.material === materialFilter;
      const searchable = `${movement.proveedor} ${movement.tipo} ${movement.lote} ${movement.responsable}`.toLowerCase();
      return matchesMaterial && searchable.includes(search.toLowerCase());
    });
  }, [materialFilter, movements, search]);

  const inventory = useMemo(() => calculateInventory(movements), [movements]);
  const dailySeries = useMemo(() => buildDailySeries(movements), [movements]);

  const totals = useMemo(() => {
    const entradas = movements
      .filter((movement) => movement.tipo === "Entrada")
      .reduce((total, movement) => total + movement.cantidadTon, 0);
    const salidas = movements
      .filter((movement) => movement.tipo === "Salida")
      .reduce((total, movement) => total + movement.cantidadTon, 0);
    const stock = inventory.reduce((total, item) => total + item.actualTon, 0);
    const alertas = inventory.filter((item) => item.actualTon < item.stockMinimoTon).length;
    return { entradas, salidas, stock, alertas };
  }, [inventory, movements]);

  return (
    <Box sx={{ bgcolor: "#f5f7fb", minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={800}>
            Ambiocom · Patio de combustibles
          </Typography>
          <Typography variant="h4" fontWeight={900} letterSpacing={-0.6}>
            Seguimiento de carbón, madera e inventario
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Control de entradas, consumos, ajustes, cobertura y trazabilidad por proveedor.
          </Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center">
          <Button startIcon={<Download />} variant="outlined" sx={{ borderRadius: 3 }}>
            Exportar
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setTab(1)}
            sx={{ borderRadius: 3 }}
          >
            Registrar movimiento
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <KpiCard title="Stock total" value={`${formatTon(totals.stock)} t`} icon={<Inventory2 />} tone="primary" />
        <KpiCard title="Entradas" value={`${formatTon(totals.entradas)} t`} icon={<TrendingUp />} tone="success" />
        <KpiCard title="Consumo / salidas" value={`${formatTon(totals.salidas)} t`} icon={<TrendingDown />} tone="warning" />
        <KpiCard title="Alertas stock mínimo" value={totals.alertas} icon={<WarningAmber />} tone="error" />
      </Grid>

      <Card sx={{ borderRadius: 4, boxShadow: "0 20px 60px rgba(15,23,42,.08)" }}>
        <CardContent>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            <Tab label="Dashboard" />
            <Tab label="Tabla diaria tipo Excel" />
            <Tab label="Movimientos" />
            <Tab label="Inventario" />
          </Tabs>
          <Divider sx={{ mb: 3 }} />

          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Panel title="Flujo diario de combustibles" subtitle="Entradas, salidas y ajustes en toneladas">
                  <Box height={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailySeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area type="monotone" dataKey="entradas" fillOpacity={0.25} />
                        <Area type="monotone" dataKey="salidas" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="ajustes" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Panel>
              </Grid>
              <Grid item xs={12} lg={5}>
                <Panel title="Stock por proveedor" subtitle="Inventario actual vs. umbral mínimo">
                  <Box height={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventory} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="proveedor" type="category" width={120} />
                        <RechartsTooltip />
                        <Bar dataKey="actualTon" name="Stock actual" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="stockMinimoTon" name="Stock mínimo" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Panel>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <DailyExcelSheet
              rows={movements}
              onChange={handleSheetChange}
              onAddRow={handleAddSheetRow}
            />
          )}

          {tab === 2 && (
            <Stack gap={2}>
              <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ md: "center" }}>
                <TextField
                  label="Buscar proveedor, lote o responsable"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  fullWidth
                />
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Material</InputLabel>
                  <Select
                    value={materialFilter}
                    label="Material"
                    onChange={(event) => setMaterialFilter(event.target.value)}
                    startAdornment={<FilterAlt sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="Todos">Todos</MenuItem>
                    <MenuItem value="Carbón">Carbón</MenuItem>
                    <MenuItem value="Madera">Madera</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <MovementsTable rows={filteredMovements} />
            </Stack>
          )}

          {tab === 3 && <InventoryTable rows={inventory} />}
        </CardContent>
      </Card>
    </Box>
  );
}

function KpiCard({ title, value, icon, tone }) {
  const palette = {
    primary: "primary.main",
    success: "success.main",
    warning: "warning.main",
    error: "error.main",
  };

  return (
    <Grid item xs={12} sm={6} lg={3}>
      <Card sx={{ borderRadius: 4, height: "100%", boxShadow: "0 16px 40px rgba(15,23,42,.07)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography color="text.secondary" fontWeight={700} fontSize={13}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={900} mt={0.5}>
                {value}
              </Typography>
            </Box>
            <Box sx={{ color: palette[tone], bgcolor: "rgba(15,23,42,.04)", p: 1.5, borderRadius: 3 }}>
              {icon}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 4, p: 2.5, height: "100%" }}>
      <Typography variant="h6" fontWeight={900}>
        {title}
      </Typography>
      <Typography color="text.secondary" fontSize={14} mb={2}>
        {subtitle}
      </Typography>
      {children}
    </Paper>
  );
}

function DailyExcelSheet({ rows, onChange, onAddRow }) {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.tipo === "Entrada") acc.entradas += Number(row.cantidadTon || 0);
      if (row.tipo === "Salida") acc.salidas += Number(row.cantidadTon || 0);
      if (row.tipo === "Ajuste") acc.ajustes += Number(row.cantidadTon || 0);
      return acc;
    },
    { entradas: 0, salidas: 0, ajustes: 0 }
  );

  const cellSx = {
    p: 0,
    borderColor: "#d7deea",
    "& .MuiInputBase-root": {
      borderRadius: 0,
      fontSize: 13,
      bgcolor: "white",
    },
    "& fieldset": { border: 0 },
    "& input": { px: 1.2, py: 1.1 },
  };

  return (
    <Stack gap={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={900}>
            Registro diario tipo Excel
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Digita directamente entradas, consumos y ajustes. El dashboard se recalcula automáticamente.
          </Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={onAddRow} sx={{ borderRadius: 3 }}>
          Agregar fila
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 4,
          maxHeight: 560,
          borderColor: "#cbd5e1",
          overflow: "auto",
          "& th": {
            bgcolor: "#eef3f8",
            fontWeight: 900,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
            position: "sticky",
            top: 0,
            zIndex: 2,
          },
          "& td": { minWidth: 140 },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 64 }}>#</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Tipo movimiento</TableCell>
              <TableCell align="right">Cantidad ton</TableCell>
              <TableCell>Origen / proceso</TableCell>
              <TableCell>Lote / remisión</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Observación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 800, color: "text.secondary", minWidth: 64 }}>
                  {index + 1}
                </TableCell>
                <TableCell sx={cellSx}>
                  <TextField type="date" value={row.fecha} onChange={(event) => onChange(row.id, "fecha", event.target.value)} fullWidth size="small" />
                </TableCell>
                <TableCell sx={cellSx}>
                  <Select value={row.material} onChange={(event) => onChange(row.id, "material", event.target.value)} fullWidth size="small">
                    <MenuItem value="Carbón">Carbón</MenuItem>
                    <MenuItem value="Madera">Madera</MenuItem>
                  </Select>
                </TableCell>
                <TableCell sx={cellSx}>
                  <Select value={row.proveedor} onChange={(event) => onChange(row.id, "proveedor", event.target.value)} fullWidth size="small">
                    <MenuItem value="Granucar">Granucar</MenuItem>
                    <MenuItem value="ATECO">ATECO</MenuItem>
                    <MenuItem value="Carbomax">Carbomax</MenuItem>
                    <MenuItem value="Casvilla Córdoba">Casvilla Córdoba</MenuItem>
                    <MenuItem value="Urbaser">Urbaser</MenuItem>
                  </Select>
                </TableCell>
                <TableCell sx={cellSx}>
                  <Select value={row.tipo} onChange={(event) => onChange(row.id, "tipo", event.target.value)} fullWidth size="small">
                    <MenuItem value="Entrada">Entrada</MenuItem>
                    <MenuItem value="Salida">Salida / consumo</MenuItem>
                    <MenuItem value="Ajuste">Ajuste inventario</MenuItem>
                  </Select>
                </TableCell>
                <TableCell sx={cellSx} align="right">
                  <TextField type="number" value={row.cantidadTon} onChange={(event) => onChange(row.id, "cantidadTon", event.target.value)} fullWidth size="small" inputProps={{ step: "0.01", min: "0" }} />
                </TableCell>
                <TableCell sx={cellSx}>
                  <TextField value={row.origen} onChange={(event) => onChange(row.id, "origen", event.target.value)} fullWidth size="small" placeholder="Compra, horno, patio..." />
                </TableCell>
                <TableCell sx={cellSx}>
                  <TextField value={row.lote} onChange={(event) => onChange(row.id, "lote", event.target.value)} fullWidth size="small" />
                </TableCell>
                <TableCell sx={cellSx}>
                  <TextField value={row.responsable} onChange={(event) => onChange(row.id, "responsable", event.target.value)} fullWidth size="small" />
                </TableCell>
                <TableCell sx={{ ...cellSx, minWidth: 240 }}>
                  <TextField value={row.observacion} onChange={(event) => onChange(row.id, "observacion", event.target.value)} fullWidth size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                Totales digitados
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                E: {formatTon(totals.entradas)} · S: {formatTon(totals.salidas)} · A: {formatTon(totals.ajustes)}
              </TableCell>
              <TableCell colSpan={4} sx={{ bgcolor: "#f8fafc" }} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function MovementsTable({ rows }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Material</TableCell>
            <TableCell>Proveedor</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Cantidad</TableCell>
            <TableCell>Lote</TableCell>
            <TableCell>Responsable</TableCell>
            <TableCell>Observación</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.fecha}</TableCell>
              <TableCell>
                <Chip icon={row.material === "Madera" ? <Forest /> : <Inventory2 />} label={row.material} size="small" />
              </TableCell>
              <TableCell>{row.proveedor}</TableCell>
              <TableCell>
                <Chip
                  label={row.tipo}
                  size="small"
                  color={row.tipo === "Entrada" ? "success" : row.tipo === "Salida" ? "warning" : "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">{formatTon(row.cantidadTon)} t</TableCell>
              <TableCell>{row.lote}</TableCell>
              <TableCell>{row.responsable}</TableCell>
              <TableCell>{row.observacion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function InventoryTable({ rows }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Material</TableCell>
            <TableCell>Proveedor</TableCell>
            <TableCell align="right">Inicial</TableCell>
            <TableCell align="right">Entradas</TableCell>
            <TableCell align="right">Salidas</TableCell>
            <TableCell align="right">Ajustes</TableCell>
            <TableCell align="right">Stock actual</TableCell>
            <TableCell>Cobertura</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const isLow = row.actualTon < row.stockMinimoTon;
            return (
              <TableRow key={`${row.material}-${row.proveedor}`} hover>
                <TableCell>{row.material}</TableCell>
                <TableCell>{row.proveedor}</TableCell>
                <TableCell align="right">{formatTon(row.inicialTon)} t</TableCell>
                <TableCell align="right">{formatTon(row.entradas)} t</TableCell>
                <TableCell align="right">{formatTon(row.salidas)} t</TableCell>
                <TableCell align="right">{formatTon(row.ajustes)} t</TableCell>
                <TableCell align="right">
                  <Typography fontWeight={900}>{formatTon(row.actualTon)} t</Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={row.cobertura}
                      sx={{ flex: 1, height: 8, borderRadius: 99 }}
                      color={isLow ? "error" : "success"}
                    />
                    <Typography fontSize={12} color="text.secondary">
                      {Math.round(row.cobertura)}%
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={isLow ? "Bajo mínimo" : "Operativo"}
                    color={isLow ? "error" : "success"}
                    size="small"
                    variant={isLow ? "filled" : "outlined"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
