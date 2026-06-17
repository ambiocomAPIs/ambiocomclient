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
import ScienceIcon from "@mui/icons-material/Science";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BadgeIcon from "@mui/icons-material/Badge";

const API_URL = "https://ambiocomserver.onrender.com/api/personal";

const AREA_ANALISTAS = "Laboratorio";
const AREA_LOGISTICA = "Logistica";
const AREAS = [AREA_ANALISTAS, AREA_LOGISTICA];

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

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombres: "", area: "" });

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

  const handleAddAnalista = async () => {
    try {
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

  const handleUpdate = async () => {
    try {
      if (!editingId) return;

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

  const renderRow = (row) => {
    const isEditing = editingId === row._id;

    return (
      <TableRow
        key={row._id}
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
            <Box display="flex" alignItems="center" gap={1}>
              <BadgeIcon fontSize="small" sx={{ color: "#607D8B" }} />
              <Typography sx={{ fontWeight: 800 }}>
                {row.nombres || "-"}
              </Typography>
            </Box>
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
            <Chip
              size="small"
              label={row.area || "-"}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          )}
        </TableCell>

        <TableCell align="center">
          {isEditing ? (
            <>
              <IconButton
                size="small"
                sx={{
                  color: "#2E7D32",
                  backgroundColor: "#E8F5E9",
                  mr: 0.8,
                  "&:hover": {
                    backgroundColor: "#C8E6C9",
                  },
                }}
                onClick={handleUpdate}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: "#455A64",
                  backgroundColor: "#ECEFF1",
                  "&:hover": {
                    backgroundColor: "#CFD8DC",
                  },
                }}
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
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
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
                onClick={() => handleEdit(row)}
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
                onClick={() => handleDelete(row._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box p={0} mt={5}>
      <Card elevation={4}>
        <CardContent>
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

          <Divider sx={{ mb: 3, mt: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #DDE3EA",
                  backgroundColor: "#FFFFFF",
                  height: "100%",
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  mb={2}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScienceIcon sx={{ color: "#1A237E" }} />
                    <Typography variant="h6" fontWeight={800}>
                      Analistas de Laboratorio
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={`${analistasFiltrados.length} registros`}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Grid container spacing={1.2} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      size="small"
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

                  <Grid item xs={12} md={5}>
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
                        startIcon={<AddIcon />}
                        onClick={handleAddAnalista}
                        disabled={!!editingId}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        Agregar
                      </Button>

                      <Button
                        variant="text"
                        size="small"
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
                        sx={{ textTransform: "none" }}
                      >
                        Refrescar
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    mt: 2,
                    maxHeight: "60vh",
                    borderRadius: 3,
                    border: "1px solid #DDE3EA",
                    overflow: "auto",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {["Nombres", "Área", "Acciones"].map((head) => (
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
                      {analistasFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                            <Typography fontWeight={800}>
                              No hay resultados
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {debouncedSearch
                                ? "No hay resultados para el filtro."
                                : "No hay analistas registrados"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        analistasFiltrados.map(renderRow)
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #DDE3EA",
                  backgroundColor: "#FFFFFF",
                  height: "100%",
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  mb={2}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalShippingIcon sx={{ color: "#1A237E" }} />
                    <Typography variant="h6" fontWeight={800}>
                      Trabajadores de Logística
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={`${logisticaFiltrada.length} registros`}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Grid container spacing={1.2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      size="small"
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

                  <Grid item xs={12} md={4}>
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
                        startIcon={<AddIcon />}
                        onClick={handleAddLogistica}
                        disabled={!!editingId}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        Agregar
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    mt: 2,
                    maxHeight: "60vh",
                    borderRadius: 3,
                    border: "1px solid #DDE3EA",
                    overflow: "auto",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {["Nombres", "Área", "Acciones"].map((head) => (
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
                      {logisticaFiltrada.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                            <Typography fontWeight={800}>
                              No hay resultados
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {debouncedSearch
                                ? "No hay resultados para el filtro."
                                : "No hay trabajadores registrados"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        logisticaFiltrada.map(renderRow)
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PersonalPageDespacho;