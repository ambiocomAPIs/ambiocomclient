import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const tipos = ['HED', 'HEN', 'HEFD', 'HEFN', 'HFD', 'HFN', 'RN'];

const PanelHoras = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Estado para guardar horas extras activas por usuario
  // Ejemplo: { cedula: { tipo: 'HED', inicio: Date } }
  const [horasExtrasActivas, setHorasExtrasActivas] = useState({});

  // Contraseña de administrador para agregar usuarios
  const contraseñaAdmin = 'admin123'; // Cambia esta contraseña si quieres

  useEffect(() => {
    fetchDatos();
  }, [mes, anio]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      // Supongamos que tu API recibe mes y anio como query params para filtrar
      const response = await axios.get('https://ambiocomserver.onrender.com/api/usuarios/obtenerUsuarioHorasExtras', {
        params: { mes, anio }
      });
      setUsuarios(response.data); // Asumes que la API te devuelve el array filtrado
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDatos();
  }, [mes, anio]);

  // Función para registrar entrada de horas extras
  const entrarUsuario = async (usuario) => {
    if (horasExtrasActivas[usuario.cedula]) {
      Swal.fire('Error', 'Ya tienes una sesión de horas extras activa.', 'error');
      return;
    }

    const { value: tipo } = await Swal.fire({
      title: 'Selecciona tipo de hora extra',
      input: 'select',
      inputOptions: tipos.reduce((acc, t) => {
        acc[t] = t;
        return acc;
      }, {}),
      inputPlaceholder: 'Selecciona un tipo',
      showCancelButton: true,
    });

    if (!tipo) return;

    // Guarda la hora de inicio actual para ese usuario y tipo
    setHorasExtrasActivas(prev => ({
      ...prev,
      [usuario.cedula]: { tipo, inicio: new Date() },
    }));

    Swal.fire('Registrado', `Hora extra ${tipo} iniciada para ${usuario.nombre} a las ${new Date().toLocaleTimeString()}`, 'success');

    // Mensaje adicional: Feliz turno con nombre completo
    Swal.fire('Feliz turno', `${usuario.nombre}`, 'info');
  };

  // Función para registrar salida y calcular horas (modificada para mostrar detalle)
  const salirUsuario = async (usuario) => {
    const activa = horasExtrasActivas[usuario.cedula];
    if (!activa) {
      Swal.fire('Error', 'No tienes una sesión activa de horas extras.', 'error');
      return;
    }

    const confirmar = await Swal.fire({
      icon: 'question',
      title: `Hola ${usuario.nombre}, ¿es hora de salir?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'No',
    });

    if (!confirmar.isConfirmed) return;

    const fin = new Date();
    const inicio = new Date(activa.inicio);
    const diffMs = fin - inicio;
    const diffHoras = diffMs / (1000 * 60 * 60); // horas con decimales

    // Acumula en el usuario el tiempo calculado (si quieres seguir acumulando)
    setUsuarios(prevUsuarios =>
      prevUsuarios.map(u => {
        if (u.cedula === usuario.cedula) {
          const actualizadas = { ...u };
          actualizadas[activa.tipo] = (actualizadas[activa.tipo] ?? 0) + diffHoras;
          return actualizadas;
        }
        return u;
      })
    );

    // Limpia la sesión activa
    setHorasExtrasActivas(prev => {
      const copy = { ...prev };
      delete copy[usuario.cedula];
      return copy;
    });

    // Prepara resumen recargos solo para la sesión actual
    // Solo el tipo activa, si no tiene valor se pone 0
    const resumenRecargos = tipos.reduce((acc, t) => {
      acc[t] = (t === activa.tipo ? diffHoras.toFixed(2) : '0');
      return acc;
    }, {});

    // Muestra mensaje con hora inicio-fin, total y resumen recargos
    Swal.fire({
      title: 'Turno finalizado',
      html: `
        <p><strong>Desde:</strong> ${inicio.toLocaleTimeString()}</p>
        <p><strong>Hasta:</strong> ${fin.toLocaleTimeString()}</p>
        <p><strong>Total horas trabajadas:</strong> ${diffHoras.toFixed(2)} h</p>
        <p><strong>Recargos (solo del turno):</strong></p>
        <ul style="list-style:none; padding-left: 0;">
          ${tipos.map(t => `<li>${t}: ${resumenRecargos[t]}</li>`).join('')}
        </ul>
      `,
      icon: 'info',
    });
  };

  // Función para agregar nuevo usuario (valida contraseña admin primero)
  const agregarUsuario = async () => {
    // Primero pedir contraseña admin
    const { value: pass } = await Swal.fire({
      title: 'Ingrese contraseña de administrador',
      input: 'password',
      inputLabel: 'Contraseña',
      inputPlaceholder: 'Ingresa la contraseña',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
    });
  
    if (!pass) return; // Canceló
  
    if (pass !== contraseñaAdmin) {
      Swal.fire('Error', 'Contraseña incorrecta', 'error');
      return;
    }
  
    // Mostrar formulario para agregar usuario
    const { value: formValues } = await Swal.fire({
      title: 'Agregar nuevo usuario',
      html:
        `<div style="display: flex; flex-direction: column; gap: 12px; font-family: Arial, sans-serif; font-size: 14px;">
          <input id="nombre" class="swal2-input" placeholder="Nombre completo" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
          <select id="tipoDocumento" class="swal2-select" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
           <option value="Cédula">Cédula</option>
           <option value="Pasaporte">Pasaporte</option>
           <option value="Otro">Otro</option>
          </select>
          <input id="documento" class="swal2-input" placeholder="Número de documento" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
          <input id="cargo" class="swal2-input" placeholder="Cargo" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
          <input id="grupoAsignado" class="swal2-input" placeholder="Grupo Asignado" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
          <label for="fechaNacimiento" style="font-weight: 600; margin-bottom: 0px;">Fecha de nacimiento</label>
         <input id="fechaNacimiento" type="date" class="swal2-input" style="padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value.trim();
        const tipoDocumento = document.getElementById('tipoDocumento').value;
        const documento = document.getElementById('documento').value.trim();
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        const cargo = document.getElementById('cargo').value.trim();
        const grupoAsignado = document.getElementById('grupoAsignado').value.trim();
  
        if (!nombre || !documento || !fechaNacimiento || !cargo || !grupoAsignado) {
          Swal.showValidationMessage('Por favor, completa todos los campos');
          return null;
        }
  
        return { nombre, tipoDocumento, documento, fechaNacimiento, cargo, grupoAsignado };
      },
    });
  
    if (!formValues) return;
  
    const nuevoUsuario = {
      cedula: formValues.documento,
      nombre: formValues.nombre,
      grupoAsignado: formValues.grupoAsignado,
      mes,
      anio,
      HED: 0,
      HEN: 0,
      HEFD: 0,
      HEFN: 0,
      HFD: 0,
      HFN: 0,
      RN: 0,
      tipoDocumento: formValues.tipoDocumento,
      fechaNacimiento: formValues.fechaNacimiento,
      cargo: formValues.cargo,
    };
  
    try {
      const response = await axios.post('https://ambiocomserver.onrender.com/api/usuarios/crearUsuarioHorasExtras', nuevoUsuario);
        setUsuarios(prev => [...prev, response.data]);
        fetchDatos();
      Swal.fire('Usuario agregado', `${formValues.nombre} ha sido agregado exitosamente.`, 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al agregar el usuario en la base de datos.', 'error');
    }
  };
  const exportExcel = () => {
    const data = usuarios.map(({ cedula, nombre, ...horas }) => ({
      Cédula: cedula,
      Nombre: nombre,
      ...tipos.reduce((acc, tipo) => {
        acc[tipo] = horas[tipo] ?? 0;
        return acc;
      }, {}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Horas');
    XLSX.writeFile(workbook, `Horas_Trabajadas_${mes}_${anio}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Horas Trabajadas - ${mes}/${anio}`, 14, 20);

    const head = [['Cédula', 'Nombre', ...tipos]];
    const body = usuarios.map(({ cedula, nombre, ...horas }) => [
      cedula,
      nombre,
      ...tipos.map(t => (horas[t] ?? 0).toFixed(2)),
    ]);

    doc.autoTable({
      head,
      body,
      startY: 30,
    });

    doc.save(`Horas_Trabajadas_${mes}_${anio}.pdf`);
  };

  const getEstiloGrupo = (grupo) => {
    switch (grupo) {
      case 'A':
        return { color: 'black', backgroundColor: '#f9f965' }; // Azul
      case 'B':
        return { color: 'black', backgroundColor: '#b1d3e8 ' }; // Verde
      case 'C':
        return { color: 'black', backgroundColor: '#c9e8b1' }; // Naranja
      case 'D':
        return { color: 'black', backgroundColor: '#e4e0f5 ' }; // Rojo
      default:
        return {};
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel de Control de Horas Extras</h2>
      <div style={{ marginBottom: 10 }}>
        <label>
          Mes:{' '}
          <select value={mes} onChange={e => setMes(Number(e.target.value))}>
            {[...Array(12).keys()].map(i => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 20 }}>
          Año:{' '}
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[2024, 2025, 2026].map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button onClick={fetchDatos} disabled={loading} style={{ marginLeft: 20 }}>
          {loading ? 'Cargando...' : 'Filtrar'}
        </button>
      </div>

      <button
        onClick={agregarUsuario}
        style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}
      >
        Agregar Usuario
      </button>
      <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#eee' }}>
          <tr>
            <th>Cédula</th>
            <th >Nombre</th>
            <th >Grupo</th>
            {tipos.map(tipo => (
              <th key={tipo}>{tipo}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
      {loading ? (
       <p style={{ textAlign: 'center', marginTop: 20 }}>Cargando usuarios...</p>
        ) : usuarios.length === 0 ? (
       <p style={{ textAlign: 'center', marginTop: 20 }}>Aún no se han creado registros.</p>
        ) : (
        <tbody>
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={tipos.length + 3} style={{ textAlign: 'center' }}>
                No hay datos
              </td>
            </tr>
          )}
          {[...usuarios]
           .sort((a, b) => a.grupoAsignado.toLowerCase().localeCompare(b.grupoAsignado.toLowerCase()))
           .map(usuario => (
            <tr key={`${usuario.cedula}-${usuario.grupoAsignado}`}>
              <td>{usuario.cedula}</td>
              <td style={getEstiloGrupo(usuario.grupoAsignado)}>{usuario.nombre}</td>
              <td style={getEstiloGrupo(usuario.grupoAsignado)}>{usuario.grupoAsignado}</td>
              {tipos.map(tipo => (
                <td key={tipo}>{(usuario[tipo] ?? 0).toFixed(2)}</td>
              ))}
              <td>
                {!horasExtrasActivas[usuario.cedula] ? (
                  <button
                    onClick={() => entrarUsuario(usuario)}
                    style={{ backgroundColor: '#2980b9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Entrar
                  </button>
                ) : (
                  <button
                    onClick={() => salirUsuario(usuario)}
                    style={{ backgroundColor: '#c0392b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Salir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      )} 
      </table>
     {/* fin condicion loading */}
      <div style={{ marginTop: 20 }}>
        <button onClick={exportExcel} style={{ marginRight: 10 }}>
          Exportar Excel
        </button>
        <button onClick={exportPDF}>Exportar PDF</button>
      </div>
    </div>
  );
};

export default PanelHoras;
