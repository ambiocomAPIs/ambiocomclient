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

const API_COLUMNAS_DESPACHO = "https://ambiocomserver.onrender.com/api/columna-despacho-alcoholes";
const API_COLUMNAS_RECEPCION = "https://ambiocomserver.onrender.com/api/columna-recepcion-alcoholes";
const API_AUTH_VERIFY = "https://ambiocomserver.onrender.com/api/auth/verify-columns";

// roles del select para despacho
const ROLES = [
  "developer",
  "liderlogistica",
  "auxiliarlogistica1",
  "auxiliarlogistica2",
  "torrecontrollogistica",
  "gerente",
];

const initialFormDespacho = {
  nombre: "",
  key: "",
  unidad: "",
  totalizable: false,
  rolesDigitables: ["developer"],
};

const initialFormRecepcion = {
  nombre: "",
  key: "",
  unidad: "",
  totalizable: false,
};

export default function GestionColumnasAlcoholes() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [loading, setLoading] = useState(false);

  // ==========================
  // DESPACHO
  // ==========================
  const [columnasDespacho, setColumnasDespacho] = useState([]);
  const [editingIdDespacho, setEditingIdDespacho] = useState(null);
  const [formDespacho, setFormDespacho] = useState(initialFormDespacho);
  const [qDespacho, setQDespacho] = useState("");

  // ==========================
  // RECEPCION
  // ==========================
  const [columnasRecepcion, setColumnasRecepcion] = useState([]);
  const [editingIdRecepcion, setEditingIdRecepcion] = useState(null);
  const [formRecepcion, setFormRecepcion] = useState(initialFormRecepcion);
  const [qRecepcion, setQRecepcion] = useState("");

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
  }, []);

  const normalizarKey = (v) =>
    (v || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .slice(0, 60);

  // ==========================
  // FETCH
  // ==========================
  const fetchColumnasDespacho = async () => {
    const { data } = await axios.get(API_COLUMNAS_DESPACHO);
    setColumnasDespacho(Array.isArray(data) ? data : []);
  };

  const fetchColumnasRecepcion = async () => {
    const { data } = await axios.get(API_COLUMNAS_RECEPCION);
    setColumnasRecepcion(Array.isArray(data) ? data : []);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchColumnasDespacho(), fetchColumnasRecepcion()]);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudieron cargar las columnas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authorized") {
      fetchAll();
    }
  }, [authStatus]);

  // ==========================
  // FILTROS
  // ==========================
  const columnasDespachoFiltradas = useMemo(() => {
    const qq = (qDespacho || "").toLowerCase().trim();
    if (!qq) return columnasDespacho;

    return columnasDespacho.filter((c) => {
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
  }, [columnasDespacho, qDespacho]);

  const columnasRecepcionFiltradas = useMemo(() => {
    const qq = (qRecepcion || "").toLowerCase().trim();
    if (!qq) return columnasRecepcion;

    return columnasRecepcion.filter((c) => {
      const haystack = [
        c.nombre,
        c.key,
        c.unidad,
        c.totalizable ? "totalizable" : "no totalizable",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(qq);
    });
  }, [columnasRecepcion, qRecepcion]);

  // ==========================
  // RESETS
  // ==========================
  const resetFormDespacho = () => {
    setFormDespacho(initialFormDespacho);
    setEditingIdDespacho(null);
  };

  const resetFormRecepcion = () => {
    setFormRecepcion(initialFormRecepcion);
    setEditingIdRecepcion(null);
  };

  // ==========================
  // CRUD DESPACHO
  // ==========================
  const handleSubmitDespacho = async () => {
    if (!formDespacho.nombre.trim()) {
      Swal.fire("Falta información", "El nombre es obligatorio", "warning");
      return;
    }

    if (!formDespacho.key.trim()) {
      Swal.fire("Falta información", "La key es obligatoria", "warning");
      return;
    }

    if (
      !Array.isArray(formDespacho.rolesDigitables) ||
      formDespacho.rolesDigitables.length === 0
    ) {
      Swal.fire("Falta información", "Asigna al menos un rol", "warning");
      return;
    }

    const payload = {
      nombre: formDespacho.nombre.trim(),
      key: normalizarKey(formDespacho.key),
      unidad: (formDespacho.unidad || "").trim(),
      totalizable: Boolean(formDespacho.totalizable),
      rolesDigitables: formDespacho.rolesDigitables.map((r) =>
        String(r).toLowerCase().trim()
      ),
    };

    try {
      setLoading(true);

      if (editingIdDespacho) {
        await axios.put(`${API_COLUMNAS_DESPACHO}/${editingIdDespacho}`, payload);
        Swal.fire("Actualizado", "La columna de despacho se actualizó correctamente", "success");
      } else {
        await axios.post(API_COLUMNAS_DESPACHO, payload);
        Swal.fire("Creada", "La columna de despacho se creó correctamente", "success");
      }

      resetFormDespacho();
      await fetchColumnasDespacho();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "No se pudo guardar la columna de despacho";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDespacho = (col) => {
    setEditingIdDespacho(col._id);
    setFormDespacho({
      nombre: col.nombre ?? "",
      key: col.key ?? "",
      unidad: col.unidad ?? "",
      totalizable: Boolean(col.totalizable),
      rolesDigitables: Array.isArray(col.rolesDigitables)
        ? col.rolesDigitables
        : ["developer"],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDespacho = async (col) => {
    const res = await Swal.fire({
      title: "¿Desactivar columna de despacho?",
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
      await axios.delete(`${API_COLUMNAS_DESPACHO}/${col._id}`);
      Swal.fire("OK", "Columna de despacho desactivada", "success");
      await fetchColumnasDespacho();

      if (editingIdDespacho === col._id) resetFormDespacho();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo desactivar la columna de despacho";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // CRUD RECEPCION
  // ==========================
  const handleSubmitRecepcion = async () => {
    if (!formRecepcion.nombre.trim()) {
      Swal.fire("Falta información", "El nombre es obligatorio", "warning");
      return;
    }

    if (!formRecepcion.key.trim()) {
      Swal.fire("Falta información", "La key es obligatoria", "warning");
      return;
    }

    const payload = {
      nombre: formRecepcion.nombre.trim(),
      key: normalizarKey(formRecepcion.key),
      unidad: (formRecepcion.unidad || "").trim(),
      totalizable: Boolean(formRecepcion.totalizable),
    };

    try {
      setLoading(true);

      if (editingIdRecepcion) {
        await axios.put(`${API_COLUMNAS_RECEPCION}/${editingIdRecepcion}`, payload);
        Swal.fire("Actualizado", "La columna de recepción se actualizó correctamente", "success");
      } else {
        await axios.post(API_COLUMNAS_RECEPCION, payload);
        Swal.fire("Creada", "La columna de recepción se creó correctamente", "success");
      }

      resetFormRecepcion();
      await fetchColumnasRecepcion();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "No se pudo guardar la columna de recepción";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecepcion = (col) => {
    setEditingIdRecepcion(col._id);
    setFormRecepcion({
      nombre: col.nombre ?? "",
      key: col.key ?? "",
      unidad: col.unidad ?? "",
      totalizable: Boolean(col.totalizable),
    });

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleDeleteRecepcion = async (col) => {
    const res = await Swal.fire({
      title: "¿Desactivar columna de recepción?",
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
      await axios.delete(`${API_COLUMNAS_RECEPCION}/${col._id}`);
      Swal.fire("OK", "Columna de recepción desactivada", "success");
      await fetchColumnasRecepcion();

      if (editingIdRecepcion === col._id) resetFormRecepcion();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo desactivar la columna de recepción";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // TABLAS
  // ==========================
  const renderTablaDespacho = () => (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell><b>Nombre</b></TableCell>
            <TableCell><b>Key</b></TableCell>
            <TableCell><b>Unidad</b></TableCell>
            <TableCell><b>Totalizable</b></TableCell>
            <TableCell><b>Roles digitables</b></TableCell>
            <TableCell align="center"><b>Acciones</b></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {columnasDespachoFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {loading ? "Cargando..." : "No hay columnas de despacho"}
              </TableCell>
            </TableRow>
          ) : (
            columnasDespachoFiltradas.map((c) => (
              <TableRow key={c._id} hover selected={editingIdDespacho === c._id}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell><Chip size="small" label={c.key} /></TableCell>
                <TableCell>{c.unidad || "—"}</TableCell>
                <TableCell>
                  {c.totalizable ? (
                    <Chip size="small" label="Sí" />
                  ) : (
                    <Chip size="small" label="No" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  {Array.isArray(c.rolesDigitables) && c.rolesDigitables.length > 0
                    ? c.rolesDigitables.join(", ")
                    : "developer"}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton color="primary" onClick={() => handleEditDespacho(c)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Desactivar">
                    <IconButton color="error" onClick={() => handleDeleteDespacho(c)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTablaRecepcion = () => (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell><b>Nombre</b></TableCell>
            <TableCell><b>Key</b></TableCell>
            <TableCell><b>Unidad</b></TableCell>
            <TableCell><b>Totalizable</b></TableCell>
            <TableCell align="center"><b>Acciones</b></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {columnasRecepcionFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {loading ? "Cargando..." : "No hay columnas de recepción"}
              </TableCell>
            </TableRow>
          ) : (
            columnasRecepcionFiltradas.map((c) => (
              <TableRow key={c._id} hover selected={editingIdRecepcion === c._id}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell><Chip size="small" label={c.key} /></TableCell>
                <TableCell>{c.unidad || "—"}</TableCell>
                <TableCell>
                  {c.totalizable ? (
                    <Chip size="small" label="Sí" />
                  ) : (
                    <Chip size="small" label="No" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton color="primary" onClick={() => handleEditRecepcion(c)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Desactivar">
                    <IconButton color="error" onClick={() => handleDeleteRecepcion(c)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

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
              Gestión de Columnas de Alcoholes
            </Typography>

            <Tooltip title="Recargar todo">
              <IconButton onClick={fetchAll} disabled={loading}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* ========================================= */}
          {/* DESPACHO */}
          {/* ========================================= */}
          <Box mb={5}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Columnas de despacho
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Nombre visible"
                  value={formDespacho.nombre}
                  onChange={(e) =>
                    setFormDespacho((p) => ({ ...p, nombre: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Key (ej: energia_con)"
                  value={formDespacho.key}
                  onChange={(e) =>
                    setFormDespacho((p) => ({ ...p, key: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Unidad"
                  value={formDespacho.unidad}
                  onChange={(e) =>
                    setFormDespacho((p) => ({ ...p, unidad: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formDespacho.totalizable}
                      onChange={(e) =>
                        setFormDespacho((p) => ({
                          ...p,
                          totalizable: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Totalizable"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Roles que pueden digitar"
                  value={formDespacho.rolesDigitables}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      selected?.length ? selected.join(", ") : "—",
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormDespacho((p) => ({
                      ...p,
                      rolesDigitables: Array.isArray(value) ? value : [value],
                    }));
                  }}
                >
                  {ROLES.map((rol) => (
                    <MenuItem key={rol} value={rol}>
                      {rol}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color={editingIdDespacho ? "warning" : "primary"}
                    startIcon={editingIdDespacho ? <SaveIcon /> : <AddIcon />}
                    onClick={handleSubmitDespacho}
                    disabled={loading}
                  >
                    {editingIdDespacho ? "Actualizar despacho" : "Crear despacho"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={resetFormDespacho}
                    disabled={loading}
                  >
                    {editingIdDespacho ? "Cancelar edición" : "Limpiar"}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              mt={3}
              mb={2}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Listado de columnas de despacho
              </Typography>

              <TextField
                size="small"
                label="Buscar en despacho"
                value={qDespacho}
                onChange={(e) => setQDespacho(e.target.value)}
                sx={{ minWidth: 240 }}
              />
            </Box>

            {renderTablaDespacho()}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* ========================================= */}
          {/* RECEPCION */}
          {/* ========================================= */}
          <Box>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Columnas de recepción
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Nombre visible"
                  value={formRecepcion.nombre}
                  onChange={(e) =>
                    setFormRecepcion((p) => ({ ...p, nombre: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Key (ej: densidad)"
                  value={formRecepcion.key}
                  onChange={(e) =>
                    setFormRecepcion((p) => ({ ...p, key: e.target.value }))
                  }
                  helperText={`Se guardará como: ${normalizarKey(formRecepcion.key) || "—"}`}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Unidad"
                  value={formRecepcion.unidad}
                  onChange={(e) =>
                    setFormRecepcion((p) => ({ ...p, unidad: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formRecepcion.totalizable}
                      onChange={(e) =>
                        setFormRecepcion((p) => ({
                          ...p,
                          totalizable: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Totalizable"
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color={editingIdRecepcion ? "warning" : "primary"}
                    startIcon={editingIdRecepcion ? <SaveIcon /> : <AddIcon />}
                    onClick={handleSubmitRecepcion}
                    disabled={loading}
                  >
                    {editingIdRecepcion ? "Actualizar recepción" : "Crear recepción"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={resetFormRecepcion}
                    disabled={loading}
                  >
                    {editingIdRecepcion ? "Cancelar edición" : "Limpiar"}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              mt={3}
              mb={2}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Listado de columnas de recepción
              </Typography>

              <TextField
                size="small"
                label="Buscar en recepción"
                value={qRecepcion}
                onChange={(e) => setQRecepcion(e.target.value)}
                sx={{ minWidth: 240 }}
              />
            </Box>

            {renderTablaRecepcion()}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}