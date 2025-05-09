import React, { useRef } from 'react';
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
    top: '48%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '30px',
    borderRadius: '10px',
    width: '80vw',
    height: '85vh',
    overflow: 'hidden',
    backgroundColor:"#f7fcff"
  },
};

Modal.setAppElement('#root');

const colorPalette = ['#FF6384', '#FFCE56', '#36A2EB', '#FF9F40', '#4BC0C0', '#9966FF', '#C9CBCF'];

const DataTableChartModal = ({ reactivos, modalIsOpen, closeModal }) => {
  const validReactivos = reactivos.filter((r) => r.GastoMensual && r.GastoMensual > 0);
  const labels = validReactivos.map((item) => item.nombre);
  const gastosMensuales = validReactivos.map((item) => item.GastoMensual);

  const data = {
    labels: labels,
    datasets: [
      {
        data: gastosMensuales,
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
        return [r.nombre, `$${r.GastoMensual.toFixed(2)}`, `${percentage}%`];
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
      if (chart) {
        const imgData = chart.toBase64Image();
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text('Distribución Gráfica de Gastos', 14, finalY);
        doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100); // Agregar imagen del gráfico al PDF
      }

      doc.save('gastos_reactivos.pdf');
    } catch (error) {
      alert('❌ Error al exportar PDF: ' + error.message);
    }
  };

  return (
    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
      {/* Encabezado centrado */}
      <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', backgroundColor:"#eefaff" }}>
        <h2 style={{ margin: 0, marginTop: '20px', fontSize:35, color:"#5b91aa"}}>Gastos Mensuales por Reactivo</h2>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
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
            <div style={{ width: '95%', height: '90%', marginTop: '20px'}}>
              <Pie ref={chartRef} data={data} options={options} />
            </div>
          </div>
          <div
            style={{
              flex: '1 1 20%',
              minWidth: '100px',
              height: '100%',
              overflowY: 'auto',
              marginTop: '70px'
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
                  {item.nombre}: {item.GastoMensual} $ ({percentage}%)
                </p>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DataTableChartModal;
