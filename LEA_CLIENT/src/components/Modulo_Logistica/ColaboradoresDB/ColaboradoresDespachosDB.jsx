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
  MenuItem,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = "https://ambiocomserver.onrender.com/api/personal";

const AREA_ANALISTAS = "Laboratorio";
const AREA_LOGISTICA = "Logistica";
const AREAS = [AREA_ANALISTAS, AREA_LOGISTICA];

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
      if (!formAnalista.nombres.trim()) return;

      await axios.post(API_URL, {
        nombres: formAnalista.nombres.trim(),
        area: AREA_ANALISTAS,
      });

      setFormAnalista({ nombres: "", area: AREA_ANALISTAS });
      fetchPersonal();
    } catch (error) {
      console.error("Error al guardar analista:", error);
    }
  };

  const handleAddLogistica = async () => {
    try {
      if (!formLogistica.nombres.trim()) return;

      await axios.post(API_URL, {
        nombres: formLogistica.nombres.trim(),
        area: AREA_LOGISTICA,
      });

      setFormLogistica({ nombres: "", area: AREA_LOGISTICA });
      fetchPersonal();
    } catch (error) {
      console.error("Error al guardar logística:", error);
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
  };

  // ==========================
  // GUARDAR EDICIÓN (PUT)
  // ==========================
  const handleUpdate = async () => {
    try {
      if (!editingId) return;
      if (!editForm.nombres.trim()) return;
      if (!editForm.area) return;

      await axios.put(`${API_URL}/${editingId}`, {
        nombres: editForm.nombres.trim(),
        area: editForm.area,
      });

      resetEdit();
      fetchPersonal();
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // ==========================
  // ELIMINAR (DELETE)
  // ==========================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      // Si borras el que estabas editando, cancela edición
      if (editingId === id) resetEdit();
      fetchPersonal();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

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
              <IconButton color="inherit" onClick={resetEdit}>
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
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Gestión de Personal
          </Typography>

          <Divider sx={{ mb: 3 }} />

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
                    {analistas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No hay analistas registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      analistas.map(renderRow)
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
                    {logistica.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No hay trabajadores registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      logistica.map(renderRow)
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