// components/Tanques/TanquesTK801AB.js
import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

import RenderizarGraficoDiarioPorTanque from "../../../utils/modals/RenderizarGraficoDiarioPorTanque";

const tanques = [
  {
    NombreTanque: "TK801A",
    nivel: 70,
    imagen: "/TanquesAlmacenamiento/tanque2.png",
    ancho: 630,
  },
  {
    NombreTanque: "TK801B",
    nivel: 40,
    imagen: "/TanquesAlmacenamiento/tanque2.png",
    ancho: 630,
  },
];

const contenedorAltura = 460;

const TanquesTK801AB = ({ tanquesContext, NivelesTanquesContext }) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  //guardaremos el último registro en la DB de cada tanque
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);

  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      const ordenExacto = ["801A", "801B"];
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
      gap="160px"
      justifyContent="center"
      alignItems="flex-end"
      mt={26}
    >
      {tanques.map(
        (
          { NombreTanque, ancho = 630, Disposicion, Factor, VolumenTotal },
          index
        ) => {
          // buscar el nivel correspondiente a este tanque
          const nivelTanqueObj = tanquesNivelesFiltered.find(
            (t) => t.NombreTanque === NombreTanque
          );
          return (
            <Box
              key={NombreTanque}
              onDoubleClick={() => handleDobleClickTanque(NombreTanque)}
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
                    height: `${
                      ((nivelTanqueObj.NivelTanque * Factor) / VolumenTotal) *
                      100
                    }%`,
                    width: "100%",
                    backgroundColor:
                      nivelTanqueObj.NivelTanque > Number(VolumenTotal) / 2
                        ? "blue"
                        : "orange",
                    transition: "height 0.5s ease",
                  }}
                />
              </Box>

              <Typography variant="h6" style={{ marginBottom: "0px" }}>
                V Total: {VolumenTotal} L
              </Typography>
              <Typography variant="h6" style={{ marginBottom: "0px" }}>
                Factor: {Factor} L/m
              </Typography>

              <img
                src={"/TanquesAlmacenamiento/tanque2.png"}
                alt={`Tanque ${NombreTanque}`}
                style={{
                  width: `${ancho}px`,
                  height: "auto",
                  zIndex: 1,
                  position: "relative",
                }}
              />

              {/* ✅ Mostrar el nivel correspondiente a este tanque */}
              {nivelTanqueObj && (
                <>
                  <div style={{ marginTop: 8, zIndex: 3 }}>
                    {nivelTanqueObj.NivelTanque * Factor} L
                  </div>
                  <div style={{ marginTop: 5, zIndex: 3 }}>
                    {nivelTanqueObj.NivelTanque} m
                  </div>
                </>
              )}
              <input
                type="text"
                readOnly
                value={NombreTanque}
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
                value={Disposicion}
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
          );
        }
      )}

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
      />
    </Box>
  );
};

export default TanquesTK801AB;
