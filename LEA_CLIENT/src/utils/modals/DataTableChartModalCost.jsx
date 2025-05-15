import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

Modal.setAppElement('#root');

const DataTableChartModalCost = ({ modalIsOpen, closeModal }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [ingresoData, setIngresoData] = useState([]);
  const [dateRange, setDateRange] = useState({ month: 5, year: 2025 });
  const [showIngresoTotal, setShowIngresoTotal] = useState(false);
  const [totalIngreso, setTotalIngreso] = useState(0);

  const chartRef = useRef(null); // Se define el useRef para el gráfico

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await axios.get('https://ambiocomserver.onrender.com/api/registro/movimientos');
        const movimientos = response.data;

        const { month, year } = dateRange;
        const daysInMonth = new Date(year, month, 0).getDate();

        const dailyTotals = {};
        const dailyIngreso = {};
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dailyTotals[dateStr] = 0;
          dailyIngreso[dateStr] = 0;
        }

        let totalIngresoTemp = 0;

        movimientos.forEach((mov) => {
          if (!mov.fechaMovimiento) return;

          const date = new Date(mov.fechaMovimiento);
          const movYear = date.getFullYear();
          const movMonth = date.getMonth() + 1;

          if (movYear === year && movMonth === month) {
            const movDay = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${movDay}`;

            if (
              mov.tipoOperacion === 'Consumo de Material' &&
              typeof mov.costoUnitario === 'number' &&
              typeof mov.consumoReportado === 'number'
            ) {
              const gasto = Math.abs(mov.costoUnitario * mov.consumoReportado);
              dailyTotals[dateKey] += gasto;
            } else if (
              mov.tipoOperacion === 'Ingreso de Material' &&
              typeof mov.valorUnitario === 'number' &&
              typeof mov.cantidadIngreso === 'number'
            ) {
              const ingreso = mov.valorUnitario * mov.cantidadIngreso;
              dailyIngreso[dateKey] += ingreso;
              totalIngresoTemp += ingreso;
            }
          }
        });

        const chartData = Object.entries(dailyTotals).map(([fecha, valor]) => ({ fecha, valor }));
        const ingresoChartData = Object.entries(dailyIngreso).map(([fecha, valor]) => ({ fecha, valor }));

        setFilteredData(chartData);
        setIngresoData(ingresoChartData);
        setTotalIngreso(totalIngresoTemp);
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
      }
    };

    fetchMovimientos();
  }, [dateRange]);

  const chartData = {
    labels: filteredData.map(d => d.fecha),
    datasets: [
      {
        label: 'Gasto Diario (Consumo de Material)',
        data: filteredData.map(d => d.valor),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const ingresoChartData = {
    labels: ingresoData.map(d => d.fecha),
    datasets: [
      {
        label: 'Ingreso Diario (Ingreso de Material)',
        data: ingresoData.map(d => d.valor),
        borderColor: '#FF5733',
        backgroundColor: 'rgba(255, 87, 51, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const exportToCSV = () => {
    const dataToExport = showIngresoTotal ? ingresoData : filteredData;
    const total = dataToExport.reduce((acc, curr) => acc + curr.valor, 0);

    const csvData = [...dataToExport.map(row => ({ Fecha: row.fecha, Monto: row.valor.toFixed(2) }))];

    // Agregar fila de total
    csvData.push({ Fecha: 'Total', Monto: total.toFixed(2) });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', showIngresoTotal ? 'ingresos_Data.csv' : 'gastos_Data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dataToExport = showIngresoTotal ? ingresoData : filteredData;
      const total = dataToExport.reduce((acc, curr) => acc + curr.valor, 0);
  
      const tableData = dataToExport.map(row => [row.fecha, `$${row.valor.toFixed(2)}`]);
      tableData.push([ 'Total', `$${total.toFixed(2)}` ]);
  
      // Agregar título y tabla
      doc.setFontSize(16);
      doc.text(showIngresoTotal ? 'Total Ingreso de Material' : 'Gasto Diario por Fecha', 14, 16);
      autoTable(doc, {
        startY: 20,
        head: [['Fecha', 'Monto']],
        body: tableData,
        styles: { halign: 'right' },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      });
  
      // Agregar gráfico como imagen
      const chartCanvas = chartRef.current.chartInstance; // Se usa `chartRef` para acceder a la instancia del gráfico
      if (chartCanvas) {
        const imgData = chartCanvas.toBase64Image(); // Captura la imagen del gráfico
        const finalY = doc.lastAutoTable.finalY + 10; // Ubicación final para el gráfico
        doc.text('Distribución Gráfica', 14, finalY);
        doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100); // Ajusta las dimensiones de la imagen
      }
  
      doc.save(showIngresoTotal ? 'ingresos_Data.pdf' : 'gastos_Data.pdf');
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
        <h2 style={{ margin: 0 }}>
          {showIngresoTotal ? 'Total Ingreso de Material' : 'Gasto Diario por Fecha'}
        </h2>
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

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
          <CalendarTodayIcon style={{ marginRight: 8 }} />
          Selecciona mes:
        </label>
        <input
          type="month"
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setDateRange({ year: parseInt(year), month: parseInt(month) });
          }}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />

        <button
          onClick={() => setShowIngresoTotal(prev => !prev)}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: '#388e3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showIngresoTotal ? 'Mostrar Gasto Diario' : 'Mostrar Total Ingresado'}
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

      <div>
        <Line ref={chartRef} data={showIngresoTotal ? ingresoChartData : chartData} />
      </div>
    </Modal>
  );
};

export default DataTableChartModalCost;
