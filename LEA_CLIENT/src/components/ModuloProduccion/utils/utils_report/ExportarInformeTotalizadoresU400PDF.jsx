import React from "react";
import { Button } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

const METRICAS = [
  ["renConsumo", "Consumo REN neto", "REN neto"],
  ["prodTotal", "Producción por totalizador", "Producción"],
  ["fdeTotal", "FDE descontado", "FDE"],
  ["tk402Total", "Volumen TK402A/B", "TK402A/B"],
  ["renNivelTotal", "Consumo REN por niveles", "REN niveles"],
  ["ab801Total", "Traslado 801A/B", "801A/B"],
  ["difProdTraslado", "Diferencia Producción / TK402", "Dif. PROD/TK402"],
  ["errorTrasladoPct", "Error Producción / TK402", "% PROD/TK402", "pct"],
  ["difRenNiveles", "Diferencia REN / niveles", "Dif. REN/Niv."],
  ["errorRenNivelesPct", "Error REN / niveles", "% REN/Niv.", "pct"],
  ["difAcumRenProd", "Diferencia absoluta REN / producción", "Dif. REN/Prod."],
  ["errorTotalizadoresPct", "Error entre totalizadores", "% Totaliz.", "pct"],
  ["fcPorTotalizador", "Factor por totalizador", "Fc totaliz.", "factor"],
  ["fcRenNiveles", "Factor REN / niveles", "Fc REN/Niv.", "factor"],
];

const fmt = (value, type) => {
  if (value === "" || value == null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("es-CO", type === "pct"
    ? { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { maximumFractionDigits: type === "factor" ? 4 : 2 });
};

const ExportarInformeTotalizadoresU400PDF = ({
  desde, hasta, totals = {}, dailyTotals = [], incidents = [],
  factorsByMonth = {}, disabled = false, buttonText = "Informe PDF",
}) => {
  const generarPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const margin = 12;
      let y = 36;
      const section = (title) => {
        if (y > height - 35) { doc.addPage(); y = 36; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(24, 54, 88);
        doc.text(title, margin, y);
        y += 5;
      };
      const table = (head, body, options = {}) => {
        autoTable(doc, {
          startY: y, head: [head], body,
          margin: { top: 36, bottom: 16, left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
          headStyles: { fillColor: [24, 54, 88], textColor: 255 },
          alternateRowStyles: { fillColor: [244, 247, 251] },
          rowPageBreak: "avoid", ...options,
        });
        y = doc.lastAutoTable.finalY + 10;
      };
      section("1. Indicadores acumulados del período");
      table(["Indicador", "Valor", "Indicador", "Valor"], METRICAS.slice(0, 7).map((m, i) => {
        const other = METRICAS[i + 7];
        return [m[1], fmt(totals[m[0]], m[3]), other[1], fmt(totals[other[0]], other[3])];
      }));
      section("2. Factores mensuales utilizados");
      table(["Mes", "Factor TK402", "Factor 801A/B"], Object.entries(factorsByMonth)
        .filter(([month]) => (!desde || month >= desde.slice(0, 7)) && (!hasta || month <= hasta.slice(0, 7)))
        .map(([month, f]) => [month, String(f.factor402 ?? "—"), String(f.factor801 ?? "—")]));
      doc.addPage(); y = 36;
      section("3. Totales diarios de producción y consumo");
      const dailyTable = (metrics) => table(["Fecha", ...metrics.map(m => m[2])], [
        ...dailyTotals.map(day => [day.fecha, ...metrics.map(m => fmt(day.totals?.[m[0]], m[3]))]),
        ["ACUMULADO", ...metrics.map(m => fmt(totals[m[0]], m[3]))],
      ], { columnStyles: Object.fromEntries(metrics.map((_, i) => [i + 1, { halign: "right" }])),
        didParseCell: (data) => { if (data.section === "body" && data.row.index === dailyTotals.length) { data.cell.styles.fontStyle = "bold"; data.cell.styles.fillColor = [224, 235, 246]; } } });
      dailyTable(METRICAS.slice(0, 6));
      section("4. Diferencias, errores y factores de consumo por día");
      dailyTable(METRICAS.slice(6));
      section(`5. Alertas operativas (${incidents.length})`);
      table(["Fecha", "Turno", "Alerta", "Descripción"], incidents.length
        ? incidents.map(item => [item.fecha || "—", item.turno || "—", item.title || item.section || "Alerta", item.description || ""])
        : [["—", "—", "Sin alertas detectadas", "No se identificaron alertas en el período consultado."]],
        { columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 65 } } });
      if (y > height - 24) { doc.addPage(); y = 36; }
      doc.setFontSize(8); doc.setTextColor(80);
      doc.text(doc.splitTextToSize("Nota: informe de consulta. Los acumulados y porcentajes corresponden a los cálculos del módulo. Un guion indica ausencia de valor calculado. Las alertas representan posibles inconsistencias, no errores confirmados.", width - 2 * margin), margin, y);
      const pages = doc.getNumberOfPages();
      for (let page = 1; page <= pages; page++) {
        doc.setPage(page);
        doc.setFillColor(24, 54, 88); doc.rect(0, 0, width, 23, "F");
        doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
        doc.text("AMBIOCOM | Seguimiento de totalizadores U400", margin, 10);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(`Período: ${desde || "—"} a ${hasta || "—"}  |  Solo lectura`, margin, 17);
        doc.setTextColor(90); doc.setFontSize(8);
        doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, margin, height - 7);
        doc.text(`Página ${page} de ${pages}`, width - margin, height - 7, { align: "right" });
      }
      doc.save(`Informe_Totalizadores_U400_${desde || "inicio"}_${hasta || "fin"}.pdf`);
    } catch (error) {
      console.error("Error generando informe U400:", error);
      Swal.fire({ icon: "error", title: "No se pudo generar el PDF", text: error.message });
    }
  };
  return (
    <Button variant="outlined" color="primary" size="small"
      startIcon={<PictureAsPdfOutlinedIcon />} onClick={generarPDF}
      disabled={disabled || !dailyTotals.length}>
      {buttonText}
    </Button>
  );
};

export default ExportarInformeTotalizadoresU400PDF;
