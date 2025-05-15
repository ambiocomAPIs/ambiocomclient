import React, { useState, useMemo, useRef, useEffect } from 'react';
import Modal from 'react-modal';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

Modal.setAppElement('#root');

const GraficoNivelesTanquesPorDiaModal = ({ modalIsOpen, onClose }) => {
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartRef = useRef(null);

  useEffect(() => {
    if (modalIsOpen) {
      setIsLoading(true);
      axios
        .get('https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros')
        .then((response) => {
          if (Array.isArray(response.data)) {
            setRegistros(response.data);
          } else {
            console.error('Respuesta inesperada del backend');
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error al cargar los datos:', err);
          setError('No se pudieron cargar los datos');
          setIsLoading(false);
        });
    } else {
      setRegistros([]);
    }
  }, [modalIsOpen, selectedMonth]);

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const { chartData, rawData } = useMemo(() => {
    const groupedByTankAndDay = {};
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysOfMonth = getDaysInMonth(year, month);
    const dayLabels = daysOfMonth.map((date) => date.toISOString().split('T')[0]);

    registros.forEach((registro) => {
      const nombre = registro.NombreTanque || 'Desconocido';
      const fechaStr = registro.FechaRegistro;
      if (!fechaStr) return;

      const [regYear, regMonth] = fechaStr.split('-').map(Number);
      if (regYear !== year || regMonth !== month) return;

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
        rawData.push({ Tanque: nombre, Día: dia, Nivel: nivel });
      });
    });

    return {
      chartData: {
        labels: dayLabels,
        datasets,
      },
      rawData,
    };
  }, [registros, selectedMonth]);

  const exportToCSV = () => {
    const csv = Papa.unparse(rawData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'niveles_tanques_dia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Niveles de Tanques - ${selectedMonth}`, 14, 16);

    const tableData = rawData.map((row) => [row.Tanque, row.Día, row.Nivel]);

    autoTable(doc, {
      startY: 20,
      head: [['Tanque', 'Día', 'Nivel']],
      body: tableData,
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

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxHeight: '90vh',
          padding: '30px',
          borderRadius: '12px',
          border: 'none',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
        },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Niveles de Tanques - {selectedMonth}</h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Cerrar
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0288d1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Exportar CSV
        </button>
        <button
          onClick={exportToPDF}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0288d1',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Exportar PDF
        </button>
      </div>

      {isLoading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : chartData && chartData.labels.length > 0 ? (
        <>
          <div style={{ height: '600px', marginBottom: '30px', width: '80vw' }}>
            <Line data={chartData} ref={chartRef} />
          </div>
          <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              textAlign: 'left',
            }}>
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Tanque</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Día</th>
                  <th style={{ padding: '10px', border: '1px solid #ccc' }}>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Tanque}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Día}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee' }}>{row.Nivel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No hay datos disponibles para este mes.</p>
      )}
    </Modal>
  );
};

export default GraficoNivelesTanquesPorDiaModal;
