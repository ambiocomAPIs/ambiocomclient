import { useState } from "react";
import axios from "axios";

import HeaderForm from "./HeaderForm";
import NoteBoard from "./NoteBoard";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import CloseIcon from "@mui/icons-material/Close";

import {
  DictionaryIcon,
  BiderectionalCloudIcon,
} from "../../utils/icons/SvgIcons";

import DiccionarioUnidadDefault from "./DiccionarioUnidadDefaults";

import { exportarBitacoraPDF } from "./utils_bitacora/ExportarYsubirDriveBitacoraDeTurno";

const TOTALIZADORES_API_URL =
  "https://ambiocomserver.onrender.com/api/seguimiento-totalizadores";

const INGRESOS_COMBUSTIBLES_BITACORA_API_URL =
  "https://ambiocomserver.onrender.com/api/ingresos-combustibles/bitacora/resumen";

const CONSUMOS_COMBUSTIBLES_BITACORA_API_URL =
  "https://ambiocomserver.onrender.com/api/consumos-combustibles/bitacora/resumen";

/*
 * Estos son los turnos que deben llevar el balance completo
 * de los movimientos realizados el día inmediatamente anterior.
 */
const TURNOS_CON_BALANCE_DIA_ANTERIOR = [
  "TurnoMañana(6:00-14:00)",
  "Turno12Horas(06:00-18:00)",
];

const normalizarFechaISO = (value) => {
  const fecha = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "";
  }

  return fecha;
};

const obtenerDiaAnterior = (fechaISO) => {
  const fechaNormalizada = normalizarFechaISO(fechaISO);

  if (!fechaNormalizada) return "";

  const [year, month, day] = fechaNormalizada
    .split("-")
    .map(Number);

  /*
   * Se utiliza UTC para evitar cambios de fecha
   * causados por la zona horaria del navegador.
   */
  const fecha = new Date(
    Date.UTC(year, month - 1, day)
  );

  fecha.setUTCDate(fecha.getUTCDate() - 1);

  return fecha.toISOString().slice(0, 10);
};

const debeConsultarDiaAnterior = (turno) =>
  TURNOS_CON_BALANCE_DIA_ANTERIOR.includes(
    String(turno || "").trim()
  );

const crearResumenIngresosVacio = (
  fecha,
  mensaje = ""
) => ({
  fecha,
  exists: false,
  sinDatos: true,

  mensaje:
    mensaje ||
    "No se encontraron ingresos de combustibles para el día anterior.",

  resumen: {
    carbon: {
      toneladas: 0,
      viajes: 0,
    },

    madera: {
      toneladas: 0,
      viajes: 0,
    },

    total: {
      toneladas: 0,
      viajes: 0,
    },
  },

  proveedores: [],
  detalle: [],
});

const crearResumenConsumosVacio = (
  fecha,
  mensaje = ""
) => ({
  fecha,
  exists: false,
  sinDatos: true,

  mensaje:
    mensaje ||
    "No se encontraron consumos de combustibles para el día anterior.",

  resumen: {
    carbon: {
      consumoTon: 0,
      ajusteTon: 0,
      paladasCV: 0,
      paladasCN: 0,
    },

    madera: {
      consumoTon: 0,
      ajusteTon: 0,
      paladasCV: 0,
      paladasCN: 0,
    },

    bagazo: {
      consumoTon: 0,
      ajusteTon: 0,
      paladasCV: 0,
      paladasCN: 0,
    },

    total: {
      consumoTon: 0,
      ajusteTon: 0,
      paladasCV: 0,
      paladasCN: 0,
    },
  },

  materiales: [],

  tolvas: {
    principal: 0,
    auxiliares: 0,
    total: 0,
  },

  observacion: "",
});

