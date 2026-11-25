
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import TerminalIcon from '@mui/icons-material/Terminal';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CodeIcon from '@mui/icons-material/Code';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';

import ReactMarkdown from 'react-markdown';

// URL COMPLETA para la API de IA de Coclí (cambiar aquí en producción).
const COCLI_AI_BASE_URL = 'https://ambiocomserver.onrender.com/api/cocli-ai';
const API_URL = `${COCLI_AI_BASE_URL}/message`;

// Las URL COMPLETAS de los módulos se configuran en backend/cocliAI.routes.js
const MODULES = [
  { id: 'despachos', title: 'Despachos', detail: 'Ventas y mermas', icon: <LocalShippingOutlinedIcon /> },
  { id: 'recepciones', title: 'Recepciones', detail: 'Ingreso de alcohol', icon: <CloudDownloadOutlinedIcon /> },
  { id: 'bascula', title: 'Báscula', detail: 'Pesajes ComBas', icon: <StorageOutlinedIcon /> },
  { id: 'aguas', title: 'Aguas / PTAP', detail: 'Medidores y consumos', icon: <WaterDropOutlinedIcon /> },
  { id: 'scada', title: 'SCADA', detail: 'Niveles por fecha', icon: <MemoryIcon /> },
];
const dateISO = (d) => {
  const date = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 10);
};
const sessionKey = 'cocli_ai_session_v1';
const getSessionId = () => {
  let id = sessionStorage.getItem(sessionKey);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}_session`;
    sessionStorage.setItem(sessionKey, id);
  }
  return id;
};
const jsonResponse = async (res) => {
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`HTTP ${res.status}: respuesta no JSON.`); }
  if (!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  return data;
};

const C = {
  background: '#07111D',
  panel: '#0C1B2A',
  panelAlt: '#102334',
  border: '#223B4C',
  primary: '#4DFFD1',
  cyan: '#45CFF5',
  text: '#E4F1F7',
  muted: '#839BAD',
  mutedDark: '#668396',
  error: '#FF7485',
};

const mono = '"Consolas", "Courier New", monospace';

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const createMessage = (sender, text, isError = false) => ({
  id:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  sender,
  text,
  isError,
  time: Date.now(),
});

const suggestedPrompts = [
  {
    icon: <MemoryIcon fontSize="small" />,
    title: 'Ingeniería de procesos',
    prompt: 'Explícame cómo optimizar una columna de rectificación de etanol.',
  },
  {
    icon: <StorageOutlinedIcon fontSize="small" />,
    title: 'Balances de materia',
    prompt: 'Explícame cómo realizar un balance de masa en una destilería.',
  },
  {
    icon: <BoltIcon fontSize="small" />,
    title: 'Análisis operativo',
    prompt: 'Explícame cómo calcular las mermas logísticas de alcohol.',
  },
];

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => dateISO(new Date(Date.now() - 30 * 86400000)));
  const [dateTo, setDateTo] = useState(() => dateISO(new Date()));
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [sessionId] = useState(getSessionId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${COCLI_AI_BASE_URL}/datasets?sessionId=${encodeURIComponent(sessionId)}`, { credentials: 'include' })
      .then(jsonResponse)
      .then(data => { if (!cancelled) setDatasets(data.datasets || []); })
      .catch(err => { if (!cancelled) setDataError(err.message); });
    return () => { cancelled = true; };
  }, [sessionId]);

  const loadModule = async () => {
    if (!selectedModule || loadingData || loading) return;
    setLoadingData(true);
    setDataError('');
    try {
      const data = await fetch(`${COCLI_AI_BASE_URL}/load`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: selectedModule, from: dateFrom, to: selectedModule === 'scada' ? dateFrom : dateTo, sessionId }),
      }).then(jsonResponse);
      const newRow = { module: data.module, title: data.title, from: data.from, to: data.to, count: data.count, expiresAt: data.expiresAt };
      setDatasets(prev => [...prev.filter(d => d.module !== data.module), newRow]);
      setMessages(prev => [...prev, createMessage('bot', `✅ **${data.title} cargado:** ${data.count} registros (${data.from} a ${data.to}).\n\nDatos guardados temporalmente en MongoDB para esta sesión. Puedes preguntarme por los registros. ${data.undated ? `Advertencia: ${data.undated} registros sin fecha legible incluidos.` : ''}`)]);
      setSelectedModule(null);
    } catch (e) { setDataError(e.message); }
    finally { setLoadingData(false); }
  };

  const unloadModule = async (module) => {
    if (loading || loadingData) return;
    setDataError('');
    try {
      await fetch(`${COCLI_AI_BASE_URL}/datasets/${encodeURIComponent(module)}?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE', credentials: 'include',
      }).then(jsonResponse);
      setDatasets(prev => prev.filter(x => x.module !== module));
    } catch (e) { setDataError(e.message); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, loading]);

  const handleSend = async (customMessage) => {
    const message =
      typeof customMessage === 'string'
        ? customMessage.trim()
        : input.trim();

    if (!message || sendingRef.current) return;

    sendingRef.current = true;

    const history = messages.filter(m => !m.isError).slice(-8).map(m => ({ role: m.sender === 'bot' ? 'model' : 'user', text: m.text }));
    const userMessage = createMessage('user', message);

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId, history }),
      });

      const data = await jsonResponse(response);

      const reply =
        typeof data?.reply === 'string'
          ? data.reply.trim()
          : '';

      if (!reply) {
        throw new Error(
          'El servidor respondió correctamente, pero Gemini no devolvió texto.'
        );
      }

      if (mountedRef.current) {
        setMessages((prev) => [
          ...prev,
          createMessage('bot', reply),
        ]);
      }
    } catch (error) {
      console.error('❌ COCLÍ AI ERROR:', error);

      if (mountedRef.current) {
        setMessages((prev) => [
          ...prev,
          createMessage(
            'bot',
            error?.message ||
              'No fue posible comunicarse con el servidor.',
            true
          ),
        ]);
      }
    } finally {
      sendingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.text);

      setCopiedId(msg.id);
    } catch (error) {
      console.error('No se pudo copiar el mensaje:', error);
    }
  };

  const clearChat = () => {
    if (loading) return;

    setMessages([]);
    setInput('');
    setCopiedId(null);
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      color: C.text,
      bgcolor: '#071522',
      borderRadius: '12px',
      fontSize: '0.92rem',
      alignItems: 'flex-start',

      '& fieldset': {
        borderColor: C.border,
      },

      '&:hover fieldset': {
        borderColor: C.cyan,
      },

      '&.Mui-focused fieldset': {
        borderColor: C.primary,
      },
    },

    '& .MuiInputBase-input': {
      '&::placeholder': {
        color: C.mutedDark,
        opacity: 1,
      },
    },
  };

  const markdownStyles = {
    color: C.text,
    fontSize: '0.88rem',
    lineHeight: 1.8,
    overflowWrap: 'anywhere',

    '& p': {
      my: 1,
    },

    '& p:first-of-type': {
      mt: 0,
    },

    '& p:last-child': {
      mb: 0,
    },

    '& h1, & h2, & h3, & h4': {
      color: C.primary,
      fontWeight: 700,
      mt: 2,
      mb: 1,
      lineHeight: 1.4,
    },

    '& h1': {
      fontSize: '1.25rem',
    },

    '& h2': {
      fontSize: '1.12rem',
    },

    '& h3': {
      fontSize: '1rem',
    },

    '& strong': {
      color: C.primary,
      fontWeight: 700,
    },

    '& em': {
      color: '#B8DEEB',
    },

    '& ul, & ol': {
      pl: 3,
      my: 1.5,
    },

    '& li': {
      mb: 0.5,
    },

    '& blockquote': {
      m: 0,
      my: 2,
      pl: 2,
      py: 0.5,
      borderLeft: `3px solid ${C.cyan}`,
      color: '#C1D6E1',
      bgcolor: 'rgba(69,207,245,0.05)',
    },

    '& code': {
      fontFamily: mono,
      color: '#88F9D7',
      bgcolor: '#07111B',
      px: 0.6,
      py: 0.2,
      borderRadius: '4px',
      fontSize: '0.84em',
      overflowWrap: 'anywhere',
    },

    '& pre': {
      bgcolor: '#050F19',
      border: `1px solid ${C.border}`,
      borderRadius: '10px',
      p: 2,
      my: 1.5,
      overflowX: 'auto',
      maxWidth: '100%',

      '& code': {
        p: 0,
        bgcolor: 'transparent',
        color: '#A3F5DC',
        whiteSpace: 'pre',
        overflowWrap: 'normal',
      },
    },

    '& a': {
      color: C.cyan,
      textDecoration: 'underline',
    },

    '& hr': {
      border: 0,
      borderTop: `1px solid ${C.border}`,
      my: 2,
    },

    '& table': {
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'auto',
      borderCollapse: 'collapse',
      my: 2,
    },

    '& th, & td': {
      border: `1px solid ${C.border}`,
      px: 1.5,
      py: 1,
      textAlign: 'left',
      whiteSpace: 'normal',
      minWidth: 80,
    },

    '& th': {
      color: C.primary,
      bgcolor: '#142A38',
    },
  };

  return (
    <Box
      sx={{
        height: {
          xs: 'calc(100dvh - 85px)',
          md: 'calc(100dvh - 105px)',
        },
        mt:6.5,
        minHeight: 455,
        width: '100%',
        bgcolor: C.background,
        color: C.text,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        borderRadius: { xs: 0, sm: 2.5 },
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        fontFamily: mono,
      }}
    >
      {/* ============= HEADER ============= */}

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.8,
          bgcolor: C.panel,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: 'rgba(77,255,209,0.10)',
                color: C.primary,
                border: '1px solid rgba(77,255,209,0.25)',
                width: 43,
                height: 43,
              }}
            >
              <TerminalIcon />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 14, md: 17 },
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  color: C.text,
                }}
              >
                COCLÍ AI
                <Box component="span" sx={{ color: C.primary }}>
                  {' '}
                  / ENGINEERING
                </Box>
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,
                  color: C.muted,
                  fontFamily: mono,
                  letterSpacing: 1,
                }}
              >
                INDUSTRIAL INTELLIGENCE TERMINAL
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              size="small"
              icon={
                loading ? (
                  <CircularProgress
                    size={12}
                    sx={{ color: `${C.cyan} !important` }}
                  />
                ) : (
                  <BoltIcon sx={{ color: `${C.primary} !important` }} />
                )
              }
              label={loading ? 'PROCESSING' : 'READY'}
              sx={{
                color: loading ? C.cyan : C.primary,
                bgcolor: 'rgba(77,255,209,0.07)',
                border: '1px solid rgba(77,255,209,0.22)',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 700,
                '& .MuiChip-icon': { ml: 0.8 },
              }}
            />

            <Tooltip title="Limpiar conversación">
              <span>
                <IconButton
                  onClick={clearChat}
                  disabled={loading || messages.length === 0}
                  size="small"
                  sx={{
                    color: C.muted,
                    '&:hover': {
                      color: C.error,
                      bgcolor: 'rgba(255,116,133,0.08)',
                    },
                    '&.Mui-disabled': {
                      color: '#405466',
                    },
                  }}
                >
                  <DeleteSweepOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* ============= STATUS BAR ============= */}

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          px: { xs: 2, md: 3 },
          py: 1,
          bgcolor: '#091725',
          borderBottom: `1px solid ${C.border}`,
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: <MemoryIcon />, label: 'ENGINE: GEMINI' },
          { icon: <StorageOutlinedIcon />, label: 'API: 4041' },
          { icon: <CodeIcon />, label: 'MODE: CHAT' },
        ].map((item) => (
          <Stack
            key={item.label}
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{ color: C.muted }}
          >
            {React.cloneElement(item.icon, {
              sx: { fontSize: 13, color: C.cyan },
            })}

            <Typography
              sx={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 0.5,
              }}
            >
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* ============= MESSAGE AREA ============= */}

      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: { xs: 1.5, md: 3 },
          py: 3,
          backgroundImage: `
            linear-gradient(rgba(40,100,120,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(40,100,120,0.045) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',

          '&::-webkit-scrollbar': {
            width: 7,
          },

          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#2B4A58',
            borderRadius: 4,
          },
        }}
      >
        {/* ============= DATASET SELECTOR ============= */}
        <Box sx={{ maxWidth: 1050, mx: 'auto', mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.primary, fontWeight: 700 }}>
              {'> '}DATA MODULES / CLICK TO LOAD
            </Typography>
            <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
              {datasets.length} ACTIVE
            </Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(5,1fr)' }, gap: 1.2 }}>
            {MODULES.map(mod => {
              const loaded = datasets.find(d => d.module === mod.id);
              return (
                <Paper key={mod.id} elevation={0} sx={{ bgcolor: C.panel, border: `1px solid ${loaded ? C.primary : C.border}`, borderRadius: 2, p: 1.4, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ color: loaded ? C.primary : C.cyan }}>{mod.icon}</Box>
                    {loaded && <Tooltip title="Descartar JSON de esta sesión"><span><IconButton disabled={loading || loadingData} size="small" onClick={() => unloadModule(mod.id)} sx={{ color: C.error, p: 0.3 }}><CloseRoundedIcon sx={{ fontSize: 16 }}/></IconButton></span></Tooltip>}
                  </Stack>
                  <Typography sx={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{mod.title}</Typography>
                  <Typography sx={{ color: C.muted, fontSize: 10, mt: .5 }}>{loaded ? `${loaded.count} registros` : mod.detail}</Typography>
                  <Button fullWidth disabled={loadingData || loading} size="small" onClick={() => { setDataError(''); setSelectedModule(mod.id); }} startIcon={loaded ? <RefreshRoundedIcon/> : <CloudDownloadOutlinedIcon/>}
                    sx={{ mt: 1, color: C.primary, border: `1px solid ${C.border}`, fontFamily: mono, fontSize: 10, '&:hover': { borderColor: C.primary } }}>
                    {loaded ? 'RECARGAR' : 'CARGAR'}
                  </Button>
                </Paper>
              );
            })}
          </Box>
          {datasets.length > 0 && (
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 1.5 }}>
              {datasets.map(d => (
                <Chip key={d.module} size="small" label={`${d.title || d.module}: ${d.count} · ${d.from} → ${d.to}`}
                  sx={{ bgcolor: '#10332F', border: '1px solid #285649', color: C.primary, fontSize: 10 }} />
              ))}
            </Stack>
          )}
          {dataError && (
            <Typography sx={{ mt: 1, color: C.error, fontSize: 12 }}>
              ⚠ {dataError}
            </Typography>
          )}
        </Box>

        {/* ============= EMPTY STATE ============= */}
        {messages.length === 0 && !loading && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <SmartToyOutlinedIcon sx={{ color: C.primary, fontSize: 48, mb: 1 }} />
            <Typography sx={{ color: C.text, fontFamily: mono, fontSize: { xs: 18, md: 23 }, fontWeight: 800 }}>
              SYSTEM <Box component="span" sx={{ color: C.primary }}>INITIALIZED_</Box>
            </Typography>
            <Typography sx={{ color: C.muted, mt: 1, fontSize: 12 }}>
              Carga uno o más módulos arriba y pregunta sobre sus datos. También puedes hacer consultas generales de ingeniería.
            </Typography>
          </Box>
        )}

        {/* ============= MESSAGES ============= */}

        <Stack spacing={2.5}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isUser
                    ? 'flex-end'
                    : 'flex-start',
                  gap: 1.5,
                  width: '100%',
                }}
              >
                {!isUser && (
                  <Avatar
                    sx={{
                      width: 35,
                      height: 35,
                      bgcolor: msg.isError
                        ? 'rgba(255,116,133,0.10)'
                        : 'rgba(77,255,209,0.09)',
                      color: msg.isError ? C.error : C.primary,
                      border: `1px solid ${
                        msg.isError
                          ? 'rgba(255,116,133,0.24)'
                          : 'rgba(77,255,209,0.22)'
                      }`,
                      flexShrink: 0,
                    }}
                  >
                    {msg.isError ? (
                      <ErrorOutlineIcon fontSize="small" />
                    ) : (
                      <SmartToyOutlinedIcon fontSize="small" />
                    )}
                  </Avatar>
                )}

                <Box
                  sx={{
                    minWidth: 0,
                    maxWidth: isUser
                      ? { xs: '86%', md: '76%' }
                      : { xs: '87%', md: '82%' },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent={
                      isUser ? 'flex-end' : 'flex-start'
                    }
                    sx={{ mb: 0.7, px: 0.3 }}
                  >
                    <Typography
                      sx={{
                        color: isUser ? C.cyan : C.primary,
                        fontFamily: mono,
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 0.7,
                      }}
                    >
                      {isUser ? 'USER@COCLI' : 'COCLI_AI'}
                    </Typography>

                    <AccessTimeIcon
                      sx={{ fontSize: 11, color: C.mutedDark }}
                    />

                    <Typography
                      sx={{
                        color: C.mutedDark,
                        fontSize: 10,
                        fontFamily: mono,
                      }}
                    >
                      {formatTime(msg.time)}
                    </Typography>
                  </Stack>

                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: isUser ? '#103044' : C.panel,
                      border: `1px solid ${
                        msg.isError
                          ? 'rgba(255,116,133,0.40)'
                          : isUser
                            ? '#215B72'
                            : C.border
                      }`,
                      borderLeft: !isUser
                        ? `3px solid ${
                            msg.isError ? C.error : C.primary
                          }`
                        : undefined,
                      borderRadius: 2,
                      p: { xs: 1.6, md: 2 },
                      boxShadow: '0 5px 18px rgba(0,0,0,0.10)',
                      overflow: 'hidden',
                    }}
                  >
                    {isUser ? (
                      <Typography
                        sx={{
                          color: C.text,
                          fontSize: 13.5,
                          lineHeight: 1.8,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {msg.text}
                      </Typography>
                    ) : msg.isError ? (
                      <Typography
                        sx={{
                          color: C.error,
                          fontSize: 13,
                          lineHeight: 1.7,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {msg.text}
                      </Typography>
                    ) : (
                      <Box sx={markdownStyles}>
                        <ReactMarkdown>
                          {msg.text || ''}
                        </ReactMarkdown>
                      </Box>
                    )}

                    {!isUser && !msg.isError && (
                      <>
                        <Divider
                          sx={{
                            borderColor: C.border,
                            mt: 2,
                            mb: 0.8,
                          }}
                        />

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.8}
                          >
                            <AutoAwesomeIcon
                              sx={{
                                fontSize: 13,
                                color: C.primary,
                              }}
                            />

                            <Typography
                              sx={{
                                color: C.mutedDark,
                                fontFamily: mono,
                                fontSize: 10,
                              }}
                            >
                              AI RESPONSE
                            </Typography>
                          </Stack>

                          <Tooltip
                            title={
                              copiedId === msg.id
                                ? 'Copiado'
                                : 'Copiar respuesta'
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(msg)}
                              sx={{
                                color:
                                  copiedId === msg.id
                                    ? C.primary
                                    : C.muted,
                              }}
                            >
                              {copiedId === msg.id ? (
                                <CheckRoundedIcon
                                  sx={{ fontSize: 16 }}
                                />
                              ) : (
                                <ContentCopyOutlinedIcon
                                  sx={{ fontSize: 16 }}
                                />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </>
                    )}
                  </Paper>
                </Box>

                {isUser && (
                  <Avatar
                    sx={{
                      width: 35,
                      height: 35,
                      bgcolor: '#16425B',
                      color: C.cyan,
                      border: '1px solid #28617E',
                      flexShrink: 0,
                    }}
                  >
                    <PersonOutlineIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            );
          })}

          {/* ============= LOADING ============= */}

          {loading && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 35,
                  height: 35,
                  bgcolor: 'rgba(77,255,209,0.09)',
                  color: C.primary,
                  border: '1px solid rgba(77,255,209,0.22)',
                }}
              >
                <SmartToyOutlinedIcon fontSize="small" />
              </Avatar>

              <Box
                sx={{
                  bgcolor: C.panel,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.primary}`,
                  borderRadius: 2,
                  px: 2,
                  py: 1.6,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <CircularProgress
                    size={15}
                    thickness={5}
                    sx={{ color: C.primary }}
                  />

                  <Typography
                    sx={{
                      color: C.primary,
                      fontFamily: mono,
                      fontSize: 12,
                    }}
                  >
                    PROCESSING REQUEST_
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    color: C.muted,
                    fontSize: 11,
                    mt: 1,
                  }}
                >
                  Esperando respuesta de Gemini...
                </Typography>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {/* ============= INPUT TERMINAL ============= */}

      <Box
        sx={{
          p: { xs: 1.5, md: 2.5 },
          bgcolor: C.panel,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1.2 }}
        >
          <TerminalIcon
            sx={{ color: C.primary, fontSize: 16 }}
          />

          <Typography
            sx={{
              color: C.primary,
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            USER@COCLI:~$
          </Typography>

          <Typography
            sx={{
              color: C.mutedDark,
              fontFamily: mono,
              fontSize: 10,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            ENTER COMMAND
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="flex-end" spacing={1.3}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={isMobile ? 4 : 6}
            placeholder="Escribe tu consulta de ingeniería..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            variant="outlined"
            size="small"
            sx={inputStyles}
            slotProps={{
              htmlInput: {
                'aria-label': 'Consulta de ingeniería',
              },
            }}
          />

          <Button
            variant="contained"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            endIcon={!isMobile ? <SendRoundedIcon /> : null}
            sx={{
              minWidth: isMobile ? 48 : 125,
              height: 42,
              px: isMobile ? 1.5 : 2.5,
              bgcolor: C.primary,
              color: '#041C22',
              fontFamily: mono,
              fontWeight: 800,
              fontSize: 12,
              borderRadius: 2,
              boxShadow: '0 0 16px rgba(77,255,209,0.10)',

              '&:hover': {
                bgcolor: '#8AFFE2',
                boxShadow: '0 0 22px rgba(77,255,209,0.22)',
              },

              '&.Mui-disabled': {
                bgcolor: '#23434A',
                color: '#729E9E',
              },
            }}
          >
            {isMobile ? <SendRoundedIcon /> : 'EXECUTE'}
          </Button>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1.2, gap: 1 }}
        >
          <Typography
            sx={{
              fontFamily: mono,
              fontSize: 10,
              color: C.mutedDark,
            }}
          >
            ENTER: enviar | SHIFT + ENTER: nueva línea
          </Typography>

          <Typography
            sx={{
              fontFamily: mono,
              fontSize: 10,
              color: C.mutedDark,
              whiteSpace: 'nowrap',
            }}
          >
            MSG: {messages.length}
          </Typography>
        </Stack>
      </Box>

      <Dialog open={!!selectedModule} onClose={() => !loadingData && setSelectedModule(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: C.panel, color: C.text, border: `1px solid ${C.border}` } }}>
        <DialogTitle sx={{ fontFamily: mono, color: C.primary, fontWeight: 700 }}>
          LOAD DATA / {MODULES.find(m => m.id === selectedModule)?.title?.toUpperCase()}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: C.muted, fontSize: 12, mb: 2 }}>
            Se consultará el endpoint existente. El JSON se guardará por 24 horas en MongoDB y estará disponible para esta sesión del chat.
          </Typography>
          <Stack spacing={2}>
            <TextField type="date" label="Fecha inicial" value={dateFrom} onChange={e => setDateFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }}
              sx={{ input: { color: C.text }, label: { color: C.muted } }} />
            {selectedModule !== 'scada' && (
              <TextField type="date" label="Fecha final" value={dateTo} onChange={e => setDateTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }}
                sx={{ input: { color: C.text }, label: { color: C.muted } }} />
            )}
            {dataError && <Typography sx={{ color: C.error, fontSize: 12 }}>{dataError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedModule(null)} disabled={loadingData} sx={{ color: C.muted }}>CANCELAR</Button>
          <Button onClick={loadModule} disabled={loadingData || !dateFrom || (selectedModule !== 'scada' && (!dateTo || dateFrom > dateTo))} variant="contained"
            sx={{ bgcolor: C.primary, color: '#041C22', fontWeight: 800, '&:hover': { bgcolor: '#88FFE0' } }}>
            {loadingData ? 'CARGANDO...' : 'CARGAR JSON'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
