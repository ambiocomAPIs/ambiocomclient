import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
} from "@mui/material";

const API_URL = "https://ambiocomserver.onrender.com/api/system/traffic";

const TerminalTrafficLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [live, setLive] = useState(true);

  const fetchLogs = async (firstLoad = false) => {
    try {
      if (firstLoad) setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudieron obtener los registros");
      }

      const data = await response.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      setError(err.message || "Error cargando registros");
    } finally {
      if (firstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, []);

  useEffect(() => {
    if (!live) return;

    const interval = setInterval(() => {
      fetchLogs(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [live]);

  const filteredLogs = useMemo(() => {
    const term = filter.trim().toLowerCase();

    const normalized = [...logs].sort((a, b) => {
      const dateA = new Date(a.requestedAt || 0).getTime();
      const dateB = new Date(b.requestedAt || 0).getTime();
      return dateB - dateA; // más reciente arriba
    });

    if (!term) return normalized;

    return normalized.filter((log) =>
      [
        log.method,
        log.url,
        log.path,
        log.moduleName,
        log.statusCode,
        log.ip,
        log.rol,
        log.email,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(term))
    );
  }, [logs, filter]);

  const formatDate = (value) => {
    if (!value) return "--/--/---- --:--:--";
    return new Date(value).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      hour12: false,
    });
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "POST":
        return "#00e676";
      case "PUT":
        return "#ffd54f";
      case "PATCH":
        return "#40c4ff";
      case "DELETE":
        return "#ff5252";
      default:
        return "#e0e0e0";
    }
  };

  const getStatusColor = (status) => {
    const code = Number(status);
    if (code >= 200 && code < 300) return "#00e676";
    if (code >= 300 && code < 400) return "#ffee58";
    if (code >= 400 && code < 500) return "#ff9100";
    if (code >= 500) return "#ff1744";
    return "#cfd8dc";
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "#050807",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: "#050807",
          color: "#d7ffd9",
          borderRadius: 0,
          overflow: "hidden",
          border: "1px solid #15331f",
          fontFamily: "Consolas, Monaco, 'Courier New', monospace",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: "#0d1511",
            borderBottom: "1px solid #163222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ff5f56" }} />
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ffbd2e" }} />
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#27c93f" }} />
          </Stack>

          <Typography
            sx={{
              color: "#9ac7a1",
              fontSize: 13,
              textAlign: "center",
              flex: 1,
              fontFamily: "inherit",
            }}
          >
            ambiocom@server:~ /monitor/trafico
          </Typography>

          <Chip
            label={live ? "LIVE" : "PAUSADO"}
            size="small"
            sx={{
              color: live ? "#00ff9c" : "#ffd54f",
              bgcolor: "#0c1a12",
              border: "1px solid #1f5b38",
              fontFamily: "inherit",
            }}
          />
        </Box>

        <Box
          sx={{
            px: 2,
            py: 2,
            bgcolor: "#07100c",
            borderBottom: "1px solid #102518",
            flexShrink: 0,
          }}
        >
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography sx={{ color: "#00ff9c", fontFamily: "inherit", fontWeight: 700 }}>
                root@ambiocom
              </Typography>
              <Typography sx={{ color: "#d7ffd9", fontFamily: "inherit" }}>:</Typography>
              <Typography sx={{ color: "#62d2ff", fontFamily: "inherit" }}>~/traffic</Typography>
              <Typography sx={{ color: "#f5f5f5", fontFamily: "inherit" }}>$</Typography>

              <TextField
                variant="standard"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="filtrar por metodo, ruta, modulo, status, rol o email..."
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    color: "#d7ffd9",
                    fontFamily: "inherit",
                    fontSize: 14,
                  },
                }}
                sx={{
                  flex: 1,
                  minWidth: 260,
                  "& input::placeholder": {
                    color: "#7fa88a",
                    opacity: 1,
                  },
                }}
              />
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={() => fetchLogs(false)}
                sx={terminalButtonSx}
              >
                refresh
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setLive((prev) => !prev)}
                sx={terminalButtonSx}
              >
                {live ? "pause" : "resume"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: "#06100b",
            borderBottom: "1px solid #102518",
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Typography sx={metaTextSx}>logs: {filteredLogs.length}</Typography>
          <Typography sx={metaTextSx}>endpoint: {API_URL}</Typography>
          <Typography sx={metaTextSx}>orden: más reciente arriba</Typography>
          <Typography sx={metaTextSx}>timezone: America/Bogota</Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            py: 2,
            bgcolor: "#050807",
            backgroundImage:
              "radial-gradient(circle at top, rgba(0,255,128,0.03), transparent 30%)",
            minHeight: 0,
          }}
        >
          {loading ? (
            <Typography sx={bootTextSx}>iniciando monitor de tráfico...</Typography>
          ) : error ? (
            <Typography sx={{ ...bootTextSx, color: "#ff6b6b" }}>
              error: {error}
            </Typography>
          ) : filteredLogs.length === 0 ? (
            <>
              <Typography sx={bootTextSx}>monitor listo.</Typography>
              <Typography sx={bootTextSx}>sin registros para mostrar.</Typography>
            </>
          ) : (
            filteredLogs.map((log, index) => (
              <Box key={log._id || `${log.requestedAt}-${index}`} sx={{ py: 0.75 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "inherit",
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: "#d7ffd9",
                    wordBreak: "break-word",
                    borderBottom: "1px dashed rgba(60, 120, 80, 0.18)",
                    pb: 0.75,
                  }}
                >
                  <Box component="span" sx={{ color: "#7fa88a" }}>
                    [{formatDate(log.requestedAt)}]
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{
                      color: getMethodColor(log.method),
                      fontWeight: 700,
                    }}
                  >
                    {String(log.method || "N/A").padEnd(6, " ")}
                  </Box>{" "}
                  <Box component="span" sx={{ color: "#f4fff4" }}>
                    {log.path || log.url || "sin-ruta"}
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{
                      color: getStatusColor(log.statusCode),
                      fontWeight: 700,
                    }}
                  >
                    status={log.statusCode ?? "N/A"}
                  </Box>{" "}
                  <Box component="span" sx={{ color: "#9ccaa3" }}>
                    module={log.moduleName || "general"}
                  </Box>{" "}
                  <Box component="span" sx={{ color: "#9ccaa3" }}>
                    rol={log.rol || "anonimo"}
                  </Box>{" "}
                  <Box component="span" sx={{ color: "#9ccaa3" }}>
                    email={log.email || "anonimo"}
                  </Box>
                </Typography>
              </Box>
            ))
          )}

          <Divider sx={{ my: 1, borderColor: "rgba(60, 120, 80, 0.18)" }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ color: "#00ff9c", fontFamily: "inherit", fontWeight: 700 }}>
              root@ambiocom
            </Typography>
            <Typography sx={{ color: "#d7ffd9", fontFamily: "inherit" }}>:</Typography>
            <Typography sx={{ color: "#62d2ff", fontFamily: "inherit" }}>~/traffic</Typography>
            <Typography sx={{ color: "#f5f5f5", fontFamily: "inherit" }}>$</Typography>
            <Box
              sx={{
                width: 10,
                height: 18,
                bgcolor: "#00ff9c",
                ml: 0.5,
                boxShadow: "0 0 8px rgba(0,255,156,0.7)",
                animation: "blink 1s step-end infinite",
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const terminalButtonSx = {
  color: "#9dfdc2",
  borderColor: "#1c4b30",
  bgcolor: "#0d1b14",
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
  textTransform: "lowercase",
  "&:hover": {
    borderColor: "#2c6b46",
    bgcolor: "#112219",
  },
};

const metaTextSx = {
  color: "#82b98d",
  fontSize: 12,
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
};

const bootTextSx = {
  color: "#88d498",
  mb: 0.75,
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
};

export default TerminalTrafficLogViewer;