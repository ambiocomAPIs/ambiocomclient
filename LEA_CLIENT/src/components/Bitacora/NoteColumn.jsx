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
  
  function NoteColumn({ title }) {
    const [notes, setNotes] = useState([
      {
        id: Date.now(),
        text: "Primera nota de ejemplo",
        createdAt: new Date().toLocaleString(),
        completed: false,
      },
    ]);
    const [input, setInput] = useState("");
  
    const handleAddNote = () => {
      if (input.trim()) {
        const newNote = {
          id: Date.now(),
          text: input,
          createdAt: new Date().toLocaleString(),
          completed: false,
        };
        setNotes((prev) => [...prev, newNote]);
        setInput("");
      }
    };
  
    const handleToggleComplete = (id) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, completed: !note.completed } : note
        )
      );
    };
  
    return (
      <Card
        variant="outlined"
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          {/* Encabezado */}
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
  
          {/* Campo de entrada */}
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
  
          {/* Lista de notas */}
          <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
            {notes.map((note) => (
              <Card
                key={note.id}
                variant="outlined"
                sx={{
                  marginBottom: 1,
                  backgroundColor: note.completed ? "#e0e0e0" : "transparent",
                  textDecoration: note.completed ? "line-through" : "none",
                  position: "relative",
                }}
              >
                {/* Checkbox arriba a la derecha */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    zIndex: 1,
                  }}
                >
                  <Checkbox
                    checked={note.completed}
                    onChange={() => handleToggleComplete(note.id)}
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
                    {note.createdAt}
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
  