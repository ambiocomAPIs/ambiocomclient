import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from "../../../utils/modals/RenderizarGraficoDiarioPorTanque";

const contenedorAltura = 460;

// Componente base reutilizable
const RenderTanque = ({
  nombre,
  nivel,
  imagen,
  ancho,
  factor,
  diposicion,
  index,
  onDoubleClick,
}) => (
  <Box
    onDoubleClick={() => onDoubleClick(nombre)}
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
        top: index === 0 ? "-5%" : index === 1 ? "18%" : "-8%",
        left: index === 0 ? "20%" : index === 1 ? "10%" : "22%",
        transform: "translateX(-50%)",
        width: "16px",
        height: index === 0 ? "80%" : index === 1 ? "55%" : "62%",
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
    <Typography variant="h6">VT: {factor.toLocaleString()}</Typography>

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
        top: index === 0 ? "5%" : index === 1 ? "25%" : "0%",
        left: "50%",
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
    <input
      type="text"
      onChange={(e) => handleNombreChange(index, e.target.value)}
      value={diposicion}
      style={{
        position: "absolute",
        top: index === 0 ? "15%" : index === 1 ? "35%" : "10%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "23px",
        width: index === 0 ? "110px" : index === 1 ? "250px" : "120px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "2px",
        backgroundColor: "rgba(255, 255, 255, 0.99)",
        cursor: "default",
        zIndex: 4,
      }}
    />
  </Box>
);

const Tanques802_3 = () => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([
    {
      nombre: "TK805",
      diposicion: "Materia Prima",
      nivel: 70,
      imagen: "/TanquesAlmacenamiento/tanqueachatado.png",
      ancho: 400,
    },
    {
      nombre: "TK806",
      diposicion: "Materia Prima",
      nivel: 40,
      imagen: "/TanquesAlmacenamiento/tanqueachatado.png",
      ancho: 400,
    },
    {
      nombre: "TK807",
      diposicion: "Materia Prima",
      nivel: 40,
      imagen: "/TanquesAlmacenamiento/tanqueachatado.png",
      ancho: 400,
    },
    {
      nombre: "TK808",
      diposicion: "Materia Prima",
      nivel: 40,
      imagen: "/TanquesAlmacenamiento/tanqueachatado.png",
      ancho: 400,
    },
  ]);

  const handleDobleClickTanque = (nombreTanque) => {
    console.log("nombre tanque que llega:", nombreTanque);

    setTanqueSeleccionado(nombreTanque);
    setModalOpenGraficaTanque(true);
  };

  const handleNombreChange = (index, nuevoNombre) => {
    const nuevosTanques = [...tanques];
    nuevosTanques[index].diposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  return (
    <Box
      display="flex"
      gap="180px"
      justifyContent="center"
      alignItems="flex-end"
      mt={30}
    >
      <RenderTanque
        nombre="802"
        diposicion="FUSEL"
        nivel={70}
        imagen="/TanquesAlmacenamiento/tanque802.png"
        ancho={230}
        factor={285071.42}
        index={0}
        onDoubleClick={handleDobleClickTanque}
      />
      <RenderTanque
        nombre="804"
        diposicion="Alcohol Indsutrial"
        nivel={40}
        imagen="/TanquesAlmacenamiento/tanque804.png"
        ancho={700}
        factor={172031.1}
        index={1}
        onDoubleClick={handleDobleClickTanque}
      />
      <RenderTanque
        nombre="803"
        diposicion="Alcohol Indsutrial"
        nivel={60}
        imagen="/TanquesAlmacenamiento/tanque803.png"
        ancho={260}
        factor={193000.5}
        index={2}
        onDoubleClick={handleDobleClickTanque}
      />
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
      />
    </Box>
  );
};

export default Tanques802_3;
