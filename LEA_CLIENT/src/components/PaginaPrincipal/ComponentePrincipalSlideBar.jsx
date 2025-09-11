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
} from '@mui/icons-material';

//Pagina Inicio
import InicioApp from '../pagina_Inicio/InicioApp.jsx';
//Modulo Produccion
import SeguimientoTKJornaleros from '../SeguimientoTKJornaleros';
import TanquesList from '../TanquesList.jsx'
import ExcelStyleFooter from '../../utils/ExcelStyleFooter';
import ChatBox from '../IA/ChatBox';
import BitacoraDeSupervisores from '../Bitacora/BitacoraComponentesProduccion'
import PanelHoras from '../PanelHoras';
import InventarioCarbonMadera from '../InventarioCarbonMadera';
// Modulo de graficos y analisis
import GraficoNivelesTanquesPorDiaPageComponente from '../TanquesVistaNiveles/GraficaNivelesDiariosPorMes/GraficaNivelesDiarioTanquesJornalerosComponente.jsx';
import Comparativomensualinsumosquimicos from '../Modulos_API/DataAnalisis/Comparativomensualinsumosquimicos.jsx';
import Comparativomensualinsumosquimicoscostolitro from '../Modulos_API/DataAnalisis/Comparativomensualinsumosquimicoscostolitro.jsx';
//Modulo Tanques
import TanquesUnidadTreCientos from '../TanquesVistaNiveles/Unidad300';
import CubaDeFermentacion from '../TanquesVistaNiveles/CubasDeFermentacion';
import TanquesUnidadCien from '../TanquesVistaNiveles/Unidad100';
import UnidadOchoCientosAlmacenamiento from '../TanquesVistaNiveles/Unidad800'
import Unidad400Component from '../TanquesVistaNiveles/Unidad400.jsx';
//empelados
import EmpleadosManager from '../EmpleadosManager/EmpleadosAmbiocomList.jsx';
//Modulo DB
import ConsultasHttpDb from '../DB_Consultas_View/ConsultasHttpDb.jsx';
//Utils
import { validarSesion } from '../../utils/configuraciones/validarSesion.js';
//modulo inventario
import SGMRC from '../SGMRC';
//importacion de iconos
import {
    tanqueIcon, factoryIcon, despachoIcon, despachoSalidaIcon, despachoRecepcionIcon, laboratoryIcon, inventoryIcon, rulerIcon, oilTankIcon, coalInventoryIcon,
    ptapIcon, GraphIcon, BarGraphIcon, BarGraphComparativeIcon, robotAssistanceIcon, bitacoraIcon, StopWatchIcon, PdfIcon, DatabaseAdministratorIcon, workerIcon,
    TankGraphIcon, CounterIcon, MoneyGraphIcon
} from '../../utils/icons/SvgIcons.js'

// importacion contexto de tanques
import { useTanques } from "../../utils/Context/TanquesContext.jsx";
import { useNivelesDiariosTanques } from '../../utils/Context/NivelesDiariosTanquesContext.jsx';
import {useEmpleados} from '../../utils/Context/EmpleadosContext.jsx'

const drawerWidth = 280;

