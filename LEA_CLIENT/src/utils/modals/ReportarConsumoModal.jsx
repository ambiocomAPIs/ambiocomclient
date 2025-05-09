import React from 'react';
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

export default function ReportarConsumoModal({ open, onClose, onSubmit, data = [] }) {
  const [formData, setFormData] = React.useState({});

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
          ObservacionesAdicionales: selectedProduct.ObservacionesAdicionales || '',
          SAP: selectedProduct.SAP || 0  // Asignar automáticamente el valor de SAP
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
          ObservacionesAdicionales: selectedLote.ObservacionesAdicionales || '',
          SAP: selectedLote.SAP || 0  // Asignar automáticamente el valor de SAP
        }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Calcular costoMensual
      const costoMensual = formData.Costo * formData.ConsumoAReportar;

      // Asegurarse de enviar todos los datos con el nuevo campo
      const updateInventoryResponse = await axios.post('http://localhost:4041/api/registro/movimientos', {
        TipoOperación: formData.TipoOperación,
        Producto: formData.Producto,
        Lote: formData.Lote,
        Inventario: formData.Inventario - formData.ConsumoAReportar,  // Disminuir el inventario por el consumo reportado
        Unidad: formData.Unidad,
        Costo: formData.Costo,
        Proveedor: formData.Proveedor,
        Responsable: formData.Responsable,
        Area: formData.Area,
        ConsumoAReportar: formData.ConsumoAReportar,  // Asegurarse de que este campo esté incluido
        costoMensual: costoMensual,
        ObservacionesAdicionales: formData.ObservacionesAdicionales || 'Sin observacion',  // Cambié a "ObservacionesAdicionales"
        SAP: formData.SAP || 0
      });

      // Registrar el movimiento
      const registerMovementResponse = await axios.post('http://localhost:4041/api/table/data/reportar-operacion', formData);

      // Si ambos procesos fueron exitosos, mostrar el mensaje
      alert('Inventario actualizado y movimiento registrado con éxito');

      // Usamos setTimeout para esperar a que el usuario cierre el alert
      setTimeout(() => {
        window.location.reload(); // Refresca la página después de que se cierre el alert
      }, 10); // Delay muy corto para hacer el refresco justo después de que el alert se cierre

      onSubmit(formData);
      if (typeof onClose === 'function') onClose();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar inventario y registrar movimiento');
    }
  };

  const handleCancel = () => {
    if (typeof onClose === 'function') onClose();
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

          {/* Nuevo campo de texto para Observación Adicional (se expande a todo el ancho del modal) */}
          <Grid item xs={12}>
            <TextField
              label="Observaciones Adicionales"
              multiline
              rows={4}  // Puedes ajustar el número de filas según el espacio necesario
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
        <Button variant="contained" onClick={handleSubmit}>Reportar</Button>
      </DialogActions>

      <Grid container justifyContent="center" style={{ padding: '10px' }}>
        <img src="/ambiocom.png" alt="Logo" style={{ maxHeight: '50px' }} />
      </Grid>
    </Dialog>
  );
}
