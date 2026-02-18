import React, { useRef, useState } from 'react';
import Modal from 'react-modal';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '30px',
    borderRadius: '10px',
    width: '82vw',
    height: '83vh',
    overflow: 'hidden',
    backgroundColor: "#f7fcff"
  },
};

Modal.setAppElement('#root');

const colorPalette = [
  '#FF6384', '#FFCE56', '#36A2EB', '#FF9F40', '#4BC0C0', '#9966FF', '#C9CBCF', // Originales
  '#8E44AD', '#3498DB', '#1ABC9C', '#F39C12', '#D35400', '#2ECC71', '#E74C3C',
  '#34495E', '#16A085', '#27AE60', '#2980B9', '#9B59B6', '#F1C40F', '#E67E22',
  '#BDC3C7', '#7F8C8D', '#95A5A6', '#DDA0DD', '#FF7F50', '#B0C4DE', '#00CED1',
  '#D2691E', '#FF1493', '#ADFF2F', '#20B2AA', '#FF4500', '#8FBC8F', '#40E0D0'
];

const DataTablePieChartInsumosModal = ({ reactivos, modalIsOpen, closeModal }) => {

  const [vista, setVista] = useState('precio'); // 'precio' o 'kilos'

  const validReactivos = reactivos.filter((r) => r.GastoMensual && r.GastoMensual > 0);
// const validReactivos = reactivos.filter((r) => r.GastoMensual != null); // para visualizar toda la data
  const labels = validReactivos.map((item) => item.nombre);
  const gastosMensuales = validReactivos.map((item) => item.GastoMensual);

  const PesoConsumidoMensual = validReactivos.map((item) => item.ConsumoMensual);

  const data = {
    labels: labels,
    datasets: [
      {
        data: vista === "precio" ? gastosMensuales : PesoConsumidoMensual,
        backgroundColor: colorPalette,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  const chartRef = useRef();

  const exportToCSV = () => {
    try {
      // Incluir los porcentajes en el CSV
      const total = validReactivos.reduce((acc, r) => acc + r.GastoMensual, 0);
      const csvData = validReactivos.map((r) => {
        const percentage = ((r.GastoMensual / total) * 100).toFixed(2);
        return {
          Reactivo: r.nombre,
          GastoMensual: r.GastoMensual.toFixed(2),
          Porcentaje: `${percentage}%`,
        };
      });

      csvData.push({ Reactivo: 'Total', GastoMensual: total.toFixed(2), Porcentaje: '100%' });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'gastos_reactivos.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('❌ Error al exportar CSV: ' + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const total = validReactivos.reduce((acc, r) => acc + r.GastoMensual, 0);

      // Preparamos los datos para la tabla con los porcentajes
      const dataToExport = validReactivos.map((r) => {
        const percentage = ((r.GastoMensual / total) * 100).toFixed(2);
        return [
          r.nombre,
          vista === "precio"
            ? `$${r.GastoMensual.toFixed(2)}`
            : `${r.ConsumoMensual.toFixed(2)} Kg`,
          `${percentage}%`
        ];
      });

      dataToExport.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        { content: `$${total.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: '100%', styles: { fontStyle: 'bold' } },
      ]);

      doc.setFontSize(16);
      doc.text('Gastos Mensuales por Reactivo', 14, 16);

      // Generar la tabla en PDF
      autoTable(doc, {
        startY: 20,
        head: [['Reactivo', 'Gasto Mensual', 'Porcentaje']],
        body: dataToExport,
        styles: { halign: 'right' },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      });

      // Agregar el gráfico circular al PDF
      const chart = chartRef.current;
      // if (chart) {
      //   const imgData = chart.toBase64Image();
      //   const finalY = doc.lastAutoTable.finalY + 10;
      //   doc.text('Distribución Gráfica de Gastos', 14, finalY);
      //   doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100); // Agregar imagen del gráfico al PDF
      // }

      if (chart) {
        const imgData = chart.toBase64Image();
        const finalY = doc.lastAutoTable.finalY + 10;
        const imageHeight = 90; // Alto del gráfico en el PDF
        const pageHeight = doc.internal.pageSize.height;

        // Si el gráfico no cabe, agregar una nueva página
        if (finalY + imageHeight > pageHeight) {
          doc.addPage();
          doc.text('Distribución Gráfica de Gastos', 14, 20);
          doc.addImage(imgData, 'PNG', 30, 30, 150, imageHeight);
        } else {
          doc.text('Distribución Gráfica de Gastos', 14, finalY);
          doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, imageHeight);
        }
      }

      doc.save('gastos_reactivos.pdf');
    } catch (error) {
      alert('❌ Error al exportar PDF: ' + error.message);
    }
  };

  const toggleVista = () => {
    setVista((prev) => (prev === "precio" ? "kilos" : "precio"));
  };

  return (
    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
      {/* Encabezado centrado */}
      <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', backgroundColor: "#eefaff" }}>
        <h2 style={{ margin: 0, marginTop: '20px', fontSize: 35, color: "#5b91aa" }}>Gastos Mensuales por Reactivo</h2>
        <button
          onClick={closeModal}
          style={{
            position: 'absolute',
            right: 0,
            top: -20,
            padding: '6px 12px',
            fontSize: '24px',
            backgroundColor: "orange"
          }}
        >
          Cerrar
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        {/* Botón izquierdo */}
        <div>
          <button
            onClick={() => toggleVista()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#00796b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {vista === "precio" ? "Graficar por Kilos " : "Graficar por Precio $"}
          </button>
        </div>

        {/* Botones derechos */}
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
              fontWeight: 'bold',
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={exportToPDF}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6a1b9a',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {validReactivos.length === 0 ? (
        <p>No hay reactivos con gasto mensual válido o reportado.</p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '30px',
            height: 'calc(100% - 80px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: '1 1 50%',
              minWidth: '300px',
              height: '100%',
            }}
          >
            <div style={{ width: '95%', height: '90%', marginTop: '10px' }}>
              <Pie ref={chartRef} data={data} options={options} />
            </div>
          </div>
          <div
            style={{
              flex: '1 1 20%',
              minWidth: '100px',
              height: '75%',
              overflowY: 'auto',
              marginTop: '40px'
            }}
          >
            {validReactivos.map((item, index) => {
              const total = validReactivos.reduce((acc, r) => acc + r.GastoMensual, 0);
              const percentage = ((item.GastoMensual / total) * 100).toFixed(2);
              return (
                <p key={index} style={{ margin: '5px 0', display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      backgroundColor: colorPalette[index % colorPalette.length],
                      borderRadius: '50%',
                      marginRight: '10px',
                    }}
                  ></span>
                  {item.nombre}: {vista === "precio"
                    ? `${item.GastoMensual.toFixed(2)} $ (${percentage}%)`
                    : `${item.ConsumoMensual.toFixed(2)} Kg (${percentage}%)`}               
                 </p>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DataTablePieChartInsumosModal;
