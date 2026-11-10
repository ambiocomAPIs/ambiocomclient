import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  InputAdornment, MenuItem, Paper, Snackbar, Stack, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
  useMediaQuery, Tabs, Tab, Skeleton, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  AddRounded, ArticleOutlined, ArrowOutwardRounded, CalendarMonthRounded,
  CheckCircleRounded, CloseRounded, CloudDoneRounded, CloudOffRounded,
  CodeRounded, EditOutlined, ExpandMoreRounded, FilterAltOffRounded,
  ImageOutlined, InfoOutlined, LanguageRounded, LocationOnOutlined,
  OpenInNewRounded, PublishRounded, RefreshRounded, SearchRounded,
  UnpublishedRounded, ViewAgendaRounded, ViewModuleRounded, WorkOutlineRounded,
} from '@mui/icons-material';

const COLLECTION_ID = '6abfc7a406c7b74234034c81';
const NAVY = '#172F50';
const BLUE = '#315F89';
const SOFT = '#F4F7FB';
const GREEN = '#18846C';
const border = '1px solid #E2E9F1';

const FIELD_SECTIONS = [
  { title: 'Información general', subtitle: 'Identidad, presentación e imagen de la vacante', keys: ['name', 'slug', 'imagen-de-la-vacante', 'resumen', 'area'] },
  { title: 'Condiciones laborales', subtitle: 'Ubicación, modalidad y contratación', keys: ['ubicacion', 'modalidad', 'tipo-de-contrato'] },
  { title: 'Perfil del cargo', subtitle: 'Los campos enriquecidos admiten HTML', keys: ['descripcion-de-la-vacante', 'responsabilidades', 'requisitos', 'ofrecemos'] },
  { title: 'Publicación y enlaces', subtitle: 'Vigencia y enlaces complementarios', keys: ['fecha-de-publicacion', 'fecha-de-cierre', 'vacante-activa', 'linkedin', 'video-sobre-ambiocom'] },
];
const SLUGS = FIELD_SECTIONS.flatMap(s => s.keys);
const HTML_FIELDS = new Set(['descripcion-de-la-vacante', 'responsabilidades', 'requisitos', 'ofrecemos']);
const decodeText = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const normal = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const urlValue = v => typeof v === 'string' ? v : (v?.url || v?.fileUrl || '');
const safeImage = v => { const value = urlValue(v); try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const isoDay = v => { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'}); };
const datetimeLocal = v => { if (!v) return ''; const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return shifted.toISOString().slice(0, 16); };
const toIso = v => v ? new Date(v).toISOString() : null;
const slugify = s => normal(s).replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-').slice(0, 256);
const optionName = (field, id) => field?.validations?.options?.find(o => o.id === id)?.name || (id || '—');
const published = p => !p?.isDraft && !p?.isArchived && Boolean(p?.lastPublished);
const errorMessage = e => e?.response?.data?.message || e?.response?.data?.error || e?.message || 'No fue posible completar la operación.';
const extractList = data => Array.isArray(data) ? data : data?.vacantes || data?.items || data?.data?.vacantes || [];
const findField = (fields, slug) => fields.find(f => f.slug === slug);

function makeForm(item) {
  const fd = item?.fieldData || {};
  const result = {};
  SLUGS.forEach(key => {
    const val = fd[key];
    if (key === 'vacante-activa') result[key] = val === true;
    else if (key === 'imagen-de-la-vacante') result[key] = urlValue(val);
    else if (key.startsWith('fecha-de-')) result[key] = datetimeLocal(val);
    else result[key] = typeof val === 'string' ? val : '';
  });
  return result;
}

function buildPayload(form, existingItem) {
  const data = {};
  SLUGS.forEach(key => {
    if (key === 'vacante-activa') { data[key] = Boolean(form[key]); return; }
    if (key === 'imagen-de-la-vacante') {
      const entered = String(form[key] || '').trim();
      const prior = existingItem?.fieldData?.[key];
      if (entered && entered === urlValue(prior) && prior && typeof prior === 'object') data[key] = prior;
      else if (entered) data[key] = { url: entered, alt: form.name || 'Vacante Ambiocom' };
      return;
    }
    if (key.startsWith('fecha-de-')) { if (form[key]) data[key] = toIso(form[key]); return; }
    const str = String(form[key] ?? '').trim();
    if (str) data[key] = str;
  });
  // Omitimos campos opcionales vacíos; el backend puede permitir su limpieza
  // explícita con la estrategia apropiada de Webflow.
  return data;
}

function VacancyImage({ field, height = 185 }) {
  const src = safeImage(field);
  return <Box sx={{ height, bgcolor: '#EAF0F6', position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
    {src ? <Box component="img" src={src} alt="Imagen de vacante" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> :
      <Stack alignItems="center" spacing={1} sx={{ color: '#A0B2C4' }}><ImageOutlined sx={{ fontSize: 42 }} /><Typography variant="caption">Sin imagen disponible</Typography></Stack>}
  </Box>;
}

function StatePills({ item }) {
  const active = item?.fieldData?.['vacante-activa'] === true;
  return <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
    <Chip size="small" icon={<CheckCircleRounded />} label={active ? 'Activa' : 'Inactiva'} sx={{ height: 25, fontWeight: 800, bgcolor: active ? '#E1F5EB' : '#EEF1F5', color: active ? GREEN : '#65768A', '& .MuiChip-icon': {color:active?GREEN:'#93A0AF'} }} />
    <Chip size="small" label={item?.isArchived ? 'Archivada' : item?.isDraft ? 'Borrador' : published(item) ? 'Publicada' : 'Sin publicar'} sx={{ height: 25, bgcolor: '#EDF3FA', color: BLUE, fontSize: 11, fontWeight: 750 }} />
  </Stack>;
}

function FormField({ field, value, onChange, nameValue }) {
  const { slug, displayName, type, isRequired, helpText, validations } = field;
  const props = { fullWidth:true, size:'small', label:displayName, value:value ?? '', onChange:e => onChange(slug,e.target.value), helperText:helpText || undefined, sx:{'& .MuiOutlinedInput-root':{borderRadius:2.2}}, InputLabelProps:{shrink:true} };
  if (type === 'Switch') return <FormControlLabel sx={{m:0, display:'flex', alignItems:'center'}} control={<Switch checked={Boolean(value)} onChange={(_,v)=>onChange(slug,v)} color="success" />} label={<Stack><Typography sx={{fontSize:13,fontWeight:800}}>{displayName}</Typography><Typography sx={{fontSize:11,color:'#7E91A4'}}>{helpText}</Typography></Stack>} />;
  if (type === 'Option') return <TextField {...props} select required={isRequired} value={value || ''}>
    <MenuItem value=""><em>Seleccionar opción</em></MenuItem>
    {(validations?.options || []).map(o => <MenuItem value={o.id} key={o.id}>{o.name}</MenuItem>)}
  </TextField>;
  if (type === 'DateTime') return <TextField {...props} type="datetime-local" required={isRequired} />;
  if (type === 'Image') return <Stack spacing={1}>
    <TextField {...props} label="URL HTTPS de imagen" required={isRequired} placeholder="https://..." helperText="Usa una imagen existente de Webflow o una URL pública HTTPS. Subida desde el equipo requiere un endpoint de archivos adicional." />
    {safeImage(value) && <Box sx={{borderRadius:2,overflow:'hidden',border}}><VacancyImage field={value} height={145}/></Box>}
  </Stack>;
  if (HTML_FIELDS.has(slug)) return <TextField {...props} required={isRequired} multiline minRows={4} maxRows={11} helperText={`${helpText || ''} · Admite HTML: <p>, <ul>, <li>, <strong>.`} />;
  if (slug === 'resumen') return <TextField {...props} required={isRequired} multiline minRows={2} maxRows={4} />;
  return <TextField {...props} required={isRequired} inputProps={validations?.maxLength ? {maxLength:validations.maxLength} : undefined} placeholder={slug==='slug' ? slugify(nameValue) : undefined} />;
}

export default function GestionVacantesWebflowCMS({
  baseUrl = 'https://ambiocomserver.onrender.com/api/webflow-cms',
  collectionId = COLLECTION_ID,
  soloLectura = false,
  sitioPublico = 'https://ambiocom.com/vacantes-page',
}) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [items,setItems] = useState([]);
  const [schema,setSchema] = useState(null);
  const [loading,setLoading] = useState(true);
  const [schemaLoading,setSchemaLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [q,setQ] = useState('');
  const [filter,setFilter] = useState('todas');
  const [view,setView] = useState('cards');
  const [editor,setEditor] = useState(null); // { mode, item }
  const [form,setForm] = useState(makeForm(null));
  const [slugTouched,setSlugTouched] = useState(false);
  const [formError,setFormError] = useState('');
  const [confirm,setConfirm] = useState(null); // {action, item}
  const [details,setDetails] = useState(null);
  const [tab,setTab] = useState(0);
  const api = useMemo(() => axios.create({baseURL:baseUrl,withCredentials:true,timeout:30000}),[baseUrl]);

  const refresh = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const {data} = await api.get('/vacantes',{signal});
      if (data?.ok === false) throw new Error(data.message || 'La consulta no se completó.');
      if (!signal?.aborted) setItems(extractList(data));
    } catch(e) {
      if (e.code !== 'ERR_CANCELED' && !signal?.aborted) setError(errorMessage(e));
    } finally { if (!signal?.aborted) setLoading(false); }
  },[api]);

  const loadSchema = useCallback(async signal => {
    setSchemaLoading(true);
    try {
      const {data} = await api.get(`/colecciones/${encodeURIComponent(collectionId)}/modelo`,{signal});
      if (data?.ok === false) throw new Error(data.message || 'No fue posible consultar el modelo.');
      if (!signal?.aborted) setSchema(data.coleccion || data);
    } catch(e) {
      if (e.code !== 'ERR_CANCELED' && !signal?.aborted) setError(`Modelo CMS: ${errorMessage(e)}`);
    } finally {if (!signal?.aborted) setSchemaLoading(false);}
  },[api,collectionId]);

  useEffect(()=>{ const c = new AbortController(); refresh(c.signal); loadSchema(c.signal); return ()=>c.abort(); },[refresh,loadSchema]);

  const fields = schema?.fields || [];
  const stats = useMemo(()=>({
    total:items.length,
    active:items.filter(i=>i.fieldData?.['vacante-activa'] === true).length,
    inactive:items.filter(i=>i.fieldData?.['vacante-activa'] !== true).length,
    published:items.filter(published).length,
    draft:items.filter(i=>i.isDraft).length,
  }),[items]);
  const visible = useMemo(()=>items.filter(i=>{
    const f=i.fieldData||{};
    const text=normal([f.name,f.resumen,f.ubicacion,optionName(findField(fields,'area'),f.area)].join(' '));
    if(q && !text.includes(normal(q))) return false;
    if(filter==='activas') return f['vacante-activa']===true;
    if(filter==='inactivas') return f['vacante-activa']!==true;
    if(filter==='publicadas') return published(i);
    if(filter==='borradores') return i.isDraft;
    return true;
  }).sort((a,b)=>new Date(b.lastUpdated||b.createdOn||0)-new Date(a.lastUpdated||a.createdOn||0)),[items,q,filter,fields]);

  const openEditor=(item=null)=>{
    setForm(makeForm(item)); setEditor({mode:item?'edit':'create',item}); setFormError(''); setSlugTouched(Boolean(item)); setTab(0);
  };
  const changeField=(name,value)=>{
    setForm(prev=>{
      const next={...prev,[name]:value};
      if(name==='name' && !slugTouched) next.slug=slugify(value);
      return next;
    });
    if(name==='slug') setSlugTouched(true);
  };
  const validate=()=>{
    if(!fields.length) return 'Primero debe cargarse el modelo de la colección.';
    for(const field of fields.filter(f=>f.isEditable && f.isRequired && SLUGS.includes(f.slug))) {
      const v=form[field.slug];
      if(field.type==='Switch') continue;
      if(v===undefined || v===null || String(v).trim()==='') return `Completa el campo obligatorio: ${field.displayName}.`;
    }
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug || '')) return 'El slug debe contener solo letras minúsculas, números y guiones.';
    if(form['imagen-de-la-vacante'] && !/^https:\/\//i.test(form['imagen-de-la-vacante'])) return 'La imagen debe tener una URL HTTPS válida.';
    for (const key of ['linkedin','video-sobre-ambiocom']) if(form[key] && !/^https:\/\//i.test(form[key])) return `El enlace ${key} debe comenzar por https://.`;
    if(form['fecha-de-cierre'] && form['fecha-de-publicacion'] && new Date(form['fecha-de-cierre'])<new Date(form['fecha-de-publicacion'])) return 'La fecha de cierre no puede ser anterior a la fecha de publicación.';
    return '';
  };
  const save=async()=>{
    const invalid=validate(); if(invalid){setFormError(invalid);return;}
    setBusy(true);setFormError('');
    try {
      const body={fieldData:buildPayload(form,editor?.item)};
      const {data}=editor?.mode==='create' ? await api.post('/vacantes',body) : await api.patch(`/vacantes/${encodeURIComponent(editor.item.id)}`,body);
      if(data?.ok===false) throw new Error(data.message || 'Webflow rechazó la operación.');
      setNotice(editor?.mode==='create'?'Vacante creada como borrador.':'Cambios guardados en Webflow (revisa el estado de publicación).');
      setEditor(null); await refresh();
    }catch(e){setFormError(errorMessage(e));}finally{setBusy(false);}
  };
  const performAction=async()=>{
    if(!confirm)return;
    const {action,item}=confirm;
    setBusy(true);
    try{
      const {data}=await api.post(`/vacantes/${encodeURIComponent(item.id)}/${action}`,{});
      if(data?.ok===false)throw new Error(data.message||'No se pudo completar la operación.');
      setNotice(action==='publicar'?'Vacante enviada a publicación.':'Vacante despublicada.');
      setConfirm(null); await refresh();
    }catch(e){setError(errorMessage(e));setConfirm(null);}finally{setBusy(false);}
  };

  const summaryCard=(label,n,icon,color)=> <Paper elevation={0} sx={{border,borderRadius:3,p:2,bgcolor:'#fff'}}>
    <Stack direction="row" alignItems="center" spacing={1.6}>
      <Box sx={{p:1.2,bgcolor:'#EDF3FA',borderRadius:2,color}}>{icon}</Box>
      <Box><Typography sx={{fontSize:24,fontWeight:900,color:NAVY,lineHeight:1.05}}>{n}</Typography><Typography sx={{fontSize:11.5,color:'#7C8FA3',fontWeight:700,mt:0.5}}>{label}</Typography></Box>
    </Stack>
  </Paper>;

  const card=(item)=>{
    const f=item.fieldData || {};
    return <Card elevation={0} key={item.id} sx={{border,borderRadius:3,overflow:'hidden',display:'flex',flexDirection:'column',height:'100%',boxShadow:'0 5px 25px rgba(25,53,87,.045)','&:hover':{boxShadow:'0 12px 30px rgba(25,53,87,.11)',transform:'translateY(-2px)'},transition:'all .2s'}}>
      <VacancyImage field={f['imagen-de-la-vacante']} height={200}/>
      <CardContent sx={{p:2.3,flex:1,display:'flex',flexDirection:'column','&:last-child':{pb:2.3}}}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{mb:1.5}}>
          <Typography sx={{fontSize:11,fontWeight:850,color:BLUE}}>{optionName(findField(fields,'area'),f.area)}</Typography>
          <StatePills item={item}/>
        </Stack>
        <Typography sx={{fontWeight:900,fontSize:18,color:NAVY,lineHeight:1.3,mb:1.1}}>{f.name || 'Vacante sin nombre'}</Typography>
        <Typography sx={{fontSize:12.5,color:'#64778B',lineHeight:1.65,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden',mb:1.8}}>{decodeText(f.resumen)||'Sin resumen'}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt:'auto',mb:2}}>
          <Chip size="small" icon={<LocationOnOutlined />} label={f.ubicacion||'Sin ubicación'} sx={{bgcolor:SOFT,fontSize:10.5}}/>
          <Chip size="small" label={optionName(findField(fields,'modalidad'),f.modalidad)} sx={{bgcolor:SOFT,fontSize:10.5}}/>
          <Chip size="small" label={optionName(findField(fields,'tipo-de-contrato'),f['tipo-de-contrato'])} sx={{bgcolor:SOFT,fontSize:10.5}}/>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="contained" startIcon={<EditOutlined />} disabled={soloLectura || !fields.length} onClick={()=>openEditor(item)} sx={{textTransform:'none',fontWeight:800,bgcolor:BLUE,borderRadius:2.2,boxShadow:'none'}}>Editar</Button>
          <Tooltip title="Ver detalle"><IconButton onClick={()=>setDetails(item)} sx={{border,color:BLUE,borderRadius:2}}><ArticleOutlined /></IconButton></Tooltip>
          <Tooltip title="Abrir página de vacantes"><IconButton component="a" href={sitioPublico} target="_blank" rel="noopener noreferrer" sx={{border,color:BLUE,borderRadius:2}}><OpenInNewRounded /></IconButton></Tooltip>
        </Stack>
        {!soloLectura && <Stack direction="row" justifyContent="flex-end" sx={{mt:1}}>
          {published(item) ? <Button size="small" color="warning" onClick={()=>setConfirm({action:'despublicar',item})} startIcon={<UnpublishedRounded />} sx={{textTransform:'none'}}>Despublicar</Button> : <Button size="small" color="success" onClick={()=>setConfirm({action:'publicar',item})} startIcon={<PublishRounded />} sx={{textTransform:'none'}}>Publicar</Button>}
        </Stack>}
      </CardContent>
    </Card>;
  };

  return <Box sx={{minHeight:'100%',bgcolor:SOFT,p:{xs:1.5,md:3},color:NAVY}}>
    <Box sx={{maxWidth:1500,mx:'auto'}}>
      <Paper elevation={0} sx={{p:{xs:2.3,md:3},borderRadius:4,background:'linear-gradient(115deg,#18375B,#315F84 68%,#477F90)',color:'#fff',mb:2.5,boxShadow:'0 10px 32px rgba(25,52,83,.12)'}}>
        <Stack direction={{xs:'column',md:'row'}} justifyContent="space-between" spacing={2} alignItems={{md:'center'}}>
          <Box><Stack direction="row" alignItems="center" spacing={1}><LanguageRounded sx={{fontSize:17,color:'#A9DAD4'}}/><Typography sx={{fontSize:11,fontWeight:850,letterSpacing:1.7,color:'#C3D8E8'}}>COCLÍ · TALENTO HUMANO · WEBFLOW CMS</Typography></Stack>
            <Typography sx={{fontSize:{xs:23,md:31},fontWeight:900,mt:1}}>Gestión de vacantes</Typography>
            <Typography sx={{fontSize:12,color:'#D4E2EE',mt:0.65}}>Consulta, administra y publica los empleos de Ambiocom desde un solo lugar.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button onClick={()=>refresh()} disabled={loading||busy} startIcon={loading?<CircularProgress size={16} color="inherit"/>:<RefreshRounded />} sx={{color:'#fff',border:'1px solid #ffffff55',borderRadius:2,textTransform:'none'}}>Actualizar</Button>
            <Button onClick={()=>openEditor()} disabled={soloLectura||schemaLoading||!fields.length||busy} variant="contained" startIcon={<AddRounded />} sx={{bgcolor:'#fff',color:BLUE,fontWeight:900,boxShadow:'none',borderRadius:2,textTransform:'none','&:hover':{bgcolor:'#E8F3FB'}}}>Nueva vacante</Button>
          </Stack>
        </Stack>
      </Paper>
      {error && <Alert severity="error" onClose={()=>setError('')} sx={{mb:2,borderRadius:2}}>{error}</Alert>}
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'repeat(2,minmax(0,1fr))',lg:'repeat(5,minmax(0,1fr))'},gap:1.3,mb:2.5}}>
        {summaryCard('Vacantes totales',stats.total,<WorkOutlineRounded />,BLUE)}
        {summaryCard('Activas',stats.active,<CheckCircleRounded />,GREEN)}
        {summaryCard('Inactivas',stats.inactive,<CloudOffRounded />,'#8491A0')}
        {summaryCard('Publicadas',stats.published,<CloudDoneRounded />,GREEN)}
        {summaryCard('Borradores',stats.draft,<ArticleOutlined />,'#A47736')}
      </Box>
      <Paper elevation={0} sx={{border,borderRadius:3,p:2,mb:2.5}}>
        <Stack direction={{xs:'column',md:'row'}} alignItems={{md:'center'}} justifyContent="space-between" gap={1.5}>
          <TextField placeholder="Buscar por cargo, resumen, área o ubicación..." value={q} onChange={e=>setQ(e.target.value)} size="small" sx={{flex:1,maxWidth:{md:470},'& .MuiOutlinedInput-root':{borderRadius:2}}} InputProps={{startAdornment:<InputAdornment position="start"><SearchRounded sx={{color:'#8599AD'}}/></InputAdornment>}}/>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <TextField select size="small" label="Estado" value={filter} onChange={e=>setFilter(e.target.value)} sx={{minWidth:160,'& .MuiOutlinedInput-root':{borderRadius:2}}}>
              {[['todas','Todas'],['activas','Activas'],['inactivas','Inactivas'],['publicadas','Publicadas'],['borradores','Borradores']].map(([val,name])=><MenuItem key={val} value={val}>{name}</MenuItem>)}
            </TextField>
            <Tooltip title="Limpiar filtros"><IconButton onClick={()=>{setQ('');setFilter('todas');}}><FilterAltOffRounded /></IconButton></Tooltip>
            <Stack direction="row" sx={{p:.4,bgcolor:'#EDF3F9',borderRadius:2}}>
              <Tooltip title="Vista de tarjetas"><IconButton onClick={()=>setView('cards')} size="small" sx={{bgcolor:view==='cards'?'white':'transparent',color:BLUE}}><ViewModuleRounded /></IconButton></Tooltip>
              <Tooltip title="Vista de tabla"><IconButton onClick={()=>setView('table')} size="small" sx={{bgcolor:view==='table'?'white':'transparent',color:BLUE}}><ViewAgendaRounded /></IconButton></Tooltip>
            </Stack>
          </Stack>
        </Stack>
        <Typography sx={{fontSize:11,color:'#8699AA',mt:1.5}}>{loading?'Consultando Webflow…':`${visible.length} de ${items.length} vacantes`} · La condición Activa es independiente de la publicación en Webflow.</Typography>
      </Paper>
      {loading ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))',lg:'repeat(3,minmax(0,1fr))'},gap:2}}>{[1,2,3].map(i=><Paper key={i} sx={{p:2,borderRadius:3}}><Skeleton variant="rounded" height={190}/><Skeleton height={40}/><Skeleton/><Skeleton width="70%"/></Paper>)}</Box> : !visible.length ?
        <Paper elevation={0} sx={{p:7,borderRadius:3,border,textAlign:'center'}}><WorkOutlineRounded sx={{fontSize:44,color:'#9CACBD'}}/><Typography sx={{fontWeight:800,mt:1}}>No hay vacantes para mostrar</Typography><Typography sx={{fontSize:12,color:'#8495A5',mt:.5}}>Cambia los filtros o consulta de nuevo.</Typography></Paper> :
        view==='cards' ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,minmax(0,1fr))',lg:'repeat(3,minmax(0,1fr))'},gap:2}}>{visible.map(card)}</Box> :
        <TableContainer component={Paper} elevation={0} sx={{border,borderRadius:3}}><Table sx={{minWidth:850}}><TableHead><TableRow sx={{bgcolor:'#EDF3F9'}}>{['Vacante','Área','Ubicación','Estado','Publicación','Última edición','Acciones'].map(t=><TableCell key={t} sx={{fontSize:11,fontWeight:900,color:BLUE}}>{t}</TableCell>)}</TableRow></TableHead><TableBody>
          {visible.map(item=>{const f=item.fieldData||{};return <TableRow hover key={item.id}>
            <TableCell><Stack direction="row" alignItems="center" spacing={1.5}><Avatar variant="rounded" src={safeImage(f['imagen-de-la-vacante'])} sx={{width:55,height:45,bgcolor:'#E6EDF5'}}><WorkOutlineRounded /></Avatar><Box><Typography sx={{fontSize:12.5,fontWeight:850}}>{f.name}</Typography><Typography sx={{fontSize:10.5,color:'#899AAB'}}>{f.slug}</Typography></Box></Stack></TableCell>
            <TableCell sx={{fontSize:12}}>{optionName(findField(fields,'area'),f.area)}</TableCell><TableCell sx={{fontSize:12}}>{f.ubicacion||'—'}</TableCell><TableCell><StatePills item={{...item,isDraft:false,lastPublished:null,isArchived:false}}/></TableCell><TableCell sx={{fontSize:12}}>{item.isDraft?'Borrador':published(item)?'Publicada':'Sin publicar'}</TableCell><TableCell sx={{fontSize:12}}>{isoDay(item.lastUpdated)}</TableCell>
            <TableCell><Tooltip title="Editar"><span><IconButton disabled={soloLectura||!fields.length} onClick={()=>openEditor(item)}><EditOutlined fontSize="small"/></IconButton></span></Tooltip><Tooltip title="Ver detalle"><IconButton onClick={()=>setDetails(item)}><ArticleOutlined fontSize="small"/></IconButton></Tooltip>{!soloLectura && <Tooltip title={published(item)?'Despublicar':'Publicar'}><IconButton onClick={()=>setConfirm({action:published(item)?'despublicar':'publicar',item})}>{published(item)?<UnpublishedRounded fontSize="small"/>:<PublishRounded fontSize="small"/>}</IconButton></Tooltip>}</TableCell>
          </TableRow>;})}
        </TableBody></Table></TableContainer>
      }
      <Typography sx={{fontSize:10.5,color:'#91A0B0',my:2,textAlign:'right'}}>Colección Webflow: {collectionId} · Se muestran registros CMS de la consulta, incluidos borradores y elementos inactivos.</Typography>
    </Box>

    <Dialog open={Boolean(editor)} onClose={()=>{if(!busy)setEditor(null);}} fullWidth maxWidth="md" fullScreen={mobile} PaperProps={{sx:{borderRadius:mobile?0:3,maxHeight:'94vh'}}}>
      <DialogTitle sx={{px:3,py:2.3,borderBottom:border}}><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography sx={{fontSize:20,fontWeight:900,color:NAVY}}>{editor?.mode==='create'?'Crear nueva vacante':'Editar vacante'}</Typography><Typography sx={{fontSize:11.5,color:'#8293A5'}}>Colección VACANTEs · Webflow CMS</Typography></Box><IconButton disabled={busy} onClick={()=>setEditor(null)}><CloseRounded/></IconButton></Stack></DialogTitle>
      <DialogContent sx={{p:3,bgcolor:'#FAFCFE'}}>
        <Alert severity="info" icon={<InfoOutlined />} sx={{mb:2,borderRadius:2}}>Guardar modifica el contenido del CMS, pero <b>publicar es una acción independiente</b>. Para imágenes nuevas utiliza una URL HTTPS accesible.</Alert>
        {formError && <Alert severity="error" sx={{mb:2}}>{formError}</Alert>}
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto" sx={{mb:2,borderBottom:border}}>{FIELD_SECTIONS.map(s=><Tab key={s.title} label={s.title} sx={{fontSize:11.5,fontWeight:800,textTransform:'none'}}/>)}</Tabs>
        {FIELD_SECTIONS.map((section,index)=>tab!==index?null:<Box key={section.title}>
          <Typography sx={{fontSize:16,fontWeight:900,color:NAVY}}>{section.title}</Typography><Typography sx={{fontSize:11.5,color:'#8293A5',mb:2.5}}>{section.subtitle}</Typography>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,minmax(0,1fr))'},gap:2}}>{section.keys.map(slug=>{
            const field=findField(fields,slug);
            if(!field) return null;
            return <Box key={slug} sx={{gridColumn: HTML_FIELDS.has(slug)||['resumen','imagen-de-la-vacante'].includes(slug)?'1 / -1':undefined}}><FormField field={field} value={form[slug]} onChange={changeField} nameValue={form.name}/></Box>;
          })}</Box>
        </Box>)}
        <Divider sx={{my:3}}/>
        <Accordion disableGutters elevation={0} sx={{border,borderRadius:'12px !important',overflow:'hidden'}}><AccordionSummary expandIcon={<ExpandMoreRounded/>}><Stack direction="row" alignItems="center" spacing={1}><CodeRounded sx={{fontSize:18,color:BLUE}}/><Typography sx={{fontSize:12,fontWeight:800}}>Inspeccionar payload JSON de envío</Typography></Stack></AccordionSummary><AccordionDetails><Box component="pre" sx={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:11,maxHeight:280,overflow:'auto',p:2,bgcolor:'#F2F6FA',borderRadius:2}}>{JSON.stringify({fieldData:buildPayload(form,editor?.item)},null,2)}</Box></AccordionDetails></Accordion>
      </DialogContent>
      <DialogActions sx={{p:2,borderTop:border}}><Button disabled={busy} onClick={()=>setEditor(null)} sx={{textTransform:'none'}}>Cancelar</Button><Button disabled={busy||!fields.length} variant="contained" onClick={save} startIcon={busy?<CircularProgress size={16} color="inherit"/>:<CheckCircleRounded />} sx={{textTransform:'none',fontWeight:900,bgcolor:GREEN,borderRadius:2,boxShadow:'none'}}>{editor?.mode==='create'?'Crear borrador':'Guardar cambios'}</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(details)} onClose={()=>setDetails(null)} fullWidth maxWidth="sm"><DialogTitle sx={{fontWeight:900,color:NAVY}}>Ficha de vacante<IconButton sx={{float:'right'}} onClick={()=>setDetails(null)}><CloseRounded/></IconButton></DialogTitle><DialogContent dividers>
      {details&&<Stack spacing={2}><VacancyImage field={details.fieldData?.['imagen-de-la-vacante']} height={220}/><Typography sx={{fontSize:20,fontWeight:900}}>{details.fieldData?.name}</Typography><StatePills item={details}/><Typography sx={{color:'#526D85',fontSize:13}}>{decodeText(details.fieldData?.resumen)}</Typography>
        {['descripcion-de-la-vacante','responsabilidades','requisitos','ofrecemos'].map(k=><Box key={k}><Typography sx={{fontSize:12.5,fontWeight:850,mb:.5}}>{findField(fields,k)?.displayName||k}</Typography><Typography sx={{fontSize:12.5,color:'#6A7E92',whiteSpace:'pre-wrap'}}>{decodeText(details.fieldData?.[k])||'—'}</Typography></Box>)}
        <Divider/><Typography sx={{fontSize:11,color:'#7B8EA1'}}>Fecha de publicación: {isoDay(details.fieldData?.['fecha-de-publicacion'])} · Cierre: {isoDay(details.fieldData?.['fecha-de-cierre'])}</Typography>
      </Stack>}
    </DialogContent><DialogActions><Button onClick={()=>setDetails(null)}>Cerrar</Button><Button disabled={soloLectura||!fields.length} variant="contained" onClick={()=>{const item=details;setDetails(null);openEditor(item);}}>Editar</Button></DialogActions></Dialog>

    <Dialog open={Boolean(confirm)} onClose={()=>{if(!busy)setConfirm(null)}} maxWidth="xs" fullWidth><DialogTitle sx={{fontWeight:900,color:NAVY}}>{confirm?.action==='publicar'?'Confirmar publicación':'Confirmar despublicación'}</DialogTitle><DialogContent><Typography sx={{fontSize:13,color:'#5B7188'}}>¿Deseas {confirm?.action==='publicar'?'publicar':'despublicar'} la vacante <b>{confirm?.item?.fieldData?.name}</b> en Webflow? Esta operación cambia el estado público y es diferente de marcar el campo «vacante activa».</Typography></DialogContent><DialogActions sx={{p:2}}><Button disabled={busy} onClick={()=>setConfirm(null)}>Cancelar</Button><Button disabled={busy} onClick={performAction} variant="contained" color={confirm?.action==='publicar'?'success':'warning'}>{busy?<CircularProgress size={18} color="inherit"/>:'Confirmar'}</Button></DialogActions></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={()=>setNotice('')} anchorOrigin={{vertical:'bottom',horizontal:'right'}}><Alert onClose={()=>setNotice('')} severity="success" variant="filled">{notice}</Alert></Snackbar>
  </Box>;
}
