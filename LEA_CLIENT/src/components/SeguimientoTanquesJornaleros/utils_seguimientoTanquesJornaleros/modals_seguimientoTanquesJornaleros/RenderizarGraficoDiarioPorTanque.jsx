import React, { useState, useMemo, useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Paper,
  Stack,
  Grid,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import TableChartIcon from "@mui/icons-material/TableChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import DownloadIcon from "@mui/icons-material/Download";
import TuneIcon from "@mui/icons-material/Tune";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import InsightsIcon from "@mui/icons-material/Insights";
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

const RenderizarGraficoDiarioPorTanque = ({
  modalIsOpen,
  onClose,
  nombreTanque,
  factorTanque,
}) => {
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [usuario, setUsuario] = useState(null);
  const [datasetsHidden, setDatasetsHidden] = useState(false);
  const [datasetsPluggins, setDatasetsPluggins] = useState(false);
  const [pluginActivo, setPluginActivo] = useState("deltaPlugin");
  const [vistaActiva, setVistaActiva] = useState("grafica");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const chartRef = useRef(null);

  const usuarioAutorizado = ["gerente", "supervisor", "developer"].includes(
    usuario?.rol
  );

  const palette = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#4f46e5",
    "#ca8a04",
    "#be123c",
    "#0f766e",
  ];

  useEffect(() => {
    if (modalIsOpen) {
      setDatasetsHidden(true);
      setDatasetsPluggins(true);
      setVistaActiva("grafica");
    }
  }, [modalIsOpen]);

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
      setError(null);

      axios
        .get(
          "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros", 
          {withCredentials:true}
        )
        .then((response) => {
          if (Array.isArray(response.data)) {
            setRegistros(response.data);
          } else {
            console.error("Respuesta inesperada del backend");
            setRegistros([]);
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
      ([nombre, dataPorDia], index) => {
        const data = dayLabels.map((dia) => dataPorDia[dia] ?? null);
        return {
          label: nombre,
          data,
          borderColor: palette[index % palette.length],
          backgroundColor: "transparent",
          fill: false,
          tension: 0.3,
          hidden: nombre !== nombreTanque,
          pointRadius: nombre === nombreTanque ? 4 : 2,
          pointHoverRadius: nombre === nombreTanque ? 6 : 4,
          borderWidth: nombre === nombreTanque ? 3 : 1.5,
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
  }, [registros, selectedMonth, nombreTanque]);

  const rawDataTanqueSeleccionado = useMemo(() => {
    return rawData.filter((row) => row.Tanque === nombreTanque);
  }, [rawData, nombreTanque]);

  const estadisticasTanque = useMemo(() => {
    const niveles = rawDataTanqueSeleccionado
      .map((row) => Number(row.Nivel))
      .filter((v) => !Number.isNaN(v));

    if (!niveles.length) {
      return {
        totalRegistros: 0,
        minimo: "-",
        maximo: "-",
        promedio: "-",
      };
    }

    const min = Math.min(...niveles);
    const max = Math.max(...niveles);
    const promedio = niveles.reduce((acc, val) => acc + val, 0) / niveles.length;
    const factor = Number(factorTanque || 1);

    return {
      totalRegistros: niveles.length,
      minimo: min.toFixed(2),
      maximo: max.toFixed(2),
      promedio: promedio.toFixed(2),

      volumenPromedio: (promedio * factor).toFixed(2),
      volumenMaximo: (max * factor).toFixed(2),
    };
  }, [rawDataTanqueSeleccionado]);

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

  const deltaPlugin = {
    id: "deltaPlugin",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const ctx = chart.ctx;
      const tanqueSeleccionado =
        pluginOptions?.nombreTanque ?? chart.options?.nombreTanque;

      if (!tanqueSeleccionado) return;

      const placedLabels = [];

      const mostrarNiveles = chart.options.datasetsPluggins ?? true;

      const options = {
        lineColor: pluginOptions?.lineColor || "rgba(220, 38, 38, 0.9)",
        textColor: pluginOptions?.textColor || "#111",
        backgroundColor:
          pluginOptions?.backgroundColor || "rgba(255, 255, 255, 0.9)",
        borderColor: pluginOptions?.borderColor || "rgba(220, 38, 38, 0.9)",
        font: pluginOptions?.font || "12px Arial",
        paddingX: pluginOptions?.paddingX ?? 6,
        paddingY: pluginOptions?.paddingY ?? 4,
        labelOffset: pluginOptions?.labelOffset ?? 8,
        minLabelSpacing: pluginOptions?.minLabelSpacing ?? 4,
        showGuideLine: pluginOptions?.showGuideLine ?? true,
        locale: pluginOptions?.locale || "es-CO",
        valueType:
          pluginOptions?.valueType ?? (mostrarNiveles ? "nivel" : "volumen"),
      };

      const chartArea = chart.chartArea;

      function formatNivel(value) {
        return new Intl.NumberFormat(options.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true,
        }).format(value);
      }

      function formatVolumen(value) {
        return new Intl.NumberFormat(options.locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(value);
      }

      function formatDelta(diff) {
        const isVolumen = options.valueType === "volumen";
        const formatted = isVolumen ? formatVolumen(diff) : formatNivel(diff);
        return `${formatted}${isVolumen ? " L" : " m"}`;
      }

      function boxesOverlap(a, b, spacing = 0) {
        return !(
          a.x + a.w + spacing < b.x ||
          b.x + b.w + spacing < a.x ||
          a.y + a.h + spacing < b.y ||
          b.y + b.h + spacing < a.y
        );
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function findBestLabelPosition(baseX, baseY, labelW, labelH) {
        const candidateOffsets = [
          { dx: 0, dy: -18 },
          { dx: 0, dy: 18 },
          { dx: 12, dy: -18 },
          { dx: -12, dy: -18 },
          { dx: 12, dy: 18 },
          { dx: -12, dy: 18 },
          { dx: 0, dy: -34 },
          { dx: 0, dy: 34 },
          { dx: 18, dy: 0 },
          { dx: -18, dy: 0 },
        ];

        for (const offset of candidateOffsets) {
          const x = clamp(
            baseX + offset.dx - labelW / 2,
            chartArea.left + 2,
            chartArea.right - labelW - 2
          );

          const y = clamp(
            baseY + offset.dy - labelH / 2,
            chartArea.top + 2,
            chartArea.bottom - labelH - 2
          );

          const candidate = { x, y, w: labelW, h: labelH };

          const collision = placedLabels.some((box) =>
            boxesOverlap(candidate, box, options.minLabelSpacing)
          );

          if (!collision) return candidate;
        }

        return {
          x: clamp(
            baseX - labelW / 2,
            chartArea.left + 2,
            chartArea.right - labelW - 2
          ),
          y: clamp(
            baseY - labelH / 2,
            chartArea.top + 2,
            chartArea.bottom - labelH - 2
          ),
          w: labelW,
          h: labelH,
        };
      }

      function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];

          if (prev == null || curr == null) continue;

          const prevPoint = meta.data[i - 1];
          const currPoint = meta.data[i];

          if (!prevPoint || !currPoint) continue;

          const x1 = prevPoint.x;
          const y1 = prevPoint.y;
          const x2 = currPoint.x;
          const y2 = currPoint.y;

          const diff = Math.abs(curr - prev);
          const label = formatDelta(diff);

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          ctx.save();

          ctx.strokeStyle = options.lineColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.font = options.font;

          const textMetrics = ctx.measureText(label);
          const textW = textMetrics.width;
          const textH = 12;

          const labelW = textW + options.paddingX * 2;
          const labelH = textH + options.paddingY * 2;

          const baseY =
            curr > prev
              ? midY - options.labelOffset
              : midY + options.labelOffset;

          const box = findBestLabelPosition(midX, baseY, labelW, labelH);

          if (options.showGuideLine) {
            ctx.strokeStyle = "rgba(120, 120, 120, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2);
            ctx.stroke();
          }

          ctx.fillStyle = options.backgroundColor;
          ctx.strokeStyle = options.borderColor;
          ctx.lineWidth = 1;
          roundRect(ctx, box.x, box.y, box.w, box.h, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = options.textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, box.x + box.w / 2, box.y + box.h / 2 + 0.5);

          placedLabels.push(box);
          ctx.restore();
        }
      });
    },
  };

  const slopePlugin = {
    id: "slopePlugin",

    afterDatasetsDraw(chart, args, pluginOptions) {
      const ctx = chart.ctx;
      const tanqueSeleccionado =
        pluginOptions?.nombreTanque ?? chart.options?.nombreTanque;

      if (!tanqueSeleccionado) return;

      const placedLabels = [];
      const mostrarNiveles = chart.options.datasetsPluggins ?? true;

      const options = {
        locale: pluginOptions?.locale || "es-CO",
        valueType:
          pluginOptions?.valueType ?? (mostrarNiveles ? "nivel" : "volumen"),
        decimals: pluginOptions?.decimals ?? 2,
        font: pluginOptions?.font || "11px Arial",
        paddingX: pluginOptions?.paddingX ?? 5,
        paddingY: pluginOptions?.paddingY ?? 3,
        labelOffset: pluginOptions?.labelOffset ?? 8,
        minLabelSpacing: pluginOptions?.minLabelSpacing ?? 4,
        showGuideLine: pluginOptions?.showGuideLine ?? false,
        positiveColor: pluginOptions?.positiveColor || "rgba(22, 163, 74, 0.95)",
        negativeColor: pluginOptions?.negativeColor || "rgba(220, 38, 38, 0.95)",
        zeroColor: pluginOptions?.zeroColor || "rgba(100, 116, 139, 0.95)",
        textColor: pluginOptions?.textColor || "#111",
        backgroundColor:
          pluginOptions?.backgroundColor || "rgba(255, 255, 255, 0.95)",
        borderWidth: pluginOptions?.borderWidth ?? 1,
        showPlusSign: pluginOptions?.showPlusSign ?? true,
        hideZero: pluginOptions?.hideZero ?? false,
        skipIfShortSegment: pluginOptions?.skipIfShortSegment ?? true,
        minSegmentPx: pluginOptions?.minSegmentPx ?? 18,
      };

      const chartArea = chart.chartArea;

      const nivelFormatter = new Intl.NumberFormat(options.locale, {
        minimumFractionDigits: options.decimals,
        maximumFractionDigits: options.decimals,
        useGrouping: true,
      });

      const volumenFormatter = new Intl.NumberFormat(options.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
      });

      function formatSignedDiff(rawDiff) {
        const absValue = Math.abs(rawDiff);
        const isVolumen = options.valueType === "volumen";
        const unidad = isVolumen ? " L" : " m";

        const formatted = isVolumen
          ? volumenFormatter.format(absValue)
          : nivelFormatter.format(absValue);

        if (rawDiff > 0) {
          return `${options.showPlusSign ? "+" : ""}${formatted}${unidad}`;
        }

        if (rawDiff < 0) {
          return `-${formatted}${unidad}`;
        }

        return `${formatted}${unidad}`;
      }

      function getStrokeColor(rawDiff) {
        if (rawDiff > 0) return options.positiveColor;
        if (rawDiff < 0) return options.negativeColor;
        return options.zeroColor;
      }

      function boxesOverlap(a, b, spacing = 0) {
        return !(
          a.x + a.w + spacing < b.x ||
          b.x + b.w + spacing < a.x ||
          a.y + a.h + spacing < b.y ||
          b.y + b.h + spacing < a.y
        );
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function findBestLabelPosition(baseX, baseY, labelW, labelH) {
        const candidateOffsets = [
          { dx: 0, dy: -18 },
          { dx: 0, dy: 18 },
          { dx: 12, dy: -18 },
          { dx: -12, dy: -18 },
          { dx: 12, dy: 18 },
          { dx: -12, dy: 18 },
          { dx: 0, dy: -32 },
          { dx: 0, dy: 32 },
          { dx: 18, dy: 0 },
          { dx: -18, dy: 0 },
        ];

        for (const offset of candidateOffsets) {
          const x = clamp(
            baseX + offset.dx - labelW / 2,
            chartArea.left + 2,
            chartArea.right - labelW - 2
          );

          const y = clamp(
            baseY + offset.dy - labelH / 2,
            chartArea.top + 2,
            chartArea.bottom - labelH - 2
          );

          const candidate = { x, y, w: labelW, h: labelH };

          const collision = placedLabels.some((box) =>
            boxesOverlap(candidate, box, options.minLabelSpacing)
          );

          if (!collision) return candidate;
        }

        return {
          x: clamp(
            baseX - labelW / 2,
            chartArea.left + 2,
            chartArea.right - labelW - 2
          ),
          y: clamp(
            baseY - labelH / 2,
            chartArea.top + 2,
            chartArea.bottom - labelH - 2
          ),
          w: labelW,
          h: labelH,
        };
      }

      function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.label !== tanqueSeleccionado) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;

        for (let i = 1; i < dataset.data.length; i++) {
          const prev = dataset.data[i - 1];
          const curr = dataset.data[i];

          if (prev == null || curr == null) continue;

          const prevNum = Number(prev);
          const currNum = Number(curr);

          if (!Number.isFinite(prevNum) || !Number.isFinite(currNum)) continue;

          const prevPoint = meta.data[i - 1];
          const currPoint = meta.data[i];

          if (!prevPoint || !currPoint) continue;

          const x1 = prevPoint.x;
          const y1 = prevPoint.y;
          const x2 = currPoint.x;
          const y2 = currPoint.y;

          if (options.skipIfShortSegment) {
            const segmentPx = Math.hypot(x2 - x1, y2 - y1);
            if (segmentPx < options.minSegmentPx) continue;
          }

          const rawDiff = currNum - prevNum;

          if (options.hideZero && rawDiff === 0) continue;

          const label = formatSignedDiff(rawDiff);
          const color = getStrokeColor(rawDiff);

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          ctx.save();
          ctx.font = options.font;

          const textMetrics = ctx.measureText(label);
          const textW = textMetrics.width;
          const textH = 11;

          const labelW = textW + options.paddingX * 2;
          const labelH = textH + options.paddingY * 2;

          // Ubicación base: arriba si la línea sube visualmente, abajo si baja
          const baseY = y2 < y1 ? midY - options.labelOffset : midY + options.labelOffset;

          const box = findBestLabelPosition(midX, baseY, labelW, labelH);

          if (options.showGuideLine) {
            ctx.strokeStyle = "rgba(120, 120, 120, 0.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2);
            ctx.stroke();
          }

          ctx.fillStyle = options.backgroundColor;
          ctx.strokeStyle = color;
          ctx.lineWidth = options.borderWidth;
          roundRect(ctx, box.x, box.y, box.w, box.h, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, box.x + box.w / 2, box.y + box.h / 2 + 0.5);

          placedLabels.push(box);
          ctx.restore();
        }
      });
    },
  };

