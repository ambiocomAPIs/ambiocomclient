import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Autocomplete,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import ExcelDownloadButton from '../../../utils/Export_Data_General/ExcelDownloadData.jsx';
import { getLineColors } from '../../../utils/ChartsUtils/chartColors.js';  //colores aleatorios para las graficas

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const GraficoNivelesTanquesPorDiaPageComponente = ({ NivelesTanquesContext }) => {
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [datasetsHidden, setDatasetsHidden] = useState(false);
  const [viewMode, setViewMode] = useState("grafico");
  const [selectedTank, setSelectedTank] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartRef = useRef(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("usuario");
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (NivelesTanquesContext.length > 0) {
      setRegistros(NivelesTanquesContext);
    }
  }, [NivelesTanquesContext]);

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getLastDayOfMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const { chartData, rawData, registrosFiltrados, uniqueTanks } = useMemo(() => {
    const groupedByTankAndDay = {};
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysOfMonth = getDaysInMonth(year, month);
    const dayLabels = daysOfMonth.map((date) => date.toISOString().split('T')[0]);

    const registrosFiltrados = registros.filter((r) => {
      const fecha = r.FechaRegistro;
      if (!fecha) return false;
      const [regYear, regMonth] = fecha.split('-').map(Number);
      return regYear === year && regMonth === month;
    });

    registrosFiltrados.forEach((registro) => {
      const nombre = registro.NombreTanque || 'Desconocido';
      const fechaStr = registro.FechaRegistro;
      let nivel = 0;
      const nt = registro.NivelTanque;
      if (typeof nt === 'string') nivel = parseFloat(nt.replace(',', '.'));
      else if (typeof nt === 'number') nivel = nt;
      else if (nt?.$numberDecimal) nivel = parseFloat(nt.$numberDecimal);
      else if (nt?.$numberInt) nivel = parseFloat(nt.$numberInt);

      if (!groupedByTankAndDay[nombre]) groupedByTankAndDay[nombre] = {};
      groupedByTankAndDay[nombre][fechaStr] = nivel;
    });

    // const palette = [
    //   '#2563eb',
    //   '#7c3aed',
    //   '#059669',
    //   '#524c49',
    //   '#dc2626',
    //   '#0891b2',
    //   '#4f46e5',
    //   '#65a30d',
    // ];
    const palette = getLineColors(12);  // funcion js que genera colores para evitar la paleta de colores

    const datasets = Object.entries(groupedByTankAndDay).map(([nombre, dataPorDia], index) => {

      const data = dayLabels.map((dia) => {
        const nivel = dataPorDia[dia] ?? null;

        const registro = registros.find(
          r => r.FechaRegistro === dia && r.NombreTanque === nombre
        );

        let factor = 0;
        if (registro?.Factor) {
          factor = typeof registro.Factor === 'string'
            ? parseFloat(registro.Factor.replace(',', '.'))
            : Number(registro.Factor);
        }

        return {
          x: dia,
          y: nivel,
          factor: factor
        };
      });

      return {
        label: nombre,
        data,
        borderColor: palette[index % palette.length],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        borderWidth: 2.2,
        pointRadius: 2,
        pointHoverRadius: 5,
      };
    });

    // const rawData = [];
    // Object.entries(groupedByTankAndDay).forEach(([nombre, dataPorDia]) => {
    //   Object.entries(dataPorDia).forEach(([dia, nivel]) => {
    //     rawData.push({
    //       Fecha: dia,
    //       Tanque: nombre,
    //       Disposición: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Disposicion || "",
    //       Factor: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Factor || "",
    //       Nivel: nivel,
    //       Observaciones: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Observaciones || "",
    //       Responsable: registros.find(r => r.FechaRegistro === dia && r.NombreTanque === nombre)?.Responsable || "",
    //     });
    //   });
    // });

    const rawData = [];
    Object.entries(groupedByTankAndDay).forEach(([nombre, dataPorDia]) => {
      Object.entries(dataPorDia).forEach(([dia, nivel]) => {
        const registro = registros.find(
          r => r.FechaRegistro === dia && r.NombreTanque === nombre
        );

        let factor = 0;
        if (typeof registro?.Factor === 'string') factor = parseFloat(registro.Factor.replace(',', '.')) || 0;
        else if (typeof registro?.Factor === 'number') factor = registro.Factor;
        else if (registro?.Factor?.$numberDecimal) factor = parseFloat(registro.Factor.$numberDecimal) || 0;
        else if (registro?.Factor?.$numberInt) factor = parseFloat(registro.Factor.$numberInt) || 0;

        const volumen = Number((nivel * factor).toFixed(2));

        rawData.push({
          Fecha: dia,
          Tanque: nombre,
          Disposición: registro?.Disposicion || "",
          Factor: factor,
          Nivel: nivel,
          Volumen: volumen,
          Observaciones: registro?.Observaciones || "",
          Responsable: registro?.Responsable || "",
        });
      });
    });

    const uniqueTanks = [...new Set(registrosFiltrados.map(r => r.NombreTanque))];

    return {
      chartData: { labels: dayLabels, datasets },
      rawData,
      registrosFiltrados,
      uniqueTanks
    };
  }, [registros, selectedMonth]);

  useEffect(() => {
    if (registrosFiltrados.length > 0) {
      const fechas = registrosFiltrados.map(r => r.FechaRegistro).sort();
      if (!fechas.includes(selectedDate)) {
        setSelectedDate(fechas[fechas.length - 1]);
      }
    } else {
      setSelectedDate("");
    }
  }, [registrosFiltrados, selectedDate]);

  const exportToCSV = () => {
    const headers = [
      { label: 'Fecha', key: 'Fecha' },
      { label: 'Tanque', key: 'Tanque' },
      { label: 'Disposición', key: 'Disposición' },
      { label: 'Factor', key: 'Factor' },
      { label: 'Nivel', key: 'Nivel' },
      { label: 'Volumen', key: 'Volumen' },
      { label: 'Observaciones', key: 'Observaciones' },
      { label: 'Responsable', key: 'Responsable' },
    ];

    const csv = Papa.unparse(rawData, {
      columns: headers.map(h => h.key),
      header: true,
    });

    const headerRow = headers.map(h => h.label).join(',');
    const csvFinal = csv.replace(/^.*/, headerRow);

    const blob = new Blob([csvFinal], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'niveles_tanques_dia.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Niveles de Tanques - ${selectedMonth}`, 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [['Fecha', 'Tanque', 'Disposición', 'Factor', 'Nivel', 'Volumen', 'Observaciones', 'Responsable']],
      body: rawData.map(row => [
        row.Fecha,
        row.Tanque,
        row.Disposición,
        row.Factor,
        row.Nivel,
        row.Volumen,
        row.Observaciones,
        row.Responsable,
      ]),
      styles: { halign: 'right' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });

    const chartCanvas = chartRef.current;
    if (chartCanvas?.canvas) {
      const imgData = chartCanvas.canvas.toDataURL('image/png');
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text('Gráfico de Niveles', 14, finalY);
      doc.addImage(imgData, 'PNG', 30, finalY + 10, 150, 100);
    }

    doc.save('niveles_tanques_dia.pdf');
  };

  const toggleAll = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.hidden = !datasetsHidden;
      });
      chart.update();
      setDatasetsHidden(!datasetsHidden);
    }
  };

  const registrosTabla = useMemo(() => {
    let filtrados = registrosFiltrados;
    if (selectedTank !== "Todos") {
      filtrados = filtrados.filter(r => r.NombreTanque === selectedTank);
    }
    if (selectedDate) {
      filtrados = filtrados.filter(r => r.FechaRegistro === selectedDate);
    }
    return filtrados;
  }, [registrosFiltrados, selectedTank, selectedDate]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(99vh - 35px)',
        px: 2,
        py: 1.5,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: '96%',
          borderRadius: 4,
          mt:-1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr auto auto' },
            gap: 2,
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: '#0f172a', mb: 0.4 }}
            >
              Niveles de Tanques
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            <TextField
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
              sx={{
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  backgroundColor: '#fff',
                },
              }}
            />

            <Button
              variant="contained"
              onClick={() => setViewMode(viewMode === "grafico" ? "tabla" : "grafico")}
              sx={{
                borderRadius: 2.5,
                px: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                backgroundColor: '#6d28d9',
                '&:hover': { backgroundColor: '#5b21b6', boxShadow: 'none' },
              }}
            >
              {viewMode === "grafico" ? "Ver Tabla de Niveles" : "Ver Gráfico"}
            </Button>
          </Stack>

          <Stack direction="row" spacing={1.2} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button
              onClick={exportToCSV}
              disabled={!['gerente', 'supervisor', 'developer'].includes(usuario?.rol)}
              variant="contained"
              sx={{
                borderRadius: 2.5,
                px: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                backgroundColor: '#16a34a',
                '&:hover': { backgroundColor: '#15803d', boxShadow: 'none' },
              }}
            >
              Exportar CSV
            </Button>

            <Button
              onClick={exportToPDF}
              disabled={!['gerente', 'supervisor', 'developer'].includes(usuario?.rol)}
              variant="contained"
              sx={{
                borderRadius: 2.5,
                px: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                backgroundColor: '#ea580c',
                '&:hover': { backgroundColor: '#c2410c', boxShadow: 'none' },
              }}
            >
              Exportar PDF
            </Button>
            <ExcelDownloadButton
              data={rawData}
              filename={`niveles_tanques_dia_${selectedMonth}.xlsx`}
              sheetName="NivelesTanques"
              buttonText="Exportar Excel"
              disabled={!['gerente', 'supervisor', 'developer'].includes(usuario?.rol)}
            />
            <Button
              onClick={toggleAll}
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                px: 2,
                fontWeight: 600,
                textTransform: 'none',
                borderColor: '#0ea5e9',
                color: '#0284c7',
                '&:hover': {
                  borderColor: '#0284c7',
                  backgroundColor: '#f0f9ff',
                },
              }}
            >
              {datasetsHidden ? 'Mostrar todas' : 'Ocultar todas'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Contenido principal sin scroll general */}
        <Box
          sx={{
            flex: 1,
            mt: -1.1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', flex: 1 }}>
              <Typography sx={{ color: '#475569', fontWeight: 500 }}>
                Cargando datos...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ display: 'grid', placeItems: 'center', flex: 1 }}>
              <Typography sx={{ color: '#dc2626', fontWeight: 500 }}>
                {error}
              </Typography>
            </Box>
          ) : viewMode === "grafico" ? (
            chartData && chartData.labels.length > 0 ? (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    p: 2,
                    backgroundColor: '#fcfdff',
                  }}
                >
                  <Box sx={{ width: '100%', height: '100%' }}>
                    <Line
                      ref={chartRef}
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'nearest',
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              boxWidth: 12,
                              usePointStyle: true,
                              padding: 16,
                            },
                          },
                          tooltip: {
                            position: 'nearest',
                            backgroundColor: '#0f172a',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 10,
                            callbacks: {
                              label: function (context) {
                                const nivel = context.raw?.y ?? context.raw;
                                const factor = context.raw?.factor ?? 0;
                                const volumen = nivel && factor ? nivel * factor : 0;

                                return [
                                  `Tanque: ${context.dataset.label}`,
                                  `Nivel: ${nivel?.toFixed(2) ?? 0} m`,
                                  `Volumen: ${volumen.toLocaleString('es-CO', {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1
                                  })} L`
                                ];
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: '#64748b',
                              maxRotation: 0,
                              autoSkip: true,
                            },
                          },
                          y: {
                            grid: {
                              color: '#e5e7eb',
                            },
                            ticks: {
                              color: '#64748b',
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </>
            ) : (
              <Box sx={{ display: 'grid', placeItems: 'center', flex: 1 }}>
                <Typography sx={{ color: '#64748b', fontWeight: 500 }}>
                  No hay datos disponibles para este mes.
                </Typography>
              </Box>
            )
          ) : (
            <>
              {/* Filtros tabla */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mb: 1.5,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Autocomplete
                  options={["Todos", ...uniqueTanks]}
                  value={selectedTank}
                  onChange={(e, newValue) => setSelectedTank(newValue || "Todos")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filtrar por tanque"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  sx={{
                    width: 240,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      backgroundColor: '#fff',
                    },
                  }}
                />

                <TextField
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  size="small"
                  inputProps={{
                    min: `${selectedMonth}-01`,
                    max: `${selectedMonth}-${String(
                      getLastDayOfMonth(
                        Number(selectedMonth.split("-")[0]),
                        Number(selectedMonth.split("-")[1])
                      )
                    ).padStart(2, "0")}`,
                  }}
                  sx={{
                    width: 180,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      backgroundColor: '#fff',
                    },
                  }}
                />
              </Box>

              {/* Tabla */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    fontSize: '14px',
                  }}
                >
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: '#f8fafc',
                    }}
                  >
                    <tr>
                      {['Fecha', 'Tanque', 'Nivel [m]', 'Factor [L/m]', 'Volumen [L]', 'Disposición', 'Observaciones', 'Responsable'].map((title) => (
                        <th
                          key={title}
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid #e2e8f0',
                            textAlign: 'left',
                            color: '#0f172a',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosTabla.map((row, index) => (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#eef6ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                        }}
                      >
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.FechaRegistro}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155', fontWeight: 600 }}>{row.NombreTanque}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.NivelTanque}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.Factor}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>
                          {(
                            (typeof row.NivelTanque === 'string' ? parseFloat(row.NivelTanque.replace(',', '.')) : Number(row.NivelTanque) || 0) *
                            (typeof row.Factor === 'string' ? parseFloat(row.Factor.replace(',', '.')) : Number(row.Factor) || 0)
                          ).toLocaleString('es-CO', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })} L
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.Disposicion}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.Observaciones}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #eef2f7', color: '#334155' }}>{row.Responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Paper>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default GraficoNivelesTanquesPorDiaPageComponente;