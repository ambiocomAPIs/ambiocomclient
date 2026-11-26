// // FileUploadExcel.jsx (o tu componente de carga)
// import React, { useState } from 'react';
// import * as XLSX from 'xlsx';
// import axios from 'axios';
// import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';

// const FileUploadExcel = ({ open, onClose, module }) => {

//   console.log("module en FileUploadExcel:", module);
  
//   const [file, setFile] = useState(null);

//   //? Cuando el usuario selecciona un archivo
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   //? Subir el archivo
//   const handleFileUpload = async () => {
//     if (!file) {
//       alert('Por favor selecciona un archivo');
//       return;
//     }

//     const reader = new FileReader();

//     reader.onload = async (e) => {
//       try {
//         // Leemos el archivo Excel
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });

//         // Obtener la primera hoja del archivo Excel
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];

//         // Convertir los datos de la hoja a un formato JSON (omitimos las dos primeras filas)
//          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });  // Toma la primera fila como los encabezados
//          const filteredData = jsonData.slice(0);  // Elimina las primeras dos filas

//         //  console.log("Datos leídos del Excel:", jsonData);  // Añade un console.log aquí
//         //  console.log("Datos leídos del Excel filteredData:", filteredData);  // Añade un console.log aquí
         
//         // Formatear los datos según tu modelo de Mongoose
//         //& como las columnas no tienen nombre, por defecto llegan como __EMPTY
//         const formattedData = filteredData.map(item => {
//           if (module === 'dataTableColors') {
//             return {
//               Reactivo: item.D1 || '----',
//               proveedor: item.D2 || '----',
//               Codigo: item.D3 || '----',
//               Lote: item.D4 || '----',
//               fechaVencimiento: item.D5 || '--/--/--',
//               CAS: item.D6 || '----',
//               Color: item.D7 || '----',
//               Accion: '----',
//             };
//           } else {
//             return {
//               Inventario: item.D1 || 0,
//               codigoInventario: item.D2 || '----',
//               nombre: item.D3 || '----',
//               proveedor: item.D4 || '----',
//               lote: item.D5 || '----',
//               tipo: item.D6 || '----',
//               area: item.D7 || '----',
//               fechaIngreso: item.D8 || '----',
//               fechaVencimiento: item.D9 || '----',
//               fechaActualizacionInformacion: item.D10 || '----',
//               cantidadIngreso: item.D11 || '----',
//               manipulacion: item.D12 || 'Sin especificar',
//               almacenamiento: item.D13 || '----',
//               certificadoAnalisis: false,
//               responsable: item.D15 || '----',
//               observaciones: item.D16 || 'Ninguna',
//               vencimiento: item.D9 || '----',
//               mesesRestantes: '3',
//               notificado: false,
//             };
//           }
//         });        

//         console.log("formatted data:", formattedData);
        
//         const rutaConsumoPost = module == 'dataTableColors' ? 'tableColors/dataColorsreplaceall' : 'table/datareplaceall'
//         //? Enviar los datos al backend para guardarlos en la base de datos
//         await axios.post(`http://localhost:4041/api/${rutaConsumoPost}`, formattedData);
//         alert('Datos cargados correctamente');
//         onClose();  // Cerrar el modal después de la carga
//         window.location.reload();
//       } catch (error) {
//         console.error('Error al procesar el archivo:', error);
//         alert('Error al procesar el archivo');
//       }
//     };

//     //? Leer el archivo como ArrayBuffer
//     reader.readAsArrayBuffer(file);
//   };

//   return (
//     <Dialog open={open} onClose={onClose}>
//       <DialogTitle>Carga Masiva Excel</DialogTitle>
//       <DialogContent>
//         <input 
//           type="file" 
//           onChange={handleFileChange}  // Manejamos el cambio de archivo directamente aquí
//         />
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose} color="primary">
//           Cancelar
//         </Button>
//         <Button 
//           onClick={handleFileUpload} 
//           color="primary" 
//           disabled={!file} // Deshabilitar si no hay archivo seleccionado
//         >
//           Cargar Datos
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default FileUploadExcel;  //& se cambia la exportacion a default para que pueda funcionar react.lazy
