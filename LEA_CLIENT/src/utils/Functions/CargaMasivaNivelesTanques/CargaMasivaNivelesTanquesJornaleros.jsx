import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import {
  Button,
  Typography,
  Box,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { Upload, Save } from "@mui/icons-material";

export default function UploadExcelPage() {
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // 📌 estado para Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 📂 Leer Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setExcelData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  // 🚀 Enviar al backend
  const handleSendToBackend = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: "Por favor sube un archivo Excel antes de enviar",
        severity: "warning",
      });
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", selectedFile);

    try {
      setLoading(true);
      const response = await axios.post(
        "https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros/uploadExcel",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ Envío exitoso:", response.data);
      setSnackbar({
        open: true,
        message: "Archivo enviado y procesado correctamente",
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Error al enviar:", error);
      setSnackbar({
        open: true,
        message: "Error al enviar el archivo",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Filtrar solo columnas con encabezado válido
  const validHeaders = excelData.length
    ? Object.keys(excelData[0]).filter((key) => !key.startsWith("__EMPTY"))
    : [];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Carga Masiva de Niveles de Tanques (Excel)
      </Typography>

      <Button
        variant="contained"
        component="label"
        startIcon={<Upload />}
        sx={{ mb: 2 }}
      >
        Subir Archivo Excel
        <input
          type="file"
          hidden
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
        />
      </Button>

      {excelData.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Vista previa de datos:
          </Typography>

          <div style={{ maxHeight: "62vh", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {validHeaders.map((key, index) => (
                    <th
                      key={index}
                      style={{
                        border: "1px solid #ccc",
                        padding: "6px",
                        background: "#f5f5f5",
                      }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {validHeaders.map((key, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          border: "1px solid #ccc",
                          padding: "6px",
                          textAlign: "center",
                        }}
                      >
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🚀 Botón para enviar al backend */}
          <Button
            variant="contained"
            color="success"
            startIcon={<Save />}
            sx={{ mt: 2 }}
            onClick={handleSendToBackend}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Guardar en servidor"}
          </Button>
        </Paper>
      )}

      {/* 📌 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