function BitacoraComponentProduccion({
  trabajadoresRegistradosContext,
}) {
  const [headerData, setHeaderData] = useState({
    fecha: "",
    turno: "",
    supervisor: "",
    op_destileria: "",
    op_caldera: "",
    op_aguas: "",
    aux_caldera: "",
    analista1: "",
    analista2: "",
  });

  const [notes, setNotes] = useState({
    PENDIENTES: [],
    NOVEDADES: [],
    DESGLOSE: [],
    REGISTROS: [],
  });

  const [openDiccionario, setOpenDiccionario] =
    useState(false);

  const [selectedUnidad, setSelectedUnidad] =
    useState(null);

  const [exportando, setExportando] =
    useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "warning",
  });

  const clearFieldsExceptFechaTurno = () => {
    setHeaderData((prev) => ({
      ...prev,
      supervisor: "",
      op_destileria: "",
      op_caldera: "",
      op_aguas: "",
      aux_caldera: "",
      analista1: "",
      analista2: "",
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const toggleDiccionario = (open) => () => {
    setOpenDiccionario(open);
  };

  const handleHeaderChange = (field, value) => {
    setHeaderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addNote = (section, noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      createdAt: new Date().toLocaleString(),
      consumo: "",
    };

    setNotes((prev) => ({
      ...prev,

      [section]: [
        ...prev[section],
        newNote,
      ],
    }));
  };

  const handleOpenModal = (unidad) => {
    setSelectedUnidad(unidad);
  };

  const handleCloseModal = () => {
    setSelectedUnidad(null);
  };

  /*
   * Consulta de totalizadores del día anterior.
   */
  const consultarResumenDiaAnterior = async () => {
    const fechaAnterior = obtenerDiaAnterior(
      headerData.fecha
    );

    if (!fechaAnterior) {
      throw new Error(
        "No fue posible calcular la fecha anterior."
      );
    }

    try {
      const response = await axios.get(
        `${TOTALIZADORES_API_URL}/bitacora/resumen-diario/${fechaAnterior}`,
        {
          withCredentials: true,

          headers: {
            Accept: "application/json",
          },
        }
      );

      return (
        response.data?.data || {
          fecha: fechaAnterior,
          sinDatos: true,
          mensaje:
            "La consulta no devolvió información de totalizadores.",
          turnos: [],
          totals: {},
        }
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        return {
          fecha: fechaAnterior,
          sinDatos: true,

          mensaje:
            error?.response?.data?.message ||
            "No se encontraron movimientos de totalizadores para el día anterior.",

          modalidadTurno: null,
          cantidadTurnos: 0,
          turnos: [],
          totals: {},
        };
      }

      throw error;
    }
  };

  /*
   * Consulta de ingresos de carbón y madera
   * registrados durante el día anterior.
   */
  const consultarIngresosCombustiblesDiaAnterior =
    async () => {
      const fechaAnterior = obtenerDiaAnterior(
        headerData.fecha
      );

      if (!fechaAnterior) {
        throw new Error(
          "No fue posible calcular la fecha anterior para consultar los ingresos de combustibles."
        );
      }

      try {
        const response = await axios.get(
          `${INGRESOS_COMBUSTIBLES_BITACORA_API_URL}/${fechaAnterior}`,
          {
            withCredentials: true,

            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = response.data?.data;

        if (!data) {
          return crearResumenIngresosVacio(
            fechaAnterior,
            "La consulta no devolvió información de ingresos de combustibles."
          );
        }

        return {
          ...data,

          exists:
            response.data?.exists === true,

          sinDatos:
            response.data?.exists !== true,

          mensaje:
            response.data?.message ||
            "Consulta de ingresos de combustibles realizada correctamente.",
        };
      } catch (error) {
        if (error?.response?.status === 404) {
          return crearResumenIngresosVacio(
            fechaAnterior,

            error?.response?.data?.message ||
              "No se encontraron ingresos de combustibles para el día anterior."
          );
        }

        throw error;
      }
    };

  /*
   * Consulta de consumos, ajustes, paladas y tolvas
   * correspondientes al día anterior.
   */
  const consultarConsumosCombustiblesDiaAnterior =
    async () => {
      const fechaAnterior = obtenerDiaAnterior(
        headerData.fecha
      );

      if (!fechaAnterior) {
        throw new Error(
          "No fue posible calcular la fecha anterior para consultar los consumos de combustibles."
        );
      }

      try {
        const response = await axios.get(
          `${CONSUMOS_COMBUSTIBLES_BITACORA_API_URL}/${fechaAnterior}`,
          {
            withCredentials: true,

            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = response.data?.data;

        if (!data) {
          return crearResumenConsumosVacio(
            fechaAnterior,
            "La consulta no devolvió información de consumos de combustibles."
          );
        }

        return {
          ...data,

          exists:
            response.data?.exists === true,

          sinDatos:
            response.data?.exists !== true,

          mensaje:
            response.data?.message ||
            "Consulta de consumos de combustibles realizada correctamente.",
        };
      } catch (error) {
        /*
         * Aunque el endpoint responda 404,
         * el PDF seguirá generándose y mostrará
         * que no hubo consumos registrados.
         */
        if (error?.response?.status === 404) {
          return crearResumenConsumosVacio(
            fechaAnterior,

            error?.response?.data?.message ||
              "No se encontraron consumos de combustibles para el día anterior."
          );
        }

        throw error;
      }
    };

  const handleExportar = async () => {
    if (!headerData.fecha || !headerData.turno) {
      setSnackbar({
        open: true,

        message:
          "Por favor seleccione la fecha y el turno antes de descargar la bitácora.",

        severity: "warning",
      });

      return;
    }

    if (exportando) return;

    try {
      setExportando(true);

      let resumenTotalizadores = null;
      let resumenIngresosCombustibles = null;
      let resumenConsumosCombustibles = null;

      /*
       * Turno 1: 06:00 a 14:00
       * Turno 4: 06:00 a 18:00
       *
       * Estos turnos generan el cierre consolidado
       * correspondiente al día inmediatamente anterior.
       */
      if (
        debeConsultarDiaAnterior(
          headerData.turno
        )
      ) {
        [
          resumenTotalizadores,
          resumenIngresosCombustibles,
          resumenConsumosCombustibles,
        ] = await Promise.all([
          consultarResumenDiaAnterior(),
          consultarIngresosCombustiblesDiaAnterior(),
          consultarConsumosCombustiblesDiaAnterior(),
        ]);
      }

      console.log(
        "Resumen totalizadores:",
        resumenTotalizadores
      );

      console.log(
        "Resumen ingresos combustibles:",
        resumenIngresosCombustibles
      );

      console.log(
        "Resumen consumos combustibles:",
        resumenConsumosCombustibles
      );

      /*
       * El generador recibe ahora:
       *
       * 1. Encabezado
       * 2. Notas
       * 3. Totalizadores
       * 4. Ingresos
       * 5. Consumos
       */
      await exportarBitacoraPDF(
        headerData,
        notes,
        resumenTotalizadores,
        resumenIngresosCombustibles,
        resumenConsumosCombustibles
      );

      const totalIngresos = Number(
        resumenIngresosCombustibles
          ?.resumen?.total?.toneladas || 0
      );

      const totalViajes = Number(
        resumenIngresosCombustibles
          ?.resumen?.total?.viajes || 0
      );

      const totalConsumo = Number(
        resumenConsumosCombustibles
          ?.resumen?.total?.consumoTon || 0
      );

      const totalAjustes = Number(
        resumenConsumosCombustibles
          ?.resumen?.total?.ajusteTon || 0
      );

      let mensaje =
        "Bitácora generada correctamente.";

      let severity = "success";

      if (
        resumenTotalizadores ||
        resumenIngresosCombustibles ||
        resumenConsumosCombustibles
      ) {
        const mensajes = [];

        if (resumenTotalizadores?.sinDatos) {
          mensajes.push(
            "sin datos de totalizadores"
          );
        } else if (resumenTotalizadores) {
          mensajes.push(
            "con balance de totalizadores"
          );
        }

        if (resumenIngresosCombustibles) {
          if (
            totalIngresos > 0 ||
            totalViajes > 0
          ) {
            mensajes.push(
              `con ${totalViajes} ingreso(s) de combustibles por ${totalIngresos.toLocaleString(
                "es-CO",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }
              )} t`
            );
          } else {
            mensajes.push(
              "sin ingresos de combustibles en el día anterior"
            );
          }
        }

        if (resumenConsumosCombustibles) {
          if (
            totalConsumo !== 0 ||
            totalAjustes !== 0
          ) {
            mensajes.push(
              `con consumo de ${totalConsumo.toLocaleString(
                "es-CO",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }
              )} t`
            );
          } else {
            mensajes.push(
              "sin consumos de combustibles en el día anterior"
            );
          }
        }

        mensaje = `Bitácora generada ${mensajes.join(
          " y "
        )}.`;

        if (
          resumenTotalizadores?.sinDatos ||
          resumenIngresosCombustibles?.sinDatos ||
          resumenConsumosCombustibles?.sinDatos
        ) {
          severity = "warning";
        }
      }

      setSnackbar({
        open: true,
        message: mensaje,
        severity,
      });
    } catch (error) {
      console.error(
        "Error generando la bitácora:",
        error
      );

      setSnackbar({
        open: true,

        message:
          error?.response?.data?.message ||
          error?.message ||
          "No fue posible generar la bitácora.",

        severity: "error",
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <Box
      sx={{
        width: "99%",
        py: 3,
        minHeight: "95vh",
        marginRight: "10px",
        marginLeft: "10px",
      }}
    >
      <img
        src="/ambiocom.png"
        alt="Logo"
        style={{
          position: "absolute",
          top: "80px",
          left: "1%",
          width: 250,
          height: 60,
        }}
      />

      {/* Exportar bitácora */}
      <Tooltip
        title={
          exportando
            ? "Generando informe..."
            : debeConsultarDiaAnterior(
                  headerData.turno
                )
              ? "Generar bitácora con balance del día anterior"
              : "Generar bitácora"
        }
      >
        <span>
          <IconButton
            color="secondary"
            size="small"
            onClick={handleExportar}
            disabled={exportando}
            disableRipple
            disableFocusRipple
            sx={{
              position: "absolute",
              mt: 6,
              right: 80,
              outline: "none",
              boxShadow: "none",
              backgroundColor:
                "transparent",

              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },

              "&:hover": {
                backgroundColor:
                  "transparent",
              },
            }}
          >
            {exportando ? (
              <CircularProgress size={32} />
            ) : (
              <img
                src={
                  BiderectionalCloudIcon
                }
                alt="cloudanddownloadicon"
                style={{
                  width: 35,
                  height: 35,
                }}
              />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {/* Botón Diccionario */}
      <Tooltip title="Diccionario">
        <IconButton
          color="secondary"
          size="small"
          onClick={toggleDiccionario(true)}
          disableRipple
          disableFocusRipple
          sx={{
            position: "absolute",
            mt: 6,
            right: 30,
            outline: "none",
            boxShadow: "none",
            backgroundColor:
              "transparent",

            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },

            "&:hover": {
              backgroundColor:
                "transparent",
            },
          }}
        >
          <img
            src={DictionaryIcon}
            alt="DictionaryIcon"
            style={{
              width: 35,
              height: 35,
            }}
          />
        </IconButton>
      </Tooltip>

      <Typography
        variant="h4"
        gutterBottom
        sx={{
          pl: 2,
          mt: 6,
          textAlign: "center",
        }}
      >
        Bitácora de Turnos Diarios Supervisores
      </Typography>

      <HeaderForm
        data={headerData}
        onChange={handleHeaderChange}
        clearFieldsExceptFechaTurno={
          clearFieldsExceptFechaTurno
        }
        trabajadoresRegistradosContext={
          trabajadoresRegistradosContext
        }
      />

      <NoteBoard
        notes={notes}
        setNotes={setNotes}
        onAddNote={addNote}
        supervisor={headerData.supervisor}
        turno={headerData.turno}
        fecha={headerData.fecha}
      />

      {/* Drawer Diccionario */}
      <Drawer
        anchor="right"
        open={openDiccionario}
        onClose={() =>
          setOpenDiccionario(false)
        }
      >
        <Box
          sx={{
            width: 200,
            position: "relative",
          }}
        >
          <IconButton
            onClick={() =>
              setOpenDiccionario(false)
            }
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
            aria-label="Cerrar diccionario"
          >
            <CloseIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ p: 2 }}
          >
            Diccionario 📓
          </Typography>

          <List>
            {Object.keys(
              DiccionarioUnidadDefault
            ).map((unidad) => (
              <ListItem
                key={unidad}
                disablePadding
              >
                <ListItemButton
                  onClick={() =>
                    handleOpenModal(
                      unidad
                    )
                  }
                >
                  <ListItemText
                    primary={unidad}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Modal Diccionario */}
      <Dialog
        open={!!selectedUnidad}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            m: "auto",
          },
        }}
      >
        <DialogTitle>
          {selectedUnidad}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            overflowY: "auto",
            maxHeight: "60vh",
            whiteSpace: "pre-line",
          }}
        >
          <Typography>
            {
              DiccionarioUnidadDefault[
                selectedUnidad
              ]
            }
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseModal}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BitacoraComponentProduccion;
