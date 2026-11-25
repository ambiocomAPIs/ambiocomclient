import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography
} from '@mui/material';

const NAVY = '#23345c';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function ModalInfoComparacion({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="comparacion-info-title"
    >
      <DialogTitle id="comparacion-info-title" sx={{ color: NAVY, fontWeight: 800 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfoOutlinedIcon sx={{ color: '#175cd3' }} />
          <span>¿Cómo funciona la comparación principal?</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography fontSize={13}>
            <strong>Comparación principal:</strong> selecciona dos mediciones para evaluar la diferencia
            entre ellas. Por defecto se compara la masa del flujómetro con el peso de báscula.
            Esta selección determina qué despachos se muestran cuando activas
            «Solo fuera de tolerancia» y cuántos «pares comparables» aparecen en el resumen.
          </Typography>
          <Typography fontSize={13}>
            <strong>Tolerancia %:</strong> es el límite máximo de desviación porcentual aceptado.
            Se calcula respecto de la primera medición (A) de cada comparación:
          </Typography>
          <Paper variant="outlined" sx={{ bgcolor: '#f4f7fb', p: 1.5, borderRadius: 1.5 }}>
            <Typography fontSize={13} fontWeight={750} textAlign="center" color="#23345c">
              Diferencia = B − A
            </Typography>
            <Typography fontSize={13} fontWeight={750} textAlign="center" color="#23345c">
              Diferencia (%) = ((B − A) / A) × 100
            </Typography>
          </Paper>
          <Typography fontSize={13}>
            <strong>Ejemplo:</strong> flujómetro 32.000 kg (A), báscula 31.920 kg (B).
            La diferencia es −80 kg (−0,25 %). Con una tolerancia de ±0,2 %,
            el despacho queda fuera del límite, tanto por exceso como por defecto.
          </Typography>
          <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: 12.5 } }}>
            La comparación principal solo controla el filtro «Solo fuera de tolerancia»
            y el número de pares comparables del resumen. <strong>No modifica los cálculos
            de las demás columnas.</strong> La tolerancia también resalta en naranja cualquier
            columna porcentual que supere el límite, sin importar la comparación elegida.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Entendido</Button>
      </DialogActions>
    </Dialog>
  );
}
