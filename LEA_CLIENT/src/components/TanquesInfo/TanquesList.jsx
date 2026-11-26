import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  TextField,
  Chip,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  Edit,
  Delete,
  AddCircleOutline,
  SortByAlpha,
  Visibility,
  Search,
  Opacity,
  LockOutlined,
} from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../utils/Context/AuthContext/AuthContext"; // Ajustar ruta relativa si corresponde
import TanquesModal from "./Modals/TanquesModal";
import TanqueVisualModal from "./Modals/TanqueVisualModal";

const TanquesList = ({ tanquesContext }) => {
  const { rol, isAuth, loadingAuth } = useAuth();
  const autenticado = isAuth && !loadingAuth;
  const puedeEditarTodo = autenticado && rol === "developer";
  const puedeEditarGrado = autenticado && ["developer", "laboratorio"].includes(rol);
  const puedeEditarDisposicion = autenticado && ["developer", "analistadecostoseinventarios"].includes(rol);
  const [guardandoCampo, setGuardandoCampo] = useState(false);
  const [tanques, setTanques] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTanque, setSelectedTanque] = useState(null);
  const [visualModalOpen, setVisualModalOpen] = useState(false);
  const [tanqueSeleccionadoVisual, setTanqueSeleccionadoVisual] = useState("");
  const [operacionEjecutada, setOperacionEjecutada] = useState("");
  const [search, setSearch] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);

  useEffect(() => {
    if (tanquesContext && tanquesContext.length > 0) {
      setTanques(tanquesContext);
    }
  }, [tanquesContext]);

  const fetchTanques = async () => {
    try {
      const res = await axios.get("http://localhost:4041/api/tanques", {
        withCredentials: true,
      });

      setTanques(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(
        "Error cargando tanques:",
        error.response?.data || error
      );

      Swal.fire("Error", "No se pudieron cargar los tanques", "error");
    }
  };

  useEffect(() => {
    if (!tanquesContext || tanquesContext.length === 0) {
      fetchTanques();
    }
  }, [tanquesContext]);

  const handleCreate = () => {
    if (!puedeEditarTodo) return;
    setSelectedTanque(null);
    setOperacionEjecutada("create");
    setModalOpen(true);
  };

  const handleOpenVisual = (nombreTanque) => {
    setTanqueSeleccionadoVisual(nombreTanque);
    setVisualModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (!puedeEditarTodo) return;
    try {
      const { _id, ...dataLimpia } = data;

      if (data._id && operacionEjecutada === "update") {
        const res = await axios.put(
          `http://localhost:4041/api/tanques/${data._id}`,
          dataLimpia,
          {
            withCredentials: true,
          }
        );

        const tanqueActualizado = res?.data ?? {
          ...data,
          ...dataLimpia,
        };

        setTanques((prev) =>
          prev.map((t) =>
            t._id === data._id ? tanqueActualizado : t
          )
        );

        Swal.fire(
          "Actualizado",
          "Tanque actualizado correctamente",
          "success"
        );
      } else {
        const res = await axios.post(
          "http://localhost:4041/api/tanques",
          dataLimpia,
          {
            withCredentials: true,
          }
        );

        const tanqueCreado = res?.data;

        if (tanqueCreado?._id) {
          setTanques((prev) => [...prev, tanqueCreado]);
        } else {
          await fetchTanques();
        }

        Swal.fire(
          "Creado",
          "Tanque registrado correctamente",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "Error guardando tanque:",
        error.response?.data || error
      );

      if (error.response?.status === 400) {
        Swal.fire(
          "Error",
          error.response?.data?.error || "Los datos ingresados no son válidos",
          "error"
        );
      } else if (error.response?.status === 401) {
        Swal.fire(
          "Sesión no autorizada",
          "Tu sesión expiró o no fue posible validar la autenticación",
          "warning"
        );
      } else if (error.response?.status === 403) {
        Swal.fire(
          "Sin permisos",
          "Tu usuario no tiene permisos para modificar tanques",
          "warning"
        );
      } else {
        Swal.fire(
          "Error",
          error.response?.data?.error || "No se pudo guardar el tanque",
          "error"
        );
      }
    } finally {
      setModalOpen(false);
      setSelectedTanque(null);
      setOperacionEjecutada("");
    }
  };

  const handleDelete = async (id) => {
    if (!puedeEditarTodo) return;
    const CLAVE_ELIMINAR = import.meta.env.VITE_DELETE_PASSWORD;

    const { value: password } = await Swal.fire({
      title: "Eliminar tanque",
      text: "Ingresa la contraseña para continuar",
      icon: "warning",
      input: "password",
      inputPlaceholder: "Escribe la contraseña",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Validar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      reverseButtons: true,
      focusCancel: true,
      inputValidator: (value) => {
        if (!value) {
          return "Debes ingresar la contraseña";
        }

        if (value !== CLAVE_ELIMINAR) {
          return "La contraseña es incorrecta";
        }

        return null;
      },
    });

    if (!password || password !== CLAVE_ELIMINAR) return;

    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:4041/api/tanques/${id}`,
          {
            withCredentials: true,
          }
        );

        setTanques((prev) =>
          prev.filter((t) => t._id !== id)
        );

        Swal.fire(
          "Eliminado",
          "Tanque eliminado correctamente",
          "success"
        );
      } catch (error) {
        console.error(
          "Error eliminando tanque:",
          error.response?.data || error
        );

        if (error.response?.status === 401) {
          Swal.fire(
            "Sesión no autorizada",
            "Tu sesión expiró o no fue posible validar la autenticación",
            "warning"
          );
        } else if (error.response?.status === 403) {
          Swal.fire(
            "Sin permisos",
            "Tu usuario no tiene permisos para eliminar tanques",
            "warning"
          );
        } else {
          Swal.fire(
            "Error",
            "No se pudo eliminar el tanque",
            "error"
          );
        }
      }
    }
  };

  // Edición puntual: se envía exclusivamente el campo autorizado.
  const handleEditarCampo = async (tanque, campo) => {
    const esGrado = campo === "GradoAlcoholico";
    const esDisposicion = campo === "Disposicion";
    if (guardandoCampo || !tanque?._id ||
      !((esGrado && puedeEditarGrado) || (esDisposicion && puedeEditarDisposicion))) return;

    setGuardandoCampo(true);
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: esGrado ? "Actualizar grado alcohólico" : "Actualizar disposición",
        text: `Tanque TK-${tanque.NombreTanque}`,
        input: "text",
        inputValue: tanque[campo] ?? "",
        inputAttributes: esGrado ? { inputmode: "decimal" } : {},
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#254b76",
        inputValidator: (entrada) => {
          const texto = String(entrada ?? "").trim();
          if (!texto) return "Ingresa un valor";
          if (esGrado) {
            const numero = Number(texto.replace(",", "."));
            if (!/^\d+(?:[.,]\d+)?$/.test(texto) || !Number.isFinite(numero) || numero < 0 || numero > 100) {
              return "Ingresa un grado válido entre 0 y 100";
            }
          }
          return undefined;
        },
      });
      if (!isConfirmed) return;

      const nuevoValor = esGrado
        ? Number(String(value).trim().replace(",", "."))
        : String(value).trim();

      await axios.put(
        `http://localhost:4041/api/tanques/${tanque._id}`,
        { [campo]: nuevoValor },
        { withCredentials: true }
      );

      setTanques((prev) => prev.map((t) =>
        t._id === tanque._id ? { ...t, [campo]: nuevoValor } : t
      ));
      await fetchTanques();
    } catch (error) {
      console.error("Error actualizando campo:", error.response?.data || error);
      Swal.fire("No se pudo actualizar", error.response?.data?.error ||
        "Verifica los permisos y la respuesta del servidor", "error");
    } finally {
      setGuardandoCampo(false);
    }
  };

  const tanquesFiltrados = useMemo(() => {
    return [...tanques]
      .filter((t) =>
        String(t?.NombreTanque ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) =>
        ordenAsc
          ? String(a?.NombreTanque ?? "").localeCompare(
              String(b?.NombreTanque ?? ""),
              "es",
              { numeric: true }
            )
          : String(b?.NombreTanque ?? "").localeCompare(
              String(a?.NombreTanque ?? ""),
              "es",
              { numeric: true }
            )
      );
  }, [tanques, search, ordenAsc]);

  return (
    <Box p={{ xs: 1.5, md: 2.5 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1,
          mt: 4.5,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          background:
            "linear-gradient(135deg, rgba(227,242,253,0.95) 0%, rgba(248,250,252,1) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary.dark"
            >
              Gestión de Tanques
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              mt={0.5}
            >
              Consulta, edición y visualización técnica de tanques
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              icon={puedeEditarTodo || puedeEditarGrado || puedeEditarDisposicion ? <Edit /> : <LockOutlined />}
              label={puedeEditarTodo ? "Edición general" : puedeEditarGrado ? "Edición de grado" : puedeEditarDisposicion ? "Edición de disposición" : "Solo consulta"}
              sx={{ bgcolor: "#edf3fa", color: "#254b76", fontWeight: 700 }}
            />
          {puedeEditarTodo && <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutline />}
            onClick={handleCreate}
            sx={{
              borderRadius: 2,
              px: 2.2,
              py: 1,
              fontWeight: 700,
              boxShadow: 2,
            }}
          >
            Nuevo Tanque
          </Button>}
          </Stack>
        </Stack>
      </Paper>

      {/* Filtro y orden */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
          >
            <Autocomplete
              options={tanques.map(
                (t) => `TK-${t.NombreTanque}`
              )}
              onInputChange={(e, value) =>
                setSearch(
                  String(value || "").replace("TK-", "")
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar tanque"
                  variant="outlined"
                  size="medium"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 35,
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>

                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{
                width: {
                  xs: "100%",
                  md: 320,
                },
              }}
            />

            <Tooltip
              title={`Ordenar ${
                ordenAsc ? "Z → A" : "A → Z"
              }`}
            >
              <IconButton
                color="primary"
                onClick={() => setOrdenAsc(!ordenAsc)}
                sx={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 2,
                  height: 35,
                  width: 45,
                }}
              >
                <SortByAlpha />
              </IconButton>
            </Tooltip>
          </Stack>

          <Chip
            icon={<Opacity />}
            label={`${tanquesFiltrados.length} tanque(s)`}
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 700,
              alignSelf: {
                xs: "flex-start",
                md: "center",
              },
            }}
          />
        </Stack>
      </Paper>

      {/* Tabla */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          maxHeight: "calc(70vh - 25px)",
          overflow: "auto",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Table stickyHeader size="small" sx={{
          minWidth: 1000,
          "& .MuiTableCell-root": { borderColor: "#e5ebf2", fontSize: 12.5, py: 1 },
          "& .MuiTableHead-root .MuiTableCell-root": { color: "#29496b", fontWeight: 700 },
          "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": { bgcolor: "#f8fafc" },
        }}>
          <TableHead>
            <TableRow sx={{ "& .MuiTableCell-root": { height: 38, boxSizing: "border-box", py: 0, lineHeight: "18px" } }}>
              <TableCell
                align="center"
                colSpan={3}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  backgroundColor: "#e7eff8",
                }}
              >
                <strong>Información</strong>
              </TableCell>

              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  backgroundColor: "#edf0f7",
                }}
              >
                <strong>Factores</strong>
              </TableCell>

              <TableCell
                align="center"
                colSpan={2}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  backgroundColor: "#e8f2ee",
                }}
              >
                <strong>Volumen</strong>
              </TableCell>

              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  backgroundColor: "#eef3f8",
                  minWidth: 100,
                }}
              >
                <strong>Visual</strong>
              </TableCell>

              <TableCell
                align="center"
                rowSpan={2}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  backgroundColor: "#edf1f6",
                  minWidth: 120,
                }}
              >
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>

            <TableRow>
              {[
                "Nombre del Tanque",
                "Disposición [Uso Actual]",
                "Grado Alcohólico [% v/v]",
                "Factor [L/m]",
                "Factor [L/cm]",
                "Volumen Total [L]",
                "Volumen Total [m³]",
              ].map((text, i) => (
                <TableCell
                  align="center"
                  key={i}
                  sx={{
                    position: "sticky",
                    top: 38,
                    zIndex: 2,
                    backgroundColor: "#f5f8fc",
                  }}
                >
                  <strong>{text}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {tanquesFiltrados.map((t) => (
              <TableRow
                key={t._id}
                hover
                sx={{
                  "&:hover": {
                    backgroundColor:
                      "rgba(25, 118, 210, 0.03)",
                  },
                }}
              >
                <TableCell align="center">
                  <Chip
                    label={`TK-${t.NombreTanque}`}
                    color="primary"
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      minWidth: 90,
                    }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    <Typography sx={{ fontSize: 12.5 }}>{t.Disposicion || "N/A"}</Typography>
                    {puedeEditarDisposicion && (
                      <Tooltip title="Editar disposición">
                        <span>
                          <IconButton size="small" aria-label={`Editar disposición de ${t.NombreTanque}`} disabled={guardandoCampo} onClick={() => handleEditarCampo(t, "Disposicion")} sx={{ color: "#42678c" }}>
                            <Edit fontSize="inherit" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                <TableCell align="center">
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    <Typography sx={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>
                  {t.GradoAlcoholico !== null &&
                  t.GradoAlcoholico !== undefined &&
                  t.GradoAlcoholico !== "" &&
                  !Number.isNaN(Number(t.GradoAlcoholico))
                    ? `${Number(
                        t.GradoAlcoholico
                      ).toLocaleString("es-CO", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })} %`
                    : "N/A"}
                    </Typography>
                    {puedeEditarGrado && (
                      <Tooltip title="Editar grado alcohólico">
                        <span>
                          <IconButton size="small" aria-label={`Editar grado de ${t.NombreTanque}`} disabled={guardandoCampo} onClick={() => handleEditarCampo(t, "GradoAlcoholico")} sx={{ color: "#42678c" }}>
                            <Edit fontSize="inherit" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                <TableCell align="center">
                  {t.Factor ?? "N/A"}
                </TableCell>

                <TableCell align="center">
                  {t.Factor
                    ? (Number(t.Factor) / 100).toFixed(2)
                    : "N/A"}
                </TableCell>

                <TableCell align="center">
                  {t.VolumenTotal
                    ? `${t.VolumenTotal} L`
                    : "N/A"}
                </TableCell>

                <TableCell align="center">
                  {t.VolumenTotal
                    ? `${(
                        Number(t.VolumenTotal) / 1000
                      ).toFixed(2)} m³`
                    : "N/A"}
                </TableCell>

                <TableCell align="center">
                  <Tooltip
                    title={`Visualizar tanque TK-${t.NombreTanque}`}
                  >
                    <IconButton
                      color="info"
                      onClick={() =>
                        handleOpenVisual(t.NombreTanque)
                      }
                      sx={{
                        border:
                          "1px solid rgba(2,136,209,0.25)",
                        backgroundColor:
                          "rgba(2,136,209,0.06)",
                        "&:hover": {
                          backgroundColor:
                            "rgba(2,136,209,0.14)",
                        },
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                <TableCell align="center">
                  {puedeEditarTodo ? (
                    <>
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        if (!puedeEditarTodo) return;
                        setSelectedTanque(t);
                        setOperacionEjecutada("update");
                        setModalOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleDelete(t._id)
                      }
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                      {puedeEditarGrado || puedeEditarDisposicion ? "Edición puntual" : "Solo lectura"}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {tanquesFiltrados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                  >
                    No se encontraron tanques.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modales */}
      <TanquesModal
        open={modalOpen && puedeEditarTodo}
        onClose={() => {
          setModalOpen(false);
          setSelectedTanque(null);
          setOperacionEjecutada("");
        }}
        onSubmit={handleSubmit}
        initialData={selectedTanque}
      />

      <TanqueVisualModal
        open={visualModalOpen}
        onClose={() =>
          setVisualModalOpen(false)
        }
        nombreTanque={tanqueSeleccionadoVisual}
      />
    </Box>
  );
};

export default TanquesList;