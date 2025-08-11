import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from "../../utils/modals/RenderizarGraficoDiarioPorTanque";

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
        top:
          index === 0
            ? "15%"
            : index === 1
            ? "5%"
            : index === 2
            ? "5%"
            : index === 3
            ? "-8%"
            : index === 4
            ? "-8%"
            : index === 5
            ? "36%"
            : index === 6
            ? "36%"
            : "51%",
        left:
          index === 0
            ? "27%"
            : index === 1
            ? "24%"
            : index === 2
            ? "24%"
            : index === 3
            ? "16%"
            : index === 4
            ? "16%"
            : index === 5
            ? "21%"
            : index === 6
            ? "21%"
            : "18%",
        transform: "translateX(-50%)",
        width:
          index === 0
            ? "6%"
            : index === 1
            ? "6%"
            : index === 2
            ? "6%"
            : index === 5
            ? "5%"
            : index === 6
            ? "5%"
            : index === 7
            ? "6%"
            : "16px",
        height:
          index === 0
            ? "65%"
            : index === 1
            ? "60%"
            : index === 2
            ? "60%"
            : index === 3
            ? "85%"
            : index === 4
            ? "85%"
            : index === 5
            ? "44%"
            : index === 6
            ? "44%"
            : "30%",
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
        top:
          index === 0
            ? "42%"
            : index === 1
            ? "10%"
            : index === 2
            ? "10%"
            : index === 3
            ? "5%"
            : index === 4
            ? "5%"
            : index === 5
            ? "68%"
            : index === 6
            ? "68%"
            : "74%",
        left: index === 0 ? "56%" : "52%",
        transform: "translate(-50%, -50%)",
        fontSize:
          index === 1
            ? "15px"
            : index === 2
            ? "15px"
            : index === 5
            ? "15px"
            : index === 6
            ? "15px"
            : index === 7
            ? "15px"
            : "23px",
        width: index === 7 ? "70px" : "100px",
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding:
          index === 5
            ? "2px"
            : index === 6
            ? "2px"
            : index === 7
            ? "2px"
            : "4px",
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
        top:
          index === 0
            ? "50%"
            : index === 1
            ? "15%"
            : index === 2
            ? "15%"
            : index === 3
            ? "13%"
            : index === 4
            ? "13%"
            : index === 5
            ? "74%"
            : index === 6
            ? "74%"
            : "79%",
        left: index === 0 ? "56%" : "52%",
        transform: "translate(-50%, -50%)",
        fontSize: "15px",
        width:
          index === 0
            ? "120px"
            : index === 1
            ? "100px"
            : index === 2
            ? "100px"
            : index === 7
            ? "70px"
            : "120px",
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

const Unidad400Component = () => {
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
    <Box display="flex" flexDirection="column" alignItems="center" mt={10}>
      {/* Título centrado arriba */}
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
        Unidad de Almacenamiento Tanques Diarios o Jornaleros
      </Typography>

      {/* Tanques alineados abajo */}
      <Box
        display="flex"
        gap="30px"
        justifyContent="center"
        alignItems="flex-end"
        mt={26}
      >
        <RenderTanque
          nombre="405"
          diposicion="FDE"
          nivel={70}
          imagen="/TanquesAlmacenamiento/tanqueFDE.png"
          ancho={250}
          factor={285071.42}
          index={0}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="401A"
          diposicion="Tafias"
          nivel={60}
          imagen="/TanquesAlmacenamiento/tanquejornalerotafias.png"
          ancho={210}
          factor={193000.5}
          index={1}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="401B"
          diposicion="Tafias"
          nivel={60}
          imagen="/TanquesAlmacenamiento/tanquejornalerotafias.png"
          ancho={210}
          factor={193000.5}
          index={2}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="402A"
          diposicion="Extra Neutro"
          nivel={60}
          imagen="/TanquesAlmacenamiento/tanque403best.png"
          ancho={280}
          factor={193000.5}
          index={3}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="402B"
          diposicion="Extra Neutro"
          nivel={60}
          imagen="/TanquesAlmacenamiento/tanque403best.png"
          ancho={280}
          factor={193000.5}
          index={4}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="403A"
          diposicion="A.Indsutrial"
          nivel={60}
          imagen="/TanquesAlmacenamiento/jornaleroindustrial.png"
          ancho={220}
          factor={193000.5}
          index={5}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="403B"
          diposicion="A. Indsutrial"
          nivel={60}
          imagen="/TanquesAlmacenamiento/jornaleroindustrial.png"
          ancho={220}
          factor={193000.5}
          index={6}
          onDoubleClick={handleDobleClickTanque}
        />
        <RenderTanque
          nombre="404"
          diposicion="Fusel"
          nivel={72}
          imagen="/TanquesAlmacenamiento/jornalerofusel.png"
          ancho={150}
          factor={193000.5}
          index={7}
          onDoubleClick={handleDobleClickTanque}
        />
      </Box>
      {/* Modal de gráfico */}
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
      />
    </Box>
  );
};

export default Unidad400Component;
