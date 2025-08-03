import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, AddCircleOutline } from "@mui/icons-material";
import axios from "axios";
import Swal from "sweetalert2";
import TanquesModal from "../utils/modals/Tanques/TanquesModal";
import TanqueVisualModal from "../utils/modals/Tanques/TanqueVisualModal";

const TanquesList = () => {
  const [tanques, setTanques] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTanque, setSelectedTanque] = useState(null);
  const [visualModalOpen, setVisualModalOpen] = useState(false);
  const [tanqueSeleccionadoVisual, setTanqueSeleccionadoVisual] = useState("");

  const fetchTanques = async () => {
    try {
      const res = await axios.get("https://ambiocomserver.onrender.com/api/tanques");
      setTanques(res.data);
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar los tanques", "error");
    }
  };

  useEffect(() => {
    fetchTanques();
  }, []);

  const handleCreate = () => {
    setSelectedTanque(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (data._id) {
        await axios.put(`https://ambiocomserver.onrender.com/api/tanques/${data._id}`, data);
        Swal.fire("Actualizado", "Tanque actualizado correctamente", "success");
      } else {
        await axios.post("https://ambiocomserver.onrender.com/api/tanques", data);
        Swal.fire("Creado", "Tanque registrado correctamente", "success");
      }
      fetchTanques();
    } catch (error) {
      if (error.response?.status === 400) {
        Swal.fire("Error", error.response.data.error, "error");
      } else {
        Swal.fire("Error", "No se pudo guardar el tanque", "error");
      }
    } finally {
      setModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`https://ambiocomserver.onrender.com/api/tanques/${id}`);
        Swal.fire("Eliminado", "Tanque eliminado correctamente", "success");
        fetchTanques();
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el tanque", "error");
      }
    }
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mt={5}>
        <Typography variant="h4" fontWeight="bold" color="primary.dark" align="left" sx={{ flex: 1 }}>
          Gestión de Tanques
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={handleCreate}
        >
          Nuevo Tanque
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Disposición</strong></TableCell>
              <TableCell><strong>Factor</strong></TableCell>
              <TableCell><strong>Volumen Total</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tanques.map((t) => (
              <TableRow
                key={t._id}
                hover
                sx={{
                  transition: "background-color 0.2s",
                  "&:hover": { backgroundColor: "#fafafa" },
                }}
              >
                <TableCell
                  onDoubleClick={() => {
                    setTanqueSeleccionadoVisual(t.NombreTanque);
                    setVisualModalOpen(true);
                  }}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  {t.NombreTanque}
                </TableCell>
                <TableCell>{t.Disposicion}</TableCell>
                <TableCell>{t.Factor}</TableCell>
                <TableCell>
                  {t.VolumenTotal
                    ? Number(t.VolumenTotal).toLocaleString("es-CO") + " L"
                    : "N/A"}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedTanque(t);
                        setModalOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(t._id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {tanques.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No hay tanques registrados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TanquesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTanque}
      />

      <TanqueVisualModal
        open={visualModalOpen}
        onClose={() => setVisualModalOpen(false)}
        nombreTanque={tanqueSeleccionadoVisual}
      />
    </Box>
  );
};

export default TanquesList;
