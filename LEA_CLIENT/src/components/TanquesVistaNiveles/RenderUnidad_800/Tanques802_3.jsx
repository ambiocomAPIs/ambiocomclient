import React, { useState, useEffect } from "react";
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
  volumenTotal,
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
          height: `${((Number(nivel) * Number(factor)) / volumenTotal) * 100}%`,
          width: "100%",
          backgroundColor: nivel > 50 ? "blue" : "orange",
          transition: "height 0.5s ease",
        }}
      />
    </Box>

    {/* Factor volumétrico */}
    <Typography variant="h6">V Total: {volumenTotal}</Typography>
    <Typography variant="h6">Factor: {factor.toLocaleString()}</Typography>

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
    <div style={{ marginTop: 8 }}>{(nivel * factor).toLocaleString()} L</div>
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

const Tanques802_3 = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  //guardaremos el último registro en la DB de cada tanque
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);
  //Captura el factor para enviar al modal rendergrafica
  const [factorSeleccionado, setFactorSeleccionado] = useState(null);

  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      const ordenExacto = ["802", "803", "804"];
      const tanquesFiltrados = tanquesContext
        .filter((tanque) => ordenExacto.includes(tanque.NombreTanque)) // solo los de la lista
        .sort((a, b) => {
          return (
            ordenExacto.indexOf(a.NombreTanque) -
            ordenExacto.indexOf(b.NombreTanque)
          );
        });

      setTanques(tanquesFiltrados);

      // 2. Buscar en NivelesTanquesContext el último registro por cada tanque fijo
      const tanquesUltimos = tanquesFiltrados
        .map((tanque) => {
          const registrosPorTanque = NivelesTanquesContext.filter(
            (nivel) => nivel.NombreTanque === tanque.NombreTanque
          );

          if (registrosPorTanque.length === 0) return null;

          // 3. Seleccionar el último por FechaRegistro
          const ultimo = registrosPorTanque.reduce((prev, curr) => {
            const fechaPrev = new Date(prev.FechaRegistro);
            const fechaCurr = new Date(curr.FechaRegistro);
            return fechaCurr > fechaPrev ? curr : prev;
          });

          setUltimoRegistroGlobal(ultimo.FechaRegistro);

          return ultimo;
        })
        .filter(Boolean); // eliminar nulls

      // 4. Guardar en el estado los niveles filtrados
      setTanquesNivelesFiltered(tanquesUltimos);
    }
  }, [tanquesContext, NivelesTanquesContext]);
  
  const handleDobleClickTanque = (nombreTanque) => {
    const tanque = tanques.find((t) => t.NombreTanque === nombreTanque);
    // setTanqueSeleccionado(nombreTanque);
    // setModalOpenGraficaTanque(true);
    if (tanque) {
      setTanqueSeleccionado(nombreTanque);
      setFactorSeleccionado(tanque.Factor);
      setModalOpenGraficaTanque(true);
    }
  };

  const handleNombreChange = (index, nuevoNombre) => {
    const nuevosTanques = [...tanques];
    nuevosTanques[index].diposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  return (
    <Box
      display="flex"
      gap="170px"
      justifyContent="center"
      alignItems="flex-end"
      mt={26}
    >
      {tanques.length > 0 &&
        tanques.map((tanque, index) => (
          <RenderTanque
            key={tanque.NombreTanque}
            nombre={tanque.NombreTanque}
            diposicion={tanque.Disposicion}
            nivel={
              tanquesNivelesFiltered.find(
                (t) => t.NombreTanque === tanque.NombreTanque
              )?.NivelTanque ?? 0
            }
            imagen={
              tanque.NombreTanque === "802"
                ? "/TanquesAlmacenamiento/tanque802.png"
                : tanque.NombreTanque.includes("803")
                ? "/TanquesAlmacenamiento/tanque803.png"
                : tanque.NombreTanque.includes("804")
                ? "/TanquesAlmacenamiento/tanque800Fusel.png"
                : ""
            }
            ancho={
              tanque.NombreTanque === "802"
                ? 230
                : tanque.NombreTanque.includes("803")
                ? 700
                : tanque.NombreTanque.includes("804")
                ? 260
                : 150
            }
            factor={tanque.Factor}
            volumenTotal={tanque.VolumenTotal}
            index={index}
            onDoubleClick={handleDobleClickTanque}
          />
        ))}
      {/* footer ultima fecha registro */}
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          bottom: 15,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "1.1rem",
          fontWeight: 500,
        }}
      >
        <span style={{ fontWeight: "bold", color: "blue" }}>
          Último Registro:
        </span>{" "}
        {ultimoRegistroGlobal}
      </Typography>

      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
        factorTanque={factorSeleccionado}
      />
    </Box>
  );
};

export default Tanques802_3;
