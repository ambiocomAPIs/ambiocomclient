import React from "react";
import { Box, Typography } from "@mui/material";

const contenedorAltura = 460;

// Componente base reutilizable
const RenderTanque = ({ nombre, nivel, imagen, ancho, factor }) => (
  <Box
    position="relative"
    display="flex"
    flexDirection="column"
    alignItems="center"
    height={contenedorAltura}
    width={ancho}
    justifyContent="flex-end"
  >
    {/* Indicador vertical */}
    <Box
      sx={{
        position: "absolute",
        top: -10,
        left: "20%",
        transform: "translateX(-50%)",
        width: "16px",
        height: "80%",
        backgroundColor: "#ddd",
        borderRadius: "5px",
        border: "1px solid #ccc",
        display: "flex",
        flexDirection: "column-reverse",
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          height: `${nivel}%`,
          width: "100%",
          backgroundColor: nivel > 50 ? "blue" : "orange",
          transition: "height 0.5s ease",
        }}
      />
    </Box>

    {/* Factor volumétrico */}
    <Typography variant="h6">F: {factor.toLocaleString()}</Typography>

    {/* Imagen */}
    <img
      src={imagen}
      alt={`Tanque ${nombre}`}
      style={{
        width: `${ancho}px`,
        height: "auto",
        zIndex: 1,
        position: "relative",
      }}
    />

    {/* Litros y altura */}
    <div style={{ marginTop: 8 }}>{(nivel * 1000).toLocaleString()} L</div>
    <div style={{ marginTop: 5 }}>{nivel} cm</div>

    {/* Nombre del tanque */}
    <input
      type="text"
      readOnly
      value={nombre}
      style={{
        position: "absolute",
        top: "5%",
        left: "47%",
        transform: "translate(-50%, -50%)",
        fontSize: "23px",
        width: "100px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        cursor: "default",
        zIndex: 4,
      }}
    />
  </Box>
);

// Componentes individuales independientes

export const TanqueTK801 = () => (
  <RenderTanque
    nombre="TK801"
    nivel={70}
    imagen="/TanquesAlmacenamiento/tanquejornalerotafias.png"
    ancho={250}
    factor={285071.42}
  />
);

export const TanqueTK802 = () => (
  <RenderTanque
    nombre="TK802"
    nivel={40}
    imagen="/TanquesAlmacenamiento/tanque2.png"
    ancho={620}
    factor={172031.1}
  />
);

export const TanqueTK803 = () => (
  <RenderTanque
    nombre="TK803"
    nivel={60}
    imagen="/TanquesAlmacenamiento/tanque5.png"
    ancho={300}
    factor={193000.5}
  />
);

// Puedes importar y usar los tanques por separado o juntos donde los necesites

const Tanques802_3 = () => {
  return (
    <Box display="flex" gap="150px" justifyContent="center" alignItems="flex-end" mt={30}>
      <TanqueTK801 />
      <TanqueTK802 />
      <TanqueTK803 />
    </Box>
  );
};

export default Tanques802_3;
