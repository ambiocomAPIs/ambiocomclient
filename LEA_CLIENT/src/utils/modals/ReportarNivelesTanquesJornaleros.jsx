import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Modal, TextField, Button } from '@mui/material';

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
  const [responsable, setResponsable] = useState(''); // Estado para el responsable
  
  useEffect(() => {
    // Obtén la data de los tanques
    axios
      .get('https://ambiocomserver.onrender.com/api/seguimientotanquesjornaleros/GetTanquesData')
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
    console.log('Inputs generados:', inputs);
    console.log('Responsable:', responsable); // Mostramos el responsable
    onClose();  // Cierra el modal después de guardar los datos
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={styleModal}>
        <Typography variant="h5" mb={3} textAlign="center" color="blue">
          MEDIDAS DE LOS TANQUES
        </Typography>
        {tanquesData.length === 0 ? (
          <Typography>No hay datos de tanques disponibles.</Typography>
        ) : (
          tanquesData.map((tanque, index) => (
            <Box key={index} sx={{ mb: 0 }}>
              <Typography variant="body1" fontWeight="bold">
                {tanque.nombre}
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={inputs[tanque.nombre] || ''}
                onChange={(e) => handleInputChange(tanque.nombre, e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          ))
        )}

        {/* Campo para ingresar el responsable */}
        <TextField
          label="Responsable"
          fullWidth
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}  // Actualizamos el estado del responsable
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
