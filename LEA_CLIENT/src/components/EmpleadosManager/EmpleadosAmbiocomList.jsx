import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel,
  MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import Draggable from 'react-draggable';
import PaperComponent from '@mui/material/Paper';
import axios from 'axios';

function PaperDraggable(props) {
  return (
    <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

function EmpleadosManager() {
  const [empleados, setEmpleados] = useState([]); // siempre inicializar como []
  const [open, setOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoActual, setEmpleadoActual] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    correo: '',
    grupo: '',
    area: '',
    cargo: '',
    activo: true,
    foto: undefined,
  });

  const fetchEmpleados = async () => {
    try {
      const { data } = await axios.get('https://ambiocomserver.onrender.com/api/empleadosambiocom');
      setEmpleados(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleOpen = async () => {
    const { value: password } = await Swal.fire({
      title: 'Contraseña de administrador',
      input: 'password',
      inputLabel: 'Ingrese la contraseña',
      inputPlaceholder: 'Contraseña',
      inputAttributes: {
        maxlength: 20,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true
    });

    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setModoEdicion(false);
      setEmpleadoActual({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        correo: '',
        grupo: '',
        area: '',
        cargo: '',
        activo: true,
        foto: undefined,
      });
      setOpen(true);
    } else if (password) {
      Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpleadoActual(prev => ({ ...prev, [name]: value }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setEmpleadoActual(prev => ({ ...prev, foto: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const guardarEmpleado = async () => {
    try {
      if (modoEdicion) {
        await axios.put(`https://ambiocomserver.onrender.com/api/empleadosambiocom/${empleadoActual._id}`, empleadoActual);
        Swal.fire('Actualizado', 'Empleado actualizado correctamente', 'success');
      } else {
        await axios.post('https://ambiocomserver.onrender.com/api/empleadosambiocom', empleadoActual);
        Swal.fire('Registrado', 'Empleado registrado correctamente', 'success');
      }
      fetchEmpleados();
      handleClose();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      Swal.fire('Error', 'No se pudo guardar el empleado', 'error');
    }
  };

  const editarEmpleado = (emp) => {
    setEmpleadoActual(emp);
    setModoEdicion(true);
    setOpen(true);
  };

  const eliminarEmpleado = async (id) => {
    const confirmar = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará al empleado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirmar.isConfirmed) {
      try {
        await axios.delete(`
https://ambiocomserver.onrender.com/api/empleadosambiocom/${id}`);
        fetchEmpleados();
        Swal.fire('Eliminado', 'Empleado eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire('Error', 'No se pudo eliminar el empleado', 'error');
      }
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 2, mt: 6 }}>
      <Button variant="contained" sx={{ mb: 1, alignSelf: 'flex-start' }} onClick={handleOpen}>Nuevo Empleado</Button>
      <TableContainer component={Paper} sx={{
        mt: 2, flexGrow: 1,
        overflowY: 'auto',
        maxHeight: '100%',
      }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell align="center">Foto</TableCell>
              <TableCell align="center">Nombre</TableCell>
              <TableCell align="center">Apellido</TableCell>
              <TableCell align="center">Área</TableCell>
              <TableCell align="center">Grupo</TableCell>
              <TableCell align="center">Cargo</TableCell>
              <TableCell align="center">Activo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(empleados) && empleados.map(emp => (
              <TableRow key={emp._id}>
                <TableCell align="center">
                  {emp.foto ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={emp.foto}
                        alt="foto"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #ccc',
                        }}
                        onMouseEnter={(e) => {
                          const preview = document.createElement('div');
                          preview.style.position = 'absolute';
                          preview.style.top = '50px';
                          preview.style.left = '50%';
                          preview.style.transform = 'translateX(-50%)';
                          preview.style.border = '1px solid #ccc';
                          preview.style.padding = '4px';
                          preview.style.backgroundColor = '#fff';
                          preview.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.2)';
                          preview.style.zIndex = 10;
                          preview.innerHTML = `<img src="${emp.foto}" style="width:120px;height:120px;border-radius:8px;object-fit:cover;" />`;
                          preview.className = 'foto-preview';

                          e.currentTarget.parentElement.appendChild(preview);
                        }}
                        onMouseLeave={(e) => {
                          const preview = e.currentTarget.parentElement.querySelector('.foto-preview');
                          if (preview) preview.remove();
                        }}
                      />
                    </Box>
                  ) : (
                    'Sin foto'
                  )}
                </TableCell>
                <TableCell align="center">{emp.nombre}</TableCell>
                <TableCell align="center">{emp.apellido}</TableCell>
                <TableCell align="center">{emp.area}</TableCell>
                <TableCell align="center">{emp.grupo}</TableCell>
                <TableCell align="center">{emp.cargo}</TableCell>
                <TableCell align="center" sx={{ color: emp.activo ? "green" : "red" }}><strong>{emp.activo ? 'Sí' : 'No'}</strong></TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => editarEmpleado(emp)}
                    sx={{ minWidth: 'auto', padding: '2px 6px', fontWeight: 'bold' }}
                  >
                    Editar
                  </Button>
                  <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => eliminarEmpleado(emp._id)}
                    sx={{ minWidth: 'auto', padding: '2px 6px', fontWeight: 'bold' }}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperDraggable}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
          {modoEdicion ? 'Editar Empleado' : 'Nuevo Empleado'}
        </DialogTitle>
        <DialogContent>
          <TextField margin="dense" name="nombre" label="Nombre" fullWidth value={empleadoActual.nombre} onChange={handleChange} />
          <TextField margin="dense" name="apellido" label="Apellido" fullWidth value={empleadoActual.apellido} onChange={handleChange} />
          <TextField margin="dense" name="cedula" label="Cédula" fullWidth value={empleadoActual.cedula} onChange={handleChange} />
          <TextField margin="dense" name="telefono" label="Teléfono" fullWidth value={empleadoActual.telefono} onChange={handleChange} />
          <TextField margin="dense" name="correo" label="Correo Empresarial" fullWidth value={empleadoActual.correo} onChange={handleChange} />
          <FormControl fullWidth margin="dense">
            <InputLabel id="grupo-label">Grupo</InputLabel>
            <Select
              labelId="grupo-label"
              name="grupo"
              value={empleadoActual.grupo}
              label="Grupo"
              onChange={handleChange}
            >
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
              <MenuItem value="NO APLICA">NO APLICA</MenuItem>
            </Select>
          </FormControl>
          <TextField margin="dense" name="area" label="Área" fullWidth value={empleadoActual.area} onChange={handleChange} />
          <TextField margin="dense" name="cargo" label="Cargo" fullWidth value={empleadoActual.cargo} onChange={handleChange} />
          <FormControlLabel
            control={
              <Switch checked={empleadoActual.activo} onChange={e => setEmpleadoActual(prev => ({ ...prev, activo: e.target.checked }))} />
            }
            label="Activo"
          />
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Subir Foto
            <input type="file" hidden accept="image/*" onChange={handleFoto} />
          </Button>
          {empleadoActual.foto && (
            <Box sx={{ mt: 1 }}>
              <img src={empleadoActual.foto} alt="Foto" style={{ width: 80, height: 80, borderRadius: 8 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={guardarEmpleado} variant="contained">{modoEdicion ? 'Guardar Cambios' : 'Registrar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmpleadosManager;
