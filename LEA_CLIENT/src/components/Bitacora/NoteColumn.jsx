import { useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Box,
  Divider,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import { Snackbar, Alert, Tooltip } from "@mui/material";
import { CircularProgress, LinearProgress } from "@mui/material";
import BackspaceIcon from '@mui/icons-material/Backspace';

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

//Diccionario definido y detallado
import DiccionarioUnidadDefault from "./DiccionarioUnidadDefaults";

// Todas las unidades
const unidadKeys = [
  "U100",
  "U200",
  "U300",
  "U350",
  "U400",
  "U450",
  "U500",
  "U550",
  "U600",
  "U650",
  "U700",
  "U800",
  "U900",
  "U950",
  "TRASLADO",
  "RECIRCULACION",
  "AGUAS",
];

const turnos = [
  { value: "TurnoMañana(6:00-14:00)", priority: 1 },
  { value: "TurnoTarde(14:00-22:00)", priority: 2 },
  { value: "TurnoNoche(22:00-06:00)", priority: 3 },
  { value: "TurnoAdministrativo(07:30-17:30)", priority: 4 },
  { value: "Turno12Horas(06:00-18:00)", priority: 5 },
  { value: "Turno12Horas(18:00-06:00)", priority: 6 },
];

function NoteColumn({
  title,
  notes = [],
  onAdd,
  onToggle,
  date,
  onRefresh,
  turno,
}) {
  const [input, setInput] = useState("");
  const [modalUnidad, setModalUnidad] = useState(null);
  const [modalText, setModalText] = useState("");
  const [readModal, setReadModal] = useState(null); // nota a mostrar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Editar la nota
  const [isEditing, setIsEditing] = useState(false); // nuevo estado
  const [editText, setEditText] = useState(""); // texto editable

  const today = new Date().toISOString().split("T")[0];
  const effectiveDate = date || today;

  const formatDate = (createdAt) => {
    let time = createdAt;
    if (typeof time === "object" && time !== null && time.$date) {
      time =
        typeof time.$date === "object" && time.$date.$numberLong
          ? parseInt(time.$date.$numberLong, 10)
          : time.$date;
    }
    if (typeof time === "string" && /^\d+$/.test(time)) {
      time = parseInt(time, 10);
    }
    const d = new Date(time);
    return isNaN(d) ? "Fecha inválida" : d.toLocaleString();
  };

  // const filtered = notes.filter((note) => {
  //   const isToday = effectiveDate === today;
  //   return note.date === effectiveDate || (isToday && !note.completed);
  // });

  const getPriority = (turnoValue) => {
  const t = turnos.find(t => t.value === turnoValue);
  return t ? t.priority : Infinity; // Infinity = si no lo encuentra, no se muestra
 };

 const filtered = notes.filter((note) => {
  const normalizeDate = (d) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  const noteDate = normalizeDate(note.date);
  const currentDate = normalizeDate(effectiveDate);

  const noteTurno = (note.turno || "").trim();
  const currentTurno = (turno || "").trim();
  const noteCompleted = !!note.completed;

  const notePriority = getPriority(noteTurno);
  const currentPriority = getPriority(currentTurno);

  // --- Caso 1: misma fecha y mismo turno ---
  if (noteDate === currentDate && noteTurno === currentTurno) {
    return true; // siempre mostrar, aunque esté completada
  }

  // --- Caso 2: misma fecha pero turno posterior ---
  if (noteDate === currentDate && notePriority < currentPriority) {
    return !noteCompleted; // solo si no está completada
  }

  // --- Caso 3: días posteriores ---
  if (noteDate < currentDate) {
    return !noteCompleted; // arrastrar si está pendiente
  }

  // --- Caso 4: turnos futuros del mismo día o días futuros ---
  return false;
});

  // const filtered = notes.filter((note) => {
  //   const normalizeDate = (d) => {
  //     if (!d) return "";
  //     return new Date(d).toISOString().split("T")[0]; // fecha en formato YYYY-MM-DD
  //   };

  //   const noteDate = normalizeDate(note.date);
  //   const currentDate = normalizeDate(effectiveDate);

  //   const noteTurno = (note.turno || "").trim();
  //   const currentTurno = (turno || "").trim();
  //   const noteCompleted = !!note.completed;

  //   // --- Caso 1: misma fecha y mismo turno ---
  //   if (noteDate === currentDate && noteTurno === currentTurno) {
  //     return true; // siempre visible
  //   }

  //   // --- Caso 2: misma fecha pero turno distinto ---
  //   if (noteDate === currentDate && noteTurno !== currentTurno ) {
  //     return !noteCompleted; // pendiente -> se muestra, completada -> no
  //   }

  //   // --- Caso 3: fechas anteriores ---
  //   if (noteDate < currentDate) {
  //     return !noteCompleted; // pendiente -> se muestra, completada -> no
  //   }

  //   // --- Caso 4: fechas futuras ---
  //   return false;
  // });

  // Función para guardar cambios de nota editada
  const handleSaveEdit = async () => {
    if (!readModal) return;
    const updatedText = editText.trim();
    if (!updatedText) return;    
    try {
      await axios.patch(
        `https://ambiocomserver.onrender.com/api/notasbitacora/bitacora/editarnota/${readModal._id}`,
        { text: updatedText }
      );

      setSnackbar({
        open: true,
        message: "Nota actualizada con éxito",
        severity: "success",
      });
      setReadModal({ ...readModal, text: updatedText }); // actualizar localmente
      setIsEditing(false);
      if (typeof onRefresh === "function") onRefresh();
    } catch (error) {
      console.error("❌ Error al actualizar nota:", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar la nota",
        severity: "error",
      });
    }
  };

  const handleAddNote = () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;

    if (unidadKeys.includes(trimmed)) {
      setModalUnidad(trimmed);
      setModalText(DiccionarioUnidadDefault[trimmed] || ""); // cargar mensaje predeterminado
    } else {
      onAdd(trimmed);
    }

    setInput("");
  };

  const handleModalSave = () => {
    if (!modalUnidad || !modalText.trim()) return;
    const noteText = `${modalUnidad}: ${modalText.trim()}`;
    onAdd(noteText);
    setModalUnidad(null);
    setModalText("");
  };

  const handleDeleteNote = async () => {
    if (!deleteTarget) return;

    setDeletingNoteId(true);

    try {
      setDeletingNoteId(deleteTarget._id); // nota a eliminar y aplicar el loading
      await axios.delete(
        `https://ambiocomserver.onrender.com/api/notasbitacora/bitacora/${deleteTarget._id}`,
        {
          headers: { Authorization: `Bearer ${deletePassword}` },
        }
      );

      setSnackbar({
        open: true,
        message: "Nota eliminada con éxito",
        severity: "success",
      });

      setDeleteTarget(null);
      setDeletePassword("");
      setDeleteError("");
      setDeletingNoteId(null);
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (error) {
      console.error("❌ Error al eliminar nota:", error);
      setDeleteError(error.response?.data?.message || "Error en la solicitud.");
      setSnackbar({
        open: true,
        message: "Error al eliminar la nota",
        severity: "error",
      });
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={handleAddNote} size="small" color="primary">
            <AddIcon />
          </IconButton>
        </Box>

        <TextField
          label="Nueva nota"
          size="small"
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddNote();
            }
          }}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
          {filtered.map((note) => {
            const unidad = unidadKeys.find((key) => note.text?.startsWith(key));
            const preview = unidad ?? note.text.slice(0, 50);

            return (
              <Card
                key={note._id || note.id}
                variant="outlined"
                onDoubleClick={() => setReadModal(note)}
                sx={{
                  mb: 1,
                  backgroundColor: note.completed ? "#eee" : "transparent",
                  textDecoration: note.completed ? "line-through" : "none",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <Box sx={{ position: "absolute", top: 4, right: 4 }}>
                 <Tooltip title="Marcar como Leido">
                  <Checkbox
                    checked={note.completed}
                    onChange={() => onToggle(note.id || note._id)}
                    color="primary"
                  />
                 </Tooltip>
                </Box>

                <Box sx={{ position: "absolute", bottom: 4, right: 5 }}>
                  <Tooltip title="Eliminar Nota">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(note);
                      setDeletePassword("");
                      setDeleteError("");
                    }}
                  >
                    <BackspaceIcon sx={{color:"#F06043"}}/>
                  </IconButton>
                  </Tooltip>
                </Box>

                <CardContent>
                  <Typography variant="body1">{preview}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    <strong>Supervisor:</strong>{" "}
                    {note.supervisor || "Desconocido"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    <strong>Fecha:</strong> {formatDate(note.createdAt)}
                  </Typography>
                </CardContent>
                {/* Linea loading para nota */}
                {deletingNoteId === (note._id || note.id) && (
                  <LinearProgress
                    color="error"
                    sx={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
                  />
                )}
              </Card>
            );
          })}
        </Box>
      </CardContent>

      {/* Modal para escribir detalle de unidad */}
      <Dialog
        open={!!modalUnidad}
        onClose={() => setModalUnidad(null)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            },
          },
        }}
      >
        <DialogTitle>Detalle para {modalUnidad}</DialogTitle>

        <DialogContent dividers sx={{ flexGrow: 1, overflowY: "auto" }}>
          <TextField
            multiline
            fullWidth
            minRows={6}
            maxRows={20}
            value={modalText}
            onChange={(e) => setModalText(e.target.value)}
            placeholder="Escribe el detalle para esta unidad..."
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModalUnidad(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleModalSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver nota completa al hacer doble click */}
      <Dialog
        open={!!readModal}
        onClose={() => {
          setReadModal(null);
          setIsEditing(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalle de nota</DialogTitle>
        <DialogContent>
          {isEditing ? (
            <TextField
              multiline
              fullWidth
              minRows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              sx={{ mt: 1 }}
            />
          ) : (
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {readModal?.text || "Sin contenido"}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            <Button variant="contained" onClick={handleSaveEdit}>
              Guardar
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsEditing(true);
                setEditText(readModal.text || "");
              }}
            >
              Editar
            </Button>
          )}
          <Button
            onClick={() => {
              setReadModal(null);
              setIsEditing(false);
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver modal de eliminar nota */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Confirmar eliminación
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            ¿Estás seguro que deseas eliminar esta nota? Esta acción no se puede
            deshacer.
          </Typography>

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Contraseña"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          {deleteError && (
            <Typography color="error" mt={2}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteNote}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Akerta con snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default NoteColumn;
