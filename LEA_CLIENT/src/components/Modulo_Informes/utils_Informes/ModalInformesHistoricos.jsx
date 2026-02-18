import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import Swal from "sweetalert2";
import { exportarInformeAlcoholesPDF } from "./GenerarPdfInformeAlcoholes";

const ModalInformesHistoricos = ({ open, onClose }) => {
  const [historicos, setHistoricos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Nuevo estado para el filtro seleccionado
  const [filtroSeleccionado, setFiltroSeleccionado] = useState(null);

  const cargarHistoricos = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("https://ambiocomserver.onrender.com/api/informes-alcoholes");

      const ordenados = (data || []).sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
      });

      setHistoricos(ordenados);
    } catch (error) {
      console.error("Error cargando históricos:", error);
      Swal.fire("Error", "No se pudieron cargar los históricos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    cargarHistoricos();
  }, [open]);

  // Filtrar historicos por filtroSeleccionado (puedes filtrar por fecha, por ejemplo)
  const historicosFiltrados = filtroSeleccionado
    ? historicos.filter((inf) => inf.fecha === filtroSeleccionado.fecha)
    : historicos;

  const handleDescargar = async (inf) => {
    try {
      setDownloadingId(inf._id);

      Swal.fire({
        title: "Generando informe...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        target: document.getElementById("modal-historicos-root"),
      });

      const { data: informeCompleto } = await axios.get(
        `https://ambiocomserver.onrender.com/api/informes-alcoholes/${inf._id}`
      );

      await exportarInformeAlcoholesPDF(
        informeCompleto.fecha,
        informeCompleto.zonas
      );

      Swal.close();
      Swal.fire({
        title: "Descarga lista",
        text: "El informe fue generado correctamente",
        icon: "success",
        target: document.getElementById("modal-historicos-root"),
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.close();
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el informe",
        icon: "error",
        target: document.getElementById("modal-historicos-root"),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEliminar = async (inf) => {
    try {
      const { value: clave } = await Swal.fire({
        title: "Eliminar informe",
        text: "Ingresa la clave de seguridad",
        input: "password",
        inputPlaceholder: "Clave...",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d32f2f",
        allowOutsideClick: false,
        allowEscapeKey: false,
        target: document.getElementById("modal-historicos-root"),
      });

      if (!clave) return;

      setDeletingId(inf._id);

      await axios.delete(`https://ambiocomserver.onrender.com/api/informes-alcoholes/${inf._id}`, {
        data: { clave },
      });

      Swal.fire({
        title: "Eliminado",
        text: "El informe fue eliminado correctamente",
        icon: "success",
        target: document.getElementById("modal-historicos-root"),
      });

      await cargarHistoricos();
    } catch (error) {
      console.error("Error eliminando informe:", error);
      Swal.fire({
        title: "Error",
        text: "Clave incorrecta o error eliminando el informe",
        icon: "error",
        target: document.getElementById("modal-historicos-root"),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // if (reason === "backdropClick" || reason === "escapeKeyDown") return; // no cerrar al hacer
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <Box id="modal-historicos-root">
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>🕒 Históricos de informes</span>
          <img
            src="/LogoCompany/logoambiocomsinfondo.png"
            alt="Logo"
            style={{ height: 60, width: "auto" }}
          />
        </DialogTitle>

        <DialogContent dividers>
          {/* Aquí el Autocomplete para filtrar */}
          <Autocomplete
            sx={{ mb: 2 }}
            options={historicos}
            getOptionLabel={(option) => option.fecha}
            value={filtroSeleccionado}
            onChange={(_, newValue) => setFiltroSeleccionado(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Filtrar por fecha" variant="outlined" size="small" />
            )}
            clearOnEscape
            isOptionEqualToValue={(option, value) => option._id === value._id}
            noOptionsText="No hay informes"
            freeSolo={false}
          />

          {loading ? (
            <Typography>⏳ Cargando históricos...</Typography>
          ) : historicosFiltrados.length === 0 ? (
            <Typography color="text.secondary">No hay informes guardados.</Typography>
          ) : (
            <Stack spacing={1}>
              {historicosFiltrados.map((inf) => (
                <Paper
                  key={inf._id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      📄 Informe de Alcoholes – {inf.fecha}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDescargar(inf)}
                      disabled={downloadingId === inf._id}
                    >
                      {downloadingId === inf._id ? "Generando..." : "Descargar PDF"}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleEliminar(inf)}
                      disabled={deletingId === inf._id}
                    >
                      {deletingId === inf._id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ModalInformesHistoricos;
