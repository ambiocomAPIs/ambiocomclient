import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ForestOutlinedIcon from "@mui/icons-material/ForestOutlined";

const toSafeNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const formatTon = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(toSafeNumber(value));

const formatPercent = (value) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(toSafeNumber(value));

const normalizeDateKey = (value) => String(value || "").slice(0, 10);

const headerCellSx = {
  bgcolor: "#0f172a",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
  borderBottom: "1px solid #334155",
};

const bodyCellSx = {
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: "nowrap",
  borderBottom: "1px solid #e2e8f0",
};

const footerCellSx = {
  ...bodyCellSx,
  bgcolor: "#e2e8f0",
  color: "#0f172a",
  fontWeight: 950,
};

function ResumenPatioCarbonModal({
  open,
  onClose,
  rows = [],
  carbonItems = [],
  showBagazo = false,
  footerMixTotals = {},
  dateRange = { desde: "", hasta: "" },
}) {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.entradaCarbon += toSafeNumber(row.totalEntradaCarbon);
        acc.entradaMadera += toSafeNumber(row.totalEntradaMadera);
        acc.entradaBagazo += toSafeNumber(row.totalEntradaBagazo);
        acc.consumoCarbon += toSafeNumber(row.totalCarbon);
        acc.consumoMadera += toSafeNumber(row.totalMadera);
        acc.consumoBagazo += toSafeNumber(row.totalBagazo);
        acc.consumoTotal += toSafeNumber(row.totalConsumo);
        acc.tolvas += toSafeNumber(row.totalTolvas);
        acc.finalCarbon = toSafeNumber(row.totalFinalCarbon);
        acc.finalMadera = toSafeNumber(row.totalFinalMadera);
        acc.finalBagazo = toSafeNumber(row.totalFinalBagazo);
        acc.finalTotal = toSafeNumber(row.totalFinal);
        return acc;
      },
      {
        entradaCarbon: 0,
        entradaMadera: 0,
        entradaBagazo: 0,
        consumoCarbon: 0,
        consumoMadera: 0,
        consumoBagazo: 0,
        consumoTotal: 0,
        tolvas: 0,
        finalCarbon: 0,
        finalMadera: 0,
        finalBagazo: 0,
        finalTotal: 0,
      }
    );
  }, [rows]);

  const materialCount = carbonItems.length;
  const desde = normalizeDateKey(dateRange?.desde) || "Sin fecha inicial";
  const hasta = normalizeDateKey(dateRange?.hasta) || "Sin fecha final";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(15,23,42,0.35)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          bgcolor: "#0f172a",
          color: "#ffffff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ px: 3, py: 2.2 }}
        >
          <Box>
            <Typography sx={{ fontSize: 19, fontWeight: 950, lineHeight: 1.1 }}>
              Resumen patio carbón, madera y tolvas
            </Typography>
            <Typography sx={{ mt: 0.6, fontSize: 12.5, color: "#cbd5e1", fontWeight: 700 }}>
              Rango consultado: {desde} a {hasta}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
            <Chip
              icon={<Inventory2OutlinedIcon />}
              label={`${rows.length} día(s)`}
              sx={{ bgcolor: "#e0f2fe", color: "#075985", fontWeight: 900 }}
            />
            <Chip
              icon={<LocalFireDepartmentOutlinedIcon />}
              label={`${materialCount} material(es)`}
              sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 900 }}
            />
            <IconButton onClick={onClose} sx={{ color: "#ffffff" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#f8fafc", p: 2.4 }}>
        <Stack direction="row" gap={1.2} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            icon={<LocalFireDepartmentOutlinedIcon />}
            label={`Entrada carbón: ${formatTon(totals.entradaCarbon)} t`}
            sx={{ bgcolor: "#dbeafe", color: "#1e3a8a", fontWeight: 900 }}
          />
          <Chip
            icon={<ForestOutlinedIcon />}
            label={`Entrada madera: ${formatTon(totals.entradaMadera)} t`}
            sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 900 }}
          />
          {showBagazo && (
            <Chip
              label={`Entrada bagazo: ${formatTon(totals.entradaBagazo)} t`}
              sx={{ bgcolor: "#fed7aa", color: "#9a3412", fontWeight: 900 }}
            />
          )}
          <Chip
            label={`Consumo total: ${formatTon(totals.consumoTotal)} t`}
            sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 900 }}
          />
          <Chip
            label={`Inventario final: ${formatTon(totals.finalTotal)} t`}
            sx={{ bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 900 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            border: "1px solid #cbd5e1",
            maxHeight: "66vh",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Fecha</TableCell>
                <TableCell align="right" sx={headerCellSx}>Entrada carbón</TableCell>
                <TableCell align="right" sx={headerCellSx}>Entrada madera</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={headerCellSx}>Entrada bagazo</TableCell>
                )}
                <TableCell align="right" sx={headerCellSx}>Consumo carbón</TableCell>
                <TableCell align="right" sx={headerCellSx}>Consumo madera</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={headerCellSx}>Consumo bagazo</TableCell>
                )}
                <TableCell align="right" sx={headerCellSx}>% carbón</TableCell>
                <TableCell align="right" sx={headerCellSx}>% madera</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={headerCellSx}>% bagazo</TableCell>
                )}
                <TableCell align="right" sx={headerCellSx}>Tolvas</TableCell>
                <TableCell align="right" sx={headerCellSx}>Inv. final carbón</TableCell>
                <TableCell align="right" sx={headerCellSx}>Inv. final madera</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={headerCellSx}>Inv. final bagazo</TableCell>
                )}
                <TableCell align="right" sx={headerCellSx}>Inv. final total</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showBagazo ? 15 : 12} align="center" sx={{ py: 5, fontWeight: 900, color: "#64748b" }}>
                    No hay registros para resumir en el rango consultado.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id || row.fecha} hover>
                    <TableCell sx={bodyCellSx}>{normalizeDateKey(row.fecha)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalEntradaCarbon)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalEntradaMadera)}</TableCell>
                    {showBagazo && (
                      <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalEntradaBagazo)}</TableCell>
                    )}
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalCarbon)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalMadera)}</TableCell>
                    {showBagazo && (
                      <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalBagazo)}</TableCell>
                    )}
                    <TableCell align="right" sx={bodyCellSx}>{formatPercent(row.carbonPercent)}%</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatPercent(row.maderaPercent)}%</TableCell>
                    {showBagazo && (
                      <TableCell align="right" sx={bodyCellSx}>{formatPercent(row.bagazoPercent)}%</TableCell>
                    )}
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalTolvas)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalFinalCarbon)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalFinalMadera)}</TableCell>
                    {showBagazo && (
                      <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalFinalBagazo)}</TableCell>
                    )}
                    <TableCell align="right" sx={bodyCellSx}>{formatTon(row.totalFinal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell sx={footerCellSx}>Acumulado</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.entradaCarbon)}</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.entradaMadera)}</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={footerCellSx}>{formatTon(totals.entradaBagazo)}</TableCell>
                )}
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.consumoCarbon)}</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.consumoMadera)}</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={footerCellSx}>{formatTon(totals.consumoBagazo)}</TableCell>
                )}
                <TableCell align="right" sx={footerCellSx}>{formatPercent(footerMixTotals.carbonPercent)}%</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatPercent(footerMixTotals.maderaPercent)}%</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={footerCellSx}>{formatPercent(footerMixTotals.bagazoPercent)}%</TableCell>
                )}
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.tolvas)}</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.finalCarbon)}</TableCell>
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.finalMadera)}</TableCell>
                {showBagazo && (
                  <TableCell align="right" sx={footerCellSx}>{formatTon(totals.finalBagazo)}</TableCell>
                )}
                <TableCell align="right" sx={footerCellSx}>{formatTon(totals.finalTotal)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(ResumenPatioCarbonModal);
