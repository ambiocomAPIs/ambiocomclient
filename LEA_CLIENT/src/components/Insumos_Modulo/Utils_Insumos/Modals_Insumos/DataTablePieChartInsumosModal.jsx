import React, { useMemo, useRef, useState } from 'react';
import Modal from 'react-modal';
import { Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getLineColors } from '../../../../utils/ChartsUtils/chartColors.js';

ChartJS.register(ArcElement, Tooltip, Legend);

Modal.setAppElement('#root');

const customStyles = {
  content: {
    top: '54%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    width: '95vw',
    height: '90vh',
    maxWidth: '95vw',
    maxHeight: '90vh',
    padding: 0,
    border: 'none',
    borderRadius: '18px',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    zIndex: 1000,
  },
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
  });

const formatKg = (value) =>
  `${Number(value || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Kg`;


const VISTAS = ['precio', 'kilos', 'volumen', 'unidad'];

const normalizeUnidad = (unidad = '') =>
  unidad.toString().trim().toLowerCase();

const isVolumen = (unidad) => {
  const u = normalizeUnidad(unidad);

  return [
    'l',
    'm3',
    'gal',
  ].includes(u);
};

const getUnidadDisplay = (unidad = '') => {
  const u = normalizeUnidad(unidad);

  if (u === 'L') return 'L';
  if (u === 'm3') return 'm3';
  if (u === 'gal') return 'gal';

  return unidad;
};

const formatValueByVista = (value, vista, unidad = '') => {
  if (vista === 'precio') return formatCurrency(value);

  const unit =
    vista === 'kilos'
      ? 'Kg'
      : vista === 'volumen'
        ? getUnidadDisplay(unidad)
        : 'Und';

  return `${Number(value || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${unit}`.trim();
};

const getMetricValue = (item, vista) => {
  return vista === 'precio'
    ? Number(item.GastoMensual || 0)
    : Number(item.ConsumoMensual || 0);
};

