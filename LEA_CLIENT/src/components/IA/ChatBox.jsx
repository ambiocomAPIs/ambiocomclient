import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReactMarkdown from 'react-markdown';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('
https://ambiocomserver.onrender.com/api/gemini/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages([...newMessages, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { sender: 'bot', text: '❌ Error al obtener respuesta del servidor.' },
      ]);
    }

    setLoading(false);
  };

  return (
    <Box sx={{ height: '93vh', p: 3, display: 'flex', flexDirection: 'column', mt: 5 }}>
      <Typography variant="h4" gutterBottom align="center">
        🤖 Chat IA de Ingeniería
      </Typography>

      <Paper
        elevation={3}
        sx={{
          flexGrow: 1,
          p: 2,
          mb: 2,
          bgcolor: '#f9f9f9',
          overflowY: 'auto',
          borderRadius: 3,
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
        }}
      >
        <Stack spacing={3}>
          {messages.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <Avatar sx={{ bgcolor: msg.sender === 'user' ? '#1976d2' : 'grey.600' }}>
                {msg.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
              </Avatar>
              <Box
                sx={{
                  backgroundColor: msg.sender === 'user' ? '#1976d2' : '#ffffff',
                  color: msg.sender === 'user' ? '#fff' : '#333',
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  maxWidth: '75%',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  boxShadow:
                    msg.sender === 'user'
                      ? '0 2px 4px rgba(25, 118, 210, 0.3)'
                      : '0 2px 4px rgba(0, 0, 0, 0.08)',
                  border: msg.sender === 'bot' ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <Typography variant="h5" fontWeight="bold" gutterBottom {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mt: 1, mb: 1 }}
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, mb: 0.5, lineHeight: 1.6 }}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul style={{ marginLeft: '1.2rem', marginBottom: '0.8rem' }} {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li style={{ marginBottom: '0.4rem' }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong style={{ color: '#1976d2' }} {...props} />
                    ),
                    em: ({ node, ...props }) => (
                      <em style={{ fontStyle: 'italic', color: '#555' }} {...props} />
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'grey.500' }}>
                <SmartToyIcon />
              </Avatar>
              <Box
                sx={{
                  backgroundColor: '#e0e0e0',
                  color: '#000',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontStyle: 'italic',
                }}
              >
                ✍️ Respondiendo...
              </Box>
              <CircularProgress size={16} sx={{ ml: 1 }} />
            </Box>
          )}
        </Stack>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          label="Haz una pregunta de ingeniería..."
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          sx={{ px: 4 }}
          disabled={loading}
        >
          Enviar
        </Button>
      </Box>
    </Box>
  );
}
