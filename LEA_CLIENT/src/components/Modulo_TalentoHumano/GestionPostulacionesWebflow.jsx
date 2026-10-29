import React, { useCallback, useEffect, useMemo, useState } from 'react';

import axios from 'axios';

import {
  Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress, Divider, Drawer,
  IconButton, InputAdornment, LinearProgress, MenuItem, Pagination, Paper, Snackbar,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography, useMediaQuery, Tabs, Tab
} from '@mui/material';

import {
  SearchRounded, RefreshRounded, FileDownloadRounded, OpenInNewRounded,
  PeopleAltRounded, HourglassTopRounded, TrendingUpRounded, TaskAltRounded,
  FilterAltOffRounded, ViewKanbanRounded, TableRowsRounded, DescriptionRounded,
  EmailRounded, PhoneRounded, CloseRounded, WorkOutlineRounded, CalendarMonthRounded,
  ChevronRightRounded, ArrowOutwardRounded, LocationOnOutlined, TuneRounded,
  AutoAwesomeRounded, PersonOutlineRounded, EventOutlined, CheckCircleOutlineRounded,
  ContentCopyRounded, KeyboardArrowDownRounded
} from '@mui/icons-material';

const ESTADOS = [
  { value: 'RECIBIDA', label: 'Recibida', color: '#64748B', bg: '#EDF1F5' },
  { value: 'EN_REVISION', label: 'En revisión', color: '#B7791F', bg: '#FFF3DC' },
  { value: 'PRESELECCIONADA', label: 'Preseleccionada', color: '#3975B7', bg: '#E9F2FE' },
  { value: 'ENTREVISTA', label: 'Entrevista', color: '#8556B9', bg: '#F2EBFB' },
  { value: 'EVALUACION', label: 'Evaluación', color: '#17877C', bg: '#E1F5F1' },
  { value: 'SELECCIONADA', label: 'Seleccionada', color: '#20866B', bg: '#E3F5EB' },
  { value: 'CONTRATADA', label: 'Contratada', color: '#247C56', bg: '#DCF5E5' },
  { value: 'DESCARTADA', label: 'Descartada', color: '#B76068', bg: '#FBECEE' },
];

const meta = (v) => ESTADOS.find(x => x.value === v) || { value: v, label: v || 'Sin estado', color: '#64748B', bg: '#EDF1F5' };
const idOf = (r) => String(r?._id?.$oid || r?._id || r?.webflowSubmissionId || '');
const normalize = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const dateOf = (v) => { const d = new Date(v?.$date || v || ''); return Number.isNaN(d.getTime()) ? null : d; };
const dayOf = (v) => { const d = dateOf(v); if (!d) return ''; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dateText = (v) => dateOf(v)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) || '—';
const dateTimeText = (v) => dateOf(v)?.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) || '—';
const initials = (v) => String(v || '').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '•';
const parseRecords = (v) => { const arr = [v, v?.postulaciones, v?.data, v?.data?.postulaciones, v?.results].find(Array.isArray); if (!arr) throw new Error('La respuesta no contiene una lista de postulaciones.'); return arr; };
const surface = { border: '1px solid #E7EDF4', borderRadius: '18px', boxShadow: '0 8px 32px rgba(29,54,85,.035)', bgcolor: '#fff' };
const controlSx = { '& .MuiOutlinedInput-root': { borderRadius: '11px', bgcolor: '#fff', '& fieldset': { borderColor: '#E4EAF1' } }, '& .MuiInputLabel-root': { fontSize: 13 } };

function StateChip({ value }) { const m = meta(value); return <Chip size="small" label={m.label} sx={{ bgcolor: m.bg, color: m.color, fontWeight: 750, height: 26, borderRadius: '8px', '& .MuiChip-label': { px: 1.25 } }} />; }
function exportCsv(items) {

  const rows = [['ID', 'Fecha', 'Aspirante', 'Correo', 'Teléfono', 'Vacante', 'Ciudad', 'Modalidad', 'Contrato', 'Estado', 'Hoja de vida', 'Comentarios'], ...items.map(p => [
    idOf(p), dateTimeText(p.fechaPostulacion || p.createdAt), p.aspirante?.nombreCompleto, p.aspirante?.correoPersonal, p.aspirante?.contactoPersonal, p.vacante?.titulo, p.vacante?.ciudad, p.vacante?.modalidad, p.vacante?.contrato, p.estado, p.hojaVida?.urlWebflow, p.aspirante?.expectativasComentarios
  ])];

  const esc = v => `"${String(v ?? '').replace(/^[=+@\-\t\r]/, "'" + '$&').replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `postulaciones_cocli_${dayOf(new Date())}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);

}

