import {
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Box,
  Divider,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

function NoteColumn({ title, notes = [], onAdd, onToggle, date }) {
  const [input, setInput] = useState("");

  const handleAddNote = () => {
    if (input.trim()) {
      onAdd(input);
      setInput("");
    }
  };

  // Función para formatear la fecha createdAt
  const formatDate = (createdAt) => {
    // createdAt puede venir como un objeto, un string o timestamp, hay que parsearlo
    // Si es objeto MongoDB, intentar extraer el timestamp
    let time = createdAt;

    if (typeof createdAt === "object" && createdAt !== null) {
      if (createdAt.$date) {
        // Si es { $date: { $numberLong: "timestamp" } }
        if (typeof createdAt.$date === "object" && createdAt.$date.$numberLong) {
          time = parseInt(createdAt.$date.$numberLong, 10);
        } else {
          time = createdAt.$date;
        }
      }
    }

    // Si es string numérico, parsear a número
    if (typeof time === "string" && /^\d+$/.test(time)) {
      time = parseInt(time, 10);
    }

    // Crear objeto Date
    const dateObj = new Date(time);

    if (isNaN(dateObj)) return "Fecha inválida";

    // Formatear como "YYYY-MM-DD HH:mm:ss"
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const mm = String(dateObj.getMinutes()).padStart(2, "0");
    const ss = String(dateObj.getSeconds()).padStart(2, "0");

    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  const today = new Date().toISOString().split("T")[0];

  // Aquí uso effectiveDate que será 'date' si tiene valor, o 'today' si no
  const effectiveDate = date || today;

  const filteredNotes = notes.filter((note) => {
    const noteDate = note.date;
    const isToday = effectiveDate === today;
    const sameDate = noteDate === effectiveDate;
    const isIncomplete = note.completed === false;
    return sameDate || (isIncomplete && isToday);
  });

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={2}
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
          sx={{ marginBottom: 2 }}
        />

        <Divider sx={{ marginBottom: 2 }} />

        <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
          {filteredNotes.map((note) => (
            <Card
              key={note._id || note.id}
              variant="outlined"
              sx={{
                marginBottom: 1,
                backgroundColor: note.completed ? "#e0e0e0" : "transparent",
                textDecoration: note.completed ? "line-through" : "none",
                position: "relative",
              }}
            >
              <Box sx={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}>
                <Checkbox
                  checked={note.completed}
                  onChange={() => onToggle(note.id || note._id)}
                  color="primary"
                />
              </Box>

              <CardContent>
                <Typography variant="body1">{note.text}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", marginTop: 1 }}
                >
                  <strong>Supervisor:</strong> {note.supervisor || "Desconocido"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  <strong>Fecha de registro:</strong> {formatDate(note.createdAt)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default NoteColumn;
