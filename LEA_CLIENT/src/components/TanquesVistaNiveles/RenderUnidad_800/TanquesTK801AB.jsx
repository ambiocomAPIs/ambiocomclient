// components/Tanques/TanquesTK801AB.js
import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from '../../../utils/modals/RenderizarGraficoDiarioPorTanque'

const tanques = [
  { nombre: "TK801A", nivel: 70, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 630 },
  { nombre: "TK801B", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 630 },
];

const contenedorAltura = 460;

const TanquesTK801AB = () => {

   const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
    const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
    const [tanques, setTanques] = useState([
      {
        nombre: "801A",
        diposicion: "Producto Terminado",
        nivel: 70,
        imagen: "/TanquesAlmacenamiento/tanque2.png",
        ancho: 630,
      },
      {
        nombre: "801B",
        diposicion: "Producto Terminado",
        nivel: 40,
        imagen: "/TanquesAlmacenamiento/tanque2.png",
        ancho: 630,
      }
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
    <Box display="flex" gap="180px" justifyContent="center" alignItems="flex-end" mt={30}>
      {tanques.map(({ nombre, nivel, imagen, ancho, diposicion },index) => (
        <Box 
           key={nombre}
           onDoubleClick={() => handleDobleClickTanque(nombre)}
           position="relative" 
           display="flex" 
           flexDirection="column" 
           alignItems="center" 
           height={contenedorAltura} 
           width={ancho} 
           justifyContent="flex-end"
           >
          <Box
            sx={{
              position: "absolute",
              top: 6,
              left: "10%",
              transform: "translateX(-50%)",
              width: "16px",
              height: "74%",
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

          <Typography variant="h6">F: 285071,42</Typography>

          <img src={imagen} alt={`Tanque ${nombre}`} style={{ width: `${ancho}px`, height: "auto", zIndex: 1, position: "relative" }} />
          <div style={{ marginTop: 8 }}>{nivel * 1000}L</div>
          <div style={{ marginTop: 5 }}>{nivel} cm</div>

          <input
            type="text"
            readOnly
            value={nombre}
            style={{
              position: "absolute",
              top: "8%",
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
          <input
            type="text"
            onChange={(e) => handleNombreChange(index, e.target.value)}
            value={diposicion}
            style={{
              position: "absolute",
              top: "18%",
              left: "47%",
              transform: "translate(-50%, -50%)",
              fontSize: "23px",
              width: "250px",
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
      ))}
       <RenderizarGraficoDiarioPorTanque
              modalIsOpen={modalOpenGraficaTanque}
              onClose={() => setModalOpenGraficaTanque(false)}
              nombreTanque={tanqueSeleccionado}
            />
    </Box>
  );
};

export default TanquesTK801AB;
