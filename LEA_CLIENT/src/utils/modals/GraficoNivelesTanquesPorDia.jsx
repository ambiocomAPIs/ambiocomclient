import React, { useState, useMemo, useRef, useEffect} from 'react';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
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

const GraficoNivelesTanquesPorDiaModal = ({ modalIsOpen, registros= [],onClose}) => {

  const [internalModalIsOpen, setInternalModalIsOpen] = useState(modalIsOpen);

  const chartRef = useRef(null);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString('es-ES', { month: 'long' }).toUpperCase();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

  const { chartData, rawData } = useMemo(() => {
    const grouped = {};

    registros.forEach((registro) => {
      const nombre = registro.nombre;
      const fecha = new Date(registro.createdAt);
      const day = fecha.getDate();

      if (!grouped[nombre]) {
        grouped[nombre] = new Array(daysInMonth).fill(null);
      }

      grouped[nombre][day - 1] = registro.nivel;
    });

    const datasets = Object.entries(grouped).map(([nombre, niveles]) => ({
      label: nombre,
      data: niveles,
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
    }));

    const rawData = [];

    Object.entries(grouped).forEach(([nombre, niveles]) => {
      niveles.forEach((nivel, index) => {
        if (nivel !== null) {
          rawData.push({
            Tanque: nombre,
            Día: index + 1,
            Nivel: nivel,
          });
        }
      });
    });

    return {
      chartData: { labels: dayLabels, datasets },
      rawData,
    };
  }, [registros]);

  useEffect(() => {
    setInternalModalIsOpen(modalIsOpen); // sincronizar con prop al abrir
  }, [modalIsOpen]);

  const exportToCSV = () => {
    const csv = Papa.unparse(rawData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'niveles_tanques_mes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Niveles de Tanques - ${monthName} ${currentYear}`, 14, 16);

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

    doc.save('niveles_tanques_mes.pdf');
  };
  
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxHeight: '90vh',
          padding: '30px',
          borderRadius: '12px',
          overflow: 'auto',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
        },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>{`${monthName} ${currentYear}`}</h2>
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

      <Line ref={chartRef} data={chartData} />

    </Modal>
  );
};

export default GraficoNivelesTanquesPorDiaModal;
