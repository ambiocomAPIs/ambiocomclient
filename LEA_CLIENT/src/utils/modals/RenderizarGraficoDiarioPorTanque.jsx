import React, { useState, useMemo, useRef, useEffect } from "react";
import Modal from "react-modal";
import { Line } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

Modal.setAppElement("#root");

const RenderizarGraficoDiarioPorTanque = ({
  modalIsOpen,
  onClose,
  nombreTanque,
  factorTanque,
}) => {
  // console.log("nombre tanque llega:", nombreTanque);
  console.log("factorTanque tanque llega:", factorTanque);

  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // trae los usurios del sesio storage
  const [usuario, setUsuario] = useState(null);
  // Boton ver y no ver grafica
  const [datasetsHidden, setDatasetsHidden] = useState(false);
  // Boton ver en niveles o volumen
  const [datasetsPluggins, setDatasetsPluggins] = useState(false);
  // Plugin de la grafica para diferencias entre puntos
  const [pluginActivo, setPluginActivo] = useState("deltaPlugin");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const chartRef = useRef(null);

  // este useEffect me inicia las graficas ocultas
  useEffect(() => {
    if (modalIsOpen) {
      setDatasetsHidden(true); // Reinicia ocultas cuando se abre el modal
      setDatasetsPluggins(true); // true para ver niveles primero
    }
  }, [modalIsOpen]);
  // TERMINA-- este useEffect me inicia las gracias ocultas

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [datasetsPluggins]);

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
    if (modalIsOpen) {
      setIsLoading(true);
      axios
        .get(
          "
https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros"
        )
        .then((response) => {
          if (Array.isArray(response.data)) {
            setRegistros(response.data);
          } else {
            console.error("Respuesta inesperada del backend");
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error al cargar los datos:", err);
          setError("No se pudieron cargar los datos");
          setIsLoading(false);
        });
    } else {
      setRegistros([]);
    }
  }, [modalIsOpen, selectedMonth]);

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const { chartData, rawData } = useMemo(() => {
    const groupedByTankAndDay = {};
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysOfMonth = getDaysInMonth(year, month);
    const dayLabels = daysOfMonth.map(
      (date) => date.toISOString().split("T")[0]
    );

    registros.forEach((registro) => {
      const nombre = registro.NombreTanque || "Desconocido";
      const fechaStr = registro.FechaRegistro;
      if (!fechaStr) return;

      const [regYear, regMonth] = fechaStr.split("-").map(Number);
      if (regYear !== year || regMonth !== month) return;

      let nivel = 0;
      const nt = registro.NivelTanque;
      if (typeof nt === "string") nivel = parseFloat(nt.replace(",", "."));
      else if (typeof nt === "number") nivel = nt;
      else if (nt?.$numberDecimal) nivel = parseFloat(nt.$numberDecimal);
      else if (nt?.$numberInt) nivel = parseFloat(nt.$numberInt);

      if (!groupedByTankAndDay[nombre]) groupedByTankAndDay[nombre] = {};
      groupedByTankAndDay[nombre][fechaStr] = nivel;
    });

    const datasets = Object.entries(groupedByTankAndDay).map(
      ([nombre, dataPorDia]) => {
        const data = dayLabels.map((dia) => dataPorDia[dia] ?? null);
        return {
          label: nombre,
          data,
          borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          backgroundColor: "transparent",
          fill: false,
          tension: 0.3,
          hidden: nombre !== nombreTanque,
        };
      }
    );

    const rawData = [];
    Object.entries(groupedByTankAndDay).forEach(([nombre, dataPorDia]) => {
      Object.entries(dataPorDia).forEach(([dia, nivel]) => {
        rawData.push({ Tanque: nombre, Día: dia, Nivel: nivel });
      });
    });

    return {
      chartData: {
        labels: dayLabels,
        datasets,
      },
      rawData,
    };
  }, [registros, selectedMonth]);

  const exportToCSV = () => {
    const csv = Papa.unparse(rawData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "niveles_tanques_dia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Niveles de Tanques - ${selectedMonth}`, 14, 16);

    const tableData = rawData.map((row) => [row.Tanque, row.Día, row.Nivel]);

    autoTable(doc, {
      startY: 20,
      head: [["Tanque", "Día", "Nivel"]],
      body: tableData,
      styles: { halign: "right" },
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    });

    const chartCanvas = chartRef.current;
    if (chartCanvas?.canvas) {
      const imgData = chartCanvas.canvas.toDataURL("image/png");
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text("Gráfico de Niveles", 14, finalY);
      doc.addImage(imgData, "PNG", 30, finalY + 10, 150, 100);
    }

    doc.save("niveles_tanques_dia.pdf");
  };

  const toggleAll = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.data.datasets.forEach((dataset) => {
        dataset.hidden = !datasetsHidden;
      });
      chart.update();
      setDatasetsHidden(!datasetsHidden);
    }
  };

  const setVisualizacionNivelesOVolumen = () => {
    setDatasetsPluggins(!datasetsPluggins);
  };

  // calcula la diferencia entre punto y punto...
  const differences = chartData.datasets.map((dataset) => {
    const diffs = [];
    for (let i = 1; i < dataset.data.length; i++) {
      const prev = dataset.data[i - 1];
      const curr = dataset.data[i];
      if (prev !== null && curr !== null) {
        diffs.push({ index1: i - 1, index2: i, value: Math.abs(curr - prev) });
      }
    }
    return diffs;
  });

  // plugin de chartjs para visualizar tendencias y diferencias
  const deltaPlugin = {
    id: "deltaPlugin",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // 👈 filtro

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return; // 👈 solo dibuja si coincide

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const meta = chart.getDatasetMeta(datasetIndex);
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];

            const x1 = prevPoint.x;
            const y1 = prevPoint.y;
            const x2 = currPoint.x;
            const y2 = currPoint.y;

            const diff = Math.abs(curr - prev);

            ctx.save();

            // Línea vertical como "llave"
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1, y2);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Texto de diferencia
            ctx.fillStyle = "red";
            ctx.font = "12px Arial";
            ctx.fillText(diff.toFixed(2), (x1 + x2) / 2, y2 - 5);

            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginLegible = {
    id: "deltaPluginLegible",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // 👈 filtro

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return; // 👈 solo dibuja si coincide

        const meta = chart.getDatasetMeta(datasetIndex);

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];

            const x1 = prevPoint.x;
            const y1 = prevPoint.y;
            const x2 = currPoint.x;
            const y2 = currPoint.y;

            const diff = Math.abs(curr - prev);

            ctx.save();

            // Línea punteada horizontal
            ctx.strokeStyle = "rgba(255,0,0,0.6)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y2 - 15); // 15px arriba del punto final
            ctx.lineTo(x2, y2 - 15);
            ctx.stroke();

            // Fondo blanco detrás del texto
            const text = diff.toFixed(2);
            ctx.font = "12px Arial";
            const textWidth = ctx.measureText(text).width;
            const textX = (x1 + x2) / 2 - textWidth / 2;
            const textY = y2 - 18;
            ctx.fillStyle = "white";
            ctx.fillRect(textX - 2, textY - 10, textWidth + 4, 14);

            // Texto de la diferencia
            ctx.fillStyle = "red";
            ctx.fillText(text, textX, textY);

            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginClaro = {
    id: "deltaPluginClaro",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // 👈 filtro

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return; // 👈 solo el tanque activo

        const meta = chart.getDatasetMeta(datasetIndex);

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];

            const x1 = prevPoint.x;
            const y1 = prevPoint.y;
            const x2 = currPoint.x;
            const y2 = currPoint.y;

            const diff = Math.abs(curr - prev).toFixed(2);

            ctx.save();

            // Línea vertical pequeña para conectar puntos
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const lineHeight = 15; // altura de la línea

            ctx.strokeStyle = "rgba(255,0,0,0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(midX, midY - lineHeight / 2);
            ctx.lineTo(midX, midY + lineHeight / 2);
            ctx.stroke();

            // Texto de la diferencia
            ctx.font = "12px Arial";
            const textWidth = ctx.measureText(diff).width;
            ctx.fillStyle = "white";
            ctx.fillRect(
              midX - textWidth / 2 - 2,
              midY - lineHeight / 2 - 12,
              textWidth + 4,
              14
            );

            ctx.fillStyle = "red";
            ctx.fillText(diff, midX - textWidth / 2, midY - lineHeight / 2 - 2);

            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginLineaPunteada = {
    id: "deltaPluginLineaPunteada",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // 👈 filtro por tanque seleccionado

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        // solo dibuja si coincide el label con el tanque seleccionado
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];

          if (prev !== null && curr !== null) {
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];

            const x1 = prevPoint.x;
            const y1 = prevPoint.y;
            const x2 = currPoint.x;
            const y2 = currPoint.y;

            const diff = Math.abs(curr - prev).toFixed(2);

            ctx.save();
            // línea punteada azul arriba del punto final
            ctx.strokeStyle = "rgba(0,123,255,0.8)";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y2 - 15);
            ctx.lineTo(x2, y2 - 15);
            ctx.stroke();

            // fondo blanco para el texto
            ctx.font = "12px Arial";
            const textWidth = ctx.measureText(diff).width;
            const textX = (x1 + x2) / 2 - textWidth / 2;
            const textY = y2 - 18;

            ctx.fillStyle = "white";
            ctx.fillRect(textX - 2, textY - 10, textWidth + 4, 14);

            // texto azul
            ctx.fillStyle = "blue";
            ctx.fillText(diff, textX, textY);

            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginArco = {
    id: "deltaPluginArco",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // <- le pasas el tanque seleccionado

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        // solo dibuja si coincide con el tanque seleccionado
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];

            const x1 = prevPoint.x,
              y1 = prevPoint.y;
            const x2 = currPoint.x,
              y2 = currPoint.y;
            const diff = Math.abs(curr - prev).toFixed(2);

            ctx.save();
            // arco naranja
            ctx.strokeStyle = "rgba(255,165,0,0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 20, x2, y2);
            ctx.stroke();

            // texto en el centro del arco
            ctx.font = "12px Arial";
            const textWidth = ctx.measureText(diff).width;
            const midX = (x1 + x2) / 2;
            const midY = Math.min(y1, y2) - 22;

            ctx.fillStyle = "white";
            ctx.fillRect(
              midX - textWidth / 2 - 2,
              midY - 10,
              textWidth + 4,
              14
            );

            ctx.fillStyle = "orange";
            ctx.fillText(diff, midX - textWidth / 2, midY);

            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginFlotante = {
    id: "deltaPluginFlotante",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque; // <- se lo pasas en options

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        // Solo dibujar si el dataset corresponde al tanque seleccionado
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const currPoint = meta.data[i];
            const diff = Math.abs(curr - prev).toFixed(2);

            ctx.save();
            ctx.font = "12px Arial";
            const textWidth = ctx.measureText(diff).width;

            // Fondo blanco
            ctx.fillStyle = "white";
            ctx.fillRect(currPoint.x + 3, currPoint.y - 10, textWidth + 4, 14);

            // Texto en verde
            ctx.fillStyle = "green";
            ctx.fillText(diff, currPoint.x + 3, currPoint.y);
            ctx.restore();
          }
        }
      });
    },
  };

  const deltaPluginNodos = {
    id: "deltaPluginNodos",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        const nodos = [];

        // 🔹 1. Forzar el primer nodo
        nodos.push({
          tipo: "inicio",
          index: 0,
          value: dataset.data[0],
          point: meta.data[0],
        });

        // 🔹 2. Detectar picos y valles intermedios
        for (let i = 1; i < dataset.data.length - 1; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          const next = dataset.data[i + 1];

          if (curr > prev && curr > next) {
            nodos.push({
              tipo: "pico",
              index: i,
              value: curr,
              point: meta.data[i],
            });
          }
          if (curr < prev && curr < next) {
            nodos.push({
              tipo: "valle",
              index: i,
              value: curr,
              point: meta.data[i],
            });
          }
        }

        // 🔹 3. Forzar el último nodo
        const lastIdx = dataset.data.length - 1;
        nodos.push({
          tipo: "fin",
          index: lastIdx,
          value: dataset.data[lastIdx],
          point: meta.data[lastIdx],
        });

        // 🔹 4. Medir amplitud entre nodo-valle consecutivos
        for (let j = 1; j < nodos.length; j++) {
          const a = nodos[j - 1];
          const b = nodos[j];

          if (a.tipo === b.tipo) continue; // evitar unir dos iguales pico-pico o valle-valle

          const diff = Math.abs(b.value - a.value).toFixed(2);

          ctx.save();
          ctx.strokeStyle = a.value < b.value ? "red" : "green"; // subida = rojo, bajada = verde
          ctx.beginPath();
          ctx.moveTo(a.point.x, a.point.y);
          ctx.lineTo(b.point.x, b.point.y);
          ctx.stroke();

          // Texto en el medio de la línea
          ctx.fillStyle = "black";
          ctx.font = "12px Arial";
          ctx.fillText(
            `${diff}`,
            (a.point.x + b.point.x) / 2,
            (a.point.y + b.point.y) / 2 - 5
          );
          ctx.restore();
        }
      });
    },
  };

  // 🔹 1. Pendientes (Slope Analyzer)
  const slopePlugin = {
    id: "slopePlugin",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];
          if (prev !== null && curr !== null) {
            const prevPoint = meta.data[i - 1];
            const currPoint = meta.data[i];
            const diff = (curr - prev).toFixed(2);

            ctx.save();
            ctx.font = "11px Arial";
            ctx.fillStyle = diff >= 0 ? "green" : "red";
            ctx.fillText(
              diff > 0 ? `+${diff}` : diff,
              (prevPoint.x + currPoint.x) / 2,
              (prevPoint.y + currPoint.y) / 2 - 5
            );
            ctx.restore();
          }
        }
      });
    },
  };

  // 🔹 2. Máximos y mínimos globales
  const extremaPlugin = {
    id: "extremaPlugin",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const tanqueSeleccionado = chart.options.nombreTanque;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);

        const values = dataset.data.filter((v) => v !== null);
        const max = Math.max(...values);
        const min = Math.min(...values);

        dataset.data.forEach((v, i) => {
          if (v === max || v === min) {
            const point = meta.data[i];
            ctx.save();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = v === max ? "blue" : "orange";
            ctx.fill();

            const valorAGraficar = datasetsPluggins
              ? v
              : (v * Number(factorTanque)).toFixed(2);

            ctx.fillStyle = "black";
            ctx.font = "12px Arial";
            ctx.fillText(
              v === max ? `Max: ${valorAGraficar}` : `Min: ${valorAGraficar}`,
              point.x + 8,
              point.y - 8
            );
            ctx.restore();
          }
        });
      });
    },
  };

  // Higher-order plugin wrapper
