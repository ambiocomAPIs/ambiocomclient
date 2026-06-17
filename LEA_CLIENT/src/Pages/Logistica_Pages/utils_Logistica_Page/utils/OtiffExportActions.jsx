import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import {
  Button,
  Stack,
  Tooltip,
} from "@mui/material";

import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";

const buildFileName = ({ prefix = "OTIFF", range }) => {
  const from = range?.from || "sin-fecha-inicio";
  const to = range?.to || "sin-fecha-fin";
  return `${prefix}_${from}_${to}`.replaceAll("/", "-").replaceAll(" ", "_");
};

const OtiffExportActions = ({
  targetRef,
  range,
  filePrefix = "Analisis_OTIFF",
}) => {
  const getTargetElement = () => {
    const element = targetRef?.current;

    if (!element) {
      Swal.fire({
        icon: "warning",
        title: "No se encontró el análisis OTIFF",
        text: "No fue posible identificar el bloque para exportar.",
        confirmButtonColor: "#7b1fa2",
      });

      return null;
    }

    return element;
  };

  const captureElement = async () => {
    const element = getTargetElement();
    if (!element) return null;

    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
  };

  const handleExportImage = async () => {
    try {
      const canvas = await captureElement();
      if (!canvas) return;

      const fileName = buildFileName({ prefix: filePrefix, range });
      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = `${fileName}.png`;
      link.click();

      Swal.fire({
        icon: "success",
        title: "Imagen exportada",
        text: "El análisis OTIFF fue exportado como imagen PNG.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error al exportar imagen",
        text: "No fue posible exportar el análisis OTIFF como imagen.",
        confirmButtonColor: "#7b1fa2",
      });
    }
  };

  const handleExportPdf = async () => {
    try {
      const canvas = await captureElement();
      if (!canvas) return;

      const fileName = buildFileName({ prefix: filePrefix, range });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= usableHeight) {
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          position = margin - (imgHeight - heightLeft);
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= usableHeight;
        }
      }

      pdf.save(`${fileName}.pdf`);

      Swal.fire({
        icon: "success",
        title: "PDF exportado",
        text: "El análisis OTIFF fue exportado correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error al exportar PDF",
        text: "No fue posible exportar el análisis OTIFF como PDF.",
        confirmButtonColor: "#7b1fa2",
      });
    }
  };

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      <Tooltip title="Exportar análisis OTIFF como imagen PNG">
        <Button
          size="small"
          variant="outlined"
          startIcon={<ImageOutlinedIcon />}
          onClick={handleExportImage}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: "none",
            backgroundColor: "#fff",
          }}
        >
          Imagen
        </Button>
      </Tooltip>

      <Tooltip title="Exportar análisis OTIFF como PDF">
        <Button
          size="small"
          variant="contained"
          startIcon={<PictureAsPdfOutlinedIcon />}
          onClick={handleExportPdf}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: "none",
            backgroundColor: "#7b1fa2",
            "&:hover": {
              backgroundColor: "#6a1b9a",
            },
          }}
        >
          PDF
        </Button>
      </Tooltip>
    </Stack>
  );
};

export default OtiffExportActions;