import { useState, useEffect } from "react";
import { Grid } from "@mui/material";
import axios from "axios";
import NoteColumn from "./NoteColumn";

const sections = [
  { key: "PENDIENTES", title: "Pendientes" },
  { key: "NOVEDADES", title: "Novedades" },
  { key: "DESGLOSE", title: "Desglose de Unidades" },
  { key: "REGISTROS", title: "Listado de Registros" },
];

function NoteBoard({ supervisor, turno, fecha }) {
  const [notes, setNotes] = useState({});
  const [noteToCreate, setNoteToCreate] = useState(null);

  // Cargar notas existentes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get("https://ambiocomserver.onrender.com/api/notasbitacora");
        const grouped = sections.reduce((acc, s) => {
          acc[s.key] = res.data.filter((n) => n.module === s.key);
          return acc;
        }, {});
        setNotes(grouped);
      } catch (error) {
        console.error("Error al cargar notas:", error);
      }
    };

    fetchNotes();
  }, []);

  // Crear nota en la API si hay una pendiente
  useEffect(() => {
    if (!noteToCreate) return;

    const sendNote = async () => {
      try {
        const response = await axios.post("https://ambiocomserver.onrender.com/api/notasbitacora", noteToCreate);
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
  }, [noteToCreate]);

  // Manejo al crear nueva nota
  const handleAddNote = (sectionKey, text) => {
    if (!supervisor || !turno || !fecha) {
      alert("Debes completar fecha, turno y supervisor antes de agregar una nota.");
      return;
    }

    const newNote = {
      text,
      date: fecha,  // Aquí asignas la fecha desde el padre
      turno,
      supervisor,
      module: sectionKey,
      completed: false,
    };

    setNoteToCreate(newNote); // esto dispara el useEffect para guardar
  };

  const handleToggleComplete = async (sectionKey, noteId) => {

    if (!noteId) {
      console.error("Error: noteId no válido");
      return;
    }
    
    try {
      // Hacer PATCH al backend para toggle de completed
      const response = await axios.patch(`
https://ambiocomserver.onrender.com/api/notasbitacora/${noteId}/toggle`);
  
      if (response.status === 200) {
        const updatedNote = response.data;
  
        // Actualizar estado local con el resultado actualizado del backend
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
      // Aquí puedes mostrar alerta o feedback al usuario si quieres
    }
  };

  // // Toggle para marcar nota completada o no
  // const handleToggleComplete = (sectionKey, noteId) => {
  //   setNotes((prev) => ({
  //     ...prev,
  //     [sectionKey]: prev[sectionKey].map((note) =>
  //       note.id === noteId ? { ...note, completed: !note.completed } : note
  //     ),
  //   }));
  // };

  return (
    <Grid container spacing={2} style={{ marginTop: 16 }}>
      {sections.map((section) => (
        <Grid item xs={12} md={3} key={section.key}>
          <NoteColumn
            title={section.title}
            notes={notes[section.key] || []}
            onAdd={(text) => handleAddNote(section.key, text)}
            onToggle={(id) => handleToggleComplete(section.key, id)}
            date={fecha}  // <---- Aquí se pasa la fecha para filtrar
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default NoteBoard;
