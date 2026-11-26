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

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CategoryIcon from "@mui/icons-material/Category";
import BadgeIcon from "@mui/icons-material/Badge";

const API_URL = "https://ambiocomserver.onrender.com/api/proveedoreslogistica";

const TIPOS_PROVEEDOR = [
  "Materia Prima",
  "Transporte",
  "Servicios",
  "Mantenimiento",
  "Insumos",
  "Equipos",
  "Otro",
];

const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

const ProveedoresLogisticaPageDB = () => {
  const [proveedores, setProveedores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [form, setForm] = useState({
    proveedor: "",
    nit: "",
    contacto: "",
    telefono: "",
    emailContacto: "",
    tipoProveedor: "",
  });

  const getApiErrorMessage = (error) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Ocurrió un error inesperado."
    );
  };

  const fetchProveedores = async () => {
    try {
      const res = await axios.get(API_URL, {
        withCredentials: true,
      });

      setProveedores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los proveedores.",
      });

      setProveedores([]);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      proveedor: "",
      nit: "",
      contacto: "",
      telefono: "",
      emailContacto: "",
      tipoProveedor: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        proveedor: (form.proveedor ?? "").trim(),
        nit: (form.nit ?? "").trim(),
        contacto: (form.contacto ?? "").trim(),
        telefono: (form.telefono ?? "").trim(),
        emailContacto: (form.emailContacto ?? "").trim(),
        tipoProveedor: (form.tipoProveedor ?? "").trim(),
      };

      if (!payload.proveedor || !payload.tipoProveedor) {
        await Swal.fire({
          icon: "warning",
          title: "Campos obligatorios",
          text: "Debes diligenciar Proveedor y Tipo de proveedor.",
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
          ? "Proveedor actualizado correctamente."
          : "Proveedor registrado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      resetForm();
      fetchProveedores();
    } catch (error) {
      Swal.close();
      console.error("Error al guardar proveedor:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const handleEdit = (item) => {
    setForm({
      proveedor: item.proveedor ?? "",
      nit: item.nit ?? "",
      contacto: item.contacto ?? "",
      telefono: item.telefono ?? "",
      emailContacto: item.emailContacto ?? "",
      tipoProveedor: item.tipoProveedor ?? "",
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
        title: "¿Eliminar proveedor?",
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
        text: "Proveedor eliminado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });

      if (editingId === id) resetForm();

      fetchProveedores();
    } catch (error) {
      Swal.close();
      console.error("Error al eliminar proveedor:", error);

      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getApiErrorMessage(error),
      });
    }
  };

  const proveedoresFiltrados = useMemo(() => {
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (!q) return proveedores;

    return proveedores.filter((p) => {
      const proveedor = String(p.proveedor ?? "").toLowerCase();
      const nit = String(p.nit ?? "").toLowerCase();
      const contacto = String(p.contacto ?? "").toLowerCase();
      const telefono = String(p.telefono ?? "").toLowerCase();
      const emailContacto = String(p.emailContacto ?? "").toLowerCase();
      const tipoProveedor = String(p.tipoProveedor ?? "").toLowerCase();

      return (
        proveedor.includes(q) ||
        nit.includes(q) ||
        contacto.includes(q) ||
        telefono.includes(q) ||
        emailContacto.includes(q) ||
        tipoProveedor.includes(q)
      );
    });
  }, [proveedores, debouncedSearch]);

  const total = proveedores.length;
  const filtrados = proveedoresFiltrados.length;

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
                Gestión de Proveedores
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
              placeholder="Buscar por proveedor, NIT, contacto, teléfono, email o tipo..."
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

          <Grid container spacing={1.2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Proveedor"
                name="proveedor"
                value={form.proveedor}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="NIT"
                name="nit"
                value={form.nit}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.8}>
              <TextField
                fullWidth
                size="small"
                label="Contacto"
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Email"
                name="emailContacto"
                value={form.emailContacto}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.8}>
              <FormControl fullWidth size="small">
                <InputLabel id="tipoProveedor-label">Tipo</InputLabel>
                <Select
                  labelId="tipoProveedor-label"
                  name="tipoProveedor"
                  value={form.tipoProveedor}
                  label="Tipo"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>

                  {TIPOS_PROVEEDOR.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
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
                    await fetchProveedores();
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
                    "Proveedor",
                    "NIT",
                    "Contacto",
                    "Teléfono",
                    "Email",
                    "Tipo",
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
                {proveedoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography fontWeight={800}>No hay resultados</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearch
                          ? "Prueba cambiando el texto de búsqueda."
                          : "No hay proveedores registrados."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  proveedoresFiltrados.map((p) => (
                    <TableRow
                      key={p._id}
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
                      <TableCell
                        sx={{
                          maxWidth: 320,
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
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {p.proveedor || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <BadgeIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography variant="body2">
                            {p.nit || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon
                            fontSize="small"
                            sx={{ color: "#607D8B", flexShrink: 0 }}
                          />
                          <Typography variant="body2">
                            {p.contacto || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {p.telefono ? (
                          <Chip
                            size="small"
                            icon={<PhoneIcon />}
                            label={p.telefono}
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
                          maxWidth: 300,
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
                            {p.emailContacto || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          icon={<CategoryIcon />}
                          label={p.tipoProveedor || "-"}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
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
                          onClick={() => handleEdit(p)}
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
                          onClick={() => handleDelete(p._id)}
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

export default ProveedoresLogisticaPageDB;