function withScaling(basePlugin) {
  return {
    ...basePlugin,
    afterDatasetsDraw(chart, ...args) {
      const mostrarNiveles = chart.options.datasetsPluggins ?? true;
      const factor = chart.options.factorTanque ?? 1;

      // Determinar unidad
      const unidad = mostrarNiveles ? "m" : "L";

      // Sobrescribimos temporalmente los valores ajustados
      const originalData = chart.data.datasets.map(ds => [...ds.data]);

      chart.data.datasets.forEach(ds => {
        ds.data = ds.data.map(v => {
          if (v === null) return null;
          return mostrarNiveles ? v : v * factor;
        });
      });

      // Creamos una función para reemplazar el fillText y agregar unidad
      const ctxOriginal = chart.ctx;
      const originalFillText = ctxOriginal.fillText.bind(ctxOriginal);

      ctxOriginal.fillText = (text, x, y, maxWidth) => {
        let textoConUnidad = text;

        // Solo si el texto es un número
        const num = parseFloat(text);
        if (!isNaN(num)) {
          textoConUnidad = `${num} ${unidad}`;
        }

        originalFillText(textoConUnidad, x, y, maxWidth);
      };

      // Ejecutamos el plugin base
      basePlugin.afterDatasetsDraw(chart, ...args);

      // Restauramos los valores originales y fillText
      chart.data.datasets.forEach((ds, i) => {
        ds.data = originalData[i];
      });
      ctxOriginal.fillText = originalFillText;
    }
  };
}

  const pluginsMap = {
    deltaPlugin: withScaling(deltaPlugin),
    deltaPluginLegible: withScaling(deltaPluginLegible),
    deltaPluginClaro: withScaling(deltaPluginClaro),
    deltaPluginLineaPunteada: withScaling(deltaPluginLineaPunteada),
    deltaPluginArco: withScaling(deltaPluginArco),
    deltaPluginFlotante: withScaling(deltaPluginFlotante),
    deltaPluginNodos: withScaling(deltaPluginNodos),
    slopePlugin: withScaling(slopePlugin),
    extremaPlugin: withScaling(extremaPlugin),
  };

  console.log("plugin seleccionado [pluginsMap[pluginActivo]]:", [
    pluginsMap[pluginActivo],
  ]);
  const activePlugin = pluginsMap[pluginActivo] ?? deltaPlugin;

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: "53%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          transform: "translate(-50%, -50%)",
          width: "93vw",
          maxHeight: "90vh",
          padding: "30px",
          borderRadius: "12px",
          border: "none",
          overflow: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 1000,
        },
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "center", width: "100%" }}
        >
          <h2 style={{ margin: 0 }}>
            Niveles del Tanque
            <span style={{ fontWeight: "bold", color: "blue" }}>
              TK-{nombreTanque}
            </span>{" "}
            para la fecha:
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {" "}
              {selectedMonth}
            </span>
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cerrar
        </button>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            marginLeft: "60px",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {/* Botones Ocultar/Mostrar a la izquierda */}
        {/* Botones y Select en fila */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginLeft: "60px",
          }}
        >
          {/* Botón Ocultar/Mostrar */}
          <button
            style={{
              padding: "8px 16px",
              backgroundColor: !["gerente", "supervisor", "developer"].includes(
                usuario?.rol
              )
                ? "gray"
                : "#0288d1",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={toggleAll}
          >
            {datasetsHidden ? "👁️ Mostrar todas" : "👁️ Ocultar todas"}
          </button>

          {/* Select para elegir plugin */}
          <select
            value={pluginActivo}
            onChange={(e) => setPluginActivo(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              cursor: "pointer",
              backgroundColor: "white",
              marginLeft: "12px",
            }}
          >
            <option value="deltaPlugin">Delta Escalonado ⭐</option>
            <option value="deltaPluginNodos">Delta Nodos ⭐</option>
            <option value="deltaPluginArco">Delta Arco ⭐</option>
            <option value="slopePlugin">Delta Ingreso_Salida ⭐</option>
            <option value="deltaPluginLegible">Delta Legible</option>
            <option value="extremaPlugin">Delta MaxMin</option>
            <option value="deltaPluginClaro">Delta Llaves</option>
            <option value="deltaPluginLineaPunteada">Delta Punteada</option>
            <option value="deltaPluginFlotante">Delta Flotante</option>
          </select>

          <button
            style={{
              padding: "8px 16px",
              backgroundColor: !["gerente", "supervisor", "developer"].includes(
                usuario?.rol
              )
                ? "gray"
                : "#0288d1",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={setVisualizacionNivelesOVolumen}
          >
            {datasetsPluggins ? "Niveles" : "Volumen"}
          </button>
        </div>

        {/* Botones Exportar a la derecha */}
        <div>
          <button
            onClick={exportToCSV}
            disabled={
              !["gerente", "supervisor", "developer"].includes(usuario?.rol)
            }
            style={{
              padding: "8px 16px",
              backgroundColor: !["gerente", "supervisor", "developer"].includes(
                usuario?.rol
              )
                ? "gray"
                : "#5ccb28",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "5px",
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={
              !["gerente", "supervisor", "developer"].includes(usuario?.rol)
            }
            style={{
              padding: "8px 16px",
              backgroundColor: !["gerente", "supervisor", "developer"].includes(
                usuario?.rol
              )
                ? "gray"
                : "#f07d38",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : chartData && chartData.labels.length > 0 ? (
        <>
          <div style={{ height: "600px", marginBottom: "30px", width: "88vw" }}>
            <Line
              key={`${nombreTanque}-${pluginActivo}-${selectedMonth}`}
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                nombreTanque: nombreTanque,
                datasetsPluggins: datasetsPluggins,
                factorTanque: factorTanque,
                scales: {
                  y: {
                    beginAtZero: true,
                    suggestedMax: (() => {
                      // calcula el máximo valor del dataset seleccionado
                      const dataset = chartData.datasets.find(d => d.label === nombreTanque);
                      if (!dataset) return undefined;
            
                      const maxVal = Math.max(...dataset.data.filter(v => v !== null));
                      return Math.ceil(maxVal * 1.1); // 10% extra arriba
                    })(),
                  },
                },
              }}
              plugins={[pluginsMap[pluginActivo]]}
              // width={1800}
              // height={600}
              ref={chartRef}
            />
          </div>
          <div
            style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                textAlign: "left",
              }}
            >
              <thead style={{ backgroundColor: "#f0f0f0" }}>
                <tr>
                  <th style={{ padding: "10px", border: "1px solid #ccc" }}>
                    Tanque
                  </th>
                  <th style={{ padding: "10px", border: "1px solid #ccc" }}>
                    Día
                  </th>
                  <th style={{ padding: "10px", border: "1px solid #ccc" }}>
                    Nivel
                  </th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                      {row.Tanque}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                      {row.Día}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                      {row.Nivel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No hay datos disponibles para este mes.</p>
      )}
    </Modal>
  );
};

export default RenderizarGraficoDiarioPorTanque;
