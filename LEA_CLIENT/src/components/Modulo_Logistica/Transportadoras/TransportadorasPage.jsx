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
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PlaceIcon from "@mui/icons-material/Place";

const API_URL = "https://ambiocomserver.onrender.com/api/transportadoraslogistica";

// Debounce simple sin librerías
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const TransportadorasLogisticaPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // buscador
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    nombreTransportadora: "",
    locacion: "",
    contactoTelefonico: "",
    emailContacto: "",
  });

  // ===============================
  // OBTENER EMPRESAS
  // ===============================
  const fetchEmpresas = async () => {
    try {
      const res = await axios.get(API_URL);
      setEmpresas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener transportadoras:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las transportadoras.",
      });
      setEmpresas([]);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // ===============================
  // FORM HANDLERS
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      nombreTransportadora: "",
      locacion: "",
      contactoTelefonico: "",
      emailContacto: "",
    });
    setEditingId(null);
  };

  const getApiErrorMessage = (error) => {
    // intenta leer mensaje del backend
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Ocurrió un error inesperado.";
    return String(msg);
  };

  // ===============================
  // CREAR / ACTUALIZAR
  // ===============================
  const handleSubmit = async () => {
    try {
      const payload = {
        nombreTransportadora: form.nombreTransportadora.trim(),
        locacion: form.locacion.trim(),
        contactoTelefonico: form.contactoTelefonico.trim(),
        emailContacto: form.emailContacto.trim(),
      };

      if (!payload.nombreTransportadora || !payload.locacion) {
        await Swal.fire({
          icon: "warning",
          title: "Campos obligatorios",
          text: "Debes diligenciar Nombre Transportadora y Locación.",
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
          ? "Transportadora actualizada correctamente."
          : "Transportadora registrada correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });

      resetForm();
      fetchEmpresas();
    } catch (error) {
      Swal.close();
      const msg = getApiErrorMessage(error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: msg,
      });

      console.error(
        "Error al guardar transportadora:",
        error?.response?.data ?? error
      );
    }
  };

  const handleEdit = (empresa) => {
    setForm({
      nombreTransportadora: empresa.nombreTransportadora ?? "",
      locacion: empresa.locacion ?? "",
      contactoTelefonico: empresa.contactoTelefonico ?? "",
      emailContacto: empresa.emailContacto ?? "",
    });

    setEditingId(empresa._id);

    Swal.fire({
      icon: "info",
      title: "Modo edición",
      text: "Edita los campos y luego pulsa Actualizar.",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleDelete = async (id) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar transportadora?",
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
        title: "Eliminada",
        text: "Transportadora eliminada correctamente.",
        timer: 1400,
        showConfirmButton: false,
      });

      // si estabas editando el mismo registro, resetea
      if (editingId === id) resetForm();

      fetchEmpresas();
    } catch (error) {
      Swal.close();
      const msg = getApiErrorMessage(error);

      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: msg,
      });

      console.error(
        "Error al eliminar transportadora:",
        error?.response?.data ?? error
      );
    }
  };

  // ===============================
  // FILTRO BUSCADOR (rápido)
  // ===============================
  const empresasFiltradas = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return empresas;

    return empresas.filter((e) => {
      const nombre = String(e.nombreTransportadora ?? "").toLowerCase();
      const loc = String(e.locacion ?? "").toLowerCase();
      const tel = String(e.contactoTelefonico ?? "").toLowerCase();
      const mail = String(e.emailContacto ?? "").toLowerCase();

      return (
        nombre.includes(q) ||
        loc.includes(q) ||
        tel.includes(q) ||
        mail.includes(q)
      );
    });
  }, [empresas, debouncedSearch]);

  const total = empresas.length;
  const filtradas = empresasFiltradas.length;

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
                Gestión de Transportadoras Logística
              </Typography>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip size="small" label={`Total Data: ${total}`} />
                <Chip
                  size="small"
                  color={debouncedSearch ? "primary" : "default"}
                  label={`Data Filtrada: ${filtradas}`}
                />
                {debouncedSearch && (
                  <Chip size="small" label={`Filtro: "${debouncedSearch}"`} />
                )}
              </Stack>
            </Box>

            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, locación, teléfono o email..."
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
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                label="Nombre Transportadora"
                name="nombreTransportadora"
                value={form.nombreTransportadora}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Locación / Origen"
                name="locacion"
                value={form.locacion}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Contacto Telefónico"
                name="contactoTelefonico"
                value={form.contactoTelefonico}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.3}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Email de Contacto"
                name="emailContacto"
                value={form.emailContacto}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={3.2}>
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
                    onClick={() => {
                      resetForm();
                      Swal.fire({
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
                    await fetchEmpresas();
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
                    "Transportadora",
                    "Locación",
                    "Teléfono",
                    "Email",
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
                {empresasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={800}>No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay transportadoras registradas."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  empresasFiltradas.map((e) => (
                    <TableRow
                      key={e._id}
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
                          <LocalShippingIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography sx={{ fontWeight: 800 }}>
                            {e.nombreTransportadora || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PlaceIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography variant="body2">
                            {e.locacion || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {e.contactoTelefonico ? (
                          <Chip
                            size="small"
                            icon={<PhoneIcon />}
                            label={e.contactoTelefonico}
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin teléfono
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 320,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {e.emailContacto || "-"}
                          </Typography>
                        </Box>
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
                          onClick={() => handleEdit(e)}
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
                          onClick={() => handleDelete(e._id)}
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

export default TransportadorasLogisticaPage;