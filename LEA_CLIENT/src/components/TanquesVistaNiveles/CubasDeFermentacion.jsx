import React, { useState } from "react";
import Typography from "@mui/material/Typography";

import RenderizarGraficoDiarioPorTanque from "../../utils/modals/RenderizarGraficoDiarioPorTanque";

const tanques = [
  {
    nombre: "TK300A",
    nivel: 70,
    imagen: "/TanquesAlmacenamiento/tanque5.png",
    ancho: 380,
  },
  {
    nombre: "TK300B",
    nivel: 40,
    imagen: "/TanquesAlmacenamiento/tanque5.png",
    ancho: 380,
  },
];

const CubaDeFermentacion = () => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([
    {
      nombre: "300A",
      diposicion: "Materia Prima",
      nivel: 70,
      imagen: "/TanquesAlmacenamiento/tanque5.png",
      ancho: 380,
    },
    {
      nombre: "300B",
      diposicion: "Materia Prima",
      nivel: 10,
      imagen: "/TanquesAlmacenamiento/tanque5.png",
      ancho: 380,
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

  const contenedorAltura = 460; // altura fija para alinear los tanques

  return (
    <div style={{ marginTop: 65, textAlign: "center" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: "#1A237E",
          letterSpacing: 0.5,
          textTransform: "none",
        }}
      >
        Cubas de Fermentacion
      </Typography>

      <div
        style={{
          display: "flex",
          gap: "280px",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: 280,
        }}
      >
        {tanques.map(({ nombre, nivel, imagen, ancho, diposicion }, index) => (
          <div
            key={index}
            onDoubleClick={() => handleDobleClickTanque(nombre)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: contenedorAltura,
              width: ancho,
              justifyContent: "flex-end",
            }}
          >
            {/* Barra vertical posicionada absolute encima */}
            <div
              style={{
                position: "absolute",
                top: "-18%",
                left: "15%",
                transform: "translateX(-50%)",
                width: "16px",
                height: "95%", // ocupará la altura completa del contenedor (mismo que la imagen)
                backgroundColor: "#ddd",
                borderRadius: "5px",
                border: "1px solid #ccc",
                display: "flex",
                flexDirection: "column-reverse",
                overflow: "hidden",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  height: `${nivel}%`,
                  width: "100%",
                  backgroundColor: nivel > 50 ? "blue" : "orange",
                  transition: "height 0.5s ease",
                }}
              />
            </div>
            <Typography variant="h6" style={{ marginBottom: "0px" }}>
              VT: 285071,42 L
            </Typography>
            <Typography variant="h6" style={{ marginBottom: "-50px" }}>
              F: 285071,42
            </Typography>
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

            <div style={{ marginTop: 8, zIndex: 3 }}>{nivel * 1000}L</div>
            <div style={{ marginTop: 5, zIndex: 3 }}>{nivel} cm</div>

            <input
              type="text"
              readOnly
              value={nombre}
              style={{
                position: "absolute",
                top: "-10%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "15px",
                width: "100px",
                textAlign: "center",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.8)", // con transparencia para no tapar todo
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
                top: "0%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "15px",
                width: "200px",
                textAlign: "center",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.8)", // con transparencia para no tapar todo
                cursor: "default",
                zIndex: 400,
              }}
            />
          </div>
        ))}
      </div>
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        // nombreTanque={tanqueSeleccionado}
        nombreTanque={"801B"}
      />
    </div>
  );
};

export default CubaDeFermentacion;
