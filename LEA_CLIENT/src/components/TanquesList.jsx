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
  TextField,
} from "@mui/material";
import { Edit, Delete, AddCircleOutline, SortByAlpha } from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
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
  const [operacionEjecutada, setOperacionEjecutada] = useState("");

  // 🔹 Nuevo estado para filtro y orden
  const [search, setSearch] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);

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
      const { _id, ...dataLimpia } = data;

      if (data._id && operacionEjecutada === "update") {
        await axios.put(`https://ambiocomserver.onrender.com/api/tanques/${data._id}`, data);
        Swal.fire("Actualizado", "Tanque actualizado correctamente", "success");
      } else {
        await axios.post("https://ambiocomserver.onrender.com/api/tanques", dataLimpia);
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

  // 🔹 Filtro + Ordenamiento
  const tanquesFiltrados = tanques
    .filter((t) =>
      t.NombreTanque.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      ordenAsc
        ? a.NombreTanque.localeCompare(b.NombreTanque, "es", { numeric: true })
        : b.NombreTanque.localeCompare(a.NombreTanque, "es", { numeric: true })
    );

  return (
    <Box p={4}>
      {/* Header con título + acciones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mt={5}>
        <Typography variant="h4" fontWeight="bold" color="primary.dark">
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

      {/* 🔹 Filtro y Orden */}
      <Box display="flex" gap={2} alignItems="center" mb={3}>
        <Autocomplete
          options={tanques.map((t) => `TK-${t.NombreTanque}`)}
          onInputChange={(e, value) => setSearch(value.replace("TK-", ""))}
          renderInput={(params) => (
            <TextField {...params} label="Buscar Tanque" variant="outlined" />
          )}
          sx={{ flex: 1 }}
        />
        <Tooltip title={`Ordenar ${ordenAsc ? "Z → A" : "A → Z"}`}>
          <IconButton
            color="primary"
            onClick={() => setOrdenAsc(!ordenAsc)}
            sx={{ border: "1px solid #ccc" }}
          >
            <SortByAlpha />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabla */}
      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: 3,
          maxHeight: "calc(100vh - 200px)",
          overflow: "auto",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
              <TableCell align="center" colSpan={2}><strong>Información</strong></TableCell>
              <TableCell align="center" colSpan={2}><strong>Factores</strong></TableCell>
              <TableCell align="center" colSpan={2}><strong>Volumen</strong></TableCell>
              <TableCell align="center" rowSpan={2}><strong>Acciones</strong></TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {[
                "Nombre del Tanque",
                "Disposición [Uso Actual]",
                "Factor [L/m]",
                "Factor [L/cm]",
                "Volumen Total [L]",
                "Volumen Total [m³]",
              ].map((text, i) => (
                <TableCell align="center" key={i}><strong>{text}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {tanquesFiltrados.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell
                  align="center"
                  onDoubleClick={() => {
                    setTanqueSeleccionadoVisual(t.NombreTanque);
                    setVisualModalOpen(true);
                  }}
                  sx={{
                    cursor: "pointer",
                    color: "#1976d2",
                    fontWeight: 600,
                    textDecoration: "underline",
                    "&:hover": { color: "#004ba0" },
                  }}
                >
                  TK-{t.NombreTanque}
                </TableCell>
                <TableCell align="center">{t.Disposicion}</TableCell>
                <TableCell align="center">{t.Factor}</TableCell>
                <TableCell align="center">{t.Factor / 100}</TableCell>
                <TableCell align="center">{t.VolumenTotal ? `${t.VolumenTotal} L` : "N/A"}</TableCell>
                <TableCell align="center">
                  {t.VolumenTotal ? `${(t.VolumenTotal / 1000).toFixed(2)} m³` : "N/A"}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedTanque(t);
                        setOperacionEjecutada("update");
                        setModalOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => handleDelete(t._id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {tanquesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron tanques.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modales */}
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
