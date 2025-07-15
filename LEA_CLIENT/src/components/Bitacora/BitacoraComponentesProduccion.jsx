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

  const clearFieldsExceptFechaTurno = () => {
    console.log("ejecutandose para limpiar data ?");
    
    setHeaderData(prev => ({
      ...prev,
      supervisor: "",
      op_destileria: "",
      op_caldera: "",
      op_aguas: "",
      aux_caldera: "",
      analista1: "",
      analista2: "",
    }));
  };

  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };  

  const addNote = (section, noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      createdAt: new Date().toLocaleString(),
      consumo: "hola pao"
    };
    setNotes(prev => ({
      ...prev,
      [section]: [...prev[section], newNote],
    }));
  };

  return (
    <Box sx={{ width: "99%", py: 3, minHeight: "95vh", marginRight:"10px", marginLeft:"10px" }}>
      <img
        src="/ambiocom.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: 5,
          left: 15,
          width: 250,
          height: 60,
        }}
      />
      
      <Typography variant="h4" gutterBottom sx={{ pl: 2, mt:6}} style={{ textAlign: "center"}}>
        Bitácora de Turnos Diarios Supervisores
      </Typography>
      <HeaderForm data={headerData} onChange={handleHeaderChange} clearFieldsExceptFechaTurno={clearFieldsExceptFechaTurno} />
      <NoteBoard 
      notes={notes} 
      onAddNote={addNote} 
      supervisor={headerData.supervisor}
      turno={headerData.turno}
      fecha={headerData.fecha}
      />
    </Box>
  );
}

export default BitacoraComponentProduccion;
