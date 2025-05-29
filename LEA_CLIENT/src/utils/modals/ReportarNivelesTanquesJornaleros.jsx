import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Modal, TextField, Button, IconButton, Tooltip, CircularProgress} from '@mui/material';

import Swal from 'sweetalert2';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
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

  // LOADING PARA evitar doble peticion
  const [loadingButton, setLoadingButton] = React.useState(false);
  // No mover de posicion, la posicion es clave para el funcionamiento, debe estar por encima de los estados
  const LOCAL_STORAGE_KEY = 'nivelesTanquesJornalerosDraft';

  const draft = (() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
    } catch (e) {
      console.error("Error al parsear localStorage:", e);
      return {};
    }
  })();

  const [tanquesData, setTanquesData] = useState([]);
  const [inputs, setInputs] = useState({});
  const [responsable, setResponsable] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('');
  const [eliminados, setEliminados] = useState(0);
  // trae los usurios del sesio storage
  const [usuario, setUsuario] = useState(null);

  // guarda cada qe cambien los inputs
  useEffect(() => {
    const hayDatos = Object.keys(inputs).length > 0 || responsable || observaciones || fecha;
  
    if (hayDatos) {
      const draftData = {
        inputs,
        responsable,
        observaciones,
        fecha,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
    }
  }, [inputs, responsable, observaciones, fecha]);

  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draft) {
        try {
          const data = JSON.parse(draft);
          setInputs(data.inputs || {});
          setResponsable(data.responsable || '');
          setObservaciones(data.observaciones || '');
          setFecha(data.fecha || '');
        } catch (e) {
          console.error("Error al recuperar borrador:", e);
        }
      }
    }
  }, [open]);

  const handleCancelar = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onClose();
  };

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

  useEffect(() => {
    axios
      .get('https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros')
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
    setLoadingButton(true)
    //const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD ojo toma en otra zona horaria
    const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
    const datosAEnviar = tanquesUnicos.map((tanque) => ({
      NombreTanque: tanque.NombreTanque,
      NivelTanque: Number(inputs[tanque.NombreTanque]) || 0,
      Responsable: responsable,
      Observaciones: observaciones,
      FechaRegistro: fecha,
    }));

    if(fecha == "" || fecha == null || fecha == undefined)
     {
      onClose()
      Swal.fire({
        title: 'Fecha Incorrecta',
        text: 'Por Favor Selecciona Una Fecha Valida',
        icon: "question",
        confirmButtonText: 'Aceptar',
      })
     }else{
      axios
      .post(
         'https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros',datosAEnviar
      )
      .then((res) => {
        setLoadingButton(true)
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onClose();
        Swal.fire({
          title: '¡Éxito!',
          text: 'Los datos se han subido correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          window.location.reload();
        });
      })
      .catch((err) => {
        console.error('Error al enviar los datos:', err);
        setLoadingButton(false)
        onClose();
        // Alerta de error con SweetAlert
        Swal.fire({
          title: '¡Error!',
          text: `error al subir los datos: ${err.response.data.error}`,
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      });
     }
  };

  const handleEliminarPorFecha = async () => {
    setEliminados(0);
  
    if (!fecha) {
      onClose();
      Swal.fire({
        title: 'No se ha asociado una Fecha',
        text: 'Por favor asocie una fecha a la operación',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    onClose();
    const confirmacion = await Swal.fire(
      {
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar los datos del día ${fecha}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
    });
  
    if (!confirmacion.isConfirmed) {
      return;
    }
  
    const clavePrompt = await Swal.fire({
      title: 'Confirmación requerida',
      text: 'Por favor ingresa la clave para continuar:',
      input: 'password',
      inputPlaceholder: 'Clave de autorización',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar una clave.';
        return null;
      }
    });
  
    const claveIngresada = clavePrompt.value;
    // Validar clave
    const CLAVE_AUTORIZADA = 'admin123'; 
    if (claveIngresada !== CLAVE_AUTORIZADA) {
      onClose();
      Swal.fire({
        title: 'Clave incorrecta',
        text: 'La clave que ingresaste no es válida.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    try {
      const response = await axios.delete('https://ambiocomserver.onrender.com/api/tanquesjornaleros/eliminarporfecha', {
        data: { FechaRegistro: fecha },
      });
  
      onClose();
      Swal.fire({
        title: 'Datos eliminados',
        text: `Los datos del ${fecha} se han eliminado correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      onClose();
      Swal.fire({
        title: 'Error al eliminar los registros',
        text: err.response?.data?.message || 'Ocurrió un error al eliminar los registros.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  // no filtra por orden, solo que sean unicos
  // const tanquesUnicos = Array.from(
  //   new Map(tanquesData.map((t) => [t.NombreTanque, t])).values()
  // );

  const tanquesUnicos = Array.from(
    new Map(tanquesData.map((t) => [t.NombreTanque, t])).values()
  ).sort((a, b) => {
    const numA = parseFloat(a.NombreTanque);
    const numB = parseFloat(b.NombreTanque);
  
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
  
    return b.NombreTanque.localeCompare(a.NombreTanque);
  });
  

  const handleChangeFecha = (e) => {
    setFecha(e.target.value);
    setLoadingButton(false)
    console.log("fecha seleccionada:", e.target.value);
    
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
          <input 
           type="date" 
           value={fecha} 
           onChange={handleChangeFecha} 
           max={new Date().toLocaleDateString('en-CA')}  // maximo hoy
           style={{
            padding: '10px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
            outline: 'none',
            transition: 'border-color 0.2s ease-in-out',
           }}
           onFocus={(e) => (e.target.style.borderColor = '#007bff')}
           onBlur={(e) => (e.target.style.borderColor = '#ccc')}
          />
          <Button 
            variant="contained" 
            disabled={loadingButton} 
            color="primary" 
            onClick={handleSubmit}  
            endIcon={
              loadingButton ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <></>
              )
            }
            >
            Reportar
          </Button>
          <Tooltip title="Eliminar Registro" enterDelay={100}>
          <IconButton color="error" onClick={handleEliminarPorFecha} 
             disabled={!['developer','gerente'].includes(usuario?.rol)}
          >
            <DeleteForeverIcon />
          </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Modal>
  );
};

export default ReportarNivelesTanquesJornaleros;
