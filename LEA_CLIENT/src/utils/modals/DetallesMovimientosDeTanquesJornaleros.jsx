import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  Button, TextField, Select, MenuItem, InputLabel,
  FormControl, Grid, IconButton, Autocomplete
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const DetallesMovimientosDeTanquesJornaleros = ({ open, onClose }) => {
  const [selectedVariable, setSelectedVariable] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [noDataMessage, setNoDataMessage] = useState('');

  const [editableResponsable, setEditableResponsable] = useState('');
  const [editableArea, setEditableArea] = useState('');
  const [editableOpciones, setEditableOpciones] = useState('');

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:4041/api/reportar/veroperacionesdetanques');
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
        (key) => !['_id', 'createdAt', 'updatedAt', '__v'].includes(key)
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
    const formattedDate = format(parseISO(date), 'yyyy-MM-dd');
    return data.filter((item) => {
      const itemDate = item.createdAt ? format(parseISO(item.createdAt), 'yyyy-MM-dd') : '';
      return itemDate === formattedDate;
    });
  };

  const filterByMonthYear = (month, year) => {
    return data.filter((item) => {
      const itemMonthYear = item.createdAt ? format(parseISO(item.createdAt), 'MM/yyyy') : '';
      return itemMonthYear === `${month}/${year}`;
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
      setNoDataMessage('No hay datos que coincidan con los filtros aplicados.');
    } else {
      setNoDataMessage('');
    }

    setFilteredData(filtered);
  };

  const showAllData = () => {
    setSelectedVariable('');
    setFilterValue('');
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setFilteredData(data);
    setNoDataMessage('');
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    try {
      return format(parseISO(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount) => {
    if (amount !== undefined && amount !== null) {
      return `$${Math.abs(amount)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
    return '$0.00';
  };

  const renderItem = (item, index) => {
    const { _id, ...displayItem } = item;
    const costoMovimiento = Math.abs(displayItem.consumoReportado || 0) * Math.abs(displayItem.costoUnitario || 0);

    return (
      <div key={index} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px' }}>
          {availableKeys.map((key) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <strong>{key}:</strong>
              <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>
                {displayItem[key] !== null && displayItem[key] !== undefined
                  ? displayItem[key].toString()
                  : 'No disponible'}
              </span>
            </div>
          ))}
        </div>
        <div>
          <strong>Fecha Movimiento:</strong> {formatDate(item.createdAt)}
        </div>
        <hr style={{ margin: '20px 0', borderColor: '#e0e0e0', borderWidth: '1px' }} />
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>Filtrar Movimientos</DialogTitle>
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
                  <MenuItem key={key} value={key}>{key}</MenuItem>
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
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((mes, i) => (
                      <MenuItem key={mes} value={mes}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Año</InputLabel>
                  <Select value={selectedYear} onChange={handleYearChange}>
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
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
              value={editableResponsable}
              onChange={(e) => setEditableResponsable(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Área"
              value={editableArea}
              onChange={(e) => setEditableArea(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Opciones"
              value={editableOpciones}
              onChange={(e) => setEditableOpciones(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Resultados */}
        <div style={{ marginTop: 20 }}>
          <h3>Movimientos filtrados:</h3>
          {noDataMessage ? <p>{noDataMessage}</p> : (
            filteredData.length > 0 ? filteredData.map(renderItem) : <p>No hay movimientos que coincidan</p>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="secondary">Cerrar</Button>
        <Button onClick={applyAllFilters} color="primary">Aplicar Filtro</Button>
        <Button onClick={showAllData} color="default">Ver toda la data</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetallesMovimientosDeTanquesJornaleros;
