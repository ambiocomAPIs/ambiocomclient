import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { DEFAULT_STATUS_ORDER, getStatusLabel, sortStatuses } from "./Data/trafficStatusConfig.js";

/* =========================================================
   =============== CONFIGURACIÓN GENERAL ===================
   ========================================================= */

const API_BASE_URL = "https://ambiocomserver.onrender.com/api/system/traffic";
const API_GET_LOGS_URL = API_BASE_URL; // GET -> consultar logs
const API_SAVE_LOG_URL = API_BASE_URL; // POST -> guardar un log
const API_SYNC_LOGS_URL = `${API_BASE_URL}/sync`; // POST -> guardar varios logs pendientes

const LOCAL_QUEUE_KEY = "pending_traffic_logs";
const APP_TIMEZONE = "America/Bogota";

/* =========================================================
   =============== UTILIDADES DE CACHÉ LOCAL ===============
   =========================================================
   Aquí guardamos temporalmente los logs cuando:
   - no hay internet
   - falla el envío al backend
   - queremos asegurar trazabilidad de errores
   ========================================================= */

const getPendingTrafficLogs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error leyendo caché de tráfico:", error);
    return [];
  }
};

const savePendingTrafficLogs = (logs) => {
  try {
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error guardando caché de tráfico:", error);
  }
};

const addPendingTrafficLog = (log) => {
  const current = getPendingTrafficLogs();

  current.push({
    ...log,
    _offlineId:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    queuedAt: new Date().toISOString(),
    synced: false,
  });

  savePendingTrafficLogs(current);
};

const clearPendingTrafficLogs = () => {
  try {
    localStorage.removeItem(LOCAL_QUEUE_KEY);
  } catch (error) {
    console.error("Error limpiando caché de tráfico:", error);
  }
};

/* =========================================================
   =============== CONSTRUCTOR DE LOG ======================
   =========================================================
   Crea el objeto estándar que enviarás al backend o dejarás
   en caché local cuando no se pueda enviar.
   ========================================================= */

const buildTrafficLog = ({
  url,
  method,
  path,
  moduleName,
  statusCode,
  email,
  rol,
  ip,
  errorMessage,
  extra,
}) => {
  return {
    url: url || "",
    path: path || url || "sin-ruta",
    method: method || "GET",
    moduleName: moduleName || "general",
    statusCode: statusCode ?? 0,
    email: email || "anonimo",
    rol: rol || "anonimo",
    ip: ip || "desconocida",
    requestedAt: new Date().toISOString(),
    timezone: APP_TIMEZONE,
    errorMessage: errorMessage || "",
    extra: extra || null,
  };
};

/* =========================================================
   =============== ENVÍO INMEDIATO DE LOG ==================
   =========================================================
   Intenta guardar el log en backend.
   Si el backend falla o no hay conexión, lo deja en caché.
   ========================================================= */

const sendImmediateLog = async (log) => {
  try {
    const response = await fetch(API_SAVE_LOG_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(log),
    });

    if (!response.ok) {
      addPendingTrafficLog(log);
      return false;
    }

    return true;
  } catch (error) {
    addPendingTrafficLog(log);
    return false;
  }
};

/* =========================================================
   =============== SINCRONIZACIÓN DE PENDIENTES ============
   =========================================================
   Cuando regresa internet, esta función toma todos los logs
   guardados en localStorage, los envía al backend y luego
   limpia la cola si todo salió bien.
   ========================================================= */

const syncPendingTrafficLogs = async () => {
  const pending = getPendingTrafficLogs();

  if (!pending.length) {
    return { ok: true, synced: 0 };
  }

  try {
    const response = await fetch(API_SYNC_LOGS_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logs: pending }),
    });

    if (!response.ok) {
      throw new Error("No se pudieron sincronizar los logs pendientes");
    }

    clearPendingTrafficLogs();

    return {
      ok: true,
      synced: pending.length,
    };
  } catch (error) {
    return {
      ok: false,
      synced: 0,
      error: error.message || "Error sincronizando pendientes",
    };
  }
};

/* =========================================================
   =============== WRAPPER GLOBAL DE FETCH =================
   =========================================================
   Usa esta función en TODAS las peticiones importantes
   de tu aplicación para registrar:
   - respuestas 4xx
   - respuestas 5xx
   - fallos de red / sin internet
   =========================================================
*/

