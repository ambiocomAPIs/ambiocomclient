import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  List, ListItemButton, ListItemText, Paper, Popover, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ModalDiagnosticoMermas from './Utils_AnalisisDeDatosLogistica/ModalAnalisisMermas';
const API = 'https://ambiocomserver.onrender.com/api/despacho-alcoholes/rango';
const NAVY = '#23345c';

// Cada comparación conserva el mismo tono a través de sus cuatro columnas.
// Los fondos se aplican a TODAS las celdas del bloque, no solo al encabezado.
const COMPARISON_COLORS = {
  fv: { title: '#e9f1fc', header: '#f1f6fd', row: '#f8fbff', alternate: '#f5f9ff', hover: '#eaf3fe', total: '#e5effb', border: '#adc6e5', text: '#365d88' },
  gv: { title: '#eaf4ef', header: '#f2f8f4', row: '#f9fcfa', alternate: '#f5faf7', hover: '#ebf6ef', total: '#e7f3ec', border: '#aecfbd', text: '#346b52' },
  fg: { title: '#f0ecf8', header: '#f6f3fb', row: '#fbfaff', alternate: '#f8f6fd', hover: '#f0eafa', total: '#ece7f6', border: '#c4b6df', text: '#66538b' },
  fb: { title: '#f9f2e8', header: '#fcf8f1', row: '#fffdf9', alternate: '#fdfaf5', hover: '#fbf2e5', total: '#f6ede0', border: '#dfc9a8', text: '#83653f' },
  fc: { title: '#e9f4f5', header: '#f2f9f9', row: '#f9fcfc', alternate: '#f5fafb', hover: '#eaf5f5', total: '#e5f1f2', border: '#acd0d1', text: '#386c70' },
  gc: { title: '#f5edf6', header: '#faf5fa', row: '#fdfafd', alternate: '#faf7fc', hover: '#f5edf8', total: '#f1e8f4', border: '#d5bbd9', text: '#755a7c' },
  vc: { title: '#faefee', header: '#fcf7f6', row: '#fffafa', alternate: '#fdf8f7', hover: '#faeeee', total: '#f5e8e6', border: '#e0bdb8', text: '#865e59' },
  bc: { title: '#edf1f6', header: '#f5f7fa', row: '#fbfcfe', alternate: '#f8fafc', hover: '#edf2f7', total: '#e8eef5', border: '#b8c6d6', text: '#51647c' },
  gff: { title: '#eef4fa', header: '#f5f8fc', row: '#fbfdff', alternate: '#f8fbfe', hover: '#edf4fa', total: '#e9f1f9', border: '#b6cddd', text: '#496c84' },
  fgf: { title: '#edf6f3', header: '#f5faf8', row: '#fbfefd', alternate: '#f7fcfa', hover: '#edf7f3', total: '#e7f3ee', border: '#b0d2c4', text: '#467564' },
  gg: { title: '#f2eff9', header: '#f8f6fc', row: '#fcfbff', alternate: '#faf8fe', hover: '#f1ecfa', total: '#ede8f7', border: '#c7bce1', text: '#685d89' },
  gfc: { title: '#f5f2eb', header: '#faf8f3', row: '#fdfcf9', alternate: '#fbfaf6', hover: '#f5f1e7', total: '#f0ebdf', border: '#d7c9ae', text: '#76694e' }
};

const RECHAZADOS = new Set(['RECHAZADO POR CLIENTE', 'RECHAZADO AMBIOCOM']);
const ESTADOS_VEHICULO = {
  'RECHAZADO POR CLIENTE': { label: 'Rechazado cliente', color: '#b42318', bg: '#fee4e2', border: '#fda29b' },
  'RECHAZADO AMBIOCOM': { label: 'Rechazado Ambiocom', color: '#b42318', bg: '#fee4e2', border: '#fda29b' },
  'APROBADO POR EL CLIENTE': { label: 'Aprobado cliente', color: '#067647', bg: '#dcfae6', border: '#a6f4c5' },
  'APROBADO CON OBSERVACIONES': { label: 'Aprobado c/observ.', color: '#b54708', bg: '#fef0c7', border: '#fedf89' },
  'APROBADO AMBIOCOM': { label: 'Aprobado Ambiocom', color: '#175cd3', bg: '#dbeafe', border: '#bfdbfe' },
  'EN PLANTA': { label: 'En planta', color: '#475467', bg: '#f2f4f7', border: '#d0d5dd' },
  'EN CARGUE': { label: 'En cargue', color: '#175cd3', bg: '#dbeafe', border: '#bfdbfe' },
  'EN TRANSITO': { label: 'En tránsito', color: '#b54708', bg: '#fef0c7', border: '#fedf89' },
  'EN CLIENTE': { label: 'En cliente', color: '#6941c6', bg: '#f4ebff', border: '#e9d7fe' },
};
function EstadoVehiculoChip({ estado }) {
  const original = text(estado);
  const key = norm(original);
  const cfg = ESTADOS_VEHICULO[key] || {
    label: original || 'Sin estado', color: '#475467', bg: '#f2f4f7', border: '#d0d5dd'
  };
  return <Tooltip title={original || 'No se registró el estado del vehículo'} arrow>
    <Chip
      size="small"
      label={cfg.label}
      variant="outlined"
      sx={{
        height: 23, maxWidth: 176, fontSize: 10.5, fontWeight: 750,
        bgcolor: cfg.bg, color: cfg.color, borderColor: cfg.border,
        '& .MuiChip-label': { px: 1, overflow: 'hidden', textOverflow: 'ellipsis' }
      }}
    />
  </Tooltip>;
}
const getDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Rango inicial automático (fechas del calendario local):
// Días 1, 2 y 3: mes anterior completo + días transcurridos del mes actual.
// Desde el día 4: solamente los días transcurridos del mes actual.
// Los campos Desde/Hasta siguen siendo editables para consultas manuales.
const initialRange = () => {
  const hoy = new Date();
  const primerMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth() - (hoy.getDate() <= 3 ? 1 : 0),
    1
  );

  return {
    desde: getDate(primerMes),
    hasta: getDate(hoy)
  };
};
const fmt = (n, d = 2) => n == null || !Number.isFinite(n) ? '—' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: d }).format(n);
const signed = (n, d = 2) => n == null || !Number.isFinite(n) ? '—' : `${n > 0 ? '+' : ''}${fmt(n, d)}`;
const pct = n => n == null ? '—' : `${signed(n, 3)} %`;
const text = v => String(v ?? '').trim();
const norm = v => text(v).toLocaleUpperCase('es-CO');
function number(v) {
  if (v == null || typeof v === 'boolean')
    return null;
  let s = text(v).replace(/\s/g, '');
  if (!s || /^(null|undefined|nan)$/i.test(s))
    return null;
  if (s.includes(',') && s.includes('.'))
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (s.includes(','))
    s = s.replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(s))
    return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
const positive = v => { const n = number(v); return n != null && n > 0 ? n : null; };
const IDENT = [
  ['estado', 'Estado vehículo'], ['fecha', 'Fecha'], ['tiquete', 'Tiquete'], ['factura', 'Remisión / factura'],
  ['cliente', 'Cliente'], ['transportadora', 'Transportadora'], ['conductor', 'Conductor'],
  ['placa', 'Placa'], ['producto', 'Producto'], ['destino', 'Destino'], ['brazo', 'Brazo']
];
const BASES = [
  ['facL', 'Programado / facturado', 'L'], ['fluL', 'Flujómetro', 'L'],
  ['fluKg', 'Flujómetro masa', 'kg'], ['basKg', 'Báscula origen', 'kg'],
  ['density', 'Densidad lab', 'kg/L'],
  ['graFluL', 'Gravimétrico flujómetro', 'L'], ['graL', 'Gravimétrico báscula', 'L'],
  ['cliL', 'Recibido cliente', 'L'], ['cliKg', 'Peso cliente*', 'kg']
];
const PAIRS = [
  { key: 'fv', label: 'Flujómetro − facturado', a: 'facL', b: 'fluL', unit: 'L', group: 'Comercial' },
  { key: 'gv', label: 'Gravimétrico báscula − facturado', a: 'facL', b: 'graL', unit: 'L', group: 'Comercial' },
  { key: 'gff', label: 'Gravimétrico flujómetro − facturado', a: 'facL', b: 'graFluL', unit: 'L', group: 'Comercial' },
  { key: 'fg', label: 'Gravimétrico báscula − flujómetro volumen', a: 'fluL', b: 'graL', unit: 'L', group: 'Instrumentos' },
  { key: 'fgf', label: 'Gravimétrico flujómetro − flujómetro volumen', a: 'fluL', b: 'graFluL', unit: 'L', group: 'Instrumentos' },
  { key: 'gg', label: 'Gravimétrico báscula − gravimétrico flujómetro', a: 'graFluL', b: 'graL', unit: 'L', group: 'Instrumentos' },
  { key: 'fb', label: 'Báscula − flujómetro', a: 'fluKg', b: 'basKg', unit: 'kg', group: 'Instrumentos' },
  { key: 'fc', label: 'Cliente − flujómetro', a: 'fluL', b: 'cliL', unit: 'L', group: 'Destino' },
  { key: 'gc', label: 'Cliente − gravimétrico báscula', a: 'graL', b: 'cliL', unit: 'L', group: 'Destino' },
  { key: 'gfc', label: 'Cliente − gravimétrico flujómetro', a: 'graFluL', b: 'cliL', unit: 'L', group: 'Destino' },
  { key: 'vc', label: 'Cliente − facturado', a: 'facL', b: 'cliL', unit: 'L', group: 'Comercial' },
  { key: 'bc', label: 'Cliente − báscula origen', a: 'basKg', b: 'cliKg', unit: 'kg', group: 'Destino' }
];
function convert(row, index, allowClientKg) {
  const l = row?.lecturas || {};
  const basKg = positive(l.peso_neto_bascula_ambiocom);
  const fluKg = positive(l.peso_neto_contador_ambiocom);
  const density = positive(l.densidadlab_alcohol_tanque);
  return {
    id: String(row?._id || `${row?.fecha || 'sin-fecha'}-${index}`),
    ident: {
      fecha: text(row?.fecha).slice(0, 10), tiquete: text(l.tiquete_bascula), factura: text(l.remision_factura),
      cliente: text(l.cliente), transportadora: text(l.transportadora), conductor: text(l.nombre_conductor),
      placa: text(l.placa), producto: text(l.producto),
      destino: text(l.ciudad_destino || l.ciudad_destino__input || l.destino), brazo: text(l.brazo_despacho), estado: text(l.vehiculo_rechazado)
    },
    v: {
      facL: positive(l.volumen_despachar), fluL: positive(l.volumen_ambiocom_contador),
      fluKg, basKg, density,
      graFluL: fluKg != null && density != null ? fluKg / density : null,
      graL: basKg != null && density != null ? basKg / density : null,
      cliL: positive(l.cantidad_recibida_cliente), cliKg: allowClientKg ? positive(l.kilos_peso_neto) : null
    }
  };
}
function compare(row, p) {
  const a = row.v[p.a], b = row.v[p.b];
  return a > 0 && b > 0 ? { a, b, diff: b - a, pct: (b - a) / a * 100 } : null;
}
const EMPTY = '__SIN_DATO__';
const keyOf = v => v == null || text(v) === '' ? EMPTY : String(v);
function csvExport(rows, pairs) {
  const cols = [
    ...IDENT.map(([k, label]) => ({ label, get: r => r.ident[k] })),
    { label: 'Densidad lab (kg/L)', get: r => r.v.density },
    ...pairs.flatMap(p => [
      { label: `${p.label} | ${p.a} (${p.unit})`, get: r => r.v[p.a] },
      { label: `${p.label} | ${p.b} (${p.unit})`, get: r => r.v[p.b] },
      { label: `${p.label} | Diferencia (${p.unit})`, get: r => compare(r, p)?.diff },
      { label: `${p.label} | Diferencia (%)`, get: r => compare(r, p)?.pct }
    ])
  ];
  const content = [cols.map(c => c.label), ...rows.map(r => cols.map(c => c.get(r) ?? ''))]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analisis_mermas.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const cellSx = { fontSize: 11.5, px: 1, py: .65, whiteSpace: 'nowrap', borderRight: '1px solid #eef1f5', fontVariantNumeric: 'tabular-nums' };
const headSx = { ...cellSx, fontSize: 11, fontWeight: 750, color: '#344563', bgcolor: '#f4f7fb', height: 40 };

function Header({ label, filterKey, selected, options, onApply, sort, sortDirection, onSort, numeric = false, comparisonTone = null, groupStart = false }) {

  const [anchor, setAnchor] = useState(null);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState([]);
  const active = Array.isArray(selected);
  const choices = useMemo(() => options.filter(o => norm(o.label).includes(norm(q))), [options, q]);
  const openFilter = e => { e.stopPropagation(); setDraft(selected ? [...selected] : options.map(o => o.key)); setQ(''); setAnchor(e.currentTarget); };
  const toggle = v => setDraft(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const selectVisible = () => setDraft(prev => [...new Set([...prev, ...choices.map(o => o.key)])]);
  const removeVisible = () => setDraft(prev => prev.filter(v => !choices.some(x => x.key === v)));

  return <TableCell
    align={numeric ? 'right' : 'left'}
    sx={{
      ...headSx,
      minWidth: numeric ? 105 : filterKey === 'cliente' ? 185 : filterKey === 'conductor' ? 155 : 95,
      ...(comparisonTone && {
        bgcolor: comparisonTone.header,
        color: comparisonTone.text,
        borderBottom: `2px solid ${comparisonTone.border}`,
        ...(groupStart && { borderLeft: `3px solid ${comparisonTone.border}` })
      })
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={.15}>
      <Tooltip title={label}>
        <Typography sx={{ fontSize: 11, fontWeight: 750, maxWidth: numeric ? 150 : 175, whiteSpace: 'normal', lineHeight: 1.15 }}>
          {label}
        </Typography>
      </Tooltip>
      <Stack direction="row" alignItems="center" spacing={0}>
        <Tooltip
          title={
            sort === filterKey
              ? sortDirection === 'asc'
                ? 'Orden ascendente · clic para descendente'
                : 'Orden descendente · clic para ascendente'
              : 'Ordenar columna'
          }
          arrow
        >
          <IconButton
            size="small"
            aria-label={`Ordenar ${label}`}
            onClick={() => onSort(filterKey)}
            sx={{
              width: 25,
              height: 25,
              p: 0.25,
              borderRadius: 1,
              color:
                sort === filterKey
                  ? '#175cd3'
                  : '#64748b',
              bgcolor:
                sort === filterKey
                  ? '#dbeafe'
                  : 'transparent',
              border:
                sort === filterKey
                  ? '1px solid #bfdbfe'
                  : '1px solid transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#175cd3',
                bgcolor: '#eaf2ff',
                borderColor: '#bfdbfe'
              }
            }}
          >
            {sort === filterKey ? (
              sortDirection === 'asc' ? (
                <ArrowUpwardRoundedIcon
                  sx={{
                    fontSize: 19
                  }}
                />
              ) : (
                <ArrowDownwardRoundedIcon
                  sx={{
                    fontSize: 19
                  }}
                />
              )
            ) : (
              <UnfoldMoreIcon
                sx={{
                  fontSize: 19
                }}
              />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={active ? `Filtro activo: ${selected.length} valores` : 'Filtrar como en Excel'}>
          <IconButton
            size="small"
            onClick={openFilter}
            sx={{ p: .3, color: active ? '#1565c0' : '#8a98ae', bgcolor: active ? '#dcecff' : 'transparent' }}
          >
            <FilterAltOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { width: 290, borderRadius: 2, p: 1.3, boxShadow: '0 12px 40px #172b4d33' } }}
    >
      <Typography fontWeight={800} fontSize={13} mb={1}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar valores..."
        value={q}
        onChange={e => setQ(e.target.value)}
        InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ fontSize: 17, mr: .5, color: '#7b889e' }} /> }}
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" mt={.5}>
        <Button size="small" sx={{ fontSize: 11 }} onClick={selectVisible}>Seleccionar visibles</Button>
        <Button size="small" sx={{ fontSize: 11 }} onClick={removeVisible}>Deseleccionar</Button>
      </Stack>
      <Divider sx={{ my: .5 }} />
      <List dense disablePadding sx={{ height: 210, overflowY: 'auto' }}>
        {choices.map(o => <ListItemButton
          dense
          key={o.key}
          onClick={() => toggle(o.key)}
          sx={{ py: 0, px: .5, borderRadius: 1 }}
        >
          <Checkbox size="small" checked={draft.includes(o.key)} sx={{ p: .6 }} />
          <ListItemText
            primary={o.label}
            primaryTypographyProps={{ fontSize: 12, noWrap: true }}
            secondary={o.count ? `${o.count} registros` : undefined}
            secondaryTypographyProps={{ fontSize: 10 }}
          />
        </ListItemButton>)}
        {!choices.length && <Typography sx={{ p: 2, fontSize: 12 }} color="text.secondary">Sin coincidencias</Typography>}
      </List>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button size="small" onClick={() => { onApply(filterKey, null); setAnchor(null); }}>Quitar filtro</Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => { onApply(filterKey, draft); setAnchor(null); }}
        >Aplicar ({draft.length})</Button>
      </Stack>
    </Popover>
  </TableCell>;
}
export default function AnalisisMermasDespachos({ kilosPesoNetoEsCliente = false, volumenDespacharEsFacturado = false }) {
  const [start] = useState(initialRange);
  const [desde, setDesde] = useState(start.desde), [hasta, setHasta] = useState(start.hasta);
  const [request, setRequest] = useState(start), [version, setVersion] = useState(0);
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState({ key: 'fecha', dir: 'desc' });
  const [page, setPage] = useState(0), [perPage, setPerPage] = useState(25);
  const [detail, setDetail] = useState(null);
  const [diagnosticoOpen, setDiagnosticoOpen] = useState(false);
  const invalidDate = !desde || !hasta || desde > hasta;
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    const fetchRows = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(API, { params: { from: request.desde, to: request.hasta }, withCredentials: true, signal: controller.signal });
        if (controller.signal.aborted)
          return;
        if (!Array.isArray(data))
          throw new Error('La API no devolvió un arreglo de despachos.');
        setRows(data);
        setFilters({});
        setSearch('');
        setPage(0);
      }
      catch (e) {
        if (controller.signal.aborted || e?.code === 'ERR_CANCELED')
          return;
        setRows([]);
        setError(e?.response?.data?.message || e?.message || 'Error consultando despachos');
      }
      finally {
        if (!controller.signal.aborted)
          setLoading(false);
      }
    };
    fetchRows();
    return () => controller.abort();
  }, [request, version]);
  const data = useMemo(() => {
    return rows.map((row, index) => {
      const converted = convert(
        row,
        index,
        kilosPesoNetoEsCliente
      );
      const searchText = norm([
        ...Object.values(converted.ident),
        ...Object.values(converted.v)
      ].join(' '));
      return {
        ...converted,
        searchText
      };
    });
  }, [rows, kilosPesoNetoEsCliente]);
  const pairs = useMemo(() => PAIRS.filter(p => p.key !== 'bc' || kilosPesoNetoEsCliente), [kilosPesoNetoEsCliente]);
  const pairCols = pairs;
  const measureLabel = Object.fromEntries(BASES.map(([key, label, unit]) => [key, `${label} (${unit})`]));
  const analysisColumns = useMemo(() => pairCols.map(p => ({
    ...p,
    columns: [
      { key: `${p.key}_a`, label: measureLabel[p.a], get: r => r.v[p.a], kind: 'measure', field: p.a },
      { key: `${p.key}_b`, label: measureLabel[p.b], get: r => r.v[p.b], kind: 'measure', field: p.b },
      { key: `d_${p.key}`, label: `Diferencia (${p.unit})`, get: r => compare(r, p)?.diff ?? null, kind: 'diff', pair: p },
      { key: `p_${p.key}`, label: 'Diferencia (%)', get: r => compare(r, p)?.pct ?? null, kind: 'pct', pair: p },
    ]
  })), [pairCols]);
  const visibleColumns = [
    ...IDENT.map(([key, label]) => ({ key, label, get: r => r.ident[key], kind: 'ident' })),
    { key: 'density', label: 'Densidad lab (kg/L)', get: r => r.v.density, kind: 'density' },
    ...analysisColumns.flatMap(p => p.columns),
  ];
  const allColumns = useMemo(() => [
    ...IDENT.map(([key, label]) => ({ key, label, get: r => r.ident[key], display: r => r.ident[key] || '—' })),
    ...BASES.map(([key, label, unit]) => ({ key, label: `${label} (${unit})`, get: r => r.v[key], display: r => fmt(r.v[key], key === 'density' ? 5 : 2) })),
    ...pairs.flatMap(p => [
      { key: `${p.key}_a`, get: r => r.v[p.a], display: r => fmt(r.v[p.a], p.a === 'density' ? 5 : 2) },
      { key: `${p.key}_b`, get: r => r.v[p.b], display: r => fmt(r.v[p.b], p.b === 'density' ? 5 : 2) },
      { key: `d_${p.key}`, get: r => compare(r, p)?.diff ?? null, display: r => signed(compare(r, p)?.diff ?? null) },
      { key: `p_${p.key}`, get: r => compare(r, p)?.pct ?? null, display: r => pct(compare(r, p)?.pct ?? null) }
    ])
  ], [pairs]);
  const colMap = useMemo(() => Object.fromEntries(allColumns.map(x => [x.key, x])), [allColumns]);
  const match = (r, skipKey = null) => Object.entries(filters).every(([k, chosen]) => k === skipKey || !Array.isArray(chosen) || chosen.includes(keyOf(colMap[k]?.get(r))));
  const options = useMemo(() => {
    const result = {};
    allColumns.forEach(col => {
      const counts = new Map();
      data.forEach(r => {
        if (!Object.entries(filters).every(([k, v]) => k === col.key || !Array.isArray(v) || v.includes(keyOf(colMap[k]?.get(r)))))
          return;
        const value = col.get(r), key = keyOf(value);
        const item = counts.get(key) || { key, label: value == null || value === '' ? '(Sin dato)' : col.display(r), count: 0, value };
        item.count++;
        counts.set(key, item);
      });
      (filters[col.key] || []).forEach(k => {
        if (!counts.has(k))
          counts.set(k, { key: k, label: k === EMPTY ? '(Sin dato)' : k, count: 0, value: k });
      });
      result[col.key] = [...counts.values()].sort((a, b) => {
        if (a.key === EMPTY)
          return -1;
        if (b.key === EMPTY)
          return 1;
        if (typeof a.value === 'number' && typeof b.value === 'number')
          return a.value - b.value;
        return a.label.localeCompare(b.label, 'es', { numeric: true });
      });
    });
    return result;
  }, [data, filters, colMap, allColumns]);
  const filtered = useMemo(() => {
    const query = norm(debouncedSearch);
    return data.filter(r => {
      if (!match(r))
        return false;
      if (query && !r.searchText.includes(query))
        return false;
      return true;
    });
  }, [
    data,
    filters,
    colMap,
    debouncedSearch
  ]);
  const ordered = useMemo(() => [...filtered].sort((a, b) => {
    const x = colMap[sort.key]?.get(a), y = colMap[sort.key]?.get(b), dir = sort.dir === 'asc' ? 1 : -1;
    if (x == null || x === '')
      return y == null || y === '' ? 0 : 1;
    if (y == null || y === '')
      return -1;
    return dir * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true }));
  }), [filtered, sort, colMap]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(ordered.length / perPage) - 1));
  const shown = ordered.slice(currentPage * perPage, (currentPage + 1) * perPage);
  // Mediciones individuales, sin repetir campos en la tabla de origen.
  // La densidad no es aditiva. Ambos volúmenes gravimétricos se calculan
  // individualmente (masa de flujómetro o báscula / densidad de laboratorio).
  const rawColumns = useMemo(() => BASES
    .filter(([key]) => kilosPesoNetoEsCliente || key !== 'cliKg')
    .map(([key, label, unit]) => ({
      key,
      label: `${label} (${unit})`,
      unit,
      calculated: key === 'graL' || key === 'graFluL',
      get: r => r.v[key]
    })), [kilosPesoNetoEsCliente]);

  // Los totales crudos incluyen todas las filas filtradas con dato válido,
  // independientemente de si existe otro valor para hacer una comparación.
  const rawTotals = useMemo(() => Object.fromEntries(
    rawColumns.map(c => {
      if (c.key === 'density') return [c.key, null];
      const values = filtered.map(r => c.get(r)).filter(v => v != null && Number.isFinite(v));
      return [c.key, {
        count: values.length,
        value: values.reduce((sum, value) => sum + value, 0)
      }];
    })
  ), [filtered, rawColumns]);

  // Auditoría por comparación: las dos mediciones deben pertenecer al MISMO despacho.
  // Así no se confunden los totales completos de origen con los subtotales comparables.
  const pairAudit = useMemo(() => Object.fromEntries(
    pairs.map(p => {
      const valid = filtered.map(r => compare(r, p)).filter(Boolean);
      const sumA = valid.reduce((sum, item) => sum + item.a, 0);
      const sumB = valid.reduce((sum, item) => sum + item.b, 0);
      const diff = sumB - sumA;
      const onlyA = filtered.filter(r => r.v[p.a] > 0 && !(r.v[p.b] > 0)).length;
      const onlyB = filtered.filter(r => !(r.v[p.a] > 0) && r.v[p.b] > 0).length;
      const neither = filtered.length - valid.length - onlyA - onlyB;
      return [p.key, {
        count: valid.length,
        missing: filtered.length - valid.length,
        onlyA,
        onlyB,
        neither,
        sumA,
        sumB,
        diff,
        pct: sumA > 0 ? (diff / sumA) * 100 : null
      }];
    })
  ), [filtered, pairs]);

  const totals = useMemo(() => {
    const out = {};
    analysisColumns.forEach(g => {
      const a = pairAudit[g.key];
      out[`${g.key}_a`] = { count: a.count, value: a.sumA };
      out[`${g.key}_b`] = { count: a.count, value: a.sumB };
      out[`d_${g.key}`] = { count: a.count, value: a.diff };
      out[`p_${g.key}`] = { count: a.count, value: a.pct };
    });
    return out;
  }, [analysisColumns, pairAudit]);

  const apply = (key, values) => {
    setFilters(prev => {
      const next = { ...prev }; if (values == null)
        delete next[key];
      else
        next[key] = values; return next;
    }); setPage(0);
  };
  const changeSort = key => setSort(old => old.key === key ? { key, dir: old.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  const header = (key, label, numeric = false, comparisonTone = null, groupStart = false) => <Header
    key={key}
    label={label}
    filterKey={key}
    selected={filters[key]}
    options={options[key] || []}
    onApply={apply}
    sort={sort.key}
    sortDirection={sort.dir}
    onSort={changeSort}
    numeric={numeric}
    comparisonTone={comparisonTone}
    groupStart={groupStart}
  />;
  return <Box sx={{ width: '100%', minWidth: 0, p: { xs: 1, md: 1.7 }, bgcolor: '#f7f9fc', mt: 5 }}>
    <Paper variant="outlined" sx={{ p: 1.25, mb: 1.25, borderRadius: 2, borderColor: '#e1e7f0' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 220 }}>
          <Box sx={{ width: 36, height: 36, bgcolor: '#e9f0ff', color: NAVY, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <AnalyticsOutlinedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, color: NAVY, fontWeight: 850, lineHeight: 1.2 }}>
              Análisis de mermas
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
              Conciliación y diferencias por despacho
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }} gap={1}>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={desde}
            InputLabelProps={{ shrink: true }}
            onChange={e => setDesde(e.target.value)}
            sx={{ width: 145 }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={hasta}
            InputLabelProps={{ shrink: true }}
            onChange={e => setHasta(e.target.value)}
            sx={{ width: 145 }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={invalidDate || loading}
            startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <RefreshOutlinedIcon />}
            onClick={() => { setRequest({ desde, hasta }); setVersion(v => v + 1); }}
            sx={{ height: 36 }}
          >Consultar</Button>
          <Tooltip title="Gráficas para diagnosticar desviaciones, cobertura y casos atípicos">
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!filtered.length}
                startIcon={<InsightsOutlinedIcon />}
                onClick={() => setDiagnosticoOpen(true)}
                sx={{ height: 36, fontWeight: 750, borderColor: '#b9cce4', color: NAVY, whiteSpace: 'nowrap' }}
              >Análisis</Button>
            </span>
          </Tooltip>
          <Tooltip title="Exportar tabla de Excel">
            <span>
              <IconButton disabled={!filtered.length} onClick={() => csvExport(ordered, pairCols)}>
                <TableViewOutlinedIcon sx={{ color: '#217346', fontSize: 23 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
    <Paper variant="outlined" sx={{ mb: 1.5, borderRadius: 2, borderColor: '#e1e7f0', overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        sx={{ px: 1.5, py: 1 }}
      >
        <Box>
          <Typography fontSize={14} fontWeight={800} color={NAVY}>
            Datos originales por despacho
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            Mediciones únicas y acumulados del conjunto filtrado · Gravimétricos: kg de flujómetro o báscula divididos por densidad lab (kg/L)
          </Typography>
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ ml: 'auto' }}
        >
          <TextField
            size="small"
            placeholder="Buscar placa, tiquete, cliente..."
            aria-label="Búsqueda global"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <SearchOutlinedIcon
                  sx={{
                    fontSize: 19,
                    mr: 0.75,
                    color: '#64748b'
                  }}
                />
              )
            }}
            sx={{
              width: { xs: 210, sm: 300 },
              '& .MuiInputBase-root': {
                bgcolor: '#fff',
                height: 34,
                fontSize: 12
              }
            }}
          />

          <Chip
            size="medium"
            icon={<AnalyticsOutlinedIcon sx={{ fontSize: '17px !important' }} />}
            label={`${fmt(filtered.length, 0)} registros`}
            sx={{ fontWeight: 800, color: NAVY, bgcolor: '#bfeec6', border: '1px solid #dce6f4', height: 36 }}
          />
        </Stack>

      </Stack>
      <TableContainer sx={{ maxHeight: '52vh', overflowX: 'auto' }}>
        <Table
          stickyHeader
          size="small"
          sx={{ width: 'max-content', minWidth: '100%', '& .MuiTableCell-stickyHeader': { zIndex: 3 } }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                colSpan={IDENT.length}
                sx={{ ...headSx, bgcolor: '#e3eaf6', textAlign: 'center', height: 27 }}
              >IDENTIFICACIÓN DEL DESPACHO</TableCell>
              <TableCell
                colSpan={rawColumns.length}
                sx={{ ...headSx, bgcolor: '#e0edf7', textAlign: 'center', height: 27 }}
              >MEDICIONES REGISTRADAS Y CALCULADAS</TableCell>
            </TableRow>
            <TableRow>
              {IDENT.map(([key, label]) => header(key, label))}
              {rawColumns.map(c => header(c.key, c.label, true))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r, i) => (
              <TableRow
                hover
                key={r.id}
                sx={{ bgcolor: i % 2 ? '#fafcff' : '#fff', '&:hover': { bgcolor: '#edf5ff !important' } }}
              >
                {IDENT.map(([key]) => (
                  <TableCell
                    key={key}
                    sx={{
                      ...cellSx,
                      maxWidth: key === 'estado' ? 195 : 205,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ...(key === 'estado' && RECHAZADOS.has(norm(r.ident.estado)) ? { bgcolor: '#fff1f2' } : {})
                    }}
                    title={r.ident[key]}
                  >
                    {key === 'estado'
                      ? <EstadoVehiculoChip estado={r.ident.estado} />
                      : r.ident[key] || '—'}
                  </TableCell>
                ))}
                {rawColumns.map((c, index) => (
                  <TableCell
                    key={c.key}
                    align="right"
                    sx={{
                      ...cellSx,
                      bgcolor: index % 2 === 0 ? '#f7fbff' : '#fbfcff',
                      borderLeft: index === 0 ? '2px solid #bdcde3' : undefined
                    }}
                    title={c.key === 'graFluL' ? 'Calculado: peso de flujómetro (kg) / densidad lab (kg/L)' : c.key === 'graL' ? 'Calculado: peso de báscula (kg) / densidad lab (kg/L)' : undefined}
                  >
                    {fmt(c.get(r), c.key === 'density' ? 5 : 2)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!shown.length && (
              <TableRow>
                <TableCell
                  colSpan={IDENT.length + rawColumns.length}
                  sx={{ py: 5, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}
                >
                  {loading ? 'Cargando despachos...' : 'No hay registros para los filtros aplicados.'}
                </TableCell>
              </TableRow>
            )}
            {!!filtered.length && (
              <TableRow
                sx={{
                  '& td': {
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    bgcolor: '#eaf0fa',
                    fontWeight: 850,
                    borderTop: '2px solid #a9bcd9'
                  }
                }}
              >
                {IDENT.map(([key], index) => (
                  <TableCell
                    key={key}
                    sx={{
                      ...cellSx,
                      color: NAVY,
                      ...(index === 0 ? { left: 0, zIndex: 4, borderRight: '1px solid #bdcde3' } : {})
                    }}
                  >
                    {index === 0 ? 'TOTALES' : index === 1 ? `${filtered.length} despachos` : null}
                  </TableCell>
                ))}
                {rawColumns.map((c, index) => {
                  const t = rawTotals[c.key];
                  return (
                    <TableCell
                      key={c.key}
                      align="right"
                      title={c.key === 'density' ? 'Densidad no acumulable' : `${t?.count ?? 0} registros con dato válido`}
                      sx={{ ...cellSx, borderLeft: index === 0 ? '2px solid #bdcde3' : undefined }}
                    >
                      {c.key === 'density' ? '—' : t?.count ? fmt(t.value) : '—'}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={ordered.length}
        page={currentPage}
        rowsPerPage={perPage}
        onPageChange={(_, value) => setPage(value)}
        onRowsPerPageChange={e => { setPerPage(Number(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas por página"
      />
    </Paper>
    <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: '#e1e7f0', overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        sx={{ px: 1.5, py: 1 }}
      >
        <Box>
          <Typography
            fontSize={14}
            fontWeight={800}
            color={NAVY}
          >
            Matriz de conciliación · Comparaciones
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            Los acumulados comparan solo despachos con ambas mediciones. Los totales independientes están en la tabla superior.
          </Typography>
        </Box>
      </Stack>
      <TableContainer sx={{ maxHeight: '68vh', overflowX: 'auto' }}>
        <Table
          stickyHeader
          size="small"
          sx={{ width: 'max-content', minWidth: '100%', '& .MuiTableCell-stickyHeader': { zIndex: 3 } }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                colSpan={IDENT.length}
                sx={{ ...headSx, bgcolor: '#e3eaf6', textAlign: 'center', height: 27 }}
              >IDENTIFICACIÓN DEL DESPACHO</TableCell>
              <TableCell sx={{ ...headSx, bgcolor: '#e0edf7', textAlign: 'center', height: 27 }}>DENSIDAD</TableCell>
              {analysisColumns.map((group, index) => <TableCell
                key={group.key}
                colSpan={group.columns.length}
                sx={{
                  ...headSx,
                  bgcolor: COMPARISON_COLORS[group.key].title,
                  color: COMPARISON_COLORS[group.key].text,
                  textAlign: 'center',
                  height: 32,
                  fontWeight: 850,
                  letterSpacing: 0.3,
                  borderLeft: `3px solid ${COMPARISON_COLORS[group.key].border}`,
                  borderBottom: `2px solid ${COMPARISON_COLORS[group.key].border}`
                }}
              >
                <Stack spacing={0.2} alignItems="center">
                  <Typography sx={{ fontSize: 11, fontWeight: 850, color: 'inherit', lineHeight: 1.2 }}>
                    {group.label.toUpperCase()}
                  </Typography>
                  <Tooltip
                    arrow
                    title={`${pairAudit[group.key].count} con ambas mediciones · ${pairAudit[group.key].onlyA} solo primera · ${pairAudit[group.key].onlyB} solo segunda · ${pairAudit[group.key].neither} sin ninguna`}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 650, color: 'inherit', opacity: 0.85, whiteSpace: 'nowrap' }}>
                      {pairAudit[group.key].count} de {filtered.length} pares válidos
                    </Typography>
                  </Tooltip>
                </Stack>
              </TableCell>)}
              <TableCell sx={{ ...headSx, bgcolor: '#e3eaf6', height: 27 }}>DETALLE</TableCell>
            </TableRow>
            <TableRow>
              {IDENT.map(([k, label]) => header(k, label))}
              {header('density', 'Densidad (kg/L)', true)}
              {analysisColumns.flatMap(group => group.columns.map((c, i) => (
                <React.Fragment key={c.key}>
                  {header(c.key, c.label, true, COMPARISON_COLORS[group.key], i === 0)}
                </React.Fragment>
              )))}
              <TableCell sx={headSx}>Ver</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r, i) => <TableRow
              hover
              key={r.id}
              sx={{ bgcolor: i % 2 ? '#fafcff' : '#fff', '&:hover': { bgcolor: '#edf5ff !important' } }}
            >
              {IDENT.map(([k]) => <TableCell
                key={k}
                sx={{ ...cellSx, maxWidth: k === 'estado' ? 195 : 205, overflow: 'hidden', textOverflow: 'ellipsis', ...(k === 'estado' && RECHAZADOS.has(norm(r.ident.estado)) ? { bgcolor: '#fff1f2' } : {}) }}
                title={r.ident[k]}
              >
                {k === 'estado' ? <EstadoVehiculoChip estado={r.ident.estado} /> : r.ident[k] || '—'}
              </TableCell>)}
              <TableCell align="right" sx={cellSx}>{fmt(r.v.density, 5)}</TableCell>
              {analysisColumns.flatMap((g, index) => g.columns.map((c, j) => {
                const val = c.get(r);
                return <TableCell
                  key={c.key}
                  align="right"
                  sx={{
                    ...cellSx,
                    bgcolor: i % 2 === 0 ? COMPARISON_COLORS[g.key].row : COMPARISON_COLORS[g.key].alternate,
                    // El hover respeta el color del bloque, incluso si la fila cambia de fondo.
                    '.MuiTableRow-hover:hover &': { bgcolor: `${COMPARISON_COLORS[g.key].hover} !important` },
                    borderLeft: j === 0 ? `3px solid ${COMPARISON_COLORS[g.key].border}` : undefined,
                    fontWeight: c.kind === 'diff' || c.kind === 'pct' ? 750 : 400,
                    color: c.kind === 'diff' || c.kind === 'pct'
                      ? (val == null ? '#9ba7b5' : val < 0 ? '#a64f28' : val > 0 ? '#1b6981' : '#39465b')
                      : '#344054'
                  }}
                >
                  {c.kind === 'diff' ? signed(val) : c.kind === 'pct' ? pct(val) : fmt(val, 2)}
                </TableCell>;
              }))}
              <TableCell sx={cellSx}>
                <Tooltip title="Ver conciliación de este despacho">
                  <IconButton
                    size="small"
                    onClick={() => setDetail(r)}
                  >
                    <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>)}
            {!shown.length && <TableRow>
              <TableCell
                colSpan={visibleColumns.length + 1}
                sx={{ py: 5, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}
              >
                {loading ? 'Cargando despachos...' : 'No hay registros para los filtros aplicados.'}
              </TableCell>
            </TableRow>}
            {!!filtered.length && (
              <TableRow
                sx={{
                  bgcolor: '#eaf0fa',
                  '& td': {
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    fontWeight: 850,
                    borderTop: '2px solid #a9bcd9'
                  }
                }}
              >
                {IDENT.map(([key], index) => (
                  <TableCell
                    key={key}
                    sx={{
                      ...cellSx,
                      color: NAVY,
                      ...(index === 0 && {
                        left: 0,
                        zIndex: 4,
                        borderRight: '1px solid #bdcde3'
                      })
                    }}
                  >
                    {index === 0
                      ? 'TOTAL PARES'
                      : index === 1
                        ? `${filtered.length} despachos`
                        : null}
                  </TableCell>
                ))}
                <TableCell align="right" sx={cellSx}>—</TableCell>
                {analysisColumns.flatMap(g =>
                  g.columns.map((c, index) => {
                    const t = totals[c.key];
                    return (
                      <TableCell
                        key={c.key}
                        align="right"
                        sx={{
                          ...cellSx,
                          bgcolor: COMPARISON_COLORS[g.key].total,
                          color: COMPARISON_COLORS[g.key].text,
                          ...(index === 0 && {
                            borderLeft: `3px solid ${COMPARISON_COLORS[g.key].border}`
                          })
                        }}
                        title={`${t?.count ?? 0} de ${filtered.length} despachos comparables · ${pairAudit[g.key].missing} excluidos por falta de una o ambas mediciones`}
                      >
                        {t?.count
                          ? c.kind === 'pct'
                            ? pct(t.value)
                            : c.kind === 'diff'
                              ? signed(t.value)
                              : fmt(t.value)
                          : '—'}
                      </TableCell>
                    );
                  })
                )}
                <TableCell sx={cellSx} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={ordered.length}
        page={currentPage}
        rowsPerPage={perPage}
        onPageChange={(_, v) => setPage(v)}
        onRowsPerPageChange={e => { setPerPage(Number(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas por página"
      />
    </Paper>
    <ModalDiagnosticoMermas
      open={diagnosticoOpen}
      onClose={() => setDiagnosticoOpen(false)}
      rows={filtered}
      pairs={pairs}
      rawTotals={rawTotals}
      pairAudit={pairAudit}
      desde={request.desde}
      hasta={request.hasta}
      onInspect={row => {
        setDiagnosticoOpen(false);
        setDetail(row);
      }}
    />
    <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: NAVY, fontWeight: 850 }}>Detalle de conciliación · {detail?.ident.tiquete || 'Despacho'}</DialogTitle>
      <DialogContent dividers>
        {detail && <>
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
            mb={1.5}
          >
            <EstadoVehiculoChip estado={detail.ident.estado} />
            <Typography
              fontSize={12}
              color="text.secondary"
            >
              {detail.ident.fecha} · {detail.ident.cliente} · {detail.ident.transportadora} · {detail.ident.placa} · {detail.ident.factura}
            </Typography>
          </Stack>
          <Typography fontWeight={800} fontSize={13} mb={.5}>Mediciones</Typography>
          <Table size="small">
            <TableBody>
              {BASES.filter(([k]) => kilosPesoNetoEsCliente || k !== 'cliKg').map(([k, label, unit]) =>
                <TableRow key={k}>
                  <TableCell sx={{ fontSize: 12 }}>
                    {label}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: 12 }}
                  >
                    {fmt(detail.v[k], k === 'density' ? 5 : 2)}
                    {detail.v[k] != null ? unit : ''}
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
          <Typography fontWeight={800} fontSize={13} mt={2} mb={.5}>Diferencias (segunda medición − primera)</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Comparación', 'Diferencia', 'Porcentaje'].map(x => <TableCell
                  key={x}
                  sx={{ fontWeight: 800, fontSize: 12 }}
                >
                  {x}
                </TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs.map(p => {
                const c = compare(detail, p);
                return <TableRow key={p.key}>
                  <TableCell sx={{ fontSize: 12 }}>
                    {p.label}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: 12 }}
                    align="right"
                  >
                    {signed(c?.diff ?? null)}
                    {c ? p.unit : ''}
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: 12 }}
                    align="right"
                  >
                    {pct(c?.pct ?? null)}
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetail(null)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  </Box>;
}
