import { useState, useEffect } from "react";

import axios from "axios";

import {
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Button,
  Box,
  Autocomplete,
  Typography,
} from "@mui/material";

import Tooltip from "@mui/material/Tooltip";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

function HeaderForm({
  data,
  onChange,
  clearFieldsExceptFechaTurno,
  trabajadoresRegistradosContext,
}) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState(false);
  const [trabajadores, setTrabajadores] = useState([]);
  const [isFechaSelected, setIsFechaSelected] = useState(false);

  const [metaProduccionDia, setMetaProduccionDia] = useState("");
  const [produccionesDia, setProduccionesDia] = useState({});

  useEffect(() => {
    if (
      trabajadoresRegistradosContext &&
      Array.isArray(trabajadoresRegistradosContext)
    ) {
      const activos = trabajadoresRegistradosContext
        .filter((empleado) => empleado.activo !== false)
        .map((empleado) => ({
          label: `${empleado.nombre} ${empleado.apellido} (${empleado.cedula})`,
          value: `${empleado.nombre} ${empleado.apellido} (${empleado.cedula})`,
        }));

      setTrabajadores(activos);
    }
  }, [trabajadoresRegistradosContext]);

  useEffect(() => {
    if (data.fecha && data.fecha.trim() !== "") {
      setIsFechaSelected(true);
    } else {
      setIsFechaSelected(false);
    }
  }, [data.fecha]);

  const turnos = [
    {
      value: "TurnoMañana(6:00-14:00)",
      label: "Turno Mañana (6:00 - 14:00)",
      priority: 1,
    },
    {
      value: "TurnoTarde(14:00-22:00)",
      label: "Turno Tarde (14:00 - 22:00)",
      priority: 2,
    },
    {
      value: "TurnoNoche(22:00-06:00)",
      label: "Turno Noche (22:00 - 06:00)",
      priority: 3,
    },
    {
      value: "TurnoAdministrativo(07:30-17:30)",
      label: "Turno Administrativo (07:30 - 17:30)",
      priority: 4,
    },
    {
      value: "Turno12Horas(06:00-18:00)",
      label: "Turno 12Horas (06:00 - 18:00)",
      priority: 5,
    },
    {
      value: "Turno12Horas(18:00-06:00)",
      label: "Turno 12Horas (18:00 - 06:00)",
      priority: 6,
    },
  ];

  const turnoSeleccionado = turnos.find(
    (turno) => turno.value === data.turno
  );

  const prioridadTurno =
    turnoSeleccionado?.priority || null;

  const grupoProduccion =
    prioridadTurno >= 1 && prioridadTurno <= 3
      ? 1
      : prioridadTurno >= 5 && prioridadTurno <= 6
        ? 2
        : null;

  const puedeEditarMeta =
    prioridadTurno === 1 ||
    prioridadTurno === 5;

  const cantidadTurnosDia =
    grupoProduccion === 1
      ? 3
      : grupoProduccion === 2
        ? 2
        : 0;

  const getProduccionStorageKey = (
    fecha,
    grupo
  ) => {
    if (!fecha || !grupo) {
      return null;
    }

    return `bitacora-produccion-${fecha}-grupo-${grupo}`;
  };

  useEffect(() => {
    if (
      !data.fecha ||
      !data.turno ||
      !grupoProduccion
    ) {
      setMetaProduccionDia("");
      setProduccionesDia({});
      return;
    }

    try {
      const storageKey =
        getProduccionStorageKey(
          data.fecha,
          grupoProduccion
        );

      const registroGuardado =
        localStorage.getItem(storageKey);

      if (!registroGuardado) {
        setMetaProduccionDia("");
        setProduccionesDia({});
        return;
      }

      const registro =
        JSON.parse(registroGuardado);

      setMetaProduccionDia(
        registro.metaProduccionDia !==
          undefined
          ? registro.metaProduccionDia
          : ""
      );

      setProduccionesDia(
        registro.producciones &&
          typeof registro.producciones ===
          "object"
          ? registro.producciones
          : {}
      );
    } catch (error) {
      console.error(
        "Error cargando información de producción:",
        error
      );

      setMetaProduccionDia("");
      setProduccionesDia({});
    }
  }, [
    data.fecha,
    data.turno,
    grupoProduccion,
  ]);

  const produccionTurno =
    data.turno &&
      produccionesDia[data.turno] !==
      undefined
      ? produccionesDia[data.turno]
      : "";

  const metaProduccionNumerica =
    Number(metaProduccionDia) || 0;

  const produccionTurnoNumerica =
    Number(produccionTurno) || 0;

  const metaProduccionTurno =
    metaProduccionNumerica > 0 &&
      cantidadTurnosDia > 0
      ? metaProduccionNumerica /
      cantidadTurnosDia
      : 0;

  const produccionAcumuladaDia = turnos
    .filter((turno) => {
      if (!prioridadTurno) {
        return false;
      }

      if (grupoProduccion === 1) {
        return (
          turno.priority >= 1 &&
          turno.priority <= prioridadTurno
        );
      }

      if (grupoProduccion === 2) {
        return (
          turno.priority >= 5 &&
          turno.priority <= prioridadTurno
        );
      }

      return false;
    })
    .reduce((total, turno) => {
      return (
        total +
        (Number(
          produccionesDia[turno.value]
        ) || 0)
      );
    }, 0);

  const porcentajeCumplimientoTurno =
    metaProduccionTurno > 0
      ? (produccionTurnoNumerica /
        metaProduccionTurno) *
      100
      : 0;

  const porcentajeCumplimientoDia =
    metaProduccionNumerica > 0
      ? (produccionAcumuladaDia /
        metaProduccionNumerica) *
      100
      : 0;

  useEffect(() => {
    if (!grupoProduccion) {
      return;
    }

    onChange(
      "grupoProduccion",
      grupoProduccion
    );

    onChange(
      "metaProduccionDia",
      metaProduccionNumerica
    );

    onChange(
      "produccionTurno",
      produccionTurnoNumerica
    );

    onChange(
      "metaProduccionTurno",
      metaProduccionTurno
    );

    onChange(
      "produccionAcumuladaDia",
      produccionAcumuladaDia
    );

    onChange(
      "porcentajeCumplimientoTurno",
      porcentajeCumplimientoTurno
    );

    onChange(
      "porcentajeCumplimientoDia",
      porcentajeCumplimientoDia
    );
  }, [
    grupoProduccion,
    metaProduccionNumerica,
    produccionTurnoNumerica,
    metaProduccionTurno,
    produccionAcumuladaDia,
    porcentajeCumplimientoTurno,
    porcentajeCumplimientoDia,
  ]);

  const handleMetaProduccionChange = (
    event
  ) => {
    const value = event.target.value;

    setMetaProduccionDia(value);

    if (
      !data.fecha ||
      !grupoProduccion
    ) {
      return;
    }

    try {
      const storageKey =
        getProduccionStorageKey(
          data.fecha,
          grupoProduccion
        );

      const nuevoRegistro = {
        metaProduccionDia: value,
        producciones: produccionesDia,
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(nuevoRegistro)
      );
    } catch (error) {
      console.error(
        "Error guardando meta de producción:",
        error
      );
    }
  };

  const handleProduccionTurnoChange = (
    event
  ) => {
    const value = event.target.value;

    if (
      !data.fecha ||
      !data.turno ||
      !grupoProduccion
    ) {
      return;
    }

    const nuevasProducciones = {
      ...produccionesDia,
      [data.turno]: value,
    };

    setProduccionesDia(
      nuevasProducciones
    );

    try {
      const storageKey =
        getProduccionStorageKey(
          data.fecha,
          grupoProduccion
        );

      const nuevoRegistro = {
        metaProduccionDia,
        producciones:
          nuevasProducciones,
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(nuevoRegistro)
      );
    } catch (error) {
      console.error(
        "Error guardando producción del turno:",
        error
      );
    }
  };

  const formatearNumero = (numero) => {
    return Number(
      numero || 0
    ).toLocaleString("es-CO", {
      maximumFractionDigits: 2,
    });
  };

  const inputManualSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease",
    },

    "& .MuiInputLabel-root": {
      fontWeight: 600,
    },
  };

  const inputCalculadoSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor:
        "rgba(0, 0, 0, 0.035)",
    },

    "& .MuiInputLabel-root": {
      fontWeight: 600,
    },

    "& .MuiInputBase-input": {
      fontWeight: 600,
    },
  };

  const getCumplimientoSx = (
    porcentaje
  ) => {
    const base = {
      "& .MuiInputLabel-root": {
        fontWeight: 600,
      },

      "& .MuiInputBase-input": {
        fontWeight: 700,
        fontSize: "1.05rem",
      },
    };

    if (!metaProduccionNumerica) {
      return {
        ...base,

        "& .MuiOutlinedInput-root": {
          backgroundColor:
            "rgba(0, 0, 0, 0.035)",
        },
      };
    }

    if (porcentaje >= 95) {
      return {
        ...base,

        "& .MuiOutlinedInput-root": {
          backgroundColor:
            "rgba(46, 125, 50, 0.06)",
          transition:
            "all 0.2s ease",

          "& fieldset": {
            borderColor:
              "rgba(46, 125, 50, 0.45)",
          },

          "&:hover fieldset": {
            borderColor:
              "rgba(46, 125, 50, 0.65)",
          },
        },
      };
    }

    if (porcentaje >= 80) {
      return {
        ...base,

        "& .MuiOutlinedInput-root": {
          backgroundColor:
            "rgba(237, 108, 2, 0.06)",
          transition:
            "all 0.2s ease",

          "& fieldset": {
            borderColor:
              "rgba(237, 108, 2, 0.45)",
          },

          "&:hover fieldset": {
            borderColor:
              "rgba(237, 108, 2, 0.65)",
          },
        },
      };
    }

    return {
      ...base,

      "& .MuiOutlinedInput-root": {
        backgroundColor:
          "rgba(211, 47, 47, 0.05)",
        transition:
          "all 0.2s ease",

        "& fieldset": {
          borderColor:
            "rgba(211, 47, 47, 0.4)",
        },

        "&:hover fieldset": {
          borderColor:
            "rgba(211, 47, 47, 0.6)",
        },
      },
    };
  };

  const fields = [
    {
      label: "Fecha",
      key: "fecha",
      type: "date",
    },
    {
      label: "Turno",
      key: "turno",
      type: "select",
    },
    {
      label: "Supervisor",
      key: "supervisor",
      type: "autocomplete",
    },
    {
      label: "Op. Destilería",
      key: "op_destileria",
      type: "autocomplete",
    },
    {
      label: "Op. Caldera",
      key: "op_caldera",
      type: "autocomplete",
    },
    {
      label: "Op. Aguas",
      key: "op_aguas",
      type: "autocomplete",
    },
    {
      label: "Aux. Caldera",
      key: "aux_caldera",
      type: "autocomplete",
    },
    {
      label: "Analista 1",
      key: "analista1",
      type: "autocomplete",
    },
    {
      label: "Op. Rones",
      key: "analista2",
      type: "autocomplete",
      optional: true,
    },
  ];

  useEffect(() => {
    const fetchExistingData =
      async () => {
        if (
          !data.fecha ||
          !data.turno
        ) {
          return;
        }

        setIsLoading(true);

        try {
          const response =
            await axios.get(
              "https://ambiocomserver.onrender.com/api/bitacora/getbyfechayturno",
              {
                params: {
                  fecha: data.fecha,
                  turno: data.turno,
                },
              }
            );

          if (
            response.data &&
            response.data.length > 0
          ) {
            const existing =
              response.data[0];

            Object.keys(
              existing
            ).forEach((key) => {
              if (
                key in data &&
                existing[key] !==
                data[key]
              ) {
                onChange(
                  key,
                  existing[key]
                );
              }
            });

            setExistingRecord(true);

            setSnackbarMessage(
              "Datos existentes cargados"
            );

            setSnackbarSeverity("info");
            setSnackbarOpen(true);
          } else {
            setExistingRecord(false);

            clearFieldsExceptFechaTurno();

            setSnackbarMessage(
              "No hay datos registrados para esta fecha y turno."
            );

            setSnackbarSeverity("info");
            setSnackbarOpen(true);
          }
        } catch (err) {
          setExistingRecord(false);

          clearFieldsExceptFechaTurno();

          setSnackbarMessage(
            "No hay datos registrados para esta fecha y turno."
          );

          setSnackbarSeverity("info");
          setSnackbarOpen(true);

          console.error(
            "Error al cargar datos existentes:",
            err
          );
        } finally {
          setIsLoading(false);
        }
      };

    fetchExistingData();
  }, [data.fecha, data.turno]);

  const formatDateToLocalISO = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (
      !data.fecha ||
      !data.turno
    ) {
      setSnackbarMessage(
        "Fecha y Turno son obligatorios para guardar."
      );

      setSnackbarSeverity(
        "warning"
      );

      setSnackbarOpen(true);

      return;
    }

    try {
      const response =
        await axios.post(
          "https://ambiocomserver.onrender.com/api/bitacora/bitacorareplaceall",
          [data]
        );

      if (
        response.status === 200
      ) {
        setSnackbarMessage(
          "Datos guardados correctamente"
        );

        setSnackbarSeverity(
          "success"
        );

        setSnackbarOpen(true);
        setExistingRecord(true);
      }
    } catch (error) {
      console.error(error);

      setSnackbarMessage(
        "Error al guardar los datos"
      );

      setSnackbarSeverity(
        "error"
      );

      setSnackbarOpen(true);
    }
  };

  const getOptionsForField = (
    key
  ) => {
    if (key === "analista2") {
      return [
        {
          label: "NO APLICA",
          value: "NO APLICA",
        },
        ...trabajadores,
      ];
    }

    return trabajadores;
  };

  const isFormValid = fields
    .filter(
      (field) => !field.optional
    )
    .every((field) => {
      const val =
        data[field.key];

      return (
        val !== undefined &&
        val !== null &&
        val
          .toString()
          .trim() !== ""
      );
    });

  const handleBlockedFieldClick =
    () => {
      if (!isFechaSelected) {
        setSnackbarMessage(
          "Por favor, seleccione la fecha de reporte primero"
        );

        setSnackbarSeverity(
          "warning"
        );

        setSnackbarOpen(true);
      }
    };

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{
          marginBottom: 2,
          marginTop: 2,
        }}
      >
        {fields.map((field) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={field.key}
          >
            {field.type ===
              "select" ? (
              <FormControl
                fullWidth
                disabled={
                  !isFechaSelected
                }
                onClick={
                  handleBlockedFieldClick
                }
              >
                <InputLabel>
                  Turno
                </InputLabel>

                <Select
                  value={
                    data[
                    field.key
                    ] || ""
                  }
                  onChange={(e) =>
                    onChange(
                      field.key,
                      e.target.value
                    )
                  }
                  label="Turno"
                >
                  {turnos.map(
                    (turno) => (
                      <MenuItem
                        key={
                          turno.value
                        }
                        value={
                          turno.value
                        }
                      >
                        {
                          turno.label
                        }
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            ) : field.type ===
              "date" ? (
              <LocalizationProvider
                dateAdapter={
                  AdapterDateFns
                }
              >
                <DatePicker
                  label={
                    field.label
                  }
                  value={
                    data[
                      field.key
                    ]
                      ? new Date(
                        data[
                        field.key
                        ] +
                        "T00:00:00"
                      )
                      : null
                  }
                  onChange={(
                    newValue
                  ) => {
                    const isoDate =
                      newValue
                        ? formatDateToLocalISO(
                          newValue
                        )
                        : "";

                    onChange(
                      field.key,
                      isoDate
                    );
                  }}
                  renderInput={(
                    params
                  ) => (
                    <TextField
                      sx={{
                        width:
                          "100%",
                        display:
                          "block",
                      }}
                      {...params}
                      fullWidth
                    />
                  )}
                />
              </LocalizationProvider>
            ) : field.type ===
              "autocomplete" ? (
              <Autocomplete
                options={getOptionsForField(
                  field.key
                )}
                getOptionLabel={(
                  option
                ) =>
                  option.label || ""
                }
                value={
                  getOptionsForField(
                    field.key
                  ).find(
                    (opt) =>
                      opt.value ===
                      data[
                      field.key
                      ]
                  ) || null
                }
                onChange={(
                  e,
                  newValue
                ) =>
                  onChange(
                    field.key,
                    newValue
                      ? newValue.value
                      : ""
                  )
                }
                renderInput={(
                  params
                ) => (
                  <TextField
                    {...params}
                    label={
                      field.label
                    }
                    fullWidth
                    onClick={
                      !isFechaSelected
                        ? handleBlockedFieldClick
                        : undefined
                    }
                  />
                )}
                disableClearable={
                  false
                }
                disabled={
                  !isFechaSelected
                }
              />
            ) : (
              <TextField
                label={field.label}
                value={
                  data[field.key] ||
                  ""
                }
                onChange={(e) =>
                  onChange(
                    field.key,
                    e.target.value
                  )
                }
                fullWidth
                disabled={
                  !isFechaSelected
                }
                onClick={
                  !isFechaSelected
                    ? handleBlockedFieldClick
                    : undefined
                }
              />
            )}
          </Grid>
        ))}
      </Grid>

      {data.fecha &&
        data.turno &&
        grupoProduccion && (
          <Box
            sx={{
              mt: 3,
              mb: 2,
              p: 2.5,
              border:
                "1px solid",
              borderColor:
                "rgba(0, 0, 0, 0.08)",
              borderRadius: 3,
              backgroundColor:
                "rgba(0, 0, 0, 0.012)",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                mb: 1.5,
              }}
            >
              Control de Producción
            </Typography>

            <Grid
              container
              spacing={2}
              alignItems="stretch"
            >
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="Meta producción del día"
                  type="number"
                  value={
                    metaProduccionDia
                  }
                  onChange={
                    handleMetaProduccionChange
                  }
                  fullWidth
                  disabled={
                    !puedeEditarMeta
                  }
                  inputProps={{
                    min: 0,
                    step: "any",
                  }}
                  sx={
                    puedeEditarMeta
                      ? inputManualSx
                      : inputCalculadoSx
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="Producción del turno"
                  type="number"
                  value={
                    produccionTurno
                  }
                  onChange={
                    handleProduccionTurnoChange
                  }
                  fullWidth
                  inputProps={{
                    min: 0,
                    step: "any",
                  }}
                  sx={
                    inputManualSx
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="Meta estimada del turno"
                  value={
                    metaProduccionNumerica >
                      0
                      ? formatearNumero(
                        metaProduccionTurno
                      )
                      : ""
                  }
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={
                    inputCalculadoSx
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="% Cumplimiento turno"
                  value={
                    metaProduccionNumerica >
                      0
                      ? `${porcentajeCumplimientoTurno.toFixed(
                        1
                      )} %`
                      : ""
                  }
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={getCumplimientoSx(
                    porcentajeCumplimientoTurno
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="Producción acumulada día"
                  value={formatearNumero(
                    produccionAcumuladaDia
                  )}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={
                    inputCalculadoSx
                  }
                />
              </Grid>

              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <TextField
                  label="% Cumplimiento del día"
                  value={
                    metaProduccionNumerica >
                      0
                      ? `${porcentajeCumplimientoDia.toFixed(
                        1
                      )} %`
                      : ""
                  }
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={getCumplimientoSx(
                    porcentajeCumplimientoDia
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "center",
          mt: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={
            !isFormValid ||
            isLoading ||
            !isFechaSelected
          }
        >
          {existingRecord
            ? "Actualizar información"
            : "Guardar"}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbarOpen(false)
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() =>
            setSnackbarOpen(false)
          }
          severity={
            snackbarSeverity
          }
          sx={{
            width: "100%",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default HeaderForm;