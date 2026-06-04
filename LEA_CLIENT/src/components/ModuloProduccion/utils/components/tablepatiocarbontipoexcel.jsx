import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  Inventory2,
  LocalFireDepartment,
  Save,
  TrendingUp,
} from "@mui/icons-material";

export const formatTon = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export const getMonthDays = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${monthKey}-${day}`;
  });
};

export const createBlankDailyRow = (date, activeCarbons) => ({
  id: date,
  fecha: date,
  tolvaPrincipal: "",
  tolvasAuxiliares: "",
  observacion: "",
  carbons: activeCarbons.reduce((acc, carbon) => {
    acc[carbon.id] = {
      inicial: "",
      entrada: "",
      paladasCV: "",
      paladasCN: "",
      ajuste: "",
    };
    return acc;
  }, {}),
});

export const createMonthlySheet = (monthKey, activeCarbons) =>
  getMonthDays(monthKey).map((date) => createBlankDailyRow(date, activeCarbons));

export const normalizeMonthlyRows = (rows, carbons) =>
  rows.map((row) => ({
    ...row,
    carbons: carbons.reduce((acc, carbon) => {
      acc[carbon.id] = row.carbons?.[carbon.id] || {
        inicial: "",
        entrada: "",
        paladasCV: "",
        paladasCN: "",
        ajuste: "",
      };
      return acc;
    }, {}),
  }));

export const calculateDailyCarbon = (data, carbon) => {
  const entrada = Number(data?.entrada || 0);
  const inicial = Number(data?.inicial || 0);
  const paladasCV = Number(data?.paladasCV || 0);
  const paladasCN = Number(data?.paladasCN || 0);
  const ajuste = Number(data?.ajuste || 0);
  const salida = paladasCV * Number(carbon.weightCV || 0) + paladasCN * Number(carbon.weightCN || 0);
  const final = inicial + entrada + ajuste - salida;

  return { inicial, entrada, paladasCV, paladasCN, ajuste, salida, final };
};

export const calculateMonthlyTotals = (rows, activeCarbons) =>
  rows.reduce(
    (acc, row) => {
      activeCarbons.forEach((carbon) => {
        const result = calculateDailyCarbon(row.carbons?.[carbon.id], carbon);
        acc.entradas += result.entrada;
        acc.salidas += result.salida;
        acc.ajustes += result.ajuste;
        acc.inventarioFinal += result.final;
        acc.paladasCV += result.paladasCV;
        acc.paladasCN += result.paladasCN;
      });
      return acc;
    },
    { entradas: 0, salidas: 0, ajustes: 0, inventarioFinal: 0, paladasCV: 0, paladasCN: 0 }
  );

const inputBaseStyle = {
  width: "100%",
  height: 32,
  border: 0,
  outline: "none",
  background: "white",
  fontSize: 12,
  boxSizing: "border-box",
};

const ExcelInput = React.memo(function ExcelInput({
  value,
  onChange,
  type = "text",
  placeholder = "",
  align = "right",
  step,
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      step={step}
      onChange={(event) => onChange(event.target.value)}
      style={{
        ...inputBaseStyle,
        textAlign: align,
        padding: align === "right" ? "0 8px 0 4px" : "0 8px",
      }}
    />
  );
});

function MonthlyExcelSheet({
  monthKey,
  setMonthKey,
  rows,
  carbons,
  totals,
  onChange,
  onCreateCurrentMonth,
  onCreateSelectedMonth,
}) {
  const calculatedRows = useMemo(() => {
    let consumoAcumulado = 0;

    return rows.map((row) => {
      let totalEntradas = 0;
      let totalConsumo = 0;
      let totalAjustes = 0;
      let totalFinal = 0;
      const carbonResults = {};

      carbons.forEach((carbon) => {
        const result = calculateDailyCarbon(row.carbons?.[carbon.id], carbon);
        carbonResults[carbon.id] = result;
        totalEntradas += result.entrada;
        totalConsumo += result.salida;
        totalAjustes += result.ajuste;
        totalFinal += result.final;
      });

      consumoAcumulado += totalConsumo;

      return {
        ...row,
        carbonResults,
        totalEntradas,
        totalConsumo,
        totalAjustes,
        totalFinal,
        consumoAcumulado,
      };
    });
  }, [rows, carbons]);

  const footerCarbonTotals = useMemo(() => {
    return carbons.reduce((acc, carbon) => {
      acc[carbon.id] = rows.reduce(
        (carbonAcc, row) => {
          const result = calculateDailyCarbon(row.carbons?.[carbon.id], carbon);
          carbonAcc.inicial += result.inicial;
          carbonAcc.entrada += result.entrada;
          carbonAcc.paladasCV += result.paladasCV;
          carbonAcc.paladasCN += result.paladasCN;
          carbonAcc.salida += result.salida;
          carbonAcc.final += result.final;
          return carbonAcc;
        },
        { inicial: 0, entrada: 0, paladasCV: 0, paladasCN: 0, salida: 0, final: 0 }
      );

      return acc;
    }, {});
  }, [rows, carbons]);

  const cellSx = {
    p: 0,
    borderColor: "#d7deea",
  };

  const fixedCellSx = {
    ...cellSx,
  };

  return (
    <Stack gap={2}>
      <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={900}>
            Registro diario mensual tipo Excel
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Las columnas de tolvas y acumulados son fijas. Los bloques de carbón se crean desde configuración y se pueden ocultar sin borrar histórico.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }}>
          <TextField
            type="month"
            label="Mes"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button startIcon={<Save />} variant="outlined" onClick={onCreateSelectedMonth} sx={{ borderRadius: 3 }}>
            Crear mes seleccionado
          </Button>
          <Button startIcon={<Add />} variant="contained" onClick={onCreateCurrentMonth} sx={{ borderRadius: 3 }}>
            Crear mes actual
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip icon={<Inventory2 />} label={`Entradas: ${formatTon(totals.entradas)} t`} />
        <Chip icon={<LocalFireDepartment />} label={`Consumo: ${formatTon(totals.salidas)} t`} />
        <Chip icon={<TrendingUp />} label={`Ajustes: ${formatTon(totals.ajustes)} t`} />
        <Chip label={`Paladas CV: ${formatNumber(totals.paladasCV)}`} />
        <Chip label={`Paladas CN: ${formatNumber(totals.paladasCN)}`} />
      </Stack>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 4,
          maxHeight: 620,
          borderColor: "#cbd5e1",
          overflow: "auto",
          "& th": {
            bgcolor: "#eef3f8",
            fontWeight: 900,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            position: "sticky",
            top: 0,
            zIndex: 3,
            borderColor: "#cbd5e1",
          },
          "& td": { minWidth: 100, borderColor: "#d7deea" },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ left: 0, zIndex: 5, bgcolor: "#e2e8f0", minWidth: 120 }}>
                Fecha
              </TableCell>
              <TableCell colSpan={2} align="center" sx={{ bgcolor: "#dbeafe" }}>
                Tolvas fijas
              </TableCell>
              {carbons.map((carbon) => (
                <TableCell key={carbon.id} colSpan={6} align="center" sx={{ bgcolor: "#dcfce7" }}>
                  {carbon.name}
                </TableCell>
              ))}
              <TableCell colSpan={6} align="center" sx={{ bgcolor: "#fef3c7" }}>
                Cálculos acumulados
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Tolva principal</TableCell>
              <TableCell>Tolvas auxiliares</TableCell>
              {carbons.map((carbon) => (
                <React.Fragment key={`${carbon.id}-headers`}>
                  <TableCell align="right">Inicial</TableCell>
                  <TableCell align="right">Entrada</TableCell>
                  <TableCell align="right">Paladas CV</TableCell>
                  <TableCell align="right">Paladas CN</TableCell>
                  <TableCell align="right">Consumo</TableCell>
                  <TableCell align="right">Final</TableCell>
                </React.Fragment>
              ))}
              <TableCell align="right">Total entradas</TableCell>
              <TableCell align="right">Total consumo</TableCell>
              <TableCell align="right">Total ajustes</TableCell>
              <TableCell align="right">Inv. final día</TableCell>
              <TableCell align="right">Consumo acumulado</TableCell>
              <TableCell>Observaciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {calculatedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 900, left: 0, position: "sticky", zIndex: 2 }}>
                  {row.fecha}
                </TableCell>

                <TableCell sx={{ ...fixedCellSx, minWidth: 150 }}>
                  <ExcelInput
                    value={row.tolvaPrincipal}
                    align="left"
                    placeholder="Principal"
                    onChange={(value) => onChange(row.id, ["tolvaPrincipal"], value)}
                  />
                </TableCell>

                <TableCell sx={{ ...fixedCellSx, minWidth: 170 }}>
                  <ExcelInput
                    value={row.tolvasAuxiliares}
                    align="left"
                    placeholder="Auxiliares"
                    onChange={(value) => onChange(row.id, ["tolvasAuxiliares"], value)}
                  />
                </TableCell>

                {carbons.map((carbon) => {
                  const data = row.carbons?.[carbon.id] || {};
                  const result = row.carbonResults?.[carbon.id] || calculateDailyCarbon(data, carbon);

                  return (
                    <React.Fragment key={`${row.id}-${carbon.id}`}>
                      <TableCell sx={cellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="0.01"
                          value={data.inicial}
                          onChange={(value) => onChange(row.id, ["carbons", carbon.id, "inicial"], value)}
                        />
                      </TableCell>
                      <TableCell sx={cellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="0.01"
                          value={data.entrada}
                          onChange={(value) => onChange(row.id, ["carbons", carbon.id, "entrada"], value)}
                        />
                      </TableCell>
                      <TableCell sx={cellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="1"
                          value={data.paladasCV}
                          onChange={(value) => onChange(row.id, ["carbons", carbon.id, "paladasCV"], value)}
                        />
                      </TableCell>
                      <TableCell sx={cellSx} align="right">
                        <ExcelInput
                          type="number"
                          step="1"
                          value={data.paladasCN}
                          onChange={(value) => onChange(row.id, ["carbons", carbon.id, "paladasCN"], value)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: "#f8fafc", fontWeight: 800 }}>
                        {formatTon(result.salida)}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: "#f8fafc", fontWeight: 900 }}>
                        {formatTon(result.final)}
                      </TableCell>
                    </React.Fragment>
                  );
                })}

                <TableCell align="right" sx={{ bgcolor: "#fff7ed", fontWeight: 900 }}>
                  {formatTon(row.totalEntradas)}
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#fff7ed", fontWeight: 900 }}>
                  {formatTon(row.totalConsumo)}
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#fff7ed", fontWeight: 900 }}>
                  {formatTon(row.totalAjustes)}
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#fff7ed", fontWeight: 900 }}>
                  {formatTon(row.totalFinal)}
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: "#fff7ed", fontWeight: 900 }}>
                  {formatTon(row.consumoAcumulado)}
                </TableCell>
                <TableCell sx={{ ...fixedCellSx, minWidth: 260 }}>
                  <ExcelInput
                    value={row.observacion}
                    align="left"
                    placeholder="Notas del día"
                    onChange={(value) => onChange(row.id, ["observacion"], value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} sx={{ fontWeight: 900, bgcolor: "#f8fafc", position: "sticky", left: 0, zIndex: 2 }}>
                Totales del mes
              </TableCell>

              {carbons.map((carbon) => {
                const carbonTotals = footerCarbonTotals[carbon.id] || {
                  inicial: 0,
                  entrada: 0,
                  paladasCV: 0,
                  paladasCN: 0,
                  salida: 0,
                  final: 0,
                };

                return (
                  <React.Fragment key={`${carbon.id}-footer`}>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatTon(carbonTotals.inicial)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatTon(carbonTotals.entrada)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatNumber(carbonTotals.paladasCV)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatNumber(carbonTotals.paladasCN)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatTon(carbonTotals.salida)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                      {formatTon(carbonTotals.final)}
                    </TableCell>
                  </React.Fragment>
                );
              })}

              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                {formatTon(totals.entradas)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                {formatTon(totals.salidas)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                {formatTon(totals.ajustes)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                {formatTon(totals.inventarioFinal)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "#f8fafc" }}>
                {formatTon(totals.salidas)}
              </TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc" }} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default React.memo(MonthlyExcelSheet);
