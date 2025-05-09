import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
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

import {calcularDiferenciaEnMeses} from '../utils/Functions/CalcularDiferenciaFechas'
import {ExportExcelWithTemplate} from '../utils/Functions/DownloadExcelData'
import DataTableChartModal from '../utils/modals/DataTableChartModal'
import DataTableChartModalCost from '../utils/modals/DataTableChartModalCost'
import ModalFilterData from '../utils/modals/ModalFilterData';
import ReportarConsumoModal from '../utils/modals/ReportarConsumoModal';
import DetallesMovimientos from '../utils/modals/DetallesMovimientos'
import ExcelStyleFooter from '../utils/ExcelStyleFooter'
import ModalComponent from '../utils/modals/ViewPdf';
import FileUpload from '../components/UploadFile';
import SpeedDialComponent from '../utils/speedDial/SpeedDial';
import DataTableChartModalInventariovsSAP from '../utils/modals/DataTableChartModalInventariovsSAP'

import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import PushPinIcon from '@mui/icons-material/PushPin';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SearchIcon from '@mui/icons-material/Search';

const MesesCerrados = React.memo(() => {
  const location = useLocation();
  // Estado para capturar la ruta
  const [currentPath, setCurrentPath] = useState('');
  // Estado para la fecha y hora actual
  const [fechaHoraActual, setFechaHoraActual] = useState('');
  const [data, setData] = useState([]);
  const [dataMesCerrado, setDataesCerrado] = useState([]);
  const [editingCell, setEditingCell] = useState({ rowIndex: null, column: null });
  const [tempValue, setTempValue] = useState('');
  const [ColumValue, setColumValue] = useState();
  // propiedades del snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);  // Estado para controlar el Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState("");  // Mensaje del Snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState('');  // 'success' o 'error'

  // carga de data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Visualizador de Pdf
  const [isModalOpen, setModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  // Abrir modal para filtrar data
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false);
  // Abrir modal para Crear Consumo data
  const [isModalConsumoOpen, setIsModalConsumoOpen] = useState(false);
  // Abrir modal para movimiento
  const [openModalMovimiento, setIsOpenModalMovimientos] = useState(false);
  // Abrir modal para Ver Grafica Gasto
  const [modalVerGastoMesCerradoIsOpen, setModalVerGastoMesCerradoIsOpen] = useState(false);
  // Abrir modal para Ver Grafica Gasto diario
  const [modalVerGastoDiarioIsOpen, setModalVerGastoDiarioIsOpen] = useState(false);
  // Estado para almacenar el mes y año seleccionados en el formato deseado
  const [mesFiltradoCierreMes, setMesFiltradoCierreMes] = useState('');
  // Estado para almacenar Fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  // Estado para el rowIndex a subir
  const [uploadRowIndex, setUploadRowIndex] = useState(null); 
  // Abrir modal para Ver Grafica ModalVerGraficaInventariovsSAPIsOpen
  const [ModalVerGraficaInventariovsSAPIsOpen, setModalVerGraficaInventariovsSAPIsOpen] = useState(false);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  const handleUploadIndex = (rowId) => {
    setUploadRowIndex(rowId); // Establecer el rowId seleccionado
    window.location = `/upload/${rowId}`; // Incluye el rowId en la URL
  };

  useEffect(() => {
    const mostrarFechaYHora = () => {
      const fechaActual = new Date();
      const opciones = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      };
      const fechaFormateada = fechaActual.toLocaleString('es-ES', opciones);
      setFechaHoraActual(fechaFormateada);
    };

    mostrarFechaYHora();
    const intervalId = setInterval(mostrarFechaYHora, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const filtrarConsumo = () => {
    setLoading(true); // para mostrar spinner si tienes
    axios.get('https://ambiocomserver.onrender.com/api/cierreMes/data')
      .then(response => {
              // asi llega el response.data
        //  [
        //     {
        //       MesDeCierre: "Febrero",
        //       FechaDeCierre: "2025-05-07T18:04:10.030Z",
        //       dataMes: [ /* productos */ ]
        //     }
        //   ]    
        const mesSeleccionado = mesFiltradoCierreMes;
        const mesFiltrado = response.data.filter(item => item.MesDeCierre === mesSeleccionado);
        if (mesFiltrado.length > 0) {
          setData(mesFiltrado[0].dataMes);
          setDataesCerrado(mesFiltrado[0].dataMes);
        } else {
          setData([]);
          setDataesCerrado([]);
        }
        setLoading(false);
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error al cargar los datos",
        });
        setLoading(false);
      });
  };

    if (error) {
      return <div>{error}</div>;
    }

    const fetchPdf = async (rowId) => {
      try {
          const response = await axios.get(`https://ambiocomserver.onrender.com/api/pdfs/${rowId}`, {
              responseType: 'blob',  // Especifica que esperas un blob (archivo binario)
          });
  
          const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
          const pdfUrl = window.URL.createObjectURL(pdfBlob);
  
          // Abre el PDF en una nueva pestaña o en un modal
          const newTab = window.open(pdfUrl, '_blank');

          if (newTab) newTab.focus();
  
      } catch (error) {
          console.error('Error al obtener el PDF:', error);
      }
  };

  const DownloadPdf = async (rowId) => {
    try {
        // Realiza la solicitud para obtener el archivo PDF
        const response = await axios.get(`https://ambiocomserver.onrender.com/api/pdfs/download/${rowId}`);

        // Extraer el nombre del archivo desde los datos JSON
        const { filename, data } = response.data;

        if (!filename || !data) {
            throw new Error("Nombre del archivo o datos no disponibles.");
        }

        // Convertir los datos base64 a un Blob
        const byteCharacters = atob(data); // Decodificar el base64
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        const pdfBlob = new Blob(byteArrays, { type: 'application/pdf' });

        // Crear una URL para el Blob
        const url = window.URL.createObjectURL(pdfBlob);

        // Crear un enlace para descargar el archivo
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); // Asigna el nombre del archivo

        // Agregar el enlace al DOM y simular un clic para iniciar la descarga
        document.body.appendChild(link);
        link.click();

        // Eliminar el enlace después de descargar el archivo
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al obtener el PDF:', error);

        // Si ocurre un error, muestra una alerta
        Swal.fire({
            icon: "error",
            title: "Error al descargar el archivo",
            text: "No hay archivo asociado a este material de referencia!",
            footer: `<a href="/upload/${rowId}">Subir archivo</a>`,
        });
    }
};


const DeletePdf = async (rowId) => {
  try {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    // Verifica si el usuario confirmó la acción
    if (result.isConfirmed) {
      const response = await axios.delete(`https://ambiocomserver.onrender.com/api/pdfs/${rowId}`);

      // Notificación de éxito
      Swal.fire({
        icon: 'success',
        title: 'PDF eliminado',
        text: response.data.message,
      });

      // Aquí puedes realizar cualquier acción adicional, como actualizar el estado de la lista de PDFs
    }
   } catch (error) {
     console.error('Error al eliminar el PDF:', error);
    // Notificación de error
    Swal.fire({
      icon: 'error',
      title: 'Error al eliminar el PDF',
      text: error.response?.data?.message || 'Ocurrió un error inesperado.',
    });
  }
};

const exportExcelDataTable =()=> {
  ExportExcelWithTemplate({data:data, module:"dataTable"}) //? se envia la data para exportar el excel
}

const handleCloseModal = () => {
  setIsModalConsumoOpen(false);
};

const handleDoubleClick = (rowIndex, column) => {
  setEditingCell({ rowIndex, column });
  setTempValue(data[rowIndex][column]);
};

const handleChange = (event) => {
  setTempValue(event.target.value);
};

const handleSnackbarClose = () => {
  setSnackbarOpen(false);
};

const clickColumFixed = (columnClicked) => {
  if(columnClicked == ColumValue)
  {
    setColumValue(100000); // se fija un valor de columna que nunca vaya a existir
  }else{
    setColumValue(columnClicked); // se fija un valor de columna que nunca vaya a existir
  }
};

  const filterData = (row) => {
    // Campos a excluir de la data
   // const excludedFields = ['_id', 'createdAt', 'updatedAt', '__v'];
    const excludedFields = ['_id', 'updatedAt', 'createdAt']; // elimino createAt ya que es el ultimo en el objeto en la DB
  
    // Filtrar las propiedades que no quieres mostrar
    return Object.keys(row)
      .filter((key) => !excludedFields.includes(key)) // Excluye los campos no deseados
      .reduce((obj, key) => {
        obj[key] = row[key]; // Solo incluye los campos que quieres
        return obj;
      }, {});
  };

    const openFilterModal = () => {
      setIsModalFilterOpen(true);
    };
  
    const closeFilterModal = () => {
      setIsModalFilterOpen(false);
    };

    // Función para manejar el cambio de fecha
    const handleDateChange = (event) => {
        const selected = event.target.value; // Ej: "2025-01"
        setFechaSeleccionada(selected);
      
        if (selected) {
          const [year, monthNumber] = selected.split('-');
      
          // Convertimos el número de mes a nombre en español (indexado desde 0)
          const monthIndex = parseInt(monthNumber, 10) - 1;
          const monthName = new Date(2000, monthIndex, 1).toLocaleString('es-ES', {
            month: 'long',
          }).toUpperCase();
      
          const mesAño = `${monthName}${year}`;
          setMesFiltradoCierreMes(mesAño);
      
          // Lógica de filtrado
          const filtrado = dataMesCerrado.filter(item =>
            `${item.MesDeCierre.toUpperCase()}${new Date(item.FechaDeCierre).getFullYear()}` === mesAño
          );
          setData(filtrado);
          setDataesCerrado(filtrado);
        }
      };
      
  // Función para abrir el modal de movimientos
  const openModalMovimientos = () => {
    setIsOpenModalMovimientos(true);
  };

  // Función para cerrar el modal
  const closeModalMovimientos = () => {
    setIsOpenModalMovimientos(false);
  };

   // Función para abrir el modal
   const openModalVerGastoMesCerrado = () => setModalVerGastoMesCerradoIsOpen(true);
   // Función para cerrar el modal
   const closeModalVerGastoMesCerrado = () => setModalVerGastoMesCerradoIsOpen(false);

   // Función para abrir el modal Gasto diario
   const openModalVerGastoDiario = () => setModalVerGastoDiarioIsOpen(true);
   // Función para cerrar el modal Gasto diario
   const closeModalVerGastoDiario = () => setModalVerGastoDiarioIsOpen(false);

   // Función para abrir el modal GraficaInventariovsSAP
   const openModalVerGraficaInventariovsSAP = () => setModalVerGraficaInventariovsSAPIsOpen(true);
   // Función para cerrar el modal GraficaInventariovsSAP
   const closeModalVerGraficaInventariovsSAP = () => setModalVerGraficaInventariovsSAPIsOpen(false);
 
  const renderPdfButtons = (rowId) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 10, marginRight: 10 }}>
      <IconButton
        style={{ outline: "none", color: "#f5d131" }}
        onClick={() => fetchPdf(rowId)}
      >
        <RemoveRedEyeIcon />
      </IconButton>
      <IconButton
        style={{ outline: "none", color: "#3172f5" }}
        onClick={() => handleUploadIndex(rowId)}
      >
        <CloudUploadIcon />
      </IconButton>
      <IconButton
        style={{ outline: "none", color: "#0f9638" }}
        onClick={() => DownloadPdf(rowId)}
      >
        <DownloadForOfflineIcon />
      </IconButton>
      <IconButton
        style={{ outline: "none", color: "#ed1111" }}
        onClick={() => DeletePdf(rowId)}
      >
        <DeleteIcon />
      </IconButton>
    </div>
  );
  
  const renderNotificationsButtons = (params) => (

    <div style={{ display: 'flex', justifyContent: 'center', marginLeft: 10, marginRight: 10 }}>
  {params.notificado ? 
    <Tooltip title="Alerta Desactivada" enterDelay={1000}>
      <span>
        <IconButton
          style={{ outline: "none", color: "#5d6d7e", cursor: 'not-allowed', pointerEvents: 'auto' }}
          onClick={() => {}}
          disabled
        >
          <NotificationsOffIcon style={{ cursor: 'not-allowed', pointerEvents: 'auto' }} />
        </IconButton>
      </span>
    </Tooltip>
    :
    <Tooltip title="Recibir Alerta">
      <span>
        <IconButton
          style={{ outline: "none", color: "#212f3c", cursor: 'not-allowed', pointerEvents: 'auto' }}
          onClick={() => {}}
          disabled
        >
          <NotificationsActiveIcon style={{ cursor: 'not-allowed', pointerEvents: 'auto' }} />
        </IconButton>
      </span>
    </Tooltip>
  }
</div>
  );

  return (
    <TableContainer component={Paper}
          style={{
            height: '95vh', // Ocupa el 100% de la altura de la ventana
            overflow: 'auto', // Permite el desplazamiento vertical y horizontal
            marginBottom:0,
            overflowX: 'scroll',
          }}
      >
      <Table style={{ width: 'max-content' }}>
        <TableHead>
          <TableRow style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 0 }}>
            <TableCell colSpan={1} style={{ fontSize: '25px', fontWeight: 'bold' }}>
              <img src='/logo_ambiocom.png' style={{ width:'0px',height:'auto',position:'absolute'}}></img>
            </TableCell>
            <TableCell colSpan={1} style={{ marginTop:0}}>
              <img src='/ambiocom.png' style={{ marginTop:-20,width:'180px',height:'auto',position:'absolute'}}></img>
            </TableCell>
            <TableCell colSpan={2} style={{fontSize:'25px',fontWeight:'bold',textAlign: 'center',position: 'sticky',}}>
              <div >{fechaHoraActual}</div>
            </TableCell>
            <TableCell colSpan={5} style={{fontSize:'35px',fontWeight:'bold',textAlign: 'center',position: 'sticky',}}>
              <div >INVENTARIO DE CIERRE DE MES</div>
            </TableCell>
          </TableRow>
          <TableRow style={{background: "#82ccdd" }}>
            <TableCell colSpan={26} style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(224, 224, 224, 1)' }}>
             {/* Botón de filtro al inicio de la fila */}
             <Tooltip title="Filtro" enterDelay={100}>
              <IconButton
               style={{
                position: 'absolute',  // Posicionamos el botón dentro de la celda
                top: '65px',            // A 15px del borde superior de la celda
                left: '10px',           // A 10px del borde izquierdo de la celda
                zIndex: 1,           // Asegura que el botón esté por encima de otros elementos
                outline: 'none'
                }}
                  onClick={() => openFilterModal()}  // Aquí puedes agregar la lógica para abrir el filtro
                 >
                  <SearchIcon /> {/* Este es el ícono para el filtro */}
               </IconButton>
              </Tooltip>
              {/* Filtro por mes y año usando input tipo "date" */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', marginTop: '0px', marginLeft:'50px' }}>
              <input
               type="month"
               value={fechaSeleccionada}
               onChange={handleDateChange}
               style={{
                padding: '1px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginRight: '10px',
                }}
               />
  
              <button
               onClick={filtrarConsumo}
               style={{
                padding: '5px 10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #007bff',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                marginRight: '10px'
                }}
              >
               Filtrar
             </button>

             {mesFiltradoCierreMes && (
              <strong>Mes Seleccionado: {mesFiltradoCierreMes}</strong>
             )}
            </div>
           </TableCell>
          </TableRow>
          <TableRow style={{position: 'sticky', top: 0, zIndex: 0, }}>
            <TableCell colSpan={7} style={{ background: "#78e08f", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Seguimiento inventario
            </TableCell>
            <TableCell colSpan={3} style={{ background: "#eabbfa", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Identificacion del Material
            </TableCell>
            <TableCell colSpan={5} style={{ background: "#fbfc92",textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Seguimiento a su uso
            </TableCell>
            <TableCell colSpan={5} style={{ background: "#b8b3fc", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Condiciones especiales de manipulacion y almacenamiento
            </TableCell>
            <TableCell colSpan={4} style={{ background: "#c5fcc5", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Seguimiento Consumo
            </TableCell>
            <TableCell colSpan={2} style={{ background: "#f1c40f", textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Operaciones
            </TableCell>
          </TableRow>
          <TableRow>
          <TableCell style={{position: 'sticky',top:55, border: 'white 3px groove', background: "#e1dffd", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 2 }}>N°</TableCell>
          <TableCell 
              style={
                ColumValue == 0 ? 
                {position: 'sticky', minWidth: '200px', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1"} 
                : 
                {position: 'sticky', minWidth: '200px',top:55, background: "#bbfad1", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>            
              Nombre
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(0)}}
              >
               <PushPinIcon fontSize="small" sx={ColumValue == 0 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
          <TableCell 
              style={
              ColumValue == 1 ? 
              {position: 'sticky', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1", width: '150px',} 
              : 
              {position: 'sticky',top:55, background: "#bbfad1", width: '150px', textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>    
              Valor unitario $
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(1)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 1 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
          <TableCell 
            style={
              ColumValue == 2 ? 
              {position: 'sticky', left: 0, top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1", width: '200px',} 
              : 
              { position: 'sticky',top:55, background: "#bbfad1", width: '200px', textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
              Inventario
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none",
                 
                }}
                onClick={()=> {clickColumFixed(2)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 2 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
              ColumValue == 3 ? 
              {position: 'sticky', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1", width: '8px',} 
              : 
              {position: 'sticky',top:55, background: "#bbfad1", width: '8px', textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>    
              unidad
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(3)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 3 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
              ColumValue == 4 ? 
              {position: 'sticky', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1", width: '150px',} 
              : 
              {position: 'sticky',top:55, background: "#bbfad1", width: '150px', textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>    
              Consumo Mensual
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(4)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 4 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
              ColumValue == 5 ? 
              {position: 'sticky', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#bbfad1", width: '150px',} 
              : 
              {position: 'sticky',top:55, background: "#bbfad1", width: '150px', textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>    
              Gasto Mensual
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(5)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 5 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 6 ? 
                {position: 'sticky', minWidth: '100px', left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#f5d9ff"} 
                : 
                {position: 'sticky', minWidth: '100px',top:55, background: "#f5d9ff", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>    
              proveedor
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(6)}}
              >
               <PushPinIcon fontSize="small" sx={ColumValue == 6 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 7 ? 
                {position: 'sticky',  minWidth: '100px',left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#f5d9ff"} 
                : 
                {position: 'sticky', minWidth: '100px',top:55, background: "#f5d9ff", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>                 
              No. Lote
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(7)}}
              >
               <PushPinIcon fontSize="small" sx={ColumValue == 7 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
               style={
                ColumValue == 8 ? 
                {position: 'sticky',  minWidth: '100px',left: 0,top:55, zIndex: 2, textAlign: 'center', background: "#f5d9ff",} 
                : 
                { position: 'sticky',  minWidth: '100px',top:55, background: "#f5d9ff", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)',}}>                 
              TIPO
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(8)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 8 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
              </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 9 ? 
                {position: 'sticky',  minWidth: '100px', left: 0,top:55, zIndex: 2, textAlign: 'center',  background: "#feffcf",} 
                : 
                {position: 'sticky',  minWidth: '100px', top:55, background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', }}>                 
              AREA
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(9)}}
              >
                 <PushPinIcon fontSize="small" sx={ColumValue == 9 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
                </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 10 ? 
                {position: 'sticky', left: 0, width: '200px', minWidth: '100px',top:55, zIndex: 2, textAlign: 'center',   background: "#feffcf",} 
                : 
                {position: 'sticky',top:55, width: '200px',  minWidth: '100px', background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)',}}>                 
              Fecha de ingreso
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(10)}}
              >
                 <PushPinIcon fontSize="small" sx={ColumValue == 10 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
                </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 11 ? 
                {position: 'sticky', left: 0, width: '200px',  minWidth: '100px', top:55, zIndex: 2, textAlign: 'center', background: "#feffcf"} 
                : 
                {position: 'sticky',top:55, width: '200px',  minWidth: '100px', background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)',}}>                    
              Fecha de vencimiento
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(11)}}
              >
                <PushPinIcon fontSize="small" sx={ColumValue == 11 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
                </IconButton>
            </TableCell>
            <TableCell 
              style={
                ColumValue == 12 ? 
                {position: 'sticky', left: 0, width: '200px',  minWidth: '100px', top:55, zIndex: 2, textAlign: 'center', background: "#feffcf"} 
                : 
                {position: 'sticky',top:55, width: '200px',  minWidth: '100px', background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)',}}>                    
              Fecha actualización de la información
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  outline: "none"
                }}
                onClick={()=> {clickColumFixed(12)}}
              >
                  <PushPinIcon fontSize="small" sx={ColumValue == 12 ?{color:"red", transform: "rotate(45deg)", transition: "transform 0.2s"}: {outline: "none"}} />
                </IconButton>
            </TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#feffcf", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1, width:"200px"}}>Ingreso</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#c9c5fc", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Consideración de la manipulación</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#c9c5fc", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Almacenamiento</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#c9c5fc", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Certificado / MSDS</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#c9c5fc", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Responsable de la manipulación</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#c9c5fc", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Observaciones</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#d9ffd9", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1, width:"auto" }}>SAP</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#d9ffd9", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1, width:"200px" }}>Consumo Acumulado</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#d9ffd9", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1, width:"200px" }}>Gasto Acumulado</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#d9ffd9", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Alerta [Meses]</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#f7dc6f", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Notificacion</TableCell>
            <TableCell style={{position: 'sticky',top:55, background: "#fcb6b1", textAlign: 'center', borderRight: '1px solid rgba(224, 224, 224, 1)', zIndex: 1 }}>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
  {
    loading ? (
      <TableRow>
       <TableCell
        colSpan={Object.keys(data[0] || {}).length}
        sx={{
             position: 'relative', // Establecer posición relativa para que el z-index se pueda aplicar
             zIndex: 1, // Asegurar que la tabla tenga un z-index inferior al spinner
        }}
       >
       {/* CircularProgress centrado en la página */}
        <div
         style={{
           position: 'fixed', // Posición fija respecto a la ventana del navegador
           top: '50%', // Centrado verticalmente
           left: '50%', // Centrado horizontalmente
           transform: 'translate(-50%, -50%)', // Ajuste para centrar exactamente
           zIndex: 9999, // Asegura que esté por encima de la tabla
          }}
        >
          <CircularProgress size={150} />
        </div>
       </TableCell>
      </TableRow>
    ) : (
      Array.isArray(data) && data.length > 0 ? (
        data.map((row, rowIndex) => {

          const filteredRow = filterData(row); // Filtrar la fila
          const fechaVencimiento = row.fechaVencimiento;  // Fecha de vencimiento (string)
          const mesesRestantes = parseInt(row.mesesRestantes, 10);  // Convertir mesesRestantes a número

          // Convertimos la fecha de vencimiento a un objeto Date para asegurarnos de que sea válida
          const fechaVencimientoDate = new Date(fechaVencimiento); // Convertir a Date
          const fechaActual = new Date(); // Fecha actual
          
          // Calcular la diferencia en meses entre la fecha actual y la fecha de vencimiento
          const diferenciaMeses = calcularDiferenciaEnMeses(fechaActual, fechaVencimientoDate);

          // Comprobar si la fecha de vencimiento está dentro del rango de mesesRestantes
          const esProximoAVencer = diferenciaMeses <= mesesRestantes;
          const materialVencido = fechaVencimientoDate < fechaActual; // Comprobar si la fecha ya ha pasado

          // columnas que no quiero que se puedan editar
          const BlockedColumns = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25];

          // Establecer los colores de fondo
          let backgroundColor = 'transparent';
          let color = 'inherit'; // Color por defecto para el texto

          // Si la fecha de vencimiento ya ha pasado (producto vencido)
          if (materialVencido) {
            backgroundColor = 'rgba(255, 87, 34, 0.2)'; // Rojo claro
            color = '#fc5a4e'; // Rojo para el texto
          }
          // Si la fecha está próxima a vencer (dentro de los meses restantes)
          else if (esProximoAVencer) {
            backgroundColor = 'rgba(255, 235, 59, 0.3)'; // Amarillo claro
            color = '#ff9800'; // Naranja para el texto
          }

          return (
            <TableRow key={rowIndex}>
               {/* {Object.keys(filteredRow).forEach((column, colIndex) => {
                 console.log(`Columna: ${column}, Índice: ${colIndex}`);
              })} esta linea me muestra el valor de la columna y su indice asi se en que indice se va pintasr cada dato */}
              <TableCell
                style={{                  
                   textAlign: 'center',
                  fontSize: "14px",
                  backgroundColor: 'rgba(246, 247, 247, 0.85)', // Color de fondo
                  color: color, 
                  border: 'white 3px groove',
                  zIndex: 3
                }}              
              >
               {rowIndex+1}
              </TableCell>
              {Object.keys(filteredRow).map((column, colIndex) => (
               <TableCell
                style={colIndex === ColumValue ? {
                position: 'sticky',
                left: 0,
                zIndex: 0,
                margin: 0,
                padding: 0,
                color: color,
                backgroundColor: 'rgba(229, 232, 232, 0.85)',
                fontSize: "14px",
                textAlign: 'center',
              } : {
                fontSize: "14px",
                backgroundColor: backgroundColor, // Color de fondo
                color: color, // Color de texto
              }}
              key={colIndex}
              sx={{
                textAlign: 'center',
                fontSize: "14px",
                backgroundColor: backgroundColor, // Color de fondo
                color: color, // Color de texto
              }}
                onClick={() => handleDoubleClick(rowIndex, column)}
                >
                  {editingCell.rowIndex === rowIndex 
                    && editingCell.column === column && !BlockedColumns.includes(colIndex) ? (
                    <TextField
                    sx={{
                      width: '100%',
                      height: '42px',
                      padding: 0,
                      margin: 0,
                      backgroundColor: '#f9fcfe',
                      borderRadius: "1px",
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
                    // onBlur={() => handleBlur()}
                    //onKeyDown={handleKeyDown}
                    />
                  ) : colIndex === 16 ? (
                    renderPdfButtons(row._id) // Mostrar botones solo para la columna 13
                  ) : colIndex === 23 ? (
                    renderNotificationsButtons({ _id: row._id, notificado: row.notificado }) // Mostrar boton si fue notificado o sigue en alarma
                  ) : colIndex === 24 ? (
                    <IconButton
                    style={{ outline: "none", color: "#fc5a4e" }}
                    onClick={()=> {}}
                    >
                      <HighlightOffIcon />
                    </IconButton>
                  ) : colIndex === 5 ? (
                  // Aquí calculamos la multiplicación de los índices 1 y 4
                    <span>
                       {((parseFloat(filteredRow[Object.keys(filteredRow)[1]]) || 0) * (parseFloat(filteredRow[Object.keys(filteredRow)[4]]) || 0)).toFixed(2)}
                    </span>
                  ) : (
                    filteredRow[column] // Mostrar el valor de la celda filtrada
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
        module="dataTable"
     />

    {/* Componente Modal visualizar Pdf */}
    <ModalComponent 
     isOpen={isModalOpen} 
     onClose={handleCloseModal} 
     pdfUrl={pdfUrl} 
     />

    <ReportarConsumoModal 
     open={isModalConsumoOpen} 
     onClose={handleCloseModal} 
     data={data}
     />

    <DetallesMovimientos 
     open={openModalMovimiento} 
     onClose={closeModalMovimientos} 
     />

   {/* Condicional para mostrar el componente FileUpload */}
      {uploadRowIndex !== null && (
        <FileUpload rowIndex={uploadRowIndex} />
      )}

    {/* Snackbar para mostrar mensajes */}
    <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={3000} // Se cierra automáticamente después de 3 segundos
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

     {/* Modal grafica reactivos y sus costos por mes */}
       <DataTableChartModal 
        reactivos={dataMesCerrado} 
        modalIsOpen={modalVerGastoMesCerradoIsOpen}

        closeModal={closeModalVerGastoMesCerrado}
       />

     {/* Modal grafica reactivos status vencimiento */}
       <DataTableChartModalCost 
        reactivos={data} 
        modalIsOpen={modalVerGastoDiarioIsOpen}
        closeModal={closeModalVerGastoDiario}
       />
     

     {/* Modal grafica inventario vs SAP*/}
     <DataTableChartModalInventariovsSAP 
      reactivos={dataMesCerrado}
      modalIsOpen={ModalVerGraficaInventariovsSAPIsOpen}
      closeModal={closeModalVerGraficaInventariovsSAP}
     />

     {/* footer tipo pestañas de excel */}
       <ExcelStyleFooter 
        openModalFromFooterVerGastosMensualesCierreMes={openModalVerGastoMesCerrado} 
        openModalFromFooterVerGastosDiarioCierreMes={openModalVerGastoDiario} 
        openModalGraficaInventariovsSAP={openModalVerGraficaInventariovsSAP} 
       />

      {/* Speed Dial */}
      <SpeedDialComponent
        exportExcelTable={exportExcelDataTable}
        VerMovimientos={openModalMovimientos}
              sx={{
                position: 'fixed',
                top: 16,  // Puedes ajustar este valor para mover el SpeedDial
                right: 35,  // Ajusta el valor para la distancia del borde derecho
                zIndex: 1300,
                '&:focus, &:active': { 
                  outline: 'none', // Elimina el borde de enfoque (outline) al hacer clic
                  // boxShadow: 'none', // Elimina la sombra de enfoque
                },
              }}
      />
</TableContainer>

);
});

export default MesesCerrados;
