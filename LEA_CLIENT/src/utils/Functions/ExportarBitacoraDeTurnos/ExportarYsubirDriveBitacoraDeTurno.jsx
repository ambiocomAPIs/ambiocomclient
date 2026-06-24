import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { registerDejaVuFont } from "../../../assets/fonts/DejaVuSans.js"; 
// 🔹 Importa la función que registra la fuente en el doc

const turnosShorted = [
  { value: "TurnoMañana(6:00-14:00)", short: "T1-0614", priority: 1 },
  { value: "TurnoTarde(14:00-22:00)", short: "T2-1422", priority: 2 },
  { value: "TurnoNoche(22:00-06:00)", short: "T3-2206", priority: 3 },
  { value: "TurnoAdministrativo(07:30-17:30)", short: "TA-07:17", priority: 4 },
  { value: "Turno12Horas(06:00-18:00)", short: "T12-0618", priority: 5 },
  { value: "Turno12Horas(18:00-06:00)", short: "T12-1806", priority: 6 },
];

// 🔹 Función para dibujar un rectángulo con gradiente
function drawGradientRect(doc, x, y, width, height, startColor, endColor) {
  const steps = 100;
  const [r1, g1, b1] = startColor;
  const [r2, g2, b2] = endColor;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    doc.setFillColor(r, g, b);
    doc.rect(x + (width / steps) * i, y, width / steps + 1, height, "F");
  }
}

// 🔹 Helper para normalizar fecha
const normalizeDate = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

// 🔹 Helper para prioridad
const getPriority = (turnoValue) => {
  const t = turnosShorted.find((t) => t.value === turnoValue);
  return t ? t.priority : Infinity;
};

export async function exportarBitacoraPDF(headerData, notes) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  // 🔹 Registrar DejaVuSans en el documento
  registerDejaVuFont(doc);

  // 🔹 Encabezados en Times
  doc.setFont("times", "normal");

  // 🔹 Cargar logo desde /public
  const logoUrl = "/LogoCompany/logoambiocomsinfondo.png"; 
  const logoBase64 = await toBase64(logoUrl);
  doc.addImage(logoBase64, "PNG", 9, 7, 60, 18);

  // 🔹 Fondo con gradiente para el título
  drawGradientRect(doc, 0, 28, 210, 12, [41, 128, 185], [46, 204, 113]);
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("BITÁCORA DE TURNOS - SUPERVISORES", 105, 36, { align: "center" });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(10, 42, 200, 42);

  // Datos de cabecera
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Fecha: ${headerData.fecha || ""}`, 167, 20);
  doc.text(`Turno: ${headerData.turno || ""}`, 20, 50);
  doc.text(`Supervisor: ${headerData.supervisor || ""}`, 20, 58);
  doc.text(`Operario Destileria: ${headerData.op_destileria || ""}`, 20, 66);
  doc.text(`Operario de calderas: ${headerData.op_caldera || ""}`, 20, 74);
  doc.text(`Auxiliar de calderas: ${headerData.aux_caldera || ""}`, 20, 82);
  doc.text(`Operario de Aguas: ${headerData.op_aguas || ""}`, 20, 90);
  doc.text(`Analista de Laboratorio 1: ${headerData.analista1 || ""}`, 20, 98);
  doc.text(`Analista de Laboratorio 2: ${headerData.analista2 || ""}`, 20, 106);

  // 🔹 Variables de contexto para el filtro
  const currentDate = normalizeDate(headerData.fecha);
  const currentTurno = (headerData.turno || "").trim();
  const currentPriority = getPriority(currentTurno);

  // 🔹 Renderizar notas por sección
  let startY = 120;

  Object.keys(notes).forEach((section) => {
    const sectionNotes = (notes[section] || []).filter((note) => {
      const noteDate = normalizeDate(note.date);
      const noteTurno = (note.turno || "").trim();
      const notePriority = getPriority(noteTurno);
      const noteCompleted = !!note.completed;

      // --- Caso 1: misma fecha y mismo turno ---
      if (noteDate === currentDate && noteTurno === currentTurno) {
        return true;
      }

      // --- Caso 2: misma fecha pero turno posterior ---
      if (noteDate === currentDate && notePriority < currentPriority) {
        return !noteCompleted;
      }

      // --- Caso 3: días anteriores ---
      if (noteDate < currentDate) {
        return !noteCompleted;
      }

      // --- Caso 4: turnos futuros o fechas futuras ---
      return false;
    });

    if (!sectionNotes.length) return;

    // Título de sección en Times
    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.setTextColor(41, 128, 185);
    doc.text(section, 14, startY);

    // Contenido de las notas en DejaVuSans
    doc.setFont("DejaVuSans", "normal");

    const rows = sectionNotes.map((n) => {
      const hora = new Date(n.createdAt).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return [hora, n.text];
    });

    autoTable(doc, {
      startY: startY + 4,
      head: [["Hora", "Descripción"]],
      body: rows,
      theme: "grid",
      styles: { font: "DejaVuSans", fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
      bodyStyles: { fillColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
    });

    startY = doc.lastAutoTable.finalY + 12;

    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }
  });

  // Pie de página en Times
  doc.setFont("times", "normal");
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    doc.text("Ambiocom SAS © 2025", 105, 296, { align: "center" });
  }

  const turnoNameExported =
    turnosShorted.find((t) => t.value === headerData.turno)?.short || "T0000";

  doc.save(`bitacora_${headerData.fecha || "sin_fecha"}_${turnoNameExported || "sin_turno"}.pdf`);
}

// 🔹 Helper: convertir imagen a base64
function toBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}
