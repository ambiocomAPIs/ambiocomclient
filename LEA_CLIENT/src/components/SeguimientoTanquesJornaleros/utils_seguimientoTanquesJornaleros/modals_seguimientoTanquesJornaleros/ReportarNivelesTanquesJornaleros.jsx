import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  Divider,
} from "@mui/material";
import Swal from "sweetalert2";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ModalClonarDia from "./ModalClonarDia";

import useNetworkStatus from "../../../../Hooks/NetworkStatus/useNetworkStatus"    // verificador de conexion a red

const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80vw",
  maxWidth: "1200px",
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  display: "flex",
  flexDirection: "column",
};


// configuracion swal para que se muestre sobre el modal
const swalTop = (options) =>
  Swal.fire({
    ...options,
    didOpen: () => {
      const el = document.querySelector(".swal2-container");
      if (el) el.style.zIndex = "20000";
    },
  });

const ReportarNivelesTanquesJornaleros = ({ open, onClose }) => {
  const [loadingButton, setLoadingButton] = React.useState(false);
  const LOCAL_STORAGE_KEY = "nivelesTanquesJornalerosDraft";

  const [tanquesData, setTanquesData] = useState([]);
  const [inputs, setInputs] = useState({});
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fecha, setFecha] = useState("");
  const [usuario, setUsuario] = useState(null);

  const [ordenAsc, setOrdenAsc] = useState(true); // A-Z por defecto

  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoFecha, setCargandoFecha] = useState(false);

  const [openModalClonar, setOpenModalClonar] = useState(false);
  const [loadingClonar, setLoadingClonar] = useState(false);

  // ===================== Verificador de Redes ===========================
  const {
    isConnected,
    isBrowserOnline,
    isBackendReachable,
    isChecking,
  } = useNetworkStatus({
    checkUrl: "https://ambiocomserver.onrender.com/api/health",
    interval: 30000,
    timeout: 5000,
    checkBackend: true,
  });
  //==========================================================================

  // Recuperar datos de usuario de sesión
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

  // Guardar borrador en localStorage
  useEffect(() => {
    const hayDatos =
      Object.keys(inputs).length > 0 || responsable || observaciones || fecha;
    if (hayDatos) {
      const draftData = { inputs, responsable, observaciones, fecha };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
    }
  }, [inputs, responsable, observaciones, fecha]);

  // Recuperar borrador al abrir modal
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draft) {
        try {
          const data = JSON.parse(draft);
          setInputs(data.inputs || {});
          setResponsable(data.responsable || "");
          setObservaciones(data.observaciones || "");
          setFecha(data.fecha || "");
        } catch (e) {
          console.error("Error al recuperar borrador:", e);
        }
      }
    }
  }, [open]);

  // Traer datos de tanques
  useEffect(() => {
    axios
      .get("https://ambiocomserver.onrender.com/api/tanques")
      .then((res) => setTanquesData(res.data))
      .catch((err) => console.error("Error al obtener tanques:", err));
  }, []);


  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeFecha = async (e) => {
    const fechaSeleccionada = e.target.value;
    setFecha(fechaSeleccionada);
    setLoadingButton(false);
    setCargandoFecha(true);

    try {
      const res = await axios.get(
        `https://ambiocomserver.onrender.com/api/tanquesjornaleros/porfecha/${fechaSeleccionada}`
      );

      if (res.data?.length > 0) {
        const data = {};
        res.data.forEach((r) => {
          data[r.NombreTanque] = r.NivelTanque;
        });

        setInputs(data);
        setResponsable(res.data[0]?.Responsable || "");
        setObservaciones(res.data[0]?.Observaciones || "");
        setModoEdicion(true);

        Swal.fire("Info", "Ya existe un reporte para esta fecha. Puedes editarlo.", "info");
      } else {
        setModoEdicion(false);
        setInputs({});
        setResponsable("");
        setObservaciones("");
      }
    } catch (err) {
      console.error("Error buscando datos por fecha:", err);
      setModoEdicion(false);
    } finally {
      setCargandoFecha(false);
    }
  };

  const handleClonarDia = async (fechaOrigen, fechaDestino) => {
    if (!isConnected) {
      Swal.fire("Sin conexión", "No hay conexión a internet o al servidor.", "warning");
      return;
    }

    if (fechaOrigen === fechaDestino) {
      Swal.fire("Error", "La fecha origen y destino no pueden ser iguales.", "error");
      return;
    }

    setLoadingClonar(true);

    try {
      // 1. Buscar registros del día origen
      const resOrigen = await axios.get(
        `https://ambiocomserver.onrender.com/api/tanquesjornaleros/porfecha/${fechaOrigen}`
      );

      if (!resOrigen.data || resOrigen.data.length === 0) {
        Swal.fire("Sin datos", "No existe información en la fecha origen seleccionada.", "info");
        return;
      }

      // 2. Verificar si ya existe información en la fecha destino
      const resDestino = await axios.get(
        `https://ambiocomserver.onrender.com/api/tanquesjornaleros/porfecha/${fechaDestino}`
      );

      if (resDestino.data && resDestino.data.length > 0) {
        Swal.fire(
          "Error",
          "Ya existen registros en la fecha destino. No se puede clonar sobre una fecha ocupada.",
          "error"
        );
        return;
      }

      // 3. Construir payload copiando datos del origen, pero con nueva fecha
      const payload = resOrigen.data.map((item) => ({
        NombreTanque: item.NombreTanque,
        NivelTanque: Number(item.NivelTanque || 0),
        Responsable: item.Responsable || "",
        Observaciones: item.Observaciones || "",
        Factor: item.Factor,
        Disposicion: item.Disposicion,
        FechaRegistro: fechaDestino,
      }));

      // 4. Guardar clon
      await axios.post(
        "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros",
        payload
      );

      setOpenModalClonar(false);
      swalTop({
        title: "Éxito",
        text: "El día fue clonado correctamente.",
        icon: "success",
      });
      // Opcional: cargar en pantalla la fecha clonada
      setFecha(fechaDestino);

      const data = {};
      payload.forEach((r) => {
        data[r.NombreTanque] = r.NivelTanque;
      });

      setInputs(data);
      setResponsable(payload[0]?.Responsable || "");
      setObservaciones(payload[0]?.Observaciones || "");
      setModoEdicion(true);
    } catch (err) {
      // console.error("Error al clonar día:", err);
      swalTop({
        title: "Error",
        text: "No se pudo clonar el registro.",
        icon: "error",
      });

    } finally {
      setLoadingClonar(false);
    }
  };

  const handleSubmit = async () => {
    // valida uq eno se ejecute si no se selecciona fecha
    if (!fecha) {
      Swal.fire("Error", "Debe seleccionar una fecha antes de reportar.", "error");
      return;
    }
    // no se va guardar si no hay internet
    if (!isConnected) {
      Swal.fire("Sin conexión", "No hay conexión a internet o al servidor.", "warning");
      return;
    }
    setLoadingButton(true);

    try {
      const payload = listaParaMostrar.map((tanque) => ({
        NombreTanque: tanque.NombreTanque,
        NivelTanque: Number(inputs[tanque.NombreTanque] || 0),
        Responsable: responsable,
        Observaciones: observaciones,
        Factor: tanque.Factor,
        Disposicion: tanque.Disposicion,
        FechaRegistro: fecha,
      }));

      if (modoEdicion) {
        await axios.put(
          "https://ambiocomserver.onrender.com/api/tanquesjornaleros/actualizarporfecha",
          payload
        );
        Swal.fire("Actualizado", "Reporte actualizado correctamente.", "success");
      } else {
        await axios.post(
          "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros",
          payload
        );
        Swal.fire("Éxito", "Reporte guardado correctamente.", "success");
      }

      localStorage.removeItem(LOCAL_STORAGE_KEY);
      onClose();
    } catch (err) {
      console.error("Error guardando reporte:", err);
      Swal.fire("Error", "No se pudo guardar el reporte.", "error");
    } finally {
      setLoadingButton(false);
    }
  };

  const handleEliminarPorFecha = async () => {
    if (!fecha) {
      Swal.fire(
        "Error",
        "Debe seleccionar una fecha para eliminar registros.",
        "error"
      );
      return;
    }
    onClose();
    const confirm = await Swal.fire({
      title: "¿Eliminar registros?",
      text: `Se eliminarán los registros del ${fecha}. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          "https://ambiocomserver.onrender.com/api/tanquesjornaleros/eliminarporfecha",
          { data: { FechaRegistro: fecha } } // 👈 enviar fecha en el body
        );
        Swal.fire("Eliminado", "Los registros fueron eliminados.", "success");
      } catch (err) {
        console.error("Error al eliminar registros:", err);
        Swal.fire("Error", "No se pudo eliminar el registro.", "error");
      }
    }
  };

  // ===== ORDEN BASE A-Z (siempre) + de-duplicado =====
  const tanquesOrdenadosAZ = useMemo(() => {
    const unicos = Array.from(
      new Map(
        tanquesData
          .filter(
            (t) => t?.NombreTanque && String(t.NombreTanque).trim() !== ""
          )
          .map((t) => [String(t.NombreTanque).trim(), t])
      ).values()
    );

    // Orden natural A-Z (ignora mayúsculas/acentos y respeta números en el nombre)
    return unicos.sort((a, b) =>
      String(a.NombreTanque).localeCompare(String(b.NombreTanque), "es", {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [tanquesData]);

  // Lista final según toggle (A-Z por defecto; Z-A si se invierte)
  const listaParaMostrar = ordenAsc
    ? tanquesOrdenadosAZ
    : [...tanquesOrdenadosAZ].reverse();

  return (
    <>

      <Modal open={open} onClose={onClose}>
        <Box sx={styleModal}>
          {/* Header con botón ordenar */}
          <Box
            sx={{
              px: 3,
              pt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              textAlign="center"
              fontWeight="bold"
              color="primary"
            >
              Reporte de Niveles de Tanques
            </Typography>

            <Tooltip title={ordenAsc ? "Ordenar Z-A" : "Ordenar A-Z"}>
              <IconButton color="primary" onClick={() => setOrdenAsc(!ordenAsc)}>
                <SortByAlphaIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Contenido scrollable */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 3, pb: 2 }}>
            {!fecha && (
              <Typography color="error" sx={{ mb: 2 }}>
                ⚠️ Debes seleccionar una fecha para habilitar el formulario
              </Typography>
            )}

            {!isConnected && (
              <Typography color="error" sx={{ mb: 2 }}>
                ⚠️ Sin conexión. No puedes guardar el reporte en este momento.
              </Typography>
            )}

            {listaParaMostrar.length === 0 ? (
              <Typography color="text.secondary">
                No hay datos de tanques disponibles.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: "1px" }}>
                {listaParaMostrar.map((tanque) => (
                  <Grid item xs={12} sm={6} md={4} key={tanque.NombreTanque}>
                    <TextField
                      label={"Tanque " + tanque.NombreTanque}
                      type="number"
                      fullWidth
                      size="small"
                      value={inputs[tanque.NombreTanque] || ""}
                      onChange={(e) =>
                        handleInputChange(tanque.NombreTanque, e.target.value)
                      }
                      disabled={!fecha}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Responsable"
                  fullWidth
                  size="small"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  disabled={!fecha}
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                <TextField
                  label="Observaciones"
                  fullWidth
                  size="small"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  disabled={!fecha}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer fijo */}
          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              bgcolor: "grey.50",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px",
            }}
          >
            <Button variant="outlined" color="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <input
                type="date"
                value={fecha}
                onChange={handleChangeFecha}
                max={new Date().toLocaleDateString("en-CA")}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  color: "#333",
                }}
              />
              {cargandoFecha && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}

              <Button
                variant="outlined"
                color="primary"
                onClick={() => setOpenModalClonar(true)}
                startIcon={<ContentCopyIcon />}
              >
                Clonar día
              </Button>
              <Button
                variant="contained"
                disabled={loadingButton || !fecha || !isConnected}
                color={modoEdicion ? "warning" : "primary"}
                onClick={handleSubmit}
                endIcon={loadingButton ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {modoEdicion ? "Actualizar" : "Reportar"}
              </Button>


              <Tooltip title="Eliminar Registro" enterDelay={100}>
                <span>
                  <IconButton
                    color="error"
                    onClick={handleEliminarPorFecha}
                    disabled={!["developer", "gerente"].includes(usuario?.rol)}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Modal>
      <ModalClonarDia
        open={openModalClonar}
        onClose={() => setOpenModalClonar(false)}
        onConfirm={handleClonarDia}
        loading={loadingClonar}
      />
    </>

  );
};

export default ReportarNivelesTanquesJornaleros;
