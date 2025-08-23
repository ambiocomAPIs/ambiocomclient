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

const today = new Date();

const DataTableChartModalCost = ({ modalIsOpen, closeModal }) => {

  const [dataInsumos, setInsumosData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filteredDataPeso, setFilteredDataPeso] = useState([]);
  const [ingresoData, setIngresoData] = useState([]);
  const [showIngresoTotal, setShowIngresoTotal] = useState(false);
  const [totalIngreso, setTotalIngreso] = useState(0);
  const [filteredDataPrev, setFilteredDataPrev] = useState(0);
  const [IngresoDataPrev, setIngresoDataPrev] = useState(0);
  //cambiamos la vista de la grafica para visualizar por insumo diario
  const [vista, setVista] = useState('precio'); // 'precio' o 'kilos'
  // filtrar por insumo
  const [selectedFiltroInsumo, setSelectedFiltroInsumo] = useState('');
  // const [dateRange, setDateRange] = useState({ month: 5, year: 2025 });
  const [dateRange, setDateRange] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  const chartRef = useRef(null); // Se define el useRef para el gráfico

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await axios.get('
https://ambiocomserver.onrender.com/api/registro/movimientos');
        setInsumosData(response.data)
        const movimientos = response.data;
        const { month, year } = dateRange;

        const daysInMonth = new Date(year, month, 0).getDate();

        // Calcular mes anterior
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

        // Inicializar estructuras
        const dailyTotals = {};
        const dailyTotalsPeso = {};
        const dailyIngreso = {};
        const dailyTotalsPrev = {};
        const dailyIngresoPrev = {};

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dailyTotals[dateStr] = 0;
          dailyTotalsPeso[dateStr] = 0;
          dailyIngreso[dateStr] = 0;
        }

        for (let day = 1; day <= daysInPrevMonth; day++) {
          const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dailyTotalsPrev[dateStr] = 0;
          dailyIngresoPrev[dateStr] = 0;
        }

        let totalIngresoTemp = 0;

        movimientos.forEach((mov) => {
          if (!mov.fechaMovimiento) return;

          const date = mov.fechaMovimiento;
          const movYear = parseInt(date.slice(0, 4));
          const movMonth = parseInt(date.slice(5, 7));
          const movDay = date.slice(8, 10);
          const dateKey = `${movYear}-${String(movMonth).padStart(2, '0')}-${movDay}`;

          // Lógica para MES ACTUAL
          if (movYear === year && movMonth === month) {
            if (mov.tipoOperacion === 'Consumo de Material' && typeof mov.costoUnitario === 'number' && typeof mov.consumoReportado === 'number' && vista === "precio") {
              const gasto = Math.abs(mov.costoUnitario * mov.consumoReportado);
              dailyTotals[dateKey] += gasto;
            }else if (
  mov.tipoOperacion === 'Consumo de Material' &&
  vista === 'kilos' &&
  selectedFiltroInsumo &&
  mov.producto === selectedFiltroInsumo &&
  typeof mov.consumoReportado === 'number'
) {
  dailyTotalsPeso[dateKey] += Math.abs(mov.consumoReportado);
}
            if (
              mov.tipoOperacion === 'Ingreso Material' &&
              typeof mov.costoUnitario === 'number' &&
              typeof mov.cantidadIngreso === 'string'
            ) {
              const ingreso = Math.abs(mov.costoUnitario * Number(mov.cantidadIngreso));
              dailyIngreso[dateKey] += ingreso;
              totalIngresoTemp += ingreso;
            }
          }

          // Lógica para MES ANTERIOR
          if (movYear === prevYear && movMonth === prevMonth) {
            if (
              mov.tipoOperacion === 'Consumo de Material' &&
              typeof mov.costoUnitario === 'number' &&
              typeof mov.consumoReportado === 'number'
            ) {
              const gasto = Math.abs(mov.costoUnitario * mov.consumoReportado);
              dailyTotalsPrev[dateKey] += gasto;
            }

            if (
              mov.tipoOperacion === 'Ingreso Material' &&
              typeof mov.costoUnitario === 'number' &&
              typeof mov.cantidadIngreso === 'string'
            ) {
              const ingreso = Math.abs(mov.costoUnitario * Number(mov.cantidadIngreso));
              dailyIngresoPrev[dateKey] += ingreso;
            }
          }
        });

        // Preparar datos para las gráficas
        const chartData = Object.entries(dailyTotals).map(([fecha, valor]) => ({ fecha, valor }));
        const chartDataPeso = Object.entries(dailyTotalsPeso).map(([fecha, valor]) => ({ fecha, valor }));
        const ingresoChartData = Object.entries(dailyIngreso).map(([fecha, valor]) => ({ fecha, valor }));
        const chartDataPrev = Object.entries(dailyTotalsPrev).map(([fecha, valor]) => ({ fecha, valor }));
        const ingresoChartDataPrev = Object.entries(dailyIngresoPrev).map(([fecha, valor]) => ({ fecha, valor }));

        // Setear estados
        setFilteredData(chartData);
        setFilteredDataPeso(chartDataPeso);
        setIngresoData(ingresoChartData);
        setTotalIngreso(totalIngresoTemp);

        // Si quieres usarlos, también puedes setear estos:
        setFilteredDataPrev(chartDataPrev);
        setIngresoDataPrev(ingresoChartDataPrev);

      } catch (error) {
        console.error('Error al obtener movimientos:', error);
      }
    };

    fetchMovimientos();
  }, [dateRange , vista, selectedFiltroInsumo]);


