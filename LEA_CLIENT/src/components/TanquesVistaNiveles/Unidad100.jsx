import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";

import RenderizarGraficoDiarioPorTanque from "../../utils/modals/RenderizarGraficoDiarioPorTanque";

const UnidadCienAlmacenamiento = ({
  tanquesContext,
  NivelesTanquesContext,
}) => {
  const [modalOpenGraficaTanque, setModalOpenGraficaTanque] = useState(false);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState(null);
  const [tanques, setTanques] = useState([]);
  //guardaremos el último registro en la DB de cada tanque 102A / 102B
  const [tanquesNivelesFiltered, setTanquesNivelesFiltered] = useState([]);
  //Captura la fecha del ultimo registro
  const [ultimoRegistroGlobal, setUltimoRegistroGlobal] = useState(null);
  //Captura el factor para enviar al modal rendergrafica
  const [factorSeleccionado, setFactorSeleccionado] = useState(null);

  useEffect(() => {
    if (tanquesContext?.length > 0 && NivelesTanquesContext?.length > 0) {
      // 1. Filtrar solo los tanques que quieras (ej: 102A y 102B)
      const tanquesFiltrados = tanquesContext.filter(
        (tanque) =>
          tanque.NombreTanque === "102A" || tanque.NombreTanque === "102B"
      );
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
    nuevosTanques[index].Disposicion = nuevoNombre;
    setTanques(nuevosTanques);
  };

  const contenedorAltura = 460; // altura fija para alinear los tanques

  return (
    <div style={{ marginTop: 75, textAlign: "center" }}>
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
        Tanques de Almacenamiento 102 A/B
      </Typography>

      <div
        style={{
          display: "flex",
          gap: "200px",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: 220,
        }}
      >
        {tanques.map(({ NombreTanque, ancho=640, Disposicion, Factor, VolumenTotal },index) => {
            // buscar el nivel correspondiente a este tanque
            const nivelTanqueObj = tanquesNivelesFiltered.find(
              (t) => t.NombreTanque === NombreTanque
            );
            return (
              <div
                key={index}
                onDoubleClick={() => handleDobleClickTanque(NombreTanque)}
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
                    top: 5,
                    left: "11%",
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: "77%",
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
                </div>

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
                  value={Disposicion}
                  style={{
                    position: "absolute",
                    top: "17%",
                    left: "47%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "23px",
                    width: "200px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    cursor: "default",
                    zIndex: 4,
                  }}
                />
              </div>
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
      </div>
      <RenderizarGraficoDiarioPorTanque
        modalIsOpen={modalOpenGraficaTanque}
        onClose={() => setModalOpenGraficaTanque(false)}
        nombreTanque={tanqueSeleccionado}
        factorTanque={factorSeleccionado}
      />
    </div>
  );
};

export default UnidadCienAlmacenamiento;
