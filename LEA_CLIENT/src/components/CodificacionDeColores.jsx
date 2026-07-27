import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  Tooltip, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Button, 
  IconButton ,
  Snackbar,
  Alert
  } from '@mui/material';

import Swal from 'sweetalert2'

import {ExportExcelWithTemplate} from '../utils/Functions/DownloadExcelData'
import ModalFilterData from '../utils/modals/ModalFilterData';

import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PostAddIcon from '@mui/icons-material/PostAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CircularProgress from '@mui/material/CircularProgress';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

const CodificacionDeColoresComponent = React.memo(() => {
  const [data, setDataColors] = useState([]);
  const [editingCell, setEditingCell] = useState({ rowIndex: null, column: null });
  const [tempValue, setTempValue] = useState('');
  const [ColumValue, setColumValue] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);  // Estado para controlar el Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState("");  // Mensaje del Snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState('');  // 'success' o 'error'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [openUploadExcelModal, setOpenUploadExcelModal] = useState(false);
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);

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
    axios.get('https://ambiocomserver.onrender.com/api/tableColors/dataColors')
      .then(response => {
        setDataColors(response.data);
        setLoading(false);
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error al cargar los datos",
          footer: '<a href="#">Why do I have this issue?</a>'
        });
        //setError('Error al cargar los datos');
        setLoading(false);
      });
  }, []);
  
    if (error) {
      return <div>{error}</div>;
    }

    const handleBlur = async () => {
      const row = data[editingCell.rowIndex];
      const updatedField = editingCell.column;
      const updatedValue = tempValue;
    
      if (!row || !row._id) return;
    
      const editedRow = {
        _id: row._id,
        ...row,
        [updatedField]: updatedValue,
      };
    
      try {
        const response = await axios.put(
          'https://ambiocomserver.onrender.com/api/tableColors/dataColorsreplaceall',
          [editedRow]
        );
    
        if (response.status === 200) {
          const updatedRow = response.data[0]; // El backend devuelve un array
          const newData = [...data];
          newData[editingCell.rowIndex] = updatedRow;
          setDataColors(newData);
    
          setSnackbarMessage('Datos actualizados correctamente');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error(error);
        setSnackbarMessage("Hubo un error al guardar los datos");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    };
    
  const agregarDataFila = () => {
    const newFile = {
      Reactivo: '----',
      proveedor: '----',
      Codigo: '----',
      Lote: '----',
      fechaVencimiento: '--/--/--', 
      CAS: '----', 
      Color: '----',
      Accion: '----'
    };
    axios.post('https://ambiocomserver.onrender.com/api/tableColors/dataColors', newFile)
      .then(response => {        
        setDataColors(prevData => [response.data, ...prevData]);
      })
      .catch(err => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: `Error al agregar la fila: ${err.response ? err.response.data.message : err.message}`,
          showConfirmButton: false,
          timer: 1500
        });
        console.error(err);
      });
  };

