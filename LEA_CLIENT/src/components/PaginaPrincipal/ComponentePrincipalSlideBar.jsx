import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    AppBar,
    CssBaseline,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
    Collapse,
    Fade
} from '@mui/material';

import {
    ExpandLess,
    ExpandMore,
    Menu as MenuIcon,
    PersonAdd as PersonAddIcon,
    EventAvailable as EventAvailableIcon,
    CalendarToday as CalendarTodayIcon,
    History as HistoryIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    Inventory2 as Inventory2Icon,
    Group as GroupIcon,
    ListAlt as ListAltIcon,
    DateRange as DateRangeIcon,
    Image as ImageIcon,
} from '@mui/icons-material';

import SeguimientoTKJornaleros from '../SeguimientoTKJornaleros';
import ExcelStyleFooter from '../../utils/ExcelStyleFooter';
import ChatBox from '../IA/ChatBox';
import BitacoraDeSupervisores from '../Bitacora/BitacoraComponentesProduccion'
import PanelHoras from '../PanelHoras';
import InventarioCarbonMadera from '../InventarioCarbonMadera';
//Modulo Tanques
import TanquesUnidadTreCientos from '../TanquesVistaNiveles/Unidad300';
import CubaDeFermentacion from '../TanquesVistaNiveles/CubasDeFermentacion';
import TanquesUnidadCien from '../TanquesVistaNiveles/Unidad100';
import UnidadOchoCientosAlmacenamiento from '../TanquesVistaNiveles/Unidad800'
//Modulo DB
import ConsultasHttpDb from '../DB_Consultas_View/ConsultasHttpDb.jsx';
//Utils
import { validarSesion } from '../../utils/configuraciones/validarSesion.js';

//importacion de iconos
import {
    tanqueIcon, factoryIcon, despachoIcon, despachoSalidaIcon, despachoRecepcionIcon, laboratoryIcon, inventoryIcon, rulerIcon, oilTankIcon, coalInventoryIcon,
    ptapIcon, GraphIcon, BarGraphIcon, BarGraphComparativeIcon, robotAssistanceIcon, bitacoraIcon, StopWatchIcon, PdfIcon, DatabaseAdministratorIcon
} from '../../utils/icons/SvgIcons.js'

import SGMRC from '../SGMRC';

const drawerWidth = 280;

