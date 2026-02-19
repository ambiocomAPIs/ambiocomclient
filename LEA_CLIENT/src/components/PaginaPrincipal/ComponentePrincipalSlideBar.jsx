import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "../../utils/Context/AuthContext/AuthContext.jsx";
import Swal from "sweetalert2";

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
    Fade,
    Button,
    Tooltip,
    Chip
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Menu as MenuIcon,
} from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from "@mui/icons-material/Storage";
//Pagina Inicio
import InicioApp from '../pagina_Inicio/InicioApp.jsx';
//Modulo de informes
import InformeAlcoholes from '../Modulo_Informes/InformeAlcoholes.jsx';
//Modulo Produccion
import SeguimientoTKJornaleros from '../SeguimientoTanquesJornaleros/SeguimientoTKJornaleros.jsx';
import TanquesList from '../TanquesList.jsx'
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
//MODULO LOGISTICA
import TablaRegistroCarbonMadera from '../Ingreso_MaderaCarbon/TablaRegistroIngresosCarbonMadera.jsx';
import RecepcionAlcoholesLogisticaModels from '../Modulo_Logistica/RecepcionAlcoholes/RecepcionAlcoholesLogistica.jsx';
import DespachoAlcoholesLogistica from '../Modulo_Logistica/DespachosAlcoholes/DespachoAlcoholesLogistica.jsx'
import ConductoresPage from '../Modulo_Logistica/ConductoresDB/ConductoresPage.jsx';
import TransportadorasPage from "../Modulo_Logistica/Transportadoras/TransportadorasPage.jsx"
import ProductosDespacho from "../Modulo_Logistica/Productos/ProductosDespacho.jsx"
//empelados
import EmpleadosManager from '../EmpleadosManager/EmpleadosAmbiocomList.jsx';
//Medidores
import TablaMedicionesAgua from '../PTAP/TablaMedicionesAgua.jsx';
//energia
import TablaMedicionesDiariaEnergia from '../Energia_CON/TablaMedicionesEnergia.jsx'
//Modulo DB
import ConsultasHttpDb from '../DB_Consultas_View/ConsultasHttpDb.jsx';
//modulo inventario
import SGMRC from '../Insumos_Modulo/SGMRC.jsx';
//pagina mantenimiento de modulo y desarrollo
import ModuloEnMantenimiento from '../PaginaMantenimientoYDesarrollo/PaginaMantenimientoYDesarrollo.jsx';
//importacion de iconos
import {
    tanqueIcon, factoryIcon, despachoIcon, despachoSalidaIcon, despachoRecepcionIcon, laboratoryIcon, inventoryIcon, rulerIcon, oilTankIcon, coalInventoryIcon,
    ptapIcon, GraphIcon, BarGraphIcon, BarGraphComparativeIcon, robotAssistanceIcon, bitacoraIcon, StopWatchIcon, PdfIcon, DatabaseAdministratorIcon, workerIcon,
    TankGraphIcon, CounterIcon, MoneyGraphIcon, EnergyIcon, EnergyDataIcon, InOutMaderaCarbonIcon, InformeIcon, TankWithLiquidIcon, ReportIcon,
    Driver, ClientIcon, TruckCompany, ProductDespacho
} from '../../utils/icons/SvgIcons.js'

// importacion contexto de tanques
import { useTanques } from "../../utils/Context/TanquesContext.jsx";
import { useNivelesDiariosTanques } from '../../utils/Context/NivelesDiariosTanquesContext.jsx';
import { useEmpleados } from '../../utils/Context/EmpleadosContext.jsx'

const drawerWidth = 280;

