import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Divider,
  TextField,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Ajusta esta ruta según tu proyecto
import { useAuth } from "../../Context/AuthContext/AuthContext.jsx";

const API_TUTORIALES = "https://ambiocomserver.onrender.com/api/tutoriallist/tutorial";

const MODULE_LABELS = {
  despachos: "Despachos",
  inventario: "Inventario",
  ventas: "Ventas",
};

const INITIAL_FORM = {
  titulo: "",
  link: "",
  descripcion: "",
  modulo: "",
};

export default function TutorialModalList({ open, onClose, modulo }) {
  const { rol, loadingAuth } = useAuth();

  const [tutoriales, setTutoriales] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    modulo: modulo || "",
  });

  const moduleName = MODULE_LABELS[modulo] || modulo || "Módulo";
  const isDeveloper = useMemo(() => {
    if (loadingAuth) return false;
    return (rol || "").toLowerCase().trim() === "developer";
  }, [rol, loadingAuth]);

  const handleOpenVideo = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      modulo: modulo || "",
    });
    setEditId(null);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetForm();
  };

  const obtenerTutoriales = async () => {
    if (!modulo) return;

    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_TUTORIALES}?modulo=${encodeURIComponent(modulo)}`
      );

      setTutoriales(data?.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron cargar los tutoriales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && modulo) {
      obtenerTutoriales();
      setForm((prev) => ({
        ...prev,
        modulo,
      }));
    }
  }, [open, modulo]);

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCrear = () => {
    if (!isDeveloper) return;
    setEditId(null);
    setForm({
      titulo: "",
      link: "",
      descripcion: "",
      modulo: modulo || "",
    });
    setOpenForm(true);
  };

  const handleEditar = (item) => {
    if (!isDeveloper) return;
    setEditId(item._id);
    setForm({
      titulo: item.titulo || "",
      link: item.link || "",
      descripcion: item.descripcion || "",
      modulo: item.modulo || modulo || "",
    });
    setOpenForm(true);
  };

  const guardarTutorial = async () => {

    if (!isDeveloper) {
      Swal.fire("Acceso denegado", "No autorizado para realizar esta acción", "warning");
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      link: form.link.trim(),
      descripcion: form.descripcion.trim(),
      modulo: (form.modulo || modulo || "").trim().toLowerCase(),
    };

    if (
      !payload.titulo ||
      !payload.link ||
      !payload.descripcion ||
      !payload.modulo
    ) {
      Swal.fire(
        "Campos obligatorios",
        "Debes completar título, link, descripción y módulo",
        "warning"
      );
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_TUTORIALES}/${editId}`, payload, {
          withCredentials: true,
        });

        Swal.fire("Actualizado", "Tutorial actualizado correctamente", "success");
      } else {
        await axios.post(API_TUTORIALES, payload, {
          withCredentials: true,
        });

        Swal.fire("Creado", "Tutorial creado correctamente", "success");
      }

      handleCloseForm();
      obtenerTutoriales();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar el tutorial", "error");
    }
  };

  const eliminarTutorial = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar tutorial?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_TUTORIALES}/${id}`, {
        withCredentials: true,
      });

      Swal.fire("Eliminado", "Tutorial eliminado correctamente", "success");
      obtenerTutoriales();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar el tutorial", "error");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: "90vw",
            height: "90vh",
            maxWidth: "none",
            maxHeight: "none",
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Centro de ayuda
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Tutoriales disponibles para el módulo {moduleName}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {isDeveloper && (
                <Tooltip title="Crear tutorial">
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={handleCrear}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: "none",
                    }}
                  >
                    Nuevo
                  </Button>
                </Tooltip>
              )}

              <IconButton onClick={onClose} sx={{ color: "inherit" }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <HelpOutlineIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Contenido disponible
              </Typography>
              <Chip
                label={`${tutoriales.length} tutorial${tutoriales.length !== 1 ? "es" : ""
                  }`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Stack>

            {isDeveloper && (
              <Chip
                label="Modo developer"
                color="secondary"
                variant="filled"
                size="small"
              />
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">Cargando tutoriales...</Typography>
            </Box>
          ) : tutoriales.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                No hay ayudas disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aún no se han configurado tutoriales para el módulo {moduleName}.
              </Typography>

              {isDeveloper && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCrear}
                  sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
                >
                  Crear primer tutorial
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={2}>
              {tutoriales.map((item) => (
                <Card
                  key={item._id}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: 3,
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        {item.titulo}
                      </Typography>

                      <Chip
                        label={item.modulo || moduleName}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {item.descripcion}
                    </Typography>
                  </CardContent>

                  <CardActions
                    sx={{
                      px: 2,
                      pb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<PlayCircleOutlineIcon />}
                      onClick={() => handleOpenVideo(item.link)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Ver tutorial
                    </Button>

                    {isDeveloper && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(item)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => eliminarTutorial(item._id)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    )}
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openForm} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {editId ? "Editar tutorial" : "Crear tutorial"}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              name="titulo"
              fullWidth
              value={form.titulo}
              onChange={handleChangeForm}
            />

            <TextField
              label="Link de YouTube"
              name="link"
              fullWidth
              value={form.link}
              onChange={handleChangeForm}
            />

            <TextField
              label="Descripción"
              name="descripcion"
              fullWidth
              multiline
              minRows={3}
              value={form.descripcion}
              onChange={handleChangeForm}
            />

            <TextField
              label="Módulo"
              name="modulo"
              fullWidth
              value={form.modulo}
              onChange={handleChangeForm}
              disabled
              helperText="Se asigna automáticamente según el módulo actual"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseForm}>Cancelar</Button>
          <Button variant="contained" onClick={guardarTutorial}>
            {editId ? "Actualizar" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}