export default function GestionPostulacionesWebflow({
  endpointListado = "https://ambiocomserver.onrender.com/api/postulaciones/postulaciones",
  construirEndpointEstado = id => `https://ambiocomserver.onrender.com/api/postulaciones/postulaciones/${encodeURIComponent(id)}/estado`,
  titulo = 'Centro de postulaciones',
}) {

  const mobile = useMediaQuery('(max-width:900px)');
  const [records, setRecords] = useState([]), [busy, setBusy] = useState(false), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [query, setQuery] = useState(''), [vacancy, setVacancy] = useState('TODAS'), [status, setStatus] = useState('TODOS');
  const [startDate, setStartDate] = useState(''), [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('recientes'), [view, setView] = useState('tabla');
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10), [selectedIds, setSelectedIds] = useState([]);
  const [activeId, setActiveId] = useState(null), [draftState, setDraftState] = useState('RECIBIDA'), [drawerTab, setDrawerTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false), [vacanciesExpanded, setVacanciesExpanded] = useState(true);
  const load = useCallback(async (signal) => {

    setBusy(true); setError('');
    try { const r = await axios.get(endpointListado, { withCredentials: true, signal }); if (!signal?.aborted) setRecords(parseRecords(r.data)); }
    catch (e) { if (e.code !== 'ERR_CANCELED' && !signal?.aborted) { setRecords([]); setError(e.response?.data?.message || 'No fue posible cargar las postulaciones desde Coclí.'); } }
    finally { if (!signal?.aborted) setBusy(false); }

  }, [endpointListado]);

  useEffect(() => { const ctrl = new AbortController(); load(ctrl.signal); return () => ctrl.abort(); }, [load]);
  useEffect(() => { setPage(1); setSelectedIds([]); }, [query, vacancy, status, startDate, endDate, sortBy, pageSize]);

  const active = useMemo(() => records.find(r => idOf(r) === activeId) || null, [records, activeId]);
  const vacancyStats = useMemo(() => Array.from(new Set(records.map(r => r.vacante?.titulo).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')).map(title => {

    const group = records.filter(p => p.vacante?.titulo === title);

    return { title, count: group.length, inProgress: group.filter(p => ['PRESELECCIONADA', 'ENTREVISTA', 'EVALUACION'].includes(p.estado)).length, active: group.some(p => p.vacante?.activa), closing: group[0]?.vacante?.fechaCierre };

  }), [records]);

  const filtered = useMemo(() => records.filter(p => {

    const text = normalize([p.aspirante?.nombreCompleto, p.aspirante?.correoPersonal, p.aspirante?.contactoPersonal, p.vacante?.titulo, p.vacante?.ciudad, p.webflowSubmissionId].join(' '));
    const day = dayOf(p.fechaPostulacion || p.createdAt);

    return (!query || text.includes(normalize(query))) && (vacancy === 'TODAS' || p.vacante?.titulo === vacancy) && (status === 'TODOS' || (status === 'PENDIENTES' && ['RECIBIDA', 'EN_REVISION'].includes(p.estado)) || (status === 'EN_PROCESO' && ['PRESELECCIONADA', 'ENTREVISTA', 'EVALUACION'].includes(p.estado)) || (status === 'ELEGIDAS' && ['SELECCIONADA', 'CONTRATADA'].includes(p.estado)) || p.estado === status) && (!startDate || (day && day >= startDate)) && (!endDate || (day && day <= endDate));

  }).sort((a, b) => sortBy === 'nombre' ? (a.aspirante?.nombreCompleto || '').localeCompare(b.aspirante?.nombreCompleto || '', 'es') : sortBy === 'antiguos' ? (dateOf(a.fechaPostulacion || a.createdAt)?.getTime() || 0) - (dateOf(b.fechaPostulacion || b.createdAt)?.getTime() || 0) : (dateOf(b.fechaPostulacion || b.createdAt)?.getTime() || 0) - (dateOf(a.fechaPostulacion || a.createdAt)?.getTime() || 0)), [records, query, vacancy, status, startDate, endDate, sortBy]);

  const summary = useMemo(() => ({ total: filtered.length, pending: filtered.filter(p => ['RECIBIDA', 'EN_REVISION'].includes(p.estado)).length, process: filtered.filter(p => ['PRESELECCIONADA', 'ENTREVISTA', 'EVALUACION'].includes(p.estado)).length, chosen: filtered.filter(p => ['SELECCIONADA', 'CONTRATADA'].includes(p.estado)).length }), [filtered]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => { setQuery(''); setVacancy('TODAS'); setStatus('TODOS'); setStartDate(''); setEndDate(''); setSortBy('recientes'); };
  const openDetails = p => { setActiveId(idOf(p)); setDraftState(p.estado || 'RECIBIDA'); setDrawerTab(0); };
  const openResume = p => { const url = p?.hojaVida?.urlWebflow; try { const u = new URL(url); if (u.protocol !== 'https:') throw new Error(); window.open(u.href, '_blank', 'noopener,noreferrer'); } catch { setNotice('No hay una URL HTTPS válida para esta hoja de vida.'); } };
  const saveState = async () => {

    if (!active || draftState === active.estado) return;

    setSaving(true);

    try { const r = await axios.patch(construirEndpointEstado(idOf(active)), { estado: draftState }, { withCredentials: true }); setRecords(old => old.map(p => idOf(p) === idOf(active) ? (r.data?.postulacion || { ...p, estado: draftState }) : p)); setNotice('Estado actualizado correctamente.'); setActiveId(null); }

    catch (e) { setError(e.response?.data?.message || 'No se pudo actualizar el estado.'); }

    finally { setSaving(false); }

  };

  const statsCards = [

    { key: 'total', label: 'Postulaciones', n: summary.total, icon: <PeopleAltRounded />, c: '#4C6A98', soft: '#EAF0FA', filter: 'TODOS' },
    { key: 'pending', label: 'Por revisar', n: summary.pending, icon: <HourglassTopRounded />, c: '#AD7B37', soft: '#FCF1DE', filter: 'PENDIENTES' },
    { key: 'process', label: 'En proceso', n: summary.process, icon: <TrendingUpRounded />, c: '#5386BD', soft: '#E7F1FC', filter: 'EN_PROCESO' },
    { key: 'chosen', label: 'Seleccionadas', n: summary.chosen, icon: <TaskAltRounded />, c: '#358B7C', soft: '#E5F5F0', filter: 'ELEGIDAS' }

  ];

  return <Box sx={{ minHeight: '100%', background: 'linear-gradient(155deg,#F3F7FC 0%,#F8FAFD 48%,#F5F8FB 100%)', p: { xs: 1.5, md: 3 }, color: '#24344C', fontFamily: 'inherit' }}>

    <Box sx={{ maxWidth: "auto", mx: 'auto', mt: 5 }}>
      <Box sx={{ background: 'linear-gradient(115deg,#213C61 0%,#315879 58%,#476E83 100%)', color: '#fff', borderRadius: '23px', p: { xs: 2.5, md: 3.5 }, mb: 2.5, position: 'relative', overflow: 'hidden', boxShadow: '0 12px 36px rgba(33,60,97,.16)' }}>
        <Box sx={{ position: 'absolute', right: -60, top: -150, width: 430, height: 430, borderRadius: '50%', background: 'radial-gradient(circle,rgba(205,234,241,.17),transparent 72%)', pointerEvents: 'none' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ position: 'relative' }}>

          <Box><Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}><AutoAwesomeRounded sx={{ fontSize: 16, color: '#B5E0DC' }} /><Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.7, color: '#C5D8E8' }}>COCLÍ · TALENTO HUMANO</Typography></Stack>
            <Typography sx={{ fontSize: { xs: 25, md: 32 }, letterSpacing: -.8, fontWeight: 850, lineHeight: 1.18 }}>{titulo}</Typography>
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button onClick={() => load()} disabled={busy} startIcon={busy ? <CircularProgress size={15} color="inherit" /> : <RefreshRounded />} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 2.5, textTransform: 'none', px: 2 }}>Actualizar</Button>
            <Button onClick={() => exportCsv(selectedIds.length ? filtered.filter(p => selectedIds.includes(idOf(p))) : filtered)} disabled={!filtered.length} startIcon={<FileDownloadRounded />} sx={{ bgcolor: '#fff', color: '#284C70', fontWeight: 800, borderRadius: 2.5, textTransform: 'none', px: 2.5, '&:hover': { bgcolor: '#EAF4FA' } }}>Exportar CSV</Button>
          </Stack>

        </Stack>

      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: { xs: 1, md: 1.3 }, mb: 2 }}>

        {statsCards.map(s => {
          const selected = status === s.filter && status !== 'TODOS';
          return <Paper

            key={s.key}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={() => { setStatus(status === s.filter ? 'TODOS' : s.filter); setShowAdvanced(true); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatus(status === s.filter ? 'TODOS' : s.filter); setShowAdvanced(true); } }}
            elevation={0}
            sx={{
              display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.4 },
              minHeight: { xs: 72, md: 76 }, p: { xs: 1.25, md: 1.6 },
              border: '1px solid', borderColor: selected ? s.c : '#E7EDF4',
              borderRadius: '14px', bgcolor: selected ? s.soft : '#FFFFFF',
              cursor: 'pointer', outline: 'none',
              boxShadow: selected ? '0 3px 12px rgba(36,64,95,.08)' : '0 2px 10px rgba(36,64,95,.025)',
              transition: 'all .18s ease',
              '&:hover': { borderColor: s.c, transform: 'translateY(-1px)', boxShadow: '0 5px 16px rgba(36,64,95,.09)' },
              '&:focus-visible': { outline: `2px solid ${s.c}`, outlineOffset: 2 }
            }}
          >

            <Box sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: '11px', bgcolor: s.soft, color: s.c, display: 'grid', placeItems: 'center', '& svg': { fontSize: 19 } }}>{s.icon}</Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>

              <Typography sx={{ fontSize: { xs: 21, md: 24 }, fontWeight: 850, lineHeight: 1.1, letterSpacing: -.6, color: '#263C56' }}>{s.n.toLocaleString('es-CO')}</Typography>
              <Typography noWrap sx={{ fontSize: { xs: 10.5, md: 11.5 }, color: '#718198', fontWeight: 650, mt: .3 }}>{s.label}</Typography>

            </Box>

            <ArrowOutwardRounded sx={{ fontSize: 14, color: selected ? s.c : '#BDC9D6', alignSelf: 'flex-start', display: { xs: 'none', sm: 'block' } }} />

          </Paper>;

        })}

      </Box>

      <Paper sx={{
        ...surface,
        mb: 2.5,
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F7FAFE 65%, #F0F6FC 100%)',
        border: '1px solid #E3EAF3',
        boxShadow: '0 5px 24px rgba(34,65,104,0.045)',
        overflow: 'hidden'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: vacanciesExpanded ? 2 : 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2.2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#E8F1FB,#DDEBF8)',
              border: '1px solid #D6E5F4'
            }}>
              <WorkOutlineRounded sx={{ color: '#426D98', fontSize: 21 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 850, color: '#263E58', letterSpacing: '-0.3px' }}>
                Explorar por vacante
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#8A99AA', mt: 0.2 }}>
                Selecciona una vacante para visualizar sus candidaturas
              </Typography>
            </Box>
          </Stack>
          <Button
            size="small"
            onClick={() => setVacanciesExpanded(v => !v)}
            endIcon={<KeyboardArrowDownRounded sx={{
              transform: vacanciesExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform .25s'
            }} />}
            sx={{
              textTransform: 'none', fontSize: 12, fontWeight: 750,
              color: '#52769A', borderRadius: 2,
              bgcolor: '#EDF4FB', px: 1.5,
              '&:hover': { bgcolor: '#DEEAF7' }
            }}
          >
            {vacanciesExpanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </Stack>

        {vacanciesExpanded && (
          <Box sx={{
            display: 'flex', gap: 1.5, overflowX: 'auto',
            pb: 1.5, pt: 0.5,
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': { height: 5 },
            '&::-webkit-scrollbar-track': { bgcolor: '#EDF2F7', borderRadius: 5 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#BED0E0', borderRadius: 5 }
          }}>
            <Paper
              onClick={() => setVacancy('TODAS')}
              elevation={0}
              sx={{
                position: 'relative', overflow: 'hidden',
                minWidth: 190, flexShrink: 0, p: 2,
                borderRadius: 2.8, cursor: 'pointer',
                background: vacancy === 'TODAS'
                  ? 'linear-gradient(135deg,#426F9D 0%,#244969 100%)'
                  : 'linear-gradient(135deg,#EAF2FA 0%,#DBEAF7 100%)',
                border: vacancy === 'TODAS' ? '1px solid #426F9D' : '1px solid #D5E3F0',
                boxShadow: vacancy === 'TODAS' ? '0 6px 16px rgba(44,89,135,.18)' : 'none',
                transition: 'all .25s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(44,89,135,.13)' }
              }}
            >
              <Box sx={{
                position: 'absolute', width: 110, height: 110,
                borderRadius: '50%', top: -48, right: -35,
                bgcolor: vacancy === 'TODAS' ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.35)'
              }} />
              <WorkOutlineRounded sx={{ color: vacancy === 'TODAS' ? '#FFFFFF' : '#557FA5', fontSize: 24 }} />
              <Typography sx={{
                fontSize: 13, fontWeight: 850, mt: 1.5,
                color: vacancy === 'TODAS' ? '#FFFFFF' : '#304D6B'
              }}>
                Todas las vacantes
              </Typography>
              <Typography sx={{
                fontSize: 24, fontWeight: 900, mt: 0.6, lineHeight: 1.2,
                color: vacancy === 'TODAS' ? '#FFFFFF' : '#345B80'
              }}>
                {records.length}
              </Typography>
              <Typography sx={{
                fontSize: 11, mt: 0.2,
                color: vacancy === 'TODAS' ? '#D4E5F4' : '#7A91A7'
              }}>
                Postulaciones registradas
              </Typography>
            </Paper>

            {vacancyStats.map(v => {
              const selected = vacancy === v.title;
              const percentage = v.count ? Math.round(100 * v.inProgress / v.count) : 0;
              return (
                <Paper
                  key={v.title}
                  onClick={() => setVacancy(selected ? 'TODAS' : v.title)}
                  elevation={0}
                  sx={{
                    position: 'relative', overflow: 'hidden',
                    minWidth: 265, maxWidth: 285, flex: '0 0 auto',
                    p: 2, borderRadius: 2.8, cursor: 'pointer',
                    background: selected
                      ? 'linear-gradient(145deg,#EAF4FE 0%,#F5F9FE 100%)'
                      : 'linear-gradient(145deg,#FFFFFF 0%,#F9FBFE 100%)',
                    border: `1px solid ${selected ? '#7EAAD0' : '#E4EBF3'}`,
                    boxShadow: selected
                      ? '0 5px 18px rgba(58,111,164,.11)'
                      : '0 2px 8px rgba(30,65,100,.025)',
                    transition: 'transform .25s ease,box-shadow .25s ease,background .25s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 24px rgba(38,82,125,.12)',
                      borderColor: '#A6C4DF'
                    },
                    '&::before': {
                      content: '""', position: 'absolute',
                      top: 0, left: 0, right: 0, height: 3,
                      background: selected ? 'linear-gradient(90deg,#4C83B5,#85B7D9)' : 'transparent'
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{
                      width: 32, height: 32, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: 2, bgcolor: selected ? '#D6E9FA' : '#EEF3F9'
                    }}>
                      <WorkOutlineRounded sx={{ color: selected ? '#386F9D' : '#7491AE', fontSize: 18 }} />
                    </Box>
                    <Chip
                      label={v.active ? '● Activa' : '● Inactiva'}
                      size="small"
                      sx={{
                        height: 22, fontSize: 10, fontWeight: 800,
                        bgcolor: v.active ? '#E1F5EC' : '#EFF1F5',
                        color: v.active ? '#22836A' : '#83909F',
                        border: `1px solid ${v.active ? '#C8EBDD' : '#E0E5EC'}`
                      }}
                    />
                  </Stack>

                  <Tooltip title={v.title} arrow>
                    <Typography sx={{
                      fontWeight: 850, fontSize: 13, mt: 1.3,
                      minHeight: 36, lineHeight: 1.4,
                      color: '#2C4661',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {v.title}
                    </Typography>
                  </Tooltip>

                  <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 1.1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 22, fontWeight: 900, color: '#335D83', lineHeight: 1.1 }}>
                        {v.count}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#8495A7', mt: 0.2 }}>
                        Candidaturas
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 850, color: '#4D8997' }}>
                        {v.inProgress} en proceso
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: '#93A0AE', mt: 0.2 }}>
                        {percentage}% del total
                      </Typography>
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      mt: 1.2, borderRadius: 5, height: 5,
                      bgcolor: '#E6EDF5',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg,#6298BE,#68B8AD)',
                        transition: 'transform .5s ease'
                      }
                    }}
                  />
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>


      <Paper sx={{
        ...surface,
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid #E2EAF3',
        background: '#FFFFFF',
        boxShadow: '0 6px 28px rgba(35,65,100,.045)'
      }}>
        {/* ENCABEZADO Y FILTROS */}
        <Box sx={{
          p: { xs: 2, md: 2.5 },
          borderBottom: '1px solid #E8EDF4',
          background: 'linear-gradient(135deg,#FFFFFF 0%,#F7FAFE 70%,#F0F6FC 100%)'
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <Box sx={{
                width: 42, height: 42, borderRadius: 2.3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#E7F1FB,#D8E8F7)',
                border: '1px solid #D4E4F4'
              }}>
                <TableRowsRounded sx={{ color: '#416F9B', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 850, fontSize: 17, color: '#263E58', letterSpacing: '-.3px' }}>
                  Banco de aspirantes
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mt: .5 }}>
                  <Chip label={`${filtered.length} resultados`} size="small" sx={{
                    height: 22, fontSize: 10.5, fontWeight: 800,
                    bgcolor: '#EAF2FB', color: '#54799D',
                    border: '1px solid #D9E7F5'
                  }} />
                  {selectedIds.length > 0 && (
                    <Chip label={`${selectedIds.length} seleccionados`} size="small" sx={{
                      height: 22, fontSize: 10.5, fontWeight: 800,
                      bgcolor: '#E2F5EE', color: '#258269',
                      border: '1px solid #C9EBDD'
                    }} />
                  )}
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Button
                startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
                onClick={() => setShowAdvanced(v => !v)}
                sx={{
                  textTransform: 'none', fontWeight: 750, fontSize: 12,
                  color: showAdvanced ? '#315F8B' : '#627D9A',
                  bgcolor: showAdvanced ? '#E3EFFB' : '#F2F6FB',
                  border: `1px solid ${showAdvanced ? '#BDD6EC' : '#E4EBF3'}`,
                  borderRadius: 2, px: 1.5,
                  '&:hover': { bgcolor: '#E2EEF9' }
                }}
              >
                Filtros {showAdvanced ? 'activos' : 'avanzados'}
              </Button>

              <Box sx={{
                display: 'flex', bgcolor: '#EAF0F7', p: .4,
                borderRadius: 2, border: '1px solid #E1E8F1'
              }}>
                {[
                  { id: 'tabla', name: 'Tabla', icon: <TableRowsRounded fontSize="small" /> },
                  { id: 'kanban', name: 'Kanban', icon: <ViewKanbanRounded fontSize="small" /> }
                ].map(x => (
                  <Button
                    key={x.id}
                    size="small"
                    onClick={() => setView(x.id)}
                    startIcon={x.icon}
                    sx={{
                      textTransform: 'none', fontWeight: 800, fontSize: 11.5,
                      minWidth: 92, borderRadius: 1.5,
                      color: view === x.id ? '#35648D' : '#8294A7',
                      bgcolor: view === x.id ? '#FFFFFF' : 'transparent',
                      boxShadow: view === x.id ? '0 2px 8px rgba(35,70,110,.1)' : 'none',
                      transition: 'all .2s ease',
                      '&:hover': { bgcolor: '#FFFFFF' }
                    }}
                  >
                    {x.name}
                  </Button>
                ))}
              </Box>
            </Stack>
          </Stack>

          {/* BÚSQUEDA PRINCIPAL */}
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.2} sx={{ mt: 2.4 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por nombre, correo, teléfono o vacante..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              sx={{
                ...controlSx,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#FFFFFF', borderRadius: 2.2,
                  transition: 'box-shadow .2s',
                  '&:hover': { bgcolor: '#FCFDFF' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(92,145,193,.10)' }
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">
                  <SearchRounded sx={{ color: '#7495B4' }} />
                </InputAdornment>
              }}
            />
            <TextField
              size="small" select label="Estado"
              value={status}
              onChange={e => setStatus(e.target.value)}
              sx={{ ...controlSx, minWidth: { md: 190 }, '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 2.2 } }}
            >
              <MenuItem value="TODOS">Todos los estados</MenuItem>
              <MenuItem value="PENDIENTES">Por revisar</MenuItem>
              <MenuItem value="EN_PROCESO">En proceso</MenuItem>
              <MenuItem value="ELEGIDAS">Seleccionadas</MenuItem>
              {ESTADOS.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
            </TextField>
            <TextField
              size="small" select label="Ordenar"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              sx={{ ...controlSx, minWidth: { md: 168 }, '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 2.2 } }}
            >
              <MenuItem value="recientes">Más recientes</MenuItem>
              <MenuItem value="antiguos">Más antiguas</MenuItem>
              <MenuItem value="nombre">Nombre A–Z</MenuItem>
            </TextField>
          </Stack>

          {/* FILTROS AVANZADOS */}
          {showAdvanced && (
            <Box sx={{
              mt: 1.7, p: 2, borderRadius: 2.5,
              background: 'linear-gradient(120deg,#F0F6FC,#F8FBFF)',
              border: '1px solid #DFEAF5'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 850, color: '#567A9C' }}>
                  Filtros de búsqueda avanzada
                </Typography>
                <Button
                  size="small" onClick={reset}
                  startIcon={<FilterAltOffRounded sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', fontSize: 11, color: '#7B8FA4' }}
                >
                  Limpiar filtros
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2}>
                <TextField size="small" select label="Vacante" value={vacancy}
                  onChange={e => setVacancy(e.target.value)}
                  sx={{ ...controlSx, flex: 1, minWidth: 180 }}>
                  <MenuItem value="TODAS">Todas las vacantes</MenuItem>
                  {vacancyStats.map(v => <MenuItem key={v.title} value={v.title}>{v.title}</MenuItem>)}
                </TextField>
                
                <TextField size="small" type="date" label="Desde" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={controlSx} />
                <TextField size="small" type="date" label="Hasta" value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate || undefined }} sx={controlSx} />
              </Stack>
            </Box>
          )}
        </Box>

        {/* TABLA DE ASPIRANTES */}
        {view === 'tabla' ? (
          <>
            <TableContainer sx={{
              maxHeight: 610,
              '&::-webkit-scrollbar': { width: 6, height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#C5D4E3', borderRadius: 5 }
            }}>
              <Table stickyHeader sx={{ minWidth: 980 }} size="medium">
                <TableHead>
                  <TableRow>
                    {[
                      <Checkbox
                        size="small"
                        checked={visible.length > 0 && visible.every(p => selectedIds.includes(idOf(p)))}
                        indeterminate={visible.some(p => selectedIds.includes(idOf(p))) && !visible.every(p => selectedIds.includes(idOf(p)))}
                        onChange={e => setSelectedIds(old => e.target.checked
                          ? [...new Set([...old, ...visible.map(idOf)])]
                          : old.filter(id => !visible.some(p => idOf(p) === id)))}
                      />,
                      'ASPIRANTE', 'VACANTE', 'POSTULACIÓN',
                      'UBICACIÓN', 'ETAPA', 'DOCUMENTO', ''
                    ].map((h, i) => (
                      <TableCell key={i} sx={{
                        bgcolor: '#F0F5FA',
                        borderBottom: '1px solid #DDE7F1',
                        color: '#66809B', fontWeight: 850,
                        fontSize: 10.5, letterSpacing: .65,
                        whiteSpace: 'nowrap', py: 1.6
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map(p => {
                    const checked = selectedIds.includes(idOf(p));
                    return (
                      <TableRow
                        key={idOf(p)}
                        hover
                        onClick={() => openDetails(p)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: checked ? '#F0F7FE' : '#FFFFFF',
                          transition: 'background .18s ease',
                          '&:hover': { bgcolor: '#F3F8FD !important' },
                          '& td': { borderBottom: '1px solid #EDF2F7', py: 1.35 }
                        }}
                      >
                        <TableCell onClick={e => e.stopPropagation()} padding="checkbox">
                          <Checkbox size="small" checked={checked}
                            onChange={() => setSelectedIds(old => old.includes(idOf(p))
                              ? old.filter(id => id !== idOf(p))
                              : [...old, idOf(p)])} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.3} alignItems="center">
                            <Avatar sx={{
                              width: 39, height: 39,
                              background: 'linear-gradient(135deg,#E3EFFA,#D6E7F7)',
                              color: '#456F98', fontWeight: 850, fontSize: 12,
                              border: '1px solid #D2E3F3'
                            }}>
                              {initials(p.aspirante?.nombreCompleto)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 12.8, color: '#304B66', whiteSpace: 'nowrap' }}>
                                {p.aspirante?.nombreCompleto || 'Sin nombre'}
                              </Typography>
                              <Typography sx={{
                                color: '#91A1B1', fontSize: 11,
                                maxWidth: 205, overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {p.aspirante?.correoPersonal || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={p.vacante?.titulo || ''}>
                            <Typography sx={{
                              maxWidth: 260, fontSize: 12.2,
                              fontWeight: 650, color: '#526E88',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                              {p.vacante?.titulo || '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#7C8FA3', whiteSpace: 'nowrap' }}>
                          {dateText(p.fechaPostulacion || p.createdAt)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#7C8FA3', maxWidth: 165 }}>
                          {p.vacante?.ciudad || '—'}
                        </TableCell>
                        <TableCell><StateChip value={p.estado} /></TableCell>
                        <TableCell>
                          <Tooltip title={p.hojaVida?.urlWebflow ? 'Abrir hoja de vida' : 'Sin documento'}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!p.hojaVida?.urlWebflow}
                                onClick={e => { e.stopPropagation(); openResume(p); }}
                                sx={{
                                  color: '#507FA9', bgcolor: '#ECF4FC',
                                  border: '1px solid #DDEBF7',
                                  '&:hover': { bgcolor: '#DCECFB', transform: 'scale(1.08)' },
                                  transition: 'all .2s'
                                }}
                              >
                                <DescriptionRounded fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <ChevronRightRounded sx={{ color: '#9EAFBE', fontSize: 21 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!visible.length && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box sx={{ textAlign: 'center', py: 7 }}>
                          <Box sx={{
                            width: 62, height: 62, borderRadius: '50%',
                            bgcolor: '#EDF4FB', mx: 'auto', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}>
                            <SearchRounded sx={{ fontSize: 30, color: '#8FAFCB' }} />
                          </Box>
                          <Typography sx={{ fontWeight: 850, color: '#405F7D', mt: 1.5 }}>
                            Sin resultados
                          </Typography>
                          <Typography sx={{ color: '#97A6B6', fontSize: 12, mt: .5 }}>
                            Prueba con otros filtros o limpia tu búsqueda.
                          </Typography>
                          <Button onClick={reset} sx={{ mt: 1, textTransform: 'none', color: '#507FA8' }}>
                            Limpiar filtros
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINACIÓN */}
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              gap={1} sx={{
                px: 2, py: 1.5, flexWrap: 'wrap',
                borderTop: '1px solid #E9EFF5',
                bgcolor: '#FBFCFE'
              }}>
              <TextField select size="small" value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                sx={{ ...controlSx, width: 108 }}>
                {[10, 20, 50, 100].map(n => <MenuItem key={n} value={n}>{n} filas</MenuItem>)}
              </TextField>
              <Pagination
                count={Math.max(1, Math.ceil(filtered.length / pageSize))}
                page={Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)))}
                onChange={(_, p) => setPage(p)}
                color="primary" shape="rounded"
                size={mobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiPaginationItem-root': { fontWeight: 750, borderRadius: 1.5 },
                  '& .Mui-selected': { bgcolor: '#E0EDF9 !important', color: '#386F9E' }
                }}
              />
            </Stack>
          </>
        ) : (
          /* VISTA KANBAN */
          <Box sx={{
            p: 2, overflowX: 'auto',
            background: 'linear-gradient(135deg,#FAFCFF,#F5F9FD)'
          }}>
            <Stack direction="row" gap={1.4} sx={{
              minWidth: ESTADOS.length * 230,
              alignItems: 'flex-start'
            }}>
              {ESTADOS.map(s => {
                const items = filtered.filter(p => p.estado === s.value);
                return (
                  <Box key={s.value} sx={{
                    width: 240, flexShrink: 0,
                    bgcolor: '#F3F7FB',
                    border: '1px solid #E4EBF3',
                    borderRadius: 3, p: 1.2, minHeight: 230,
                    borderTop: `3px solid ${s.color}`
                  }}>
                    <Stack direction="row" justifyContent="space-between"
                      alignItems="center" sx={{ px: .7, py: .9, mb: .8 }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: s.color, boxShadow: `0 0 0 3px ${s.color}20`
                        }} />
                        <Typography sx={{ fontSize: 12.5, fontWeight: 850, color: '#3E5873' }}>
                          {s.label}
                        </Typography>
                      </Stack>
                      <Chip label={items.length} size="small" sx={{
                        height: 22, bgcolor: '#FFFFFF', fontWeight: 850,
                        fontSize: 11, color: '#5C7691',
                        border: '1px solid #E0E8F0'
                      }} />
                    </Stack>
                    <Stack spacing={1}>
                      {items.map(p => (
                        <Paper
                          key={idOf(p)}
                          onClick={() => openDetails(p)}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            background: 'linear-gradient(145deg,#FFFFFF,#FCFDFF)',
                            border: '1px solid #E2EAF2',
                            borderRadius: 2.5, cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(40,65,95,.035)',
                            transition: 'all .22s ease',
                            '&:hover': {
                              borderColor: '#91B8D9',
                              transform: 'translateY(-3px)',
                              boxShadow: '0 7px 18px rgba(48,92,135,.12)'
                            }
                          }}
                        >
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Avatar sx={{
                              height: 32, width: 32,
                              background: 'linear-gradient(135deg,#DFEFFB,#D3E4F5)',
                              color: '#537B9F', fontSize: 10.5, fontWeight: 850
                            }}>
                              {initials(p.aspirante?.nombreCompleto)}
                            </Avatar>
                            <Typography sx={{ fontSize: 12.3, fontWeight: 850, color: '#36536F' }}>
                              {p.aspirante?.nombreCompleto || 'Sin nombre'}
                            </Typography>
                          </Stack>
                          <Typography sx={{
                            fontSize: 11, color: '#8295A8', mt: 1.3,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {p.vacante?.titulo || 'Sin vacante'}
                          </Typography>
                          <Divider sx={{ my: 1.2, borderColor: '#EDF2F6' }} />
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontSize: 10.5, color: '#9AABBB' }}>
                              {dateText(p.fechaPostulacion || p.createdAt)}
                            </Typography>
                            <ChevronRightRounded sx={{ fontSize: 17, color: '#91ACC3' }} />
                          </Stack>
                        </Paper>
                      ))}
                      {!items.length && (
                        <Box sx={{
                          py: 3, textAlign: 'center',
                          border: '1px dashed #D8E4EF',
                          borderRadius: 2, bgcolor: '#FAFCFE'
                        }}>
                          <Typography sx={{ fontSize: 11, color: '#ACB8C5' }}>
                            Sin aspirantes
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Paper>


    </Box>


<Drawer
  anchor="right"
  open={!!active}
  onClose={() => !saving && setActiveId(null)}
  PaperProps={{
    sx: {
      width: { xs: '100%', sm: 590 },
      bgcolor: '#F5F8FC',
      boxShadow: '-12px 0 45px rgba(23,49,80,.16)'
    }
  }}
>
  {active && (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ENCABEZADO */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2.3, sm: 2.8 },
        pb: 3,
        background: 'linear-gradient(125deg,#203B5B 0%,#345E80 65%,#477E9A 100%)',
        color: '#FFFFFF'
      }}>
        <Box sx={{
          position: 'absolute', width: 200, height: 200,
          borderRadius: '50%', top: -110, right: -70,
          bgcolor: 'rgba(255,255,255,.055)', pointerEvents: 'none'
        }} />
        <Box sx={{
          position: 'absolute', width: 140, height: 140,
          borderRadius: '50%', bottom: -95, right: 100,
          bgcolor: 'rgba(255,255,255,.045)', pointerEvents: 'none'
        }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%',
              bgcolor: '#8BD1CA', boxShadow: '0 0 0 4px rgba(139,209,202,.15)'
            }} />
            <Typography sx={{
              fontSize: 10.5, letterSpacing: 1.5,
              fontWeight: 850, color: '#D1E3EF'
            }}>
              FICHA DEL ASPIRANTE
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setActiveId(null)}
            disabled={saving}
            sx={{
              color: '#FFFFFF',
              bgcolor: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.13)',
              '&:hover': { bgcolor: 'rgba(255,255,255,.22)' }
            }}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1.8} alignItems="center" sx={{ mt: 2.7, position: 'relative' }}>
          <Avatar sx={{
            width: 66, height: 66,
            bgcolor: 'rgba(255,255,255,.16)',
            border: '2px solid rgba(255,255,255,.35)',
            boxShadow: '0 5px 18px rgba(10,30,55,.15)',
            fontSize: 22, fontWeight: 850
          }}>
            {initials(active.aspirante?.nombreCompleto)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{
              fontSize: { xs: 19, sm: 22 }, fontWeight: 850,
              lineHeight: 1.2, letterSpacing: '-.4px',
              overflowWrap: 'anywhere'
            }}>
              {active.aspirante?.nombreCompleto || 'Aspirante'}
            </Typography>
            <Typography sx={{
              fontSize: 11.5, color: '#D0E0EE',
              mt: .6, overflowWrap: 'anywhere'
            }}>
              {active.vacante?.titulo || 'Sin vacante registrada'}
            </Typography>
            <Box sx={{ mt: 1.1 }}>
              <StateChip value={active.estado} />
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* NAVEGACIÓN */}
      <Tabs
        value={drawerTab}
        onChange={(_, v) => setDrawerTab(v)}
        variant="fullWidth"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E5EBF3',
          minHeight: 54,
          '& .MuiTabs-indicator': {
            height: 3, borderRadius: '4px 4px 0 0',
            bgcolor: '#487FAE'
          },
          '& .MuiTab-root': {
            minHeight: 54, fontSize: 12,
            textTransform: 'none', fontWeight: 800,
            color: '#91A0AF', transition: 'color .2s'
          },
          '& .Mui-selected': { color: '#386F9D !important' }
        }}
      >
        <Tab icon={<PersonOutlineRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Perfil" />
        <Tab icon={<TuneRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Proceso" />
        <Tab icon={<DescriptionRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Documento" />
      </Tabs>

      {/* CONTENIDO */}
      <Box sx={{
        p: { xs: 1.8, sm: 2.4 },
        overflowY: 'auto', flex: 1,
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#C5D5E4', borderRadius: 5 }
      }}>
        {drawerTab === 0 && (
          <Stack spacing={1.8}>
            {/* CONTACTO */}
            <Paper elevation={0} sx={{
              p: 2.3, borderRadius: 3,
              bgcolor: '#FFFFFF', border: '1px solid #E5ECF4',
              boxShadow: '0 3px 14px rgba(35,65,100,.035)'
            }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 850, color: '#2D4864', mb: 1.8 }}>
                Información de contacto
              </Typography>

              {[
                { icon: <EmailRounded fontSize="small" />, label: 'Correo electrónico', value: active.aspirante?.correoPersonal },
                { icon: <PhoneRounded fontSize="small" />, label: 'Teléfono de contacto', value: active.aspirante?.contactoPersonal },
                { icon: <EventOutlined fontSize="small" />, label: 'Fecha de postulación', value: dateTimeText(active.fechaPostulacion || active.createdAt) }
              ].map((item, i) => (
                <Stack key={i} direction="row" alignItems="center" gap={1.4} sx={{
                  py: 1.1,
                  borderBottom: i < 2 ? '1px solid #F0F3F7' : 'none'
                }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2,
                    bgcolor: '#EDF4FB', color: '#658DB0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10.5, color: '#9AA9B8', fontWeight: 650 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{
                      fontSize: 12.5, color: '#526C85',
                      fontWeight: 650, mt: .2,
                      overflowWrap: 'anywhere'
                    }}>
                      {item.value || '—'}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Paper>

            {/* VACANTE */}
            <Paper elevation={0} sx={{
              p: 2.3, borderRadius: 3,
              background: 'linear-gradient(140deg,#FFFFFF,#F8FBFF)',
              border: '1px solid #DDE9F5',
              boxShadow: '0 3px 14px rgba(35,65,100,.035)'
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.6 }}>
                <Box sx={{
                  width: 31, height: 31, borderRadius: 1.8,
                  bgcolor: '#E8F2FC', color: '#5985AC',
                  display: 'grid', placeItems: 'center'
                }}>
                  <WorkOutlineRounded sx={{ fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 850, color: '#2D4864' }}>
                  Vacante postulada
                </Typography>
              </Stack>

              <Typography sx={{
                fontWeight: 850, fontSize: 14,
                color: '#355D82', lineHeight: 1.4
              }}>
                {active.vacante?.titulo || 'Sin información'}
              </Typography>

              <Stack direction="row" gap={.8} flexWrap="wrap" sx={{ mt: 1.5 }}>
                {[
                  active.vacante?.ciudad,
                  active.vacante?.modalidad,
                  active.vacante?.contrato
                ].filter(Boolean).map((v, i) => (
                  <Chip key={`${v}-${i}`} label={v} size="small" sx={{
                    height: 25, fontSize: 10.5, fontWeight: 700,
                    bgcolor: '#EDF4FB', color: '#6384A2',
                    border: '1px solid #DBE8F5'
                  }} />
                ))}
              </Stack>

              <Box sx={{
                mt: 2, pt: 1.5,
                borderTop: '1px solid #E9F0F7',
                display: 'flex', alignItems: 'center', gap: 1
              }}>
                <EventOutlined sx={{ fontSize: 17, color: '#91A8BB' }} />
                <Typography sx={{ fontSize: 11.5, color: '#8296A9' }}>
                  Cierre de la vacante: {dateText(active.vacante?.fechaCierre)}
                </Typography>
              </Box>
            </Paper>

            {/* COMENTARIOS */}
            <Paper elevation={0} sx={{
              p: 2.3, borderRadius: 3,
              bgcolor: '#FFFFFF', border: '1px solid #E5ECF4'
            }}>
              <Typography sx={{
                fontSize: 13.5, fontWeight: 850,
                color: '#2D4864', mb: 1.5
              }}>
                Comentarios del aspirante
              </Typography>
              <Box sx={{
                p: 1.8, bgcolor: '#F6F9FD',
                borderRadius: 2, borderLeft: '3px solid #8DB4D3'
              }}>
                <Typography sx={{
                  fontSize: 12.5, lineHeight: 1.8,
                  color: '#6D8196',
                  whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'
                }}>
                  {active.aspirante?.expectativasComentarios || 'Sin comentarios registrados.'}
                </Typography>
              </Box>
            </Paper>
          </Stack>
        )}

        {/* PROCESO DE SELECCIÓN */}
        {drawerTab === 1 && (
          <Stack spacing={1.8}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 3,
              border: '1px solid #E2EAF3',
              bgcolor: '#FFFFFF'
            }}>
              <Box sx={{
                width: 45, height: 45, borderRadius: 2.3,
                background: 'linear-gradient(135deg,#E4F0FC,#D8E8F8)',
                display: 'grid', placeItems: 'center', mb: 1.7
              }}>
                <TuneRounded sx={{ color: '#527FA5', fontSize: 24 }} />
              </Box>

              <Typography sx={{ fontWeight: 850, fontSize: 15, color: '#2D4864' }}>
                Seguimiento de selección
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#8B9CAC', mt: .5, lineHeight: 1.6 }}>
                Actualiza la etapa del proceso de selección en la que se encuentra este aspirante.
              </Typography>

              <Box sx={{
                mt: 2, p: 1.5, borderRadius: 2,
                bgcolor: '#F5F8FC', border: '1px solid #E8EEF5'
              }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 750, color: '#8D9EAE', mb: 1 }}>
                  ETAPA REGISTRADA
                </Typography>
                <StateChip value={active.estado} />
              </Box>

              <TextField
                select fullWidth label="Nueva etapa"
                size="small" value={draftState}
                onChange={e => setDraftState(e.target.value)}
                sx={{ ...controlSx, mt: 2.5 }}
              >
                {ESTADOS.map(s => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>

              {draftState !== active.estado && (
                <Box sx={{
                  mt: 1.5, px: 1.5, py: 1.2,
                  bgcolor: '#FFF8E9', border: '1px solid #F4E6BE',
                  borderRadius: 2
                }}>
                  <Typography sx={{ fontSize: 11.5, color: '#9A772B', fontWeight: 650 }}>
                    Tienes un cambio de etapa pendiente por guardar.
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth variant="contained"
                disabled={saving || draftState === active.estado}
                onClick={saveState}
                sx={{
                  mt: 2.2, textTransform: 'none',
                  background: 'linear-gradient(110deg,#315F86,#477FA4)',
                  borderRadius: 2.3, fontWeight: 800,
                  fontSize: 12.5, py: 1.3,
                  boxShadow: '0 4px 12px rgba(46,98,143,.16)',
                  '&:hover': {
                    background: 'linear-gradient(110deg,#294F72,#3B7198)'
                  }
                }}
              >
                {saving ? 'Guardando...' : 'Guardar cambio de estado'}
              </Button>
            </Paper>
          </Stack>
        )}

        {/* DOCUMENTO */}
        {drawerTab === 2 && (
          <Paper elevation={0} sx={{
            p: 3, borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(145deg,#FFFFFF,#F8FBFF)',
            border: '1px solid #E0EAF4'
          }}>
            <Box sx={{
              mx: 'auto', width: 75, height: 75,
              borderRadius: 3,
              background: 'linear-gradient(135deg,#E5F1FC,#D9E9F8)',
              color: '#4C7FA8',
              display: 'grid', placeItems: 'center',
              border: '1px solid #D3E5F5'
            }}>
              <DescriptionRounded sx={{ fontSize: 36 }} />
            </Box>

            <Typography sx={{
              fontSize: 16, fontWeight: 850,
              color: '#304F6C', mt: 2
            }}>
              Hoja de vida del aspirante
            </Typography>

            <Typography sx={{
              fontSize: 12, color: '#8C9EAF', mt: .7
            }}>
              {active.hojaVida?.estado || 'Sin referencia de archivo'}
            </Typography>

            <Box sx={{
              mt: 2, mb: 2.2, px: 2, py: 1.5,
              bgcolor: '#F2F7FC', borderRadius: 2,
              border: '1px solid #E1EBF5'
            }}>
              <Typography sx={{ fontSize: 11.5, color: '#7890A5', lineHeight: 1.6 }}>
                Consulta el documento PDF proporcionado por el aspirante durante su postulación.
              </Typography>
            </Box>

            <Button
              onClick={() => openResume(active)}
              disabled={!active.hojaVida?.urlWebflow}
              variant="contained"
              startIcon={<OpenInNewRounded />}
              sx={{
                background: 'linear-gradient(110deg,#315F86,#477FA4)',
                textTransform: 'none', borderRadius: 2.3,
                fontWeight: 800, fontSize: 12,
                px: 3, py: 1.3,
                boxShadow: '0 5px 14px rgba(49,95,134,.16)',
                '&:hover': { background: 'linear-gradient(110deg,#294F72,#3B7198)' }
              }}
            >
              Abrir PDF de Webflow
            </Button>

            {!active.hojaVida?.urlWebflow && (
              <Typography sx={{ mt: 1.5, fontSize: 11, color: '#A0ADBA' }}>
                No hay un documento disponible para esta postulación.
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {/* PIE DE FICHA */}
      <Box sx={{
        px: 2.5, py: 1.3,
        bgcolor: '#FFFFFF',
        borderTop: '1px solid #E5ECF4'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontSize: 10.5, color: '#A1AFBD' }}>
            Coclí · Gestión de Talento Humano
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#A1AFBD' }}>
            Ficha de postulación
          </Typography>
        </Stack>
      </Box>
    </Box>
  )}
</Drawer>

    <Snackbar open={!!notice} autoHideDuration={4500} onClose={() => setNotice('')} message={notice} />
  </Box>;

}
