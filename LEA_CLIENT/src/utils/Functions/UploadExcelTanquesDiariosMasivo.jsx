import React, { useState } from 'react';
import axios from 'axios';

const CargarMasivaTanquesDiariosExcel = () => {
  const [file, setFile] = useState(null); // Estado para almacenar el archivo seleccionado
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [message, setMessage] = useState(''); // Mensaje de éxito o error

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]; // Obtener el primer archivo seleccionado
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, selecciona un archivo primero.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file); // Agregar el archivo al formulario

    setLoading(true); // Iniciar carga
    setMessage('Cargando...');

    try {
      // Enviar el archivo al backend
      const response = await axios.post(
        'http://localhost:4041/api/tanquesjornaleros/nivelesdiariostanquesjornaleros/uploadExcel', // Endpoint donde se cargará el archivo
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } } // Encabezados necesarios para carga de archivos
      );
      
      setMessage('Archivo cargado exitosamente.');
      setLoading(false);
      console.log('Respuesta del servidor:', response.data);
    } catch (error) {
      setLoading(false);
      setMessage('Error al cargar el archivo.');
      console.error('Error al cargar el archivo', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Cargar Datos de Niveles de Tanques</h2>
      <input
        type="file"
        accept=".xlsx,.xls" // Aceptar solo archivos Excel
        onChange={handleFileChange} // Detectar cuando el usuario selecciona un archivo
        style={{ marginBottom: '15px' }}
      />
      <div>
        <button
          onClick={handleUpload} // Enviar el archivo
          disabled={loading || !file} // Desactivar el botón si no hay archivo o está cargando
          style={{
            padding: '10px 20px',
            backgroundColor: '#0288d1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || !file ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Cargando...' : 'Subir Archivo'}
        </button>
      </div>
      {message && <p>{message}</p>} {/* Mostrar el mensaje de éxito o error */}
    </div>
  );
};

export default CargarMasivaTanquesDiariosExcel;
