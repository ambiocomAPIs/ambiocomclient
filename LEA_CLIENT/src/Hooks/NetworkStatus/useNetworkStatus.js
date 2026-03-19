import { useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * Hook reutilizable para monitorear estado de red y/o disponibilidad de API
 *
 * @param {Object} options
 * @param {string|null} options.checkUrl URL a consultar para validar conectividad real
 * @param {number} options.interval intervalo en ms para verificar
 * @param {number} options.timeout timeout de la petición en ms
 * @param {boolean} options.checkBackend si true, valida también el backend
 */
export default function useNetworkStatus({
  checkUrl = null,
  interval = 30000, // 30 segundos
  timeout = 5000,
  checkBackend = false,
} = {}) {
  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const intervalRef = useRef(null);

  const checkConnection = async () => {
    const browserOnline = navigator.onLine;
    setIsBrowserOnline(browserOnline);

    if (!browserOnline) {
      setIsBackendReachable(false);
      return false;
    } 

    if (!checkBackend || !checkUrl) {
      setIsBackendReachable(true);
      return true;
    }

    setIsChecking(true);

    try {
      await axios.get(checkUrl, {
        timeout,
        // headers: {
        //   "Cache-Control": "no-cache",    // si envio estos headers, CORS bloquea la peticion
        //   Pragma: "no-cache",
        // },
      });

      setIsBackendReachable(true);
      return true;
    } catch (error) {
      setIsBackendReachable(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setIsBackendReachable(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkConnection();

    intervalRef.current = setInterval(() => {
      checkConnection();
    }, interval);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkUrl, interval, timeout, checkBackend]);

  const isConnected = checkBackend
    ? isBrowserOnline && isBackendReachable
    : isBrowserOnline;

  return {
    isConnected,
    isBrowserOnline,
    isBackendReachable,
    isChecking,
    recheckConnection: checkConnection,
  };
}