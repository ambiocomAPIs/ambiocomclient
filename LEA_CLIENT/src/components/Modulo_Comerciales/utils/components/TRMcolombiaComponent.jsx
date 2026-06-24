import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const DEFAULT_COLORS = {
  brandBlue: "#1F1AE8",
  brandBlueDark: "#1812B8",
  brandBlueLight: "#E8E7FE",
  card: "#FFFFFF",
  secondary: "#5A6378",
  tertiary: "#9099AD",
  borderSoft: "#EEF0F6",
};

const fCOP = (n) =>
  n != null && !Number.isNaN(n)
    ? `$${Math.round(n).toLocaleString("es-CO")}`
    : "N/D";

function MiniCard({ label, value, colors }) {
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: "14px",
        bgcolor: colors.card,
        border: `1px solid ${colors.borderSoft}`,
        minHeight: 76,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          color: colors.tertiary,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          mb: 0.45,
        }}
      >
        {label}
      </Typography>

      <Typography sx={{ fontSize: 15, fontWeight: 950, color: "#0A0E27" }}>
        {value}
      </Typography>
    </Box>
  );
}

function useTrmColombia() {
  const [trm, setTrm] = useState({
    loading: true,
    error: "",
    valor: null,
    vigenciaDesde: "",
    vigenciaHasta: "",
    updatedAt: null,
  });

  const cargarTrm = async () => {
    setTrm((prev) => ({
      ...prev,
      loading: true,
      error: "",
    }));

    try {
      const url =
        "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde DESC";

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Error consultando TRM: ${res.status}`);
      }

      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : null;

      if (!row) {
        throw new Error("No se encontró información de TRM.");
      }

      const valorRaw = row.valor ?? row.Valor ?? row.VALOR;
      const valor = Number(String(valorRaw).replace(",", "."));

      if (!Number.isFinite(valor)) {
        throw new Error("La TRM recibida no es válida.");
      }

      setTrm({
        loading: false,
        error: "",
        valor,
        vigenciaDesde: row.vigenciadesde || row.vigencia_desde || "",
        vigenciaHasta: row.vigenciahasta || row.vigencia_hasta || "",
        updatedAt: Date.now(),
      });
    } catch (error) {
      setTrm({
        loading: false,
        error: error?.message || "No se pudo consultar la TRM.",
        valor: null,
        vigenciaDesde: "",
        vigenciaHasta: "",
        updatedAt: Date.now(),
      });
    }
  };

  useEffect(() => {
    cargarTrm();
  }, []);

  return {
    ...trm,
    cargarTrm,
  };
}

export default function TrmColombiaCard({
  colors = DEFAULT_COLORS,
  onUseTrm,
  showToast,
}) {
  const trmLive = useTrmColombia();

  const fechaDesde = trmLive.vigenciaDesde
    ? new Date(trmLive.vigenciaDesde).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/D";

  const fechaHasta = trmLive.vigenciaHasta
    ? new Date(trmLive.vigenciaHasta).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/D";

  const actualizado = trmLive.updatedAt
    ? new Date(trmLive.updatedAt).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const handleUseTrm = () => {
    if (!trmLive.valor) {
      showToast?.("No hay TRM disponible para aplicar", "error");
      return;
    }

    onUseTrm?.(trmLive.valor);
    showToast?.(`TRM aplicada: ${fCOP(trmLive.valor)}`);
  };

  return (
    <Box
      sx={{
        mt: "auto",
        pt: { xs: 1, xl: 2 },
      }}
    >
      <Box
        sx={{
          p: 1.8,
          borderRadius: "18px",
          border: `1px solid ${colors.borderSoft}`,
          background:
            "linear-gradient(135deg, rgba(31,26,232,.045) 0%, rgba(30,224,58,.06) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={1.5}
          sx={{ mb: 1.4 }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                color: colors.secondary,
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              TRM Colombia COP/USD
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: colors.tertiary,
                fontWeight: 700,
                mt: 0.25,
              }}
            >
              Consulta pública Datos Abiertos Colombia / Superfinanciera
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={trmLive.cargarTrm}
              disabled={trmLive.loading}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                color: colors.brandBlue,
                borderColor: "rgba(31,26,232,.22)",
                bgcolor: colors.card,
                "&:hover": {
                  bgcolor: colors.brandBlueLight,
                  borderColor: colors.brandBlue,
                },
              }}
            >
              Actualizar
            </Button>

            <Button
              size="small"
              variant="contained"
              onClick={handleUseTrm}
              disabled={!trmLive.valor}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: colors.brandBlue,
                "&:hover": {
                  bgcolor: colors.brandBlueDark,
                },
              }}
            >
              Usar TRM
            </Button>
          </Stack>
        </Stack>

        {trmLive.error ? (
          <Alert
            severity="warning"
            sx={{
              borderRadius: "14px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {trmLive.error}
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1.2fr repeat(3, minmax(0, .9fr))",
              },
              gap: 1.2,
            }}
          >
            <Box
              sx={{
                p: 1.55,
                borderRadius: "14px",
                bgcolor: colors.card,
                border: `1px solid ${colors.borderSoft}`,
                minHeight: 78,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  color: colors.tertiary,
                  fontWeight: 950,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  mb: 0.45,
                }}
              >
                TRM del día
              </Typography>

              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 950,
                  color: colors.brandBlue,
                  letterSpacing: "-.04em",
                }}
              >
                {trmLive.loading
                  ? "Consultando..."
                  : trmLive.valor
                    ? `$${trmLive.valor.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "N/D"}
              </Typography>
            </Box>

            <MiniCard label="Vigencia desde" value={fechaDesde} colors={colors} />
            <MiniCard label="Vigencia hasta" value={fechaHasta} colors={colors} />
            <MiniCard label="Actualizado" value={actualizado} colors={colors} />
          </Box>
        )}
      </Box>
    </Box>
  );
}