import { useState, useEffect } from "react";
import { Grid, Snackbar, Alert } from "@mui/material";
import axios from "axios";
import NoteColumn from "./NoteColumn";

const sections = [
  { key: "PENDIENTES", title: "Pendientes" },
  { key: "NOVEDADES", title: "Novedades" },
  { key: "DESGLOSE", title: "Desglose de Unidades" },
  { key: "REGISTROS", title: "Listado de Registros" },
];

function NoteBoard({ supervisor, turno, fecha, notes, setNotes }) {
  const [noteToCreate, setNoteToCreate] = useState(null);

    // 🔔 Snackbar
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: "",
    });

    const handleSnackbarClose = () => {
      setSnackbar({ open: false, message: "" });
    };

  // Cargar notas existentes desde la API
  const fetchNotes = async () => {
    try {
      const res = await axios.get("https://ambiocomserver.onrender.com/api/notasbitacora");
      const grouped = sections.reduce((acc, s) => {
        acc[s.key] = res.data.filter((n) => n.module === s.key);
        return acc;
      }, {});      
      setNotes(grouped); // 👈 ahora actualiza el padre
    } catch (error) {
      console.error("Error al cargar notas:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Crear nota en la API si hay una pendiente
  useEffect(() => {
    if (!noteToCreate) return;

    const sendNote = async () => {
      try {
        const response = await axios.post(
          "https://ambiocomserver.onrender.com/api/notasbitacora",
          noteToCreate
        );
        const sectionKey = noteToCreate.module;

        setNotes((prev) => ({
          ...prev,
          [sectionKey]: [...(prev[sectionKey] || []), response.data],
        }));
      } catch (error) {
        console.error("Error al guardar nota:", error);
      } finally {
        setNoteToCreate(null);
      }
    };

    sendNote();
  }, [noteToCreate, setNotes]);

  // Manejo al crear nueva nota
  const handleAddNote = (sectionKey, text) => {
    if (!supervisor || !turno || !fecha) {
      setSnackbar({
        open: true,
        message: "Debes completar fecha, turno y supervisor antes de agregar una nota. ⚠️",
      });
      return;
    }

    const newNote = {
      text,
      date: fecha,
      turno,
      supervisor,
      module: sectionKey,
      completed: false,
    };

    setNoteToCreate(newNote); // dispara el useEffect
  };

  // Toggle completado de nota
  const handleToggleComplete = async (sectionKey, noteId) => {
    if (!noteId) {
      console.error("Error: noteId no válido");
      return;
    }

    try {
      const response = await axios.patch(
        `https://ambiocomserver.onrender.com/api/notasbitacora/${noteId}/toggle`
      );

      if (response.status === 200) {
        const updatedNote = response.data;

        setNotes((prev) => ({
          ...prev,
          [sectionKey]: prev[sectionKey].map((note) =>
            note.id === noteId || note._id === noteId
              ? { ...note, completed: updatedNote.completed }
              : note
          ),
        }));
      }
    } catch (error) {
      console.error("Error al actualizar estado completado:", error);
    }
  };

  return (
  <>
    <Grid container spacing={2} style={{ marginTop: 16 }}>
      {sections.map((section) => (
        <Grid item xs={12} md={3} key={section.key}>
          <NoteColumn
            title={section.title}
            notes={notes[section.key] || []}
            onAdd={(text) => handleAddNote(section.key, text)}
            onToggle={(id) => handleToggleComplete(section.key, id)}
            date={fecha}
            turno={turno}  
            onRefresh={fetchNotes}
          />
        </Grid>
      ))}
    </Grid>
     {/* Snackbar morado */}
     <Snackbar
     open={snackbar.open}
     autoHideDuration={4000}
     onClose={handleSnackbarClose}
     anchorOrigin={{ vertical: "top", horizontal: "center" }}
   >
     <Alert
       onClose={handleSnackbarClose}
       severity="info"
       sx={{
         width: "100%",
         backgroundColor: "#EAD1FF", // Morado
         color: "dark gray",
         fontWeight: "bold",
       }}
     >
       {snackbar.message}
     </Alert>
   </Snackbar>
   </>
  );
}

export default NoteBoard;
