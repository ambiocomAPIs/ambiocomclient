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

const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DataTableChartModalCostMensual = ({ modalIsOpen, closeModal }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filteredData, setFilteredData] = useState([]);
  const [ingresoData, setIngresoData] = useState([]);
  const [showIngresoTotal, setShowIngresoTotal] = useState(false);
  const [showComparativo, setShowComparativo] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await axios.get('
https://ambiocomserver.onrender.com/api/registro/movimientos');
        const movimientos = response.data;

        const monthlyTotals = Array(12).fill(0);
        const monthlyIngresos = Array(12).fill(0);

        movimientos.forEach((mov) => {
          if (!mov.fechaMovimiento) return;
          const date = new Date(mov.fechaMovimiento);
          const year = date.getFullYear();
          const month = date.getMonth();

          if (year === selectedYear) {
            if (
              mov.tipoOperacion === 'Consumo de Material' &&
              typeof mov.costoUnitario === 'number' &&
              typeof mov.consumoReportado === 'number'
            ) {
              const gasto = Math.abs(mov.costoUnitario * mov.consumoReportado);
              monthlyTotals[month] += gasto;
            } else if (
              mov.tipoOperacion === 'Ingreso de Material' &&
              typeof mov.valorUnitario === 'number' &&
              typeof mov.cantidadIngreso === 'number'
            ) {
              const ingreso = mov.valorUnitario * mov.cantidadIngreso;
              monthlyIngresos[month] += ingreso;
            }
          }
        });

        setFilteredData(monthNames.map((mes, i) => ({ mes, valor: monthlyTotals[i] })));
        setIngresoData(monthNames.map((mes, i) => ({ mes, valor: monthlyIngresos[i] })));
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
      }
    };

    fetchMovimientos();
  }, [selectedYear]);

  const chartData = {
    labels: filteredData.map(d => d.mes),
    datasets: [
      {
        label: 'Gasto Mensual (Consumo de Material)',
        data: filteredData.map(d => d.valor),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const ingresoChartData = {
    labels: ingresoData.map(d => d.mes),
    datasets: [
      {
        label: 'Ingreso Mensual (Ingreso de Material)',
        data: ingresoData.map(d => d.valor),
        borderColor: '#FF5733',
        backgroundColor: 'rgba(255, 87, 51, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const comparativoChartData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Gasto Mensual',
        data: filteredData.map(d => d.valor),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Ingreso Mensual',
        data: ingresoData.map(d => d.valor),
        borderColor: '#FF5733',
        backgroundColor: 'rgba(255, 87, 51, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const exportToCSV = () => {
    const dataToExport = showComparativo
      ? monthNames.map((mes, i) => ({
          Mes: mes,
          Gasto: filteredData[i]?.valor?.toFixed(2) || '0.00',
          Ingreso: ingresoData[i]?.valor?.toFixed(2) || '0.00',
        }))
      : (showIngresoTotal ? ingresoData : filteredData).map(row => ({
          Mes: row.mes,
          Monto: row.valor.toFixed(2),
        }));

    if (showComparativo) {
      dataToExport.push({
        Mes: 'Total',
        Gasto: filteredData.reduce((acc, d) => acc + d.valor, 0).toFixed(2),
        Ingreso: ingresoData.reduce((acc, d) => acc + d.valor, 0).toFixed(2),
      });
    } else {
      const total = dataToExport.reduce((acc, d) => acc + parseFloat(d.Monto), 0);
      dataToExport.push({ Mes: 'Total', Monto: total.toFixed(2) });
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', showComparativo
      ? 'comparativo_mensual.csv'
      : showIngresoTotal ? 'ingresos_mensuales.csv' : 'gastos_mensuales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let tableData = [];
      let title = '';

      if (showComparativo) {
        tableData = monthNames.map((mes, i) => [
          mes,
          `$${filteredData[i]?.valor?.toFixed(2) || '0.00'}`,
          `$${ingresoData[i]?.valor?.toFixed(2) || '0.00'}`
        ]);
        tableData.push([
          'Total',
          `$${filteredData.reduce((acc, d) => acc + d.valor, 0).toFixed(2)}`,
          `$${ingresoData.reduce((acc, d) => acc + d.valor, 0).toFixed(2)}`
        ]);
        title = 'Comparativo Mensual de Ingresos y Gastos';
      } else {
        const dataToExport = showIngresoTotal ? ingresoData : filteredData;
        const total = dataToExport.reduce((acc, d) => acc + d.valor, 0);
        tableData = dataToExport.map(row => [row.mes, `$${row.valor.toFixed(2)}`]);
        tableData.push(['Total', `$${total.toFixed(2)}`]);
        title = showIngresoTotal ? 'Ingreso Mensual' : 'Gasto Mensual';
      }

      doc.setFontSize(16);
      doc.text(title, 14, 16);
      autoTable(doc, {
        startY: 20,
        head: [showComparativo ? ['Mes', 'Gasto', 'Ingreso'] : ['Mes', 'Monto']],
        body: tableData,
        styles: { halign: 'right' },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      });

      const chartCanvas = chartRef.current;
      if (chartCanvas && chartCanvas.toBase64Image) {
        const imgData = chartCanvas.toBase64Image();
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text('Distribución Gráfica', 14, finalY);
        doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100);
      }

      doc.save(showComparativo
        ? 'comparativo_mensual.pdf'
        : showIngresoTotal ? 'ingresos_mensuales.pdf' : 'gastos_mensuales.pdf');
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
          width: '80vw',
          height: '85vh',
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
          {showComparativo
            ? 'Comparativo de Ingresos vs Gastos'
            : showIngresoTotal
            ? 'Total Ingreso de Material'
            : 'Gasto Mensual por Fecha'}
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
          Selecciona año:
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        >
          {[...Array(5)].map((_, idx) => {
            const yearOption = currentYear - 2 + idx;
            return (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            );
          })}
        </select>

        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button
            onClick={() => {
              setShowIngresoTotal(false);
              setShowComparativo(false);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: !showIngresoTotal && !showComparativo ? '#388e3c' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Ver Gasto
          </button>
          <button
            onClick={() => {
              setShowIngresoTotal(true);
              setShowComparativo(false);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: showIngresoTotal && !showComparativo ? '#388e3c' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Ver Ingreso
          </button>
          <button
            onClick={() => {
              setShowIngresoTotal(false);
              setShowComparativo(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: showComparativo ? '#388e3c' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Ver Comparativo
          </button>
        </div>
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

      <div style={{  height: '60vh', marginBottom: '5px', width: '92%', marginTop:"50px" }}>
        <Line
          data={
            showComparativo
              ? comparativoChartData
              : showIngresoTotal
              ? ingresoChartData
              : chartData
            }
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }} 
            ref={chartRef}
        />
      </div>
    </Modal>
  );
};

export default DataTableChartModalCostMensual;
