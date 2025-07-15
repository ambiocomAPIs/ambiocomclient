import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import { Box, Button } from "@mui/material";

const tanques = [
  { nombre: "TK801A", nivel: 70, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK801B", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK805", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK806", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK807", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK808", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK802", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
  { nombre: "TK803", nivel: 40, imagen: "/TanquesAlmacenamiento/tanque2.png", ancho: 680 },
];

const UnidadOchoCientosAlmacenamiento = () => {
  const [tanqueActivo, setTanqueActivo] = useState("TK801AB");
  const contenedorAltura = 460;

  return (
    <Box sx={{ mt: 10, textAlign: "center", position: "relative", pb: 8 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: '#1A237E',
          letterSpacing: 0.5,
          textTransform: 'none',
        }}
      >
        Tanques de Almacenamiento 801 A/B
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: "150px",
          justifyContent: "center",
          alignItems: "flex-end",
          mt: 30,
        }}
      >
        {tanques.map(({ nombre, nivel, imagen, ancho }) => {
            
         let tanquesFiltrados = [];

         if(tanqueActivo==="TK801AB"){
          <Box
            key={nombre}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: contenedorAltura,
              width: ancho,
              justifyContent: "flex-end",
            }}
          >
            {/* Barra vertical */}
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

            <Typography variant="h6" sx={{ mb: "0px" }}>
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
         }else if(tanqueActivo==="TK801AB"){
          <Box
            key={nombre}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: contenedorAltura,
              width: ancho,
              justifyContent: "flex-end",
            }}
          >
            {/* Barra vertical */}
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

            <Typography variant="h6" sx={{ mb: "0px" }}>
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
         }else{
          <Box
            key={nombre}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: contenedorAltura,
              width: ancho,
              justifyContent: "flex-end",
            }}
          >
            {/* Barra vertical */}
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

            <Typography variant="h6" sx={{ mb: "0px" }}>
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
         }
        })}
      </Box>

      {/* Botones de navegación estilo Excel */}
      <Box sx={{ position: "absolute", top: 10, right: 20, display: "flex", gap: 1 }}>
        <Button variant={tanqueActivo === 'TK801AB' ? "contained" : "outlined"} onClick={() => setTanqueActivo("TK801A")}>
          TK801AB
        </Button>
        <Button variant={tanqueActivo === 'TK805-8' ? "contained" : "outlined"} onClick={() => setTanqueActivo("TK801B")}>
          TK805-8
        </Button>
        <Button variant={tanqueActivo === '802-3' ? "contained" : "outlined"} onClick={() => setTanqueActivo("Ambos")}>
          802-3
        </Button>
      </Box>
    </Box>
  );
};

export default UnidadOchoCientosAlmacenamiento;
