import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, InputAdornment,
  Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import {
  AccountTreeRounded, ApiRounded, CheckCircleRounded, CodeRounded,
  ContentCopyRounded, DataObjectRounded, DatasetRounded, ErrorOutlineRounded,
  ExpandMoreRounded, FindInPageRounded, KeyRounded, LayersRounded,
  RefreshRounded, SchemaRounded, SearchRounded, StorageRounded,
  ViewListRounded, WarningAmberRounded,
} from '@mui/icons-material';

const AZUL = '#173452';
const AZUL_MEDIO = '#426E98';
const BORDE = '#E2EAF2';
const FONDO = '#F4F7FB';
const SUPERFICIE = { border: `1px solid ${BORDE}`, borderRadius: 3, boxShadow: '0 5px 24px rgba(22,52,82,.035)' };

// Debe coincidir con el prefijo registrado en Express: app.use('/api/webflow-cms', router).
// En despliegues con dominios distintos, pásalo desde el padre: baseUrl="https://api.tu-dominio.com/api/webflow-cms".
const API_BASE = 'https://ambiocomserver.onrender.com/api/webflow-cms';

const asArray = value => Array.isArray(value) ? value : [];
const texto = value => String(value ?? '').trim();
const legible = value => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
const fieldId = field => texto(field?.id || field?.slug || field?.displayName || field?.name);
const getCollectionId = collection => texto(collection?.id || collection?._id);
const getCollectionName = collection => texto(collection?.displayName || collection?.name || collection?.slug) || 'Colección sin nombre';
const extractFields = collection => asArray(collection?.fields || collection?.fieldDefinitions);
const extractCollections = payload => {
  const items = payload?.colecciones ?? payload?.collections ?? payload;
  if (!Array.isArray(items)) throw new Error('El servidor no devolvió una lista de colecciones.');
  return items;
};
const getErrorMessage = (error, fallback) => {
  if (error?.code === 'ERR_CANCELED' || axios.isCancel(error)) return '';
  const apiMessage = error?.response?.data?.message;
  const status = error?.response?.status;
  if (status === 401) return 'Tu sesión no está autenticada (401). Inicia sesión en Coclí.';
  if (status === 403) return 'Tu rol no tiene autorización para consultar este módulo (403).';
  if (status === 404) return 'No se encontró el endpoint (404). Revisa el montaje de las rutas en Express.';
  if (status === 502) return `${apiMessage || fallback} Revisa el token, WEBFLOW_SITE_ID y los permisos CMS en el backend.${error?.response?.data?.statusWebflow ? ` Webflow respondió ${error.response.data.statusWebflow}.` : ''}`;
  if (error?.code === 'ECONNABORTED') return 'La petición excedió el tiempo de espera.';
  return apiMessage || error?.message || fallback;
};

function Info({ label, value, mono = false }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 750, color: '#8295AA', mb: .4 }}>{label}</Typography>
      <Typography title={legible(value)} sx={{ fontSize: 12.5, fontWeight: 700, color: AZUL, overflowWrap: 'anywhere', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {legible(value)}
      </Typography>
    </Box>
  );
}

function JsonViewer({ value, title, onCopy }) {
  return (
    <Paper elevation={0} sx={{ ...SUPERFICIE, overflow: 'hidden', bgcolor: '#101E31' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.2, bgcolor: '#192B43', color: '#DAE8F7' }}>
        <Stack direction="row" gap={1} alignItems="center"><DataObjectRounded sx={{ fontSize: 19 }}/><Typography sx={{ fontSize: 12, fontWeight: 800 }}>{title}</Typography></Stack>
        <Tooltip title="Copiar JSON"><IconButton onClick={onCopy} size="small" sx={{ color: '#D9E8F7' }}><ContentCopyRounded fontSize="small"/></IconButton></Tooltip>
      </Stack>
      <Box component="pre" sx={{ p: 2, m: 0, maxHeight: 460, overflow: 'auto', color: '#C7E5D7', fontFamily: 'Consolas, Monaco, monospace', fontSize: 11.5, lineHeight: 1.65, whiteSpace: 'pre' }}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </Paper>
  );
}

