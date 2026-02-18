import { useMemo, useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Divider,
  Stack,
  IconButton,
  Button,
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from "@mui/material";
import { Tooltip } from "@mui/material";
import Swal from "sweetalert2";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { useNivelesDiariosTanques } from "../../utils/Context/NivelesDiariosTanquesContext";

import { exportarInformeAlcoholesPDF } from "./utils_Informes/GenerarPdfInformeAlcoholes";
// Modals imported
import ModalInformesHistoricos from "./utils_Informes/ModalInformesHistoricos";

const STORAGE_KEY = "informe_alcoholes_snapshot";
const PASSWORD_ADMIN = "ambiocomadmin"

const InformeAlcoholes = () => {
  const { nivelesTanques, nivelesTanquesLoading } = useNivelesDiariosTanques();

  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [tanqueArrastrado, setTanqueArrastrado] = useState(null);

  const [zonas, setZonas] = useState([
    { id: "zona1", nombre: "Alcohol Extra Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
    { id: "zona2", nombre: "Alcohol Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
    { id: "zona3", nombre: "Alcohol Industrial", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
    { id: "zona4", nombre: "Alcohol Tafias", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
  ]);

  const [zonaEditando, setZonaEditando] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");
  // Bodegas
  const [modalBodegaOpen, setModalBodegaOpen] = useState(false);
  const [bodegas, setBodegas] = useState([]);
  const [bodegaData, setBodegaData] = useState({
    nombre: "",
    origen: "",
    litros: "",
  });
  // Modal crear Mezcla
  const [modalMezclaOpen, setModalMezclaOpen] = useState(false);
  const [tanqueMezcla, setTanqueMezcla] = useState(null);
  const [componentes, setComponentes] = useState([
    { zonaId: "", porcentaje: 0 },
  ]);

  const [sapEditando, setSapEditando] = useState(null);
  const [sapEditado, setSapEditado] = useState("");
  const [comentarioEditando, setComentarioEditando] = useState(null);
  const [comentarioTemp, setComentarioTemp] = useState("");
  const [openHistoricos, setOpenHistoricos] = useState(false);
  const [volumenEditableId, setVolumenEditableId] = useState(null);
  const [volumenEditableValor, setVolumenEditableValor] = useState("");

  const listaTanquesRef = useRef(null);
  const listaZonasRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setFechaSeleccionada(parsed.fechaSeleccionada ?? "");
        setZonas(parsed.zonas ?? [
          { id: "zona1", nombre: "Alcohol Extra Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
          { id: "zona2", nombre: "Alcohol Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
          { id: "zona3", nombre: "Alcohol Industrial", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
          { id: "zona4", nombre: "Alcohol Tafias", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
        ]);

        setBodegas(parsed.bodegas ?? []);
      } catch (e) {
        console.error("Error leyendo localStorage", e);
      }
    }

    setHydrated(true); // 👈 importante
  }, []);

  useEffect(() => {
    if (!hydrated) return; // no guardar hasta que se cargue el snapshot

    const snapshot = {
      fechaSeleccionada,
      zonas,
      bodegas,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [fechaSeleccionada, zonas, bodegas, hydrated]);

  // Limpiar datos
  const limpiarDatos = () => {

    if (!window.confirm("⚠️ Esto borrará todos los datos del informe. ¿Deseas continuar?")) {
      return;
    }
    localStorage.removeItem("informe_alcoholes_snapshot");

    setFechaSeleccionada("");
    setTanqueArrastrado(null);
    setZonas([
      { id: "zona1", nombre: "Alcohol Extra Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
      { id: "zona2", nombre: "Alcohol Neutro", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
      { id: "zona3", nombre: "Alcohol Industrial", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
      { id: "zona4", nombre: "Alcohol Tafias", tanques: [], costoLitro: 0, volumenSAP: 0, comentario: "" },
    ]);
    setBodegas([]);
  };

  const encontrarZonaDeTanque = (tanqueId) => {
    for (const zona of zonas) {
      if (zona.tanques.some((t) => t._id === tanqueId)) {
        return zona.nombre;
      }
    }
    return null;
  };

  const tanquesDisponibles = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const tanquesDelDia = nivelesTanques.filter((t) => t.FechaRegistro === fechaSeleccionada);
    const asignadosIds = zonas.flatMap((z) => z.tanques.map((t) => t._id));
    return tanquesDelDia.filter((t) => !asignadosIds.includes(t._id));
  }, [nivelesTanques, fechaSeleccionada, zonas]);

  // en este memo esta tomando lo que generamos arriba y le agregamos las bodegas nuevas
  const itemsDisponibles = useMemo(() => {
    return [...tanquesDisponibles, ...bodegas];
  }, [tanquesDisponibles, bodegas]);


  const volumenTotalDia = useMemo(() => {
    return tanquesDisponibles.reduce((acc, t) => {
      const nivel = Number(t.NivelTanque) || 0;
      const factor = Number(t.Factor) || 0;
      return acc + nivel * factor;
    }, 0);
  }, [tanquesDisponibles]);

  if (nivelesTanquesLoading) {
    return <Typography>⏳ Cargando datos...</Typography>;
  }

  const agregarZona = () => {
    const nuevoId = `zona de disposición${zonas.length + 1}`;
    const nuevoNombre = `Nueva Disposición ${zonas.length + 1}`;
    setZonas((prev) => [...prev, { id: nuevoId, nombre: nuevoNombre, tanques: [], costoLitro: 0 }]);
  };

  const guardarNombreZona = (id) => {
    setZonas((prev) =>
      prev.map((z) =>
        z.id === id ? { ...z, nombre: nombreEditado.trim() || z.nombre } : z
      )
    );
    setZonaEditando(null);
    setNombreEditado("");
  };

  const guardarComentarioZona = (zonaId) => {
    if (!comentarioTemp.trim()) {
      alert("El comentario no puede estar vacío");
      return;
    }

    setZonas(prev =>
      prev.map(z =>
        z.id === zonaId
          ? { ...z, comentario: comentarioTemp.trim() }
          : z
      )
    );

    setComentarioEditando(null);
    setComentarioTemp("");
  };

  const guardarVolumenSAP = (id) => {
    setZonas((prev) =>
      prev.map((z) =>
        z.id === id
          ? { ...z, volumenSAP: Number(sapEditado) || 0 }
          : z
      )
    );
    setSapEditando(null);
    setSapEditado("");
  };

  const eliminarZona = (zonaId) => {
    const zona = zonas.find(z => z.id === zonaId);

    if (!window.confirm(`⚠️ ¿Seguro que deseas eliminar la zona "${zona?.nombre}"?`)) {
      return;
    }

    setZonas(prev => prev.filter(z => z.id !== zonaId));
  };

  const quitarTanqueDeZona = (zonaId, tanqueId) => {
    setZonas((prev) =>
      prev.map((z) =>
        z.id === zonaId
          ? { ...z, tanques: z.tanques.filter((t) => t._id !== tanqueId) }
          : z
      )
    );
  };

  const handleAutoScroll = (e, containerRef) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scrollSpeed = 10;

    if (e.clientY < rect.top + 40) {
      container.scrollTop -= scrollSpeed;
    } else if (e.clientY > rect.bottom - 40) {
      container.scrollTop += scrollSpeed;
    }
  };

  const guardarMezcla = () => {
    const total = componentes.reduce((acc, c) => acc + c.porcentaje, 0);

    if (total !== 100) {
      alert("❌ El porcentaje total debe ser 100%");
      return;
    }

    setZonas(prev =>
      prev.map(zona => {
        const componente = componentes.find(c => c.zonaId === zona.id);
        if (!componente) return zona;

        const porcentaje = componente.porcentaje / 100;

        const nivelOriginal = Number(tanqueMezcla.NivelTanque) || 0;
        const factorOriginal = Number(tanqueMezcla.Factor) || 0;

        const nivelParcial = nivelOriginal * porcentaje;
        const factorParcial = factorOriginal * 1;
        // const volumenParcial = nivelParcial * factorOriginal;
        const volumenParcial = nivelParcial * factorParcial;


        const tanqueParcial = {
          ...tanqueMezcla,
          _id: `${tanqueMezcla._id}-${zona.id}`, // 🔑 único por zona
          mezcla: true,
          porcentaje: componente.porcentaje,
          NivelTanque: nivelParcial,
          Factor: factorParcial,
          VolumenCalculado: volumenParcial,
          zonaOrigen: zona.id,
        };

        return {
          ...zona,
          tanques: [...zona.tanques, tanqueParcial],
        };
      })
    );

    setModalMezclaOpen(false);
  };

  const guardarInformeEnBD = async () => {
    const { value: password } = await Swal.fire({
      title: "Confirmar acción",
      text: "¿Deseas guardar este informe en la base de datos?",
      input: "password",
      inputLabel: "Contraseña",
      inputPlaceholder: "Ingresa la contraseña",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!password) return; // cancelado

    if (password !== PASSWORD_ADMIN) {
      Swal.fire("Error", "Contraseña incorrecta", "error");
      return;
    }

    try {
      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await axios.post("https://ambiocomserver.onrender.com/api/informes-alcoholes", {
        fecha: fechaSeleccionada,
        zonas,
        bodegas,
      });

      Swal.fire("¡Listo!", "Informe guardado en la base de datos", "success");
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        "No se pudo guardar el informe en la base de datos";
      Swal.fire("Error", msg, "error");
    }
  };

  const pedirContraseñaYEditar = async (zona) => {
    const { value: password } = await Swal.fire({
      title: "Autorización requerida",
      input: "password",
      inputLabel: "Contraseña para editar volumen total",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4a70d7d0",
      reverseButtons: true,
    });

    if (!password) return;

    if (password !== PASSWORD_ADMIN) {
      Swal.fire("Error", "Contraseña incorrecta", "error");
      return;
    }
    // Si la contraseña es correcta, activa edición:
    setVolumenEditableId(zona.id);
    setVolumenEditableValor(zona.volumenEditable || volumenTotalZona); // Asumiendo que guardas el editable en zona.volumenEditable o usa el calculado
  };

  // Función para guardar volumen editable:
  const guardarVolumenEditable = (zonaId) => {
    setZonas((prev) =>
      prev.map((z) =>
        z.id === zonaId
          ? { ...z, volumenEditable: Number(volumenEditableValor) || 0 }
          : z
      )
    );
    setVolumenEditableId(null);
    setVolumenEditableValor("");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          mt: 6,
          gap: 2,
        }}
      >
        <TextField
          label="Fecha"
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            mb: 0, width: 200,
            '& .MuiInputBase-root': {
              height: 40,
            },
          }}
        />
        <Typography
          variant="h4"
          fontWeight={400}
          fontSize="1.9rem"
          display="flex"
          alignItems="center"
          gap={2}
          color="#525252"
        >
          Generación de Informe Diario de Alcoholes
        </Typography>
        {/* 📊 Generación de Informe Diario de Alcoholes */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="medium"
            onClick={() => {
              setModalMezclaOpen(true);
              setTanqueMezcla(null);
              setComponentes([{ zonaId: "", porcentaje: 0 }]);
            }} sx={{
              background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              borderRadius: 2,
              boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a0fbf 0%, #1f63d9 100%)",
                boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
                transform: "translateY(-1px)",
              },
            }}
          >
            🧪 Crear Mezcla
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={() => setModalBodegaOpen(true)}
            sx={{
              backgroundColor: "#7B2CBF", // morado sólido
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              borderRadius: 2,
              boxShadow: "0 4px 10px rgba(123, 44, 191, 0.35)",
              transition: "all 0.25s ease",
              "&:hover": {
                backgroundColor: "#5A189A", // morado más oscuro
                boxShadow: "0 6px 16px rgba(90, 24, 154, 0.45)",
                transform: "translateY(-1px)",
              },
            }}
          >
            🏭 Agregar Bodega
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={limpiarDatos}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              borderWidth: 2,
              "&:hover": {
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                borderWidth: 2,
              },
            }}
          >
            🧹 Limpiar datos
          </Button>
          {/* Boton guardar en la DB */}
          <Tooltip title="Historiar informe" arrow placement="top">
            <Button
              variant="contained"
              size="medium"
              onClick={guardarInformeEnBD}
              sx={{
                backgroundImage: "linear-gradient(45deg, #059669, #047857)",
                color: "#fff",
                fontWeight: 700,
                textTransform: "none",
                px: 2.5,
                borderRadius: 2,
                boxShadow: "0 4px 10px rgba(5, 150, 105, 0.35)",
                transition: "all 0.25s ease",
                "&:hover": {
                  backgroundImage: "linear-gradient(45deg, #047857, #059669)",
                  boxShadow: "0 6px 16px rgba(4, 120, 87, 0.45)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              💾 DB
            </Button>
          </Tooltip>
          {/* Boton consultar historico de informes */}
          <Tooltip title="Ver históricos" arrow>
            <Button
              variant="outlined"
              size="medium"
              onClick={async () => {
                const { value: password } = await Swal.fire({
                  title: "Acceso a históricos",
                  input: "password",
                  inputLabel: "Contraseña",
                  showCancelButton: true,
                  confirmButtonText: "Entrar",
                  cancelButtonText: "Cancelar",
                  confirmButtonColor: "#4a70d7d0",
                  reverseButtons: true,
                });

                if (!password) return;

                if (password !== PASSWORD_ADMIN) {
                  Swal.fire("Error", "Contraseña incorrecta", "error");
                  return;
                }

                setOpenHistoricos(true);
              }}
              sx={{
                backgroundImage: "linear-gradient(45deg, #3b9fcd, #1e72b8)",
                color: "#fff",
                fontWeight: 700,
                textTransform: "none",
                px: 2.5,
                borderRadius: 2,
                fontSize: "1.0rem",
                boxShadow: "0 4px 10px rgba(14,165,233,0.35)",
                "&:hover": {
                  backgroundImage: "linear-gradient(45deg, #1e72b8, #3b9fcd)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              📋
            </Button>
          </Tooltip>

          <Button
            variant="contained"
            size="medium"
            onClick={async () => {
              if (!fechaSeleccionada) {
                alert("Por favor selecciona una fecha antes de generar el informe.");
                return;
              }

              try {
                await exportarInformeAlcoholesPDF(fechaSeleccionada, zonas);
              } catch (error) {
                console.error("Error generando el PDF:", error);
                alert("Ocurrió un error al generar el PDF.");
              }
            }}
            sx={{
              backgroundImage: "linear-gradient(45deg, #1D4ED8, #1E40AF)",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              borderRadius: 2,
              boxShadow: "0 4px 10px rgba(29, 78, 216, 0.35)",
              transition: "all 0.25s ease",
              "&:hover": {
                backgroundImage: "linear-gradient(45deg, #1E40AF, #1D4ED8)",
                boxShadow: "0 6px 16px rgba(30, 64, 175, 0.45)",
                transform: "translateY(-1px)",
              },
            }}
          >
            📝 Generar Informe
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "70% 30%",
          gap: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Tanques del día
            </Typography>
            <Typography variant="subtitle1" color="primary" fontWeight={700}>
              <strong style={{ color: "darkgray", fontSize: 18 }}>
                Inventario total de alcoholes:
              </strong>{" "}
              {volumenTotalDia.toLocaleString("es-CO", {
                maximumFractionDigits: 2,
              })}{" "}
              <strong style={{ color: "black", fontSize: 15 }}> L</strong>
            </Typography>
          </Box>

          <Stack
            spacing={1}
            ref={listaTanquesRef}
            sx={{ maxHeight: 540, overflowY: "auto" }}
            onDragOver={(e) => handleAutoScroll(e, listaTanquesRef)}
          >
            {tanquesDisponibles.length === 0 ? (
              <Typography color="text.secondary">
                No hay datos para la fecha seleccionada o todos los tanques están asignados.
              </Typography>
            ) : (
              itemsDisponibles.map((tanque) => {
                const nivel = Number(tanque.NivelTanque) || 0;
                const factor = Number(tanque.Factor) || 0;
                const volumen = nivel * factor;

                return (
                  <Paper
                    key={tanque._id}
                    draggable
                    onDragStart={() => setTanqueArrastrado(tanque)}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "grid",
                      // gridTemplateColumns: "120px 1fr 1fr 1fr",
                      gridTemplateColumns: "minmax(160px, 1.3fr) 1fr 1fr 1fr",
                      alignItems: "center",
                      gap: 2,
                      cursor: "grab",
                      "&:active": { cursor: "grabbing" },
                    }}
                  >
                    <Typography fontWeight={700}>
                      {tanque.tipo === "bodega"
                        ? `ALM-${tanque.NombreTanque}`
                        : `TK-${tanque.NombreTanque}`}
                    </Typography>
                    <Typography>
                      {tanque.tipo === "bodega" ? (
                        <>
                          <strong>Origen:</strong> {tanque.Origen || "No definido"}
                        </>
                      ) : (
                        <>
                          <strong>Nivel:</strong> {nivel} m
                        </>
                      )}
                    </Typography>
                    <Typography>
                      <strong>Factor:</strong> {factor.toLocaleString("es-CO")} L/m
                    </Typography>
                    <Typography fontWeight={700} color="primary">
                      <strong style={{ color: "black" }}>Volumen:</strong>{" "}
                      {volumen.toLocaleString("es-CO", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      L
                    </Typography>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography fontWeight={400} fontSize="1.1rem" align="center">
              📦 Disposicion de Tanques y Alcoholes
            </Typography>
            <Button variant="outlined" size="small" onClick={agregarZona} sx={{
              padding: "2px 6px",
              fontSize: "0.7rem",
              minWidth: "auto",
              mr: 3
            }}>
              + Nueva Disposicion
            </Button>
          </Box>

          <Stack
            spacing={1}
            ref={listaZonasRef}
            sx={{ maxHeight: 540, overflowY: "auto" }}
            onDragOver={(e) => handleAutoScroll(e, listaZonasRef)}
          >
            {zonas.map((zona) => {
              const volumenTotalZona = zona.tanques.reduce((acc, t) => {
                const nivel = Number(t.NivelTanque) || 0;
                const factor = Number(t.Factor) || 0;
                return acc + nivel * factor;
              }, 0);

              // const costoTotalZona = volumenTotalZona * (Number(zona.costoLitro) || 0);
              const volumenParaCalculos = zona.volumenEditable ?? volumenTotalZona;
              const costoTotalZona = volumenParaCalculos * (Number(zona.costoLitro) || 0);
              const diferencia = volumenParaCalculos - (Number(zona.volumenSAP) || 0);

              return (
                <Paper
                  key={zona.id}
                  variant="outlined"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!tanqueArrastrado) return;

                    const zonaActual = encontrarZonaDeTanque(tanqueArrastrado._id);

                    if (zonaActual && zonaActual !== zona.nombre) {
                      alert(
                        `❌ El tanque TK-${tanqueArrastrado.NombreTanque} ya está asignado en la zona de disposicion"${zonaActual}"`
                      );
                      return;
                    }

                    setZonas((prev) =>
                      prev.map((z) =>
                        z.id === zona.id
                          ? {
                            ...z,
                            tanques: z.tanques.some((t) => t._id === tanqueArrastrado._id)
                              ? z.tanques
                              : [...z.tanques, tanqueArrastrado],
                          }
                          : z
                      )
                    );
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderColor: "primary.main",
                    cursor: "default",
                    position: "relative",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1, }}>
                    {zonaEditando === zona.id ? (
                      <>
                        <InputBase
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                          autoFocus
                          sx={{
                            borderBottom: "1px solid gray",
                            flexGrow: 1,
                            fontWeight: "bold",
                            fontSize: "1rem",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              guardarNombreZona(zona.id);
                            }
                            if (e.key === "Escape") {
                              setZonaEditando(null);
                            }
                          }}
                        />
                        <IconButton size="small" onClick={() => guardarNombreZona(zona.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setZonaEditando(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Typography
                          fontWeight={700}
                          sx={{ flexGrow: 1, cursor: "pointer" }}
                          onDoubleClick={() => {
                            setZonaEditando(zona.id);
                            setNombreEditado(zona.nombre);
                          }}
                        >
                          {zona.nombre}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setZonaEditando(zona.id);
                            setNombreEditado(zona.nombre);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>

                  <TextField
                    label="Costo por litro (COP/L)"
                    type="number"
                    size="small"
                    value={zona.costoLitro}
                    onChange={(e) =>
                      setZonas((prev) =>
                        prev.map((z) =>
                          z.id === zona.id
                            ? { ...z, costoLitro: Number(e.target.value) || 0 }
                            : z
                        )
                      )
                    }
                    sx={{ mb: 1.5, width: "100%" }}
                  />

                  <Stack spacing={0.5} sx={{ maxHeight: 300, overflowY: "auto" }}>
                    {zona.tanques.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Arrastra aquí los tanques
                      </Typography>
                    ) : (
                      zona.tanques.map((t) => (
                        <Paper
                          key={t._id}
                          variant="outlined"
                          sx={{
                            px: 1,
                            py: 0.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "default",
                          }}
                        >
                          <Typography fontWeight={700}>
                            TK-{t.NombreTanque}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => quitarTanqueDeZona(zona.id, t._id)}
                          >
                            X
                          </Button>
                        </Paper>
                      ))
                    )}
                  </Stack>

                  <Typography variant="subtitle2" fontWeight={700} color="primary" mt={1}>
                    Volumen total:{" "}
                    {volumenEditableId === zona.id ? (
                      <>
                        <InputBase
                          type="number"
                          value={volumenEditableValor}
                          onChange={(e) => setVolumenEditableValor(e.target.value)}
                          autoFocus
                          sx={{ borderBottom: "1px solid gray", fontWeight: "bold", fontSize: "0.9rem", width: 120 }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarVolumenEditable(zona.id);
                            if (e.key === "Escape") setVolumenEditableId(null);
                          }}
                        />
                        <IconButton size="small" onClick={() => guardarVolumenEditable(zona.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setVolumenEditableId(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <Typography
                        component="span"
                        sx={{ cursor: "pointer", fontWeight: "bold" }}
                        onDoubleClick={() => pedirContraseñaYEditar(zona)}
                      >
                        {(zona.volumenEditable ?? volumenTotalZona).toLocaleString("es-CO")} L
                      </Typography>
                    )}
                  </Typography>

                  {/* Volumen SAP editable */}
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 1 }}>
                      Volumen total SAP:
                    </Typography>

                    {sapEditando === zona.id ? (
                      <>
                        <InputBase
                          type="number"
                          value={sapEditado}
                          onChange={(e) => setSapEditado(e.target.value)}
                          autoFocus
                          sx={{
                            borderBottom: "1px solid gray",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            width: 120,
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarVolumenSAP(zona.id);
                            if (e.key === "Escape") setSapEditando(null);
                          }}
                        />
                        <IconButton size="small" onClick={() => guardarVolumenSAP(zona.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setSapEditando(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Typography
                          sx={{ fontWeight: 700, cursor: "pointer", mr: 1 }}
                          onDoubleClick={() => {
                            setSapEditando(zona.id);
                            setSapEditado(zona.volumenSAP || 0);
                          }}
                        >
                          {Number(zona.volumenSAP || 0).toLocaleString("es-CO")} L
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSapEditando(zona.id);
                            setSapEditado(zona.volumenSAP || 0);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>

                  {/* Diferencia */}
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      mt: 0.5,
                      color:
                        volumenTotalZona - (Number(zona.volumenSAP) || 0) === 0
                          ? "success.main"
                          : Math.abs(volumenTotalZona - (Number(zona.volumenSAP) || 0)) < 5
                            ? "warning.main"
                            : "error.main",
                    }}
                  >
                    Diferencia:{" "}
                    {diferencia.toLocaleString("es-CO", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    L
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={700} color="success.main">
                    Costo total:{" "}
                    ${costoTotalZona.toLocaleString("es-CO", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    COP
                  </Typography>
                  {/* 📝 Comentario por zona */}
                  <Box sx={{ mt: 1, mb: 3 }}>
                    {comentarioEditando === zona.id ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Escribe un comentario para esta zona..."
                          value={comentarioTemp}
                          autoFocus
                          onChange={(e) => setComentarioTemp(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarComentarioZona(zona.id);
                            if (e.key === "Escape") setComentarioEditando(null);
                          }}
                        />
                        <IconButton size="small" onClick={() => guardarComentarioZona(zona.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setComentarioEditando(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : zona.comentario ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontStyle: "italic", cursor: "pointer", flexGrow: 1 }}
                          onDoubleClick={() => {
                            setComentarioEditando(zona.id);
                            setComentarioTemp(zona.comentario);
                          }}
                        >
                          📝 {zona.comentario}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setComentarioEditando(zona.id);
                            setComentarioTemp(zona.comentario);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setComentarioEditando(zona.id);
                            setComentarioTemp("");
                          }}
                          sx={{ textTransform: "none" }}
                        >
                          ➕ Agregar comentario
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    color="error"
                    disabled={zona.tanques.length > 0}
                    onClick={() => eliminarZona(zona.id)}
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                    }}
                  >
                    🗑️
                  </IconButton>

                </Paper>
              );
            })}
          </Stack>
        </Paper>
      </Box>
      {/* // MODAL NUEVO DEPOSITO O BODEGA */}
      <Dialog
        open={modalBodegaOpen}
        onClose={() => setModalBodegaOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>🏭 Información de la Bodega</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre de la bodega"
              fullWidth
              value={bodegaData.nombre}
              onChange={(e) =>
                setBodegaData({ ...bodegaData, nombre: e.target.value })
              }
            />

            <TextField
              label="Origen"
              fullWidth
              value={bodegaData.origen}
              onChange={(e) =>
                setBodegaData({ ...bodegaData, origen: e.target.value })
              }
            />

            <TextField
              label="Cantidad (Litros)"
              type="number"
              fullWidth
              value={bodegaData.litros}
              onChange={(e) =>
                setBodegaData({ ...bodegaData, litros: e.target.value })
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setModalBodegaOpen(false);
              setBodegaData({ nombre: "", origen: "", litros: "" });
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const nuevaBodega = {
                _id: `bodega-${Date.now()}`,
                NombreTanque: bodegaData.nombre,
                Origen: bodegaData.origen,
                NivelTanque: Number(bodegaData.litros), // usamos litros directos
                Factor: 1, // para que volumen = litros
                tipo: "bodega",
              };
              setBodegas((prev) => [...prev, nuevaBodega]);
              setBodegaData({ nombre: "", origen: "", litros: "" });
              setModalBodegaOpen(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL CREAR MEZCLA */}
      <Dialog open={modalMezclaOpen} onClose={() => setModalMezclaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🧪 Crear Mezcla</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Tanque con mezcla"
              value={tanqueMezcla?._id || ""}
              onChange={(e) =>
                setTanqueMezcla(
                  tanquesDisponibles.find(t => t._id === e.target.value)
                )
              }
            >
              {tanquesDisponibles.map(t => (
                <MenuItem key={t._id} value={t._id}>
                  TK-{t.NombreTanque}
                </MenuItem>
              ))}
            </TextField>

            {/* Componentes */}
            {componentes.map((c, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField
                  select
                  label="Zona de Disposición"
                  value={c.zonaId}
                  onChange={(e) => {
                    const copy = [...componentes];
                    copy[i].zonaId = e.target.value;
                    setComponentes(copy);
                  }}
                  fullWidth
                >
                  {zonas.map(z => (
                    <MenuItem key={z.id} value={z.id}>{z.nombre}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="%"
                  type="number"
                  value={c.porcentaje}
                  onChange={(e) => {
                    const copy = [...componentes];
                    copy[i].porcentaje = Number(e.target.value);
                    setComponentes(copy);
                  }}
                  sx={{ width: 120 }}
                />
              </Stack>
            ))}

            {componentes.length < 3 && (
              <Button onClick={() =>
                setComponentes([...componentes, { zonaId: "", porcentaje: 0 }])
              }>
                + Agregar componente
              </Button>
            )}

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModalMezclaOpen(false)}>Cancelar</Button>

          <Button
            variant="contained"
            onClick={guardarMezcla}
          >
            Ejecutar Mezcla
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL PARA VER HISTORICO */}
      <ModalInformesHistoricos
        open={openHistoricos}
        onClose={() => setOpenHistoricos(false)}
        onSelectInforme={(inf) => {
          setFechaSeleccionada(inf.fecha);
          setZonas(inf.zonas);
          setBodegas(inf.bodegas || []);
        }}

      />
    </Box>
  );
};

export default InformeAlcoholes;
