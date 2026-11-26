import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Archive,
  DeleteForever,
  Inventory2,
  Restore,
  Save,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const API_BASE_URL = "https://ambiocomserver.onrender.com/api/materiales-combustibles";

const MATERIAL_OPTIONS = ["Carbón", "Madera", "Bagazo"];

const getMaterialChipSx = (material) => {
  const map = {
    Carbón: {
      bgcolor: "#eff6ff",
      color: "#1e40af",
      border: "#bfdbfe",
    },
    Madera: {
      bgcolor: "#ecfdf5",
      color: "#166534",
      border: "#bbf7d0",
    },
    Bagazo: {
      bgcolor: "#fff7ed",
      color: "#9a3412",
      border: "#fed7aa",
    },
  };

  const selected = map[material] || map.Carbón;

  return {
    fontWeight: 900,
    bgcolor: selected.bgcolor,
    color: selected.color,
    border: `1px solid ${selected.border}`,
  };
};

const tableShellSx = {
  borderRadius: 4,
  borderColor: "#cbd5e1",
  overflow: "auto",
  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  "& table": {
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  "& th": {
    bgcolor: "#0f172a",
    color: "white",
    fontWeight: 900,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.35,
    whiteSpace: "nowrap",
    borderColor: "#334155",
    textAlign: "center",
  },
  "& th.MuiTableCell-alignRight": {
    textAlign: "center",
  },
  "& th.MuiTableCell-alignCenter": {
    textAlign: "center",
  },
  "& td": {
    fontSize: 12,
    borderColor: "#e2e8f0",
    whiteSpace: "nowrap",
  },
  "& tbody tr:hover td": {
    bgcolor: "#f8fbff",
  },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 36,
    borderRadius: 2,
    bgcolor: "transparent",
    fontSize: 13,
    fontWeight: 800,
    "& fieldset": {
      border: 0,
    },
    "&:hover": {
      bgcolor: "#f8fbff",
    },
    "&.Mui-focused": {
      bgcolor: "#eef6ff",
      boxShadow: "inset 0 0 0 2px #2563eb",
    },
  },
  "& input": {
    px: 1,
    py: 0.75,
    textAlign: "center",
  },
};

