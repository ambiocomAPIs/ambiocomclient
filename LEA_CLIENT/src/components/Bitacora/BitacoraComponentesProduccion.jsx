import { useState } from "react";
import HeaderForm from "./HeaderForm";
import NoteBoard from "./NoteBoard";
import {
  Container,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from "@mui/material";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";

import { DictionaryIcon, BiderectionalCloudIcon } from "../../utils/icons/SvgIcons";
import DiccionarioUnidadDefault from "./DiccionarioUnidadDefaults";
import { exportarBitacoraPDF } from "../../utils/Functions/ExportarBitacoraDeTurnos/ExportarYsubirDriveBitacoraDeTurno";

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

  // --- Snackbar ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
      consumo: ""
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

  // ✅ Validar antes de exportar
  const handleExportar = () => {
    if (!headerData.fecha || !headerData.turno) {
      setSnackbar({
        open: true,
        message: "⚠️ Por favor seleccione la fecha y el turno antes de descargar la bitácora.",
        severity: "warning",
      });
      return;
    }

    // Si está validado, descargar PDF
    exportarBitacoraPDF(headerData, notes);
  };

  return (
    <Box sx={{ width: "99%", py: 3, minHeight: "95vh", marginRight: "10px", marginLeft: "10px" }}>
      <img
        src="/ambiocom.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "80px",
          left: "1%",
          width: 250,
          height: 60,
        }}
      />

      {/* Botón exportar bitacora y subir */}
      <Tooltip title="Guardar Bitacora">
        <IconButton
          color="secondary"
          size="small"
          onClick={handleExportar}
          disableRipple
          disableFocusRipple
          sx={{
            position: "absolute",
            mt: 6,
            right: 80,
            outline: "none",
            boxShadow: "none",
            backgroundColor: "transparent",
            "&:focus": { outline: "none", boxShadow: "none" },
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          <img
            src={BiderectionalCloudIcon}
            alt="cloudanddownloadicon"
            style={{ width: 35, height: 35 }}
          />
        </IconButton>
      </Tooltip>

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
            "&:focus": { outline: "none", boxShadow: "none" },
            "&:hover": { backgroundColor: "transparent" },
          }}
        >
          <img src={DictionaryIcon} alt="DictionaryIcon" style={{ width: 35, height: 35 }} />
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
        setNotes={setNotes}
        onAddNote={addNote}
        supervisor={headerData.supervisor}
        turno={headerData.turno}
        fecha={headerData.fecha}
      />

      {/* Drawer Diccionario */}
      <Drawer anchor="right" open={openDiccionario} onClose={() => setOpenDiccionario(false)}>
        <Box sx={{ width: 200, position: "relative" }}>
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

      {/* Modal Diccionario */}
      <Dialog
        open={!!selectedUnidad}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            maxHeight: "80vh",
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
            maxHeight: "60vh",
            whiteSpace: "pre-line",
          }}
        >
          <Typography>{DiccionarioUnidadDefault[selectedUnidad]}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BitacoraComponentProduccion;
