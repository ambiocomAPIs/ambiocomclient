import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Grid,
  Collapse,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HistoryIcon from "@mui/icons-material/History";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TodayIcon from "@mui/icons-material/Today";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

import RiceItemModal from "./utils/RICE_Utils/Modal/RiceItemModal";
import RiceKanbanBoard from "./utils/RICE_Utils/Components/RiceKanbanBoard";
import RiceStatsCards from "./utils/RICE_Utils/Components/RiceStatsCards";
import RiceHistoryModal from "./utils/RICE_Utils/Modal/RiceHistoryModal";

const API_RICE_KANBAN = "https://ambiocomserver.onrender.com/api/ricekanban";

const swalConfig = {
  confirmButtonColor: "#0f5fa8",
  cancelButtonColor: "#6c757d",
};

const showToast = ({ icon = "success", title = "" }) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    customClass: {
      popup: "rice-swal-toast-popup",
      container: "rice-swal-toast-container",
    },
    didOpen: (toast) => {
      toast.style.marginTop = "70px";
      toast.style.borderRadius = "14px";
      toast.style.boxShadow = "0 12px 30px rgba(15, 95, 168, 0.18)";
    },
  });
};

const showError = (title, text) => {
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
    ...swalConfig,
  });
};

const showWarning = (title, text) => {
  Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "Entendido",
    ...swalConfig,
  });
};

const carriles = ["Carril 1 — Operativo", "Carril 2 — Nuevos Proyectos"];

const tiposActividad = [
  "Requerimiento",
  "Tarea",
  "Hallazgo",
  "Seguridad",
  "Soporte",
  "Mejora",
];

const areasSolicitantes = [
  "Gerencia Operaciones",
  "Gerencia General",
  "Gerencia Financiera",
  "Logística",
  "Mantenimiento",
  "Contabilidad",
  "Comercial",
  "Automatización",
  "Laboratorio",
  "Producción",
  "SIG",
];

const estados = [
  "Backlog",
  "En análisis",
  "Priorizado",
  "En sprint",
  "En ajuste",
  "Completado",
];

const sprints = [
  "",
  "Sprint 1 — Jun 2026",
  "Sprint 2 — Jul 2026",
  "Sprint 3 — Ago 2026",
  "Sprint 4 — Sep 2026",
];

const alcanceOptions = [
  { value: 1, label: "1", helper: "1 área impactada" },
  { value: 2, label: "2", helper: "2 áreas impactadas" },
  { value: 3, label: "3", helper: "Varias áreas" },
  { value: 4, label: "4", helper: "Toda la empresa" },
];

const impactoOptions = [
  { value: 0.25, label: "0.25", helper: "Mínimo" },
  { value: 0.5, label: "0.5", helper: "Bajo" },
  { value: 1, label: "1", helper: "Medio" },
  { value: 2, label: "2", helper: "Alto" },
  { value: 3, label: "3", helper: "Crítico" },
];

const confianzaOptions = [
  { value: 0.5, label: "50%", helper: "No validado" },
  { value: 0.7, label: "70%", helper: "Probable" },
  { value: 0.8, label: "80%", helper: "Alta probabilidad" },
  { value: 1, label: "100%", helper: "Confirmado" },
];

const esfuerzoOptions = [
  { value: 0.5, label: "0.5s", helper: "Bajo esfuerzo" },
  { value: 1, label: "1s", helper: "1 semana-persona" },
  { value: 2, label: "2s", helper: "2 semanas-persona" },
  { value: 3, label: "3s", helper: "3 semanas-persona" },
  { value: 5, label: "5s", helper: "Alto esfuerzo" },
  { value: 8, label: "8s", helper: "Muy alto esfuerzo" },
];

const emptyForm = {
  id: null,
  titulo: "",
  descripcion: "",
  tipoActividad: "Requerimiento",
  carril: "Carril 1 — Operativo",
  areaSolicitante: "Gerencia Operaciones",
  solicitadoPor: "",
  alcance: 1,
  impacto: 1,
  confianza: 0.7,
  esfuerzo: 1,
  estado: "Backlog",
  sprint: "",
  vetoGerencia: false,
  notasSeguimiento: "",
  historial: [],
};

