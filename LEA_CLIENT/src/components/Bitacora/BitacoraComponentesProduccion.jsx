import { useState } from "react";
import HeaderForm from "./HeaderForm";
import NoteBoard from "./NoteBoard";
import { Container, Typography, Box } from "@mui/material";

function BitacoraComponentProduccion() {
  const [headerData, setHeaderData] = useState({
    fecha: "",
    turno: "",
    supervisor: "",
    op_destileria: "",
    op_caldera: "",
    op_aguas: "",
    aux_caldera: "",
    analista1: "",
    analista2: "",
  });

  const [notes, setNotes] = useState({
    PENDIENTES: [],
    NOVEDADES: [],
    DESGLOSE: [],
    REGISTROS: [],
  });

  const handleHeaderChange = (field, value) => {
    setHeaderData({ ...headerData, [field]: value });
  };

  const addNote = (section, noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      createdAt: new Date().toLocaleString(),
    };
    setNotes((prev) => ({
      ...prev,
      [section]: [...prev[section], newNote],
    }));
  };

  return (
    <Box sx={{ width: "99%", py: 3, minHeight: "95vh", marginRight:"10px", marginLeft:"10px" }}>
      {/* Logo flotante en la esquina superior izquierda */}
      <img
        src="/ambiocom.png" // Ruta de la imagen dentro de la carpeta public
        alt="Logo"
        style={{
          position: "absolute",
          top: 5, // Ajusta la distancia desde la parte superior
          left: 15, // Ajusta la distancia desde la izquierda
          width: 250, // Ancho del logo
          height: 60, // Alto del logo
        }}
      />
      
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ pl: 2 }} style={{ textAlign: "center"}}>
        Bitácora de Turnos Diarios Supervisores
      </Typography>

      {/* Header Form and Notes Section */}
      <HeaderForm data={headerData} onChange={handleHeaderChange} />
      <NoteBoard notes={notes} onAddNote={addNote} />
    </Box>
  );
}

export default BitacoraComponentProduccion;