const extremaPlugin = {
  id: "extremaPlugin",

  afterDatasetsDraw(chart, args, pluginOptions) {
    const ctx = chart.ctx;
    const tanqueSeleccionado =
      pluginOptions?.nombreTanque ?? chart.options?.nombreTanque;

    if (!tanqueSeleccionado) return;

    const mostrarNiveles = chart.options.datasetsPluggins ?? true;
    const factorTanque = Number(chart.options.factorTanque ?? 1);

    const options = {
      locale: pluginOptions?.locale || "es-CO",
      valueType:
        pluginOptions?.valueType ??
        (mostrarNiveles ? "nivel" : "volumen"),
      valuesAlreadyScaled:
        pluginOptions?.valuesAlreadyScaled ?? !mostrarNiveles,
      font: pluginOptions?.font || "12px Arial",
      textColor: pluginOptions?.textColor || "#111",
      maxPointColor: pluginOptions?.maxPointColor || "blue",
      minPointColor: pluginOptions?.minPointColor || "orange",
      pointRadius: pluginOptions?.pointRadius ?? 6,
      labelOffsetX: pluginOptions?.labelOffsetX ?? 8,
      labelOffsetY: pluginOptions?.labelOffsetY ?? -8,
      paddingX: pluginOptions?.paddingX ?? 6,
      paddingY: pluginOptions?.paddingY ?? 4,
      backgroundColor:
        pluginOptions?.backgroundColor || "rgba(255,255,255,0.92)",
      borderColor: pluginOptions?.borderColor || "rgba(0,0,0,0.2)",
      minLabelSpacing: pluginOptions?.minLabelSpacing ?? 4,
    };

    const placedLabels = [];
    const chartArea = chart.chartArea;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function boxesOverlap(a, b, spacing = 0) {
      return !(
        a.x + a.w + spacing < b.x ||
        b.x + b.w + spacing < a.x ||
        a.y + a.h + spacing < b.y ||
        b.y + b.h + spacing < a.y
      );
    }

    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function formatNivel(value) {
      return new Intl.NumberFormat(options.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(value);
    }

    function formatVolumen(value) {
      return new Intl.NumberFormat(options.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
      }).format(value);
    }

    function getDisplayedValue(rawValue) {
      if (options.valueType !== "volumen") {
        return rawValue;
      }

      return options.valuesAlreadyScaled
        ? rawValue
        : rawValue * factorTanque;
    }

    function formatDisplayedValue(rawValue) {
      const displayedValue = getDisplayedValue(rawValue);
      const isVolumen = options.valueType === "volumen";
      const formatted = isVolumen
        ? formatVolumen(displayedValue)
        : formatNivel(displayedValue);

      return `${formatted}${isVolumen ? " L" : " m"}`;
    }

    function findBestLabelPosition(baseX, baseY, labelW, labelH) {
      const candidateOffsets = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -18 },
        { dx: 0, dy: 18 },
        { dx: 12, dy: -12 },
        { dx: 12, dy: 12 },
        { dx: -12, dy: -12 },
        { dx: -12, dy: 12 },
        { dx: 18, dy: 0 },
        { dx: -18, dy: 0 },
      ];

      for (const offset of candidateOffsets) {
        const x = clamp(
          baseX + offset.dx,
          chartArea.left + 2,
          chartArea.right - labelW - 2
        );

        const y = clamp(
          baseY + offset.dy,
          chartArea.top + 2,
          chartArea.bottom - labelH - 2
        );

        const candidate = { x, y, w: labelW, h: labelH };

        const collision = placedLabels.some((box) =>
          boxesOverlap(candidate, box, options.minLabelSpacing)
        );

        if (!collision) return candidate;
      }

      return {
        x: clamp(baseX, chartArea.left + 2, chartArea.right - labelW - 2),
        y: clamp(baseY, chartArea.top + 2, chartArea.bottom - labelH - 2),
        w: labelW,
        h: labelH,
      };
    }

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.label !== tanqueSeleccionado) return;

      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden) return;

      const validPoints = dataset.data
        .map((v, i) => ({
          num: Number(v),
          index: i,
        }))
        .filter((item) => Number.isFinite(item.num));

      if (validPoints.length === 0) return;

      const max = Math.max(...validPoints.map((p) => p.num));
      const min = Math.min(...validPoints.map((p) => p.num));

      validPoints.forEach(({ num, index }) => {
        if (num !== max && num !== min) return;

        const point = meta.data[index];
        if (!point) return;

        const isMax = num === max;
        const label = `${isMax ? "Max" : "Min"}: ${formatDisplayedValue(num)}`;

        ctx.save();

        ctx.beginPath();
        ctx.arc(point.x, point.y, options.pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isMax ? options.maxPointColor : options.minPointColor;
        ctx.fill();

        ctx.font = options.font;
        const textMetrics = ctx.measureText(label);
        const textW = textMetrics.width;
        const textH = 12;

        const labelW = textW + options.paddingX * 2;
        const labelH = textH + options.paddingY * 2;

        const baseX = point.x + options.labelOffsetX;
        const baseY = point.y + options.labelOffsetY - labelH / 2;

        const box = findBestLabelPosition(baseX, baseY, labelW, labelH);

        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = 1;
        roundRect(ctx, box.x, box.y, box.w, box.h, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = options.textColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          label,
          box.x + options.paddingX,
          box.y + box.h / 2 + 0.5
        );

        placedLabels.push(box);
        ctx.restore();
      });
    });
  },
};

  function withScaling(basePlugin) {
    return {
      ...basePlugin,
      afterDatasetsDraw(chart, ...args) {
        const mostrarNiveles = chart.options.datasetsPluggins ?? true;
        const factor = chart.options.factorTanque ?? 1;

        const originalData = chart.data.datasets.map((ds) => [...ds.data]);

        chart.data.datasets.forEach((ds) => {
          ds.data = ds.data.map((v) => {
            if (v === null) return null;
            return mostrarNiveles ? v : v * factor;
          });
        });

        basePlugin.afterDatasetsDraw(chart, ...args);

        chart.data.datasets.forEach((ds, i) => {
          ds.data = originalData[i];
        });
      },
    };
  }

  const pluginsMap = {
    deltaPlugin: withScaling(deltaPlugin),
    slopePlugin: withScaling(slopePlugin),
    extremaPlugin: withScaling(extremaPlugin),
  };

  const activePlugin = pluginsMap[pluginActivo] ?? pluginsMap.deltaPlugin;

  return (
    <Dialog
      open={modalIsOpen}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "94vw",
          maxWidth: "1500px",
          height: "92vh",
          maxHeight: "92vh",
          borderRadius: 4,
          background:
            "linear-gradient(180deg, #f8fbff 0%, #f8fafc 28%, #ffffff 100%)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: 0, }}>
        <Box
          sx={{
            px: 3,
            py: 2.0,
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            background: "linear-gradient(135deg, rgba(175, 235, 168, 0.65) 0%, rgba(187,222,251,0.95) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "flex-start" }}
          >
            <Box sx={{
              flex: 1, minWidth: 0,
            }}>

              <Typography variant="h5" sx={{ fontWeight: 750, lineHeight: 1.15 }}>
                Monitoreo diario del tanque{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  TK-{nombreTanque}
                </Box>
              </Typography>
            </Box>

            <Button
              onClick={onClose}
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              sx={{ borderRadius: 2, alignSelf: { xs: "stretch", md: "auto" } }}
            >
              Cerrar
            </Button>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 1, overflow: "auto" }}>
        <Stack spacing={2.5}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Grid container spacing={1.25} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mes de consulta"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Anotación visual</InputLabel>
                  <Select
                    value={pluginActivo}
                    label="Anotación visual"
                    onChange={(e) => setPluginActivo(e.target.value)}
                  >
                    <MenuItem value="deltaPlugin">Delta Escalonado ⭐</MenuItem>
                    <MenuItem value="slopePlugin">Delta Ingreso_Salida ⭐</MenuItem>
                    <MenuItem value="extremaPlugin">Delta MaxMin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  onClick={toggleAll}
                  disabled={!usuarioAutorizado}
                  variant="contained"
                  startIcon={
                    datasetsHidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />
                  }
                  sx={{
                    height: 40,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  {datasetsHidden ? "Mostrar todas" : "Ocultar todas"}
                </Button>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  onClick={setVisualizacionNivelesOVolumen}
                  disabled={!usuarioAutorizado}
                  variant="outlined"
                  sx={{
                    height: 40,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {datasetsPluggins ? "Ver en volumen" : "Ver en niveles"}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.15 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 0.4,
                    borderRadius: 2.5,
                    bgcolor: "grey.100",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Tabs
                    value={vistaActiva}
                    onChange={(_, value) => setVistaActiva(value)}
                    variant="fullWidth"
                    sx={{
                      minHeight: 40,
                      "& .MuiTabs-indicator": {
                        display: "none",
                      },
                      "& .MuiTab-root": {
                        minHeight: 40,
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: "text.secondary",
                        px: 1,
                        py: 0.5,
                      },
                      "& .Mui-selected": {
                        bgcolor: "background.paper",
                        color: "primary.main",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <Tab
                      value="grafica"
                      icon={<ShowChartIcon sx={{ fontSize: 17 }} />}
                      iconPosition="start"
                      label="Gráfica"
                    />
                    <Tab
                      value="tabla"
                      icon={<TableChartIcon sx={{ fontSize: 17 }} />}
                      iconPosition="start"
                      label="Tabla"
                    />
                  </Tabs>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    fullWidth
                    onClick={exportToCSV}
                    disabled={!usuarioAutorizado}
                    variant="contained"
                    color="success"
                    startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      height: 40,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 700,
                      boxShadow: "none",
                    }}
                  >
                    CSV
                  </Button>

                  <Button
                    fullWidth
                    onClick={exportToPDF}
                    disabled={!usuarioAutorizado}
                    variant="contained"
                    color="warning"
                    startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      height: 40,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 700,
                      boxShadow: "none",
                    }}
                  >
                    PDF
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {!usuarioAutorizado && (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              Tu rol actual no tiene permisos para algunas acciones como exportar,
              mostrar u ocultar todas las series o cambiar ciertos modos.
            </Alert>
          )}

          {isLoading ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CircularProgress />
              <Typography sx={{ mt: 2, fontWeight: 700 }}>
                Cargando datos del tanque...
              </Typography>
            </Paper>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          ) : chartData && chartData.labels.length > 0 ? (
            <>
              {vistaActiva === "grafica" && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Gráfica diaria / <span style={{ fontSize: 14 }}>Serie principal destacada para TK-{nombreTanque} y
                          visualización mensual completa.</span>
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`Plugin: ${pluginActivo}`} color="primary" variant="outlined" />
                      <Chip label={`Factor tanque: ${factorTanque}`} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      height: 680,
                      p: 1.5,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.paper",
                    }}
                  >
                    <Line
                      key={`${nombreTanque}-${pluginActivo}-${selectedMonth}`}
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        nombreTanque: nombreTanque,
                        datasetsPluggins: datasetsPluggins,
                        factorTanque: factorTanque,
                        interaction: {
                          mode: "nearest",
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: "top",
                            labels: {
                              boxWidth: 14,
                              usePointStyle: true,
                              padding: 12,
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(15, 23, 42, 0.92)",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: true,

                            callbacks: {
                              title: function () {
                                return "";
                              },

                              label: function (context) {
                                const nivel = context.raw;
                                if (nivel === null) return "";

                                const factor = Number(context.chart.options.factorTanque || 1);
                                const volumen = nivel * factor;

                                const nivelFormateado = Number(nivel).toLocaleString("es-CO", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });

                                const volumenFormateado = Number(volumen).toLocaleString("es-CO", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                });

                                return [
                                  ` ${new Date(context.label).toLocaleDateString("es-CO")}`,
                                  `📏 Nivel: ${nivelFormateado} m`,
                                  `🛢️ Volumen: ${volumenFormateado} L`,
                                ];
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            grid: {
                              color: "rgba(148, 163, 184, 0.18)",
                            },
                            ticks: {
                              maxRotation: 0,
                              autoSkip: true,
                              maxTicksLimit: 12,
                            },
                          },
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: "rgba(148, 163, 184, 0.18)",
                            },
                            suggestedMax: (() => {
                              const dataset = chartData.datasets.find(
                                (d) => d.label === nombreTanque
                              );
                              if (!dataset) return undefined;

                              const valores = dataset.data.filter((v) => v !== null);
                              if (!valores.length) return undefined;

                              const maxVal = Math.max(...valores);
                              return Math.ceil(maxVal * 1.1);
                            })(),
                          },
                        },
                      }}
                      plugins={[activePlugin]}
                      ref={chartRef}
                    />
                  </Box>
                </Paper>
              )}

              {vistaActiva === "tabla" && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Tabla de niveles
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Registros del tanque seleccionado en una vista separada y
                        más cómoda.
                      </Typography>
                    </Box>

                    <Chip
                      label={`Filas visibles: ${rawDataTanqueSeleccionado.length}`}
                      variant="outlined"
                    />
                  </Stack>

                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      maxHeight: 680,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Tanque</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Día</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Nivel m</TableCell>
                          <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>Volumen L</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rawDataTanqueSeleccionado.map((row, index) => (
                          <TableRow
                            key={index}
                            hover
                            sx={{
                              "&:nth-of-type(even)": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                              {row.Tanque}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>{row.Día}</TableCell>
                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                              {row.Nivel}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                              {(Number(row.Nivel || 0) * Number(factorTanque || 1)).toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              L
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Typography variant="h3" sx={{ mb: 1 }}>
                📉
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No hay datos disponibles para este mes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Cambia el periodo o verifica si existen registros cargados para el
                tanque seleccionado.
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default RenderizarGraficoDiarioPorTanque;