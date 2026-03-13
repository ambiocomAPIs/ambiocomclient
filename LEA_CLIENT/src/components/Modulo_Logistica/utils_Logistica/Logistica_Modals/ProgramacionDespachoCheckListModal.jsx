import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const API_URL = "https://ambiocomserver.onrender.com/api/programaciondespacho";

const normalizeText = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const ChecklistDespachosModal = ({ open, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [savingIds, setSavingIds] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const [range, setRange] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;
    return { from: today, to: today };
  });

  const fetchProgramacion = async (customRange = range) => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/rango`, {
        params: {
          from: customRange.from,
          to: customRange.to,
        },
      });

      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando checklist:", error);
      setRows([]);
      setSnackbar({
        open: true,
        severity: "error",
        message: "No se pudo cargar la programación.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProgramacion(range);
    }
  }, [open]);

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleCumplido = async (row) => {
    const checked = !Boolean(row?.cumplido);

    if (savingIds[row._id]) return;

    setSavingIds((prev) => ({ ...prev, [row._id]: true }));

    // update optimista
    setRows((prev) =>
      prev.map((item) =>
        item._id === row._id ? { ...item, cumplido: checked } : item
      )
    );

    try {
      await axios.patch(`${API_URL}/${row._id}/cumplido`, {
        cumplido: checked,
      });

      setSnackbar({
        open: true,
        severity: "success",
        message: checked
          ? "Despacho marcado como cumplido."
          : "Despacho marcado como pendiente.",
      });
    } catch (error) {
      console.error("Error actualizando check:", error);

      // rollback
      setRows((prev) =>
        prev.map((item) =>
          item._id === row._id ? { ...item, cumplido: !checked } : item
        )
      );

      setSnackbar({
        open: true,
        severity: "error",
        message: "No se pudo actualizar el estado del despacho.",
      });
    } finally {
      setSavingIds((prev) => ({ ...prev, [row._id]: false }));
    }
  };

  const rowsFiltrados = useMemo(() => {
    const q = normalizeText(debouncedSearch).toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const searchable = [
        r.fecha,
        r.placa,
        r.trailer,
        r.conductor,
        r.transportadora,
        r.cliente,
        r.destino,
        r.producto,
        r.cantidad,
      ]
        .map((v) => normalizeText(v).toLowerCase())
        .join(" ");

      return searchable.includes(q);
    });
  }, [rows, debouncedSearch]);

  const total = rowsFiltrados.length;
  const cumplidos = rowsFiltrados.filter((r) => r?.cumplido).length;
  const pendientes = total - cumplidos;

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
          >
            <Typography variant="h5" fontWeight="bold">
              Checklist diario de despachos
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Total: ${total}`} />
              <Chip color="success" label={`Cumplidos: ${cumplidos}`} />
              <Chip color="warning" label={`Pendientes: ${pendientes}`} />
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              size="small"
              type="date"
              label="Desde"
              name="from"
              value={range.from}
              onChange={handleRangeChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="Hasta"
              name="to"
              value={range.to}
              onChange={handleRangeChange}
              InputLabelProps={{ shrink: true }}
            />

            <Button
              variant="contained"
              onClick={() => fetchProgramacion(range)}
              disabled={loading}
            >
              Consultar rango
            </Button>

            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, placa, destino, producto..."
              sx={{ minWidth: 320, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center">
                    <strong>Check</strong>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ minWidth: 110, whiteSpace: "nowrap" }}
                  >
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Placa</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Trailer</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Conductor</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Transportadora</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Destino</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Producto</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Cantidad</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : rowsFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      No hay despachos para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  rowsFiltrados.map((row) => (
                    <TableRow
                      key={row._id}
                      hover
                      sx={{
                        backgroundColor: row?.cumplido ? "#e8f5e9" : "inherit",
                      }}
                    >
                      <TableCell align="center">
                        <Checkbox
                          checked={Boolean(row?.cumplido)}
                          onChange={() => handleToggleCumplido(row)}
                          color="success"
                          disabled={Boolean(savingIds[row._id])}
                        />
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          minWidth: 110,
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {normalizeText(row.fecha)}
                      </TableCell>

                      <TableCell align="center">
                        {normalizeText(row.placa)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.trailer)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.conductor)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.transportadora)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.cliente)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.destino)}
                      </TableCell>
                      <TableCell align="center">
                        {normalizeText(row.producto)}
                      </TableCell>
                      <TableCell align="right">
                        {Number(row.cantidad || 0).toLocaleString("es-CO")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={1800}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChecklistDespachosModal;