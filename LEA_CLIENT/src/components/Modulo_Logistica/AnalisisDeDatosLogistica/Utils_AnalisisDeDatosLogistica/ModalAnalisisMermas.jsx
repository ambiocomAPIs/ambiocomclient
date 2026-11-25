import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TextField, Tooltip, Typography
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TroubleshootOutlinedIcon from '@mui/icons-material/TroubleshootOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const NAVY = '#23345c';
const TONES = {
  ok: '#98e4c0',
  fail: '#f7a29c',
  missing: '#b9c6d6',
  soft: '#f5f8fc',
  outline: '#dbe4ef'
};
const format = (n, d = 2) => n == null || !Number.isFinite(n)
  ? '—'
  : new Intl.NumberFormat('es-CO', { maximumFractionDigits: d }).format(n);
const signed = (n, d = 2) => n == null || !Number.isFinite(n)
  ? '—'
  : `${n > 0 ? '+' : ''}${format(n, d)}`;
const valid = n => typeof n === 'number' && Number.isFinite(n) && n > 0;

// Solo para trazabilidad: la regla de comparabilidad (n > 0) se conserva.
const measurementIssue = n => {
  if (n == null || n === '') return 'Medición ausente';
  if (typeof n !== 'number' || !Number.isFinite(n)) return 'Medición no numérica o no finita';
  if (n === 0) return 'Medición en cero';
  if (n < 0) return 'Medición negativa';
  return null;
};

function Donut({ summary, size = 154 }) {
  const total = summary.ok.length + summary.fail.length + summary.missing.length;
  const chartData = {
    labels: ['Cumple', 'No cumple', 'Sin datos'],
    datasets: [{
      data: total ? [summary.ok.length, summary.fail.length, summary.missing.length] : [1],
      backgroundColor: total ? [TONES.ok, TONES.fail, TONES.missing] : ['#e6ebf2'],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 3
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '73%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            if (!total) return 'Sin despachos';
            return `${ctx.label}: ${ctx.parsed} (${format(ctx.parsed * 100 / total, 1)} %)`;
          }
        }
      }
    }
  };
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Doughnut data={chartData} options={options} />
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ position: 'absolute', inset: '28%', pointerEvents: 'none' }}
      >
        <Typography sx={{ fontSize: size > 160 ? 24 : 20, fontWeight: 850, color: NAVY, lineHeight: 1.1 }}>
          {total ? `${format(summary.ok.length * 100 / total, 0)}%` : '—'}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#667085', textAlign: 'center' }}>cumple / total</Typography>
      </Stack>
    </Box>
  );
}

function CountLegend({ summary }) {
  const items = [
    { label: 'Cumple', count: summary.ok.length, color: TONES.ok },
    { label: 'No cumple', count: summary.fail.length, color: TONES.fail },
    { label: 'Sin datos', count: summary.missing.length, color: TONES.missing }
  ];
  return (
    <Stack spacing={0.65} sx={{ flex: 1, minWidth: 105 }}>
      {items.map(item => (
        <Stack key={item.label} direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, color: '#526176' }}>{item.label}</Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
            {format(item.count, 0)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ComparisonCard({ summary, selected, onSelect, onOpenDetail }) {
  const total = summary.ok.length + summary.fail.length + summary.missing.length;
  const comparable = summary.ok.length + summary.fail.length;
  return (
    <Paper
      component="div"
      role="button"
      tabIndex={0}
      variant="outlined"
      onClick={onSelect}
      onDoubleClick={onOpenDetail}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      sx={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        fontFamily: 'inherit', borderRadius: 2, p: 1.6, minWidth: 0,
        bgcolor: selected ? '#f3f7fd' : '#fff',
        borderColor: selected ? '#8daed6' : TONES.outline,
        boxShadow: selected ? '0 0 0 1px #8daed6' : 'none',
        transition: 'border-color .15s, background-color .15s',
        '&:hover': { borderColor: '#91b1d6', bgcolor: '#f8fbff' }
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: NAVY, minHeight: 37, lineHeight: 1.35 }}>
          {summary.pair.label}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.4} flexShrink={0}>
          {selected && <Chip size="small" label="Seleccionado" sx={{ height: 20, fontSize: 9.5, bgcolor: '#e4edf9', color: NAVY }} />}
          <Tooltip title="Ver los registros de esta gráfica (también con doble clic)">
            <IconButton
              size="small"
              aria-label={`Ver datos de ${summary.pair.label}`}
              onClick={event => {
                event.stopPropagation();
                onOpenDetail();
              }}
              onDoubleClick={event => event.stopPropagation()}
              sx={{ color: '#536d90', border: '1px solid #dce6f2', bgcolor: '#f7faff', '&:hover': { bgcolor: '#eaf2fd' } }}
            >
              <OpenInFullRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="center" gap={1.5} sx={{ my: 0.5 }}>
        <Donut summary={summary} />
        <CountLegend summary={summary} />
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="space-between" gap={1}>
        <Typography sx={{ fontSize: 10.5, color: '#667085' }}>
          Cobertura: <strong>{total ? format(comparable * 100 / total, 1) : '—'} %</strong>
        </Typography>
        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#526176' }}>
          {comparable} de {total} pares
        </Typography>
      </Stack>
    </Paper>
  );
}

// Resumen compacto ubicado como quinto elemento de la fila de indicadores.
// Solo presenta las clasificaciones existentes; no modifica sus cálculos.
function MiniPieDetalle({ summary }) {
  if (!summary) return null;

  const ok = summary.ok.length;
  const fail = summary.fail.length;
  const missing = summary.missing.length;
  const total = ok + fail + missing;

  const data = {
    labels: ['Cumple', 'No cumple', 'Sin datos'],
    datasets: [{
      data: total ? [ok, fail, missing] : [1],
      backgroundColor: total
        ? [TONES.ok, TONES.fail, TONES.missing]
        : ['#e6ebf2'],
      borderColor: '#fff',
      borderWidth: 1.5,
      hoverOffset: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => total
            ? `${ctx.label}: ${ctx.parsed} (${format(ctx.parsed * 100 / total, 1)} %)`
            : 'Sin despachos',
        },
      },
    },
  };

  return (
    <Paper
      variant="outlined"
      aria-label="Distribución de resultados de la comparación"
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        px: 1.1,
        py: 0.8,
        borderRadius: 1.7,
        bgcolor: '#fff',
        borderColor: '#dce6f0',
      }}
    >
      <Typography sx={{ color: NAVY, fontSize: 10, fontWeight: 800, mb: 0.5 }}>
        Distribución de resultados
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 62, height: 62, flexShrink: 0 }}>
          <Pie data={data} options={options} />
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
          {[
            { label: 'Cumple', count: ok, color: TONES.ok },
            { label: 'No cumple', count: fail, color: TONES.fail },
            { label: 'Sin datos', count: missing, color: TONES.missing },
          ].map(item => (
            <Stack key={item.label} direction="row" alignItems="center" spacing={0.45}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
              <Typography sx={{ color: '#526176', fontSize: 9, whiteSpace: 'nowrap' }}>
                {item.label}: <strong>{item.count}</strong>
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ComparisonDetailDialog({ open, summary, tolerance, onClose, onInspect }) {

  const [category, setCategory] = useState('all');
  const [detailPage, setDetailPage] = useState(0);
  const [detailPageSize, setDetailPageSize] = useState(25);
  const [query, setQuery] = useState('');

  // Restablecer filtros al abrir una comparación distinta, sin desmontar el Dialog.
  useEffect(() => {
    if (!open) return;
    setCategory('all');
    setDetailPage(0);
    setQuery('');
  }, [open, summary?.pair.key]);

  const fullCount = summary ? summary.ok.length + summary.fail.length + summary.missing.length : 0;
  const comparable = summary ? summary.ok.length + summary.fail.length : 0;
  const coverage = fullCount ? comparable * 100 / fullCount : 0;
  const complianceComparable = comparable ? summary.ok.length * 100 / comparable : null;
  const compliance = fullCount ? summary.ok.length * 100 / fullCount : 0;
  const fieldLabels = {
    facL: 'Programado / facturado', fluL: 'Flujómetro volumétrico',
    fluKg: 'Masa flujómetro', basKg: 'Masa báscula',
    graFluL: 'Gravimétrico flujómetro', graL: 'Gravimétrico báscula',
    cliL: 'Recibido cliente', cliKg: 'Masa recibida cliente'
  };
  const labels = { ok: 'Cumple', fail: 'No cumple', missing: 'Sin datos' };
  const tones = {
    ok: { bg: '#eaf6ef', color: '#347158', border: '#c5e2d2', dot: TONES.ok },
    fail: { bg: '#fbf0ee', color: '#99584f', border: '#ebcfc9', dot: TONES.fail },
    missing: { bg: '#eff3f8', color: '#5b7089', border: '#d9e1eb', dot: TONES.missing }
  };
  const entries = useMemo(() => {
    if (!summary) return [];
    const all = [
      ...summary.ok.map(item => ({ ...item, category: 'ok' })),
      ...summary.fail.map(item => ({ ...item, category: 'fail' })),
      ...summary.missing.map(item => ({ ...item, category: 'missing' }))
    ];
    const term = query.trim().toLocaleUpperCase('es-CO');
    return all.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (!term) return true;
      const ident = item.row.ident || {};
      return [ident.fecha, ident.tiquete, ident.placa, ident.cliente, ident.factura]
        .some(value => String(value ?? '').toLocaleUpperCase('es-CO').includes(term));
    }).sort((a, b) => {
      if (category === 'fail') return Math.abs(b.percentage) - Math.abs(a.percentage);
      return String(b.row.ident?.fecha || '').localeCompare(String(a.row.ident?.fecha || ''));
    });
  }, [summary, category, query]);

  const handleCategory = next => { setCategory(next); setDetailPage(0); };
  const page = Math.min(detailPage, Math.max(0, Math.ceil(entries.length / detailPageSize) - 1));
  const visibleEntries = entries.slice(page * detailPageSize, (page + 1) * detailPageSize);
  const firstLabel = summary ? (fieldLabels[summary.pair.a] || summary.pair.a) : '';
  const secondLabel = summary ? (fieldLabels[summary.pair.b] || summary.pair.b) : '';
  const unit = summary?.pair.unit || '';

  const kpis = summary ? [
    { name: 'Despachos evaluados', value: format(fullCount, 0), detail: 'Total de la gráfica', color: NAVY, bg: '#f5f8fc', border: '#dce6f0' },
    { name: 'Cumplen tolerancia', value: format(summary.ok.length, 0), detail: `${format(compliance, 1)} % total · ${complianceComparable == null ? '—' : format(complianceComparable, 1) + ' %'} comparables`, color: '#36755b', bg: '#f0f8f3', border: '#d2e8d9' },
    { name: 'Fuera de tolerancia', value: format(summary.fail.length, 0), detail: `Fuera de ±${format(tolerance, 3)} %`, color: '#9a5b51', bg: '#fcf4f2', border: '#efd8d3' },
    { name: 'Sin datos comparables', value: format(summary.missing.length, 0), detail: `Cobertura: ${format(coverage, 1)} %`, color: '#5b7089', bg: '#f2f5f9', border: '#dee5ed' }
  ] : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: { xs: 1.5, md: 3 }, overflow: 'hidden', boxShadow: '0 24px 75px rgba(28,45,77,.22)', maxWidth: 1180 } }}
    >
      <DialogTitle sx={{ px: { xs: 2, md: 3 }, py: 2.1, bgcolor: '#f8fafc', borderBottom: '1px solid #dfe7f1' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, flexShrink: 0, bgcolor: '#e6eef9', color: NAVY }}>
              <TroubleshootOutlinedIcon sx={{ fontSize: 23 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>

              <Typography sx={{ fontSize: 10, letterSpacing: 1.3, fontWeight: 850, color: '#7086a3', mb: 0.4 }}>
                AUDITORÍA DE MEDICIONES · DETALLE DE COMPARACIÓN
              </Typography>
              <Typography sx={{ fontSize: { xs: 17, md: 20 }, fontWeight: 850, color: NAVY, lineHeight: 1.25 }}>
                {summary?.pair.label || 'Detalle de comparación'}
              </Typography>

            </Box>
          </Stack>
          <Stack direction="row" alignItems="flex-start" spacing={1.2} sx={{ flexShrink: 0 }}>
            <Tooltip title="Cerrar detalle">
              <IconButton onClick={onClose} aria-label="Cerrar datos de la gráfica" sx={{ border: '1px solid #dde5ef', bgcolor: '#fff', flexShrink: 0, '&:hover': { bgcolor: '#eff3f8' } }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f7f9fc' }}>
        {summary && (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(5, minmax(0, 1fr))',
                },
                gap: 1.1,
                alignItems: 'stretch',
              }}
            >
              {kpis.map(kpi => (
                <Paper
                  key={kpi.name}
                  variant="outlined"
                  sx={{
                    p: { xs: 1.3, md: 1.15 },
                    borderRadius: 2,
                    bgcolor: kpi.bg,
                    borderColor: kpi.border,
                    minWidth: 0,
                  }}
                >
                  <Typography sx={{ fontSize: 10, color: '#586981', fontWeight: 700 }}>
                    {kpi.name}
                  </Typography>
                  <Typography sx={{ mt: 0.45, color: kpi.color, fontSize: { xs: 22, md: 23 }, lineHeight: 1.1, fontWeight: 850, fontVariantNumeric: 'tabular-nums' }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: 10, mt: 0.55, color: '#697b90' }}>
                    {kpi.detail}
                  </Typography>
                </Paper>
              ))}
              <Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                <MiniPieDetalle summary={summary} />
              </Box>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: 2, px: 2, py: 1.5, borderColor: '#dfe7f1', bgcolor: '#fff' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.2} sx={{ mb: 1.1 }}>
                <Box>
                  <Typography sx={{ fontSize: 12.5, color: NAVY, fontWeight: 800 }}>Distribución de resultados</Typography>
                  <Typography sx={{ fontSize: 10.5, color: '#718096' }}>Clasificación de los {format(fullCount, 0)} despachos que componen la gráfica</Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`Tolerancia de análisis: ±${format(tolerance, 3)} %`} sx={{ borderColor: '#d7e1ee', bgcolor: '#f7f9fc', color: NAVY, fontWeight: 750 }} />
              </Stack>
              <Box sx={{ height: 9, borderRadius: 5, display: 'flex', bgcolor: '#e9eef4', overflow: 'hidden' }}>
                {fullCount > 0 && [
                  { count: summary.ok.length, color: TONES.ok },
                  { count: summary.fail.length, color: TONES.fail },
                  { count: summary.missing.length, color: TONES.missing }
                ].map((part, index) => (
                  <Box key={index} sx={{ width: `${part.count * 100 / fullCount}%`, bgcolor: part.color, transition: 'width .2s' }} />
                ))}
              </Box>
              <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 1.1 }}>
                {[
                  { label: 'Cumple', count: summary.ok.length, color: TONES.ok },
                  { label: 'No cumple', count: summary.fail.length, color: TONES.fail },
                  { label: 'Sin datos', count: summary.missing.length, color: TONES.missing }
                ].map(item => (
                  <Stack key={item.label} direction="row" spacing={0.65} alignItems="center">
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography sx={{ color: '#65768a', fontSize: 11 }}>{item.label} <strong>{format(item.count, 0)}</strong></Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: '#dfe7f1', bgcolor: '#fff', overflow: 'hidden' }}>
              <Box sx={{ px: 2, pt: 1.8, pb: 1.5, borderBottom: '1px solid #edf1f6' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.3}>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 850, color: NAVY }}>Trazabilidad de los despachos</Typography>
                  </Box>
                  <TextField
                    size="small"
                    value={query}
                    onChange={event => { setQuery(event.target.value); setDetailPage(0); }}
                    placeholder="Buscar tiquete, placa o cliente"
                    inputProps={{ 'aria-label': 'Buscar registros del gráfico' }}
                    sx={{ width: { xs: '100%', md: 265 }, '& .MuiOutlinedInput-root': { bgcolor: '#fafcfe', fontSize: 12 } }}
                  />
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1.5 }}>
                  {[
                    { key: 'all', label: 'Todos', count: fullCount },
                    { key: 'ok', label: 'Cumple', count: summary.ok.length },
                    { key: 'fail', label: 'No cumple', count: summary.fail.length },
                    { key: 'missing', label: 'Sin datos', count: summary.missing.length }
                  ].map(option => {
                    const active = category === option.key;
                    const tone = tones[option.key];
                    return (
                      <Button
                        key={option.key}
                        size="small"
                        variant={active ? 'contained' : 'outlined'}
                        onClick={() => handleCategory(option.key)}
                        sx={{
                          textTransform: 'none', borderRadius: 1.5, fontSize: 11,
                          px: 1.4, fontWeight: 750, minHeight: 31,
                          bgcolor: active ? (tone?.color || NAVY) : '#fff',
                          borderColor: tone?.border || '#d8e2ef',
                          color: active ? '#fff' : (tone?.color || NAVY),
                          '&:hover': { bgcolor: active ? (tone?.color || '#344d7c') : (tone?.bg || '#f3f7fc') }
                        }}
                      >
                        {option.label} · {format(option.count, 0)}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>
              <TableContainer sx={{ maxHeight: '43vh' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 920, '& .MuiTableCell-root': { borderColor: '#edf1f6' } }}>
                  <TableHead>
                    <TableRow>
                      {['Fecha', 'Tiquete', `${firstLabel} (${unit})`, `${secondLabel} (${unit})`, `Δ (${unit})`, 'Δ (%)', 'Evaluación', ...(onInspect ? ['Detalle'] : [])].map((label, index) => (
                        <TableCell key={label} align={index >= 2 && index <= 5 ? 'right' : 'left'} sx={{ color: '#465b76', fontWeight: 850, fontSize: 10.5, bgcolor: '#edf3fa', whiteSpace: 'nowrap', height: 42, borderBottom: '2px solid #d4dfed !important' }}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleEntries.map((item, index) => (
                      <TableRow key={item.row.id} hover sx={{ bgcolor: index % 2 ? '#fbfcfe' : '#fff', '&:hover': { bgcolor: '#f1f6fc !important' } }}>
                        <TableCell sx={{ fontSize: 11.5, whiteSpace: 'nowrap', color: '#607187' }}>{item.row.ident?.fecha || '—'}</TableCell>
                        <TableCell sx={{ fontSize: 11.5, fontWeight: 800, color: NAVY, whiteSpace: 'nowrap' }}>{item.row.ident?.tiquete || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{valid(item.a) ? format(item.a) : '—'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{valid(item.b) ? format(item.b) : '—'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 11.5, color: '#435571', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.diff == null ? '—' : signed(item.diff)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', fontWeight: 850, color: item.category === 'fail' ? '#a26156' : '#4b617a' }}>
                          {item.percentage == null ? '—' : `${signed(item.percentage, 3)} %`}
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={item.category === 'missing'
                              ? `Primera: ${measurementIssue(item.a) || 'válida'} · Segunda: ${measurementIssue(item.b) || 'válida'}`
                              : ''}
                          >
                            <Chip size="small" label={labels[item.category]} sx={{ height: 23, border: `1px solid ${tones[item.category].border}`, borderRadius: 1.2, fontSize: 10, fontWeight: 800, bgcolor: tones[item.category].bg, color: tones[item.category].color }} />
                          </Tooltip>
                        </TableCell>
                        {onInspect && (
                          <TableCell>
                            <Tooltip title="Abrir detalle original del despacho">
                              <IconButton size="small" onClick={() => { onClose(); onInspect(item.row); }} aria-label="Ver despacho" sx={{ color: '#56789d', border: '1px solid #e0e8f2', borderRadius: 1.2, bgcolor: '#f7faff' }}>
                                <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {!visibleEntries.length && (
                      <TableRow><TableCell colSpan={onInspect ? 8 : 7} align="center" sx={{ py: 4, fontSize: 12, color: '#708097' }}>No hay despachos para los filtros aplicados.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={entries.length}
                page={page}
                rowsPerPage={detailPageSize}
                onPageChange={(_, nextPage) => setDetailPage(nextPage)}
                onRowsPerPageChange={event => { setDetailPageSize(Number(event.target.value)); setDetailPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página"
                sx={{ borderTop: '1px solid #e8edf4', '.MuiTablePagination-toolbar': { minHeight: 48 } }}
              />
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #dfe7f1', px: 3, py: 1.4, bgcolor: '#fafbfd' }}>
        <Typography sx={{ mr: 'auto', fontSize: 10.5, color: '#79899e' }}>Conciliación de despachos · Coclí</Typography>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', bgcolor: NAVY, px: 3, borderRadius: 1.5, '&:hover': { bgcolor: '#344d7c' } }}>Cerrar detalle</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ModalDiagnosticoMermas({
  open, onClose, rows = [], pairs = [], desde, hasta, onInspect
}) {
  const [toleranceText, setToleranceText] = useState('0.2');
  const [lastValidTolerance, setLastValidTolerance] = useState(0.2);
  const [selectedKey, setSelectedKey] = useState(null);
  const [detailKey, setDetailKey] = useState(null);
  const [status, setStatus] = useState('fail');
  const [page, setPage] = useState(0);
  const parsed = Number(String(toleranceText).replace(',', '.'));
  const toleranceValid = String(toleranceText).trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  // Ante una entrada inválida se mantiene el último umbral válido, nunca se fuerza 0,2 % silenciosamente.
  const tolerance = toleranceValid ? parsed : lastValidTolerance;

  const summaries = useMemo(() => pairs.map(pair => {
    const result = { pair, ok: [], fail: [], missing: [], sumA: 0, sumB: 0 };
    rows.forEach(row => {
      const a = row.v?.[pair.a];
      const b = row.v?.[pair.b];
      const hasA = valid(a);
      const hasB = valid(b);
      if (!hasA || !hasB) {
        result.missing.push({ row, a, b, hasA, hasB });
        return;
      }
      const diff = b - a;
      const percentage = diff * 100 / a;
      const item = { row, a, b, diff, percentage };
      result.sumA += a;
      result.sumB += b;
      (Math.abs(percentage) <= tolerance ? result.ok : result.fail).push(item);
    });
    return result;
  }), [rows, pairs, tolerance]);

  const selected = summaries.find(s => s.pair.key === selectedKey) || summaries[0];
  const detailSummary = summaries.find(s => s.pair.key === detailKey) || null;
  const selectedItems = selected ? [...selected[status]] : [];
  if (status === 'fail') selectedItems.sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));
  else selectedItems.sort((a, b) => String(b.row.ident?.fecha || '').localeCompare(String(a.row.ident?.fecha || '')));
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(selectedItems.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = selectedItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const comparable = selected ? selected.ok.length + selected.fail.length : 0;
  const net = selected ? selected.sumB - selected.sumA : null;
  const netPct = selected && selected.sumA > 0 ? net * 100 / selected.sumA : null;
  const countAbove = summaries.filter(s => s.fail.length > 0).length;
  const countMissing = summaries.filter(s => s.missing.length > 0).length;

  const choose = (key) => {
    setSelectedKey(key);
    setStatus('fail');
    setPage(0);
  };
  const chooseStatus = next => {
    setStatus(next);
    setPage(0);
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen scroll="paper">
      <DialogTitle sx={{ px: { xs: 2, md: 3 }, py: 1.5, bgcolor: '#fafbfd', borderBottom: '1px solid #e1e8f1' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Stack direction="row" alignItems="center" gap={1}>
            <TroubleshootOutlinedIcon sx={{ color: NAVY }} />
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 850, color: NAVY }}>Diagnóstico de cumplimiento · Despachos</Typography>
              <Typography sx={{ fontSize: 11, color: '#667085' }}>
                {desde} a {hasta} · {format(rows.length, 0)} despachos filtrados · todas las comparaciones
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} aria-label="Cerrar diagnóstico"><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#f7f9fc', px: { xs: 1.5, md: 3 }, py: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.5} sx={{ mt: 1, mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: NAVY }}>Cumplimiento por tipo de comparación</Typography>
            {/* <Typography sx={{ fontSize: 11, color: '#667085' }}>
              Cada despacho se clasifica una sola vez por comparación. Doble clic o ícono superior derecho para ver los datos de cada gráfica.
            </Typography> */}
          </Box>
          <TextField
            size="small"
            label="Tolerancia ± (%)"
            value={toleranceText}
            error={!toleranceValid}
            helperText={!toleranceValid ? 'Ingresa un porcentaje válido mayor o igual a cero' : ''}
            onChange={e => {
              const nextText = e.target.value;
              const nextParsed = Number(String(nextText).replace(',', '.'));
              setToleranceText(nextText);
              setPage(0);
              if (String(nextText).trim() !== '' && Number.isFinite(nextParsed) && nextParsed >= 0) {
                setLastValidTolerance(nextParsed);
              }
            }}
            sx={{ width: { xs: '100%', md: 245 } }}
          />
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Chip variant="outlined" label={`${rows.length} despachos analizados`} sx={{ bgcolor: '#fff' }} />
          <Chip variant="outlined" label={`${summaries.length} comparaciones`} sx={{ bgcolor: '#fff' }} />
          <Chip variant="outlined" label={`${countAbove} comparaciones con incumplimientos`} sx={{ bgcolor: '#fff4f1', borderColor: '#e5c6c0', color: '#8f554d' }} />
          <Chip variant="outlined" label={`${countMissing} comparaciones con datos faltantes`} sx={{ bgcolor: '#f1f5f9', borderColor: '#cdd7e3', color: '#526579' }} />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1.4 }}>
          {summaries.map(summary => (
            <ComparisonCard
              key={summary.pair.key}
              summary={summary}
              selected={selected?.pair.key === summary.pair.key}
              onSelect={() => choose(summary.pair.key)}
              onOpenDetail={() => setDetailKey(summary.pair.key)}
            />
          ))}
        </Box>
        {!summaries.length && <Alert severity="info">No se recibieron definiciones de comparación.</Alert>}
        {selected && (
          <Paper variant="outlined" sx={{ mt: 2, p: { xs: 1.4, md: 2 }, borderRadius: 2, borderColor: TONES.outline }}>
            <Typography sx={{ fontSize: 15, fontWeight: 850, color: NAVY }}>{selected.pair.label}</Typography>
            <Typography sx={{ fontSize: 11, color: '#667085', mt: 0.25 }}>
              Diferencia = segunda − primera. Se evalúa cada despacho con ambas mediciones en {selected.pair.unit}.
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mt: 1.2, mb: 1.2 }}>
              <Button size="small" variant={status === 'fail' ? 'contained' : 'outlined'} onClick={() => chooseStatus('fail')}
                sx={{ bgcolor: status === 'fail' ? '#a9675f' : 'transparent', '&:hover': { bgcolor: status === 'fail' ? '#95574f' : '#faf2f0' }, color: status === 'fail' ? '#fff' : '#92554d', borderColor: '#ddb7b0', textTransform: 'none' }}>
                No cumple ({selected.fail.length})
              </Button>
              <Button size="small" variant={status === 'ok' ? 'contained' : 'outlined'} onClick={() => chooseStatus('ok')}
                sx={{ bgcolor: status === 'ok' ? '#548d76' : 'transparent', '&:hover': { bgcolor: status === 'ok' ? '#467963' : '#f0f8f3' }, color: status === 'ok' ? '#fff' : '#467963', borderColor: '#b6d5c3', textTransform: 'none' }}>
                Cumple ({selected.ok.length})
              </Button>
              <Button size="small" variant={status === 'missing' ? 'contained' : 'outlined'} onClick={() => chooseStatus('missing')}
                sx={{ bgcolor: status === 'missing' ? '#71869f' : 'transparent', '&:hover': { bgcolor: status === 'missing' ? '#5e7289' : '#f2f6fa' }, color: status === 'missing' ? '#fff' : '#5d7189', borderColor: '#c1cfdd', textTransform: 'none' }}>
                Sin datos ({selected.missing.length})
              </Button>
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.3 }}>
              <Chip size="small" variant="outlined" label={`Cobertura: ${rows.length ? format(comparable * 100 / rows.length, 1) : '—'} %`} />
              <Chip size="small" variant="outlined" label={`Diferencia neta comparable: ${signed(net)} ${selected.pair.unit}`} />
              <Chip size="small" variant="outlined" label={`Diferencia neta ponderada: ${netPct == null ? '—' : `${signed(netPct, 3)} %`}`} />
              <Tooltip title="El total neto puede ocultar diferencias positivas y negativas que se compensan; el cumplimiento se cuenta por despacho.">
                <Typography sx={{ fontSize: 11, color: '#667085', alignSelf: 'center', cursor: 'help' }}>¿Por qué puede diferir del donut?</Typography>
              </Tooltip>
            </Stack>
            <TableContainer sx={{ maxHeight: 390, border: '1px solid #e5eaf1', borderRadius: 1.5 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Fecha', 'Tiquete', 'Placa', 'Cliente', `Primera (${selected.pair.unit})`, `Segunda (${selected.pair.unit})`, `Δ (${selected.pair.unit})`, 'Δ (%)', 'Revisar'].map(label => (
                      <TableCell key={label} sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#f2f6fb', whiteSpace: 'nowrap' }}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map(item => (
                    <TableRow key={item.row.id} hover>
                      <TableCell sx={{ fontSize: 11 }}>{item.row.ident?.fecha || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{item.row.ident?.tiquete || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{item.row.ident?.placa || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 11, minWidth: 150 }}>{item.row.ident?.cliente || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 11 }}>{item.hasA === false ? '—' : format(item.a)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 11 }}>{item.hasB === false ? '—' : format(item.b)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 11 }}>{item.diff == null ? '—' : signed(item.diff)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 750 }}>{item.percentage == null ? '—' : `${signed(item.percentage, 3)} %`}</TableCell>
                      <TableCell>
                        <Tooltip title="Abrir las mediciones originales del despacho">
                          <span><IconButton size="small" disabled={!onInspect} onClick={() => onInspect?.(item.row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!visible.length && <TableRow><TableCell colSpan={9} sx={{ py: 3, textAlign: 'center', fontSize: 12, color: '#667085' }}>No hay despachos en esta categoría.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 11, color: '#667085' }}>{selectedItems.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, selectedItems.length)} de ${selectedItems.length}` : '0 registros'}</Typography>
              <Stack direction="row" gap={1}>
                <Button size="small" disabled={currentPage === 0} onClick={() => setPage(x => x - 1)}>Anterior</Button>
                <Button size="small" disabled={currentPage >= pageCount - 1} onClick={() => setPage(x => x + 1)}>Siguiente</Button>
              </Stack>
            </Stack>
            {status === 'missing' && <Alert severity="info" variant="outlined" sx={{ mt: 1.3, fontSize: 12 }}>“Sin datos” incluye los despachos donde falta una o las dos mediciones, o sus valores no son válidos. No se consideran incumplimientos ni se sustituyen por cero.</Alert>}
          </Paper>
        )}
        <Typography sx={{ fontSize: 11, color: '#667085', mt: 1.6 }}>
          Clasificación: cumple cuando |100 × (segunda − primera) / primera| ≤ tolerancia; no cumple cuando la supera; sin datos cuando falta alguna medición válida.
          Los porcentajes de las tortas utilizan todos los despachos filtrados como denominador. Las sumatorias y diferencias netas utilizan únicamente pares completos.
          El umbral es exploratorio: debe contrastarse con tolerancias aprobadas para cada instrumento y tipo de comparación. No se infieren pérdidas físicas a partir de estas diferencias.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e1e8f1', px: 3 }}>
        <Button onClick={onClose}>Cerrar diagnóstico</Button>
      </DialogActions>
      <ComparisonDetailDialog
        open={Boolean(detailSummary)}
        summary={detailSummary}
        tolerance={tolerance}
        onClose={() => setDetailKey(null)}
        onInspect={onInspect}
      />
    </Dialog>
  );
}
