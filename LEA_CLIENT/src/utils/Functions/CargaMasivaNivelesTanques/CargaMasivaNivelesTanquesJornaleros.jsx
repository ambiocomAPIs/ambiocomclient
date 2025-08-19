import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Box, Paper, IconButton } from "@mui/material";
import { Upload, Save, ArrowBack } from "@mui/icons-material";

import Swal from "sweetalert2";
import { LinearProgress } from "@mui/material"; // importa LinearProgress arriba

export default function UploadExcelPage() {
  const navigate = useNavigate();

  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // 📂 Leer Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Validar nombre exacto del archivo
    if (file.name !== "plantilla_carga_masiva_niveles_tanques.xlsx") {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "El archivo ha sido rechazado ya que no es un archivo válido",
      });
      e.target.value = "";
      return;
    }

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
      Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Por favor sube un archivo Excel antes de enviar",
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
      Swal.fire({
        icon: "success",
        title: "Archivo enviado",
        text: "Archivo enviado y procesado correctamente",
      });
    } catch (error) {
      console.error("❌ Error al enviar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al enviar el archivo",
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <IconButton
            color="primary"
            onClick={() => navigate("/principal")}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">Volver</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ m: 0, textAlign: "center", ml: 20 }}
          >
            Carga Masiva de Niveles de Tanques (Excel)
          </Typography>
        </Box>

        {/* 🚀 Botón descargar plantilla arriba derecha */}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Save />}
          onClick={() => {
            const link = document.createElement("a");
            link.href = `public/Files/plantilla_carga_masiva_niveles_tanques.xlsx`;
            link.download = "plantilla_carga_masiva_niveles_tanques.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          Descargar Plantilla
        </Button>
      </Box>

      {/* 📂 Subir Excel */}
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
            {/* ✅ Texto centrado mientras carga */}
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(51, 147, 177, 0.9)",
                  color: "white",
                  p: 2,
                  borderRadius: 2,
                  boxShadow: 3,
                  textAlign: "center",
                }}
              >
                <span>Procesando y almacenando en la Base de Datos...</span>
              </Box>
            )}
          </div>

          {/* 🚀 Botón para enviar al backend */}
          <Box sx={{ mt: 2 }}>
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
            {/* ✅ Barra de carga horizontal */}
            {loading && (
              <LinearProgress
                sx={{ mt: 1, height: 6, borderRadius: 3 }} // opcional: altura y bordes redondeados
                color="success"
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
