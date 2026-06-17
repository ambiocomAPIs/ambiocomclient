REFACTORIZACIÓN MÓDULO LOGÍSTICA

Estructura corregida según arquitectura actual:

src/components/Modulo_Logistica/
├── DataAnalisysProgramacionDespacho.jsx   ← padre, NO va dentro de utils_Logistica_Page
├── README_REFACTORIZACION.txt
└── utils_Logistica_Page/
    ├── ResumenKpiRadarModal.jsx           ← incluido completo
    ├── helpers/
    ├── hooks/
    └── graficas/

Notas:
- No eliminar el archivo ResumenKpiRadarModal.jsx.
- El padre conserva el nombre DataAnalisysProgramacionDespacho.jsx.
- Los componentes auxiliares, hooks, helpers y gráficas sí quedan dentro de utils_Logistica_Page.
- La intención de esta versión es organizar responsabilidades sin cambiar diseño ni cálculos.
- El KPI de Hora Programada conserva el cruce por fecha + transportadora + cliente + producto + placa y mantiene vehículos rechazados dentro de este indicador.

Instalación sugerida:
1. Haz backup de tu carpeta actual src/components/Modulo_Logistica.
2. Descomprime este ZIP sobre src/components/Modulo_Logistica.
3. Revisa que tus rutas externas sigan importando DataAnalisysProgramacionDespacho.jsx desde la misma ubicación.
4. Ejecuta npm run dev y valida imports/rutas locales.