const infoCards = [
  {
    title: "R — Alcance",
    description: "Número de áreas o procesos impactados directamente.",
    detail: "Escala: 1 = una área · 4 = toda la empresa",
    bgcolor: "#EAF4FF",
    borderColor: "#90CAF9",
    accentColor: "#1565C0",
  },
  {
    title: "I — Impacto",
    description: "Efecto en eficiencia, costo, calidad o riesgo.",
    detail: "0.25 mínimo · 0.5 bajo · 1 medio · 2 alto · 3 crítico",
    bgcolor: "#FFF4E5",
    borderColor: "#FFB74D",
    accentColor: "#EF6C00",
  },
  {
    title: "C — Confianza",
    description: "Certeza de que el impacto estimado es real.",
    detail: "50% no validado · 70% probable · 100% confirmado",
    bgcolor: "#EAF7EF",
    borderColor: "#81C784",
    accentColor: "#2E7D32",
  },
  {
    title: "E — Esfuerzo",
    description: "Semanas-persona estimadas. Va en el denominador.",
    detail: "A mayor esfuerzo, menor puntaje RICE",
    bgcolor: "#F3EAFE",
    borderColor: "#B39DDB",
    accentColor: "#6A1B9A",
  },
];

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function calculateRice(item) {
  if (item?.riceScore !== undefined && item?.riceScore !== null) {
    return Number(item.riceScore).toFixed(2);
  }

  const alcance = Number(item.alcance) || 0;
  const impacto = Number(item.impacto) || 0;
  const confianza = Number(item.confianza) || 0;
  const esfuerzo = Number(item.esfuerzo) || 1;

  return ((alcance * impacto * confianza) / esfuerzo).toFixed(2);
}

function normalizeApiItem(item) {
  return {
    ...item,
    id: item.id || item._id,
    historial: Array.isArray(item.historial) ? item.historial : [],
  };
}

function normalizeMonthlyItems(responseData) {
  const actualCreados = responseData?.actual?.creados || [];
  const actualMovidos = responseData?.actual?.movidos || [];
  const anteriorCreados = responseData?.anterior?.creados || [];
  const anteriorMovidos = responseData?.anterior?.movidos || [];

  const map = new Map();

  [
    ...actualCreados,
    ...actualMovidos,
    ...anteriorCreados,
    ...anteriorMovidos,
  ].forEach((item) => {
    const normalized = normalizeApiItem(item);
    map.set(normalized.id, normalized);
  });

  return [...map.values()];
}

