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
import { useState } from "react";

// Todas las unidades
const unidadKeys = [
  "U100", "U200", "U300", "U350", "U400", "U450",
  "U500", "U550", "U600", "U650", "U700",
  "U800", "U900", "U950",
];

// Mensajes por defecto
const unidadDefaults = {
  U100: "Sin Texto predefinido",
  U200: "Sin Texto predefinido.",
  U300: "Alimentando Tk ✳️✳️✳️ a un flujo de ✳️✳️✳️✳️ L/h  nivel: ✳️✳️ m. Bomba P30✳️ Operando",
  U350: "Bomba 3✳️✳️ A/B operando",
  U400: "Alimentando del TK ✳️✳️✳️  a ✳️✳️ L/h nivel: ✳️✳️ m. \n\n \tC403=          C404=           C405=           CB=           CA=          . \n\n ➡️ EXTRANEUTRO:   TK402 AB=  m.\n ➡️ INDUSTRIAL=        TK403AB=  m",
  U450: "TK402AB llenando, nivel= ✳️✳️ m  || Bomba MP41✳️ operando || TK402AB Recirculando, nivel= ✳️✳️ m || TK402AB Trasladando, nivel antes del traslado= xx m ",
  U500: `
 🔸Presión:  Psi
 🔸Domo: %
 🔸Desaireador:  %
 🔸THogar:  °C
 🔸Tvapor:  °C
 🔸 Flujo vapor:  lb/h
 🔸 Tolva principal:  Toneladas
 🔸 Compuertas:
      ➡️ #1 - 100
      ➡️ #2 - 100
      ➡️ #3 - 50
      ➡️ #4 - 0
 🔸 Lavador de gases: Fuera de línea \n`,
  U550: "Verificación de presión.",
  U600: "Cambio de filtros.",
  U650: "Revisión de sensores.",
  U700: "Análisis de fallas previas.",
  U800: "Limpieza de sistema.",
  U900: "Verificar niveles.",
  U950: "Prueba de rendimiento.",
};

function NoteColumn({ title, notes = [], onAdd, onToggle, date }) {
  const [input, setInput] = useState("");
  const [modalUnidad, setModalUnidad] = useState(null);
  const [modalText, setModalText] = useState("");
  const [readModal, setReadModal] = useState(null); // nota a mostrar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

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

  const filtered = notes.filter((note) => {
    const isToday = effectiveDate === today;
    return note.date === effectiveDate || (isToday && !note.completed);
  });

  const handleAddNote = () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;

    if (unidadKeys.includes(trimmed)) {
      setModalUnidad(trimmed);
      setModalText(unidadDefaults[trimmed] || ""); // cargar mensaje predeterminado
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
    try {
      const res = await fetch(`https://ambiocomserver.onrender.com/api/notasbitacora/bitacora/${deleteTarget._id || deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        setDeleteError(error.message || "Error al eliminar");
        return;
      }

      // Notifica que debe recargarse la lista
      if (typeof onAdd === "function") {
        onAdd("__deleted__");
      }

      setDeleteTarget(null);
      setDeletePassword("");
      setDeleteError("");
    } catch (error) {
      console.error("❌ Error al eliminar nota:", error);
      setDeleteError("Error en la solicitud.");
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                  <Checkbox
                    checked={note.completed}
                    onChange={() => onToggle(note.id || note._id)}
                    color="primary"
                  />
                </Box>

                <Box sx={{ position: "absolute", top: 4, left: 4 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(note);
                      setDeletePassword("");
                      setDeleteError("");
                    }}
                  >
                    🗑️
                  </IconButton>
                </Box>

                <CardContent>
                  <Typography variant="body1">{preview}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    <strong>Supervisor:</strong> {note.supervisor || "Desconocido"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <strong>Fecha:</strong> {formatDate(note.createdAt)}
                  </Typography>
                </CardContent>
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
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            },
          },
        }}
      >
        <DialogTitle>Detalle para {modalUnidad}</DialogTitle>

        <DialogContent dividers sx={{ flexGrow: 1, overflowY: 'auto' }}>
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
        onClose={() => setReadModal(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalle de nota</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {readModal?.text || "Sin contenido"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadModal(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para eliminar nota */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar nota</DialogTitle>
        <DialogContent>
          <Typography>Ingrese contraseña para confirmar:</Typography>
          <TextField
            fullWidth
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            autoFocus
          />
          {deleteError && (
            <Typography color="error" mt={1}>
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
    </Card>
  );
}

export default NoteColumn;
