import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import SendIcon from '@mui/icons-material/Send';

const FileUpload = ({ uploadrowId }) => {
  const [file, setFile] = useState(null);
  const [fileExtension, setFileExtension] = useState('');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('Arrastra y suelta tu archivo aquí');

  const { rowId } = useParams(); // Obtener el rowId de los parámetros de la URL

  console.log("uploadrowId useParams()", rowId);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      updateFileInfo(selectedFile);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) {
      updateFileInfo(selectedFile);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Evitar el comportamiento por defecto
  };

  const updateFileInfo = (selectedFile) => {
    setFile(selectedFile);
    const extension = selectedFile.name.split('.').pop();
    setFileExtension(extension);
    setFileName(selectedFile.name); // Actualizar el nombre del archivo
    setMessage(`La extensión del archivo es: ${extension}`);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
        setMessage('Por favor, selecciona un archivo primero.');
        return;
    }
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('rowId', rowId);

    try {
        // Verificar si ya existe un PDF con este rowId
        const checkResponse = await axios.get(`http://localhost:4041/api/pdfs/${rowId}`);
        
        // Si ya existe un PDF, preguntamos si desea reemplazarlo
        if (checkResponse.status === 200) {
            const result = await Swal.fire({
                title: 'Ya existe un PDF asociado a este material de referencia',
                text: '¿Deseas sustituirlo por el archivo actual?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, sustituir',
                cancelButtonText: 'No, cancelar'
            });

            if (result.isConfirmed) {
                // Reemplazar el PDF usando el endpoint updatePdf
                const replaceFormData = new FormData();
                replaceFormData.append('pdf', file);
                replaceFormData.append('rowId', rowId);

                const replaceResponse = await axios.post('http://localhost:4041/api/pdfs/update', replaceFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Mostrar el modal con el contador y redirección
                let timerInterval;
                Swal.fire({
                    title: 'Reemplazo exitoso',
                    html: 'Redirigiendo en <b></b> milisegundos.',
                    timer: 2000,  // Tiempo de espera en milisegundos
                    timerProgressBar: true,
                    didOpen: () => {
                        Swal.showLoading();
                        const timer = Swal.getPopup().querySelector("b");
                        timerInterval = setInterval(() => {
                            timer.textContent = `${Swal.getTimerLeft()}`;
                        }, 100);
                    },
                    willClose: () => {
                        clearInterval(timerInterval);
                    }
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.timer) {
                        window.location = '/';  // Redirige después del tiempo de espera
                    }
                });

                setMessage(`Archivo reemplazado exitosamente: ${replaceResponse.data.filename}`);
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Si no existe un PDF asociado, hacemos la carga normalmente
            const uploadResponse = await axios.post('http://localhost:4041/api/pdfs/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Mostrar el modal con el contador y redirección después de la carga exitosa
            let timerInterval;
            Swal.fire({
                title: 'Archivo cargado correctamente',
                html: 'Redirigiendo en <b></b> milisegundos.',
                timer: 2000,  // Tiempo de espera en milisegundos
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                    const timer = Swal.getPopup().querySelector("b");
                    timerInterval = setInterval(() => {
                        timer.textContent = `${Swal.getTimerLeft()}`;
                    }, 100);
                },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    window.location = '/';  // Redirige después del tiempo de espera
                }
            });

            setMessage(`Archivo subido exitosamente: ${uploadResponse.data.filename}`);
        } else {
            Swal.fire('Error al verificar el archivo: ' + error.message);
            setMessage('Error al verificar el archivo: ' + error.message);
        }
    }

    // Limpiar el formulario y el estado después de la carga
    setPreviewUrl('');
    setFile(null);
    setFileName('Arrastra y suelta tu archivo aquí');
};

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Box display="flex" height="100vh" sx={{ backgroundColor: '#f5f5f5' }}>
      <Box flex={1} display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={2}>
        <Typography variant="h4" sx={{ mb: 2 }}>Cargar Archivo</Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '1200px' }}>
          <TextField
            type="file"
            onChange={handleFileChange}
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{
              accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint, image/*', // Especifica tipos de archivo aceptados
            }}
          />
          <Box
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            sx={{
              border: file ? '3px dashed #3366ff' : '2px dashed #ccc',
              borderRadius: '4px',
              p: 2,
              textAlign: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              mb: 2,
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography variant="body1" sx={{ color: 'blue' }}>
              {file ? file.name : 'Arrastra y suelta tu archivo aquí'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              type="submit"
              disabled={!file}
              endIcon={<SendIcon />}
            >
              Subir
            </Button>
          </Box>
        </form>
        {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
      </Box>

      {/* Contenedor de vista previa */}
      <Box flex={1} display="flex" justifyContent="center" alignItems="center" p={2}>
        {previewUrl && (
          <Box sx={{ width: '100%', maxWidth: '1200px' }}>
            {fileExtension === 'pdf' ? (
              <iframe src={previewUrl} width="100%" height="850px" title="Previsualización de PDF" />
            ) : fileExtension === 'doc' || fileExtension === 'docx' ? (
              <iframe 
                src={`https://docs.google.com/gview?url=${previewUrl}&embedded=true`} 
                width="100%" 
                height="400px" 
                title="Previsualización de Word" 
              />
            ) : fileExtension === 'ppt' || fileExtension === 'pptx' ? (
              <img src={`${process.env.PUBLIC_URL}/logos/powerpointlogo.png`} alt="Previsualización" width="95%" />
            ) : (
              <img src={previewUrl} alt="Previsualización" width="95%" />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FileUpload;
