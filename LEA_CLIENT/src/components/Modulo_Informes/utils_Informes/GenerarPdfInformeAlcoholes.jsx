import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { registerDejaVuFont } from "../../../assets/fonts/DejaVuSans.js";
import Chart from "chart.js/auto";

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

function ensureSpace(doc, currentY, neededSpace, bottomMargin = 25) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - bottomMargin) {
    doc.addPage();
    return 20;
  }
  return currentY;
}

async function crearGraficaBarras(zonas) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");

    const labels = zonas.map(z => z.nombre);
    const data = zonas.map(z =>
      z.tanques.reduce(
        (acc, t) => acc + (Number(t.NivelTanque) || 0) * (Number(t.Factor) || 0),
        0
      )
    );

    const colors = [
      "#2C7BE5", "#27AE60", "#F39C12", "#E74C3C", "#8E44AD",
      "#3498DB", "#1ABC9C", "#E67E22", "#C0392B", "#9B59B6"
    ];

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Volumen Total (L)",
          data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 50,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: ctx => ctx.parsed.y.toLocaleString("es-CO") + " L",
            },
          },
          title: {
            display: true,
            text: "Volumen Total de Alcoholes Almacenado  ",
            font: { size: 20, weight: "bold" },
            padding: { top: 10, bottom: 25 },
          },
        },
        scales: {
          x: {
            ticks: { font: { size: 14, weight: "bold" }, color: "#333" },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 13 },
              color: "#555",
              callback: val => val.toLocaleString("es-CO") + " L",
            },
            grid: {
              color: "#eee",
              borderDash: [3, 3],
            },
          },
        },
        animation: false,
      },
      plugins: [{
        id: 'customDataLabels',
        afterDatasetsDraw(chart) {
          const ctx = chart.ctx;
          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
              const val = dataset.data[index];
              ctx.fillStyle = "#000";
              ctx.font = "bold 14px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              ctx.fillText(val.toLocaleString("es-CO") + " L", bar.x, bar.y - 6);
            });
          });
        }
      }],
    });

    setTimeout(() => {
      const base64Image = canvas.toDataURL("image/png");
      chart.destroy();
      resolve(base64Image);
    }, 150);
  });
}

