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

const API_URL = "https://ambiocomserver.onrender.com/api/empresas";

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nombreTransportadora: "",
    locacion: "",
    despachosProgramados: "",
    despachosCompletados: "",
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
      console.error("Error al obtener empresas:", error);
      setEmpresas([]);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // ===============================
  // HANDLERS
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      nombreTransportadora: "",
      locacion: "",
      despachosProgramados: "",
      despachosCompletados: "",
      contactoTelefonico: "",
      emailContacto: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }

      resetForm();
      fetchEmpresas();
    } catch (error) {
      console.error("Error al guardar empresa:", error);
    }
  };

  const handleEdit = (empresa) => {
    setForm({
      nombreTransportadora: empresa.nombreTransportadora,
      locacion: empresa.locacion,
      despachosProgramados: empresa.despachosProgramados,
      despachosCompletados: empresa.despachosCompletados,
      contactoTelefonico: empresa.contactoTelefonico,
      emailContacto: empresa.emailContacto,
    });

    setEditingId(empresa._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchEmpresas();
    } catch (error) {
      console.error("Error al eliminar empresa:", error);
    }
  };

  return (
    <Box p={4} mt={5}>
      <Card elevation={4}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Gestión de Transportadoras
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* FORMULARIO */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre Transportadora"
                name="nombreTransportadora"
                value={form.nombreTransportadora}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Locación / Origen"
                name="locacion"
                value={form.locacion}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Despachos Programados"
                name="despachosProgramados"
                value={form.despachosProgramados}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Despachos Completados"
                name="despachosCompletados"
                value={form.despachosCompletados}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contacto Telefónico"
                name="contactoTelefonico"
                value={form.contactoTelefonico}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="email"
                label="Email de Contacto"
                name="emailContacto"
                value={form.emailContacto}
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
                  <TableCell><strong>Empresa</strong></TableCell>
                  <TableCell><strong>Locación</strong></TableCell>
                  <TableCell><strong>Programados</strong></TableCell>
                  <TableCell><strong>Completados</strong></TableCell>
                  <TableCell><strong>Teléfono</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay Transportadoras registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((e) => (
                    <TableRow key={e._id}>
                      <TableCell>{e.nombreTransportadora}</TableCell>
                      <TableCell>{e.locacion}</TableCell>
                      <TableCell>{e.despachosProgramados}</TableCell>
                      <TableCell>{e.despachosCompletados}</TableCell>
                      <TableCell>{e.contactoTelefonico}</TableCell>
                      <TableCell>{e.emailContacto}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(e)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => handleDelete(e._id)}
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

export default EmpresasPage;
