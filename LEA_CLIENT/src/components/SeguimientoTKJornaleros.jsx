import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Stack,
  Button,
  Modal,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert
} from '@mui/material';

import SpeedDialComponent from '../utils/speedDial/SpeedDial';
import ExcelStyleFooter from '../utils/ExcelStyleFooter';
import ReportarNivelesTanquesJornaleros from '../utils/modals/ReportarNivelesTanquesJornaleros';
import DetallesMovimientosDeTanquesJornaleros from '../utils/modals/DetallesMovimientosDeTanquesJornaleros';
import GraficoNivelesTanquesPorDiaModal from '../utils/modals/GraficoNivelesTanquesPorDia'

const styleModal = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

function SeguimientoTKJornaleros() {
  const [tipoMovimiento, setTipoMovimiento] = useState('');
  const [tanqueOrigen, setTanqueOrigen] = useState('');
  const [tanqueDestino, setTanqueDestino] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [responsable, setResponsable] = useState('');
  const [cliente, setCliente] = useState('');
  const [factura, setFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tanques, setTanques] = useState([]);
  const [filteredTanques, setFilteredTanques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVerRegistrarMovimientoTanqueJornaleroIsOpen, setModalVerRegistrarMovimientoTanqueJornaleroIsOpen] = useState(false);
  const [modalReportarNivelesTanquesJornalerosIsOpen, setModalReportarNivelesTanquesJornalerosIsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [modalVerMovimientosTanquesJornalerosIsOpen, setModalVerMovimientosTanquesJornalerosIsOpen] = useState(false);
  const [modalOpenModalGraficoNivelesModalIsOpen, setopenModalGraficoNivelesModalIsOpen] = useState(false);
  const hoy = new Date().toLocaleDateString('es-ES');

  const handleClose = () => {
    setTipoMovimiento('');
    setTanqueOrigen('');
    setTanqueDestino('');
    setCantidad('');
    setResponsable('');
    setCliente('');
    setFactura('');
    setObservaciones('');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    axios
      .get('http://localhost:4041/api/seguimientotanquesjornaleros/GetTanquesData')
      .then((res) => {
        setTanques(res.data);
        setFilteredTanques(res.data);
      })
      .catch((err) => {
        console.error('Error al obtener tanques:', err);
      });
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredTanques(tanques);
    } else {
      const filtered = tanques.filter((t) =>
        t.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTanques(filtered);
    }
  }, [searchQuery, tanques]);

  const openModalFromFooterRegistrarMovimientoTanqueJornalero = () => setModalVerRegistrarMovimientoTanqueJornaleroIsOpen(true);
  const closeModalVerRegistrarMovimientoTanqueJornaleroIsOpen = () => setModalVerRegistrarMovimientoTanqueJornaleroIsOpen(false);
 
  const openModalReportarNivelesTanquesJornalerosIsOpen = () => setModalReportarNivelesTanquesJornalerosIsOpen(true);
  const closeModalReportarNivelesTanquesJornalerosIsOpen = () => setModalReportarNivelesTanquesJornalerosIsOpen(false);

  const openModalVerMovimientosTanquesJornaleros = () => setModalVerMovimientosTanquesJornalerosIsOpen(true);
  const closeModalVerMovimientosTanquesJornaleros = () => setModalVerMovimientosTanquesJornalerosIsOpen(false);
  
  const openModalGraficoNivelesModalIsOpen = () => setopenModalGraficoNivelesModalIsOpen(true);
  const closeModalGraficoNivelesModalIsOpen = () => setopenModalGraficoNivelesModalIsOpen(false);

  const handleSaveMovement = () => {
    const data = {
      tipoDeMovimiento: tipoMovimiento,
      tanqueOrigen: tipoMovimiento === 'movimiento' || tipoMovimiento === 'despacho' ? tanqueOrigen : null,
      tanqueDestino: tipoMovimiento === 'movimiento' || tipoMovimiento === 'carga' ? tanqueDestino : null,
      cantidad: parseFloat(cantidad),
      responsable,
      cliente: tipoMovimiento === 'despacho' ? cliente : null,
      detalleFactura: tipoMovimiento === 'despacho' ? factura : null,
      observaciones,
    };

    axios
      .post('http://localhost:4041/api/reportar/operacionesdetanques', data)
      .then((response) => {
        console.log('Movimiento registrado:', response.data);
        setSnackbarOpen(true); // Abre el snackbar cuando se guarde correctamente
        setTimeout(() => {
          window.location.reload(); // Recarga la página después de 2 segundos
        }, 500);
        handleClose();
      })
      .catch((error) => {
        console.error('Error al registrar movimiento:', error);
      });
  };


  const registros = (() => {
  const tanques = ['TK101', 'TK102', 'TK103', 'TK104', 'TK105', 'TK106', 'TK107', 'TK108'];
  const registros = [];
  const startDate = new Date('2025-01-01');
  const today = new Date('2025-05-11');

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    tanques.forEach(nombre => {
      registros.push({
        nombre,
        createdAt: new Date(d).toISOString(),
        nivel: Math.floor(Math.random() * 91) + 10, // Nivel entre 10 y 100
      });
    });
  }

  return registros;
})();

  return (
    <Box sx={{ padding: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Filtrar Tanque"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: '20%' }}
        />
        <Typography variant="h4" sx={{ textAlign: 'center', flexGrow: 1, marginLeft: '-380px'}}>
          Niveles de Tanques Jornaleros
        </Typography>
      </Box>

      <Stack spacing={2}>
        {filteredTanques.map((tanque, index) => {
          const porcentaje = Math.min((tanque.nivel / tanque.capacidad) * 100, 100);

          return (
            <Paper key={index} elevation={4} sx={{ padding: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {tanque.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capacidad: {tanque.capacidad} L | Nivel: {tanque.nivel} L | Volumen: {tanque.volumen} L ({porcentaje.toFixed(1)}%)
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={porcentaje}
                  sx={{
                    height: 20,
                    borderRadius: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <Modal open={modalVerRegistrarMovimientoTanqueJornaleroIsOpen} onClose={closeModalVerRegistrarMovimientoTanqueJornaleroIsOpen}>
        <Box sx={styleModal}>
          <Typography variant="h6" mb={2} style={{ textAlign: 'center' }}>
            Nueva operacion de tanques - {hoy}
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="tipo-movimiento-label">Tipo de Movimiento</InputLabel>
            <Select
              labelId="tipo-movimiento-label"
              value={tipoMovimiento}
              label="Tipo de Movimiento"
              onChange={(e) => setTipoMovimiento(e.target.value)}
            >
              <MenuItem value="despacho">Despacho</MenuItem>
              <MenuItem value="movimiento">Movimiento entre Tanques</MenuItem>
              <MenuItem value="carga">Carga de Tanque</MenuItem>
            </Select>
          </FormControl>

          {(tipoMovimiento === 'movimiento' || tipoMovimiento === 'despacho') && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="tanque-origen-label">Tanque Origen</InputLabel>
              <Select
                labelId="tanque-origen-label"
                value={tanqueOrigen}
                label="Tanque Origen"
                onChange={(e) => setTanqueOrigen(e.target.value)}
              >
                {tanques.map((t) => (
                  <MenuItem key={t.nombre} value={t.nombre}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {(tipoMovimiento === 'movimiento' || tipoMovimiento === 'carga') && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="tanque-destino-label">Tanque Destino</InputLabel>
              <Select
                labelId="tanque-destino-label"
                value={tanqueDestino}
                label="Tanque Destino"
                onChange={(e) => setTanqueDestino(e.target.value)}
              >
                {tanques.map((t) => (
                  <MenuItem key={t.nombre} value={t.nombre}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Cantidad (L)"
            type="number"
            fullWidth
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Responsable"
            fullWidth
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            sx={{ mb: 2 }}
          />

          {tipoMovimiento === 'despacho' && (
            <>
              <TextField
                label="Cliente"
                fullWidth
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Detalle de Factura"
                fullWidth
                value={factura}
                onChange={(e) => setFactura(e.target.value)}
                sx={{ mb: 2 }}
              />
            </>
          )}

          <TextField
            label="Observaciones"
            fullWidth
            multiline
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handleSaveMovement}
          >
            Guardar Movimiento
          </Button>
        </Box>
      </Modal>

      {/* Snackbar for success message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Movimiento registrado correctamente!
        </Alert>
      </Snackbar>
      
      {/* Modal para reportar niveles diarios en tanques jornaleros */}
      <ReportarNivelesTanquesJornaleros 
        open={modalReportarNivelesTanquesJornalerosIsOpen}
        onClose={closeModalReportarNivelesTanquesJornalerosIsOpen}
      />

      <DetallesMovimientosDeTanquesJornaleros 
        open={modalVerMovimientosTanquesJornalerosIsOpen}
        onClose={closeModalVerMovimientosTanquesJornaleros}
      />

      <GraficoNivelesTanquesPorDiaModal 
        modalIsOpen={modalOpenModalGraficoNivelesModalIsOpen}
        onClose={closeModalGraficoNivelesModalIsOpen}
      />

      <ExcelStyleFooter 
        openModalGraficoNivelesModalOpen={openModalGraficoNivelesModalIsOpen}
        openModalFromFooterRegistrarMovimientoTanqueJornalero={openModalFromFooterRegistrarMovimientoTanqueJornalero}
        openModalReportarNivelesTanquesJornaleros={openModalReportarNivelesTanquesJornalerosIsOpen}     
      />

      <SpeedDialComponent
       VerMovimientosTanquesJornaleros={openModalVerMovimientosTanquesJornaleros}
        sx={{
          position: 'fixed',
          top: 16,
          right: 35,
          zIndex: 1300,
          '&:focus, &:active': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
}

export default SeguimientoTKJornaleros;
