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
import UnidadSeicientosComponent from '../TanquesVistaNiveles/Unidad600.jsx';
//MODULO LOGISTICA
import TablaRegistroCarbonMadera from '../Ingreso_MaderaCarbon/TablaRegistroIngresosCarbonMadera.jsx';
import RecepcionAlcoholesLogisticaModels from '../Modulo_Logistica/RecepcionAlcoholes/RecepcionAlcoholesLogistica.jsx';
import DespachoAlcoholesLogistica from '../Modulo_Logistica/DespachosAlcoholes/DespachoAlcoholesLogistica.jsx'
import ConductoresPage from '../Modulo_Logistica/ConductoresDB/ConductoresPage.jsx';
import TransportadorasPage from "../Modulo_Logistica/Transportadoras/TransportadorasPage.jsx"
import ProductosDespacho from "../Modulo_Logistica/Productos/ProductosDespacho.jsx"
import ColumnasDBManagement from "../Modulo_Logistica/Desarrollador_DB/ColumnasDBManagement.jsx"
import ColaboradoresAmbiocom from "../Modulo_Logistica/ColaboradoresDB/ColaboradoresDespachosDB.jsx"
import ClientesDespachoPageDB from "../Modulo_Logistica/ClientesDB/ClientesAmbiocomDB.jsx"
import ProgramacionDespachoDiariaPage from '../Modulo_Logistica/PlaneacionDiaria/planeaciondespachos.jsx';
//MODULO LABORATORIO
import TablaDespachosLogisticaReadOnly from "../Modulo_Laboratorio/Modulo_Despachos/Despachos_List/TablaDespachosLogisticaReadOnly.jsx"
import ProgramacionDespachoReadOnlyPage from "../Modulo_Laboratorio/Modulo_Despachos/Despachos_List/ProgramacionDespachoReadOnlyPage.jsx"
import TablaRecepcionVehiculosReadOnly from '../Modulo_Laboratorio/Modulo_Despachos/Recepciones_List/TablaRecepcionesLogisticaReadOnly.jsx';
//empelados
import EmpleadosManager from '../EmpleadosManager/EmpleadosAmbiocomList.jsx';
//Medidores
import TablaMedicionesAgua from '../PTAP/TablaMedicionesAgua.jsx';
//energia
import TablaMedicionesDiariaEnergia from '../Energia_CON/TablaMedicionesEnergia.jsx'
//Modulo DEV
import ConsultasHttpDb from '../DB_Consultas_View/ConsultasHttpDb.jsx';
import TaskRequerimentDev from '../DB_Consultas_View/TaskRequerimentDevComponent.jsx';
//modulo inventario
import SGMRC from '../Insumos_Modulo/SGMRC.jsx';
//pagina mantenimiento de modulo y desarrollo
import ModuloEnMantenimiento from '../PaginaMantenimientoYDesarrollo/PaginaMantenimientoYDesarrollo.jsx';
// modulo captura de trafico logs
import TrafficLogViewer from '../System/TrafficLogViewer.jsx'
//importacion de iconos
import {
    tanqueIcon, factoryIcon, despachoIcon, despachoSalidaIcon, despachoRecepcionIcon, laboratoryIcon, inventoryIcon, rulerIcon, oilTankIcon, coalInventoryIcon,
    ptapIcon, GraphIcon, BarGraphIcon, BarGraphComparativeIcon, robotAssistanceIcon, bitacoraIcon, StopWatchIcon, PdfIcon, DatabaseAdministratorIcon, workerIcon,
    TankGraphIcon, CounterIcon, MoneyGraphIcon, EnergyIcon, EnergyDataIcon, InOutMaderaCarbonIcon, InformeIcon, TankWithLiquidIcon, ReportIcon,
    Driver, ClientIcon, TruckCompany, ProductDespacho, DevIcon, PersonalIcons, plannerIconDate, logsIcon, VesselTkIcon, VesselTkIconChemical, ListToDoIcon
} from '../../utils/icons/SvgIcons.js'

// importacion contexto de tanques
import { useTanques } from "../../utils/Context/TanquesContext.jsx";
import { useNivelesDiariosTanques } from '../../utils/Context/NivelesDiariosTanquesContext.jsx';
import { useEmpleados } from '../../utils/Context/EmpleadosContext.jsx'

const drawerWidth = 320;

