import { useState } from "react";
import HeaderForm from "./HeaderForm";
import NoteBoard from "./NoteBoard";
import { Container, Typography, Box, Drawer, List, ListItem, ListItemButton, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";

import { DictionaryIcon } from "../../utils/icons/SvgIcons"

//Diccionario definido y detallado
import DiccionarioUnidadDefault from "./DiccionarioUnidadDefaults";

function BitacoraComponentProduccion({ trabajadoresRegistradosContext }) {
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

  const [openDiccionario, setOpenDiccionario] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);

  const toggleDiccionario = (open) => () => {
    setOpenDiccionario(open);
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

  const handleOpenModal = (unidad) => {
    setSelectedUnidad(unidad);
  };

  const handleCloseModal = () => {
    setSelectedUnidad(null);
  };

  return (
    <Box sx={{ width: "99%", py: 3, minHeight: "95vh", marginRight: "10px", marginLeft: "10px" }}>
      <img
        src="/ambiocom.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "9%",
          left: "1%",
          width: 250,
          height: 60,
        }}
      />

      {/* Botón Diccionario */}
      <Tooltip title="Diccionario">
        <IconButton
          color="secondary"
          size="small"
          onClick={toggleDiccionario(true)}
          disableRipple
          disableFocusRipple
          sx={{
            position: "absolute",
            mt: 6,
            right: 30,
            outline: "none",
            boxShadow: "none",
            backgroundColor: "transparent",
            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <img
            src={DictionaryIcon}
            alt="DictionaryIcon"
            style={{ width: 35, height: 35 }}
          />
        </IconButton>

      </Tooltip>

      <Typography variant="h4" gutterBottom sx={{ pl: 2, mt: 6 }} style={{ textAlign: "center" }}>
        Bitácora de Turnos Diarios Supervisores
      </Typography>
      <HeaderForm
        data={headerData}
        onChange={handleHeaderChange}
        clearFieldsExceptFechaTurno={clearFieldsExceptFechaTurno}
        trabajadoresRegistradosContext={trabajadoresRegistradosContext}
      />
      <NoteBoard
        notes={notes}
        onAddNote={addNote}
        supervisor={headerData.supervisor}
        turno={headerData.turno}
        fecha={headerData.fecha}
      />

      {/* Este es el Drawer del diccionario */}
      {/* Drawer Diccionario */}
      <Drawer
        anchor="right"
        open={openDiccionario}
        onClose={() => setOpenDiccionario(false)} // <-- corregido aquí
      >
        <Box sx={{ width: 200, position: "relative" }}>
          {/* Botón cerrar */}
          <IconButton
            onClick={() => setOpenDiccionario(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
            aria-label="Cerrar diccionario"
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" sx={{ p: 2 }}>
            Diccionario 📓
          </Typography>

          <List>
            {Object.keys(DiccionarioUnidadDefault).map((unidad) => (
              <ListItem key={unidad} disablePadding>
                <ListItemButton onClick={() => handleOpenModal(unidad)}>
                  <ListItemText primary={unidad} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Modal para previsualizar el diccionario y el texto */}
      <Dialog
        open={!!selectedUnidad}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            maxHeight: "80vh",    // límite máximo de alto
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            m: "auto",
          },
        }}
      >
        <DialogTitle>{selectedUnidad}</DialogTitle>
        <DialogContent
          dividers
          sx={{
            overflowY: "auto",
            maxHeight: "60vh", // espacio para que no pase de la pantalla
            whiteSpace: "pre-line",
          }}
        >
          <Typography>
            {DiccionarioUnidadDefault[selectedUnidad]}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}

export default BitacoraComponentProduccion;