export default function ExploradorWebflowCMSDeveloper({
  baseUrl = API_BASE,
  titulo = 'Explorador Webflow CMS',
  // Importante: esta opción solo controla el render. La autorización real es requireAuth + requireRole("developer") en Express.
  esDesarrollador = true,
}) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [colecciones, setColecciones] = useState([]);
  const [modelo, setModelo] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [listError, setListError] = useState('');
  const [modelError, setModelError] = useState('');
  const [vista, setVista] = useState('campos');
  const [copied, setCopied] = useState(false);

  const listar = useCallback(async (signal) => {
    setLoadingList(true);
    setListError('');
    try {
      const { data } = await axios.get(`${baseUrl}/colecciones`, { withCredentials: true, signal, timeout: 20000 });
      const items = extractCollections(data);
      if (signal?.aborted) return;
      setColecciones(items);
      setSelectedId(prev => prev && items.some(c => getCollectionId(c) === prev) ? prev : (getCollectionId(items[0]) || ''));
    } catch (error) {
      if (signal?.aborted || error?.code === 'ERR_CANCELED') return;
      setListError(getErrorMessage(error, 'No fue posible consultar las colecciones.'));
    } finally {
      if (!signal?.aborted) setLoadingList(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!esDesarrollador) return undefined;
    const ctrl = new AbortController();
    listar(ctrl.signal);
    return () => ctrl.abort();
  }, [esDesarrollador, listar]);

  useEffect(() => {
    if (!esDesarrollador || !selectedId) {
      setModelo(null);
      setModelError('');
      return undefined;
    }
    const ctrl = new AbortController();
    setModelo(null);
    setModelError('');
    setFieldSearch('');
    setVista('campos');
    setLoadingModel(true);
    axios.get(`${baseUrl}/colecciones/${encodeURIComponent(selectedId)}/modelo`, {
      withCredentials: true, signal: ctrl.signal, timeout: 20000,
    }).then(({ data }) => {
      if (!ctrl.signal.aborted) setModelo(data?.coleccion ?? data);
    }).catch(error => {
      if (!ctrl.signal.aborted && error?.code !== 'ERR_CANCELED') {
        setModelError(getErrorMessage(error, 'No fue posible consultar el modelo de la colección.'));
      }
    }).finally(() => { if (!ctrl.signal.aborted) setLoadingModel(false); });
    return () => ctrl.abort();
  }, [baseUrl, esDesarrollador, selectedId]);

  const selected = useMemo(() => colecciones.find(c => getCollectionId(c) === selectedId) || null, [colecciones, selectedId]);
  const filteredCollections = useMemo(() => colecciones.filter(c =>
    [getCollectionName(c), c.slug, getCollectionId(c)].some(v => texto(v).toLowerCase().includes(search.toLowerCase().trim()))
  ), [colecciones, search]);
  const fields = useMemo(() => extractFields(modelo), [modelo]);
  const filteredFields = useMemo(() => fields.filter(f =>
    [f.displayName, f.name, f.slug, f.type, f.id].some(v => texto(v).toLowerCase().includes(fieldSearch.toLowerCase().trim()))
  ), [fields, fieldSearch]);
  const requiredCount = fields.filter(f => f.isRequired === true || f.required === true).length;

  const copy = async value => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setModelError('El navegador no permitió copiar al portapapeles.');
    }
  };

  if (!esDesarrollador) {
    return <Alert severity="warning" sx={{ borderRadius: 2 }}>Esta vista está reservada para desarrolladores. El servidor también debe restringir sus endpoints al rol developer.</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: FONDO, minHeight: '100%', color: AZUL }}>
      <Box sx={{ mb: 2.5, p: { xs: 2, md: 3 }, borderRadius: 3, background: 'linear-gradient(115deg,#132F4E 0%,#255479 75%,#34768A 100%)', color: '#fff', boxShadow: '0 12px 34px rgba(23,52,82,.12)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Box>
            <Stack direction="row" alignItems="center" gap={.9} sx={{ mb: 1 }}><ApiRounded sx={{ color: '#92E0DB', fontSize: 18 }}/><Typography sx={{ color: '#BBD8E7', fontSize: 11, letterSpacing: 1.5, fontWeight: 800 }}>COCLÍ · HERRAMIENTAS DE DESARROLLADOR</Typography></Stack>
            <Typography sx={{ fontSize: { xs: 23, md: 29 }, fontWeight: 850, lineHeight: 1.2 }}>{titulo}</Typography>
            <Typography sx={{ fontSize: 12, mt: 1, color: '#D0E3ED' }}>Inspecciona las colecciones y esquemas del sitio conectado a Webflow sin modificar contenido.</Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip icon={<KeyRounded sx={{ color: '#B1DED7 !important' }}/>} label="Token solo en backend" sx={{ bgcolor: 'rgba(255,255,255,.12)', color: '#E7F4F7', fontWeight: 700 }} />
            <Button onClick={() => listar()} disabled={loadingList} startIcon={loadingList ? <CircularProgress size={15} color="inherit" /> : <RefreshRounded />} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.35)', textTransform: 'none', borderRadius: 2, px: 2 }}>Actualizar</Button>
          </Stack>
        </Stack>
      </Box>

      {listError && <Alert severity="error" onClose={() => setListError('')} sx={{ mb: 2 }}>{listError}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        <Paper elevation={0} sx={{ ...SUPERFICIE, width: { xs: '100%', lg: 350 }, flexShrink: 0, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 1.2 }}>
            <Stack direction="row" gap={1} alignItems="center"><LayersRounded sx={{ color: AZUL_MEDIO }}/><Typography sx={{ fontWeight: 850, fontSize: 15 }}>Colecciones CMS</Typography></Stack>
            <Chip size="small" label={loadingList ? '...' : colecciones.length} sx={{ fontWeight: 800, bgcolor: '#EDF4FC', color: AZUL_MEDIO }} />
          </Stack>
          <Box sx={{ px: 2, pb: 1.5 }}><TextField fullWidth size="small" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colección..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" sx={{ color: '#8FA5BA' }}/></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} /></Box>
          <Divider />
          <Box sx={{ maxHeight: { xs: 320, lg: 640 }, overflowY: 'auto', p: 1 }}>
            {loadingList && !colecciones.length && [1, 2, 3].map(i => <Skeleton key={i} height={74} sx={{ mx: 1 }} />)}
            {!loadingList && !filteredCollections.length && <Box sx={{ textAlign: 'center', p: 3 }}><FindInPageRounded sx={{ color: '#A1B4C4', fontSize: 32 }}/><Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>{search ? 'No hay colecciones que coincidan.' : 'No se encontraron colecciones.'}</Typography></Box>}
            {filteredCollections.map(c => {
              const id = getCollectionId(c);
              const active = selectedId === id;
              return <Box key={id} onClick={() => setSelectedId(id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(id); } }} sx={{ p: 1.6, mb: .6, borderRadius: 2, cursor: 'pointer', border: `1px solid ${active ? '#B5D0E7' : 'transparent'}`, bgcolor: active ? '#ECF5FD' : 'transparent', '&:hover': { bgcolor: '#F2F7FC' }, outlineOffset: 2 }}>
                <Stack direction="row" gap={1.1} alignItems="flex-start"><Box sx={{ p: .9, bgcolor: active ? '#D7EAF9' : '#EDF3F9', borderRadius: 1.5, color: AZUL_MEDIO, display: 'grid', placeItems: 'center' }}><DatasetRounded sx={{ fontSize: 19 }}/></Box><Box sx={{ minWidth: 0, flex: 1 }}><Typography sx={{ fontSize: 12.8, fontWeight: 850, color: AZUL, overflowWrap: 'anywhere' }}>{getCollectionName(c)}</Typography><Typography sx={{ color: '#8398AC', fontSize: 10.5, mt: .3, overflowWrap: 'anywhere' }}>/{texto(c.slug) || 'sin-slug'}</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: 9.5, color: '#A1AEBA', mt: .5, overflowWrap: 'anywhere' }}>{id}</Typography></Box></Stack>
              </Box>;
            })}
          </Box>
        </Paper>

        <Box sx={{ width: '100%', flex: 1, minWidth: 0 }}>
          {!selected && <Paper elevation={0} sx={{ ...SUPERFICIE, p: 5, textAlign: 'center' }}><StorageRounded sx={{ fontSize: 44, color: '#A3B8CB' }}/><Typography sx={{ mt: 1, fontWeight: 800 }}>Selecciona una colección</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>Se mostrará su modelo de campos y su respuesta JSON.</Typography></Paper>}
          {selected && <Stack spacing={2}>
            <Paper elevation={0} sx={{ ...SUPERFICIE, p: { xs: 2, md: 2.5 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} alignItems={{ sm: 'center' }}>
                <Box><Stack direction="row" gap={1} alignItems="center"><SchemaRounded sx={{ color: AZUL_MEDIO }}/><Typography sx={{ fontSize: 18, fontWeight: 850 }}>{getCollectionName(selected)}</Typography></Stack><Typography sx={{ fontSize: 11.5, color: '#8398AC', mt: .6 }}>Modelo de colección desde la API de Webflow</Typography></Box>
                <Chip label="Solo lectura" size="small" sx={{ fontWeight: 800, bgcolor: '#E8F4EE', color: '#248265' }}/>
              </Stack>
              <Divider sx={{ my: 2 }}/>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
                <Info label="Nombre de la colección" value={modelo?.displayName || getCollectionName(selected)}/>
                <Info label="Slug" value={modelo?.slug || selected?.slug} mono/>
                <Info label="ID de colección" value={selectedId} mono/>
                <Info label="Campos definidos" value={loadingModel ? 'Consultando…' : fields.length}/>
              </Box>
            </Paper>
            {modelError && <Alert severity="error" onClose={() => setModelError('')}>{modelError}</Alert>}
            {loadingModel && <Paper elevation={0} sx={{ ...SUPERFICIE, p: 3 }}><Skeleton width="35%"/><Skeleton height={42}/><Skeleton height={42}/><Skeleton height={42}/></Paper>}
            {!loadingModel && modelo && <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Stack direction="row" gap={1}>
                  <Button startIcon={<ViewListRounded/>} size="small" variant={vista === 'campos' ? 'contained' : 'outlined'} onClick={() => setVista('campos')} sx={{ textTransform: 'none', borderRadius: 2 }}>Campos ({fields.length})</Button>
                  <Button startIcon={<CodeRounded/>} size="small" variant={vista === 'json' ? 'contained' : 'outlined'} onClick={() => setVista('json')} sx={{ textTransform: 'none', borderRadius: 2 }}>JSON</Button>
                </Stack>
                <Typography sx={{ fontSize: 11, color: '#8195A9' }}>{requiredCount} campos obligatorios según el esquema</Typography>
              </Stack>
              {vista === 'campos' ? <Paper elevation={0} sx={{ ...SUPERFICIE, overflow: 'hidden' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1} sx={{ p: 2 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 850 }}>Definición de campos</Typography>
                  <TextField size="small" placeholder="Buscar campo, slug o tipo" value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 265 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: '#8AA1B7' }}/></InputAdornment> }}/>
                </Stack>
                <TableContainer sx={{ maxHeight: mobile ? 480 : 610 }}><Table stickyHeader size="small" sx={{ minWidth: 660 }}>
                  <TableHead><TableRow>{['CAMPO', 'SLUG / CLAVE API', 'TIPO', 'REQUERIDO', 'ID'].map(h => <TableCell key={h} sx={{ bgcolor: '#EEF4FA', color: '#66839D', fontSize: 10.5, fontWeight: 850 }}>{h}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {filteredFields.map((f, idx) => <TableRow hover key={`${fieldId(f)}-${idx}`} sx={{ '& td': { py: 1.35, borderBottom: '1px solid #EDF1F6' } }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: 12.2, color: AZUL }}>{f.displayName || f.name || 'Sin nombre'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: AZUL_MEDIO, fontSize: 11 }}>{f.slug || '—'}</TableCell>
                      <TableCell><Chip label={texto(f.type) || 'Sin tipo'} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: '#EEF4FA' }}/></TableCell>
                      <TableCell>{f.isRequired === true || f.required === true ? <Chip size="small" label="Sí" sx={{ bgcolor: '#FFF2E4', color: '#B27634', fontSize: 10, fontWeight: 750 }}/> : <Typography sx={{ fontSize: 11, color: '#91A1B1' }}>No</Typography>}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#8C9DAE', fontSize: 10.5 }}>{f.id || '—'}</TableCell>
                    </TableRow>)}
                    {!filteredFields.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: '#8D9EAD', fontSize: 12 }}>Sin campos que mostrar.</TableCell></TableRow>}
                  </TableBody>
                </Table></TableContainer>
              </Paper> : <JsonViewer title="Respuesta completa de la colección" value={modelo} onCopy={() => copy(JSON.stringify(modelo, null, 2))}/>}
              {copied && <Alert severity="success" icon={<CheckCircleRounded/>} sx={{ borderRadius: 2 }}>JSON copiado al portapapeles.</Alert>}
            </>}
          </Stack>}
        </Box>
      </Stack>
      <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 2.5, px: .5 }}><WarningAmberRounded sx={{ color: '#8E9FB1', fontSize: 15 }}/><Typography sx={{ fontSize: 10.5, color: '#8698AA' }}>Herramienta de inspección para desarrolladores. No contiene operaciones POST, PATCH ni DELETE. Los permisos deben comprobarse en el servidor.</Typography></Stack>
    </Box>
  );
}
