import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Snackbar, Alert } from "@mui/material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  IconButton,
  Autocomplete,
} from "@mui/material";

import ExcelJS from "exceljs";
import { format, parseISO, isValid } from "date-fns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const ModalFilterMovimientos = ({ open, onClose, usuario }) => {
  const [selectedVariable, setSelectedVariable] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [noDataMessage, setNoDataMessage] = useState("");

  // Nuevos estados para edición
  const [editableResponsable, setEditableResponsable] = useState("");
  const [editableArea, setEditableArea] = useState("");
  const [editableOpciones, setEditableOpciones] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");


  const showErrorMessage = (message) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "https://ambiocomserver.onrender.com/api/registro/movimientos"
      );
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener los datos", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter(
        (key) => !["_id", "createdAt", "updatedAt", "__v"].includes(key)
      );
      setAvailableKeys(keys);
      setFilteredData(data);
    }
  }, [data]);

  const handleSelectChange = (event) => {
    setSelectedVariable(event.target.value);
  };

  const handleInputChange = (event, value) => {
    setFilterValue(value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const filterByDate = (date) => {
    return data.filter((item) => {
      return item.fechaMovimiento?.slice(0, 10) === date;
    });
  };

  const filterByMonthYear = (month, year) => {
    return data.filter((item) => {
      const itemMonthYear = item.fechaMovimiento?.slice(0, 7); // solo me trae 2025-05
      return itemMonthYear === `${year}-${month}`;
    });
  };

  const applyAllFilters = () => {
    let filtered = data;

    if (selectedDate) {
      filtered = filterByDate(selectedDate);
    }

    if (selectedMonth && selectedYear) {
      filtered = filterByMonthYear(selectedMonth, selectedYear);
    }

    if (selectedVariable && filterValue) {
      filtered = filtered.filter((item) =>
        item[selectedVariable]?.toString().includes(filterValue)
      );
    }

    if (filtered.length === 0) {
      setNoDataMessage("No hay datos que coincidan con los filtros aplicados.");
    } else {
      setNoDataMessage("");
    }

    if (editableOpciones) {
      // Definir las equivalencias entre opciones visibles y claves reales
      const equivalencias = {
        "Consumo Material": ["Consumo Material", "Consumo de Insumo"],
        "Ingreso Material": ["Ingreso Material", "Ingreso Insumo"],
      };

      // Buscar las claves según lo que se seleccionó
      const clavesFiltrar = equivalencias[editableOpciones] || [editableOpciones];

      // Filtrar si coincide con alguna de las claves
      filtered = filtered.filter((item) =>
        clavesFiltrar.includes(item.tipoOperacion)
      );
    }

    if (editableArea) {
      filtered = filtered.filter(
        (item) => item.area?.toString() === editableArea
      );
    }

    if (editableResponsable) {
      filtered = filtered.filter(
        (item) => item.responsable?.toString() == editableResponsable
      );
    }
    setFilteredData(filtered);
  };

  const showAllData = () => {
    setSelectedVariable("");
    setFilterValue("");
    setSelectedDate("");
    setSelectedMonth("");
    setSelectedYear("");
    setFilteredData(data);
    setNoDataMessage("");
  };

  const formatDate = (date) => {
    if (!date) return "";

    let parsedDate;

    if (typeof date === "string") {
      parsedDate = new Date(date); // más flexible que parseISO
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      return "";
    }

    if (!isValid(parsedDate)) return "";

    return format(parsedDate, "dd/MM/yyyy HH:mm");
  };

  const formatCurrency = (amount) => {
    if (amount !== undefined && amount !== null) {
      return `$${Math.abs(amount)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    return "$0.00";
  };

  const exportarMovimientosExcel = async () => {
    // 1. Crear un nuevo workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Movimientos");
    // 2. Definir las columnas
    worksheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Unidad", key: "unidad", width: 10 },
      { header: "Inventario", key: "inventario", width: 15 },
      {
        header: "Costo Unitario",
        key: "costoUnitario",
        width: 15,
        style: { numFmt: '"$"#,##0.00' },
      },
      { header: "Tipo de Operacion", key: "tipoOperacion", width: 25 },
      { header: "Consumo", key: "consumo", width: 15 },
      {
        header: "Costo Total",
        key: "costoTotal",
        width: 20,
        style: { numFmt: '"$"#,##0.00' },
      },
      { header: "Cantidad De Ingreso", key: "cantidadIngreso", width: 20 },
      {
        header: "Costo Total En Ingreso",
        key: "CostoIngreso",
        width: 20,
        style: { numFmt: '"$"#,##0.00' },
      },
      { header: "Responsable", key: "responsable", width: 30 },
      { header: "Área", key: "area", width: 25 },
      { header: "Lote", key: "lote", width: 25 },
      { header: "Proveedor", key: "proveedor", width: 25 },
      { header: "Observaciones", key: "observaciones", width: 150 },
    ];

    // 3. Agregar los datos
    data.forEach((item) => {
      const row = worksheet.addRow({
        fecha: item.fechaMovimiento,
        producto: item.producto || "----",
        unidad: item.unidad || "----",
        inventario: item.inventario || "----",
        costoUnitario: item.costoUnitario || "----",
        tipoOperacion: item.tipoOperacion || "----",
        consumo: item.consumoReportado || "----",
        costoTotal: item.CostoMovimiento || "----",
        cantidadIngreso: item.cantidadIngreso || "----",
        CostoIngreso: item.cantidadIngreso * item.costoUnitario || "----",
        responsable: item.responsable || "----",
        area: item.area || "----",
        lote: item.lote || "----",
        proveedor: item.proveedor || "----",
        observaciones: item.ObservacionesAdicionales || "----",
      });

      // Estilo rojo si "consumo" es negativo
      const consumoCell = row.getCell("consumo");
      if (item.consumoReportado < 0) {
        consumoCell.font = { color: { argb: "FFFF0000" } }; // rojo
      }
    });

    // 4. Estilizar cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0077CC" }, // Color de la cabecera
    };

    // 5. Estilizar las filas de datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" }, // Fondo blanco para las filas de datos
            // Elimina la configuración de fondo para que se use el fondo predeterminado de Excel
          };
        });
      }
    });

    // Proteger la hoja
    worksheet.protect("ambiocom", {
      selectLockedCells: false, // Deshabilitar la selección de celdas protegidas
      selectUnlockedCells: false, // Permitir la selección de celdas no protegidas
    });

    // 6. Exportar (en navegador)
    const buffer = await workbook.xlsx.writeBuffer();

    // 7. Crear archivo descargable
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "MovimientosInventario.xlsx";
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteMovimiento = async (id) => {
    onClose();
    try {
      // Primero confirmamos la acción
      const confirm = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará el movimiento permanentemente",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      // Pedir clave antes de eliminar
      const { value: clave } = await Swal.fire({
        title: "Ingrese la clave de seguridad",
        input: "password",
        inputPlaceholder: "Clave requerida",
        inputAttributes: {
          maxlength: 20,
          autocapitalize: "off",
          autocorrect: "off",
        },
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      });

      // Verificar clave (puedes reemplazar "1234" por lo que quieras, o validar con backend)
      if (clave !== import.meta.env.VITE_ADMIN_PASSWORD) {
        Swal.fire({
          icon: "error",
          title: "Clave incorrecta",
          text: "No tienes permisos para eliminar este movimiento",
        });
        return;
      }
      await axios.delete(
        `https://ambiocomserver.onrender.com/api/registro/movimientos/${id}`
      );

      fetchData(); // refrescar lista
      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El movimiento fue eliminado correctamente",
        confirmButtonText: "OK", // aseguramos que tenga botón
      }).then((result) => {
        if (result.isConfirmed) {
          setOpenModal(true); // 👉 esto se ejecuta solo cuando se da OK
        }
      });
    } catch (error) {
      onClose();
      console.error("Error al eliminar el movimiento", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el movimiento",
      });
    }
  };

  const renderItem = (item, index) => {
    const { _id, ...displayItem } = item;
    const costoMovimiento =
      Math.abs(displayItem.consumoReportado || 0) *
      Math.abs(displayItem.costoUnitario || 0);

    return (
      <div key={index} style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "8px" }}>
          {availableKeys.map((key) => (
            <div key={key} style={{ marginBottom: "8px" }}>
              <strong>{key}:</strong>
              <span style={{ fontWeight: "bold", marginLeft: "8px" }}>
                {displayItem[key] || "No disponible"}
              </span>
            </div>
          ))}
        </div>
        <div>
          <strong>Fecha Movimiento:</strong> {formatDate(item.fechaMovimiento)}
        </div>
        <div>
          <strong>Costo del Movimiento:</strong>{" "}
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {formatCurrency(costoMovimiento)}
          </span>
        </div>
        <hr
          style={{
            margin: "20px 0",
            borderColor: "#e0e0e0",
            borderWidth: "1px",
          }}
        />
      </div>
    );
  };

  return (
    <Dialog
      open={open || openModal}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: "center" }}>
        Filtrar Movimientos
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Variable */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Selecciona una variable</InputLabel>
              <Select
                value={selectedVariable}
                onChange={handleSelectChange}
                label="Selecciona una variable"
              >
                {availableKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
                <MenuItem value="allData">All Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Valor */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              fullWidth
              style={{ marginTop: 16 }}
              value={filterValue}
              onInputChange={handleInputChange}
              options={data.map((item) => item[selectedVariable])}
              disabled={
                !selectedVariable ||
                data.length === 0 ||
                !data.some((item) => item[selectedVariable])
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrar por"
                  variant="outlined"
                  placeholder="Escribe para filtrar..."
                />
              )}
              renderOption={(props, option) => <li {...props}>{option}</li>}
            />
          </Grid>

          {/* Fecha */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Filtrar por fecha"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              sx={{ marginTop: 2 }}
              InputProps={{
                startAdornment: (
                  <IconButton>
                    <CalendarTodayIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>

          {/* Mes / Año */}
          <Grid item xs={12} sm={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Mes</InputLabel>
                  <Select value={selectedMonth} onChange={handleMonthChange}>
                    {[
                      "01",
                      "02",
                      "03",
                      "04",
                      "05",
                      "06",
                      "07",
                      "08",
                      "09",
                      "10",
                      "11",
                      "12",
                    ].map((mes, i) => (
                      <MenuItem key={mes} value={mes}>
                        {new Date(0, i).toLocaleString("es", { month: "long" })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Año</InputLabel>
                  <Select value={selectedYear} onChange={handleYearChange}>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Campos editables */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Responsable"
              select
              value={editableResponsable}
              onChange={(e) => setEditableResponsable(e.target.value)}
            >
              <MenuItem value="">
                <em>Limpiar</em>
              </MenuItem>
              {[...new Set(data.map((item) => item.responsable))]
                .filter(Boolean) // filtra null/undefined
                .map((responsable, idx) => (
                  <MenuItem key={idx} value={responsable}>
                    {responsable}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Área"
              value={editableArea}
              onChange={(e) => setEditableArea(e.target.value)}
            >
              <MenuItem value="">
                <em>Limpiar</em>
              </MenuItem>
              {[...new Set(data.map((item) => item.area))]
                .filter(Boolean) // filtra null/undefined
                .map((area, idx) => (
                  <MenuItem key={idx} value={area}>
                    {area}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tipo de Operacion"
              select
              value={editableOpciones}
              onChange={(e) => setEditableOpciones(e.target.value)}
            >
              <MenuItem value="">Limpiar</MenuItem>
              <MenuItem value="Consumo de Material">
                Consumo de Material
              </MenuItem>
              <MenuItem value="Ingreso Material">Ingreso Material</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {/* Resultados */}
        <div style={{ marginTop: 20 }}>
          <h3>Movimientos filtrados:</h3>
          {noDataMessage ? (
            <p>{noDataMessage}</p>
          ) : filteredData.length > 0 ? (
            filteredData.map((item, index) => {
              const consumo = item.consumoReportado || 0;
              const costoMovimiento =
                Math.abs(consumo) * Math.abs(item.costoUnitario || 0);

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  {/* Render dinámico */}
                  {availableKeys.map((key) => (
                    <div key={key} style={{ marginBottom: "8px" }}>
                      <strong>{key}:</strong>{" "}
                      <span style={{ fontWeight: "bold", marginLeft: "8px" }}>
                        {item[key] || "No disponible"}
                      </span>
                    </div>
                  ))}

                  {/* Campos adicionales */}
                  <div>
                    <strong>Fecha Movimiento:</strong>{" "}
                    {formatDate(item.fechaMovimiento)}
                  </div>
                  <div>
                    <strong>Consumo Reportado:</strong>{" "}
                    <span
                      style={{
                        color: consumo < 0 ? "red" : "green",
                        fontWeight: "bold",
                      }}
                    >
                      {consumo}
                    </span>
                  </div>
                  <div>
                    <strong>Costo del Movimiento:</strong>{" "}
                    <span style={{ color: "blue", fontWeight: "bold" }}>
                      {formatCurrency(costoMovimiento)}
                    </span>
                  </div>

                  {/* Botón eliminar */}
                  <div style={{ marginTop: "-40px", textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (
                          !["developer"].includes(
                            usuario?.rol
                          )
                        ) {
                          showErrorMessage(
                            "Usted no tiene permisos para realizar esta acción. Consulte con el desarrollador."
                          );
                          return;
                        }
                        handleDeleteMovimiento(item._id);
                      }}
                    >
                      Eliminar
                    </Button>

                  </div>
                </div>
              );
            })
          ) : (
            <p>No hay movimientos que coincidan</p>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={exportarMovimientosExcel}
          endIcon={
            <img
              src={"/Icons/excelIcon.png"}
              alt="Excel Icon"
              style={{ width: 35, height: 35 }}
            />
          }
          color="success"
        >
          Exportar
        </Button>
        <Button
          onClick={() => {
            onClose(false), setOpenModal(false);
          }}
          color="secondary"
        >
          Cerrar
        </Button>
        <Button onClick={applyAllFilters} color="primary">
          Aplicar Filtro
        </Button>
        <Button onClick={showAllData} color="default">
          Ver toda la data
        </Button>
      </DialogActions>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Dialog>
  );
};

export default ModalFilterMovimientos;