useEffect(() => {
  if (vista === "kilos" && !selectedFiltroInsumo && dataInsumos.length > 0) {
    const primerosInsumos = [
      ...new Set(
        dataInsumos
          ?.filter((insumo) => {
            if (!insumo.fechaMovimiento) return false;

            const fecha = new Date(insumo.fechaMovimiento);
            const insumoYear = fecha.getFullYear();
            const insumoMonth = fecha.getMonth() + 1;

            return (
              insumoYear === dateRange.year &&
              insumoMonth === dateRange.month
            );
          })
          .map((insumo) => insumo.producto)
      )
    ];

    if (primerosInsumos.length > 0) {
      setSelectedFiltroInsumo(primerosInsumos[0]);
    }
  }
}, [vista, dataInsumos, dateRange, selectedFiltroInsumo]);


  // *******************  DATA QUE SE GRAFICA--- AQUI SE GRAFICA LA DATA Y LINEAS DE LA GRAFICA
  const chartData = {
    labels: filteredData.map(d => d.fecha),
    datasets:[
      {
    label: vista ==="precio" ? 'Gasto Diario (Costo del Consumo de Material)' :'Graficar Consumo Diario por Insumo' ,
    data: vista ==="precio" ? filteredData.map(d => d.valor): filteredDataPeso.map(d => d.valor),
    borderColor: '#36A2EB',
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    fill: true,
    tension: 0.3,
  },{
    label: vista ==="precio" ? 'Graficar y comparar Gasto con Mes Anterior':'Graficar y comparar Costo Diario por Insumo',
    data: Array.isArray(filteredDataPrev) ? filteredDataPrev.map(d => d.valor) : [],
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    fill: true,
    tension: 0.2,
    hidden: true, // ← por defecto tachado
  }
    ]
  };
  // **************** DATA QUE SE GRAFICA--- AQUI TERMINA  GRAFICA LA DATA Y LINEAS DE LA GRAFICA

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
      tableData.push(['Total', `$${total.toFixed(2)}`]);

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

  const toggleVista = () => {
    setVista((prev) => (prev === "precio" ? "kilos" : "precio"));
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={{
        content: {
          top: '53%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '85vw',
          height: '88vh',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
            marginRight: 35,
            marginBottom: 8
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
          value={`${dateRange.year}-${String(dateRange.month).padStart(2, '0')}`}
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
            marginRight: 35
          }}
        >
          {showIngresoTotal ? 'Mostrar Gasto Diario' : 'Mostrar Total Ingresado'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px', marginRight: 35 }}>
        {/* Lado izquierdo: toggle vista y filtro */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => toggleVista()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#7dc0e4ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {vista === "precio" ? "Graficar por Kilos " : "Graficar Costos $"}
          </button>
          {vista === "kilos" && (
            <select
              onChange={(e) => setSelectedFiltroInsumo(e.target.value)}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '16px',
                maxWidth: '300px',
                width: "220px"
              }}
            >
              {[
                ...new Set(
                  dataInsumos
                    ?.filter((insumo) => {
                      if (!insumo.fechaMovimiento) return false;

                      const fecha = new Date(insumo.fechaMovimiento);
                      const insumoYear = fecha.getFullYear();
                      const insumoMonth = fecha.getMonth() + 1; // getMonth() es base 0

                      return (
                        insumoYear === dateRange.year &&
                        insumoMonth === dateRange.month
                      );
                    })
                    .map((insumo) => insumo.producto)
                )
              ].map((producto, idx) => (
                <option key={idx} value={producto}>
                  {producto}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Lado derecho: exportaciones */}
        <div style={{ display: 'flex', gap: '10px' }}>
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
              backgroundColor: '#f0a543ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ height: '59vh', marginBottom: '5px', width: '98%', marginTop: "50px" }}>
        <Line
          data={showIngresoTotal ? ingresoChartData : chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                ticks: {
                  callback: function (value) {
                    return vista === "precio"
                      ? `$ ${value.toFixed(2)}`
                      : `${value.toFixed(2)} Kg`;
                  },
                },
              },
            },
          }}
          ref={chartRef}
        />
      </div>
    </Modal>
  );
};

export default DataTableChartModalCost;
