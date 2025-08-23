import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Autocomplete, TextField } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const GraficoNivelesTanquesPorDiaPageComponente = ({NivelesTanquesContext}) => {

  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [datasetsHidden, setDatasetsHidden] = useState(false);
  const [viewMode, setViewMode] = useState("grafico");
  const [selectedTank, setSelectedTank] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartRef = useRef(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("usuario");
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }
  }, []);

     useEffect(() => {
      if (NivelesTanquesContext.length > 0) {
        setRegistros(NivelesTanquesContext);
        // setFilteredTanques(NivelesTanquesContext);
      }
    }, [NivelesTanquesContext]);

  // useEffect(() => {
  //   setIsLoading(true);
  //   axios
  //     .get('
https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros')
  //     .then((response) => {
  //       if (Array.isArray(response.data)) {
  //         setRegistros(response.data);
  //       } else {
  //         console.error('Respuesta inesperada del backend');
  //       }
  //       setIsLoading(false);
  //     })
  //     .catch((err) => {
  //       console.error('Error al cargar los datos:', err);
  //       setError('No se pudieron cargar los datos');
  //       setIsLoading(false);
  //     });
  // }, [selectedMonth]);

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getLastDayOfMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const { chartData, rawData, registrosFiltrados, uniqueTanks } = useMemo(() => {
    const groupedByTankAndDay = {};
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysOfMonth = getDaysInMonth(year, month);
    const dayLabels = daysOfMonth.map((date) => date.toISOString().split('T')[0]);

    const registrosFiltrados = registros.filter((r) => {
      const fecha = r.FechaRegistro;
      if (!fecha) return false;
      const [regYear, regMonth] = fecha.split('-').map(Number);
      return regYear === year && regMonth === month;
    });

    registrosFiltrados.forEach((registro) => {
      const nombre = registro.NombreTanque || 'Desconocido';
      const fechaStr = registro.FechaRegistro;
      let nivel = 0;
      const nt = registro.NivelTanque;
      if (typeof nt === 'string') nivel = parseFloat(nt.replace(',', '.'));
      else if (typeof nt === 'number') nivel = nt;
      else if (nt?.$numberDecimal) nivel = parseFloat(nt.$numberDecimal);
      else if (nt?.$numberInt) nivel = parseFloat(nt.$numberInt);

      if (!groupedByTankAndDay[nombre]) groupedByTankAndDay[nombre] = {};
      groupedByTankAndDay[nombre][fechaStr] = nivel;
    });

    const datasets = Object.entries(groupedByTankAndDay).map(([nombre, dataPorDia]) => {
      const data = dayLabels.map((dia) => dataPorDia[dia] ?? null);
      return {
        label: nombre,
        data,
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3,
      };
    });

    const rawData = [];
    Object.entries(groupedByTankAndDay).forEach(([nombre, dataPorDia]) => {
      Object.entries(dataPorDia).forEach(([dia, nivel]) => {
        rawData.push({
          Fecha: dia,
          Tanque: nombre,
          Disposición: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Disposicion || "",
          Factor: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Factor || "",
          Nivel: nivel,
          Observaciones: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Observaciones || "",
          Responsable: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Responsable || "",
        });
      });
    });

    const uniqueTanks = [...new Set(registrosFiltrados.map(r => r.NombreTanque))];

    return {
      chartData: { labels: dayLabels, datasets },
      rawData,
      registrosFiltrados,
      uniqueTanks
    };
  }, [registros, selectedMonth]);

  // 🔹 reset automático de fecha cuando cambia mes
  useEffect(() => {
    if (registrosFiltrados.length > 0) {
      const fechas = registrosFiltrados.map(r => r.FechaRegistro).sort();
      if (!fechas.includes(selectedDate)) {
        setSelectedDate(fechas[fechas.length - 1]); // última fecha válida
      }
    } else {
      setSelectedDate("");
    }
  }, [registrosFiltrados, selectedDate]);

  // Exportar CSV con headers bonitos
  const exportToCSV = () => {
    const headers = [
      { label: 'Fecha', key: 'Fecha' },
      { label: 'Tanque', key: 'Tanque' },
      { label: 'Disposición', key: 'Disposición' },
      { label: 'Factor', key: 'Factor' },
      { label: 'Nivel', key: 'Nivel' },
      { label: 'Observaciones', key: 'Observaciones' },
      { label: 'Responsable', key: 'Responsable' },
    ];

    const csv = Papa.unparse(rawData, {
      columns: headers.map(h => h.key),
      header: true,
    });

    const headerRow = headers.map(h => h.label).join(',');
    const csvFinal = csv.replace(/^.*/, headerRow);

    const blob = new Blob([csvFinal], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'niveles_tanques_dia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar PDF con headers bonitos
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Niveles de Tanques - ${selectedMonth}`, 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [['Fecha', 'Tanque', 'Disposición', 'Factor', 'Nivel', 'Observaciones', 'Responsable']],
      body: rawData.map(row => [
        row.Fecha,
        row.Tanque,
        row.Disposición,
        row.Factor,
        row.Nivel,
        row.Observaciones,
        row.Responsable,
      ]),
      styles: { halign: 'right' },
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    });

    const chartCanvas = chartRef.current;
    if (chartCanvas?.canvas) {
      const imgData = chartCanvas.canvas.toDataURL('image/png');
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text('Gráfico de Niveles', 14, finalY);
      doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100);
    }

    doc.save('niveles_tanques_dia.pdf');
  };

  const toggleAll = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.hidden = !datasetsHidden;
      });
      chart.update();
      setDatasetsHidden(!datasetsHidden);
    }
  };

  const registrosTabla = useMemo(() => {
    let filtrados = registrosFiltrados;
    if (selectedTank !== "Todos") {
      filtrados = filtrados.filter(r => r.NombreTanque === selectedTank);
    }
    if (selectedDate) {
      filtrados = filtrados.filter(r => r.FechaRegistro === selectedDate);
    }
    return filtrados;
  }, [registrosFiltrados, selectedTank, selectedDate]);

  return (
    <div style={{
      width: '96vw',
      maxHeight: '89vh',
      padding: '30px',
      borderRadius: '12px',
      border: 'none',
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      margin: '0 auto',
      marginTop: '3%',
    }}>

      {/* Barra superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              marginRight: '15px'
            }}
          />
          <button
            onClick={() => setViewMode(viewMode === "grafico" ? "tabla" : "grafico")}
            style={{
              padding: '8px 16px',
              backgroundColor: '#673ab7',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {viewMode === "grafico" ? "📊 Ver Tabla" : "📈 Ver Gráfico"}
          </button>
        </div>

        <h2 style={{ margin: 0 }}>Niveles de Tanques - {selectedMonth}</h2>

        <div>
          <button
            onClick={exportToCSV}
            disabled={!['gerente', 'supervisor', 'developer'].includes(usuario?.rol)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5ccb28',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              marginRight: '5px'
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={!['gerente', 'supervisor', 'developer'].includes(usuario?.rol)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f07d38',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Renderizado condicional */}
      {isLoading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : viewMode === "grafico" ? (
        chartData && chartData.labels.length > 0 ? (
          <>
            <button
              onClick={toggleAll}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0288d1',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                marginBottom: '20px'
              }}
            >
              {datasetsHidden ? '👁️ Mostrar todas' : '👁️ Ocultar todas'}
            </button>
            <div style={{ height: '600px', marginBottom: '30px', width: '88vw' }}>
              <Line
                data={chartData}
                options={{ responsive: true, maintainAspectRatio: false }}
                ref={chartRef}
              />
            </div>
          </>
        ) : (
          <p>No hay datos disponibles para este mes.</p>
        )
      ) : (
        <div>
          {/* Filtro por tanque y fecha */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
            <Autocomplete
              options={["Todos", ...uniqueTanks]}
              value={selectedTank}
              onChange={(e, newValue) => setSelectedTank(newValue || "Todos")}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar por tanque" variant="outlined" size="small" />
              )}
              style={{ width: "200px" }}
            />

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={`${selectedMonth}-01`}
              max={`${selectedMonth}-${String(
                getLastDayOfMonth(
                  Number(selectedMonth.split("-")[0]),
                  Number(selectedMonth.split("-")[1])
                )
              ).padStart(2, "0")}`}
              style={{
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              textAlign: 'left',
            }}>
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Fecha</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Tanque</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Nivel [m]</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Factor [L/m]</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Disposición</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Observaciones</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {registrosTabla.map((row, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.FechaRegistro}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.NombreTanque}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.NivelTanque}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Factor}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Disposicion}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Observaciones}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraficoNivelesTanquesPorDiaPageComponente;
