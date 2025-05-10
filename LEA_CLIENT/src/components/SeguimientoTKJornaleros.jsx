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
  FormControl
} from '@mui/material';

import SpeedDialComponent from '../utils/speedDial/SpeedDial';
import ExcelStyleFooter from '../utils/ExcelStyleFooter';

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
  const [nivelFinal, setNivelFinal] = useState('');
  const [tanques, setTanques] = useState([]);
  const [filteredTanques, setFilteredTanques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVerRegistrarMovimientoTanqueJornaleroIsOpen, setModalVerRegistrarMovimientoTanqueJornaleroIsOpen] = useState(false);
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
    setNivelFinal('');
  };

  useEffect(() => {
    axios
      .get('https://ambiocomserver.onrender.com/api/seguimientotanquesjornaleros/GetTanquesData')
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
        <Typography variant="h4" sx={{ textAlign: 'center', flexGrow: 1, marginLeft: '-380px' }}>
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
            Nuevo Movimiento - {hoy}
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
            label="Nivel Final (L)"
            type="number"
            fullWidth
            value={nivelFinal}
            onChange={(e) => setNivelFinal(e.target.value)}
            sx={{ mb: 2 }}
          />

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
            onClick={() => {
              const data = {
                tipoMovimiento,
                tanqueOrigen,
                tanqueDestino,
                cantidad,
                responsable,
                cliente: tipoMovimiento === 'despacho' ? cliente : null,
                factura: tipoMovimiento === 'despacho' ? factura : null,
                nivelFinal,
                observaciones,
                fecha: hoy,
              };
              console.log('Movimiento registrado:', data);
              handleClose();
            }}
          >
            Guardar Movimiento
          </Button>
        </Box>
      </Modal>

      <ExcelStyleFooter 
        openModalFromFooterRegistrarMovimientoTanqueJornalero={openModalFromFooterRegistrarMovimientoTanqueJornalero}
      />

      <SpeedDialComponent
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