export const fetchWithTrafficLog = async (url, options = {}, metadata = {}) => {
  const method = options.method || "GET";

  try {
    const response = await fetch(url, options);

    // =====================================================
    // REGISTRO DE RESPUESTAS CON ERROR HTTP (4xx / 5xx)
    // =====================================================
    if (response.status >= 400) {
      const errorLog = buildTrafficLog({
        url,
        method,
        path: metadata.path || url,
        moduleName: metadata.moduleName,
        email: metadata.email,
        rol: metadata.rol,
        ip: metadata.ip,
        statusCode: response.status,
        errorMessage: `HTTP_${response.status}`,
        extra: metadata.extra,
      });

      await sendImmediateLog(errorLog);
    }

    return response;
  } catch (error) {
    // =====================================================
    // REGISTRO DE FALLOS DE RED / SIN INTERNET / TIMEOUT
    // =====================================================
    const networkErrorLog = buildTrafficLog({
      url,
      method,
      path: metadata.path || url,
      moduleName: metadata.moduleName,
      email: metadata.email,
      rol: metadata.rol,
      ip: metadata.ip,
      statusCode: 0,
      errorMessage: error?.message || "NETWORK_ERROR",
      extra: metadata.extra,
    });

    addPendingTrafficLog(networkErrorLog);
    throw error;
  }
};

/* =========================================================
   =============== HOOK GLOBAL DE SINCRONIZACIÓN ===========
   =========================================================
   Este hook:
   - intenta sincronizar al iniciar la app
   - escucha cuando vuelve internet
   - sincroniza automáticamente la cola pendiente
   ========================================================= */

