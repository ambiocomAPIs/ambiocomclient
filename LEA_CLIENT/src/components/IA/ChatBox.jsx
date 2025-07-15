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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);

    try {
      const res = await fetch(`https://ambiocomserver.onrender.com/api/prompt?subject=${encodeURIComponent(input)}`);
      const data = await res.json();

      setMessages([...newMessages, { sender: 'bot', text: data.prompt }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'bot', text: 'Error al obtener respuesta del servidor.' }]);
    }

    setInput('');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 10, p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        🤖 Chat IA de Ingeniería
      </Typography>

      <Paper elevation={3} sx={{ p: 2, height: 500, mb: 2, bgcolor: '#fafafa', overflowY: 'auto' }}>
        <Stack spacing={2}>
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
              <Avatar sx={{ bgcolor: msg.sender === 'user' ? '#1976d2' : 'grey.500' }}>
                {msg.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
              </Avatar>
              <Box
                sx={{
                  backgroundColor: msg.sender === 'user' ? '#1976d2' : '#e0e0e0',
                  color: msg.sender === 'user' ? '#fff' : '#000',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: '75%',
                }}
              >
                {msg.text}
              </Box>
            </Box>
          ))}
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
        />
        <Button variant="contained" onClick={handleSend} sx={{ px: 4 }}>
          Enviar
        </Button>
      </Box>
    </Box>
  );
}