function formatPeriodo(periodo) {
  if (!periodo?.year || !periodo?.month) return "";

  const date = new Date(Number(periodo.year), Number(periodo.month) - 1, 1);

  return date.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

function getEstadoColor(estado) {
  switch (estado) {
    case "Completado":
      return "success";
    case "En ajuste":
      return "error";
    case "En sprint":
      return "primary";
    case "Priorizado":
      return "warning";
    case "En análisis":
      return "secondary";
    default:
      return "default";
  }
}

function getCarrilColor(carril = "") {
  if (carril.includes("Carril 1")) return "success";
  if (carril.includes("Carril 2")) return "primary";
  return "default";
}

function getTipoActividadColor(tipo = "") {
  switch (tipo) {
    case "Requerimiento":
      return "primary";
    case "Tarea":
      return "success";
    case "Hallazgo":
      return "warning";
    case "Seguridad":
      return "error";
    case "Soporte":
      return "secondary";
    case "Mejora":
      return "info";
    default:
      return "default";
  }
}

export default function RiceBacklogManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [infoVisible, setInfoVisible] = useState(true);
  const [riceStatsVisible, setRiceStatsVisible] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [carrilFilter, setCarrilFilter] = useState("Todos");

  const [viewMode, setViewMode] = useState("list");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [monthFilter, setMonthFilter] = useState(getCurrentMonthValue());
  const [periodInfo, setPeriodInfo] = useState(null);

  const fetchRiceItemsByMonth = async (
    targetMonth = monthFilter,
    options = { silent: false }
  ) => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!targetMonth) {
        showWarning("Mes requerido", "Selecciona un mes para consultar.");
        return;
      }

      const [year, month] = targetMonth.split("-");

      const response = await axios.get(`${API_RICE_KANBAN}/monthly`, {
        params: {
          year,
          month,
        },
        withCredentials: true,
      });

      const data = normalizeMonthlyItems(response.data);

      setItems(data);

      setPeriodInfo({
        actual: response.data?.actual?.period,
        anterior: response.data?.anterior?.period,
        statsActual: response.data?.actual?.stats,
        statsAnterior: response.data?.anterior?.stats,
      });

      if (!options.silent) {
        showToast({
          icon: "success",
          title: "Consulta ejecutada correctamente",
        });
      }
    } catch (error) {
      console.error("Error consultando RICE por mes:", error);

      const message =
        error.response?.data?.message ||
        "No fue posible consultar los ítems RICE por mes.";

      setErrorMessage(message);
      showError("Error en la consulta", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiceItemsByMonth(getCurrentMonthValue(), { silent: true });
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return Number(calculateRice(b)) - Number(calculateRice(a));
    });
  }, [items]);

  const dashboardStats = useMemo(() => {
    const total = items.length;
    const backlog = items.filter((item) => item.estado === "Backlog").length;
    const enSprint = items.filter((item) => item.estado === "En sprint").length;
    const completados = items.filter(
      (item) => item.estado === "Completado"
    ).length;
    const vetoGerencia = items.filter((item) => item.vetoGerencia).length;

    const mayorRiceItem = [...items].sort(
      (a, b) => Number(calculateRice(b)) - Number(calculateRice(a))
    )[0];

    return {
      total,
      backlog,
      enSprint,
      completados,
      vetoGerencia,
      mayorRice: mayorRiceItem ? calculateRice(mayorRiceItem) : "0.00",
      mayorRiceTitulo: mayorRiceItem?.titulo || "Sin ítems",
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        item.titulo?.toLowerCase().includes(search) ||
        item.descripcion?.toLowerCase().includes(search) ||
        item.solicitadoPor?.toLowerCase().includes(search) ||
        item.areaSolicitante?.toLowerCase().includes(search) ||
        item.estado?.toLowerCase().includes(search) ||
        item.carril?.toLowerCase().includes(search) ||
        item.tipoActividad?.toLowerCase().includes(search);

      const matchesEstado =
        estadoFilter === "Todos" || item.estado === estadoFilter;

      const matchesCarril =
        carrilFilter === "Todos" || item.carril === carrilFilter;

      return matchesSearch && matchesEstado && matchesCarril;
    });
  }, [sortedItems, searchTerm, estadoFilter, carrilFilter]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setForm({
      ...emptyForm,
      ...item,
      id: item.id || item._id,
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  const openViewModal = (item) => {
    setForm({
      ...emptyForm,
      ...item,
      id: item.id || item._id,
    });
    setModalMode("view");
    setModalOpen(true);
  };

  const openHistoryModal = async (item) => {
    try {
      setSelectedHistoryItem(item);
      setHistoryModalOpen(true);

      const id = item.id || item._id;

      const response = await axios.get(`${API_RICE_KANBAN}/${id}/historial`, {
        withCredentials: true,
      });

      const historyData = response.data?.data;

      if (historyData) {
        setSelectedHistoryItem({
          ...item,
          historial: historyData.historial || [],
        });
      }
    } catch (error) {
      console.error("Error consultando historial:", error);

      showToast({
        icon: "warning",
        title: "No fue posible cargar el historial completo",
      });

      setSelectedHistoryItem(item);
    }
  };

  const closeHistoryModal = () => {
    setSelectedHistoryItem(null);
    setHistoryModalOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("create");
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      showWarning(
        "Título requerido",
        "Debes ingresar un título para guardar el requerimiento."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      Swal.fire({
        title: form.id
          ? "Actualizando requerimiento..."
          : "Creando requerimiento...",
        text: "Por favor espera un momento.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        tipoActividad: form.tipoActividad,
        carril: form.carril,
        areaSolicitante: form.areaSolicitante,
        solicitadoPor: form.solicitadoPor,
        alcance: Number(form.alcance),
        impacto: Number(form.impacto),
        confianza: Number(form.confianza),
        esfuerzo: Number(form.esfuerzo),
        estado: form.estado,
        sprint: form.sprint,
        vetoGerencia: Boolean(form.vetoGerencia),
        notasSeguimiento: form.notasSeguimiento,
      };

      if (form.id) {
        const response = await axios.put(
          `${API_RICE_KANBAN}/${form.id}`,
          payload,
          {
            withCredentials: true,
          }
        );

        const updatedItem = normalizeApiItem(response.data?.data);

        setItems((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );

        Swal.close();

        showToast({
          icon: "success",
          title: "Requerimiento actualizado correctamente",
        });
      } else {
        const response = await axios.post(API_RICE_KANBAN, payload, {
          withCredentials: true,
        });

        const newItem = normalizeApiItem(response.data?.data);

        setItems((prev) => [...prev, newItem]);

        Swal.close();

        showToast({
          icon: "success",
          title: "Requerimiento creado correctamente",
        });
      }

      closeModal();
    } catch (error) {
      console.error("Error guardando RICE:", error);

      Swal.close();

      const message =
        error.response?.data?.message || "No fue posible guardar el ítem RICE.";

      setErrorMessage(message);

      showError("Error al guardar", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const itemToDelete = items.find((item) => item.id === id || item._id === id);

    const result = await Swal.fire({
      icon: "warning",
      title: "¿Deseas evacuar este requerimiento?",
      html: `
        <div style="text-align:center; line-height:1.5;">
          <strong>${itemToDelete?.titulo || "Este requerimiento"}</strong>
          <br />
          <span style="color:#6b7280;">
            Será eliminado permanentemente del tablero RICE.
          </span>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, evacuar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
      ...swalConfig,
      confirmButtonColor: "#d32f2f",
    });

    if (!result.isConfirmed) return;

    try {
      setErrorMessage("");

      Swal.fire({
        title: "Eliminando requerimiento...",
        text: "Por favor espera un momento.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await axios.delete(`${API_RICE_KANBAN}/${id}`, {
        withCredentials: true,
      });

      setItems((prev) => prev.filter((item) => item.id !== id));

      if (form.id === id) {
        closeModal();
      }

      if (selectedHistoryItem?.id === id) {
        closeHistoryModal();
      }

      Swal.close();

      showToast({
        icon: "success",
        title: "Requerimiento evacuado correctamente",
      });
    } catch (error) {
      console.error("Error eliminando RICE:", error);

      Swal.close();

      const message =
        error.response?.data?.message || "No fue posible eliminar el ítem RICE.";

      setErrorMessage(message);

      showError("Error al eliminar", message);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "#f6f7f9",
        p: { xs: 1, md: 0 },
        mt: 5,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 2,
              color: "text.secondary",
              fontWeight: 700,
            }}
          >
            Calculadora RICE — Ritual quincenal de priorización
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
            Backlog de tareas, hallazgos y requerimientos
          </Typography>

          <Typography sx={{ color: "text.secondary", mt: 0.8 }}>
            Registra, calcula y ordena iniciativas según alcance, impacto,
            confianza y esfuerzo.
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: infoVisible ? 2 : 0 }}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  onClick={() => setInfoVisible((prev) => !prev)}
                  size="small"
                  sx={{
                    bgcolor: "rgba(0,0,0,0.04)",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.08)",
                    },
                  }}
                >
                  {infoVisible ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </IconButton>

                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Guía rápida de criterios RICE = (Alcance × Impacto ×
                  Confianza) / Esfuerzo.
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {infoVisible
                  ? "Consulta la explicación de alcance, impacto, confianza y esfuerzo."
                  : "Guía plegada. Puedes desplegarla para revisar los criterios RICE."}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setInfoVisible((prev) => !prev)}
              endIcon={
                infoVisible ? (
                  <KeyboardArrowUpIcon />
                ) : (
                  <KeyboardArrowDownIcon />
                )
              }
              sx={{
                fontWeight: 800,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {infoVisible ? "Ocultar guía" : "Mostrar guía"}
            </Button>
          </Stack>

          <Collapse in={infoVisible} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {infoCards.map((card) => (
                <Grid item xs={12} md={6} key={card.title}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: card.bgcolor,
                      border: "1px solid",
                      borderColor: card.borderColor,
                      height: "100%",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "5px",
                        height: "100%",
                        bgcolor: card.accentColor,
                      },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        color: card.accentColor,
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      sx={{
                        color: "text.primary",
                        mb: 1,
                        fontWeight: 500,
                      }}
                    >
                      {card.description}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                      }}
                    >
                      {card.detail}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.08)",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ p: 2.0 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Backlog RICE — Ambiocom
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {viewMode === "list"
                    ? "Vista lista para revisión, edición y control detallado."
                    : "Vista Kanban para seguimiento visual por estado."}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  variant="outlined"
                  startIcon={
                    viewMode === "list" ? (
                      <ViewKanbanOutlinedIcon />
                    ) : (
                      <ViewListOutlinedIcon />
                    )
                  }
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === "list" ? "kanban" : "list"
                    )
                  }
                  sx={{
                    fontWeight: 900,
                    borderRadius: 2,
                    px: 2.5,
                    textTransform: "none",
                    bgcolor: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {viewMode === "list" ? "Ver Kanban" : "Ver lista"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateModal}
                  disabled={saving}
                  sx={{
                    fontWeight: 900,
                    borderRadius: 2,
                    px: 2.5,
                    textTransform: "none",
                    background:
                      "linear-gradient(180deg, #4f8fd6 0%, #0f5fa8 100%)",
                    boxShadow: "0 8px 18px rgba(15, 95, 168, 0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Nuevo ítem
                </Button>
              </Stack>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                mb: 2.5,
                borderRadius: 3,
                bgcolor: "#ffffff",
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "#f8f9fb",
                  borderBottom: riceStatsVisible
                    ? "1px solid rgba(0,0,0,0.08)"
                    : "none",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    onClick={() => setRiceStatsVisible((prev) => !prev)}
                    size="small"
                    sx={{
                      bgcolor: "rgba(15, 95, 168, 0.08)",
                      color: "#0f5fa8",
                      "&:hover": {
                        bgcolor: "rgba(15, 95, 168, 0.14)",
                      },
                    }}
                  >
                    {riceStatsVisible ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                  </IconButton>

                  <Box>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      Resumen RICE
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                      }}
                    >
                      {riceStatsVisible
                        ? "Indicadores principales del backlog consultado."
                        : "Resumen plegado. Puedes desplegarlo para ver los indicadores."}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setRiceStatsVisible((prev) => !prev)}
                  endIcon={
                    riceStatsVisible ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    bgcolor: "#ffffff",
                  }}
                >
                  {riceStatsVisible ? "Ocultar resumen" : "Mostrar resumen"}
                </Button>
              </Stack>

              <Collapse in={riceStatsVisible} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    p: 2,
                    "& > div": {
                      mb: 0,
                    },
                  }}
                >
                  <RiceStatsCards dashboardStats={dashboardStats} />
                </Box>
              </Collapse>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2.5,
                borderRadius: 3,
                bgcolor: "#f8f9fb",
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.08)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  size="small"
                  type="month"
                  label="Mes de consulta"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    minWidth: { xs: "100%", md: 185 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                    },
                  }}
                />

                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<SearchIcon />}
                  onClick={() => fetchRiceItemsByMonth(monthFilter)}
                  disabled={loading}
                  sx={{
                    height: 40,
                    minWidth: { xs: "100%", md: 125 },
                    borderRadius: 2,
                    fontWeight: 900,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    background:
                      "linear-gradient(180deg, #4f8fd6 0%, #0f5fa8 100%)",
                    boxShadow: "0 8px 18px rgba(15, 95, 168, 0.20)",
                  }}
                >
                  Consultar
                </Button>

                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<TodayIcon />}
                  onClick={() => {
                    const currentMonth = getCurrentMonthValue();
                    setMonthFilter(currentMonth);
                    fetchRiceItemsByMonth(currentMonth);
                  }}
                  disabled={loading}
                  sx={{
                    height: 40,
                    minWidth: { xs: "100%", md: 135 },
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    bgcolor: "#ffffff",
                  }}
                >
                  Mes actual
                </Button>

                <TextField
                  fullWidth
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, solicitante, área, carril, tipo o estado..."
                  sx={{
                    flex: { xs: "1 1 auto", md: "1 1 38%" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                    },
                  }}
                />

                <TextField
                  select
                  size="small"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  sx={{
                    minWidth: { xs: "100%", md: 205 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                    },
                  }}
                >
                  <MenuItem value="Todos">Todos los estados</MenuItem>
                  {estados.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  value={carrilFilter}
                  onChange={(e) => setCarrilFilter(e.target.value)}
                  sx={{
                    minWidth: { xs: "100%", md: 225 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                    },
                  }}
                >
                  <MenuItem value="Todos">Ambos carriles</MenuItem>
                  {carriles.map((carril) => (
                    <MenuItem key={carril} value={carril}>
                      {carril}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<RestartAltIcon />}
                  onClick={() => {
                    const currentMonth = getCurrentMonthValue();
                    setSearchTerm("");
                    setEstadoFilter("Todos");
                    setCarrilFilter("Todos");
                    setMonthFilter(currentMonth);
                    fetchRiceItemsByMonth(currentMonth);
                  }}
                  disabled={loading}
                  sx={{
                    height: 40,
                    minWidth: { xs: "100%", md: 125 },
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    bgcolor: "#ffffff",
                  }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Paper>

            {periodInfo && (
              <Alert
                severity="info"
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    width: "100%",
                    fontWeight: 700,
                  },
                }}
              >
                Consulta activa: {formatPeriodo(periodInfo.actual)} y{" "}
                {formatPeriodo(periodInfo.anterior)}. Se muestran ítems creados
                o con movimientos registrados dentro de esos periodos.
              </Alert>
            )}

            {loading ? (
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  borderRadius: 3,
                  textAlign: "center",
                  bgcolor: "#f8f9fb",
                  border: "1px dashed",
                  borderColor: "rgba(0,0,0,0.18)",
                }}
              >
                <CircularProgress size={32} />

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    mt: 2,
                  }}
                >
                  Cargando ítems RICE...
                </Typography>
              </Paper>
            ) : (
              <>
                {viewMode === "list" && (
                  <Stack spacing={1.5}>
                    {filteredItems.map((item, index) => {
                      const score = calculateRice(item);
                      const progress = Math.min(Number(score) * 20, 100);

                      return (
                        <Paper
                          key={item.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "rgba(0,0,0,0.10)",
                            bgcolor:
                              item.estado === "Completado"
                                ? "rgba(46, 125, 50, 0.06)"
                                : "#ffffff",
                            transition: "all 0.25s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                            },
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={9}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                                sx={{ mb: 1 }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    color: "text.secondary",
                                  }}
                                >
                                  #{index + 1}
                                </Typography>

                                <Chip
                                  size="small"
                                  label={
                                    item.carril?.includes("Carril 1")
                                      ? "Carril 1"
                                      : "Carril 2"
                                  }
                                  color={getCarrilColor(item.carril)}
                                  sx={{ fontWeight: 800 }}
                                />

                                {item.tipoActividad && (
                                  <Chip
                                    size="small"
                                    label={item.tipoActividad}
                                    color={getTipoActividadColor(
                                      item.tipoActividad
                                    )}
                                    sx={{ fontWeight: 800 }}
                                  />
                                )}

                                <Chip
                                  size="small"
                                  label={item.estado}
                                  color={getEstadoColor(item.estado)}
                                  sx={{ fontWeight: 800 }}
                                />

                                {item.sprint && (
                                  <Chip
                                    size="small"
                                    label={item.sprint}
                                    variant="outlined"
                                    sx={{ fontWeight: 800 }}
                                  />
                                )}

                                {item.vetoGerencia && (
                                  <Chip
                                    size="small"
                                    label="Veto Gerencia"
                                    color="error"
                                    sx={{ fontWeight: 800 }}
                                  />
                                )}
                              </Stack>

                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 900, lineHeight: 1.2 }}
                              >
                                {item.titulo}
                              </Typography>

                              <Typography
                                sx={{
                                  color: "text.secondary",
                                  mt: 0.6,
                                  mb: 1,
                                  maxWidth: 820,
                                }}
                              >
                                {item.descripcion}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                flexWrap="wrap"
                                sx={{ color: "text.secondary" }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  Alcance {item.alcance}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  Impacto {item.impacto}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  Confianza{" "}
                                  {Math.round(Number(item.confianza) * 100)}%
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  Esfuerzo {item.esfuerzo}s
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  {item.areaSolicitante}
                                </Typography>
                              </Stack>

                              <Box
                                sx={{
                                  mt: 1.2,
                                  width: "100%",
                                  maxWidth: 780,
                                  height: 5,
                                  borderRadius: 999,
                                  bgcolor: "rgba(0,0,0,0.10)",
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    borderRadius: 999,
                                    bgcolor:
                                      Number(score) >= 5
                                        ? "#2e7d32"
                                        : Number(score) >= 2.5
                                          ? "#1565c0"
                                          : "#9e9e9e",
                                  }}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <Box
                                sx={{
                                  position: "relative",
                                  minHeight: { xs: "auto", md: 150 },
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  overflow: "hidden",
                                  borderRadius: 2,
                                }}
                              >
                                {item.estado === "Completado" && (
                                  <TaskAltIcon
                                    sx={{
                                      position: "absolute",
                                      right: 8,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      fontSize: { xs: 80, md: 120 },
                                      color: "rgba(46, 125, 50, 0.14)",
                                      zIndex: 0,
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}

                                <Stack
                                  direction={{ xs: "row", md: "column" }}
                                  alignItems={{ xs: "center", md: "flex-end" }}
                                  justifyContent="space-between"
                                  spacing={1.5}
                                  sx={{
                                    position: "relative",
                                    zIndex: 1,
                                    width: "100%",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      textAlign: { xs: "left", md: "right" },
                                      width: "100%",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: item.estado === "Completado" ? "#2e7d32" : "text.secondary",
                                        fontWeight: 800,
                                        letterSpacing: 0.5,
                                      }}
                                    >
                                      RICE
                                    </Typography>

                                    <Typography
                                      variant="h4"
                                      sx={{
                                        fontWeight: 900,
                                        color: item.estado === "Completado" ? "#1b5e20" : "inherit",
                                      }}
                                    >
                                      {score}
                                    </Typography>
                                  </Box>

                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Tooltip title="Consultar">
                                      <IconButton
                                        onClick={() => openViewModal(item)}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "rgba(0,0,0,0.16)",
                                          borderRadius: 2,
                                          bgcolor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <VisibilityOutlinedIcon />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Editar">
                                      <IconButton
                                        onClick={() => openEditModal(item)}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "rgba(0,0,0,0.16)",
                                          borderRadius: 2,
                                          bgcolor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <EditOutlinedIcon />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Historial">
                                      <IconButton
                                        onClick={() => openHistoryModal(item)}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "rgba(0,0,0,0.16)",
                                          borderRadius: 2,
                                          bgcolor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <HistoryIcon />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Eliminar">
                                      <IconButton
                                        color="error"
                                        onClick={() => handleDelete(item.id)}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "rgba(0,0,0,0.16)",
                                          borderRadius: 2,
                                          bgcolor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <DeleteOutlineIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    })}

                    {filteredItems.length === 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 5,
                          borderRadius: 3,
                          textAlign: "center",
                          bgcolor: "#f8f9fb",
                          border: "1px dashed",
                          borderColor: "rgba(0,0,0,0.18)",
                        }}
                      >
                        <Typography
                          sx={{ color: "text.secondary", fontWeight: 700 }}
                        >
                          No hay ítems que coincidan con los filtros
                          seleccionados.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                )}

                {viewMode === "kanban" && (
                  <RiceKanbanBoard
                    items={filteredItems}
                    onView={openViewModal}
                    onHistory={openHistoryModal}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </Box>
        </Paper>
      </Stack>

      <RiceItemModal
        open={modalOpen}
        modalMode={modalMode}
        form={form}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        carriles={carriles}
        tiposActividad={tiposActividad}
        areasSolicitantes={areasSolicitantes}
        estados={estados}
        sprints={sprints}
        alcanceOptions={alcanceOptions}
        impactoOptions={impactoOptions}
        confianzaOptions={confianzaOptions}
        esfuerzoOptions={esfuerzoOptions}
        saving={saving}
      />

      <RiceHistoryModal
        open={historyModalOpen}
        onClose={closeHistoryModal}
        item={selectedHistoryItem}
      />
    </Box>
  );
}