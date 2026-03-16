// ESTE COMPONENTE DESCARGA EXCEL, SIN IMPORTAR LA TABLA O PLANTILLA, DESCARGA UN EXCEL PLANO
import React from "react";
import { Button } from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DownloadIcon from "@mui/icons-material/Download";

const EXCLUDED_KEYS = new Set([   // para que no me exporte los indices de la base de datos
  "_id",
  "id",
  "__v",
  "index",
  "indice",
  "createdAt",
  "updatedAt",
]);

const isPlainObject = (value) => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

// Aplana objetos anidados:
// { cliente: { nombre: "ABC" } } -> { "cliente.nombre": "ABC" }
const flattenObject = (obj, prefix = "") => {
  const out = {};

  Object.entries(obj || {}).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      out[newKey] = value
        .map((item) => {
          if (isPlainObject(item)) return JSON.stringify(item);
          return item ?? "";
        })
        .join(", ");
      return;
    }

    if (isPlainObject(value)) {
      Object.assign(out, flattenObject(value, newKey));
      return;
    }

    out[newKey] = value ?? "";
  });

  return out;
};

const shouldExcludeKey = (key) => {
  if (!key) return true;

  const cleanKey = String(key).trim().toLowerCase();

  // excluye la llave exacta
  if (EXCLUDED_KEYS.has(cleanKey)) return true;

  // excluye índices anidados como:
  // tabla.index, meta.indice, data._id, user.id
  const lastSegment = cleanKey.split(".").pop();
  if (EXCLUDED_KEYS.has(lastSegment)) return true;

  return false;
};

const ExcelDownloadButton = ({
  data = [],
  filename = "reporte.xlsx",
  sheetName = "Datos",
  buttonText = "Excel",
  variant = "contained",
  color = "success",
  size = "medium",
  startIcon = <DownloadIcon />,
  disabled = false,
}) => {
  const handleDownload = () => {
    try {
      if (!Array.isArray(data) || data.length === 0) return;

      // Aplana cada fila
      const flattenedRows = data.map((row) => flattenObject(row));

      // Construye conjunto total de columnas encontradas, excluyendo índices e internos
      const allColumns = Array.from(
        new Set(flattenedRows.flatMap((row) => Object.keys(row)))
      ).filter((key) => !shouldExcludeKey(key));

      if (allColumns.length === 0) return;

      // Reordena cada fila para que todas tengan las mismas columnas
      const normalizedRows = flattenedRows.map((row) => {
        const normalized = {};
        allColumns.forEach((col) => {
          normalized[col] = row[col] ?? "";
        });
        return normalized;
      });

      const worksheet = XLSX.utils.json_to_sheet(normalizedRows);

      // Ajuste automático de ancho de columnas
      worksheet["!cols"] = allColumns.map((col) => {
        const maxDataLength = Math.max(
          col.length,
          ...normalizedRows.map((row) => String(row[col] ?? "").length)
        );

        return { wch: Math.min(maxDataLength + 2, 40) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      saveAs(blob, filename);
    } catch (error) {
      console.error("Error al generar Excel:", error);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      startIcon={startIcon}
      onClick={handleDownload}
      disabled={disabled || !Array.isArray(data) || data.length === 0}
    >
      {buttonText}
    </Button>
  );
};

export default ExcelDownloadButton;