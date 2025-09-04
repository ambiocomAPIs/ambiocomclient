import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 🔹 Diccionario de reemplazo de iconos → texto plano
const iconMap = {
  "✅": "[OK]",
  "⚠️": "[ALERTA]",
  "🔥": "[FUEGO]",
  "⏳": "[ESPERA]",
  "❌": "[ERROR]",
  "ℹ️": "[INFO]",
};

// Función que limpia los textos reemplazando los iconos
function sanitizeText(text) {
  if (!text) return "";
  let clean = text;
  Object.keys(iconMap).forEach((icon) => {
    clean = clean.replaceAll(icon, iconMap[icon]);
  });
  return clean;
}

// 🔹 Función para dibujar un rectángulo con gradiente
function drawGradientRect(doc, x, y, width, height, startColor, endColor) {
  const steps = 100; // entre más alto → más suave el gradiente
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

// Función que recibe headerData, notes y el logo (base64 o path público)
export async function exportarBitacoraPDF(headerData, notes) {
  const doc = new jsPDF();

  // 🔹 Cargar logo desde /public
  const logoUrl = "/ambiocom.png";
  const logoBase64 = await toBase64(logoUrl);
  doc.addImage(logoBase64, "PNG", 9, 7, 60, 15);

  // 🔹 Fondo con gradiente para el título
  drawGradientRect(doc, 0, 28, 210, 12, [41, 128, 185], [46, 204, 113]); // azul → verde
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
  doc.text(`Analista de Labotarorio 1: ${headerData.analista1 || ""}`, 20, 98);
  doc.text(`Analista de Labotarorio 2: ${headerData.analista2 || ""}`, 20, 106);

  // 🔹 Renderizar notas por sección
  let startY = 120;

  Object.keys(notes).forEach((section) => {
    const sectionNotes = notes[section];
    if (!sectionNotes || sectionNotes.length === 0) return;

    // Título de sección
    doc.setFontSize(13);
    doc.setTextColor(41, 128, 185);
    doc.text(section, 14, startY);

    // Construir filas con hora corta y texto limpio
    const rows = sectionNotes.map((n) => {
      const hora = new Date(n.createdAt).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return [hora, sanitizeText(n.text)];
    });

    // Renderizar tabla
    autoTable(doc, {
      startY: startY + 4,
      head: [["Hora", "Descripción"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
      bodyStyles: { fillColor: [245, 245, 245] }, // zebra claro
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
    });

    // Calcular posición para la siguiente sección
    startY = doc.lastAutoTable.finalY + 12;

    // Si nos quedamos sin espacio, saltamos de página
    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }
  });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    doc.text("Ambiocom SAS © 2025", 105, 296, { align: "center" });
  }

  // Descargar PDF
  doc.save(`bitacora_${headerData.fecha || "sin_fecha"}.pdf`);
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