const DataTablePieChartInsumosModal = ({ reactivos = [], modalIsOpen, closeModal }) => {

  const chartRef = useRef(null);
  const [vista, setVista] = useState('precio');

  const metricLabel =
    vista === 'precio'
      ? 'Gasto mensual'
      : vista === 'kilos'
        ? 'Consumo mensual Kg'
        : vista === 'volumen'
          ? 'Consumo mensual Volumen'
          : 'Consumo mensual Unidad';

  const metricUnit =
    vista === 'precio'
      ? 'COP'
      : vista === 'kilos'
        ? 'Kg'
        : vista === 'volumen'
          ? 'Volumen'
          : 'Und';

  const processedData = useMemo(() => {
    const cleanData = reactivos
      .filter((r) => {
        if (!r || !r.nombre) return false;

        const unidad = normalizeUnidad(r.unidad);
        if (vista === 'kilos') { return unidad === 'kg'; }
        if (vista === 'volumen') { return isVolumen(unidad); }
        if (vista === 'unidad') { return unidad === 'und'; }
        return true; // precio muestra todos
      })
      .map((r) => ({
        ...r,
        GastoMensual: Number(r.GastoMensual || 0),
        ConsumoMensual: Number(r.ConsumoMensual || 0),
      }))
      .filter((r) => getMetricValue(r, vista) > 0)
      .sort((a, b) => getMetricValue(b, vista) - getMetricValue(a, vista));

    const total = cleanData.reduce((acc, item) => acc + getMetricValue(item, vista), 0);

    const MIN_PERCENTAGE = 2.5;
    const MAX_VISIBLE_ITEMS = 14;

    const visibleItems = [];
    const groupedItems = [];

    cleanData.forEach((item, index) => {
      const percentage = total > 0 ? (getMetricValue(item, vista) / total) * 100 : 0;

      if (percentage < MIN_PERCENTAGE || index >= MAX_VISIBLE_ITEMS) {
        groupedItems.push(item);
      } else {
        visibleItems.push(item);
      }
    });

    const groupedTotal = groupedItems.reduce(
      (acc, item) => acc + getMetricValue(item, vista),
      0
    );

    const chartItems = [...visibleItems];

    if (groupedTotal > 0) {
      chartItems.push({
        nombre: `Otros (${groupedItems.length})`,
        GastoMensual:
          vista === 'precio'
            ? groupedItems.reduce((acc, item) => acc + item.GastoMensual, 0)
            : 0,
        ConsumoMensual:
          vista !== 'precio'
            ? groupedItems.reduce((acc, item) => acc + item.ConsumoMensual, 0)
            : 0,
        isGrouped: true,
        groupedItems,
      });
    }

    return {
      cleanData,
      chartItems,
      total,
      groupedItems,
    };
  }, [reactivos, vista]);

  const { cleanData, chartItems, total } = processedData;

  const chartData = useMemo(() => {

    const colors = getLineColors(chartItems.length);

    return {
      labels: chartItems.map((item) => item.nombre),
      datasets: [
        {
          data: chartItems.map((item) => getMetricValue(item, vista)),
          backgroundColor: colors,
          borderColor: '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 14,
          spacing: 2,
        },
      ],
    };
  }, [chartItems, vista]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '50%',
      layout: {
        padding: {
          top: 30,
          bottom: 30,
          left: 35,
          right: 35,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          color: '#1e293b',
          font: {
            weight: 'bold',
            size: 12,
          },
          formatter: (value, context) => {
            // return vista === 'precio'
            //   ? formatCurrency(value)
            //   : formatKg(value);
            const item = chartItems[context.dataIndex];
            return formatValueByVista(value, vista, item?.unidad);
          },
          anchor: 'end',
          align: 'end',
          offset: 6,
        },
        tooltip: {
          backgroundColor: '#0F172A',
          titleColor: '#FFFFFF',
          bodyColor: '#E2E8F0',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = Number(context.raw || 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
              const formattedValue = formatValueByVista(value, vista);
              // const formattedValue = vista === 'precio' ? formatCurrency(value) : formatKg(value);

              return `${context.label}: ${formattedValue} (${percentage}%)`;
            },
          },
        },
      },
    };
  }, [total, vista]);

  const exportToCSV = () => {
    try {
      if (!cleanData.length) return;

      const csvData = cleanData.map((item) => {
        const value = getMetricValue(item, vista);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';

        return {
          Reactivo: item.nombre,
          Tipo: metricLabel,
          Valor: value.toFixed(2),
          Unidad: metricUnit,
          Porcentaje: `${percentage}%`,
        };
      });

      csvData.push({
        Reactivo: 'Total',
        Tipo: metricLabel,
        Valor: total.toFixed(2),
        Unidad: metricUnit,
        Porcentaje: '100%',
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        'download',
        vista === 'precio'
          ? 'gastos_reactivos.csv'
          : 'consumo_reactivos_kg.csv'
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert(`❌ Error al exportar CSV: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    try {
      if (!cleanData.length) return;

      const doc = new jsPDF('p', 'mm', 'a4');

      const title =
        vista === 'precio'
          ? 'Gastos Mensuales por Reactivo'
          : 'Consumo Mensual por Reactivo';

      const tableBody = cleanData.map((item) => {
        const value = getMetricValue(item, vista);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';

        return [
          item.nombre,
          vista === 'precio' ? formatCurrency(value) : formatKg(value),
          `${percentage}%`,
        ];
      });

      tableBody.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        {
          content: vista === 'precio' ? formatCurrency(total) : formatKg(total),
          styles: { fontStyle: 'bold' },
        },
        { content: '100%', styles: { fontStyle: 'bold' } },
      ]);

      doc.setFontSize(16);
      doc.text(title, 14, 16);

      doc.setFontSize(10);
      doc.text(`Vista: ${metricLabel}`, 14, 23);

      autoTable(doc, {
        startY: 30,
        head: [['Reactivo', metricLabel, 'Porcentaje']],
        body: tableBody,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 90 },
          1: { halign: 'right', cellWidth: 55 },
          2: { halign: 'right', cellWidth: 30 },
        },
      });

      const chart = chartRef.current;

      if (chart) {
        const imgData = chart.toBase64Image();
        let finalY = doc.lastAutoTable.finalY + 12;

        if (finalY + 90 > doc.internal.pageSize.height) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFontSize(13);
        doc.text('Distribución gráfica', 14, finalY);
        doc.addImage(imgData, 'PNG', 35, finalY + 8, 140, 90);
      }

      doc.save(
        vista === 'precio'
          ? 'gastos_reactivos.pdf'
          : 'consumo_reactivos_kg.pdf'
      );
    } catch (error) {
      alert(`❌ Error al exportar PDF: ${error.message}`);
    }
  };

  const toggleVista = () => {
    setVista((prev) => {
      const currentIndex = VISTAS.indexOf(prev);
      return VISTAS[(currentIndex + 1) % VISTAS.length];
    });
  };

  const getNextVistaLabel = () => {
    if (vista === 'precio') return 'Ver por Kg';
    if (vista === 'kilos') return 'Ver volumen';
    if (vista === 'volumen') return 'Ver unidad';
    return 'Ver por $';
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Distribución mensual de reactivos"
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          color: '#0F172A',
        }}
      >
        <header
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 100%)',
            borderBottom: '1px solid #CBD5E1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: '#0F172A',
              }}
            >
              {vista === 'precio'
                ? 'Gastos Mensuales por Reactivo'
                : 'Consumo Mensual por Reactivo'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            style={{
              border: 'none',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Cerrar
          </button>
        </header>

        <section
          style={{
            padding: '16px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(160px, 1fr)) auto',
            gap: 14,
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
              Total
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {/* {vista === 'precio' ? formatCurrency(total) : formatKg(total)} */}
              {formatValueByVista(total, vista)}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
              Reactivos válidos
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {cleanData.length}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
              Vista actual
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {metricUnit}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={toggleVista}
              style={{
                padding: '10px 16px',
                backgroundColor: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              {/* {vista === 'precio' ? 'Ver por Kg' : 'Ver por $'} */}
              {getNextVistaLabel()}
            </button>

            <button
              onClick={exportToCSV}
              disabled={!cleanData.length}
              style={{
                padding: '10px 16px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                cursor: cleanData.length ? 'pointer' : 'not-allowed',
                fontWeight: 800,
                opacity: cleanData.length ? 1 : 0.55,
              }}
            >
              CSV
            </button>

            <button
              onClick={exportToPDF}
              disabled={!cleanData.length}
              style={{
                padding: '10px 16px',
                backgroundColor: '#7E22CE',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                cursor: cleanData.length ? 'pointer' : 'not-allowed',
                fontWeight: 800,
                opacity: cleanData.length ? 1 : 0.55,
              }}
            >
              PDF
            </button>
          </div>
        </section>

        {!cleanData.length ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              color: '#64748B',
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            No hay reactivos con datos válidos para la vista seleccionada.
          </div>
        ) : (
          <main
            style={{
              flex: 1,
              padding: 10,
              display: 'grid',
              gridTemplateColumns: 'minmax(420px, 1.25fr) minmax(360px, 0.9fr)',
              gap: 15,
              minHeight: 0,
            }}
          >
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 18,
                padding: 20,
                minHeight: 0,
                position: 'relative',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  minHeight: 0,
                  position: 'relative',
                }}
              >
                <Doughnut ref={chartRef} data={chartData} options={chartOptions} />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    width: 180,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748B',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                    }}
                  >
                    Total
                  </div>
                  <div
                    style={{
                      fontSize: vista === 'precio' ? 20 : 19,
                      fontWeight: 900,
                      color: '#0F172A',
                      marginTop: 4,
                    }}
                  >
                    {/* {vista === 'precio' ? formatCurrency(total) : formatKg(total)} */}
                    {formatValueByVista(total, vista)}
                  </div>
                </div>
              </div>
            </section>

            <aside
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 18,
                padding: 18,
                minHeight: 0,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#0F172A',
                  }}
                >
                  Detalle por reactivo
                </h3>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#475569',
                    backgroundColor: '#F1F5F9',
                    padding: '6px 10px',
                    borderRadius: 999,
                  }}
                >
                  {cleanData.length} items
                </span>
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  paddingRight: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {cleanData.map((item, index) => {
                  const value = getMetricValue(item, vista);
                  const percentage = total > 0 ? (value / total) * 100 : 0;
                  const colors = getLineColors(cleanData.length);
                  const color = colors[index];

                  return (
                    <div
                      key={`${item.nombre}-${index}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: '50%',
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />

                          <span
                            title={item.nombre}
                            style={{
                              fontWeight: 800,
                              color: '#0F172A',
                              fontSize: 13,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.nombre}
                          </span>
                          <span>
                            Consumo: {Number(item.ConsumoMensual || 0).toLocaleString('es-CO', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })} {item.unidad}
                          </span>
                          <span>
                            Stock: {Number(item.Inventario || 0).toLocaleString('es-CO', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })} {item.unidad}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: '#0F172A',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {percentage.toFixed(2)}%
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            height: 8,
                            backgroundColor: '#E2E8F0',
                            borderRadius: 999,
                            overflow: 'hidden',
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              height: '100%',
                              backgroundColor: color,
                              borderRadius: 999,
                            }}
                          />
                        </div>

                        <span
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {/* {vista === 'precio' ? formatCurrency(value) : formatKg(value)} */}
                          {formatValueByVista(value, vista, item.unidad)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </main>
        )}
      </div>
    </Modal>
  );
};

export default DataTablePieChartInsumosModal;