export default function EmpresarialPrincipalSchedulerApp() {

    // ------  definicion de los contextos  ----------
    const { tanques, loading, setTanques } = useTanques();
    const { nivelesTanques, nivelesTanquesLoading, setNivelesTanques } = useNivelesDiariosTanques();
    const { empleadosActivos, loadingEmpleados } = useEmpleados();
    const { rol, loadingAuth, logout, user } = useAuth();
    // -----------------------------------------------
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openSubmenus, setOpenSubmenus] = useState({});
    // Que base de dats estoy usando ??
    const [dbInfo, setDbInfo] = useState("");

    const navigate = useNavigate();
    // watch para ver en que DB estoy trabajando
    useEffect(() => {
        axios.get("https://ambiocomserver.onrender.com/api/meta").then(res => {
            setDbInfo(res.data.db);
        });
    }, []);
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

    const canAccess = (roles) => {
        if (loadingAuth) return true;
        if (!roles) return true;
        if (roles.includes("*")) return true;

        const currentRole = (rol || "").toLowerCase().trim();
        const allowedRoles = roles.map(r => (r || "").toLowerCase().trim());
        return allowedRoles.includes(currentRole);
    };

    useEffect(() => {
        console.log("ROL ACTUAL:", rol, "ROL NORMALIZADO:", (rol || "").toLowerCase().trim(), "loadingAuth:", loadingAuth);
    }, [rol, loadingAuth]);

    const menuItems = [
        {
            text: 'Inicio Ambiocom',
            key: 'paginadeinicio',
            roles: ["*"], //visible para todos
            icon: <img src={"/logo_ambiocom.png"} alt="inicio" style={{ width: 35, height: 35 }} />,
        },
        {
            text: 'Informes',
            key: 'Informes',
            roles: ["admin", "developer"],
            icon: <img src={InformeIcon} alt="Informes" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Inventario OH', subKey: 'Inventariodeoh', /* roles: ["admin","supervisor"], */ icon: <img src={ReportIcon} alt="Inventariodeoh" style={{ width: 25, height: 25 }} /> },
                { text: 'CarbonYmadera', subKey: 'modulomantenimiento', /* roles: ["admin"], */ icon: <img src={ReportIcon} alt="InventariodeCarbonYmadera" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Produccion',
            key: 'produccion',
            roles: ["admin", "developer"],
            icon: <img src={factoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Inventario de insumos', subKey: 'Inventariodeinsumos', /* roles: ["admin","supervisor"], */ icon: <img src={inventoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Tanques Jornaleros', subKey: 'Tanquesjornaleros', roles: ["admin", "developer", "liderlogistica"], icon: <img src={rulerIcon} alt="tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
                { text: 'Bitacora Supervisores', subKey: 'bitacoradeturnosupervisores', /* roles: ["admin","supervisor"], */ icon: <img src={bitacoraIcon} alt="bitacoradeturnosupervisores" style={{ width: 25, height: 25 }} /> },
                { text: 'Inventario Combust', subKey: 'inventariodecarbonymadera', /* roles: ["admin","supervisor"], */ icon: <img src={coalInventoryIcon} alt="Tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
                { text: 'Horas Extras', subKey: 'horasextrassupervisores', /* roles: ["admin","supervisor"], */ icon: <img src={StopWatchIcon} alt="horasextrassupervisores" style={{ width: 25, height: 25 }} /> },
                { text: 'CRUD Tanques', subKey: 'tanquescrud', /* roles: ["admin"], */ icon: <img src={tanqueIcon} alt="tanquescrud" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Logistica',
            key: 'logistica',
            roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica1", "auxiliarlogistica2"],
            icon: <img src={despachoIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Grafica Niveles Tanques Jornaleros', subKey: 'nivelestanquesjornalerospagina', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2"], icon: <img src={TankGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Despachos', subKey: 'despachoalcoholeslogistica', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Recepción', subKey: 'recepcionalcoholeslogistica', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Productos', subKey: 'productosdespacho', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={ProductDespacho} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Conductores', subKey: 'conductoresdb', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={Driver} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Clientes', subKey: 'ClientesDB', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={ClientIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Transportadora', subKey: 'transportadorasdb', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1"], icon: <img src={TruckCompany} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Ingresos_M-C', subKey: 'moduloingresosmaderacarbon', roles: ["admin", "developer"], icon: <img src={InOutMaderaCarbonIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Tanques',
            key: 'tanquesniveles',
            roles: ["admin", "developer"],
            icon: <img src={tanqueIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'UNIDAD 100', subKey: 'nivelesunidadcien', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={oilTankIcon} alt="nivelesunidadtrecien" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 300', subKey: 'nivelesunidadtrecientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={oilTankIcon} alt="nivelesunidadtrecientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 450', subKey: 'nivelesunidadcuatrocientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={oilTankIcon} alt="nivelesunidadcuatrocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 800', subKey: 'nivelesunidadochocientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={oilTankIcon} alt="nivelesunidadochocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'Cuba Fermentac', subKey: 'cubadefermentacion', /* roles: ["admin","supervisor"], */ icon: <img src={oilTankIcon} alt="cubadefermentacion" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Data Analisis',
            key: 'dataanalisis',
            roles: ["admin", "developer"],
            icon: <img src={GraphIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Grafica Niveles Tanques Jornaleros', subKey: 'nivelestanquesjornalerospagina', /* roles: ["admin","supervisor"], */ icon: <img src={TankGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Isumos Kg/L [OH]', subKey: 'comparativomensualinsumosquimicoscomponent', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphComparativeIcon} alt="comparativomensualinsumosquimicoscomponent" style={{ width: 25, height: 25 }} /> },
                { text: 'Isumos $/L [OH]', subKey: 'Comparativomensualinsumosquimicoscostolitro', /* roles: ["admin","supervisor"], */ icon: <img src={MoneyGraphIcon} alt="Comparativomensualinsumosquimicoscostolitro" style={{ width: 25, height: 25 }} /> },
                { text: 'Insumos/mes', subKey: 'nivelesunidadcien', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Comparativo', subKey: 'comparativoIsumos/L[OH]', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphComparativeIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Agua/L[OH]', subKey: 'nivelesunidadtrecientos', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Carbon/L[OH]', subKey: 'nivelesunidadcuatrocientos', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Madera/L[OH]', subKey: 'nivelesunidadochocientos', /* roles: ["admin","supervisor"], */ icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            ],
        },
        { text: 'Laboratorio', roles: ["admin", "developer"], icon: <img src={laboratoryIcon} alt="laboratorio" style={{ width: 25, height: 25 }} />, key: 'Laboratorio' },
        {
            text: 'Planta de Aguas', roles: ["admin", "developer"], icon: <img src={ptapIcon} alt="plantadeaguas" style={{ width: 25, height: 25 }} />, key: 'plantadeaguas', subItems: [
                { text: 'Medidores', subKey: 'registrodemedidores', /* roles: ["admin","ptap"], */ icon: <img src={CounterIcon} alt="Medidores" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Energia', roles: ["admin", "developer"], icon: <img src={EnergyIcon} alt="Energia" style={{ width: 25, height: 25 }} />, key: 'Energia', subItems: [
                { text: 'Energia CON', subKey: 'energiaambiocom', /* roles: ["admin","energia"], */ icon: <img src={EnergyDataIcon} alt="Energia" style={{ width: 25, height: 25 }} /> },
            ],
        },
        { text: 'Registro Trabajadores', roles: ["admin", "developer"], icon: <img src={workerIcon} alt="empleadosambiocom" style={{ width: 25, height: 25 }} />, key: 'empleadosambiocom' },
        { text: 'DB Aministrator', roles: ["admin", "developer"], icon: <img src={DatabaseAdministratorIcon} alt="basededatos" style={{ width: 25, height: 25 }} />, key: 'basededatos', /* roles: ["admin"] */ },
        { text: 'Assistance', roles: ["admin", "developer"], icon: <img src={robotAssistanceIcon} alt="robotassistance" style={{ width: 25, height: 25 }} />, key: 'robotassistance' },
    ];

    const getRolesForMenuKey = (menuKey) => {
        for (const item of menuItems) {
            if (item.key === menuKey) return item.roles;
            if (item.subItems) {
                const sub = item.subItems.find(s => s.subKey === menuKey);
                if (sub) return sub.roles;
            }
        }
        return null;
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "¿Cerrar sesión?",
            text: "¿Estás seguro que quieres cerrar tu sesión?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar sesión",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d32f2f",
            cancelButtonColor: "#3085d6",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await logout();

            localStorage.removeItem("selectedMenu");
            setSelectedMenu('paginadeinicio');

            await Swal.fire({
                title: "Sesión cerrada",
                text: "Has cerrado sesión correctamente",
                icon: "success",
                timer: 1200,
                showConfirmButton: false,
            });

            navigate("/");
        } catch (err) {
            console.error("Error al cerrar sesión", err);

            Swal.fire({
                title: "Error",
                text: "No se pudo cerrar sesión",
                icon: "error",
            });
        }
    };


    const renderContent = () => {

        // rolesAllowed debe calcularse acá (antes lo estabas usando sin definir)
        const rolesAllowed = getRolesForMenuKey(selectedMenu);

        // validacion para que no le renderice a ciertos roles proteccion adicional
        if (rolesAllowed && !canAccess(rolesAllowed)) {
            return <ModuloEnMantenimiento />; //o modulo unauthorized
        }

        switch (selectedMenu) {
            case 'paginadeinicio': return <InicioApp />;
            case 'Tanquesjornaleros': return <SeguimientoTKJornaleros NivelesTanquesContext={nivelesTanques} />;
            case 'Inventariodeinsumos': return <SGMRC />;
            case 'nivelesunidadcien': return <TanquesUnidadCien tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadtrecientos': return <TanquesUnidadTreCientos tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadcuatrocientos': return <Unidad400Component tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadochocientos': return <UnidadOchoCientosAlmacenamiento tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'cubadefermentacion': return <CubaDeFermentacion tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'bitacoradeturnosupervisores': return <BitacoraDeSupervisores trabajadoresRegistradosContext={empleadosActivos} />;
            case 'horasextrassupervisores': return <PanelHoras />;
            case 'inventariodecarbonymadera': return <InventarioCarbonMadera />;
            case 'basededatos': return <ConsultasHttpDb />;
            case 'robotassistance': return <ChatBox />;
            case 'tanquescrud': return <TanquesList tanquesContext={tanques} />;
            case 'empleadosambiocom': return <EmpleadosManager />;
            case 'nivelestanquesjornalerospagina': return <GraficoNivelesTanquesPorDiaPageComponente NivelesTanquesContext={nivelesTanques} />;
            case 'comparativomensualinsumosquimicoscomponent': return <Comparativomensualinsumosquimicos />;
            case 'Comparativomensualinsumosquimicoscostolitro': return <Comparativomensualinsumosquimicoscostolitro />;
            case 'registrodemedidores': return <TablaMedicionesAgua />;
            case 'energiaambiocom': return <TablaMedicionesDiariaEnergia />;
            case 'moduloingresosmaderacarbon': return <TablaRegistroCarbonMadera />;
            //informes
            case 'Inventariodeoh': return <InformeAlcoholes />;
            //logistica
            case 'recepcionalcoholeslogistica': return <RecepcionAlcoholesLogisticaModels />;
            case 'despachoalcoholeslogistica': return <DespachoAlcoholesLogistica />;
            case 'conductoresdb': return <ConductoresPage />;
            case 'transportadorasdb': return <TransportadorasPage />;
            case 'productosdespacho': return <ProductosDespacho />;
            //pagina mantenimiento
            case 'modulomantenimiento': return <ModuloEnMantenimiento />;
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
                {menuItems.map(({ text, icon, key, subItems, roles }) => (
                    <Box key={key}>
                        <ListItemButton
                            disabled={!canAccess(roles)}
                            onClick={() => {
                                if (!canAccess(roles)) return;

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
                                    {subItems.map(({ text: subText, subKey, icon: subIcon, roles: subRoles }) => (
                                        <ListItemButton
                                            key={subKey}
                                            disabled={!canAccess(subRoles)}
                                            sx={{ pl: 5 }}
                                            selected={selectedMenu === subKey}
                                            onClick={() => {
                                                if (!canAccess(subRoles)) return;
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
                <Toolbar sx={{ position: "relative" }}>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {getSelectedMenuText()}
                    </Typography>
                    <Box
                        sx={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "none", // para que no estorbe clicks del appbar
                        }}
                    >
                        <Chip
                            icon={<StorageIcon sx={{ color: "white !important" }} />}
                            label={dbInfo ? `Mode: ${dbInfo.toUpperCase()}` : "DB"}
                            size="small"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: 1,
                                px: 1.5,
                                borderRadius: "10px",
                                bgcolor: dbInfo === "test" ? "orange" : "primary.main", // <- aquí
                                color: "white",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                backdropFilter: "blur(4px)",
                            }}
                        />
                    </Box>

                    {/* 👤 Usuario logueado */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            mr: 3,
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: "rgba(0,0,0,0.04)"
                        }}
                    >
                        <PersonIcon sx={{ mr: 1.5 }} />
                        <Box sx={{ textAlign: "center", lineHeight: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                Bienvenido
                            </Typography>
                            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                                {rol ? rol.toUpperCase() : ""}
                            </Typography>
                        </Box>
                    </Box>

                    <Tooltip title="Cerrar sesión">
                        <IconButton color="warning" onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
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
