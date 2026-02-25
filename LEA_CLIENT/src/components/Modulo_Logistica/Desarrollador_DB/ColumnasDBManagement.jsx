import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  MenuItem,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const API_COLUMNAS = "http://localhost:4041/api/columna-despacho-alcoholes";
const API_AUTH_VERIFY = "http://localhost:4041/api/auth/verify-columns";

//roles del select
const ROLES = [
  "developer",
  "liderlogistica",
  "auxiliarlogistica1",
  "auxiliarlogistica2",
  "torrecontrollogistica",
  "gerente",
];

const initialForm = {
  nombre: "",
  key: "",
  unidad: "",
  totalizable: false,
  rolesDigitables: ["developer"],
};

export default function GestionColumnasDespacho() {
  const [columnas, setColumnas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [q, setQ] = useState("");
  const [authStatus, setAuthStatus] = useState("checking"); // checking | authorized | denied

  /* ===============================
   * AUTH
   * =============================== */
  const verifyCredentials = async (password) => {
    const { data } = await axios.post(API_AUTH_VERIFY, {
      rol: "developer",
      password,
    });
    return data?.ok === true;
  };

  const requestSecurityCredentials = async () => {
    const result = await Swal.fire({
      title: "Acceso restringido",
      html: `
        <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
          <div style="font-size:13px; opacity:0.85;">
            Rol requerido: <b>developer</b>
          </div>
          <label style="font-size:13px; opacity:0.8;">Contraseña</label>
          <input id="swal-pass" type="password" class="swal2-input" placeholder="Contraseña" style="margin:0;" />
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ingresar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
      allowEscapeKey: false,
      focusConfirm: false,
      preConfirm: async () => {
        const password = document.getElementById("swal-pass")?.value?.trim();

        if (!password) {
          Swal.showValidationMessage("Debes ingresar la contraseña.");
          return false;
        }

        try {
          const ok = await verifyCredentials(password);
          if (!ok) {
            Swal.showValidationMessage("Acceso denegado.");
            return false;
          }
          return true;
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            "No se pudo verificar. Revisa el servidor.";
          Swal.showValidationMessage(msg);
          return false;
        }
      },
    });

    return result.isConfirmed === true;
  };

  useEffect(() => {
    (async () => {
      try {
        const ok = await requestSecurityCredentials();
        setAuthStatus(ok ? "authorized" : "denied");
      } catch (e) {
        console.error(e);
        setAuthStatus("denied");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===============================
   * API
   * =============================== */
  const fetchColumnas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_COLUMNAS); // GET /
      setColumnas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setColumnas([]);
      Swal.fire("Error", "No se pudieron cargar las columnas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authorized") fetchColumnas();
  }, [authStatus]);

  /* ===============================
   * Helpers (alineados con backend)
   * =============================== */
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  // Backend: key = key.toLowerCase().trim()
  const normalizarKey = (v) =>
    (v || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .slice(0, 60);

  const columnasFiltradas = useMemo(() => {
    const qq = (q || "").toLowerCase().trim();
    if (!qq) return columnas;

    return columnas.filter((c) => {
      const roles = Array.isArray(c.rolesDigitables)
        ? c.rolesDigitables.join(" ")
        : "developer";

      const haystack = [
        c.nombre,
        c.key,
        c.unidad,
        c.totalizable ? "totalizable" : "no totalizable",
        roles,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(qq);
    });
  }, [columnas, q]);

  /* ===============================
   * CRUD
   * =============================== */
  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      Swal.fire("Falta información", "El nombre es obligatorio", "warning");
      return;
    }
    if (!form.key.trim()) {
      Swal.fire("Falta información", "La key es obligatoria", "warning");
      return;
    }
    if (!Array.isArray(form.rolesDigitables) || form.rolesDigitables.length === 0) {
      Swal.fire("Falta información", "Asigna al menos un rol", "warning");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      key: normalizarKey(form.key),
      unidad: (form.unidad || "").trim(),
      totalizable: Boolean(form.totalizable),
      rolesDigitables: form.rolesDigitables.map((r) =>
        String(r).toLowerCase().trim()
      ),
    };

    try {
      setLoading(true);

      if (editingId) {
        await axios.put(`${API_COLUMNAS}/${editingId}`, payload); // PUT /:id
        Swal.fire("Actualizado", "La columna se actualizó correctamente", "success");
      } else {
        await axios.post(API_COLUMNAS, payload); // POST /
        Swal.fire("Creada", "La columna se creó correctamente", "success");
      }

      resetForm();
      await fetchColumnas();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "No se pudo guardar la columna";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (col) => {
    setEditingId(col._id);
    setForm({
      nombre: col.nombre ?? "",
      key: col.key ?? "",
      unidad: col.unidad ?? "",
      totalizable: Boolean(col.totalizable),
      rolesDigitables: Array.isArray(col.rolesDigitables)
        ? col.rolesDigitables
        : ["developer"],
    });
  };

  const handleDelete = async (col) => {
    const res = await Swal.fire({
      title: "¿Desactivar columna?",
      html: `<div style="text-align:left;">
        <b>Nombre:</b> ${col.nombre || ""}<br/>
        <b>Key:</b> ${col.key || ""}<br/><br/>
        Se marcará como <b>inactiva</b> (activo=false).
      </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });

    if (!res.isConfirmed) return;

    try {
      setLoading(true);
      await axios.delete(`${API_COLUMNAS}/${col._id}`); // DELETE /:id (soft delete)
      Swal.fire("OK", "Columna desactivada", "success");
      await fetchColumnas();
      if (editingId === col._id) resetForm();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "No se pudo desactivar la columna";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
   * BLOQUEO DE RENDER
   * =============================== */
  if (authStatus === "checking") {
    return (
      <Box p={2} mt={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold">
              Verificando credenciales...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
              Debes autenticarte para acceder a este módulo.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (authStatus === "denied") {
    return (
      <Box p={2} mt={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" color="error">
              Acceso denegado
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              No se renderiza el módulo porque no se ingresaron credenciales válidas.
            </Typography>

            <Box mt={2}>
              <Button
                variant="contained"
                onClick={async () => {
                  setAuthStatus("checking");
                  const ok = await requestSecurityCredentials();
                  setAuthStatus(ok ? "authorized" : "denied");
                }}
              >
                Intentar de nuevo
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  /* ===============================
   * Render módulo (autorizado)
   * =============================== */
  return (
    <Box p={2} mt={6}>
      <Card elevation={4}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
          >
            <Typography variant="h5" fontWeight="bold">
              Gestión de Columnas (Despacho)
            </Typography>

            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                label="Buscar"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ minWidth: 220 }}
              />
              <Tooltip title="Recargar">
                <IconButton onClick={fetchColumnas} disabled={loading}>
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre visible"
                name="nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Key (ej: energia_con)"
                name="key"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                helperText={`Se guardará como: ${normalizarKey(form.key) || "—"}`}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Unidad"
                name="unidad"
                value={form.unidad}
                onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.totalizable}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, totalizable: e.target.checked }))
                    }
                  />
                }
                label="Totalizable"
              />
            </Grid>

            {/* ✅ NUEVO: Roles digitables */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Roles que pueden digitar"
                value={form.rolesDigitables}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    selected?.length ? selected.join(", ") : "—",
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((p) => ({
                    ...p,
                    rolesDigitables: Array.isArray(value) ? value : [],
                  }));
                }}
                helperText="Selecciona 1 o más roles"
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color={editingId ? "warning" : "primary"}
                  startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {editingId ? "Actualizar" : "Crear"}
                </Button>

                <Button variant="outlined" onClick={resetForm} disabled={loading}>
                  {editingId ? "Cancelar edición" : "Limpiar"}
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <TableContainer component={Paper} elevation={2}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell><b>Nombre</b></TableCell>
                  <TableCell><b>Key</b></TableCell>
                  <TableCell><b>Unidad</b></TableCell>
                  <TableCell><b>Totalizable</b></TableCell>
                  <TableCell><b>Roles</b></TableCell>
                  <TableCell align="center"><b>Acciones</b></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {columnasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {loading ? "Cargando..." : "No hay columnas"}
                    </TableCell>
                  </TableRow>
                ) : (
                  columnasFiltradas.map((c) => {
                    const roles = Array.isArray(c.rolesDigitables)
                      ? c.rolesDigitables
                      : ["developer"];

                    return (
                      <TableRow key={c._id} hover selected={editingId === c._id}>
                        <TableCell>{c.nombre}</TableCell>

                        <TableCell>
                          <Chip size="small" label={c.key} />
                        </TableCell>

                        <TableCell>{c.unidad || "—"}</TableCell>

                        <TableCell>
                          {c.totalizable ? (
                            <Chip size="small" label="Sí" />
                          ) : (
                            <Chip size="small" label="No" variant="outlined" />
                          )}
                        </TableCell>

                        {/* ✅ roles */}
                        <TableCell>
                          {roles.map((r) => (
                            <Chip
                              key={`${c._id}-${r}`}
                              size="small"
                              label={r}
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton color="primary" onClick={() => handleEdit(c)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Desactivar">
                            <IconButton color="error" onClick={() => handleDelete(c)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            mt={1}
            display="flex"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Total columnas: {columnas.length}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Mostrando: {columnasFiltradas.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}