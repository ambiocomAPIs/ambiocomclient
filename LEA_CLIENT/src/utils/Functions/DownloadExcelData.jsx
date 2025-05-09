import ExcelJS from 'exceljs';

export const ExportExcelWithTemplate = async ({ data, module }) => {
  try {
    // Determinar plantilla
    let filePath, fileName, startRow;
    if (module === "dataTableColors") {
      filePath = '/XLSX_BASE/BASEXLSMCODCOLOR.xlsx';
      fileName = 'MC-SEG-F-01-01 CODIFICACION DE COLOR PARA ALMACENAMIENTO DE REACTIVOS.xlsx';
      startRow = 11;
    } else if (module === "dataTable") {
      filePath = '/XLSX_BASE/BASEXLXMSGMRC.xlsx';
      fileName = 'MC-SEG SEGUIMIENTO GENERAL MATERIAL AMBIOCOM.xlsx';
      startRow = 5;
    } else {
      throw new Error("Módulo no válido.");
    }

    // Descargar el archivo como Blob
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Error al cargar archivo: ${response.statusText}`);
    const blob = await response.blob();

    // Leer el archivo con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await blob.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];

    // Insertar fecha en celda A1 (respetando estilo original)
    const cellA1 = worksheet.getCell('A1');
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    cellA1.value = `Fecha de exportación al día: ${formattedDate}`;

    // Preparar los datos
    const rowsToInsert = data.map(item => {
      if (module === "dataTableColors") {
        return [
          item.Reactivo,
          item.proveedor,
          item.Codigo,
          item.Lote,
          item.fechaVencimiento,
          item.CAS,
          item.Color,
        ];
      } else {
        return [
          item.nombre,
          item.ValorUnitario,
          item.Inventario,
          item.unidad,
          item.ConsumoMensual,
          item.GastoMensual,
          item.proveedor,
          item.lote,
          item.tipo,
          item.area,
          item.fechaIngreso,
          item.fechaVencimiento,
          item.fechaActualizacionInformacion,
          item.cantidadIngreso,
          item.manipulacion || "Sin especificar",
          item.almacenamiento,
          item.responsable,
          item.observaciones || "Ninguna",
          item.SAP,
          item.ConsumoAcumuladoAnual,
          item.GastoAcumulado,
        ];
      }
    });

    // Insertar los datos a partir de la fila segura
    rowsToInsert.forEach((row, index) => {
      const excelRow = worksheet.getRow(startRow + index);
      row.forEach((value, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        cell.value = value ?? '';
      });
      excelRow.commit();
    });

    // Exportar el archivo como descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const blobExcel = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blobExcel);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error al procesar la exportación:", error);
  }
};
