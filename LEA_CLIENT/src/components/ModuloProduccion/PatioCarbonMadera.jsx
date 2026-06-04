import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
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
} from "@mui/material";
import {
  Add,
  Archive,
  Download,
  FilterAlt,
  Forest,
  Inventory2,
  Restore,
  TrendingDown,
  TrendingUp,
  WarningAmber,
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

import MonthlyExcelSheet, {
  calculateDailyCarbon,
  calculateMonthlyTotals,
  createMonthlySheet,
  currentMonthKey,
  formatTon,
  normalizeMonthlyRows,
} from "./utils/components/tablepatiocarbontipoexcel";

const makeCarbonId = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `carbon-${Date.now()}`;

const initialCarbons = [
  {
    id: "granucar",
    name: "Granucar",
    weightCV: 0.49,
    weightCN: 0.74,
    initialTon: 51.9,
    stockMinimoTon: 25,
    active: true,
  },
  {
    id: "supplies",
    name: "Supplies",
    weightCV: 0.5,
    weightCN: 0.76,
    initialTon: 35.46,
    stockMinimoTon: 20,
    active: true,
  },
  {
    id: "ateco",
    name: "ATECO",
    weightCV: 0.48,
    weightCN: 0.73,
    initialTon: 25.98,
    stockMinimoTon: 15,
    active: true,
  },
  {
    id: "carbomax",
    name: "Carbomax",
    weightCV: 0.52,
    weightCN: 0.78,
    initialTon: 64.05,
    stockMinimoTon: 25,
    active: false,
  },
];

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

function calculateInventoryFromMonthly(rows, carbons) {
  return carbons.map((carbon) => {
    const totals = rows.reduce(
      (acc, row) => {
        const result = calculateDailyCarbon(row.carbons?.[carbon.id], carbon);
        acc.entradas += result.entrada;
        acc.salidas += result.salida;
        acc.ajustes += result.ajuste;
        return acc;
      },
      { entradas: 0, salidas: 0, ajustes: 0 }
    );

    const actualTon =
      Number(carbon.initialTon || 0) +
      totals.entradas +
      totals.ajustes -
      totals.salidas;

    const cobertura = Math.max(
      0,
      Math.min(100, (actualTon / Number(carbon.stockMinimoTon || 1)) * 100)
    );

    return {
      material: "Carbón",
      proveedor: carbon.name,
      inicialTon: Number(carbon.initialTon || 0),
      stockMinimoTon: Number(carbon.stockMinimoTon || 0),
      active: carbon.active,
      entradas: totals.entradas,
      salidas: totals.salidas,
      ajustes: totals.ajustes,
      actualTon,
      cobertura,
    };
  });
}

function buildDailySeriesFromMonthly(rows, activeCarbons, movements) {
  return rows.map((row) => {
    const carbonTotals = activeCarbons.reduce(
      (acc, carbon) => {
        const result = calculateDailyCarbon(row.carbons?.[carbon.id], carbon);

        acc.entradaCarbon += result.entrada;
        acc.consumoCarbon += result.salida;
        acc.ajusteCarbon += result.ajuste;

        return acc;
      },
      {
        entradaCarbon: 0,
        consumoCarbon: 0,
        ajusteCarbon: 0,
      }
    );

    const woodTotals = movements
      .filter(
        (movement) =>
          movement.material === "Madera" &&
          movement.fecha === row.fecha
      )
      .reduce(
        (acc, movement) => {
          const cantidad = Number(movement.cantidadTon || 0);

          if (movement.tipo === "Entrada") acc.entradaMadera += cantidad;
          if (movement.tipo === "Salida") acc.consumoMadera += cantidad;
          if (movement.tipo === "Ajuste") acc.ajusteMadera += cantidad;

          return acc;
        },
        {
          entradaMadera: 0,
          consumoMadera: 0,
          ajusteMadera: 0,
        }
      );

    return {
      fecha: row.fecha.slice(5),

      entradaCarbon: carbonTotals.entradaCarbon,
      consumoCarbon: carbonTotals.consumoCarbon,
      ajusteCarbon: carbonTotals.ajusteCarbon,

      entradaMadera: woodTotals.entradaMadera,
      consumoMadera: woodTotals.consumoMadera,
      ajusteMadera: woodTotals.ajusteMadera,
    };
  });
}

export default function ModuloSeguimientoCarbonMadera() {
  const initialMonth = currentMonthKey();

  const [tab, setTab] = useState(0);
  const [materialFilter, setMaterialFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [movements, setMovements] = useState(initialMovements);
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [carbons, setCarbons] = useState(initialCarbons);

  const [monthlySheets, setMonthlySheets] = useState(() => ({
    [initialMonth]: createMonthlySheet(
      initialMonth,
      initialCarbons.filter((carbon) => carbon.active)
    ),
  }));

  const [newCarbonName, setNewCarbonName] = useState("");

  const activeCarbons = useMemo(
    () => carbons.filter((carbon) => carbon.active),
    [carbons]
  );

  const monthRows = useMemo(() => {
    const existingRows =
      monthlySheets[monthKey] || createMonthlySheet(monthKey, activeCarbons);

    return normalizeMonthlyRows(existingRows, carbons);
  }, [activeCarbons, carbons, monthKey, monthlySheets]);

  const dailySeries = useMemo(
    () => buildDailySeriesFromMonthly(monthRows, activeCarbons, movements),
    [activeCarbons, monthRows, movements]
  );

  const inventory = useMemo(
    () => calculateInventoryFromMonthly(monthRows, carbons),
    [carbons, monthRows]
  );

  const monthlyTotals = useMemo(
    () => calculateMonthlyTotals(monthRows, activeCarbons),
    [activeCarbons, monthRows]
  );

  const totals = useMemo(() => {
    const carbonStock = inventory.reduce(
      (total, item) => total + item.actualTon,
      0
    );

    const alertas = inventory.filter(
      (item) => item.active && item.actualTon < item.stockMinimoTon
    ).length;

    const woodMovements = movements.filter(
      (movement) =>
        movement.material === "Madera" &&
        movement.fecha?.startsWith(monthKey)
    );

    const woodTotals = woodMovements.reduce(
      (acc, movement) => {
        const cantidad = Number(movement.cantidadTon || 0);

        if (movement.tipo === "Entrada") acc.entradas += cantidad;
        if (movement.tipo === "Salida") acc.salidas += cantidad;
        if (movement.tipo === "Ajuste") acc.ajustes += cantidad;

        return acc;
      },
      {
        entradas: 0,
        salidas: 0,
        ajustes: 0,
      }
    );

    const woodStock =
      woodTotals.entradas + woodTotals.ajustes - woodTotals.salidas;

    return {
      carbon: {
        entradas: monthlyTotals.entradas,
        salidas: monthlyTotals.salidas,
        stock: carbonStock,
      },
      madera: {
        entradas: woodTotals.entradas,
        salidas: woodTotals.salidas,
        stock: woodStock,
      },
      alertas,
    };
  }, [inventory, monthlyTotals, monthKey, movements]);

  const handleSheetChange = (rowId, path, value) => {
    setMonthlySheets((current) => {
      const rows = normalizeMonthlyRows(
        current[monthKey] || createMonthlySheet(monthKey, activeCarbons),
        carbons
      );

      const nextRows = rows.map((row) => {
        if (row.id !== rowId) return row;

        if (path.length === 1) {
          return {
            ...row,
            [path[0]]: value,
          };
        }

        const [, carbonId, field] = path;

        return {
          ...row,
          carbons: {
            ...row.carbons,
            [carbonId]: {
              ...row.carbons?.[carbonId],
              [field]: value,
            },
          },
        };
      });

      return {
        ...current,
        [monthKey]: nextRows,
      };
    });
  };

  const handleCreateCurrentMonth = () => {
    const targetMonth = currentMonthKey();

    setMonthKey(targetMonth);

    setMonthlySheets((current) => ({
      ...current,
      [targetMonth]:
        current[targetMonth] || createMonthlySheet(targetMonth, activeCarbons),
    }));
  };

  const handleCreateSelectedMonth = () => {
    setMonthlySheets((current) => ({
      ...current,
      [monthKey]:
        current[monthKey] || createMonthlySheet(monthKey, activeCarbons),
    }));
  };

  const handleCarbonFieldChange = (carbonId, field, value) => {
    setCarbons((current) =>
      current.map((carbon) =>
        carbon.id === carbonId
          ? {
              ...carbon,
              [field]: [
                "weightCV",
                "weightCN",
                "initialTon",
                "stockMinimoTon",
              ].includes(field)
                ? Number(value || 0)
                : value,
            }
          : carbon
      )
    );
  };

  const handleAddCarbon = () => {
    const trimmedName = newCarbonName.trim();

    if (!trimmedName) return;

    const baseId = makeCarbonId(trimmedName);

    const id = carbons.some((carbon) => carbon.id === baseId)
      ? `${baseId}-${Date.now()}`
      : baseId;

    const nextCarbon = {
      id,
      name: trimmedName,
      weightCV: 0,
      weightCN: 0,
      initialTon: 0,
      stockMinimoTon: 0,
      active: true,
    };

    setCarbons((current) => [...current, nextCarbon]);

    setMonthlySheets((current) => {
      const next = { ...current };

      Object.keys(next).forEach((sheetMonth) => {
        next[sheetMonth] = next[sheetMonth].map((row) => ({
          ...row,
          carbons: {
            ...row.carbons,
            [id]: {
              inicial: "",
              entrada: "",
              paladasCV: "",
              paladasCN: "",
              ajuste: "",
            },
          },
        }));
      });

      return next;
    });

    setNewCarbonName("");
  };

  const handleToggleCarbon = (carbonId) => {
    setCarbons((current) =>
      current.map((carbon) =>
        carbon.id === carbonId
          ? {
              ...carbon,
              active: !carbon.active,
            }
          : carbon
      )
    );
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesMaterial =
        materialFilter === "Todos" || movement.material === materialFilter;

      const searchable =
        `${movement.proveedor} ${movement.tipo} ${movement.lote} ${movement.responsable}`.toLowerCase();

      return matchesMaterial && searchable.includes(search.toLowerCase());
    });
  }, [materialFilter, movements, search]);

  const handleLegacyMovementChange = (rowId, field, value) => {
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

  const handleAddLegacyMovement = () => {
    setMovements((currentRows) => [
      ...currentRows,
      {
        id: Date.now(),
        fecha: new Date().toISOString().slice(0, 10),
        material: "Carbón",
        proveedor: activeCarbons[0]?.name || "Granucar",
        tipo: "Entrada",
        cantidadTon: 0,
        origen: "",
        lote: "",
        responsable: "",
        observacion: "",
      },
    ]);
  };

  return (
    <Box sx={{ bgcolor: "#f5f7fb", minHeight: "100vh", p: { xs: 1, md: 1 } }}>
      <Stack
        sx={{ mt: 7 }}
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing={-0.6}>
            Seguimiento de carbón, madera e inventario
          </Typography>
        </Box>

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            startIcon={<Download />}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Exportar
          </Button>

          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setTab(1)}
            sx={{ borderRadius: 3 }}
          >
            Tabla diaria
          </Button>
        </Stack>
      </Stack>

      <Grid
        container
        columns={{ xs: 2, sm: 4, md: 8, lg: 14 }}
        spacing={1}
        mb={1.25}
        mt={-2}
      >
        <KpiCard
          title="Stock carbón"
          value={`${formatTon(totals.carbon.stock)} t`}
          icon={<Inventory2 sx={{ fontSize: 18 }} />}
          tone="primary"
        />

        <KpiCard
          title="Stock madera"
          value={`${formatTon(totals.madera.stock)} t`}
          icon={<Forest sx={{ fontSize: 18 }} />}
          tone="success"
        />

        <KpiCard
          title="Entrada carbón"
          value={`${formatTon(totals.carbon.entradas)} t`}
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          tone="primary"
        />

        <KpiCard
          title="Entrada madera"
          value={`${formatTon(totals.madera.entradas)} t`}
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          tone="success"
        />

        <KpiCard
          title="Consumo carbón"
          value={`${formatTon(totals.carbon.salidas)} t`}
          icon={<TrendingDown sx={{ fontSize: 18 }} />}
          tone="warning"
        />

        <KpiCard
          title="Consumo madera"
          value={`${formatTon(totals.madera.salidas)} t`}
          icon={<TrendingDown sx={{ fontSize: 18 }} />}
          tone="warning"
        />

        <KpiCard
          title="Alertas mínimo"
          value={totals.alertas}
          icon={<WarningAmber sx={{ fontSize: 18 }} />}
          tone="error"
        />
      </Grid>

      <Card
        sx={{
          borderRadius: 4,
          boxShadow: "0 20px 60px rgba(15,23,42,.08)",
        }}
      >
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 2 }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab label="Dashboard" />
            <Tab label="Tabla diaria tipo Excel" />
            <Tab label="Movimientos" />
            <Tab label="Inventario" />
            <Tab label="Configuración carbones" />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Panel
                  title="Flujo diario del mes"
                  subtitle="Entradas, consumos y ajustes diarios separados por carbón y madera"
                >
                  <Box height={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailySeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />

                        <Area
                          type="monotone"
                          dataKey="entradaCarbon"
                          name="Entrada carbón"
                          fillOpacity={0.25}
                        />

                        <Area
                          type="monotone"
                          dataKey="entradaMadera"
                          name="Entrada madera"
                          fillOpacity={0.25}
                        />

                        <Area
                          type="monotone"
                          dataKey="consumoCarbon"
                          name="Consumo carbón"
                          fillOpacity={0.2}
                        />

                        <Area
                          type="monotone"
                          dataKey="consumoMadera"
                          name="Consumo madera"
                          fillOpacity={0.2}
                        />

                        <Area
                          type="monotone"
                          dataKey="ajusteCarbon"
                          name="Ajuste carbón"
                          fillOpacity={0.15}
                        />

                        <Area
                          type="monotone"
                          dataKey="ajusteMadera"
                          name="Ajuste madera"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Panel>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Panel
                  title="Stock por carbón"
                  subtitle="Inventario actual vs. umbral mínimo"
                >
                  <Box height={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={inventory}
                        layout="vertical"
                        margin={{ left: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="proveedor"
                          type="category"
                          width={120}
                        />
                        <RechartsTooltip />

                        <Bar
                          dataKey="actualTon"
                          name="Stock actual"
                          radius={[0, 8, 8, 0]}
                        />

                        <Bar
                          dataKey="stockMinimoTon"
                          name="Stock mínimo"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Panel>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <MonthlyExcelSheet
              monthKey={monthKey}
              setMonthKey={setMonthKey}
              rows={monthRows}
              carbons={activeCarbons}
              totals={monthlyTotals}
              onChange={handleSheetChange}
              onCreateCurrentMonth={handleCreateCurrentMonth}
              onCreateSelectedMonth={handleCreateSelectedMonth}
            />
          )}

          {tab === 2 && (
            <Stack gap={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                gap={2}
                alignItems={{ md: "center" }}
              >
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

                <Button
                  startIcon={<Add />}
                  variant="contained"
                  onClick={handleAddLegacyMovement}
                  sx={{ borderRadius: 3 }}
                >
                  Agregar
                </Button>
              </Stack>

              <MovementsTable
                rows={filteredMovements}
                onChange={handleLegacyMovementChange}
              />
            </Stack>
          )}

          {tab === 3 && <InventoryTable rows={inventory} />}

          {tab === 4 && (
            <CarbonSettings
              carbons={carbons}
              newCarbonName={newCarbonName}
              setNewCarbonName={setNewCarbonName}
              onAddCarbon={handleAddCarbon}
              onFieldChange={handleCarbonFieldChange}
              onToggleCarbon={handleToggleCarbon}
            />
          )}
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
    <Grid item xs={1} sm={1} md={2} lg={2}>
      <Card
        sx={{
          borderRadius: 3,
          height: "100%",
          boxShadow: "0 10px 26px rgba(15,23,42,.06)",
          border: "1px solid rgba(15,23,42,.06)",
        }}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                fontWeight={800}
                fontSize={11.5}
                noWrap
              >
                {title}
              </Typography>

              <Typography
                fontSize={18}
                lineHeight={1.1}
                fontWeight={900}
                mt={0.35}
                noWrap
              >
                {value}
              </Typography>
            </Box>

            <Box
              sx={{
                color: palette[tone],
                bgcolor: "rgba(15,23,42,.04)",
                width: 30,
                height: 30,
                minWidth: 30,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        p: 2.5,
        height: "100%",
      }}
    >
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

function CarbonSettings({
  carbons,
  newCarbonName,
  setNewCarbonName,
  onAddCarbon,
  onFieldChange,
  onToggleCarbon,
}) {
  const cellSx = {
    p: 0,
    "& .MuiInputBase-root": {
      borderRadius: 0,
      fontSize: 13,
      bgcolor: "white",
    },
    "& fieldset": {
      border: 0,
    },
    "& input": {
      px: 1.2,
      py: 1.1,
    },
  };

  return (
    <Stack gap={2}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={900}>
            Configuración de carbones y pesos por palada
          </Typography>

          <Typography color="text.secondary" fontSize={14}>
            CN es cargador nuevo y CV es cargador viejo. Desactivar un carbón
            solo lo oculta de la tabla actual; no borra datos guardados.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <TextField
            label="Nuevo carbón"
            value={newCarbonName}
            onChange={(event) => setNewCarbonName(event.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Inventory2 fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={onAddCarbon}
            sx={{ borderRadius: 3 }}
          >
            Crear carbón
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Carbón</TableCell>
              <TableCell align="right">Peso palada CV</TableCell>
              <TableCell align="right">Peso palada CN</TableCell>
              <TableCell align="right">Inventario inicial</TableCell>
              <TableCell align="right">Stock mínimo</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {carbons.map((carbon) => (
              <TableRow key={carbon.id} hover>
                <TableCell>
                  <Chip
                    label={carbon.active ? "Activo" : "Oculto"}
                    color={carbon.active ? "success" : "default"}
                    size="small"
                    variant={carbon.active ? "filled" : "outlined"}
                  />
                </TableCell>

                <TableCell sx={{ ...cellSx, minWidth: 180 }}>
                  <TextField
                    value={carbon.name}
                    onChange={(event) =>
                      onFieldChange(carbon.id, "name", event.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                </TableCell>

                <TableCell sx={cellSx} align="right">
                  <TextField
                    type="number"
                    value={carbon.weightCV}
                    onChange={(event) =>
                      onFieldChange(carbon.id, "weightCV", event.target.value)
                    }
                    fullWidth
                    size="small"
                    inputProps={{ step: "0.01" }}
                  />
                </TableCell>

                <TableCell sx={cellSx} align="right">
                  <TextField
                    type="number"
                    value={carbon.weightCN}
                    onChange={(event) =>
                      onFieldChange(carbon.id, "weightCN", event.target.value)
                    }
                    fullWidth
                    size="small"
                    inputProps={{ step: "0.01" }}
                  />
                </TableCell>

                <TableCell sx={cellSx} align="right">
                  <TextField
                    type="number"
                    value={carbon.initialTon}
                    onChange={(event) =>
                      onFieldChange(carbon.id, "initialTon", event.target.value)
                    }
                    fullWidth
                    size="small"
                    inputProps={{ step: "0.01" }}
                  />
                </TableCell>

                <TableCell sx={cellSx} align="right">
                  <TextField
                    type="number"
                    value={carbon.stockMinimoTon}
                    onChange={(event) =>
                      onFieldChange(
                        carbon.id,
                        "stockMinimoTon",
                        event.target.value
                      )
                    }
                    fullWidth
                    size="small"
                    inputProps={{ step: "0.01" }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Tooltip
                    title={
                      carbon.active
                        ? "Ocultar sin borrar histórico"
                        : "Reactivar carbón"
                    }
                  >
                    <IconButton onClick={() => onToggleCarbon(carbon.id)}>
                      {carbon.active ? <Archive /> : <Restore />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function MovementsTable({ rows, onChange }) {
  const cellSx = {
    p: 0,
    "& .MuiInputBase-root": {
      borderRadius: 0,
      fontSize: 13,
      bgcolor: "white",
    },
    "& fieldset": {
      border: 0,
    },
    "& input": {
      px: 1.2,
      py: 1.1,
    },
  };

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
              <TableCell sx={cellSx}>
                <TextField
                  type="date"
                  value={row.fecha}
                  onChange={(event) =>
                    onChange(row.id, "fecha", event.target.value)
                  }
                  fullWidth
                  size="small"
                />
              </TableCell>

              <TableCell>
                <Chip
                  icon={row.material === "Madera" ? <Forest /> : <Inventory2 />}
                  label={row.material}
                  size="small"
                />
              </TableCell>

              <TableCell>{row.proveedor}</TableCell>

              <TableCell>
                <Chip
                  label={row.tipo}
                  size="small"
                  color={
                    row.tipo === "Entrada"
                      ? "success"
                      : row.tipo === "Salida"
                        ? "warning"
                        : "default"
                  }
                  variant="outlined"
                />
              </TableCell>

              <TableCell align="right">
                {formatTon(row.cantidadTon)} t
              </TableCell>

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
            <TableCell>Carbón</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Inicial</TableCell>
            <TableCell align="right">Entradas</TableCell>
            <TableCell align="right">Salidas</TableCell>
            <TableCell align="right">Ajustes</TableCell>
            <TableCell align="right">Stock actual</TableCell>
            <TableCell>Cobertura</TableCell>
            <TableCell>Estado stock</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => {
            const isLow = row.actualTon < row.stockMinimoTon;

            return (
              <TableRow key={`${row.material}-${row.proveedor}`} hover>
                <TableCell>{row.material}</TableCell>
                <TableCell>{row.proveedor}</TableCell>

                <TableCell>
                  <Chip
                    label={row.active ? "Activo" : "Oculto"}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell align="right">
                  {formatTon(row.inicialTon)} t
                </TableCell>

                <TableCell align="right">
                  {formatTon(row.entradas)} t
                </TableCell>

                <TableCell align="right">
                  {formatTon(row.salidas)} t
                </TableCell>

                <TableCell align="right">
                  {formatTon(row.ajustes)} t
                </TableCell>

                <TableCell align="right">
                  <Typography fontWeight={900}>
                    {formatTon(row.actualTon)} t
                  </Typography>
                </TableCell>

                <TableCell sx={{ minWidth: 170 }}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={row.cobertura}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 99,
                      }}
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