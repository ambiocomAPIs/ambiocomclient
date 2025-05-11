import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';
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

const GraficoGastoMensualPorMes = ({ modalIsOpen, closeModal }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:4041/api/cierremes/data');
        const rawData = response.data;

        const procesado = rawData.map(item => {
          const mes = item.MesDeCierre;
          const totalGasto = Array.isArray(item.dataMes)
            ? item.dataMes.reduce((acc, d) => {
                const gasto = d.GastoMensual;
                let valor = 0;
                if (typeof gasto === 'number') {
                  valor = gasto;
                } else if (typeof gasto === 'string') {
                  valor = parseFloat(gasto);
                } else if (gasto && typeof gasto === 'object') {
                  valor = parseFloat(gasto.$numberInt || gasto.$numberDouble || 0);
                }
                return acc + valor;
              }, 0)
            : 0;

          console.log("total gasto:", totalGasto);

          return { mes, valor: totalGasto };
        });

        const parseDate = (str) => {
          const match = str.match(/([A-Z]+)(\d+)/);
          const meses = {
            ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
            JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
          };
          const mes = meses[match[1]];
          const anio = parseInt(match[2]);
          return new Date(anio, mes);
        };

        const ordenado = procesado.sort((a, b) => parseDate(a.mes) - parseDate(b.mes));

        setChartData(ordenado);
      } catch (err) {
        console.error('Error obteniendo datos de gasto mensual:', err);
      }
    };

    if (modalIsOpen) {
      fetchData();
    }
  }, [modalIsOpen]);

  const data = {
    labels: chartData.map(d => d.mes),
    datasets: [
      {
        label: 'Gasto Total por Mes',
        data: chartData.map(d => d.valor),
        borderColor: '#3e95cd',
        backgroundColor: 'rgba(62,149,205,0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Gasto Mensual por MesDeCierre</h2>
        <button
          onClick={closeModal}
          style={{
            padding: '8px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
      <Line data={data} />
    </Modal>
  );
};

export default GraficoGastoMensualPorMes;