export default function EmpresarialPrincipalSchedulerApp() {

    // ------  definicion de los contextos  ----------
    const { tanques, loading, setTanques } = useTanques();
    const { nivelesTanques, nivelesTanquesLoading, setNivelesTanques } = useNivelesDiariosTanques();
    const { empleadosActivos, loadingEmpleados } = useEmpleados();
    const { rol, loadingAuth, logout, user, refreshMe } = useAuth();
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

    useEffect(() => {
        refreshMe();
    }, []);

    // recarga la pagina al iniciar
    //     useEffect(() => {
    //   const key = "reloaded_principal_once";
    //   const already = sessionStorage.getItem(key);

    //   if (!already) {
    //     sessionStorage.setItem(key, "1");
    //     window.location.reload();
    //   }
    // }, []);

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
            icon: <img src={"/LogoCompany/logoambiocomicon.png"} alt="inicio" style={{ width: 34, height: 34 }} />,
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
            roles: ["admin", "developer", "supervisor"],
            icon: <img src={factoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Inventario de insumos', subKey: 'Inventariodeinsumos', /* roles: ["admin","supervisor"], */ icon: <img src={inventoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Tanques Jornaleros', subKey: 'Tanquesjornaleros', roles: ["admin", "developer", "liderlogistica", "supervisor"], icon: <img src={rulerIcon} alt="tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
                { text: 'Bitacora Supervisores', subKey: 'bitacoradeturnosupervisores', /* roles: ["admin","supervisor"], */ icon: <img src={bitacoraIcon} alt="bitacoradeturnosupervisores" style={{ width: 25, height: 25 }} /> },
                { text: 'Inventario Combust', subKey: 'inventariodecarbonymadera', /* roles: ["admin","supervisor"], */ icon: <img src={coalInventoryIcon} alt="Tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
                { text: 'Horas Extras', subKey: 'horasextrassupervisores', /* roles: ["admin","supervisor"], */ icon: <img src={StopWatchIcon} alt="horasextrassupervisores" style={{ width: 25, height: 25 }} /> },
                { text: 'CRUD Tanques', subKey: 'tanquescrud', /* roles: ["admin"], */ icon: <img src={tanqueIcon} alt="tanquescrud" style={{ width: 25, height: 25 }} /> },
                {
                    text: 'Despachos y Recepciones',
                    key: 'produccion-logistica',
                    icon: <img src={despachoIcon} alt="Logistica" style={{ width: 25, height: 25 }} />,
                    subItems: [
                        {
                            text: 'Planeacion Diaria',
                            subKey: 'planeaciondiariadespachosreadonly',
                            roles: ["admin", "laboratorio", "developer", "gerente"],
                            icon: <img src={plannerIconDate} alt="programaciondiaria" style={{ width: 25, height: 25 }} />
                        },
                        {
                            text: 'Despachos',
                            subKey: 'despachoalcoholeslogisticareadonly',
                            roles: ["admin", "laboratorio", "developer", "gerente"],
                            icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} />
                        },
                        {
                            text: 'Recepción',
                            subKey: 'recepcionalcoholeslogisticareadonly',
                            roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"],
                            icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} />
                        }
                    ]
                }
            ],
        },
        {
            text: 'Logistica',
            key: 'logistica',
            roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica1", "auxiliarlogistica2", "torrecontrollogistica"],
            icon: <img src={despachoIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'Grafica Niveles Tanques Jornaleros', subKey: 'nivelestanquesjornalerospagina', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "torrecontrollogistica"], icon: <img src={TankGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
                { text: 'Planeacion Diaria', subKey: 'planeaciondiariadespachos', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "torrecontrollogistica"], icon: <img src={plannerIconDate} alt="programaciondiaria" style={{ width: 25, height: 25 }} /> },
                { text: 'Despachos', subKey: 'despachoalcoholeslogistica', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Recepción', subKey: 'recepcionalcoholeslogistica', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Colaboradores', subKey: 'colaboradoresambiocom', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={PersonalIcons} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Productos', subKey: 'productosdespacho', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={ProductDespacho} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Conductores', subKey: 'conductoresdb', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={Driver} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Clientes', subKey: 'clientesdb', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={ClientIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Transportadora', subKey: 'transportadorasdb', roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"], icon: <img src={TruckCompany} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'Ingresos_M-C', subKey: 'moduloingresosmaderacarbon', roles: ["admin", "developer"], icon: <img src={InOutMaderaCarbonIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
                { text: 'DEV_Functions', subKey: 'gestiondecolumnasdesarrollador', roles: ["developer"], icon: <img src={DevIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            ],
        },
        {
            text: 'Tanques',
            key: 'tanquesniveles',
            roles: ["admin", "developer"],
            icon: <img src={tanqueIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
            subItems: [
                { text: 'CRUD Tanques', subKey: 'tanquescrud', /* roles: ["admin"], */ icon: <img src={VesselTkIconChemical} alt="tanquescrud" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 100', subKey: 'nivelesunidadcien', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={VesselTkIcon} alt="nivelesunidadtrecien" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 300', subKey: 'nivelesunidadtrecientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={VesselTkIcon} alt="nivelesunidadtrecientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 450', subKey: 'nivelesunidadcuatrocientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={VesselTkIcon} alt="nivelesunidadcuatrocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 600', subKey: 'nivelesunidadseicientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={VesselTkIcon} alt="nivelesunidadseicientos" style={{ width: 25, height: 25 }} /> },
                { text: 'UNIDAD 800', subKey: 'nivelesunidadochocientos', /* roles: ["admin","supervisor","logistica"], */ icon: <img src={VesselTkIcon} alt="nivelesunidadochocientos" style={{ width: 25, height: 25 }} /> },
                { text: 'Cuba Fermentac', subKey: 'cubadefermentacion', /* roles: ["admin","supervisor"], */ icon: <img src={VesselTkIcon} alt="cubadefermentacion" style={{ width: 25, height: 25 }} /> },
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

            ],
        },
        {
            text: 'Laboratorio',
            roles: ["admin", "developer", "laboratorio"], icon: <img src={laboratoryIcon} alt="laboratorio" style={{ width: 25, height: 25 }} />, key: 'modulomantenimiento',
            subItems: [
                // { text: 'Planeacion Diaria', subKey: 'planeaciondiariadespachosreadonly', roles: ["admin", "laboratorio", "developer", "gerente"], icon: <img src={plannerIconDate} alt="programaciondiaria" style={{ width: 25, height: 25 }} /> },
                {
                    text: 'Despachos y Recepciones',
                    key: 'produccion-logistica',
                    icon: <img src={despachoIcon} alt="Logistica" style={{ width: 25, height: 25 }} />,
                    subItems: [
                        {
                            text: 'Planeacion Diaria',
                            subKey: 'planeaciondiariadespachosreadonly',
                            roles: ["admin", "laboratorio", "developer", "gerente"],
                            icon: <img src={plannerIconDate} alt="programaciondiaria" style={{ width: 25, height: 25 }} />
                        },
                        {
                            text: 'Despachos',
                            subKey: 'despachoalcoholeslogisticareadonly',
                            roles: ["admin", "laboratorio", "developer", "gerente"],
                            icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} />
                        },
                        {
                            text: 'Recepción',
                            subKey: 'recepcionalcoholeslogisticareadonly',
                            roles: ["admin", "developer", "liderlogistica", "auxiliarlogistica2", "auxiliarlogistica1", "torrecontrollogistica"],
                            icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} />
                        }
                    ]
                }
            ],
        },
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
        {
            text: 'Administrator DEV', roles: ["admin", "developer"], icon: <img src={DevIcon} alt="basededatos" style={{ width: 25, height: 25 }} />, key: 'basededatoscomponent',
            subItems: [
                { text: 'Task & Reqeriments', subKey: 'taskandrequeriments', roles: ["admin", "developer"], icon: <img src={ListToDoIcon} alt="taskandrequeriments" style={{ width: 25, height: 25 }} /> },
                { text: 'Base de datos', subKey: 'basededatos', roles: ["admin", "developer"], icon: <img src={DatabaseAdministratorIcon} alt="basededatos" style={{ width: 25, height: 25 }} /> },
                { text: 'Logs Traffic', subKey: 'logstraffic', roles: ["admin", "developer"], icon: <img src={logsIcon} alt="logstraffic" style={{ width: 25, height: 25 }} /> },
            ],
        },

        { text: 'Assistance', roles: ["admin", "developer"], icon: <img src={robotAssistanceIcon} alt="robotassistance" style={{ width: 25, height: 25 }} />, key: 'robotassistance' },
    ];

    const getRolesForMenuKey = (menuKey, items = menuItems) => {
        for (const item of items) {
            if (item.key === menuKey || item.subKey === menuKey) {
                return item.roles;
            }

            if (item.subItems) {
                const found = getRolesForMenuKey(menuKey, item.subItems);
                if (found) return found;
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
            //Tanques
            case 'Tanquesjornaleros': return <SeguimientoTKJornaleros NivelesTanquesContext={nivelesTanques} />;
            case 'Inventariodeinsumos': return <SGMRC />;
            case 'nivelesunidadcien': return <TanquesUnidadCien tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadtrecientos': return <TanquesUnidadTreCientos tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadcuatrocientos': return <Unidad400Component tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadseicientos': return <UnidadSeicientosComponent tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'nivelesunidadochocientos': return <UnidadOchoCientosAlmacenamiento tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'cubadefermentacion': return <CubaDeFermentacion tanquesContext={tanques} NivelesTanquesContext={nivelesTanques} />;
            case 'bitacoradeturnosupervisores': return <BitacoraDeSupervisores trabajadoresRegistradosContext={empleadosActivos} />;
            case 'horasextrassupervisores': return <PanelHoras />;
            case 'inventariodecarbonymadera': return <InventarioCarbonMadera />;
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
            case 'gestiondecolumnasdesarrollador': return <ColumnasDBManagement />;
            case 'colaboradoresambiocom': return <ColaboradoresAmbiocom />;
            case 'clientesdb': return <ClientesDespachoPageDB />;
            case 'planeaciondiariadespachos': return <ProgramacionDespachoDiariaPage />;
            //laboratorio
            case 'despachoalcoholeslogisticareadonly': return <TablaDespachosLogisticaReadOnly />;
            case 'planeaciondiariadespachosreadonly': return <ProgramacionDespachoReadOnlyPage />;
            case 'recepcionalcoholeslogisticareadonly': return <TablaRecepcionVehiculosReadOnly />;
            //Modulo Desarrollador
            case 'taskandrequeriments': return <TaskRequerimentDev />;
            case 'basededatos': return <ConsultasHttpDb />;
            case 'logstraffic': return <TrafficLogViewer />;
            //pagina mantenimiento
            case 'modulomantenimiento': return <ModuloEnMantenimiento />;
            default: return null;
        }
    };

    const getSelectedMenuText = (items = menuItems) => {
        for (const item of items) {
            if (item.key === selectedMenu || item.subKey === selectedMenu) {
                return item.text;
            }

            if (item.subItems) {
                const found = getSelectedMenuText(item.subItems);
                if (found) return found;
            }
        }

        return selectedMenu;
    };

    // funcion para renderizar submenus dentro de submenus
    const renderMenuItems = (items, level = 0) => {
        return items.map((item) => {
            const itemKey = item.key || item.subKey;
            const hasChildren = item.subItems && item.subItems.length > 0;

            return (
                <Box key={itemKey}>
                    <ListItemButton
                        disabled={!canAccess(item.roles)}
                        selected={selectedMenu === itemKey}
                        sx={{
                            pl: 1.1 + level * 1,
                            borderRadius: 2,
                            mb: 0,
                            mx: 1,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(33,150,243,0.4)',
                                '& .MuiListItemIcon-root': { color: 'white' },
                            },
                        }}
                        onClick={() => {
                            if (!canAccess(item.roles)) return;

                            if (hasChildren) {
                                setOpenSubmenus(prev => ({
                                    ...prev,
                                    [itemKey]: !prev[itemKey]
                                }));
                            } else {
                                setSelectedMenu(itemKey);
                                if (isMobile) setMobileOpen(false);
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <Tooltip placement="top" title={(item.text).length < 18 ? "" : item.text}>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    noWrap: true,
                                    sx: {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }
                                }} />
                        </Tooltip>
                        {hasChildren && (
                            openSubmenus[itemKey] ? <ExpandLess /> : <ExpandMore />
                        )}
                    </ListItemButton>

                    {hasChildren && (
                        <Collapse in={openSubmenus[itemKey]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {renderMenuItems(item.subItems, level + 1)}
                            </List>
                        </Collapse>
                    )}
                </Box>
            );
        });
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{
                justifyContent: 'center',
                background: 'linear-gradient(90deg, rgb(6, 59, 112) 0%, rgb(0, 89, 87) 50%, rgb(5, 165, 85) 100%)',
                color: 'white',
                mb: 1
            }}>
                <Typography
                    noWrap
                    sx={{
                        fontSize: 22,
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 350,
                        letterSpacing: 1.4,
                        // textTransform: "uppercase",
                    }}
                >
                    Portal Coclí SM26
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1 }}>
                {renderMenuItems(menuItems)}

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
                    ml: 0,
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
