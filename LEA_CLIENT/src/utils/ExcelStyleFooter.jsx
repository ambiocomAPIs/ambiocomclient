import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { Button, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TodayIcon from '@mui/icons-material/Today';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

function ExcelStyleFooter({ openModalFromFooterVerGastosMensualesCierreMes, openModalFromFooterVerGastosDiarioCierreMes, openModalFromFooterVerGastosMensuales,openModalFromFooterVerGastosDiario, openModalGraficaInventariovsSAP }) {
  
  const location = useLocation();
  const navigate = useNavigate(); // Inicializamos el hook navigate
  
  const [openModal, setOpenModal] = useState(false);
  const [currentSheet, setCurrentSheet] = useState('');
  // Estado para capturar la ruta
  const [currentPath, setCurrentPath] = useState('');

   useEffect(() => {
      setCurrentPath(location.pathname);
    }, [location]);


  // Funciones para abrir el modal para cada caso específico
  const openModalVerGastosMensuales = () => {
    currentPath == '/mesescerrados' ? openModalFromFooterVerGastosMensualesCierreMes(): openModalFromFooterVerGastosMensuales(); // Llamada a la función pasada como prop
  };

  const openModalGraficaGastoDiario = () => {
    currentPath == '/mesescerrados' ? openModalFromFooterVerGastosDiarioCierreMes():openModalFromFooterVerGastosDiario(); // Llamada a la función pasada como prop
  };

  const HistoricoMesesCerrados = () => {
    navigate('/mesescerrados')
  };
  
  const InventariovsSAP = () => {
    openModalGraficaInventariovsSAP()
  };

  const BackHome = () => {
    navigate('/')
  };

  console.log("cirrent path:", currentPath);
  

  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          borderTop: '2px solid #ccc',
          padding: '4px 0',
          backgroundColor: '#f4f4f4',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 999,
        }}
      >
        <Button
          variant="outlined"
          onClick={BackHome}
          endIcon={<HomeIcon />}
          hidden={currentPath=="/mesescerrados" ? false:true}
          sx={{
            display: currentPath === "/mesescerrados" ? 'inline-flex':'none' ,
            margin: '0 5px',
            color: 'green',
            borderColor:'#9fd8f9',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja W1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'green',
              color: '#aadfff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          INICIO
        </Button>
        <Button
          variant="outlined"
          onClick={openModalVerGastosMensuales}
          endIcon={<PriceChangeIcon />}
          sx={{
            margin: '0 5px',
            color: currentSheet === 'Hoja 1' ? '#aadfff' : '#333',
            borderColor:'#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja W1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Ver Consumo de Reactivos
        </Button>
        <Button
          variant="outlined"
          onClick={openModalGraficaGastoDiario}
          endIcon={<TodayIcon />}
          sx={{
            margin: '0 5px',
            color: currentSheet === 'Hoja 1' ? '#1976d2' : '#333',
            borderColor:'#8ccdf3 ',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja 1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Ver Gastos Diarios
        </Button>
        <Button
          variant="outlined"
          onClick={openModalGraficaGastoDiario}
          endIcon={<CalendarMonthIcon />}
          sx={{
            margin: '0 5px',
            color: currentSheet === 'Hoja 1' ? '#1976d2' : '#333',
            borderColor:'#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja 1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Ver Gastos Mensuales
        </Button>
        <Button
          variant="outlined"
          onClick={HistoricoMesesCerrados}
          endIcon={<DateRangeIcon />}
          sx={{
            margin: '0 5px',
            color: currentSheet === 'Hoja 1' ? '#1976d2' : '#333',
            borderColor:'#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja 1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Historico Meses Cerrados
        </Button>
        <Button
          variant="outlined"
          onClick={InventariovsSAP}
          endIcon={<SsidChartIcon />}
          sx={{
            margin: '0 5px',
            color: currentSheet === 'Hoja 1' ? '#1976d2' : '#333',
            borderColor:'#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: currentSheet === 'Hoja 1' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Inventario Fisico vs SAP
        </Button>
      </Box>
    </div>
  );
}

export default ExcelStyleFooter;