const deleteRowData = (rowId) => {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      axios.delete(`https://ambiocomserver.onrender.com/api/tableColors/dataColors/${rowId}`)
        .then(() => {
          axios.get('https://ambiocomserver.onrender.com/api/tableColors/dataColors')
            .then(updatedDataResponse => {
              setDataColors(updatedDataResponse.data);
              setSnackbarMessage('Datos eliminados correctamente');
              setSnackbarSeverity('success');
              setSnackbarOpen(true); 

              Swal.fire({
                icon: 'success',
                title: 'Fila eliminada',
                text: 'La fila se ha eliminado correctamente.',
              });
            })
            .catch(err => {
              const errorMessage = err.response ? err.response.data.message : err.message;
              setSnackbarMessage(`Error al obtener datos: ${errorMessage}`);
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
              Swal.fire({
                icon: 'error',
                title: 'Error al obtener los datos',
                text: errorMessage,
              });
            });
        })
        .catch(err => {
          const errorMessage = err.response ? err.response.data.message : err.message;
          setSnackbarMessage(`Error al eliminar la fila: ${errorMessage}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar la fila',
            text: errorMessage,
          });
        });
    }
  });
};

const exportExcelDataTable =()=> {
  ExportExcelWithTemplate({data:data, module:"dataTableColors"}) 
}

const handleCloseModal = () => {
  setModalOpen(false);
};

const handleDoubleClick = (rowIndex, column) => {
  setEditingCell({ rowIndex, column });
  setTempValue(data[rowIndex][column]);
};

const handleChange = (event) => {
  setTempValue(event.target.value);
};

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.target.blur();
    setTimeout(() => {
      handleBlur();
    }, 100); 
  }
};

const handleSnackbarClose = () => {
  setSnackbarOpen(false);
};

const tableBodyRef = useRef(null);

const clickColumFixed = (columnClicked) => {
  if(columnClicked == ColumValue)
  {
    setColumValue(100000); 
  }else{
    setColumValue(columnClicked);
  }
};


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableBodyRef.current && !tableBodyRef.current.contains(event.target)) {
        clickColumFixed(100000); 
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ColumValue]);

  const filterData = (row) => {
    const excludedFields = ['_id', 'updatedAt', 'createdAt', '__v']; 
  
    return Object.keys(row)
      .filter((key) => !excludedFields.includes(key)) 
      .reduce((obj, key) => {
        obj[key] = row[key]; 
        return obj;
      }, {});
  };

    const handleOpenModalUploadExcel = () => {     
      setOpenUploadExcelModal(true);
    };
  
    const handleCloseModalUploadExcel = () => {
      setOpenUploadExcelModal(false);
    };

    const openFilterModal = () => {
      setIsModalFilterOpen(true);
    };
  
    const closeFilterModal = () => {
      setIsModalFilterOpen(false);
    };

  return (
    <TableContainer component={Paper}
        style={{
          height: '100vh', 
          overflow: 'auto', 
        }}
      >
      <Table style={{ width: '100%' }}>
          <TableHead>
            <TableRow style={{background: "#a0d9e8" }}>
              <TableCell 
               colSpan={8} 
                 style={{ 
                  fontSize: '18px', 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  border: '1px solid rgba(224, 224, 224, 1)', 
                  position: 'relative' 
                  }}
               >
              {/* Botón de filtro al inicio de la fila */}
             <Tooltip title="Filtro" enterDelay={100}>
              <IconButton
               style={{
                position: 'absolute', 
                top: '15px',           
                left: '10px',          
                zIndex: 1000,          
                outline: 'none'
                }}
                  onClick={() => openFilterModal()} 
                 >
                  <SearchIcon /> {/* Este es el ícono para el filtro */}
               </IconButton>
              </Tooltip>

              {/* Texto principal de la celda */}
               CODIFICACION DE COLOR PARA ALMACENAMIENTO DE REACTIVOS
              {/* Botón de Home al final de la fila */}
              <Tooltip title="INICIO" enterDelay={100}>
                <IconButton
                 style={{
                  position: 'absolute',  
                  bottom: '15px',        
                  right: '10px',         
                  zIndex: 1000,           
                  outline: 'none'
                 }}
                   onClick={() => window.location = "/"}  
                 >
                    <HomeIcon /> {/* Este es el ícono de "Home" */}
                </IconButton>
              </Tooltip>
            </TableCell>
            <TableCell colSpan={1} style={{ fontSize: '18px',backgroundColor:"#82ccdd", textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(224, 224, 224, 1)' }}>
             <Tooltip title="Nueva Fila" enterDelay={100}>
               <IconButton
                style={{ outline: "none", color: "black" }}
                onClick={() => agregarDataFila()}
               >
                <PostAddIcon/>
               </IconButton>
              </Tooltip>								
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} style={{ background: "#f8f9f5", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
             <strong>Area</strong>: Almacen de Reactivos		
            </TableCell>
            <TableCell colSpan={4} style={{ background: "#f8f9f5", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
             <strong>Revisado y aprobado</strong>: Paulo Duque - Gerente de Produccion					
            </TableCell>
            <TableCell colSpan={1} style={{ background: "#f7d9fd", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
             <Tooltip title="Subir Data" enterDelay={100}>
              <IconButton
               style={{ outline: "none", color: "black" }}
               onClick={() => handleOpenModalUploadExcel()}
              >
               <UploadIcon/>
              </IconButton>
             </Tooltip>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} style={{ background: "#f8f9f5", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              <strong>Fecha de actualización</strong>: 2025-05-05
            </TableCell>
            <TableCell colSpan={4} style={{ background: "#f8f9f5", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              <strong>Responsable actualización</strong>: Marlon Esteban Valencia - Coordinador Area Físico- Química					
            </TableCell>
            <TableCell colSpan={1} style={{ background: "#f7d9fd", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
             <Tooltip title="Descargar Data" enterDelay={100}>
               <IconButton
                style={{ outline: "none", color: "black" }}
                onClick={() => exportExcelDataTable()}
               >
                <DownloadIcon/>
               </IconButton>
             </Tooltip>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell style={{position: 'sticky',border: 'white 3px groove', top:0, background: "#e1dffd", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>N°</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Reactivo</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#f9a7fd", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>proveedor</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#e1dffd", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Codigo</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#a7fcc0", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>No. Lote</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#fde0b6", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Fecha de vencimiento</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#e09cfb", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>No. CAS</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#f9fe9e", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Color</TableCell>
            <TableCell style={{position: 'sticky',top:0, background: "#f8a0fc", textAlign: 'center', borderRight: '1px solid rgb(224, 224, 224)', zIndex: 1 }}>Accion</TableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={tableBodyRef}>
  {
    loading ? (
      <TableRow>
       <TableCell
        colSpan={Object.keys(data[0] || {}).length}
        sx={{
             position: 'relative',
             zIndex: 1, 
        }}
       >
       {/* CircularProgress centrado en la página */}
        <div
         style={{
           position: 'fixed', 
           top: '50%', 
           left: '50%', 
           transform: 'translate(-50%, -50%)', 
           zIndex: 9999, 
          }}
        >
          <CircularProgress size={150} />
        </div>
       </TableCell>
      </TableRow>
    ) : (
      Array.isArray(data) && data.length > 0 ? (

        data.map((row, rowIndex) => {
          const filteredRow = filterData(row); 
          const backgroundColor = "transparent"
          const color = "black"

          const colorMapping = {
            VERDE: '#89e273',  
            ROJO: '#f39278',   
            AZUL: '#78a4f3',  
            AMARILLO: '#fafc69',
            BLANCORAYADO: 'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 10px,rgb(231, 235, 238) 10px,rgb(214, 218, 221) 20px)', 
            BLANCO: '#ffffff'   
          };          

          return (
            <TableRow key={rowIndex}>    
             <TableCell 
              style={{                  
               textAlign: 'center',
               fontSize: "14px",
               backgroundColor: 'rgba(229, 232, 232, 0.85)', 
               color: color, 
               border: 'white 3px groove'
              }}              
             >
              {rowIndex+1}
             </TableCell>
              {Object.keys(filteredRow).map((column, colIndex) => (
                <TableCell
                  key={colIndex}
                  sx={{
                    textAlign: 'center',
                    fontSize: "14px",
                    background: colIndex === 6 
                    ? colorMapping[filteredRow[column].replace(/\s+/g, '').toUpperCase()] // Mapeo de color sin espacios
                    : backgroundColor, // Color de fondo predeterminado                    
                    color: color, // Color de texto
                  }}
                  onClick={() => handleDoubleClick(rowIndex, column)}
                >
                  {editingCell.rowIndex === rowIndex && editingCell.column === column && colIndex !== 7 ? (
                    <TextField
                      sx={{
                        width: '100%',
                        height: '42px',
                        padding: 0,
                        margin: 0,
                        borderRadius: "1px",
                        backgroundColor: '#f9fcfe',
                        textAlign: 'center',
                        fontSize: '15px',
                        lineHeight: "normal",
                        border: 'none',
                        '& .MuiInputBase-input': {
                          height: '42px',
                          padding: '0px',
                          fontSize: '15px',
                          textAlign: 'center',
                        },
                      }}
                      value={tempValue}
                      onChange={handleChange}
                      onBlur={()=>handleBlur()}
                      onKeyDown={handleKeyDown}
                    />
                  ) : colIndex === 7 ? (
                    <IconButton
                      style={{ outline: "none", color: "#fc5a4e" }}
                      onClick={() => deleteRowData(row._id)}
                    >
                      <HighlightOffIcon />
                    </IconButton>
                  ) : (
                    filteredRow[column] 
                  )}
                </TableCell>
              ))}
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={Object.keys(data[0] || {}).length} sx={{ textAlign: 'center' }}>
            No data available
          </TableCell>
        </TableRow>
      )
    )
  }
 </TableBody>
</Table>
    {/* Modal para filtrar */}
     <ModalFilterData
        isOpen={isModalFilterOpen}
        onClose={closeFilterModal}
        data={data}
        module="dataTableColors"
     />

    {/* Snackbar para mostrar mensajes */}
    <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={3000} 
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      {/* Componente con el modal de carga de Excel */}
      {/* Suspense envuelve el componente lazy */}
       <Suspense fallback={<CircularProgress />}>
         {/* <FileUploadExcel 
           open={openUploadExcelModal} 
           onClose={handleCloseModalUploadExcel} 
           module="dataTableColors"
          /> */}
       </Suspense>

</TableContainer>

);
});

export default CodificacionDeColoresComponent;
