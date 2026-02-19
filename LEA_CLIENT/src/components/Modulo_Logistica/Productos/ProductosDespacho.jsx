import React, { useEffect, useState } from "react";
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
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

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
    localStorage.removeItem(`${CACHE_PREFIX}productos`);  // esto limpia la caché cuando hay productos nuevos o editados y la actualiza
  } catch {}
};

const AlcoholesDespachoPage = () => {
  const [alcoholes, setAlcoholes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    tipoProducto: "",
    origen: "",
  });

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
      // Validación mínima
      if (!form.nombre.trim() || !form.tipoProducto.trim() || !form.origen.trim()) {
        console.warn("Completa todos los campos.");
        return;
      }

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }

      invalidateProductosCache();

      resetForm();
      fetchAlcoholes();
    } catch (error) {
      console.error("Error al guardar alcohol:", error);
    }
  };

  const handleEdit = (item) => {
    setForm({
      nombre: item.nombre ?? "",
      tipoProducto: item.tipoProducto ?? "",
      origen: item.origen ?? "",
    });
    setEditingId(item._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);

      invalidateProductosCache();

      fetchAlcoholes();
    } catch (error) {
      console.error("Error al eliminar alcohol:", error);
    }
  };

  return (
    <Box p={4} mt={5}>
      <Card elevation={4}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Gestión de Alcoholes
          </Typography>

          <Divider sx={{ mb: 3 }} />

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
              <Box display="flex" gap={2}>
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
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* TABLA */}
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Tipo producto</strong></TableCell>
                  <TableCell><strong>Origen</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {alcoholes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay alcoholes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  alcoholes.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.nombre}</TableCell>
                      <TableCell>{a.tipoProducto}</TableCell>
                      <TableCell>{a.origen}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleEdit(a)}>
                          <EditIcon />
                        </IconButton>

                        <IconButton color="error" onClick={() => handleDelete(a._id)}>
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
