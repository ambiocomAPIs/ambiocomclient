import React, {useState} from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';

import Swal from 'sweetalert2'

export default function ReportarConsumoModal({ open, onClose, onSubmit, data = [] }) {
  const [formData, setFormData] = React.useState({});
  const [Fecha, setFecha] = useState('');

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSelectProduct = (event, value) => {
    if (value) {
      const selectedProduct = data.find(item => item.nombre === value.nombre);
      if (selectedProduct) {
        setFormData((prev) => ({
          ...prev,
          Producto: selectedProduct.nombre || '',
          Lote: selectedProduct.lote || '',
          Inventario: selectedProduct.Inventario || '',
          Unidad: selectedProduct.unidad || '',
          Costo: selectedProduct.ValorUnitario || '',
          Proveedor: selectedProduct.proveedor || '',
          Responsable: selectedProduct.responsable || '',
          Area: selectedProduct.area || '',
          ObservacionesAdicionales: selectedProduct.ObservacionesAdicionales || 'Ninguna',
          SAP: selectedProduct.SAP || 0,
          cantidadIngreso: selectedProduct.cantidadIngreso || 0
        }));
      }
    }
  };

  const handleSelectLote = (event, value) => {
    if (value) {
      const selectedLote = data.find(item => item.lote === value.lote);
      if (selectedLote) {
        setFormData((prev) => ({
          ...prev,
          Producto: selectedLote.nombre || '',
          Lote: selectedLote.lote || '',
          Inventario: selectedLote.Inventario || '',
          Unidad: selectedLote.unidad || '',
          Costo: selectedLote.ValorUnitario || '',
          Proveedor: selectedLote.proveedor || '',
          Responsable: selectedLote.responsable || '',
          Area: selectedLote.area || '',
          ObservacionesAdicionales: selectedLote.ObservacionesAdicionales || 'Ninguna',
          SAP: selectedLote.SAP || 0,
          cantidadIngreso: selectedProduct.cantidadIngreso || 0
        }));
      }
    }
  };

  const handleSubmit = async () => {
    const cantidad = Number(formData.ConsumoAReportar) || 0;
    const inventarioActual = Number(formData.Inventario) || 0;
    const costoUnitario = Number(formData.Costo) || 0;
    const tipoOperacion = formData.TipoOperación;
    // const Fecha = new Date().toISOString().split('T')[0];
    
    let nuevoInventario = inventarioActual;
    let cantidadReportadaMovimiento = cantidad;
    let cantidadParaBaseDeDatos = cantidad;
    let costoMensual = 0;
  
    // Validar tipo de operación
    if (tipoOperacion === 'Consumo de Material') {
      // Validación de consumo de material
      if (cantidad > inventarioActual) {
        alert('No puedes consumir más del inventario disponible.');
        return;
      }
  
      // Calcular el nuevo inventario y otras variables asociadas
      nuevoInventario = inventarioActual - cantidad;
      cantidadReportadaMovimiento = -cantidad;
      cantidadParaBaseDeDatos = cantidad;
      costoMensual = costoUnitario * cantidad;
    } else if (tipoOperacion === 'Ingreso Material') {
      // Calcular el nuevo inventario y otras variables asociadas para ingreso de material
      nuevoInventario = inventarioActual + cantidad;
      cantidadReportadaMovimiento = cantidad;
      cantidadParaBaseDeDatos = cantidad;
      costoMensual = 0;
    } else {
      // Si no es una operación válida, salimos de la función
      alert('Tipo de operación no válido');
      return;
    }
  
    let movimientoRegistrado = false;
    let baseActualizada = false;
  
    // Verificar si la fecha está definida
    if (Fecha=="") {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Por favor selecciona una fecha antes de continuar.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      onClose()
      return;
    }
  
    try {
      // 1. Registrar movimiento
      await axios.post('http://localhost:4041/api/registro/movimientos', {
        TipoOperación: tipoOperacion,
        Producto: formData.Producto,
        Lote: formData.Lote,
        Inventario: nuevoInventario,
        Unidad: formData.Unidad,
        Costo: costoUnitario,
        Proveedor: formData.Proveedor,
        Responsable: formData.Responsable,
        Area: formData.Area,
        ConsumoAReportar: cantidadReportadaMovimiento,
        costoMensual: costoMensual,
        ObservacionesAdicionales: formData.ObservacionesAdicionales || 'Sin observacion',
        SAP: formData.SAP || 0,
        ConsumoMensual: cantidadParaBaseDeDatos,
        GastoMensual: costoMensual,
        fechaMovimiento: Fecha,
        cantidadIngreso: formData.cantidadIngreso
      });
      movimientoRegistrado = true;
  
      // 2. Actualizar base de datos
      await axios.post('http://localhost:4041/api/table/data/reportar-operacion', {
        ...formData,
        ConsumoAReportar: cantidadParaBaseDeDatos,
        Inventario: nuevoInventario
      });
      baseActualizada = true;
  
      // 3. Mostrar resultado final
      if (movimientoRegistrado && baseActualizada) {
        alert('Inventario actualizado y movimiento registrado con éxito');
        // onSubmit(formData);
        // if (typeof onClose === 'function') onClose();
        setTimeout(() => window.location.reload(), 10);
      }
    } catch (error) {
      console.error(error);
  
      // Mostrar alerta más específica
      if (!movimientoRegistrado && !baseActualizada) {
        alert('Error al registrar el movimiento y actualizar la base de datos');
      } else if (!movimientoRegistrado) {
        alert('Base de datos actualizada, pero falló al registrar el movimiento');
      } else if (!baseActualizada) {
        alert('Movimiento registrado, pero falló al actualizar la base de datos');
      } else {
        alert('Error inesperado al procesar la operación');
      }
    }
  };
  
  
  const handleCancel = () => {
    if (typeof onClose === 'function') onClose();
  };

  
  const handleChangeFecha = (e) => {
    setFecha(e.target.value);
    console.log("fecha seleccionada consumos:", e.target.value);
  };

  const filteredData = data.filter(item => item.activo !== false);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        Reportar Consumo / Ingreso
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginTop: 5 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Tipo de Operación</InputLabel>
              <Select
                value={formData['TipoOperación'] || ''}
                onChange={(event) => {
                  setFormData({ ...formData, TipoOperación: event.target.value });
                }}
                label="Tipo de Operación"
              >
                <MenuItem value="Consumo de Material">Consumo de Material</MenuItem>
                <MenuItem value="Ingreso Material">Ingreso Material</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredData}
              getOptionLabel={(option) => option.nombre || ''}
              value={filteredData.find(item => item.nombre === formData.Producto) || null}
              onChange={handleSelectProduct}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredData}
              getOptionLabel={(option) => option.lote || ''}
              value={filteredData.find(item => item.lote === formData.Lote) || null}
              onChange={handleSelectLote}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lote"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Grid>

          {[ 
            { label: 'Inventario', key: 'Inventario' },
            { label: 'Unidad', key: 'Unidad' },
            { label: 'Costo Unitario', key: 'Costo' },
            { label: 'Proveedor', key: 'Proveedor' },
            { label: 'Responsable', key: 'Responsable' },
            { label: 'Área', key: 'Area' },
            { label: 'Consumo a Reportar', key: 'ConsumoAReportar' },
          ].map(({ label, key, type = 'text' }, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <TextField
                label={label}
                type={type}
                fullWidth
                variant="outlined"
                value={formData[key] || ''}
                onChange={handleInputChange(key)}
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <TextField
              label="Observaciones Adicionales"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={formData['ObservacionesAdicionales'] || ''}
              onChange={handleInputChange('ObservacionesAdicionales')}
            />
          </Grid>

        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancelar</Button>
        <input 
           type="date" 
           value={Fecha} 
           onChange={handleChangeFecha} 
           max={new Date().toLocaleDateString('en-CA')}  // maximo hoy
           style={{
            padding: '10px 12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
            outline: 'none',
            transition: 'border-color 0.2s ease-in-out',
           }}
           onFocus={(e) => (e.target.style.borderColor = '#007bff')}
           onBlur={(e) => (e.target.style.borderColor = '#ccc')}
          />
        <Button variant="contained" onClick={handleSubmit}>Reportar</Button>
      </DialogActions>
      <Grid container justifyContent="center" style={{ padding: '10px' }}>
        <img src="/ambiocom.png" alt="Logo" style={{ maxHeight: '50px' }} />
      </Grid>
    </Dialog>
  );
}
