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
  MenuItem,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const API_URL = "https://ambiocomserver.onrender.com/api/personal";

const AREA_ANALISTAS = "Laboratorio";
const AREA_LOGISTICA = "Logistica";
const AREAS = [AREA_ANALISTAS, AREA_LOGISTICA];

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const PersonalPageDespacho = () => {
  const [analistas, setAnalistas] = useState([]);
  const [logistica, setLogistica] = useState([]);

  const [formAnalista, setFormAnalista] = useState({
    nombres: "",
    area: AREA_ANALISTAS,
  });

  const [formLogistica, setFormLogistica] = useState({
    nombres: "",
    area: AREA_LOGISTICA,
  });

  // === estado de edición (UNO SOLO para ambas columnas)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombres: "", area: "" });

  // ==========================
  // BUSCADOR + CHIPS
  // ==========================
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const getApiErrorMessage = (error) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Ocurrió un error inesperado."
    );
  };

  // ==========================
  // TRAER TODO Y SEPARAR POR AREA
  // ==========================
  const fetchPersonal = async () => {
    try {
      const res = await axios.get(API_URL);
      const data = Array.isArray(res.data) ? res.data : [];

      setAnalistas(data.filter((p) => p.area === AREA_ANALISTAS));
      setLogistica(data.filter((p) => p.area === AREA_LOGISTICA));
    } catch (error) {
      console.error("Error al obtener personal:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el personal.",
      });

      setAnalistas([]);
      setLogistica([]);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const resetEdit = () => {
    setEditingId(null);
    setEditForm({ nombres: "", area: "" });
  };

  // ==========================
  // CREAR (POST)
  // ==========================
  const handleAddAnalista = async () => {
    try {
      // (no se elimina tu validación; se mantiene y se mejora con swal)
      if (!formAnalista.nombres.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obligatorio",
          text: "Debes diligenciar el nombre del analista.",
        });
        return;
      }

      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.post(API_URL, {
        nombres: formAnalista.nombres.trim(),
        area: AREA_ANALISTAS,
      });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Analista registrado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      setFormAnalista({ nombres: "", area: AREA_ANALISTAS });
      fetchPersonal();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar analista:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const handleAddLogistica = async () => {
    try {
      // (no se elimina tu validación; se mantiene y se mejora con swal)
      if (!formLogistica.nombres.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obligatorio",
          text: "Debes diligenciar el nombre del trabajador de logística.",
        });
        return;
      }

      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.post(API_URL, {
        nombres: formLogistica.nombres.trim(),
        area: AREA_LOGISTICA,
      });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: "Trabajador registrado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      setFormLogistica({ nombres: "", area: AREA_LOGISTICA });
      fetchPersonal();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar logística:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };

  // ==========================
  // EDITAR (GET row -> set edit)
  // ==========================
  const handleEdit = (row) => {
    setEditingId(row._id);
    setEditForm({
      nombres: row.nombres || "",
      area: row.area || "",
    });

    Swal.fire({
      icon: "info",
      title: "Modo edición",
      text: "Edita el registro y pulsa guardar.",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // ==========================
  // GUARDAR EDICIÓN (PUT)
  // ==========================
  const handleUpdate = async () => {
    try {
      if (!editingId) return;

      // (se respeta tu validación + se agregan alertas)
      if (!editForm.nombres.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obligatorio",
          text: "Debes diligenciar el nombre.",
        });
        return;
      }
      if (!editForm.area) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obligatorio",
          text: "Debes seleccionar el área.",
        });
        return;
      }

      Swal.fire({
        title: "Actualizando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.put(`${API_URL}/${editingId}`, {
        nombres: editForm.nombres.trim(),
        area: editForm.area,
      });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: "Registro actualizado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      resetEdit();
      fetchPersonal();
    } catch (error) {
      Swal.close();
      console.error("Error al actualizar:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: getApiErrorMessage(error),
      });
    }
  };

  // ==========================
  // ELIMINAR (DELETE)
  // ==========================
  const handleDelete = async (id) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar registro?",
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

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "Registro eliminado correctamente.",
        timer: 1200,
        showConfirmButton: false,
      });

      // Si borras el que estabas editando, cancela edición (esto ya lo tenías)
      if (editingId === id) resetEdit();
      fetchPersonal();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(error),
      });
    }
  };

  // ==========================
  // FILTRO (rápido) POR NOMBRE / ÁREA
  // ==========================
  const analistasFiltrados = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return analistas;

    return analistas.filter((p) => {
      const nombres = String(p.nombres ?? "").toLowerCase();
      const area = String(p.area ?? "").toLowerCase();
      return nombres.includes(q) || area.includes(q);
    });
  }, [analistas, debouncedSearch]);

  const logisticaFiltrada = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return logistica;

    return logistica.filter((p) => {
      const nombres = String(p.nombres ?? "").toLowerCase();
      const area = String(p.area ?? "").toLowerCase();
      return nombres.includes(q) || area.includes(q);
    });
  }, [logistica, debouncedSearch]);

  const total = analistas.length + logistica.length;
  const filtrados = analistasFiltrados.length + logisticaFiltrada.length;

  // Render fila (reutilizable para ambas tablas)
  const renderRow = (row) => {
    const isEditing = editingId === row._id;

    return (
      <TableRow key={row._id}>
        <TableCell>
          {isEditing ? (
            <TextField
              fullWidth
              size="small"
              value={editForm.nombres}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, nombres: e.target.value }))
              }
            />
          ) : (
            row.nombres
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              select
              fullWidth
              size="small"
              value={editForm.area}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, area: e.target.value }))
              }
            >
              {AREAS.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            row.area
          )}
        </TableCell>

        <TableCell align="center">
          {isEditing ? (
            <>
              <IconButton color="success" onClick={handleUpdate}>
                <SaveIcon />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={async () => {
                  resetEdit();
                  await Swal.fire({
                    icon: "info",
                    title: "Edición cancelada",
                    timer: 1200,
                    showConfirmButton: false,
                  });
                }}
              >
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton color="primary" onClick={() => handleEdit(row)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(row._id)}>
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

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
                Gestión de Personal
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
              placeholder="Buscar por nombres o área..."
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

          <Grid container spacing={4}>
            {/* ANALISTAS */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Analistas de Laboratorio
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    value={formAnalista.nombres}
                    onChange={(e) =>
                      setFormAnalista((prev) => ({
                        ...prev,
                        nombres: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAnalista}
                    disabled={!!editingId} // opcional: evita crear mientras editas
                  >
                    Agregar Analista
                  </Button>

                  {/* Botón refrescar (no cambia tu flujo; solo suma utilidad) */}
                  <Button
                    variant="text"
                    sx={{ ml: 1 }}
                    onClick={async () => {
                      await fetchPersonal();
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
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Nombres</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Área</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Acciones</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {analistasFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          {debouncedSearch
                            ? "No hay resultados para el filtro."
                            : "No hay analistas registrados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      analistasFiltrados.map(renderRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* LOGISTICA */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Trabajadores de Logística
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    value={formLogistica.nombres}
                    onChange={(e) =>
                      setFormLogistica((prev) => ({
                        ...prev,
                        nombres: e.target.value,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddLogistica}
                    disabled={!!editingId} // opcional
                  >
                    Agregar Trabajador
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Nombres</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Área</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Acciones</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {logisticaFiltrada.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          {debouncedSearch
                            ? "No hay resultados para el filtro."
                            : "No hay trabajadores registrados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      logisticaFiltrada.map(renderRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PersonalPageDespacho;