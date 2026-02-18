import React from "react";
import { Button } from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExcelDownloadButton = ({ data, columnasVisibles, columnas, filename = "reporte.xlsx" }) => {
  const handleDownload = () => {
    // Crear encabezados visibles según columnas filtradas
    const headers = ["Fecha Registro", ...columnas
      .filter(c => columnasVisibles.includes(c.key))
      .map(c => c.nombre), "Observaciones", "Responsable"];

    // Crear filas con los datos visibles y filtrados
    const rows = data.map(row => {
      return [
        row.fecha,
        ...columnas
          .filter(c => columnasVisibles.includes(c.key))
          .map(c => row.lecturas?.[c.key] ?? ""),
        row.observaciones ?? "",
        row.responsable ?? "",
      ];
    });

    // Combinar headers + rows
    const worksheetData = [headers, ...rows];

    // Crear libro de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    // Generar archivo Excel en formato binario
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // Guardar archivo con file-saver
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, filename);
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={handleDownload}
      startIcon={
        <img
          src="/Icons/excelIcon.png"
          alt="Excel Icon"
          style={{ width: 18, height: 24 }}
        />
      }
    >
    Excel
    </Button>
  );
};

export default ExcelDownloadButton;
