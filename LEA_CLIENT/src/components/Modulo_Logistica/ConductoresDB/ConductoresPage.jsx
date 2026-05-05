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
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PhoneIcon from "@mui/icons-material/Phone";

const API_URL = "https://ambiocomserver.onrender.com/api/conductores";

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const ConductoresPage = () => {
  const [conductores, setConductores] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [transportadoras, setTransportadoras] = useState([]);

  // buscador
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    placaVehiculo: "",
    empresa: "",
    carroseria: "",
    contacto: "",
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
  // OBTENER CONDUCTORES
  // ===============================
  const fetchConductores = async () => {
    try {
      const res = await axios.get(API_URL);
      setConductores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener conductores:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los conductores.",
      });

      setConductores([]);
    }
  };

  const fetchTransportadoras = async () => {
    try {
      const res = await axios.get(
        "https://ambiocomserver.onrender.com/api/transportadoraslogistica"
      );
      setTransportadoras(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener transportadoras:", error);
    }
  };

  useEffect(() => {
    fetchConductores();
    fetchTransportadoras();
  }, []);

  // ===============================
  // FORM HANDLERS
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      nombres: "",
      apellidos: "",
      placaVehiculo: "",
      empresa: "",
      carroseria: "",
      contacto: "",
    });
    setEditingId(null);
  };

  // ===============================
  // CREAR / ACTUALIZAR
  // ===============================
  const handleSubmit = async () => {
    try {
      const payload = {
        nombres: (form.nombres ?? "").trim(),
        apellidos: (form.apellidos ?? "").trim(),
        placaVehiculo: (form.placaVehiculo ?? "").trim(),
        empresa: (form.empresa ?? "").trim(),
        carroseria: (form.carroseria ?? "").trim(),
        contacto: (form.contacto ?? "").trim(),
      };

      // Validación mínima (como en los otros módulos)
      if (!payload.nombres || !payload.apellidos) {
        await Swal.fire({
          icon: "warning",
          title: "Campos obligatorios",
          text: "Debes diligenciar Nombres y Apellidos.",
        });
        return;
      }

      Swal.fire({
        title: editingId ? "Actualizando..." : "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: editingId
          ? "Conductor actualizado correctamente."
          : "Conductor registrado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      resetForm();
      fetchConductores();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar conductor:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const handleEdit = (conductor) => {
    setForm({
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      placaVehiculo: conductor.placaVehiculo,
      empresa: conductor.empresa,
      carroseria: conductor.carroseria,
      contacto: conductor.contacto || "",
    });
    setEditingId(conductor._id);

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
        title: "¿Eliminar conductor?",
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
        text: "Conductor eliminado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      // Si estabas editando el mismo registro, resetea (patrón igual al resto)
      if (editingId === id) resetForm();

      fetchConductores();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar conductor:", error);

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
  const conductoresFiltrados = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return conductores;

    return conductores.filter((c) => {
      const nombres = String(c.nombres ?? "").toLowerCase();
      const apellidos = String(c.apellidos ?? "").toLowerCase();
      const placa = String(c.placaVehiculo ?? "").toLowerCase();
      const empresa = String(c.empresa ?? "").toLowerCase();
      const carroseria = String(c.carroseria ?? "").toLowerCase();
      const contacto = String(c.contacto ?? "").toLowerCase();

      return (
        nombres.includes(q) ||
        apellidos.includes(q) ||
        placa.includes(q) ||
        empresa.includes(q) ||
        carroseria.includes(q) ||
        contacto.includes(q)
      );
    });
  }, [conductores, debouncedSearch]);

  const total = conductores.length;
  const filtrados = conductoresFiltrados.length;

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
                Gestión de Conductores
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
              placeholder="Buscar por nombres, apellidos, placa, empresa o carrocería..."
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

          {/* FORMULARIO */}
          <Grid container spacing={1.2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Nombres"
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Apellidos"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Placa"
                name="placaVehiculo"
                value={form.placaVehiculo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="empresa-label">Transportadora</InputLabel>
                <Select
                  labelId="empresa-label"
                  name="empresa"
                  value={form.empresa}
                  label="Transportadora"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>

                  {transportadoras.map((t) => (
                    <MenuItem key={t._id} value={t.nombreTransportadora}>
                      {t.nombreTransportadora}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Carrocería"
                name="carroseria"
                value={form.carroseria}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Contacto"
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
                placeholder="3001234567"
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: 0.5,
                  justifyContent: "flex-start",
                  alignItems: "center",
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
                    await fetchConductores();
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
                    "Conductor",
                    "Placa",
                    "Transportadora",
                    "Carrocería",
                    "Contacto",
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
                {conductoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={800}>No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay conductores registrados."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  conductoresFiltrados.map((c) => {
                    const nombreCompleto = `${c.nombres || ""} ${
                      c.apellidos || ""
                    }`.trim();

                    return (
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
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                              {nombreCompleto || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {c._id?.slice(-6) || "-"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={c.placaVehiculo || "-"}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalShippingIcon
                              fontSize="small"
                              sx={{ color: "#607D8B" }}
                            />
                            <Typography variant="body2">
                              {c.empresa || "-"}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>{c.carroseria || "-"}</TableCell>

                        <TableCell>
                          {c.contacto ? (
                            <Tooltip title="Contacto registrado">
                              <Chip
                                size="small"
                                icon={<PhoneIcon />}
                                label={c.contacto}
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </Tooltip>
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Sin contacto
                            </Typography>
                          )}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConductoresPage;