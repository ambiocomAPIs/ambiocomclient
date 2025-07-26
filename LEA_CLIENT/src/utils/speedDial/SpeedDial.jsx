import * as React from 'react';
import {useEffect,useState } from 'react'
import { useLocation } from 'react-router-dom';
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from '@mui/material';

// ICONS
import PostAddIcon from '@mui/icons-material/PostAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import UnarchiveIcon from '@mui/icons-material/Unarchive';

import { PdfIcon,ExportExcelIcon,ShowPropertyIcon,ViewScheduleIcon,AddRowIcon } from '../icons/SvgIcons';

export default function SpeedDialComponent({
  sx,
  tipoOperacionParaIngresoOConsumo,
  agregarDataFila,
  exportExcelTable,
  DownloadManual,
  VerMovimientos,
  CierreMes,
  VerMovimientosTanquesJornaleros
}) {

  // trae los usurios del sesio storage
  const [usuario, setUsuario] = useState(null);

  const location = useLocation();

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

  const onlyCierreMesesActions = [
    { icon: <QueryStatsIcon />, name: 'Movimientos' },
    { icon: <FileDownloadIcon />, name: 'Export Excel' }
  ];

  const onlyTanquesJornaleros = [
    { icon: <QueryStatsIcon />, name: 'MovimientosTanquesJornaleros' },
    { icon: <FileDownloadIcon />, name: 'Export Excel' },
  ];

  const defaultActions = [
    { icon: <img src={AddRowIcon} alt="PDF" width={28} height={28} style={{ objectFit: 'contain' }} />, name: 'Nueva Fila' },
    // { icon: <ControlPointIcon />, name: 'Nueva Fila' },
    { icon: <PostAddIcon />, name: 'Reportar Consumo' },
    { icon: <UnarchiveIcon />, name: 'Reportar Ingreso' },
    // { icon: <CalendarMonthIcon />, name: 'Cierre de Mes' },
    // { icon: <QueryStatsIcon />, name: 'Movimientos' },
    // { icon: <FileDownloadIcon />, name: 'Export Excel' },
    // { icon: <PictureAsPdfIcon />, name: 'Descargar Manual' },
    { icon: <img src={ViewScheduleIcon} alt="PDF" width={28} height={28} style={{ objectFit: 'contain' }} />, name: 'Cierre de Mes' },
    { icon: <img src={ShowPropertyIcon} alt="PDF" width={28} height={28} style={{ objectFit: 'contain' }} />, name: 'Movimientos' },
    { icon: <img src={ExportExcelIcon} alt="PDF" width={25} height={25} style={{ objectFit: 'contain' }} />, name: 'Export Excel' },
    { icon: <TableRowsIcon />, name: 'Table de Colores' },
    { icon: <img src={PdfIcon} alt="PDF" width={25} height={25} style={{ objectFit: 'contain' }} />, name: 'Descargar Manual' },
  ];

  const actions = location.pathname === '/mesescerrados'
  ? onlyCierreMesesActions
  : location.pathname === '/seguimientotanquesjornaleros'
  ? onlyTanquesJornaleros
  : [...defaultActions];


  return (
    <SpeedDial
      ariaLabel="SpeedDial example"
      hidden={false}
      icon={<SpeedDialIcon />}
      direction="left"
      sx={sx}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => {
            if (action.name === 'Nueva Fila') {
              agregarDataFila();
            } else if (action.name === 'Reportar Consumo') {
              tipoOperacionParaIngresoOConsumo({ tipoOperacion: 'Reportar Consumo' });
            } else if (action.name === 'Reportar Ingreso') {
               tipoOperacionParaIngresoOConsumo({ tipoOperacion: 'Reportar Ingreso' });
            } else if (action.name === 'Export Excel') {
              exportExcelTable();
            } else if (action.name === 'Table de Colores') {
              window.location = '/colors';
            } else if (action.name === 'Descargar Manual') {
              DownloadManual();
            } else if (action.name === 'Movimientos') {
              VerMovimientos();
            } else if (action.name === 'Cierre de Mes') {
              CierreMes();
            }else if (action.name === 'MovimientosTanquesJornaleros') {
              VerMovimientosTanquesJornaleros();
            }
          }}
          sx={{
            '&:focus, &:active': {
              outline: 'none'
            }
          }}
          FabProps={{
            disabled:
              (action.name === 'Nueva Fila' && !['developer','gerente','supervisor'].includes(usuario?.rol)) ||
              (action.name === 'Reportar Consumo' && !['developer','gerente','supervisor','laboratorio','administrativo'].includes(usuario?.rol)) ||
              (action.name === 'Reportar Ingreso' && !['developer','gerente','supervisor','laboratorio','administrativo'].includes(usuario?.rol)) ||
              (action.name === 'Export Excel' && !['developer','gerente','supervisor', 'administrativo'].includes(usuario?.rol)) ||
              (action.name === 'Movimientos' && !['developer','gerente','supervisor', 'administrativo','laboratorio'].includes(usuario?.rol)) ||
              (action.name === 'MovimientosTanquesJornaleros' && !['developer','gerente','supervisor', 'logistica'].includes(usuario?.rol)) ||
              (action.name === 'Cierre de Mes' && !['developer','gerente','supervisor'].includes(usuario?.rol)) ||
              (action.name === 'Descargar Manual' && !['developer','gerente','supervisor','logistica','laboratorio','administrativo'].includes(usuario?.rol))
          }}
        />
      ))}
    </SpeedDial>
  );
}
