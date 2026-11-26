import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

Modal.setAppElement('#root');

const GraficoPromedioMensual = ({ modalIsOpen, closeModal }) => {
  const chartRef = useRef(null);

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const meses = {
    ENERO: 0,
    FEBRERO: 1,
    MARZO: 2,
    ABRIL: 3,
    MAYO: 4,
    JUNIO: 5,
    JULIO: 6,
    AGOSTO: 7,
    SEPTIEMBRE: 8,
    OCTUBRE: 9,
    NOVIEMBRE: 10,
    DICIEMBRE: 11,
  };

  const parseValor = (gasto) => {
    if (typeof gasto === 'number') return gasto;

    if (typeof gasto === 'string') {
      const parsed = parseFloat(gasto);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (gasto && typeof gasto === 'object') {
      const parsed = parseFloat(
        gasto.$numberInt || gasto.$numberDouble || gasto.$numberDecimal || 0
      );
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  const parseDate = (str) => {
    if (!str || typeof str !== 'string') return new Date(0);

    const limpio = str
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const match = limpio.match(/^([A-ZÑ]+)(\d{4})$/);
    if (!match) return new Date(0);

    const nombreMes = match[1];
    const anio = parseInt(match[2], 10);
    const mes = meses[nombreMes];

    if (mes === undefined || isNaN(anio)) return new Date(0);

    return new Date(anio, mes, 1);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor || 0);
  };

  const formatearMonedaCorta = (valor) => {
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`;
    return `$${Math.round(valor || 0)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get('https://ambiocomserver.onrender.com/api/cierremes/data');
        const rawData = Array.isArray(response.data) ? response.data : [];

        const procesado = rawData.map((item) => {
          const mes = item?.MesDeCierre || 'Sin mes';

          const totalGasto = Array.isArray(item?.dataMes)
            ? item.dataMes.reduce((acc, d) => acc + parseValor(d?.GastoMensual), 0)
            : 0;

          return {
            mes,
            valor: totalGasto,
          };
        });

        const ordenado = procesado.sort(
          (a, b) => parseDate(a.mes) - parseDate(b.mes)
        );

        setChartData(ordenado);
      } catch (err) {
        console.error('Error obteniendo datos del promedio mensual:', err);
        setError('No fue posible cargar la información del gráfico.');
      } finally {
        setLoading(false);
      }
    };

    if (modalIsOpen) {
      fetchData();
    }
  }, [modalIsOpen]);

  const totalGeneral = useMemo(() => {
    return chartData.reduce((acc, item) => acc + item.valor, 0);
  }, [chartData]);

  const cantidadMeses = useMemo(() => chartData.length, [chartData]);

  const promedioMensual = useMemo(() => {
    if (!cantidadMeses) return 0;
    return totalGeneral / cantidadMeses;
  }, [totalGeneral, cantidadMeses]);

  const mesesSobrePromedio = useMemo(() => {
    return chartData.filter((item) => item.valor > promedioMensual).length;
  }, [chartData, promedioMensual]);

  const exportarImagen = () => {
    const chart = chartRef.current;
    if (!chart) return;

    const base64Image = chart.toBase64Image('image/png', 1);
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = 'grafico_promedio_mensual.png';
    link.click();
  };

  const data = useMemo(() => {
    return {
      labels: chartData.map((d) => d.mes),
      datasets: [
        {
          label: 'Gasto real por mes',
          data: chartData.map((d) => d.valor),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          datalabels: {
            align: 'top',
            anchor: 'end',
            offset: 8,
            color: '#0f172a',
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderRadius: 6,
            padding: {
              top: 4,
              bottom: 4,
              left: 6,
              right: 6,
            },
            font: {
              weight: 'bold',
              size: 10,
            },
            formatter: (value) => formatearMonedaCorta(value),
          },
        },
        {
          label: 'Promedio mensual',
          data: chartData.map(() => promedioMensual),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderDash: [8, 6],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          datalabels: {
            display: false,
          },
        },
      ],
    };
  }, [chartData, promedioMensual]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 30,
          right: 20,
          bottom: 10,
          left: 10,
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#334155',
            font: {
              size: 13,
              weight: '600',
            },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${formatearMoneda(context.raw)}`;
            },
          },
        },
        datalabels: {
          clamp: true,
          clip: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.15)',
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12,
            },
            callback: function (value) {
              return formatearMonedaCorta(value);
            },
          },
        },
      },
    };
  }, []);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      contentLabel="Gráfico de promedio mensual"
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          maxHeight: '90vh',
          padding: '0',
          borderRadius: '18px',
          border: 'none',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          background: '#f8fafc',
        },
        overlay: {
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        },
      }}
    >
      <div
        style={{
          padding: '24px 28px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Promedio mensual
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Total acumulado dividido por la cantidad total de meses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportarImagen}
            disabled={loading || chartData.length === 0}
            style={{
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: loading || chartData.length === 0 ? 0.6 : 1,
            }}
          >
            Exportar imagen
          </button>

          <button
            onClick={closeModal}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <div
          style={{
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Promedio mensual
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {formatearMoneda(promedioMensual)}
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Total acumulado
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {formatearMoneda(totalGeneral)}
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Total de meses
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {cantidadMeses}
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Meses sobre el promedio
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {mesesSobrePromedio}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          {loading ? (
            <div
              style={{
                height: '460px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '16px',
              }}
            >
              Cargando gráfico...
            </div>
          ) : error ? (
            <div
              style={{
                height: '460px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b91c1c',
                fontSize: '16px',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div
              style={{
                height: '460px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '16px',
              }}
            >
              No hay datos disponibles para mostrar.
            </div>
          ) : (
            <div style={{ height: '460px' }}>
              <Line ref={chartRef} data={data} options={options} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GraficoPromedioMensual;