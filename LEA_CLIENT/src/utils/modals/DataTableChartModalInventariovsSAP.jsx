import React, { useRef, useMemo } from 'react';
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

const DataTableChartModalInventariovsSAP = ({ modalIsOpen, closeModal, reactivos }) => {
  const chartRef = useRef(null);
  const consumoData = useMemo(() => {
    return reactivos.map(item => ({
      producto: `${item.nombre} - Lote: ${item.lote}`, // Identificar producto por nombre + lote
      Inventario: item.Inventario,
      SAP: item.SAP || 0  // Si SAP no tiene valor, asigna cero
    }));
  }, [reactivos]);

  const highlightedPoints = consumoData.map((d, index) => {
    const diff = Math.abs(d.Inventario - d.SAP);
    return diff > 2 ? {
      x: d.producto,
      y: Math.max(d.Inventario, d.SAP),
    } : null;
  }).filter(Boolean);

  const chartData = {
    labels: consumoData.map(d => d.producto), // Etiquetas de productos con lote
    datasets: [
      {
        label: 'Inventario',  // Graficamos Inventario
        data: consumoData.map(d => d.Inventario),  // Datos de Inventario para cada producto
        borderColor: '#36A2EB',  // Color de la línea de Inventario
        backgroundColor: 'rgba(54, 162, 235, 0.2)',  // Color de fondo para Inventario
        fill: true,
        tension: 0.3,
      },
      {
        label: 'SAP',  // Graficamos SAP
        data: consumoData.map(d => d.SAP),  // Datos de SAP para cada producto
        borderColor: '#FF5733',  // Color de la línea de SAP
        backgroundColor: 'rgba(255, 87, 51, 0.2)',  // Color de fondo para SAP
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Diferencia > 2',
        data: highlightedPoints,
        pointStyle: 'star',
        pointRadius: 8,
        pointBackgroundColor: 'red',
        pointBorderColor: 'black',
        pointBorderWidth: 1,
        showLine: false,
      }
    ]
  };

  const exportToCSV = () => {
    const csvData = consumoData.map(row => ({
      Producto: row.producto,
      Inventario: row.Inventario,
      SAP: row.SAP
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'comparativo_Inventario_VS_SAP.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const tableData = consumoData.map(row => [row.producto, row.Inventario, row.SAP]);

      doc.setFontSize(16);
      doc.text('Comparativo Inventario vs SAP', 14, 16);
      autoTable(doc, {
        startY: 20,
        head: [['Producto', 'Inventario', 'SAP']],
        body: tableData,
        styles: { halign: 'right' },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      });

      const chartCanvas = chartRef.current;
      if (chartCanvas && chartCanvas.canvas) {
        const imgData = chartCanvas.canvas.toDataURL('image/png');
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text('Gráfico Comparativo', 14, finalY);
        doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100);
      }

      doc.save('comparativo_Inventario_VS_SAP.pdf');
    } catch (error) {
      alert('❌ Error al exportar PDF: ' + error.message);
    }
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '70%',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Comparativo Inventario vs SAP</h2>
        <button
          onClick={closeModal}
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

      <div style={{ width: '100%', height: '400px' }}>
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
          />
      </div>
    </Modal>
  );
};

export default DataTableChartModalInventariovsSAP;
