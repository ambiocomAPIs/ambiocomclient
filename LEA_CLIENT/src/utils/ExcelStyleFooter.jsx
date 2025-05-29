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
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import StraightenIcon from '@mui/icons-material/Straighten';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

function ExcelStyleFooter({
  openModalFromFooterVerGastosMensualeGrafica,
  openModalFromFooterVerGastosMensualesCierreMes,
  openModalFromFooterVerGastosDiarioCierreMes,
  openModalFromFooterVerGastosMensuales,
  openModalFromFooterVerGastosDiario,
  openModalGraficaInventariovsSAP,
  openModalFromFooterRegistrarMovimientoTanqueJornalero,
  openModalReportarNivelesTanquesJornaleros,
  DataTableChartModalCostMensualMesesCerrados,
  openModalGraficoNivelesModalOpen 
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentPath, setCurrentPath] = useState('');
  // trae los usurios del sesio storage
  const [usuario, setUsuario] = useState(null);
  // LOADING PARA evitar doble peticion
  const [loadingButton, setLoadingButton] = React.useState(false);
 
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
    setCurrentPath(location.pathname);
  }, [location]);

  // Funciones para abrir el modal para cada caso específico
  const openModalVerGastosMensuales = () => {
    currentPath === '/mesescerrados'
      ? openModalFromFooterVerGastosMensualesCierreMes()
      : openModalFromFooterVerGastosMensuales();
  };

  const openModalGraficaGastoDiario = () => {
    currentPath === '/mesescerrados'
      ? openModalFromFooterVerGastosDiarioCierreMes()
      : openModalFromFooterVerGastosDiario();
  };

  const HistoricoMesesCerrados = () => {
    navigate('/mesescerrados');
  };

  const InventariovsSAP = () => {
    openModalGraficaInventariovsSAP();
  };

  const ModalFromFooterVerGastosMensualeGrafica = () => {    
    currentPath === '/mesescerrados' ?
    DataTableChartModalCostMensualMesesCerrados()
    :
    openModalFromFooterVerGastosMensualeGrafica();

  };

  const BackHome = () => {
    navigate('/principal');
  };

  const InventarioJornalerosTK = () => {
    navigate('/seguimientotanquesjornaleros');
  };

  const ModalFromFooterRegistrarMovimientoTanqueJornalero = () => {
    openModalFromFooterRegistrarMovimientoTanqueJornalero();
  };

  const ModalFromFooteropenGraficoNivelesTanquesPorDia = () => {
    openModalGraficoNivelesModalOpen()
  };
  
  const ModalReportarNivelesTanquesJornaleros = () => {
    openModalReportarNivelesTanquesJornaleros()
  };

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
          hidden={currentPath === '/mesescerrados' ? false : true}
          disabled={usuario?.rol=="administrativo" || usuario?.rol =="laboratorio"}
          sx={{
            display:
              currentPath === '/mesescerrados' ||
              currentPath === '/seguimientotanquesjornaleros'
                ? 'inline-flex'
                : 'none',
            margin: '0 5px',
            color: 'green',
            borderColor: '#9fd8f9',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
          onClick={ModalFromFooterVerGastosMensualeGrafica}
          endIcon={<CalendarMonthIcon />}
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          {currentPath === '/mesescerrados'? <>Ver Gastos Mes Cerrado</>:<>Ver Gastos Mensuales</>}
        </Button>
        <Button
          variant="outlined"
          onClick={HistoricoMesesCerrados}
          endIcon={<DateRangeIcon />}
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/mesescerrados' || currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
        <Button
          variant="outlined"
          onClick={InventarioJornalerosTK}
          endIcon={<ContentPasteSearchIcon />}
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/mesescerrados' || currentPath === '/seguimientotanquesjornaleros' ? 'none' : 'inline-flex',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Inventario Tanques Jornaleros
        </Button>
        <Button
          variant="outlined"
          onClick={ModalFromFooterRegistrarMovimientoTanqueJornalero}
          endIcon={<AppRegistrationIcon />}
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'inline-flex' : 'none',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Registrar Movimiento Tanque
        </Button>
        <Button
          variant="outlined"
          onClick={ModalReportarNivelesTanquesJornaleros}
          loadingIndicator="Loading…"
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'inline-flex' : 'none',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Reportar Niveles Diarios
        </Button>
        <Button
          variant="outlined"
          onClick={ModalFromFooteropenGraficoNivelesTanquesPorDia}
          endIcon={<StraightenIcon />}
          disabled={usuario?.rol=="laboratorio" || usuario?.rol =="administrativo"}
          sx={{
            display: currentPath === '/seguimientotanquesjornaleros' ? 'inline-flex' : 'none',
            margin: '0 5px',
            color: '#1976d2',
            borderColor: '#8ccdf3',
            textTransform: 'none',
            borderRadius: '4px',
            padding: '8px 20px',
            minWidth: '150px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1976d2',
              color: '#1976d2',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          Historico Mensual de Nivel
        </Button>
      </Box>
    </div>
  );
}

export default ExcelStyleFooter;
