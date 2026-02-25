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

const API_URL = "https://ambiocomserver.onrender.com/api/conductores";

const ConductoresPage = () => {
  const [conductores, setConductores] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    placaVehiculo: "",
    empresa: "",
    carroseria: "",
  });

  // ===============================
  // OBTENER CONDUCTORES
  // ===============================
  const fetchConductores = async () => {
    try {
      const res = await axios.get(API_URL);
      setConductores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener conductores:", error);
      setConductores([]);
    }
  };

  useEffect(() => {
    fetchConductores();
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
      fetchConductores();
    } catch (error) {
      console.error("Error al guardar conductor:", error);
    }
  };

  const handleEdit = (conductor) => {
    setForm({
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      placaVehiculo: conductor.placaVehiculo,
      empresa: conductor.empresa,
      carroseria: conductor.carroseria,
    });
    setEditingId(conductor._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchConductores();
    } catch (error) {
      console.error("Error al eliminar conductor:", error);
    }
  };

  return (
    <Box p={4} mt={5}>
      <Card elevation={4}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Gestión de Conductores
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* FORMULARIO */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombres"
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Apellidos"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Placa Vehículo"
                name="placaVehiculo"
                value={form.placaVehiculo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Empresa"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Carrocería"
                name="carroseria"
                value={form.carroseria}
                onChange={handleChange}
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
                  <TableCell><strong>Nombres</strong></TableCell>
                  <TableCell><strong>Apellidos</strong></TableCell>
                  <TableCell><strong>Placa</strong></TableCell>
                  <TableCell><strong>Empresa</strong></TableCell>
                  <TableCell><strong>Carrocería</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {conductores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay conductores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  conductores.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>{c.nombres}</TableCell>
                      <TableCell>{c.apellidos}</TableCell>
                      <TableCell>{c.placaVehiculo}</TableCell>
                      <TableCell>{c.empresa}</TableCell>
                      <TableCell>{c.carroseria}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(c)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => handleDelete(c._id)}
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

export default ConductoresPage;
