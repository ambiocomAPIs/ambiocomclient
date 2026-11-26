import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import ExcelDownloadButton from "../../../utils/Export_Data_General/ExcelDownloadData";

import Autocomplete from "@mui/material/Autocomplete";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";

const API_URL = "https://ambiocomserver.onrender.com/api/clienteslogistica";
const API_TIPO_OH_URL = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";

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
  const [tiposOH, setTiposOH] = useState([]);

  // buscador
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    comercial: "",
    cliente: "",
    tipoOH: "",
    incoterm: "",
  });

  const getApiErrorMessage = (error) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Ocurrió un error inesperado."
    );
  };

  // ===============================
  // OBTENER CLIENTES
  // ===============================
  const fetchClientes = async () => {
    try {
      const res = await axios.get(API_URL, {
        withCredentials: true,
      });
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener clientes:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los clientes.",
      });

      setClientes([]);
    }
  };

  const fetchTiposOH = async () => {
    try {
      const res = await axios.get(API_TIPO_OH_URL);
      setTiposOH(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener tipos OH:", error);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchTiposOH();
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
      const payload = {
        comercial: (form.comercial ?? "").trim(),
        cliente: (form.cliente ?? "").trim(),
        tipoOH: (form.tipoOH ?? "").trim(),
        incoterm: (form.incoterm ?? "").trim(),
      };

      // Validación mínima (sin cambiar estilos)
      if (!payload.comercial || !payload.cliente) {
        await Swal.fire({
          icon: "warning",
          title: "Campos obligatorios",
          text: "Debes diligenciar Comercial y Cliente.",
        });
        return;
      }

      Swal.fire({
        title: editingId ? "Actualizando..." : "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(API_URL, payload, {
          withCredentials: true,
        });
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: editingId
          ? "Cliente actualizado correctamente."
          : "Cliente registrado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      resetForm();
      fetchClientes();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar cliente:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
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

    Swal.fire({
      icon: "info",
      title: "Modo edición",
      text: "Edita el registro y pulsa Actualizar.",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleDelete = async (id) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar cliente?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
      });

      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.delete(`${API_URL}/${id}`, {
        withCredentials: true,
      });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "Cliente eliminado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      // si estabas editando el mismo registro, resetea
      if (editingId === id) resetForm();

      fetchClientes();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar cliente:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const comercialesOptions = useMemo(() => {
    const unicos = [];
    const vistos = new Set();

    clientes.forEach((c) => {
      const valorOriginal = String(c.comercial ?? "").trim();
      if (!valorOriginal) return;

      const clave = valorOriginal.toLowerCase();
      if (!vistos.has(clave)) {
        vistos.add(clave);
        unicos.push(valorOriginal);
      }
    });

    return unicos.sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [clientes]);

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

  const dataExcel = useMemo(() => {
    return clientesFiltrados.map((c) => ({
      Comercial: c.comercial ?? "",
      Cliente: c.cliente ?? "",
      "Tipo OH": c.tipoOH ?? "",
      Incoterm: c.incoterm ?? "",
    }));
  }, [clientesFiltrados]);

  return (
    <Box p={0} mt={5}>
      <Card elevation={4}>
        <CardContent>
          {/* Header + chips + buscador */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Gestión de Clientes Logística
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

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexDirection: { xs: "column", md: "row" },
                width: { xs: "100%", md: "auto" },
              }}
            >
              <ExcelDownloadButton
                data={dataExcel}
                filename="Clientes_Logistica.xlsx"
                sheetName="Clientes"
                buttonText="Exportar Excel"
                size="small"
                variant="contained"
                color="success"
              />

              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por comercial, cliente, tipo OH o incoterm..."
                size="small"
                sx={{ minWidth: { xs: "100%", md: 520 } }}
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
            {/* <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por comercial, cliente, tipo OH o incoterm..."
              size="small"
              sx={{ minWidth: { xs: "100%", md: 520 } }}
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
            /> */}
          </Box>

          <Divider sx={{ mb: 3, mt: 3 }} />

          {/* FORMULARIO */}
          <Grid container spacing={1.2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.3}>
              <Autocomplete
                fullWidth
                freeSolo
                size="small"
                options={comercialesOptions}
                value={form.comercial || ""}
                onChange={(_, newValue) => {
                  setForm((prev) => ({
                    ...prev,
                    comercial: typeof newValue === "string" ? newValue : "",
                  }));
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === "input") {
                    setForm((prev) => ({
                      ...prev,
                      comercial: newInputValue,
                    }));
                  }

                  if (reason === "clear") {
                    setForm((prev) => ({
                      ...prev,
                      comercial: "",
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Comercial"
                    name="comercial"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                label="Cliente"
                name="cliente"
                value={form.cliente}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.3}>
              <FormControl fullWidth size="small">
                <InputLabel id="tipooh-label">Tipo OH</InputLabel>
                <Select
                  labelId="tipooh-label"
                  name="tipoOH"
                  value={form.tipoOH}
                  label="Tipo OH"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione un tipo OH</em>
                  </MenuItem>

                  {tiposOH.map((item) => (
                    <MenuItem
                      key={item._id}
                      value={item.tipoProducto || item.nombre}
                    >
                      {item.tipoProducto || item.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={1.8}>
              <TextField
                fullWidth
                size="small"
                label="Incoterm"
                name="incoterm"
                value={form.incoterm}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3.1}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  color={editingId ? "warning" : "primary"}
                  startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSubmit}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {editingId ? "Actualizar" : "Registrar"}
                </Button>

                {editingId && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      resetForm();
                      await Swal.fire({
                        icon: "info",
                        title: "Edición cancelada",
                        timer: 1200,
                        showConfirmButton: false,
                      });
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    Cancelar
                  </Button>
                )}

                <Button
                  variant="text"
                  size="small"
                  onClick={async () => {
                    await fetchClientes();
                    Swal.fire({
                      icon: "success",
                      title: "Actualizado",
                      text: "Datos refrescados.",
                      timer: 1200,
                      showConfirmButton: false,
                    });
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Refrescar
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* TABLA */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              maxHeight: "68vh",
              borderRadius: 3,
              border: "1px solid #DDE3EA",
              overflow: "auto",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Comercial",
                    "Cliente",
                    "Tipo OH",
                    "Incoterm",
                    "Acciones",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      align={head === "Acciones" ? "center" : "left"}
                      sx={{
                        backgroundColor: "#1A237E",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.4px",
                        py: 1.2,
                        borderBottom: "none",
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={800}>No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay clientes registrados."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((c) => (
                    <TableRow
                      key={c._id}
                      hover
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "#F8FAFC",
                        },
                        "&:hover": {
                          backgroundColor: "#EAF4FF",
                        },
                        "& td": {
                          py: 1.1,
                          borderBottom: "1px solid #ECEFF1",
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon
                            fontSize="small"
                            sx={{ color: "#607D8B" }}
                          />
                          <Typography sx={{ fontWeight: 800 }}>
                            {c.comercial || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 520,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <BusinessIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {c.cliente || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={c.tipoOH || "-"}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={c.incoterm || "-"}
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          sx={{
                            color: "#1565C0",
                            backgroundColor: "#E3F2FD",
                            mr: 0.8,
                            "&:hover": {
                              backgroundColor: "#BBDEFB",
                            },
                          }}
                          onClick={() => handleEdit(c)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          sx={{
                            color: "#C62828",
                            backgroundColor: "#FFEBEE",
                            "&:hover": {
                              backgroundColor: "#FFCDD2",
                            },
                          }}
                          onClick={() => handleDelete(c._id)}
                        >
                          <DeleteIcon fontSize="small" />
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