export const useTrafficSync = () => {
  useEffect(() => {
    const handleOnline = async () => {
      if (navigator.onLine) {
        await syncPendingTrafficLogs();
      }
    };

    // intento inicial
    handleOnline();

    // reintento cuando vuelve la conexión
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);
};

/* =========================================================
   =============== COMPONENTE PRINCIPAL VIEWER =============
   =========================================================
   Este visor:
   - consulta logs del backend
   - muestra cuántos logs hay pendientes en caché
   - permite refrescar
   - permite live mode
   - intenta sincronizar pendientes antes de consultar
   ========================================================= */

const TerminalTrafficLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [live, setLive] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState("");

  // =======================================================
  // ACTUALIZA CUÁNTOS LOGS HAY PENDIENTES EN CACHÉ
  // =======================================================
  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingTrafficLogs().length);
  }, []);

  // =======================================================
  // INTENTA SINCRONIZAR ANTES DE CONSULTAR EL HISTORIAL
  // =======================================================
  const trySyncPending = useCallback(async () => {
    if (!navigator.onLine) {
      setLastSyncMessage("sin conexión: logs pendientes conservados en caché");
      refreshPendingCount();
      return;
    }

    const currentPending = getPendingTrafficLogs();
    if (!currentPending.length) {
      setLastSyncMessage("");
      refreshPendingCount();
      return;
    }

    setSyncing(true);

    try {
      const result = await syncPendingTrafficLogs();

      if (result.ok) {
        setLastSyncMessage(`sincronizados ${result.synced} logs pendientes`);
      } else {
        setLastSyncMessage(result.error || "no se pudieron sincronizar los pendientes");
      }
    } finally {
      setSyncing(false);
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  // =======================================================
  // CONSULTA LOS LOGS DEL BACKEND
  // =======================================================
  const fetchLogs = useCallback(
    async (firstLoad = false) => {
      try {
        if (firstLoad) setLoading(true);
        setError("");

        // antes de consultar, intentamos subir pendientes
        await trySyncPending();

        const response = await fetch(API_GET_LOGS_URL, {
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
        refreshPendingCount();
        if (firstLoad) setLoading(false);
      }
    },
    [refreshPendingCount, trySyncPending]
  );

  // =======================================================
  // CARGA INICIAL
  // =======================================================
  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  // =======================================================
  // MODO LIVE
  // =======================================================
  useEffect(() => {
    if (!live) return;

    const interval = setInterval(() => {
      fetchLogs(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [live, fetchLogs]);

  // =======================================================
  // ACTUALIZA CONTADOR CUANDO VUELVE INTERNET
  // =======================================================
  useEffect(() => {
    const handleOnline = async () => {
      await trySyncPending();
      await fetchLogs(false);
    };

    const handleOffline = () => {
      refreshPendingCount();
      setLastSyncMessage("sin internet: se almacenarán logs pendientes");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchLogs, refreshPendingCount, trySyncPending]);

  // =======================================================
  // FILTRO + ORDENAMIENTO
  // =======================================================
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
        log.errorMessage,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(term))
    );
  }, [logs, filter]);

  // =======================================================
  // RESUMEN DINÁMICO DE STATUS
  // =======================================================
  const statusSummary = useMemo(() => {
    const counts = filteredLogs.reduce((acc, log) => {
      const key = String(log.statusCode ?? "N/A");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const merged = DEFAULT_STATUS_ORDER
      .filter((status) => counts[status] > 0)
      .map((status) => ({
        status,
        count: counts[status],
      }));

    const extraStatuses = Object.entries(counts)
      .filter(([status]) => !DEFAULT_STATUS_ORDER.includes(status))
      .map(([status, count]) => ({
        status,
        count,
      }));

    return sortStatuses([...merged, ...extraStatuses]).map((item) => ({
      ...item,
      percent: filteredLogs.length
        ? ((item.count / filteredLogs.length) * 100).toFixed(1)
        : "0.0",
      label: getStatusLabel(item.status),
    }));
  }, [filteredLogs]);

  // =======================================================
  // FORMATO DE FECHA
  // =======================================================
  const formatDate = (value) => {
    if (!value) return "--/--/---- --:--:--";
    return new Date(value).toLocaleString("es-CO", {
      timeZone: APP_TIMEZONE,
      hour12: false,
    });
  };

  // =======================================================
  // COLOR POR MÉTODO HTTP
  // =======================================================
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
      case "GET":
        return "#d7ffd9";
      default:
        return "#e0e0e0";
    }
  };

  // =======================================================
  // COLOR POR STATUS
  // =======================================================
  const getStatusColor = (status) => {
    const code = Number(status);

    if (code === 0) return "#ff4081"; // error de red / offline
    if (code >= 200 && code < 300) return "#00e676";
    if (code >= 300 && code < 400) return "#ffee58";
    if (code >= 400 && code < 500) return "#ff9100";
    if (code >= 500) return "#ff1744";

    return "#cfd8dc";
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "96vh",
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
        {/* ===================================================
            CABECERA TIPO TERMINAL
           =================================================== */}
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

        {/* ===================================================
            ZONA DE COMANDOS / FILTRO
           =================================================== */}
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
                placeholder="filtrar por método, ruta, módulo, status, rol, email o error..."
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

              <Button
                variant="outlined"
                size="small"
                onClick={trySyncPending}
                sx={terminalButtonSx}
              >
                sync-cache
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* ===================================================
            METADATOS DEL MONITOR
           =================================================== */}
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
          <Typography sx={metaTextSx}>endpoint: {API_GET_LOGS_URL}</Typography>
          <Typography sx={metaTextSx}>pendientes-cache: {pendingCount}</Typography>
          <Typography sx={metaTextSx}>sync: {syncing ? "en progreso..." : "idle"}</Typography>
          <Typography sx={metaTextSx}>orden: más reciente arriba</Typography>
          <Typography sx={metaTextSx}>timezone: {APP_TIMEZONE}</Typography>
          <Typography sx={metaTextSx}>
            red: {navigator.onLine ? "online" : "offline"}
          </Typography>
        </Box>

        {/* ===================================================
            MENSAJE DE ESTADO DE SINCRONIZACIÓN
           =================================================== */}
        {!!lastSyncMessage && (
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: "#09140f",
              borderBottom: "1px solid #102518",
              flexShrink: 0,
            }}
          >
            <Typography sx={{ ...metaTextSx, color: "#9dfdc2" }}>
              {lastSyncMessage}
            </Typography>
          </Box>
        )}

        {/* ===================================================
            CONTENIDO PRINCIPAL
           =================================================== */}
        <Box
          sx={{
            flex: 1,
            px: 2,
            py: 2,
            bgcolor: "#050807",
            backgroundImage:
              "radial-gradient(circle at top, rgba(0,255,128,0.03), transparent 30%)",
            minHeight: 0,
            display: "flex",
            gap: 2,
            overflow: "hidden",
          }}
        >
          {/* =========================
              COLUMNA IZQUIERDA LOGS
             ========================= */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              pr: 1,
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
                <Box key={log._id || log._offlineId || `${log.requestedAt}-${index}`} sx={{ py: 0.75 }}>
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
                    </Box>{" "}
                    {!!log.errorMessage && (
                      <Box component="span" sx={{ color: "#ffb74d" }}>
                        error={log.errorMessage}
                      </Box>
                    )}
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

          {/* =========================
              COLUMNA DERECHA STATUS
             ========================= */}
          <Box
            sx={{
              width: 300,
              flexShrink: 0,
              borderLeft: "1px solid #163222",
              pl: 2,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                mb: 1.5,
                pb: 1,
                borderBottom: "1px dashed rgba(60, 120, 80, 0.25)",
              }}
            >
              <Typography
                sx={{
                  color: "#00ff9c",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 0.5,
                  letterSpacing: 0.4,
                }}
              >
                status summary
              </Typography>

              <Typography
                sx={{
                  color: "#7fa88a",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                códigos detectados en la vista actual
              </Typography>
            </Box>

            <Box
              sx={{
                overflowY: "auto",
                pr: 0.5,
                minHeight: 0,
              }}
            >
              {statusSummary.length === 0 ? (
                <Typography
                  sx={{
                    color: "#88d498",
                    fontFamily: "inherit",
                    fontSize: 12,
                  }}
                >
                  sin status para mostrar
                </Typography>
              ) : (
                statusSummary.map((item) => (
                  <Box
                    key={item.status}
                    sx={{
                      mb: 1,
                      px: 1.2,
                      py: 1,
                      border: "1px solid rgba(38, 77, 51, 0.85)",
                      bgcolor: "rgba(8, 20, 14, 0.75)",
                      boxShadow: "inset 0 0 10px rgba(0,255,128,0.03)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: getStatusColor(item.status),
                          fontFamily: "inherit",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        status {item.status}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#d7ffd9",
                          fontFamily: "inherit",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {item.count}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        color: "#8fb99a",
                        fontFamily: "inherit",
                        fontSize: 13,
                        mt: 0.35,
                        textTransform: "lowercase",
                      }}
                    >
                      {item.label}
                    </Typography>

                    <Box
                      sx={{
                        mt: 0.9,
                        height: 6,
                        width: "100%",
                        bgcolor: "#0b1611",
                        border: "1px solid rgba(37, 71, 49, 0.6)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.max(Number(item.percent), 3)}%`,
                          bgcolor: getStatusColor(item.status),
                          boxShadow: `0 0 10px ${getStatusColor(item.status)}`,
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        color: "#7fa88a",
                        fontFamily: "inherit",
                        fontSize: 13,
                        mt: 0.45,
                      }}
                    >
                      {item.percent}% del total filtrado
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

/* =========================================================
   =============== ESTILOS AUXILIARES ======================
   ========================================================= */

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

/* =========================================================
   =============== CÓMO USAR ESTE ARCHIVO ==================
   =========================================================

   1) Para mostrar el monitor:
      <TerminalTrafficLogViewer />

   2) Para sincronizar automáticamente pendientes
      al arrancar tu app:
      
      function App() {
        useTrafficSync();

        return <TuAplicacion />;
      }

   3) Para registrar peticiones importantes de tu app,
      reemplaza fetch(...) por fetchWithTrafficLog(...)

      Ejemplo:

      const response = await fetchWithTrafficLog(
        "https://ambiocomserver.onrender.com/api/clientes",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        {
          moduleName: "clientes",
          email: user?.email,
          rol: user?.rol,
          path: "/api/clientes",
          extra: {
            descripcion: "crear cliente",
          },
        }
      );

   =========================================================
   NOTA IMPORTANTE:
   Este archivo resuelve la parte FRONTEND.
   Para que funcione completo, tu backend debe aceptar:

   - GET  /api/system/traffic
   - POST /api/system/traffic
   - POST /api/system/traffic/sync

   El endpoint /sync debería recibir:
   {
     logs: [...]
   }

   y guardar todos esos registros en base de datos.
   ========================================================= */