import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Stack,
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
  FormControl, 
  InputLabel,
  Select,
  MenuItem 
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
  const [fechaFiltro, setFechaFiltro] = useState(''); // Nuevo estado para filtro por fecha
  const [modalVerRegistrarMovimientoTanqueJornaleroIsOpen, setModalVerRegistrarMovimientoTanqueJornaleroIsOpen] = useState(false);
  const [modalReportarNivelesTanquesJornalerosIsOpen, setModalReportarNivelesTanquesJornalerosIsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [modalVerMovimientosTanquesJornalerosIsOpen, setModalVerMovimientosTanquesJornalerosIsOpen] = useState(false);
  const [modalOpenModalGraficoNivelesModalIsOpen, setopenModalGraficoNivelesModalIsOpen] = useState(false);
  // trae los usurios del sesio storage
  const [usuario, setUsuario] = useState(null);
  
  const navigate = useNavigate();

  const hoy = new Date().toLocaleDateString('es-ES');

    useEffect(() => {
      const storedUser = sessionStorage.getItem("usuario");
      if (storedUser) {
        try {
          setUsuario(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error al parsear usuario:", e);
        }
      }
      }, []);

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
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Meses empiezan desde 0
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${dia}`;
    setFechaFiltro(fechaFormateada); // Almacena la fecha formateada en el estado
  }, []);

  useEffect(() => {
    axios
      .get('https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros')
      .then((res) => {
        setTanques(res.data);
        setFilteredTanques(res.data);
      })
      .catch((err) => {
        console.error('Error al obtener tanques:', err);
      });
  }, []);

  useEffect(() => {
    // Filtrar los tanques por fecha
    const filtered = tanques.filter((t) => {
      const fechaRegistro = t.FechaRegistro; // Suponiendo que el campo se llama FechaRegistro
      return fechaFiltro ? fechaRegistro === fechaFiltro : true;
    });

    if (searchQuery === '') {
      setFilteredTanques(filtered);
    } else {
      setFilteredTanques(filtered.filter((t) => t?.NombreTanque?.toLowerCase().includes(searchQuery.toLowerCase())));
    }
  }, [searchQuery, tanques, fechaFiltro]);

   // Redireccionar si no tiene rol autorizado
   useEffect(() => {
    if (usuario === null) return; // Espera a que el usuario se cargue
  
    const rolesPermitidos = ["logistica", "gerente", "supervisor", "developer"];
    if (!rolesPermitidos.includes(usuario.rol)) {
      navigate('/');
    }
  }, [usuario, navigate]);

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
      .post('https://ambiocomserver.onrender.com/api/reportar/operacionesdetanques', data)
      .then((response) => {
        console.log('Movimiento registrado:', response.data);
        setSnackbarOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
        handleClose();
      })
      .catch((error) => {
        console.error('Error al registrar movimiento:', error);
      });
  };

  const InformacionTanques = {
    "402A": [628, 9620],"402B": [628, 9620],"801A": [640, 139982],"801B": [640, 139982],
    "305": [213750, 9620],"403A": [255, 2830],"403B": [255, 2830],"803": [185, 38680],
    "D300": [92000, 44390],"401A": [300, 2681],"401B": [300, 2681],"802": [1001, 6615],
    "805": [360, 44390],"806": [360, 44390],"404": [160, 1000],"804": [290, 2120],
    "405": [450, 4966], "102B": [630, 139976],"102A": [630, 139976],"304": [213750, 0],
    "807": [360, 44390],"808": [360, 44390]
  };

  const rolesPermitidos = ["logistica", "gerente", "supervisor", "developer"];
  if (!rolesPermitidos.includes(usuario?.rol)) {
    return null; 
  }

  return (
    <Box sx={{ padding: 2, pb: 10 }}>
      <br/>
      <br/>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Filtrar Tanque"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: '20%' }}
        />
        <TextField
          label="Fecha"
          type="date"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ width: '12%', marginLeft:"10px" }}
        />
        <Typography variant="h4" sx={{ textAlign: 'center', flexGrow: 1, marginLeft: '-550px' }}>
          Niveles de Tanques Jornaleros
        </Typography>
      </Box>

      <Stack spacing={2}>
        {filteredTanques.length > 0 ? (
          filteredTanques.map((tanque, index) => {
            // const porcentaje = Math.min((tanque.nivel / tanque.capacidad) * 100, 100);

            const infoTanque = InformacionTanques[tanque.NombreTanque]; // obtenemos [capacidad, factor]
    
            if (!infoTanque) return null; // Si no hay datos del tanque en el objeto, salta
        
            const capacidad = infoTanque[0];
            const factor = infoTanque[1];
            const volumen = tanque.NivelTanque * factor;
            const porcentaje = Math.min((tanque.NivelTanque / (capacidad/100) ) * 100, 100);

            // console.log("capacidad:", capacidad);
            // console.log("factor:", factor);
            // console.log("volumen:", volumen);
            // console.log("porcentaje:", porcentaje);
            
            return (
              <Paper key={index} elevation={4} sx={{ padding: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  TK-{tanque.NombreTanque}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacidad: Nivel: {tanque.NivelTanque} m  | Capacidad: {capacidad/100} m | Volumen: {volumen} L ({porcentaje.toFixed(1)}%)
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
          })
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            No hay datos para el día seleccionado.
          </Typography>
        )}
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
              {[...new Map(tanques.map(t => [t.NombreTanque, t])).values()].map((t) => (
                <MenuItem key={t.NombreTanque} value={t.NombreTanque}>
                 TK-{t.NombreTanque}
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
               {[...new Map(tanques.map(t => [t.NombreTanque, t])).values()].map((t) => (
                <MenuItem key={t.NombreTanque} value={t.NombreTanque}>
                 TK-{t.NombreTanque}
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

      {/* Modales */}
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
        moduloActivo={"tanquesjornaleros"}
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
