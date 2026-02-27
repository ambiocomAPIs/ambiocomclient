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
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const API_URL = "https://ambiocomserver.onrender.com/api/alcoholesdespacho";

const CACHE_PREFIX = "despacho_catalogo_";

const loadCacheMeta = (key) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return { data: [], updatedAt: 0 };

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return { data: parsed, updatedAt: 0 };

    return {
      data: Array.isArray(parsed?.data) ? parsed.data : [],
      updatedAt: parsed?.updatedAt ?? 0,
      etag: parsed?.etag ?? null,
    };
  } catch {
    return { data: [], updatedAt: 0 };
  }
};

const saveCacheMeta = (key, payload) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (e) {
    console.warn("No se pudo guardar cache", key, e);
  }
};

const mapProductosToOptions = (arr) =>
  (arr ?? [])
    .map((p) => String(p?.tipoProducto ?? "").trim())
    .filter(Boolean)
    .map((tipoProducto) => ({ value: tipoProducto, label: tipoProducto }));

const updateProductosCacheFromList = (alcoholesList) => {
  const productos = mapProductosToOptions(alcoholesList);
  saveCacheMeta("productos", { data: productos, updatedAt: Date.now() });
};

const invalidateProductosCache = () => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}productos`); // esto limpia la caché cuando hay productos nuevos o editados y la actualiza
  } catch {}
};

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const AlcoholesDespachoPage = () => {
  const [alcoholes, setAlcoholes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // buscador
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    nombre: "",
    tipoProducto: "",
    origen: "",
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
  // OBTENER ALCOHOLES
  // ===============================
  const fetchAlcoholes = async () => {
    try {
      const res = await axios.get(API_URL);
      const list = Array.isArray(res.data) ? res.data : [];
      setAlcoholes(list);

      updateProductosCacheFromList(list);
    } catch (error) {
      console.error("Error al obtener alcoholes:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los alcoholes.",
      });

      setAlcoholes([]);
    }
  };

  useEffect(() => {
    const cached = loadCacheMeta("productos").data;
    if (!cached.length) {
      fetchAlcoholes();
      return;
    }
    fetchAlcoholes();
  }, []);

  // ===============================
  // FORM HANDLERS
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      tipoProducto: "",
      origen: "",
    });
    setEditingId(null);
  };

  // ===============================
  // CREAR / ACTUALIZAR
  // ===============================
  const handleSubmit = async () => {
    try {
      // Validación mínima (se respeta tu lógica, pero con swal)
      if (
        !form.nombre.trim() ||
        !form.tipoProducto.trim() ||
        !form.origen.trim()
      ) {
        await Swal.fire({
          icon: "warning",
          title: "Campos obligatorios",
          text: "Debes diligenciar Nombre, Tipo de producto y Origen.",
        });
        console.warn("Completa todos los campos.");
        return;
      }

      Swal.fire({
        title: editingId ? "Actualizando..." : "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }

      invalidateProductosCache();

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: editingId
          ? "Alcohol actualizado correctamente."
          : "Alcohol registrado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      resetForm();
      fetchAlcoholes();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar alcohol:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const handleEdit = (item) => {
    setForm({
      nombre: item.nombre ?? "",
      tipoProducto: item.tipoProducto ?? "",
      origen: item.origen ?? "",
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
        title: "¿Eliminar alcohol?",
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

      await axios.delete(`${API_URL}/${id}`);

      invalidateProductosCache();

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "Alcohol eliminado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      if (editingId === id) resetForm();

      fetchAlcoholes();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar alcohol:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(error),
      });
    }
  };

  // ===============================
  // FILTRO BUSCADOR (rápido)
  // ===============================
  const alcoholesFiltrados = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return alcoholes;

    return alcoholes.filter((a) => {
      const nombre = String(a.nombre ?? "").toLowerCase();
      const tipoProducto = String(a.tipoProducto ?? "").toLowerCase();
      const origen = String(a.origen ?? "").toLowerCase();
      return (
        nombre.includes(q) || tipoProducto.includes(q) || origen.includes(q)
      );
    });
  }, [alcoholes, debouncedSearch]);

  const total = alcoholes.length;
  const filtrados = alcoholesFiltrados.length;

  return (
    <Box p={4} mt={5}>
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
                Gestión de Alcoholes
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

            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, tipo de producto u origen..."
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

          <Divider sx={{ mb: 3, mt: 3 }} />

          {/* FORMULARIO */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tipo de producto"
                name="tipoProducto"
                value={form.tipoProducto}
                onChange={handleChange}
                placeholder="Ej: Ron, Whisky, Cerveza..."
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Origen"
                name="origen"
                value={form.origen}
                onChange={handleChange}
                placeholder="Ej: Colombia, México, Escocia..."
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
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      resetForm();
                      await Swal.fire({
                        icon: "info",
                        title: "Edición cancelada",
                        timer: 1200,
                        showConfirmButton: false,
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                )}

                <Button
                  variant="text"
                  onClick={async () => {
                    await fetchAlcoholes();
                    Swal.fire({
                      icon: "success",
                      title: "Actualizado",
                      text: "Datos refrescados.",
                      timer: 1200,
                      showConfirmButton: false,
                    });
                  }}
                >
                  Refrescar
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* TABLA */}
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>
                    <strong>Nombre</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tipo producto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Origen</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {alcoholesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight="bold">No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay alcoholes registrados."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  alcoholesFiltrados.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.nombre}</TableCell>
                      <TableCell>{a.tipoProducto}</TableCell>
                      <TableCell>{a.origen}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(a)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => handleDelete(a._id)}
                        >
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

export default AlcoholesDespachoPage;