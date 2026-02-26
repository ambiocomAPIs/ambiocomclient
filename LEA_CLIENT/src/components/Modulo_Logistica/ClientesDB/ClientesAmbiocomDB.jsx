import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const API_URL = "https://ambiocomserver.onrender.com/api/clienteslogistica";

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const ClientesDespachoPageDB = () => {
  const [clientes, setClientes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // buscador
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    comercial: "",
    cliente: "",
    tipoOH: "",
    incoterm: "",
  });

  // ===============================
  // OBTENER CLIENTES
  // ===============================
  const fetchClientes = async () => {
    try {
      const res = await axios.get(API_URL);
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      setClientes([]);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // ===============================
  // FORM HANDLERS
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      comercial: "",
      cliente: "",
      tipoOH: "",
      incoterm: "",
    });
    setEditingId(null);
  };

  // ===============================
  // CREAR / ACTUALIZAR
  // ===============================
  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }

      resetForm();
      fetchClientes();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    }
  };

  const handleEdit = (item) => {
    setForm({
      comercial: item.comercial ?? "",
      cliente: item.cliente ?? "",
      tipoOH: item.tipoOH ?? "",
      incoterm: item.incoterm ?? "",
    });
    setEditingId(item._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchClientes();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
    }
  };

  // ===============================
  // FILTRO BUSCADOR (rápido)
  // ===============================
  const clientesFiltrados = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return clientes;

    return clientes.filter((c) => {
      const comercial = String(c.comercial ?? "").toLowerCase();
      const cliente = String(c.cliente ?? "").toLowerCase();
      const tipoOH = String(c.tipoOH ?? "").toLowerCase();
      const incoterm = String(c.incoterm ?? "").toLowerCase();

      return (
        comercial.includes(q) ||
        cliente.includes(q) ||
        tipoOH.includes(q) ||
        incoterm.includes(q)
      );
    });
  }, [clientes, debouncedSearch]);

  const total = clientes.length;
  const filtrados = clientesFiltrados.length;

  return (
    <Box p={{ xs: 2, md: 4 }} mt={5}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          {/* Header */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Gestión de Clientes Logistica
              </Typography>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip size="small" label={`Total Data: ${total}`} />
                <Chip
                  size="small"
                  color={debouncedSearch ? "primary" : "default"}
                  label={`Data Filtrada: ${filtrados}`}
                />
                {debouncedSearch && (
                  <Chip size="small" label={`Filtro: "${debouncedSearch}"`} />
                )}
              </Stack>
            </Box>

            {/* Buscador */}
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por comercial, cliente, tipo OH o incoterm..."
              size="small"
              sx={{ minWidth: { xs: "100%", md: 420 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearch("")}
                      aria-label="Limpiar búsqueda"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* FORMULARIO */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Comercial"
                name="comercial"
                value={form.comercial}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Cliente"
                name="cliente"
                value={form.cliente}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tipo OH"
                name="tipoOH"
                value={form.tipoOH}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Incoterm"
                name="incoterm"
                value={form.incoterm}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color={editingId ? "warning" : "primary"}
                  startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSubmit}
                >
                  {editingId ? "Actualizar" : "Registrar"}
                </Button>

                {editingId && (
                  <Button variant="outlined" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}

                <Button variant="text" onClick={fetchClientes}>
                  Refrescar
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* TABLA */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Comercial</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Tipo OH</strong></TableCell>
                  <TableCell><strong>Incoterm</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">
                        No hay resultados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay clientes registrados."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((c) => (
                    <TableRow key={c._id} hover>
                      <TableCell>{c.comercial}</TableCell>
                      <TableCell sx={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.cliente}
                      </TableCell>
                      <TableCell>{c.tipoOH}</TableCell>
                      <TableCell>{c.incoterm}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleEdit(c)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(c._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientesDespachoPageDB;