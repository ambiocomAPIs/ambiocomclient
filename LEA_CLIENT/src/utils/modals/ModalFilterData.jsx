import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2'
import axios from 'axios';

const ModalFilterData = ({ isOpen, onClose, data, module }) => {
  const [selectedVariable, setSelectedVariable] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [availableKeys, setAvailableKeys] = useState([]);

  // Extraemos las claves del primer objeto de los datos, sin incluir el `id`
  useEffect(() => {
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter(
        (key) => key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'Accion' && key !== '__v'
      );
      setAvailableKeys(keys);
      setFilteredData(data); // Inicializamos el filtro con toda la data
    }
  }, [data]);

  // Función para obtener el PDF
  const fetchPdf = async (rowId) => {
    try {
      const response = await axios.get(`https://ambiocomserver.onrender.com/api/pdfs/${rowId}`, {
        responseType: 'blob', // Especifica que esperas un blob (archivo binario)
      });
      
      if(response.status == 404){
        window.alert("No se encontró MRC asociado a este material")
      }

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // Abre el PDF en una nueva pestaña
      const newTab = window.open(pdfUrl, '_blank');
      if (newTab) newTab.focus();

    } catch (error) {
      console.error('Error al obtener el PDF:', error);
      window.alert("No se encontró MRC asociado a este material")
    }
  };

  // Cambiar la variable seleccionada
  const handleSelectChange = (event) => {
    setSelectedVariable(event.target.value);
  };

  // Cambiar el valor del filtro
  const handleInputChange = (event) => {
    setFilterValue(event.target.value);
  };

  // Aplicar filtro según la variable seleccionada y el valor del filtro
  const applyFilter = () => {
    if (selectedVariable && filterValue) {
      const filtered = data.filter((item) =>
        item[selectedVariable]?.toString().includes(filterValue)
      );
      setFilteredData(filtered);
    }
  };

  // Mostrar toda la data sin aplicar filtro
  const showAllData = () => {
    setSelectedVariable('');
    setFilterValue('');
    setFilteredData(data); // Deshacer el filtro y mostrar todos los datos
  };

  // Función para eliminar un item de la base de datos
  const deleteItem = async (rowId) => {
    console.log("ejecutando deleteItem id:", rowId);
  
    const UrlRequest = module === "dataTableColors" ? "tableColors/dataColors" : "table/data";
    
    // Obtener el modal actual para ajustar el z-index
    const modalElement = document.querySelector('.MuiDialog-root');
    
    // Reducir el z-index del modal para que quede detrás del SweetAlert
    if (modalElement) {
      modalElement.style.zIndex = 999; // Asumimos que el Swal tendrá un z-index mayor (ejemplo: 1050)
    }
  
    // Primero, mostramos una alerta de confirmación utilizando SweetAlert
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((result) => {
      // Restaurar el z-index del modal después de que SweetAlert se cierre
      if (modalElement) {
        modalElement.style.zIndex = ''; // Restaurar el z-index original
      }
  
      if (result.isConfirmed) {
        // Realizamos la eliminación del item
        console.log("url para eliminar:",`https://ambiocomserver.onrender.com/api/${UrlRequest}/${rowId}`);
        
        axios.delete(`https://ambiocomserver.onrender.com/api/${UrlRequest}/${rowId}`)
          .then(() => {
            // Actualizamos los datos filtrados eliminando el item de la lista
            setFilteredData((prevData) => prevData.filter(item => item._id !== rowId));
  
            // Mostramos una notificación de éxito con SweetAlert
            Swal.fire({
              icon: 'success',
              title: 'Fila eliminada',
              text: 'La fila se ha eliminado correctamente.',
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.reload();
              }
            });

          })
          .catch((err) => {
            if (modalElement) {
              modalElement.style.zIndex = ''; // Restaurar el z-index original
            }
            // Notificación de error si la eliminación falla
            Swal.fire({
              icon: 'error',
              title: 'Error al eliminar la data',
              text: "Hubo un error al eliminar el item.",
            });
          });
      }
    });
  };  
  
  // Función para renderizar el campo `certificadoAnalisis` como enlace solo si el módulo es `dataTable`
  const renderCertificadoAnalisis = (item) => {
    if (module === 'dataTable') {
      return (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); // Previene el comportamiento predeterminado del enlace
            fetchPdf(item._id); // Usamos el `_id` para hacer la petición
          }}
        >
          {" "+"Ver Certificado"}
        </a>
      );
    }
    return null; // No mostrar nada si no es `dataTable`
  };

  // Renderizar cada item
  const renderItem = (item, index) => {
    // Copiar el item y eliminar la propiedad `_id` antes de mostrarlo
    const { _id, ...displayItem } = item;

    return (
      <div key={index} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px' }}>
          {availableKeys.map((key) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <strong>{key}:</strong>
              {/* Mostrar los valores del item, pero no el `id` */}
              {key === "certificadoAnalisis" ? renderCertificadoAnalisis(item) : displayItem[key] || 'No disponible'}
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => deleteItem(item._id)} // Pasamos el _id aquí
          >
            Eliminar
          </Button>
          <hr style={{ margin: '20px 0', borderColor: '#e0e0e0', borderWidth: '1px' }} />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle sx={{ textAlign: 'center' }}>Filtrar Data</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Selecciona una variable</InputLabel>
          <Select
            value={selectedVariable}
            onChange={handleSelectChange}
            label="Selecciona una variable"
          >
            {availableKeys.map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
            <MenuItem value="allData">All Data</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Filtrar por"
          variant="outlined"
          value={filterValue}
          onChange={handleInputChange}
          margin="normal"
          placeholder="Escribe para filtrar..."
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={applyFilter}
          sx={{ marginTop: 2 }}
        >
          Aplicar Filtro
        </Button>

        <div style={{ marginTop: 20 }}>
          <h3>Datos filtrados:</h3>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => renderItem(item, index))
          ) : (
            <p>No hay datos que coincidan</p>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cerrar
        </Button>
        <Button onClick={showAllData} color="default">
          Ver toda la data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalFilterData;
