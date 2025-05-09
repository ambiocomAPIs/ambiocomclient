import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import Papa from 'papaparse';

const MyTable = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Cambia 'path/to/your/file.csv' por la ruta real de tu archivo CSV
    Papa.parse('/Files/MLE-CAA-F-06-01 SEGUIMIENTO GENERAL A MATERIAL DE REFERENCIA CERTIFICADO.csv', {
      header: true,
      download: true,
      complete: (results) => {
        setData(results.data);
      },
    });
  }, []);

  return (
    <TableContainer component={Paper} sx={{ margin: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {data.length > 0 && Object.keys(data[0]).map((key) => (
              <TableCell 
                key={key} 
                sx={{ 
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5', 
                  borderRight: '1px solid #ccc' // Separación vertical
                }}
              >
                {key}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {Object.values(row).map((value, idx) => (
                <TableCell 
                  key={idx} 
                  sx={{ 
                    borderRight: '1px solid #ccc', // Separación vertical
                    padding: '4px', // Hacer más pequeño el padding
                    fontSize: '12px', // Hacer más pequeño el texto
                  }}
                >
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MyTable;