export default function EmpresarialPrincipalSchedulerApp() {
    
    // ------  definicion de los contextos  ----------
    const { tanques, loading, setTanques } = useTanques();
    const { nivelesTanques, nivelesTanquesLoading, setNivelesTanques } = useNivelesDiariosTanques();
    const { empleadosActivos, loadingEmpleados } = useEmpleados();
    // -----------------------------------------------
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openSubmenus, setOpenSubmenus] = useState({});

    const navigate = useNavigate();
    // Cargar menú guardado o por defecto
    useEffect(() => {
        const savedMenu = localStorage.getItem("selectedMenu");
        if (savedMenu) {
            setSelectedMenu(savedMenu);
        } else {
            setSelectedMenu('paginadeinicio');
        }
    }, []);

    // Guardar en localStorage sólo si selectedMenu tiene valor válido
    useEffect(() => {
        if (selectedMenu) {
            localStorage.setItem("selectedMenu", selectedMenu);
        }
    }, [selectedMenu]);


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

    const handleDrawerToggleComponent = () => {
        if (isMobile) {
            setMobileOpen(false);
        } else {
            setSidebarOpen(false);
        }
    };

    const menuItems = [
        {
            text: 'Inicio Ambiocom',
            key: 'paginadeinicio',
            icon: <img src={"/logo_ambiocom.png"} alt="inicio" style={{ width: 35, height: 35 }} />,
        },
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
                { text: 'CRUD Tanques', subKey: 'tanquescrud', icon: <img src={tanqueIcon} alt="tanquescrud" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Logistica',
            key: 'logistica',
            icon: <img src={despachoIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Niveles Tanques', subKey: 'Tanquesjornaleros', icon: <img src={rulerIcon} alt="tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
                { text: 'Grafica Niveles Tanques Jornaleros', subKey: 'nivelestanquesjornalerospagina', icon: <img src={TankGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Despachos', subKey: 'Inventariodeinsumos', icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Recepcion', subKey: 'Tanquesjornaleros', icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Tanques',
            key: 'tanquesniveles',
            icon: <img src={tanqueIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'UNIDAD 100', subKey: 'nivelesunidadcien', icon: <img src={oilTankIcon} alt="nivelesunidadtrecien" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 300', subKey: 'nivelesunidadtrecientos', icon: <img src={oilTankIcon} alt="nivelesunidadtrecientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 450', subKey: 'nivelesunidadcuatrocientos', icon: <img src={oilTankIcon} alt="nivelesunidadcuatrocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 800', subKey: 'nivelesunidadochocientos', icon: <img src={oilTankIcon} alt="nivelesunidadochocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'Cuba Fermentac', subKey: 'cubadefermentacion', icon: <img src={oilTankIcon} alt="cubadefermentacion" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Data Analisis',
            key: 'dataanalisis',
            icon: <img src={GraphIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Grafica Niveles Tanques Jornaleros', subKey: 'nivelestanquesjornalerospagina', icon: <img src={TankGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Isumos Kg/L [OH]', subKey: 'comparativomensualinsumosquimicoscomponent', icon: <img src={BarGraphComparativeIcon} alt="comparativomensualinsumosquimicoscomponent" style={{ width: 25, height: 25 }} /> },
                { text: 'Isumos $/L [OH]', subKey: 'Comparativomensualinsumosquimicoscostolitro', icon: <img src={MoneyGraphIcon} alt="Comparativomensualinsumosquimicoscostolitro" style={{ width: 25, height: 25 }} /> },
                { text: 'Insumos/mes', subKey: 'nivelesunidadcien', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Comparativo', subKey: 'comparativoIsumos/L[OH]', icon: <img src={BarGraphComparativeIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Agua/L[OH]', subKey: 'nivelesunidadtrecientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Carbon/L[OH]', subKey: 'nivelesunidadcuatrocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Madera/L[OH]', subKey: 'nivelesunidadochocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            ],
        },
        { text: 'Laboratorio', icon: <img src={laboratoryIcon} alt="laboratorio" style={{ width: 25, height: 25 }} />, key: 'Laboratorio' },
        {
            text: 'Planta de Aguas', icon: <img src={ptapIcon} alt="plantadeaguas" style={{ width: 25, height: 25 }} />, key: 'plantadeaguas', subItems: [
                { text: 'Medidores', subKey: 'registrodemedidores', icon: <img src={CounterIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            ],
        },
        { text: 'Registro Trabajadores', icon: <img src={workerIcon} alt="empleadosambiocom" style={{ width: 25, height: 25 }} />, key: 'empleadosambiocom' },
        { text: 'DB Aministrator', icon: <img src={DatabaseAdministratorIcon} alt="basededatos" style={{ width: 25, height: 25 }} />, key: 'basededatos' },
        { text: 'Assistance', icon: <img src={robotAssistanceIcon} alt="robotassistance" style={{ width: 25, height: 25 }} />, key: 'robotassistance' },
    ];

    const renderContent = () => {
        switch (selectedMenu) {
            case 'paginadeinicio': return <InicioApp />;
            case 'Tanquesjornaleros': return <SeguimientoTKJornaleros NivelesTanquesContext={nivelesTanques} />;
            case 'Inventariodeinsumos': return <SGMRC />;
            case 'nivelesunidadcien': return <TanquesUnidadCien tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadtrecientos': return <TanquesUnidadTreCientos tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadcuatrocientos': return <Unidad400Component tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadochocientos': return <UnidadOchoCientosAlmacenamiento tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'cubadefermentacion': return <CubaDeFermentacion tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'bitacoradeturnosupervisores': return <BitacoraDeSupervisores trabajadoresRegistradosContext={empleadosActivos}/>;
            case 'horasextrassupervisores': return <PanelHoras />;
            case 'inventariodecarbonymadera': return <InventarioCarbonMadera />;
            case 'basededatos': return <ConsultasHttpDb />;
            case 'robotassistance': return <ChatBox />;
            case 'tanquescrud': return <TanquesList tanquesContext={tanques} />;
            case 'empleadosambiocom': return <EmpleadosManager />;
            case 'nivelestanquesjornalerospagina': return <GraficoNivelesTanquesPorDiaPageComponente NivelesTanquesContext={nivelesTanques} />;
            case 'comparativomensualinsumosquimicoscomponent': return <Comparativomensualinsumosquimicos />;
            case 'Comparativomensualinsumosquimicoscostolitro': return <Comparativomensualinsumosquimicoscostolitro />;
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
                © 2025 AMBIOCOM SAS. Todos los derechos reservados.
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
                onClick={handleDrawerToggleComponent}
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
