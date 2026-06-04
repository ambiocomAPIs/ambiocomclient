import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AllInclusiveRoundedIcon from "@mui/icons-material/AllInclusiveRounded";

export default function RiceStatsCards({ dashboardStats }) {
  const hasVeto = Number(dashboardStats.vetoGerencia) > 0;

  const cards = [
    {
      label: "Total ítems",
      value: dashboardStats.total,
      bg: "#f7f6f1",
    },
    {
      label: "En backlog",
      value: dashboardStats.backlog,
      bg: "#eef7f2",
    },
    {
      label: "En sprint",
      value: dashboardStats.enSprint,
      bg: "#eef4ff",
    },
    {
      label: "Completados",
      value: dashboardStats.completados,
      bg: "#f2f8ef",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(6, 1fr)",
        },
        gap: 2,
        mb: 2.5,
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.label}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: card.bg,
            height: "100%",
            minHeight: 128,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.05)",
            transition: "all 0.22s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 750,
              color: "text.secondary",
              fontSize: 14,
              lineHeight: 1.25,
            }}
          >
            {card.label}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 950,
              mt: 1,
              lineHeight: 1,
            }}
          >
            {card.value}
          </Typography>
        </Paper>
      ))}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          height: "100%",
          minHeight: 128,
          position: "relative",
          overflow: "hidden",
          bgcolor: hasVeto ? "#fff6f6" : "#f8f9fb",
          border: "1px solid",
          borderColor: hasVeto
            ? "rgba(211,47,47,0.26)"
            : "rgba(0,0,0,0.05)",
          boxShadow: hasVeto
            ? "0 10px 26px rgba(211,47,47,0.10)"
            : "none",
          transition: "all 0.22s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: hasVeto
              ? "0 14px 34px rgba(211,47,47,0.16)"
              : "0 10px 24px rgba(0,0,0,0.06)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            width: hasVeto ? 5 : 0,
            height: "100%",
            bgcolor: "#d32f2f",
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography
              sx={{
                fontWeight: 750,
                fontSize: 14,
                lineHeight: 1.25,
                color: hasVeto ? "#b71c1c" : "text.secondary",
              }}
            >
              Veto gerencial
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                mt: 1,
                lineHeight: 1,
                color: hasVeto ? "#b71c1c" : "text.primary",
              }}
            >
              {dashboardStats.vetoGerencia || 0}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: hasVeto ? "rgba(211,47,47,0.10)" : "#ffffff",
              color: hasVeto ? "#d32f2f" : "text.secondary",
              border: "1px solid",
              borderColor: hasVeto
                ? "rgba(211,47,47,0.22)"
                : "rgba(0,0,0,0.06)",
              animation: hasVeto
                ? "vetoIconPulse 1.5s infinite ease-in-out"
                : "none",
              "@keyframes vetoIconPulse": {
                "0%": {
                  transform: "scale(1)",
                  boxShadow: "0 0 0 0 rgba(211,47,47,0.22)",
                },
                "70%": {
                  transform: "scale(1.06)",
                  boxShadow: "0 0 0 9px rgba(211,47,47,0)",
                },
                "100%": {
                  transform: "scale(1)",
                  boxShadow: "0 0 0 0 rgba(211,47,47,0)",
                },
              },
            }}
          >
            {hasVeto ? (
              <WarningAmberRoundedIcon />
            ) : (
              <AllInclusiveRoundedIcon />
            )}
          </Box>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            mt: 0.8,
            color: hasVeto ? "#b71c1c" : "text.secondary",
            fontWeight: 700,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {hasVeto
            ? "Ítems bloqueados o condicionados por Gerencia."
            : "Sin bloqueos gerenciales activos."}
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: "#fff7e8",
          height: "100%",
          minHeight: 128,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.05)",
          transition: "all 0.22s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          },
        }}
      >
        <Typography
          sx={{
            fontWeight: 750,
            color: "text.secondary",
            fontSize: 14,
            lineHeight: 1.25,
          }}
        >
          Mayor RICE
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 950,
            mt: 1,
            lineHeight: 1,
          }}
        >
          {dashboardStats.mayorRice}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            mt: 0.8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {dashboardStats.mayorRiceTitulo}
        </Typography>
      </Paper>
    </Box>
  );
}