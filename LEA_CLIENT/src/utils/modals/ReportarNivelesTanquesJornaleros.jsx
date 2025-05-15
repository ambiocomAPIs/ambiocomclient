import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Modal, TextField, Button } from '@mui/material';
import Swal from 'sweetalert2'; // Agrega la importación de SweetAlert2

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

const ReportarNivelesTanquesJornaleros = ({ open, onClose }) => {
  const [tanquesData, setTanquesData] = useState([]);
  const [inputs, setInputs] = useState({});
  const [responsable, setResponsable] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:4041/api/tanquesjornaleros/nivelesdiariostanquesjornaleros')
      .then((res) => {
        setTanquesData(res.data);
      })
      .catch((err) => {
        console.error('Error al obtener tanques:', err);
      });
  }, []);

  const handleInputChange = (name, value) => {
    setInputs((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    console.log("FECHA REGISTRO:", hoy);
    
    const datosAEnviar = tanquesUnicos.map((tanque) => ({
      NombreTanque: tanque.NombreTanque,
      NivelTanque: Number(inputs[tanque.NombreTanque]) || 0,
      Responsable: responsable,
      Observaciones: observaciones,
      FechaRegistro: hoy,
    }));
    
    axios
      .post(
         'http://localhost:4041/api/tanquesjornaleros/nivelesdiariostanquesjornaleros',
        // 'http://localhost:4041/api/tanquesjornaleros/',
        datosAEnviar
      )
      .then((res) => {
        console.log('Datos enviados correctamente:', res.data);
        
        // Alerta de éxito con SweetAlert
        Swal.fire({
          title: '¡Éxito!',
          text: 'Los datos se han subido correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          // Recargar la página después de mostrar la alerta
          window.location.reload();
        });
        
        onClose();
        window.location.reload();
      })
      .catch((err) => {
        console.error('Error al enviar los datos:', err);
        onClose();
        // Alerta de error con SweetAlert
        Swal.fire({
          title: '¡Error!',
          text: `error al subir los datos: ${err.response.data.error}`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      });
  };

  const tanquesUnicos = Array.from(
    new Map(tanquesData.map((t) => [t.NombreTanque, t])).values()
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={styleModal}>
        <Typography variant="h5" mb={3} textAlign="center" color="blue">
          MEDIDAS DE LOS TANQUES
        </Typography>
        {tanquesData.length === 0 ? (
          <Typography>No hay datos de tanques disponibles.</Typography>
        ) : (
          tanquesUnicos.map((tanque, index) => (
            <Box key={index} sx={{ mb: 0 }}>
              <TextField
                label={'TK-' + tanque.NombreTanque}
                type="number"
                fullWidth
                value={inputs[tanque.NombreTanque] || ''}
                onChange={(e) =>
                  handleInputChange(tanque.NombreTanque, e.target.value)
                }
                sx={{ mb: 2 }}
              />
            </Box>
          ))
        )}

        <TextField
          label="Responsable"
          fullWidth
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Observaciones"
          fullWidth
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Reportar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ReportarNivelesTanquesJornaleros;