const menuItems = [
    {
        text: 'Produccion',
        key: 'produccion',
        icon: <img src={factoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
        subItems: [
            { text: 'Inventario de insumos', subKey: 'Inventariodeinsumos', icon: <img src={inventoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            { text: 'Tanques Jornaleros', subKey: 'Tanquesjornaleros', icon: <img src={rulerIcon} alt="tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
            { text: 'Bitacora Supervisores', subKey: 'bitacoradeturnosupervisores', icon: <img src={bitacoraIcon} alt="bitacoradeturnosupervisores" style={{ width: 25, height: 25 }} /> },
            { text: 'Inventario Combust', subKey: 'inventariodecarbonymadera', icon: <img src={coalInventoryIcon} alt="Tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
            { text: 'Horas Extras', subKey: 'horasextrassupervisores', icon: <img src={StopWatchIcon} alt="horasextrassupervisores" style={{ width: 25, height: 25 }} /> },
        ],
    },
    {
        text: 'Logistica',
        key: 'logistica',
        icon: <img src={despachoIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
        subItems: [
            { text: 'Despachos', subKey: 'Inventariodeinsumos', icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            { text: 'Recepcion', subKey: 'Tanquesjornaleros', icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
        ],
    },
    {
        text: 'Tanques',
        key: 'tanquesniveles',
        icon: <img src={tanqueIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
        subItems: [
            { text: 'UNIDAD 100', subKey: 'nivelesunidadtrecien', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 300', subKey: 'nivelesunidadtrecientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 450', subKey: 'nivelesunidadcuatrocientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 800', subKey: 'nivelesunidadochocientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Cuba Fermentac', subKey: 'cubadefermentacion', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
        ],
    },
    {
        text: 'Data Analisis',
        key: 'dataanalisis',
        icon: <img src={GraphIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
        subItems: [
            { text: 'Insumos/mes', subKey: 'nivelesunidadcien', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Isumos/L[OH]', subKey: 'nivelesunidadcien', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Comparativo', subKey: 'comparativoIsumos/L[OH]', icon: <img src={BarGraphComparativeIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Agua/L[OH]', subKey: 'nivelesunidadtrecientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Carbon/L[OH]', subKey: 'nivelesunidadcuatrocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Madera/L[OH]', subKey: 'nivelesunidadochocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
        ],
    },
    { text: 'Laboratorio', icon: <img src={laboratoryIcon} alt="laboratorio" style={{ width: 25, height: 25 }} />, key: 'Laboratorio' },
    { text: 'Planta de Aguas', icon: <img src={ptapIcon} alt="plantadeaguas" style={{ width: 25, height: 25 }} />, key: 'plantadeaguas' },
    { text: 'DB Aministrator', icon: <img src={DatabaseAdministratorIcon} alt="basededatos" style={{ width: 25, height: 25 }} />, key: 'basededatos' },
    { text: 'Assistance', icon: <img src={robotAssistanceIcon} alt="robotassistance" style={{ width: 25, height: 25 }} />, key: 'robotassistance' },
];

export default function MedicalSchedulerApp() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedMenu, setSelectedMenu] = useState('Inventariodeinsumos');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openSubmenus, setOpenSubmenus] = useState({});

    const navigate = useNavigate();

    
  useEffect(() => {
    if (!validarSesion()) {
      navigate("/");
    }
  }, []);

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    const renderContent = () => {
        switch (selectedMenu) {
            case 'Tanquesjornaleros': return <SeguimientoTKJornaleros />;
            case 'Inventariodeinsumos': return <SGMRC />;
            case 'nivelesunidadtrecien': return <TanquesUnidadCien />;
            case 'nivelesunidadtrecientos': return <TanquesUnidadTreCientos />;
            case 'nivelesunidadochocientos': return <UnidadOchoCientosAlmacenamiento />;
            case 'cubadefermentacion': return <CubaDeFermentacion />;
            case 'bitacoradeturnosupervisores': return <BitacoraDeSupervisores />;
            case 'horasextrassupervisores': return <PanelHoras />;
            case 'inventariodecarbonymadera': return <InventarioCarbonMadera />;
            case 'basededatos': return <ConsultasHttpDb />;
            case 'robotassistance': return <ChatBox />;
            default: return null;
        }
    };

    const getSelectedMenuText = () => {
        for (const item of menuItems) {
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.subKey === selectedMenu);
                if (subItem) return subItem.text;
            } else if (item.key === selectedMenu) {
                return item.text;
            }
        }
        return selectedMenu;
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{
                justifyContent: 'center',
                background: 'linear-gradient(90deg, rgb(6, 59, 112) 0%, rgb(0, 89, 87) 50%, rgb(5, 165, 85) 100%)',
                color: 'white',
                mb: 1
            }}>
                <Typography variant="h6" noWrap>Ambiocom s.a.s</Typography>
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map(({ text, icon, key, subItems }) => (
                    <Box key={key}>
                        <ListItemButton
                            onClick={() => {
                                if (subItems) {
                                    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
                                } else {
                                    setSelectedMenu(key);
                                    if (isMobile) setMobileOpen(false);
                                }
                            }}
                            selected={selectedMenu === key}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                mx: 1,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    boxShadow: '0 0 8px rgba(33,150,243,0.4)',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                },
                            }}
                        >
                            <ListItemIcon>{icon}</ListItemIcon>
                            <ListItemText primary={text} />
                            {subItems && (openSubmenus[key] ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>

                        {subItems && (
                            <Collapse in={openSubmenus[key]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {subItems.map(({ text: subText, subKey, icon: subIcon }) => (
                                        <ListItemButton
                                            key={subKey}
                                            sx={{ pl: 5 }}
                                            selected={selectedMenu === subKey}
                                            onClick={() => {
                                                setSelectedMenu(subKey);
                                                if (isMobile) setMobileOpen(false);
                                            }}
                                        >
                                            <ListItemIcon>{subIcon}</ListItemIcon>
                                            <ListItemText primary={subText} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </Box>
                ))}
            </List>
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 12 }}>
                © 2025 HCabal. Todos los derechos reservados.
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                elevation={4}
                sx={{
                    width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {getSelectedMenuText()}
                    </Typography>
                </Toolbar>
            </AppBar>

            {(sidebarOpen || isMobile) && (
                <Drawer
                    variant={isMobile ? 'temporary' : 'persistent'}
                    open={isMobile ? mobileOpen : sidebarOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderRight: '1px solid #ddd',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mr: '5px',
                    minHeight: 'calc(100vh - 64px)',
                    bgcolor: 'background.default',
                    ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
                    transition: 'margin-left 0.3s',
                    overflowX: 'auto',
                }}
            >
                <Fade in={true} timeout={400} key={selectedMenu}>
                    <Box sx={{ p: 2 }}>
                        {renderContent()}
                    </Box>
                </Fade>
            </Box>
        </Box>
    );
}
