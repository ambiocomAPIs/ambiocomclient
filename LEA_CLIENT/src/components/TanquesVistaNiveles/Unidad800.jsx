import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";

// Importación de los módulos individuales de tanques
import TanquesTK801AB from "./RenderUnidad_800/TanquesTK801AB";
import TanquesTK805_8 from "./RenderUnidad_800/TanquesTK805_8";
import Tanques802_3 from "./RenderUnidad_800/Tanques802_3"

const UnidadOchoCientosAlmacenamiento = () => {
  const [tanqueActivo, setTanqueActivo] = useState("TK801AB");

  const titulos = {
    "TK801AB": "Tanques de Almacenamiento de Producto Terminado 801 A/B",
    "TK805-8": "Tanques de Almacenamiento 805/806/807/808",
    "802-3": "Tanques de Almacenamiento de Alcohol Industrial 802-803",
  };
  
  return (
    <Box sx={{ mt: 10, textAlign: "center", position: "relative", pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1A237E' }}>
      {titulos[tanqueActivo]}
      </Typography>

      {/* Renderizado condicional del tanque activo */}
      {tanqueActivo === "TK801AB" && <TanquesTK801AB />}
      {tanqueActivo === "TK805-8" && <TanquesTK805_8 />}
      {tanqueActivo === "802-3" && <Tanques802_3 />}

      {/* Botones para cambiar entre tanques */}
      <Box sx={{ position: "absolute", top: 10, right: 20, display: "flex", gap: 1 }}>
        <Button
          variant={tanqueActivo === 'TK801AB' ? "contained" : "outlined"}
          onClick={() => setTanqueActivo("TK801AB")}
        >
          TK801AB
        </Button>
        <Button
          variant={tanqueActivo === 'TK805-8' ? "contained" : "outlined"}
          onClick={() => setTanqueActivo("TK805-8")}
        >
          TK805-8
        </Button>
        <Button
          variant={tanqueActivo === '802-3' ? "contained" : "outlined"}
          onClick={() => setTanqueActivo("802-3")}
        >
          802-3
        </Button>
      </Box>
    </Box>
  );
};

export default UnidadOchoCientosAlmacenamiento;