const selectFieldSx = {
  ...fieldSx,
  "& .MuiSelect-select": {
    py: 0.75,
    px: 1,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
};

const toolbarIconSx = {
  width: 40,
  height: 40,
  borderRadius: 3,
  border: "1px solid #dbe3ef",
  bgcolor: "#ffffff",
  color: "#0f172a",
  "&:hover": {
    bgcolor: "#f8fafc",
  },
};

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const makeMaterialId = (material, name) =>
  `${material || "Carbón"}-${name || "material"}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `material-${Date.now()}`;

const normalizeMaterialRow = (row = {}) => {
  const codigo = String(row.codigo || row.id || row._id || "").trim();

  return {
    _id: row._id || row.mongoId || "",
    mongoId: row.mongoId || row._id || "",
    id: codigo,
    codigo,
    name: row.name || row.nombre || "",
    material: row.material || "Carbón",
    weightCV: row.weightCV ?? 0,
    weightCN: row.weightCN ?? 0,
    initialTon: row.initialTon ?? 0,
    stockMinimoTon: row.stockMinimoTon ?? 0,
    active: row.active !== false,
    observacion: row.observacion || "",
  };
};

const buildPayload = (row = {}) => ({
  codigo: row.codigo || row.id || makeMaterialId(row.material, row.name),
  name: String(row.name || "").trim(),
  material: row.material || "Carbón",
  weightCV: normalizeNumber(row.weightCV),
  weightCN: normalizeNumber(row.weightCN),
  initialTon: normalizeNumber(row.initialTon),
  stockMinimoTon: normalizeNumber(row.stockMinimoTon),
  active: row.active !== false,
  observacion: String(row.observacion || "").trim(),
});

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
};

const showSwalLoading = (
  title = "Procesando...",
  text = "Por favor espera un momento."
) => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

const showSuccessToast = (title) => {
  Swal.fire({
    icon: "success",
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.style.marginTop = "70px";
      toast.style.marginRight = "12px";
    },
  });
};

export default function ConfiguracionMaterialesCombustibles({
  onMaterialsChange,
}) {
  const [carbons, setCarbons] = useState([]);
  const [newCarbonName, setNewCarbonName] = useState("");
  const [newCarbonMaterial, setNewCarbonMaterial] = useState("Carbón");

  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState({});
  const [dirtyIds, setDirtyIds] = useState({});

  const [actionSnack, setActionSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const activeCount = useMemo(
    () => carbons.filter((item) => item.active !== false).length,
    [carbons]
  );

  const hiddenCount = useMemo(
    () => carbons.filter((item) => item.active === false).length,
    [carbons]
  );

  const notifyParent = useCallback(
    (rows) => {
      onMaterialsChange?.(rows);
    },
    [onMaterialsChange]
  );

  const hydrateRows = useCallback(
    (registros = []) => {
      const rows = Array.isArray(registros)
        ? registros.map((row) => normalizeMaterialRow(row))
        : [];

      setCarbons(rows);
      notifyParent(rows);
      setDirtyIds({});
    },
    [notifyParent]
  );

  const loadMaterials = useCallback(
    async ({ withSwal = false } = {}) => {
      try {
        setLoading(true);

        if (withSwal) {
          showSwalLoading(
            "Consultando materiales",
            "Cargando configuración desde la base de datos..."
          );
        }

        const data = await requestJson(API_BASE_URL);

        hydrateRows(data.materiales || []);

        if (withSwal) {
          Swal.close();
          showSuccessToast("Materiales cargados");
        }
      } catch (error) {
        console.error("Error consultando materiales combustibles:", error);

        if (withSwal) Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudieron consultar los materiales",
          text:
            error.message ||
            "Ocurrió un error consultando la configuración de materiales.",
          confirmButtonText: "Entendido",
        });
      } finally {
        setLoading(false);
      }
    },
    [hydrateRows]
  );

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const setRowSaving = useCallback((rowId, value) => {
    setSavingIds((current) => ({
      ...current,
      [rowId]: value,
    }));
  }, []);

  const markRowClean = useCallback((rowId) => {
    setDirtyIds((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
  }, []);

  const markRowDirty = useCallback((rowId) => {
    setDirtyIds((current) => ({
      ...current,
      [rowId]: true,
    }));
  }, []);

  const handleFieldChange = useCallback(
    (rowId, field, value) => {
      setCarbons((current) => {
        const nextRows = current.map((row) => {
          if (row.id !== rowId) return row;

          return {
            ...row,
            [field]: value,
          };
        });

        notifyParent(nextRows);

        return nextRows;
      });

      markRowDirty(rowId);
    },
    [markRowDirty, notifyParent]
  );

  const saveMaterialRow = useCallback(
    async (row, { silent = false } = {}) => {
      const payload = buildPayload(row);

      if (!payload.name) {
        Swal.fire({
          icon: "warning",
          title: "Nombre obligatorio",
          text: "El material debe tener un nombre.",
          confirmButtonText: "Entendido",
        });
        return;
      }

      try {
        setRowSaving(row.id, true);

        const identifier = row.mongoId || row._id || row.codigo || row.id;

        const data = await requestJson(`${API_BASE_URL}/${identifier}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        const updated = normalizeMaterialRow(data.material || payload);

        setCarbons((current) => {
          const nextRows = current.map((item) =>
            item.id === row.id ? updated : item
          );

          notifyParent(nextRows);

          return nextRows;
        });

        markRowClean(row.id);

        if (!silent) {
          showSuccessToast("Material actualizado");
        }
      } catch (error) {
        console.error("Error actualizando material:", error);

        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar",
          text:
            error.message ||
            "Ocurrió un error actualizando el material combustible.",
          confirmButtonText: "Entendido",
        });
      } finally {
        setRowSaving(row.id, false);
      }
    },
    [markRowClean, notifyParent, setRowSaving]
  );

  const handleSaveMaterial = useCallback(
    async (row) => {
      await saveMaterialRow(row);
    },
    [saveMaterialRow]
  );

  const handleCreateMaterial = useCallback(async () => {
    const trimmedName = newCarbonName.trim();

    if (!trimmedName) {
      Swal.fire({
        icon: "warning",
        title: "Nombre obligatorio",
        text: "Escribe el nombre del material que vas a crear.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const payload = {
      codigo: makeMaterialId(newCarbonMaterial, trimmedName),
      name: trimmedName,
      material: newCarbonMaterial,
      weightCV: 0,
      weightCN: 0,
      initialTon: 0,
      stockMinimoTon: 0,
      active: true,
      observacion: "",
    };

    const result = await Swal.fire({
      icon: "question",
      title: "¿Crear material?",
      text: `Se creará "${trimmedName}" como ${newCarbonMaterial}.`,
      showCancelButton: true,
      confirmButtonText: "Sí, crear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showSwalLoading(
        "Creando material",
        "Guardando configuración en la base de datos..."
      );

      const data = await requestJson(API_BASE_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const created = normalizeMaterialRow(data.material || payload);

      setCarbons((current) => {
        const nextRows = [...current, created];

        notifyParent(nextRows);

        return nextRows;
      });

      setNewCarbonName("");
      setNewCarbonMaterial("Carbón");

      Swal.close();
      showSuccessToast("Material creado");
    } catch (error) {
      console.error("Error creando material:", error);

      Swal.close();

      Swal.fire({
        icon: "error",
        title: "No se pudo crear",
        text:
          error.message ||
          "Ocurrió un error creando el material combustible.",
        confirmButtonText: "Entendido",
      });
    }
  }, [newCarbonMaterial, newCarbonName, notifyParent]);

  const handleToggleMaterial = useCallback(
    async (row) => {
      const isActive = row.active !== false;

      const result = await Swal.fire({
        icon: "warning",
        title: isActive ? "¿Ocultar material?" : "¿Reactivar material?",
        text: isActive
          ? "El material quedará oculto sin borrar el histórico."
          : "El material volverá a estar disponible para los módulos.",
        showCancelButton: true,
        confirmButtonText: isActive ? "Sí, ocultar" : "Sí, reactivar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: isActive ? "#d97706" : "#059669",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      try {
        showSwalLoading(
          isActive ? "Ocultando material" : "Reactivando material",
          "Actualizando estado en la base de datos..."
        );

        const identifier = row.mongoId || row._id || row.codigo || row.id;

        const data = await requestJson(`${API_BASE_URL}/${identifier}/toggle`, {
          method: "PATCH",
          body: JSON.stringify({
            active: !isActive,
          }),
        });

        const updated = normalizeMaterialRow(
          data.material || {
            ...row,
            active: !isActive,
          }
        );

        setCarbons((current) => {
          const nextRows = current.map((item) =>
            item.id === row.id ? updated : item
          );

          notifyParent(nextRows);

          return nextRows;
        });

        Swal.close();
        showSuccessToast(isActive ? "Material ocultado" : "Material reactivado");
      } catch (error) {
        console.error("Error cambiando estado del material:", error);

        Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudo cambiar el estado",
          text:
            error.message ||
            "Ocurrió un error cambiando el estado del material.",
          confirmButtonText: "Entendido",
        });
      }
    },
    [notifyParent]
  );

  const handleArchiveMaterial = useCallback(
    async (row) => {
      if (row.active === false) {
        await handleToggleMaterial(row);
        return;
      }

      const result = await Swal.fire({
        icon: "warning",
        title: "¿Ocultar material?",
        text:
          "Este material quedará inactivo. No se borra el histórico asociado.",
        showCancelButton: true,
        confirmButtonText: "Sí, ocultar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d97706",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      try {
        showSwalLoading(
          "Ocultando material",
          "Actualizando configuración en la base de datos..."
        );

        const identifier = row.mongoId || row._id || row.codigo || row.id;

        const data = await requestJson(`${API_BASE_URL}/${identifier}`, {
          method: "DELETE",
        });

        const updated = normalizeMaterialRow(
          data.material || {
            ...row,
            active: false,
          }
        );

        setCarbons((current) => {
          const nextRows = current.map((item) =>
            item.id === row.id ? updated : item
          );

          notifyParent(nextRows);

          return nextRows;
        });

        Swal.close();
        showSuccessToast("Material ocultado");
      } catch (error) {
        console.error("Error ocultando material:", error);

        Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudo ocultar",
          text:
            error.message ||
            "Ocurrió un error ocultando el material combustible.",
          confirmButtonText: "Entendido",
        });
      }
    },
    [handleToggleMaterial, notifyParent]
  );

  const handleDeleteMaterial = useCallback(
    async (row) => {
      const result = await Swal.fire({
        icon: "error",
        title: "¿Eliminar material?",
        html: `
          <div style="text-align:left">
            <p>Se eliminará el material <b>${row.name}</b>.</p>
            <p style="margin-top:8px;color:#991b1b">
              Esta acción quitará el material de la tabla de configuración.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      try {
        showSwalLoading(
          "Eliminando material",
          "Actualizando configuración en la base de datos..."
        );

        const identifier = row.mongoId || row._id || row.codigo || row.id;

        await requestJson(`${API_BASE_URL}/${identifier}`, {
          method: "DELETE",
        });

        setCarbons((current) => {
          const nextRows = current.filter((item) => item.id !== row.id);

          notifyParent(nextRows);

          return nextRows;
        });

        setDirtyIds((current) => {
          const next = { ...current };
          delete next[row.id];
          return next;
        });

        Swal.close();
        showSuccessToast("Material eliminado");
      } catch (error) {
        console.error("Error eliminando material:", error);

        Swal.close();

        Swal.fire({
          icon: "error",
          title: "No se pudo eliminar",
          text:
            error.message ||
            "Ocurrió un error eliminando el material combustible.",
          confirmButtonText: "Entendido",
        });
      }
    },
    [notifyParent]
  );

  const closeActionSnack = useCallback((event, reason) => {
    if (reason === "clickaway") return;

    setActionSnack((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  return (
    <Stack gap={2.2}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 4,
          borderColor: "#dbe3ef",
          bgcolor: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          gap={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h6" fontWeight={950} color="#0f172a">
                Configuración de materiales
              </Typography>

              {loading && <CircularProgress size={18} />}

              <Chip
                label={`Activos: ${activeCount}`}
                size="small"
                sx={{
                  fontWeight: 900,
                  bgcolor: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                }}
              />

              <Chip
                label={`Ocultos: ${hiddenCount}`}
                size="small"
                sx={{
                  fontWeight: 900,
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
              />
            </Stack>

            <Typography color="text.secondary" fontSize={13.5}>
              Crea y clasifica cada item como Carbón, Madera o Bagazo. Los pesos
              por palada aplican cuando el material se controle por cargador.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <FormControl
              size="small"
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                  fontWeight: 800,
                },
              }}
            >
              <InputLabel>Material</InputLabel>

              <Select
                label="Material"
                value={newCarbonMaterial}
                onChange={(event) => setNewCarbonMaterial(event.target.value)}
                disabled={loading}
              >
                {MATERIAL_OPTIONS.map((material) => (
                  <MenuItem key={material} value={material}>
                    {material}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Nuevo item"
              value={newCarbonName}
              onChange={(event) => setNewCarbonName(event.target.value)}
              size="small"
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateMaterial();
                }
              }}
              sx={{
                minWidth: 220,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                  fontWeight: 800,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Inventory2 fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleCreateMaterial}
              disabled={loading}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 900,
              }}
            >
              Crear item
            </Button>

            <Tooltip title="Refrescar materiales desde la base de datos">
              <span>
                <IconButton
                  onClick={() => loadMaterials({ withSwal: true })}
                  disabled={loading}
                  sx={{
                    ...toolbarIconSx,
                    color: "#1e40af",
                  }}
                >
                  <Inventory2 />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={tableShellSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Material</TableCell>
              <TableCell align="center">Item</TableCell>
              <TableCell align="center">Peso CV</TableCell>
              <TableCell align="center">Peso CN</TableCell>
              <TableCell align="center">Inventario inicial</TableCell>
              <TableCell align="center">Stock mínimo</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && carbons.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    py: 4,
                    fontWeight: 800,
                    color: "text.secondary",
                    bgcolor: "#f8fafc",
                  }}
                >
                  No hay materiales configurados.
                </TableCell>
              </TableRow>
            )}

            {carbons.map((carbon) => {
              const material = carbon.material || "Carbón";
              const isSaving = Boolean(savingIds[carbon.id]);
              const isDirty = Boolean(dirtyIds[carbon.id]);

              return (
                <TableRow key={carbon.id} hover>
                  <TableCell align="center">
                    <Chip
                      label={carbon.active ? "Activo" : "Oculto"}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        bgcolor: carbon.active ? "#dcfce7" : "#f1f5f9",
                        color: carbon.active ? "#166534" : "#475569",
                        border: `1px solid ${
                          carbon.active ? "#bbf7d0" : "#cbd5e1"
                        }`,
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 145 }}>
                    <TextField
                      select
                      value={material}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(
                          carbon.id,
                          "material",
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      sx={{
                        ...selectFieldSx,
                        "& .MuiOutlinedInput-root": {
                          height: 36,
                          borderRadius: 2,
                          bgcolor: getMaterialChipSx(material).bgcolor,
                          color: getMaterialChipSx(material).color,
                          fontSize: 13,
                          fontWeight: 900,
                          "& fieldset": {
                            border: 0,
                          },
                          "&.Mui-focused": {
                            boxShadow: "inset 0 0 0 2px #2563eb",
                          },
                        },
                      }}
                    >
                      {MATERIAL_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 190 }}>
                    <TextField
                      value={carbon.name}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(carbon.id, "name", event.target.value)
                      }
                      fullWidth
                      size="small"
                      sx={fieldSx}
                    />
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 120 }} align="center">
                    <TextField
                      type="number"
                      value={carbon.weightCV}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(
                          carbon.id,
                          "weightCV",
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      inputProps={{
                        step: "0.01",
                        style: { textAlign: "center" },
                      }}
                      sx={fieldSx}
                    />
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 120 }} align="center">
                    <TextField
                      type="number"
                      value={carbon.weightCN}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(
                          carbon.id,
                          "weightCN",
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      inputProps={{
                        step: "0.01",
                        style: { textAlign: "center" },
                      }}
                      sx={fieldSx}
                    />
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 140 }} align="center">
                    <TextField
                      type="number"
                      value={carbon.initialTon}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(
                          carbon.id,
                          "initialTon",
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      inputProps={{
                        step: "0.01",
                        style: { textAlign: "center" },
                      }}
                      sx={fieldSx}
                    />
                  </TableCell>

                  <TableCell sx={{ p: 0.35, minWidth: 130 }} align="center">
                    <TextField
                      type="number"
                      value={carbon.stockMinimoTon}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleFieldChange(
                          carbon.id,
                          "stockMinimoTon",
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      inputProps={{
                        step: "0.01",
                        style: { textAlign: "center" },
                      }}
                      sx={fieldSx}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      gap={0.75}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Tooltip
                        title={
                          isDirty
                            ? "Guardar cambios"
                            : "No hay cambios pendientes"
                        }
                      >
                        <span>
                          <IconButton
                            disabled={!isDirty || isSaving}
                            onClick={() => handleSaveMaterial(carbon)}
                            sx={{
                              bgcolor: isDirty ? "#ecfdf5" : "#f1f5f9",
                              color: isDirty ? "#059669" : "#94a3b8",
                              "&:hover": {
                                bgcolor: isDirty ? "#bbf7d0" : "#f1f5f9",
                              },
                            }}
                          >
                            {isSaving ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Save />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip
                        title={
                          carbon.active
                            ? "Ocultar sin borrar histórico"
                            : "Reactivar item"
                        }
                      >
                        <span>
                          <IconButton
                            disabled={isSaving}
                            onClick={() => handleArchiveMaterial(carbon)}
                            sx={{
                              bgcolor: carbon.active ? "#fff7ed" : "#ecfdf5",
                              color: carbon.active ? "#9a3412" : "#166534",
                              "&:hover": {
                                bgcolor: carbon.active ? "#fed7aa" : "#bbf7d0",
                              },
                            }}
                          >
                            {carbon.active ? <Archive /> : <Restore />}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Eliminar material">
                        <span>
                          <IconButton
                            disabled={isSaving}
                            onClick={() => handleDeleteMaterial(carbon)}
                            sx={{
                              bgcolor: "#fef2f2",
                              color: "#991b1b",
                              "&:hover": {
                                bgcolor: "#fecaca",
                              },
                            }}
                          >
                            <DeleteForever />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={actionSnack.open}
        autoHideDuration={2200}
        onClose={closeActionSnack}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeActionSnack}
          severity={actionSnack.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 3,
            fontWeight: 850,
          }}
        >
          {actionSnack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