export async function exportarInformeAlcoholesPDF(fecha, zonas) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  registerDejaVuFont(doc);

  let costoTotalGeneral = 0;

  const logoUrl = "/LogoCompany/logoambiocomsinfondo.png";
  const logoBase64 = await toBase64(logoUrl);
  doc.addImage(logoBase64, "PNG", 9, 5, 65, 20);

  drawGradientRect(doc, 0, 28, 210, 12, [41, 128, 185], [46, 204, 113]);
  doc.setFont("DejaVuSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("INFORME DE INVENTARIO DE ALCOHOLES", 105, 36, { align: "center" });

  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Fecha: ${fecha || "No especificada"}`, 160, 20);

  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(10, 42, 200, 42);

  let startY = 50;

  for (const zona of zonas) {
    startY = ensureSpace(doc, startY, 20);

    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(13);
    doc.setTextColor(41, 128, 185);
    doc.text(zona.nombre, 20, startY);

    doc.setFontSize(11);
    doc.setTextColor(0, 77, 64);
    doc.text(
      `${(Number(zona.costoLitro) || 0).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      })} / L`,
      180,
      startY,
      { align: "right" }
    );

    startY += 6;

    if (zona.tanques.length === 0) {
      startY = ensureSpace(doc, startY, 10);

      doc.setFont("DejaVuSans", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("No hay tanques asignados en esta zona.", 22, startY);
      startY += 10;
      continue;
    }

    const rows = zona.tanques.map((t) => {
      const nivel = Number(t.NivelTanque) || 0;
      const factor = Number(t.Factor) || 0;
      const volumen = nivel * factor;

      const nombre =
        t.tipo === "bodega"
          ? `ALM-${t.NombreTanque}`
          : t.mezcla
            ? `MEZCLA-${t.NombreTanque}`
            : `TK-${t.NombreTanque}`;

      return [
        nombre,
        nivel.toFixed(2),
        factor.toFixed(2),
        volumen.toFixed(2),
      ];
    });

    startY = ensureSpace(doc, startY, 30);

    autoTable(doc, {
      startY,
      head: [["Tanque", "Nivel (m)", "Factor (L/m)", "Volumen (L)"]],
      body: rows,
      theme: "grid",
      styles: { font: "DejaVuSans", fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
      bodyStyles: { fillColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: "right" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 30, right: 30 },
      didDrawPage: (data) => {
        startY = data.cursor.y + 6;
      },
    });

    const volumenTotalZona = zona.tanques.reduce(
      (acc, t) => acc + (Number(t.NivelTanque) || 0) * (Number(t.Factor) || 0),
      0
    );

    const costoZona =
      volumenTotalZona * (Number(zona.costoLitro) || 0);

    costoTotalGeneral += costoZona;

    startY = ensureSpace(doc, startY, 12);

    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Total Volumen ${zona.nombre}: ${volumenTotalZona.toLocaleString("es-CO", {
        maximumFractionDigits: 2,
      })} L`,
      30,
      startY
    );

    startY += 6;

    startY = ensureSpace(doc, startY, 10);

    const volumenSAP = Number(zona.volumenSAP) || 0;
    const diferencia = volumenTotalZona - volumenSAP;

    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185); // azul tipo corporate
    doc.text(
      `Volumen SAP ${zona.nombre}: ${volumenSAP.toLocaleString("es-CO", {
        maximumFractionDigits: 2,
      })} L`,
      30,
      startY
    );

    startY += 5;

    startY = ensureSpace(doc, startY, 10);

    if (diferencia > 0) {
      doc.setTextColor(39, 174, 96);    // verde
    } else if (diferencia < 0) {
      doc.setTextColor(243, 156, 18);   // naranja
    } else {
      doc.setTextColor(150, 150, 150);  // gris
    }

    doc.text(
      `Diferencia Inventario vs SAP: ${diferencia.toLocaleString("es-CO", {
        maximumFractionDigits: 2,
      })} L`,
      30,
      startY
    );

    doc.setTextColor(0, 0, 0);
    startY += 6;

    startY = ensureSpace(doc, startY, 10);

    doc.text(
      `Costo Total ${zona.nombre}: ${costoZona.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      })}`,
      30,
      startY
    );

    startY += 10;

    if (zona.comentario && zona.comentario.trim()) {
      startY = ensureSpace(doc, startY, 20);

      doc.setFont("DejaVuSans", "italic");
      doc.setFontSize(10);
      doc.setTextColor(80);

   const pageWidth = doc.internal.pageSize.getWidth();
const marginX = 30;
const contentWidth = pageWidth - marginX * 2;

// 🔹 Limpia caracteres raros que rompen el wrap
const cleanComentario = zona.comentario
  .replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑ.,:;()\-\/$%]/g, "")
  .replace(/(\S{35})/g, "$1 "); // fuerza espacios cada 35 chars

const comentarioText = `Nota: ${cleanComentario}`;

// 🔹 Parte el texto al ancho real
const comentarioLines = doc.splitTextToSize(comentarioText, contentWidth);

// 🔹 Altura del bloque
const lineHeight = 5;
const blockHeight = comentarioLines.length * lineHeight + 4;

// 🔹 Asegura espacio de página
startY = ensureSpace(doc, startY, blockHeight);

// 🔹 Dibuja centrado y respetando ancho
doc.text(comentarioLines, pageWidth / 2, startY, {
  align: "center",
  maxWidth: contentWidth,
});

// 🔹 Avanza cursor
startY += blockHeight;


      doc.setFont("DejaVuSans", "normal");
      doc.setTextColor(0, 0, 0);
    }

    startY += 4;

    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }
  }

  doc.addPage();
  doc.setFont("DejaVuSans", "bold");
  doc.setFontSize(14);
  doc.text(
    `COSTO TOTAL GENERAL: ${costoTotalGeneral.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    })}`,
    105,
    30,
    { align: "center" }
  );

  const graficaBase64 = await crearGraficaBarras(zonas);
  const graficaWidthMM = 170;
  const graficaHeightMM = (graficaWidthMM * 450) / 700;
  doc.addImage(graficaBase64, "PNG", (210 - graficaWidthMM) / 2, 45, graficaWidthMM, graficaHeightMM);

  const pageCount = doc.getNumberOfPages();
  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    doc.text("Ambiocom SAS © 2026", 105, 296, { align: "center" });
  }

  doc.save(`informe_inventario_alcoholes_${fecha || "sin_fecha"}.pdf`);
}
