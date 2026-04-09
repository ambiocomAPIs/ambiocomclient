import React from "react";
import { Box } from "@mui/material";

function EnterpriseLoadingScreen({
  size ,
  minHeight = "55vh",
  fullScreen = false,
  overlay = false,
}) {
  const innerSize = size * 0.58;

  return (
    <Box
      sx={{
        minHeight: fullScreen ? "100vh" : minHeight,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: overlay ? "absolute" : "relative",
        inset: overlay ? 0 : "auto",
        backdropFilter: overlay ? "blur(4px)" : "none",
        bgcolor: overlay ? "rgba(255,255,255,0.35)" : "transparent",
        zIndex: overlay ? 10 : "auto",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: "4px solid rgba(37,99,235,0.16)",
            borderTop: "5px solid #4876da",
            borderRight: "5px solid #4592f0",
            animation: "spinClockwise 1.1s linear infinite",
            "@keyframes spinClockwise": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: innerSize,
            height: innerSize,
            borderRadius: "50%",
            border: "3px solid rgba(15,23,42,0.12)",
            borderBottom: "4px solid #2c5bc9",
            borderLeft: "4px solid #38bdf8",
            animation: "spinCounterClockwise 0.9s linear infinite",
            "@keyframes spinCounterClockwise": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(-360deg)" },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default EnterpriseLoadingScreen;